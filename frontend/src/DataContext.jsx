import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

const STORE_KEY = 'mobilex_v1';
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const defaultData = {
  inventory: [
    { _id: uid(), model: 'iPhone 15 Pro 256GB', brand: 'Apple', sku: 'IP15P-256', qty: 12, costPerUnit: 1650000, soldQty: 8, notes: 'Space Black' },
    { _id: uid(), model: 'Samsung S24 Ultra 512GB', brand: 'Samsung', sku: 'S24U-512', qty: 6, costPerUnit: 1420000, soldQty: 4, notes: '' },
  ],
  sales: [
    { _id: uid(), date: todayISO(), buyer: 'Ali Traders, Karachi', model: 'iPhone 15 Pro 256GB', qty: 8, pricePerUnit: 1820000, received: 0, notes: 'Pending hawala' },
  ],
  expenses: [
    { _id: uid(), date: todayISO(), category: 'Shipping', amount: 350000, note: 'DHL box to Karachi' },
    { _id: uid(), date: todayISO(), category: 'Packaging', amount: 45000, note: '' },
  ],
  cashflow: [
    { _id: uid(), date: todayISO(), type: 'in', amount: 2500000, source: 'Investor top-up', note: 'Initial capital' },
  ],
  hawala: [],
  investors: [
    { _id: uid(), name: 'Investor 1', contact: '', capitalPKR: 2000000, capital: 10000000, monthlyPayoutPKR: 60000, monthlyPayout: 300000, startDate: '2026-04-30', notes: '' },
    { _id: uid(), name: 'Investor 2', contact: '', capitalPKR: 1600000, capital: 8000000, monthlyPayoutPKR: 48000, monthlyPayout: 240000, startDate: '2026-04-30', notes: '' },
    { _id: uid(), name: 'Investor 3', contact: '', capitalPKR: 1000000, capital: 5000000, monthlyPayoutPKR: 30000, monthlyPayout: 150000, startDate: '2026-04-30', notes: '' },
    { _id: uid(), name: 'Investor 4', contact: '', capitalPKR: 1000000, capital: 5000000, monthlyPayoutPKR: 30000, monthlyPayout: 150000, startDate: '2026-04-30', notes: '' },
    { _id: uid(), name: 'Investor 5', contact: '', capitalPKR: 800000, capital: 4000000, monthlyPayoutPKR: 24000, monthlyPayout: 120000, startDate: '2026-04-30', notes: '' },
  ],
  payouts: [],
  ownerInvestments: [],
  activity: [],
  shipments: [],
  settings: { businessName: 'Mobile Hub', owner: '', users: {} }
};

export const DataProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (msg, onConfirm) => {
    setConfirmDialog({ msg, onConfirm });
  };

  const [data, setData] = useState(() => {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData;
    try {
      const parsed = JSON.parse(raw);
      for (const k in defaultData) if (!(k in parsed)) parsed[k] = defaultData[k];
      return parsed;
    } catch (e) {
      return defaultData;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }, [data]);

  const logActivity = (action, entity, detail, amount = null) => {
    const newAct = {
      at: new Date().toISOString(),
      user: localStorage.getItem('mobile_hub_user') || 'system',
      action,
      entity,
      detail,
      amount
    };
    setData(prev => ({
      ...prev,
      activity: [...prev.activity, newAct].slice(-1000)
    }));
  };


  const addItem = (key, obj) => {
    const newObj = { ...obj, _id: uid() };
    setData(prev => ({
      ...prev,
      [key]: [...prev[key], newObj]
    }));
    logActivity('create', key, obj.model || obj.buyer || obj.category || obj.name || 'item', obj.amount || (obj.qty * (obj.pricePerUnit || obj.costPerUnit)) || null);
    showToast('Saved successfully');
    return newObj;
  };

  const updateItem = (key, id, obj) => {
    setData(prev => ({
      ...prev,
      [key]: prev[key].map(item => item._id === id ? { ...item, ...obj } : item)
    }));
    logActivity('update', key, obj.model || obj.buyer || obj.category || obj.name || 'item');
    showToast('Updated successfully');
  };

  const deleteItem = (key, id) => {
    showConfirm('Are you sure you want to delete this record?', () => {
      const itemToDelete = data[key].find(i => i._id === id);
      setData(prev => ({
        ...prev,
        [key]: prev[key].filter(item => item._id !== id)
      }));
      logActivity('delete', key, itemToDelete?.model || itemToDelete?.buyer || itemToDelete?.category || itemToDelete?.name || 'item');
      showToast('Deleted successfully', 'danger');
    });
  };


  const addInventory = (obj) => addItem('inventory', obj);
  const updateInventory = (id, obj) => updateItem('inventory', id, obj);
  const deleteInventory = (id) => deleteItem('inventory', id);

  const addSale = (obj) => {
    const res = addItem('sales', obj);

    setData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.model === obj.model ? { ...i, soldQty: (i.soldQty || 0) + obj.qty } : i)
    }));
    return res;
  };
  const updateSale = (id, obj) => {
    const prev = data.sales.find(s => s._id === id);
    if (prev) {
      setData(prevData => ({
        ...prevData,
        inventory: prevData.inventory.map(i => {
          if (i.model === prev.model) return { ...i, soldQty: Math.max(0, i.soldQty - prev.qty) };
          return i;
        })
      }));
    }
    updateItem('sales', id, obj);
    setData(prevData => ({
      ...prevData,
      inventory: prevData.inventory.map(i => {
        if (i.model === obj.model) return { ...i, soldQty: (i.soldQty || 0) + obj.qty };
        return i;
      })
    }));
  };
  const deleteSale = (id) => {
    const s = data.sales.find(x => x._id === id);
    if (s) {
      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.model === s.model ? { ...i, soldQty: Math.max(0, i.soldQty - s.qty) } : i)
      }));
    }
    deleteItem('sales', id);
  };

  const addExpense = (obj) => addItem('expenses', obj);
  const updateExpense = (id, obj) => updateItem('expenses', id, obj);
  const deleteExpense = (id) => deleteItem('expenses', id);

  const addHawala = (obj) => addItem('hawala', obj);
  const updateHawala = (id, obj) => updateItem('hawala', id, obj);
  const deleteHawala = (id) => deleteItem('hawala', id);

  const addInvestor = (obj) => addItem('investors', obj);
  const updateInvestor = (id, obj) => updateItem('investors', id, obj);
  const deleteInvestor = (id) => deleteItem('investors', id);

  const addPayout = (obj) => addItem('payouts', obj);
  const updatePayout = (id, obj) => updateItem('payouts', id, obj);
  const deletePayout = (id) => deleteItem('payouts', id);

  const addShipment = (obj) => addItem('shipments', obj);
  const updateShipment = (id, obj) => updateItem('shipments', id, obj);
  const deleteShipment = (id) => deleteItem('shipments', id);

  const addOwnerInvestment = (obj) => addItem('ownerInvestments', obj);
  const updateOwnerInvestment = (id, obj) => updateItem('ownerInvestments', id, obj);
  const deleteOwnerInvestment = (id) => deleteItem('ownerInvestments', id);

  const addCashflow = (obj) => addItem('cashflow', obj);
  const updateCashflow = (id, obj) => updateItem('cashflow', id, obj);
  const deleteCashflow = (id) => deleteItem('cashflow', id);

  // SYNC WITH BACKEND
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, sls, exp, cf, hw, invs, pay, oi, ship, act, set] = await Promise.all([
          fetch('/api/inventory').then(r => r.json()),
          fetch('/api/sales').then(r => r.json()),
          fetch('/api/expenses').then(r => r.json()),
          fetch('/api/cashflow').then(r => r.json()),
          fetch('/api/hawala').then(r => r.json()),
          fetch('/api/investors').then(r => r.json()),
          fetch('/api/payouts').then(r => r.json()),
          fetch('/api/owner-investment').then(r => r.json()),
          fetch('/api/shipments').then(r => r.json()),
          fetch('/api/activity').then(r => r.json()),
          fetch('/api/settings').then(r => r.json())
        ]);

        setData({
          inventory: inv,
          sales: sls,
          expenses: exp,
          cashflow: cf,
          hawala: hw,
          investors: invs,
          payouts: pay,
          ownerInvestments: oi,
          shipments: ship,
          activity: act,
          settings: set
        });
      } catch (err) {
        console.error('Initial fetch error:', err);
      }
    };
    fetchData();
    // Refresh every 30 seconds to keep devices in sync
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateSettings = async (obj) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      const updated = await response.json();
      setData(prev => ({ ...prev, settings: updated }));
      logActivity('update', 'settings', 'Business settings updated');
    } catch (err) {
      console.error('Update settings error:', err);
      showToast('Failed to save settings to server', 'danger');
    }
  };

  const wipeAllData = async () => {
    try {
      await fetch('/api/reset-all', { method: 'POST' });
      setData(prev => ({
        ...prev,
        inventory: [], sales: [], expenses: [], cashflow: [],
        activity: [], payouts: [], ownerInvestments: [], shipments: [], hawala: []
      }));
      showToast('All business data has been wiped from server.', 'danger');
    } catch (err) {
      showToast('Reset failed', 'danger');
    }
  };

  const value = {
    data, loading,
    addInventory, updateInventory, deleteInventory,
    addSale, updateSale, deleteSale,
    addExpense, updateExpense, deleteExpense,
    addHawala, updateHawala, deleteHawala,
    addInvestor, updateInvestor, deleteInvestor,
    addPayout, updatePayout, deletePayout,
    addShipment, updateShipment, deleteShipment,
    addOwnerInvestment, updateOwnerInvestment, deleteOwnerInvestment,
    addCashflow, updateCashflow, deleteCashflow,
    updateSettings, logActivity, clearActivity, wipeAllData,
    showToast, showConfirm
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      
      {toast && (
        <div className="custom-toast" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: toast.type === 'danger' ? 'var(--red)' : 'var(--teal)',
          color: '#fff',
          padding: '20px 40px',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          zIndex: 9999,
          fontWeight: 'bold',
          fontSize: '18px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      {confirmDialog && (
        <div className="backdrop show" style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>{confirmDialog.msg}</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
