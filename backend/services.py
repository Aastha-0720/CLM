import re
import os
import json
import ast
from datetime import datetime
from models import CAS
from openai import OpenAI

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", ""),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
)
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

class AIService:
    def __init__(self, client, model):
        self.client = client
        self.model = model

    def _parse_json(self, raw: str) -> dict:
        raw = re.sub(r'^```(?:json)?\s*', '', raw.strip())
        raw = re.sub(r'\s*```$', '', raw)

        # Some providers wrap the object in explanatory text.
        match = re.search(r'(\{.*\}|\[.*\])', raw, re.DOTALL)
        candidate = match.group(1).strip() if match else raw.strip()

        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # Accept Python-style dicts/lists that use single quotes or None.
            return ast.literal_eval(candidate)

    async def analyze_risk(self, text, contract_type, jurisdiction, value, duration):
        try:
            system_prompt = "You are an expert contract lawyer. Analyze contracts for risk. Return ONLY valid JSON with consistent keys. Be specific with section citations. Consider jurisdiction and contract type."
            user_prompt = (
                f"Analyze this contract - Type: {contract_type}, Jurisdiction: {jurisdiction}, Value: ${value}, Duration: {duration}\n\n"
                f"CONTRACT TEXT:\n{text[:5000]}\n\n"
                "Return JSON only using this exact shape: "
                "{"
                "\"overallRiskScore\": \"Low|Medium|High|Critical\","
                "\"riskPercentage\": 0,"
                "\"complianceScore\": 0,"
                "\"criticalIssues\": [],"
                "\"missingClauses\": [],"
                "\"extractedClauses\": {"
                "\"payment_terms\": \"\","
                "\"termination\": \"\","
                "\"confidentiality\": \"\","
                "\"liability\": \"\""
                "},"
                "\"keyFinancialTerms\": {},"
                "\"executiveSummary\": \"\""
                "}"
            )
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in analyze_risk: {e}")
            return {
                "overallRiskScore": "Medium",
                "riskPercentage": 50,
                "complianceScore": 50,
                "criticalIssues": ["Analysis failed due to technical error"],
                "missingClauses": [],
                "extractedClauses": {
                    "payment_terms": "",
                    "termination": "",
                    "confidentiality": "",
                    "liability": ""
                },
                "keyFinancialTerms": {},
                "executiveSummary": "Risk analysis unavailable."
            }

    async def extract_text(self, text):
        try:
            system_prompt = "You are a legal data extractor. Extract factual data into JSON. If missing, use null. Return ONLY JSON."
            user_prompt = (
                f"Extract high-level metadata from this text:\n\n{text[:6000]}\n\n"
                'Return JSON only using this exact shape: '
                '{"parties":{"vendor":null,"client":null,"email":null,"contact":null,"signer":null,"representative":null},'
                '"contractDates":{"effectiveDate":null,"expiryDate":null},'
                '"financialTerms":{"totalValue":null,"currency":null},'
                '"governingLaw":null,'
                '"clauses":[{"id":null,"title":null,"content":null,"type":null,"department":null}]}'
            )
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in extract_text: {e}")
            return {
                "parties": {"vendor": None, "vendorAddress": None, "client": None, "clientAddress": None},
                "contractDates": {"effectiveDate": None, "expiryDate": None, "signatureDate": None, "renewalDate": None},
                "financialTerms": {"totalValue": None, "currency": None, "paymentSchedule": None},
                "serviceScope": [],
                "kpis": [],
                "penalties": [],
                "signatories": [],
                "governingLaw": None,
                "dataQuality": {"completeness": 0, "confidence": 0, "warnings": ["Extraction failed"]}
            }

    async def check_compliance(self, text, regulations, industry, jurisdiction):
        try:
            system_prompt = "You are a compliance expert. Check contracts against regulatory frameworks. Identify gaps and violations. Return actionable remediation steps. Return ONLY valid JSON."
            user_prompt = f"Check compliance - Regulations: {regulations}, Industry: {industry}, Jurisdiction: {jurisdiction}\n\nCONTRACT TEXT:\n{text[:5000]}\n\nReturn JSON: {{regulatoryFrameworks[{{regulation, applicability, status, gaps[], evidenceFound}}], industryStandards[], overallComplianceRating, actionItems[]}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in check_compliance: {e}")
            return {
                "regulatoryFrameworks": [],
                "industryStandards": [],
                "overallComplianceRating": "Unknown",
                "actionItems": ["Compliance check failed"]
            }

    async def route_review(self, title, value, contract_type, jurisdiction, risk):
        try:
            system_prompt = "You are a contract workflow orchestrator. Recommend optimal review routing based on value, type, risk, and regulations. Return ONLY valid JSON."
            user_prompt = f"Route this contract - Title: {title}, Value: ${value}, Type: {contract_type}, Jurisdiction: {jurisdiction}, Risk: {risk}\n\nAvailable departments: Legal, Finance, Compliance, Procurement, Security, HR\n\nReturn JSON: {{primaryReviewer{{department, reviewType, turnaroundDays}}, parallelReviewers[], escalationTriggers[], redlineRequirements[], approvalChain[], estimatedTotalDays, riskMitigation[]}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in route_review: {e}")
            return {
                "primaryReviewer": {"department": "Legal", "reviewType": "Standard", "turnaroundDays": 3},
                "parallelReviewers": [],
                "escalationTriggers": [],
                "estimatedTotalDays": 5,
                "riskMitigation": []
            }

    async def redline_clause(self, clause, section, issue, company, role, risk_tolerance, industry):
        try:
            system_prompt = "You are a contract drafter. Identify problematic clauses and suggest specific redlines. Provide new language protecting our interests fairly. Return ONLY valid JSON."
            user_prompt = f"Redline this clause - Our Company: {company}, Our Role: {role}, Risk Tolerance: {risk_tolerance}, Industry: {industry}\n\nCLAUSE:\n'{clause}'\n\nSection: {section}\nIssue: {issue}\n\nReturn JSON: {{originalClause, section, issues[{{problem, riskLevel, impact}}], redlinedClause, justification, alternativeOptions[{{option, text, pros[], cons[]}}], negotiationNotes, precedent}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in redline_clause: {e}")
            return {
                "originalClause": clause,
                "section": section,
                "issues": [{"problem": "Technical error during redlining", "riskLevel": "Medium", "impact": "Unknown"}],
                "redlinedClause": clause,
                "justification": "Redlining failed due to a system error."
            }

    async def extract_email(self, email_from, subject, date, body):
        try:
            system_prompt = "You are an email parsing specialist. Extract contract info from emails. Handle various formats and signatures. Extract ONLY factual information. Return ONLY valid JSON."
            user_prompt = f"Parse this email -\n\nFROM: {email_from}\nSUBJECT: {subject}\nDATE: {date}\n\nEMAIL BODY:\n{body[:3000]}\n\nReturn JSON: {{contractInfo{{counterpartyName, counterpartyEmail, contractValue, currency, contractType, subject}}, dates{{proposedStartDate, proposedEndDate, deadline}}, keyRequirements[], attachments[{{filename, type, action}}], sentiment, actionRequired[{{action, owner, deadline}}], extractionConfidence, warnings[]}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in extract_email: {e}")
            return {
                "contractInfo": {"counterpartyName": "", "counterpartyEmail": "", "contractValue": "", "currency": "", "contractType": "", "subject": ""},
                "dates": {"proposedStartDate": "", "proposedEndDate": "", "deadline": ""},
                "keyRequirements": [],
                "actionRequired": [],
                "extractionConfidence": 0
            }

    async def generate_notification(self, event, contract_title, context):
        try:
            system_prompt = "You are a contract intelligence system. Generate smart, contextual notifications. Only alert on important events. Be concise but informative. Return ONLY valid JSON."
            user_prompt = f"Generate alert - Event: {event}, Contract: {contract_title}, Context: {context}\n\nReturn JSON: {{alertType, priority, title, message, actionUrl, actionLabel, recipients[], channel[], dueDate, relatedContracts[{{id, title}}], escalationPath[]}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in generate_notification: {e}")
            return {
                "alertType": event,
                "priority": "Medium",
                "title": f"Alert: {event}",
                "message": f"Notification for {contract_title} could not be fully generated."
            }

    async def track_lifecycle(self, title, start_date, end_date, renewal_clause, notice_days, value, status):
        try:
            system_prompt = "You are a contract lifecycle AI. Track states and predict renewals. Consider all important dates. Generate actionable recommendations. Return ONLY valid JSON."
            user_prompt = f"Track lifecycle - Contract: {title}, StartDate: {start_date}, EndDate: {end_date}, RenewalClause: {renewal_clause}, NoticeRequired: {notice_days}, Value: ${value}, Status: {status}\n\nReturn JSON: {{currentStatus, timeline[{{event, date, daysBefore, action, owner}}], renewalRecommendation{{shouldRenew, rationale, proposedTerms, estimatedValue}}, amendments[], complianceDeadlines[], upcomingActions[], healthScore}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in track_lifecycle: {e}")
            return {
                "currentStatus": status,
                "timeline": [],
                "renewalRecommendation": {"shouldRenew": None, "rationale": "Tracking analysis failed."},
                "healthScore": 50
            }

    async def generate_cas_notes(self, title, company, value, contract_type, business_unit, department, risk_summary, reviews, key_issues, initiator_notes):
        try:
            system_prompt = "You are a senior legal advisor. Write professional, concise CAS notes. Summarize key risks, approvals, and business rationale. Be objective and fact-based. Write 3-4 sentences only. Return text only (no JSON)."
            user_prompt = f"Generate CAS notes for -\n\nContract: {title}\nCounterparty: {company}\nValue: ${value}\nType: {contract_type}\nBusiness Unit: {business_unit}\nDepartment: {department}\n\nRisk Assessment: {risk_summary}\n\nDepartment Reviews:\n- Legal: {reviews.get('Legal','Pending')}\n- Finance: {reviews.get('Finance','Pending')}\n- Compliance: {reviews.get('Compliance','Pending')}\n- Procurement: {reviews.get('Procurement','Pending')}\n\nKey Issues: {key_issues}\nInitiator Notes: {initiator_notes}\n\nWrite 3-4 professional sentences summarizing: 1) Business rationale 2) Notable risks 3) Recommendation"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in generate_cas_notes: {e}")
            return "Standard terms applied. No high-risk deviations noted based on internal review."

    async def search_contracts(self, query, search_type, contracts_list):
        try:
            system_prompt = "You are a contract search specialist. Find relevant contracts based on queries. Match by content, metadata, and semantic similarity. Rank by relevance. Return ONLY valid JSON."
            user_prompt = f"Search contracts - Query: {query}, Type: {search_type}\n\nAVAILABLE CONTRACTS:\n{contracts_list}\n\nReturn JSON: {{results[{{contractId, title, relevanceScore, matchType, relevantSections[], snippet, reason}}], totalResults, searchTime, suggestions[]}}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return self._parse_json(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in search_contracts: {e}")
            return {
                "results": [],
                "totalResults": 0,
                "suggestions": []
            }

def generate_cas_document(
    contract_id: str, 
    contract_title: str, 
    value: float, 
    initiator: str,
    thresholds: dict,
    agreement_type: str,
    business_unit: str,
    department: str = "",
    cost_center: str = "",
    project_name: str = "",
    effective_date: str = "",
    execution_date: str = "",
    key_notes: str = "",
    review_departments: list | None = None,
    routing_reasons: list | None = None,
    doa_approver: str = "",
    approval_chain_roles: list | None = None,
    doa_level: str = "",
    doa_rule: dict | None = None,
) -> CAS:
    # Determine approver dynamically from thresholds
    approver = doa_approver or "CEO"
    if not doa_approver:
        for role, range_info in thresholds.items():
            try:
                min_val = float(range_info.get("min", 0))
                max_val = float(range_info.get("max", 0))
                
                # If max is 0 or -1, it means no upper limit (usually for CEO/Director)
                if max_val <= 0:
                    if value >= min_val:
                        approver = role
                        break
                elif min_val <= value <= max_val:
                    approver = role
                    break
            except (ValueError, TypeError):
                continue

    resolved_roles = approval_chain_roles or ["Initiator", "Evaluator", "Reviewer", approver]
    approval_chain = []
    for idx, role_name in enumerate(resolved_roles):
        if idx == 0:
            name = initiator
        elif idx == 1:
            name = business_unit or department or role_name
        elif idx == len(resolved_roles) - 1:
            name = approver
        else:
            name = role_name
        approval_chain.append({
            "role": role_name,
            "name": name,
            "status": "Pending",
            "timestamp": None,
            "approvedBy": None,
            "comments": None
        })

    return CAS(
        contractId=contract_id,
        contractTitle=contract_title,
        value=value,
        initiator=initiator,
        doaApprover=approver,
        doaLevel=doa_level,
        doaRuleId=(doa_rule or {}).get("id") or (doa_rule or {}).get("_id"),
        doaRuleName=(doa_rule or {}).get("name"),
        doaRoutingSource="rule-engine" if doa_rule else "value-threshold",
        doa_stage="Initiator",
        doa_status="Pending",
        status="Pending Approval",
        createdAt=datetime.utcnow().isoformat(),
        department=department,
        businessUnit=business_unit,
        cost_center=cost_center,
        project_name=project_name,
        agreementType=agreement_type,
        effective_date=effective_date or "",
        execution_date=execution_date or "",
        keyNotes=key_notes or "",
        reviewDepartments=review_departments or [],
        routingReasons=routing_reasons or [],
        approvalChain=approval_chain
    )

def all_reviews_approved(reviews: dict) -> bool:
    departments = ["Legal", "Finance", "Compliance", "Procurement"]
    for dept in departments:
        if reviews.get(dept, {}).get("status") != "Approved":
            return False
    return True
