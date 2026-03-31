import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv, find_dotenv

# Load settings from .env
load_dotenv(find_dotenv())

# Configuration from .env
DOMAIN = os.getenv("WHITELISTED_DOMAIN", "apeiro.digital")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Aastha Pradhan")
ADMIN_PRE = os.getenv("ADMIN_PRE_EMAIL", "Aastha.Pradhan")
USER_NAME = os.getenv("USER_NAME", "Rani Sahu")
USER_PRE = os.getenv("USER_PRE_EMAIL", "Rani.Sahu")
SUPERADMIN_NAME = os.getenv("SUPERADMIN_NAME", "System Superadmin")
SUPERADMIN_PRE = os.getenv("SUPERADMIN_PRE_EMAIL", "superadmin")

async def sync_database():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print(f"--- Synchronizing Roles with Domain: {DOMAIN} ---")
    
    # 1. Update Whitelist Domain in DB
    print(f"Synchronizing central whitelist to: {DOMAIN}...")
    await db.whitelist.update_many({}, {"$set": {"domain": DOMAIN}})
    
    # 2. Define Sync Mapping
    # Logic: Any user with the role 'Admin' gets the ADMIN_NAME and ADMIN_EMAIL
    role_mappings = [
        {
            "role": "Admin", 
            "new_email": f"{ADMIN_PRE}@{DOMAIN}", 
            "new_name": ADMIN_NAME,
            "patterns": ["admin@apeiro.com", "Aastha.Pradhan@apeiro.com", "Aastha.Pradhan@apeiro.digital"]
        },
        {
            "role": "User", 
            "new_email": f"{USER_PRE}@{DOMAIN}", 
            "new_name": USER_NAME,
            "patterns": ["user@apeiro.com", "Rani.Sahu@apeiro.digital"]
        },
        {
            "role": "Superadmin", 
            "new_email": f"{SUPERADMIN_PRE}@{DOMAIN}", 
            "new_name": SUPERADMIN_NAME,
            "patterns": ["superadmin@apeiro.com", "superadmin@apeiro.digital"]
        }
    ]
    
    for mapping in role_mappings:
        role = mapping["role"]
        new_email = mapping["new_email"]
        new_name = mapping["new_name"]
        
        print(f"\nProcessing Role: {role}...")
        
        # Find the existing user(s) for this role
        # We search by role first to be generic
        async for user in db.users.find({"role": role}):
            old_email = user["email"]
            if old_email == new_email and user.get("name") == new_name:
                print(f"  User {old_email} is already up to date.")
                continue
                
            print(f"  Updating user {old_email} -> {new_email} ({new_name})")
            
            # Update user record
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"email": new_email, "name": new_name}}
            )
            
            # Update contracts submitted by this user
            result = await db.contracts.update_many(
                {"submittedBy": old_email},
                {"$set": {"submittedBy": new_email}}
            )
            if result.modified_count > 0:
                print(f"    Updated {result.modified_count} contracts.")
            
            # Update logs
            await db.logs.update_many({"user": old_email}, {"$set": {"user": new_email}})
            await db.logs.update_many({"user_id": old_email}, {"$set": {"user_id": new_email}})
            
    # 3. Update Other Operational Roles (Standardize Domain)
    print("\nUpdating operational roles (Legal, Finance, Compliance, etc.)...")
    async for user in db.users.find({"role": {"$in": ["Legal", "Finance", "Compliance", "Procurement", "Sales", "Manager", "CEO"]}}):
        old_email = user["email"]
        if "@" in old_email:
            prefix = old_email.split("@")[0]
            new_email = f"{prefix}@{DOMAIN}"
            if old_email != new_email:
                print(f"  Updating {old_email} -> {new_email}")
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"email": new_email}})
                await db.contracts.update_many({"submittedBy": old_email}, {"$set": {"submittedBy": new_email}})
                await db.logs.update_many({"user": old_email}, {"$set": {"user": new_email}})

    print("\n--- Synchronization Complete! ---")

if __name__ == "__main__":
    asyncio.run(sync_database())
