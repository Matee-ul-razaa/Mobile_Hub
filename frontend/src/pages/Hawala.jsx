import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, todayISO, uid } from '../utils';
import { poster, putter, deleter } from '../api';

const Hawala = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState('');

  const a = agg(data);
  const filtered = data.hawala.filter(h => 
    h.buyer?.toLowerCase().includes(search.toLowerCase()) || 
    h.receiverName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (haw) => {
    setEditData(haw || { date: todayISO(), amountKRW: 0, amountPKR: 0, discountKRW: 0, buyer: '', receiverName: '', receiverPhone: '', receivedBy: '', note: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/hawala/${editData._id}`, editData);
      else await poster('/hawala', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete Fazi Cash entry?')) return;
    try {
      await deleter(`/hawala/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total KRW Received</div><div className="kpi-value pos">{fmtKRW(a.hawalaIn)}</div><div className="kpi-sub">Actual working cash added</div></div>
        <div className="kpi"><div className="kpi-label">Total PKR Settled</div><div className="kpi-value">₨{fmtNum(a.hawalaPKR)}</div><div className="kpi-sub">Paid by buyers in PK</div></div>
        <div className="kpi"><div className="kpi-label">Discounts Given</div><div className="kpi-value text-red">{fmtKRW(a.hawalaDiscount)}</div><div className="kpi-sub">Excluded from revenue</div></div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ New Fazi Cash Entry</button>
        <div className="search-wrap" style={{ flex:1 }}>
          <input type="text" placeholder="Search buyers, receivers..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Buyer / Receiver</th><th className="num">PKR Settled</th><th className="num">KRW Received</th><th className="num">Discount</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr key={h._id}>
                  <td>{h.date}</td>
                  <td>
                    <strong>{h.buyer}</strong>
                    <div className="muted" style={{fontSize:'11px'}}>via {h.receiverName} ({h.receiverPhone})</div>
                  </td>
                  <td className="num">₨{fmtNum(h.amountPKR)}</td>
                  <td className="num text-green font-bold">{fmtKRW(h.amountKRW)}</td>
                  <td className="num text-red">{fmtKRW(h.discountKRW)}</td>
                  <td style={{ fontSize: '11px' }}>{h.note}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => handleEdit(h)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(h._id)}>Del</button>
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
            <h3>{editData._id ? 'Edit' : 'New'} Fazi Cash Entry</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date *</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Buyer Name *</label><input value={editData.buyer} onChange={e=>setEditData({...editData, buyer:e.target.value})} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Receiver Name</label><input value={editData.receiverName} onChange={e=>setEditData({...editData, receiverName:e.target.value})} /></div>
              <div className="form-row"><label>Receiver Phone</label><input value={editData.receiverPhone} onChange={e=>setEditData({...editData, receiverPhone:e.target.value})} /></div>
            </div>
            <div style={{ background:'var(--surface-2)', padding:'12px', borderRadius:'8px', marginBottom:'12px' }}>
              <div className="form-row-2">
                <div className="form-row"><label>Amount Settled (PKR) *</label><input type="number" value={editData.amountPKR} onChange={e=>setEditData({...editData, amountPKR:Number(e.target.value)})} /></div>
                <div className="form-row"><label>Amount Received (KRW) *</label><input type="number" value={editData.amountKRW} onChange={e=>setEditData({...editData, amountKRW:Number(e.target.value)})} /></div>
              </div>
              <div className="form-row"><label>Discount (KRW)</label><input type="number" value={editData.discountKRW} onChange={e=>setEditData({...editData, discountKRW:Number(e.target.value)})} /></div>
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
export default Hawala;
