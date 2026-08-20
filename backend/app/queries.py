"""
Parameterized openCypher Queries Library
All queries are parameterized to prevent injection and optimize query plan caching.
"""

# 1. Fetch full graph topology (Nodes & Relationships) for interactive visualization
GET_FULL_GRAPH_TOPOLOGY = """
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN collect(DISTINCT {
    id: n.id,
    label: labels(n)[0],
    name: coalesce(n.name, n.id),
    type: n.type,
    tier: n.tier,
    country: n.country,
    category: n.category,
    reliability_score: n.reliability_score,
    risk_rating: n.risk_rating,
    revenue_impact_daily_usd: n.revenue_impact_daily_usd,
    lead_time_days: n.lead_time_days,
    unit_cost_usd: n.unit_cost_usd,
    status: coalesce(n.status, 'Operational')
}) AS nodes,
collect(DISTINCT {
    source: n.id,
    target: m.id,
    type: type(r),
    lead_time_days: r.lead_time_days,
    is_primary: r.is_primary,
    is_critical: r.is_critical,
    quantity_required: r.quantity_required,
    transit_days: r.transit_days
}) AS links
"""

# 2. Disruption Blast Radius (Multi-hop 1..6 hop cascade from disrupted node(s) to finished products)
DISRUPTION_BLAST_RADIUS = """
MATCH path = (origin)-[*1..6]->(p:Product)
WHERE origin.id IN $disrupted_ids
WITH p, path, length(path) AS depth
ORDER BY p.revenue_impact_daily_usd DESC, depth ASC
RETURN p.id AS product_id,
       p.name AS product_name,
       p.category AS category,
       p.revenue_impact_daily_usd AS daily_revenue_risk,
       depth,
       [n IN nodes(path) | {id: n.id, label: labels(n)[0], name: coalesce(n.name, n.id)}] AS impact_path,
       [n IN nodes(path) | n.id] AS path_node_ids
"""

# 3. Single Point of Failure (SPOF) - Components with only 1 supplier across all product lines
DETECT_SPOFS = """
MATCH (p:Product)<-[:PART_OF*1..4]-(c:Component)
OPTIONAL MATCH (s:Supplier)-[sup:SUPPLIES]->(c)
WITH c, p, count(DISTINCT s) AS supplier_count, collect(DISTINCT s) AS suppliers
WHERE supplier_count = 1
WITH c, suppliers[0] AS sole_supplier_node, collect(DISTINCT p.name) AS affected_products, count(DISTINCT p) AS product_count
RETURN c.id AS component_id,
       c.name AS component_name,
       c.lead_time_days AS lead_time_days,
       c.unit_cost_usd AS unit_cost,
       sole_supplier_node.name AS sole_supplier,
       sole_supplier_node.id AS supplier_id,
       sole_supplier_node.country AS supplier_country,
       affected_products,
       product_count,
       CASE 
           WHEN c.lead_time_days >= 60 OR product_count >= 2 THEN 'CRITICAL'
           ELSE 'HIGH'
       END AS risk_level
ORDER BY product_count DESC, c.lead_time_days DESC
"""

# 4. Alternate Supplier & Sourcing Query
FIND_ALTERNATE_SUPPLIERS = """
MATCH (c:Component {id: $component_id})<-[r:SUPPLIES]-(alt:Supplier)
WHERE alt.id <> $disrupted_supplier_id
RETURN alt.id AS supplier_id,
       alt.name AS supplier_name,
       alt.tier AS tier,
       alt.country AS country,
       alt.reliability_score AS reliability,
       alt.risk_rating AS risk_rating,
       r.lead_time_days AS lead_time_days,
       r.is_primary AS is_primary
ORDER BY r.lead_time_days ASC, alt.reliability_score DESC
"""

# 5. Product Bill of Materials (BOM) multi-depth hierarchy
PRODUCT_BOM_EXPLORATION = """
MATCH path = (p:Product {id: $product_id})<-[:PART_OF*1..5]-(c:Component)
OPTIONAL MATCH (s:Supplier)-[:SUPPLIES]->(c)
RETURN c.id AS component_id,
       c.name AS component_name,
       c.type AS component_type,
       c.lead_time_days AS lead_time_days,
       c.unit_cost_usd AS unit_cost_usd,
       length(path) AS depth,
       collect(DISTINCT s.name) AS suppliers
ORDER BY depth ASC, c.name ASC
"""

# 6. Geopolitical & Regional Disruption Analysis
REGIONAL_IMPACT_ANALYSIS = """
MATCH (r:Region {id: $region_id})<-[:LOCATED_IN]-(f:Facility)<-[:MANUFACTURED_AT]-(c:Component)-[:PART_OF*1..4]->(p:Product)
RETURN r.name AS region_name,
       count(DISTINCT f) AS affected_facilities,
       collect(DISTINCT f.name) AS facility_names,
       count(DISTINCT c) AS affected_components,
       collect(DISTINCT c.name) AS component_names,
       collect(DISTINCT p.name) AS endangered_products,
       sum(DISTINCT p.revenue_impact_daily_usd) AS total_daily_revenue_risk
"""
