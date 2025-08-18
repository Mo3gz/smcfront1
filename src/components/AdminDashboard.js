import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Gift, 
  Package, 
  Users, 
  Trophy, 
  LogOut,
  Map,
  Gamepad2,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

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
      // Use the correct endpoint
      const response = await axios.get(`${API_BASE_URL}/api/admin/teams-cards`, { withCredentials: true });
      setTeamsWithCards(response.data);
    } catch (error) {
      console.error('Error fetching teams and cards:', error);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
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
      case 'countries':
        return <CountryManagement teams={teams} />;
      case 'games':
        return <GameManagement />;
      case 'statistics':
        return <StatisticsView />;
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
          <div 
            className={`nav-item ${activeTab === 'countries' ? 'active' : ''}`}
            onClick={() => setActiveTab('countries')}
          >
            <Map className="nav-icon" />
            <span className="nav-text">Countries</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => setActiveTab('games')}
          >
            <Gamepad2 className="nav-icon" />
            <span className="nav-text">Games</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <BarChart3 className="nav-icon" />
            <span className="nav-text">Statistics</span>
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

// Country Management Component
const CountryManagement = ({ teams }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnership, setFilterOwnership] = useState('all'); // all, owned, unowned
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/countries`, { withCredentials: true });
      setCountries(response.data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleToggleVisibility = async (countryId, currentVisibility) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/countries/visibility`, {
        countryId,
        visible: !currentVisibility
      }, { withCredentials: true });
      
      toast.success(`Country visibility ${!currentVisibility ? 'enabled' : 'disabled'}`);
      fetchCountries(); // Refresh the list
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to toggle visibility');
    }
  };

  const handleChangeOwnership = async (e) => {
    e.preventDefault();
    if (!selectedCountry) return;

    try {
      await axios.post(`${API_BASE_URL}/api/admin/countries/ownership`, {
        countryId: selectedCountry.id,
        newOwnerId: newOwnerId || null
      }, { withCredentials: true });
      
      const ownerName = newOwnerId ? teams.find(t => t.id === newOwnerId)?.teamName : 'None';
      toast.success(`Country ownership changed to: ${ownerName}`);
      setSelectedCountry(null);
      setNewOwnerId('');
      fetchCountries(); // Refresh the list
    } catch (error) {
      console.error('Error changing ownership:', error);
      toast.error('Failed to change ownership');
    }
  };

  // Filter countries based on search and ownership filter
  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwnership = 
      filterOwnership === 'all' ||
      (filterOwnership === 'owned' && country.owner) ||
      (filterOwnership === 'unowned' && !country.owner);
    
    return matchesSearch && matchesOwnership;
  });

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading countries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Country Management</h3>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Manage country ownership and visibility settings.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Search Countries</label>
          <input
            type="text"
            className="input"
            placeholder="Search by country name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Filter</label>
          <select
            className="input"
            value={filterOwnership}
            onChange={(e) => setFilterOwnership(e.target.value)}
          >
            <option value="all">All Countries</option>
            <option value="owned">Owned Only</option>
            <option value="unowned">Unowned Only</option>
          </select>
        </div>
      </div>

      {/* Countries List */}
      <div style={{ marginBottom: '24px' }}>
        <h4>Countries ({filteredCountries.length})</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
          {filteredCountries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No countries found matching your criteria.
            </div>
          ) : (
            filteredCountries.map(country => (
              <div 
                key={country.id} 
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: country.isVisible ? 'white' : '#fff3cd'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                    {country.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <span>Cost: {country.cost} coins</span>
                    <span style={{ margin: '0 12px' }}>•</span>
                    <span>Score: {country.score} points</span>
                    <span style={{ margin: '0 12px' }}>•</span>
                    <span>Mining: {country.miningRate}/hr</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', marginTop: '4px' }}>
                    <strong>Owner:</strong> {country.ownerName || 'None'}
                    {!country.isVisible && (
                      <span style={{ 
                        marginLeft: '12px', 
                        padding: '2px 8px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        fontSize: '12px', 
                        borderRadius: '4px' 
                      }}>
                        HIDDEN
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleToggleVisibility(country.id, country.isVisible)}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      backgroundColor: country.isVisible ? '#dc3545' : '#28a745',
                      color: 'white'
                    }}
                  >
                    {country.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => setSelectedCountry(country)}
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Change Owner
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Change Ownership Modal */}
      {selectedCountry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>
              Change Owner: {selectedCountry.name}
            </h3>
            
            <form onSubmit={handleChangeOwnership}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Current Owner: {selectedCountry.ownerName || 'None'}
                </label>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  New Owner
                </label>
                <select
                  className="input"
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                >
                  <option value="">Remove Owner</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  Change Owner
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedCountry(null);
                    setNewOwnerId('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Game Management Component
const GameManagement = () => {
  const [gameSettings, setGameSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [addingGame, setAddingGame] = useState(false);



  const fetchGameSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/games`, { withCredentials: true });
      
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        setGameSettings(response.data);
      } else {
        // Fallback to default game settings
        const fallbackSettings = {
          1: true, 2: true, 3: true, 4: true, 5: true, 6: true,
          7: true, 8: true, 9: true, 10: true, 11: true, 12: true
        };
        setGameSettings(fallbackSettings);
        toast.warning('Using fallback game settings. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching game settings:', error);
      
      // Set fallback settings on error
      const fallbackSettings = {
        1: true, 2: true, 3: true, 4: true, 5: true, 6: true,
        7: true, 8: true, 9: true, 10: true, 11: true, 12: true
      };
      setGameSettings(fallbackSettings);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required. You do not have permission to access this feature.');
      } else {
        toast.error(`Failed to fetch game settings: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameSettings();
  }, [fetchGameSettings]);

  const handleToggleGame = async (gameId, currentStatus) => {
    try {
      // Optimistically update the UI first
      const newSettings = { ...gameSettings };
      newSettings[gameId] = !currentStatus;
      setGameSettings(newSettings);
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/games/toggle`, {
        gameId: parseInt(gameId),
        enabled: !currentStatus
      }, { withCredentials: true });
      
      // Update with the actual response from server
      if (response.data && response.data.gameSettings) {
        setGameSettings(response.data.gameSettings);
      }
      
      toast.success(`Game ${gameId} ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling game:', error);
      
      // Revert the optimistic update on error
      const revertedSettings = { ...gameSettings };
      revertedSettings[gameId] = currentStatus;
      setGameSettings(revertedSettings);
      
      toast.error(`Failed to toggle game: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddGame = async () => {
    if (!newGameName.trim()) {
      toast.error('Please enter a game name');
      return;
    }

    try {
      setAddingGame(true);
      const response = await axios.post(`${API_BASE_URL}/api/admin/games/add`, {
        gameName: newGameName.trim()
      }, { withCredentials: true });
      
      toast.success(response.data.message || 'Game added successfully');
      setNewGameName('');
      setShowAddModal(false);
      fetchGameSettings(); // Refresh the settings
    } catch (error) {
      console.error('Error adding game:', error);
      toast.error(error.response?.data?.error || 'Failed to add game');
    } finally {
      setAddingGame(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    const gameCount = Object.keys(gameSettings).length;
    
    if (gameCount <= 1) {
      toast.error('Cannot delete the last game');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Game ${gameId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/games/${gameId}`, { 
        withCredentials: true 
      });
      
      toast.success(response.data.message || 'Game deleted successfully');
      fetchGameSettings(); // Refresh the settings
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.response?.data?.error || 'Failed to delete game');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading game settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Game Management</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Control which games are available for card selections. Disabled games will not appear in card usage options.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            + Add Game
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Reset all games to default settings? This will enable games 1-12.')) {
                try {
                  const response = await axios.post(`${API_BASE_URL}/api/admin/games/reset`, {}, { withCredentials: true });
                  toast.success(response.data.message || 'Game settings reset to defaults');
                  fetchGameSettings(); // Refresh the settings
                } catch (error) {
                  console.error('Error resetting game settings:', error);
                  toast.error(`Failed to reset game settings: ${error.response?.data?.error || error.message}`);
                }
              }
            }}
            className="btn"
            style={{
              backgroundColor: '#ffc107',
              color: 'black',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Reset Defaults
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {Object.entries(gameSettings)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([gameId, enabled]) => (
            <div 
              key={gameId}
              style={{
                padding: '16px',
                border: '2px solid',
                borderColor: enabled ? '#28a745' : '#dc3545',
                borderRadius: '8px',
                backgroundColor: enabled ? '#f8fff9' : '#fff5f5',
                position: 'relative'
              }}
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteGame(gameId)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8
                }}
                title="Delete Game"
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              >
                ×
              </button>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '16px', 
                  color: enabled ? '#28a745' : '#dc3545',
                  marginBottom: '4px' 
                }}>
                  Game {gameId}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#666' 
                }}>
                  Status: {enabled ? 'Active' : 'Disabled'}
                </div>
              </div>

              <button
                onClick={() => handleToggleGame(gameId, enabled)}
                className="btn"
                style={{
                  backgroundColor: enabled ? '#dc3545' : '#28a745',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                {enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Game Control Info</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
          <li>Disabled games will not appear in dropdown menus for cards that require game selection</li>
          <li>Cards requiring game selection: Robin Hood, Avenger, Betrayal, Secret Info, Freeze Player, Silent Game, Flip the Fate</li>
          <li>Changes take effect immediately for all users</li>
          <li>At least one game should remain enabled for cards to function properly</li>
        </ul>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>Active Games:</strong> {Object.values(gameSettings).filter(Boolean).length} / {Object.keys(gameSettings).length}
        </p>
        
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={fetchGameSettings}
            className="btn"
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '8px 16px',
              fontSize: '14px'
            }}
          >
            🔄 Refresh Settings
          </button>
        </div>
        
        <details style={{ marginTop: '16px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '14px' }}>
            Debug: Current Game Settings
          </summary>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            overflow: 'auto',
            marginTop: '8px'
          }}>
            {JSON.stringify(gameSettings, null, 2)}
          </pre>
        </details>
        
        <details style={{ marginTop: '8px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#dc3545', fontSize: '14px' }}>
            Debug: API Configuration
          </summary>
          <div style={{ 
            backgroundColor: '#fff5f5', 
            padding: '12px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            marginTop: '8px'
          }}>
            <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
            <p><strong>Current Hostname:</strong> {window.location.hostname}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>With Credentials:</strong> true</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Platform:</strong> {navigator.platform}</p>
          </div>
        </details>
      </div>

      {/* Add Game Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h4 style={{ margin: '0 0 16px 0' }}>Add New Game</h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Game Name:
              </label>
              <input
                type="text"
                className="input"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Enter game name..."
                maxLength={50}
                style={{ width: '100%' }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGame();
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewGameName('');
                }}
                className="btn"
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '8px 16px'
                }}
                disabled={addingGame}
              >
                Cancel
              </button>
              <button
                onClick={handleAddGame}
                className="btn"
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '8px 16px'
                }}
                disabled={addingGame || !newGameName.trim()}
              >
                {addingGame ? 'Adding...' : 'Add Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Statistics View Component
const StatisticsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/card-stats`, { withCredentials: true });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h3>Statistics</h3>
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
          No data available yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3>📊 Card Usage Statistics</h3>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Overview of card usage across all teams and games.
        </p>

        {/* Key Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '12px', 
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {stats.totalCardsUsed}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Cards Used</div>
          </div>

          {stats.insights.mostUsedCard && (
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 
              borderRadius: '12px', 
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                {stats.insights.mostUsedCard.name}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Most Used Card ({stats.insights.mostUsedCard.count}x)
              </div>
            </div>
          )}

          {stats.insights.mostActiveTeam && (
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #ff9500 0%, #ff5722 100%)', 
              borderRadius: '12px', 
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                {stats.insights.mostActiveTeam.name}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Most Active Team ({stats.insights.mostActiveTeam.count} cards)
              </div>
            </div>
          )}
        </div>

        {/* Card Usage Breakdown */}
        <div style={{ marginBottom: '32px' }}>
          <h4>Card Usage Breakdown</h4>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: '8px'
          }}>
            {Object.entries(stats.cardStats)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([cardName, cardData]) => (
                <div 
                  key={cardName}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{cardName}</div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                      {cardData.type} Card
                    </div>
                  </div>
                  <div style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {cardData.count}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Team Activity */}
        <div style={{ marginBottom: '32px' }}>
          <h4>Team Activity</h4>
          <div style={{ 
            maxHeight: '250px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: '8px'
          }}>
            {Object.entries(stats.teamStats)
              .sort(([,a], [,b]) => b - a)
              .map(([teamName, count]) => (
                <div 
                  key={teamName}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{teamName}</div>
                  <div style={{ 
                    background: '#4CAF50', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {count} cards
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Game Selection Stats */}
        {Object.keys(stats.gameStats).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4>Game Selection Frequency</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '12px'
            }}>
              {Object.entries(stats.gameStats)
                .sort(([a,], [b,]) => parseInt(a) - parseInt(b))
                .map(([gameId, count]) => (
                  <div 
                    key={gameId}
                    style={{ 
                      padding: '16px', 
                      border: '2px solid #667eea',
                      borderRadius: '8px',
                      textAlign: 'center',
                      background: '#f8f9ff'
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                      Game {gameId}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {count} selections
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <h4>Recent Card Usage</h4>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: '8px'
          }}>
            {stats.recentUsage.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No recent card usage.
              </div>
            ) : (
              stats.recentUsage.map((usage, index) => (
                <div 
                  key={usage.id}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: index < stats.recentUsage.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {usage.teamName} used {usage.cardName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {usage.selectedGame && `Game ${usage.selectedGame} • `}
                        {new Date(usage.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ 
                      background: '#f0f0f0', 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#666',
                      textTransform: 'capitalize'
                    }}>
                      {usage.cardType}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

