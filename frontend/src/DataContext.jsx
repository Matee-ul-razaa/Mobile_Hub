import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

const STORE_KEY = 'mobilex_v1';
const AUTH_TOKEN_KEY = 'mobile_hub_token';

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
  buyerPayments: [],
  settings: { businessName: 'Mobile Hub', owner: '', users: {} }
};

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const DataProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (msg, onConfirm) => setConfirmDialog({ msg, onConfirm });

  const [data, setData] = useState(() => {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData;
    try {
      const parsed = JSON.parse(raw);
      for (const k in defaultData) if (!(k in parsed)) parsed[k] = defaultData[k];
      return parsed;
    } catch (_e) {
      return defaultData;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }, [data]);

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
      buyerPayments: 'buyer-payments',
      activity: 'activity'
    };
    return map[key] || key;
  };

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {})
      }
    });
    let payload = null;
    try { payload = await response.json(); } catch (_e) { payload = null; }
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('mobile_hub_user');
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.dispatchEvent(new Event('mobilehub-auth-expired'));
      }
      throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`);
    }
    return payload;
  }, []);

  const fetchData = useCallback(async () => {
    if (!getAuthToken()) return;
    setLoading(true);
    try {
      const fetchSafe = async (url) => {
        try { return await request(url); } catch (err) { console.warn(`[MobileHub] Fetch ${url} failed:`, err.message); return null; }
      };

      const [inv, sls, exp, cf, hw, invs, pay, oi, ship, bp, act, set] = await Promise.all([
        fetchSafe('/api/inventory'),
        fetchSafe('/api/sales'),
        fetchSafe('/api/expenses'),
        fetchSafe('/api/cashflow'),
        fetchSafe('/api/hawala'),
        fetchSafe('/api/investors'),
        fetchSafe('/api/payouts'),
        fetchSafe('/api/owner-investment'),
        fetchSafe('/api/shipments'),
        fetchSafe('/api/buyer-payments'),
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
        buyerPayments: bp !== null ? bp : prev.buyerPayments,
        activity: act !== null ? act : prev.activity,
        settings: (set !== null && set.businessName) ? set : prev.settings
      }));
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const onAuth = () => fetchData();
    window.addEventListener('mobilehub-auth-changed', onAuth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mobilehub-auth-changed', onAuth);
    };
  }, [fetchData]);

  const logActivity = useCallback(async (action, entity, detail, amount = null) => {
    const newAct = {
      at: new Date().toISOString(),
      user: localStorage.getItem('mobile_hub_user') || 'system',
      action,
      entity,
      detail,
      amount
    };
    setData(prev => ({ ...prev, activity: [...(prev.activity || []), newAct].slice(-1000) }));

    if (getAuthToken()) {
      try {
        await request('/api/activity', { method: 'POST', body: JSON.stringify(newAct) });
      } catch (_err) {
        // Keep local log even if server activity write fails.
      }
    }
  }, [request]);

  const addItem = async (key, obj) => {
    try {
      const newObj = await request(`/api/${getPath(key)}`, { method: 'POST', body: JSON.stringify(obj) });
      setData(prev => ({ ...prev, [key]: [...(prev[key] || []), newObj] }));
      logActivity('create', key, obj.modelName || obj.model || obj.buyer || obj.category || obj.name || 'item', obj.amount || obj.purchasePrice || obj.amountKRW || (obj.qty * (obj.pricePerUnit || obj.costPerUnit || 0)) || null);
      if (['sales', 'hawala', 'inventory'].includes(key)) fetchData();
      showToast('Entry saved successfully');
      return newObj;
    } catch (err) {
      showToast(err.message || 'Failed to save to cloud', 'danger');
      throw err;
    }
  };

  const updateItem = async (key, id, obj) => {
    try {
      const updated = await request(`/api/${getPath(key)}/${id}`, { method: 'PUT', body: JSON.stringify(obj) });
      setData(prev => ({ ...prev, [key]: (prev[key] || []).map(item => item._id === id ? updated : item) }));
      logActivity('update', key, obj.modelName || obj.model || obj.buyer || obj.category || obj.name || 'item');
      if (['sales', 'hawala', 'inventory'].includes(key)) fetchData();
      showToast('Entry updated successfully');
      return updated;
    } catch (err) {
      showToast(err.message || 'Update failed', 'danger');
      throw err;
    }
  };

  const deleteItem = async (key, id) => {
    showConfirm(`Delete this ${key.slice(0, -1)}?`, async () => {
      try {
        await request(`/api/${getPath(key)}/${id}`, { method: 'DELETE' });
        setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(item => item._id !== id) }));
        logActivity('delete', key, id);
        if (['sales', 'hawala', 'inventory'].includes(key)) fetchData();
        showToast('Entry deleted successfully');
      } catch (err) {
        showToast(err.message || 'Delete failed', 'danger');
      }
    });
  };

  const addInventory = (obj) => addItem('inventory', obj);
  const updateInventory = (id, obj) => updateItem('inventory', id, obj);
  const deleteInventory = (id) => deleteItem('inventory', id);

  const addSale = (obj) => addItem('sales', obj);
  const updateSale = (id, obj) => updateItem('sales', id, obj);
  const deleteSale = (id) => deleteItem('sales', id);

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

  const addBuyerPayment = (obj) => addItem('buyerPayments', obj);
  const updateBuyerPayment = (id, obj) => updateItem('buyerPayments', id, obj);
  const deleteBuyerPayment = (id) => deleteItem('buyerPayments', id);

  const updateSettings = async (obj) => {
    try {
      const updated = await request('/api/settings', { method: 'PUT', body: JSON.stringify(obj) });
      setData(prev => ({ ...prev, settings: updated }));
      await logActivity('update', 'settings', 'Business settings updated');
      showToast('Settings saved');
      return updated;
    } catch (err) {
      showToast(err.message || 'Failed to save settings to server', 'danger');
      throw err;
    }
  };

  const restoreData = async (imported) => {
    try {
      await request('/api/restore-data', { method: 'POST', body: JSON.stringify(imported) });
      setData({ ...defaultData, ...imported });
      await fetchData();
      showToast('Data restored successfully!');
    } catch (err) {
      showToast(err.message || 'Restore failed', 'danger');
      throw err;
    }
  };

  const wipeAllData = async () => {
    try {
      await request('/api/reset-all', { method: 'POST' });
      setData(prev => ({
        ...prev,
        inventory: [], sales: [], expenses: [], cashflow: [],
        activity: [], payouts: [], ownerInvestments: [], shipments: [], hawala: [], buyerPayments: []
      }));
      showToast('All business data has been wiped from server.', 'danger');
    } catch (err) {
      showToast(err.message || 'Reset failed', 'danger');
    }
  };

  const clearActivity = async () => {
    showConfirm('Clear all activity logs? This cannot be undone.', async () => {
      try {
        await request('/api/activity', { method: 'DELETE' });
        setData(prev => ({ ...prev, activity: [] }));
        showToast('Activity logs cleared');
      } catch (err) {
        showToast(err.message || 'Failed to clear logs', 'danger');
      }
    });
  };

  const value = {
    data, loading, refreshData: fetchData,
    addInventory, updateInventory, deleteInventory,
    addSale, updateSale, deleteSale,
    addExpense, updateExpense, deleteExpense,
    addHawala, updateHawala, deleteHawala,
    addInvestor, updateInvestor, deleteInvestor,
    addPayout, updatePayout, deletePayout,
    addShipment, updateShipment, deleteShipment,
    addOwnerInvestment, updateOwnerInvestment, deleteOwnerInvestment,
    addCashflow, updateCashflow, deleteCashflow,
    addBuyerPayment, updateBuyerPayment, deleteBuyerPayment,
    updateSettings, restoreData, logActivity, clearActivity, wipeAllData,
    showToast, showConfirm
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      {toast && (
        <div className="custom-toast" style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toast.type === 'danger' ? 'var(--red)' : 'var(--green)', color: '#fff',
          padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 9999, fontWeight: '600', fontSize: '15px', animation: 'fadeIn 0.2s ease-out'
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
              <button className="btn btn-danger" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
