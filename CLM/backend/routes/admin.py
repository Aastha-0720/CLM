from fastapi import APIRouter, HTTPException, Body, status
from typing import List
from bson import ObjectId
from datetime import datetime
from mongodb_client import db


from models import DomainCreate, DomainUpdate, DomainResponse


router = APIRouter(prefix="/admin/domains", tags=["Admin Domains"])

def domain_helper(domain) -> dict:
    return {
        "_id": str(domain["_id"]),
        "domain": domain["domain"],
        "is_active": domain["is_active"],
        "created_at": domain["created_at"]
    }

@router.get("/", response_model=List[DomainResponse])
async def list_domains():
    domains = await db.allowed_domains.find().to_list(1000)
    return [domain_helper(d) for d in domains]

@router.post("/", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
async def add_domain(domain_data: DomainCreate = Body(...)):
    # Check if domain already exists
    existing = await db.allowed_domains.find_one({"domain": domain_data.domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already registered")
    
    new_domain = {
        "domain": domain_data.domain,
        "is_active": domain_data.is_active,
        "created_at": datetime.utcnow()
    }
    
    result = await db.allowed_domains.insert_one(new_domain)
    created_domain = await db.allowed_domains.find_one({"_id": result.inserted_id})
    return domain_helper(created_domain)

@router.patch("/{domain_id}", response_model=DomainResponse)
async def update_domain(domain_id: str, update_data: DomainUpdate = Body(...)):
    if not ObjectId.is_valid(domain_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if len(update_dict) >= 1:
        update_result = await db.allowed_domains.update_one(
            {"_id": ObjectId(domain_id)}, {"$set": update_dict}
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"Domain {domain_id} not found")

    updated_domain = await db.allowed_domains.find_one({"_id": ObjectId(domain_id)})
    if updated_domain:
        return domain_helper(updated_domain)
    
    raise HTTPException(status_code=404, detail=f"Domain {domain_id} not found")

@router.delete("/{domain_id}")
async def delete_domain(domain_id: str):
    if not ObjectId.is_valid(domain_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await db.allowed_domains.delete_one({"_id": ObjectId(domain_id)})
    
    if delete_result.deleted_count == 1:
        return {"message": "Domain deleted successfully"}
        
    raise HTTPException(status_code=404, detail=f"Domain {domain_id} not found")
