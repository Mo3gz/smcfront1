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
        fetchNotifications(); // Only fetch from backend, don't add directly
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
  }, [socket, adminVerified, fetchTeamsWithCards, fetchNotifications]);

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

// Add the card list at the top of the file (copy from backend getCardsByType)
const allCards = {
  luck: [
    { name: "i`amphoteric", type: 'luck', effect: '+150 Coins instantly' },
    { name: "Everything Against Me", type: 'luck', effect: 'Instantly lose 75 Coins' },
    { name: 'el-7aramy', type: 'luck', effect: 'Btsr2 100 coin men ay khema, w law et3raft birg3o el double' }
  ],
  attack: [
    { name: 'wesh-le-wesh', type: 'attack', effect: '1v1 battle' },
    { name: 'ana-el-7aramy', type: 'attack', effect: 'Btakhod 100 coins men ay khema mnghir ay challenge' },
    { name: 'ana-w-bas', type: 'attack', effect: 'Bt3mel risk 3ala haga' }
  ],
  alliance: [
    { name: 'el-nadala', type: 'alliance', effect: 'Bt3mel t7alof w tlghih f ay wa2t w takhod el coins 3ady' },
    { name: 'el-sohab', type: 'alliance', effect: 'Bt3mel t7alof 3ady' },
    { name: 'el-melok', type: 'alliance', effect: 'Btst5dm el khema el taniaa y3melo el challenges makanak' }
  ]
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
  // Find the selected card object for effect display
  const selectedCard = allCards[cardType].find(card => card.name === cardName);
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
          <label>Card Type</label>
          <select
            className="input"
            value={cardType}
            onChange={e => { setCardType(e.target.value); setCardName(''); }}
            required
          >
            {cardTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>Card Name</label>
          <select
            className="input"
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            required
            disabled={!cardType}
          >
            <option value="">Select a card</option>
            {allCards[cardType].map(card => (
              <option key={card.name} value={card.name}>{card.name}</option>
            ))}
          </select>
        </div>
        {selectedCard && (
          <div style={{ marginBottom: '16px', color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
            <strong>Effect:</strong> {selectedCard.effect}
          </div>
        )}
        <button type="submit" className="btn" disabled={!teamId || !cardName || !cardType}>
          Give Card
        </button>
      </form>
    </div>
  );
};

// Admin Notifications Component
const AdminNotifications = ({ notifications }) => {
  const [filter, setFilter] = useState('all');
  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Admin Actions', value: 'admin-action' },
    { label: 'Spins', value: 'spins' },
    { label: 'Cards', value: 'card-used' },
    { label: 'Countries', value: 'country-bought' }
  ];

  // Format notification message based on action type
  const formatNotificationMessage = (notification) => {
    if (notification.type === 'admin-action') {
      // For admin actions, we already have a formatted message
      return notification.message;
    }
    // For other notification types, use the existing format
    return notification.message || `Used ${notification.cardName}`;
  };

  // Filter notifications based on selected filter
  let filteredNotifications = [];
  if (filter === 'all') {
    filteredNotifications = notifications.filter(n => n.recipientType === 'admin');
  } else if (filter === 'spins') {
    filteredNotifications = notifications.filter(n => 
      (n.type === 'spin' || n.type === 'admin-spin') && n.recipientType === 'admin'
    );
  } else if (filter === 'admin-action') {
    filteredNotifications = notifications.filter(n => n.type === 'admin-action');
  } else {
    filteredNotifications = notifications.filter(n => n.type === filter && n.recipientType === 'admin');
  }

  // Sort by timestamp, newest first
  filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Get badge color based on notification type
  const getBadgeColor = (type) => {
    switch(type) {
      case 'admin-action':
        return { bg: '#e6f7ff', color: '#1890ff', text: 'Admin Action' };
      case 'spin':
      case 'admin-spin':
        return { bg: '#f6ffed', color: '#52c41a', text: 'Spin' };
      case 'card-used':
        return { bg: '#fff7e6', color: '#fa8c16', text: 'Card Used' };
      case 'country-bought':
        return { bg: '#f9f0ff', color: '#722ed1', text: 'Country' };
      default:
        return { bg: '#f5f5f5', color: '#595959', text: type };
    }
  };

  return (
    <div className="card">
      <h3>Admin Notifications</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {filterOptions.map(opt => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              className={isActive ? 'btn btn-primary' : 'btn'}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                background: isActive ? '#4f46e5' : '#f3f4f6',
                color: isActive ? 'white' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(79, 70, 229, 0.2)' : 'none'
              }}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: '15px'
          }}>
            <div style={{ marginBottom: '10px' }}>📭</div>
            No notifications found
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const badge = getBadgeColor(notification.type);
            const isAdminAction = notification.type === 'admin-action';
            
            return (
              <div 
                key={notification.id} 
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  background: notification.read ? '#f9fafb' : 'white',
                  transition: 'all 0.2s',
                  ':hover': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    borderColor: '#d1d5db'
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: badge.color,
                      background: badge.bg,
                      borderRadius: '12px',
                      padding: '2px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '24px'
                    }}>
                      {badge.text}
                    </span>
                    {isAdminAction && notification.metadata?.targetTeamName && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#4b5563',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        padding: '2px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '24px'
                      }}>
                        Team: {notification.metadata.targetTeamName}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    whiteSpace: 'nowrap',
                    marginLeft: '8px'
                  }}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>

                <div style={{ 
                  fontSize: '14px', 
                  color: '#111827',
                  lineHeight: '1.5',
                  marginBottom: '8px'
                }}>
                  {formatNotificationMessage(notification)}
                </div>

                {isAdminAction && notification.metadata && (
                  <div style={{ 
                    marginTop: '8px',
                    padding: '8px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${badge.color}`
                  }}>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#4b5563',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {Object.entries(notification.metadata).map(([key, value]) => {
                        // Skip targetTeamName as it's already shown in the badge
                        if (key === 'targetTeamName') return null;
                        
                        // Format the key for display
                        const displayKey = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase());
                        
                        return (
                          <div key={key} style={{ display: 'flex' }}>
                            <span style={{ fontWeight: 600, minWidth: '100px' }}>{displayKey}:</span>
                            <span>{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
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

