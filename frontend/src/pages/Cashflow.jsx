import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const Cashflow = ({ toggleMenu, onLogout }) => {
  const { data, addCashflow, deleteCashflow } = useData();
  const [showModal, setShowModal] = useState(false);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Cash In / Out</h1>
            <div className="page-sub">Complete money movement record</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Entry</button>
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
          <div className="kpi-label">TOTAL CASH IN</div>
          <div className="kpi-value pos">{fmtKRW(a.totalCashIn)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL CASH OUT</div>
          <div className="kpi-value neg">{fmtKRW(a.totalCashOut)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">NET</div>
          <div className="kpi-value brand">{fmtKRW(a.cashInHand)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Cash Movement</h3>
          <div className="muted" style={{ fontSize: '11px' }}>Includes manual entries, Fazi Cash, expenses, payouts</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>TYPE</th>
                <th>SOURCE / DETAIL</th>
                <th>ORIGIN</th>
                <th>NOTE</th>
                <th className="num">AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {[...data.cashflow].reverse().map(c => (
                <tr key={c._id}>
                  <td>{c.date}</td>
                  <td>
                    <span className={`badge badge-${c.type === 'in' ? 'green' : 'red'}`} style={{ fontSize: '9px', padding: '2px 4px' }}>
                      {c.type === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td>{c.source || '—'}</td>
                  <td><span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: '10px' }}>{c.origin || 'Manual'}</span></td>
                  <td>{c.note}</td>
                  <td className={`num ${c.type === 'in' ? 'pos' : 'neg'}`}>
                    <strong>{c.type === 'in' ? '+' : '−'}{fmtKRW(c.amount)}</strong>
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCashflow(c._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CashflowModal 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addCashflow(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const CashflowModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: 'in', source: '', amount: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">New Won Transaction</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row">
            <label>Type</label>
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="in">Cash In (+)</option>
              <option value="out">Cash Out (−)</option>
            </select>
          </div>
        </div>
        <div className="form-row"><label>Source / Detail *</label><input value={form.source} onChange={e=>setForm({...form, source:e.target.value})} placeholder="e.g. Sale payment, Shop rent, etc." /></div>
        <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Record Cash</button>
        </div>
      </div>
    </div>
  );
};

export default Cashflow;
