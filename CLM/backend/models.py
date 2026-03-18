from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
import re

class DomainBase(BaseModel):
    domain: str = Field(..., description="The domain name, e.g., example.com")

    @validator('domain')
    def validate_domain(cls, v):
        domain_regex = r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-2]{2,6}$"
        if not re.match(domain_regex, v.lower()):
            raise ValueError("Invalid domain format")
        return v.lower()

class DomainCreate(DomainBase):
    is_active: bool = True

class DomainUpdate(BaseModel):
    is_active: Optional[bool] = None

class EmailVerify(BaseModel):
    email: str

class UserLogin(BaseModel):
    email: str
    password: str # For future implementation, currently just validating domain

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "Sales"
    department: Optional[str] = None
    status: str = "Active"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

class DomainResponse(DomainBase):
    id: str = Field(..., alias="_id")
    is_active: bool
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OpportunityBase(BaseModel):
    title: str
    customer_name: str
    business_unit: str
    current_stage: str
    sales_owner: str
    sales_owner_id: str
    deal_value: float
    risk_level: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class OpportunityCreate(OpportunityBase):
    id: str

class OpportunityResponse(OpportunityBase):
    id: str

    class Config:
        populate_by_name = True

class ContractBase(BaseModel):
    opportunity: str
    customer: str
    status: str
    cas_status: str
    signature_status: str

class ContractCreate(ContractBase):
    id: str

class ContractResponse(ContractBase):
    id: str

    class Config:
        populate_by_name = True

class DashboardSummary(BaseModel):
    totalOpportunities: int
    totalContracts: int
    totalRevenue: float
    activeUsers: int
    pendingApprovals: int
    pendingSignatures: int
    pipelineFunnel: List[dict]
    recentOpportunities: List[dict]

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info" # info, success, warning, error
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationResponse(NotificationBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

class RoleBase(BaseModel):
    name: str
    permissions: List[str]

class RoleResponse(RoleBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

class StageBase(BaseModel):
    name: str
    key: str
    count: int = 0

class StageResponse(StageBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

