import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { fetchProducts, fetchProductBOM } from '../services/api';

export default function ProductBOMModal({ isOpen, onClose, selectedProductId }) {
  const [products, setProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(selectedProductId || 'prod_1');
  const [bomData, setBomData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchProducts()
      .then(res => {
        const prods = res.products || [];
        setProducts(prods);
        if (prods.length > 0 && !activeProductId) {
          setActiveProductId(prods[0].id);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeProductId) return;
    setLoading(true);
    fetchProductBOM(activeProductId)
      .then(res => setBomData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, activeProductId]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalCost = bomData?.bom_items?.reduce((acc, item) => acc + (item.unit_cost_usd || 0), 0) || 0;
  const maxLeadTime = bomData?.bom_items?.reduce((max, item) => Math.max(max, item.lead_time_days || 0), 0) || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Bill of Materials (BOM) Tree</span>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Product Selector */}
          <div className="segmented-control">
            {products.map(p => (
              <button
                key={p.id}
                className={`segmented-button ${activeProductId === p.id ? 'active' : ''}`}
                onClick={() => setActiveProductId(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* BOM Summary Bar */}
          <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', border: '1px solid var(--border-hairline)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>COMPONENTS</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {bomData?.total_components || 0}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>TOTAL BUILD COST</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(totalCost)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAX BOTTLENECK LEAD TIME</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {maxLeadTime} days
              </div>
            </div>
          </div>

          {/* BOM Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
              Traversing hierarchy...
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component & Hierarchy</th>
                    <th>Type</th>
                    <th>Depth</th>
                    <th>Lead Time</th>
                    <th>Unit Cost</th>
                    <th>Suppliers</th>
                  </tr>
                </thead>
                <tbody>
                  {bomData?.bom_items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: `${(item.depth - 1) * 14}px` }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {item.depth === 1 ? '●' : '└─'}
                          </span>
                          <span>{item.component_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-component" style={{ fontSize: '0.62rem' }}>
                          {item.component_type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Tier {item.depth}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.lead_time_days}d</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(item.unit_cost_usd)}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {item.suppliers?.join(', ') || 'Internal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
