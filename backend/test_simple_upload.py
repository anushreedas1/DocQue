#!/usr/bin/env python3
"""Test the simple upload endpoint"""

import requests
import sys
import io

def test_simple_upload(base_url="https://docque.onrender.com"):
    """Test the simple upload endpoint"""
    
    print(f"Testing simple upload at: {base_url}")
    print("="*50)
    
    # Create a simple test file
    test_content = "This is a test document for upload testing."
    test_file = io.BytesIO(test_content.encode('utf-8'))
    
    try:
        # Test simple upload endpoint
        files = {'file': ('test.txt', test_file, 'text/plain')}
        response = requests.post(
            f"{base_url}/documents/upload/test", 
            files=files,
            timeout=30
        )
        
        print(f"Simple upload response status: {response.status_code}")
        print(f"Simple upload response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✓ Simple upload successful: {response.json()}")
        else:
            print(f"✗ Simple upload failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Simple upload request failed: {e}")
        return False
    
    return response.status_code == 200

if __name__ == "__main__":
    success = test_simple_upload()
    sys.exit(0 if success else 1)