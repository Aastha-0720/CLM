import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    # 1. Add apeiro.digital back to whitelist
    await db.whitelist.update_one(
        {"domain": "apeiro.digital"}, 
        {"$set": {"domain": "apeiro.digital", "isActive": True}}, 
        upsert=True
    )
    print("apeiro.digital added to whitelist.")
    
    # 2. Ensure netgroup.ai is also whitelisted
    domain = os.getenv("WHITELISTED_DOMAIN", "netgroup.ai")
    await db.whitelist.update_one(
        {"domain": domain}, 
        {"$set": {"domain": domain, "isActive": True}}, 
        upsert=True
    )
    print(f"{domain} ensured in whitelist.")
    
    # 3. Check users
    async for user in db.users.find({"role": "User"}):
        print(f"User: {user.get('name')}, Email: {user.get('email')}")

if __name__ == "__main__":
    asyncio.run(fix())
