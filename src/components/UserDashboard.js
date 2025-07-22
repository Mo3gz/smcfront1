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

          {/* Program of the Day Section */}
          <ProgramOfTheDay />
        </div>
      </nav>
    </div>
  );
};

const programData = [
  {
    day: 'Day 1',
    schedule: [
      '7:30--9:30\tالقداس',
      '9:30--10:00\tفطار',
      '10:00--11:30\tتحرك--وصول',
      '11:30--12:00\tتغيير هدوم',
      '12:00--1:00\tنصب الخيم',
      '1:00--1:30\tمقدمه المعسكر',
      '1:30--3:00\tتحضير تفتيش',
      '3:00--4:30\tبسين(بنات)----راحه(ولاد)',
      '4:30--6:00\tبسين(ولاد)----راحه(بنات)',
      '6:00--6:30\tغذاء',
      '6:30--6:45\tلبس',
      '6:45--7:30\tتفتيش+صلاه',
      '7:30--8:30\tمحاضره',
      '8:30--10:00\tالعاب',
      '10:00--11:00\tتحضير السمر',
      '11:00--12:00\tالسمر+عشاء+صلاه',
    ],
  },
  {
    day: 'Day 2',
    schedule: [
      '7:15--8:00\tصحيان وتغيير هدوم',
      '8:00--8:20\tصلاة',
      '8:20--8:45\tطابور رياضي',
      '8:45--9:30\tفطار',
      '9:30--11:30\tتحضير تفتيش',
      '11:30--12:30\tمحاضرة',
      '12:30--2:00\tكنز',
      '2:00--3:00\tغذاء',
      '3:00--4:30\tبسين(بنات)--راحه(ولاد)',
      '4:30--6:00\tبسين(ولاد)--راحه(بنات)',
      '6:00--6:45\tاستحمام ولبس',
      '6:45--8:00\tتفتيش+صلاه غروب',
      '8:00--8:45\tكلمه كابتن بونو',
      '8:45--9:45\tتحضير السمر',
      '9:45--10:45\tالسمر+فيديوهات+صلاه+عشاء',
      '10:45\tفقره حره',
    ],
  },
  {
    day: 'Day 3',
    schedule: [
      '8:15--9:00\tصحيان+تغيير هدوم',
      '9:00--9:15\tصلاه باكر',
      '9:15--10:00\tلم الخيم والنماذج',
      '10:00--11:00\tconclusion - خيمه مثاليه',
      '11:30\tتحرك',
    ],
  },
];

function ProgramOfTheDay() {
  const [openDay, setOpenDay] = React.useState(null);

  return (
    <div className="nav-item" style={{ width: '100%' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Program of the Day</div>
      {programData.map((day, idx) => (
        <div key={day.day} style={{ marginBottom: 4 }}>
          <button
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '6px 12px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              marginBottom: 2,
            }}
            onClick={() => setOpenDay(openDay === idx ? null : idx)}
          >
            {day.day} {openDay === idx ? '▲' : '▼'}
          </button>
          {openDay === idx && (
            <div style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 6,
              marginTop: 2,
              marginBottom: 6,
              padding: '8px 12px',
              fontSize: 14,
              direction: 'rtl',
              textAlign: 'right',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {day.schedule.map((item, i) => (
                <div key={i} style={{ marginBottom: 2 }}>{item}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default UserDashboard; 