import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_cas():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    
    cas_id = "98f4bb18" # Or whatever the full ID is. Let's find by contractId or partial ID.
    print(f"Searching for CAS record related to 98f4bb18")
    
    # The ID in the screenshot is CAS-DOC-98F4BB1D (wait, let me look closer)
    # Screenshot says #98F4BB1D
    cas_id_hex = "98f4bb1d"
    
    cursor = db.cas.find()
    async for doc in cursor:
        if str(doc["_id"]).endswith(cas_id_hex):
            print(f"Found CAS: {doc['_id']}")
            print(f"Contract Title: {doc.get('contractTitle')}")
            print(f"Approval Chain: {doc.get('approvalChain')}")
            return

if __name__ == "__main__":
    asyncio.run(check_cas())
