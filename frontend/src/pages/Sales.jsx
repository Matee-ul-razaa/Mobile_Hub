import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Sales = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const salesRev = data.sales.reduce((a,x) => a + x.qty * x.pricePerUnit, 0);
  const salesCOGS = data.sales.reduce((a,x) => {
    const item = data.inventory.find(i => i.model===x.model);
    return a + x.qty * (item ? item.costPerUnit : 0);
  }, 0);
  const grossProfit = salesRev - salesCOGS;
  const pendingReceivable = data.sales.reduce((a,x) => a + Math.max(0, (x.qty*x.pricePerUnit) - (x.received||0)), 0);

  const handleEdit = (s) => {
    setEditData(s || { date:todayISO(), buyer:'', model:'', qty:1, pricePerUnit:0, received:0, notes:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.buyer||!editData.model||!editData.qty) return alert('Buyer, model and qty required');
    
    // Stock Check
    const invItem = data.inventory.find(i => i.model === editData.model);
    if (!invItem) return alert('Selected model not found in inventory');
    
    const originalSale = data.sales.find(s => s._id === editData._id);
    const originalQty = originalSale ? originalSale.qty : 0;
    const available = (invItem.qty - invItem.soldQty) + originalQty;
    
    if (editData.qty > available) {
      return alert(`Insufficient stock! Only ${available} available for ${editData.model}.`);
    }

    try {
      if (editData._id) {
        await putter(`/sales/${editData._id}`, editData);
      } else {
        await poster('/sales', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this sale?')) return;
    try {
      await deleter(`/sales/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Revenue</div><div className="kpi-value">{fmtKRW(salesRev)}</div></div>
        <div className="kpi"><div className="kpi-label">Cost of Goods</div><div className="kpi-value">{fmtKRW(salesCOGS)}</div></div>
        <div className="kpi"><div className="kpi-label">Gross Profit</div><div className={`kpi-value ${grossProfit>=0?'pos':'neg'}`}>{fmtKRW(grossProfit)}</div></div>
        <div className="kpi"><div className="kpi-label">Pending Receivable</div><div className={`kpi-value ${pendingReceivable>0?'neg':''}`}>{fmtKRW(pendingReceivable)}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ New Sale</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Buyer</th><th>Model</th><th className="num">Qty</th>
              <th className="num">Price/Unit</th><th className="num">Total</th><th className="num">Received</th>
              <th className="num">Pending</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.sales.length === 0 ? <tr><td colSpan="10" className="empty">No sales yet.</td></tr> :
                data.sales.map(s => {
                  const total = s.qty * s.pricePerUnit;
                  const remaining = total - (s.received||0);
                  const status = remaining<=0 ? 'Paid' : (s.received>0 ? 'Partial' : 'Pending');
                  const statusCls = status==='Paid'?'green':status==='Partial'?'amber':'red';
                  return (
                    <tr key={s._id}>
                      <td>{s.date}</td>
                      <td><strong>{s.buyer}</strong></td>
                      <td>{s.model}</td>
                      <td className="num">{s.qty}</td>
                      <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                      <td className="num"><strong>{fmtKRW(total)}</strong></td>
                      <td className="num">{fmtKRW(s.received||0)}</td>
                      <td className={`num text-${remaining>0?'red':'green'}`}>{fmtKRW(remaining)}</td>
                      <td><span className={`badge badge-${statusCls}`}>{status}</span></td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'New'} Sale / Shipment</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Buyer (Pakistan) *</label><input value={editData.buyer} onChange={e => setEditData({...editData, buyer:e.target.value})} placeholder="Ali Traders, Karachi" /></div>
            </div>
            <div className="form-row"><label>Model (choose from stock) *</label>
              <select value={editData.model} onChange={e => {
                const inv = data.inventory.find(i => i.model === e.target.value);
                setEditData({...editData, model:e.target.value, pricePerUnit: inv ? inv.costPerUnit * 1.1 : 0});
              }}>
                <option value="">— select —</option>
                {data.inventory.map(i => {
                  const rem = i.qty - i.soldQty;
                  return <option key={i._id} value={i.model}>{i.model} ({rem} available)</option>
                })}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Quantity *</label><input type="number" value={editData.qty} onChange={e => setEditData({...editData, qty:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Sell Price per Unit (KRW) *</label><input type="number" value={editData.pricePerUnit} onChange={e => setEditData({...editData, pricePerUnit:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Amount Already Received (KRW)</label><input type="number" value={editData.received} onChange={e => setEditData({...editData, received:Number(e.target.value)})} /></div>
            <div className="form-row"><label>Notes</label><textarea value={editData.notes} onChange={e => setEditData({...editData, notes:e.target.value})} /></div>
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
