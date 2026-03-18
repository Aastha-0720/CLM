import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
DATABASE_NAME = "clm_db"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

async def init_db():
    # Create indexes
    await db.allowed_domains.create_index("domain", unique=True)
    
    # Opportunities indexes
    await db.opportunities.create_index("id", unique=True)
    await db.opportunities.create_index("current_stage")
    await db.opportunities.create_index("business_unit")
    await db.opportunities.create_index("sales_owner_id")
    await db.opportunities.create_index("created_at")
    await db.opportunities.create_index("last_updated")

    
    # Contracts indexes
    await db.contracts.create_index("id", unique=True)
    await db.contracts.create_index("status")
    
    # Users indexes
    await db.users.create_index("status")

