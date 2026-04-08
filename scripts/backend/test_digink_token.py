import asyncio
import os
from dotenv import load_dotenv

# Load .env from the parent directory (CLM/.env)
load_dotenv("../.env")

import digink_service

async def test_token():
    print(f"DIGINK_CLIENT_ID: {os.getenv('DIGINK_CLIENT_ID')}")
    print(f"DIGINK_APP_ID: {os.getenv('DIGINK_APP_ID')}")
    print(f"DIGINK_BASE_URL: {os.getenv('DIGINK_BASE_URL')}")
    
    try:
        token = await digink_service.get_access_token()
        print(f"\nSuccess! Token: {token[:10]}...")
    except Exception as e:
        print(f"\nFailed to get token: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    asyncio.run(test_token())
