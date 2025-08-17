import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Trophy, 
  Package, 
  RotateCcw, 
  Map, 
  LogOut,
  HardHat,
  Zap
} from 'lucide-react';
import Scoreboard from './user/Scoreboard';
import Inventory from './user/Inventory';
import Spin from './user/Spin';
import MapView from './user/MapView';
import Notifications from './Notifications';
import Logo from '../assets/Logo.png';
import ProgramOfTheDay from './ProgramOfTheDay';
import CalendarIcon from '../assets/CalendarIcon';
import axios from 'axios';

const UserDashboard = ({ socket }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scoreboard');
  const [userData, setUserData] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [miningStats, setMiningStats] = useState({
    totalMiningRate: 0,
    estimatedNextHour: 0,
    lastCollected: null,
    countries: []
  });
  const [miningRate, setMiningRate] = useState(0);

  // Auto-collect coins on component mount and when mining rate changes
  useEffect(() => {
    const collectMiningRewards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app'}/api/mining/collect`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );
        
        if (response.data.success && userData) {
          setUserData(prev => ({
            ...prev,
            coins: response.data.newBalance
          }));
        }
      } catch (error) {
        console.error('Error collecting mining rewards:', error);
      }
    };
    
    if (userData) {
      collectMiningRewards();
    }
  }, [userData]);

  useEffect(() => {
    const fetchMiningStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app'}/api/mining/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setMiningStats(data);
        }
      } catch (error) {
        console.error('Error fetching mining stats:', error);
      }
    };

    fetchMiningStats();
    const interval = setInterval(fetchMiningStats, 60000); // Update every minute

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

    return () => clearInterval(interval);
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
            {miningStats.totalMiningRate > 0 && (
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <HardHat size={12} className="text-yellow-500" />
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Mining: {miningStats.totalMiningRate}/h
                </span>
              </div>
            )}
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
            {miningStats.totalMiningRate > 0 && (
              <div className="stat-item">
                <div className="stat-value">
                  <div className="flex items-center gap-1">
                    <HardHat size={16} className="text-yellow-500" />
                    <span>{miningStats.totalMiningRate}/h</span>
                  </div>
                </div>
                <div className="stat-label">Mining Rate</div>
              </div>
            )}
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
            <Map size={20} />
            <span>Map</span>
            {miningStats.estimatedNextHour > 0 && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                <Zap size={10} fill="white" />
              </div>
            )}
          </div>
          <div 
            className={`nav-item ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            <span className="nav-icon"><CalendarIcon width={24} height={24} /></span>
            <span className="nav-text">Program</span>
          </div>
        </div>
      </nav>
      <div style={{ textAlign: 'center', padding: '20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>
          Developed by <strong style={{ color: 'white' }}>Ayman</strong>
        </p>
      </div>
    </div>
  );
};

export default UserDashboard; 