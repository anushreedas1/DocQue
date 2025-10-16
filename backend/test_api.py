#!/usr/bin/env python3
"""Simple test script to verify API endpoints"""

import requests
import sys
import json

def test_api(base_url="http://localhost:8000"):
    """Test basic API endpoints"""
    
    print(f"Testing API at: {base_url}")
    print("="*50)
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"✓ Root endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
        return False
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"✓ Health endpoint: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Health endpoint failed: {e}")
        return False
    
    # Test documents list endpoint
    try:
        response = requests.get(f"{base_url}/documents/", timeout=10)
        print(f"✓ Documents list: {response.status_code}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"✗ Documents list failed: {e}")
        return False
    
    print("="*50)
    print("✓ All basic tests passed!")
    return True

def test_production():
    """Test production API"""
    return test_api("https://docque.onrender.com")

def test_local():
    """Test local API"""
    return test_api("http://localhost:8000")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "prod":
        success = test_production()
    else:
        success = test_local()
    
    sys.exit(0 if success else 1)