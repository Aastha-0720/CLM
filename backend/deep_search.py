import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def find_everything():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    
    contract_id = "69c283e49c56314e98f4bb18"
    print(f"Searching for Contract: {contract_id}")
    c = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if c:
        print(f"FOUND Contract: {c.get('title')}")
    else:
        print("Contract NOT FOUND in contracts collection.")
    
    print("\nSearching for CAS referencing this contract...")
    cas = await db.cas.find_one({"contractId": contract_id})
    if cas:
        print(f"FOUND CAS: {cas.get('_id')}, Title: {cas.get('contractTitle')}")
    else:
        # Try finding by string ID
        cas = await db.cas.find_one({"contractId": contract_id})
        print("CAS NOT FOUND by contractId.")

if __name__ == "__main__":
    asyncio.run(find_everything())
