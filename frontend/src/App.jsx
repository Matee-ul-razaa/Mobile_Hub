import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
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
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('mobile_hub_token');
    const savedUser = localStorage.getItem('mobile_hub_user');
    return (token && savedUser) ? savedUser : null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logActivity, showConfirm } = useData();

  // Listen for auth expiration (real 401 from backend)
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem('mobile_hub_user');
      localStorage.removeItem('mobile_hub_token');
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('mobilehub-auth-expired', handleExpired);
    return () => window.removeEventListener('mobilehub-auth-expired', handleExpired);
  }, [navigate]);

  // Redirect to login only if genuinely not authenticated
  useEffect(() => {
    const token = localStorage.getItem('mobile_hub_token');
    const savedUser = localStorage.getItem('mobile_hub_user');
    if ((!user || !token || !savedUser) && location.pathname !== '/login') {
      setUser(null);
      navigate('/login');
    }
  }, [user, location.pathname, navigate]);

  const handleLogin = (u) => {
    setUser(u);
    navigate('/');
  };

  const handleLogout = () => {
    showConfirm('Are you sure you want to sign out?', () => {
      localStorage.removeItem('mobile_hub_user');
      localStorage.removeItem('mobile_hub_token');
      setUser(null);
      navigate('/login');
    });
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
        <div className="brand" onClick={() => { navigate('/'); setIsMenuOpen(false); }} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">MH</div>
          <div>
            <div className="brand-title">Mobile Hub</div>
            <div className="brand-sub">Korea ↔ Pakistan Exports</div>
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

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className={`avatar ${avatarClass}`}>{initial}</div>
            <div className="user-info">
              <div className="user-name">{fullName}</div>
              <div className="user-role">Admin</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="page-body">
        <Routes>
          <Route path="/" element={<Dashboard toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/inventory" element={<Inventory toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/sales" element={<Sales toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/expenses" element={<Expenses toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/cashflow" element={<Cashflow toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/fazi-cash" element={<Hawala toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/investors" element={<Investors toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/owner-investment" element={<MyInvestment toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/payouts" element={<Payouts toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/shipments" element={<Shipments toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/ai-assistant" element={<AIAssistant toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/activity-log" element={<ActivityLog toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/settings" element={<Settings toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/capital" element={<Capital toggleMenu={toggleMenu} onLogout={handleLogout} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
