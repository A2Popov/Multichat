"""
Arena router for comparing multiple AI models side-by-side
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import asyncio
from app.database import get_db
from app.auth import get_current_active_user
from app.models.user import User, UsageLog, FileAttachment
from app.ai_providers import call_ai_model, calculate_cost, MODEL_CONFIGS, get_available_models


router = APIRouter()


class ArenaRequest(BaseModel):
    models: List[str]  # List of model IDs to compare
    prompt: str
    file_ids: Optional[List[int]] = None  # Optional file attachments


class ModelResponse(BaseModel):
    model: str
    model_name: str
    response: str
    input_tokens: int
    output_tokens: int
    cost: float
    error: str = None


class ArenaResponse(BaseModel):
    prompt: str
    responses: List[ModelResponse]
    total_cost: float


@router.get("/models")
async def get_arena_models(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available models for arena"""
    return get_available_models()


@router.post("/compare", response_model=ArenaResponse)
async def compare_models(
    request: ArenaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Send the same prompt to multiple models and compare responses (with optional file attachments)
    """
    if not request.models or len(request.models) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 models to compare")
    
    if len(request.models) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 models can be compared at once")
    
    # Validate all models exist
    available_models = {m["id"] for m in get_available_models()}
    for model_id in request.models:
        if model_id not in available_models:
            raise HTTPException(status_code=400, detail=f"Model {model_id} is not available")
    
    # Process file attachments if provided
    file_context = ""
    if request.file_ids:
        files = db.query(FileAttachment).filter(
            FileAttachment.id.in_(request.file_ids),
            FileAttachment.user_id == current_user.id
        ).all()
        
        for file in files:
            if file.extracted_text:
                file_context += f"\n\n[File: {file.filename}]\n{file.extracted_text}\n"
    
    # Build prompt with file context
    full_prompt = request.prompt
    if file_context:
        full_prompt += file_context
    
    # Prepare messages
    messages = [
        {"role": "user", "content": full_prompt}
    ]
    
    # Call all models in parallel
    async def call_model(model_id: str) -> ModelResponse:
        try:
            response_text, input_tokens, output_tokens = await call_ai_model(model_id, messages)
            cost = calculate_cost(model_id, input_tokens, output_tokens)
            
            return ModelResponse(
                model=model_id,
                model_name=MODEL_CONFIGS[model_id]["display_name"],
                response=response_text,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=cost
            )
        except Exception as e:
            return ModelResponse(
                model=model_id,
                model_name=MODEL_CONFIGS[model_id]["display_name"],
                response="",
                input_tokens=0,
                output_tokens=0,
                cost=0.0,
                error=str(e)
            )
    
    # Execute all calls concurrently
    responses = await asyncio.gather(*[call_model(model_id) for model_id in request.models])
    
    # Calculate total cost
    total_cost = sum(r.cost for r in responses if r.error is None)
    
    # Check if user has sufficient balance
    if current_user.balance < total_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient balance. Required: ${total_cost:.4f}, Available: ${current_user.balance:.2f}"
        )
    
    # Deduct balance and log usage
    current_user.balance -= total_cost
    
    for response in responses:
        if response.error is None:
            usage_log = UsageLog(
                user_id=current_user.id,
                model=response.model,
                input_tokens=response.input_tokens,
                output_tokens=response.output_tokens,
                cost=response.cost,
                session_type="arena"
            )
            db.add(usage_log)
    
    db.commit()
    
    return ArenaResponse(
        prompt=request.prompt,
        responses=responses,
        total_cost=total_cost
    )
