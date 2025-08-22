import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Shield, Eye, EyeOff, User, Lock, XCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

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

  // Main login handler
  const handleLogin = async (formData = null) => {
    const loginUsername = formData?.username || username;
    const loginPassword = formData?.password || password;

    console.log('🔐 Login attempt started for:', loginUsername);

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

    setLoading(true);
    setErrors({});

    try {
      console.log('🔐 Calling login function...');
      const result = await login(loginUsername, loginPassword);
      console.log('🔐 Login result:', result);
      
      if (result.success) {
        console.log('🔐 Login successful, showing toast...');
        toast.success('Login successful!');
        console.log('🔐 Login process completed');
      } else {
        console.log('🔐 Login failed:', result.error);
        toast.error(result.error);
        
        // Clear password field for security
        setPassword('');
        setErrors(prev => ({
          ...prev,
          password: 'Invalid password'
        }));
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          <h1>Saint Paul Sports Team</h1>
          <p>Team Competition Platform</p>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Shield size={48} color="#667eea" />
            <h2 style={{ marginTop: '16px', color: '#333' }}>Welcome Back</h2>
            <p style={{ color: '#666', marginTop: '8px' }}>Sign in to continue your adventure</p>
          </div>

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
              disabled={loading}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px'
              }}
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