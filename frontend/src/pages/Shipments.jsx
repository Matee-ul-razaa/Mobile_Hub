import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO, uid } from '../utils';
import { poster, putter, deleter } from '../api';

const SHIP_STATUS = ['Preparing', 'Shipped', 'In Transit', 'Delivered', 'Issue'];
const SHIP_COURIERS = ['DHL', 'EMS', 'FedEx', 'UPS', 'Aramex', 'Hand-carry', 'Other'];

const Shipments = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const list = [...data.shipments].sort((a,b) => b.date.localeCompare(a.date));

  const handleEdit = (shp) => {
    setEditData(shp || {
      date: todayISO(), ref: `WK-${todayISO()}`, courier: 'DHL', status: 'Preparing',
      trackingNumber: '', arrivedDate: '', shippingCost: 0, notes: '',
       sales: data.sales.filter(s => !s.shipmentId).map(s => s._id) // Suggest all unlinked
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let saved;
      if (editData._id) {
        saved = await putter(`/shipments/${editData._id}`, editData);
      } else {
        saved = await poster('/shipments', editData);
      }
      
      // Link/Unlink sales logic
      const selectedIds = editData.sales || [];
      await Promise.all(data.sales.map(async (s) => {
        const isSelected = selectedIds.includes(s._id);
        const isCurrentlyLinked = s.shipmentId === (editData._id || saved._id);
        
        if (isSelected && !isCurrentlyLinked) {
          await putter(`/sales/${s._id}`, { ...s, shipmentId: (editData._id || saved._id) });
        } else if (!isSelected && isCurrentlyLinked) {
          await putter(`/sales/${s._id}`, { ...s, shipmentId: '' });
        }
      }));

      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (shp) => {
    if (!window.confirm('Delete shipment? Sales will be unlinked.')) return;
    try {
      await deleter(`/shipments/${shp._id}`);
      // Unlink sales
      const linked = data.sales.filter(s => s.shipmentId === shp._id);
      await Promise.all(linked.map(s => putter(`/sales/${s._id}`, { ...s, shipmentId: '' })));
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ New Shipment</button>
      </div>

      <div className="shipment-list">
        {list.length === 0 ? <div className="card empty">No shipments recorded yet.</div> :
          list.map(sh => {
            const linked = data.sales.filter(s => s.shipmentId === sh._id);
            const units = linked.reduce((a,x) => a + x.qty, 0);
            const value = linked.reduce((a,x) => a + (x.qty * x.pricePerUnit), 0);
            const statusCls = sh.status==='Delivered'?'green':sh.status==='Issue'?'red':sh.status==='Shipped'?'brand':'gray';

            return (
              <div key={sh._id} className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <h3 style={{ margin:0 }}>{sh.ref || 'Shipment '+sh.date} <span className={`badge badge-${statusCls}`}>{sh.status}</span></h3>
                    <div className="muted" style={{ fontSize: '12px' }}>{sh.courier} · {sh.date} {sh.trackingNumber ? `· Track: ${sh.trackingNumber}` : ''}</div>
                  </div>
                  <div className="inline-actions">
                    <button className="btn btn-sm" onClick={() => handleEdit({...sh, sales: linked.map(s=>s._id)})}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sh)}>Del</button>
                  </div>
                </div>
                <div className="kpi-grid" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div className="kpi small"><div className="kpi-label">Units</div><div className="kpi-value">{units}</div></div>
                  <div className="kpi small"><div className="kpi-label">Shipment Value</div><div className="kpi-value">{fmtKRW(value)}</div></div>
                  <div className="kpi small"><div className="kpi-label">Shipping Cost</div><div className="kpi-value text-red">{fmtKRW(sh.shippingCost)}</div></div>
                </div>
                {linked.length > 0 && (
                   <div className="table-wrap" style={{ marginTop: '10px' }}>
                     <table>
                       <thead><tr><th>Buyer</th><th>Model</th><th className="num">Qty</th><th className="num">Value</th></tr></thead>
                       <tbody>
                         {linked.map(s => (
                           <tr key={s._id}>
                             <td>{s.buyer}</td><td>{s.model}</td><td className="num">{s.qty}</td><td className="num">{fmtKRW(s.qty*s.pricePerUnit)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                )}
              </div>
            );
          })
        }
      </div>

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'New'} Shipment</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Reference</label><input value={editData.ref} onChange={e=>setEditData({...editData, ref:e.target.value})} /></div>
            </div>
            <div className="form-row-2">
              <div className="form-row"><label>Courier</label><select value={editData.courier} onChange={e=>setEditData({...editData, courier:e.target.value})}>{SHIP_COURIERS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-row"><label>Status</label><select value={editData.status} onChange={e=>setEditData({...editData, status:e.target.value})}>{SHIP_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="form-row"><label>Shipping Cost (KRW)</label><input type="number" value={editData.shippingCost} onChange={e=>setEditData({...editData, shippingCost:Number(e.target.value)})} /></div>
            
            <div className="form-row">
              <label>Link Sales to this Shipment</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--surface-2)', padding: '8px', borderRadius: '8px' }}>
                {data.sales.filter(s => !s.shipmentId || s.shipmentId === editData._id).map(s => (
                  <label key={s._id} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={(editData.sales || []).includes(s._id)} 
                      onChange={e => {
                        const next = e.target.checked ? [...(editData.sales||[]), s._id] : (editData.sales||[]).filter(id => id !== s._id);
                        setEditData({...editData, sales: next});
                      }}
                    />
                    {s.buyer} · {s.model} ({s.qty} units)
                  </label>
                ))}
              </div>
            </div>

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
export default Shipments;
