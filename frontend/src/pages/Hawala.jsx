import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Hawala = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const totalKRW = data.hawala.reduce((a,x) => a + (+x.amountKRW||0), 0);
  const totalPKR = data.hawala.reduce((a,x) => a + (+x.amountPKR||0), 0);
  const totalDiscount = data.hawala.reduce((a,x) => a + (+x.discountKRW||0), 0);
  
  const sorted = [...data.hawala].sort((a,b) => b.date.localeCompare(a.date));

  const handleEdit = (h) => {
    setEditData(h || { date:todayISO(), buyer:'', receiverName:'', receiverPhone:'', receivedBy:'', amountKRW:0, amountPKR:0, discountKRW:0, note:'', linkedSaleId:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.amountKRW || !editData.buyer) return alert('Buyer & KRW amount required');
    try {
      if (editData._id) {
        await putter(`/hawala/${editData._id}`, editData);
      } else {
        // Handle linked sale received logic on backend or front
        await poster('/hawala', editData);
        if (editData.linkedSaleId) {
           const sale = data.sales.find(s => s._id === editData.linkedSaleId);
           if (sale) {
             await putter(`/sales/${sale._id}`, { received: (sale.received||0) + Number(editData.amountKRW) });
           }
        }
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete hawala entry?')) return;
    try {
      await deleter(`/hawala/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Received (KRW)</div>
          <div className="kpi-value pos">{fmtKRW(totalKRW)}</div>
          <div className="kpi-sub">This is your earnings from Pakistan sales</div></div>
        <div className="kpi"><div className="kpi-label">Total Settled (PKR)</div>
          <div className="kpi-value">₨{fmtNum(totalPKR)}</div>
          <div className="kpi-sub">Amount buyers paid in Pakistan</div></div>
        <div className="kpi"><div className="kpi-label">Total Discount Given</div>
          <div className="kpi-value neg">{fmtKRW(totalDiscount)}</div>
          <div className="kpi-sub">Discount on hawala transactions</div></div>
        <div className="kpi"><div className="kpi-label">Entries</div>
          <div className="kpi-value">{data.hawala.length}</div>
          <div className="kpi-sub">Total hawala records</div></div>
      </div>
      
      <div className="card" style={{ marginBottom: '14px' }}>
        <p style={{ margin:0, fontSize:'13px', color:'var(--text-2)' }}>
          <strong>How this page works:</strong> The buyer in Pakistan pays the full amount in PKR there. Their Korea-based contact hands you KRW locally. Record the PKR amount they paid and the KRW you received here — the KRW amount is your actual earnings from selling mobiles in Pakistan. If you gave a discount on the hawala, enter it in the Discount field to keep track.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Record Hawala</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Buyer (PK)</th><th>Received From (KR)</th><th>Picked Up By</th>
              <th className="num">PKR Amount</th><th className="num">KRW Received</th><th className="num">Discount (KRW)</th>
              <th>Note</th><th></th></tr></thead>
            <tbody>
              {sorted.length === 0 ? <tr><td colSpan="9" className="empty">No hawala entries yet.</td></tr> :
                sorted.map((h, i) => (
                  <tr key={i}>
                    <td>{h.date}</td>
                    <td><strong>{h.buyer}</strong></td>
                    <td>{h.receiverName||'—'}<div className="muted" style={{fontSize:'11px'}}>{h.receiverPhone||''}</div></td>
                    <td>{h.receivedBy||'—'}</td>
                    <td className="num">₨{fmtNum(h.amountPKR)}</td>
                    <td className="num text-green"><strong>+{fmtKRW(h.amountKRW)}</strong></td>
                    <td className="num text-red">{h.discountKRW ? '−'+fmtKRW(h.discountKRW) : '—'}</td>
                    <td>{h.note||''}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(h)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(h._id)}>Del</button>
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
            <h3>{editData._id ? 'Edit' : 'Record'} Hawala Cash Received</h3>
            <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
            <div className="form-row"><label>Buyer (Pakistan) whose payment this settles *</label><input value={editData.buyer} onChange={e => setEditData({...editData, buyer:e.target.value})} placeholder="Ali Traders, Karachi" /></div>
            <div className="form-row"><label>Link to Sale (optional — auto-marks received)</label>
              <select value={editData.linkedSaleId} onChange={e => setEditData({...editData, linkedSaleId:e.target.value})}>
                <option value="">— none —</option>
                {data.sales.map(s => <option key={s._id} value={s._id}>{s.date} — {s.buyer} — {fmtKRW(s.qty*s.pricePerUnit)}</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>PKR Amount (paid in Pakistan)</label><input type="number" value={editData.amountPKR} onChange={e => setEditData({...editData, amountPKR:Number(e.target.value)})} placeholder="e.g. 480000" /></div>
              <div className="form-row"><label>KRW Received *</label><input type="number" value={editData.amountKRW} onChange={e => setEditData({...editData, amountKRW:Number(e.target.value)})} placeholder="e.g. 2500000" /></div>
            </div>
            <div className="form-row"><label>Discount Given on Hawala (KRW)</label>
              <input type="number" value={editData.discountKRW} onChange={e => setEditData({...editData, discountKRW:Number(e.target.value)})} placeholder="0" />
              <div className="muted" style={{fontSize:'11px',marginTop:'2px'}}>Enter any discount you gave on this hawala transfer</div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Korean Receiver Name (gave you cash)</label><input value={editData.receiverName} onChange={e => setEditData({...editData, receiverName:e.target.value})} /></div>
              <div className="form-row"><label>Receiver Phone</label><input value={editData.receiverPhone} onChange={e => setEditData({...editData, receiverPhone:e.target.value})} /></div>
            </div>
            <div className="form-row"><label>Collected By (you / staff)</label><input value={editData.receivedBy} onChange={e => setEditData({...editData, receivedBy:e.target.value})} /></div>
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
export default Hawala;
