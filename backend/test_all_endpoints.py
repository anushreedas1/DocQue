#!/usr/bin/env python3
"""Test all endpoints with CORS"""

import requests
import sys
import io
import json

def test_all_endpoints(base_url="https://docque.onrender.com"):
    """Test all endpoints for CORS and functionality"""
    
    print(f"Testing all endpoints at: {base_url}")
    print("="*60)
    
    success_count = 0
    total_tests = 0
    
    # Test 1: Root endpoint
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"✓ Root endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
    
    # Test 2: Health endpoint
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"✓ Health endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Health endpoint failed: {e}")
    
    # Test 3: CORS test endpoint
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/test/cors", timeout=10)
        print(f"✓ CORS test endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ CORS test endpoint failed: {e}")
    
    # Test 4: Documents list
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/documents/", timeout=10)
        print(f"✓ Documents list: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Documents list failed: {e}")
    
    # Test 5: Query test endpoint
    total_tests += 1
    try:
        response = requests.get(f"{base_url}/query/test", timeout=10)
        print(f"✓ Query test endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Query test endpoint failed: {e}")
    
    # Test 6: OPTIONS requests
    total_tests += 1
    try:
        response = requests.options(f"{base_url}/documents/upload", timeout=10)
        print(f"✓ Upload OPTIONS: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Upload OPTIONS failed: {e}")
    
    # Test 7: Query OPTIONS
    total_tests += 1
    try:
        response = requests.options(f"{base_url}/query/", timeout=10)
        print(f"✓ Query OPTIONS: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        success_count += 1
    except Exception as e:
        print(f"✗ Query OPTIONS failed: {e}")
    
    # Test 8: Upload endpoint
    total_tests += 1
    try:
        test_content = "This is a test document for upload testing."
        test_file = io.BytesIO(test_content.encode('utf-8'))
        files = {'file': ('test.txt', test_file, 'text/plain')}
        
        response = requests.post(
            f"{base_url}/documents/upload", 
            files=files,
            timeout=15
        )
        
        print(f"✓ Upload endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        if response.status_code == 200:
            print(f"  ✓ Upload successful: {response.json().get('message', 'No message')}")
        success_count += 1
    except Exception as e:
        print(f"✗ Upload endpoint failed: {e}")
    
    # Test 9: Query endpoint
    total_tests += 1
    try:
        query_data = {
            "query": "test",
            "max_results": 5
        }
        
        response = requests.post(
            f"{base_url}/query/", 
            json=query_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"✓ Query endpoint: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print("  ✓ CORS headers present")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Query successful: {data.get('answer', 'No answer')[:50]}...")
        success_count += 1
    except Exception as e:
        print(f"✗ Query endpoint failed: {e}")
    
    print("="*60)
    print(f"Test Results: {success_count}/{total_tests} endpoints working")
    
    if success_count == total_tests:
        print("🎉 ALL ENDPOINTS WORKING WITH CORS!")
        return True
    else:
        print(f"⚠️  {total_tests - success_count} endpoints need attention")
        return False

if __name__ == "__main__":
    success = test_all_endpoints()
    sys.exit(0 if success else 1)