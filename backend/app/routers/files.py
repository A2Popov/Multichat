from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User, FileAttachment
from app.auth import get_current_active_user
from app.utils.file_handler import (
    validate_file, 
    save_uploaded_file, 
    extract_text_from_file,
    delete_file
)
from pathlib import Path

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file and extract text content"""
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file
    is_valid, error_msg = validate_file(file.filename, file.content_type, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Save file
    file_path = save_uploaded_file(current_user.id, file.filename, file_content)
    
    # Extract text
    extracted_text = extract_text_from_file(Path(file_path), file.content_type)
    
    # Save to database
    attachment = FileAttachment(
        user_id=current_user.id,
        filename=file.filename,
        content_type=file.content_type,
        file_size=file_size,
        file_path=str(file_path),
        extracted_text=extracted_text
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "filename": attachment.filename,
        "content_type": attachment.content_type,
        "file_size": attachment.file_size,
        "has_text": bool(extracted_text),
        "text_preview": extracted_text[:200] if extracted_text else None
    }


@router.get("/files")
async def list_user_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of user's uploaded files"""
    files = db.query(FileAttachment).filter(
        FileAttachment.user_id == current_user.id
    ).order_by(FileAttachment.created_at.desc()).all()
    
    return {
        "files": [
            {
                "id": f.id,
                "filename": f.filename,
                "content_type": f.content_type,
                "file_size": f.file_size,
                "has_text": bool(f.extracted_text),
                "created_at": f.created_at
            }
            for f in files
        ]
    }


@router.delete("/files/{file_id}")
async def delete_user_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete uploaded file"""
    file_attachment = db.query(FileAttachment).filter(
        FileAttachment.id == file_id,
        FileAttachment.user_id == current_user.id
    ).first()
    
    if not file_attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete from disk
    delete_file(file_attachment.file_path)
    
    # Delete from database
    db.delete(file_attachment)
    db.commit()
    
    return {"message": "File deleted successfully"}
