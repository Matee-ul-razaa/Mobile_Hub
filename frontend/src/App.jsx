import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import Cashflow from './pages/Cashflow';

const SidebarLink = ({ to, label, icon }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      <span className="icon">{icon}</span> {label}
    </Link>
  );
};

const Layout = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      <div className={`backdrop ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}></div>
      
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-circ">MH</div>
          <div className="logo-txt">
            <div className="biz-name">Mobile Hub</div>
            <div className="biz-sub">Korea ➞ Pakistan Exports</div>
          </div>
        </div>

        <nav className="nav">
          <SidebarLink to="/" label="Dashboard" icon="📊" />
          <SidebarLink to="/inventory" label="Inventory" icon="📦" />
          <SidebarLink to="/sales" label="Sales" icon="💼" />
          <SidebarLink to="/shipments" label="Shipments" icon="📮" />
          <SidebarLink to="/expenses" label="Expenses" icon="💸" />
          <SidebarLink to="/cashflow" label="Cash In / Out" icon="💵" />
          <SidebarLink to="/fazi-cash" label="Fazi Cash" icon="🔁" />
          <SidebarLink to="/investors" label="Investors" icon="👥" />
          <SidebarLink to="/my-investment" label="My Investment" icon="🧑‍💼" />
          <SidebarLink to="/payouts" label="Investor Payouts" icon="📅" />
          <SidebarLink to="/capital-profit" label="Capital & Profit" icon="📈" />
          <SidebarLink to="/ai-assistant" label="AI Assistant" icon="🤖" />
          <SidebarLink to="/activity-log" label="Activity Log" icon="📝" />
          <SidebarLink to="/settings" label="Settings / Backup" icon="⚙️" />
        </nav>

        <div className="user-chip">
          <div className={`avatar ${user}`}>{(user||'N')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="u-name">{user === 'nadeem' ? 'Nadeem' : 'Bilawal'}</div>
            <div className="u-role">Admin</div>
          </div>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="page-body">
        <Routes>
          <Route path="/" element={<Dashboard toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/inventory" element={<Inventory toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/sales" element={<Sales toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/shipments" element={<Shipments toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/expenses" element={<Expenses toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/cashflow" element={<Cashflow toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/fazi-cash" element={<Hawala toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/investors" element={<Investors toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/my-investment" element={<MyInvestment toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/payouts" element={<Payouts toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/capital-profit" element={<CapitalProfit toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/ai-assistant" element={<AIAssistant toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/activity-log" element={<ActivityLog toggleMenu={() => setMenuOpen(!menuOpen)} />} />
          <Route path="/settings" element={<Settings toggleMenu={() => setMenuOpen(!menuOpen)} />} />
        </Routes>
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
