import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

async def inspect():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print("\n--- CAS D23AD85E ---")
    cas = await db.cas.find_one({"_id": "D23AD85E"})
    if not cas:
         cas = await db.cas.find_one({"_id": ObjectId("D23AD85E")}) if ObjectId.is_valid("D23AD85E") else None
    
    if cas:
        print(f"CAS Found: {cas}")
        contract_id = cas.get("contractId")
        print(f"Contract ID from CAS: {contract_id}")
        
        if contract_id:
            contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
            if contract:
                print(f"Contract Found: {contract.get('title')}, Submitter: {contract.get('submittedBy')}")
            else:
                print(f"Contract {contract_id} NOT found in DB")
    else:
        print("CAS D23AD85E not found")

if __name__ == "__main__":
    asyncio.run(inspect())
