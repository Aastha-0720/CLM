from fastapi import APIRouter, HTTPException, status
from mongodb_client import db


from models import DashboardSummary

import logging
import asyncio
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple TTL Cache for dashboard summary
_cache = {
    "summary": None,
    "timestamp": None
}
CACHE_TTL_SECONDS = 60

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    """
    Combined dashboard summary endpoint for high performance.
    Uses aggregation pipelines and parallel execution with TTL caching.
    """
    now = datetime.utcnow()
    
    # Check cache
    if _cache.get("summary") and _cache.get("timestamp") and \
       (now - _cache["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
        logger.info("Serving dashboard summary from cache")
        return _cache["summary"]

    start_time = now
    try:
        # Aggregation pipeline
        opps_pipeline = [
            {
                "$facet": {
                    "stats": [
                        {
                            "$group": {
                                "_id": None,
                                "totalCount": {"$sum": 1},
                                "totalRevenue": {"$sum": "$deal_value"},
                                "pendingApprovals": {
                                    "$sum": {"$cond": [{"$eq": ["$current_stage", "internal_approval"]}, 1, 0]}
                                },
                                "pendingSignatures": {
                                    "$sum": {"$cond": [{"$eq": ["$current_stage", "contract_execution"]}, 1, 0]}
                                }
                            }
                        }
                    ],
                    "funnel": [
                        {
                            "$group": {
                                "_id": "$current_stage",
                                "count": {"$sum": 1}
                            }
                        },
                        {"$project": {"name": "$_id", "count": 1, "_id": 0}}
                    ],
                    "recent": [
                        {"$sort": {"last_updated": -1}},
                        {"$limit": 5},
                        {
                            "$project": {
                                "id": 1,
                                "customer": "$customer_name",
                                "deal_value": 1,
                                "current_stage": 1,
                                "businessUnit": "$business_unit"
                            }
                        }
                    ]
                }
            }
        ]

        # Execute aggregation
        results = await asyncio.gather(
            db.opportunities.aggregate(opps_pipeline).to_list(1),
            db.contracts.count_documents({}),
            db.users.count_documents({"status": "Active"})
        )

        opps_data = results[0][0] if results[0] and len(results[0]) > 0 else {}
        total_contracts = results[1]
        active_users = results[2]

        stats_list = opps_data.get("stats", [])
        stats = stats_list[0] if stats_list else {}
        
        recent_opps = opps_data.get("recent", [])
        formatted_recent = []
        for ro in recent_opps:
            if "_id" in ro:
                ro["id"] = str(ro["_id"])
            elif "id" not in ro:
                ro["id"] = "N/A"
            formatted_recent.append(ro)

        summary = {
            "totalOpportunities": stats.get("totalCount", 0),
            "totalContracts": total_contracts,
            "totalRevenue": float(stats.get("totalRevenue", 0.0) or 0.0),
            "activeUsers": active_users,
            "pendingApprovals": stats.get("pendingApprovals", 0),
            "pendingSignatures": stats.get("pendingSignatures", 0),
            "pipelineFunnel": opps_data.get("funnel", []),
            "recentOpportunities": formatted_recent
        }

        # Update cache
        _cache["summary"] = summary
        _cache["timestamp"] = datetime.utcnow()

        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(f"Dashboard summary generated in {duration:.2f}ms")

        return summary
    except Exception as e:
        logger.error(f"Error generating dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_data():
    """
    Seed mock data for testing performance and dashboard functionality.
    """
    try:
        # Clear existing
        await db.opportunities.delete_many({})
        await db.contracts.delete_many({})
        
        now = datetime.utcnow()
        
        # Seed Opportunities
        opps = [
            {"id": "OPP-001", "title": "Enterprise Cloud Migration", "customer_name": "TechCorp Solutions", "business_unit": "Sales", "current_stage": "negotiation", "sales_owner": "Aastha Sharma", "sales_owner_id": "USR-001", "deal_value": 1200000, "risk_level": "High", "created_at": now, "last_updated": now},
            {"id": "OPP-002", "title": "Global Security Audit", "customer_name": "SecureBank Int", "business_unit": "Legal", "current_stage": "proposal_submission", "sales_owner": "John Doe", "sales_owner_id": "USR-002", "deal_value": 450000, "risk_level": "Low", "created_at": now, "last_updated": now},
            {"id": "OPP-003", "title": "Data Center Expansion", "customer_name": "DataFlow Systems", "business_unit": "Sales", "current_stage": "internal_approval", "sales_owner": "Jane Smith", "sales_owner_id": "USR-003", "deal_value": 890000, "risk_level": "Medium", "created_at": now, "last_updated": now},
            {"id": "OPP-004", "title": "AI Implementation Phase 1", "customer_name": "FutureAI Labs", "business_unit": "Sales", "current_stage": "contract_award", "sales_owner": "Aastha Sharma", "sales_owner_id": "USR-001", "deal_value": 2100000, "risk_level": "Low", "created_at": now, "last_updated": now},
            {"id": "OPP-005", "title": "Legacy System Support", "customer_name": "OldGuard Corp", "business_unit": "IT", "current_stage": "negotiation", "sales_owner": "John Doe", "sales_owner_id": "USR-002", "deal_value": 150000, "risk_level": "High", "created_at": now, "last_updated": now},
        ]
        await db.opportunities.insert_many(opps)

        
        # Seed Contracts
        contracts = [
            {"id": "CON-2024-001", "opportunity": "OPP-001", "customer": "TechCorp Solutions", "status": "Pending", "cas_status": "In Review", "signature_status": "Not Started"},
            {"id": "CON-2024-002", "opportunity": "OPP-002", "customer": "SecureBank Int", "status": "Approved", "cas_status": "Approved", "signature_status": "Partial"},
            {"id": "CON-2024-003", "opportunity": "OPP-003", "customer": "DataFlow Systems", "status": "Draft", "cas_status": "Not Started", "signature_status": "Not Started"},
        ]
        await db.contracts.insert_many(contracts)
        
        return {"message": "Data seeded successfully"}
    except Exception as e:
        logger.error(f"Error seeding data: {str(e)}")
        raise HTTPException(status_code=500, detail="Seeding failed")
