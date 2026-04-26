import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useData } from './DataContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Hawala from './pages/Hawala';
import Investors from './pages/Investors';
import MyInvestment from './pages/MyInvestment';
import Payouts from './pages/Payouts';
import CapitalProfit from './pages/CapitalProfit';
import Shipments from './pages/Shipments';
import ActivityLog from './pages/ActivityLog';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Login from './pages/Login';

const SidebarLink = ({ to, label, icon }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-txt">{label}</span>
    </Link>
  );
};

const Layout = ({ user, onLogout }) => {
  const { data } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    if (path === 'cash-in-out') return 'Cash In / Out';
    return path.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${menuOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-circ">MH</div>
          <div className="logo-txt">
            <div className="biz-name">Mobile Hub</div>
            <div className="biz-sub">Korea ➞ Pakistan Exports</div>
          </div>
        </div>

        <div className="user-chip">
          <div className={`avatar ${user==='nadeem'?'n':'b'}`}>{user[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div className="user-name">{user==='nadeem'?'Nadeem':'Bilawal'}</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>

        <nav className="nav-list">
          <SidebarLink to="/" label="Dashboard" icon="📊" />
          <SidebarLink to="/inventory" label="Inventory" icon="📦" />
          <SidebarLink to="/sales" label="Sales" icon="🤝" />
          <SidebarLink to="/shipments" label="Shipments" icon="🚢" />
          <SidebarLink to="/expenses" label="Expenses" icon="💸" />
          <SidebarLink to="/cash-in-out" label="Cash In / Out" icon="💰" />
          <SidebarLink to="/fazi-cash" label="Fazi Cash" icon="🏦" />
          <SidebarLink to="/investors" label="Investors" icon="👥" />
          <SidebarLink to="/my-investment" label="My Investment" icon="👤" />
          <SidebarLink to="/payouts" label="Investor Payouts" icon="💳" />
          <SidebarLink to="/capital-profit" label="Capital & Profit" icon="📈" />
          <SidebarLink to="/ai-assistant" label="AI Assistant" icon="✨" />
          <SidebarLink to="/activity-log" label="Activity Log" icon="📋" />
          <SidebarLink to="/settings" label="Settings / Backup" icon="⚙️" />
        </nav>
      </aside>

      <main className="content-wrap">
        <header className="top-bar">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div style={{ flex: 1 }}>
            <h2 className="current-title">{getTitle()}</h2>
          </div>
          <div className="top-actions">
            <button className="theme-toggle" onClick={() => document.documentElement.classList.toggle('dark')}>🌓</button>
            <button className="btn btn-sm btn-outline" style={{ borderRadius:'8px', marginLeft:'12px' }} onClick={onLogout}>🕒 Sign out</button>
          </div>
        </header>
        <div className="page-body">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/cash-in-out" element={<Hawala />} />
            <Route path="/fazi-cash" element={<Hawala />} />
            <Route path="/capital-profit" element={<CapitalProfit />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/my-investment" element={<MyInvestment />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('mobile_hub_user'));

  const handleLogout = () => {
    localStorage.removeItem('mobile_hub_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout} />
    </Router>
  );
};

export default App;
