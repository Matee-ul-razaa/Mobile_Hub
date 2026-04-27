import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setError('⚠ Please tap Nadeem or Bilawal first to select your account.');
      return;
    }
    if (!password) {
      setError('⚠ Please enter your password.');
      return;
    }

    // AUTH LOGIC (Using default 'admin' for demo or checking against API)
    // For now, mirroring simple localStorage persistence
    if (password === 'admin' || password === '123456') {
      localStorage.setItem('mobile_hub_user', selectedUser);
      onLogin(selectedUser);
    } else {
      setError(`✗ Incorrect password for ${selectedUser==='nadeem'?'Nadeem':'Bilawal'}.`);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">MH</div>
        <h1 className="login-title">Mobile Hub</h1>
        <div className="login-sub">Sign in to continue</div>

        <div className="user-picker">
          <div 
            className={`user-card ${selectedUser === 'nadeem' ? 'selected' : ''}`} 
            onClick={() => { setSelectedUser('nadeem'); setError(''); }}
          >
            <div className="avatar n">N</div>
            <div className="name">Nadeem</div>
            <div className="role">Admin</div>
          </div>
          <div 
            className={`user-card ${selectedUser === 'bilawal' ? 'selected' : ''}`} 
            onClick={() => { setSelectedUser('bilawal'); setError(''); }}
          >
            <div className="avatar b">B</div>
            <div className="name">Bilawal</div>
            <div className="role">Admin</div>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-row">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter password" 
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin}>
          Sign in
        </button>

        <div className="login-footer">
          Default password for first-time login: <code>admin</code> · change it in Settings after sign-in
        </div>
      </div>
    </div>
  );
};

export default Login;
