"""
NEXUS IQ™ — Maintenance API Endpoints
History, predictions, MTBF analysis.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Equipment, MaintenanceRecord, InspectionRecord, IncidentReport, FailureDNA
from app.schemas import MaintenanceRecordOut
from app.services.maintenance_intelligence import (
    calculate_mtbf,
    get_failure_patterns,
    predict_next_failure,
    get_maintenance_summary,
    get_downtime_trend,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


# ── GET /maintenance/{equipment_id}/history — Maintenance history ────────────

@router.get("/{equipment_tag}/history")
async def get_maintenance_history(
    equipment_tag: str,
    maintenance_type: Optional[str] = Query(None, description="Filter: preventive, corrective, predictive, emergency"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get maintenance history for a specific equipment item."""
    equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
    if not equipment:
        raise HTTPException(404, f"Equipment '{equipment_tag}' not found")

    query = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.equipment_id == equipment.id)
    )

    if maintenance_type:
        query = query.filter(MaintenanceRecord.maintenance_type == maintenance_type)

    records = (
        query.order_by(MaintenanceRecord.completed_date.desc())
        .limit(limit)
        .all()
    )

    # Summary
    summary = get_maintenance_summary(equipment.id, db)

    return {
        "equipment_tag": equipment.tag_id,
        "equipment_name": equipment.name,
        "summary": summary,
        "records": [
            {
                "id": r.id,
                "work_order": r.work_order,
                "maintenance_type": r.maintenance_type,
                "description": r.description,
                "findings": r.findings,
                "actions_taken": r.actions_taken,
                "parts_replaced": r.parts_replaced,
                "downtime_hours": r.downtime_hours,
                "cost": r.cost,
                "technician": r.technician,
                "status": r.status,
                "priority": r.priority,
                "scheduled_date": r.scheduled_date,
                "completed_date": r.completed_date,
            }
            for r in records
        ],
    }


# ── GET /maintenance/predictions — Predicted upcoming failures ───────────────

@router.get("/predictions")
async def get_failure_predictions(db: Session = Depends(get_db)):
    """Get predicted upcoming failures across all equipment."""
    equipment_list = db.query(Equipment).all()
    predictions = []

    for eq in equipment_list:
        # Calculate MTBF
        mtbf = calculate_mtbf(eq.id, db)
        if mtbf is None:
            continue

        # Get prediction text
        prediction = predict_next_failure(eq.id, db)
        if prediction is None:
            continue

        # Get failure patterns for this equipment
        patterns = get_failure_patterns(eq.id, db)
        top_failure_modes = [p["mode"] for p in patterns[:3]] if patterns else []

        # Get last maintenance
        last_mx = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.equipment_id == eq.id)
            .order_by(MaintenanceRecord.completed_date.desc())
            .first()
        )

        # Determine risk level
        risk_level = "low"
        if "OVERDUE" in prediction:
            risk_level = "critical"
        elif "Within" in prediction:
            risk_level = "high"
        elif mtbf < 2000:
            risk_level = "medium"

        predictions.append({
            "equipment_tag": eq.tag_id,
            "equipment_name": eq.name,
            "equipment_type": eq.equipment_type,
            "criticality": eq.criticality,
            "status": eq.status,
            "mtbf_hours": round(mtbf, 1),
            "prediction": prediction,
            "risk_level": risk_level,
            "top_failure_modes": top_failure_modes,
            "last_maintenance_date": str(last_mx.completed_date) if last_mx and last_mx.completed_date else None,
        })

    # Sort by risk: critical first
    risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    predictions.sort(key=lambda x: risk_order.get(x["risk_level"], 4))

    return {
        "total_predictions": len(predictions),
        "critical_count": sum(1 for p in predictions if p["risk_level"] == "critical"),
        "high_count": sum(1 for p in predictions if p["risk_level"] == "high"),
        "predictions": predictions,
    }


# ── GET /maintenance/mtbf — MTBF stats by equipment type ────────────────────

@router.get("/mtbf")
async def get_mtbf_stats(db: Session = Depends(get_db)):
    """Get MTBF (Mean Time Between Failures) statistics grouped by equipment type."""
    equipment_list = db.query(Equipment).all()
    mtbf_data = []
    by_type = {}

    for eq in equipment_list:
        mtbf = calculate_mtbf(eq.id, db)

        # Count failure events
        failure_count = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.equipment_id == eq.id,
                MaintenanceRecord.maintenance_type.in_(["corrective", "emergency"]),
            )
            .count()
        )

        # Total downtime
        all_mx = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.equipment_id == eq.id)
            .all()
        )
        total_downtime = sum(m.downtime_hours or 0 for m in all_mx)
        total_cost = sum(m.cost or 0 for m in all_mx)

        entry = {
            "equipment_tag": eq.tag_id,
            "equipment_name": eq.name,
            "equipment_type": eq.equipment_type,
            "criticality": eq.criticality,
            "mtbf_hours": round(mtbf, 1) if mtbf else None,
            "failure_count": failure_count,
            "total_downtime_hours": round(total_downtime, 1),
            "total_cost": round(total_cost, 2),
        }
        mtbf_data.append(entry)

        # Group by type
        eq_type = eq.equipment_type or "Other"
        if eq_type not in by_type:
            by_type[eq_type] = {"mtbf_values": [], "count": 0, "total_failures": 0}
        by_type[eq_type]["count"] += 1
        by_type[eq_type]["total_failures"] += failure_count
        if mtbf:
            by_type[eq_type]["mtbf_values"].append(mtbf)

    # Calculate averages per type
    type_summary = []
    for eq_type, data in by_type.items():
        avg_mtbf = (
            round(sum(data["mtbf_values"]) / len(data["mtbf_values"]), 1)
            if data["mtbf_values"] else None
        )
        type_summary.append({
            "equipment_type": eq_type,
            "equipment_count": data["count"],
            "avg_mtbf_hours": avg_mtbf,
            "total_failures": data["total_failures"],
        })

    type_summary.sort(key=lambda x: x.get("avg_mtbf_hours") or 999999)

    return {
        "equipment_mtbf": mtbf_data,
        "by_type": type_summary,
    }
