import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMobileBrowserInfo, checkCookieSupport } from '../utils/mobileDetection';

const DebugInfo = () => {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      mobileInfo: getMobileBrowserInfo(),
      cookieSupport: checkCookieSupport(),
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, username: user.username, role: user.role } : null,
      loading
    };
    setDebugInfo(info);
  }, [user, loading]);

  if (!showDebug) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }}>
        <button 
          onClick={() => setShowDebug(true)}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          D
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Debug Info</strong>
        <button 
          onClick={() => setShowDebug(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Platform:</strong> {debugInfo.mobileInfo?.platform}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Mobile:</strong> {debugInfo.mobileInfo?.isMobile ? 'Yes' : 'No'}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Browser:</strong> {debugInfo.mobileInfo?.browser}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Cookies:</strong> {debugInfo.cookieSupport ? 'Enabled' : 'Disabled'}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Protocol:</strong> {debugInfo.protocol}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Loading:</strong> {debugInfo.loading ? 'Yes' : 'No'}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>User:</strong> {debugInfo.user ? `${debugInfo.user.username} (${debugInfo.user.role})` : 'Not logged in'}
      </div>
      
      <div style={{ fontSize: '10px', color: '#ccc', marginTop: '10px' }}>
        {debugInfo.timestamp}
      </div>
    </div>
  );
};

export default DebugInfo; 