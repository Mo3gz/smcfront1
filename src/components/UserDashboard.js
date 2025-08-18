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
import CalendarIcon from '../assets/CalendarIcon';

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
  }, [socket, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch mining information
  useEffect(() => {
    const fetchMiningInfo = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app'}/api/mining/info`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const miningData = await response.json();
          setUserData(prev => ({
            ...prev,
            miningRate: miningData.miningRate,
            totalMined: miningData.totalMined,
            lastMined: miningData.lastMined
          }));
        }
      } catch (error) {
        console.error('Error fetching mining info:', error);
      }
    };

    if (user.id) {
      fetchMiningInfo();
    }
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const handleCollectCoins = async () => {
    if (!userData?.miningRate || userData?.miningRate === 0) {
      toast.error('You need to own countries to mine coins!');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app'}/api/mining/collect`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to collect coins');
      }

      const data = await response.json();
      
      // Update user data with new values
      setUserData(prev => ({ 
        ...prev, 
        coins: data.newCoins, 
        lastMined: data.lastMined,
        totalMined: data.totalMined
      }));
      
      toast.success(`Successfully mined ${data.earned} coins!`);
    } catch (error) {
      toast.error(error.message || 'Failed to collect coins');
    }
  };

  // Calculate next collection time
  const getNextCollectionTime = () => {
    if (!userData?.lastMined || !userData?.miningRate) return null;
    
    const lastMined = new Date(userData.lastMined);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - lastMined) / (1000 * 60));
    const minutesPerCoin = 60 / (userData.miningRate / 60);
    const minutesUntilNext = Math.max(0, minutesPerCoin - elapsedMinutes);
    
    if (minutesUntilNext === 0) return 'Ready to collect!';
    
    const hours = Math.floor(minutesUntilNext / 60);
    const minutes = minutesUntilNext % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until next collection`;
    } else {
      return `${minutes}m until next collection`;
    }
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
          <div className="mining-stats">
            <div className="mining-stat-item">
              <div className="mining-stat-value">{userData?.coins || 0}</div>
              <div className="mining-stat-label">Coins</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">{userData?.score || 0}</div>
              <div className="mining-stat-label">Score</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">
                {userData?.miningRate ? Math.floor(userData.miningRate / 60) : 0}
              </div>
              <div className="mining-stat-label">Mining Rate (coins/hr)</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">{userData?.totalMined || 0}</div>
              <div className="mining-stat-label">Total Mined</div>
            </div>
          </div>
          
          {/* Collect Coins Button */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              className="mining-button"
              onClick={handleCollectCoins}
              disabled={!userData?.miningRate || userData?.miningRate === 0}
            >
              ⛏️ Collect Coins
            </button>
            {userData?.lastMined && (
              <div className="last-collected">
                Last collected: {new Date(userData.lastMined).toLocaleString()}
              </div>
            )}
            {getNextCollectionTime() && (
              <div className="next-collection-time">
                {getNextCollectionTime()}
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
            <Map className="nav-icon" />
            <span className="nav-text">Map</span>
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