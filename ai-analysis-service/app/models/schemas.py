from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
import uuid

class AgentLog(BaseModel):
    agent: str
    action: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    node: str
    data: Optional[Dict] = None

class AnalysisTaskResponse(BaseModel):
    task_id: str
    analysis_id: str
    status: str
    message: str


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ContractCategory(str, Enum):
    EMPLOYMENT = "employment"
    NDA = "nda"
    SERVICE_AGREEMENT = "service-agreement"
    PARTNERSHIP = "partnership"
    LEASE = "lease"
    OTHER = "other"

class ClauseExtraction(BaseModel):
    clause_id: str
    clause_name: str
    clause_text: str
    clause_type: str
    page_number: Optional[int] = None
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.9)

class RiskAssessment(BaseModel):
    clause_id: str
    clause_text: str
    risk_level: RiskLevel
    risk_category: str
    risk_explanation: str
    potential_impact: str
    worst_case_scenario: str
    financial_exposure: Optional[str] = None
    mitigation_steps: List[str] = []
    legal_reasoning: Optional[str] = None
    standard_alternative: Optional[str] = None

class AlternativeClause(BaseModel):
    original_clause_id: str
    vendor_favorable: str
    balanced_standard: str
    user_protective: str
    key_changes: List[str]
    industry_standard_reference: Optional[str] = None

class LegalReasoning(BaseModel):
    clause_id: str
    legal_principles: List[str]
    relevant_statutes: List[str]
    case_law_references: List[Dict[str, str]]
    enforceability_assessment: str
    negotiation_leverage: str
    recommended_position: str

class ContractAnalysisRequest(BaseModel):
    contract_id: str
    file_path: str
    template_id: Optional[str] = None
    category: ContractCategory
    user_id: str
    deep_analysis: bool = False
    webhook_url: Optional[str] = None

class ContractAnalysisResponse(BaseModel):
    contract_id: str
    analysis_id: str
    overall_risk_score: float = Field(ge=0.0, le=10.0)
    executive_summary: str
    total_clauses: int
    risky_clauses_count: int
    clauses: List[ClauseExtraction]
    risk_assessments: List[RiskAssessment]
    alternatives: List[AlternativeClause]
    legal_reasoning: List[LegalReasoning]
    missing_clauses: List[str]
    recommendations: List[str]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_seconds: float
    full_text: Optional[str] = None
    agent_logs: List[AgentLog] = []

class RedlineRequest(BaseModel):
    file_path: str
    original_clause: str
    alternative_clause: str

class SearchRequest(BaseModel):
    query: str
    user_id: str
    limit: int = 5
    category: Optional[str] = None

class SearchResult(BaseModel):
    text: str
    metadata: Dict[str, Any]
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]

class ChatHistoryRequest(BaseModel):
    message: str
    user_id: str
    context_limit: int = 5

class ChatHistoryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
