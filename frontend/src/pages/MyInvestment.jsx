import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const MyInvestment = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const a = agg(data);

  const handleEdit = (inv) => {
    setEditData(inv || { date: todayISO(), amountKRW: 0, amountPKR: 0, source: 'Personal savings', note: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/owner-investment/${editData._id}`, editData);
      else await poster('/owner-investment', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete investment entry?')) return;
    try {
      await deleter(`/owner-investment/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">My Total Investment</div><div className="kpi-value purple">{fmtKRW(a.ownerCapital)}</div><div className="kpi-sub">₨{fmtNum(a.ownerCapitalPKR)} PKR total</div></div>
        <div className="kpi"><div className="kpi-label">Investment Entries</div><div className="kpi-value">{data.ownerInvestment.length}</div><div className="kpi-sub">Times you added money</div></div>
        <div className="kpi"><div className="kpi-label">My Share of Pool</div><div className="kpi-value">{(a.ownerCapital / a.totalCapitalPool * 100).toFixed(1)}%</div><div className="kpi-sub">of total working capital</div></div>
      </div>

      <div style={{ marginBottom:'16px' }}><button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add My Investment</button></div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Source</th><th className="num">PKR Amount</th><th className="num">KRW Amount</th><th>Note</th><th></th></tr>
            </thead>
            <tbody>
              {data.ownerInvestment.map(o => (
                <tr key={o._id}>
                  <td>{o.date}</td>
                  <td><strong>{o.source}</strong></td>
                  <td className="num">₨{fmtNum(o.amountPKR)}</td>
                  <td className="num text-green font-bold">{fmtKRW(o.amountKRW)}</td>
                  <td><div className="muted" style={{fontSize:'11px'}}>{o.note}</div></td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => handleEdit(o)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Add'} My Investment</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date *</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Source</label>
                 <select value={editData.source} onChange={e=>setEditData({...editData, source:e.target.value})}>
                   <option>Personal savings</option>
                   <option>Bank loan</option>
                   <option>Family / friend loan</option>
                   <option>Reinvested profit</option>
                   <option>Other</option>
                 </select>
              </div>
            </div>
            <div style={{ background:'var(--surface-2)', padding:'12px', borderRadius:'8px', marginBottom:'12px' }}>
              <div className="form-row-2">
                <div className="form-row"><label>Amount Paid in PK (PKR)</label><input type="number" value={editData.amountPKR} onChange={e=>setEditData({...editData, amountPKR:Number(e.target.value)})} /></div>
                <div className="form-row"><label>Amount Received in Korea (KRW) *</label><input type="number" value={editData.amountKRW} onChange={e=>setEditData({...editData, amountKRW:Number(e.target.value)})} /></div>
              </div>
            </div>
            <div className="form-row"><label>Notes</label><textarea value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} /></div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default MyInvestment;
