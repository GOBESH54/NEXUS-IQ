"""
NEXUS IQ™ — Compliance API Endpoints
Gap detection, compliance matrix, evidence retrieval.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ComplianceRequirement, Document, Equipment
from app.schemas import ComplianceGap, ComplianceMatrix, ComplianceRequirementOut
from app.services.compliance_engine import get_compliance_gaps, get_compliance_matrix

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compliance", tags=["Compliance"])


# ── GET /compliance/gaps — List compliance gaps ──────────────────────────────

@router.get("/gaps", response_model=list[ComplianceGap])
async def list_compliance_gaps(
    category: Optional[str] = Query(None, description="Filter by category: safety, environmental, operational, quality"),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium"),
    db: Session = Depends(get_db),
):
    """List all compliance gaps and partial-compliance items with severity."""
    gaps = get_compliance_gaps(db)

    # Apply filters
    if category:
        gaps = [g for g in gaps if g.get("category") == category]
    if severity:
        gaps = [g for g in gaps if g.get("severity") == severity]

    return [
        ComplianceGap(
            id=g["id"],
            regulation_code=g["regulation_code"],
            regulation_name=g["regulation_name"],
            section=g.get("section"),
            gap_description=g["gap_description"],
            remediation_plan=g.get("remediation_plan"),
            due_date=g.get("due_date"),
            severity=g["severity"],
        )
        for g in gaps
    ]


# ── GET /compliance/matrix — Regulation × Equipment status matrix ────────────

@router.get("/matrix")
async def compliance_matrix(db: Session = Depends(get_db)):
    """Get the full compliance matrix with statistics by category and regulation."""
    matrix = get_compliance_matrix(db)

    # Build equipment × regulation cross-reference
    equipment_list = db.query(Equipment).all()
    cross_ref = []

    for eq in equipment_list:
        all_reqs = db.query(ComplianceRequirement).all()
        applicable = [
            r for r in all_reqs
            if eq.equipment_type in (r.applicable_equipment_types or [])
        ]

        if applicable:
            cross_ref.append({
                "equipment_tag": eq.tag_id,
                "equipment_name": eq.name,
                "equipment_type": eq.equipment_type,
                "criticality": eq.criticality,
                "regulations": [
                    {
                        "regulation_code": r.regulation_code,
                        "regulation_name": r.regulation_name,
                        "section": r.section,
                        "status": r.compliance_status,
                        "gap_description": r.gap_description,
                    }
                    for r in applicable
                ],
                "compliant_count": sum(1 for r in applicable if r.compliance_status == "compliant"),
                "gap_count": sum(1 for r in applicable if r.compliance_status in ("gap", "partial")),
            })

    matrix["equipment_cross_reference"] = cross_ref
    return matrix


# ── GET /compliance/evidence/{requirement_id} — Evidence documents ───────────

@router.get("/evidence/{requirement_id}")
async def get_compliance_evidence(
    requirement_id: str,
    db: Session = Depends(get_db),
):
    """Get evidence documents supporting compliance for a specific requirement."""
    requirement = (
        db.query(ComplianceRequirement)
        .filter(ComplianceRequirement.id == requirement_id)
        .first()
    )
    if not requirement:
        raise HTTPException(404, "Compliance requirement not found")

    # Find documents that reference this regulation
    documents = db.query(Document).filter(Document.status == "ready").all()
    evidence = []

    reg_keywords = [
        requirement.regulation_code or "",
        requirement.regulation_name or "",
        (requirement.section or "").replace("§", ""),
    ]
    reg_keywords = [kw.lower() for kw in reg_keywords if kw]

    for doc in documents:
        content_lower = (doc.content_text or "").lower()
        title_lower = (doc.title or "").lower()

        matched = any(kw in content_lower or kw in title_lower for kw in reg_keywords)
        if matched:
            evidence.append({
                "document_id": doc.id,
                "title": doc.title,
                "doc_type": doc.doc_type,
                "file_name": doc.file_name,
                "content_preview": (doc.content_text or "")[:500],
                "uploaded_by": doc.uploaded_by,
                "created_at": doc.created_at,
            })

    # Find applicable equipment
    applicable_equipment = []
    equipment_list = db.query(Equipment).all()
    for eq in equipment_list:
        if eq.equipment_type in (requirement.applicable_equipment_types or []):
            applicable_equipment.append({
                "tag_id": eq.tag_id,
                "name": eq.name,
                "equipment_type": eq.equipment_type,
                "status": eq.status,
            })

    return {
        "requirement": {
            "id": requirement.id,
            "regulation_code": requirement.regulation_code,
            "regulation_name": requirement.regulation_name,
            "section": requirement.section,
            "description": requirement.description,
            "requirement_text": requirement.requirement_text,
            "compliance_status": requirement.compliance_status,
            "category": requirement.category,
            "gap_description": requirement.gap_description,
            "remediation_plan": requirement.remediation_plan,
            "due_date": requirement.due_date,
            "last_assessed": requirement.last_assessed,
        },
        "evidence_documents": evidence,
        "applicable_equipment": applicable_equipment,
    }
