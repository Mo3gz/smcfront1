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
  Calendar
} from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';
import axios from 'axios';

const AdminDashboard = ({ socket }) => {
  const { user, logout, checkAdminStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('promocodes');
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminVerified, setAdminVerified] = useState(false);



  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.get(`/api/admin/teams`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get(`/api/admin/notifications`);
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
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (socket && adminVerified) {
      socket.on('admin-notification', (notification) => {
        fetchNotifications(); // Only fetch from backend, don't add directly
        toast.info(`New notification from ${notification.teamName}`);
      });
      
      // Listen for team settings updates
      socket.on('team-settings-updated', () => {
        console.log('🔄 Team settings updated, refreshing teams list');
        fetchTeams();
      });
      
      socket.on('all-teams-settings-updated', () => {
        console.log('🔄 All teams settings updated, refreshing teams list');
        fetchTeams();
      });
      
      return () => {
        socket.off('admin-notification');
        socket.off('team-settings-updated');
        socket.off('all-teams-settings-updated');
      };
    }
  }, [socket, adminVerified, fetchNotifications, fetchTeams]);

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
    console.log('🔄 renderContent called with activeTab:', activeTab);
    switch (activeTab) {
      case 'promocodes':
        return <PromoCodes teams={teams} socket={socket} />;
      case 'cards':
        return <CardManagement teams={teams} />;
      case 'notifications':
        return <AdminNotifications notifications={notifications} />;
      case 'scoreboard':
        return <AdminScoreboard teams={teams} />;
      case 'teams':
        return <TeamManagement teams={teams} fetchTeams={fetchTeams} />;
      case 'countries':
        return <CountryManagement teams={teams} socket={socket} />;
      case 'games':
        return <GameManagement socket={socket} />;
      case 'matchups':
        console.log('🎯 Rendering AdminGameSchedule component');
        return <AdminGameSchedule />;

      default:
        return <PromoCodes teams={teams} socket={socket} />;
    }
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
            className={`nav-item ${activeTab === 'matchups' ? 'active' : ''}`}
            onClick={() => {
              console.log('🖱️ Clicked on Game Schedule tab');
              setActiveTab('matchups');
            }}
          >
            <Calendar className="nav-icon" />
            <span className="nav-text">Game Schedule</span>
          </div>

        </div>
      </nav>
    </div>
  );
};

// Add the card list at the top of the file (copy from backend getCardsByType)
const allCards = {
  lucky: [
    { name: "Borrow kaizen to buy a country", type: 'lucky', effect: 'Balance may go negative, limit -200', actionType: 'admin', requiresTeamSelection: false },
    { name: "Game Protection", type: 'lucky', effect: 'Protection for selected game', actionType: 'admin', requiresGameSelection: true }
  ],
  gamehelper: [
    { name: "Secret Info", type: 'gamehelper', effect: 'Choose game: Instantly reveals opponent & game details', actionType: 'admin', requiresGameSelection: true },
    { name: "Robin Hood", type: 'gamehelper', effect: 'Choose game & team: Steal 100 coins from them, If they won', actionType: 'admin', requiresGameSelection: true, requiresTeamSelection: true },
    { name: "Avenger", type: 'gamehelper', effect: 'Choose game & team: Alliance proposal (+100 each if accepted)', actionType: 'admin', requiresGameSelection: true, requiresTeamSelection: true },
    { name: "Betrayal", type: 'gamehelper', effect: 'Choose game: Counter alliance betrayals (+100 if betrayed & win)', actionType: 'admin', requiresGameSelection: true }
  ],
  challenge: [
    { name: "Speed Buy", type: 'challenge', effect: '10 minutes to buy a country (+50 reward)', actionType: 'speed_buy' },
    { name: "Freeze Player", type: 'challenge', effect: 'Choose game: Judger decides: Freeze one player from your team (+75 coins to you)', actionType: 'admin', requiresGameSelection: true},
    { name: "Silent Game", type: 'challenge', effect: 'Choose game: Judge decides result (+150 or -100)', actionType: 'admin', requiresGameSelection: true }
  ],
  hightier: [
    { name: "Flip the Fate", type: 'hightier', effect: 'Choose game: If tied → +100 Bonus, If lost → -50 Penalty', actionType: 'admin', requiresGameSelection: true}
  ],
  lowtier: [
    { name: "Victory Multiplier", type: 'lowtier', effect: 'Choose a game: If your team wins, you earn x1.5 coins', actionType: 'admin', requiresGameSelection: true}
  ]
};


// Promo Codes Component
const PromoCodes = ({ teams, socket }) => {
  const [code, setCode] = useState('');
  const [teamId, setTeamId] = useState('');
  const [discount, setDiscount] = useState(10);
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, assigned, unassigned, used
  const [editingPromo, setEditingPromo] = useState(null);

  // Fetch promocodes on component mount
  useEffect(() => {
    fetchPromocodes();
  }, []);

  // Listen for admin notifications about promocode usage
  useEffect(() => {
    if (socket) {
      const handleAdminNotification = (notification) => {
        // If it's a promo-code-used notification, refresh the promocodes list
        if (notification.actionType === 'promo-code-used') {
          console.log('🎫 Promocode used, refreshing promocodes list');
          fetchPromocodes();
          toast.success(`${notification.metadata?.teamName} used promo code "${notification.metadata?.promoCode}"`);
        }
      };

      socket.on('admin-notification', handleAdminNotification);

      return () => {
        socket.off('admin-notification', handleAdminNotification);
      };
    }
  }, [socket]);

  const fetchPromocodes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/promocodes', { withCredentials: true });
      setPromocodes(response.data);
    } catch (error) {
      console.error('Fetch promocodes error:', error);
      toast.error('Failed to fetch promocodes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    
    try {
      await api.post(`/api/admin/promocodes`, {
        code,
        teamId,
        discount
      }, { withCredentials: true });

      toast.success('Promo code created successfully!');
      setCode('');
      setTeamId('');
      setDiscount(10);
      fetchPromocodes(); // Refresh the list
    } catch (error) {
      console.error('Create promo error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create promo code');
      }
    }
  };



  const handleUpdatePromo = async (promoId, updates) => {
    try {
      await api.put(`/api/admin/promocodes/${promoId}`, updates, { withCredentials: true });
      toast.success('Promocode updated successfully!');
      setEditingPromo(null);
      fetchPromocodes(); // Refresh the list
    } catch (error) {
      console.error('Update promocode error:', error);
      toast.error(error.response?.data?.error || 'Failed to update promocode');
    }
  };



  // Filter promocodes based on search and status
  const filteredPromocodes = promocodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'assigned' && promo.teamId) ||
                         (filterStatus === 'unassigned' && !promo.teamId) ||
                         (filterStatus === 'used' && promo.used);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>


      {/* Create New Promocode Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Create New Promo Code</h3>
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

      {/* Promocodes List Section */}
      <div className="card">
        <h3>Manage Promocodes</h3>
        
        {/* Search and Filter Controls */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input"
            placeholder="Search promocodes or teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Promocodes</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="used">Used</option>
          </select>
          <button 
            onClick={fetchPromocodes} 
            className="btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Promocodes Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Team</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Discount</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromocodes.map(promo => (
                <tr key={promo.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{promo.code}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingPromo?.id === promo.id && editingPromo?.field === 'team' ? (
                      <select
                        className="input"
                        value={editingPromo.value || promo.teamId || ''}
                        onChange={(e) => setEditingPromo({ ...editingPromo, value: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="">Unassigned</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: promo.teamId ? '#28a745' : '#6c757d' }}>
                        {promo.teamName}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingPromo?.id === promo.id && editingPromo?.field === 'discount' ? (
                      <input
                        type="number"
                        className="input"
                        value={editingPromo.value || promo.discount}
                        onChange={(e) => setEditingPromo({ ...editingPromo, value: Number(e.target.value) })}
                        min="1"
                        max="100"
                        style={{ width: '80px' }}
                      />
                    ) : (
                      <span>{promo.discount}%</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: promo.used ? '#dc3545' : (promo.teamId ? '#28a745' : '#ffc107'),
                      color: 'white'
                    }}>
                      {promo.used ? 'Used' : (promo.teamId ? 'Assigned' : 'Unassigned')}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {new Date(promo.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingPromo?.id === promo.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleUpdatePromo(promo.id, { [editingPromo.field === 'team' ? 'teamId' : 'discount']: editingPromo.value })}
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#28a745' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPromo(null)}
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#6c757d' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => setEditingPromo({ id: promo.id, field: 'team', value: promo.teamId })}
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          disabled={promo.used}
                        >
                          Edit Team
                        </button>
                        <button
                          onClick={() => setEditingPromo({ id: promo.id, field: 'discount', value: promo.discount })}
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          disabled={promo.used}
                        >
                          Edit %
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPromocodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {loading ? 'Loading promocodes...' : 'No promocodes found'}
          </div>
        )}
      </div>
    </div>
  );
};

// Card Management Component
const CardManagement = ({ teams }) => {
  const [teamId, setTeamId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('lucky');
  const [sendToAll, setSendToAll] = useState(false);
  // Find the selected card object for effect display
  const selectedCard = allCards[cardType]?.find(card => card.name === cardName);
  const cardTypes = [
    { value: 'lucky', label: 'Lucky Card' },
    { value: 'gamehelper', label: 'Game Helper Card' },
    { value: 'challenge', label: 'Challenge Card' },
    { value: 'hightier', label: 'High Tier Card' },
    { value: 'lowtier', label: 'Low Tier Card' }
  ];
  const handleGiveCard = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/admin/cards`, {
        teamId: sendToAll ? 'all' : teamId,
        cardName,
        cardType
      }, { withCredentials: true });
      toast.success(sendToAll ? 'Card sent to all teams successfully!' : 'Card given successfully!');
      setTeamId('');
      setCardName('');
      setCardType('lucky');
      setSendToAll(false);
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
          <label>
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => setSendToAll(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Send to All Teams
          </label>
        </div>
        {!sendToAll && (
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
        )}
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
            {allCards[cardType]?.map(card => (
              <option key={card.name} value={card.name}>{card.name}</option>
            ))}
          </select>
        </div>
        {selectedCard && (
          <div style={{ marginBottom: '16px', color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
            <strong>Effect:</strong> {selectedCard.effect}
            {selectedCard.requiresGameSelection && (
              <div style={{ color: '#ff6b35', marginTop: '4px' }}>
                ⚠️ Requires game selection
              </div>
            )}
            {selectedCard.requiresTeamSelection && (
              <div style={{ color: '#ff6b35', marginTop: '4px' }}>
                ⚠️ Requires team selection
              </div>
            )}
          </div>
        )}
        <button type="submit" className="btn" disabled={(!sendToAll && !teamId) || !cardName || !cardType}>
          {sendToAll ? 'Send Card to All Teams' : 'Give Card'}
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
                              <th style={{ padding: '12px', textAlign: 'right' }}>Kaizen</th>
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
  const [showAllTeamsModal, setShowAllTeamsModal] = useState(false);
  const [allTeamsSettings, setAllTeamsSettings] = useState({
    scoreboardVisible: true,
    spinLimitations: {
      regular: { enabled: false, limit: 1 },
      lucky: { enabled: false, limit: 1 },
      gamehelper: { enabled: false, limit: 1 },
      challenge: { enabled: false, limit: 1 },
      hightier: { enabled: false, limit: 1 },
      lowtier: { enabled: false, limit: 1 },
      random: { enabled: false, limit: 1 }
    },
    resetSpinCounts: false
  });

  const handleUpdateTeamSettings = async (teamId, settings) => {
    try {
      console.log('🔄 Updating team settings:', { teamId, settings });
      const response = await api.put(`/api/admin/teams/${teamId}/settings`, settings);
      console.log('✅ Team settings update response:', response.data);
      toast.success('Team settings updated successfully!');
      fetchTeams();
    } catch (error) {
      console.error('❌ Update team settings error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error(`Failed to update team settings: ${error.response?.data?.details || error.message}`);
    }
  };

  const handleUpdateAllTeams = async (settings = null) => {
    try {
      const settingsToUpdate = settings || allTeamsSettings;
      console.log('🔄 Sending all teams settings update:', settingsToUpdate);
      const response = await api.put(`/api/admin/teams/settings/all`, settingsToUpdate);
      console.log('✅ All teams settings update response:', response.data);
      toast.success(`Settings updated for all teams!`);
      if (!settings) {
        setShowAllTeamsModal(false);
      }
      fetchTeams();
    } catch (error) {
      console.error('❌ Update all teams settings error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error(`Failed to update all teams settings: ${error.response?.data?.details || error.message}`);
    }
  };

  const getSpinTypeLabel = (type) => {
    switch (type) {
      case 'lucky': return 'Lucky Spins';
      case 'gamehelper': return 'Game Helper Spins';
      case 'challenge': return 'Challenge Spins';
      case 'hightier': return 'High Tier Spins';
      case 'lowtier': return 'Low Tier Spins';
      case 'random': return 'Random Spins';
      default: return type;
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h3>Team Management</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-warning"
            onClick={() => handleUpdateAllTeams({ resetSpinCounts: true })}
          >
            Reset All Spin Counts
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAllTeamsModal(true)}
          >
            Manage All Teams
          </button>
        </div>
      </div>

      {/* Global Quick Actions */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h5 style={{ marginBottom: '12px' }}>Global Quick Actions</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button 
            className="btn btn-success"
            onClick={() => handleUpdateAllTeams({ scoreboardVisible: true })}
          >
            Show All in Scoreboard
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => handleUpdateAllTeams({ scoreboardVisible: false })}
          >
            Hide All from Scoreboard
          </button>
          <button 
            className="btn btn-info"
            onClick={() => handleUpdateAllTeams({ 
              spinLimitations: {
                regular: { enabled: true, limit: 1 },
                lucky: { enabled: true, limit: 1 },
                gamehelper: { enabled: true, limit: 1 },
                challenge: { enabled: true, limit: 1 },
                hightier: { enabled: true, limit: 1 },
                lowtier: { enabled: true, limit: 1 },
                random: { enabled: true, limit: 1 }
              }
            })}
          >
            Enable All Spin Limits (1 each)
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleUpdateAllTeams({ 
              spinLimitations: {
                lucky: { enabled: true, limit: 2 },
                gamehelper: { enabled: true, limit: 2 },
                challenge: { enabled: true, limit: 2 },
                random: { enabled: true, limit: 2 },
                hightier: { enabled: false, limit: 1 },
                lowtier: { enabled: false, limit: 1 }
              }
            })}
          >
            Enable Core Spins (2 spins, exclude High/Low Tier)
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => handleUpdateAllTeams({ 
              spinLimitations: {
                regular: { enabled: false, limit: 1 },
                lucky: { enabled: false, limit: 1 },
                gamehelper: { enabled: false, limit: 1 },
                challenge: { enabled: false, limit: 1 },
                hightier: { enabled: false, limit: 1 },
                lowtier: { enabled: false, limit: 1 },
                random: { enabled: false, limit: 1 }
              }
            })}
          >
            Disable All Spin Limits
          </button>
        </div>
      </div>

      {!teams || teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {!teams ? 'Loading teams...' : 'No teams found.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Team</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Kaizen</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Scoreboard</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Lucky</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Game Helper</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Challenge</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>High Tier</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Low Tier</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Random</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{team.teamName}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{team.score}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{team.coins}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={team.settings?.scoreboardVisible !== false}
                      onChange={(e) => handleUpdateTeamSettings(team.id, {
                        scoreboardVisible: e.target.checked
                      })}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.lucky?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            lucky: { 
                              ...team.settings?.spinLimitations?.lucky,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.lucky?.enabled && (
            <input
              type="number"
                          min="0"
                          value={team.settings?.spinLimitations?.lucky?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              lucky: { 
                                ...team.settings?.spinLimitations?.lucky,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.lucky || 0}
                      </span>
          </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.gamehelper?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            gamehelper: { 
                              ...team.settings?.spinLimitations?.gamehelper,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.gamehelper?.enabled && (
                        <input
                          type="number"
                          min="0"
                          value={team.settings?.spinLimitations?.gamehelper?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              gamehelper: { 
                                ...team.settings?.spinLimitations?.gamehelper,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.gamehelper || 0}
                      </span>
          </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.challenge?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            challenge: { 
                              ...team.settings?.spinLimitations?.challenge,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.challenge?.enabled && (
                        <input
                          type="number"
                          min="0"
                          value={team.settings?.spinLimitations?.challenge?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              challenge: { 
                                ...team.settings?.spinLimitations?.challenge,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.challenge || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.hightier?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            hightier: { 
                              ...team.settings?.spinLimitations?.hightier,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.hightier?.enabled && (
                        <input
                          type="number"
                          min="0"
                          value={team.settings?.spinLimitations?.hightier?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              hightier: { 
                                ...team.settings?.spinLimitations?.hightier,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.hightier || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.lowtier?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            lowtier: { 
                              ...team.settings?.spinLimitations?.lowtier,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.lowtier?.enabled && (
                        <input
                          type="number"
                          min="1"
                          value={team.settings?.spinLimitations?.lowtier?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              lowtier: { 
                                ...team.settings?.spinLimitations?.lowtier,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.lowtier || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={team.settings?.spinLimitations?.random?.enabled || false}
                        onChange={(e) => {
                          const updatedLimitations = {
                            ...team.settings?.spinLimitations,
                            random: { 
                              ...team.settings?.spinLimitations?.random,
                              enabled: e.target.checked 
                            }
                          };
                          handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                        }}
                      />
                      {team.settings?.spinLimitations?.random?.enabled && (
                        <input
                          type="number"
                          min="0"
                          value={team.settings?.spinLimitations?.random?.limit || 1}
                          onChange={(e) => {
                            const updatedLimitations = {
                              ...team.settings?.spinLimitations,
                              random: { 
                                ...team.settings?.spinLimitations?.random,
                                limit: parseInt(e.target.value) || 1 
                              }
                            };
                            handleUpdateTeamSettings(team.id, { spinLimitations: updatedLimitations });
                          }}
                          style={{ width: '50px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {team.settings?.spinCounts?.random || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      className="btn btn-warning"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => handleUpdateTeamSettings(team.id, { resetSpinCounts: true })}
                    >
                      Reset
          </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Teams Modal */}
      {showAllTeamsModal && (
        <div className="modal-overlay" onClick={() => setShowAllTeamsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage All Teams</h3>
              <button className="modal-close" onClick={() => setShowAllTeamsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={allTeamsSettings.scoreboardVisible}
                    onChange={(e) => setAllTeamsSettings(prev => ({
                      ...prev,
                      scoreboardVisible: e.target.checked
                    }))}
                  />
                  Show All Teams in Scoreboard
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5>Spin Limitations for All Teams</h5>
                {Object.entries(allTeamsSettings.spinLimitations).map(([type, limitation]) => (
                  <div key={type} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={limitation.enabled}
                        onChange={(e) => setAllTeamsSettings(prev => ({
                          ...prev,
                          spinLimitations: {
                            ...prev.spinLimitations,
                            [type]: { ...limitation, enabled: e.target.checked }
                          }
                        }))}
                      />
                      <strong>{getSpinTypeLabel(type)}</strong>
                    </div>
                    {limitation.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label>Limit:</label>
            <input
              type="number"
                          min="0"
                          value={limitation.limit}
                          onChange={(e) => setAllTeamsSettings(prev => ({
                            ...prev,
                            spinLimitations: {
                              ...prev.spinLimitations,
                              [type]: { ...limitation, limit: parseInt(e.target.value) || 1 }
                            }
                          }))}
                          style={{ width: '80px', padding: '4px 8px' }}
            />
          </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
                    type="checkbox"
                    checked={allTeamsSettings.resetSpinCounts}
                    onChange={(e) => setAllTeamsSettings(prev => ({
                      ...prev,
                      resetSpinCounts: e.target.checked
                    }))}
                  />
                  Reset Spin Counts for All Teams
                </label>
          </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAllTeamsModal(false)}>
                Cancel
          </button>
              <button className="btn btn-primary" onClick={handleUpdateAllTeams}>
                Apply to All Teams
              </button>
      </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Country Management Component
const CountryManagement = ({ teams, socket }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnership, setFilterOwnership] = useState('all'); // all, owned, unowned
  const [fiftyCoinsCountriesHidden, setFiftyCoinsCountriesHidden] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');
  
  // New country form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCountry, setNewCountry] = useState({
    name: '',
    cost: '',
    score: '',
    miningRate: ''
  });
  const [addingCountry, setAddingCountry] = useState(false);
  
  // Edit country form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    cost: '',
    score: '',
    miningRate: ''
  });
  const [updatingCountry, setUpdatingCountry] = useState(false);
  
  // User management state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userCoins, setUserCoins] = useState('');
  const [userScore, setUserScore] = useState('');
  const [userOperation, setUserOperation] = useState('add'); // add, subtract, set

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/countries`);
      setCountries(response.data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFiftyCoinsVisibilityState = useCallback(async () => {
    try {
      const response = await api.get(`/api/admin/countries/fifty-coins-visibility`);
      setFiftyCoinsCountriesHidden(response.data.hidden);
    } catch (error) {
      console.error('Error fetching 50 coins visibility state:', error);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
    fetchFiftyCoinsVisibilityState();
  }, [fetchCountries, fetchFiftyCoinsVisibilityState]);

  // Listen for global 50 coins visibility updates
  useEffect(() => {
    if (socket) {
      socket.on('fifty-coins-countries-visibility-update', (data) => {
        console.log('📡 Global 50 coins visibility update received:', data);
        setFiftyCoinsCountriesHidden(data.hidden);
        toast.info(`50 kaizen countries are now ${data.hidden ? 'hidden' : 'visible'} globally`);
      });

      return () => {
        socket.off('fifty-coins-countries-visibility-update');
      };
    }
  }, [socket]);

  const handleToggleVisibility = async (countryId, currentVisibility) => {
    try {
      await api.post(`/api/admin/countries/visibility`, {
        countryId,
        visible: !currentVisibility
      });
      
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
      await api.post(`/api/admin/countries/ownership`, {
        countryId: selectedCountry.id,
        newOwnerId: newOwnerId || null
      });
      
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

  const handleAddCountry = async (e) => {
    e.preventDefault();
    if (!newCountry.name || !newCountry.cost || !newCountry.score || !newCountry.miningRate) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setAddingCountry(true);
      const response = await api.post(`/api/admin/countries/add`, newCountry);
      
      toast.success(response.data.message);
      setNewCountry({ name: '', cost: '', score: '', miningRate: '' });
      setShowAddModal(false);
      fetchCountries(); // Refresh the list
    } catch (error) {
      console.error('Error adding country:', error);
      toast.error(error.response?.data?.error || 'Failed to add country');
    } finally {
      setAddingCountry(false);
    }
  };

  const handleDeleteCountry = async (countryId, countryName) => {
    if (!window.confirm(`Are you sure you want to delete "${countryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/countries/${countryId}`);
      
      toast.success(response.data.message);
      fetchCountries(); // Refresh the list
    } catch (error) {
      console.error('Error deleting country:', error);
      toast.error(error.response?.data?.error || 'Failed to delete country');
    }
  };

  const handleEditCountry = (country) => {
    setEditingCountry(country);
    setEditForm({
      name: country.name,
      cost: country.cost.toString(),
      score: country.score.toString(),
      miningRate: country.miningRate.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateCountry = async (e) => {
    e.preventDefault();
    if (!editingCountry) return;

    try {
      setUpdatingCountry(true);
      const response = await api.put(`/api/admin/countries/${editingCountry.id}`, editForm);
      
      toast.success(response.data.message);
      setShowEditModal(false);
      setEditingCountry(null);
      fetchCountries(); // Refresh the list
    } catch (error) {
      console.error('Error updating country:', error);
      toast.error(error.response?.data?.error || 'Failed to update country');
    } finally {
      setUpdatingCountry(false);
    }
  };

  const handleUserManagement = (user) => {
    setSelectedUser(user);
    setUserCoins('');
    setUserScore('');
    setUserOperation('add');
    setShowUserModal(true);
  };

  const handleUpdateUserCoins = async (e) => {
    e.preventDefault();
    if (!selectedUser || !userCoins) return;

    try {
      const response = await api.post(`/api/admin/users/${selectedUser.id}/coins`, {
        coins: parseInt(userCoins),
        operation: userOperation
      });
      
      toast.success(response.data.message);
      setUserCoins('');
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user coins:', error);
              toast.error(error.response?.data?.error || 'Failed to update user kaizen');
    }
  };

  const handleUpdateUserScore = async (e) => {
    e.preventDefault();
    if (!selectedUser || !userScore) return;

    try {
      const response = await api.post(`/api/admin/users/${selectedUser.id}/score`, {
        score: parseInt(userScore),
        operation: userOperation
      });
      
      toast.success(response.data.message);
      setUserScore('');
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user score:', error);
      toast.error(error.response?.data?.error || 'Failed to update user score');
    }
  };

  const handleToggleFiftyCoinsVisibility = async () => {
    try {
      const response = await api.post(`/api/admin/countries/toggle-fifty-coins`, {
        hidden: !fiftyCoinsCountriesHidden
      });
      
      console.log('Global 50 coins visibility toggle response:', response.data);
      setFiftyCoinsCountriesHidden(!fiftyCoinsCountriesHidden);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling 50 coins countries visibility:', error);
              toast.error(error.response?.data?.error || 'Failed to toggle 50 kaizen countries visibility');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
      <h3>Country Management</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Manage countries, ownership, and user resources.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            + Add Country
          </button>
          <button
            onClick={() => handleUserManagement(null)}
            className="btn"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Manage Users
          </button>
        </div>
      </div>

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
        <div style={{ minWidth: '150px', display: 'flex', alignItems: 'end' }}>
          <button
            onClick={handleToggleFiftyCoinsVisibility}
            className="btn"
            style={{
              backgroundColor: fiftyCoinsCountriesHidden ? '#dc3545' : '#28a745',
              color: 'white',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {fiftyCoinsCountriesHidden ? 'Show 50 Kaizen Countries' : 'Hide 50 Kaizen Countries'}
          </button>
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
                    <span>Cost: {country.cost} kaizen</span>
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
                    onClick={() => handleEditCountry(country)}
                    className="btn"
                    style={{
                      backgroundColor: '#ffc107',
                      color: 'black',
                      padding: '6px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCountry(country.id, country.name)}
                    className="btn"
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
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

      {/* Add Country Modal */}
      {showAddModal && (
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
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>Add New Country</h3>
            
            <form onSubmit={handleAddCountry}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Country Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry({...newCountry, name: e.target.value})}
                  placeholder="Enter country name..."
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Cost (kaizen)
                </label>
                <input
                  type="number"
                  className="input"
                  value={newCountry.cost}
                  onChange={(e) => setNewCountry({...newCountry, cost: e.target.value})}
                  placeholder="Enter cost..."
                  min="0"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Score (points)
                </label>
                <input
                  type="number"
                  className="input"
                  value={newCountry.score}
                  onChange={(e) => setNewCountry({...newCountry, score: e.target.value})}
                  placeholder="Enter score..."
                  min="0"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Mining Rate (per hour)
                </label>
                <input
                  type="number"
                  className="input"
                  value={newCountry.miningRate}
                  onChange={(e) => setNewCountry({...newCountry, miningRate: e.target.value})}
                  placeholder="Enter mining rate..."
                  min="0"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={addingCountry}>
                  {addingCountry ? 'Adding...' : 'Add Country'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCountry({ name: '', cost: '', score: '', miningRate: '' });
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

      {/* Edit Country Modal */}
      {showEditModal && editingCountry && (
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
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>Edit Country: {editingCountry.name}</h3>
            
            <form onSubmit={handleUpdateCountry}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Country Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter country name..."
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Cost (kaizen)
                </label>
                <input
                  type="number"
                  className="input"
                  value={editForm.cost}
                  onChange={(e) => setEditForm({...editForm, cost: e.target.value})}
                  placeholder="Enter cost..."
                  min="0"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Score (points)
                </label>
                <input
                  type="number"
                  className="input"
                  value={editForm.score}
                  onChange={(e) => setEditForm({...editForm, score: e.target.value})}
                  placeholder="Enter score..."
                  min="0"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Mining Rate (per hour)
                </label>
                <input
                  type="number"
                  className="input"
                  value={editForm.miningRate}
                  onChange={(e) => setEditForm({...editForm, miningRate: e.target.value})}
                  placeholder="Enter mining rate..."
                  min="0"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={updatingCountry}>
                  {updatingCountry ? 'Updating...' : 'Update Country'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCountry(null);
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

      {/* User Management Modal */}
      {showUserModal && (
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
          <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>User Management</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>Select User</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedUser(team)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedUser?.id === team.id ? '#e3f2fd' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{team.teamName}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Kaizen: {team.coins} | Score: {team.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUser ? (
              <div>
                <h4 style={{ marginBottom: '16px' }}>Manage: {selectedUser.teamName}</h4>
                
                        {/* Kaizen Management */}
        <form onSubmit={handleUpdateUserCoins} style={{ marginBottom: '24px' }}>
          <h5 style={{ marginBottom: '12px' }}>Update Kaizen</h5>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <select
                      className="input"
                      value={userOperation}
                      onChange={(e) => setUserOperation(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="set">Set to</option>
                    </select>
                    <input
                      type="number"
                      className="input"
                      value={userCoins}
                      onChange={(e) => setUserCoins(e.target.value)}
                      placeholder="Amount"
                      min="0"
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn" style={{ flex: 1 }}>
                      Update Kaizen
                    </button>
                  </div>
                </form>

                {/* Score Management */}
                <form onSubmit={handleUpdateUserScore}>
                  <h5 style={{ marginBottom: '12px' }}>Update Score</h5>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                      className="input"
                      value={userOperation}
                      onChange={(e) => setUserOperation(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="set">Set to</option>
                    </select>
                    <input
                      type="number"
                      className="input"
                      value={userScore}
                      onChange={(e) => setUserScore(e.target.value)}
                      placeholder="Amount"
                      min="0"
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn" style={{ flex: 1 }}>
                      Update Score
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <p>Please select a user from the list above to manage their resources.</p>
              </div>
            )}

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Game Management Component
const GameManagement = ({ socket }) => {
  const [gameSettings, setGameSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [addingGame, setAddingGame] = useState(false);
  const [activeContentSet, setActiveContentSet] = useState('default');
  const [availableContentSets, setAvailableContentSets] = useState([]);
  const [contentSetsLoading, setContentSetsLoading] = useState(true);



  const fetchGameSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/games`);
      
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        setGameSettings(response.data);
      } else {
        // Fallback to default game settings with new format
        const fallbackSettings = {
          1: { enabled: true, name: 'Game 1' },
          2: { enabled: true, name: 'Game 2' },
          3: { enabled: true, name: 'Game 3' },
          4: { enabled: true, name: 'Game 4' },
          5: { enabled: true, name: 'Game 5' },
          6: { enabled: true, name: 'Game 6' },
          7: { enabled: true, name: 'Game 7' },
          8: { enabled: true, name: 'Game 8' },
          9: { enabled: true, name: 'Game 9' },
          10: { enabled: true, name: 'Game 10' },
          11: { enabled: true, name: 'Game 11' },
          12: { enabled: true, name: 'Game 12' }
        };
        setGameSettings(fallbackSettings);
        toast.warning('Using fallback game settings. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching game settings:', error);
      
      // Set fallback settings on error with new format
      const fallbackSettings = {
        1: { enabled: true, name: 'Game 1' },
        2: { enabled: true, name: 'Game 2' },
        3: { enabled: true, name: 'Game 3' },
        4: { enabled: true, name: 'Game 4' },
        5: { enabled: true, name: 'Game 5' },
        6: { enabled: true, name: 'Game 6' },
        7: { enabled: true, name: 'Game 7' },
        8: { enabled: true, name: 'Game 8' },
        9: { enabled: true, name: 'Game 9' },
        10: { enabled: true, name: 'Game 10' },
        11: { enabled: true, name: 'Game 11' },
        12: { enabled: true, name: 'Game 12' }
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

  const fetchContentSets = useCallback(async () => {
    try {
      setContentSetsLoading(true);
      const response = await api.get(`/api/admin/content-sets`);
      setAvailableContentSets(response.data.availableContentSets);
      setActiveContentSet(response.data.currentActiveSet);
    } catch (error) {
      console.error('Error fetching content sets:', error);
      toast.error('Failed to fetch content sets');
    } finally {
      setContentSetsLoading(false);
    }
  }, []);

  const handleChangeActiveContent = async (contentSetId) => {
    try {
      const response = await api.post(`/api/admin/active-content`, {
        contentSet: contentSetId
      });
      
      setActiveContentSet(contentSetId);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error changing active content:', error);
      toast.error('Failed to change active content set');
    }
  };

  useEffect(() => {
    fetchGameSettings();
  }, [fetchGameSettings]);

  useEffect(() => {
    fetchContentSets();
  }, [fetchContentSets]);

  const handleToggleGame = async (gameId, currentStatus) => {
    try {
      // Get current game data
      const currentGame = gameSettings[gameId];
      const currentEnabled = typeof currentGame === 'object' ? currentGame.enabled : currentGame;
      const currentName = typeof currentGame === 'object' ? currentGame.name : `Game ${gameId}`;
      
      // Optimistically update the UI first
      const newSettings = { ...gameSettings };
      newSettings[gameId] = { enabled: !currentEnabled, name: currentName };
      setGameSettings(newSettings);
      
      const response = await api.post(`/api/admin/games/toggle`, {
        gameId: parseInt(gameId),
        enabled: !currentEnabled,
        gameName: currentName
      });
      
      // Update with the actual response from server
      if (response.data && response.data.gameSettings) {
        setGameSettings(response.data.gameSettings);
      }
      
      toast.success(`${currentName} ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling game:', error);
      
      // Revert the optimistic update on error
      fetchGameSettings();
      
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
      const response = await api.delete(`/api/admin/games/${gameId}`);
      
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
          .map(([gameId, gameData]) => {
            // Handle both old boolean format and new object format
            const isEnabled = typeof gameData === 'object' ? gameData.enabled : gameData;
            const gameName = typeof gameData === 'object' ? gameData.name : `Game ${gameId}`;
            
            return (
            <div 
              key={gameId}
              style={{
                padding: '16px',
                border: '2px solid',
                  borderColor: isEnabled ? '#28a745' : '#dc3545',
                borderRadius: '8px',
                  backgroundColor: isEnabled ? '#f8fff9' : '#fff5f5',
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
                    color: isEnabled ? '#28a745' : '#dc3545',
                  marginBottom: '4px' 
                }}>
                    {gameName}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#666' 
                }}>
                    Status: {isEnabled ? 'Active' : 'Disabled'}
                </div>
              </div>

              <button
                  onClick={() => handleToggleGame(gameId, isEnabled)}
                className="btn"
                style={{
                    backgroundColor: isEnabled ? '#dc3545' : '#28a745',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                  {isEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            );
          })}
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
          <strong>Active Games:</strong> {Object.values(gameSettings).filter(game => typeof game === 'object' ? game.enabled : game).length} / {Object.keys(gameSettings).length}
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
        

      </div>

      {/* Active Content Set Management */}
      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Active Content Set Management</h4>
        <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
          Control which content set is currently active for all users. Changes will be broadcast to all connected users in real-time.
        </p>
        
        {contentSetsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto 10px' }}></div>
            <p style={{ fontSize: '14px', color: '#666' }}>Loading content sets...</p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Current Active Set:
              </label>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px', 
                fontWeight: '600',
                color: '#495057'
              }}>
                {activeContentSet || 'Default'}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Available Content Sets:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {availableContentSets.map((contentSet) => (
                  <button
                    key={contentSet.id}
                    onClick={() => handleChangeActiveContent(contentSet.id)}
                    className="btn"
                    style={{
                      backgroundColor: activeContentSet === contentSet.id ? '#28a745' : '#6c757d',
                      color: 'white',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: activeContentSet === contentSet.id ? 'default' : 'pointer',
                      opacity: activeContentSet === contentSet.id ? '0.8' : '1'
                    }}
                    disabled={activeContentSet === contentSet.id}
                  >
                    {contentSet.name}
                    {activeContentSet === contentSet.id && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '12px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
                <strong>Note:</strong> When you change the active content set, all connected users will receive a real-time notification and their content will update automatically.
              </p>
            </div>
          </div>
        )}
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








// Admin Game Schedule Management Component
const AdminGameSchedule = () => {
  console.log('🚀 AdminGameSchedule component mounted');
  
  const [gameSettings, setGameSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedules, setEditingSchedules] = useState({});

  const fetchGameSettings = useCallback(async () => {
    try {
      console.log('🔄 Fetching game settings...');
      setLoading(true);
      const response = await api.get('/api/admin/game-settings');
      console.log('✅ Game settings response:', response.data);
      setGameSettings(response.data);
    } catch (error) {
      console.error('❌ Error fetching game settings:', error);
      toast.error('Failed to fetch game settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameSettings();
  }, [fetchGameSettings]);

  const handleSetActiveContentSet = async (contentSet) => {
    try {
      console.log('🔄 Setting active content set to:', contentSet);
      const response = await api.post('/api/admin/active-content-set', { contentSet });
      console.log('✅ Active content set response:', response.data);
      toast.success(`Active content set changed to ${contentSet.replace('contentSet', 'Set ')}`);
      fetchGameSettings();
    } catch (error) {
      console.error('❌ Error setting active content set:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to set active content set';
      toast.error(`Failed to set active content set: ${errorMessage}`);
    }
  };

  const handleToggleGameScheduleVisibility = async () => {
    try {
      const newVisibility = !gameSettings.gameScheduleVisible;
      console.log('🔄 Toggling game schedule visibility to:', newVisibility);
      const response = await api.post('/api/admin/game-schedule-visibility', { visible: newVisibility });
      console.log('✅ Game schedule visibility response:', response.data);
      toast.success(`Game schedule is now ${newVisibility ? 'visible' : 'hidden'}`);
      fetchGameSettings();
    } catch (error) {
      console.error('❌ Error toggling game schedule visibility:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to toggle game schedule visibility';
      toast.error(`Failed to toggle game schedule visibility: ${errorMessage}`);
    }
  };

  const handleToggleSetVisibility = async (setName) => {
    try {
      const currentVisibleSets = gameSettings.visibleSets || [];
      const newVisibleSets = currentVisibleSets.includes(setName)
        ? currentVisibleSets.filter(set => set !== setName)
        : [...currentVisibleSets, setName];
      
      await api.post('/api/admin/visible-sets', { sets: newVisibleSets });
      toast.success(`${setName.replace('contentSet', 'Set ')} is now ${currentVisibleSets.includes(setName) ? 'hidden' : 'visible'}`);
      fetchGameSettings();
    } catch (error) {
      console.error('Error toggling set visibility:', error);
      toast.error('Failed to toggle set visibility');
    }
  };

  const handleEditTeamSchedules = (teamName) => {
    setEditingTeam(teamName);
    setEditingSchedules(gameSettings.teamGameSchedules[teamName] || {});
    setShowEditModal(true);
  };

  const handleSaveTeamSchedules = async () => {
    try {
      await api.post('/api/admin/team-game-schedules', {
        schedules: { [editingTeam]: editingSchedules }
      });
      toast.success(`Schedules updated for ${editingTeam.replace('team', 'Team ')}`);
      setShowEditModal(false);
      setEditingTeam(null);
      fetchGameSettings();
    } catch (error) {
      console.error('Error saving team schedules:', error);
      toast.error('Failed to save team schedules');
    }
  };

  const updateGame = (setName, gameIndex, field, value) => {
    setEditingSchedules(prev => ({
      ...prev,
      [setName]: prev[setName].map((game, index) => 
        index === gameIndex ? { ...game, [field]: value } : game
      )
    }));
  };

  const addGame = (setName) => {
    setEditingSchedules(prev => ({
      ...prev,
      [setName]: [
        ...(prev[setName] || []),
        { shiftNumber: (prev[setName]?.length || 0) + 1, game: '', gamePlace: '' }
      ]
    }));
  };

  const removeGame = (setName, gameIndex) => {
    setEditingSchedules(prev => ({
      ...prev,
      [setName]: prev[setName].filter((_, index) => index !== gameIndex)
    }));
  };



  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading game schedule settings...</p>
        </div>
      </div>
    );
  }

  // Add safety check for gameSettings
  if (!gameSettings || Object.keys(gameSettings).length === 0) {
    console.log('⚠️ gameSettings is empty or undefined:', gameSettings);
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>⚠️ No Game Settings Available</h3>
          <p style={{ color: '#666' }}>Unable to load game settings. Please try refreshing the page.</p>
          <button onClick={fetchGameSettings} className="btn btn-primary" style={{ marginTop: '16px' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 About to render AdminGameSchedule JSX');
  
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Game Schedule Management</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Manage game schedules, content sets, and visibility for all teams.
          </p>
          <p style={{ color: 'green', margin: '8px 0 0 0', fontSize: '12px' }}>✅ Component is rendering successfully!</p>
  
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleToggleGameScheduleVisibility}
            className="btn"
            style={{
              backgroundColor: gameSettings.gameScheduleVisible ? '#dc3545' : '#28a745',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {gameSettings.gameScheduleVisible ? 'Hide Game Schedule' : 'Show Game Schedule'}
          </button>
        </div>
      </div>

      {/* Global Settings */}
      <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '16px', color: '#4facfe' }}>Global Settings</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Active Content Set */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Active Content Set
            </label>
            <select
              className="input"
              value={gameSettings.activeContentSet || 'contentSet1'}
              onChange={(e) => handleSetActiveContentSet(e.target.value)}
              style={{ width: '100%' }}
            >
              {gameSettings.availableSets?.map(set => (
                <option key={set} value={set}>
                  {set.replace('contentSet', 'Set ')}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Currently active: {gameSettings.activeContentSet?.replace('contentSet', 'Set ')}
            </p>
          </div>

          {/* Set Visibility */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Visible Content Sets
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gameSettings.availableSets?.map(set => (
                <label key={set} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={gameSettings.visibleSets?.includes(set) || false}
                    onChange={() => handleToggleSetVisibility(set)}
                  />
                  <span>{set.replace('contentSet', 'Set ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Schedules */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px', color: '#4facfe' }}>Team Schedules</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {gameSettings.availableTeams?.map(team => (
            <div 
              key={team}
              style={{
                padding: '16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h5 style={{ margin: 0, color: '#333' }}>
                  {team.replace('team', 'Team ')}
                </h5>
                <button
                  onClick={() => handleEditTeamSchedules(team)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  ✏️ Edit Schedules
                </button>
              </div>
              
              {gameSettings.availableSets?.map(set => {
                const schedule = gameSettings.teamGameSchedules?.[team]?.[set] || [];
                const isVisible = gameSettings.visibleSets?.includes(set);
                const isActive = gameSettings.activeContentSet === set;
                
                return (
                  <div 
                    key={set}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      background: isActive ? '#e3f2fd' : '#f8f9fa',
                      borderLeft: `4px solid ${isActive ? '#2196f3' : (isVisible ? '#28a745' : '#dc3545')}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: isActive ? '#2196f3' : '#333' }}>
                        {set.replace('contentSet', 'Set ')}
                      </strong>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isActive && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            fontSize: '10px',
                            borderRadius: '12px'
                          }}>
                            ACTIVE
                          </span>
                        )}
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: isVisible ? '#28a745' : '#dc3545',
                          color: 'white',
                          fontSize: '10px',
                          borderRadius: '12px'
                        }}>
                          {isVisible ? 'VISIBLE' : 'HIDDEN'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {schedule.length > 0 ? (
                        <div>
                          {schedule.slice(0, 2).map((game, index) => (
                            <div key={index} style={{ marginBottom: '4px' }}>
                              Shift {game.shiftNumber}: {game.game} at {game.gamePlace}
                            </div>
                          ))}
                          {schedule.length > 2 && (
                            <div style={{ color: '#999', fontStyle: 'italic' }}>
                              +{schedule.length - 2} more games...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>
                          No games scheduled
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTeam && (
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
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Edit Schedules for {editingTeam.replace('team', 'Team ')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              {gameSettings.availableSets?.map(set => (
                <div 
                  key={set}
                  style={{ 
                    marginBottom: '24px',
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#fff'
                  }}
                >
                  <h4 style={{ marginBottom: '16px', color: '#4facfe' }}>
                    {set.replace('contentSet', 'Content Set ')}
                  </h4>
                  
                  {editingSchedules[set] && editingSchedules[set].length > 0 && editingSchedules[set].map((game, gameIndex) => (
                    <div 
                      key={gameIndex}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '80px 1fr 1fr auto', 
                        gap: '12px', 
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '12px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        background: '#f9f9f9'
                      }}
                    >
                      <input
                        type="number"
                        placeholder="Shift #"
                        value={game.shiftNumber || ''}
                        onChange={(e) => updateGame(set, gameIndex, 'shiftNumber', parseInt(e.target.value) || 0)}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        placeholder="Game"
                        value={game.game || ''}
                        onChange={(e) => updateGame(set, gameIndex, 'game', e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        placeholder="Game Place"
                        value={game.gamePlace || ''}
                        onChange={(e) => updateGame(set, gameIndex, 'gamePlace', e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <button
                        onClick={() => removeGame(set, gameIndex)}
                        className="btn btn-danger"
                        style={{ padding: '8px 12px' }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addGame(set)} 
                    className="btn btn-secondary"
                    style={{ marginTop: '8px' }}
                  >
                    ➕ Add Game to {set.replace('contentSet', 'Content Set ')}
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveTeamSchedules} className="btn btn-success">
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

