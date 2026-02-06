from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, ChatSession, Message, UsageLog
from app.schemas import MessageCreate, MessageResponse, ChatSessionResponse, ChatSessionCreate, ChatSessionUpdate
from app.auth import get_current_active_user
from app.ai_providers import call_ai_model, calculate_cost, get_available_models, MODEL_CONFIGS

router = APIRouter()


@router.get("/models")
async def list_available_models(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available AI models"""
    return {"models": get_available_models()}


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new chat session with specified model"""
    # Validate model exists
    if session_data.model not in MODEL_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model: {session_data.model}"
        )
    
    # Check if provider API key is configured
    provider = MODEL_CONFIGS[session_data.model]["provider"]
    api_key_available = False
    
    if provider == "openai":
        from app.config.settings import settings
        api_key_available = bool(settings.OPENAI_API_KEY)
    elif provider == "anthropic":
        from app.config.settings import settings
        api_key_available = bool(settings.ANTHROPIC_API_KEY)
    elif provider == "google":
        from app.config.settings import settings
        api_key_available = bool(settings.GOOGLE_API_KEY)
    elif provider == "deepseek":
        from app.config.settings import settings
        api_key_available = bool(settings.DEEPSEEK_API_KEY)
    elif provider == "qwen":
        from app.config.settings import settings
        api_key_available = bool(settings.QWEN_API_KEY)
    
    if not api_key_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider.title()} API key not configured"
        )
    
    session = ChatSession(
        user_id=current_user.id,
        model=session_data.model,
        title=session_data.title or f"{MODEL_CONFIGS[session_data.model]['display_name']} Chat"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all chat sessions for current user"""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all messages in a session"""
    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()
    
    return messages


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: int,
    message_data: MessageCreate,
    file_ids: Optional[str] = None,  # Comma-separated file IDs
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get AI response (with optional file attachments)"""
    from app.models.user import FileAttachment
    
    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check user balance
    if current_user.balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient balance"
        )
    
    # Process file attachments if provided
    attachments_data = []
    file_context = ""
    
    if file_ids:
        file_id_list = [int(fid.strip()) for fid in file_ids.split(',') if fid.strip()]
        files = db.query(FileAttachment).filter(
            FileAttachment.id.in_(file_id_list),
            FileAttachment.user_id == current_user.id
        ).all()
        
        for file in files:
            attachments_data.append({
                "id": file.id,
                "filename": file.filename,
                "content_type": file.content_type
            })
            
            if file.extracted_text:
                file_context += f"\n\n[File: {file.filename}]\n{file.extracted_text}\n"
    
    # Build final message content with file context
    full_content = message_data.content
    if file_context:
        full_content += file_context
    
    # Save user message
    user_message = Message(
        session_id=session_id,
        role="user",
        content=message_data.content,  # Original message without file content
        model=session.model,
        attachments=attachments_data if attachments_data else None
    )
    db.add(user_message)
    db.commit()
    
    # Get conversation history
    history = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()
    
    # Build messages for AI with file context included in last user message
    messages_for_ai = []
    for i, msg in enumerate(history):
        # For the last user message (just added), include file context
        if i == len(history) - 1 and msg.role == "user" and file_context:
            messages_for_ai.append({"role": msg.role, "content": full_content})
        else:
            messages_for_ai.append({"role": msg.role, "content": msg.content})
    
    try:
        # Call AI model through unified interface
        ai_content, input_tokens, output_tokens = await call_ai_model(
            session.model,
            messages_for_ai
        )
        
        total_tokens = input_tokens + output_tokens
        
        # Calculate cost with separate input/output pricing
        cost = calculate_cost(session.model, input_tokens, output_tokens)
        
        # Save AI response
        ai_message = Message(
            session_id=session_id,
            role="assistant",
            content=ai_content,
            model=session.model,
            tokens=total_tokens
        )
        db.add(ai_message)
        
        # Log usage
        usage_log = UsageLog(
            user_id=current_user.id,
            model=session.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            session_type="chat"
        )
        db.add(usage_log)
        
        # Update user balance
        current_user.balance -= cost
        
        db.commit()
        db.refresh(ai_message)
        
        return ai_message
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calling AI API: {str(e)}"
        )


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    session_id: int,
    session_data: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a chat session (rename)"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.title = session_data.title
    db.commit()
    db.refresh(session)
    
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a chat session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    db.delete(session)
    db.commit()
    
    return None
