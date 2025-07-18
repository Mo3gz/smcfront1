import React, { useState, useCallback, useEffect } from 'react';
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
  const [teamsWithCards, setTeamsWithCards] = useState([]);
  const [collapsedTeams, setCollapsedTeams] = useState({});

  // Fetch all teams and their cards for admin (move this up before useEffect)
  const fetchTeamsWithCards = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
      // Use the correct endpoint
      const response = await axios.get(`${API_BASE_URL}/api/admin/teams-cards`, { withCredentials: true });
      setTeamsWithCards(response.data);
    } catch (error) {
      console.error('Error fetching teams and cards:', error);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
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
      toast.error('Admin access denied. Please check your permissions.');
      await logout();
    }
  }, [checkAdminStatus, fetchTeams, fetchNotifications, logout]);

  useEffect(() => {
    if (user) {
      verifyAdminAccess();
    }
  }, [user, verifyAdminAccess]);

  useEffect(() => {
    if (socket && adminVerified) {
      socket.on('admin-notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        toast.info(`New notification from ${notification.teamName}`);
      });
      // Listen for real-time scoreboard updates
      socket.on('scoreboard-update', (updatedUsers) => {
        // Filter only user teams and sort by score
        const updatedScoreboard = updatedUsers
          .filter(user => user.role === 'user')
          .map(user => ({
            id: user.id || user._id,
            teamName: user.teamName,
            score: user.score,
            coins: user.coins
          }))
          .sort((a, b) => b.score - a.score);
        setTeams(updatedScoreboard);
        // Refetch teamsWithCards for real-time update
        fetchTeamsWithCards();
      });
      // Listen for inventory updates (cards)
      socket.on('inventory-update', () => {
        fetchTeamsWithCards();
      });
      return () => {
        socket.off('admin-notification');
        socket.off('scoreboard-update');
        socket.off('inventory-update');
      };
    }
  }, [socket, adminVerified, fetchTeamsWithCards]);

  useEffect(() => {
    if (adminVerified) {
      fetchTeamsWithCards();
    }
  }, [adminVerified, fetchTeamsWithCards]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed, but you will be redirected');
      // Force logout even if there's an error
      window.location.reload();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'promocodes':
        return <PromoCodes teams={teams} />;
      case 'cards':
        return <CardManagement teams={teams} />;
      case 'notifications':
        return <AdminNotifications notifications={notifications} />;
      case 'scoreboard':
        return <AdminScoreboard teams={teams} />;
      case 'teams':
        return <TeamManagement teams={teams} fetchTeams={fetchTeams} />;
      default:
        return <PromoCodes teams={teams} />;
    }
  };

  // Collapsible handler
  const toggleTeamCollapse = (teamId) => {
    setCollapsedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  if (!adminVerified) {
    return (
      <div className="container">
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
            <h3>Verifying Admin Access...</h3>
            <p style={{ color: '#666' }}>Please wait while we verify your permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {user?.teamName || user?.username}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Administrator
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* <Notifications /> */}
            <button 
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '14px' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {renderContent()}
        {/* Collapsible Teams & Their Cards section, only on cards and scoreboard tabs */}
        {(activeTab === 'cards' || activeTab === 'scoreboard') && (
          <div className="card" style={{ marginTop: 32 }}>
            <h3>Teams & Their Cards</h3>
            {teamsWithCards.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '24px' }}>No teams or cards found.</div>
            ) : (
              teamsWithCards.map(team => (
                <div key={team.id} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                  <div
                    style={{ fontWeight: 600, fontSize: 16, color: '#333', marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={() => toggleTeamCollapse(team.id)}
                  >
                    <span>{team.teamName} ({team.username})</span>
                    <span style={{ fontSize: 18, marginLeft: 8 }}>{collapsedTeams[team.id] ? '▼' : '▶'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Score: {team.score} | Coins: {team.coins}</div>
                  {collapsedTeams[team.id] && (
                    <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>
                      <strong>Cards:</strong>
                      {team.cards && team.cards.length > 0 ? (
                        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                          {Object.values(
                            team.cards.reduce((acc, card) => {
                              const key = card.name + '|' + card.type + '|' + card.effect;
                              if (!acc[key]) {
                                acc[key] = { ...card, count: 1 };
                              } else {
                                acc[key].count += 1;
                              }
                              return acc;
                            }, {})
                          ).map(card => (
                            <li key={card.name + card.type + card.effect} style={{ marginBottom: 4 }}>
                              <span style={{ fontWeight: 500 }}>{card.count > 1 ? `${card.count} x ` : ''}{card.name}</span> <span style={{ color: '#999' }}>({card.type})</span> - <span style={{ fontSize: 12 }}>{card.effect}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#aaa', marginLeft: 8 }}>No cards</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
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
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
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
        toast.error('Failed to create promo code');
      }
    }
  };

  return (
    <div className="card">
      <h3>Create Promo Code</h3>
      <form onSubmit={handleCreatePromo}>
        <div style={{ marginBottom: '16px' }}>
          <label>Promo Code</label>
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
          <label>Team</label>
          <select
            className="input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          >
            <option value="">Select a team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label>Discount (%)</label>
          <input
            type="number"
            className="input"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            min="1"
            max="100"
            required
          />
        </div>
        
        <button type="submit" className="btn">
          Create Promo Code
        </button>
      </form>
    </div>
  );
};

// Card Management Component
const CardManagement = ({ teams }) => {
  const [teamId, setTeamId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('luck');

  const cardTypes = [
    { value: 'luck', label: 'Luck Card' },
    { value: 'attack', label: 'Attack Card' },
    { value: 'alliance', label: 'Alliance Card' }
  ];

  const handleGiveCard = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
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
        toast.error('Failed to give card');
      }
    }
  };

  return (
    <div className="card">
      <h3>Give Card to Team</h3>
      <form onSubmit={handleGiveCard}>
        <div style={{ marginBottom: '16px' }}>
          <label>Team</label>
          <select
            className="input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          >
            <option value="">Select a team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label>Card Name</label>
          <input
            type="text"
            className="input"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Enter card name"
            required
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label>Card Type</label>
          <select
            className="input"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            required
          >
            {cardTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <button type="submit" className="btn">
          Give Card
        </button>
      </form>
    </div>
  );
};

// Admin Notifications Component
const AdminNotifications = ({ notifications }) => {
  return (
    <div className="card">
      <h3>Team Notifications</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No notifications yet
          </p>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} style={{
              padding: '12px',
              border: '1px solid #eee',
              borderRadius: '8px',
              marginBottom: '8px',
              background: notification.read ? '#f9f9f9' : 'white'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {notification.teamName} - {notification.type}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                {notification.message || `Used ${notification.cardName}`}
                {notification.selectedTeam && (
                  <span style={{ display: 'block', color: '#2196f3', fontWeight: 500, marginTop: '4px' }}>
                    Target: {notification.selectedTeam}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {new Date(notification.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Admin Scoreboard Component
const AdminScoreboard = ({ teams }) => {
  return (
    <div className="card">
      <h3>Team Scoreboard</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Score</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Coins</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>#{index + 1}</td>
                <td style={{ padding: '12px', fontWeight: '600' }}>{team.teamName}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{team.score}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{team.coins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement = ({ teams, fetchTeams }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [coinAmount, setCoinAmount] = useState(0);
  const [scoreAmount, setScoreAmount] = useState(0);
  const [reason, setReason] = useState('');

  const handleUpdateCoins = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
      await axios.post(`${API_BASE_URL}/api/admin/coins`, {
        teamId: selectedTeam,
        amount: coinAmount,
        reason
      }, { withCredentials: true });

      toast.success('Coins updated successfully!');
      setCoinAmount(0);
      setReason('');
      fetchTeams();
    } catch (error) {
      console.error('Update coins error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to update coins');
      }
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
      await axios.post(`${API_BASE_URL}/api/admin/score`, {
        teamId: selectedTeam,
        amount: scoreAmount,
        reason
      }, { withCredentials: true });

      toast.success('Score updated successfully!');
      setScoreAmount(0);
      setReason('');
      fetchTeams();
    } catch (error) {
      console.error('Update score error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to update score');
      }
    }
  };

  return (
    <div className="card">
      <h3>Team Management</h3>
      
      <div style={{ marginBottom: '24px' }}>
        <label>Select Team</label>
        <select
          className="input"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          required
        >
          <option value="">Select a team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.teamName} (Score: {team.score}, Coins: {team.coins})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <form onSubmit={handleUpdateCoins}>
          <h4>Update Coins</h4>
          <div style={{ marginBottom: '16px' }}>
            <label>Coin Amount (+ or -)</label>
            <input
              type="number"
              className="input"
              value={coinAmount}
              onChange={(e) => setCoinAmount(Number(e.target.value))}
              placeholder="Enter amount (positive or negative)"
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Reason</label>
            <input
              type="text"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for coin update"
              required
            />
          </div>
          <button type="submit" className="btn" disabled={!selectedTeam}>
            Update Coins
          </button>
        </form>

        <form onSubmit={handleUpdateScore}>
          <h4>Update Score</h4>
          <div style={{ marginBottom: '16px' }}>
            <label>Score Amount (+ or -)</label>
            <input
              type="number"
              className="input"
              value={scoreAmount}
              onChange={(e) => setScoreAmount(Number(e.target.value))}
              placeholder="Enter amount (positive or negative)"
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Reason</label>
            <input
              type="text"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for score update"
              required
            />
          </div>
          <button type="submit" className="btn" disabled={!selectedTeam}>
            Update Score
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;

