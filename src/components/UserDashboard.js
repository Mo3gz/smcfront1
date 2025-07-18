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

const UserDashboard = ({ socket }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scoreboard');
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    // Listen for real-time user updates
    socket.on('user-update', (updatedUser) => {
      if (updatedUser.id === user.id) {
        setUserData(prev => ({ ...prev, ...updatedUser }));
      }
    });

    return () => {
      socket.off('user-update');
    };
  }, [socket, user.id]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'scoreboard':
        return <Scoreboard />;
      case 'inventory':
        return <Inventory socket={socket} />;
      case 'spin':
        return <Spin socket={socket} userData={userData} setUserData={setUserData} />;
      case 'map':
        return <MapView userData={userData} setUserData={setUserData} />;
      default:
        return <Scoreboard />;
    }
  };

  return (
    <div className="container">
      <div className="app-header">
        <h1 className="app-title">Scout Game</h1>
        <div className="user-info">
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {userData?.teamName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Team Member
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            <LogOut size={16} />
          </button>
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
        </div>
      </nav>
    </div>
  );
};

export default UserDashboard; 