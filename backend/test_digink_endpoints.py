import asyncio
import os
import httpx
import json
from database import db
import digink_service

async def test_endpoint():
    token = await digink_service.get_access_token()
    APP_ID = os.getenv("DIGINK_APP_ID")
    BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")
    
    # Try different prefixes
    prefixes = ["applications", "client"]
    
    for prefix in prefixes:
        url = f"{BASE_URL}/api/{prefix}/{APP_ID}/documents"
        print(f"\nTesting prefix '{prefix}': {url}")
        
        headers = {"Authorization": f"Bearer {token}"}
        # Lightweight request (missing data) to see if we get a 404 or something else
        async with httpx.AsyncClient() as client:
            try:
                # Use a small timeout
                response = await client.post(url, headers=headers, timeout=5.0)
                print(f"Status: {response.status_code}")
                print(f"Body: {response.text[:100]}")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
