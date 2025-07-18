import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Gift, 
  Package, 
  Users, 
  Trophy, 
  LogOut
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = ({ socket }) => {
  const { user, logout, checkAdminStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('promocodes');
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    verifyAdminAccess();

    // Listen for admin notifications
    socket.on('admin-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('admin-notification');
    };
  }, [socket]);

  const verifyAdminAccess = async () => {
    const result = await checkAdminStatus();
    if (result.success) {
      setAdminVerified(true);
      fetchTeams();
      fetchNotifications();
    } else {
      console.error('Admin verification failed:', result.error);
      toast.error('Admin access denied. Please log in as admin.');
      // Redirect to login or show error
    }
  };

  const fetchTeams = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      const response = await axios.get(`${API_BASE_URL}/api/admin/notifications`, { withCredentials: true });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        await logout();
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'promocodes':
        return <PromoCodes teams={teams} />;
      case 'cards':
        return <CardManagement teams={teams} />;
      case 'notifications':
        return <Notifications notifications={notifications} />;
      case 'scoreboard':
        return <LiveScoreboard teams={teams} />;
      case 'teams':
        return <TeamManagement teams={teams} fetchTeams={fetchTeams} />;
      default:
        return <PromoCodes teams={teams} />;
    }
  };

  if (!adminVerified) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="app-header">
        <h1 className="app-title">Admin Dashboard</h1>
        <div className="user-info">
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {user?.teamName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Administrator
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
        {renderContent()}
      </div>

      <nav className="navbar">
        <div className="nav-content">
          <div 
            className={`nav-item ${activeTab === 'promocodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('promocodes')}
          >
            <Gift className="nav-icon" />
            <span className="nav-text">Promo Codes</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <Package className="nav-icon" />
            <span className="nav-text">Cards</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Settings className="nav-icon" />
            <span className="nav-text">Notifications</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'scoreboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoreboard')}
          >
            <Trophy className="nav-icon" />
            <span className="nav-text">Scoreboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users className="nav-icon" />
            <span className="nav-text">Teams</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

// Promo Codes Component
const PromoCodes = ({ teams }) => {
  const [code, setCode] = useState('');
  const [teamId, setTeamId] = useState('');
  const [discount, setDiscount] = useState(10);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      await axios.post(`${API_BASE_URL}/api/admin/promocodes`, {
        code,
        teamId,
        discount
      }, { withCredentials: true });

      toast.success('Promo code created successfully!');
      setCode('');
      setTeamId('');
      setDiscount(10);
    } catch (error) {
      console.error('Create promo error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create promo code');
      }
    }
  };

  return (
    <div>
      <div className="header">
        <h1>🎁 Promo Codes</h1>
        <p>Create discount codes for teams</p>
      </div>

      <div className="card">
        <form onSubmit={handleCreatePromo}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Promo Code
            </label>
            <input
              type="text"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter promo code"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Team
            </label>
            <select
              className="input"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
            >
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Discount Percentage
            </label>
            <input
              type="number"
              className="input"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value))}
              min="1"
              max="100"
              required
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>
            Create Promo Code
          </button>
        </form>
      </div>
    </div>
  );
};

// Card Management Component
const CardManagement = ({ teams }) => {
  const [teamId, setTeamId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('luck');

  const handleGiveCard = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      await axios.post(`${API_BASE_URL}/api/admin/cards`, {
        teamId,
        cardName,
        cardType
      }, { withCredentials: true });

      toast.success('Card given successfully!');
      setTeamId('');
      setCardName('');
      setCardType('luck');
    } catch (error) {
      console.error('Give card error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to give card');
      }
    }
  };

  return (
    <div>
      <div className="header">
        <h1>📦 Give Cards</h1>
        <p>Give cards to specific teams</p>
      </div>

      <div className="card">
        <form onSubmit={handleGiveCard}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Team
            </label>
            <select
              className="input"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
            >
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Card Name
            </label>
            <input
              type="text"
              className="input"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Enter card name"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Card Type
            </label>
            <select
              className="input"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              required
            >
              <option value="luck">Luck</option>
              <option value="attack">Attack</option>
              <option value="alliance">Alliance</option>
            </select>
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>
            Give Card
          </button>
        </form>
      </div>
    </div>
  );
};

// Notifications Component
const Notifications = ({ notifications }) => {
  return (
    <div>
      <div className="header">
        <h1>🔔 Notifications</h1>
        <p>Card usage notifications</p>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Settings size={48} color="#667eea" />
            <p style={{ marginTop: '16px', color: '#666' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>
                    {notification.teamName} used {notification.cardName}
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                    Card Type: {notification.cardType}
                  </p>
                  {notification.selectedTeam && (
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                      Target Team: {notification.selectedTeam}
                    </p>
                  )}
                  {notification.description && (
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      Description: {notification.description}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Live Scoreboard Component
const LiveScoreboard = ({ teams }) => {
  return (
    <div>
      <div className="header">
        <h1>🏆 Live Scoreboard</h1>
        <p>Real-time team rankings</p>
      </div>

      <div className="card">
        {teams.map((team, index) => (
          <div key={team.id} className="scoreboard-item">
            <div className="scoreboard-rank">
              #{index + 1}
            </div>
            <div className="scoreboard-info">
              <div className="scoreboard-name">{team.teamName}</div>
              <div className="scoreboard-stats">
                Score: {team.score} • Coins: {team.coins}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement = ({ teams, fetchTeams }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('coins');

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      const endpoint = action === 'coins' ? `${API_BASE_URL}/api/admin/coins` : `${API_BASE_URL}/api/admin/score`;
      await axios.post(endpoint, {
        teamId: selectedTeam,
        amount: parseInt(amount),
        reason
      }, { withCredentials: true });

      toast.success(`${action === 'coins' ? 'Coins' : 'Score'} updated successfully!`);
      setSelectedTeam('');
      setAmount('');
      setReason('');
      fetchTeams();
    } catch (error) {
      console.error('Update team error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update team');
      }
    }
  };

  return (
    <div>
      <div className="header">
        <h1>👥 Team Management</h1>
        <p>Manage team coins and scores</p>
      </div>

      <div className="card">
        <form onSubmit={handleUpdateTeam}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Team
            </label>
            <select
              className="input"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              required
            >
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Action
            </label>
            <select
              className="input"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              required
            >
              <option value="coins">Update Coins</option>
              <option value="score">Update Score</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Amount (use negative for decrease)
            </label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Reason
            </label>
            <input
              type="text"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for update"
              required
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>
            Update Team
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard; 