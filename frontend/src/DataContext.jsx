import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

const STORE_KEY = 'mobilex_v1';
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const defaultData = {
  inventory: [],
  sales: [],
  expenses: [],
  cashflow: [],
  hawala: [],
  investors: [],
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


  const getPath = (key) => {
    const map = {
      inventory: 'inventory',
      sales: 'sales',
      expenses: 'expenses',
      cashflow: 'cashflow',
      hawala: 'hawala',
      investors: 'investors',
      payouts: 'payouts',
      ownerInvestments: 'owner-investment',
      shipments: 'shipments',
      activity: 'activity'
    };
    return map[key] || key;
  };

  const addItem = async (key, obj) => {
    try {
      const response = await fetch(`/api/${getPath(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      const newObj = await response.json();
      setData(prev => ({
        ...prev,
        [key]: [...prev[key], newObj]
      }));
      logActivity('create', key, obj.model || obj.buyer || obj.category || obj.name || 'item', obj.amount || (obj.qty * (obj.pricePerUnit || obj.costPerUnit)) || null);
      showToast('Saved to cloud');
      return newObj;
    } catch (err) {
      showToast('Failed to save to cloud', 'danger');
    }
  };

  const updateItem = async (key, id, obj) => {
    try {
      const response = await fetch(`/api/${getPath(key)}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      const updated = await response.json();
      setData(prev => ({
        ...prev,
        [key]: prev[key].map(item => item._id === id ? updated : item)
      }));
      logActivity('update', key, obj.model || obj.buyer || obj.category || obj.name || 'item');
      showToast('Updated on cloud');
    } catch (err) {
      showToast('Update failed', 'danger');
    }
  };

  const deleteItem = async (key, id) => {
    showConfirm(`Delete this ${key.slice(0, -1)}?`, async () => {
      try {
        await fetch(`/api/${getPath(key)}/${id}`, { method: 'DELETE' });
        setData(prev => ({
          ...prev,
          [key]: prev[key].filter(item => item._id !== id)
        }));
        logActivity('delete', key, id);
        showToast('Deleted from cloud');
      } catch (err) {
        showToast('Delete failed', 'danger');
      }
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
        const fetchSafe = async (url) => {
          try {
            const r = await fetch(url);
            if (!r.ok) return null; // Error
            return await r.json();
          } catch (e) { return null; }
        };

        const [inv, sls, exp, cf, hw, invs, pay, oi, ship, act, set] = await Promise.all([
          fetchSafe('/api/inventory'),
          fetchSafe('/api/sales'),
          fetchSafe('/api/expenses'),
          fetchSafe('/api/cashflow'),
          fetchSafe('/api/hawala'),
          fetchSafe('/api/investors'),
          fetchSafe('/api/payouts'),
          fetchSafe('/api/owner-investment'),
          fetchSafe('/api/shipments'),
          fetchSafe('/api/activity'),
          fetchSafe('/api/settings')
        ]);

        setData(prev => ({
          ...prev,
          inventory: inv !== null ? inv : prev.inventory,
          sales: sls !== null ? sls : prev.sales,
          expenses: exp !== null ? exp : prev.expenses,
          cashflow: cf !== null ? cf : prev.cashflow,
          hawala: hw !== null ? hw : prev.hawala,
          investors: invs !== null ? invs : prev.investors,
          payouts: pay !== null ? pay : prev.payouts,
          ownerInvestments: oi !== null ? oi : prev.ownerInvestments,
          shipments: ship !== null ? ship : prev.shipments,
          activity: act !== null ? act : prev.activity,
          settings: (set !== null && set.businessName) ? set : prev.settings
        }));
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

  const clearActivity = async () => {
    showConfirm('Clear all activity logs? This cannot be undone.', async () => {
      try {
        await fetch('/api/activity', { method: 'DELETE' });
        setData(prev => ({ ...prev, activity: [] }));
        showToast('Activity logs cleared');
      } catch (err) {
        showToast('Failed to clear logs', 'danger');
      }
    });
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
