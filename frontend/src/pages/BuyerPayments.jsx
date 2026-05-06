import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum } from '../utils';

const BuyerPayments = ({ toggleMenu, onLogout }) => {
  const { data, addBuyerPayment, updateBuyerPayment, deleteBuyerPayment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');

  const payments = data.buyerPayments || [];
  const filtered = payments.filter(p => 
    p.buyer.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Cash Received From Buyers</h1>
            <div className="page-sub">Independent tracking of buyer payments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Record Payment</button>
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
          <div className="kpi-label">TOTAL PAYMENTS</div>
          <div className="kpi-value">{payments.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL CASH RECEIVED</div>
          <div className="kpi-value pos">{fmtKRW(totalReceived)}</div>
          <div className="kpi-sub">Total amount from all recorded buyers</div>
        </div>
        <div className="kpi" style={{ flex: 2 }}>
           <div className="kpi-label">SEARCH BUYERS</div>
           <input 
            type="text" 
            placeholder="Search by buyer name or reference..." 
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', marginTop: '8px' }}
           />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Buyer Name</th>
                <th className="num">Amount (KRW)</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No payment records found.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id}>
                    <td>{p.date}</td>
                    <td><strong>{p.buyer}</strong></td>
                    <td className="num pos"><strong>{fmtKRW(p.amount)}</strong></td>
                    <td><span className="badge">{p.method}</span></td>
                    <td><code style={{ fontSize: '12px' }}>{p.reference || '—'}</code></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.notes}>
                      {p.notes || '—'}
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingItem(p); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteBuyerPayment(p._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PaymentModal 
          item={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateBuyerPayment(editingItem._id, obj);
            else await addBuyerPayment(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const PaymentModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || { 
    date: new Date().toISOString().slice(0,10), 
    buyer: '', 
    amount: 0, 
    method: 'Bank Transfer', 
    reference: '', 
    notes: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Record'} Buyer Payment</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row"><label>Buyer Name *</label><input value={form.buyer} onChange={e=>setForm({...form, buyer:e.target.value})} placeholder="e.g. Ahmed Ali" /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
          <div className="form-row">
            <label>Payment Method</label>
            <select value={form.method} onChange={e=>setForm({...form, method:e.target.value})}>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Hand to Hand</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="form-row"><label>Reference / Transaction ID</label><input value={form.reference} onChange={e=>setForm({...form, reference:e.target.value})} placeholder="e.g. Bank Ref #12345" /></div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder="Extra details..." /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Record</button>
        </div>
      </div>
    </div>
  );
};

export default BuyerPayments;
