import time
import logging
from typing import Dict, List, Set
from fastapi import APIRouter
from app.db import db_manager
from app.models import SPOFResponse, SPOFItem
from app.queries import DETECT_SPOFS
from app.mock_data import MOCK_NODES, MOCK_LINKS

logger = logging.getLogger("chainpulse.spof")
router = APIRouter(prefix="/api/spof", tags=["Single Point of Failure (SPOF)"])

@router.get("", response_model=SPOFResponse)
async def get_single_points_of_failure():
    """
    Detect sole-source components and suppliers that represent Single Points of Failure.
    These are mission-critical components where only 1 supplier exists in the entire network.
    """
    start_time = time.perf_counter()

    if db_manager.is_connected:
        try:
            records = db_manager.execute_query(DETECT_SPOFS, read_only=True)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            items = [SPOFItem(**r) for r in records]
            return SPOFResponse(
                total_spofs=len(items),
                critical_items=items,
                executed_cypher=DETECT_SPOFS.strip(),
                execution_time_ms=elapsed_ms,
                source_mode="live_cogndb"
            )
        except Exception as e:
            logger.warning(f"Error querying live CognoDB for SPOFs: {e}")

    # Fallback mock analysis
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Count suppliers per component
    comp_suppliers: Dict[str, List[str]] = {}
    for link in MOCK_LINKS:
        if link["type"] == "SUPPLIES":
            c_id = link["target"]
            s_id = link["source"]
            if c_id not in comp_suppliers:
                comp_suppliers[c_id] = []
            comp_suppliers[c_id].append(s_id)

    node_map = {n["id"]: n for n in MOCK_NODES}

    # Find products dependent on each component (downstream graph traversal)
    part_of_adj: Dict[str, List[str]] = {}
    for link in MOCK_LINKS:
        if link["type"] == "PART_OF":
            src = link["source"]
            tgt = link["target"]
            if src not in part_of_adj:
                part_of_adj[src] = []
            part_of_adj[src].append(tgt)

    def find_all_products(comp_id: str) -> Set[str]:
        prods = set()
        stack = [comp_id]
        visited = set()
        while stack:
            curr = stack.pop()
            if curr in visited:
                continue
            visited.add(curr)
            curr_node = node_map.get(curr, {})
            if curr_node.get("label") == "Product":
                prods.add(curr_node.get("name", curr))
            for nxt in part_of_adj.get(curr, []):
                stack.append(nxt)
        return prods

    spof_items = []
    for c_id, sups in comp_suppliers.items():
        if len(sups) == 1:
            sole_sup_id = sups[0]
            sole_sup = node_map.get(sole_sup_id, {})
            comp = node_map.get(c_id, {})
            prods = list(find_all_products(c_id))
            
            if prods:
                lead_time = comp.get("lead_time_days", 30)
                risk = "CRITICAL" if lead_time >= 60 or len(prods) >= 2 else "HIGH"
                spof_items.append(SPOFItem(
                    component_id=c_id,
                    component_name=comp.get("name", c_id),
                    lead_time_days=lead_time,
                    unit_cost=comp.get("unit_cost_usd", 100.0),
                    sole_supplier=sole_sup.get("name", "Unknown Supplier"),
                    supplier_id=sole_sup_id,
                    supplier_country=sole_sup.get("country", "Unknown"),
                    affected_products=prods,
                    product_count=len(prods),
                    risk_level=risk
                ))

    spof_items.sort(key=lambda x: (x.product_count, x.lead_time_days), reverse=True)

    return SPOFResponse(
        total_spofs=len(spof_items),
        critical_items=spof_items,
        executed_cypher=DETECT_SPOFS.strip(),
        execution_time_ms=elapsed_ms,
        source_mode="fallback_mock"
    )
