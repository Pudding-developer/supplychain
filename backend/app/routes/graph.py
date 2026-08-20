import logging
from typing import List, Optional
from fastapi import APIRouter, Query
from app.db import db_manager
from app.models import GraphNode, GraphLink, GraphResponse
from app.queries import GET_FULL_GRAPH_TOPOLOGY
from app.mock_data import MOCK_NODES, MOCK_LINKS

logger = logging.getLogger("chainpulse.graph")
router = APIRouter(prefix="/api/graph", tags=["Graph Topology"])

@router.get("", response_model=GraphResponse)
async def get_graph(
    label: Optional[str] = Query(None, description="Filter by node label (e.g. Product, Component, Supplier)"),
    tier: Optional[str] = Query(None, description="Filter by supplier tier (Tier 1, Tier 2, Tier 3)")
):
    """
    Retrieve supply chain graph topology for force-directed visualization.
    Uses CognoDB openCypher query over Bolt protocol with graceful fallback.
    """
    if db_manager.is_connected:
        try:
            records = db_manager.execute_query(GET_FULL_GRAPH_TOPOLOGY, read_only=True)
            if records and len(records) > 0:
                raw_nodes = records[0].get("nodes", [])
                raw_links = records[0].get("links", [])
                
                # Filter out None links if any
                valid_links = [l for l in raw_links if l.get("source") and l.get("target")]
                
                nodes = [GraphNode(**n) for n in raw_nodes if n.get("id")]
                links = [GraphLink(**l) for l in valid_links]

                # Apply in-memory filters if specified
                if label:
                    nodes = [n for n in nodes if n.label.lower() == label.lower()]
                    node_ids = {n.id for n in nodes}
                    links = [l for l in links if l.source in node_ids and l.target in node_ids]
                if tier:
                    nodes = [n for n in nodes if n.tier == tier or n.label != "Supplier"]
                    node_ids = {n.id for n in nodes}
                    links = [l for l in links if l.source in node_ids and l.target in node_ids]

                return GraphResponse(
                    nodes=nodes,
                    links=links,
                    total_nodes=len(nodes),
                    total_links=len(links),
                    source_mode="live_cogndb"
                )
        except Exception as e:
            logger.warning(f"Error querying live CognoDB graph: {e}. Falling back to mock dataset.")

    # Fallback / Mock Mode
    nodes = [GraphNode(**n) for n in MOCK_NODES]
    links = [GraphLink(**l) for l in MOCK_LINKS]

    if label:
        nodes = [n for n in nodes if n.label.lower() == label.lower()]
        node_ids = {n.id for n in nodes}
        links = [l for l in links if l.source in node_ids and l.target in node_ids]
    if tier:
        nodes = [n for n in nodes if n.tier == tier or n.label != "Supplier"]
        node_ids = {n.id for n in nodes}
        links = [l for l in links if l.source in node_ids and l.target in node_ids]

    return GraphResponse(
        nodes=nodes,
        links=links,
        total_nodes=len(nodes),
        total_links=len(links),
        source_mode="fallback_mock"
    )
