import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_all_cas():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    print("--- CAS Records ---")
    count = 0
    async for c in db.cas.find():
        print(f"CAS ID: {c.get('_id')}, ContractId: {c.get('contractId')}, Title: {c.get('contractTitle')}")
        count += 1
    print(f"Total CAS records: {count}")

if __name__ == "__main__":
    asyncio.run(list_all_cas())
