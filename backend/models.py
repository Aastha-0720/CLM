from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate)
            ])
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class ReviewComment(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    department: str
    clauseId: Optional[str] = None
    comment: str
    commentedBy: str
    status: str = "Comment"
    parentId: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReviewData(BaseModel):
    status: str = "Not Started"
    comments: str = ""
    reviewedBy: str = ""
    reviewedAt: Optional[str] = None
    decisionType: Optional[str] = None
    requiresChanges: bool = False
    changeRequestIds: List[str] = Field(default_factory=list)


class RoutingDecision(BaseModel):
    workflow: List[str] = Field(default_factory=list)
    review_mode: str = "sequential"
    reasons: List[str] = Field(default_factory=list)
    applied_rules: List[str] = Field(default_factory=list)


class ClauseRedline(BaseModel):
    id: Optional[str] = None
    clauseId: Optional[str] = None
    clauseTitle: Optional[str] = None
    department: str = ""
    originalText: str = ""
    redlinedText: str = ""
    justification: Optional[str] = None
    issues: List[dict] = Field(default_factory=list)
    createdBy: str = "System"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ContractVersion(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    version: int
    changeType: str = "update"
    summary: str = ""
    file_url: Optional[str] = None
    changeRequestIds: List[str] = Field(default_factory=list)
    createdBy: str = "System"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    snapshot: Dict = Field(default_factory=dict)
    previousSnapshot: Optional[Dict] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DepartmentReviews(BaseModel):
    Legal: ReviewData = Field(default_factory=ReviewData)
    Finance: ReviewData = Field(default_factory=ReviewData)
    Compliance: ReviewData = Field(default_factory=ReviewData)
    Procurement: ReviewData = Field(default_factory=ReviewData)

class Contract(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    company: str
    value: float
    department: str
    stage: str = "Under Review"
    status: str = "Pending"
    contract_name: Optional[str] = None
    legal_status: str = "Not Started"
    finance_status: str = "Not Started"
    compliance_status: str = "Not Started"
    procurement_status: str = "Not Started"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    dueAt: Optional[str] = None
    completedAt: Optional[str] = None
    rejectedAt: Optional[str] = None
    submittedBy: str = "Admin"
    created_by: str = "Admin"
    reviews: DepartmentReviews = Field(default_factory=DepartmentReviews)
    duration: Optional[str] = None
    category: Optional[str] = None
    risk_classification: Optional[str] = None
    business_unit: Optional[str] = None
    contract_owner: Optional[str] = None
    opportunity_id: Optional[str] = None
    sales_opportunity_id: Optional[str] = None
    expiry_date: Optional[str] = None
    doa_stage: Optional[str] = None
    doa_status: Optional[str] = None
    clauses: List[dict] = Field(default_factory=list)
    draftText: Optional[str] = None
    internal_notes: Optional[str] = None
    workflow_events: List[dict] = Field(default_factory=list)
    review_mode: str = "sequential"
    workflow: List[str] = Field(default_factory=list)
    current_stage_index: int = 0
    required_reviewers: List[str] = Field(default_factory=list)
    review_stages: List[str] = Field(default_factory=list)
    routing_reasons: List[str] = Field(default_factory=list)
    routing_rules_applied: List[str] = Field(default_factory=list)
    routing_decisions: List[dict] = Field(default_factory=list)
    change_requests: List[dict] = Field(default_factory=list)
    active_change_request_ids: List[str] = Field(default_factory=list)
    current_version: int = 1
    versions: List[dict] = Field(default_factory=list)
    redline_history: List[dict] = Field(default_factory=list)
    last_review_resubmitted_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejected_by: Optional[str] = None
    escalated: bool = False
    escalatedBy: Optional[str] = None
    escalatedAt: Optional[str] = None
    escalationReason: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CASStep(BaseModel):
    role: str
    name: str
    status: str = "Pending"
    timestamp: Optional[str] = None
    approvedBy: Optional[str] = None

class CAS(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    contractTitle: str
    value: float
    initiator: str
    status: str = "Pending Approval"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    doaApprover: str = ""
    doaLevel: Optional[str] = None
    doaRuleId: Optional[str] = None
    doaRuleName: Optional[str] = None
    doaRoutingSource: Optional[str] = None
    doa_stage: Optional[str] = None
    doa_status: Optional[str] = None
    businessUnit: str = ""
    department: str = ""
    cost_center: Optional[str] = None
    project_name: Optional[str] = None
    agreementType: str = ""
    execution_date: Optional[str] = None
    effective_date: Optional[str] = None
    keyNotes: str = ""
    reviewDepartments: List[str] = Field(default_factory=list)
    routingReasons: List[str] = Field(default_factory=list)
    approvalChain: List[dict] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DOARule(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    conditions: Dict = Field(default_factory=dict)
    approvers: List[str] = Field(default_factory=list)
    priority: int = 100
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DOARuleHistory(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    rule_id: str
    updated_by: str = "System"
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    previous_rule: Dict = Field(default_factory=dict)
    new_rule: Optional[Dict] = None
    action: str = "updated"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Document(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    fileName: str
    fileType: str
    fileSize: int
    storagePath: str
    version: int = 1
    uploadedBy: str = "Admin"
    uploadedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    category: str = "General"
    tags: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AuditLog(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    userName: str
    actor: Optional[str] = None
    role: str = "System"
    action: str
    eventType: Optional[str] = None
    message: Optional[str] = None
    phase: Optional[str] = None
    department: Optional[str] = None
    details: Optional[str] = None
    notes: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ChangeRequest(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    action: str = "request_changes"
    department: str
    requestedBy: str
    reviewer: Optional[str] = None
    title: Optional[str] = None
    requestType: str = "Clause Change"
    clauseId: Optional[str] = None
    clauseTitle: Optional[str] = None
    clause_reference: Optional[str] = None
    fieldName: Optional[str] = None
    currentValue: Optional[str] = None
    proposedValue: Optional[str] = None
    priority: str = "Medium"
    description: str
    comment: Optional[str] = None
    status: str = "Open"
    contractVersion: Optional[int] = None
    linkedVersion: Optional[int] = None
    resolution: Optional[str] = None
    resolvedBy: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    resolvedAt: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
