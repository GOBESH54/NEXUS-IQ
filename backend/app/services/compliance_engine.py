"""
NEXUS IQ™ — Compliance Engine
Gap detection, regulation mapping, compliance matrix generation.
"""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models import ComplianceRequirement, Equipment

logger = logging.getLogger(__name__)


def get_compliance_gaps(db: Session) -> list[dict]:
    """Get all compliance gaps and partial-compliance items."""
    reqs = (
        db.query(ComplianceRequirement)
        .filter(ComplianceRequirement.compliance_status.in_(["gap", "partial"]))
        .order_by(ComplianceRequirement.due_date.asc())
        .all()
    )

    gaps = []
    for r in reqs:
        severity = "high"
        if r.category == "safety":
            severity = "critical"
        elif r.category == "environmental":
            severity = "high"
        elif r.category == "operational":
            severity = "medium"
        elif r.category == "quality":
            severity = "medium"

        # Check if overdue
        is_overdue = False
        if r.due_date and r.due_date < datetime.utcnow():
            is_overdue = True
            severity = "critical"

        gaps.append({
            "id": r.id,
            "regulation_code": r.regulation_code or "",
            "regulation_name": r.regulation_name or "",
            "section": r.section or "",
            "gap_description": r.gap_description or r.description or "",
            "remediation_plan": r.remediation_plan,
            "due_date": r.due_date,
            "severity": severity,
            "compliance_status": r.compliance_status,
            "category": r.category,
            "is_overdue": is_overdue,
            "applicable_equipment_types": r.applicable_equipment_types or [],
        })

    return gaps


def get_compliance_matrix(db: Session) -> dict:
    """Generate a compliance matrix with statistics."""
    all_reqs = db.query(ComplianceRequirement).all()

    total = len(all_reqs)
    compliant = sum(1 for r in all_reqs if r.compliance_status == "compliant")
    gaps = sum(1 for r in all_reqs if r.compliance_status == "gap")
    partial = sum(1 for r in all_reqs if r.compliance_status == "partial")
    not_assessed = sum(1 for r in all_reqs if r.compliance_status == "not_assessed")

    compliance_pct = (compliant / total * 100) if total > 0 else 0

    # Group by category
    by_category = {}
    for r in all_reqs:
        cat = r.category or "other"
        if cat not in by_category:
            by_category[cat] = {"total": 0, "compliant": 0, "gap": 0, "partial": 0}
        by_category[cat]["total"] += 1
        if r.compliance_status == "compliant":
            by_category[cat]["compliant"] += 1
        elif r.compliance_status == "gap":
            by_category[cat]["gap"] += 1
        elif r.compliance_status == "partial":
            by_category[cat]["partial"] += 1

    # Group by regulation
    by_regulation = {}
    for r in all_reqs:
        code = r.regulation_code or "unknown"
        if code not in by_regulation:
            by_regulation[code] = {
                "name": r.regulation_name or "",
                "total": 0,
                "compliant": 0,
                "gap": 0,
            }
        by_regulation[code]["total"] += 1
        if r.compliance_status == "compliant":
            by_regulation[code]["compliant"] += 1
        elif r.compliance_status in ("gap", "partial"):
            by_regulation[code]["gap"] += 1

    requirements = []
    for r in all_reqs:
        requirements.append({
            "id": r.id,
            "regulation_code": r.regulation_code,
            "regulation_name": r.regulation_name,
            "section": r.section,
            "description": r.description,
            "requirement_text": r.requirement_text,
            "category": r.category,
            "applicable_equipment_types": r.applicable_equipment_types,
            "compliance_status": r.compliance_status,
            "gap_description": r.gap_description,
            "remediation_plan": r.remediation_plan,
            "due_date": str(r.due_date) if r.due_date else None,
            "last_assessed": str(r.last_assessed) if r.last_assessed else None,
        })

    return {
        "total_requirements": total,
        "compliant": compliant,
        "gaps": gaps,
        "partial": partial,
        "not_assessed": not_assessed,
        "compliance_percentage": round(compliance_pct, 1),
        "by_category": by_category,
        "by_regulation": by_regulation,
        "requirements": requirements,
    }


def check_equipment_compliance(equipment_id: str, db: Session) -> list[dict]:
    """Check compliance status for a specific equipment item."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        return []

    applicable = (
        db.query(ComplianceRequirement)
        .filter(
            ComplianceRequirement.applicable_equipment_types.contains(
                f'"{equipment.equipment_type}"'
            )
        )
        .all()
    )

    # Fallback: check all reqs that list this equipment type
    if not applicable:
        all_reqs = db.query(ComplianceRequirement).all()
        applicable = [
            r for r in all_reqs
            if equipment.equipment_type in (r.applicable_equipment_types or [])
        ]

    results = []
    for r in applicable:
        results.append({
            "regulation_code": r.regulation_code,
            "regulation_name": r.regulation_name,
            "section": r.section,
            "status": r.compliance_status,
            "gap_description": r.gap_description,
            "category": r.category,
        })

    return results
