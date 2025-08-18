import React, { useState, useEffect, useCallback } from 'react';
import { Package, Zap, Shield, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Inventory = ({ socket }) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

  const fetchInventory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/inventory`, { withCredentials: true });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [API_BASE_URL]);

  const fetchAvailableGames = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/games/available`, { withCredentials: true });
      setAvailableGames(response.data);
    } catch (error) {
      console.error('Error fetching available games:', error);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchInventory();
    fetchTeams();
    fetchAvailableGames();
  }, [fetchInventory, fetchTeams, fetchAvailableGames]);

  // Listen for inventory updates when cards are used
  useEffect(() => {
    if (socket) {
      socket.on('inventory-update', () => {
        console.log('Inventory updated via socket');
        fetchInventory(); // Refresh inventory when cards are used
      });

      socket.on('game-settings-update', (newGameSettings) => {
        console.log('Game settings updated via socket');
        fetchAvailableGames(); // Refresh available games when admin toggles
        
        // Show notification about game changes
        const enabledGames = Object.keys(newGameSettings).filter(gameId => newGameSettings[gameId]);
        toast.info(`Game settings updated. ${enabledGames.length} games now available.`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#667eea',
            color: 'white'
          }
        });
      });

      return () => {
        socket.off('inventory-update');
        socket.off('game-settings-update');
      };
    }
  }, [socket, fetchInventory, fetchAvailableGames]);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const handleUseCard = async () => {
    if (!selectedCard) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/cards/use`, {
        cardId: selectedCard.id,
        selectedTeam,
        selectedGame,
        description
      }, { withCredentials: true });

      // Special handling for Secret Info card
      if (selectedCard.name === "Secret Info" && response.data.gameData) {
        toast.success(`Secret Info revealed: ${response.data.gameData.details}`, {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#667eea',
            color: 'white'
          }
        });
      } else {
        toast.success(`Used ${selectedCard.name}!`);
      }
      
      setShowModal(false);
      setSelectedCard(null);
      setSelectedTeam('');
      setSelectedGame('');
      setDescription('');
      fetchInventory(); // Refresh inventory
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to use card');
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'attack':
        return <Zap size={20} />;
      case 'alliance':
        return <Heart size={20} />;
      case 'luck':
        return <Shield size={20} />;
      default:
        return <Package size={20} />;
    }
  };

  const getCardColor = (type) => {
    switch (type) {
      case 'attack':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'alliance':
        return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
      case 'luck':
        return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      case 'gamehelper':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'challenge':
        return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
      case 'hightier':
        return 'linear-gradient(135deg, #ff9ff3 0%, #f093fb 100%)';
      case 'lowtier':
        return 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  // Helper function to check if card requires game selection
  const requiresGameSelection = (cardName) => {
    const gameCards = [
      'Secret Info', 'Robin Hood', 'Avenger', 'Betrayal', 
      'Freeze Player', 'Silent Game', 'Flip the Fate'
    ];
    return gameCards.includes(cardName);
  };

  // Helper function to check if card requires team selection
  const requiresTeamSelection = (cardName) => {
    const teamCards = ['Robin Hood', 'Avenger', 'Freeze Player'];
    return teamCards.includes(cardName);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="header">
        <h1>📦 Inventory</h1>
        <p>Your collected cards</p>
      </div>

      <div className="card">
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Package size={48} color="#667eea" />
            <p style={{ marginTop: '16px', color: '#666' }}>No cards yet</p>
            <p style={{ color: '#999', fontSize: '14px' }}>Spin to get cards!</p>
          </div>
        ) : (
          <div className="card-grid">
            {inventory.map((card) => (
              <div
                key={card.id}
                className="card-item"
                style={{ background: getCardColor(card.type) }}
                onClick={() => handleCardClick(card)}
              >
                <div style={{ marginBottom: '8px' }}>
                  {getCardIcon(card.type)}
                </div>
                <div className="card-name">{card.name}</div>
                <div className="card-type">{card.type}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>
                  {card.effect}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Use Modal */}
      {showModal && selectedCard && (
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
            <h3 style={{ marginBottom: '16px', color: '#333' }}>
              Use {selectedCard.name}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {selectedCard.effect}
              </p>
            </div>

            {/* Game Selection */}
            {requiresGameSelection(selectedCard.name) && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                  Select Game
                </label>
                <select
                  className="input"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  required
                >
                  <option value="">Choose a game...</option>
                  {availableGames
                    .filter(gameId => {
                      // Filter games based on card restrictions
                      if (selectedCard.name === "Flip the Fate") {
                        return parseInt(gameId) <= 11; // Only games 1-11
                      }
                      return true; // All games for other cards
                    })
                    .map((gameId) => (
                      <option key={gameId} value={gameId}>
                        Game {gameId}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Team Selection */}
            {(requiresTeamSelection(selectedCard.name) || selectedCard.type === 'attack' || selectedCard.type === 'alliance') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                  Select Team
                </label>
                <select
                  className="input"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="">Choose a team...</option>
                  {teams.filter(team => team.id !== (user && user.id)).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.teamName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                Description (Optional)
              </label>
              <textarea
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how you want to use this card..."
                rows="3"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn"
                onClick={handleUseCard}
                disabled={
                  (requiresGameSelection(selectedCard.name) && !selectedGame) ||
                  (requiresTeamSelection(selectedCard.name) && !selectedTeam) ||
                  ((selectedCard.type === 'attack' || selectedCard.type === 'alliance') && !selectedTeam)
                }
                style={{ flex: 1 }}
              >
                Use Card
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedCard(null);
                  setSelectedTeam('');
                  setSelectedGame('');
                  setDescription('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer for developer credit */}
      <div style={{ textAlign: 'center', padding: '20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>
          Developed by <strong style={{ color: 'white' }}>Ayman</strong>
        </p>
      </div>
    </div>
  );
};

export default Inventory; 