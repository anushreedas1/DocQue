"""Configuration settings for the application"""

import os
from typing import List


class Settings:
    """Application settings"""
    
    # API Configuration
    API_TITLE: str = "Knowledge Base Search Engine"
    API_VERSION: str = "1.0.0"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = (
        os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://*.vercel.app").split(",")
        if os.getenv("ALLOWED_ORIGINS")
        else [
            "http://localhost:3000",
            "https://*.vercel.app",
        ]
    )
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".txt"]
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Embedding Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()