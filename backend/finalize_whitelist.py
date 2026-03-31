import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def finalize_whitelist():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    # 1. Add both domains to whitelist
    for domain in ["netgroup.ai", "apeiro.digital"]:
        await db.whitelist.update_one(
            {"domain": domain}, 
            {"$set": {"domain": domain, "isActive": True, "createdAt": "2026-03-30T00:00:00"}}, 
            upsert=True
        )
        print(f"Verified whitelisted: {domain}")
    
    # 2. Check the entire whitelist collection
    print("\n--- Final Whitelist in DB ---")
    cursor = db.whitelist.find()
    async for doc in cursor:
        print(f"Domain: {doc.get('domain')}, Active: {doc.get('isActive')}")

if __name__ == "__main__":
    asyncio.run(finalize_whitelist())
