import asyncio
import os
import httpx
from database import db
import digink_service

async def test_ids():
    token = await digink_service.get_access_token()
    CLIENT_ID = os.getenv("DIGINK_CLIENT_ID")
    APP_ID = os.getenv("DIGINK_APP_ID")
    BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")
    
    ids = [APP_ID, CLIENT_ID]
    
    for current_id in ids:
        url = f"{BASE_URL}/api/client/{current_id}/documents"
        print(f"\nTesting with ID '{current_id}':")
        
        headers = {"Authorization": f"Bearer {token}"}
        # Send minimal payload
        data = {
            "sender_email": "admin@contrax.com",
            "title": "Test",
            "recipients": "[]",
            "fields": "[]"
        }
        files = {"file": ("test.txt", b"test content", "text/plain")}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, data=data, files=files, timeout=5.0)
                print(f"Status: {response.status_code}")
                print(f"Body: {response.text}")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ids())
