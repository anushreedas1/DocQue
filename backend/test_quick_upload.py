#!/usr/bin/env python3
"""Test quick upload without processing"""

import requests
import sys
import io

def test_quick_upload(base_url="https://docque.onrender.com"):
    """Test the quick upload without processing"""
    
    print(f"Testing quick upload at: {base_url}")
    print("="*50)
    
    # Create a simple test file
    test_content = "This is a test document for quick upload testing."
    test_file = io.BytesIO(test_content.encode('utf-8'))
    
    try:
        # Test upload endpoint
        files = {'file': ('test.txt', test_file, 'text/plain')}
        response = requests.post(
            f"{base_url}/documents/upload", 
            files=files,
            timeout=10  # Short timeout since we're not processing
        )
        
        print(f"Quick upload response status: {response.status_code}")
        print(f"Quick upload response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✓ Quick upload successful: {response.json()}")
            return True
        else:
            print(f"✗ Quick upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Quick upload request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_quick_upload()
    sys.exit(0 if success else 1)