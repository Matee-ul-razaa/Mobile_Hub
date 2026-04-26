import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetcher } from './api';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    inventory: [],
    sales: [],
    expenses: [],
    cashflow: [],
    hawala: [],
    investors: [],
    payouts: [],
    ownerInvestment: [],
    shipments: [],
    activity: [],
    settings: { businessName: 'Mobile Hub', owner: '', users: {} }
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [inv, sls, exp, cf, hw, invs, po, set, own, shp, act] = await Promise.all([
        fetcher('/inventory'),
        fetcher('/sales'),
        fetcher('/expenses'),
        fetcher('/cashflow'),
        fetcher('/hawala'),
        fetcher('/investors'),
        fetcher('/payouts'),
        fetcher('/settings'),
        fetcher('/owner-investment'),
        fetcher('/shipments'),
        fetcher('/activity'),
      ]);
      setData({
        inventory: Array.isArray(inv) ? inv : [],
        sales: Array.isArray(sls) ? sls : [],
        expenses: Array.isArray(exp) ? exp : [],
        cashflow: Array.isArray(cf) ? cf : [],
        hawala: Array.isArray(hw) ? hw : [],
        investors: Array.isArray(invs) ? invs : [],
        payouts: Array.isArray(po) ? po : [],
        ownerInvestment: Array.isArray(own) ? own : [],
        shipments: Array.isArray(shp) ? shp : [],
        activity: Array.isArray(act) ? act : [],
        settings: set && typeof set === 'object' ? set : { businessName: 'Mobile Hub', owner: '', users: {} }
      });
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const value = { data, loadAll };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
