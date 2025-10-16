#!/usr/bin/env python3
"""Test service initialization"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_services():
    """Test if services can be initialized"""
    
    print("Testing service initialization...")
    print("="*50)
    
    try:
        from app.services import get_document_processor
        print("✓ DocumentProcessor import successful")
        
        processor = get_document_processor()
        print("✓ DocumentProcessor initialization successful")
        print(f"  Model: {processor.embedding_model}")
        
    except Exception as e:
        print(f"✗ DocumentProcessor failed: {e}")
        return False
    
    try:
        from app.services import get_llm_service
        print("✓ LLMService import successful")
        
        llm = get_llm_service()
        print("✓ LLMService initialization successful")
        print(f"  API Key configured: {bool(llm.api_key)}")
        
    except Exception as e:
        print(f"✗ LLMService failed: {e}")
        return False
    
    print("="*50)
    print("✓ All services initialized successfully!")
    return True

if __name__ == "__main__":
    success = test_services()
    sys.exit(0 if success else 1)