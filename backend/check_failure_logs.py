import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_logs():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print("\n--- Recent Signature Failure Logs ---")
    cursor = db.logs.find({"action": "Signature Failure"}).sort([("timestamp", -1)]).limit(5)
    async for log in cursor:
        print(f"Timestamp: {log.get('timestamp')}")
        print(f"Details: {log.get('details')}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_logs())
