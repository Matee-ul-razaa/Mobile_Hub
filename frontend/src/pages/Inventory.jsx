import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Inventory = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const aUnits = data.inventory.reduce((a,x) => a + Math.max(0,(x.qty - x.soldQty)), 0);
  const aValue = data.inventory.reduce((a,x) => a + Math.max(0,(x.qty - x.soldQty)) * x.costPerUnit, 0);

  const handleEdit = (it) => {
    setEditData(it || { model:'', brand:'', sku:'', qty:0, costPerUnit:0, soldQty:0, notes:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.model) return alert('Model name required');
    try {
      if (editData._id) {
        await putter(`/inventory/${editData._id}`, editData);
      } else {
        await poster('/inventory', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this item?')) return;
    try {
      await deleter(`/inventory/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <div className="kpi"><div className="kpi-label">Total Items</div><div className="kpi-value">{data.inventory.length}</div></div>
        <div className="kpi"><div className="kpi-label">Units In Stock</div><div className="kpi-value brand">{aUnits}</div></div>
        <div className="kpi"><div className="kpi-label">Inventory Value</div><div className="kpi-value">{fmtKRW(aValue)}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Item</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Model</th><th className="num">Bought</th><th className="num">Sold</th><th className="num">In Stock</th>
              <th className="num">Cost/Unit</th><th className="num">Stock Value</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {data.inventory.length === 0 ? <tr><td colSpan="8" className="empty">No inventory yet. Click + Add Item.</td></tr> :
                data.inventory.map(x => {
                  const remaining = x.qty - x.soldQty;
                  const totalCost = remaining * x.costPerUnit;
                  return (
                    <tr key={x._id}>
                      <td><strong>{x.model}</strong><div className="muted" style={{fontSize:'11px'}}>{x.brand||''} {x.sku?'· '+x.sku:''}</div></td>
                      <td className="num">{x.qty}</td>
                      <td className="num">{x.soldQty}</td>
                      <td className="num"><strong>{remaining}</strong></td>
                      <td className="num">{fmtKRW(x.costPerUnit)}</td>
                      <td className="num">{fmtKRW(totalCost)}</td>
                      <td>{x.notes||''}</td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn btn-sm" onClick={() => handleEdit(x)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(x._id)}>Del</button>
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
            <h3>{editData._id ? 'Edit' : 'Add'} Inventory Item</h3>
            <div className="form-row"><label>Model / Product Name *</label><input value={editData.model} onChange={e => setEditData({...editData, model:e.target.value})} placeholder="iPhone 15 Pro 256GB" /></div>
            <div className="form-row-2">
              <div className="form-row"><label>Brand</label><input value={editData.brand} onChange={e => setEditData({...editData, brand:e.target.value})} placeholder="Apple" /></div>
              <div className="form-row"><label>SKU / Code</label><input value={editData.sku} onChange={e => setEditData({...editData, sku:e.target.value})} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Quantity Bought *</label><input type="number" value={editData.qty} onChange={e => setEditData({...editData, qty:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Cost per Unit (KRW) *</label><input type="number" value={editData.costPerUnit} onChange={e => setEditData({...editData, costPerUnit:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Already Sold (qty)</label><input type="number" value={editData.soldQty} onChange={e => setEditData({...editData, soldQty:Number(e.target.value)})} /></div>
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
export default Inventory;
