"""Configuration settings for the application"""

import os
import logging
from typing import List


class Settings:
    """Application settings"""
    
    # API Configuration
    API_TITLE: str = "Knowledge Base Search Engine"
    API_VERSION: str = "1.0.0"
    
    # Environment Configuration (Hardcoded for production)
    ENVIRONMENT: str = "production"
    
    # CORS Configuration (Allow all domains)
    @property
    def cors_origins(self) -> List[str]:
        return ["*"]  # Allow all domains
    
    # File Upload Configuration (Hardcoded)
    MAX_FILE_SIZE: int = 10485760  # 10MB in bytes
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".txt"]
    
    # OpenAI Configuration (Only this comes from env)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Embedding Configuration (Hardcoded)
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    # Server Configuration (Hardcoded)
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database/Storage Configuration (Hardcoded)
    DATA_DIR: str = "./data"
    
    # Model Configuration (Hardcoded)
    SENTENCE_TRANSFORMERS_HOME: str = "./models"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Health Check Configuration (Hardcoded)
    HEALTH_CHECK_TIMEOUT: int = 30
    
    # Logging Configuration (Hardcoded)
    LOG_LEVEL: str = "INFO"
    
    def configure_logging(self):
        """Configure logging for the application"""
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        # Production logging configuration (hardcoded)
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.StreamHandler(),  # For Render logs
            ]
        )
        
        # Set specific loggers
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("fastapi").setLevel(logging.INFO)


settings = Settings()