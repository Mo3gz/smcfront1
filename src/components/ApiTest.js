import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkApiHealth, refreshAuthToken, hasValidToken, getCurrentToken } from '../utils/api';

const ApiTest = () => {
  const { user, forceTokenRefresh, hasValidToken: contextHasToken } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [testResults, setTestResults] = useState({});

  const testApiHealth = async () => {
    const result = await checkApiHealth();
    setHealthStatus(result);
  };

  const testTokenRefresh = async () => {
    setRefreshStatus('Refreshing...');
    const result = await refreshAuthToken();
    setRefreshStatus(result);
  };

  const testAuthContext = async () => {
    const results = {
      user: !!user,
      username: user?.username,
      hasToken: contextHasToken(),
      localStorageToken: !!localStorage.getItem('authToken'),
      sessionStorageToken: !!sessionStorage.getItem('authToken'),
      cookies: document.cookie.includes('auth_token')
    };
    setTestResults(results);
  };

  const testBackendEndpoints = async () => {
    const endpoints = [
      '/api/public-test',
      '/api/cors-test',
      '/api/netlify-test',
      '/api/cors-debug',
      '/api/auth-test'
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://smcback-production-6d12.up.railway.app${endpoint}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          results[endpoint] = { success: true, data };
        } else {
          results[endpoint] = { success: false, status: response.status, statusText: response.statusText };
        }
      } catch (error) {
        results[endpoint] = { success: false, error: error.message };
      }
    }
    
    setTestResults(prev => ({ ...prev, endpoints: results }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔧 API & Authentication Test Panel</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>👤 Current User Status</h3>
        <p><strong>User:</strong> {user ? `${user.username} (${user.role})` : 'Not logged in'}</p>
        <p><strong>Has Token:</strong> {contextHasToken() ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Local Storage Token:</strong> {localStorage.getItem('authToken') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Session Storage Token:</strong> {sessionStorage.getItem('authToken') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Cookies:</strong> {document.cookie.includes('auth_token') ? '✅ Yes' : '❌ No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🧪 Test Functions</h3>
        <button onClick={testApiHealth} style={{ margin: '5px', padding: '10px' }}>
          Test API Health
        </button>
        <button onClick={testTokenRefresh} style={{ margin: '5px', padding: '10px' }}>
          Refresh Auth Token
        </button>
        <button onClick={testAuthContext} style={{ margin: '5px', padding: '10px' }}>
          Test Auth Context
        </button>
        <button onClick={testBackendEndpoints} style={{ margin: '5px', padding: '10px' }}>
          Test Backend Endpoints
        </button>
        <button onClick={forceTokenRefresh} style={{ margin: '5px', padding: '10px' }}>
          Force Token Refresh (Context)
        </button>
      </div>

      {healthStatus && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🏥 API Health Status</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        </div>
      )}

      {refreshStatus && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🔄 Token Refresh Status</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(refreshStatus, null, 2)}
          </pre>
        </div>
      )}

      {Object.keys(testResults).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Test Results</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>🔍 Manual Token Check</h3>
        <p><strong>Current Token:</strong> {getCurrentToken() ? getCurrentToken().substring(0, 30) + '...' : 'No token'}</p>
        <p><strong>Token Valid:</strong> {hasValidToken() ? '✅ Yes' : '❌ No'}</p>
      </div>
    </div>
  );
};

export default ApiTest;
