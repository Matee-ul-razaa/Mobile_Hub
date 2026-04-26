import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Payouts = () => {
  const { data, addPayout, updatePayout, deletePayout } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Investor Payouts</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Record Payout</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Paid (PK)</div>
          <div className="kpi-value">₨{fmtNum(a.totalPaidPKR)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Paid (KR)</div>
          <div className="kpi-value neg">{fmtKRW(a.totalPaid)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Payout Entries</div>
          <div className="kpi-value">{data.payouts.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Investor</th>
                <th className="num">PKR Paid</th>
                <th className="num">KRW Leaves Cash</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.payouts].reverse().map(p => {
                const inv = data.investors.find(i => i._id === p.investorId);
                return (
                  <tr key={p._id}>
                    <td>{p.date}</td>
                    <td><strong>{inv?.name || 'Unknown'}</strong></td>
                    <td className="num">₨{fmtNum(p.amountPKR)}</td>
                    <td className="num text-red"><strong>{fmtKRW(p.amount)}</strong></td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingItem(p); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deletePayout(p._id)}>Del</button>
                      </div>
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
          item={editingItem} 
          investors={data.investors}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updatePayout(editingItem._id, obj);
            else await addPayout(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const PayoutModal = ({ item, investors, onClose, onSave }) => {
  const [form, setForm] = useState(item || { 
    date: new Date().toISOString().slice(0,10), 
    investorId: '', 
    amountPKR: 0, 
    amount: 0, 
    note: '' 
  });

  const handleInvChange = (id) => {
    const inv = investors.find(i => i._id === id);
    if (inv) {
      setForm({ ...form, investorId: id, amountPKR: inv.monthlyPayoutPKR, amount: inv.monthlyPayout });
    } else {
      setForm({ ...form, investorId: id });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{item ? 'Edit' : 'Record'} Payout</h3>
        <div className="form-row">
          <label>Investor *</label>
          <select value={form.investorId} onChange={e=>handleInvChange(e.target.value)}>
            <option value="">— select —</option>
            {investors.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Paid in PK (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Leaves KR Cash (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Payout</button>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
