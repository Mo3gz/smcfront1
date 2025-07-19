import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Shield, AlertCircle } from 'lucide-react';
import { getMobileWarnings, isMobileBrowser } from '../utils/mobileDetection';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileWarnings, setMobileWarnings] = useState([]);
  const { login } = useAuth();

  useEffect(() => {
    if (isMobileBrowser()) {
      const warnings = getMobileWarnings();
      setMobileWarnings(warnings);
      
      // Show warnings as toasts
      warnings.forEach(warning => {
        toast(warning, {
          icon: '⚠️',
          duration: 6000,
          style: {
            background: '#ffc107',
            color: '#000',
          },
        });
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        toast.success('Login successful!');
      } else {
        // Handle specific error messages
        if (result.error.includes('timeout') || result.error.includes('network')) {
          toast.error('Network issue. Please check your connection and try again.');
        } else if (result.error.includes('expired')) {
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-content">
        <div className="header">
          <h1>Scout Game</h1>
          <p>Team Competition Platform</p>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Shield size={48} color="#667eea" />
            <h2 style={{ marginTop: '16px', color: '#333' }}>Welcome Back</h2>
            <p style={{ color: '#666', marginTop: '8px' }}>Sign in to continue your adventure</p>
          </div>

          {/* Mobile browser warnings */}
          {mobileWarnings.length > 0 && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: 'rgba(255, 193, 7, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={16} color="#ffc107" />
                <span style={{ fontSize: '14px', color: '#856404', fontWeight: '600' }}>
                  Mobile Browser Detected
                </span>
              </div>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                fontSize: '12px', 
                color: '#856404',
                lineHeight: '1.4'
              }}>
                {mobileWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                Username
              </label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
            <h3 style={{ color: '#667eea', marginBottom: '12px', fontSize: '16px' }}>Demo Credentials:</h3>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
              <p><strong>Admin:</strong> username: ayman, password: password</p>
              <p><strong>Team 1:</strong> username: team1, password: password</p>
              <p><strong>Team 2:</strong> username: team2, password: password</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with credits to Ayman */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        marginTop: 'auto'
      }}>
        <p style={{ margin: 0 }}>
          Developed by <strong style={{ color: 'white' }}>Ayman</strong>
        </p>
      </div>
    </div>
  );
};

export default Login; 