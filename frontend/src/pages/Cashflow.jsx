import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const Cashflow = ({ toggleMenu }) => {
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
            <div className="page-sub">Daily ledger of all Won transactions</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Transaction</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Current Won Balance</div>
          <div className={`kpi-value ${a.cashInHand >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Total physical cash availability</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Note</th>
                <th className="num">Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.cashflow].reverse().map(c => (
                <tr key={c._id}>
                  <td>{c.date}</td>
                  <td>
                    <span className={`badge badge-${c.type === 'in' ? 'green' : 'red'}`}>
                      {c.type === 'in' ? 'CASH IN' : 'CASH OUT'}
                    </span>
                  </td>
                  <td>{c.note}</td>
                  <td className={`num ${c.type === 'in' ? 'pos' : 'neg'}`}>
                    <strong>{c.type === 'in' ? '+' : '−'}{fmtKRW(c.amount)}</strong>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteCashflow(c._id)}>Del</button>
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
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: 'in', amount: 0, note: '' });

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
