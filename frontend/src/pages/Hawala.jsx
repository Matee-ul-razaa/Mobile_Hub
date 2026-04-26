import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';
import * as XLSX from 'xlsx';

const Hawala = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = data.hawala.filter(h => 
    h.buyer.toLowerCase().includes(search.toLowerCase()) || 
    (h.note||'').toLowerCase().includes(search.toLowerCase()) ||
    (h.receiverName||'').toLowerCase().includes(search.toLowerCase())
  );

  const totalKRW = filtered.reduce((a,x) => a + (+x.amountKRW||0), 0);
  const totalPKR = filtered.reduce((a,x) => a + (+x.amountPKR||0), 0);
  const totalDiscount = filtered.reduce((a,x) => a + (+x.discountKRW||0), 0);
  
  const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date));

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

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.hawala);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hawala");
    XLSX.writeFile(workbook, `MobileHub_Hawala_${todayISO()}.xlsx`);
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Received (KRW)</div>
          <div className="kpi-value pos">{fmtKRW(totalKRW)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Settled (PKR)</div>
          <div className="kpi-value">₨{fmtNum(totalPKR)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Discount</div>
          <div className="kpi-value neg">{fmtKRW(totalDiscount)}</div></div>
        <div className="kpi"><div className="kpi-label">Filtered Entries</div>
          <div className="kpi-value">{filtered.length}</div></div>
      </div>
      
      <div className="card" style={{ marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input 
          className="search-input" 
          placeholder="Search by buyer, receiver or note..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Record Hawala</button>
        <button className="btn" onClick={exportExcel}>💾 Export Excel</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Buyer (PK)</th><th>Received From (KR)</th><th className="num">PKR Amount</th><th className="num">KRW Received</th><th className="num">Discount</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {sorted.length === 0 ? <tr><td colSpan="8" className="empty">No hawala entries found.</td></tr> :
                sorted.map((h, i) => (
                  <tr key={i}>
                    <td>{h.date}</td>
                    <td><strong>{h.buyer}</strong></td>
                    <td>{h.receiverName||'—'}</td>
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
          <div className="modal" style={{maxWidth:'600px'}}>
            <h3>{editData._id ? 'Edit' : 'Record'} Hawala Cash Received</h3>
            <div className="form-rows-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Buyer (PK) settle *</label><input value={editData.buyer} onChange={e => setEditData({...editData, buyer:e.target.value})} /></div>
            </div>
            <div className="form-row"><label>Link to Sale (optional)</label>
              <select value={editData.linkedSaleId} onChange={e => setEditData({...editData, linkedSaleId:e.target.value})}>
                <option value="">— none —</option>
                {data.sales.map(s => <option key={s._id} value={s._id}>{s.date} — {s.buyer} — {fmtKRW(s.qty*s.pricePerUnit)}</option>)}
              </select>
            </div>
            <div className="form-rows-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <div className="form-row"><label>PKR Amount</label><input type="number" value={editData.amountPKR} onChange={e => setEditData({...editData, amountPKR:Number(e.target.value)})} /></div>
              <div className="form-row"><label>KRW Received *</label><input type="number" value={editData.amountKRW} onChange={e => setEditData({...editData, amountKRW:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Discount Given (KRW)</label><input type="number" value={editData.discountKRW} onChange={e => setEditData({...editData, discountKRW:Number(e.target.value)})} /></div>
            <div className="form-rows-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <div className="form-row"><label>Korean Receiver Name</label><input value={editData.receiverName} onChange={e => setEditData({...editData, receiverName:e.target.value})} /></div>
              <div className="form-row"><label>Collected By</label><input value={editData.receivedBy} onChange={e => setEditData({...editData, receivedBy:e.target.value})} /></div>
            </div>
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
