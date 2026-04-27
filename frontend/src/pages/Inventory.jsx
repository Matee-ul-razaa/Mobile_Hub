import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Inventory = ({ toggleMenu }) => {
  const { data, addInventory, updateInventory, deleteInventory } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  const handleExport = () => {
    const rows = data.inventory.map(x => ({
      Model: x.model,
      Brand: x.brand || '',
      SKU: x.sku || '',
      Bought: x.qty,
      Sold: x.soldQty,
      Remaining: Math.max(0, x.qty - x.soldQty),
      CostPerUnit: x.costPerUnit,
      Value: Math.max(0, x.qty - x.soldQty) * x.costPerUnit,
      Notes: x.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory-export-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const items = XLSX.utils.sheet_to_json(ws);
      
      for (const item of items) {
        if (item.Model) {
          await addInventory({
            model: item.Model,
            brand: item.Brand || '',
            sku: item.SKU || '',
            qty: Number(item.Bought) || 0,
            costPerUnit: Number(item.CostPerUnit) || 0,
            notes: item.Notes || ''
          });
        }
      }
      alert('Import successful!');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Inventory</h1>
            <div className="page-sub">Manage your stock in Korea</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Import Excel
            <input type="file" style={{ display: 'none' }} onChange={handleImport} accept=".xlsx,.xls" />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Item</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Items</div>
          <div className="kpi-value">{data.inventory.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Units In Stock</div>
          <div className="kpi-value brand">{a.invUnits}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{fmtKRW(a.invValue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th className="num">Bought</th>
                <th className="num">Sold</th>
                <th className="num">Stock</th>
                <th className="num">Cost/Unit</th>
                <th className="num">Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.map(item => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.model}</strong>
                    <div className="muted" style={{ fontSize: '11px' }}>{item.brand} {item.sku && `· ${item.sku}`}</div>
                  </td>
                  <td className="num">{item.qty}</td>
                  <td className="num">{item.soldQty || 0}</td>
                  <td className="num"><strong>{item.qty - (item.soldQty || 0)}</strong></td>
                  <td className="num">{fmtKRW(item.costPerUnit)}</td>
                  <td className="num">{fmtKRW((item.qty - (item.soldQty || 0)) * item.costPerUnit)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => { setEditingItem(item); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteInventory(item._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <InventoryModal 
          item={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateInventory(editingItem._id, obj);
            else await addInventory(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const InventoryModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || { model: '', brand: '', sku: '', qty: 0, costPerUnit: 0, notes: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Add'} Inventory Item</h3></div>
        <div className="form-row"><label>Model *</label><input value={form.model} onChange={e=>setForm({...form, model:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Brand</label><input value={form.brand} onChange={e=>setForm({...form, brand:e.target.value})} /></div>
          <div className="form-row"><label>SKU</label><input value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form, qty:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Cost (KRW)</label><input type="number" value={form.costPerUnit} onChange={e=>setForm({...form, costPerUnit:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
