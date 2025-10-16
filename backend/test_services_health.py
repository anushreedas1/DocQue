#!/usr/bin/env python3
"""Test services health check endpoint"""

import requests
import sys
import json

def test_services_health(base_url="https://docque.onrender.com"):
    """Test the services health check endpoint"""
    
    print(f"Testing services health at: {base_url}")
    print("="*50)
    
    try:
        response = requests.get(f"{base_url}/health/services", timeout=30)
        print(f"Services health status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Services health check successful:")
            print(json.dumps(data, indent=2))
        else:
            print(f"✗ Services health check failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Services health request failed: {e}")
        return False
    
    return response.status_code == 200

if __name__ == "__main__":
    success = test_services_health()
    sys.exit(0 if success else 1)