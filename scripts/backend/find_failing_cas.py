import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

async def find_cas_by_suffix(suffix):
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.clm_platform
    
    print(f"\nSearching for CAS ending in '{suffix}'...")
    cas_list = await db.cas.find({}).to_list(1000)
    found_cas = None
    for cas in cas_list:
        if str(cas["_id"]).upper().endswith(suffix.upper()):
            found_cas = cas
            break
            
    if found_cas:
        print(f"FOUND CAS: {found_cas}")
        contract_id = found_cas.get("contractId")
        print(f"Associated Contract ID: {contract_id}")
        
        if contract_id:
            contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
            if contract:
                print(f"FOUND CONTRACT: {contract}")
                doc = await db.documents.find_one({"contractId": contract_id}, sort=[("uploadedAt", -1)])
                if doc:
                    print(f"FOUND DOCUMENT: {doc}")
                else:
                    print("NO DOCUMENT FOUND for this contract.")
            else:
                print(f"CONTRACT {contract_id} NOT FOUND in DB.")
        else:
            print("CAS record has no contractId!")
    else:
        print(f"No CAS found ending in '{suffix}'.")

if __name__ == "__main__":
    asyncio.run(find_cas_by_suffix("D23AD85E"))
