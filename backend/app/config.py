"""Configuration settings for the application"""

import os
import logging
from typing import List


class Settings:
    """Application settings"""
    
    # API Configuration
    API_TITLE: str = "Knowledge Base Search Engine"
    API_VERSION: str = "1.0.0"
    
    # Environment Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = (
        os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if os.getenv("ALLOWED_ORIGINS")
        else [
            "http://localhost:3000",
            "https://*.vercel.app",
        ]
    )
    
    # Production CORS - more restrictive for production
    @property
    def cors_origins(self) -> List[str]:
        if self.ENVIRONMENT == "production":
            # In production, use specific origins from environment variable
            return os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
        return self.ALLOWED_ORIGINS
    
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
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO" if ENVIRONMENT == "production" else "DEBUG")
    
    def configure_logging(self):
        """Configure logging for the application"""
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        if self.ENVIRONMENT == "production":
            # Production logging configuration
            logging.basicConfig(
                level=getattr(logging, self.LOG_LEVEL),
                format=log_format,
                handlers=[
                    logging.StreamHandler(),  # For Render logs
                ]
            )
        else:
            # Development logging configuration
            logging.basicConfig(
                level=getattr(logging, self.LOG_LEVEL),
                format=log_format
            )
        
        # Set specific loggers
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("fastapi").setLevel(logging.INFO)


settings = Settings()