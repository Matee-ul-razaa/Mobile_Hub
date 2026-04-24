import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetcher, putter, poster, deleter } from './api';

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
    settings: { businessName: 'Mobile Hub', owner: '' }
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [inv, sls, exp, cf, hw, invs, po, set] = await Promise.all([
        fetcher('/inventory'),
        fetcher('/sales'),
        fetcher('/expenses'),
        fetcher('/cashflow'),
        fetcher('/hawala'),
        fetcher('/investors'),
        fetcher('/payouts'),
        fetcher('/settings'),
      ]);
      setData({
        inventory: inv,
        sales: sls,
        expenses: exp,
        cashflow: cf,
        hawala: hw,
        investors: invs,
        payouts: po,
        settings: set
      });
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      // Fallback
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
