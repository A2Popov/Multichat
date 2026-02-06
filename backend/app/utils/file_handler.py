import os
import mimetypes
from pathlib import Path
from typing import Optional
import PyPDF2
import docx
from PIL import Image
import pytesseract

# Configure upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

ALLOWED_MIME_TYPES = {
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
    'application/msword',  # .doc
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
}

def validate_file(filename: str, content_type: str, file_size: int) -> tuple[bool, Optional[str]]:
    """Validate uploaded file"""
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
    
    if content_type not in ALLOWED_MIME_TYPES:
        return False, f"File type not allowed: {content_type}"
    
    return True, None


def extract_text_from_file(file_path: Path, content_type: str) -> Optional[str]:
    """Extract text content from various file types"""
    try:
        if content_type == 'text/plain' or content_type == 'text/csv':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        elif content_type == 'application/pdf':
            return extract_text_from_pdf(file_path)
        
        elif content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
            return extract_text_from_docx(file_path)
        
        elif content_type.startswith('image/'):
            return extract_text_from_image(file_path)
        
        return None
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return None


def extract_text_from_pdf(file_path: Path) -> str:
    """Extract text from PDF"""
    text = []
    with open(file_path, 'rb') as f:
        pdf_reader = PyPDF2.PdfReader(f)
        for page in pdf_reader.pages:
            text.append(page.extract_text())
    return '\n'.join(text)


def extract_text_from_docx(file_path: Path) -> str:
    """Extract text from DOCX"""
    doc = docx.Document(file_path)
    text = []
    for paragraph in doc.paragraphs:
        text.append(paragraph.text)
    return '\n'.join(text)


def extract_text_from_image(file_path: Path) -> Optional[str]:
    """Extract text from image using OCR (requires tesseract)"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang='rus+eng')
        return text
    except Exception as e:
        print(f"OCR failed: {e}")
        return "[Image content - OCR not available]"


def save_uploaded_file(user_id: int, filename: str, file_content: bytes) -> Path:
    """Save uploaded file to disk"""
    user_dir = UPLOAD_DIR / str(user_id)
    user_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    import uuid
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = user_dir / unique_filename
    
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    return file_path


def delete_file(file_path: str):
    """Delete file from disk"""
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
