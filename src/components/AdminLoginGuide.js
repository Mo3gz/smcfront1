import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminLoginGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

  const testAdminLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/debug/admin-test`, {
        username: 'ayman',
        password: 'password'
      });
      
      setTestResult(response.data);
      toast.success('Admin login test successful!');
    } catch (error) {
      setTestResult({ error: error.response?.data?.error || 'Test failed' });
      toast.error('Admin login test failed');
    }
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', left: '60px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsVisible(true)}
          style={{
            background: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="Admin Login Guide"
        >
          A
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>👑 Admin Login Guide</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#ff6b35', marginBottom: '12px' }}>Admin Credentials</h3>
          <div style={{ 
            background: '#fff3e0', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <p><strong>Username:</strong> ayman</p>
            <p><strong>Password:</strong> password</p>
            <p><strong>Role:</strong> admin</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>How to Login as Admin</h3>
          <ol style={{ color: '#666', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Go to the login page</li>
            <li>Enter username: <strong>ayman</strong></li>
            <li>Enter password: <strong>password</strong></li>
            <li>Click "Login"</li>
            <li>You should be redirected to the Admin Dashboard</li>
          </ol>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>Test Admin Login</h3>
          <button
            onClick={testAdminLogin}
            style={{
              background: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}
          >
            Test Admin Login
          </button>

          {testResult && (
            <div style={{ 
              background: testResult.error ? '#ffebee' : '#e8f5e8', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }}>
              {testResult.error ? (
                <div style={{ color: '#c62828' }}>
                  ❌ Error: {testResult.error}
                </div>
              ) : (
                <div style={{ color: '#2e7d32' }}>
                  ✅ Success: {JSON.stringify(testResult, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>Troubleshooting</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <p style={{ marginBottom: '8px' }}><strong>If login fails:</strong></p>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.5' }}>
              <li>Check your internet connection</li>
              <li>Make sure you're using the correct credentials</li>
              <li>Try refreshing the page</li>
              <li>Clear browser cache and cookies</li>
              <li>Use the test button above to verify</li>
            </ul>
          </div>
        </div>

        <div style={{ 
          background: '#e3f2fd', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #2196f3',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>💡 Tip</h4>
          <p style={{ color: '#1976d2', margin: 0, fontSize: '14px' }}>
            The admin user is automatically created when the server starts. 
            If you're still having issues, try the test button to verify the server connection.
          </p>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Got It! 👍
        </button>
      </div>
    </div>
  );
};

export default AdminLoginGuide; 