#!/usr/bin/env python3
"""Test CORS and upload endpoints"""

import requests
import sys
import io

def test_cors_endpoints(base_url="https://docque.onrender.com"):
    """Test CORS and upload endpoints"""
    
    print(f"Testing CORS at: {base_url}")
    print("="*50)
    
    # Test CORS test endpoint
    try:
        response = requests.get(f"{base_url}/test/cors", timeout=10)
        print(f"✓ CORS test endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
        print(f"  Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"✗ CORS test endpoint failed: {e}")
    
    # Test minimal upload endpoint
    try:
        response = requests.post(f"{base_url}/documents/upload/minimal", timeout=10)
        print(f"✓ Minimal upload endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
        print(f"  Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"✗ Minimal upload endpoint failed: {e}")
    
    # Test OPTIONS request for upload
    try:
        response = requests.options(f"{base_url}/documents/upload", timeout=10)
        print(f"✓ Upload OPTIONS: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"✗ Upload OPTIONS failed: {e}")
    
    # Test simple upload with file
    try:
        test_content = "This is a test document for upload testing."
        test_file = io.BytesIO(test_content.encode('utf-8'))
        files = {'file': ('test.txt', test_file, 'text/plain')}
        
        response = requests.post(
            f"{base_url}/documents/upload/test", 
            files=files,
            timeout=30
        )
        
        print(f"✓ Test upload with file: {response.status_code}")
        if response.status_code == 200:
            print(f"  Response: {response.json()}")
        else:
            print(f"  Error: {response.text}")
        print(f"  Headers: {dict(response.headers)}")
        
    except Exception as e:
        print(f"✗ Test upload with file failed: {e}")
    
    # Test full upload endpoint
    try:
        test_content = "This is a test document for full upload testing."
        test_file = io.BytesIO(test_content.encode('utf-8'))
        files = {'file': ('test.txt', test_file, 'text/plain')}
        
        response = requests.post(
            f"{base_url}/documents/upload", 
            files=files,
            timeout=30
        )
        
        print(f"✓ Full upload: {response.status_code}")
        if response.status_code == 200:
            print(f"  Response: {response.json()}")
        else:
            print(f"  Error: {response.text}")
        print(f"  Headers: {dict(response.headers)}")
        
    except Exception as e:
        print(f"✗ Full upload failed: {e}")

if __name__ == "__main__":
    test_cors_endpoints()