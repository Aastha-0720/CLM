from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from database import db
from models import Contract, CAS, DepartmentReviews
import services

app = FastAPI(title="CLM Admin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
allow_headers=["*"],
)

DEMO_USERS = [
    {"name": "Admin User", "email": "admin@apeiro.com", "role": "Admin", "password": "Admin@2026", "status": "Active"},
    {"name": "Legal Counsel", "email": "legal@apeiro.com", "role": "Legal", "password": "Legal@2026", "status": "Active"},
    {"name": "Finance Controller", "email": "finance@apeiro.com", "role": "Finance", "password": "Finance@2026", "status": "Active"},
    {"name": "Compliance Officer", "email": "compliance@apeiro.com", "role": "Compliance", "password": "Comply@2026", "status": "Active"},
    {"name": "Procurement Lead", "email": "procurement@apeiro.com", "role": "Procurement", "password": "Procure@2026", "status": "Active"},
    {"name": "Sales Manager", "email": "sales@apeiro.com", "role": "Sales", "password": "Sales@2026", "status": "Active"},
    {"name": "Operations Manager", "email": "manager@apeiro.com", "role": "Manager", "password": "Manager@2026", "status": "Active"},
    {"name": "Chief Executive Officer", "email": "ceo@apeiro.com", "role": "CEO", "password": "CEO@2026", "status": "Active"},
]

@app.on_event("startup")
async def seed_users():
    count = await db.users.count_documents({})
    if count == 0:
        await db.users.insert_many(DEMO_USERS)

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
        email = str(row.get('email', ''))
        if not email:
            continue
            
        company_name = str(row.get('company', '')).strip()
        if not company_name or company_name == 'nan':
            company_name = await services.extract_company_from_email_mock(email)
        title = row.get('title', f"{company_name} Agreement")
        value = float(row.get('value', 0))
        department = str(row.get('department', 'Legal'))
        
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
        
    return {"message": f"Successfully processed and created {inserted_count} contracts."}

@app.get("/api/contracts")
async def get_contracts(stage: str = None):
    query = {}
    if stage:
        query["stage"] = stage
        
    cursor = db.contracts.find(query)
    contracts = await cursor.to_list(length=1000)
    
    for c in contracts:
        c["id"] = str(c["_id"])
        del c["_id"]
        
    return contracts

@app.post("/api/contracts/create")
async def create_single_contract(data: dict = Body(...)):
    contract = Contract(
        title=data.get("title", "Untitled Contract"),
        company=data.get("company", "Unknown"),
        value=float(data.get("value", 0)),
        department=data.get("department", "Legal"),
        stage="Under Review",
        status="Pending",
        submittedBy=data.get("submittedBy", "Admin")
    )
    result = await db.contracts.insert_one(
        contract.model_dump(by_alias=True, exclude_none=True)
    )
    return {
        "message": "Contract created successfully",
        "id": str(result.inserted_id)
    }

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(400, "Invalid contract ID")
    result = await db.contracts.delete_one({"_id": ObjectId(contract_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Contract not found")
    return {"message": "Contract deleted successfully"}

@app.post("/api/contracts/{contract_id}/review")
async def submit_review(contract_id: str, department: str = Body(...), status: str = Body(...), comments: str = Body(""), reviewer: str = Body("Admin")):
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
    if status == "Approved":
        if department == "Legal":
            next_stage = "Finance Review"
        elif department == "Finance":
            next_stage = "Compliance Review"
        elif department == "Compliance":
            next_stage = "Procurement Review"
        elif department == "Procurement":
            next_stage = "CAS Generated"
    else:
        # If Rejected by any department, stop workflow
        await db.contracts.update_one(
            {"_id": ObjectId(contract_id)},
            {"$set": {"status": "Rejected", "stage": "Rejected"}}
        )
        return {"message": f"Contract rejected by {department}"}

    # Update contract with review and next stage
    update_data["stage"] = next_stage
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": update_data}
    )
    
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
        await db.notifications.insert_one({
            "for_role": notif["for_role"],
            "message": notif["message"].format(title=contract.get("title", "")),
            "contract_id": contract_id,
            "contract_title": contract.get("title", ""),
            "action": notif["action"],
            "department": department,
            "read": False,
            "createdAt": datetime.utcnow().isoformat()
        })

    # Check if we moved to CAS Generated
    if next_stage == "CAS Generated":
        updated_contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
        cas_doc = services.generate_cas_document(
            contract_id=str(contract_id),
            contract_title=updated_contract.get("title", ""),
            value=updated_contract.get("value", 0),
            initiator=updated_contract.get("submittedBy", "Admin")
        )
        await db.cas.insert_one(cas_doc.model_dump(by_alias=True, exclude_none=True))
        
    return {"message": "Review submitted successfully"}

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
    return {"message": "Step approved successfully"}

@app.post("/api/contracts/doa/{contract_id}/{action}")
async def doa_approval(contract_id: str, action: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
        
    status = "Approved" if action.lower() == "approve" else "Rejected"
    stage = "Approved" if action.lower() == "approve" else "Under Review"
    
    await db.contracts.update_one(
        {"_id": ObjectId(contract_id)},
        {"$set": {"status": status, "stage": stage}}
    )
    
    return {"message": f"Contract {action}d via DOA successfully"}

# ─── Notification Endpoints ───

@app.get("/api/notifications")
async def get_notifications(role: Optional[str] = Query(None)):
    query = {"read": False}
    if role:
        query["for_role"] = role
    cursor = db.notifications.find(query).sort("createdAt", -1)
    notifs = await cursor.to_list(length=100)
    for n in notifs:
        n["id"] = str(n["_id"])
        del n["_id"]
    return notifs

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
async def get_users():
    users = await db.users.find({}).to_list(100)
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
        u.pop("password", None)  # Never send password
    return users

@app.post("/api/admin/users")
async def add_user(user: dict = Body(...)):
    existing = await db.users.find_one({"email": user.get("email")})
    if existing:
        raise HTTPException(400, "User already exists")
    user["status"] = "Active"
    await db.users.insert_one(user)
    return {"message": "User added successfully"}

@app.put("/api/admin/users/{user_id}/role")
async def update_role(user_id: str, data: dict = Body(...)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": data.get("role")}}
    )
    return {"message": "Role updated"}

@app.put("/api/admin/users/{user_id}/status")
async def update_status(user_id: str, data: dict = Body(...)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": data.get("status")}}
    )
    return {"message": "Status updated"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str):
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

