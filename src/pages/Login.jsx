import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Lock, Mail, AlertCircle, User, Building, Upload } from 'lucide-react';

const Login = () => {
  const { login, signUp, isAuthenticated } = useDatabase();
  
  // Toggle Mode State
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
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

    if (isSignUp) {
      if (!orgName.trim()) {
        setError('Please enter your organization name.');
        return;
      }
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      const success = signUp(name, email, password, orgName, orgLogo);
      if (success) {
        const origin = location.state?.from?.pathname || '/';
        navigate(origin);
      } else {
        setError('This email is already registered. Please log in.');
      }
    } else {
      const success = login(email, password);
      if (success) {
        const origin = location.state?.from?.pathname || '/';
        navigate(origin);
      } else {
        setError('Invalid email or password.');
      }
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
            {isSignUp ? 'Register Your Organization' : 'ClearDrop'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isSignUp ? 'Set up your brand and administrator account to get started.' : 'Logistics Milestone Dashboard'}
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

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Conditional Admin Name input for Sign Up mode */}
          {isSignUp && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Building size={14} style={{ color: 'var(--text-secondary)' }} />
                  Organization Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)} 
                  placeholder="e.g., ClearDrop Logistics"
                  required={isSignUp} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Upload size={14} style={{ color: 'var(--text-secondary)' }} />
                  Organization Logo
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {orgLogo ? (
                    <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                      <img src={orgLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%', border: '2px solid var(--primary-color)' }} alt="Org Logo" />
                      <button type="button" onClick={() => setOrgLogo(null)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>×</button>
                    </div>
                  ) : (
                    <label style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                      <Upload size={16} color="var(--text-secondary)" />
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {orgLogo ? 'Logo uploaded' : 'Upload a brand logo (optional)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  Administrator Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your name"
                  required 
                />
              </div>
            </>
          )}

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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700', marginTop: '0.5rem' }}>
            {isSignUp ? 'Register & Launch Dashboard' : 'Log In'}
          </button>
        </form>

        {/* View Toggle Link */}
        <button 
          type="button" 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setOrgName('');
            setOrgLogo(null);
            setName('');
            setEmail('');
            setPassword('');
          }}
          style={{ 
            marginTop: '1.25rem', 
            fontSize: '0.85rem', 
            color: 'var(--primary-color)', 
            fontWeight: '700',
            width: '100%',
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>

      </div>
    </div>
  );
};

export default Login;
