import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Cashflow from './pages/Cashflow';
import Hawala from './pages/Hawala';
import Investors from './pages/Investors';
import MyInvestment from './pages/MyInvestment';
import Payouts from './pages/Payouts';
import Shipments from './pages/Shipments';
import AIAssistant from './pages/AIAssistant';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Capital from './pages/CapitalProfit';

function App() {
  const [user, setUser] = useState(localStorage.getItem('mobile_hub_user'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, location.pathname, navigate]);

  const handleLogin = (u) => {
    setUser(u);
    navigate('/');
  };

  const handleLogout = () => {
    if (window.confirm('Sign out?')) {
      localStorage.removeItem('mobile_hub_user');
      setUser(null);
      navigate('/login');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (!user && location.pathname === '/login') {
    return <Login onLogin={handleLogin} />;
  }

  if (!user) return null;

  const initial = user[0].toUpperCase();
  const avatarClass = user === 'nadeem' ? 'n' : 'b';
  const fullName = user === 'nadeem' ? 'Nadeem' : 'Bilawal';

  return (
    <div className="app-layout">
      {isMenuOpen && <div className="backdrop show" onClick={() => setIsMenuOpen(false)}></div>}
      
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">MH</div>
          <div>
            <div className="brand-title">Mobile Hub</div>
            <div className="brand-sub">Korea → Pakistan Exports</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📦</span> Inventory
          </NavLink>
          <NavLink to="/sales" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">💼</span> Sales
          </NavLink>
          <NavLink to="/shipments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📮</span> Shipments
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">💸</span> Expenses
          </NavLink>
          <NavLink to="/cashflow" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">💵</span> Cash In / Out
          </NavLink>
          <NavLink to="/fazi-cash" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">🔁</span> Fazi Cash
          </NavLink>
          <NavLink to="/investors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">👥</span> Investors
          </NavLink>
          <NavLink to="/owner-investment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">🧑‍💼</span> My Investment
          </NavLink>
          <NavLink to="/payouts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📅</span> Investor Payouts
          </NavLink>
          <NavLink to="/capital" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📈</span> Capital & Profit
          </NavLink>
          <NavLink to="/ai-assistant" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">🤖</span> AI Assistant
          </NavLink>
          <NavLink to="/activity-log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">📝</span> Activity Log
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <span className="icon">⚙️</span> Settings / Backup
          </NavLink>
        </nav>

        <div className="user-chip">
          <div className={`avatar ${avatarClass}`}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="u-name">{fullName}</div>
            <div className="u-role">Admin</div>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="page-body">
        <Routes>
          <Route path="/" element={<Dashboard toggleMenu={toggleMenu} />} />
          <Route path="/inventory" element={<Inventory toggleMenu={toggleMenu} />} />
          <Route path="/sales" element={<Sales toggleMenu={toggleMenu} />} />
          <Route path="/expenses" element={<Expenses toggleMenu={toggleMenu} />} />
          <Route path="/cashflow" element={<Cashflow toggleMenu={toggleMenu} />} />
          <Route path="/fazi-cash" element={<Hawala toggleMenu={toggleMenu} />} />
          <Route path="/investors" element={<Investors toggleMenu={toggleMenu} />} />
          <Route path="/owner-investment" element={<MyInvestment toggleMenu={toggleMenu} />} />
          <Route path="/payouts" element={<Payouts toggleMenu={toggleMenu} />} />
          <Route path="/shipments" element={<Shipments toggleMenu={toggleMenu} />} />
          <Route path="/ai-assistant" element={<AIAssistant toggleMenu={toggleMenu} />} />
          <Route path="/activity-log" element={<ActivityLog toggleMenu={toggleMenu} />} />
          <Route path="/settings" element={<Settings toggleMenu={toggleMenu} />} />
          <Route path="/capital" element={<Capital toggleMenu={toggleMenu} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
