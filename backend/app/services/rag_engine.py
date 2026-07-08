"""
NEXUS IQ™ — RAG Engine
Hybrid search → Context assembly → Gemini answer generation → Citation extraction
"""

import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Document, Chunk, Equipment, MaintenanceRecord, IncidentReport
from app.services.document_processor import get_chroma_collection, generate_embeddings
from app.services.gemini_client import generate_text

logger = logging.getLogger(__name__)

# ── System prompt for RAG ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are NEXUS IQ™, an expert AI assistant for industrial plant operations at Bharat Steel Limited, Jamshedpur Works.

Your capabilities:
- Deep knowledge of industrial equipment (pumps, compressors, heat exchangers, valves, boilers)
- Maintenance best practices and failure analysis
- Safety regulations and compliance (IS, ASME, API standards)
- Root cause analysis (5-Why, Fishbone, FMEA)
- Tribal knowledge from experienced technicians

Rules:
1. ALWAYS cite your sources with [Source: document_name, Page X] format
2. Be specific and technical — use actual equipment tags, measurements, dates
3. If context is insufficient, clearly state what information is missing
4. For safety-critical answers, always add appropriate warnings
5. Provide confidence level: HIGH (multiple corroborating sources), MEDIUM (single source), LOW (inference)
6. When discussing failure modes, always mention detection methods and recommended actions"""


# ── Vector Search ─────────────────────────────────────────────────────────────

def semantic_search(
    query: str,
    top_k: int = settings.TOP_K_RESULTS,
    doc_type_filter: str | None = None,
    equipment_tag: str | None = None,
) -> list[dict]:
    """Search ChromaDB for relevant chunks."""
    try:
        collection = get_chroma_collection()
        query_embedding = generate_embeddings([query])[0]

        where_filter = None
        if doc_type_filter:
            where_filter = {"doc_type": doc_type_filter}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        search_results = []
        if results and results["documents"] and results["documents"][0]:
            for i, doc_text in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                relevance = 1.0 - distance  # cosine distance → similarity

                if relevance < settings.RELEVANCE_THRESHOLD:
                    continue

                # If equipment_tag filter is set, check metadata
                if equipment_tag:
                    doc_tags = metadata.get("equipment_tags", "")
                    if equipment_tag not in str(doc_tags) and equipment_tag.lower() not in doc_text.lower():
                        continue

                search_results.append({
                    "content": doc_text,
                    "document_id": metadata.get("document_id", ""),
                    "doc_title": metadata.get("doc_title", "Unknown"),
                    "doc_type": metadata.get("doc_type", ""),
                    "page_number": metadata.get("page_number", 1),
                    "section_title": metadata.get("section_title", ""),
                    "chunk_index": metadata.get("chunk_index", 0),
                    "relevance_score": round(relevance, 4),
                })

        search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return search_results[:top_k]

    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        return []


# ── Context Assembly ──────────────────────────────────────────────────────────

def build_context(
    search_results: list[dict],
    db: Session,
    equipment_tag: str | None = None,
) -> str:
    """Assemble context from search results + equipment data + maintenance history."""
    context_parts = []

    # 1. Document chunks
    if search_results:
        context_parts.append("=== RELEVANT DOCUMENTS ===")
        for i, r in enumerate(search_results):
            context_parts.append(
                f"\n[Source {i+1}: {r['doc_title']}, Page {r['page_number']}] "
                f"(Relevance: {r['relevance_score']:.0%})\n{r['content']}\n"
            )

    # 2. Equipment context
    if equipment_tag:
        equipment = db.query(Equipment).filter(Equipment.tag_id == equipment_tag).first()
        if equipment:
            context_parts.append(f"\n=== EQUIPMENT CONTEXT: {equipment.tag_id} ===")
            context_parts.append(f"Name: {equipment.name}")
            context_parts.append(f"Type: {equipment.equipment_type}")
            context_parts.append(f"Manufacturer: {equipment.manufacturer}")
            context_parts.append(f"Model: {equipment.model_number}")
            context_parts.append(f"Criticality: {equipment.criticality}")
            context_parts.append(f"Status: {equipment.status}")
            context_parts.append(f"Location: {equipment.location_area}")
            if equipment.specifications:
                context_parts.append(f"Specifications: {equipment.specifications}")

            # Recent maintenance
            recent_mx = (
                db.query(MaintenanceRecord)
                .filter(MaintenanceRecord.equipment_id == equipment.id)
                .order_by(MaintenanceRecord.completed_date.desc())
                .limit(5)
                .all()
            )
            if recent_mx:
                context_parts.append(f"\n--- Recent Maintenance ({len(recent_mx)} records) ---")
                for mx in recent_mx:
                    context_parts.append(
                        f"• [{mx.completed_date}] {mx.maintenance_type}: {mx.description} "
                        f"| Findings: {mx.findings} | Downtime: {mx.downtime_hours}h"
                    )

            # Recent incidents
            recent_inc = (
                db.query(IncidentReport)
                .filter(IncidentReport.equipment_id == equipment.id)
                .order_by(IncidentReport.incident_date.desc())
                .limit(3)
                .all()
            )
            if recent_inc:
                context_parts.append(f"\n--- Recent Incidents ({len(recent_inc)} records) ---")
                for inc in recent_inc:
                    context_parts.append(
                        f"• [{inc.incident_date}] {inc.title} (Severity: {inc.severity}) "
                        f"Root Cause: {inc.root_cause}"
                    )

    return "\n".join(context_parts)


# ── Citation Extraction ──────────────────────────────────────────────────────

def extract_citations(response_text: str, search_results: list[dict]) -> list[dict]:
    """Map citations in the response back to source documents."""
    citations = []
    seen_doc_ids = set()

    # Match [Source: ...] patterns in the response
    citation_patterns = re.findall(r"\[Source[:\s]*([^\]]+)\]", response_text, re.IGNORECASE)
    citation_text = " ".join(citation_patterns).lower()

    for i, result in enumerate(search_results[:5]):
        doc_id = result["document_id"]
        doc_title = result["doc_title"]
        
        # Check if this source was cited by title, index (e.g. "1"), or if no patterns were found
        is_cited = (
            not citation_patterns
            or doc_title.lower() in citation_text
            or f"source {i+1}" in response_text.lower()
            or str(i+1) in citation_text
            or i < 2  # Always include top 2 sources as context fallback
        )

        if is_cited and doc_id not in seen_doc_ids:
            seen_doc_ids.add(doc_id)
            citations.append({
                "document_id": doc_id,
                "document_title": doc_title,
                "chunk_content": result["content"][:300],
                "page_number": result["page_number"],
                "relevance_score": result["relevance_score"],
            })

    return citations


# ── Confidence Scoring ───────────────────────────────────────────────────────

def calculate_confidence(search_results: list[dict], response_text: str) -> float:
    """Calculate confidence score based on source quality and quantity."""
    if not search_results:
        return 0.2

    # Factor 1: Number of relevant sources
    source_score = min(len(search_results) / 5.0, 1.0)

    # Factor 2: Average relevance
    avg_relevance = sum(r["relevance_score"] for r in search_results) / len(search_results)

    # Factor 3: Top-result relevance
    top_relevance = search_results[0]["relevance_score"] if search_results else 0

    # Factor 4: Multiple document types
    doc_types = set(r.get("doc_type", "") for r in search_results)
    diversity_score = min(len(doc_types) / 3.0, 1.0)

    confidence = (source_score * 0.25 + avg_relevance * 0.35 + top_relevance * 0.25 + diversity_score * 0.15)
    return round(min(confidence, 1.0), 2)


# ── Follow-up Question Generation ────────────────────────────────────────────

def generate_follow_ups(query: str, response: str) -> list[str]:
    """Generate relevant follow-up questions based on the conversation."""
    follow_ups = []

    query_lower = query.lower()
    if "failure" in query_lower or "breakdown" in query_lower:
        follow_ups.append("What preventive measures can avoid this failure in the future?")
        follow_ups.append("Are there similar failure patterns in other equipment?")
    elif "maintenance" in query_lower:
        follow_ups.append("What is the recommended maintenance schedule for this equipment?")
        follow_ups.append("What spare parts should be kept in inventory?")
    elif "compliance" in query_lower or "regulation" in query_lower:
        follow_ups.append("What are the current compliance gaps?")
        follow_ups.append("When is the next compliance audit scheduled?")
    elif "pump" in query_lower:
        follow_ups.append("What is the MTBF for this pump?")
        follow_ups.append("Show me the maintenance history for this pump.")
    else:
        follow_ups.append("Can you provide more details about this topic?")
        follow_ups.append("What related equipment or systems should I check?")

    follow_ups.append("Are there any tribal knowledge entries related to this?")
    return follow_ups[:3]


# ── Main RAG Pipeline ────────────────────────────────────────────────────────

async def answer_query(
    query: str,
    db: Session,
    equipment_tag: str | None = None,
    doc_type_filter: str | None = None,
) -> dict:
    """Full RAG pipeline: search → context → generate → citations."""

    # 1. Semantic search
    search_results = semantic_search(
        query,
        top_k=settings.TOP_K_RESULTS,
        doc_type_filter=doc_type_filter,
        equipment_tag=equipment_tag,
    )

    # 2. Build context
    context = build_context(search_results, db, equipment_tag)

    # 3. Generate answer
    if context.strip():
        prompt = f"""Context information from the NEXUS IQ™ industrial knowledge base:
---
{context}
---

User Question: {query}

Provide a detailed, technical answer using ONLY the context above. Cite sources using [Source: document_name, Page X] format. If the context is insufficient, clearly state what's missing."""

        response = await generate_text(prompt, system_instruction=SYSTEM_PROMPT)
    else:
        response = (
            "I couldn't find specific information in the knowledge base to answer your question. "
            "This could mean:\n"
            "1. The relevant documents haven't been uploaded yet\n"
            "2. The question may need to be rephrased for better search matching\n"
            "3. The topic may not be covered in our current document collection\n\n"
            "Please try uploading relevant documents or rephrasing your query."
        )

    # 4. Extract citations
    citations = extract_citations(response, search_results)

    # 5. Calculate confidence
    confidence = calculate_confidence(search_results, response)

    # 6. Generate follow-ups
    follow_ups = generate_follow_ups(query, response)

    return {
        "response": response,
        "citations": citations,
        "confidence": confidence,
        "follow_up_questions": follow_ups,
        "search_results_count": len(search_results),
    }
