"""
ChainPulse Graph - Standalone Seed Script
Loads realistic Global Food, Chocolate & Beverage multi-tier supply chain data into CognoDB / Neo4j instance.
Compatible with CognoDB free (c0) tier limits.

Usage:
    python backend/seed.py
"""

import os
import sys
import logging
from dotenv import load_dotenv
from neo4j import GraphDatabase, exceptions

# Load environment variables
load_dotenv()

COGNDB_URI = os.getenv("COGNDB_URI")
COGNDB_USER = os.getenv("COGNDB_USER", "cognodb")
COGNDB_PASSWORD = os.getenv("COGNDB_PASSWORD")
COGNDB_DATABASE = os.getenv("COGNDB_DATABASE", "neo4j")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")

def run_seed():
    if not COGNDB_URI or not COGNDB_PASSWORD:
        logger.error("Missing COGNDB_URI or COGNDB_PASSWORD in environment variables / .env file.")
        logger.error("Please configure backend/.env with your CognoDB credentials from https://console.cognodb.com")
        sys.exit(1)

    logger.info(f"Connecting to CognoDB instance: {COGNDB_URI}...")

    try:
        driver = GraphDatabase.driver(
            COGNDB_URI,
            auth=(COGNDB_USER, COGNDB_PASSWORD),
            connection_acquisition_timeout=15.0
        )
        driver.verify_connectivity()
        logger.info("Connected successfully to CognoDB instance!")
    except Exception as e:
        logger.error(f"Failed to connect to CognoDB: {e}")
        sys.exit(1)

    with driver.session(database=COGNDB_DATABASE) as session:
        logger.info("Clearing existing supply chain graph nodes & relationships...")
        session.run("MATCH (n) DETACH DELETE n")

        logger.info("Creating constraints & indexes...")
        try:
            session.run("CREATE CONSTRAINT product_id_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE")
            session.run("CREATE CONSTRAINT component_id_unique IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE")
            session.run("CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE")
            session.run("CREATE CONSTRAINT facility_id_unique IF NOT EXISTS FOR (f:Facility) REQUIRE f.id IS UNIQUE")
            session.run("CREATE CONSTRAINT hub_id_unique IF NOT EXISTS FOR (h:LogisticsHub) REQUIRE h.id IS UNIQUE")
            session.run("CREATE CONSTRAINT region_id_unique IF NOT EXISTS FOR (r:Region) REQUIRE r.id IS UNIQUE")
        except Exception as e:
            logger.warning(f"Constraint creation note (continuing seed): {e}")

        logger.info("Seeding Regions & Logistics Hubs...")
        session.run("""
            UNWIND $regions AS r
            CREATE (:Region {
                id: r.id,
                name: r.name,
                geopolitical_risk_score: r.geopolitical_risk_score,
                climate_risk_score: r.climate_risk_score
            })
        """, regions=[
            {"id": "reg_1", "name": "Sub-Saharan Africa (Ghana/Madagascar/Ethiopia)", "geopolitical_risk_score": 0.55, "climate_risk_score": 0.65},
            {"id": "reg_2", "name": "Western Europe (Switzerland/Netherlands/Belgium)", "geopolitical_risk_score": 0.15, "climate_risk_score": 0.20},
            {"id": "reg_3", "name": "Latin America (Brazil/Colombia/Ecuador)", "geopolitical_risk_score": 0.35, "climate_risk_score": 0.45}
        ])

        session.run("""
            UNWIND $hubs AS h
            CREATE (:LogisticsHub {
                id: h.id,
                name: h.name,
                type: h.type,
                country: h.country
            })
        """, hubs=[
            {"id": "port_1", "name": "Port of Tema", "type": "Cacao Export Port", "country": "Ghana"},
            {"id": "port_2", "name": "Port of Toamasina", "type": "Spice Export Port", "country": "Madagascar"},
            {"id": "port_3", "name": "Port of Rotterdam", "type": "Central European Gateway", "country": "Netherlands"},
            {"id": "port_4", "name": "Port of Santos", "type": "Coffee & Sugar Export Port", "country": "Brazil"}
        ])

        logger.info("Seeding Facilities & Food Plants...")
        session.run("""
            UNWIND $facilities AS f
            CREATE (:Facility {
                id: f.id,
                name: f.name,
                type: f.type,
                country: f.country,
                status: f.status
            })
        """, facilities=[
            {"id": "fac_1", "name": "Zurich Chocolate Conching Works", "type": "Chocolate Conching Plant", "country": "Switzerland", "status": "Operational"},
            {"id": "fac_2", "name": "Antwerp Cocoa Butter Pressing Mill", "type": "Cacao Processing Mill", "country": "Belgium", "status": "Operational"},
            {"id": "fac_3", "name": "Sambava Vanilla Sun-Curing Sheds", "type": "Vanilla Curing Facility", "country": "Madagascar", "status": "Operational"},
            {"id": "fac_4", "name": "Rotterdam Central Roasting & Packaging Center", "type": "Food Packaging Hub", "country": "Netherlands", "status": "Operational"}
        ])

        logger.info("Seeding Suppliers...")
        session.run("""
            UNWIND $suppliers AS s
            CREATE (:Supplier {
                id: s.id,
                name: s.name,
                tier: s.tier,
                country: s.country,
                reliability_score: s.reliability_score,
                risk_rating: s.risk_rating
            })
        """, suppliers=[
            {"id": "sup_1", "name": "Swiss Master Chocolatiers SA", "tier": "Tier 1", "country": "Switzerland", "reliability_score": 0.98, "risk_rating": "Low"},
            {"id": "sup_2", "name": "Nordic Cold Brew Roasters", "tier": "Tier 1", "country": "Sweden", "reliability_score": 0.96, "risk_rating": "Low"},
            {"id": "sup_3", "name": "Alpine Organic Creameries", "tier": "Tier 1", "country": "Austria", "reliability_score": 0.94, "risk_rating": "Low"},
            {"id": "sup_4", "name": "EcoPack Food-Grade Containers", "tier": "Tier 1", "country": "Germany", "reliability_score": 0.95, "risk_rating": "Low"},

            {"id": "sup_6", "name": "Madagascar Vanilla Orchid Estates", "tier": "Tier 2", "country": "Madagascar", "reliability_score": 0.92, "risk_rating": "High"},
            {"id": "sup_8", "name": "Ghana Cocoa Board (COCOBOD)", "tier": "Tier 2", "country": "Ghana", "reliability_score": 0.94, "risk_rating": "Medium"},
            {"id": "sup_alt_2", "name": "Ecuador Hacienda Arriba Cacao", "tier": "Tier 2", "country": "Ecuador", "reliability_score": 0.89, "risk_rating": "Low"},
            {"id": "sup_9", "name": "Yirgacheffe Coffee Farmers Coop", "tier": "Tier 2", "country": "Ethiopia", "reliability_score": 0.91, "risk_rating": "Medium"},
            {"id": "sup_alt_1", "name": "Huila Colombian Coffee Growers", "tier": "Tier 2", "country": "Colombia", "reliability_score": 0.93, "risk_rating": "Low"},
            {"id": "sup_11", "name": "Sao Paulo Organic Sugar Refineries", "tier": "Tier 2", "country": "Brazil", "reliability_score": 0.95, "risk_rating": "Low"},
            {"id": "sup_alt_3", "name": "Veracruz Fair Trade Sugar Mills", "tier": "Tier 2", "country": "Mexico", "reliability_score": 0.88, "risk_rating": "Low"},

            {"id": "sup_13", "name": "Ashanti Regional Cacao Growers", "tier": "Tier 3", "country": "Ghana", "reliability_score": 0.92, "risk_rating": "Low"},
            {"id": "sup_alt_4", "name": "Ivory Coast Smallholders Federation", "tier": "Tier 3", "country": "Ivory Coast", "reliability_score": 0.86, "risk_rating": "Medium"},
            {"id": "sup_15", "name": "Sava Valley Vanilla Planters", "tier": "Tier 3", "country": "Madagascar", "reliability_score": 0.90, "risk_rating": "High"},
            {"id": "sup_16", "name": "Sidama Highland Coffee Pickers", "tier": "Tier 3", "country": "Ethiopia", "reliability_score": 0.93, "risk_rating": "Low"},
            {"id": "sup_17", "name": "Paulista Cane Plantation Collective", "tier": "Tier 3", "country": "Brazil", "reliability_score": 0.96, "risk_rating": "Low"},
            {"id": "sup_alt_5", "name": "Valle del Cauca Cane Growers", "tier": "Tier 3", "country": "Colombia", "reliability_score": 0.90, "risk_rating": "Low"}
        ])

        logger.info("Seeding Finished Products & Food Ingredients...")
        session.run("""
            UNWIND $products AS p
            CREATE (:Product {
                id: p.id,
                name: p.name,
                category: p.category,
                revenue_impact_daily_usd: p.revenue_impact_daily_usd,
                status: 'Operational'
            })
        """, products=[
            {"id": "prod_1", "name": "Artisanal 72% Dark Chocolate Truffle Bar", "category": "Luxury Confectionery", "revenue_impact_daily_usd": 850000.0},
            {"id": "prod_2", "name": "Single-Origin Nitro Cold Brew Coffee", "category": "Specialty Beverages", "revenue_impact_daily_usd": 620000.0},
            {"id": "prod_3", "name": "Bourbon Vanilla Bean Organic Ice Cream", "category": "Frozen Gourmet Dairy", "revenue_impact_daily_usd": 410000.0}
        ])

        session.run("""
            UNWIND $components AS c
            CREATE (:Component {
                id: c.id,
                name: c.name,
                type: c.type,
                lead_time_days: c.lead_time_days,
                unit_cost_usd: c.unit_cost_usd
            })
        """, components=[
            # Tier 1 Prepared Bases
            {"id": "comp_t1_1", "name": "Conched 72% Dark Chocolate Liquor Blend", "type": "Chocolate Base", "lead_time_days": 30, "unit_cost_usd": 420.0},
            {"id": "comp_t1_2", "name": "Micro-Lot Roasted Arabica Coffee Concentrate", "type": "Coffee Concentrate", "lead_time_days": 20, "unit_cost_usd": 280.0},
            {"id": "comp_t1_3", "name": "Pasteurized Organic Custard Cream Base", "type": "Dairy Base", "lead_time_days": 15, "unit_cost_usd": 190.0},
            {"id": "comp_t1_4", "name": "Foil-Sealed Eco-Packaging & Glass Jars", "type": "Sustainable Packaging", "lead_time_days": 25, "unit_cost_usd": 65.0},

            # Tier 2 Processed Ingredients
            {"id": "comp_t2_1", "name": "Pure Fermented Cocoa Butter & Cocoa Solids", "type": "Refined Cacao", "lead_time_days": 45, "unit_cost_usd": 85.0},
            {"id": "comp_t2_2", "name": "Pure Bourbon Vanilla Extract", "type": "Natural Flavoring", "lead_time_days": 75, "unit_cost_usd": 320.0},
            {"id": "comp_t2_3", "name": "Refined Organic Cane Sugar Crystals", "type": "Sweetener", "lead_time_days": 25, "unit_cost_usd": 35.0},
            {"id": "comp_t2_4", "name": "Washed High-Altitude Arabica Green Coffee Beans", "type": "Specialty Green Beans", "lead_time_days": 40, "unit_cost_usd": 110.0},
            {"id": "comp_t2_5", "name": "Organic Grass-Fed Whole Milk Powder", "type": "Dairy Solids", "lead_time_days": 20, "unit_cost_usd": 48.0},

            # Tier 3 Farm Crops
            {"id": "comp_t3_1", "name": "Harvested Raw Cocoa Pods", "type": "Agricultural Crop", "lead_time_days": 35, "unit_cost_usd": 18.0},
            {"id": "comp_t3_2", "name": "Raw Green Bourbon Vanilla Pods", "type": "Specialty Crop", "lead_time_days": 90, "unit_cost_usd": 140.0},
            {"id": "comp_t3_3", "name": "Organic Sugar Cane Stalks", "type": "Cane Crop", "lead_time_days": 15, "unit_cost_usd": 12.0},
            {"id": "comp_t3_4", "name": "Specialty Ripe Coffee Cherries", "type": "Coffee Harvest", "lead_time_days": 20, "unit_cost_usd": 22.0}
        ])

        logger.info("Connecting Food Supply Chain Relationships (PART_OF, SUPPLIES, MANUFACTURED_AT, LOCATED_IN, SHIPS_VIA)...")
        
        # Product BOM links (PART_OF)
        session.run("""
            UNWIND $links AS l
            MATCH (src {id: l.source})
            MATCH (tgt {id: l.target})
            CREATE (src)-[:PART_OF {quantity_required: l.qty, is_critical: l.critical}]->(tgt)
        """, links=[
            {"source": "comp_t1_1", "target": "prod_1", "qty": 1, "critical": True},
            {"source": "comp_t1_4", "target": "prod_1", "qty": 1, "critical": True},

            {"source": "comp_t1_2", "target": "prod_2", "qty": 1, "critical": True},
            {"source": "comp_t1_4", "target": "prod_2", "qty": 1, "critical": True},

            {"source": "comp_t1_3", "target": "prod_3", "qty": 1, "critical": True},
            {"source": "comp_t1_4", "target": "prod_3", "qty": 1, "critical": True},

            {"source": "comp_t2_1", "target": "comp_t1_1", "qty": 72, "critical": True},
            {"source": "comp_t2_3", "target": "comp_t1_1", "qty": 28, "critical": True},
            {"source": "comp_t2_2", "target": "comp_t1_1", "qty": 1, "critical": True},

            {"source": "comp_t2_4", "target": "comp_t1_2", "qty": 10, "critical": True},

            {"source": "comp_t2_2", "target": "comp_t1_3", "qty": 2, "critical": True},
            {"source": "comp_t2_5", "target": "comp_t1_3", "qty": 50, "critical": True},
            {"source": "comp_t2_3", "target": "comp_t1_3", "qty": 15, "critical": True},

            {"source": "comp_t3_1", "target": "comp_t2_1", "qty": 100, "critical": True},
            {"source": "comp_t3_2", "target": "comp_t2_2", "qty": 50, "critical": True},
            {"source": "comp_t3_3", "target": "comp_t2_3", "qty": 80, "critical": True},
            {"source": "comp_t3_4", "target": "comp_t2_4", "qty": 60, "critical": True}
        ])

        # Supplier SUPPLIES links
        session.run("""
            UNWIND $supplies AS s
            MATCH (sup:Supplier {id: s.source})
            MATCH (comp:Component {id: s.target})
            CREATE (sup)-[:SUPPLIES {lead_time_days: s.lead_time_days, is_primary: s.is_primary}]->(comp)
        """, supplies=[
            {"source": "sup_1", "target": "comp_t1_1", "lead_time_days": 30, "is_primary": True},
            {"source": "sup_2", "target": "comp_t1_2", "lead_time_days": 20, "is_primary": True},
            {"source": "sup_3", "target": "comp_t1_3", "lead_time_days": 15, "is_primary": True},
            {"source": "sup_4", "target": "comp_t1_4", "lead_time_days": 25, "is_primary": True},

            {"source": "sup_6", "target": "comp_t2_2", "lead_time_days": 75, "is_primary": True},

            {"source": "sup_8", "target": "comp_t2_1", "lead_time_days": 45, "is_primary": True},
            {"source": "sup_alt_2", "target": "comp_t2_1", "lead_time_days": 60, "is_primary": False},

            {"source": "sup_9", "target": "comp_t2_4", "lead_time_days": 40, "is_primary": True},
            {"source": "sup_alt_1", "target": "comp_t2_4", "lead_time_days": 50, "is_primary": False},

            {"source": "sup_11", "target": "comp_t2_3", "lead_time_days": 25, "is_primary": True},
            {"source": "sup_alt_3", "target": "comp_t2_3", "lead_time_days": 35, "is_primary": False},

            {"source": "sup_13", "target": "comp_t3_1", "lead_time_days": 35, "is_primary": True},
            {"source": "sup_alt_4", "target": "comp_t3_1", "lead_time_days": 45, "is_primary": False},

            {"source": "sup_15", "target": "comp_t3_2", "lead_time_days": 90, "is_primary": True},
            {"source": "sup_16", "target": "comp_t3_4", "lead_time_days": 20, "is_primary": True},

            {"source": "sup_17", "target": "comp_t3_3", "lead_time_days": 15, "is_primary": True},
            {"source": "sup_alt_5", "target": "comp_t3_3", "lead_time_days": 25, "is_primary": False}
        ])

        # Facilities, Geography & Port Routes
        session.run("""
            MATCH (c:Component {id: 'comp_t2_1'}), (f:Facility {id: 'fac_2'}) CREATE (c)-[:MANUFACTURED_AT]->(f)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_2'}), (r:Region {id: 'reg_2'}) CREATE (f)-[:LOCATED_IN]->(r)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_2'}), (p:LogisticsHub {id: 'port_3'}) CREATE (f)-[:SHIPS_VIA {transit_days: 1}]->(p)
        """)

        session.run("""
            MATCH (c:Component {id: 'comp_t2_2'}), (f:Facility {id: 'fac_3'}) CREATE (c)-[:MANUFACTURED_AT]->(f)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_3'}), (r:Region {id: 'reg_1'}) CREATE (f)-[:LOCATED_IN]->(r)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_3'}), (p:LogisticsHub {id: 'port_2'}) CREATE (f)-[:SHIPS_VIA {transit_days: 3}]->(p)
        """)

        session.run("""
            MATCH (c:Component {id: 'comp_t1_1'}), (f:Facility {id: 'fac_1'}) CREATE (c)-[:MANUFACTURED_AT]->(f)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_1'}), (r:Region {id: 'reg_2'}) CREATE (f)-[:LOCATED_IN]->(r)
        """)

        session.run("""
            MATCH (c:Component {id: 'comp_t1_4'}), (f:Facility {id: 'fac_4'}) CREATE (c)-[:MANUFACTURED_AT]->(f)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_4'}), (r:Region {id: 'reg_2'}) CREATE (f)-[:LOCATED_IN]->(r)
        """)
        session.run("""
            MATCH (f:Facility {id: 'fac_4'}), (p:LogisticsHub {id: 'port_3'}) CREATE (f)-[:SHIPS_VIA {transit_days: 1}]->(p)
        """)

        session.run("""
            MATCH (p1:LogisticsHub {id: 'port_1'}), (p3:LogisticsHub {id: 'port_3'}) CREATE (p1)-[:ROUTES_TO {transit_days: 12}]->(p3)
        """)
        session.run("""
            MATCH (p2:LogisticsHub {id: 'port_2'}), (p3:LogisticsHub {id: 'port_3'}) CREATE (p2)-[:ROUTES_TO {transit_days: 18}]->(p3)
        """)
        session.run("""
            MATCH (p4:LogisticsHub {id: 'port_4'}), (p3:LogisticsHub {id: 'port_3'}) CREATE (p4)-[:ROUTES_TO {transit_days: 14}]->(p3)
        """)

        # Verification query
        node_count = session.run("MATCH (n) RETURN count(n) AS cnt").single()["cnt"]
        rel_count = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt").single()["cnt"]
        logger.info(f"Seed complete! Created {node_count} nodes and {rel_count} relationships in CognoDB.")

    driver.close()
    logger.info("Database driver closed. Ready for application launch.")

if __name__ == "__main__":
    run_seed()
