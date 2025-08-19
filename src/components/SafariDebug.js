import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const SafariDebug = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testSafariAuth = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Check if Safari is detected
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac OS X/.test(userAgent);
      
      results.browserDetection = {
        isSafari,
        isIOS,
        isMacOS,
        userAgent
      };

      // Test 2: Check stored username
      const storedUsername = localStorage.getItem('safariUsername');
      results.storedUsername = storedUsername;

      // Test 3: Test backend Safari auth endpoint
      try {
        const config = { withCredentials: true };
        if (isSafari && storedUsername) {
          config.headers = { 'x-username': storedUsername };
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/debug/safari-auth`, config);
        results.backendTest = response.data;
      } catch (error) {
        results.backendTest = { error: error.message, status: error.response?.status };
      }

      // Test 4: Test notifications endpoint
      try {
        const config = { withCredentials: true };
        if (isSafari && storedUsername) {
          config.headers = { 'x-username': storedUsername };
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/notifications`, config);
        results.notificationsTest = { success: true, count: response.data?.length || 0 };
      } catch (error) {
        results.notificationsTest = { error: error.message, status: error.response?.status };
      }

      // Test 5: Test inventory endpoint
      try {
        const config = { withCredentials: true };
        if (isSafari && storedUsername) {
          config.headers = { 'x-username': storedUsername };
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/inventory`, config);
        results.inventoryTest = { success: true, count: response.data?.length || 0 };
      } catch (error) {
        results.inventoryTest = { error: error.message, status: error.response?.status };
      }

    } catch (error) {
      results.generalError = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🦁 Safari Authentication Debug</h2>
      
      <button 
        onClick={testSafariAuth}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Safari Authentication'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SafariDebug;
