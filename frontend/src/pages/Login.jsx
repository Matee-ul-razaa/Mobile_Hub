import React, { useState } from 'react';
import { useData } from '../DataContext';

const Login = ({ onLogin }) => {
  const { logActivity } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setError('⚠ Please tap Nadeem or Bilawal first to select your account.');
      return;
    }
    if (!password) {
      setError('⚠ Please enter your password.');
      return;
    }

    try {
      setError('');
      // Call the real backend login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: selectedUser, password })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('mobile_hub_user', selectedUser);
        localStorage.setItem('mobile_hub_token', result.token);

        await logActivity(
          'login',
          'auth',
          `${selectedUser === 'nadeem' ? 'Nadeem' : 'Bilawal'} signed in`
        );

        window.dispatchEvent(new Event('mobilehub-auth-changed'));
        onLogin(selectedUser);
      } else {
        setError(`✗ ${result.error || 'Incorrect password'}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('⚠ Connection error. Please check your internet or database.');
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
          <label htmlFor="login-pwd">Password</label>
          <input 
            id="login-pwd"
            name="password"
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


      </div>
    </div>
  );
};

export default Login;
