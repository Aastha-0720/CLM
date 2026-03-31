import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_contracts_stages():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    print("--- Contract Stages ---")
    async for c in db.contracts.find():
        print(f"Contract: {c.get('title')}, Stage: {c.get('stage')}, ID: {c.get('_id')}")

if __name__ == "__main__":
    asyncio.run(list_contracts_stages())
