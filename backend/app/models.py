"""
NEXUS IQ™ — SQLAlchemy ORM Models
All relational tables for the industrial knowledge platform.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, Boolean,
    ForeignKey, Enum as SAEnum, JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Plant ──────────────────────────────────────────────────────────────────────

class Plant(Base):
    __tablename__ = "plants"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(256), nullable=False)
    location = Column(String(256))
    plant_code = Column(String(64), unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="plant")
    documents = relationship("Document", back_populates="plant")


# ── User ───────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String(128), unique=True, nullable=False)
    full_name = Column(String(256))
    role = Column(String(64))          # operator, engineer, manager
    department = Column(String(128))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Document ───────────────────────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=_uuid)
    plant_id = Column(String, ForeignKey("plants.id"))
    title = Column(String(512), nullable=False)
    file_name = Column(String(512))
    file_path = Column(String(1024))
    file_size = Column(Integer)
    doc_type = Column(String(64))      # manual, sop, report, regulation, p&id
    content_text = Column(Text)
    page_count = Column(Integer, default=0)
    status = Column(String(32), default="pending")   # pending, processing, ready, error
    metadata_json = Column(JSON, default=dict)
    uploaded_by = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    plant = relationship("Plant", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


# ── Chunk ──────────────────────────────────────────────────────────────────────

class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(String, primary_key=True, default=_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer)
    content = Column(Text, nullable=False)
    token_count = Column(Integer)
    page_number = Column(Integer)
    section_title = Column(String(512))
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


# ── Equipment ──────────────────────────────────────────────────────────────────

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(String, primary_key=True, default=_uuid)
    plant_id = Column(String, ForeignKey("plants.id"))
    tag_id = Column(String(64), unique=True, nullable=False)   # e.g. BF-P-07A
    name = Column(String(256), nullable=False)
    equipment_type = Column(String(128))       # pump, compressor, valve …
    manufacturer = Column(String(256))
    model_number = Column(String(256))
    serial_number = Column(String(256))
    installation_date = Column(DateTime)
    location_area = Column(String(256))
    criticality = Column(String(32))           # critical, high, medium, low
    status = Column(String(32), default="operational")   # operational, degraded, down, maintenance
    specifications = Column(JSON, default=dict)
    parent_system = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="equipment")
    maintenance_records = relationship("MaintenanceRecord", back_populates="equipment", cascade="all, delete-orphan")
    inspection_records = relationship("InspectionRecord", back_populates="equipment", cascade="all, delete-orphan")
    incident_reports = relationship("IncidentReport", back_populates="equipment", cascade="all, delete-orphan")
    tribal_knowledge = relationship("TribalKnowledge", back_populates="equipment", cascade="all, delete-orphan")
    failure_dna = relationship("FailureDNA", back_populates="equipment", cascade="all, delete-orphan")


# ── Maintenance Record ────────────────────────────────────────────────────────

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String, primary_key=True, default=_uuid)
    equipment_id = Column(String, ForeignKey("equipment.id", ondelete="CASCADE"))
    work_order = Column(String(64))
    maintenance_type = Column(String(64))    # preventive, corrective, predictive, emergency
    description = Column(Text)
    findings = Column(Text)
    actions_taken = Column(Text)
    parts_replaced = Column(JSON, default=list)
    downtime_hours = Column(Float, default=0)
    cost = Column(Float, default=0)
    technician = Column(String(256))
    status = Column(String(32), default="completed")   # scheduled, in_progress, completed
    priority = Column(String(32), default="medium")     # low, medium, high, critical
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="maintenance_records")


# ── Inspection Record ─────────────────────────────────────────────────────────

class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(String, primary_key=True, default=_uuid)
    equipment_id = Column(String, ForeignKey("equipment.id", ondelete="CASCADE"))
    inspection_type = Column(String(128))    # visual, vibration, ultrasonic, thermography
    inspector = Column(String(256))
    findings = Column(Text)
    severity = Column(String(32))            # normal, watch, alert, critical
    measurements = Column(JSON, default=dict)
    recommendations = Column(Text)
    next_inspection_date = Column(DateTime)
    inspection_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="inspection_records")


# ── Incident Report ───────────────────────────────────────────────────────────

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String, primary_key=True, default=_uuid)
    equipment_id = Column(String, ForeignKey("equipment.id", ondelete="CASCADE"))
    incident_number = Column(String(64), unique=True)
    title = Column(String(512))
    description = Column(Text)
    root_cause = Column(Text)
    corrective_actions = Column(Text)
    preventive_actions = Column(Text)
    severity = Column(String(32))            # minor, moderate, major, critical
    category = Column(String(128))           # mechanical, electrical, process, safety
    downtime_hours = Column(Float, default=0)
    cost_impact = Column(Float, default=0)
    injuries = Column(Integer, default=0)
    incident_date = Column(DateTime)
    resolved_date = Column(DateTime)
    reported_by = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="incident_reports")


# ── Compliance Requirement ────────────────────────────────────────────────────

class ComplianceRequirement(Base):
    __tablename__ = "compliance_requirements"

    id = Column(String, primary_key=True, default=_uuid)
    regulation_code = Column(String(128))
    regulation_name = Column(String(512))
    section = Column(String(128))
    description = Column(Text)
    requirement_text = Column(Text)
    category = Column(String(128))           # safety, environmental, operational, quality
    applicable_equipment_types = Column(JSON, default=list)
    compliance_status = Column(String(32), default="compliant")  # compliant, gap, partial, not_assessed
    gap_description = Column(Text)
    remediation_plan = Column(Text)
    due_date = Column(DateTime)
    last_assessed = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Tribal Knowledge ─────────────────────────────────────────────────────────

class TribalKnowledge(Base):
    __tablename__ = "tribal_knowledge"

    id = Column(String, primary_key=True, default=_uuid)
    equipment_id = Column(String, ForeignKey("equipment.id", ondelete="CASCADE"))
    title = Column(String(512))
    content = Column(Text, nullable=False)
    category = Column(String(128))           # tip, workaround, warning, best_practice
    contributed_by = Column(String(256))
    experience_years = Column(Integer)
    verified = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="tribal_knowledge")


# ── Failure DNA ───────────────────────────────────────────────────────────────

class FailureDNA(Base):
    __tablename__ = "failure_dna"

    id = Column(String, primary_key=True, default=_uuid)
    equipment_id = Column(String, ForeignKey("equipment.id", ondelete="CASCADE"))
    failure_mode = Column(String(256))
    failure_mechanism = Column(String(256))
    failure_signature = Column(JSON, default=dict)   # vibration pattern, temp profile …
    occurrence_count = Column(Integer, default=1)
    mean_time_to_failure = Column(Float)             # hours
    recommended_actions = Column(JSON, default=list)
    detection_methods = Column(JSON, default=list)
    last_occurrence = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="failure_dna")


# ── Conversation ──────────────────────────────────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String(512))
    user_id = Column(String)
    context_equipment_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


# ── Message ───────────────────────────────────────────────────────────────────

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(16))           # user, assistant, system
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    agent_used = Column(String(64))     # which agent answered
    confidence = Column(Float)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


# ── Feedback ──────────────────────────────────────────────────────────────────

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=_uuid)
    message_id = Column(String, ForeignKey("messages.id"))
    rating = Column(Integer)           # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
