import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW } from '../utils';

const Shipments = ({ toggleMenu, onLogout }) => {
  const { data, addShipment, updateShipment, deleteShipment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const activeShipments = data.shipments.filter(s => s.status !== 'Delivered').length;

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Shipments</h1>
            <div className="page-sub">Weekly shipments going to Pakistan</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ New Shipment</button>
          <button className="btn btn-danger" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">TOTAL SHIPMENTS</div>
          <div className="kpi-value">{data.shipments.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">IN PROGRESS</div>
          <div className="kpi-value brand">{data.shipments.filter(s => s.status !== 'Delivered').length}</div>
          <div className="kpi-sub">Preparing / Shipped / In Transit</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">DELIVERED</div>
          <div className="kpi-value pos">{data.shipments.filter(s => s.status === 'Delivered').length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL SHIPPING COST</div>
          <div className="kpi-value neg">₩0</div>
          <div className="kpi-sub">Logged as expenses</div>
        </div>
      </div>

      <div className="card" style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {data.shipments.length === 0 ? (
          <div className="muted">No shipments yet. Click "+ New Shipment" to add your first one.</div>
        ) : (
          <div className="inv-grid" style={{ width: '100%' }}>
            {data.shipments.map(s => (
              <div key={s._id} className="inv-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0 }}>#{s.id} · <span className="muted">{s.courier || 'Global'}</span></h4>
                  <span className={`badge badge-${s.status==='Delivered'?'green':s.status==='In Transit'?'amber':'brand'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="inv-meta" style={{ marginTop: '4px' }}>Sent on {s.sentDate || '—'}</div>
                
                <div style={{ marginTop: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="muted">Tracking:</span>
                    <strong>{s.trackingNum || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Target:</span>
                    <strong>{s.destination || 'Pakistan'}</strong>
                  </div>
                </div>

                <div className="actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm" onClick={() => { setEditingItem(s); setShowModal(true); }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteShipment(s._id)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ShipmentModal 
          shipment={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateShipment(editingItem._id, obj);
            else await addShipment(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const ShipmentModal = ({ shipment, onClose, onSave }) => {
  const [form, setForm] = useState(shipment || { 
    id: Math.random().toString(36).slice(2,7).toUpperCase(), 
    courier: '', 
    trackingNum: '', 
    status: 'Scheduled', 
    sentDate: new Date().toISOString().slice(0,10), 
    destination: 'Pakistan', 
    notes: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{shipment ? 'Edit' : 'Create'} Shipment</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Shipment ID</label><input value={form.id} disabled /></div>
          <div className="form-row"><label>Status</label>
            <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
              <option>Scheduled</option>
              <option>In Transit</option>
              <option>Arrived at Port</option>
              <option>Customs Clearance</option>
              <option>Delivered</option>
            </select>
          </div>
        </div>
        <div className="form-row"><label>Courier / Method</label><input value={form.courier} onChange={e=>setForm({...form, courier:e.target.value})} /></div>
        <div className="form-row"><label>Tracking Number</label><input value={form.trackingNum} onChange={e=>setForm({...form, trackingNum:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Sent Date</label><input type="date" value={form.sentDate} onChange={e=>setForm({...form, sentDate:e.target.value})} /></div>
          <div className="form-row"><label>Destination</label><input value={form.destination} onChange={e=>setForm({...form, destination:e.target.value})} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Shipment</button>
        </div>
      </div>
    </div>
  );
};

export default Shipments;
