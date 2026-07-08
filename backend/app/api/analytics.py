"""
NEXUS IQ™ — Analytics API Endpoints
Dashboard overview, maintenance trends, downtime stats.
"""

import logging
from datetime import datetime, timedelta
from collections import Counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Equipment, Document, MaintenanceRecord, IncidentReport,
    InspectionRecord, TribalKnowledge, ComplianceRequirement,
    Conversation,
)
from app.schemas import AnalyticsOverview

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── GET /analytics/overview — Key dashboard metrics ──────────────────────────

@router.get("/overview", response_model=AnalyticsOverview)
async def analytics_overview(db: Session = Depends(get_db)):
    """Get key metrics for the dashboard: counts, breakdowns, recent events."""

    # Counts
    total_equipment = db.query(Equipment).count()
    total_documents = db.query(Document).count()
    total_mx = db.query(MaintenanceRecord).count()
    total_incidents = db.query(IncidentReport).count()
    total_inspections = db.query(InspectionRecord).count()
    total_tk = db.query(TribalKnowledge).count()
    total_conversations = db.query(Conversation).count()

    # Compliance percentage
    all_reqs = db.query(ComplianceRequirement).all()
    compliant_count = sum(1 for r in all_reqs if r.compliance_status == "compliant")
    compliance_pct = (compliant_count / len(all_reqs) * 100) if all_reqs else 0

    # Equipment by status
    eq_by_status = {}
    for eq in db.query(Equipment).all():
        s = eq.status or "unknown"
        eq_by_status[s] = eq_by_status.get(s, 0) + 1

    # Equipment by criticality
    eq_by_crit = {}
    for eq in db.query(Equipment).all():
        c = eq.criticality or "unknown"
        eq_by_crit[c] = eq_by_crit.get(c, 0) + 1

    # Incidents by severity
    inc_by_sev = {}
    for inc in db.query(IncidentReport).all():
        s = inc.severity or "unknown"
        inc_by_sev[s] = inc_by_sev.get(s, 0) + 1

    # Maintenance by type
    mx_by_type = {}
    for mx in db.query(MaintenanceRecord).all():
        t = mx.maintenance_type or "unknown"
        mx_by_type[t] = mx_by_type.get(t, 0) + 1

    # Recent incidents (last 5)
    recent_inc = (
        db.query(IncidentReport)
        .order_by(IncidentReport.incident_date.desc())
        .limit(5)
        .all()
    )
    recent_incidents = [
        {
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity,
            "category": inc.category,
            "incident_date": str(inc.incident_date) if inc.incident_date else None,
        }
        for inc in recent_inc
    ]

    # Recent maintenance (last 5)
    recent_mx = (
        db.query(MaintenanceRecord)
        .order_by(MaintenanceRecord.completed_date.desc())
        .limit(5)
        .all()
    )
    recent_maintenance = []
    for mx in recent_mx:
        eq = db.query(Equipment).filter(Equipment.id == mx.equipment_id).first()
        recent_maintenance.append({
            "id": mx.id,
            "work_order": mx.work_order,
            "equipment_tag": eq.tag_id if eq else "N/A",
            "maintenance_type": mx.maintenance_type,
            "description": mx.description,
            "completed_date": str(mx.completed_date) if mx.completed_date else None,
            "downtime_hours": mx.downtime_hours,
        })

    # Average downtime
    all_mx = db.query(MaintenanceRecord).filter(MaintenanceRecord.downtime_hours > 0).all()
    avg_downtime = (
        sum(m.downtime_hours or 0 for m in all_mx) / len(all_mx) if all_mx else 0
    )

    return AnalyticsOverview(
        total_equipment=total_equipment,
        total_documents=total_documents,
        total_maintenance_records=total_mx,
        total_incidents=total_incidents,
        total_inspections=total_inspections,
        total_tribal_knowledge=total_tk,
        compliance_percentage=round(compliance_pct, 1),
        equipment_by_status=eq_by_status,
        equipment_by_criticality=eq_by_crit,
        incidents_by_severity=inc_by_sev,
        maintenance_by_type=mx_by_type,
        recent_incidents=recent_incidents,
        recent_maintenance=recent_maintenance,
        avg_downtime_hours=round(avg_downtime, 1),
        total_conversations=total_conversations,
    )


# ── GET /analytics/maintenance-trends — Monthly maintenance stats ────────────

@router.get("/maintenance-trends")
async def maintenance_trends(
    months: int = Query(12, ge=1, le=36, description="Number of months to look back"),
    db: Session = Depends(get_db),
):
    """Get monthly maintenance statistics: count, downtime, cost by type."""
    cutoff = datetime.utcnow() - timedelta(days=months * 30)

    records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.completed_date >= cutoff)
        .order_by(MaintenanceRecord.completed_date.asc())
        .all()
    )

    monthly_stats = {}
    for r in records:
        if not r.completed_date:
            continue
        month_key = r.completed_date.strftime("%Y-%m")
        if month_key not in monthly_stats:
            monthly_stats[month_key] = {
                "month": month_key,
                "total_count": 0,
                "preventive": 0,
                "corrective": 0,
                "predictive": 0,
                "emergency": 0,
                "total_downtime_hours": 0.0,
                "total_cost": 0.0,
            }

        stats = monthly_stats[month_key]
        stats["total_count"] += 1
        mx_type = r.maintenance_type or "unknown"
        if mx_type in stats:
            stats[mx_type] += 1
        stats["total_downtime_hours"] += r.downtime_hours or 0
        stats["total_cost"] += r.cost or 0

    # Round values
    for stats in monthly_stats.values():
        stats["total_downtime_hours"] = round(stats["total_downtime_hours"], 1)
        stats["total_cost"] = round(stats["total_cost"], 2)

    trends = sorted(monthly_stats.values(), key=lambda x: x["month"])

    # Summary
    total_count = sum(s["total_count"] for s in trends)
    total_downtime = sum(s["total_downtime_hours"] for s in trends)
    total_cost = sum(s["total_cost"] for s in trends)

    return {
        "period_months": months,
        "summary": {
            "total_events": total_count,
            "total_downtime_hours": round(total_downtime, 1),
            "total_cost": round(total_cost, 2),
            "avg_events_per_month": round(total_count / max(len(trends), 1), 1),
        },
        "trends": trends,
    }


# ── GET /analytics/downtime — Equipment downtime data ────────────────────────

@router.get("/downtime")
async def downtime_analytics(
    months: int = Query(12, ge=1, le=36),
    db: Session = Depends(get_db),
):
    """Get equipment downtime analytics — by equipment, by cause, and timeline."""
    cutoff = datetime.utcnow() - timedelta(days=months * 30)

    # Downtime by equipment
    equipment_list = db.query(Equipment).all()
    by_equipment = []

    for eq in equipment_list:
        mx_records = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.equipment_id == eq.id,
                MaintenanceRecord.completed_date >= cutoff,
            )
            .all()
        )
        inc_records = (
            db.query(IncidentReport)
            .filter(
                IncidentReport.equipment_id == eq.id,
                IncidentReport.incident_date >= cutoff,
            )
            .all()
        )

        mx_downtime = sum(m.downtime_hours or 0 for m in mx_records)
        inc_downtime = sum(i.downtime_hours or 0 for i in inc_records)
        total_downtime = mx_downtime + inc_downtime

        if total_downtime > 0:
            by_equipment.append({
                "tag_id": eq.tag_id,
                "name": eq.name,
                "equipment_type": eq.equipment_type,
                "criticality": eq.criticality,
                "total_downtime_hours": round(total_downtime, 1),
                "maintenance_downtime": round(mx_downtime, 1),
                "incident_downtime": round(inc_downtime, 1),
                "event_count": len(mx_records) + len(inc_records),
                "total_cost": round(
                    sum(m.cost or 0 for m in mx_records) +
                    sum(i.cost_impact or 0 for i in inc_records),
                    2,
                ),
            })

    by_equipment.sort(key=lambda x: x["total_downtime_hours"], reverse=True)

    # Monthly downtime timeline
    all_mx = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.completed_date >= cutoff)
        .all()
    )
    monthly_downtime = {}
    for r in all_mx:
        if r.completed_date:
            month = r.completed_date.strftime("%Y-%m")
            monthly_downtime[month] = monthly_downtime.get(month, 0) + (r.downtime_hours or 0)

    timeline = [
        {"month": k, "downtime_hours": round(v, 1)}
        for k, v in sorted(monthly_downtime.items())
    ]

    total_downtime = sum(e["total_downtime_hours"] for e in by_equipment)
    total_cost = sum(e["total_cost"] for e in by_equipment)

    return {
        "period_months": months,
        "summary": {
            "total_downtime_hours": round(total_downtime, 1),
            "total_cost": round(total_cost, 2),
            "avg_monthly_downtime": round(total_downtime / max(months, 1), 1),
            "worst_equipment": by_equipment[0]["tag_id"] if by_equipment else None,
        },
        "by_equipment": by_equipment,
        "monthly_timeline": timeline,
    }
