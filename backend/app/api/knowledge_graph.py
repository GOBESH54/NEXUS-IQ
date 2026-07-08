"""
NEXUS IQ™ — Knowledge Graph API Endpoints
Visualisation data, subgraph queries, and node search.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import KnowledgeGraphData, GraphNode, GraphEdge
from app.services.knowledge_graph import (
    get_full_graph_data,
    get_equipment_subgraph,
    get_graph,
    build_knowledge_graph,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


# ── GET /knowledge-graph — Full graph data ───────────────────────────────────

@router.get("", response_model=KnowledgeGraphData)
async def get_knowledge_graph(db: Session = Depends(get_db)):
    """Return the full knowledge graph (nodes + edges) for visualisation."""
    G = get_graph()

    # If graph is empty, rebuild from database
    if G.number_of_nodes() == 0:
        build_knowledge_graph(db)

    data = get_full_graph_data()
    return KnowledgeGraphData(
        nodes=[GraphNode(**n) for n in data["nodes"]],
        edges=[GraphEdge(**e) for e in data["edges"]],
    )


# ── GET /knowledge-graph/equipment/{tag_id} — Equipment-centered subgraph ───

@router.get("/equipment/{tag_id}", response_model=KnowledgeGraphData)
async def get_equipment_graph(
    tag_id: str,
    depth: int = Query(2, ge=1, le=5),
    db: Session = Depends(get_db),
):
    """Get a subgraph centered on a specific equipment node."""
    G = get_graph()

    # Rebuild if empty
    if G.number_of_nodes() == 0:
        build_knowledge_graph(db)

    data = get_equipment_subgraph(tag_id, depth=depth)
    return KnowledgeGraphData(
        nodes=[GraphNode(**n) for n in data["nodes"]],
        edges=[GraphEdge(**e) for e in data["edges"]],
    )


# ── GET /knowledge-graph/search — Search nodes ──────────────────────────────

@router.get("/search")
async def search_nodes(
    q: str = Query(..., min_length=1, description="Search term for graph nodes"),
    node_type: Optional[str] = Query(None, description="Filter by node type"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search knowledge graph nodes by label or properties."""
    G = get_graph()

    # Rebuild if empty
    if G.number_of_nodes() == 0:
        build_knowledge_graph(db)

    q_lower = q.lower()
    results = []

    for node_id, data in G.nodes(data=True):
        # Filter by type if specified
        if node_type and data.get("type", "") != node_type:
            continue

        # Search in label and properties
        label = data.get("label", "").lower()
        name = data.get("name", "").lower()
        props_str = " ".join(str(v).lower() for v in data.values())

        if q_lower in label or q_lower in name or q_lower in props_str:
            results.append({
                "id": node_id,
                "label": data.get("label", node_id),
                "type": data.get("type", "Unknown"),
                "properties": {k: v for k, v in data.items() if k not in ("label", "type")},
                "connections": G.degree(node_id),
            })

        if len(results) >= limit:
            break

    # Sort by number of connections (most connected first)
    results.sort(key=lambda x: x["connections"], reverse=True)

    return {"query": q, "count": len(results), "results": results}


# ── GET /knowledge-graph/stats — Graph statistics ────────────────────────────

@router.get("/stats")
async def get_graph_stats(db: Session = Depends(get_db)):
    """Get knowledge graph statistics."""
    G = get_graph()

    if G.number_of_nodes() == 0:
        build_knowledge_graph(db)

    # Count nodes by type
    type_counts = {}
    for _, data in G.nodes(data=True):
        t = data.get("type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    # Count edges by relationship
    rel_counts = {}
    for _, _, data in G.edges(data=True):
        r = data.get("relationship", "UNKNOWN")
        rel_counts[r] = rel_counts.get(r, 0) + 1

    return {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "nodes_by_type": type_counts,
        "edges_by_relationship": rel_counts,
        "density": round(G.number_of_edges() / max(G.number_of_nodes(), 1), 2),
    }
