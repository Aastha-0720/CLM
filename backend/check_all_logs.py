import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_all_logs():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print("\n--- Recent System Logs ---")
    cursor = db.logs.find({}).sort([("timestamp", -1)]).limit(20)
    async for log in cursor:
        print(f"Timestamp: {log.get('timestamp')}")
        print(f"Action: {log.get('action')}")
        print(f"Details: {log.get('details')}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_all_logs())
