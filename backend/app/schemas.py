"""
NEXUS IQ™ — Pydantic Schemas (request / response models)
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ── Generic ───────────────────────────────────────────────────────────────────

class StatusResponse(BaseModel):
    status: str
    message: str


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    id: str
    title: str
    file_name: str
    doc_type: str
    status: str
    page_count: int
    chunk_count: int
    message: str


class DocumentOut(BaseModel):
    id: str
    title: str
    file_name: Optional[str] = None
    doc_type: Optional[str] = None
    status: Optional[str] = None
    page_count: int = 0
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    metadata_json: Optional[dict] = None

    class Config:
        from_attributes = True


class DocumentDetail(DocumentOut):
    content_preview: Optional[str] = None
    chunk_count: int = 0
    plant_id: Optional[str] = None


class ChunkOut(BaseModel):
    id: str
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None

    class Config:
        from_attributes = True


# ── Equipment ─────────────────────────────────────────────────────────────────

class EquipmentOut(BaseModel):
    id: str
    tag_id: str
    name: str
    equipment_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[datetime] = None
    location_area: Optional[str] = None
    criticality: Optional[str] = None
    status: Optional[str] = None
    specifications: Optional[dict] = None
    parent_system: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        protected_namespaces = ()


class EquipmentDetail(EquipmentOut):
    maintenance_count: int = 0
    incident_count: int = 0
    inspection_count: int = 0
    tribal_knowledge_count: int = 0
    last_maintenance: Optional[datetime] = None
    mtbf_hours: Optional[float] = None


# ── Maintenance ───────────────────────────────────────────────────────────────

class MaintenanceRecordOut(BaseModel):
    id: str
    equipment_id: str
    work_order: Optional[str] = None
    maintenance_type: Optional[str] = None
    description: Optional[str] = None
    findings: Optional[str] = None
    actions_taken: Optional[str] = None
    parts_replaced: Optional[list] = None
    downtime_hours: float = 0
    cost: float = 0
    technician: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Inspections ───────────────────────────────────────────────────────────────

class InspectionRecordOut(BaseModel):
    id: str
    equipment_id: str
    inspection_type: Optional[str] = None
    inspector: Optional[str] = None
    findings: Optional[str] = None
    severity: Optional[str] = None
    measurements: Optional[dict] = None
    recommendations: Optional[str] = None
    next_inspection_date: Optional[datetime] = None
    inspection_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Incidents ─────────────────────────────────────────────────────────────────

class IncidentReportOut(BaseModel):
    id: str
    equipment_id: str
    incident_number: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_actions: Optional[str] = None
    preventive_actions: Optional[str] = None
    severity: Optional[str] = None
    category: Optional[str] = None
    downtime_hours: float = 0
    cost_impact: float = 0
    injuries: int = 0
    incident_date: Optional[datetime] = None
    resolved_date: Optional[datetime] = None
    reported_by: Optional[str] = None

    class Config:
        from_attributes = True


# ── Compliance ────────────────────────────────────────────────────────────────

class ComplianceRequirementOut(BaseModel):
    id: str
    regulation_code: Optional[str] = None
    regulation_name: Optional[str] = None
    section: Optional[str] = None
    description: Optional[str] = None
    requirement_text: Optional[str] = None
    category: Optional[str] = None
    applicable_equipment_types: Optional[list] = None
    compliance_status: Optional[str] = None
    gap_description: Optional[str] = None
    remediation_plan: Optional[str] = None
    due_date: Optional[datetime] = None
    last_assessed: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceGap(BaseModel):
    id: str
    regulation_code: str
    regulation_name: str
    section: Optional[str] = None
    gap_description: str
    remediation_plan: Optional[str] = None
    due_date: Optional[datetime] = None
    severity: str = "medium"


class ComplianceMatrix(BaseModel):
    total_requirements: int
    compliant: int
    gaps: int
    partial: int
    not_assessed: int
    compliance_percentage: float
    requirements: list[ComplianceRequirementOut]


# ── Tribal Knowledge ─────────────────────────────────────────────────────────

class TribalKnowledgeCreate(BaseModel):
    equipment_id: str
    title: str
    content: str
    category: str = "tip"
    contributed_by: str = "Anonymous"
    experience_years: int = 0
    tags: list[str] = []


class TribalKnowledgeOut(BaseModel):
    id: str
    equipment_id: str
    title: Optional[str] = None
    content: str
    category: Optional[str] = None
    contributed_by: Optional[str] = None
    experience_years: Optional[int] = None
    verified: bool = False
    upvotes: int = 0
    tags: Optional[list] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    equipment_context: Optional[str] = None   # tag_id for equipment-scoped questions


class Citation(BaseModel):
    document_id: str
    document_title: str
    chunk_content: str
    page_number: Optional[int] = None
    relevance_score: float = 0.0


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    response: str
    citations: list[Citation] = []
    agent_used: Optional[str] = None
    confidence: float = 0.0
    follow_up_questions: list[str] = []


# ── Knowledge Graph ───────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    properties: dict = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str
    properties: dict = {}


class KnowledgeGraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_equipment: int = 0
    total_documents: int = 0
    total_maintenance_records: int = 0
    total_incidents: int = 0
    total_inspections: int = 0
    total_tribal_knowledge: int = 0
    compliance_percentage: float = 0.0
    equipment_by_status: dict = {}
    equipment_by_criticality: dict = {}
    incidents_by_severity: dict = {}
    maintenance_by_type: dict = {}
    recent_incidents: list[dict] = []
    recent_maintenance: list[dict] = []
    avg_downtime_hours: float = 0.0
    total_conversations: int = 0


# ── Failure DNA ───────────────────────────────────────────────────────────────

class FailureDNAOut(BaseModel):
    id: str
    equipment_id: str
    failure_mode: Optional[str] = None
    failure_mechanism: Optional[str] = None
    failure_signature: Optional[dict] = None
    occurrence_count: int = 1
    mean_time_to_failure: Optional[float] = None
    recommended_actions: Optional[list] = None
    detection_methods: Optional[list] = None
    last_occurrence: Optional[datetime] = None

    class Config:
        from_attributes = True
