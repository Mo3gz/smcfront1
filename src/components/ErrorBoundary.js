import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <AlertTriangle size={64} style={{ marginBottom: '20px' }} />
          <h1 style={{ marginBottom: '16px', fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '24px', opacity: 0.9, maxWidth: '400px' }}>
            We encountered an unexpected error. This might be due to a mobile browser compatibility issue.
          </p>
          
          <button
            onClick={this.handleRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <RefreshCw size={20} />
            Try Again
          </button>
          
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '8px',
            fontSize: '14px',
            opacity: 0.8
          }}>
            <p style={{ margin: '0 0 8px 0' }}>If the problem persists:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', textAlign: 'left' }}>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Use a different browser</li>
              <li>Check your internet connection</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 