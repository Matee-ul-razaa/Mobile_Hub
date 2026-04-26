import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const Shipments = () => {
  const { data, addShipment, updateShipment, deleteShipment, updateSale } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);

  const a = agg(data);
  const list = [...data.shipments].reverse();

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">International Shipments</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingShipment(null); setShowModal(true); }}>+ New Shipment</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Shipments</div>
          <div className="kpi-value">{list.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">In Transit</div>
          <div className="kpi-value brand">{list.filter(s=>['Shipped','In Transit'].includes(s.status)).length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Shipping Cost</div>
          <div className="kpi-value neg">{fmtKRW(list.reduce((sum,s)=>sum+(s.shippingCost||0),0))}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Delivered</div>
          <div className="kpi-value pos">{list.filter(s=>s.status==='Delivered').length}</div>
        </div>
      </div>

      <div className="shipment-list">
        {list.map(sh => {
          const linkedSales = data.sales.filter(s => s.shipmentId === sh._id);
          const totalUnits = linkedSales.reduce((sum,s)=>sum+s.qty,0);
          const totalValue = linkedSales.reduce((sum,s)=>sum+s.qty*s.pricePerUnit,0);
          return (
            <div key={sh._id} className="card shipment-card" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ margin: 0 }}>{sh.ref || `Shipment ${sh.date}`}</h4>
                    <span className={`badge badge-${sh.status==='Delivered'?'green':sh.status==='Shipped'?'brand':'gray'}`}>{sh.status}</span>
                    <span className="badge badge-gray">{sh.courier}</span>
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                    Sent {sh.date} {sh.trackingNumber && `· Track: ${sh.trackingNumber}`}
                  </div>
                </div>
                <div className="inline-actions">
                  <button className="btn btn-sm" onClick={() => { setEditingShipment(sh); setShowModal(true); }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteShipment(sh._id)}>Del</button>
                </div>
              </div>
              
              <div className="shipment-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', margin: '15px 0', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div><label className="muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Items</label><div style={{ fontWeight: 600 }}>{totalUnits} units</div></div>
                <div><label className="muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Sale Value</label><div style={{ fontWeight: 600 }}>{fmtKRW(totalValue)}</div></div>
                <div><label className="muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Ship Cost</label><div style={{ fontWeight: 600, color: 'var(--red)' }}>{fmtKRW(sh.shippingCost)}</div></div>
              </div>

              {linkedSales.length > 0 && (
                <div className="table-wrap mini-table" style={{ background: 'var(--surface-2)', borderRadius: '6px' }}>
                  <table>
                    <thead><tr><th>Buyer</th><th>Model</th><th className="num">Qty</th><th className="num">Price</th></tr></thead>
                    <tbody>
                      {linkedSales.map(s => (
                        <tr key={s._id}>
                          <td>{s.buyer}</td>
                          <td>{s.model}</td>
                          <td className="num">{s.qty}</td>
                          <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <ShipmentModal 
          shipment={editingShipment} 
          sales={data.sales}
          onClose={() => setShowModal(false)}
          onSave={async (obj, pickedSales) => {
            let shipId;
            if (editingShipment) {
              await updateShipment(editingShipment._id, obj);
              shipId = editingShipment._id;
            } else {
              const newShip = await addShipment(obj);
              shipId = newShip._id;
            }
            // Link Sales
            const selectedSet = new Set(pickedSales);
            for (const s of data.sales) {
              if (selectedSet.has(s._id) && s.shipmentId !== shipId) {
                await updateSale(s._id, { ...s, shipmentId: shipId });
              } else if (!selectedSet.has(s._id) && s.shipmentId === shipId) {
                await updateSale(s._id, { ...s, shipmentId: '' });
              }
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const ShipmentModal = ({ shipment, sales, onClose, onSave }) => {
  const [form, setForm] = useState(shipment || { 
    date: new Date().toISOString().slice(0,10), 
    ref: `WK-${new Date().toISOString().slice(0,10)}`, 
    courier: 'DHL', 
    status: 'Preparing', 
    trackingNumber: '', 
    shippingCost: 0, 
    notes: '' 
  });

  const currentLinkedIds = sales.filter(s => s.shipmentId === shipment?._id).map(s => s._id);
  const [pickedSales, setPickedSales] = useState(currentLinkedIds);

  const toggleSale = (id) => {
    if (pickedSales.includes(id)) setPickedSales(pickedSales.filter(x => x !== id));
    else setPickedSales([...pickedSales, id]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{shipment ? 'Edit' : 'New'} Shipment</h3>
        <div className="form-row-2">
          <div className="form-row"><label>Date Shipped</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row"><label>Ref / Week ID</label><input value={form.ref} onChange={e=>setForm({...form, ref:e.target.value})} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Courier</label><select value={form.courier} onChange={e=>setForm({...form, courier:e.target.value})}><option>DHL</option><option>EMS</option><option>FedEx</option><option>Cargo</option></select></div>
          <div className="form-row"><label>Status</label><select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}><option>Preparing</option><option>Shipped</option><option>In Transit</option><option>Delivered</option></select></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Tracking #</label><input value={form.trackingNumber} onChange={e=>setForm({...form, trackingNumber:e.target.value})} /></div>
          <div className="form-row"><label>Shipping Cost (KRW)</label><input type="number" value={form.shippingCost} onChange={e=>setForm({...form, shippingCost:Number(e.target.value)})} /></div>
        </div>
        
        <div className="form-row">
          <label>Link Sales to this Shipment</label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--surface-2)', padding: '10px', borderRadius: '8px' }}>
            {sales.filter(s => !s.shipmentId || s.shipmentId === shipment?._id).map(s => (
              <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={pickedSales.includes(s._id)} onChange={() => toggleSale(s._id)} />
                {s.buyer} · {s.model} ({s.qty})
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form, pickedSales)}>Save Shipment</button>
        </div>
      </div>
    </div>
  );
};

export default Shipments;
