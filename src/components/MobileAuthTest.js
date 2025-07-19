import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isMobileBrowser, getMobileBrowserInfo, checkCookieSupport } from '../utils/mobileDetection';
import { toast } from 'react-hot-toast';

const MobileAuthTest = () => {
  const { user, login, logout } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const runAuthTest = async () => {
    const results = {
      mobile: isMobileBrowser(),
      browser: getMobileBrowserInfo(),
      cookies: checkCookieSupport(),
      https: window.location.protocol === 'https:',
      internet: navigator.onLine,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Test login with demo credentials
    try {
      console.log('Starting mobile auth test...');
      const loginResult = await login('team1', 'password');
      
      if (loginResult.success) {
        results.loginSuccess = true;
        results.loginError = null;
        toast.success('Login test successful!');
        
        // Wait a bit then test logout
        setTimeout(async () => {
          await logout();
          results.logoutSuccess = true;
          setTestResults(results);
        }, 2000);
      } else {
        results.loginSuccess = false;
        results.loginError = loginResult.error;
        toast.error(`Login test failed: ${loginResult.error}`);
      }
    } catch (error) {
      results.loginSuccess = false;
      results.loginError = error.message;
      toast.error(`Login test error: ${error.message}`);
    }

    setTestResults(results);
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsVisible(true)}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          T
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
      background: 'rgba(0, 0, 0, 0.9)',
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
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Mobile Auth Test</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            This will test the mobile authentication flow with demo credentials:
          </p>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            Username: team1, Password: password
          </p>
        </div>

        <button
          onClick={runAuthTest}
          style={{
            width: '100%',
            padding: '12px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px'
          }}
        >
          Run Authentication Test
        </button>

        {Object.keys(testResults).length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>
              Test Results:
            </h3>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(testResults, null, 2)}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p><strong>Current User:</strong> {user ? `${user.username} (${user.role})` : 'Not logged in'}</p>
          <p><strong>Mobile Browser:</strong> {isMobileBrowser() ? 'Yes' : 'No'}</p>
          <p><strong>Cookies Enabled:</strong> {checkCookieSupport() ? 'Yes' : 'No'}</p>
          <p><strong>HTTPS:</strong> {window.location.protocol === 'https:' ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthTest; 