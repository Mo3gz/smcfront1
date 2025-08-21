import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LogOut, Trophy, Package, RotateCcw, Map, Calendar, Users } from 'lucide-react';
import Scoreboard from './user/Scoreboard';
import Inventory from './user/Inventory';
import Spin from './user/Spin';
import MapView from './user/MapView';

import Notifications from './Notifications';
import GameSchedule from './GameSchedule';

import { API_BASE_URL } from '../utils/api';

const UserDashboard = ({ socket }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scoreboard');
  const [userData, setUserData] = useState(user);
  const [socketConnected, setSocketConnected] = useState(false);

  // Socket connection status
  useEffect(() => {
    if (socket) {
      const handleConnect = () => setSocketConnected(true);
      const handleDisconnect = () => setSocketConnected(false);
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      setSocketConnected(socket.connected);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  // Check if navbar is scrollable and add visual indicator
  useEffect(() => {
    const checkNavbarScroll = () => {
      const navContent = document.querySelector('.nav-content');
      if (navContent) {
        const isScrollable = navContent.scrollWidth > navContent.clientWidth;
        navContent.classList.toggle('scrollable', isScrollable);
      }
    };

    // Check on mount and resize
    checkNavbarScroll();
    window.addEventListener('resize', checkNavbarScroll);
    
    // Check after a short delay to ensure all content is loaded
    const timeoutId = setTimeout(checkNavbarScroll, 100);
    
    return () => {
      window.removeEventListener('resize', checkNavbarScroll);
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Listen for user updates
  useEffect(() => {
    if (socket) {
      const handleUserUpdate = (updatedUser) => {
        if (updatedUser.id === user.id) {
          setUserData(prev => ({ ...prev, ...updatedUser }));
        }
      };

      socket.on('user-update', handleUserUpdate);

      // Listen for team settings updates
      socket.on('user-team-settings-updated', (data) => {
        if (data.userId === user.id) {
          console.log('🔄 Team settings updated via socket:', data.teamSettings);
          setUserData(prev => ({
            ...prev,
            teamSettings: data.teamSettings
          }));
        }
      });

      return () => {
        socket.off('user-update');
        socket.off('user-team-settings-updated');
      };
    }
  }, [socket, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user data including team settings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First fetch user's team settings
        const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
          credentials: 'include',
        });
        
        if (userResponse.ok) {
          const userProfile = await userResponse.json();
          console.log('🔄 Fetched user profile:', userProfile);
          setUserData(prev => ({
            ...prev,
            ...userProfile,
            teamSettings: userProfile.teamSettings || {
              scoreboardVisible: true,
              spinLimitations: {
                lucky: { enabled: false, limit: 1 },
                gamehelper: { enabled: false, limit: 1 },
                challenge: { enabled: false, limit: 1 },
                hightier: { enabled: false, limit: 1 },
                lowtier: { enabled: false, limit: 1 },
                random: { enabled: false, limit: 1 }
              },
              spinCounts: { lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 }
            }
          }));
        }

        // Then fetch mining information (after user data is loaded)
        const miningResponse = await fetch(`${API_BASE_URL}/api/mining/info`, {
          credentials: 'include',
        });
        
        if (miningResponse.ok) {
          const miningData = await miningResponse.json();
          console.log('⛏️ Fetched mining info:', miningData);
          setUserData(prev => ({
            ...prev,
            miningRate: miningData.miningRate || 0,
            totalMined: miningData.totalMined || 0,
            lastMined: miningData.lastMined
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (user.id) {
      fetchUserData();
    }
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh mining rate after a short delay to ensure all data is loaded
  useEffect(() => {
    if (user.id && userData?.id) {
      const timer = setTimeout(() => {
        console.log('⏰ Refreshing mining rate after delay...');
        refreshMiningRate();
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [user.id, userData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  // Function to refresh mining rate
  const refreshMiningRate = async () => {
    try {
      console.log('🔄 Refreshing mining rate...');
      
      // First refresh user data to ensure we have the latest info
      const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
        credentials: 'include',
      });
      
      if (userResponse.ok) {
        const userProfile = await userResponse.json();
        setUserData(prev => ({
          ...prev,
          ...userProfile
        }));
      }
      
      // Then fetch mining information
      const miningResponse = await fetch(`${API_BASE_URL}/api/mining/info`, {
        credentials: 'include',
      });
      
      if (miningResponse.ok) {
        const miningData = await miningResponse.json();
        console.log('⛏️ Refreshed mining info:', miningData);
        setUserData(prev => ({
          ...prev,
          miningRate: miningData.miningRate || 0,
          totalMined: miningData.totalMined || 0,
          lastMined: miningData.lastMined
        }));
        
        if (miningData.miningRate > 0) {
          toast.success(`Mining rate updated: ${miningData.miningRate} kaizen/hr`);
        } else {
          toast.info('No countries owned yet. Buy countries to start mining!');
        }
      }
    } catch (error) {
      console.error('Error refreshing mining rate:', error);
      toast.error('Failed to refresh mining rate');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'scoreboard':
        return <Scoreboard socket={socket} />;
      case 'inventory':
        return <Inventory socket={socket} userData={userData} setUserData={setUserData} />;
      case 'spin':
        return <Spin socket={socket} userData={userData} setUserData={setUserData} />;
      case 'map':
        return <MapView userData={userData} setUserData={setUserData} socket={socket} />;
      case 'program':
        return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <h3>Program of the Day</h3>
          <p>Program information will be displayed here.</p>
        </div>;
              case 'matchups':
          return <GameSchedule />;
      default:
        return <Scoreboard socket={socket} />;
    }
  };

  return (
    <div className="container">
             <div className="app-header">
         <div className="user-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
           <div style={{ textAlign: 'left' }}>
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
        <div className="mining-stat-label">Kaizen</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">{userData?.score || 0}</div>
              <div className="mining-stat-label">Score</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">
                {userData?.miningRate || 0}
              </div>
              <div className="mining-stat-label">Mining Rate (kaizen/hr)</div>
              {userData?.miningRate === 0 && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#ff9800', 
                  marginTop: '2px',
                  cursor: 'pointer'
                }} onClick={refreshMiningRate} title="Click to refresh mining rate">
                  🔄 Refresh
                </div>
              )}
              {userData?.miningRate === 0 && (
                <div style={{ 
                  fontSize: '9px', 
                  color: '#999', 
                  marginTop: '1px',
                  fontStyle: 'italic'
                }}>
                  Buy countries to start mining!
                </div>
              )}
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
            onClick={() => {
              setActiveTab('map');
              // Refresh mining rate when navigating to map since it seems to fix the issue
              setTimeout(() => refreshMiningRate(), 500);
            }}
          >
            <Map className="nav-icon" />
            <span className="nav-text">Map</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            <Calendar className="nav-icon" />
            <span className="nav-text">Program</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'matchups' ? 'active' : ''}`}
            onClick={() => setActiveTab('matchups')}
          >
            <Users className="nav-icon" />
            <span className="nav-text">Game Schedule</span>
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