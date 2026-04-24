import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { DataProvider, useData } from './DataContext';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Cashflow from './pages/Cashflow';
import Hawala from './pages/Hawala';
import Investors from './pages/Investors';
import Payouts from './pages/Payouts';
import Settings from './pages/Settings';

const Sidebar = ({ menuOpen, setMenuOpen }) => {
  return (
    <>
      <div className={`backdrop ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}></div>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">MH</div>
          <div>
            <div className="brand-title">Mobile Hub</div>
            <div className="brand-sub">Korea → Pakistan Exports</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/inventory" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">📦</span> Inventory
          </NavLink>
          <NavLink to="/sales" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">💼</span> Sales / Shipments
          </NavLink>
          <NavLink to="/expenses" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">💸</span> Expenses
          </NavLink>
          <NavLink to="/cashflow" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">💵</span> Cash In / Out
          </NavLink>
          <NavLink to="/hawala" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">🔁</span> Hawala Log
          </NavLink>
          <NavLink to="/investors" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">👥</span> Investors
          </NavLink>
          <NavLink to="/payouts" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">📅</span> Investor Payouts
          </NavLink>
          <NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon">⚙️</span> Settings / Backup
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useData();

  return (
    <div className="app">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
            <div>
              <h1 className="page-title" id="pageTitle">Mobile Hub</h1>
              <div className="page-sub" id="pageSub">Overview of your business</div>
            </div>
          </div>
          <div className="right" id="pageActions"></div>
        </div>
        <div id="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/cashflow" element={<Cashflow />} />
            <Route path="/hawala" element={<Hawala />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
