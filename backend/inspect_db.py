import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print("--- Whitelist ---")
    async for d in db.whitelist.find():
        print(f"Domain: {d.get('domain')}, Active: {d.get('isActive')}")
        
    print("\n--- Users ---")
    async for u in db.users.find():
        print(f"Name: {u.get('name')}, Email: {u.get('email')}, Role: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(check())
