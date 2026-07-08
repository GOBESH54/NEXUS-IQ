"""
NEXUS IQ™ — Equipment API Endpoints
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Equipment, MaintenanceRecord, InspectionRecord,
    IncidentReport, TribalKnowledge, FailureDNA,
)
from app.schemas import EquipmentOut, EquipmentDetail, FailureDNAOut
from app.services.maintenance_intelligence import (
    calculate_mtbf, get_failure_patterns, get_maintenance_summary,
)
from app.services.compliance_engine import check_equipment_compliance

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/equipment", tags=["Equipment"])


# ── GET /equipment — List all ────────────────────────────────────────────────

@router.get("", response_model=list[EquipmentOut])
async def list_equipment(
    equipment_type: Optional[str] = Query(None),
    criticality: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all equipment with optional filtering."""
    query = db.query(Equipment)

    if equipment_type:
        query = query.filter(Equipment.equipment_type == equipment_type)
    if criticality:
        query = query.filter(Equipment.criticality == criticality)
    if status:
        query = query.filter(Equipment.status == status)

    return query.order_by(Equipment.tag_id).all()


# ── GET /equipment/{tag_id} — Detail with intelligence ──────────────────────

@router.get("/{tag_id}")
async def get_equipment_detail(tag_id: str, db: Session = Depends(get_db)):
    """Get equipment details with maintenance intelligence, incidents, and compliance."""
    equipment = db.query(Equipment).filter(Equipment.tag_id == tag_id).first()
    if not equipment:
        raise HTTPException(404, f"Equipment '{tag_id}' not found")

    # Counts
    mx_count = db.query(MaintenanceRecord).filter(MaintenanceRecord.equipment_id == equipment.id).count()
    inc_count = db.query(IncidentReport).filter(IncidentReport.equipment_id == equipment.id).count()
    insp_count = db.query(InspectionRecord).filter(InspectionRecord.equipment_id == equipment.id).count()
    tk_count = db.query(TribalKnowledge).filter(TribalKnowledge.equipment_id == equipment.id).count()

    # Last maintenance
    last_mx = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.equipment_id == equipment.id)
        .order_by(MaintenanceRecord.completed_date.desc())
        .first()
    )

    # MTBF
    mtbf = calculate_mtbf(equipment.id, db)

    # Maintenance summary
    mx_summary = get_maintenance_summary(equipment.id, db)

    # Failure patterns
    failure_patterns = get_failure_patterns(equipment.id, db)

    # Compliance
    compliance = check_equipment_compliance(equipment.id, db)

    # Failure DNA
    fdna = db.query(FailureDNA).filter(FailureDNA.equipment_id == equipment.id).all()

    # Recent incidents
    recent_incidents = (
        db.query(IncidentReport)
        .filter(IncidentReport.equipment_id == equipment.id)
        .order_by(IncidentReport.incident_date.desc())
        .limit(5)
        .all()
    )

    # Recent inspections
    recent_inspections = (
        db.query(InspectionRecord)
        .filter(InspectionRecord.equipment_id == equipment.id)
        .order_by(InspectionRecord.inspection_date.desc())
        .limit(5)
        .all()
    )

    return {
        "id": equipment.id,
        "tag_id": equipment.tag_id,
        "name": equipment.name,
        "equipment_type": equipment.equipment_type,
        "manufacturer": equipment.manufacturer,
        "model_number": equipment.model_number,
        "serial_number": equipment.serial_number,
        "installation_date": equipment.installation_date,
        "location_area": equipment.location_area,
        "criticality": equipment.criticality,
        "status": equipment.status,
        "specifications": equipment.specifications,
        "parent_system": equipment.parent_system,
        "maintenance_count": mx_count,
        "incident_count": inc_count,
        "inspection_count": insp_count,
        "tribal_knowledge_count": tk_count,
        "last_maintenance": last_mx.completed_date if last_mx else None,
        "mtbf_hours": round(mtbf, 1) if mtbf else None,
        "maintenance_summary": mx_summary,
        "failure_patterns": failure_patterns,
        "compliance": compliance,
        "failure_dna": [
            {
                "id": fd.id,
                "failure_mode": fd.failure_mode,
                "failure_mechanism": fd.failure_mechanism,
                "occurrence_count": fd.occurrence_count,
                "mean_time_to_failure": fd.mean_time_to_failure,
                "recommended_actions": fd.recommended_actions,
                "detection_methods": fd.detection_methods,
            }
            for fd in fdna
        ],
        "recent_incidents": [
            {
                "id": inc.id,
                "incident_number": inc.incident_number,
                "title": inc.title,
                "severity": inc.severity,
                "category": inc.category,
                "incident_date": inc.incident_date,
                "root_cause": inc.root_cause,
            }
            for inc in recent_incidents
        ],
        "recent_inspections": [
            {
                "id": insp.id,
                "inspection_type": insp.inspection_type,
                "severity": insp.severity,
                "findings": insp.findings,
                "inspection_date": insp.inspection_date,
            }
            for insp in recent_inspections
        ],
    }


# ── GET /equipment/{tag_id}/timeline — Maintenance timeline ────────────────

@router.get("/{tag_id}/timeline")
async def get_equipment_timeline(tag_id: str, db: Session = Depends(get_db)):
    """Get a chronological timeline of all events for an equipment item."""
    equipment = db.query(Equipment).filter(Equipment.tag_id == tag_id).first()
    if not equipment:
        raise HTTPException(404, f"Equipment '{tag_id}' not found")

    events = []

    # Maintenance events
    mx_records = db.query(MaintenanceRecord).filter(MaintenanceRecord.equipment_id == equipment.id).all()
    for mx in mx_records:
        events.append({
            "type": "maintenance",
            "date": mx.completed_date or mx.scheduled_date,
            "title": f"{mx.maintenance_type}: {mx.description}",
            "details": mx.findings,
            "severity": mx.priority,
            "work_order": mx.work_order,
        })

    # Incidents
    incidents = db.query(IncidentReport).filter(IncidentReport.equipment_id == equipment.id).all()
    for inc in incidents:
        events.append({
            "type": "incident",
            "date": inc.incident_date,
            "title": inc.title,
            "details": inc.description,
            "severity": inc.severity,
            "incident_number": inc.incident_number,
        })

    # Inspections
    inspections = db.query(InspectionRecord).filter(InspectionRecord.equipment_id == equipment.id).all()
    for insp in inspections:
        events.append({
            "type": "inspection",
            "date": insp.inspection_date,
            "title": f"{insp.inspection_type} inspection",
            "details": insp.findings,
            "severity": insp.severity,
        })

    # Sort by date
    events.sort(key=lambda e: e["date"] or "", reverse=True)

    return {"tag_id": tag_id, "equipment_name": equipment.name, "events": events}
