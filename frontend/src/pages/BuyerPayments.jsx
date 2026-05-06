import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum } from '../utils';

const BuyerPayments = ({ toggleMenu, onLogout }) => {
  const { data, addBuyerPayment, updateBuyerPayment, deleteBuyerPayment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const payments = data.buyerPayments || [];
  
  // Filter by date AND search
  const dateFiltered = payments.filter(p => {
    const d = p.date || '';
    return d >= fromDate && d <= toDate;
  });

  const filtered = dateFiltered.filter(p => 
    p.buyer.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = dateFiltered.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Group by buyer for the "who gave how much" report
  const buyerSummary = dateFiltered.reduce((acc, p) => {
    acc[p.buyer] = (acc[p.buyer] || 0) + (p.amount || 0);
    return acc;
  }, {});

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>
             <span className="muted">From:</span>
             <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: '12px' }} />
             <span className="muted">To:</span>
             <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: '12px' }} />
             <button onClick={() => {
                setFromDate('2000-01-01');
                setToDate(new Date().toISOString().slice(0, 10));
             }} style={{ color: 'var(--brand)', fontWeight: '600', marginLeft: '5px', padding: '2px 5px' }}>Reset</button>
          </div>
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
          <div className="kpi-label">PERIOD PAYMENTS</div>
          <div className="kpi-value">{dateFiltered.length}</div>
          <div className="kpi-sub">Records in selected range</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL RECEIVED</div>
          <div className="kpi-value pos">{fmtKRW(totalReceived)}</div>
          <div className="kpi-sub">Total for selected period</div>
        </div>
        <div className="kpi" style={{ flex: 2 }}>
           <div className="kpi-label">SEARCH RESULTS</div>
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

      <div className="chart-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><h3 className="card-title">Buyer Summary (Period Report)</h3></div>
          <div className="table-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Buyer Name</th>
                  <th className="num">Total Contributed (KRW)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(buyerSummary).length === 0 ? (
                  <tr><td colSpan="2" className="muted" style={{ textAlign: 'center', padding: '10px' }}>No data for this range</td></tr>
                ) : (
                  Object.entries(buyerSummary).sort((a,b) => b[1] - a[1]).map(([name, total]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td className="num pos"><strong>{fmtKRW(total)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
