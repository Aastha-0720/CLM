import re
from datetime import datetime
from models import CAS

async def extract_company_from_email_mock(email: str) -> str:
    """
    Mock AI Service for extracting company name from email address.
    In a real scenario, this could call OpenAI's API.
    """
    match = re.search(r"@([\w-]+)\.", email)
    if match:
        domain = match.group(1)
        company_name = domain.capitalize()
        # Clean up common domains just for the mock
        if company_name.lower() in ["gmail", "yahoo", "hotmail"]:
            return "Individual Client"
        return f"{company_name} Corp"
    return "Unknown Company"

def determine_doa_approver(value: float) -> str:
    """
    Determine DOA Approver based on contract value rules:
    - Value < 10000 -> Manager
    - Value 10000-50000 -> Director
    - Value > 50000 -> VP
    """
    if value < 10000:
        return "Manager"
    elif value <= 50000:
        return "Director"
    else:
        return "VP"

def generate_cas_document(contract_id: str, contract_title: str, value: float, initiator: str) -> CAS:
    approver = determine_doa_approver(value)
    return CAS(
        contractId=contract_id,
        contractTitle=contract_title,
        value=value,
        initiator=initiator,
        doaApprover=approver,
        status="Pending Approval",
        createdAt=datetime.utcnow().isoformat(),
        department="Legal",
        businessUnit="Operations",
        agreementType="Master Service Agreement",
        keyNotes="Standard terms applied. No high-risk deviations noted.",
        approvalChain=[
            {"role": "Initiator", "name": initiator, "status": "Approved", "timestamp": datetime.utcnow().isoformat(), "approvedBy": initiator},
            {"role": "Endorser", "name": "Dept Head", "status": "Pending", "timestamp": None, "approvedBy": None},
            {"role": "Reviewer", "name": "Legal Counsel", "status": "Pending", "timestamp": None, "approvedBy": None},
            {"role": "Approver", "name": approver, "status": "Pending", "timestamp": None, "approvedBy": None}
        ]
    )

def all_reviews_approved(reviews: dict) -> bool:
    """
    Check if all department reviews are approved.
    """
    departments = ["Legal", "Finance", "Compliance", "Procurement"]
    for dept in departments:
        if reviews.get(dept, {}).get("status") != "Approved":
            return False
    return True
