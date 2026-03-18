from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from mongodb_client import db


from models import OpportunityResponse, OpportunityCreate

from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("/", response_model=List[OpportunityResponse])
async def list_opportunities(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    stage: Optional[str] = None,
    business_unit: Optional[str] = None,
    sales_owner_id: Optional[str] = None
):

    """
    List opportunities with pagination and optional filtering.
    Uses projection to avoid returning unnecessary fields (though the model currently defines all).
    """
    try:
        query = {}
        if stage:
            query["current_stage"] = stage
        if business_unit:
            query["business_unit"] = business_unit
        if sales_owner_id:
            query["sales_owner_id"] = sales_owner_id


        # Define projection: Exclude internal MongoDB fields if not needed, 
        # but here we need to map _id to id.
        # Motor/Pydantic handle this via alias, but we can still specify fields to include.
        projection = {
            "id": 1,
            "title": 1,
            "customer_name": 1,
            "business_unit": 1,
            "current_stage": 1,
            "sales_owner": 1,
            "sales_owner_id": 1,
            "deal_value": 1,
            "risk_level": 1,
            "created_at": 1,
            "last_updated": 1
        }


        opportunities = await db.opportunities.find(query, projection).skip(skip).limit(limit).to_list(limit)
        
        # Ensure 'id' field is present if it was stored as 'id' or '_id'
        for opp in opportunities:
            if "_id" in opp and "id" not in opp:
                opp["id"] = str(opp["_id"])
        
        return opportunities
    except Exception as e:
        logger.error(f"Error listing opportunities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching opportunities"
        )

@router.post("/", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opportunity: OpportunityCreate):
    """
    Create a new opportunity.
    """
    try:
        new_opp = opportunity.dict()
        if await db.opportunities.find_one({"id": new_opp["id"]}):
            raise HTTPException(status_code=400, detail="Opportunity ID already exists")
        
        await db.opportunities.insert_one(new_opp)
        return new_opp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
