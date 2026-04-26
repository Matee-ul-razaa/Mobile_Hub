import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const MyInvestment = () => {
  const { data, addOwnerInvestment, updateOwnerInvestment, deleteOwnerInvestment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Personal Capital (Owner)</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add My Investment</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">My Total Investment (KR)</div>
          <div className="kpi-value purple">{fmtKRW(a.ownerCapital)}</div>
          <div className="kpi-sub">Personal money in the business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">My Total Investment (PK)</div>
          <div className="kpi-value">₨{fmtNum(a.ownerCapitalPKR)}</div>
          <div className="kpi-sub">Total sent from Pakistan</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Your Share of Capital</div>
          <div className="kpi-value">{a.totalCapitalPool ? ((a.ownerCapital/a.totalCapitalPool)*100).toFixed(1) : '0'}%</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6' }}>
          <strong>What goes here:</strong> Any money you personally put into the business—reinvested profit, 
          bank loans, or personal savings. This counts toward your <strong>Total Capital Pool</strong> but does 
          not have monthly payouts.
        </p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th className="num">PKR Amount</th>
                <th className="num">KRW Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.ownerInvestments].reverse().map(o => (
                <tr key={o._id}>
                  <td>{o.date}</td>
                  <td><strong>{o.source}</strong></td>
                  <td className="num">₨{fmtNum(o.amountPKR)}</td>
                  <td className="num text-green"><strong>+{fmtKRW(o.amountKRW)}</strong></td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => { setEditingItem(o); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteOwnerInvestment(o._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <OwnerModal 
          item={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateOwnerInvestment(editingItem._id, obj);
            else await addOwnerInvestment(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const OwnerModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || { date: new Date().toISOString().slice(0,10), amountPKR: 0, amountKRW: 0, source: 'Personal savings', note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{item ? 'Edit' : 'Add'} My Investment</h3>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row">
          <label>Source</label>
          <select value={form.source} onChange={e=>setForm({...form, source:e.target.value})}>
            <option>Personal savings</option>
            <option>Bank loan</option>
            <option>Reinvested profit</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amountKRW} onChange={e=>setForm({...form, amountKRW:Number(e.target.value)})} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Investment</button>
        </div>
      </div>
    </div>
  );
};

export default MyInvestment;
