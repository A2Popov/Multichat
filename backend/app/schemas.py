from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False


class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "gpt-3.5-turbo"


class ChatResponse(BaseModel):
    response: str
    model: str
