import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchTeams = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
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
  }, [logout]);

  const verifyAdminAccess = useCallback(async () => {
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
  }, [checkAdminStatus, fetchTeams, fetchNotifications]);

  useEffect(() => {
    verifyAdminAccess();

    // Listen for admin notifications
    socket.on('admin-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('admin-notification');
    };
  }, [socket, verifyAdminAccess]);

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
  const [cardType, setCardType] = useState('luck');
  const [selectedCard, setSelectedCard] = useState('');

  // Predefined cards based on the backend getCardsByType function
  const availableCards = {
    luck: [
      { name: 'Hidden Treasure', type: 'luck', effect: '+400 Points instantly' },
      { name: 'Camp Tax', type: 'luck', effect: '-300 Points go to the Bank' },
      { name: 'Golden Ticket', type: 'luck', effect: 'Pay 200 Points → If you win the next challenge, take +500 Points!' },
      { name: 'Mysterious Trader', type: 'luck', effect: 'Pay 150 Points → Get a random Attack Card' },
      { name: 'Everything Against Me', type: 'luck', effect: 'Instantly lose 250 Points' },
      { name: 'Double Up', type: 'luck', effect: 'Double your current points if you win any challenge in the next 30 minutes' },
      { name: 'Shady Deal', type: 'luck', effect: 'Steal 100 Points from any tent' }
    ],
    attack: [
      { name: 'Raid', type: 'attack', effect: 'Choose one team to raid. If you win the challenge, steal 300 Points from them.' },
      { name: 'Control Battle', type: 'attack', effect: 'Select one team to challenge in a one-on-one tent battle. Winner gets +500 Points.' },
      { name: 'Double Strike', type: 'attack', effect: 'Select one team to ally with and attack another tent together.' },
      { name: 'Break Alliances', type: 'attack', effect: 'Force 2 allied tents to break their alliance' },
      { name: 'Broad Day Robbery', type: 'attack', effect: 'Take 100 Points instantly from any tent' }
    ],
    alliance: [
      { name: 'Strategic Alliance', type: 'alliance', effect: 'Select one team to form an alliance with for 1 full day.' },
      { name: 'Betrayal Alliance', type: 'alliance', effect: 'Form an alliance, then betray them at the end to steal their points.' },
      { name: 'Golden Partnership', type: 'alliance', effect: 'Choose a team to team up with in the next challenge.' },
      { name: 'Temporary Truce', type: 'alliance', effect: 'Select 2 teams to pause all attacks between them for 1 full day.' },
      { name: 'Hidden Leader', type: 'alliance', effect: 'You become the challenge leader. Ally with another team.' }
    ]
  };

  const handleGiveCard = async (e) => {
    e.preventDefault();
    
    if (!selectedCard) {
      toast.error('Please select a card');
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
      await axios.post(`${API_BASE_URL}/api/admin/cards`, {
        teamId,
        cardName: selectedCard,
        cardType
      }, { withCredentials: true });

      toast.success('Card given successfully!');
      setTeamId('');
      setSelectedCard('');
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

  const getCardIcon = (type) => {
    switch (type) {
      case 'attack':
        return '⚔️';
      case 'alliance':
        return '🤝';
      case 'luck':
        return '🍀';
      default:
        return '📦';
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
              Card Type
            </label>
            <select
              className="input"
              value={cardType}
              onChange={(e) => {
                setCardType(e.target.value);
                setSelectedCard(''); // Reset selected card when type changes
              }}
              required
            >
              <option value="luck">🍀 Luck</option>
              <option value="attack">⚔️ Attack</option>
              <option value="alliance">🤝 Alliance</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
              Select Card
            </label>
            <select
              className="input"
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              required
            >
              <option value="">Choose a card...</option>
              {availableCards[cardType]?.map((card) => (
                <option key={card.name} value={card.name}>
                  {getCardIcon(card.type)} {card.name}
                </option>
              ))}
            </select>
            {selectedCard && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                background: 'rgba(102, 126, 234, 0.1)', 
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666'
              }}>
                <strong>Effect:</strong> {availableCards[cardType]?.find(c => c.name === selectedCard)?.effect}
              </div>
            )}
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
  const getCardIcon = (type) => {
    switch (type) {
      case 'attack':
        return '⚔️';
      case 'alliance':
        return '🤝';
      case 'luck':
        return '🍀';
      default:
        return '📦';
    }
  };

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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{getCardIcon(notification.cardType)}</span>
                    <h4 style={{ color: '#333', margin: 0 }}>
                      {notification.teamName} used {notification.cardName}
                    </h4>
                  </div>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                    <strong>Card Type:</strong> {notification.cardType.charAt(0).toUpperCase() + notification.cardType.slice(1)}
                  </p>
                  {notification.selectedTeam && (
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Target Team:</strong> {notification.selectedTeam}
                    </p>
                  )}
                  {notification.description && (
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Description:</strong> {notification.description}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginLeft: '16px', textAlign: 'right' }}>
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