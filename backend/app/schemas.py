from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    is_admin: Optional[bool] = False


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    balance: Optional[float] = None


class UserResponse(UserBase):
    id: int
    is_admin: bool
    balance: float
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    model: Optional[str]
    tokens: Optional[int]
    created_at: datetime
    attachments: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    model: str = "gpt-3.5-turbo"
    title: Optional[str] = None


class ChatSessionUpdate(BaseModel):
    title: str


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    model: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
