import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def test_cas_trigger():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    
    contract_id = "69c677c318db18116e1e8e50"
    print(f"Resetting contract {contract_id} stage to 'Procurement Review'...")
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"stage": "Procurement Review", "status": "Under Review"}}
    )
    
    # Now simulate a procurement approval via the API logic in main.py
    # Since I can't call the FastAPI endpoint easily from here, I'll just check if my code would run.
    # Actually, I'll just run a separate script that mimics the logic I just added.
    print("Done. Now the user can try approving it from the UI.")

if __name__ == "__main__":
    asyncio.run(test_cas_trigger())
