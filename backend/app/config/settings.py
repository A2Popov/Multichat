from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MultiChat API"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./multichat.db"
    
    # AI Provider API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]
    # Allow CloudPub tunnels (e.g., https://*.cloudpub.ru, https://*.trycloudflare.com)
    ALLOW_ALL_ORIGINS: bool = True  # Set to False in production with specific domains
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
