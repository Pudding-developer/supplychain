import time
import logging
from typing import Dict, List, Optional, Set
from fastapi import APIRouter, HTTPException, Query
from app.db import db_manager
from app.models import (
    DisruptionRequest,
    DisruptionSimulationResponse,
    AffectedProduct,
    AlternateSupplierResponse,
    AlternateSupplier
)
from app.queries import DISRUPTION_BLAST_RADIUS, FIND_ALTERNATE_SUPPLIERS
from app.mock_data import MOCK_NODES, MOCK_LINKS

logger = logging.getLogger("chainpulse.simulation")
router = APIRouter(prefix="/api/simulation", tags=["Disruption Simulation"])

@router.post("/disrupt", response_model=DisruptionSimulationResponse)
async def simulate_disruption(request: DisruptionRequest):
    """
    Simulate node outage (e.g. factory fire, port strike, supplier bankruptcy).
    Performs multi-hop graph traversal (1..6 hops) to find cascading downstream product impacts.
    """
    start_time = time.perf_counter()
    disrupted_ids = request.disrupted_node_ids

    if not disrupted_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one disrupted node ID")

    if db_manager.is_connected:
        try:
            records = db_manager.execute_query(
                DISRUPTION_BLAST_RADIUS,
                parameters={"disrupted_ids": disrupted_ids},
                read_only=True
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            affected_products = []
            affected_node_set: Set[str] = set(disrupted_ids)
            total_revenue_risk = 0.0
            seen_products = set()

            for rec in records:
                pid = rec["product_id"]
                if pid not in seen_products:
                    seen_products.add(pid)
                    total_revenue_risk += rec.get("daily_revenue_risk", 0.0)
                
                affected_products.append(AffectedProduct(
                    product_id=pid,
                    product_name=rec["product_name"],
                    category=rec.get("category", "General"),
                    daily_revenue_risk=rec.get("daily_revenue_risk", 0.0),
                    depth=rec.get("depth", 1),
                    impact_path=rec.get("impact_path", [])
                ))
                for nid in rec.get("path_node_ids", []):
                    affected_node_set.add(nid)

            return DisruptionSimulationResponse(
                scenario_name=request.scenario_name or "Custom Disruption",
                disrupted_nodes=disrupted_ids,
                total_affected_products=len(seen_products),
                total_daily_revenue_at_risk_usd=total_revenue_risk,
                affected_products=affected_products,
                affected_node_ids=list(affected_node_set),
                affected_link_ids=[],
                executed_cypher=DISRUPTION_BLAST_RADIUS.strip(),
                execution_time_ms=elapsed_ms,
                source_mode="live_cogndb"
            )
        except Exception as e:
            logger.warning(f"Error in live Cypher simulation: {e}. Running in-memory graph traversal fallback.")

    # In-memory graph traversal fallback for mock mode
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Build adjacency mapping (source -> targets)
    adj: Dict[str, List[Dict]] = {}
    for link in MOCK_LINKS:
        src = link["source"]
        tgt = link["target"]
        if src not in adj:
            adj[src] = []
        adj[src].append(link)

    node_map = {n["id"]: n for n in MOCK_NODES}

    # BFS/DFS traversal from disrupted nodes to Products
    affected_node_set = set(disrupted_ids)
    affected_products_dict = {}

    def traverse(curr_id: str, depth: int, current_path: List[Dict]):
        curr_node = node_map.get(curr_id, {"id": curr_id, "name": curr_id, "label": "Unknown"})
        path_item = {"id": curr_id, "label": curr_node.get("label", "Node"), "name": curr_node.get("name", curr_id)}
        new_path = current_path + [path_item]

        if curr_node.get("label") == "Product" and curr_id not in disrupted_ids:
            if curr_id not in affected_products_dict:
                affected_products_dict[curr_id] = {
                    "product_id": curr_id,
                    "product_name": curr_node.get("name"),
                    "category": curr_node.get("category", "General"),
                    "daily_revenue_risk": curr_node.get("revenue_impact_daily_usd", 0.0),
                    "depth": depth,
                    "impact_path": new_path
                }
            return

        if depth >= 6:
            return

        for edge in adj.get(curr_id, []):
            nxt = edge["target"]
            affected_node_set.add(nxt)
            traverse(nxt, depth + 1, new_path)

    for dis_id in disrupted_ids:
        traverse(dis_id, 0, [])

    total_rev = sum(p["daily_revenue_risk"] for p in affected_products_dict.values())
    affected_products_list = [AffectedProduct(**p) for p in affected_products_dict.values()]

    return DisruptionSimulationResponse(
        scenario_name=request.scenario_name or "Custom Disruption",
        disrupted_nodes=disrupted_ids,
        total_affected_products=len(affected_products_list),
        total_daily_revenue_at_risk_usd=total_rev,
        affected_products=affected_products_list,
        affected_node_ids=list(affected_node_set),
        affected_link_ids=[],
        executed_cypher=DISRUPTION_BLAST_RADIUS.strip(),
        execution_time_ms=elapsed_ms,
        source_mode="fallback_mock"
    )

@router.get("/alternate-suppliers", response_model=AlternateSupplierResponse)
async def get_alternate_suppliers(
    component_id: str = Query(..., description="Target component ID"),
    disrupted_supplier_id: Optional[str] = Query("", description="ID of supplier to exclude")
):
    """
    Find qualified alternate suppliers for a given component when the primary supplier fails.
    """
    if db_manager.is_connected:
        try:
            records = db_manager.execute_query(
                FIND_ALTERNATE_SUPPLIERS,
                parameters={"component_id": component_id, "disrupted_supplier_id": disrupted_supplier_id or ""},
                read_only=True
            )
            alternates = [AlternateSupplier(**r) for r in records]
            return AlternateSupplierResponse(
                component_id=component_id,
                disrupted_supplier_id=disrupted_supplier_id,
                alternate_suppliers=alternates,
                executed_cypher=FIND_ALTERNATE_SUPPLIERS.strip(),
                source_mode="live_cogndb"
            )
        except Exception as e:
            logger.warning(f"Error querying live alternate suppliers: {e}")

    # Fallback lookup in mock links
    alternates = []
    supplier_nodes = {n["id"]: n for n in MOCK_NODES if n["label"] == "Supplier"}
    for link in MOCK_LINKS:
        if link["type"] == "SUPPLIES" and link["target"] == component_id:
            sup_id = link["source"]
            if sup_id != disrupted_supplier_id and sup_id in supplier_nodes:
                s_node = supplier_nodes[sup_id]
                alternates.append(AlternateSupplier(
                    supplier_id=sup_id,
                    supplier_name=s_node["name"],
                    tier=s_node.get("tier", "Tier 2"),
                    country=s_node.get("country", "Unknown"),
                    reliability=s_node.get("reliability_score", 0.85),
                    risk_rating=s_node.get("risk_rating", "Medium"),
                    lead_time_days=link.get("lead_time_days", 45),
                    is_primary=link.get("is_primary", False)
                ))

    # Sort by lead time ascending, reliability descending
    alternates.sort(key=lambda x: (x.lead_time_days, -x.reliability))

    return AlternateSupplierResponse(
        component_id=component_id,
        disrupted_supplier_id=disrupted_supplier_id,
        alternate_suppliers=alternates,
        executed_cypher=FIND_ALTERNATE_SUPPLIERS.strip(),
        source_mode="fallback_mock"
    )
