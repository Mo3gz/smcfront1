import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { createMobileAxiosConfig } from '../utils/mobileAuth';

const UserStateDebug = () => {
  const { user, checkAdminStatus } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';

  const testAdminCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkAdminStatus();
      setAdminCheckResult(result);
      console.log('🔍 Admin check result:', result);
    } catch (error) {
      setAdminCheckResult({ success: false, error: error.message });
      console.error('❌ Admin check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const testUserEndpoint = async () => {
    try {
      const config = createMobileAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/api/user`, config);
      console.log('🔍 User endpoint response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ User endpoint error:', error);
      return null;
    }
  };

  const testUserRole = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/debug/user-role/${user.id}`);
      console.log('🔍 User role check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ User role check error:', error);
      return null;
    }
  };

  const testAllUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/debug/all-users`);
      console.log('🔍 All users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ All users check error:', error);
      return null;
    }
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', left: '160px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsVisible(true)}
          style={{
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="User State Debug"
        >
          U
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
          <h2 style={{ margin: 0, color: '#333' }}>🔍 User State Debug</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>Current User State</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>Admin Status Check</h3>
          <button
            onClick={testAdminCheck}
            disabled={isChecking}
            style={{
              background: isChecking ? '#ccc' : '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}
          >
            {isChecking ? 'Checking...' : 'Test Admin Check'}
          </button>

          {adminCheckResult && (
            <div style={{ 
              background: adminCheckResult.success ? '#e8f5e8' : '#ffebee', 
              padding: '16px', 
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: adminCheckResult.success ? '#2e7d32' : '#c62828' }}>
                Admin Check Result:
              </h4>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(adminCheckResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>User Endpoint Test</h3>
          <button
            onClick={testUserEndpoint}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              marginRight: '8px'
            }}
          >
            Test /api/user Endpoint
          </button>
          <button
            onClick={testUserRole}
            style={{
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              marginRight: '8px'
            }}
          >
            Check User Role
          </button>
          <button
            onClick={testAllUsers}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}
          >
            List All Users
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Check console for response details
          </p>
        </div>

        <div style={{ 
          background: '#e3f2fd', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #2196f3',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>💡 Admin Authentication Tips</h4>
          <ul style={{ color: '#1976d2', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            <li>Check if user.role === 'admin' in the response</li>
            <li>Verify the admin check endpoint returns success</li>
            <li>Ensure the user endpoint shows correct role</li>
            <li>Check console logs for authentication errors</li>
          </ul>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#9c27b0',
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

export default UserStateDebug; 