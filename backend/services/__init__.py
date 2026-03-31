import re
import os
import json
from datetime import datetime
from models import CAS
from openai import OpenAI

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", ""),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
)
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

async def extract_company_from_email_mock(email: str) -> str:
    match = re.search(r"@([\w-]+)\.", email)
    if match:
        domain = match.group(1)
        company_name = domain.capitalize()
        if company_name.lower() in ["gmail", "yahoo", "hotmail"]:
            return "Individual Client"
        return f"{company_name} Corp"
    return "Unknown Company"

def determine_doa_approver(value: float) -> str:
    if value <= 10000:
        return "Manager"
    else:
        return "CEO"

def generate_cas_document(
    contract_id: str, 
    contract_title: str, 
    value: float, 
    initiator: str,
    business_unit: str = "Operations",
    department: str = "Legal"
) -> CAS:
    approver = determine_doa_approver(value)
    return CAS(
        contractId=contract_id,
        contractTitle=contract_title,
        value=value,
        initiator=initiator,
        doaApprover=approver,
        status="Pending Approval",
        createdAt=datetime.utcnow().isoformat(),
        department=department,
        businessUnit=business_unit,
        agreementType="Master Service Agreement",
        keyNotes="Standard terms applied. No high-risk deviations noted.",
        approvalChain=[
            {
                "role": "Initiator",
                "name": initiator,
                "status": "Approved",
                "timestamp": datetime.utcnow().isoformat(),
                "approvedBy": initiator
            },
            {
                "role": "Endorser",
                "name": "Dept Head",
                "status": "Pending",
                "timestamp": None,
                "approvedBy": None
            },
            {
                "role": "Reviewer",
                "name": "Legal Counsel",
                "status": "Pending",
                "timestamp": None,
                "approvedBy": None
            },
            {
                "role": "Approver",
                "name": approver,
                "status": "Pending",
                "timestamp": None,
                "approvedBy": None
            }
        ]
    )

def all_reviews_approved(reviews: dict) -> bool:
    departments = ["Legal", "Finance", "Compliance", "Procurement"]
    for dept in departments:
        if reviews.get(dept, {}).get("status") != "Approved":
            return False
    return True

async def analyze_contract_with_ai(document_text: str) -> dict:
    try:
        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": """You are a contract analyzer. 
                Analyze the contract and return ONLY a JSON object:
                {
                  "status": "success",
                  "riskScore": "Low/Medium/High",
                  "missingTerms": ["term1"],
                  "extractedClauses": {
                    "liability": "...",
                    "payment": "...",
                    "termination": "...",
                    "compliance": "..."
                  },
                  "summary": "2-3 line summary"
                }
                No markdown, just JSON."""
            }, {
                "role": "user",
                "content": f"Analyze:\n\n{document_text[:4000]}"
            }],
            max_tokens=1000,
            temperature=0
        )
        return json.loads(
            response.choices[0].message.content
        )
    except Exception as e:
        return {
            "status": "error",
            "riskScore": "Medium",
            "missingTerms": [],
            "extractedClauses": {},
            "summary": "Analysis unavailable"
        }

async def extract_from_email_with_ai(email_text: str) -> dict:
    try:
        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": """Extract contract info from email.
                Return ONLY JSON:
                {
                  "counterpartyName": "",
                  "contractValue": "",
                  "subject": "",
                  "dates": ""
                }
                No markdown, just JSON."""
            }, {
                "role": "user",
                "content": f"Extract from:\n\n{email_text[:3000]}"
            }],
            max_tokens=500,
            temperature=0
        )
        return json.loads(
            response.choices[0].message.content
        )
    except Exception as e:
        return {
            "counterpartyName": "",
            "contractValue": "",
            "subject": "",
            "dates": ""
        }

async def generate_cas_notes_with_ai(
    contract_title: str,
    contract_value: float,
    company: str,
    review_comments: list
) -> str:
    try:
        comments_text = "; ".join(review_comments) if review_comments else "No comments"
        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[{
                "role": "system",
                "content": "You are a legal document writer. Write professional 2-3 sentence CAS key notes."
            }, {
                "role": "user",
                "content": f"""Contract: {contract_title}
Value: ${contract_value:,}
Company: {company}
Reviews: {comments_text}
Write professional key notes."""
            }],
            max_tokens=300,
            temperature=0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "Standard terms applied. No high-risk deviations noted."
