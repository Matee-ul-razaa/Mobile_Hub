import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STORE_KEY = 'mobilex_v1';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayISO = () => new Date().toISOString().slice(0,10);

const defaultData = {
  inventory: [
    {_id:uid(), model:'iPhone 15 Pro 256GB', brand:'Apple', sku:'IP15P-256', qty:12, costPerUnit:1650000, soldQty:8, notes:'Space Black'},
    {_id:uid(), model:'Samsung S24 Ultra 512GB', brand:'Samsung', sku:'S24U-512', qty:6, costPerUnit:1420000, soldQty:4, notes:''},
  ],
  sales: [
    {_id:uid(), date:todayISO(), buyer:'Ali Traders, Karachi', model:'iPhone 15 Pro 256GB', qty:8, pricePerUnit:1820000, received:0, notes:'Pending hawala'},
  ],
  expenses: [
    {_id:uid(), date:todayISO(), category:'Shipping', amount:350000, note:'DHL box to Karachi'},
    {_id:uid(), date:todayISO(), category:'Packaging', amount:45000, note:''},
  ],
  cashflow: [
    {_id:uid(), date:todayISO(), type:'in', amount:2500000, source:'Investor top-up', note:'Initial capital'},
  ],
  hawala: [],
  investors: [
    {_id:uid(), name:'Investor 1', contact:'', capitalPKR:2000000, capital:10000000, monthlyPayoutPKR:60000, monthlyPayout:300000, startDate:todayISO(), notes:''},
    {_id:uid(), name:'Investor 2', contact:'', capitalPKR:1600000, capital:8000000,  monthlyPayoutPKR:48000, monthlyPayout:240000, startDate:todayISO(), notes:''},
    {_id:uid(), name:'Investor 3', contact:'', capitalPKR:1000000, capital:5000000,  monthlyPayoutPKR:30000, monthlyPayout:150000, startDate:todayISO(), notes:''},
    {_id:uid(), name:'Investor 4', contact:'', capitalPKR:1000000, capital:5000000,  monthlyPayoutPKR:30000, monthlyPayout:150000, startDate:todayISO(), notes:''},
    {_id:uid(), name:'Investor 5', contact:'', capitalPKR:800000,  capital:4000000,  monthlyPayoutPKR:24000, monthlyPayout:120000, startDate:todayISO(), notes:''},
  ],
  payouts: [],
  settings: { businessName: 'Mobile Hub', owner: '' }
};

function normalize(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(o => { if (o && o.id && !o._id) o._id = o.id; });
  }
  return obj;
}

function readLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultData));
    const parsed = JSON.parse(raw);
    for(const k in defaultData) {
      if(!(k in parsed)) parsed[k] = defaultData[k];
      else normalize(parsed[k]);
    }
    return parsed;
  } catch(e) { return JSON.parse(JSON.stringify(defaultData)); }
}

function writeLocal(d) {
  localStorage.setItem(STORE_KEY, JSON.stringify(d));
}

function getCollection(url) {
  const table = url.replace('/','').split('/')[0];
  return table;
}

const fetcher = async (url) => {
  try {
    const res = await axios.get(`${API_URL}${url}`);
    if (typeof res.data === 'string' && res.data.startsWith('<html')) throw new Error('API returned HTML via SPA fallback');
    return res.data;
  } catch (err) {
    const data = readLocal();
    const table = getCollection(url);
    if(table === 'settings') return data.settings;
    return data[table] || [];
  }
};

const poster = async (url, payload) => {
  try {
    const res = await axios.post(`${API_URL}${url}`, payload);
    return res.data;
  } catch (err) {
    const data = readLocal();
    const table = getCollection(url);
    if(!payload._id) payload._id = uid();
    if(data[table]) data[table].push(payload);
    
    // Inventory Sync Fallback
    if (table === 'sales') {
      const inv = data.inventory.find(i => i.model === payload.model);
      if (inv) inv.soldQty = (inv.soldQty || 0) + Number(payload.qty || 0);
    }
    
    writeLocal(data);
    return payload;
  }
};

const putter = async (url, payload) => {
  try {
    const res = await axios.put(`${API_URL}${url}`, payload);
    return res.data;
  } catch (err) {
    const data = readLocal();
    const table = getCollection(url);
    const id = url.split('/')[2];
    if (table === 'settings') {
      data.settings = payload;
    } else if (data[table]) {
      const idx = data[table].findIndex(x => x._id === id || x.id === id);
      if(idx > -1) {
        const old = JSON.parse(JSON.stringify(data[table][idx]));
        Object.assign(data[table][idx], payload);
        
        // Inventory Sync Fallback
        if (table === 'sales') {
          if (old.model === payload.model) {
            const diff = Number(payload.qty || 0) - Number(old.qty || 0);
            const inv = data.inventory.find(i => i.model === payload.model);
            if (inv) inv.soldQty = (inv.soldQty || 0) + diff;
          } else {
            const oldInv = data.inventory.find(i => i.model === old.model);
            if (oldInv) oldInv.soldQty = (oldInv.soldQty || 0) - Number(old.qty || 0);
            const newInv = data.inventory.find(i => i.model === payload.model);
            if (newInv) newInv.soldQty = (newInv.soldQty || 0) + Number(payload.qty || 0);
          }
        }
      }
    }
    writeLocal(data);
    return payload;
  }
};

const deleter = async (url) => {
  try {
    const res = await axios.delete(`${API_URL}${url}`);
    return res.data;
  } catch (err) {
    const data = readLocal();
    const table = getCollection(url);
    const id = url.split('/')[2];
    if (data[table]) {
      const item = data[table].find(x => x._id === id || x.id === id);
      if (item && table === 'sales') {
        const inv = data.inventory.find(i => i.model === item.model);
        if (inv) inv.soldQty = (inv.soldQty || 0) - Number(item.qty || 0);
      }
      data[table] = data[table].filter(x => x._id !== id && x.id !== id);
    }
    writeLocal(data);
    return { message: 'Deleted' };
  }
};

export { API_URL, fetcher, poster, putter, deleter };
