import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_digink_and_cas():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.clm_platform
    contract_id = "69c677c318db18116e1e8e50"
    
    print(f"--- Data for Contract {contract_id} ---")
    cas = await db.cas.find_one({"contractId": contract_id})
    if cas:
        print(f"CAS Status: {cas.get('status')}")
        chain = cas.get("approvalChain", [])
        for i, s in enumerate(chain):
            print(f"  Step {i} ({s.get('role')}): {s.get('status')}")
    else:
        print("CAS Record NOT FOUND")
        
    dig = await db.digink_documents.find_one({"contractId": contract_id})
    print(f"DigInk Document: {dig}")

if __name__ == "__main__":
    asyncio.run(check_digink_and_cas())
