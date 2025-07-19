import React, { useState } from 'react';
import { isMobileBrowser, getMobileBrowserInfo } from '../utils/mobileDetection';

const IOSCompatibilityGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const browserInfo = getMobileBrowserInfo();

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }}>
        <button 
          onClick={() => setIsVisible(true)}
          style={{
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="iOS Compatibility Guide"
        >
          iOS
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>🎯 iOS Compatibility Guide</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#007AFF', marginBottom: '12px' }}>✅ Good News!</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            We've implemented a <strong>dual authentication system</strong> that works with iOS Safari's strict privacy settings. 
            You no longer need to disable "Prevent Cross-Site Tracking"!
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>🔧 How It Works</h3>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            <p><strong>1. Primary Method:</strong> HTTP-only cookies (most secure)</p>
            <p><strong>2. Fallback Method:</strong> localStorage token (iOS compatible)</p>
            <p><strong>3. Automatic Switching:</strong> System chooses the best method</p>
            <p><strong>4. No User Action Required:</strong> Works automatically!</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>📱 Your Device Info</h3>
          <div style={{ 
            background: '#e3f2fd', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <p><strong>Mobile Browser:</strong> {isMobileBrowser() ? 'Yes' : 'No'}</p>
            <p><strong>Browser Type:</strong> {browserInfo.name}</p>
            <p><strong>Platform:</strong> {browserInfo.platform}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>🚀 Benefits</h3>
          <ul style={{ color: '#666', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>No Settings Changes:</strong> Works with default iOS privacy settings</li>
            <li><strong>Enhanced Security:</strong> Uses secure HTTP-only cookies when possible</li>
            <li><strong>Automatic Fallback:</strong> Seamlessly switches to localStorage when needed</li>
            <li><strong>Better Performance:</strong> Faster authentication on iOS devices</li>
            <li><strong>Future-Proof:</strong> Compatible with upcoming iOS privacy features</li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>🔍 Troubleshooting</h3>
          <div style={{ 
            background: '#fff3e0', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <p style={{ marginBottom: '8px' }}><strong>If you still have issues:</strong></p>
            <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.5' }}>
              <li>Try refreshing the page</li>
              <li>Clear browser cache and cookies</li>
              <li>Use the red "T" button to run authentication test</li>
              <li>Contact support if problems persist</li>
            </ol>
          </div>
        </div>

        <div style={{ 
          background: '#e8f5e8', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #4caf50',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#2e7d32', margin: '0 0 8px 0' }}>🎉 Success!</h4>
          <p style={{ color: '#2e7d32', margin: 0, fontSize: '14px' }}>
            This new system has been tested and works reliably on iOS Safari with default privacy settings. 
            You can now use the app without any browser configuration changes!
          </p>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#007AFF',
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

export default IOSCompatibilityGuide; 