import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const MyInvestment = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const total = data.ownerInvestment.reduce((a,x) => a + (x.amount||0), 0);
  const sorted = [...data.ownerInvestment].sort((a,b) => b.date.localeCompare(a.date));

  const handleEdit = (it) => {
    setEditData(it || { date:todayISO(), amount:0, source:'Personal Savings', note:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.amount) return alert('Amount required');
    try {
      if (editData._id) {
        await putter(`/owner-investment/${editData._id}`, editData);
      } else {
        await poster('/owner-investment', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this record?')) return;
    try {
      await deleter(`/owner-investment/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">My Total Investment</div>
          <div className="kpi-value purple">{fmtKRW(total)}</div>
          <div className="kpi-sub">Total capital you've put into the business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Records</div>
          <div className="kpi-value">{data.ownerInvestment.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add My Investment</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Source</th><th>Note</th><th className="num">Amount (KRW)</th><th></th></tr></thead>
            <tbody>
              {sorted.length === 0 ? <tr><td colSpan="5" className="empty">No personal investment records yet.</td></tr> :
                sorted.map(x => (
                  <tr key={x._id}>
                    <td>{x.date}</td>
                    <td><span className="badge badge-purple">{x.source}</span></td>
                    <td>{x.note||'—'}</td>
                    <td className="num text-green"><strong>{fmtKRW(x.amount)}</strong></td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(x)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(x._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Add'} My Investment</h3>
            <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
            <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount:Number(e.target.value)})} /></div>
            <div className="form-row"><label>Source</label><input value={editData.source} onChange={e => setEditData({...editData, source:e.target.value})} placeholder="Personal Savings, Gift, etc." /></div>
            <div className="form-row"><label>Note</label><textarea value={editData.note} onChange={e => setEditData({...editData, note:e.target.value})} /></div>
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
