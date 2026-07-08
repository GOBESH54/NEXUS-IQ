"""
NEXUS IQ™ — Multi-Agent System
Simplified supervisor + specialist agents for query routing and processing.
"""

import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models import (
    Equipment, MaintenanceRecord, InspectionRecord, IncidentReport,
    ComplianceRequirement, TribalKnowledge, FailureDNA,
)
from app.services.rag_engine import answer_query, semantic_search, build_context
from app.services.gemini_client import generate_text, run_rca_analysis
from app.services.maintenance_intelligence import (
    calculate_mtbf, get_failure_patterns, predict_next_failure,
)

logger = logging.getLogger(__name__)

# ── Agent Types ──────────────────────────────────────────────────────────────

AGENT_TYPES = {
    "search": "Search Agent — retrieves and synthesizes information from documents",
    "maintenance": "Maintenance Agent — maintenance history, MTBF, scheduling",
    "compliance": "Compliance Agent — regulation mapping, gap detection",
    "rca": "RCA Agent — root cause analysis with 5-Why methodology",
    "recommendation": "Recommendation Agent — action plans and best practices",
    "tribal": "Tribal Knowledge Agent — experiential knowledge from technicians",
}


# ── Supervisor: Classify & Route ─────────────────────────────────────────────

def classify_query(query: str) -> str:
    """Classify the user query to determine which agent should handle it."""
    q = query.lower()

    # RCA patterns
    if any(kw in q for kw in ["root cause", "rca", "why did", "failure analysis", "5-why", "fishbone", "caused"]):
        return "rca"

    # Compliance patterns
    if any(kw in q for kw in ["compliance", "regulation", "standard", "audit", "gap", "is 2062", "asme", "api 610", "nfpa"]):
        return "compliance"

    # Maintenance patterns
    if any(kw in q for kw in ["maintenance", "mtbf", "schedule", "work order", "preventive", "downtime", "repair", "overhaul"]):
        return "maintenance"

    # Recommendation patterns
    if any(kw in q for kw in ["recommend", "suggest", "best practice", "improve", "action plan", "what should"]):
        return "recommendation"

    # Tribal knowledge patterns
    if any(kw in q for kw in ["tribal", "tip", "trick", "workaround", "experienced", "senior technician", "know-how"]):
        return "tribal"

    # Default to search
    return "search"


# ── Search Agent ─────────────────────────────────────────────────────────────

async def search_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Retrieve and synthesize information from the knowledge base."""
    result = await answer_query(query, db, equipment_tag=equipment_tag)
    result["agent_used"] = "search"
    return result


# ── Maintenance Agent ────────────────────────────────────────────────────────

async def maintenance_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Handle maintenance-related queries with MTBF and history analysis."""
    context_parts = []

    if equipment_tag:
        equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
        if equipment:
            # Get maintenance history
            mx_records = (
                db.query(MaintenanceRecord)
                .filter(MaintenanceRecord.equipment_id == equipment.id)
                .order_by(MaintenanceRecord.completed_date.desc())
                .all()
            )

            context_parts.append(f"=== MAINTENANCE INTELLIGENCE FOR {equipment.tag_id} ===")
            context_parts.append(f"Equipment: {equipment.name} ({equipment.equipment_type})")
            context_parts.append(f"Status: {equipment.status} | Criticality: {equipment.criticality}")

            # MTBF calculation
            mtbf = calculate_mtbf(equipment.id, db)
            if mtbf:
                context_parts.append(f"\nMTBF (Mean Time Between Failures): {mtbf:.1f} hours")

            # Failure patterns
            patterns = get_failure_patterns(equipment.id, db)
            if patterns:
                context_parts.append("\nFailure Patterns:")
                for p in patterns:
                    context_parts.append(f"  • {p['mode']}: {p['count']} occurrences, avg interval {p.get('avg_interval', 'N/A')}")

            # Prediction
            prediction = predict_next_failure(equipment.id, db)
            if prediction:
                context_parts.append(f"\nPredicted next maintenance: {prediction}")

            # History
            if mx_records:
                context_parts.append(f"\nMaintenance History ({len(mx_records)} records):")
                total_downtime = sum(m.downtime_hours or 0 for m in mx_records)
                total_cost = sum(m.cost or 0 for m in mx_records)
                context_parts.append(f"Total Downtime: {total_downtime:.1f} hours")
                context_parts.append(f"Total Cost: ₹{total_cost:,.0f}")
                for mx in mx_records[:10]:
                    downtime = mx.downtime_hours or 0
                    cost = mx.cost or 0
                    context_parts.append(
                        f"  • WO#{mx.work_order} [{mx.completed_date}] {mx.maintenance_type}: "
                        f"{mx.description} | {downtime}h downtime | ₹{cost:,.0f}"
                    )

    # Also search documents
    rag_result = await answer_query(query, db, equipment_tag=equipment_tag)

    # Combine contexts
    full_context = "\n".join(context_parts)
    if full_context:
        prompt = f"""You are the NEXUS IQ™ Maintenance Intelligence Agent.

{full_context}

Additional document context:
{rag_result.get('response', '')}

User Question: {query}

Provide a detailed maintenance-focused answer. Include MTBF data, maintenance trends, cost analysis, and specific recommendations."""

        response = await generate_text(prompt)
    else:
        response = rag_result.get("response", "No maintenance data found.")

    return {
        "response": response,
        "citations": rag_result.get("citations", []),
        "confidence": rag_result.get("confidence", 0.5),
        "follow_up_questions": [
            "What is the recommended maintenance schedule?",
            "What spare parts should be stocked?",
            "Show me the failure pattern analysis.",
        ],
        "agent_used": "maintenance",
    }


# ── Compliance Agent ─────────────────────────────────────────────────────────

async def compliance_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Handle compliance and regulation queries."""
    context_parts = ["=== COMPLIANCE INTELLIGENCE ==="]

    # Get all compliance requirements
    reqs = db.query(ComplianceRequirement).all()
    gaps = [r for r in reqs if r.compliance_status in ("gap", "partial")]

    context_parts.append(f"Total Requirements: {len(reqs)}")
    context_parts.append(f"Compliance Gaps: {len(gaps)}")

    if gaps:
        context_parts.append("\nCurrent Compliance Gaps:")
        for gap in gaps:
            context_parts.append(
                f"  ⚠ {gap.regulation_code} §{gap.section}: {gap.gap_description} "
                f"(Status: {gap.compliance_status})"
            )
            if gap.remediation_plan:
                context_parts.append(f"    Remediation: {gap.remediation_plan}")

    if equipment_tag:
        equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
        if equipment:
            applicable = [
                r for r in reqs
                if equipment.equipment_type in (r.applicable_equipment_types or [])
            ]
            context_parts.append(f"\nRegulations applicable to {equipment_tag} ({equipment.equipment_type}):")
            for r in applicable:
                status_icon = "✅" if r.compliance_status == "compliant" else "⚠"
                context_parts.append(f"  {status_icon} {r.regulation_code} §{r.section}: {r.description}")

    rag_result = await answer_query(query, db, equipment_tag=equipment_tag)
    full_context = "\n".join(context_parts)

    prompt = f"""You are the NEXUS IQ™ Compliance Agent.

{full_context}

Additional context:
{rag_result.get('response', '')}

User Question: {query}

Provide a compliance-focused answer. Identify gaps, cite specific regulation sections, and recommend remediation actions."""

    response = await generate_text(prompt)

    return {
        "response": response,
        "citations": rag_result.get("citations", []),
        "confidence": rag_result.get("confidence", 0.6),
        "follow_up_questions": [
            "What are the most critical compliance gaps?",
            "When is the next audit deadline?",
            "What remediation steps are needed?",
        ],
        "agent_used": "compliance",
    }


# ── RCA Agent ────────────────────────────────────────────────────────────────

async def rca_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Perform structured root cause analysis."""
    equipment_context = ""

    if equipment_tag:
        equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
        if equipment:
            incidents = (
                db.query(IncidentReport)
                .filter(IncidentReport.equipment_id == equipment.id)
                .order_by(IncidentReport.incident_date.desc())
                .all()
            )
            mx_records = (
                db.query(MaintenanceRecord)
                .filter(MaintenanceRecord.equipment_id == equipment.id)
                .order_by(MaintenanceRecord.completed_date.desc())
                .limit(10)
                .all()
            )
            failure_dna = (
                db.query(FailureDNA)
                .filter(FailureDNA.equipment_id == equipment.id)
                .all()
            )

            equipment_context = f"""Equipment: {equipment.tag_id} — {equipment.name}
Type: {equipment.equipment_type} | Manufacturer: {equipment.manufacturer}
Model: {equipment.model_number} | Criticality: {equipment.criticality}
Status: {equipment.status}
Specifications: {equipment.specifications}

Incident History ({len(incidents)} incidents):
"""
            for inc in incidents:
                equipment_context += f"  • [{inc.incident_date}] {inc.title} — Severity: {inc.severity}, Root Cause: {inc.root_cause}\n"

            equipment_context += f"\nRecent Maintenance ({len(mx_records)} records):\n"
            for mx in mx_records:
                equipment_context += f"  • [{mx.completed_date}] {mx.maintenance_type}: {mx.description}\n"

            if failure_dna:
                equipment_context += "\nKnown Failure Modes:\n"
                for fd in failure_dna:
                    equipment_context += f"  • {fd.failure_mode} ({fd.failure_mechanism}) — {fd.occurrence_count} occurrences\n"

    response = await run_rca_analysis(query, equipment_context)

    rag_result = await answer_query(query, db, equipment_tag=equipment_tag)

    return {
        "response": response,
        "citations": rag_result.get("citations", []),
        "confidence": 0.75,
        "follow_up_questions": [
            "What preventive measures can avoid recurrence?",
            "Are there similar failure patterns in other equipment?",
            "What monitoring should be put in place?",
        ],
        "agent_used": "rca",
    }


# ── Recommendation Agent ────────────────────────────────────────────────────

async def recommendation_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Generate action plans and recommendations."""
    rag_result = await answer_query(query, db, equipment_tag=equipment_tag)

    context = rag_result.get("response", "")
    prompt = f"""You are the NEXUS IQ™ Recommendation Engine.

Based on the following analysis:
{context}

User Request: {query}

Generate a structured action plan with:
1. **Immediate Actions** (within 24-48 hours)
2. **Short-term Actions** (within 1-2 weeks)
3. **Long-term Actions** (within 1-3 months)
4. **Monitoring Plan** — what to track going forward
5. **Resource Requirements** — parts, personnel, budget estimates
6. **Risk Assessment** — what happens if actions are not taken

Be specific with equipment tags, part numbers, and timelines."""

    response = await generate_text(prompt)

    return {
        "response": response,
        "citations": rag_result.get("citations", []),
        "confidence": rag_result.get("confidence", 0.6),
        "follow_up_questions": [
            "What is the estimated cost of implementation?",
            "Who should be responsible for each action?",
            "What is the expected ROI?",
        ],
        "agent_used": "recommendation",
    }


# ── Tribal Knowledge Agent ──────────────────────────────────────────────────

async def tribal_agent(query: str, db: Session, equipment_tag: str | None = None) -> dict:
    """Search and present tribal knowledge entries."""
    context_parts = ["=== TRIBAL KNOWLEDGE BASE ==="]

    if equipment_tag:
        equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
        if equipment:
            tk_entries = (
                db.query(TribalKnowledge)
                .filter(TribalKnowledge.equipment_id == equipment.id)
                .order_by(TribalKnowledge.upvotes.desc())
                .all()
            )
            if tk_entries:
                context_parts.append(f"\nTribal Knowledge for {equipment_tag} ({len(tk_entries)} entries):")
                for tk in tk_entries:
                    context_parts.append(
                        f"\n📝 {tk.title} (by {tk.contributed_by}, {tk.experience_years}yr exp, "
                        f"{'✅ Verified' if tk.verified else '⏳ Unverified'}, {tk.upvotes} upvotes)\n"
                        f"Category: {tk.category}\n{tk.content}"
                    )
    else:
        # Get all tribal knowledge
        tk_entries = db.query(TribalKnowledge).order_by(TribalKnowledge.upvotes.desc()).limit(10).all()
        if tk_entries:
            context_parts.append(f"\nTop Tribal Knowledge Entries:")
            for tk in tk_entries:
                eq = db.query(Equipment).filter(Equipment.id == tk.equipment_id).first()
                tag = eq.tag_id if eq else "N/A"
                context_parts.append(
                    f"\n📝 [{tag}] {tk.title} (by {tk.contributed_by})\n{tk.content}"
                )

    full_context = "\n".join(context_parts)

    prompt = f"""You are the NEXUS IQ™ Tribal Knowledge Agent, presenting experiential knowledge from senior technicians.

{full_context}

User Question: {query}

Present the relevant tribal knowledge with context. Highlight practical tips, warnings, and workarounds. Note which entries are verified by engineering."""

    response = await generate_text(prompt)

    return {
        "response": response,
        "citations": [],
        "confidence": 0.65,
        "follow_up_questions": [
            "Are there any safety warnings from senior technicians?",
            "What workarounds exist for common problems?",
            "How has this knowledge been validated?",
        ],
        "agent_used": "tribal",
    }


# ── Supervisor: Main Entry Point ────────────────────────────────────────────

async def process_query(
    query: str,
    db: Session,
    equipment_tag: str | None = None,
) -> dict:
    """Supervisor: classify query and route to the appropriate agent."""

    agent_type = classify_query(query)
    logger.info(f"Query classified as '{agent_type}': {query[:80]}")

    agent_map = {
        "search": search_agent,
        "maintenance": maintenance_agent,
        "compliance": compliance_agent,
        "rca": rca_agent,
        "recommendation": recommendation_agent,
        "tribal": tribal_agent,
    }

    agent_fn = agent_map.get(agent_type, search_agent)
    result = await agent_fn(query, db, equipment_tag)
    result["agent_used"] = agent_type
    return result
