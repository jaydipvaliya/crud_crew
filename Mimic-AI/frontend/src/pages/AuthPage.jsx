import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const startRegister = queryParams.get('register') === 'true';

  const [isLogin, setIsLogin] = useState(!startRegister);
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLogin(!startRegister);
    setError('');
    setSuccess('');
  }, [startRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (!isLogin && (!displayName || displayName.length < 2)) {
      setError('Display name must be at least 2 characters');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const payload = isLogin 
        ? { phone_number: phone, password }
        : { phone_number: phone, password, display_name: displayName };

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('chatapp_user', JSON.stringify(data.user));
      setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Account created! Redirecting...');
      
      setTimeout(() => {
        navigate('/chat');
      }, 800);

    } catch (err) {
      console.error(err);
      setError('Connection failed. Is the server running?');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageSquare size={32} color="white" />
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Log in with your phone number' : 'Sign up to connect with friends'}</p>
        </div>

        {error && (
          <div className="alert-message error">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-message" style={{ background: 'rgba(0,168,132,0.1)', border: '1px solid rgba(0,168,132,0.2)', color: 'var(--accent-primary)' }}>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                placeholder="e.g. Jaydip"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="phone-wrapper">
              <span className="phone-prefix">+91</span>
              <input
                type="tel"
                id="phone"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={15}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              min={4}
              required
            />
          </div>

          <button type="submit" className="btn-auth" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => setIsLogin(false)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => setIsLogin(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
