import React from 'react';
import { Search, AlertOctagon } from 'lucide-react';

export default function SPOFRadar({ 
  spofData, 
  onSimulateDisruption, 
  onSelectComponent 
}) {
  if (!spofData || !spofData.critical_items) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        Loading vulnerability analysis...
      </div>
    );
  }

  const { critical_items, total_spofs } = spofData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            SPOF Vulnerability Radar
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Components with zero secondary suppliers
          </div>
        </div>
        <span className="badge badge-critical">
          {total_spofs} Sole-Source
        </span>
      </div>

      {/* SPOF Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {critical_items.map(item => (
          <div
            key={item.component_id}
            className="card-item"
            style={{
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                  {item.component_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Sole Supplier: <span style={{ color: 'var(--text-secondary)' }}>{item.sole_supplier}</span> ({item.supplier_country || 'Global'})
                </div>
              </div>
              <span className={item.risk_level === 'CRITICAL' ? 'badge badge-critical' : 'badge badge-high'}>
                {item.risk_level}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <div>
                Lead Time: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.lead_time_days}d</strong>
              </div>
              <div>
                Impacts: <strong style={{ color: 'var(--text-primary)' }}>{item.product_count} Product{item.product_count > 1 ? 's' : ''}</strong>
              </div>
            </div>

            {/* Affected Product Tags */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {item.affected_products.map((pName, idx) => (
                <span key={idx} className="tag-pill">
                  {pName}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1 }}
                onClick={() => onSelectComponent(item.component_id)}
              >
                <Search size={11} />
                <span>Alternates</span>
              </button>
              <button
                className="btn btn-sm btn-danger"
                style={{ padding: '3px 8px' }}
                onClick={() => onSimulateDisruption([item.supplier_id || item.component_id], `Disrupt ${item.component_name}`)}
                title="Simulate outage"
              >
                <AlertOctagon size={11} />
                <span>Simulate</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
