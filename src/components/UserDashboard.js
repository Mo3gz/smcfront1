import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Trophy, 
  Package, 
  RotateCcw, 
  Map, 
  LogOut
} from 'lucide-react';
import Scoreboard from './user/Scoreboard';
import Inventory from './user/Inventory';
import Spin from './user/Spin';
import MapView from './user/MapView';
import Notifications from './Notifications';
import Logo from '../assets/Logo.png';
import ProgramOfTheDay from './ProgramOfTheDay';

const UserDashboard = ({ socket }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scoreboard');
  const [userData, setUserData] = useState(user);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Check socket connection status
    if (socket) {
      setSocketConnected(socket.connected);
      
      socket.on('connect', () => {
        console.log('Socket connected');
        setSocketConnected(true);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setSocketConnected(false);
      });

      // Listen for real-time user updates
      socket.on('user-update', (updatedUser) => {
        if (updatedUser.id === user.id) {
          setUserData(prev => ({ ...prev, ...updatedUser }));
        }
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('user-update');
      };
    }
  }, [socket, user.id]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'scoreboard':
        return <Scoreboard socket={socket} />;
      case 'inventory':
        return <Inventory socket={socket} />;
      case 'spin':
        return <Spin socket={socket} userData={userData} setUserData={setUserData} />;
      case 'map':
        return <MapView userData={userData} setUserData={setUserData} socket={socket} />;
      case 'program':
        return <ProgramOfTheDay />;
      default:
        return <Scoreboard socket={socket} />;
    }
  };

  return (
    <div className="container">
      <div className="app-header">
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={Logo} alt="Logo" style={{ height: 80, width: 80, objectFit: 'contain', borderRadius: 12 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {userData?.teamName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Team Member
            </div>
            {/* Socket connection indicator */}
            <div style={{ 
              fontSize: '10px', 
              color: socketConnected ? '#4CAF50' : '#f44336',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: socketConnected ? '#4CAF50' : '#f44336', 
                borderRadius: '50%',
                animation: socketConnected ? 'pulse 2s infinite' : 'none'
              }}></div>
              {socketConnected ? 'Live' : 'Offline'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Notifications />
            <button 
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="user-info">
          <div className="user-stats">
            <div className="stat-item">
              <div className="stat-value">{userData?.coins || 0}</div>
              <div className="stat-label">Coins</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData?.score || 0}</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>

      <nav className="navbar">
        <div className="nav-content">
          <div 
            className={`nav-item ${activeTab === 'scoreboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoreboard')}
          >
            <Trophy className="nav-icon" />
            <span className="nav-text">Scoreboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Package className="nav-icon" />
            <span className="nav-text">Inventory</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'spin' ? 'active' : ''}`}
            onClick={() => setActiveTab('spin')}
          >
            <RotateCcw className="nav-icon" />
            <span className="nav-text">Spin</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <Map className="nav-icon" />
            <span className="nav-text">Map</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            <span className="nav-icon" style={{ color: 'black' }}>🗓️</span>
            <span className="nav-text">Program</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default UserDashboard; 