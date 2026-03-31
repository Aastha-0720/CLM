import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    
    contract_id = "69c283e49c56314e98f4bb18"
    print(f"Checking for contract: {contract_id}")
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if contract:
        print(f"Contract found: {contract.get('title')}")
    else:
        print("Contract NOT found.")
        
    print("\nRecent contracts:")
    cursor = db.contracts.find().sort("createdAt", -1).limit(5)
    async for c in cursor:
        print(f"- {c.get('_id')}: {c.get('title')}")

if __name__ == "__main__":
    asyncio.run(check_data())
