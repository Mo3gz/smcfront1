import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { isMobileBrowser, getMobileBrowserInfo, checkCookieSupport } from '../utils/mobileDetection';

const MobileTroubleshooter = ({ onClose }) => {
  const [checks, setChecks] = useState({});

  useEffect(() => {
    if (isMobileBrowser()) {
      performChecks();
    }
  }, []);

  const performChecks = () => {
    const mobileInfo = getMobileBrowserInfo();
    const cookieSupport = checkCookieSupport();
    const isHttps = window.location.protocol === 'https:';
    const hasInternet = navigator.onLine;

    setChecks({
      mobile: {
        status: isMobileBrowser(),
        message: isMobileBrowser() ? 'Mobile device detected' : 'Not a mobile device',
        icon: isMobileBrowser() ? CheckCircle : XCircle,
        color: isMobileBrowser() ? '#4CAF50' : '#f44336'
      },
      cookies: {
        status: cookieSupport,
        message: cookieSupport ? 'Cookies are enabled' : 'Cookies are disabled',
        icon: cookieSupport ? CheckCircle : XCircle,
        color: cookieSupport ? '#4CAF50' : '#f44336'
      },
      https: {
        status: isHttps,
        message: isHttps ? 'Using secure connection (HTTPS)' : 'Not using secure connection',
        icon: isHttps ? CheckCircle : XCircle,
        color: isHttps ? '#4CAF50' : '#f44336'
      },
      internet: {
        status: hasInternet,
        message: hasInternet ? 'Internet connection available' : 'No internet connection',
        icon: hasInternet ? CheckCircle : XCircle,
        color: hasInternet ? '#4CAF50' : '#f44336'
      },
      browser: {
        status: true,
        message: `${mobileInfo.platform} - ${mobileInfo.browser}`,
        icon: CheckCircle,
        color: '#4CAF50'
      }
    });
  };

  const getBrowserInstructions = () => {
    const mobileInfo = getMobileBrowserInfo();
    
    if (mobileInfo.platform === 'iOS') {
      return {
        title: 'Safari Settings (iOS)',
        steps: [
          'Open Settings app',
          'Scroll down and tap "Safari"',
          'Tap "Privacy & Security"',
          'Turn OFF "Prevent Cross-Site Tracking"',
          'Turn OFF "Block All Cookies"',
          'Go back and try logging in again'
        ]
      };
    } else if (mobileInfo.platform === 'Android') {
      return {
        title: 'Chrome Settings (Android)',
        steps: [
          'Open Chrome browser',
          'Tap the three dots menu (⋮)',
          'Tap "Settings"',
          'Tap "Privacy and security"',
          'Tap "Cookies and other site data"',
          'Select "Allow all cookies"',
          'Go back and try logging in again'
        ]
      };
    } else {
      return {
        title: 'Browser Settings',
        steps: [
          'Enable cookies in your browser settings',
          'Allow cross-site tracking',
          'Try using a different browser',
          'Clear browser cache and cookies',
          'Try logging in again'
        ]
      };
    }
  };

  const allChecksPassed = Object.values(checks).every(check => check.status);

  if (!isMobileBrowser()) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
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
        maxWidth: '400px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Mobile Troubleshooter</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Let's check your mobile browser settings to fix login issues:
          </p>
        </div>

        {/* Status Checks */}
        <div style={{ marginBottom: '24px' }}>
          {Object.entries(checks).map(([key, check]) => {
            const IconComponent = check.icon;
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: check.status ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <IconComponent size={20} color={check.color} />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  {check.message}
                </span>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        {!allChecksPassed && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>
              {getBrowserInstructions().title}
            </h3>
            <ol style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              fontSize: '14px', 
              color: '#666',
              lineHeight: '1.6'
            }}>
              {getBrowserInstructions().steps.map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={performChecks}
            style={{
              flex: 1,
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Re-check Settings
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        {/* Success Message */}
        {allChecksPassed && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <CheckCircle size={20} color="#4CAF50" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, color: '#4CAF50', fontSize: '14px' }}>
              All checks passed! Try logging in again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTroubleshooter; 