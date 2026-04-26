import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, todayISO, ym } from '../utils';
import { poster, putter, deleter } from '../api';

const Payouts = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const a = agg(data);
  const list = [...data.payouts].sort((a,b) => b.date.localeCompare(a.date));

  const handleEdit = (p) => {
    setEditData(p || { date: todayISO(), investorId: '', amount: 0, amountPKR: 0, note: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/payouts/${editData._id}`, editData);
      else await poster('/payouts', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete payout entry?')) return;
    try {
      await deleter(`/payouts/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Paid (KRW)</div><div className="kpi-value neg">{fmtKRW(a.totalPaid)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Paid (PKR)</div><div className="kpi-value">₨{fmtNum(a.totalPaidPKR)}</div></div>
        <div className="kpi"><div className="kpi-label">Entries</div><div className="kpi-value">{data.payouts.length}</div></div>
      </div>

      <div style={{ marginBottom:'16px' }}><button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Record Payout</button></div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Payout History</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Investor</th><th className="num">PKR Paid</th><th className="num">KRW Leaves Cash</th><th>Note</th><th></th></tr>
              </thead>
              <tbody>
                {list.map(p => {
                  const inv = data.investors.find(i => i._id === p.investorId);
                  return (
                    <tr key={p._id}>
                      <td>{p.date}</td>
                      <td><strong>{inv?.name || 'Deleted Investor'}</strong></td>
                      <td className="num">₨{fmtNum(p.amountPKR)}</td>
                      <td className="num text-red font-bold">{fmtKRW(p.amount)}</td>
                      <td><div className="muted" style={{fontSize:'11px'}}>{p.note}</div></td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Record'} Payout</h3>
            <div className="form-row"><label>Investor *</label>
              <select value={editData.investorId} onChange={e=>setEditData({...editData, investorId:e.target.value})}>
                <option value="">-- select investor --</option>
                {data.investors.map(i => <option key={i._id} value={i._id}>{i.name} (₨{fmtNum(i.monthlyPayoutPKR)} / {fmtKRW(i.monthlyPayout)})</option>)}
              </select>
            </div>
            <div className="form-row"><label>Date *</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
            <div style={{ background:'var(--surface-2)', padding:'12px', borderRadius:'8px', marginBottom:'12px' }}>
              <div className="form-row-2">
                <div className="form-row"><label>Amount Paid in PK (PKR)</label><input type="number" value={editData.amountPKR} onChange={e=>setEditData({...editData, amountPKR:Number(e.target.value)})} /></div>
                <div className="form-row"><label>Amount Leaves Cash (KRW) *</label><input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:Number(e.target.value)})} /></div>
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
export default Payouts;
