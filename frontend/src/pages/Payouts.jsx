import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Payouts = ({ toggleMenu }) => {
  const { data, addPayout, deletePayout } = useData();
  const [showModal, setShowModal] = useState(false);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Investor Payouts</h1>
            <div className="page-sub">Monthly profit distributions</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Payout</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Paid (KRW)</div>
          <div className="kpi-value neg">{fmtKRW(a.totalPaid)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Paid (PKR)</div>
          <div className="kpi-value">₨{fmtNum(a.totalPaidPKR)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Investor</th>
                <th className="num">Amount (KRW)</th>
                <th className="num">Paid in (PKR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.payouts].reverse().map(p => {
                const inv = data.investors.find(i => i._id === p.investorId);
                return (
                  <tr key={p._id}>
                    <td>{p.date}</td>
                    <td><strong>{inv ? inv.name : 'Unknown'}</strong></td>
                    <td className="num neg"><strong>−{fmtKRW(p.amount)}</strong></td>
                    <td className="num">₨{fmtNum(p.amountPKR)}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deletePayout(p._id)}>Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PayoutModal 
          investors={data.investors}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addPayout(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const PayoutModal = ({ investors, onClose, onSave }) => {
  const [form, setForm] = useState({ investorId: '', date: new Date().toISOString().slice(0,10), amount: 0, amountPKR: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">Record Payout</h3></div>
        <div className="form-row">
          <label>Select Investor *</label>
          <select value={form.investorId} onChange={e=>setForm({...form, investorId:e.target.value})}>
            <option value="">— select —</option>
            {investors.map(inv => <option key={inv._id} value={inv._id}>{inv.name}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (Won) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Settle in (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Payout</button>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
