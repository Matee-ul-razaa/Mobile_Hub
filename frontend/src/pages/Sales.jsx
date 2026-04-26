import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg, todayISO, fmtNum } from '../utils';
import { poster, putter, deleter } from '../api';

const Sales = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const a = agg(data);

  const handleEdit = (item) => {
    setEditData(item || { buyer: '', model: '', qty: 1, pricePerUnit: 0, received: 0, date: todayISO(), status: 'Pending', shipmentId: '' });
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
    if (!window.confirm('Delete sale?')) return;
    try {
      await deleter(`/sales/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' }}>
        <div>
          <h2 style={{margin:0}}>Sales</h2>
          <div className="muted">Orders sent to Pakistan buyers</div>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn btn-sm btn-outline">⬇️ Template</button>
          <button className="btn btn-sm btn-outline">⬆️ Export Excel</button>
          <button className="btn btn-sm btn-outline">⬇️ Import Excel</button>
          <button className="btn btn-sm btn-primary" onClick={() => handleEdit(null)}>+ New Sale</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">TOTAL REVENUE</div><div className="kpi-value">{fmtKRW(a.salesRev)}</div></div>
        <div className="kpi"><div className="kpi-label">COST OF GOODS</div><div className="kpi-value text-blue">{fmtKRW(a.salesCOGS)}</div></div>
        <div className="kpi"><div className="kpi-label">GROSS PROFIT</div><div className="kpi-value text-green">{fmtKRW(a.grossProfit)}</div></div>
        <div className="kpi"><div className="kpi-label">PENDING RECEIVABLE</div><div className="kpi-value text-red">{fmtKRW(a.pendingReceivable)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>DATE</th><th>BUYER</th><th>MODEL</th><th className="num">QTY</th><th className="num">PRICE/UNIT</th><th className="num">TOTAL</th><th className="num">RECEIVED</th><th className="num">PENDING</th><th>STATUS</th><th>SHIPMENT</th><th></th></tr>
            </thead>
            <tbody>
              {data.sales.map(s => {
                const pending = Math.max(0, (s.qty * s.pricePerUnit) - (s.received || 0));
                return (
                  <tr key={s._id}>
                    <td><div style={{fontSize:'12px'}}>{s.date}</div></td>
                    <td><strong>{s.buyer}</strong></td>
                    <td><div style={{fontSize:'12px'}}>{s.model}</div></td>
                    <td className="num">{s.qty}</td>
                    <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                    <td className="num"><strong>{fmtKRW(s.qty * s.pricePerUnit)}</strong></td>
                    <td className="num text-green">{fmtKRW(s.received)}</td>
                    <td className={`num ${pending>0?'text-red':'text-green'}`}>{fmtKRW(pending)}</td>
                    <td><span className={`badge badge-${s.status==='Collected'?'green':'red'}`}>{s.status}</span></td>
                    <td>{s.shipmentId ? <span className="badge badge-blue">#{s.shipmentId.slice(-4)}</span> : '—'}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm btn-action" onClick={() => handleEdit(s)}>Edit</button>
                        <button className="btn btn-sm btn-action text-red" onClick={() => handleDelete(s._id)}>Del</button>
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
            <h3>{editData._id ? 'Edit' : 'New'} Sale Entry</h3>
            {/* Form simplified for brevity, same logic as inventory */}
            <div className="form-row"><label>Buyer Name</label><input value={editData.buyer} onChange={e=>setEditData({...editData, buyer:e.target.value})} /></div>
            <div className="form-row"><label>Model</label>
              <select value={editData.model} onChange={e=>setEditData({...editData, model:e.target.value})}>
                <option value="">Select Phone Model</option>
                {data.inventory.map(i => <option key={i._id} value={i.model}>{i.model} ({i.qty-i.soldQty} in stock)</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Quantity</label><input type="number" value={editData.qty} onChange={e=>setEditData({...editData, qty:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Price Per Unit (KRW)</label><input type="number" value={editData.pricePerUnit} onChange={e=>setEditData({...editData, pricePerUnit:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Amount Received (KRW)</label><input type="number" value={editData.received} onChange={e=>setEditData({...editData, received:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Status</label>
                <select value={editData.status} onChange={e=>setEditData({...editData, status:e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Partially Collected">Partially Collected</option>
                  <option value="Collected">Collected</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Sale</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Sales;
