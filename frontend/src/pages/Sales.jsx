import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Sales = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState('');

  const a = agg(data);
  const filtered = data.sales.filter(s => 
    s.buyer.toLowerCase().includes(search.toLowerCase()) || 
    s.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (sale) => {
    setEditData(sale || { date: todayISO(), buyer: '', model: '', qty: 1, pricePerUnit: 0, received: 0, shipmentId: '', notes: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/sales/${editData._id}`, editData);
      else await poster('/sales', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete sale? Inventory will be updated.')) return;
    try {
      await deleter(`/sales/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Sale Value</div><div className="kpi-value">{fmtKRW(a.salesRev)}</div><div className="kpi-sub">₨{fmtKRW(a.salesRev * 1.5).replace('₩','')} PKR (approx)</div></div>
        <div className="kpi"><div className="kpi-label">Total Received</div><div className="kpi-value text-green">{fmtKRW(a.realizedRevenue)}</div><div className="kpi-sub">Actual cash collected</div></div>
        <div className="kpi"><div className="kpi-label">Pending Receivable</div><div className="kpi-value text-red">{fmtKRW(a.pendingReceivable)}</div><div className="kpi-sub">Payment still due</div></div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Record Sale</button>
        <div className="search-wrap" style={{ flex:1 }}>
          <input type="text" placeholder="Search buyers, models..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Buyer</th><th>Model</th><th className="num">Qty</th><th className="num">Price Each</th><th className="num">Total</th><th className="num">Received</th><th className="num">Pending</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const total = s.qty * s.pricePerUnit;
                const pending = Math.max(0, total - (s.received || 0));
                const shp = data.shipments.find(sh => sh._id === s.shipmentId);
                return (
                  <tr key={s._id}>
                    <td>{s.date}</td>
                    <td><strong>{s.buyer}</strong><div className="muted" style={{fontSize:'10px'}}>{shp ? shp.ref : 'Un-shipped'}</div></td>
                    <td>{s.model}</td>
                    <td className="num">{s.qty}</td>
                    <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                    <td className={`num ${pending > 0 ? '' : 'text-green'}`}>{fmtKRW(total)}</td>
                    <td className="num text-green">{fmtKRW(s.received)}</td>
                    <td className={`num ${pending > 0 ? 'text-red font-bold' : 'muted'}`}>{fmtKRW(pending)}</td>
                    <td>{pending === 0 ? <span className="badge badge-green">Paid</span> : <span className="badge badge-amber">Partial</span>}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Record'} Sale</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date *</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Buyer Name *</label><input value={editData.buyer} onChange={e=>setEditData({...editData, buyer:e.target.value})} /></div>
            </div>
            <div className="form-row"><label>Model *</label>
              <select value={editData.model} onChange={e=>setEditData({...editData, model:e.target.value})}>
                <option value="">-- select model --</option>
                {data.inventory.map(i => <option key={i._id} value={i.model}>{i.model} ({i.qty - i.soldQty} available)</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Qty *</label><input type="number" value={editData.qty} onChange={e=>setEditData({...editData, qty:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Price Per Unit (KRW) *</label><input type="number" value={editData.pricePerUnit} onChange={e=>setEditData({...editData, pricePerUnit:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Amount Received so far (KRW)</label><input type="number" value={editData.received} onChange={e=>setEditData({...editData, received:Number(e.target.value)})} /></div>
            <div className="form-row"><label>Notes</label><textarea value={editData.notes} onChange={e=>setEditData({...editData, notes:e.target.value})} /></div>
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
export default Sales;
