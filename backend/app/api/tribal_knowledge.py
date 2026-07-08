"""
NEXUS IQ™ — Tribal Knowledge API Endpoints
CRUD operations for experiential knowledge entries.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Equipment, TribalKnowledge
from app.schemas import TribalKnowledgeCreate, TribalKnowledgeOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tribal-knowledge", tags=["Tribal Knowledge"])


# ── POST /tribal-knowledge — Add new knowledge entry ────────────────────────

@router.post("", response_model=TribalKnowledgeOut)
async def create_tribal_knowledge(
    entry: TribalKnowledgeCreate,
    db: Session = Depends(get_db),
):
    """Add a new tribal knowledge entry for a piece of equipment."""
    # Validate equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == entry.equipment_id).first()
    if not equipment:
        # Also check by tag_id
        equipment = db.query(Equipment).filter(Equipment.tag_id == entry.equipment_id).first()
        if not equipment:
            raise HTTPException(404, f"Equipment '{entry.equipment_id}' not found")

    tk = TribalKnowledge(
        equipment_id=equipment.id,
        title=entry.title,
        content=entry.content,
        category=entry.category,
        contributed_by=entry.contributed_by,
        experience_years=entry.experience_years,
        tags=entry.tags,
        verified=False,
        upvotes=0,
    )
    db.add(tk)
    db.commit()
    db.refresh(tk)

    logger.info(f"New tribal knowledge: '{tk.title}' for {equipment.tag_id} by {tk.contributed_by}")

    return TribalKnowledgeOut.model_validate(tk)


# ── GET /tribal-knowledge — List all entries ─────────────────────────────────

@router.get("", response_model=list[TribalKnowledgeOut])
async def list_tribal_knowledge(
    equipment_id: Optional[str] = Query(None, description="Filter by equipment ID"),
    category: Optional[str] = Query(None, description="Filter by category: tip, workaround, warning, best_practice"),
    verified_only: bool = Query(False, description="Return only verified entries"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all tribal knowledge entries with optional filtering."""
    query = db.query(TribalKnowledge)

    if equipment_id:
        # Support both ID and tag_id
        eq = db.query(Equipment).filter(Equipment.tag_id == equipment_id).first()
        if eq:
            query = query.filter(TribalKnowledge.equipment_id == eq.id)
        else:
            query = query.filter(TribalKnowledge.equipment_id == equipment_id)

    if category:
        query = query.filter(TribalKnowledge.category == category)

    if verified_only:
        query = query.filter(TribalKnowledge.verified == True)

    entries = (
        query.order_by(TribalKnowledge.upvotes.desc(), TribalKnowledge.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [TribalKnowledgeOut.model_validate(e) for e in entries]


# ── GET /tribal-knowledge/{equipment_tag} — Entries for specific equipment ──

@router.get("/{equipment_tag}", response_model=list[TribalKnowledgeOut])
async def get_tribal_knowledge_for_equipment(
    equipment_tag: str,
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all tribal knowledge entries for a specific equipment tag."""
    equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
    if not equipment:
        raise HTTPException(404, f"Equipment '{equipment_tag}' not found")

    query = db.query(TribalKnowledge).filter(TribalKnowledge.equipment_id == equipment.id)

    if category:
        query = query.filter(TribalKnowledge.category == category)

    entries = query.order_by(TribalKnowledge.upvotes.desc()).all()

    return [TribalKnowledgeOut.model_validate(e) for e in entries]


# ── PUT /tribal-knowledge/{id}/upvote — Upvote a tribal knowledge entry ─────

@router.put("/{tk_id}/upvote")
async def upvote_tribal_knowledge(tk_id: str, db: Session = Depends(get_db)):
    """Upvote a tribal knowledge entry to increase its visibility."""
    tk = db.query(TribalKnowledge).filter(TribalKnowledge.id == tk_id).first()
    if not tk:
        raise HTTPException(404, "Tribal knowledge entry not found")

    tk.upvotes = (tk.upvotes or 0) + 1
    db.commit()

    return {"id": tk.id, "upvotes": tk.upvotes, "message": "Upvoted successfully"}


# ── PUT /tribal-knowledge/{id}/verify — Verify a tribal knowledge entry ─────

@router.put("/{tk_id}/verify")
async def verify_tribal_knowledge(tk_id: str, db: Session = Depends(get_db)):
    """Mark a tribal knowledge entry as verified by engineering."""
    tk = db.query(TribalKnowledge).filter(TribalKnowledge.id == tk_id).first()
    if not tk:
        raise HTTPException(404, "Tribal knowledge entry not found")

    tk.verified = True
    db.commit()

    return {"id": tk.id, "verified": True, "message": "Entry verified by engineering"}
