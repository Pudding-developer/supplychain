"""
Embedded realistic dataset for offline fallback, automated testing, and zero-config instant demos.
Models a Global Gourmet Food, Coffee & Confectionery multi-tier supply chain network.
"""

MOCK_NODES = [
    # Finished Consumer Food Products (Tier 0)
    {"id": "prod_1", "label": "Product", "name": "Artisanal 72% Dark Chocolate Truffle Bar", "category": "Luxury Confectionery", "revenue_impact_daily_usd": 850000.0, "status": "Operational"},
    {"id": "prod_2", "label": "Product", "name": "Single-Origin Nitro Cold Brew Coffee", "category": "Specialty Beverages", "revenue_impact_daily_usd": 620000.0, "status": "Operational"},
    {"id": "prod_3", "label": "Product", "name": "Bourbon Vanilla Bean Organic Ice Cream", "category": "Frozen Gourmet Dairy", "revenue_impact_daily_usd": 410000.0, "status": "Operational"},

    # Tier 1 Prepared Food Bases & Blends
    {"id": "comp_t1_1", "label": "Component", "name": "Conched 72% Dark Chocolate Liquor Blend", "type": "Chocolate Base", "lead_time_days": 30, "unit_cost_usd": 420.0},
    {"id": "comp_t1_2", "label": "Component", "name": "Micro-Lot Roasted Arabica Coffee Concentrate", "type": "Coffee Concentrate", "lead_time_days": 20, "unit_cost_usd": 280.0},
    {"id": "comp_t1_3", "label": "Component", "name": "Pasteurized Organic Custard Cream Base", "type": "Dairy Base", "lead_time_days": 15, "unit_cost_usd": 190.0},
    {"id": "comp_t1_4", "label": "Component", "name": "Foil-Sealed Eco-Packaging & Glass Jars", "type": "Sustainable Packaging", "lead_time_days": 25, "unit_cost_usd": 65.0},

    # Tier 2 Processed Ingredients & Flavorings
    {"id": "comp_t2_1", "label": "Component", "name": "Pure Fermented Cocoa Butter & Cocoa Solids", "type": "Refined Cacao", "lead_time_days": 45, "unit_cost_usd": 85.0},
    {"id": "comp_t2_2", "label": "Component", "name": "Pure Bourbon Vanilla Extract", "type": "Natural Flavoring", "lead_time_days": 75, "unit_cost_usd": 320.0},
    {"id": "comp_t2_3", "label": "Component", "name": "Refined Organic Cane Sugar Crystals", "type": "Sweetener", "lead_time_days": 25, "unit_cost_usd": 35.0},
    {"id": "comp_t2_4", "label": "Component", "name": "Washed High-Altitude Arabica Green Coffee Beans", "type": "Specialty Green Beans", "lead_time_days": 40, "unit_cost_usd": 110.0},
    {"id": "comp_t2_5", "label": "Component", "name": "Organic Grass-Fed Whole Milk Powder", "type": "Dairy Solids", "lead_time_days": 20, "unit_cost_usd": 48.0},

    # Tier 3 Agricultural Raw Crops & Harvested Pods
    {"id": "comp_t3_1", "label": "Component", "name": "Harvested Raw Cocoa Pods", "type": "Agricultural Crop", "lead_time_days": 35, "unit_cost_usd": 18.0},
    {"id": "comp_t3_2", "label": "Component", "name": "Raw Green Bourbon Vanilla Pods", "type": "Specialty Crop", "lead_time_days": 90, "unit_cost_usd": 140.0},
    {"id": "comp_t3_3", "label": "Component", "name": "Organic Sugar Cane Stalks", "type": "Cane Crop", "lead_time_days": 15, "unit_cost_usd": 12.0},
    {"id": "comp_t3_4", "label": "Component", "name": "Specialty Ripe Coffee Cherries", "type": "Coffee Harvest", "lead_time_days": 20, "unit_cost_usd": 22.0},

    # Suppliers (Tier 1, 2, 3)
    {"id": "sup_1", "label": "Supplier", "name": "Swiss Master Chocolatiers SA", "tier": "Tier 1", "country": "Switzerland", "reliability_score": 0.98, "risk_rating": "Low"},
    {"id": "sup_2", "label": "Supplier", "name": "Nordic Cold Brew Roasters", "tier": "Tier 1", "country": "Sweden", "reliability_score": 0.96, "risk_rating": "Low"},
    {"id": "sup_3", "label": "Supplier", "name": "Alpine Organic Creameries", "tier": "Tier 1", "country": "Austria", "reliability_score": 0.94, "risk_rating": "Low"},
    {"id": "sup_4", "label": "Supplier", "name": "EcoPack Food-Grade Containers", "tier": "Tier 1", "country": "Germany", "reliability_score": 0.95, "risk_rating": "Low"},

    # Tier 2 Suppliers (Madagascar Vanilla is sole-source SPOF!)
    {"id": "sup_6", "label": "Supplier", "name": "Madagascar Vanilla Orchid Estates", "tier": "Tier 2", "country": "Madagascar", "reliability_score": 0.92, "risk_rating": "High"},
    {"id": "sup_8", "label": "Supplier", "name": "Ghana Cocoa Board (COCOBOD)", "tier": "Tier 2", "country": "Ghana", "reliability_score": 0.94, "risk_rating": "Medium"},
    {"id": "sup_alt_2", "label": "Supplier", "name": "Ecuador Hacienda Arriba Cacao", "tier": "Tier 2", "country": "Ecuador", "reliability_score": 0.89, "risk_rating": "Low"},
    {"id": "sup_9", "label": "Supplier", "name": "Yirgacheffe Coffee Farmers Coop", "tier": "Tier 2", "country": "Ethiopia", "reliability_score": 0.91, "risk_rating": "Medium"},
    {"id": "sup_alt_1", "label": "Supplier", "name": "Huila Colombian Coffee Growers", "tier": "Tier 2", "country": "Colombia", "reliability_score": 0.93, "risk_rating": "Low"},
    {"id": "sup_11", "label": "Supplier", "name": "Sao Paulo Organic Sugar Refineries", "tier": "Tier 2", "country": "Brazil", "reliability_score": 0.95, "risk_rating": "Low"},
    {"id": "sup_alt_3", "label": "Supplier", "name": "Veracruz Fair Trade Sugar Mills", "tier": "Tier 2", "country": "Mexico", "reliability_score": 0.88, "risk_rating": "Low"},

    # Tier 3 Suppliers
    {"id": "sup_13", "label": "Supplier", "name": "Ashanti Regional Cacao Growers", "tier": "Tier 3", "country": "Ghana", "reliability_score": 0.92, "risk_rating": "Low"},
    {"id": "sup_alt_4", "label": "Supplier", "name": "Ivory Coast Smallholders Federation", "tier": "Tier 3", "country": "Ivory Coast", "reliability_score": 0.86, "risk_rating": "Medium"},
    {"id": "sup_15", "label": "Supplier", "name": "Sava Valley Vanilla Planters", "tier": "Tier 3", "country": "Madagascar", "reliability_score": 0.90, "risk_rating": "High"},
    {"id": "sup_16", "label": "Supplier", "name": "Sidama Highland Coffee Pickers", "tier": "Tier 3", "country": "Ethiopia", "reliability_score": 0.93, "risk_rating": "Low"},
    {"id": "sup_17", "label": "Supplier", "name": "Paulista Cane Plantation Collective", "tier": "Tier 3", "country": "Brazil", "reliability_score": 0.96, "risk_rating": "Low"},
    {"id": "sup_alt_5", "label": "Supplier", "name": "Valle del Cauca Cane Growers", "tier": "Tier 3", "country": "Colombia", "reliability_score": 0.90, "risk_rating": "Low"},

    # Facilities & Processing Plants
    {"id": "fac_1", "label": "Facility", "name": "Zurich Chocolate Conching Works", "type": "Chocolate Conching Plant", "country": "Switzerland", "status": "Operational"},
    {"id": "fac_2", "label": "Facility", "name": "Antwerp Cocoa Butter Pressing Mill", "type": "Cacao Processing Mill", "country": "Belgium", "status": "Operational"},
    {"id": "fac_3", "label": "Facility", "name": "Sambava Vanilla Sun-Curing Sheds", "type": "Vanilla Curing Facility", "country": "Madagascar", "status": "Operational"},
    {"id": "fac_4", "label": "Facility", "name": "Rotterdam Central Roasting & Packaging Center", "type": "Food Packaging Hub", "country": "Netherlands", "status": "Operational"},

    # Logistics Hubs & Seaports
    {"id": "port_1", "label": "LogisticsHub", "name": "Port of Tema", "type": "Cacao Export Port", "country": "Ghana"},
    {"id": "port_2", "label": "LogisticsHub", "name": "Port of Toamasina", "type": "Spice Export Port", "country": "Madagascar"},
    {"id": "port_3", "label": "LogisticsHub", "name": "Port of Rotterdam", "type": "Central European Gateway", "country": "Netherlands"},
    {"id": "port_4", "label": "LogisticsHub", "name": "Port of Santos", "type": "Coffee & Sugar Export Port", "country": "Brazil"},

    # Regions
    {"id": "reg_1", "label": "Region", "name": "Sub-Saharan Africa (Ghana/Madagascar/Ethiopia)", "geopolitical_risk_score": 0.55, "climate_risk_score": 0.65},
    {"id": "reg_2", "label": "Region", "name": "Western Europe (Switzerland/Netherlands/Belgium)", "geopolitical_risk_score": 0.15, "climate_risk_score": 0.20},
    {"id": "reg_3", "label": "Region", "name": "Latin America (Brazil/Colombia/Ecuador)", "geopolitical_risk_score": 0.35, "climate_risk_score": 0.45}
]

MOCK_LINKS = [
    # Product BOM Hierarchy (comp_t1 -> Product)
    {"source": "comp_t1_1", "target": "prod_1", "type": "PART_OF", "quantity_required": 1, "is_critical": True},
    {"source": "comp_t1_4", "target": "prod_1", "type": "PART_OF", "quantity_required": 1, "is_critical": True},

    {"source": "comp_t1_2", "target": "prod_2", "type": "PART_OF", "quantity_required": 1, "is_critical": True},
    {"source": "comp_t1_4", "target": "prod_2", "type": "PART_OF", "quantity_required": 1, "is_critical": True},

    {"source": "comp_t1_3", "target": "prod_3", "type": "PART_OF", "quantity_required": 1, "is_critical": True},
    {"source": "comp_t1_4", "target": "prod_3", "type": "PART_OF", "quantity_required": 1, "is_critical": True},

    # Intermediate Component -> Tier 1 Sub-assembly (comp_t2 -> comp_t1)
    # Chocolate Base requires Cocoa Butter + Sugar + Vanilla
    {"source": "comp_t2_1", "target": "comp_t1_1", "type": "PART_OF", "quantity_required": 72, "is_critical": True},
    {"source": "comp_t2_3", "target": "comp_t1_1", "type": "PART_OF", "quantity_required": 28, "is_critical": True},
    {"source": "comp_t2_2", "target": "comp_t1_1", "type": "PART_OF", "quantity_required": 1, "is_critical": True},

    # Coffee Concentrate requires Arabica Green Beans
    {"source": "comp_t2_4", "target": "comp_t1_2", "type": "PART_OF", "quantity_required": 10, "is_critical": True},

    # Custard Base requires Vanilla + Milk Powder + Sugar
    {"source": "comp_t2_2", "target": "comp_t1_3", "type": "PART_OF", "quantity_required": 2, "is_critical": True},
    {"source": "comp_t2_5", "target": "comp_t1_3", "type": "PART_OF", "quantity_required": 50, "is_critical": True},
    {"source": "comp_t2_3", "target": "comp_t1_3", "type": "PART_OF", "quantity_required": 15, "is_critical": True},

    # Sub-component / Farm Crop -> Processed Intermediate (comp_t3 -> comp_t2)
    {"source": "comp_t3_1", "target": "comp_t2_1", "type": "PART_OF", "quantity_required": 100, "is_critical": True},
    {"source": "comp_t3_2", "target": "comp_t2_2", "type": "PART_OF", "quantity_required": 50, "is_critical": True},
    {"source": "comp_t3_3", "target": "comp_t2_3", "type": "PART_OF", "quantity_required": 80, "is_critical": True},
    {"source": "comp_t3_4", "target": "comp_t2_4", "type": "PART_OF", "quantity_required": 60, "is_critical": True},

    # Supplier SUPPLIES Relationships (Tier 1)
    {"source": "sup_1", "target": "comp_t1_1", "type": "SUPPLIES", "lead_time_days": 30, "is_primary": True},
    {"source": "sup_2", "target": "comp_t1_2", "type": "SUPPLIES", "lead_time_days": 20, "is_primary": True},
    {"source": "sup_3", "target": "comp_t1_3", "type": "SUPPLIES", "lead_time_days": 15, "is_primary": True},
    {"source": "sup_4", "target": "comp_t1_4", "type": "SUPPLIES", "lead_time_days": 25, "is_primary": True},

    # Supplier SUPPLIES Relationships (Tier 2 - Madagascar Vanilla sup_6 is sole-source SPOF!)
    {"source": "sup_6", "target": "comp_t2_2", "type": "SUPPLIES", "lead_time_days": 75, "is_primary": True},

    {"source": "sup_8", "target": "comp_t2_1", "type": "SUPPLIES", "lead_time_days": 45, "is_primary": True},
    {"source": "sup_alt_2", "target": "comp_t2_1", "type": "SUPPLIES", "lead_time_days": 60, "is_primary": False},

    {"source": "sup_9", "target": "comp_t2_4", "type": "SUPPLIES", "lead_time_days": 40, "is_primary": True},
    {"source": "sup_alt_1", "target": "comp_t2_4", "type": "SUPPLIES", "lead_time_days": 50, "is_primary": False},

    {"source": "sup_11", "target": "comp_t2_3", "type": "SUPPLIES", "lead_time_days": 25, "is_primary": True},
    {"source": "sup_alt_3", "target": "comp_t2_3", "type": "SUPPLIES", "lead_time_days": 35, "is_primary": False},

    # Supplier SUPPLIES Relationships (Tier 3)
    {"source": "sup_13", "target": "comp_t3_1", "type": "SUPPLIES", "lead_time_days": 35, "is_primary": True},
    {"source": "sup_alt_4", "target": "comp_t3_1", "type": "SUPPLIES", "lead_time_days": 45, "is_primary": False},

    {"source": "sup_15", "target": "comp_t3_2", "type": "SUPPLIES", "lead_time_days": 90, "is_primary": True},
    {"source": "sup_16", "target": "comp_t3_4", "type": "SUPPLIES", "lead_time_days": 20, "is_primary": True},

    {"source": "sup_17", "target": "comp_t3_3", "type": "SUPPLIES", "lead_time_days": 15, "is_primary": True},
    {"source": "sup_alt_5", "target": "comp_t3_3", "type": "SUPPLIES", "lead_time_days": 25, "is_primary": False},

    # Manufacturing, Geography & Freight Routes
    {"source": "comp_t2_1", "target": "fac_2", "type": "MANUFACTURED_AT"},
    {"source": "fac_2", "target": "reg_2", "type": "LOCATED_IN"},
    {"source": "fac_2", "target": "port_3", "type": "SHIPS_VIA", "transit_days": 1},

    {"source": "comp_t2_2", "target": "fac_3", "type": "MANUFACTURED_AT"},
    {"source": "fac_3", "target": "reg_1", "type": "LOCATED_IN"},
    {"source": "fac_3", "target": "port_2", "type": "SHIPS_VIA", "transit_days": 3},

    {"source": "comp_t1_1", "target": "fac_1", "type": "MANUFACTURED_AT"},
    {"source": "fac_1", "target": "reg_2", "type": "LOCATED_IN"},

    {"source": "comp_t1_4", "target": "fac_4", "type": "MANUFACTURED_AT"},
    {"source": "fac_4", "target": "reg_2", "type": "LOCATED_IN"},
    {"source": "fac_4", "target": "port_3", "type": "SHIPS_VIA", "transit_days": 1},

    # Regional Geographies (Ports & Suppliers LOCATED_IN Regions)
    {"source": "port_4", "target": "reg_3", "type": "LOCATED_IN"},
    {"source": "sup_11", "target": "reg_3", "type": "LOCATED_IN"},
    {"source": "sup_17", "target": "reg_3", "type": "LOCATED_IN"},
    {"source": "sup_alt_1", "target": "reg_3", "type": "LOCATED_IN"},
    {"source": "sup_alt_2", "target": "reg_3", "type": "LOCATED_IN"},

    {"source": "port_1", "target": "reg_1", "type": "LOCATED_IN"},
    {"source": "port_2", "target": "reg_1", "type": "LOCATED_IN"},
    {"source": "sup_6", "target": "reg_1", "type": "LOCATED_IN"},
    {"source": "sup_8", "target": "reg_1", "type": "LOCATED_IN"},
    {"source": "sup_9", "target": "reg_1", "type": "LOCATED_IN"},

    {"source": "port_3", "target": "reg_2", "type": "LOCATED_IN"},
    {"source": "sup_1", "target": "reg_2", "type": "LOCATED_IN"},
    {"source": "sup_3", "target": "reg_2", "type": "LOCATED_IN"},

    # Shipping Routes
    {"source": "port_1", "target": "port_3", "type": "ROUTES_TO", "transit_days": 12},
    {"source": "port_2", "target": "port_3", "type": "ROUTES_TO", "transit_days": 18},
    {"source": "port_4", "target": "port_3", "type": "ROUTES_TO", "transit_days": 14}
]
