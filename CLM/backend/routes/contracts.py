from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from mongodb_client import db


from models import ContractResponse, ContractCreate

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.get("/", response_model=List[ContractResponse])
async def list_contracts(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    status: Optional[str] = None
):
    """
    List contracts with pagination and optional filtering.
    """
    try:
        query = {}
        if status and status != 'All':
            query["status"] = status

        projection = {
            "id": 1,
            "opportunity": 1,
            "customer": 1,
            "status": 1,
            "cas_status": 1,
            "signature_status": 1
        }

        contracts = await db.contracts.find(query, projection).skip(skip).limit(limit).to_list(limit)
        return contracts
    except Exception as e:
        logger.error(f"Error listing contracts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching contracts"
        )

@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str):
    """
    Get a single contract by ID.
    """
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(contract: ContractCreate):
    """
    Create a new contract.
    """
    try:
        new_contract = contract.dict()
        if await db.contracts.find_one({"id": new_contract["id"]}):
            raise HTTPException(status_code=400, detail="Contract ID already exists")
        
        await db.contracts.insert_one(new_contract)
        return new_contract
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
