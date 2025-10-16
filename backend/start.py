#!/usr/bin/env python3
"""Production startup script for the FastAPI application"""

import os
import sys
import logging
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from app.config import settings

def main():
    """Main entry point for production server"""
    
    # Configure logging for production
    settings.configure_logging()
    logger = logging.getLogger(__name__)
    
    # Log startup information
    logger.info("="*50)
    logger.info("Starting Knowledge Base Search Engine API")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Host: {settings.HOST}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    logger.info(f"OpenAI API Key configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info("="*50)
    
    # Ensure data directory exists
    try:
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        logger.info(f"Data directory ready: {settings.DATA_DIR}")
    except Exception as e:
        logger.error(f"Failed to create data directory: {e}")
        sys.exit(1)
    
    # Start the server
    try:
        uvicorn.run(
            "main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=False,  # Disable reload in production
            log_level="info",
            access_log=True,
            server_header=False,
            date_header=False
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()