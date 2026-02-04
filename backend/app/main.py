from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from .database import get_db, init_db, User, Message
from .schemas import (
    UserCreate, UserResponse, LoginRequest, Token,
    ChatRequest, ChatResponse
)
from .auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_user, get_current_admin_user
)
from .config import settings

app = FastAPI(title="Multichat API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    # Create default admin user if not exists
    db = next(get_db())
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin"),
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print("Default admin user created (see README for credentials)")


@app.get("/")
def read_root():
    return {"message": "Welcome to Multichat API"}


@app.post("/api/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/users", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    new_user = User(
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        is_admin=user_data.is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    return users


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This is a draft implementation
    # In the future, this will proxy to actual AI models
    
    # Save message to database
    message = Message(
        user_id=current_user.id,
        content=chat_request.message,
        model=chat_request.model,
        response="This is a draft response. AI integration will be implemented later."
    )
    db.add(message)
    db.commit()
    
    return {
        "response": "This is a draft response. AI integration will be implemented later.",
        "model": chat_request.model
    }


@app.get("/api/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
