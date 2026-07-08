"""
NEXUS IQ™ — Maintenance Intelligence Service
MTBF calculation, failure pattern analysis, predictive maintenance.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from collections import Counter

from sqlalchemy.orm import Session

from app.models import Equipment, MaintenanceRecord, IncidentReport, FailureDNA

logger = logging.getLogger(__name__)


def calculate_mtbf(equipment_id: str, db: Session) -> Optional[float]:
    """Calculate Mean Time Between Failures (MTBF) in hours.

    MTBF = Total operating time / Number of failures
    """
    # Get corrective / emergency maintenance as "failure" events
    failures = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.equipment_id == equipment_id,
            MaintenanceRecord.maintenance_type.in_(["corrective", "emergency"]),
            MaintenanceRecord.completed_date.isnot(None),
        )
        .order_by(MaintenanceRecord.completed_date.asc())
        .all()
    )

    if len(failures) < 2:
        return None

    # Calculate intervals between failures
    intervals = []
    for i in range(1, len(failures)):
        prev = failures[i - 1].completed_date
        curr = failures[i].completed_date
        if prev and curr:
            delta = (curr - prev).total_seconds() / 3600  # hours
            intervals.append(delta)

    if not intervals:
        return None

    return sum(intervals) / len(intervals)


def get_failure_patterns(equipment_id: str, db: Session) -> list[dict]:
    """Analyse failure patterns for an equipment item."""
    # Get incidents
    incidents = (
        db.query(IncidentReport)
        .filter(IncidentReport.equipment_id == equipment_id)
        .all()
    )

    # Get corrective maintenance
    corrective_mx = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.equipment_id == equipment_id,
            MaintenanceRecord.maintenance_type.in_(["corrective", "emergency"]),
        )
        .all()
    )

    # Count failure categories
    categories = Counter()
    root_causes = Counter()

    for inc in incidents:
        if inc.category:
            categories[inc.category] += 1
        if inc.root_cause:
            root_causes[inc.root_cause[:60]] += 1

    for mx in corrective_mx:
        if mx.findings:
            # Extract simple pattern from findings
            findings_lower = mx.findings.lower()
            if "seal" in findings_lower:
                categories["seal_failure"] += 1
            elif "bearing" in findings_lower:
                categories["bearing_failure"] += 1
            elif "vibration" in findings_lower:
                categories["vibration"] += 1
            elif "leak" in findings_lower:
                categories["leakage"] += 1
            elif "cavitation" in findings_lower:
                categories["cavitation"] += 1
            elif "alignment" in findings_lower:
                categories["misalignment"] += 1

    # Get failure DNA
    failure_dna = (
        db.query(FailureDNA)
        .filter(FailureDNA.equipment_id == equipment_id)
        .all()
    )

    patterns = []

    for fd in failure_dna:
        patterns.append({
            "mode": fd.failure_mode,
            "mechanism": fd.failure_mechanism,
            "count": fd.occurrence_count,
            "mtf_hours": fd.mean_time_to_failure,
            "detection_methods": fd.detection_methods,
            "recommended_actions": fd.recommended_actions,
            "last_occurrence": str(fd.last_occurrence) if fd.last_occurrence else None,
        })

    # Add patterns from incident/maintenance analysis
    for cat, count in categories.most_common(5):
        if not any(p["mode"].lower() == cat.lower() for p in patterns):
            patterns.append({
                "mode": cat.replace("_", " ").title(),
                "mechanism": "Detected from maintenance/incident history",
                "count": count,
                "mtf_hours": None,
                "detection_methods": [],
                "recommended_actions": [],
                "last_occurrence": None,
            })

    return patterns


def predict_next_failure(equipment_id: str, db: Session) -> Optional[str]:
    """Predict approximate next failure window based on historical patterns."""
    mtbf = calculate_mtbf(equipment_id, db)
    if not mtbf:
        return None

    # Find the last failure
    last_failure = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.equipment_id == equipment_id,
            MaintenanceRecord.maintenance_type.in_(["corrective", "emergency"]),
            MaintenanceRecord.completed_date.isnot(None),
        )
        .order_by(MaintenanceRecord.completed_date.desc())
        .first()
    )

    if not last_failure or not last_failure.completed_date:
        return None

    # Predicted next failure = last failure + MTBF
    predicted_date = last_failure.completed_date + timedelta(hours=mtbf)
    days_until = (predicted_date - datetime.utcnow()).days

    if days_until < 0:
        return f"OVERDUE — predicted failure was {abs(days_until)} days ago (MTBF: {mtbf:.0f}h). Immediate inspection recommended."
    elif days_until < 30:
        return f"Within {days_until} days (predicted: {predicted_date.strftime('%Y-%m-%d')}). MTBF: {mtbf:.0f}h. Schedule preventive maintenance."
    else:
        return f"Approximately {days_until} days from now ({predicted_date.strftime('%Y-%m-%d')}). MTBF: {mtbf:.0f}h."


def get_maintenance_summary(equipment_id: str, db: Session) -> dict:
    """Get a comprehensive maintenance summary for an equipment item."""
    records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.equipment_id == equipment_id)
        .order_by(MaintenanceRecord.completed_date.desc())
        .all()
    )

    if not records:
        return {
            "total_records": 0,
            "total_downtime_hours": 0,
            "total_cost": 0,
            "by_type": {},
            "mtbf_hours": None,
            "last_maintenance": None,
            "prediction": None,
        }

    total_downtime = sum(r.downtime_hours or 0 for r in records)
    total_cost = sum(r.cost or 0 for r in records)

    by_type = Counter()
    for r in records:
        by_type[r.maintenance_type or "unknown"] += 1

    mtbf = calculate_mtbf(equipment_id, db)
    prediction = predict_next_failure(equipment_id, db)

    return {
        "total_records": len(records),
        "total_downtime_hours": round(total_downtime, 1),
        "total_cost": round(total_cost, 2),
        "by_type": dict(by_type),
        "mtbf_hours": round(mtbf, 1) if mtbf else None,
        "avg_downtime_per_event": round(total_downtime / len(records), 1) if records else 0,
        "last_maintenance": str(records[0].completed_date) if records[0].completed_date else None,
        "prediction": prediction,
    }


def get_downtime_trend(equipment_id: str, db: Session, months: int = 12) -> list[dict]:
    """Get monthly downtime trend for the equipment."""
    cutoff = datetime.utcnow() - timedelta(days=months * 30)
    records = (
        db.query(MaintenanceRecord)
        .filter(
            MaintenanceRecord.equipment_id == equipment_id,
            MaintenanceRecord.completed_date >= cutoff,
        )
        .all()
    )

    monthly: dict[str, float] = {}
    for r in records:
        if r.completed_date:
            key = r.completed_date.strftime("%Y-%m")
            monthly[key] = monthly.get(key, 0) + (r.downtime_hours or 0)

    return [{"month": k, "downtime_hours": v} for k, v in sorted(monthly.items())]
