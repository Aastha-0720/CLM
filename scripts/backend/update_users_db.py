import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

async def update_database():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    
    # 1. Update Whitelist
    print("Updating whitelist domain...")
    await db.whitelist.update_one(
        {"domain": "apeiro.com"},
        {"$set": {"domain": "apeiro.digital"}}
    )
    
    # 2. Update Users
    user_updates = [
        {"old": "admin@apeiro.com", "new": "Aastha.Pradhan@apeiro.digital", "name": "Aastha Pradhan"},
        {"old": "user@apeiro.com", "new": "Rani.Sahu@apeiro.digital", "name": "Rani Sahu"},
        {"old": "legal@apeiro.com", "new": "legal@apeiro.digital"},
        {"old": "finance@apeiro.com", "new": "finance@apeiro.digital"},
        {"old": "compliance@apeiro.com", "new": "compliance@apeiro.digital"},
        {"old": "procurement@apeiro.com", "new": "procurement@apeiro.digital"},
        {"old": "sales@apeiro.com", "new": "sales@apeiro.digital"},
        {"old": "manager@apeiro.com", "new": "manager@apeiro.digital"},
        {"old": "ceo@apeiro.com", "new": "ceo@apeiro.digital"},
        {"old": "superadmin@apeiro.com", "new": "superadmin@apeiro.digital"},
    ]
    
    for upd in user_updates:
        print(f"Updating user {upd['old']} -> {upd['new']}...")
        set_fields = {"email": upd["new"]}
        if "name" in upd:
            set_fields["name"] = upd["name"]
            
        await db.users.update_one(
            {"email": upd["old"]},
            {"$set": set_fields}
        )
        
        # Also update contracts submitted by this user
        print(f"Updating contracts submitted by {upd['old']}...")
        await db.contracts.update_many(
            {"submittedBy": upd["old"]},
            {"$set": {"submittedBy": upd["new"]}}
        )
        
        # Update logs
        print(f"Updating logs for {upd['old']}...")
        await db.logs.update_many(
            {"user": upd["old"]},
            {"$set": {"user": upd["new"]}}
        )
        await db.logs.update_many(
            {"user_id": upd["old"]},
            {"$set": {"user_id": upd["new"]}}
        )

    print("Database update complete!")

if __name__ == "__main__":
    asyncio.run(update_database())
