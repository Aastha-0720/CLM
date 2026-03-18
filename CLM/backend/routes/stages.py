from fastapi import APIRouter
from mongodb_client import db
from models import StageResponse, StageBase
from typing import List

router = APIRouter(prefix="/stages", tags=["Stages"])

@router.get("", response_model=List[StageResponse])
async def get_stages():
    stages = await db.stages.find().to_list(100)
    if not stages:
        # Return default stages if none in DB
        defaults = [
            {"name": "Opportunity Identified", "key": "opportunity_identified", "count": 0},
            {"name": "Proposal Submission", "key": "proposal_submission", "count": 0},
            {"name": "Negotiation", "key": "negotiation", "count": 0},
            {"name": "Internal Approval", "key": "internal_approval", "count": 0},
            {"name": "Contract Award", "key": "contract_award", "count": 0},
            {"name": "Contract Execution", "key": "contract_execution", "count": 0},
            {"name": "Contract Management", "key": "contract_management", "count": 0},
        ]
        return [{"_id": f"default_{i}", **s} for i, s in enumerate(defaults)]
    
    for s in stages:
        s["_id"] = str(s["_id"])
    return stages
