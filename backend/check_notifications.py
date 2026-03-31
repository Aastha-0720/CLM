import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_notifications():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    print("--- Admin Notifications ---")
    cursor = db.notifications.find({"for_user": "Admin"}).sort("timestamp", -1).limit(10)
    async for n in cursor:
        print(f"[{n.get('timestamp')}] {n.get('message')}")

if __name__ == "__main__":
    asyncio.run(check_notifications())
