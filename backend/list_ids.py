import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_ids():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    print("--- CAS Records ---")
    async for c in db.cas.find():
        print(f"CAS ID: {c.get('_id')}, ContractId: {c.get('contractId')}, Title: {c.get('contractTitle')}")
    
    print("\n--- Contract Records ---")
    async for c in db.contracts.find():
        print(f"Contract ID: {c.get('_id')}, Title: {c.get('title')}")

if __name__ == "__main__":
    asyncio.run(list_ids())
