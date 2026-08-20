import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

const CYPHER_EXPLAINERS = [
  {
    id: 'blast_radius',
    title: 'Disruption Blast Radius (Multi-Hop)',
    cypher: `// Multi-hop path traversal (1..6 hops) from disrupted node to finished products
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
       [n IN nodes(path) | n.id] AS path_node_ids`,
    whyGraph: 'In SQL, traversing arbitrary supply chain depths requires complex recursive CTEs (WITH RECURSIVE) and multiple self-joins. In openCypher, physical pointer-chasing along the graph network handles arbitrary-depth reachability in a single declaration.'
  },
  {
    id: 'spof',
    title: 'Single Point of Failure (SPOF)',
    cypher: `// Identifies components where count(DISTINCT supplier) = 1 across all product lines
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
ORDER BY product_count DESC, c.lead_time_days DESC`,
    whyGraph: 'Relational schemas separate parts, supplier contracts, and sub-assemblies across 4-5 tables. Cypher computes graph degree centrality and sole-source constraints across recursive sub-trees natively.'
  },
  {
    id: 'alternate',
    title: 'Alternate Supplier Sourcing',
    cypher: `// Queries qualified alternate suppliers excluding the disrupted partner
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
ORDER BY r.lead_time_days ASC, alt.reliability_score DESC`,
    whyGraph: 'Evaluates graph edge properties (lead times, reliability ratings, contract status) in real time to recommend immediate supplier rerouting.'
  },
  {
    id: 'bom',
    title: 'Multi-Tier Bill of Materials',
    cypher: `// Traverses product assemblies down to raw mineral level
MATCH path = (p:Product {id: $product_id})<-[:PART_OF*1..5]-(c:Component)
OPTIONAL MATCH (s:Supplier)-[:SUPPLIES]->(c)
RETURN c.id AS component_id,
       c.name AS component_name,
       c.type AS component_type,
       c.lead_time_days AS lead_time_days,
       c.unit_cost_usd AS unit_cost_usd,
       length(path) AS depth,
       collect(DISTINCT s.name) AS suppliers
ORDER BY depth ASC, c.name ASC`,
    whyGraph: 'Bill of Materials trees are naturally directed acyclic graphs (DAGs). Cypher traverses all sub-assembly levels without rigid schema redesign.'
  }
];

export default function CypherModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState(CYPHER_EXPLAINERS[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const current = CYPHER_EXPLAINERS.find(q => q.id === activeTab) || CYPHER_EXPLAINERS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.cypher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={15} style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>openCypher Query Console</span>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Segmented Selector */}
          <div className="segmented-control">
            {CYPHER_EXPLAINERS.map(q => (
              <button
                key={q.id}
                className={`segmented-button ${activeTab === q.id ? 'active' : ''}`}
                onClick={() => setActiveTab(q.id)}
              >
                {q.title}
              </button>
            ))}
          </div>

          {/* Architecture Rationale */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
              Why Graph over Relational (SQL)?
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {current.whyGraph}
            </p>
          </div>

          {/* Code Viewer */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-sm"
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                fontSize: '0.68rem',
                padding: '2px 6px'
              }}
            >
              {copied ? <Check size={11} style={{ color: 'var(--accent-green)' }} /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <pre className="code-box" style={{ margin: 0 }}>
              <code>{current.cypher}</code>
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
