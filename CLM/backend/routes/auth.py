from fastapi import APIRouter, HTTPException, Body
from mongodb_client import db


from utils.validation import validate_email_domain
from models import EmailVerify, UserLogin




router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/verify-email-domain")
async def verify_domain(data: EmailVerify = Body(...)):
    """
    Endpoint to test email domain validation.
    """
    domain = data.email.split('@')[-1] if '@' in data.email else data.email
    await validate_email_domain(data.email)
    return {
        "status": "success",
        "message": f"Domain '{domain}' is allowed.",
        "domain": domain
    }


@router.post("/login")
async def login(data: UserLogin = Body(...)):
    """
    Login endpoint with email domain validation.
    """
    # 1. Validate email domain
    await validate_email_domain(data.email)
    
    # 2. Check if user exists (Mock check for now)
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # In a real app, we would verify password here
    
    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }
