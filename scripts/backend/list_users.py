import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    async for u in db.users.find():
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Name: {u.get('name')}")

if __name__ == "__main__":
    asyncio.run(list_users())
