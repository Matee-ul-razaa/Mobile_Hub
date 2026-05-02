import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Sales = ({ toggleMenu, onLogout }) => {
  const { data, addSale, updateSale, deleteSale, showToast } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  const a = agg(data);

  const handleExport = () => {
    const rows = data.sales.map(s => ({
      Date: s.date,
      Buyer: s.buyer,
      Model: s.modelName,
      Storage: s.storage || '',
      Color: s.color || '',
      IMEI: s.imei1 || '',
      Qty: s.qty,
      Price: s.pricePerUnit,
      Total: s.qty * s.pricePerUnit,
      Received: s.received || 0,
      Pending: (s.qty * s.pricePerUnit) - (s.received || 0),
      Notes: s.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Sales</h1>
            <div className="page-sub">Orders sent to Pakistan buyers</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
          <button className="btn btn-primary" onClick={() => { setEditingSale(null); setShowModal(true); }}>+ New Sale</button>
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
          <div className="kpi-label">TOTAL REVENUE</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">COST OF GOODS</div>
          <div className="kpi-value">{fmtKRW(a.salesCOGS)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">GROSS PROFIT</div>
          <div className="kpi-value pos">{fmtKRW(a.grossProfit)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">PENDING RECEIVABLE</div>
          <div className="kpi-value neg">{fmtKRW(a.pendingReceivable)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>BUYER</th>
                <th>MODEL</th>
                <th>DETAILS</th>
                <th className="num">QTY</th>
                <th className="num">PRICE/UNIT</th>
                <th className="num">TOTAL</th>
                <th className="num">RECEIVED</th>
                <th className="num">PENDING</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(data.sales || []).map(s => {
                const total = s.qty * s.pricePerUnit;
                const pending = total - (s.received || 0);
                const status = pending <= 0 ? 'Paid' : (s.received > 0 ? 'Partial' : 'Pending');
                return (
                  <tr key={s._id}>
                    <td>{s.date}</td>
                    <td><strong>{s.buyer}</strong></td>
                    <td>{s.modelName || s.model}</td>
                    <td>
                      <div className="muted" style={{ fontSize: '11px' }}>
                        {[s.storage && `${s.storage}GB`, s.color, s.imei1].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td className="num">{s.qty}</td>
                    <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                    <td className="num"><strong>{fmtKRW(total)}</strong></td>
                    <td className="num">{fmtKRW(s.received || 0)}</td>
                    <td className="num neg">{fmtKRW(pending)}</td>
                    <td>
                      <span className={`badge badge-${status === 'Paid' ? 'green' : (status === 'Partial' ? 'amber' : 'red')}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingSale(s); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteSale(s._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(data.sales || []).length === 0 && <tr><td colSpan="11" className="empty">No sales yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SaleModal
          sale={editingSale}
          inventory={(data.inventory || []).filter(i => i.status === 'In Stock')}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingSale) await updateSale(editingSale._id, obj);
            else await addSale(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const SaleModal = ({ sale, inventory, onClose, onSave }) => {
  const [form, setForm] = useState(sale || {
    date: new Date().toISOString().slice(0, 10),
    buyer: '',
    inventoryId: '',
    modelName: '',
    storage: '',
    color: '',
    imei1: '',
    qty: 1,
    pricePerUnit: 0,
    received: 0,
    notes: ''
  });

  const handleInventorySelect = (invId) => {
    if (!invId) {
      setForm({ ...form, inventoryId: '', modelName: '', storage: '', color: '', imei1: '' });
      return;
    }
    const item = inventory.find(i => i._id === invId);
    if (item) {
      setForm({
        ...form,
        inventoryId: invId,
        modelName: item.modelName,
        storage: item.storage || '',
        color: item.color || '',
        imei1: item.imei1 || '',
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{sale ? 'Edit' : 'New'} Sale Record</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-row"><label>Buyer *</label><input value={form.buyer} onChange={e => setForm({ ...form, buyer: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <label>Select from Inventory (In Stock)</label>
          <select value={form.inventoryId || ''} onChange={e => handleInventorySelect(e.target.value)}>
            <option value="">— manual entry —</option>
            {inventory.map(i => (
              <option key={i._id} value={i._id}>
                {i.modelName} {i.storage && `${i.storage}GB`} {i.color} {i.imei1 ? `· ${i.imei1.slice(-6)}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Model Name *</label><input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })} /></div>
          <div className="form-row"><label>Storage</label><input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Color</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
          <div className="form-row"><label>IMEI</label><input value={form.imei1} onChange={e => setForm({ ...form, imei1: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div>
          <div className="form-row"><label>Sale Price (KRW)</label><input type="number" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row"><label>Received Amount (KRW)</label><input type="number" value={form.received} onChange={e => setForm({ ...form, received: Number(e.target.value) })} /></div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Sale</button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
