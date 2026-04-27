import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const MyInvestment = ({ toggleMenu }) => {
  const { data, addOwnerInvestment, deleteOwnerInvestment } = useData();
  const [showModal, setShowModal] = useState(false);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">My Investment</h1>
            <div className="page-sub">Personal capital and reinvestments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add My Capital</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">My Total (Won)</div>
          <div className="kpi-value brand">{fmtKRW(a.ownerCapital)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">My Total (PKR)</div>
          <div className="kpi-value brand">₨{fmtNum(a.ownerCapitalPKR)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Amount (Won)</th>
                <th className="num">Ref (PKR)</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.ownerInvestments].reverse().map(inv => (
                <tr key={inv._id}>
                  <td>{inv.date}</td>
                  <td className="num pos"><strong>+{fmtKRW(inv.amountKRW)}</strong></td>
                  <td className="num">₨{fmtNum(inv.amountPKR)}</td>
                  <td>{inv.note}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteOwnerInvestment(inv._id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <OwnerModal 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addOwnerInvestment(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const OwnerModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), amountKRW: 0, amountPKR: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">Add Owner Capital</h3></div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (Won) *</label><input type="number" value={form.amountKRW} onChange={e=>setForm({...form, amountKRW:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Ref (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Investment</button>
        </div>
      </div>
    </div>
  );
};

export default MyInvestment;
