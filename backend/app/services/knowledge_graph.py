"""
NEXUS IQ™ — Knowledge Graph Service (NetworkX)
Build and query an in-memory knowledge graph of industrial entities.
"""

import logging
from typing import Optional

import networkx as nx
from sqlalchemy.orm import Session

from app.models import (
    Equipment, Document, MaintenanceRecord, InspectionRecord,
    IncidentReport, ComplianceRequirement, TribalKnowledge, FailureDNA,
)

logger = logging.getLogger(__name__)

# ── Singleton Graph ──────────────────────────────────────────────────────────

_graph: Optional[nx.DiGraph] = None


def get_graph() -> nx.DiGraph:
    global _graph
    if _graph is None:
        _graph = nx.DiGraph()
    return _graph


def reset_graph():
    global _graph
    _graph = nx.DiGraph()
    return _graph


# ── Node & Edge Helpers ──────────────────────────────────────────────────────

def add_node(node_id: str, node_type: str, label: str, **properties):
    G = get_graph()
    G.add_node(node_id, type=node_type, label=label, **properties)


def add_edge(source: str, target: str, relationship: str, **properties):
    G = get_graph()
    if G.has_node(source) and G.has_node(target):
        G.add_edge(source, target, relationship=relationship, **properties)


# ── Build Graph from Database ────────────────────────────────────────────────

def build_knowledge_graph(db: Session):
    """Build the full knowledge graph from all database entities."""
    G = reset_graph()
    logger.info("Building knowledge graph…")

    # 1. Equipment nodes
    equipment_list = db.query(Equipment).all()
    for eq in equipment_list:
        add_node(
            f"eq_{eq.tag_id}",
            "Equipment",
            eq.tag_id,
            name=eq.name,
            equipment_type=eq.equipment_type or "",
            criticality=eq.criticality or "",
            status=eq.status or "",
            location=eq.location_area or "",
            manufacturer=eq.manufacturer or "",
        )

    # 2. Document nodes + DOCUMENTED_BY edges
    documents = db.query(Document).all()
    for doc in documents:
        add_node(
            f"doc_{doc.id[:8]}",
            "Document",
            doc.title,
            doc_type=doc.doc_type or "",
            page_count=doc.page_count or 0,
        )
        # Link documents to equipment via extracted tags
        tags = (doc.metadata_json or {}).get("equipment_tags", [])
        for tag in tags:
            eq_node = f"eq_{tag}"
            if G.has_node(eq_node):
                add_edge(f"doc_{doc.id[:8]}", eq_node, "DOCUMENTS")
                add_edge(eq_node, f"doc_{doc.id[:8]}", "DOCUMENTED_BY")

    # 3. Maintenance → Technician nodes + edges
    technicians_seen = set()
    mx_records = db.query(MaintenanceRecord).all()
    for mx in mx_records:
        eq = db.query(Equipment).filter(Equipment.id == mx.equipment_id).first()
        if not eq:
            continue

        # Maintenance event node
        mx_node = f"mx_{mx.id[:8]}"
        add_node(
            mx_node,
            "MaintenanceEvent",
            f"{mx.maintenance_type}: {(mx.description or '')[:60]}",
            work_order=mx.work_order or "",
            maintenance_type=mx.maintenance_type or "",
            date=str(mx.completed_date) if mx.completed_date else "",
            downtime=mx.downtime_hours or 0,
        )
        add_edge(f"eq_{eq.tag_id}", mx_node, "HAD_MAINTENANCE")

        # Technician nodes
        if mx.technician and mx.technician not in technicians_seen:
            technicians_seen.add(mx.technician)
            add_node(f"tech_{mx.technician}", "Technician", mx.technician)
        if mx.technician:
            add_edge(mx_node, f"tech_{mx.technician}", "PERFORMED_BY")

    # 4. Incident nodes
    incidents = db.query(IncidentReport).all()
    for inc in incidents:
        eq = db.query(Equipment).filter(Equipment.id == inc.equipment_id).first()
        if not eq:
            continue
        inc_node = f"inc_{inc.id[:8]}"
        add_node(
            inc_node,
            "Incident",
            inc.title or inc.incident_number or "Incident",
            severity=inc.severity or "",
            category=inc.category or "",
            date=str(inc.incident_date) if inc.incident_date else "",
        )
        add_edge(f"eq_{eq.tag_id}", inc_node, "HAD_INCIDENT")

        # Link root cause as FailureMode
        if inc.root_cause:
            fm_label = inc.root_cause[:80]
            fm_node = f"fm_{hash(fm_label) % 100000}"
            if not G.has_node(fm_node):
                add_node(fm_node, "FailureMode", fm_label)
            add_edge(inc_node, fm_node, "CAUSED_BY")

    # 5. Compliance / Regulation nodes
    regulations = db.query(ComplianceRequirement).all()
    for reg in regulations:
        reg_node = f"reg_{reg.id[:8]}"
        add_node(
            reg_node,
            "Regulation",
            f"{reg.regulation_code}: {reg.regulation_name}",
            category=reg.category or "",
            status=reg.compliance_status or "",
        )
        # Link to applicable equipment types
        for eq in equipment_list:
            if eq.equipment_type and eq.equipment_type in (reg.applicable_equipment_types or []):
                add_edge(f"eq_{eq.tag_id}", reg_node, "GOVERNED_BY")

    # 6. Failure DNA nodes
    failure_dna_records = db.query(FailureDNA).all()
    for fd in failure_dna_records:
        eq = db.query(Equipment).filter(Equipment.id == fd.equipment_id).first()
        if not eq:
            continue
        fd_node = f"fdna_{fd.id[:8]}"
        add_node(
            fd_node,
            "FailureDNA",
            fd.failure_mode or "Unknown",
            mechanism=fd.failure_mechanism or "",
            mtf=fd.mean_time_to_failure or 0,
            occurrences=fd.occurrence_count or 0,
        )
        add_edge(f"eq_{eq.tag_id}", fd_node, "HAS_FAILURE_MODE")

    # 7. Equipment → Equipment relationships (system topology)
    _build_system_topology(equipment_list)

    logger.info(f"Knowledge graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    return G


def _build_system_topology(equipment_list):
    """Create FEEDS_INTO / UPSTREAM relationships based on parent_system grouping."""
    systems: dict[str, list] = {}
    for eq in equipment_list:
        sys = eq.parent_system or "General"
        systems.setdefault(sys, []).append(eq)

    # Connect equipment within the same system
    for sys_name, eq_list in systems.items():
        for i in range(len(eq_list) - 1):
            src = f"eq_{eq_list[i].tag_id}"
            tgt = f"eq_{eq_list[i + 1].tag_id}"
            add_edge(src, tgt, "FEEDS_INTO")
            add_edge(tgt, src, "UPSTREAM_OF")


# ── Query Functions ──────────────────────────────────────────────────────────

def get_full_graph_data() -> dict:
    """Return full graph as nodes + edges for visualization."""
    G = get_graph()
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": data.get("label", node_id),
            "type": data.get("type", "Unknown"),
            "properties": {k: v for k, v in data.items() if k not in ("label", "type")},
        })

    edges = []
    for source, target, data in G.edges(data=True):
        edges.append({
            "source": source,
            "target": target,
            "relationship": data.get("relationship", "RELATED_TO"),
            "properties": {k: v for k, v in data.items() if k != "relationship"},
        })

    return {"nodes": nodes, "edges": edges}


def get_equipment_subgraph(tag_id: str, depth: int = 2) -> dict:
    """Get a subgraph centered on an equipment node."""
    G = get_graph()
    center = f"eq_{tag_id}"

    if not G.has_node(center):
        return {"nodes": [], "edges": []}

    # BFS to collect neighbors up to depth
    visited = {center}
    frontier = [center]
    for _ in range(depth):
        next_frontier = []
        for node in frontier:
            for neighbor in list(G.successors(node)) + list(G.predecessors(node)):
                if neighbor not in visited:
                    visited.add(neighbor)
                    next_frontier.append(neighbor)
        frontier = next_frontier

    # Build subgraph
    sub = G.subgraph(visited)
    nodes = []
    for node_id, data in sub.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": data.get("label", node_id),
            "type": data.get("type", "Unknown"),
            "properties": {k: v for k, v in data.items() if k not in ("label", "type")},
        })

    edges = []
    for source, target, data in sub.edges(data=True):
        edges.append({
            "source": source,
            "target": target,
            "relationship": data.get("relationship", "RELATED_TO"),
            "properties": {k: v for k, v in data.items() if k != "relationship"},
        })

    return {"nodes": nodes, "edges": edges}


def get_upstream_downstream(tag_id: str) -> dict:
    """Get upstream and downstream equipment from the knowledge graph."""
    G = get_graph()
    center = f"eq_{tag_id}"
    if not G.has_node(center):
        return {"upstream": [], "downstream": []}

    upstream = []
    downstream = []

    # Downstream: follow FEEDS_INTO edges
    for _, target, data in G.out_edges(center, data=True):
        if data.get("relationship") == "FEEDS_INTO":
            t_data = G.nodes[target]
            downstream.append({
                "tag_id": t_data.get("label", target),
                "name": t_data.get("name", ""),
                "type": t_data.get("equipment_type", ""),
            })

    # Upstream: follow UPSTREAM_OF edges
    for _, target, data in G.out_edges(center, data=True):
        if data.get("relationship") == "UPSTREAM_OF":
            t_data = G.nodes[target]
            upstream.append({
                "tag_id": t_data.get("label", target),
                "name": t_data.get("name", ""),
                "type": t_data.get("equipment_type", ""),
            })

    return {"upstream": upstream, "downstream": downstream}
