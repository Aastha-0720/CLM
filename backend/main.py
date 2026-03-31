import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Query, Form, Header, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import pathlib
from pathlib import Path, PureWindowsPath
import shutil

from database import db
from models import Contract, CAS, DepartmentReviews, Document, ReviewComment, PyObjectId, WhitelistEntry, DigInkDocument
import services
import digink_service
from routes.digink_routes import router as digink_router
from openai import OpenAI
import os

UPLOAD_DIR = pathlib.Path("uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed upload formats
ALLOWED_EXTENSIONS = {'.pdf', '.docx'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", ""),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
)
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# Configure logging
logger = logging.getLogger(__name__)

app = FastAPI(title="CLM Admin Backend")

# Auth Dependencies
async def get_current_user(x_user_role: Optional[str] = Header(None), x_user_email: Optional[str] = Header(None)):
    return {"role": x_user_role, "email": x_user_email}

def require_role(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if not user.get("role"):
            raise HTTPException(status_code=401, detail="Unauthorized")
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return role_checker

async def check_domain_whitelist(email: str):
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address for domain check")
    
    domain = email.split("@")[-1].lower()
    whitelisted = await db.whitelist.find_one({"domain": domain, "isActive": True})
    
    if not whitelisted:
        raise HTTPException(
            status_code=403, 
            detail=f"Access denied: Domain '{domain}' is not whitelisted or is inactive."
        )
    return True

require_superadmin = require_role(["Superadmin"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(digink_router, prefix="/api")

# Configuration from .env
WHITELISTED_DOMAIN = os.getenv("WHITELISTED_DOMAIN", "apeiro.digital")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Aastha Pradhan")
ADMIN_EMAIL = f"{os.getenv('ADMIN_PRE_EMAIL', 'Aastha.Pradhan')}@{WHITELISTED_DOMAIN}"
USER_NAME = os.getenv("USER_NAME", "Rani Sahu")
USER_EMAIL = f"{os.getenv('USER_PRE_EMAIL', 'Rani.Sahu')}@{WHITELISTED_DOMAIN}"
SUPERADMIN_NAME = os.getenv("SUPERADMIN_NAME", "System Superadmin")
SUPERADMIN_EMAIL = f"{os.getenv('SUPERADMIN_PRE_EMAIL', 'superadmin')}@{WHITELISTED_DOMAIN}"

DEMO_USERS = [
    {"name": ADMIN_NAME, "email": ADMIN_EMAIL, "role": "Admin", "password": "Admin@2026", "status": "Active"},
    {"name": "Legal Counsel", "email": f"legal@{WHITELISTED_DOMAIN}", "role": "Legal", "password": "Legal@2026", "status": "Active"},
    {"name": "Finance Controller", "email": f"finance@{WHITELISTED_DOMAIN}", "role": "Finance", "password": "Finance@2026", "status": "Active"},
    {"name": "Compliance Officer", "email": f"compliance@{WHITELISTED_DOMAIN}", "role": "Compliance", "password": "Comply@2026", "status": "Active"},
    {"name": "Procurement Lead", "email": f"procurement@{WHITELISTED_DOMAIN}", "role": "Procurement", "password": "Procure@2026", "status": "Active"},
    {"name": "Sales Manager", "email": f"sales@{WHITELISTED_DOMAIN}", "role": "Sales", "password": "Sales@2026", "status": "Active"},
    {"name": "Operations Manager", "email": f"manager@{WHITELISTED_DOMAIN}", "role": "Manager", "password": "Manager@2026", "status": "Active"},
    {"name": "Chief Executive Officer", "email": f"ceo@{WHITELISTED_DOMAIN}", "role": "CEO", "password": "CEO@2026", "status": "Active"},
    {"name": USER_NAME, "email": USER_EMAIL, "role": "User", "password": "User@2026", "status": "Active"},
    {"name": SUPERADMIN_NAME, "email": SUPERADMIN_EMAIL, "role": "Superadmin", "password": "Super@2026", "status": "Active"},
]

async def log_action(action: str, user: str, role: str, details: str, contract_id: str = None):
    log = {
        "action": action,
        "user_id": user, # Compliance with user request
        "user": user,    # Compatibility with existing frontend
        "role": role,
        "details": details,
        "contract_id": contract_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db.logs.insert_one(log)

@app.on_event("startup")
async def seed_users():
    for user in DEMO_USERS:
        # Check if user with this email already exists
        exists = await db.users.find_one({"email": user["email"]})
        if not exists:
            await db.users.insert_one(user)
    
    # Seed whitelisted domains
    for domain in [WHITELISTED_DOMAIN, "apeiro.digital"]:
        domain_exists = await db.whitelist.find_one({"domain": domain})
        if not domain_exists:
            await db.whitelist.insert_one({
                "domain": domain,
                "isActive": True,
                "createdAt": datetime.utcnow().isoformat()
            })

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    total = await db.contracts.count_documents({})
    under_review = await db.contracts.count_documents({"stage": "Under Review"})
    pending_approval = await db.contracts.count_documents({"stage": "DOA Approval"})
    approved = await db.contracts.count_documents({"status": "Approved"})
    
    return {
        "totalContracts": total,
        "underReview": under_review,
        "pendingApproval": pending_approval,
        "approved": approved
    }

@app.get("/api/admin/health")
async def get_system_health(current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    # Check MongoDB
    db_status = "Down"
    try:
        await db.command("ping")
        db_status = "Running"
    except Exception:
        db_status = "Down"

    # For Email and DigiInk, we check if they are "configured" 
    # (In this case, since we don't have real integrations yet, we return mock but "Running" for demo)
    return {
        "api": "Running",
        "database": db_status,
        "email": "Running", # Mock status
        "digiInk": "Running" # Mock status
    }

@app.post("/api/upload")
async def upload_contracts(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
    
    inserted_count = 0
    for _, row in df.iterrows():
        company_name = str(row.get('company', '')).strip()
        if not company_name or company_name == 'nan':
            company_name = 'Unknown Company'
        
        title = str(row.get('title', f"{company_name} Agreement")).strip()
        if not title or title == 'nan':
            title = f"{company_name} Agreement"
        
        try:
            value = float(str(row.get('value', 0)).replace(',', '').replace('$', ''))
        except:
            value = 0.0
        
        department = str(row.get('department', 'Legal')).strip()
        if department == 'nan':
            department = 'Legal'
        
        stage = str(row.get('stage', 'Under Review')).strip()
        if stage == 'nan':
            stage = 'Under Review'
        
        status = str(row.get('status', 'Pending')).strip()
        if status == 'nan':
            status = 'Pending'
        
        submitted_by = str(row.get('submittedBy', 'Admin')).strip()
        if submitted_by == 'nan':
            submitted_by = 'Admin'
        
        risk_level = str(row.get('riskLevel', 'Medium')).strip()
        if risk_level == 'nan':
            risk_level = 'Medium'
        
        contract = Contract(
            title=title,
            company=company_name,
            value=value,
            department=department,
            stage="Under Review",
            status="Pending"
        )
        
        await db.contracts.insert_one(contract.model_dump(by_alias=True, exclude_none=True))
        inserted_count += 1
        
        # Log bulk upload creation
        await log_action("Create Contract (Bulk)", "Admin", "Admin", 
                         f"Contract '{title}' created via CSV upload", 
                         str(contract.id) if hasattr(contract, 'id') else None)
        
    return {"message": f"Successfully processed and created {inserted_count} contracts."}

@app.get("/api/contracts")
async def get_contracts(stage: str = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if stage:
        query["stage"] = stage
        
    if current_user.get("role") == "User":
        email = current_user.get("email")
        if email:
            query["submittedBy"] = email
        
    cursor = db.contracts.find(query).sort("createdAt", -1)
    contracts = await cursor.to_list(length=1000)
    
    for c in contracts:
        c["id"] = str(c["_id"])
        del c["_id"]
        
    return contracts

@app.get("/api/user/dashboard")
async def get_user_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    user_role = current_user.get("role")
    if not user_email or not user_role:
        raise HTTPException(status_code=400, detail="User context missing")
        
    # Total contracts submitted by this user
    total = await db.contracts.count_documents({"submittedBy": user_email})
    
    # Active reviews for this user's role
    reviews_query = {
        "required_reviewers": user_role,
        f"reviews.{user_role}.status": {"$ne": "Approved"},
        "status": {"$nin": ["Approved", "Rejected"]}
    }
    # Admins see all pending reviews
    if user_role in ["Admin", "Superadmin"]:
        reviews_query = {"status": {"$nin": ["Approved", "Rejected"]}}
        
    pending_reviews = await db.contracts.count_documents(reviews_query)
    
    # Pending approvals for contracts submitted by this user (CAS/DOA stage)
    pending_approvals = await db.contracts.count_documents({
        "submittedBy": user_email,
        "stage": {"$in": ["DOA Approval", "CAS", "CAS Generated"]}
    })
    
    # Expiring soon (Mock logic: contracts expiring in next 30 days)
    # Since dates are strings, this is a simplified count for demo purposes
    now = datetime.utcnow()
    # In a real app we'd use a more robust date comparison
    expiring_soon = await db.contracts.count_documents({
        "submittedBy": user_email,
        "status": "Approved",
        "expiry_date": {"$exists": True, "$ne": ""}
    }) # Simplified check

    return {
        "totalContracts": total,
        "pendingReviews": pending_reviews,
        "pendingApprovals": pending_approvals,
        "expiringSoon": expiring_soon
    }

@app.get("/api/user/contracts")
async def get_my_contracts(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email not found in token")
    
    # Optimization: Sort by createdAt and only find user's contracts
    cursor = db.contracts.find({"submittedBy": user_email}).sort("createdAt", -1)
    contracts = await cursor.to_list(length=100)
    
    for c in contracts:
        c["id"] = str(c["_id"])
        del c["_id"]
    return contracts

@app.get("/api/user/reviews")
async def get_user_reviews(current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role")
    if not user_role:
        raise HTTPException(status_code=400, detail="User role not found in token")
    
    # Optimization: Filter by role and review status in MongoDB
    query = {
        "required_reviewers": user_role,
        f"reviews.{user_role}.status": {"$ne": "Approved"},
        "status": {"$nin": ["Approved", "Rejected"]}
    }
    
    if user_role in ["Admin", "Superadmin"]:
        query = {"status": {"$nin": ["Approved", "Rejected"]}}
        
    cursor = db.contracts.find(query).sort("createdAt", -1)
    contracts = await cursor.to_list(length=100)
    
    for c in contracts:
        c["id"] = str(c["_id"])
        del c["_id"]
    return contracts

@app.get("/api/user/approvals")
async def get_user_approvals(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    user_role = current_user.get("role")
    
    # Only standard users or initiators typically track their own approvals here
    # Optimization: Filter by submittedBy in MongoDB
    query = {
        "submittedBy": user_email,
        "stage": {"$in": ["CAS", "CAS Generated", "DOA Approval"]}
    }
    
    contracts = await db.contracts.find(query).sort("createdAt", -1).to_list(100)
    
    results = []
    for c in contracts:
        cas_record = await db.cas.find_one({"contractId": str(c["_id"])})
        results.append({
            "id": str(c["_id"]),
            "title": c.get("title"),
            "company": c.get("company"),
            "value": c.get("value"),
            "createdAt": c.get("createdAt"),
            "submittedBy": c.get("submittedBy"),
            "status": "Pending",
            "casId": str(cas_record["_id"]) if cas_record else None
        })
    return results

@app.post("/api/contracts/create")
async def create_single_contract(data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    await check_domain_whitelist(current_user.get("email"))
    # Parse required reviewers based on clauses
    clauses = data.get("clauses", [])
    unique_depts = list({c.get("department", "Legal") for c in clauses if c.get("department")})
    if not unique_depts:
        unique_depts = [data.get("department", "Legal")]

    user_email = current_user.get("email", data.get("submittedBy", "Admin"))

    contract = Contract(
        title=data.get("title", "Untitled Contract"),
        company=data.get("company", "Unknown"),
        value=float(data.get("value", 0)),
        department=data.get("department", "Legal"),
        stage=data.get("stage", "Under Review"),
        status=data.get("status", "Pending"),
        submittedBy=user_email,
        duration=data.get("duration"),
        category=data.get("category"),
        risk_classification=data.get("risk_classification", data.get("riskLevel")),
        business_unit=data.get("business_unit", data.get("businessUnit")),
        contract_owner=data.get("contract_owner"),
        expiry_date=data.get("expiry_date"),
        clauses=clauses,
        required_reviewers=unique_depts,
    )
    result = await db.contracts.insert_one(
        contract.model_dump(by_alias=True, exclude_none=True)
    )
    contract_id = str(result.inserted_id)
    
    # Notify each required department role
    for dept in unique_depts:
        await add_notification(
            for_role=dept,
            message=f"New contract '{contract.title}' for {contract.company} assigned for {dept} review.",
            type="assignment",
            contract_id=contract_id,
            contract_title=contract.title,
            action=f"Go to {dept} Review"
        )

    await log_action("Create Contract", user_email, current_user.get("role", "User"),
        f"Contract '{contract.title}' created for {contract.company} (${contract.value:,.0f}) with status {contract.status}",
        contract_id)
    return {
        "message": "Contract created successfully",
        "id": contract_id
    }

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Comments & Reviews API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/contracts/{contract_id}/comments")
async def add_review_comment(contract_id: str, data: dict = Body(...)):
    comment = ReviewComment(
        contractId=contract_id,
        department=data.get("department", ""),
        clauseId=data.get("clauseId"),
        comment=data.get("comment", ""),
        commentedBy=data.get("commentedBy", "Admin"),
        parentId=data.get("parentId")
    )
    result = await db.review_comments.insert_one(
        comment.model_dump(by_alias=True, exclude_none=True)
    )
    new_doc = await db.review_comments.find_one({"_id": result.inserted_id})
    if new_doc:
        new_doc["_id"] = str(new_doc["_id"])
    return new_doc

@app.get("/api/contracts/{contract_id}/comments")
async def get_review_comments(contract_id: str, department: Optional[str] = None):
    query = {"contractId": contract_id}
    if department:
        query["department"] = department
        
    cursor = db.review_comments.find(query).sort("createdAt", 1)
    comments = await cursor.to_list(length=1000)
    for c in comments:
        c["_id"] = str(c["_id"])
    return comments

@app.delete("/api/comments/{comment_id}")
async def delete_review_comment(comment_id: str):
    try:
        result = await db.review_comments.delete_one({"_id": PyObjectId(comment_id)})
        if result.deleted_count == 1:
            return {"message": "Comment deleted successfully"}
        raise HTTPException(status_code=404, detail="Comment not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/contracts/{contract_id}/save-review-comment")
async def save_review_decision(contract_id: str, data: dict = Body(...)):
    # 1. Save decision as a comment
    comment = ReviewComment(
        contractId=contract_id,
        department=data.get("department", ""),
        comment=data.get("comment", ""),
        commentedBy=data.get("reviewedBy", "Admin"),
        status=data.get("status", "Review")
    )
    await db.review_comments.insert_one(
        comment.model_dump(by_alias=True, exclude_none=True)
    )
    
    # 2. Update contract review data inline for backwards compatibility
    dept = data.get("department", "")
    status = data.get("status", "Pending")
    
    update_data = {
        f"reviews.{dept}.status": status,
        f"reviews.{dept}.comments": data.get("comment", ""),
        f"reviews.{dept}.reviewedBy": data.get("reviewedBy", "Admin"),
        f"reviews.{dept}.reviewedAt": datetime.utcnow().isoformat()
    }
    
    await db.contracts.update_one(
        {"_id": PyObjectId(contract_id)},
        {"$set": update_data}
    )
    
    # Log review decision
    await log_action("Review Decision", data.get("reviewedBy", "Admin"), dept, 
                     f"Department {dept} set status to {status}", 
                     contract_id)
                     
    return {"message": "Review decision saved successfully"}

@app.post("/api/contracts/{contract_id}/escalate")
async def escalate_contract(contract_id: str, data: dict = Body(...)):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
        
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    reason = data.get("reason", "")
    department = data.get("department", "Unknown")
    escalatedBy = data.get("escalatedBy", "Admin")
    
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {
            "escalated": True,
            "escalatedBy": escalatedBy,
            "escalatedAt": datetime.utcnow().isoformat(),
            "escalationReason": reason
        }}
    )
    
    title = contract.get("title", "Unknown Contract")
    
    # Create notification for Manager and CEO roles
    for target_role in ["Manager", "CEO"]:
        await db.notifications.insert_one({
            "for_role": target_role,
            "message": f"Contract '{title}' escalated by {department}. Reason: {reason}",
            "contract_id": contract_id,
            "type": "escalation",
            "department": department,
            "read": False,
            "createdAt": datetime.utcnow().isoformat()
        })
        
    return {"message": "Contract escalated successfully"}

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(400, "Invalid contract ID")
    result = await db.contracts.delete_one({"_id": ObjectId(contract_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Contract not found")
    return {"message": "Contract deleted successfully"}

@app.post("/api/contracts/{contract_id}/review")
async def submit_review(contract_id: str, department: str = Body(...), status: str = Body(...), comments: str = Body(""), reviewer: str = Body("Admin"), current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role")
    if user_role not in ["Admin", "Superadmin"] and user_role != department:
        raise HTTPException(status_code=403, detail="Not authorized to review for this department")

    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
        
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # Update the specific department's review
    update_data = {
        f"reviews.{department}.status": status,
        f"reviews.{department}.comments": comments,
        f"reviews.{department}.reviewedBy": reviewer,
        f"reviews.{department}.reviewedAt": services.datetime.utcnow().isoformat()
    }
    
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": update_data}
    )
    
    # Determine next stage
    next_stage = contract.get("stage")
    overall_status = contract.get("status", "Under Review")

    if status == "Approved":
        if department == "Legal":
            next_stage = "Finance Review"
        elif department == "Finance":
            next_stage = "Compliance Review"
        elif department == "Compliance":
            next_stage = "Procurement Review"
        elif department == "Procurement":
            next_stage = "CAS Generated"
            overall_status = "Approved by Reviewers"
            
        # Persist the next stage and overall status
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"stage": next_stage, "status": overall_status}}
        )
    elif status in ["Comment", "Change Request", "Suggest Changes"]:
        pass # Do not change stage or stop workflow
    else:
        # If Rejected by any department, stop workflow
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"status": "Rejected", "stage": "Rejected"}}
        )
        return {"message": f"Contract rejected by {department}"}

    # ─── Notification insertion for next department ───
    notification_map = {
        "Legal": {
            "for_role": "Finance",
            "message": "Legal has approved '{title}'. You can now review it.",
            "action": "Go to Finance Review"
        },
        "Finance": {
            "for_role": "Compliance",
            "message": "Finance has approved '{title}'. You can now review it.",
            "action": "Go to Compliance Review"
        },
        "Compliance": {
            "for_role": "Procurement",
            "message": "Compliance has approved '{title}'. You can now review it.",
            "action": "Go to Procurement Review"
        },
        "Procurement": {
            "for_role": "Admin",
            "message": "All reviews complete for {title}. CAS generated!",
            "action": "Go to CAS"
        }
    }

    if status == "Approved" and department in notification_map:
        notif = notification_map[department]
        await add_notification(
            for_role=notif["for_role"],
            message=notif["message"].format(title=contract.get("title", "")),
            contract_id=contract_id,
            contract_title=contract.get("title", ""),
            action=notif["action"],
            type="approval"
        )

    # Check if we moved to CAS Generated
    if next_stage == "CAS Generated":
        updated_contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        # Notify the initiator (User role)
        await add_notification(
            for_user=updated_contract.get("submittedBy"),
            message=f"CAS has been generated for your contract '{updated_contract.get('title')}'. Please review and approve.",
            type="cas_ready",
            contract_id=contract_id,
            contract_title=updated_contract.get("title"),
            action="Go to Approvals"
        )
        updated_contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        cas_doc = services.generate_cas_document(
            contract_id=str(contract_id),
            contract_title=updated_contract.get("title", ""),
            value=updated_contract.get("value", 0),
            initiator=updated_contract.get("submittedBy", "Admin")
        )
        await db.cas.insert_one(cas_doc.model_dump(by_alias=True, exclude_none=True))

    title = contract.get('title', 'Unknown Contract')
    await log_action("Contract Review", reviewer, department,
        f"{department} {status.lower()} '{title}'. Comments: {comments[:80] if comments else 'None'}")

    return {"message": "Review submitted successfully", "next_stage": next_stage}

@app.post("/api/contracts/{contract_id}/approve")
async def approve_cas_contract(contract_id: str, action: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "User":
        raise HTTPException(403, "Only Standard Users can perform CAS approvals")
    
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(400, "Invalid contract ID")
        
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(404, "Contract not found")
        
    if action == "approve":
        # Move to DOA Approval or similar
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"stage": "DOA Approval", "status": "Pending DOA"}}
        )
        # Update CAS record as well if it exists
        await db.cas.update_one(
            {"contractId": contract_id},
            {"$set": {"status": "Approved by CAS Reviewer"}}
        )
        return {"message": "Contract approved at CAS stage"}
    else:
        # Reject
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"stage": "Rejected", "status": "Rejected"}}
        )
        await db.cas.update_one(
            {"contractId": contract_id},
            {"$set": {"status": "Rejected"}}
        )
        return {"message": "Contract rejected at CAS stage"}

    return {"message": "Contract rejected at CAS stage"}

@app.post("/api/contracts/{contract_id}/generate-cas")
async def manual_generate_cas(contract_id: str):
    # Endpoint to manually generate CAS if needed
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    cas_doc = services.generate_cas_document(
        contract_id=str(contract_id),
        contract_title=contract.get("title", ""),
        value=contract.get("value", 0),
        initiator=contract.get("submittedBy", "Admin")
    )
    await db.cas.insert_one(cas_doc.model_dump(by_alias=True, exclude_none=True))
    
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"stage": "DOA Approval"}}
    )
    
    return {"message": "CAS generated and contract moved to DOA Approval"}

@app.get("/api/cas")
async def get_cas():
    cursor = db.cas.find({})
    cas_records = await cursor.to_list(length=1000)
    for c in cas_records:
        c["id"] = str(c["_id"])
        del c["_id"]
    return cas_records

@app.delete("/api/cas/{cas_id}")
async def delete_cas_record(cas_id: str):
    if not ObjectId.is_valid(cas_id):
        raise HTTPException(400, "Invalid CAS ID")
    result = await db.cas.delete_one({"_id": ObjectId(cas_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "CAS not found")
    return {"message": "CAS deleted successfully"}

@app.get("/api/contracts/{contract_id}/editor-content")
async def get_editor_content(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # If draftText already exists, return it
    if contract.get("draftText"):
        return {"content": contract["draftText"]}
    
    # Otherwise, extract from latest document
    doc = await db.documents.find_one({"contractId": contract_id}, sort=[("uploadedAt", -1)])
    if not doc:
        return {"content": f"# {contract.get('title', 'Contract')}\n\nStart editing here..."}
    
    file_path = pathlib.Path(doc["storagePath"])
    if not file_path.exists():
        return {"content": f"# {contract.get('title')}\n\n[Document file not found on disk]"}
    
    try:
        with open(file_path, "rb") as f:
            contents = f.read()
        
        text = ""
        if doc["fileName"].endswith('.pdf'):
            import PyPDF2
            from io import BytesIO
            pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
        elif doc["fileName"].endswith('.docx'):
            import docx
            from io import BytesIO
            doc_file = docx.Document(BytesIO(contents))
            text = "\n".join([p.text for p in doc_file.paragraphs])
        else:
            text = contents.decode('utf-8', errors='ignore')
        
        return {"content": text or "No text content extracted."}
    except Exception as e:
        return {"content": f"Error extracting text: {str(e)}"}

@app.post("/api/contracts/{contract_id}/save-editor-content")
async def save_editor_content(contract_id: str, data: dict = Body(...)):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    content = data.get("content", "")
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"draftText": content}}
    )
    
    # Generate a new file version
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    last_doc = await db.documents.find_one({"contractId": contract_id}, sort=[("version", -1)])
    
    version = (last_doc["version"] + 1) if last_doc else 1
    base_name = last_doc["fileName"] if last_doc else f"{contract.get('title', 'contract')}.docx"
    
    # Strip existing version prefix if present to avoid v1_v2_v3...
    import re
    clean_name = re.sub(r'^v\d+_', '', base_name)
    
    # Ensure we use an appropriate extension for the generated content
    if not (clean_name.endswith('.pdf') or clean_name.endswith('.docx')):
        clean_name += ".docx"
    
    new_file_name = f"v{version}_{clean_name}"
    contract_dir = UPLOAD_DIR / contract_id
    contract_dir.mkdir(parents=True, exist_ok=True)
    file_path = contract_dir / new_file_name
    
    try:
        if clean_name.endswith('.pdf'):
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=11)
            # Handle multi-line text
            for line in content.split('\n'):
                pdf.multi_cell(0, 10, txt=line)
            pdf.output(str(file_path))
            file_type = "application/pdf"
        else: # Default to DOCX
            import docx
            doc = docx.Document()
            for line in content.split('\n'):
                doc.add_paragraph(line)
            doc.save(str(file_path))
            file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            
        # Create new document record
        new_doc = Document(
            contractId=contract_id,
            fileName=clean_name,
            fileType=file_type,
            fileSize=file_path.stat().st_size,
            storagePath=str(file_path),
            version=version,
            uploadedBy=data.get("user", "Admin"),
            category=last_doc["category"] if last_doc else "General"
        )
        await db.documents.insert_one(new_doc.model_dump(by_alias=True, exclude_none=True))
        
        # Log contract edit/save
        await log_action("Edit Contract", data.get("user", "Admin"), "User", 
                         f"Saved new version (v{version}) of contract via editor", 
                         contract_id)
        
        return {"message": f"Contract saved successfully (Version {version})", "version": version}
    except Exception as e:
        print(f"Error generating file: {e}")
        return {"message": "Content saved to database, but file generation failed", "error": str(e)}

@app.post("/api/cas/{cas_id}/approve")
async def approve_cas(cas_id: str, action: str = Body(...)):
    # Action can be Approve or Reject
    cas = await db.cas.find_one({"_id": ObjectId(cas_id)})
    if not cas:
        raise HTTPException(status_code=404, detail="CAS not found")
        
    new_status = "Approved" if action == "Approve" else "Rejected"
    await db.cas.update_one(
        {"_id": ObjectId(cas_id)},
        {"$set": {"status": new_status}}
    )
    
    contract_id = cas.get("contractId")
    if contract_id and ObjectId.is_valid(contract_id):
        contract_status = "Approved" if action == "Approve" else "Rejected"
        contract_stage = "Approved" if action == "Approve" else "Under Review"
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {
                "status": contract_status,
                "stage": contract_stage
            }}
        )

    await log_action("CAS Approval", "Admin", "Admin",
        f"CAS for contract ID {cas.get('contractId', '?')} was {new_status.lower()}",
        str(cas.get('contractId')))

    if new_status == "Approved":
        await add_notification(
            for_user=cas.get("initiator"),
            message=f"CAS for '{cas.get('contractTitle')}' has been approved. Contract is now ready for signature.",
            type="signature_ready",
            contract_id=cas.get("contractId"),
            contract_title=cas.get("contractTitle"),
            action="View Contract"
        )

    return {"message": f"CAS {new_status}"}

@app.post("/api/cas/{cas_id}/approve-step")
async def approve_cas_step(cas_id: str, data: dict = Body(...)):
    step_index = data.get("stepIndex")
    approved_by = data.get("approvedBy", "Admin")
    timestamp = datetime.utcnow().isoformat()

    if not ObjectId.is_valid(cas_id):
        raise HTTPException(400, "Invalid CAS ID")

    await db.cas.update_one(
        {"_id": ObjectId(cas_id)},
        {"$set": {
            f"approvalChain.{step_index}.status": "Approved",
            f"approvalChain.{step_index}.approvedBy": approved_by,
            f"approvalChain.{step_index}.timestamp": timestamp
        }}
    )

    cas = await db.cas.find_one({"_id": ObjectId(cas_id)})
    chain = cas.get("approvalChain", [])
    if all(s.get("status") == "Approved" for s in chain):
        await db.cas.update_one(
            {"_id": ObjectId(cas_id)},
            {"$set": {"status": "Approved"}}
        )
        if cas.get("contractId") and ObjectId.is_valid(cas.get("contractId")):
            await db.contracts.update_one(
                {"_id": ObjectId(cas.get("contractId"))},
                {"$set": {"status": "Approved", "stage": "Approved"}}
            )
            await add_notification(
                for_user=cas.get("initiator"),
                message=f"All CAS approval steps complete for '{cas.get('contractTitle')}'. Ready for signature.",
                type="signature_ready",
                contract_id=cas.get("contractId"),
                contract_title=cas.get("contractTitle")
            )
            
    # Log approval step
    await log_action("CAS Approval Step", approved_by, "Approver", 
                     f"Approved step {step_index} in CAS chain", 
                     str(cas.get("contractId")))
                     
    return {"message": "Step approved successfully"}

@app.post("/api/contracts/doa/{contract_id}/{action}")
async def doa_approval(contract_id: str, action: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
        
    status = "Approved" if action.lower() == "approve" else "Rejected"
    stage = "Approved" if action.lower() == "approve" else "Under Review"
    
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"status": status, "stage": stage, "updatedAt": datetime.utcnow().isoformat()}}
    )
    title = contract.get('title', 'Unknown Contract') if contract else 'Unknown Contract'
    await log_action("DOA Approval", "Admin", "CEO/Manager",
        f"DOA {action.lower()}d: '{title}' is now {status}",
        contract_id)
        
    if status == "Approved":
        await add_notification(
            for_user=contract.get("submittedBy"),
            message=f"DOA Approval granted for '{title}'. Contract finalized.",
            type="doa_approved",
            contract_id=contract_id,
            contract_title=title
        )
    return {"message": f"Contract {action}d via DOA successfully"}

# ─── Notification Endpoints ───

@app.get("/api/notifications")
async def get_notifications(
    role: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    user_email = current_user.get("email")
    
    # Query for notifications that are:
    # 1. Unread
    # 2. Targeted at this user by email OR targeted at this user's role
    query = {"read": False}
    
    or_filters = []
    if role:
        or_filters.append({"for_role": role})
    if user_email:
        or_filters.append({"for_user": user_email})
        
    if or_filters:
        query["$or"] = or_filters
        
    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifs = await cursor.to_list(length=100)
    
    # Check for near-term expiries for the user and auto-generate alerts if needed
    if user_email:
        await check_and_notify_expiries(user_email)
        # Re-fetch if we might have added new ones (simplification for demo)
        cursor = db.notifications.find(query).sort("createdAt", -1)
        notifs = await cursor.to_list(length=100)

    for n in notifs:
        n["id"] = str(n["_id"])
        del n["_id"]
    return notifs

async def check_and_notify_expiries(user_email: str):
    # Find active contracts owned/submitted by this user that expire within 30 days
    # (Mock logic for demo: we'll look for contracts with expiry_date)
    # real production would use a background task, but for this app this is a good trigger.
    now = datetime.utcnow()
    # In a real app we'd parse the date, for now we'll just check if field exists 
    # and we haven't notified in the last 24h
    contracts = await db.contracts.find({
        "submittedBy": user_email,
        "expiry_date": {"$exists": True, "$ne": None},
        "status": "Approved"
    }).to_list(100)
    
    for c in contracts:
        # Check if we already notified for this contract recently
        existing = await db.notifications.find_one({
            "for_user": user_email,
            "contract_id": str(c["_id"]),
            "type": "expiry_alert"
        })
        if not existing:
            await add_notification(
                for_user=user_email,
                message=f"Contract '{c.get('title')}' is approaching its expiry date.",
                type="expiry_alert",
                contract_id=str(c["_id"]),
                contract_title=c.get("title")
            )

async def add_notification(for_role=None, for_user=None, message="", type="info", contract_id=None, contract_title=None, action=None):
    notif = {
        "message": message,
        "type": type,
        "read": False,
        "createdAt": datetime.utcnow().isoformat()
    }
    if for_role: notif["for_role"] = for_role
    if for_user: notif["for_user"] = for_user
    if contract_id: notif["contract_id"] = contract_id
    if contract_title: notif["contract_title"] = contract_title
    if action: notif["action"] = action
    
    await db.notifications.insert_one(notif)

@app.post("/api/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, role: Optional[str] = Query(None)):
    if not ObjectId.is_valid(notif_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}}
    )
    # Return updated unread list for the role
    query = {"read": False}
    if role:
        query["for_role"] = role
    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifs = await cursor.to_list(length=100)
    for n in notifs:
        n["id"] = str(n["_id"])
        del n["_id"]
    return notifs

# ─── Whitelist Endpoints (SuperAdmin only) ───

@app.get("/api/whitelist")
async def get_whitelist(current_user: dict = Depends(require_superadmin)):
    cursor = db.whitelist.find({})
    entries = await cursor.to_list(length=100)
    for e in entries:
        e["id"] = str(e["_id"])
        del e["_id"]
    return entries

@app.post("/api/whitelist")
async def add_whitelist_domain(entry: WhitelistEntry, current_user: dict = Depends(require_superadmin)):
    domain = entry.domain.lower().strip()
    existing = await db.whitelist.find_one({"domain": domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already whitelisted")
    
    new_entry = {
        "domain": domain,
        "isActive": True,
        "createdAt": datetime.utcnow().isoformat()
    }
    result = await db.whitelist.insert_one(new_entry)
    new_entry["id"] = str(result.inserted_id)
    del new_entry["_id"]
    
    await log_action("Add Whitelist Domain", current_user["email"], current_user.get("role", "Superadmin"), f"Added domain: {domain}")
    return new_entry

@app.put("/api/whitelist/{domain_id}")
async def toggle_whitelist_domain(domain_id: str, data: dict = Body(...), current_user: dict = Depends(require_superadmin)):
    if not ObjectId.is_valid(domain_id):
        raise HTTPException(status_code=400, detail="Invalid domain ID")
    
    is_active = data.get("isActive", False)
    result = await db.whitelist.update_one(
        {"_id": ObjectId(domain_id)},
        {"$set": {"isActive": is_active}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Domain not found")
        
    await log_action("Toggle Whitelist Domain", current_user["email"], current_user.get("role", "Superadmin"), f"Set domain {domain_id} isActive to {is_active}")
    return {"message": "Domain updated successfully"}

# ─── Admin Endpoints ───

@app.delete("/api/admin/clear-all")
async def clear_all():
    await db.contracts.delete_many({})
    await db.cas.delete_many({})
    await db.notifications.delete_many({})
    return {"message": "All data cleared"}

@app.delete("/api/admin/clear-notifications")
async def clear_notifs():
    await db.notifications.delete_many({})
    return {"message": "Notifications cleared"}

@app.delete("/api/admin/clear-cas")
async def clear_cas():
    await db.cas.delete_many({})
    return {"message": "CAS records cleared"}

@app.put("/api/admin/doa-thresholds")
async def update_doa(thresholds: dict = Body(...)):
    await db.settings.update_one(
        {"key": "doa_thresholds"},
        {"$set": {"value": thresholds}},
        upsert=True
    )
    return {"message": "DOA thresholds updated"}

@app.get("/api/admin/users")
async def get_users(current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    users = await db.users.find({}).to_list(100)
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
        u.pop("password", None)  # Never send password
    return users

@app.post("/api/admin/users")
async def add_user(user: dict = Body(...), current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    existing = await db.users.find_one({"email": user.get("email")})
    if existing:
        raise HTTPException(400, "User already exists")
    
    user["status"] = "Active"
    user["createdAt"] = datetime.utcnow().isoformat()
    if "role" not in user or not user["role"]:
        user["role"] = "User"
    
    result = await db.users.insert_one(user)
    user["id"] = str(result.inserted_id)
    
    await log_action("Create User", "Superadmin", "Superadmin", 
                     f"Created user {user.get('email')} with role {user.get('role')}")
    
    return user

@app.put("/api/admin/users/{user_id}")
async def update_user_details(user_id: str, data: dict = Body(...), current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")
    
    # Check if we're trying to update email to one that already exists
    if "email" in data:
        existing = await db.users.find_one({"email": data["email"], "_id": {"$ne": ObjectId(user_id)}})
        if existing:
            raise HTTPException(400, "Email already in use by another account")

    update_data = {}
    if "name" in data: update_data["name"] = data["name"]
    if "email" in data: update_data["email"] = data["email"]
    if "role" in data: update_data["role"] = data["role"]
    if "status" in data: update_data["status"] = data["status"]
    if "password" in data and data["password"]: update_data["password"] = data["password"]

    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
        
    await log_action("Update User", "Superadmin", "Superadmin", 
                     f"Updated user {data.get('email', user_id)}. Fields: {', '.join(update_data.keys())}")
    
    return {"message": "User updated successfully"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "User deleted successfully"}

@app.get("/api/admin/users-with-auth")
async def get_users_auth():
    # Only for login validation - includes password
    users = await db.users.find({}).to_list(100)
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
    return users

@app.post("/api/login")
async def login(credentials: dict = Body(...)):
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Check Domain Whitelist
    await check_domain_whitelist(email)
    
    # Verify User
    user = await db.users.find_one({"email": email, "password": password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.get("status") != "Active":
        raise HTTPException(status_code=403, detail="User account is inactive")
        
    user["id"] = str(user["_id"])
    del user["_id"]
    user.pop("password", None)
    
    await log_action("Login", email, user.get("role", "User"), "User logged in successfully")
    return user

@app.get("/api/admin/audit-logs")
async def get_audit_logs(current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    logs = await db.logs.find({}).sort("timestamp", -1).to_list(100)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs

@app.delete("/api/admin/audit-logs/{log_id}")
async def delete_audit_log(log_id: str, current_user: dict = Depends(require_role(["Admin", "Superadmin"]))):
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=400, detail="Invalid log ID")
    result = await db.logs.delete_one({"_id": ObjectId(log_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted successfully"}

@app.get("/api/user/audit-logs")
async def get_user_audit_logs(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email not found in token")
        
    query = {"$or": [{"user": user_email}, {"user_id": user_email}]}
    logs = await db.logs.find(query).sort("timestamp", -1).to_list(200)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs

@app.get("/api/activity")
async def get_user_activity(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email not found in token")
        
    query = {"$or": [{"user": user_email}, {"user_id": user_email}]}
    logs = await db.logs.find(query).sort("timestamp", -1).to_list(20)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs


@app.post("/api/ai/analyze-contract")
async def analyze_contract(data: dict = Body(...)):
    try:
        document_text = data.get("document_text", "")
        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": """You are a contract analyzer. Analyze the contract 
                and return ONLY a JSON object with these keys:
                {
                  "status": "success",
                  "riskScore": "Low/Medium/High",
                  "missingTerms": ["term1", "term2"],
                  "extractedClauses": {
                    "liability": "...",
                    "payment": "...",
                    "termination": "...",
                    "compliance": "..."
                  },
                  "summary": "2-3 line summary"
                }
                No explanation, no markdown, just JSON."""
            }, {
                "role": "user",
                "content": f"Analyze this contract:\n\n{document_text[:4000]}"
            }],
            max_tokens=1000
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        return {
            "status": "error",
            "riskScore": "Medium",
            "missingTerms": [],
            "extractedClauses": {},
            "summary": "Analysis failed"
        }

@app.post("/api/ai/extract-email")
async def extract_email(data: dict = Body(...)):
    try:
        email_text = data.get("email_text", "")
        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": """You are a contract data extractor.
Extract contract information from the email text.
Return ONLY a valid JSON object with exactly these keys:
{
  "counterpartyName": "company or person name",
  "contractValue": "amount with currency symbol",
  "subject": "contract type or title",
  "dates": "start date - end date"
}
IMPORTANT: Return raw JSON only. No markdown, no backticks, no explanation."""
            }, {
                "role": "user",
                "content": f"Extract contract info from this email:\n\n{email_text[:3000]}"
            }],
            max_tokens=500,
            temperature=0
        )
        import json, re
        raw = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()
        result = json.loads(raw)
        # Make sure all required keys exist
        return {
            "counterpartyName": result.get("counterpartyName", ""),
            "contractValue": result.get("contractValue", ""),
            "subject": result.get("subject", ""),
            "dates": result.get("dates", "")
        }
    except Exception as e:
        print(f"Email extraction error: {e}")
        return {
            "counterpartyName": "",
            "contractValue": "",
            "subject": "",
            "dates": ""
        }

@app.post("/api/ai/generate-cas-notes")
async def generate_cas_notes(data: dict = Body(...)):
    try:
        contract_id = data.get("contract_id", "")
        contract = await db.contracts.find_one(
            {"_id": ObjectId(contract_id)}
        ) if ObjectId.is_valid(contract_id) else None
        
        if not contract:
            return {"key_notes": "Standard terms applied."}

        reviews = contract.get("reviews", {})
        review_comments = []
        for dept, review in reviews.items():
            if review.get("comments"):
                review_comments.append(
                    f"{dept}: {review['comments']}"
                )

        prompt = f"""Contract: {contract.get('title')}
Value: ${contract.get('value', 0):,}
Company: {contract.get('company')}
Review comments: {'; '.join(review_comments)}

Generate professional CAS key notes in 2-3 sentences."""

        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": "You are a legal document writer. Write professional contract approval notes."
            }, {
                "role": "user",
                "content": prompt
            }],
            max_tokens=300
        )
        key_notes = response.choices[0].message.content.strip()
        
        if ObjectId.is_valid(contract_id):
            await db.cas.update_one(
                {"contractId": contract_id},
                {"$set": {"keyNotes": key_notes}}
            )
        
        return {"key_notes": key_notes}
    except Exception as e:
        return {"key_notes": "Standard terms applied."}

@app.post("/api/contracts/{contract_id}/documents")
async def upload_document(
    contract_id: str,
    file: UploadFile = File(...),
    uploadedBy: str = Form("Admin"),
    category: str = Form("General"),
    tags: str = Form(""),
):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")

    # Validate file format
    file_ext = pathlib.Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file_ext}'. Only PDF and DOCX files are allowed."
        )

    # Check file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_FILE_SIZE_MB}MB allowed.")

    # Determine version
    existing_count = await db.documents.count_documents({"contractId": contract_id})
    version = existing_count + 1

    # Save file to disk
    contract_dir = UPLOAD_DIR / contract_id
    contract_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"v{version}_{file.filename}"
    file_path = contract_dir / safe_name
    with open(file_path, "wb") as f:
        f.write(contents)

    file_type = file.content_type
    if not file_type or file_type == "application/octet-stream":
        if file.filename.endswith('.pdf'):
            file_type = "application/pdf"
        elif file.filename.endswith('.docx'):
            file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            file_type = "application/octet-stream"

    # Save metadata to MongoDB
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    doc = Document(
        contractId=contract_id,
        fileName=file.filename,
        fileType=file_type,
        fileSize=len(contents),
        storagePath=str(file_path),
        version=version,
        uploadedBy=uploadedBy,
        category=category,
        tags=tag_list,
    )
    result = await db.documents.insert_one(
        doc.model_dump(by_alias=True, exclude_none=True)
    )
    return {
        "message": "File uploaded successfully",
        "documentId": str(result.inserted_id),
        "version": version,
        "fileName": file.filename,
        "fileSize": len(contents),
    }

@app.get("/api/contracts/{contract_id}/documents")
async def list_documents(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    cursor = db.documents.find({"contractId": contract_id}).sort("uploadedAt", -1)
    docs = await cursor.to_list(length=100)
    for d in docs:
        d["id"] = str(d["_id"])
        del d["_id"]
    return docs

@app.get("/api/documents/{document_id}/download")
async def download_document(document_id: str):
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = pathlib.Path(doc["storagePath"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=str(file_path),
        filename=doc["fileName"],
        media_type=doc["fileType"],
        content_disposition_type="inline"
    )

@app.get("/api/documents/{document_id}/view")
async def get_document_view_data(document_id: str):
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = pathlib.Path(doc["storagePath"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    file_extension = pathlib.Path(doc["fileName"]).suffix.lower()
    
    if file_extension == ".pdf":
        return {"type": "pdf", "url": f"/api/documents/{document_id}/download"}
    
    elif file_extension == ".docx":
        import docx
        doc_obj = docx.Document(file_path)
        html_content = ""
        for para in doc_obj.paragraphs:
            if not para.text.strip():
                continue
            
            p_html = "<p>"
            for run in para.runs:
                text = run.text
                if run.bold:
                    text = f"<strong>{text}</strong>"
                if run.italic:
                    text = f"<em>{text}</em>"
                p_html += text
            p_html += "</p>"
            html_content += p_html
            
        return {"type": "docx", "content": html_content}
    
    else:
        # Fallback for text files or unknown
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return {"type": "text", "content": content}
        except Exception:
            return {"type": "unsupported", "message": "This file type cannot be viewed in-app."}

@app.get("/api/contracts/{contract_id}/comments")
async def get_contract_comments(contract_id: str, department: Optional[str] = None):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    query = {"contractId": contract_id}
    if department:
        query["department"] = department
        
    cursor = db.comments.find(query).sort("createdAt", 1)
    comments = await cursor.to_list(length=100)
    for c in comments:
        c["id"] = str(c["_id"])
        del c["_id"]
    return comments

@app.post("/api/contracts/{contract_id}/comments")
async def add_contract_comment(contract_id: str, comment_data: ReviewComment):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    comment_dict = comment_data.model_dump(by_alias=True, exclude_none=True)
    comment_dict["contractId"] = contract_id
    
    result = await db.comments.insert_one(comment_dict)
    return {
        "message": "Comment added successfully",
        "commentId": str(result.inserted_id)
    }

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Delete file from disk
    file_path = pathlib.Path(doc["storagePath"])
    if file_path.exists():
        file_path.unlink()
    await db.documents.delete_one({"_id": ObjectId(document_id)})
    return {"message": "Document deleted successfully"}

@app.post("/api/ai/generate-draft")
async def generate_draft(data: dict = Body(...)):
    try:
        prompt = f"""Generate a professional contract draft for:
Title: {data.get('title')}
Counterparty: {data.get('counterpartyName')}
Value: {data.get('contractValue')}
Duration: {data.get('duration')}
Business Unit: {data.get('businessUnit')}
Category: {data.get('category')}
Risk Level: {data.get('riskLevel')}

Write a professional contract with sections:
1. Parties
2. Scope of Work
3. Consideration and Payment Terms
4. Duration
5. Risk Assessment
6. Liability and Indemnity
7. Termination
8. Confidentiality

Use markdown # for title and ## for sections.
Keep it professional and concise."""

        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": "You are a professional contract writer. Write clear, professional contract drafts in markdown format."
            }, {
                "role": "user",
                "content": prompt
            }],
            max_tokens=1500
        )
        draft = response.choices[0].message.content.strip()
        return {"draft": draft}
    except Exception as e:
        return {
            "draft": f"# {data.get('title', 'Contract')}\n\n## Standard Terms\nStandard terms applied."
        }

@app.post("/api/contracts/save-draft")
async def save_draft(data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    await check_domain_whitelist(current_user.get("email"))
    try:
        await log_action("Save Draft", data.get("submittedBy", "Admin"), data.get("submittedBy", "Admin"),
            f"Draft saved: '{data.get('title', 'Untitled')}' for {data.get('company', 'Unknown')}'",
            str(result.inserted_id) if result else None)
        contract = Contract(
            title=data.get("title", "Draft Contract"),
            company=data.get("company", "Unknown"),
            value=float(data.get("value", 0)),
            department=data.get("department", "Legal"),
            stage="Draft",
            status="Draft",
            submittedBy=data.get("submittedBy", "Admin"),
            category=data.get("category", "General"),
            riskLevel=data.get("riskLevel", "Medium"),
            duration=data.get("duration", ""),
            startDate=data.get("startDate", ""),
            endDate=data.get("endDate", ""),
            expiryDate=data.get("expiryDate", "")
        )
        result = await db.contracts.insert_one(
            contract.model_dump(by_alias=True, exclude_none=True)
        )
        draft_text = data.get("draftText", "")
        if draft_text:
            await db.contracts.update_one(
                {"_id": result.inserted_id},
                {"$set": {"draftText": draft_text}}
            )
        return {
            "message": "Draft saved successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/extract-file")
async def extract_file(file: UploadFile = File(...)):
    logger.info(f"AI Extraction started for file: {file.filename}")
    try:
        # Validate file format
        file_ext = pathlib.Path(file.filename or "").suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"Unsupported file type: {file_ext}")
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{file_ext}'. Only PDF and DOCX files are allowed."
            )

        contents = await file.read()
        logger.info(f"File read successful. Size: {len(contents)} bytes")

        # Validate file size (rejection if empty)
        if len(contents) == 0:
            logger.warning("Empty file received for AI extraction.")
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty. Please upload a valid contract document."
            )

        size_mb = len(contents) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            logger.warning(f"File too large: {size_mb:.2f} MB")
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max {MAX_FILE_SIZE_MB}MB allowed."
            )

        text = ""
        
        if file.filename.endswith('.pdf'):
            try:
                import PyPDF2
                from io import BytesIO
                pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
                logger.info(f"PDF text extraction complete. Length: {len(text)}")
            except Exception as e:
                logger.error(f"PyPDF2 error: {e}")
                raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
        elif file.filename.endswith('.docx'):
            try:
                import docx
                from io import BytesIO
                doc = docx.Document(BytesIO(contents))
                text = "\n".join([p.text for p in doc.paragraphs])
                logger.info(f"DOCX text extraction complete. Length: {len(text)}")
            except Exception as e:
                logger.error(f"python-docx error: {e}")
                raise HTTPException(status_code=500, detail=f"DOCX extraction error: {str(e)}")
        else:
            text = contents.decode('utf-8', errors='ignore')

        if not text.strip():
            logger.warning("No text extracted from document.")
            return {
                "status": "warning",
                "message": "No text could be extracted from the document. It might be an image-only PDF.",
                "counterparty": "",
                "contractValue": "",
                "duration": "",
                "keyDates": "",
                "clauses": []
            }

        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": """Extract contract info. Return ONLY JSON:
                {
                  "counterparty": "",
                  "contractValue": "",
                  "duration": "",
                  "keyDates": "",
                  "clauses": [
                    {"text": "", "type": "", "department": ""}
                  ]
                }
                Departments: Legal, Finance, Compliance, Procurement"""
            }, {
                "role": "user",
                "content": f"Extract from:\n\n{text[:6000]}"
            }],
            max_tokens=1500,
            temperature=0
        )
        
        import json, re
        raw = response.choices[0].message.content.strip()
        logger.info(f"AI raw response received: {raw[:100]}...")
        
        # Strip markdown code blocks if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()
        
        try:
            result = json.loads(raw)
            return {**result, "status": "success"}
        except json.JSONDecodeError as e:
            logger.error(f"JSON Parse Error: {e}. Raw content: {raw}")
            # Try to find JSON in the content if it's not raw JSON
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                result = json.loads(match.group(0))
                return {**result, "status": "success"}
            raise e

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"File extraction error: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "counterparty": "",
            "contractValue": "",
            "duration": "",
            "keyDates": "",
            "clauses": []
        }

@app.post("/api/contracts/{contract_id}/send-for-signature")
async def send_for_signature(contract_id: str, current_user: dict = Depends(get_current_user)):
    print(f"DEBUG: Entering send_for_signature for contract_id: {contract_id}")
    if not ObjectId.is_valid(contract_id):
        print(f"DEBUG: Invalid contract_id: {contract_id}")
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    # 1. Fetch Contract
    print(f"DEBUG: Fetching contract {contract_id} from DB...")
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        print(f"DEBUG: Contract {contract_id} not found in DB")
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # 2. Fetch Document
    print(f"DEBUG: Fetching latest document for contract {contract_id}")
    doc = await db.documents.find_one({"contractId": contract_id}, sort=[("uploadedAt", -1)])
    if not doc:
        print(f"DEBUG: No document found for contract {contract_id}")
        raise HTTPException(status_code=404, detail="No document found for this contract")
    
    # 2.1 Robust Path Resolution
    # storagePath is the field set by the upload endpoint
    db_path = doc.get("storagePath") or doc.get("file_path", "")
    print(f"DEBUG: DB Document storagePath: {db_path}")
    
    # Extract filename correctly regardless of it being a Windows or Linux path
    filename = PureWindowsPath(db_path).name if db_path else doc.get("fileName", "")
    print(f"DEBUG: Extracted filename: {filename}")
    
    # Search for the file in possible locations (only accept actual files, not directories)
    candidate_paths = [
        # 1. Exact stored path
        db_path,
        # 2. Inside contract-specific folder in uploads/ (Modern convention)
        os.path.join("uploads", contract_id, filename) if filename else None,
        # 3. Directly in uploads/
        os.path.join("uploads", filename) if filename else None,
        # 4. In uploaded_contracts/ (Legacy convention)
        os.path.join("uploaded_contracts", filename) if filename else None,
    ]
    
    file_path = None
    for path in candidate_paths:
        if path and os.path.isfile(path):  # isfile() rejects directories
            file_path = path
            print(f"DEBUG: Successfully resolved file to: {file_path}")
            break
    
    if not file_path:
        # Last resort: walk the contract upload dir and find any file
        contract_upload_dir = os.path.join("uploads", contract_id)
        if os.path.isdir(contract_upload_dir):
            for f in os.listdir(contract_upload_dir):
                candidate = os.path.join(contract_upload_dir, f)
                if os.path.isfile(candidate):
                    file_path = candidate
                    print(f"DEBUG: Found file by directory scan: {file_path}")
                    break
    
    if not file_path:
        print(f"DEBUG: File not found. candidates tried: {[p for p in candidate_paths if p]}")
        raise HTTPException(status_code=404, detail="Document file not found on disk")
        
    # 3. Prepare recipients
    initiator_email = contract.get("submittedBy", ADMIN_EMAIL)
    print(f"DEBUG: Initiator email: {initiator_email}, Admin email: {ADMIN_EMAIL}")
    
    # Simple whitelist check for initiator and sender
    try:
        await check_domain_whitelist(initiator_email)
        await check_domain_whitelist(ADMIN_EMAIL)
    except Exception as e:
        print(f"DEBUG: Whitelist check failed: {str(e)}")
        raise e

    recipients = [
        {"email": initiator_email, "name": "Initiator", "role": "signer"},
        {"email": ADMIN_EMAIL, "name": contract.get("company", "Enterprise Services"), "role": "signer"}
    ]
    
    try:
        print(f"DEBUG: Calling digink_service.create_document...")
        result = await digink_service.create_document(
            sender_email=ADMIN_EMAIL,
            title=contract.get("title", "Contract Signature Request"),
            file_path=file_path,
            recipients=recipients
        )
        
        # Save DigInk tracking info
        digink_id = result.get("document_id") or result.get("id")
        print(f"DEBUG: DigInk success! ID: {digink_id}")
        digink_doc = {
            "contractId": contract_id,
            "diginkDocumentId": digink_id,
            "status": "Sent",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        await db.digink_documents.insert_one(digink_doc)
        
        # Update contract stage
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"stage": "Sent for Signature", "status": "Sent for Signature"}}
        )
        
        await log_action("Send for Signature", current_user.get("email", "Admin"), current_user.get("role", "User"), 
                         f"Contract '{contract.get('title')}' sent for signature via DigInk.", contract_id)
        
        print(f"DEBUG: Returning success for {contract_id}")
        return {"message": "Document sent for signature successfully", "digink_id": digink_id}
    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG: DigInk Service Error: {error_msg}")
        await log_action("Signature Failure", current_user.get("email", "Admin"), current_user.get("role", "User"), 
                         f"Failed to send '{contract.get('title')}' for signature: {error_msg}", contract_id)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/webhook/digink")
async def digink_webhook(payload: dict = Body(...)):
    doc_id = payload.get("document_id")
    status = payload.get("status")
    
    if not doc_id or not status:
        return {"status": "ignored"}
        
    digink_doc = await db.digink_documents.find_one({"diginkDocumentId": doc_id})
    if not digink_doc:
        return {"status": "not_found"}
        
    await db.digink_documents.update_one(
        {"diginkDocumentId": doc_id},
        {"$set": {"status": status, "updatedAt": datetime.utcnow().isoformat()}}
    )
    
    if status == "signed":
        await db.contracts.update_one(
            {"_id": ObjectId(digink_doc["contractId"])},
            {"$set": {"stage": "Signed", "status": "Approved"}}
        )
        
        contract = await db.contracts.find_one({"_id": ObjectId(digink_doc["contractId"])})
        if contract:
            await add_notification(
                for_user=contract.get("submittedBy"),
                message=f"Contract '{contract.get('title')}' has been fully signed via DigInk!",
                type="success",
                contract_id=str(contract["_id"]),
                contract_title=contract.get("title")
            )
            
    return {"status": "success"}

@app.get("/api/contracts/{contract_id}/digink-status")
async def get_digink_status(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(400, "Invalid contract ID")
    
    digink_doc = await db.digink_documents.find_one({"contractId": contract_id})
    if not digink_doc:
        return {"status": "Not Sent"}
    
    return {
        "status": digink_doc.get("status"),
        "diginkDocumentId": digink_doc.get("diginkDocumentId"),
        "updatedAt": digink_doc.get("updatedAt")
    }

