import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Shield, AlertCircle, Wrench, Eye, EyeOff, User, Lock, XCircle } from 'lucide-react';
import { getMobileWarnings, isMobileBrowser } from '../utils/mobileDetection';
import MobileTroubleshooter from './MobileTroubleshooter';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileWarnings, setMobileWarnings] = useState([]);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const { login } = useAuth();

  // Demo credentials for easy access
  const demoCredentials = [
    { username: 'ayman', password: 'password', role: 'Admin' },
    { username: 'team1', password: 'password', role: 'Team 1' },
    { username: 'team2', password: 'password', role: 'Team 2' }
  ];

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

  // Handle lock timer countdown
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockTimer, isLocked]);

  // Validation functions
  const validateUsername = (value) => {
    if (!value.trim()) {
      return 'Username is required';
    }
    if (value.length < 2) {
      return 'Username must be at least 2 characters';
    }
    if (value.length > 20) {
      return 'Username must be less than 20 characters';
    }
    return null;
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 1) {
      return 'Password is required';
    }
    return null;
  };

  // Handle field changes with validation
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    const error = validateUsername(value);
    setErrors(prev => ({
      ...prev,
      username: error
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({
      ...prev,
      password: error
    }));
  };

  // Quick login with demo credentials
  const handleQuickLogin = async (credential) => {
    setUsername(credential.username);
    setPassword(credential.password);
    
    // Clear any existing errors
    setErrors({});
    
    // Simulate form submission
    const formData = { username: credential.username, password: credential.password };
    await handleLogin(formData);
  };

  // Main login handler
  const handleLogin = async (formData = null) => {
    const loginUsername = formData?.username || username;
    const loginPassword = formData?.password || password;

    // Validate fields
    const usernameError = validateUsername(loginUsername);
    const passwordError = validatePassword(loginPassword);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError
      });
      
      toast.error('Please fix the errors above');
      return;
    }

    // Check if account is locked
    if (isLocked) {
      toast.error(`Account temporarily locked. Please wait ${lockTimer} seconds.`);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await login(loginUsername, loginPassword);
      
      if (result.success) {
        toast.success('Login successful!');
        setAttempts(0);
      } else {
        // Handle specific error types
        handleLoginError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      handleLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle different types of login errors
  const handleLoginError = (errorMessage) => {
    setAttempts(prev => prev + 1);
    
    // Increment lock attempts
    if (attempts >= 2) { // Lock after 3 failed attempts
      setIsLocked(true);
      setLockTimer(30); // Lock for 30 seconds
      toast.error('Too many failed attempts. Account locked for 30 seconds.');
      return;
    }

    // Show specific error messages
    if (errorMessage.includes('Invalid username or password')) {
      toast.error('Invalid username or password. Please check your credentials.');
      
      // Clear password field for security
      setPassword('');
      setErrors(prev => ({
        ...prev,
        password: 'Invalid password'
      }));
    } else if (errorMessage.includes('Network connection')) {
      toast.error('Network connection issue. Please check your internet connection.');
    } else if (errorMessage.includes('Server error')) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin();
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
              
              {/* Mobile Troubleshooter Button */}
              <button
                onClick={() => setShowTroubleshooter(true)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Wrench size={14} />
                Fix Mobile Issues
              </button>
            </div>
          )}

          {/* Account Lock Warning */}
          {isLocked && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: 'rgba(244, 67, 54, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} color="#f44336" />
                <span style={{ fontSize: '14px', color: '#c62828', fontWeight: '600' }}>
                  Account Temporarily Locked
                </span>
              </div>
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: '#c62828'
              }}>
                Too many failed attempts. Please wait {lockTimer} seconds before trying again.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  disabled={isLocked}
                  style={{
                    paddingLeft: '40px',
                    borderColor: errors.username ? '#f44336' : '#ddd'
                  }}
                />
                <User 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: errors.username ? '#f44336' : '#999'
                  }} 
                />
                {errors.username && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#f44336'
                  }}>
                    <XCircle size={12} />
                    {errors.username}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                  style={{
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    borderColor: errors.password ? '#f44336' : '#ddd'
                  }}
                />
                <Lock 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: errors.password ? '#f44336' : '#999'
                  }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#999'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#f44336'
                  }}>
                    <XCircle size={12} />
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading || isLocked}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                opacity: isLocked ? 0.6 : 1
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              ) : (
                <>
                  <LogIn size={20} />
                  {isLocked ? `Locked (${lockTimer}s)` : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Quick Login Demo Credentials */}
          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
            <h3 style={{ color: '#667eea', marginBottom: '12px', fontSize: '16px' }}>Quick Login:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demoCredentials.map((credential, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickLogin(credential)}
                  disabled={isLocked}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    opacity: isLocked ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLocked) e.target.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLocked) e.target.style.background = 'white';
                  }}
                >
                  <strong>{credential.role}:</strong> {credential.username} / {credential.password}
                </button>
              ))}
            </div>
          </div>

          {/* Failed Attempts Counter */}
          {attempts > 0 && !isLocked && (
            <div style={{ 
              marginTop: '16px', 
              padding: '8px 12px', 
              background: 'rgba(255, 152, 0, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 152, 0, 0.3)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '12px',
                color: '#f57c00'
              }}>
                <AlertCircle size={12} />
                Failed attempts: {attempts}/3
              </div>
            </div>
          )}
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
      
      {/* Mobile Troubleshooter */}
      {showTroubleshooter && (
        <MobileTroubleshooter onClose={() => setShowTroubleshooter(false)} />
      )}
    </div>
  );
};

export default Login; 