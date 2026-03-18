from fastapi import APIRouter, HTTPException, Body, status
from typing import List
from bson import ObjectId
from datetime import datetime
from mongodb_client import db


from models import UserCreate, UserUpdate, UserResponse
from utils.validation import validate_email_domain


router = APIRouter(prefix="/users", tags=["Users"])

def user_helper(user) -> dict:
    return {
        "_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "department": user.get("department"),
        "status": user["status"]
    }

@router.get("/", response_model=List[UserResponse])
async def list_users():
    users = await db.users.find().to_list(1000)
    return [user_helper(u) for u in users]

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate = Body(...)):
    # 1. Validate email domain
    await validate_email_domain(user_data.email)
    
    # 2. Check if user already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # 3. Create user
    new_user = user_data.dict()
    new_user["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(new_user)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return user_helper(created_user)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: UserUpdate = Body(...)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # If email is being updated, validate the new domain
    if update_data.email:
        await validate_email_domain(update_data.email)
        
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if len(update_dict) >= 1:
        update_result = await db.users.update_one(
            {"_id": ObjectId(user_id)}, {"$set": update_dict}
        )
        
        if update_result.modified_count == 0:
            # Check if user exists but nothing changed
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return user_helper(updated_user)

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if delete_result.deleted_count == 1:
        return {"message": "User deleted successfully"}
        
    raise HTTPException(status_code=404, detail="User not found")
