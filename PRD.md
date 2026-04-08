# Product Requirements Document: Contrax CLM

**Integrated Contract Lifecycle Management System**

| Field | Value |
|---|---|
| Product Name | Contrax CLM |
| Platform Owner | NEW EMERGING TECHNOLOGIES LTD |
| First Tenant (Pilot) | Infinia Technologies |
| Version | 1.0 |
| Date | 2026-04-06 |
| Status | Draft |
| Author | Product & Engineering Team |
| Stakeholders | Business Development, Legal, Finance, Compliance, Procurement, IT |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Users & Personas](#4-users--personas)
5. [System Architecture (High Level)](#5-system-architecture-high-level)
6. [Feature Requirements (Detailed)](#6-feature-requirements-detailed)
7. [Workflow Specifications](#7-workflow-specifications)
8. [Data Model (Key Entities)](#8-data-model-key-entities)
9. [Integration Specifications](#9-integration-specifications)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Legal AI -- Future Vision (Phase 2)](#11-legal-ai--future-vision-phase-2)
12. [Implementation Phases](#12-implementation-phases)
13. [Success Metrics](#13-success-metrics)
14. [Open Questions & Assumptions](#14-open-questions--assumptions)

---

## 1. Executive Summary

Contrax CLM is an integrated Contract Lifecycle Management system built by NEW EMERGING TECHNOLOGIES LTD as a **multi-tenant SaaS platform**. The first deployment (pilot tenant) is **Infinia Technologies**, with the platform designed to be reusable for other companies — a Super Admin (Platform Admin) can onboard new organizations as fully isolated tenants with their own data, users, templates, workflows, and DOA matrices.

The system manages the complete lifecycle of contracts from opportunity identification through execution, renewal, and expiry. It replaces fragmented manual processes -- scattered email threads, spreadsheet trackers, and disconnected approval chains -- with a unified digital platform.

**Deployment Strategy**: Build and validate the full platform with Infinia Technologies as the pilot tenant. Once proven, the Super Admin can onboard additional companies, each getting their own isolated environment with configurable workflows, DOA rules, templates, and integrations.

The platform is organized into **two core modules**:

**Module A — Legal Request Flow**: Any employee (requester) from any department can raise a legal request. The AI self-service portal resolves basic/standard requests (NDAs, templates) instantly and returns them to the requester. Complex requests are routed to Legal Counsel, who reviews and provides feedback. The requester revises, AI verifies incorporation of feedback, and Counsel re-reviews — this loop repeats until Counsel approves. The package then goes to the Chief Legal Officer for final approval (with its own revision loop back to Counsel). Once approved, the output is delivered to the requester.

**Module B — Contract Approval Flow**: Contracts originating from sales/BD opportunities (e.g., vendor agreements like Edmondo consultancy, international deals like Ethiopia) enter through Outlook email, upload, or CSV. AI extracts data and routes clauses to departments for parallel review (Commercial→Business, Payment→Finance, Liability→Legal, Compliance→Compliance, Vendor→Procurement). After all departments approve, a CAS (Contract Approval Sheet) is auto-generated. The DOA (Delegation of Authority) rule engine determines approvers based on contract value/risk, triggers email notifications, and routes through the approval chain (Initiator→Endorser→Reviewer→Approver). Upon CAS approval, the CAS and contract are sent to DigiInk for digital signature, then archived with lifecycle monitoring.

The platform additionally covers: secure document repository, Microsoft Outlook integration, sales pipeline linkage, reporting dashboards, enterprise security, comprehensive audit trails, and a future-phase Legal AI engine for in-browser document editing with AI-powered clause analysis.

**Target users** include employees/requesters from any department, business development teams, legal counsel, Chief Legal Officer, finance/compliance/procurement reviewers, DOA approvers, and platform/organization administrators.

**Key differentiators**: two-track architecture separating legal advisory (Module A) from contract governance (Module B), AI self-service for standard requests, automated clause-based routing, configurable DOA matrices, seamless Outlook integration, and a future Legal AI engine for collaborative document editing.

---

## 2. Problem Statement

Infinia Technologies (the pilot tenant) operates across multiple business units and geographies (including international deals such as Ethiopia). The current contract management process suffers from the following problems:

### 2.1 Manual Contract Tracking
Contracts are tracked in spreadsheets and email folders. There is no single source of truth for contract status, resulting in lost documents, missed deadlines, and duplicate effort.

### 2.2 No Visibility Across the Organization
Leadership has no real-time view of contracts under negotiation, pending approvals, or approaching expiry. Sales pipeline data is disconnected from contract execution status.

### 2.3 Approval Bottlenecks
Approval routing is manual. Determining the correct approver based on contract value, risk level, and business unit requires human judgment and institutional knowledge. When approvers are unavailable, contracts stall with no automated escalation.

### 2.4 Compliance & Governance Gaps
There is no enforced Delegation of Authority. Contracts may be approved by unauthorized personnel. No audit trail exists to prove who approved what, when, and why. This creates regulatory and internal audit exposure.

### 2.5 Scattered Documents
Contract documents, amendments, CAS forms, and signed copies exist across email inboxes, shared drives, and local machines. Version control is nonexistent -- it is unclear which version of a contract is the current executed copy.

### 2.6 Inefficient Review Process
Contracts are routed to all review departments regardless of their content. A simple NDA goes through the same review cycle as a complex multi-million dollar service agreement. Reviewers spend time on clauses outside their domain.

### 2.7 No Digital Signature Integration
Executed contracts require manual signature collection, often via print-sign-scan workflows, adding days or weeks to cycle time.

---

## 3. Product Vision & Goals

### 3.1 Vision

Contrax CLM will be the central nervous system for all contract-related activities — starting with Infinia Technologies as the pilot, then reusable for any company onboarded by the Super Admin. It provides end-to-end visibility, automated governance enforcement, and AI-assisted contract intelligence — reducing contract cycle times by at least 50% while strengthening compliance posture.

### 3.2 Key Goals

| # | Goal | Measurable Target | Timeline |
|---|---|---|---|
| G1 | Reduce average contract cycle time (submission to execution) | From ~15 business days to 7 business days | Phase 1+2 |
| G2 | Achieve 100% DOA compliance | Every contract approved by the correct authority level | Phase 1 |
| G3 | Eliminate lost or misplaced contracts | 100% of contracts in the central repository | Phase 1 |
| G4 | Reduce manual routing effort | 90% of contracts auto-routed to correct departments | Phase 1 |
| G5 | Enable self-service for standard contracts | 30% of requests resolved without legal counsel | Phase 1 |
| G6 | Provide real-time executive visibility | Dashboards live with <5 min data freshness | Phase 2 |
| G7 | Achieve digital signature adoption | 100% of contracts signed via DigiInk | Phase 2 |
| G8 | AI-assisted clause review | 50% reduction in clause review time | Phase 3 |

---

## 4. Users & Personas

### 4.1 Super Admin (Platform Admin)

| Attribute | Detail |
|---|---|
| Role | Platform-level super administrator (NEW EMERGING TECHNOLOGIES LTD) |
| Goals | Onboard new companies as tenants, manage platform health, global configurations, reuse the platform across organizations |
| Pain Points | No centralized way to onboard/offboard organizations, no visibility into platform usage across tenants |
| Key Workflows | Onboard new companies (e.g., first: Infinia, then others), create/manage organizations and subsidiaries, manage platform settings, monitor system health, manage global DOA templates, configure per-tenant Entra ID SSO |
| Access Level | Full platform access across all tenants |

### 4.2 Org Admin

| Attribute | Detail |
|---|---|
| Role | Organization-level administrator |
| Goals | Configure organization settings, manage users and roles, maintain DOA matrices, define review workflows |
| Pain Points | Manual user provisioning, no way to enforce organizational policies consistently |
| Key Workflows | User management (CRUD, role assignment), DOA matrix configuration, pipeline stage configuration, business unit setup, Outlook/DigiInk integration settings |
| Access Level | Full access within their organization |

### 4.3 Chief Legal Officer (CLO)

| Attribute | Detail |
|---|---|
| Role | Head of legal department, final legal authority |
| Goals | Oversee all contract activity, ensure legal compliance, manage legal team workload |
| Pain Points | No visibility into review backlogs, cannot track which contracts are at risk, receives escalations ad hoc via email |
| Key Workflows | Review dashboards, approve/reject escalated contracts, provide feedback to Legal Counsel, configure clause review standards, export audit reports |
| Access Level | View all contracts, approve/override legal decisions, manage legal team |

### 4.4 Legal Counsel

| Attribute | Detail |
|---|---|
| Role | Attorney performing contract reviews |
| Goals | Review assigned contracts efficiently, flag risks, collaborate with requesters on revisions |
| Pain Points | Receives contracts with insufficient context, no way to track multiple pending reviews, manual back-and-forth with requesters via email |
| Key Workflows | Review queue management, clause-level commenting, request revisions from employees (with AI verification of feedback incorporation), approve/reject contracts, generate redlines |
| Access Level | View and review assigned contracts, comment, approve/reject |

### 4.5 Employee / Requester

| Attribute | Detail |
|---|---|
| Role | Any employee who initiates a contract request |
| Goals | Submit contracts quickly, get status updates, resolve simple requests via self-service |
| Pain Points | Does not know the correct process, cannot track where their request is stuck, receives no notifications |
| Key Workflows | Submit contract via intake form, upload documents, track contract status, respond to revision requests, use AI self-service for standard templates (NDAs, simple agreements) |
| Access Level | Submit contracts, view own contracts, respond to feedback |

### 4.6 Business / BD Team

| Attribute | Detail |
|---|---|
| Role | Business development representatives managing sales opportunities |
| Goals | Link contracts to opportunities, track contract progress against sales pipeline, ensure commercial terms are correct |
| Pain Points | No link between CRM/pipeline and contract status, manually chases legal for updates on deal-critical contracts |
| Key Workflows | Create/manage sales opportunities, link contracts to opportunities, review commercial clauses, track pipeline-to-contract progression |
| Access Level | Manage own opportunities, view linked contracts, review commercial clauses |

### 4.7 Finance Reviewer

| Attribute | Detail |
|---|---|
| Role | Finance team member reviewing payment and financial terms |
| Goals | Ensure payment terms, pricing, and financial obligations are acceptable |
| Pain Points | Reviews contracts that have no financial clauses, no structured way to provide feedback |
| Key Workflows | Review assigned contracts (payment terms clauses), approve/reject with comments, flag financial risks |
| Access Level | View and review contracts assigned for finance review |

### 4.8 Compliance Reviewer

| Attribute | Detail |
|---|---|
| Role | Compliance team member reviewing regulatory requirements |
| Goals | Ensure contracts meet regulatory and compliance standards (GDPR, local regulations) |
| Pain Points | Discovers compliance issues late in the process, no historical view of compliance decisions |
| Key Workflows | Review compliance-related clauses, flag regulatory risks, approve/reject with conditions |
| Access Level | View and review contracts assigned for compliance review |

### 4.9 Procurement Reviewer

| Attribute | Detail |
|---|---|
| Role | Procurement team member reviewing vendor and supplier terms |
| Goals | Ensure vendor terms align with procurement policies, pricing is competitive |
| Pain Points | No visibility into vendor contract portfolio, cannot enforce standard vendor terms |
| Key Workflows | Review vendor/supplier clauses, verify pricing against benchmarks, approve/reject vendor terms |
| Access Level | View and review contracts assigned for procurement review |

### 4.10 DOA Approvers (Manager, Director, VP, CEO)

| Attribute | Detail |
|---|---|
| Role | Authority-level approvers in the CAS approval chain |
| Goals | Approve contracts within their delegated authority quickly, ensure proper due diligence was performed |
| Pain Points | No context when asked to approve (receives a PDF via email), no way to see the full review history, approval requests get buried in email |
| Key Workflows | Review CAS documents, view review history and comments, approve/reject/escalate, receive notifications for pending approvals, delegate authority during absence |
| Access Level | View contracts routed for their approval, approve/reject CAS |

---

## 5. System Architecture (High Level)

### 5.1 Architecture Overview

```
+--------------------------------------------------+
|                   CLIENTS                        |
|  +------------+  +----------+  +--------------+  |
|  | Web App    |  | Outlook  |  | Mobile       |  |
|  | (React 18) |  | Add-in   |  | (Future)     |  |
|  +-----+------+  +----+-----+  +------+-------+  |
+--------|--------------|-----------------|---------+
         |              |                 |
+--------v--------------v-----------------v---------+
|              API GATEWAY / LOAD BALANCER           |
+---------------------------------------------------+
         |
+--------v------------------------------------------+
|              BACKEND (FastAPI)                     |
|  +-------------+  +-----------+  +-------------+  |
|  | Auth        |  | Contract  |  | Workflow     |  |
|  | Middleware   |  | Service   |  | Engine       |  |
|  +-------------+  +-----------+  +-------------+  |
|  +-------------+  +-----------+  +-------------+  |
|  | DOA Rule    |  | CAS       |  | Notification |  |
|  | Engine       |  | Generator |  | Service      |  |
|  +-------------+  +-----------+  +-------------+  |
|  +-------------+  +-----------+  +-------------+  |
|  | Audit       |  | DigiInk   |  | AI Engine    |  |
|  | Service      |  | Client    |  | (Triage/NLP) |  |
|  +-------------+  +-----------+  +-------------+  |
+---------------------------------------------------+
         |              |              |
+--------v----+  +------v------+  +---v-----------+
| MongoDB     |  | File Storage|  | External APIs |
| (Multi-     |  | (Azure Blob/|  | - MS Graph    |
|  tenant)    |  |  S3/GridFS) |  | - DigiInk     |
+-------------+  +-------------+  | - Entra ID    |
                                  +---------------+
```

### 5.2 Multi-Tenant Model

The platform implements tenant isolation at the database level. Each organization's data is logically separated using an `org_id` field on all collections. This is the core of the platform's reusability — the Super Admin can onboard any company as a new tenant.

**Pilot tenant**: Infinia Technologies (first deployment, full feature validation)
**Future tenants**: Any company onboarded by the Super Admin

Key characteristics:

- **Tenant isolation**: All queries are scoped by `org_id`. No cross-tenant data access is possible. Each company's contracts, users, DOA matrices, CAS records, and documents are fully isolated.
- **Subsidiary support**: Organizations can have subsidiaries, each with their own configurations (jurisdiction, templates, DOA thresholds) but sharing the parent org's user pool.
- **Tenant provisioning**: Super Admin creates organizations, configures their Entra ID SSO, and activates them. Org Admin then configures settings, users, and workflows within their tenant.
- **Per-tenant configurability**: Each tenant gets their own: DOA matrix, clause-to-department mappings, CAS templates, pipeline stages, notification rules, DigiInk integration, and Outlook mailbox configuration.

### 5.3 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Vite | Fast build tooling, component-based architecture, large ecosystem |
| Backend | FastAPI (Python 3.11+) | Async-native, automatic OpenAPI docs, Python AI/ML ecosystem |
| Database | MongoDB | Flexible schema for contract metadata, multi-tenant friendly, Atlas Search for full-text |
| Authentication | Microsoft Entra ID (SSO) | Enterprise SSO, aligns with Outlook integration, group-based RBAC |
| File Storage | Azure Blob Storage (primary) or MongoDB GridFS (fallback) | Scalable document storage, integrates with Azure ecosystem |
| Containerization | Docker Compose | Consistent dev/prod environments, easy deployment |
| Background Jobs | APScheduler or Celery + Redis | Reminders, escalations, scheduled tasks |
| AI/ML | Azure OpenAI / OpenAI API | Clause analysis, contract extraction, risk scoring |

### 5.4 Authentication Architecture

```
User -> Entra ID Login -> ID Token + Access Token
     -> Frontend stores tokens
     -> API calls include Bearer token
     -> FastAPI middleware validates token with Entra ID
     -> Extracts user identity + group memberships
     -> Maps Entra ID groups to application roles
     -> Authorizes request based on RBAC rules
```

- **Primary auth**: Microsoft Entra ID SSO via OIDC/OAuth2
- **Fallback auth**: JWT-based local authentication (for development/testing)
- **Session management**: Access tokens with refresh token rotation
- **Group-based RBAC**: Entra ID security groups map to application roles

---

## 6. Feature Requirements (Detailed)

### 6.1 Contract Repository & Document Management

**Description**: A secure, centralized repository for all contract-related documents including contracts, amendments, policies, CAS documents, attachments, and executed copies. Provides version control, metadata tagging, full-text search, and role-based access.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.1.1 | As an Employee, I want to upload a contract document (PDF/DOCX) when submitting a contract, so that reviewers can access the actual document. | P0 |
| US-6.1.2 | As a Legal Counsel, I want to search contracts by title, counterparty, clause content, or tags, so that I can find relevant precedents quickly. | P0 |
| US-6.1.3 | As an Org Admin, I want to see all versions of a contract document, so that I can track changes over time. | P0 |
| US-6.1.4 | As a Legal Counsel, I want to tag documents with custom metadata (e.g., "high-risk", "template", "vendor-XYZ"), so that I can organize and filter the repository. | P1 |
| US-6.1.5 | As a CLO, I want to restrict access to sensitive contracts to specific users/roles, so that confidential documents are protected. | P0 |
| US-6.1.6 | As an Employee, I want to download any version of a contract document, so that I can review historical versions. | P1 |
| US-6.1.7 | As an Org Admin, I want document lifecycle status (Draft, Active, Expired, Archived) to be automatically tracked, so that the repository stays current. | P1 |

**Acceptance Criteria**:

- [ ] System accepts PDF, DOCX, DOC, and XLSX file uploads up to 50MB per file.
- [ ] Every document upload creates a new version; previous versions are retained and accessible.
- [ ] Version history displays: version number, uploaded by, upload date, file size, and change description.
- [ ] Full-text search returns results from document content (not just metadata) within 3 seconds.
- [ ] Users can add, remove, and filter by custom tags on any document.
- [ ] Documents inherit the access control of their parent contract. Access is denied with a 403 response for unauthorized users.
- [ ] Documents are encrypted at rest using AES-256.
- [ ] Deleting a document creates a soft-delete (archived), not a hard delete. Only Platform Admin can permanently purge.

---

### 6.2 Microsoft Outlook Integration

**Description**: Bidirectional integration with Microsoft Outlook via Microsoft Graph API. Enables contract submission from emails, sends notifications via email, provides deep links back to the application, and optionally offers an Outlook add-in for in-context contract actions.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.2.1 | As a BD team member, I want to forward a contract email to Contrax CLM and have it automatically create a contract record with the email attachments, so that I do not need to manually re-enter data. | P1 |
| US-6.2.2 | As a Legal Counsel, I want to receive email notifications when a contract is assigned to me for review, so that I do not need to constantly check the application. | P0 |
| US-6.2.3 | As a DOA Approver, I want to receive email reminders for pending approvals, with a direct link to the contract, so that I can act quickly. | P0 |
| US-6.2.4 | As an Employee, I want to receive an email when my contract request changes status (approved, rejected, needs revision), so that I stay informed. | P1 |
| US-6.2.5 | As a BD team member, I want an Outlook add-in that lets me submit a contract directly from an open email, pre-filling details from the email context. | P2 |
| US-6.2.6 | As an Org Admin, I want to configure which notification types trigger emails vs. in-app-only notifications, so that users are not overwhelmed with emails. | P1 |

**Acceptance Criteria**:

- [ ] System connects to Microsoft Graph API using OAuth2 application permissions.
- [ ] Forwarded emails to a designated mailbox are processed within 5 minutes: attachments extracted, contract record created in "Draft" status.
- [ ] All email notifications include: subject line with contract title, summary of the action required, and a deep link (URL) to the specific contract in Contrax CLM.
- [ ] Reminder emails are sent for approvals pending longer than a configurable threshold (default: 3 business days).
- [ ] Email notification preferences are configurable per user (opt-in/opt-out per notification type).
- [ ] Outlook add-in (P2) loads a sidebar with the contract submission form, pre-populated with sender, subject, and attachment list from the current email.
- [ ] All email sending failures are logged and retried up to 3 times with exponential backoff.

---

### 6.3 Sales Pipeline Integration

**Description**: Contracts are linked to sales opportunities. The system tracks opportunities through configurable pipeline stages and automatically synchronizes pipeline stage with contract status. Provides visibility into the sales-to-contract conversion funnel.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.3.1 | As a BD team member, I want to create a sales opportunity with details (customer, deal value, sales owner, business unit, expected contract value, stage), so that I can track the deal lifecycle. | P1 |
| US-6.3.2 | As an Employee, I want to link a contract to an existing sales opportunity during submission, so that there is traceability between the deal and the contract. | P1 |
| US-6.3.3 | As a CLO, I want to see a dashboard showing pipeline stage vs. contract status, so that I can identify bottlenecks in the deal-to-contract flow. | P1 |
| US-6.3.4 | As an Org Admin, I want to configure pipeline stages, so that the system matches our sales process. | P1 |
| US-6.3.5 | As a BD team member, I want the opportunity stage to automatically update when the linked contract progresses, so that I do not need to maintain both systems. | P2 |

**Acceptance Criteria**:

- [ ] Default pipeline stages are seeded: Opportunity Identified, Proposal Submission, Negotiation, Internal Approval, Contract Award, Contract Execution, Contract Management.
- [ ] Org Admin can add, rename, reorder, and deactivate pipeline stages.
- [ ] Each opportunity has: Opportunity ID (auto-generated), Customer, Deal Value, Sales Owner, Business Unit, Expected Contract Value, Stage, Created Date, Updated Date.
- [ ] A contract can be linked to zero or one opportunity. An opportunity can have multiple linked contracts.
- [ ] Stage auto-sync mapping:

| Contract Stage | Opportunity Stage |
|---|---|
| Under Review | Negotiation |
| CAS Generated | Internal Approval |
| Approved | Contract Award |
| Executed | Contract Execution |
| Active | Contract Management |

- [ ] Dashboard includes a pipeline funnel chart with real data from the Opportunities collection.

---

### 6.4 Contract Submission & Intake

**Description**: A structured intake process capturing all required contract metadata. Supports multiple submission channels: web form, email (via Outlook integration), and CSV bulk upload. Upon submission, the system initiates the appropriate review workflow automatically.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.4.1 | As an Employee, I want to submit a contract via a structured web form capturing title, counterparty, value, duration, business unit, department, category, risk classification, and contract owner, so that the review team has complete context. | P0 |
| US-6.4.2 | As an Employee, I want to save a contract as a draft before submitting, so that I can complete the form over multiple sessions. | P0 |
| US-6.4.3 | As an Employee, I want to attach one or more documents to my contract submission, so that reviewers can read the actual contract. | P0 |
| US-6.4.4 | As an Employee, I want to link my contract to an existing sales opportunity, so that the BD team has visibility. | P1 |
| US-6.4.5 | As an Org Admin, I want to configure the list of contract categories (MSA, NDA, SLA, SOW, etc.) and risk levels, so that the intake form reflects our business. | P1 |
| US-6.4.6 | As a BD team member, I want to bulk-upload contracts via CSV, so that I can migrate existing contracts into the system. | P1 |

**Acceptance Criteria**:

- [ ] Required intake fields: Title, Counterparty Name, Contract Value, Contract Duration, Business Unit, Department, Contract Owner.
- [ ] Optional intake fields: Sales Opportunity Reference, Contract Category, Risk Classification, Cost Center, Project Name, Expiry Date, Renewal Date.
- [ ] Saving as Draft does not trigger any workflow. Submitting transitions the contract to "Under Review" and triggers clause-based routing.
- [ ] At least one document attachment is required at submission (not for drafts).
- [ ] Business unit, department, category, and risk classification are selected from configurable dropdown lists managed by Org Admin.
- [ ] CSV upload accepts a defined template with validation. Rows with errors are reported individually; valid rows are processed.
- [ ] Upon successful submission, the submitter receives an in-app notification and (if configured) an email confirmation with contract ID and status link.

---

### 6.5 AI Triage, Self-Service & Verification

**Description**: An AI engine that performs three functions: (1) triages incoming contracts by analyzing content to determine complexity, risk, and required reviewers; (2) provides a self-service portal for standard/low-risk contract requests; and (3) verifies that employee feedback has been properly incorporated into revised contracts.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.5.1 | As an Employee, I want the system to analyze my submitted contract and automatically determine which departments need to review it, so that the contract is routed correctly without manual intervention. | P0 |
| US-6.5.2 | As an Employee, I want to request a standard NDA or simple agreement through a self-service portal, so that I do not need to wait for legal review on routine requests. | P1 |
| US-6.5.3 | As a Legal Counsel, I want the system to verify that an employee has incorporated my feedback before I re-review, so that I do not waste time on unchanged documents. | P1 |
| US-6.5.4 | As a CLO, I want the AI to assign a risk score to each contract, so that I can prioritize high-risk contracts for detailed review. | P1 |
| US-6.5.5 | As a Legal Counsel, I want the AI to extract key contract metadata (parties, dates, values, key terms) from uploaded documents, so that I do not need to manually enter them. | P2 |

**Acceptance Criteria**:

- [ ] AI triage analyzes uploaded contract documents and identifies clause categories (Commercial, Payment, Liability, Compliance, Vendor). Only departments with relevant clauses are added to the review queue.
- [ ] AI assigns a risk score (Low/Medium/High/Critical) based on contract value, clause analysis, and counterparty history. Risk score is visible on the contract detail view.
- [ ] Self-service portal offers templates for: NDA (Mutual), NDA (One-way), Simple Service Agreement, Data Processing Agreement. Employee fills in parameters, system generates the document. These bypass the full review workflow if risk is Low and value is below a configurable threshold.
- [ ] Self-service generated contracts still require at least one legal signoff (configurable).
- [ ] Feedback verification compares the original reviewed document with the resubmitted document and highlights whether flagged sections were modified. Verification result (Addressed / Not Addressed / Partially Addressed) is shown to the reviewer.
- [ ] AI extraction populates intake form fields from uploaded documents with at least 80% accuracy. User can review and correct extracted values before submission.

---

### 6.6 Clause-Based Department Review

**Description**: Contracts are routed to specific departments based on the types of clauses present. Reviews can be parallel (multiple departments review simultaneously) or sequential (departments review in order). Reviewers can comment, redline, request changes, and approve/reject within their scope.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.6.1 | As a Legal Counsel, I want to see only the contracts that contain clauses relevant to my department, so that I focus my time on what matters. | P0 |
| US-6.6.2 | As a Finance Reviewer, I want to approve or reject a contract with comments specific to payment terms, so that my feedback is clearly scoped. | P0 |
| US-6.6.3 | As a Legal Counsel, I want to add inline comments on specific clauses in the contract document, so that my feedback is contextual. | P1 |
| US-6.6.4 | As an Org Admin, I want to configure which clause types map to which departments, so that routing reflects our organizational structure. | P1 |
| US-6.6.5 | As a Legal Counsel, I want to upload a redlined version of the contract, so that the requester can see my proposed changes visually. | P1 |
| US-6.6.6 | As a CLO, I want departments to review contracts in parallel when there are no dependencies, so that review cycle time is minimized. | P0 |
| US-6.6.7 | As a reviewer, I want to request changes from the contract submitter and track whether those changes were made, so that I can re-review efficiently. | P1 |

**Acceptance Criteria**:

- [ ] Default clause-to-department mapping:

| Clause Type | Reviewing Department |
|---|---|
| Commercial Terms | Business / Sales |
| Payment Terms | Finance |
| Liability and Indemnity | Legal |
| Compliance Requirements | Compliance |
| Vendor Requirements | Procurement |

- [ ] Org Admin can add, edit, and delete clause-to-department mappings.
- [ ] When a contract is submitted, the AI triage engine identifies present clause types and creates review tasks only for relevant departments.
- [ ] Parallel review: all assigned departments receive their review tasks simultaneously. The contract advances to CAS generation only when ALL required departments have approved.
- [ ] If any department rejects, the contract returns to the submitter with consolidated feedback from all departments.
- [ ] Each review task tracks: assigned department, assigned reviewer (optional), status (Pending/In Progress/Approved/Rejected/Changes Requested), comments, timestamp of each action.
- [ ] Redline upload: reviewer can upload a marked-up document version. System stores it as a new document version with type "Redline".
- [ ] Change request creates a feedback loop: contract returns to submitter, submitter uploads revised document, AI verifies changes, contract returns to the requesting reviewer.

---

### 6.7 CAS Generation & Management

**Description**: After all department reviews are complete, the system auto-generates a Contract Approval Sheet (CAS). The CAS summarizes the contract, captures key issues from the review process, and defines the approval chain based on the DOA matrix. The CAS progresses through four approval roles: Initiator (I), Endorser (E), Reviewer (R), and Approver (A).

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.7.1 | As the system, I want to auto-generate a CAS when all department reviews are approved, so that the approval process starts without manual intervention. | P0 |
| US-6.7.2 | As a DOA Approver, I want to see the full CAS document with contract summary, key issues, review comments, and DOA chain, so that I can make an informed approval decision. | P0 |
| US-6.7.3 | As a DOA Approver, I want to approve or reject my step in the CAS approval chain, so that the contract progresses (or returns for revision). | P0 |
| US-6.7.4 | As an Org Admin, I want to export the CAS as a PDF, so that it can be attached to the DigiInk signature package. | P1 |
| US-6.7.5 | As a CLO, I want to see the endorsement record for each CAS step (name, role, department, date, decision), so that I have an audit trail. | P0 |

**Acceptance Criteria**:

- [ ] CAS is auto-generated within 60 seconds of the last department review approval.
- [ ] CAS contains these fields, all populated dynamically from contract data:

| CAS Field | Source |
|---|---|
| Business Unit | Contract record |
| Cost Center / Project Name | Contract record |
| Department | Contract record |
| Type of Agreement | Contract category |
| Execution / Effective Date | Contract record |
| Contract Value | Contract record |
| Key Issues to Note | Aggregated from review comments flagged as "key issue" |
| Other Comments | Reviewer summary comments |

- [ ] CAS approval chain has exactly 4 roles: Initiator (I), Endorser (E), Reviewer (R), Approver (A). The specific users assigned to each role are determined by the DOA rule engine.
- [ ] Each approval step records: approver name, role, department, decision (Approved/Rejected), comments, timestamp, and digital acknowledgment.
- [ ] Approval chain is sequential: I must approve before E can act; E before R; R before A.
- [ ] Rejection at any step returns the CAS to the Initiator with the rejection reason. A new CAS is generated after revisions.
- [ ] CAS PDF export includes all fields, the full endorsement record, and is formatted per the organization's template.
- [ ] Email notifications are sent at each step: when a step becomes active, the assigned approver is notified.

---

### 6.8 DOA Integration & Rule Engine

**Description**: A configurable Delegation of Authority (DOA) rule engine that determines the approval chain for each contract based on multiple dimensions: contract value, opportunity value, business unit, risk level, and contract category. Administrators can upload, update, and version DOA matrices.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.8.1 | As an Org Admin, I want to define DOA rules based on contract value thresholds per business unit, so that the correct authority level approves each contract. | P0 |
| US-6.8.2 | As an Org Admin, I want to define different DOA rules based on risk level, so that high-risk contracts require higher authority regardless of value. | P0 |
| US-6.8.3 | As an Org Admin, I want to upload and update the DOA matrix via a UI form, so that I do not need developer assistance to change thresholds. | P0 |
| US-6.8.4 | As an Org Admin, I want to see historical versions of the DOA matrix, so that I can audit what rules were in effect when a past contract was approved. | P1 |
| US-6.8.5 | As an Org Admin, I want to preview which approval chain would be triggered for a given contract value/risk/category combination, so that I can validate the DOA configuration before publishing. | P1 |
| US-6.8.6 | As the system, I want the DOA engine to evaluate multiple dimensions (value + risk + business unit + category) to determine the approval chain, so that governance is comprehensive. | P0 |

**Acceptance Criteria**:

- [ ] DOA rules support these evaluation dimensions:

| Dimension | Example Values |
|---|---|
| Contract Value | <$10K, $10K-$50K, $50K-$250K, $250K-$1M, >$1M |
| Opportunity Value | Same ranges (if linked to an opportunity) |
| Business Unit | Operations, Consulting, Technology, etc. |
| Risk Level | Low, Medium, High, Critical |
| Contract Category | NDA, MSA, SLA, SOW, etc. |

- [ ] Each DOA rule maps a combination of dimensions to an approval chain (list of authority levels and specific role/user assignments).
- [ ] When multiple rules match, the most restrictive rule (highest authority level required) takes precedence.
- [ ] DOA matrix changes create a new version. Previous versions are retained with effective date ranges.
- [ ] The preview tool shows: input (value, risk, unit, category) -> output (full approval chain with role names).
- [ ] Default seeded DOA rules:

| Value Range | Risk: Low | Risk: Medium | Risk: High/Critical |
|---|---|---|---|
| < $10,000 | Manager | Manager + Director | Director + VP |
| $10,000 -- $50,000 | Director | Director + VP | VP + CEO |
| $50,000 -- $250,000 | VP | VP + CEO | CEO + Board |
| > $250,000 | CEO | CEO + Board | Board |

---

### 6.9 DigiInk Digital Signature

**Description**: After CAS approval is complete, the system packages the CAS and contract documents, uploads them to the DigiInk digital signature platform, creates a signature workflow with pre-configured signing order, tracks signature status, and automatically retrieves the executed document back into the repository.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.9.1 | As the system, I want to automatically upload the approved CAS and contract documents to DigiInk after final CAS approval, so that the signature process begins without manual intervention. | P1 |
| US-6.9.2 | As an Org Admin, I want to configure the signature order (e.g., internal signatory first, then counterparty), so that signing follows our policy. | P1 |
| US-6.9.3 | As a Legal Counsel, I want to track the real-time signature status of contracts sent to DigiInk, so that I know if signatures are pending or complete. | P1 |
| US-6.9.4 | As the system, I want to automatically retrieve the fully executed document from DigiInk and store it in the repository, so that the executed copy is always accessible. | P1 |
| US-6.9.5 | As an Employee, I want to receive a notification when my contract has been fully signed, so that I know the contract is now active. | P1 |

**Acceptance Criteria**:

- [ ] Upon final CAS approval (Approver step complete), the system automatically: (1) packages CAS PDF + contract document(s) into a single envelope, (2) uploads to DigiInk via API, (3) creates signature workflow with configured signing order, (4) updates contract status to "Sent for Signature".
- [ ] Signature order is configurable per organization and can be overridden per contract.
- [ ] System polls DigiInk every 15 minutes (configurable) for status updates. Alternatively, a webhook endpoint receives real-time status callbacks from DigiInk.
- [ ] Signature status values tracked: Pending, Viewed, Signed (per signer), Completed, Declined, Voided.
- [ ] When all signers have signed (status: Completed), the system: (1) downloads the executed document, (2) stores it in the repository as the final version, (3) updates contract status to "Executed", (4) sends notifications to all stakeholders.
- [ ] If a signer declines, the contract status is updated to "Signature Declined" and the contract owner is notified.
- [ ] Dashboard includes a "Signature Status" section showing all contracts currently in the signing process.

---

### 6.10 Legal AI -- Document Editor (Future Phase)

**Description**: An in-browser, Word-like document editor with AI-powered clause analysis, collaborative editing, and real-time commenting. This is a future-phase feature intended to replace external document editing tools. (See Section 11 for detailed vision.)

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.10.1 | As a Legal Counsel, I want to edit contract documents directly in the browser with Word-like formatting, so that I do not need to download/edit/re-upload. | P2 |
| US-6.10.2 | As a Legal Counsel, I want the AI to analyze clauses and flag risks in real-time as I review, so that I catch issues faster. | P2 |
| US-6.10.3 | As a Legal Counsel, I want to add comment threads on specific text selections and @mention colleagues, so that we can collaborate in context. | P2 |
| US-6.10.4 | As a CLO, I want to compare two versions of a contract side-by-side with changes highlighted, so that I can see exactly what was modified. | P2 |
| US-6.10.5 | As a Legal Counsel, I want the AI to suggest standard clauses when it detects non-standard or risky language, so that I can quickly remediate issues. | P2 |

**Acceptance Criteria**: Defined in Section 11 (Legal AI -- Future Vision).

---

### 6.11 Notifications & Alerts

**Description**: Multi-channel notification system delivering alerts via in-app notifications and Microsoft Outlook email. Covers all workflow events: review assignments, approval requests, CAS generation, signature events, expiry warnings, and escalations for delayed actions.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.11.1 | As a reviewer, I want to receive a notification (in-app and email) when a contract is assigned to me for review, so that I can act promptly. | P0 |
| US-6.11.2 | As a DOA Approver, I want to receive escalation alerts when I have approvals pending for more than 3 days, so that contracts do not stall. | P0 |
| US-6.11.3 | As a contract owner, I want to receive expiry reminders at 90, 60, and 30 days before contract expiry, so that I can initiate renewal. | P1 |
| US-6.11.4 | As an Org Admin, I want to configure escalation thresholds and reminder intervals, so that the notification cadence matches our SLAs. | P1 |
| US-6.11.5 | As a user, I want to view all my notifications in an in-app notification center with read/unread status, so that I do not miss anything. | P0 |

**Acceptance Criteria**:

- [ ] Notification events generated for:

| Event | Recipients | Channel |
|---|---|---|
| Contract submitted | Contract owner, assigned reviewers | In-app + Email |
| Review assigned | Assigned reviewer | In-app + Email |
| Review completed (per department) | Contract owner, next reviewer (if sequential) | In-app + Email |
| All reviews completed | Contract owner | In-app + Email |
| CAS generated | CAS Initiator | In-app + Email |
| CAS step assigned | Next approver in chain | In-app + Email |
| CAS approved/rejected | Contract owner, all CAS participants | In-app + Email |
| Sent for signature | Contract owner, signers | In-app + Email |
| Signature completed | Contract owner, all stakeholders | In-app + Email |
| Contract expiry (90/60/30 days) | Contract owner, Org Admin | In-app + Email |
| Approval pending escalation | Approver, approver's manager | Email only |

- [ ] In-app notification center: paginated list, mark as read, mark all as read, filter by type.
- [ ] Email notifications include: contract title, action required, deep link to the contract.
- [ ] Escalation: if an approval is pending longer than the configured threshold (default 3 business days), the approver's manager receives an escalation email. If still pending after 2x threshold, the Org Admin is notified.
- [ ] Background scheduler runs every 4 hours to check for escalations and expiry reminders.
- [ ] All notification deliveries are logged (sent, delivered, failed) for troubleshooting.

---

### 6.12 Contract Lifecycle Tracking

**Description**: Tracks every contract through its complete lifecycle from Draft to Expired/Terminated. Manages renewals, amendments, and milestones. Provides a clear view of where every contract stands at any point in time.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.12.1 | As a contract owner, I want to see the current lifecycle status of my contract (Draft, Under Review, Pending Approval, Approved, Sent for Signature, Executed, Active, Expired, Terminated), so that I know where it stands. | P0 |
| US-6.12.2 | As an Org Admin, I want the system to automatically transition Active contracts to Expired when the expiry date passes, so that lifecycle status is always accurate. | P1 |
| US-6.12.3 | As a contract owner, I want to initiate a renewal for an expiring contract, so that the new contract inherits the details of the original. | P1 |
| US-6.12.4 | As a contract owner, I want to create an amendment to an active contract that goes through its own review/approval workflow, so that changes are governed. | P1 |
| US-6.12.5 | As a contract owner, I want to define milestones on a contract (e.g., "first deliverable due", "payment milestone 1") and receive reminders, so that obligations are tracked. | P2 |
| US-6.12.6 | As a CLO, I want to terminate a contract early with a recorded reason, so that the termination is auditable. | P1 |

**Acceptance Criteria**:

- [ ] Full lifecycle states:

| Status | Description | Transitions To |
|---|---|---|
| Draft | Contract created but not submitted | Under Review, Deleted |
| Under Review | Department reviews in progress | Pending Approval, Draft (if rejected) |
| Pending Approval | CAS generated, DOA approval in progress | Approved, Under Review (if rejected) |
| Approved | CAS fully approved | Sent for Signature |
| Sent for Signature | Uploaded to DigiInk | Executed, Signature Declined |
| Executed | All signatures obtained | Active |
| Active | Contract is in effect | Expired, Terminated, Amended |
| Expired | Expiry date has passed | Renewed |
| Terminated | Ended before expiry | (terminal state) |
| Renewed | New contract created from expired/active | Active (new contract) |

- [ ] Status transitions are enforced by the backend. Invalid transitions (e.g., Draft -> Executed) return a 400 error.
- [ ] Scheduled job runs daily at 00:00 UTC to move Active contracts past their expiry date to Expired.
- [ ] Renewal creates a new contract record linked to the parent via `renewedFromId`. New contract inherits: counterparty, business unit, department, category, and linked opportunity.
- [ ] Amendment creates a linked record with `parentContractId` and `amendmentNumber`. Amendments go through the review/approval workflow with a simplified CAS.
- [ ] Milestones have: title, due date, status (Upcoming/Due/Overdue/Completed), completion date. Milestone reminders are sent 7 days and 1 day before the due date.
- [ ] Lifecycle timeline view: a visual timeline on the contract detail page showing all status transitions with timestamps and actors.

---

### 6.13 Reporting & Dashboards

**Description**: Real-time dashboards and exportable reports providing visibility into contract pipeline, review status, approval status, signature progress, and compliance posture.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.13.1 | As a CLO, I want a dashboard showing contracts under review, pending approval, pending signature, and expiring soon, so that I have a real-time overview. | P0 |
| US-6.13.2 | As an Org Admin, I want to see CAS approval status and identify bottlenecks, so that I can escalate delayed approvals. | P0 |
| US-6.13.3 | As a BD team member, I want a pipeline-vs-contract status chart, so that I can see how deals are progressing through contracting. | P1 |
| US-6.13.4 | As a CLO, I want to export reports in CSV, Excel, and PDF formats, so that I can share them with leadership and auditors. | P1 |
| US-6.13.5 | As an Org Admin, I want an audit/compliance report for a given date range, so that I can support internal and external audits. | P1 |

**Acceptance Criteria**:

- [ ] Dashboard KPI cards (updated in real-time):
  - Total active contracts (with value)
  - Contracts under review (count, avg days in review)
  - Contracts pending DOA approval (count, avg days pending)
  - Contracts awaiting signature (count)
  - Contracts expiring in 30 days (count, total value)
  - Self-service resolution rate (%)

- [ ] Dashboard charts:
  - Contracts by status (pie/donut chart)
  - Contracts by business unit (bar chart)
  - Sales pipeline vs. contract status (funnel chart)
  - Monthly contract volume trend (line chart)
  - Average cycle time by category (bar chart)

- [ ] Reports page with filterable table: filter by status, business unit, department, date range, contract owner, value range.
- [ ] Export: CSV export available on all report tables. PDF and Excel export available for formal reports.
- [ ] Audit report includes: all approval decisions, DOA routing logs, CAS endorsement records, and document change history for the selected period.
- [ ] All dashboard data loads within 3 seconds. Reports with up to 10,000 records load within 5 seconds.

---

### 6.14 Security, Access Control & Audit

**Description**: Enterprise-grade security including authentication, role-based authorization, encryption, access logging, and comprehensive audit trails. Every state-changing action in the system is recorded for compliance and forensic purposes.

**User Stories**:

| ID | Story | Priority |
|---|---|---|
| US-6.14.1 | As an Org Admin, I want users to authenticate via Microsoft Entra ID SSO, so that credentials are managed centrally and securely. | P0 |
| US-6.14.2 | As an Org Admin, I want to assign roles to users that control what they can view and do, so that access is least-privilege. | P0 |
| US-6.14.3 | As a CLO, I want a complete audit trail for every contract showing who did what and when, so that I can demonstrate compliance to auditors. | P0 |
| US-6.14.4 | As a Platform Admin, I want all documents encrypted at rest and in transit, so that sensitive contract data is protected. | P0 |
| US-6.14.5 | As a Platform Admin, I want all API access logged with user identity, endpoint, and timestamp, so that suspicious activity can be detected. | P1 |
| US-6.14.6 | As an Org Admin, I want to export audit logs for a given entity or date range, so that I can provide evidence to auditors. | P1 |

**Acceptance Criteria**:

- [ ] Authentication: Microsoft Entra ID SSO via OIDC. JWT tokens issued with 1-hour expiry and refresh token rotation. All API endpoints require valid authentication except `/health` and `/api/auth/callback`.
- [ ] Authorization: RBAC enforced at the API level. Roles and their permissions:

| Permission | Platform Admin | Org Admin | CLO | Legal Counsel | Employee | Reviewer | DOA Approver |
|---|---|---|---|---|---|---|---|
| Manage organizations | Yes | No | No | No | No | No | No |
| Manage users | Yes | Yes (own org) | No | No | No | No | No |
| Configure DOA/pipelines | Yes | Yes (own org) | No | No | No | No | No |
| Submit contracts | Yes | Yes | Yes | Yes | Yes | No | No |
| View all contracts (own org) | Yes | Yes | Yes | No | No | No | No |
| View assigned contracts | - | - | - | Yes | Own only | Yes | Yes |
| Review contracts | No | No | Yes | Yes | No | Yes | No |
| Approve CAS | No | No | Yes | No | No | No | Yes |
| Export reports | Yes | Yes | Yes | No | No | No | No |
| View audit logs | Yes | Yes (own org) | Yes | No | No | No | No |

- [ ] Encryption: TLS 1.2+ for all data in transit. AES-256 for documents at rest. Database connections use TLS.
- [ ] Audit log captures every state-changing event:

| Event Type | Logged Fields |
|---|---|
| CONTRACT_CREATED | Contract ID, submitted by, timestamp, initial values |
| CONTRACT_UPDATED | Contract ID, changed fields (before/after), updated by, timestamp |
| DOCUMENT_UPLOADED | Document ID, contract ID, file name, uploaded by, timestamp |
| REVIEW_SUBMITTED | Contract ID, department, decision, reviewer, comments summary, timestamp |
| CAS_GENERATED | CAS ID, contract ID, approval chain, DOA rule applied, timestamp |
| CAS_STEP_COMPLETED | CAS ID, step role, decision, approver name, department, timestamp |
| DOA_MATRIX_UPDATED | Matrix version, changed by, changes summary, timestamp |
| SIGNATURE_SENT | Contract ID, DigiInk envelope ID, signers, timestamp |
| SIGNATURE_COMPLETED | Contract ID, DigiInk envelope ID, completion timestamp |
| USER_LOGIN | User ID, IP address, timestamp, success/failure |
| USER_ROLE_CHANGED | User ID, old role, new role, changed by, timestamp |

- [ ] Audit logs are append-only. No user (including Platform Admin) can delete audit records.
- [ ] Audit log export: CSV and JSON formats, filtered by entity, event type, user, and date range.
- [ ] API access logs stored separately from audit logs. Retained for 90 days minimum.
- [ ] Passwords (if local auth fallback is used) are hashed with bcrypt (cost factor 12). Plaintext passwords are never stored or transmitted.

---

## 7. Workflow Specifications

The system operates as **two distinct but interconnected modules**:

| | Module A: Legal Request Flow | Module B: Contract Approval Flow |
|---|---|---|
| **Purpose** | Legal advisory, opinions, document preparation | Contract governance, approval, execution |
| **Initiated by** | Any employee (requester) from any department | Sales/BD team from a deal opportunity |
| **AI Role** | Self-service portal for basic requests; feedback verification | Clause extraction, classification, dept routing |
| **Review by** | Legal Counsel (single reviewer) | Multiple departments in parallel (by clause type) |
| **Approval by** | Chief Legal Officer | DOA chain (I→E→R→A) based on value/risk |
| **Output** | Legal opinion / reviewed document delivered to requester | CAS approved, contract signed via DigiInk, archived |
| **Loops** | Requester ↔ Counsel (AI verified) + Counsel ↔ CLO | Dept feedback ↔ Submitter + DOA revision loop |

### 7.0 Module A — Legal Request Flow (Happy Path)

```
[1] Requester Raises Legal Request (any department)
     |  - Form, email, document upload
     |
[2] AI Triage & Classification
     |  - Assess complexity and type
     |  - Basic request? -> Self-Service Portal
     |  - Complex request? -> Route to Legal Counsel
     |
[3a] Self-Service Path (basic/standard requests)
     |  - NDA, template-based agreements, simple documents
     |  - AI generates document from templates
     |  - Returned to requester (resolved)
     |
[3b] Legal Counsel Review (complex requests)
     |  - Counsel reviews, drafts, sends feedback to requester
     |
[4] Feedback Loop (repeats until Counsel approves)
     |  - Counsel sends revision notes
     |  - Requester incorporates feedback & resubmits
     |  - AI verifies changes have been incorporated
     |  - Counsel re-reviews (approves or sends new feedback)
     |
[5] Chief Legal Officer Review
     |  - Counsel submits final package to CLO
     |  - CLO approves, requests revision, or rejects
     |  - If revision: Counsel amends and resubmits (loop)
     |
[6] Delivered to Requester
     - Approved document with full approval chain & legal notes
```

### 7.1 Module B — Contract Approval Flow (Happy Path)

```
[1] Sales Opportunity Created (BD Team)
     |
[2] Contract Drafted (Employee/BD)
     |  - Save as Draft
     |  - Attach documents
     |  - Link to opportunity
     |
[3] Contract Submitted
     |  - Validate required fields
     |  - AI triage: identify clauses, assess risk, determine review departments
     |  - Status: Draft -> Under Review
     |
[4] Clause-Based Department Review (Parallel)
     |  - Commercial Terms -> Business/Sales team
     |  - Payment Terms -> Finance team
     |  - Liability -> Legal team
     |  - Compliance -> Compliance team
     |  - Vendor Terms -> Procurement team
     |  - Each department reviews independently
     |  - All departments approve
     |
[5] CAS Auto-Generated
     |  - System aggregates review outcomes
     |  - DOA rule engine determines approval chain
     |  - CAS document populated with contract data + key issues
     |  - Status: Under Review -> Pending Approval
     |
[6] CAS Approval Chain (Sequential: I -> E -> R -> A)
     |  - Initiator endorses
     |  - Endorser endorses
     |  - Reviewer endorses
     |  - Approver gives final approval
     |  - Status: Pending Approval -> Approved
     |
[7] DigiInk Digital Signature
     |  - CAS + contract packaged and uploaded
     |  - Signature workflow created with signing order
     |  - Status: Approved -> Sent for Signature
     |  - Signers sign in order
     |  - Executed document retrieved and stored
     |  - Status: Sent for Signature -> Executed
     |
[8] Contract Activation
     |  - Status: Executed -> Active
     |  - Lifecycle monitoring begins (milestones, renewals, expiry)
     |
[9] Lifecycle Events
     - Expiry reminders sent (90/60/30 days)
     - Renewal initiated if needed
     - Amendments processed through review/approval cycle
     - Termination recorded with reason if applicable
```

### 7.2 Rejection / Revision Paths (Both Modules)

#### 7.2.1 Department Review Rejection

```
Department Reviewer Rejects
     |
     v
Contract status remains "Under Review"
     |
     v
Notification sent to contract owner:
  - Rejection reason and department
  - Specific feedback/comments
  - Deep link to contract
     |
     v
Contract owner revises and resubmits
     |
     v
AI verifies feedback incorporation
     |
     v
Contract re-enters review queue:
  - Only the rejecting department re-reviews (not all departments)
  - Previously approved departments retain their approval
  - Unless changes affect their clauses (AI detects and re-triggers if needed)
```

#### 7.2.2 CAS Approval Rejection

```
CAS Approver (any step) Rejects
     |
     v
CAS status -> "Rejected"
Contract status -> "Under Review" (returns to revision)
     |
     v
Notification to contract owner and all CAS participants:
  - Who rejected, at which step
  - Rejection reason
  - Required changes
     |
     v
Contract owner revises contract
     |
     v
Contract re-enters department review (if changes are substantive)
     OR
CAS is regenerated with revisions (if changes are minor/CAS-only)
     |
     v
New CAS approval cycle begins from step 1 (Initiator)
```

#### 7.2.3 Signature Declined

```
Signer Declines in DigiInk
     |
     v
DigiInk webhook notifies system
     |
     v
Contract status -> "Signature Declined"
     |
     v
Notification to contract owner and CLO:
  - Who declined
  - Decline reason (if provided by DigiInk)
     |
     v
Manual resolution:
  - Contract owner contacts declining party
  - Either: resubmit for signature (status -> Sent for Signature)
  - Or: contract requires revision (status -> Under Review, restart workflow)
  - Or: contract is terminated
```

### 7.3 Escalation Paths

```
Approval Pending > 3 business days (configurable)
     |
     v
Level 1 Escalation: Reminder email to the approver
     |
     (still pending after 3 more business days)
     |
     v
Level 2 Escalation: Notification to approver's manager
     |
     (still pending after 3 more business days)
     |
     v
Level 3 Escalation: Notification to Org Admin
     |
     v
Org Admin can:
  - Reassign the approval to a delegate
  - Escalate further to the CLO
  - Override (with documented justification captured in audit log)
```

### 7.4 Feedback Loops

#### 7.4.1 Employee <-> Legal Counsel Feedback Loop

```
Legal Counsel requests changes on contract
     |
     v
Notification to Employee with:
  - Specific feedback items
  - Affected clauses/sections
  - Deadline for revision
     |
     v
Employee uploads revised document
     |
     v
AI Verification Engine:
  - Compares original vs. revised document
  - Checks each feedback item: Addressed / Not Addressed / Partially Addressed
  - Generates verification report
     |
     v
Legal Counsel sees verification report:
  - Green: all feedback addressed -> can approve without full re-read
  - Yellow: partially addressed -> review specific sections
  - Red: not addressed -> request changes again or escalate
```

#### 7.4.2 Legal Counsel <-> Chief Legal Officer Feedback Loop

```
Legal Counsel flags a contract for CLO attention
  (e.g., high-risk clause, unusual terms, policy exception needed)
     |
     v
CLO receives notification with context:
  - Contract summary
  - Flagged issues
  - Counsel's recommendation
     |
     v
CLO reviews and responds:
  - Approves counsel's recommendation
  - Provides guidance/direction
  - Requests additional analysis
  - Takes over the review personally
     |
     v
CLO decision is recorded in audit trail
Legal Counsel proceeds based on CLO direction
```

### 7.5 AI Self-Service Flow

```
Employee requests a standard contract (e.g., NDA)
     |
     v
AI Self-Service Portal:
  - Identifies request type
  - Checks if eligible for self-service:
    * Contract category is in self-service list (e.g., NDA, DPA)
    * Contract value below threshold (configurable, e.g., <$10K)
    * Risk classification is Low
     |
     v
If eligible:
  - Presents template selection
  - Employee fills parameters (parties, dates, terms)
  - AI generates document from template
  - Single legal signoff required (streamlined review)
  - Proceeds to signature
     |
If NOT eligible:
  - Routes to standard intake/review workflow
  - Employee is notified with reason
```

---

## 8. Data Model (Key Entities)

### 8.1 Organization & Users

#### Organization

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| name | String | Organization name |
| slug | String | URL-friendly identifier |
| subscription_tier | String | Platform subscription level |
| settings | Object | Org-wide configurations (notification prefs, thresholds) |
| entra_tenant_id | String | Microsoft Entra ID tenant ID for SSO |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| is_active | Boolean | Whether the org is active |

#### Subsidiary

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Parent organization reference |
| name | String | Subsidiary name |
| business_unit | String | Business unit identifier |
| country | String | Operating country |
| settings_override | Object | Subsidiary-specific config overrides |
| created_at | DateTime | Creation timestamp |

#### User

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| entra_id | String | Microsoft Entra ID object ID |
| email | String | Email address (unique per org) |
| full_name | String | Display name |
| role | String | Application role (Platform Admin, Org Admin, CLO, Legal Counsel, Employee) |
| department | String | Department assignment |
| business_unit | String | Business unit assignment |
| manager_id | ObjectId | Direct manager (for escalation routing) |
| is_active | Boolean | Account status |
| notification_preferences | Object | Per-event-type channel preferences |
| last_login | DateTime | Last login timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### 8.2 Contracts & Documents

#### Contract

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| contract_number | String | Auto-generated human-readable ID (e.g., NET-2026-00142) |
| title | String | Contract title |
| counterparty | String | Other party name |
| value | Decimal | Contract monetary value |
| currency | String | Currency code (e.g., USD, GBP) |
| duration | String | Contract duration (e.g., "12 months") |
| start_date | DateTime | Contract start/effective date |
| expiry_date | DateTime | Contract expiry date |
| renewal_date | DateTime | Renewal deadline date |
| business_unit | String | Originating business unit |
| department | String | Originating department |
| category | String | Contract category (MSA, NDA, SLA, SOW, etc.) |
| risk_classification | String | Risk level (Low, Medium, High, Critical) |
| ai_risk_score | Float | AI-calculated risk score (0.0 - 1.0) |
| contract_owner_id | ObjectId | Contract owner (User reference) |
| submitted_by_id | ObjectId | Original submitter |
| opportunity_id | ObjectId | Linked sales opportunity (nullable) |
| cost_center | String | Cost center code |
| project_name | String | Project name |
| status | String | Lifecycle status (see 6.12) |
| stage | String | Workflow sub-stage (e.g., "Legal Review", "Finance Review") |
| required_review_departments | Array[String] | Departments determined by AI triage |
| review_status | Object | Per-department review status |
| cas_id | ObjectId | Generated CAS reference |
| digiink_envelope_id | String | DigiInk signature envelope ID |
| renewed_from_id | ObjectId | Parent contract if this is a renewal |
| parent_contract_id | ObjectId | Parent contract if this is an amendment |
| amendment_number | Integer | Amendment sequence number |
| milestones | Array[Object] | Contract milestones |
| tags | Array[String] | User-defined tags |
| metadata | Object | Extensible metadata |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

#### ContractVersion

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| contract_id | ObjectId | Parent contract reference |
| version_number | Integer | Sequential version number |
| change_description | String | Description of what changed |
| changed_fields | Object | Before/after values for changed fields |
| changed_by_id | ObjectId | User who made the change |
| created_at | DateTime | Version creation timestamp |

#### Document

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| contract_id | ObjectId | Parent contract reference |
| file_name | String | Original file name |
| file_type | String | MIME type |
| file_size | Integer | Size in bytes |
| storage_path | String | Path in storage backend |
| storage_backend | String | "azure_blob" / "gridfs" / "s3" |
| version | Integer | Document version number |
| document_type | String | Contract / Amendment / CAS / Redline / Executed / Attachment |
| tags | Array[String] | Document tags |
| checksum | String | SHA-256 hash for integrity verification |
| uploaded_by_id | ObjectId | Uploader reference |
| is_deleted | Boolean | Soft delete flag |
| created_at | DateTime | Upload timestamp |

#### Clause

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| contract_id | ObjectId | Parent contract reference |
| clause_type | String | Commercial / Payment / Liability / Compliance / Vendor / Other |
| title | String | Clause heading |
| content | String | Clause text |
| page_number | Integer | Location in document |
| ai_risk_score | Float | AI risk assessment for this clause |
| ai_flags | Array[String] | AI-detected issues |
| review_department | String | Department responsible for reviewing |
| status | String | Pending Review / Approved / Flagged / Modified |
| created_at | DateTime | Extraction timestamp |

### 8.3 Review & Approval

#### ReviewTask

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| contract_id | ObjectId | Contract reference |
| department | String | Reviewing department |
| assigned_to_id | ObjectId | Specific reviewer (nullable; department queue if null) |
| clause_types | Array[String] | Clause types to review |
| status | String | Pending / In Progress / Approved / Rejected / Changes Requested |
| decision | String | Approve / Reject / Request Changes |
| comments | String | Overall review comments |
| key_issues | Array[String] | Issues flagged as "key" for CAS |
| started_at | DateTime | When reviewer began |
| completed_at | DateTime | When review was finalized |
| created_at | DateTime | Task creation timestamp |

#### ReviewComment

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| review_task_id | ObjectId | Parent review task |
| contract_id | ObjectId | Contract reference |
| clause_id | ObjectId | Specific clause (nullable for general comments) |
| author_id | ObjectId | Comment author |
| content | String | Comment text |
| comment_type | String | General / Inline / Key Issue / Suggestion |
| parent_comment_id | ObjectId | For threaded replies (nullable) |
| is_resolved | Boolean | Whether the comment has been addressed |
| created_at | DateTime | Comment timestamp |

### 8.4 CAS & DOA

#### CAS (Contract Approval Sheet)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| contract_id | ObjectId | Contract reference |
| cas_number | String | Auto-generated CAS identifier |
| business_unit | String | From contract |
| cost_center | String | From contract |
| project_name | String | From contract |
| department | String | From contract |
| agreement_type | String | Contract category |
| execution_date | DateTime | Target execution date |
| contract_value | Decimal | Contract value |
| currency | String | Currency code |
| key_issues | Array[String] | Aggregated from review key issues |
| comments | String | Additional comments |
| approval_chain | Array[CASApproval] | Ordered list of approval steps |
| status | String | Draft / In Progress / Approved / Rejected |
| doa_rule_applied | Object | Snapshot of the DOA rule that determined the chain |
| generated_at | DateTime | CAS creation timestamp |
| completed_at | DateTime | Final approval timestamp |
| pdf_document_id | ObjectId | Reference to generated CAS PDF |

#### CASApproval

| Field | Type | Description |
|---|---|---|
| step_order | Integer | 1=Initiator, 2=Endorser, 3=Reviewer, 4=Approver |
| role_code | String | I / E / R / A |
| role_name | String | Initiator / Endorser / Reviewer / Approver |
| assigned_to_id | ObjectId | User assigned to this step |
| assigned_to_name | String | Denormalized for display |
| department | String | Approver's department |
| status | String | Pending / Approved / Rejected |
| decision | String | Approved / Rejected |
| comments | String | Approver's comments |
| acted_at | DateTime | Timestamp of action |

#### DOAMatrix

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| version | Integer | Matrix version number |
| effective_from | DateTime | When this version became effective |
| effective_to | DateTime | When superseded (null if current) |
| is_current | Boolean | Whether this is the active version |
| rules | Array[DOARule] | List of rules in this matrix |
| created_by_id | ObjectId | Who created/updated |
| created_at | DateTime | Creation timestamp |

#### DOARule

| Field | Type | Description |
|---|---|---|
| rule_id | String | Unique rule identifier |
| business_unit | String | Applicable business unit ("*" for all) |
| category | String | Applicable contract category ("*" for all) |
| risk_level | String | Applicable risk level ("*" for all) |
| min_value | Decimal | Minimum contract value (inclusive) |
| max_value | Decimal | Maximum contract value (exclusive; null for unlimited) |
| approval_chain | Array[Object] | Required approval roles: [{role: "Manager", level: 1}, ...] |
| description | String | Human-readable rule description |

### 8.5 Notifications & Audit

#### Notification

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| recipient_id | ObjectId | Target user |
| event_type | String | Notification event type (e.g., REVIEW_ASSIGNED) |
| title | String | Notification title |
| message | String | Notification body |
| entity_type | String | Related entity type (Contract, CAS, etc.) |
| entity_id | ObjectId | Related entity ID |
| deep_link | String | URL path to the relevant page |
| channel | String | in_app / email / both |
| email_status | String | pending / sent / failed / not_applicable |
| is_read | Boolean | Whether user has read it |
| created_at | DateTime | Notification timestamp |

#### AuditLog

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| event_type | String | Event type code (e.g., CONTRACT_CREATED) |
| entity_type | String | Affected entity type |
| entity_id | ObjectId | Affected entity ID |
| user_id | ObjectId | Acting user |
| user_name | String | Denormalized user name |
| user_role | String | User's role at time of action |
| action | String | Human-readable description |
| details | Object | Structured event data (before/after, decisions, etc.) |
| ip_address | String | Client IP address |
| user_agent | String | Client user agent |
| timestamp | DateTime | Event timestamp |

### 8.6 Sales Pipeline

#### SalesOpportunity

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Primary key |
| org_id | ObjectId | Organization reference |
| opportunity_id | String | Human-readable ID (e.g., OPP-2026-0042) |
| customer | String | Customer/counterparty name |
| deal_value | Decimal | Expected deal value |
| currency | String | Currency code |
| sales_owner_id | ObjectId | Sales owner (User reference) |
| business_unit | String | Business unit |
| expected_contract_value | Decimal | Expected contract value |
| stage | String | Current pipeline stage |
| stage_history | Array[Object] | Stage transition history: [{stage, changed_at, changed_by}] |
| country | String | Deal country (for international deals) |
| notes | String | Opportunity notes |
| contract_ids | Array[ObjectId] | Linked contracts |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

## 9. Integration Specifications

### 9.1 Microsoft Outlook (Graph API)

| Aspect | Specification |
|---|---|
| **Protocol** | Microsoft Graph API v1.0 |
| **Authentication** | OAuth2 client credentials flow (daemon/service) + delegated flow (user context) |
| **Permissions Required** | `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`, `User.Read.All` |
| **Inbound Email Processing** | Monitor a designated shared mailbox (e.g., contracts@netltd.com). Poll every 5 minutes or use Graph subscriptions (webhooks) for real-time notification. Extract attachments, parse subject/body for metadata, create contract draft. |
| **Outbound Notifications** | Use `/me/sendMail` (delegated) or `/users/{id}/sendMail` (application) to send notifications. HTML email templates with deep links. |
| **Outlook Add-in** | Office Add-in using Office.js. Manifest deployed via Microsoft 365 admin center. Task pane loads Contrax CLM submission form. Reads current email context via `Office.context.mailbox.item`. |
| **Error Handling** | Retry with exponential backoff (3 attempts). Dead letter queue for unprocessable emails. Alert Org Admin on persistent failures. |
| **Rate Limits** | Respect Graph API throttling (429 responses). Implement token bucket rate limiting on outbound calls. |

### 9.2 DigiInk Digital Signature

| Aspect | Specification |
|---|---|
| **Protocol** | REST API (HTTPS) |
| **Authentication** | API key + OAuth2 (specific to DigiInk's requirements) |
| **Upload Flow** | `POST /api/envelopes` -- Create envelope with document(s) and signer list. Multi-part form upload for documents. Returns `envelope_id`. |
| **Signature Workflow** | `POST /api/envelopes/{id}/send` -- Initiate signing. Signers receive email invitations from DigiInk. Signing order enforced by `order` field on each signer. |
| **Status Polling** | `GET /api/envelopes/{id}/status` -- Returns per-signer status. Poll every 15 minutes via background job. |
| **Webhooks** | Register webhook URL: `POST /api/webhooks`. DigiInk calls `POST /api/webhooks/digiink` on our backend for events: `envelope.completed`, `envelope.declined`, `envelope.voided`, `signer.signed`, `signer.viewed`. |
| **Document Retrieval** | `GET /api/envelopes/{id}/documents` -- Download fully executed document (all signatures embedded). Store as final version in repository. |
| **Error Handling** | Retry failed uploads 3 times. If DigiInk is unavailable, queue the signature request and retry when service recovers. Alert Org Admin on persistent failures. |

### 9.3 Microsoft Entra ID (SSO)

| Aspect | Specification |
|---|---|
| **Protocol** | OpenID Connect (OIDC) / OAuth2 |
| **Flow** | Authorization Code Flow with PKCE (frontend SPA) |
| **App Registration** | Single multi-tenant app registration in Azure AD. Redirect URIs configured per environment. |
| **Token Handling** | Frontend receives ID token + access token. Access token sent as Bearer token to backend. Backend validates token signature, issuer, audience, and expiry using Entra ID JWKS endpoint. |
| **Group-to-Role Mapping** | Entra ID security groups map to application roles. Org Admin configures mapping in Contrax CLM settings. Example: Entra group "CLM-LegalCounsel" maps to role "Legal Counsel". |
| **User Provisioning** | On first login, if user exists in Entra ID but not in Contrax CLM, auto-create user record with default "Employee" role. Org Admin can upgrade role. |
| **Session Management** | Access token: 1 hour expiry. Refresh token: 24 hours (sliding). Silent token renewal via MSAL.js. |

### 9.4 Sales Pipeline Data Sync

| Aspect | Specification |
|---|---|
| **Current Approach** | Native within Contrax CLM. No external CRM integration in Phase 1. |
| **Future CRM Integration** | API-first design enables future sync with Salesforce, HubSpot, or Dynamics 365 via webhook or polling. |
| **Sync Direction** | Bidirectional when integrated: opportunity created in CRM -> synced to Contrax CLM. Contract status in Contrax CLM -> synced back to CRM. |
| **Conflict Resolution** | Contrax CLM is the source of truth for contract status. CRM is the source of truth for opportunity commercial details. |
| **API Endpoints for External Sync** | `POST /api/opportunities/sync` -- Upsert opportunity from external source. `GET /api/opportunities/{id}/status` -- Return current opportunity + linked contract status. |

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target | Measurement |
|---|---|---|
| API response time (95th percentile) | < 500ms | For standard CRUD operations |
| Dashboard load time | < 3 seconds | Full dashboard with all KPI cards and charts |
| Search response time | < 3 seconds | Full-text search across contracts and documents |
| Report generation (up to 10K records) | < 5 seconds | Filtered report table rendering |
| PDF export generation | < 10 seconds | CAS PDF or report PDF |
| File upload (50MB max) | < 30 seconds | Document upload including virus scan |
| Concurrent users per tenant | 100 | Without performance degradation |
| Total concurrent users (platform) | 1,000 | Across all tenants |

### 10.2 Scalability

| Aspect | Approach |
|---|---|
| Horizontal scaling | Stateless FastAPI backend behind a load balancer. Add instances to handle increased load. |
| Database scaling | MongoDB replica set for read scaling. Sharding by org_id for large-scale multi-tenant growth. Indexes on frequently queried fields (org_id, status, contract_owner_id, created_at). |
| File storage | Cloud-native blob storage (Azure Blob / S3) scales independently of compute. |
| Background jobs | Separate worker processes for email sending, reminders, DigiInk polling. Scale independently from API servers. |
| Tenant isolation under load | Per-tenant rate limiting to prevent noisy-neighbor issues. |

### 10.3 Security

| Requirement | Specification |
|---|---|
| Authentication | Microsoft Entra ID SSO (OIDC/OAuth2). MFA enforced at the Entra ID level. |
| Authorization | RBAC enforced at API middleware level. All endpoints protected. |
| Encryption in transit | TLS 1.2+ for all communications. HSTS headers enforced. |
| Encryption at rest | AES-256 for document storage. MongoDB encryption at rest (WiredTiger). |
| Input validation | All API inputs validated with Pydantic models. SQL/NoSQL injection prevention. XSS prevention via output encoding. |
| OWASP Top 10 | Address all OWASP Top 10 vulnerabilities. Regular dependency scanning. |
| Secret management | API keys, database credentials, and encryption keys stored in environment variables or a secrets manager (Azure Key Vault). Never in code or config files. |
| CORS | Restrict to specific frontend domain(s). No wildcard origins in production. |
| Rate limiting | API rate limiting per user (100 requests/minute) and per tenant (1000 requests/minute). |
| Penetration testing | Annual penetration test by a third party (recommended for production). |
| SOC 2 considerations | Audit logging, access controls, encryption, and incident response procedures align with SOC 2 Type II requirements. |

### 10.4 Availability

| Metric | Target |
|---|---|
| Uptime SLA | 99.5% (approximately 43 hours downtime/year) |
| Planned maintenance window | Weekends, 02:00-06:00 UTC, with 72-hour advance notice |
| Recovery Time Objective (RTO) | 4 hours |
| Recovery Point Objective (RPO) | 1 hour (hourly database backups) |
| Disaster recovery | Automated database backups to a secondary region. Documented runbook for failover. |

### 10.5 Data Residency & Compliance

| Requirement | Specification |
|---|---|
| GDPR | Personal data (user names, emails) processing compliant with GDPR. Data Subject Access Requests (DSAR) supported: export all data for a user. Right to erasure: anonymize user data upon verified request (audit logs exempt -- anonymized but retained). |
| Data residency | Primary data storage in the same region as the organization's Microsoft 365 tenant. Configurable per tenant for multi-region deployments. |
| Data retention | Active contracts: retained indefinitely. Expired/terminated contracts: retained for 7 years (configurable per org). Audit logs: retained for 7 years minimum. |
| Data export | Org Admin can export all organization data in machine-readable format (JSON/CSV) for portability. |

---

## 11. Legal AI -- Future Vision (Phase 2)

This section describes the Legal AI capabilities planned for Phase 3 of the implementation. These features transform Contrax CLM from a workflow management system into an intelligent contract analysis and collaboration platform.

### 11.1 In-Browser Document Editor

A Word-like editor embedded in the browser, enabling contract editing without downloading files or using external tools.

**Capabilities**:
- Rich text editing with formatting toolbar (bold, italic, headings, lists, tables)
- DOCX import and export with high-fidelity formatting preservation
- PDF rendering (read-only with annotation overlay)
- Auto-save with conflict detection
- Undo/redo with full history

**Technical approach**: Integrate an open-source editor framework (e.g., ProseMirror, TipTap, or Plate) customized for legal document workflows. Server-side DOCX conversion using `python-docx` or LibreOffice headless.

### 11.2 Real-Time Collaborative Editing

Multiple users can view and edit the same document simultaneously, similar to Google Docs or Microsoft 365 online.

**Capabilities**:
- Real-time cursor presence (see where other users are editing)
- Conflict-free concurrent edits using Operational Transform (OT) or CRDT
- User presence indicators (who is viewing the document)
- Lock sections to prevent concurrent edits on the same clause (optional)

**Technical approach**: WebSocket-based real-time sync. Consider Yjs (CRDT library) for conflict resolution. Presence awareness via WebSocket heartbeats.

### 11.3 AI-Powered Clause Analysis & Risk Scoring

The AI engine reads contract documents and provides clause-level analysis.

**Capabilities**:
- Identify and classify all clauses in a contract
- Score each clause for risk (0-100 scale) with explanation
- Flag non-standard, unusual, or potentially harmful clauses
- Compare clauses against the organization's standard playbook
- Highlight deviations from approved templates
- Provide natural language explanations of complex legal terms

**Technical approach**: Fine-tuned LLM (Azure OpenAI GPT-4 or equivalent) with a retrieval-augmented generation (RAG) pipeline. Organization's clause library and playbook serve as the knowledge base. Risk scoring model trained on historical contract review decisions.

### 11.4 Auto-Suggestions for Standard Clauses

When the AI detects a non-standard or risky clause, it suggests a replacement from the organization's approved clause library.

**Capabilities**:
- Side-by-side comparison: current clause vs. suggested standard clause
- One-click replacement with track changes
- Explanation of why the standard clause is recommended
- Support for multiple alternative suggestions ranked by relevance
- Org Admin can curate and maintain the clause library

### 11.5 Comment Threads & @Mentions

Contextual commenting directly on contract text, with the ability to tag colleagues.

**Capabilities**:
- Select text and add a comment (similar to Word/Google Docs)
- Threaded replies on comments
- @mention users to notify them and draw attention
- Mark comments as resolved
- Filter comments by author, department, resolved/unresolved
- Comments persist across document versions

### 11.6 Version Comparison & Diff View

Visual comparison of any two versions of a contract document.

**Capabilities**:
- Side-by-side diff view with additions (green), deletions (red), and modifications (yellow)
- Inline diff view (single document with change marks)
- Jump between changes
- Summary of changes (number of additions, deletions, modifications per section)
- Compare any two versions, not just consecutive ones

### 11.7 Alert System for Flagged Terms

Real-time alerts when specific terms or patterns are detected in a contract.

**Capabilities**:
- Org Admin defines flagged terms/patterns (e.g., "unlimited liability", "auto-renewal", "non-compete > 2 years")
- When a flagged term is typed or detected in an uploaded document, an inline alert appears
- Alerts categorized by severity: Info, Warning, Critical
- Alerts link to the organization's policy on the flagged term
- Dashboard widget showing contracts with active alerts

---

## 12. Implementation Phases

### Phase 1: MVP -- Core Platform (8 Weeks)

**Goal**: Deliver the foundational platform with contract intake, review workflows, CAS/DOA automation, and basic notifications. Establish security baseline.

| Week | Deliverables |
|---|---|
| 1-2 | **Security Foundation**: JWT authentication, Entra ID SSO integration, RBAC middleware on all endpoints, CORS lockdown, password hashing (bcrypt), basic audit logging |
| 2-3 | **Data Model Completion**: Extend Contract model (duration, category, risk, expiry, business unit, cost center), document storage system (upload/download/version), draft stage support, missing API endpoints (comments, full user update) |
| 3-4 | **AI Triage & Routing**: Clause detection from uploaded documents, dynamic review department assignment, parallel review support, AI risk scoring |
| 4-5 | **CAS & DOA Enhancement**: Configurable DOA rule engine (multi-dimensional: value + risk + unit + category), DOA matrix admin UI, dynamic CAS field population, CAS PDF export |
| 5-6 | **Notification System**: In-app notification center, email notification service (Graph API or SMTP), background scheduler for reminders, escalation engine |
| 6-7 | **Lifecycle Tracking**: Full status state machine, amendment workflow, renewal linkage, milestone tracking, scheduled expiry transitions |
| 7-8 | **Self-Service Portal**: Template-based contract generation for standard requests (NDA, DPA), streamlined approval for low-risk/low-value, feedback verification engine |

**Phase 1 Exit Criteria**:
- All endpoints require authentication
- Contracts flow through: Draft -> Submit -> Parallel Review -> CAS -> DOA Approval
- CAS auto-generates with correct data from contract record
- DOA rules evaluate multiple dimensions
- Notifications sent in-app for all workflow events
- Audit log captures all state changes

### Phase 2: Integrations & Dashboards (8 Weeks)

**Goal**: Connect to external systems (Outlook, DigiInk), build the sales pipeline module, and deliver executive dashboards.

| Week | Deliverables |
|---|---|
| 9-10 | **Outlook Integration**: Microsoft Graph API setup, email notification sending with deep links, reminder emails for pending approvals |
| 10-11 | **Outlook Inbound**: Shared mailbox monitoring, email attachment extraction and contract draft creation, email routing rules |
| 11-12 | **Sales Pipeline**: Opportunity CRUD, contract-opportunity linkage, pipeline stage configuration, auto-sync between contract and opportunity stages |
| 12-13 | **DigiInk Integration**: API client, document upload and signature workflow creation, status polling, webhook handler for completion events |
| 13-14 | **DigiInk Completion**: Executed document retrieval and storage, signature declined handling, signature status dashboard section |
| 14-15 | **Advanced Dashboards**: Real data for all charts (pipeline funnel, contract volume trends, cycle time analytics), KPI cards with live data |
| 15-16 | **Reporting & Export**: Filterable report tables, CSV/Excel/PDF export, audit/compliance report generator, scheduled report delivery |

**Phase 2 Exit Criteria**:
- Email notifications sent via Outlook for all workflow events
- Contracts from forwarded emails are auto-created as drafts
- Approved contracts are sent to DigiInk and executed copies auto-retrieved
- Sales opportunities tracked with pipeline-to-contract sync
- All dashboard charts use real data
- Reports exportable in CSV, Excel, and PDF

### Phase 3: Legal AI (6 Weeks)

**Goal**: Deliver the intelligent document editor with AI-powered clause analysis and collaborative features.

| Week | Deliverables |
|---|---|
| 17-18 | **Document Editor Foundation**: In-browser rich text editor (ProseMirror/TipTap), DOCX import/export, auto-save |
| 19-20 | **AI Clause Analysis**: Clause identification and classification, risk scoring per clause, non-standard clause flagging, standard clause suggestions |
| 21-22 | **Collaboration Features**: Real-time collaborative editing (WebSocket + CRDT), comment threads with @mentions, version comparison/diff view, flagged terms alert system |

**Phase 3 Exit Criteria**:
- Users can edit contracts in-browser without external tools
- AI analyzes and scores clauses with explanations
- Multiple users can edit simultaneously with real-time sync
- Version diff view shows all changes between any two versions

### Phase 4: Optimization (4 Weeks)

**Goal**: Polish, optimize, and extend for mobile and advanced analytics.

| Week | Deliverables |
|---|---|
| 23-24 | **Advanced Analytics**: Contract cycle time trends, department review bottleneck analysis, DOA compliance reporting, self-service adoption metrics |
| 25 | **Custom Reporting**: User-defined report builder, saved report templates, scheduled report email delivery |
| 26 | **Mobile Optimization & Outlook Add-in**: Responsive design for tablet/mobile, Outlook add-in for in-email contract submission, push notification support |

**Phase 4 Exit Criteria**:
- Analytics dashboards provide actionable insights
- Users can create and save custom reports
- Platform is usable on tablet and mobile devices
- Outlook add-in deployed and functional

---

## 13. Success Metrics

### 13.1 Operational Metrics

| Metric | Baseline (Pre-Contrax) | Phase 1 Target | Phase 2 Target | Measurement Method |
|---|---|---|---|---|
| Average contract cycle time (submission to execution) | ~15 business days | 10 business days | 7 business days | System timestamps: submitted_at to executed_at |
| Average approval turnaround (CAS step) | ~3 business days/step | 2 business days/step | 1 business day/step | System timestamps: step_activated_at to step_completed_at |
| Contracts with DOA compliance | Unknown (no enforcement) | 100% | 100% | All contracts have valid DOA chain in CAS |
| Contracts with complete audit trail | 0% | 100% | 100% | Audit log entries exist for every state change |
| Document retrieval time | Hours (searching email/drives) | < 30 seconds | < 10 seconds | Time from search to document open |

### 13.2 User Adoption Metrics

| Metric | Phase 1 Target | Phase 2 Target | Measurement Method |
|---|---|---|---|
| Active users (weekly) | 80% of invited users | 90% of invited users | Distinct logins per week / total users |
| Self-service resolution rate | 15% of contract requests | 30% of contract requests | Self-service completions / total requests |
| Email notification engagement (click-through) | 40% | 60% | Deep link clicks / emails sent |
| Digital signature adoption | N/A | 100% of approved contracts | Contracts sent to DigiInk / contracts approved |

### 13.3 Quality Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| AI triage accuracy (correct department routing) | > 90% | Manual audit sample (monthly): correct routing / total routed |
| AI risk score accuracy | > 80% correlation with human assessment | Compare AI risk score with reviewer-assigned risk (quarterly) |
| System uptime | 99.5% | Monitoring tool (e.g., Pingdom, UptimeRobot) |
| User-reported defects (post-launch) | < 5 critical/month in Phase 1, < 2 in Phase 2 | Issue tracker (Jira/Linear) |
| Average time to resolve P0 defect | < 4 hours | Incident management system |

### 13.4 Compliance Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Contracts approved within DOA authority | 100% | Automated: DOA rule match verification on every CAS |
| Audit log completeness | 100% of state changes logged | Automated: compare state transitions with audit entries |
| Expired contracts with renewal action | > 90% | Contracts that reached Expired with a renewal initiated prior |

---

## 14. Open Questions & Assumptions

### 14.1 Assumptions

| # | Assumption | Impact if Wrong |
|---|---|---|
| A1 | Microsoft Entra ID SSO app registration will be completed and configured by Infinia's IT team before Phase 1 development begins. | Authentication development blocked; fallback to JWT-only local auth initially. |
| A2 | DigiInk provides a REST API with documentation, sandbox environment, and webhook support. | If DigiInk API is different (SOAP, SDK-only, no webhooks), Phase 2 timeline may slip by 2-4 weeks for adaptation. |
| A3 | Contract documents are primarily in PDF and DOCX format. Other formats (images, scanned PDFs) are rare. | If scanned PDFs are common, OCR capability must be added, increasing AI triage complexity and timeline. |
| A4 | The DOA matrix currently has 3-4 authority levels (Manager, Director, VP, CEO). It does not need to support more than 6 levels. | If more levels are needed, the DOA engine and CAS approval chain UI need expansion. Low impact. |
| A5 | The initial deployment will serve Infinia Technologies as the pilot tenant, with multi-tenant architecture ready so the Super Admin can onboard additional companies. | If multiple tenants are needed from day one, additional tenant provisioning and data isolation testing is required in Phase 1. |
| A6 | All users have Microsoft 365 accounts and can receive email notifications via Outlook/Exchange Online. | If some users do not have M365, a secondary notification channel (SMS, generic SMTP) may be needed. |
| A7 | The AI engine will use Azure OpenAI Service (GPT-4 or equivalent) for clause analysis. Infinia has or will obtain Azure OpenAI access. | If not available, fallback to OpenAI API directly or alternative LLM providers. Minor configuration change. |
| A8 | The platform will be deployed on Azure (aligning with the Microsoft ecosystem). | If deploying on AWS or on-premises, infrastructure setup and integration patterns change. 1-2 week impact. |
| A9 | The existing CLM-main codebase will be extended, not rewritten from scratch. Existing working features (sequential review, basic CAS, basic dashboard) will be enhanced. | If a rewrite is preferred, add 4-6 weeks to Phase 1. |
| A10 | English is the primary language for the UI and contract documents. No localization is required in Phase 1-3. | If multi-language support is needed, add internationalization (i18n) to the frontend, adding 2-3 weeks. |

### 14.2 Open Questions

| # | Question | Needed From | Impact |
|---|---|---|---|
| Q1 | What are the exact DigiInk API endpoints, authentication method, and webhook event types? | DigiInk vendor / Infinia IT | Blocks Phase 2 DigiInk integration design. Need API documentation or sandbox access. |
| Q2 | Should the Outlook integration use a shared mailbox (e.g., contracts@netltd.com) or individual user mailboxes for inbound contract capture? | Business stakeholders | Affects Microsoft Graph API permission model and email monitoring architecture. |
| Q3 | Are there existing DOA matrices in spreadsheet/document form that can be seeded into the system? | Finance / Legal team | If yes, Phase 1 DOA configuration is faster. If not, rules must be defined with stakeholders. |
| Q4 | What are the specific contract categories used by Infinia? (The SOW mentions MSA, NDA, SLA, but are there others?) | Legal team | Determines intake form dropdowns, DOA rule dimensions, and self-service eligibility. |
| Q5 | What is the expected contract volume? (Monthly submissions, active contracts at any time, historical contracts to migrate.) | Business stakeholders | Influences database indexing strategy, search infrastructure, and storage capacity planning. |
| Q6 | Is there an existing CRM (Salesforce, Dynamics, HubSpot) that the sales pipeline module should integrate with, or is the pipeline managed entirely within Contrax CLM? | Sales / BD team | If CRM integration is needed, it changes the pipeline module from standalone to sync-based. Potential 2-3 week impact on Phase 2. |
| Q7 | For international deals (e.g., Ethiopia), are there specific regulatory requirements, different DOA rules, or multi-currency considerations? | Legal / Compliance team | May require per-subsidiary DOA overrides, multi-currency support, and jurisdiction-specific clause libraries. |
| Q8 | Should the CAS approval chain always have exactly 4 steps (I/E/R/A), or should the number of steps be configurable based on the DOA matrix? | Business stakeholders | If configurable, the CAS model and UI need to support dynamic-length approval chains. Moderate complexity increase. |
| Q9 | What is the retention policy for audit logs and expired contract documents? Are there legal/regulatory requirements? | Legal / Compliance team | Determines data retention configuration, storage cost projections, and archival strategy. |
| Q10 | What are the escalation policies for the different business units? Is the 3-day threshold universal, or does it vary by BU, contract value, or risk? | Business stakeholders | Affects escalation engine configuration complexity. |
| Q11 | For the Legal AI phase, does Infinia have an existing clause library or contract playbook that can be used as the AI knowledge base? | Legal team | If yes, speeds up AI training/RAG setup. If not, the clause library must be built, adding time to Phase 3. |
| Q12 | Are there any data residency requirements (e.g., data must stay within a specific country/region)? | Legal / IT team | Affects cloud region selection, backup strategy, and potentially multi-region deployment architecture. |

---

*This PRD is a living document. It should be updated as open questions are resolved, requirements evolve, and implementation learnings emerge. All changes should be tracked with version history.*

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-02 | Product & Engineering Team | Initial PRD creation |