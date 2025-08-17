import React, { useState, useEffect } from 'react';
import { checkApiHealth } from '../utils/api';
import { API_CONFIG } from '../config/api';

const ApiTest = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkApiHealth();
      setHealthStatus(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test connection on component mount
    testApiConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔌 API Connection Test</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Backend URL:</strong> {API_CONFIG.BASE_URL}
      </div>
      
      <button 
        onClick={testApiConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {healthStatus && (
        <div style={{ marginTop: '15px' }}>
          <h4>Status: {healthStatus.status === 'success' ? '✅ Connected' : '❌ Failed'}</h4>
          {healthStatus.status === 'success' ? (
            <pre style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '5px' }}>
              {JSON.stringify(healthStatus.data, null, 2)}
            </pre>
          ) : (
            <div style={{ color: 'red' }}>
              <p><strong>Error:</strong> {healthStatus.error}</p>
              {healthStatus.details && (
                <p><strong>Details:</strong> {JSON.stringify(healthStatus.details)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '15px', color: 'red' }}>
          <strong>Exception:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>🔍 Troubleshooting Tips:</h4>
        <ul>
          <li>Check if the backend server is running</li>
          <li>Verify the backend URL is correct</li>
          <li>Check CORS configuration on the backend</li>
          <li>Ensure network connectivity</li>
          <li>Check browser console for detailed errors</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;
