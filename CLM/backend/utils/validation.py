from fastapi import HTTPException
from mongodb_client import db




async def validate_email_domain(email: str):
    """
    Extracts the domain from an email address and checks if it's allowed.
    Returns the domain if allowed, otherwise raises an HTTPException.
    """
    try:
        if "@" not in email:
            raise ValueError("Invalid email address")
            
        domain = email.split("@")[-1].lower()
        
        # Check in allowed_domains collection
        allowed_domain = await db.allowed_domains.find_one({"domain": domain})
        
        if not allowed_domain or not allowed_domain.get("is_active", False):
            raise HTTPException(
                status_code=403,
                detail="Email domain is not allowed. Please use your company email."
            )
            
        return domain
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
