import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Lock, Mail, AlertCircle, User } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useDatabase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const success = login(name, email, password);
    if (success) {
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    } else {
      setError('Invalid email or password. Hint: admin@cleardrop.com / admin123');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--bg-color)',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        boxShadow: 'var(--shadow-lg)',
        padding: '2.5rem 2rem'
      }}>
        {/* Brand Logo */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            padding: '0.75rem', 
            borderRadius: 'var(--border-radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Package size={32} color="var(--primary-color)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.02em', margin: 0 }}>
            ClearDrop
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Logistics Milestone Dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fca5a5', 
            borderRadius: 'var(--border-radius-md)', 
            padding: '0.75rem 1rem', 
            color: 'var(--error)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'start',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--text-secondary)' }} />
              Admin Name
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Ayan Chaturvedi"
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
              Admin Email
            </label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@cleardrop.com"
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--text-secondary)' }} />
              Password
            </label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700', marginTop: '0.5rem' }}>
            Log In
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)' }}>
            Demo: admin@cleardrop.com / admin123
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
