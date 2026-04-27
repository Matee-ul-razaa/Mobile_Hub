import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW } from '../utils';

const Shipments = ({ toggleMenu }) => {
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
            <div className="page-sub">International logistics tracking</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Create Shipment</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Active Shipments</div>
          <div className="kpi-value brand">{activeShipments}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Outbound</div>
          <div className="kpi-value">{data.shipments.length}</div>
        </div>
      </div>

      <div className="inv-grid">
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

            <div className="actions">
              <button className="btn btn-sm" onClick={() => { setEditingItem(s); setShowModal(true); }}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => deleteShipment(s._id)}>Del</button>
            </div>
          </div>
        ))}
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
