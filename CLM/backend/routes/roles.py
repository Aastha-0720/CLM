from fastapi import APIRouter, HTTPException
from mongodb_client import db
from models import RoleResponse, RoleBase
from typing import List
from bson import ObjectId

router = APIRouter(prefix="/roles", tags=["Roles"])

@router.get("", response_model=List[RoleResponse])
async def get_roles():
    roles = await db.roles.find().to_list(100)
    for r in roles:
        r["_id"] = str(r["_id"])
    return roles

@router.get("/permissions")
async def get_permissions():
    # Return a static list of available permissions for the UI
    return [
        "view_dashboard", "manage_users", "manage_roles", 
        "create_opportunity", "edit_opportunity", "delete_opportunity",
        "create_contract", "edit_contract", "approve_contract"
    ]
