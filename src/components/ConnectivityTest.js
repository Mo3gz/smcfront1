import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ConnectivityTest = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

  const runTests = async () => {
    setIsTesting(true);
    setTestResults({});

    const results = {};

    // Test 1: Basic connectivity
    try {
      console.log('Testing basic connectivity...');
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout: 10000,
        withCredentials: false
      });
      results.connectivity = {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      results.connectivity = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 2: CORS preflight
    try {
      console.log('Testing CORS preflight...');
      const response = await axios.options(`${API_BASE_URL}/api/user`, {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'x-auth-token': 'test-token'
        }
      });
      results.cors = {
        success: true,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      results.cors = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 3: Login endpoint
    try {
      console.log('Testing login endpoint...');
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: 'ayman',
        password: 'password'
      }, {
        timeout: 10000,
        withCredentials: true
      });
      results.login = {
        success: true,
        status: response.status,
        hasToken: !!response.data.token
      };
    } catch (error) {
      results.login = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    // Test 4: Auth check with token
    try {
      console.log('Testing auth check...');
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/user`, {
        timeout: 10000,
        withCredentials: true,
        headers: {
          'x-auth-token': token
        }
      });
      results.auth = {
        success: true,
        status: response.status,
        user: response.data
      };
    } catch (error) {
      results.auth = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    setTestResults(results);
    setIsTesting(false);

    // Show summary toast
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    if (successCount === totalCount) {
      toast.success(`All tests passed! (${successCount}/${totalCount})`);
    } else {
      toast.error(`Some tests failed! (${successCount}/${totalCount})`);
    }
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', left: '110px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsVisible(true)}
          style={{
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="Connectivity Test"
        >
          C
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>🔧 Connectivity Test</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            This tool will test the connection to the server and identify any issues with authentication or CORS.
          </p>
          
          <button
            onClick={runTests}
            disabled={isTesting}
            style={{
              background: isTesting ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}
          >
            {isTesting ? 'Running Tests...' : 'Run Connectivity Tests'}
          </button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '12px' }}>Test Results</h3>
            
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} style={{ 
                marginBottom: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: result.success ? '#e8f5e8' : '#ffebee',
                border: `1px solid ${result.success ? '#4caf50' : '#f44336'}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <strong style={{ 
                    color: result.success ? '#2e7d32' : '#c62828',
                    textTransform: 'capitalize'
                  }}>
                    {testName}
                  </strong>
                  <span style={{ 
                    color: result.success ? '#2e7d32' : '#c62828',
                    fontWeight: 'bold'
                  }}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                
                {result.success ? (
                  <div style={{ fontSize: '12px', color: '#2e7d32' }}>
                    <div>Status: {result.status}</div>
                    {result.data && <div>Data: {JSON.stringify(result.data, null, 2)}</div>}
                    {result.user && <div>User: {result.user.username} ({result.user.role})</div>}
                    {result.hasToken && <div>Token: ✅ Present</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#c62828' }}>
                    <div>Error: {result.error}</div>
                    {result.status && <div>Status: {result.status}</div>}
                    {result.data && <div>Response: {JSON.stringify(result.data, null, 2)}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          background: '#e3f2fd', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #2196f3',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>💡 What These Tests Check</h4>
          <ul style={{ color: '#1976d2', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            <li><strong>Connectivity:</strong> Basic server reachability</li>
            <li><strong>CORS:</strong> Cross-origin request handling</li>
            <li><strong>Login:</strong> Authentication endpoint functionality</li>
            <li><strong>Auth Check:</strong> Token-based authentication</li>
          </ul>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ConnectivityTest; 