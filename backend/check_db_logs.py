import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_logs():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    
    print("Checking system logs...")
    cursor = db.logs.find({"details": {"$regex": "DigInk", "$options": "i"}}).sort("timestamp", -1).limit(10)
    async for log in cursor:
        print(f"[{log.get('timestamp')}] {log.get('action')}: {log.get('details')}")

    print("\nChecking for error-like logs...")
    cursor = db.logs.find({"details": {"$regex": "failed|error", "$options": "i"}}).sort("timestamp", -1).limit(10)
    async for log in cursor:
        print(f"[{log.get('timestamp')}] {log.get('action')}: {log.get('details')}")

if __name__ == "__main__":
    asyncio.run(check_logs())
