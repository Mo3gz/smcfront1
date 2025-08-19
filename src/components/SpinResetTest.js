import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const SpinResetTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testSpinReset = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Check current spin status
      console.log('🧪 Testing spin reset logic...');
      
      const statusResponse = await axios.get(`${API_BASE_URL}/api/debug/spin-status`, { withCredentials: true });
      results.statusCheck = statusResponse.data;
      console.log('🧪 Current spin status:', statusResponse.data);

      // Test 2: Try to make a spin (this should trigger reset if all are completed)
      try {
        const spinResponse = await axios.post(`${API_BASE_URL}/api/spin`, {
          spinType: 'random' // Try spinning random type
        }, { withCredentials: true });
        
        results.spinAttempt = { success: true, data: spinResponse.data };
        console.log('🧪 Spin attempt successful:', spinResponse.data);
      } catch (spinError) {
        results.spinAttempt = { 
          success: false, 
          error: spinError.response?.data || spinError.message 
        };
        console.log('🧪 Spin attempt failed:', spinError.response?.data);
      }

      // Test 3: Check status again after spin attempt
      const statusAfterResponse = await axios.get(`${API_BASE_URL}/api/debug/spin-status`, { withCredentials: true });
      results.statusAfter = statusAfterResponse.data;
      console.log('🧪 Spin status after attempt:', statusAfterResponse.data);

    } catch (error) {
      results.error = error.message;
      console.error('🧪 Test error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  const manualReset = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/debug/reset-spins`, {}, { withCredentials: true });
      setTestResults({ manualReset: response.data });
      console.log('🧪 Manual reset successful:', response.data);
    } catch (error) {
      setTestResults({ manualResetError: error.response?.data || error.message });
      console.error('🧪 Manual reset failed:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Spin Reset Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSpinReset}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Testing...' : 'Test Spin Reset'}
        </button>
        
        <button 
          onClick={manualReset}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#FF3B30',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Resetting...' : 'Manual Reset'}
        </button>
      </div>

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

export default SpinResetTest;
