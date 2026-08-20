import logging
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from app.db import db_manager
from app.queries import PRODUCT_BOM_EXPLORATION
from app.mock_data import MOCK_NODES, MOCK_LINKS

logger = logging.getLogger("chainpulse.products")
router = APIRouter(prefix="/api/products", tags=["Products & BOM"])

@router.get("")
async def get_products():
    """
    List all finished end-products in the supply chain.
    """
    if db_manager.is_connected:
        try:
            records = db_manager.execute_query("""
                MATCH (p:Product)
                OPTIONAL MATCH (p)<-[:PART_OF*1..4]-(c:Component)
                RETURN p.id AS id,
                       p.name AS name,
                       p.category AS category,
                       p.revenue_impact_daily_usd AS revenue_impact_daily_usd,
                       p.status AS status,
                       count(DISTINCT c) AS component_count
                ORDER BY p.revenue_impact_daily_usd DESC
            """, read_only=True)
            return {"products": records, "source_mode": "live_cogndb"}
        except Exception as e:
            logger.warning(f"Error querying live products: {e}")

    # Fallback
    products = [n for n in MOCK_NODES if n["label"] == "Product"]
    return {"products": products, "source_mode": "fallback_mock"}

@router.get("/{product_id}/bom")
async def get_product_bom(product_id: str):
    """
    Get the complete multi-tier Bill of Materials (BOM) hierarchy for a finished product.
    """
    if db_manager.is_connected:
        try:
            records = db_manager.execute_query(
                PRODUCT_BOM_EXPLORATION,
                parameters={"product_id": product_id},
                read_only=True
            )
            return {
                "product_id": product_id,
                "bom_items": records,
                "total_components": len(records),
                "source_mode": "live_cogndb"
            }
        except Exception as e:
            logger.warning(f"Error querying BOM for {product_id}: {e}")

    # Fallback BOM traversal
    node_map = {n["id"]: n for n in MOCK_NODES}
    if product_id not in node_map:
        raise HTTPException(status_code=404, detail="Product not found")

    part_of_adj: Dict[str, List[str]] = {}
    for link in MOCK_LINKS:
        if link["type"] == "PART_OF":
            tgt = link["target"]
            src = link["source"]
            if tgt not in part_of_adj:
                part_of_adj[tgt] = []
            part_of_adj[tgt].append(src)

    comp_suppliers: Dict[str, List[str]] = {}
    for link in MOCK_LINKS:
        if link["type"] == "SUPPLIES":
            c_id = link["target"]
            s_id = link["source"]
            s_name = node_map.get(s_id, {}).get("name", s_id)
            if c_id not in comp_suppliers:
                comp_suppliers[c_id] = []
            comp_suppliers[c_id].append(s_name)

    bom_items = []
    visited = set()

    def explore(curr_id: str, depth: int):
        for child_id in part_of_adj.get(curr_id, []):
            if child_id not in visited:
                visited.add(child_id)
                child = node_map.get(child_id, {})
                bom_items.append({
                    "component_id": child_id,
                    "component_name": child.get("name", child_id),
                    "component_type": child.get("type", "Component"),
                    "lead_time_days": child.get("lead_time_days", 30),
                    "unit_cost_usd": child.get("unit_cost_usd", 100.0),
                    "depth": depth,
                    "suppliers": comp_suppliers.get(child_id, [])
                })
                explore(child_id, depth + 1)

    explore(product_id, 1)

    return {
        "product_id": product_id,
        "product_name": node_map[product_id].get("name"),
        "bom_items": bom_items,
        "total_components": len(bom_items),
        "source_mode": "fallback_mock"
    }
