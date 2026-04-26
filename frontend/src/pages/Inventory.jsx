import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Inventory = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState('');

  const a = agg(data);
  const filtered = data.inventory.filter(i => 
    i.model.toLowerCase().includes(search.toLowerCase()) || 
    i.brand?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (item) => {
    setEditData(item || { model: '', brand: '', sku: '', qty: 0, soldQty: 0, costPerUnit: 0, notes: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/inventory/${editData._id}`, editData);
      else await poster('/inventory', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete item?')) return;
    try {
      await deleter(`/inventory/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Stock Value (Cost)</div><div className="kpi-value brand">{fmtKRW(a.invValue)}</div><div className="kpi-sub">Total tied up capital</div></div>
        <div className="kpi"><div className="kpi-label">Units Available</div><div className="kpi-value">{a.invUnits}</div><div className="kpi-sub">Across {data.inventory.length} models</div></div>
        <div className="kpi"><div className="kpi-label">Total Sold</div><div className="kpi-value text-green">{data.inventory.reduce((acc,x)=>acc+(x.soldQty||0),0)}</div><div className="kpi-sub">Units moved lifetime</div></div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Item</button>
        <div className="search-wrap" style={{ flex:1 }}>
          <input type="text" placeholder="Search models, brands, SKU..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Model</th><th>Brand</th><th>SKU</th><th className="num">Qty</th><th className="num">Sold</th><th className="num">In Stock</th><th className="num">Cost Each</th><th className="num">Stock Value</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i._id}>
                  <td><strong>{i.model}</strong><div className="muted" style={{fontSize:'11px'}}>{i.notes}</div></td>
                  <td>{i.brand}</td>
                  <td><code style={{fontSize:'11px'}}>{i.sku}</code></td>
                  <td className="num">{i.qty}</td>
                  <td className="num">{i.soldQty}</td>
                  <td className={`num ${i.qty-i.soldQty <= 2 ? 'text-red font-bold' : ''}`}>{i.qty - i.soldQty}</td>
                  <td className="num">{fmtKRW(i.costPerUnit)}</td>
                  <td className="num">{fmtKRW((i.qty - i.soldQty) * i.costPerUnit)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => handleEdit(i)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i._id)}>Del</button>
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
            <h3>{editData._id ? 'Edit' : 'Add'} Inventory Item</h3>
            <div className="form-row"><label>Model Name *</label><input value={editData.model} onChange={e=>setEditData({...editData, model:e.target.value})} /></div>
            <div className="form-row-2">
              <div className="form-row"><label>Brand</label><input value={editData.brand} onChange={e=>setEditData({...editData, brand:e.target.value})} /></div>
              <div className="form-row"><label>SKU (optional)</label><input value={editData.sku} onChange={e=>setEditData({...editData, sku:e.target.value})} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Total Qty Purchased</label><input type="number" value={editData.qty} onChange={e=>setEditData({...editData, qty:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Sold Qty (auto-updates)</label><input type="number" value={editData.soldQty} onChange={e=>setEditData({...editData, soldQty:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Cost Per Unit (KRW) *</label><input type="number" value={editData.costPerUnit} onChange={e=>setEditData({...editData, costPerUnit:Number(e.target.value)})} /></div>
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
export default Inventory;
