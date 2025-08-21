import React, { useState, useEffect, useCallback } from 'react';
import { Package, Zap, Shield, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const Inventory = ({ socket, userData, setUserData }) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [gameSettings, setGameSettings] = useState({});

  const fetchInventory = useCallback(async () => {
    try {
      // Safari-specific authentication
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
          console.log('🦁 Inventory: Adding Safari username:', storedUsername);
        }
      }
      
      const response = await api.get(`/api/inventory`, config);
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.get(`/api/scoreboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchAvailableGames = useCallback(async () => {
    try {
      console.log('🎮 Fetching available games...');
      
      // Safari-specific authentication
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
          console.log('🦁 Available Games: Adding Safari username:', storedUsername);
        }
      }
      
      const response = await api.get(`/api/games/available`, config);
      console.log('🎮 Received available games:', response.data);
      console.log('🎮 Available games type:', typeof response.data);
      console.log('🎮 Available games length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Filter out fiftyCoinsCountriesHidden game if it's in the response
        const filteredGames = response.data.filter(gameId => gameId !== 'fiftyCoinsCountriesHidden');
        console.log('🎮 Filtered available games:', filteredGames);
        setAvailableGames(filteredGames);
      } else {
        console.warn('🎮 No available games returned from API, using fallback');
        // Set a default fallback to prevent empty dropdown
        setAvailableGames(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
      }
    } catch (error) {
      console.error('Error fetching available games:', error);
      console.error('Error details:', error.response?.data);
      // Set a default fallback to prevent empty dropdown
      setAvailableGames(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    }
  }, []);

  const fetchAvailableCountries = useCallback(async () => {
    try {
      console.log('🌍 Fetching available countries for borrowing...');
      
      // Safari-specific authentication
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
          console.log('🦁 Available Countries: Adding Safari username:', storedUsername);
        }
      }
      
      const response = await api.get(`/api/countries/available-for-borrow`, config);
      console.log('🌍 Received available countries:', response.data);
      setAvailableCountries(response.data);
    } catch (error) {
      console.error('Error fetching available countries:', error);
      setAvailableCountries([]);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchTeams();
    fetchAvailableGames();
    fetchAvailableCountries();
  }, [fetchInventory, fetchTeams, fetchAvailableGames, fetchAvailableCountries]);

  // Listen for inventory updates when cards are used
  useEffect(() => {
    if (socket) {
      socket.on('inventory-update', () => {
        console.log('Inventory updated via socket');
        fetchInventory(); // Refresh inventory when cards are used
      });

      socket.on('game-settings-update', (newGameSettings) => {
        console.log('Game settings updated via socket:', newGameSettings);
        
        // Update available games directly from socket data
        if (newGameSettings && typeof newGameSettings === 'object') {
          // Store the full game settings
          setGameSettings(newGameSettings);
          
          const enabledGameIds = Object.keys(newGameSettings).filter(gameId => {
            const gameData = newGameSettings[gameId];
            // Filter out fiftyCoinsCountriesHidden game when it's active
            if (gameId === 'fiftyCoinsCountriesHidden' && newGameSettings.fiftyCoinsCountriesHidden) {
              return false;
            }
            return typeof gameData === 'object' ? gameData.enabled : gameData;
          });
          console.log('🎮 Updated available games from socket:', enabledGameIds);
          setAvailableGames(enabledGameIds);
          
          // Show notification about game changes
          toast.info(`Game settings updated. ${enabledGameIds.length} games now available.`, {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#667eea',
              color: 'white'
            }
          });
        } else {
          console.warn('Invalid game settings data received:', newGameSettings);
          // Fallback to API call if socket data is invalid
          fetchAvailableGames();
        }
      });

      // Listen for countries updates to refresh available countries for borrowing
      socket.on('countries-update', () => {
        console.log('Countries updated via socket, refreshing available countries for borrowing');
        fetchAvailableCountries();
      });

      // Listen for user updates to refresh user data (including balance)
      socket.on('user-update', (updatedUser) => {
        console.log('User updated via socket:', updatedUser);
        if (updatedUser.id === user?.id && setUserData) {
          setUserData(prev => ({ ...prev, ...updatedUser }));
        }
      });

      // Listen for fifty coins countries visibility updates
      socket.on('fifty-coins-countries-visibility-update', (data) => {
        console.log('Fifty coins countries visibility updated:', data);
        // Refresh available games when visibility changes
        fetchAvailableGames();
      });

      return () => {
        socket.off('inventory-update');
        socket.off('game-settings-update');
        socket.off('countries-update');
        socket.off('user-update');
        socket.off('fifty-coins-countries-visibility-update');
      };
    }
  }, [socket, fetchInventory, fetchAvailableGames, fetchAvailableCountries, setUserData, user?.id]);

  const handleCardClick = (card) => {
    console.log('🎮 Card clicked:', card);
    console.log('🎮 Card requiresGameSelection:', card.requiresGameSelection);
    console.log('🎮 Card requiresTeamSelection:', card.requiresTeamSelection);
    console.log('🎮 Card maxGame:', card.maxGame);
    setSelectedCard(card);
    setShowModal(true);
  };

  const handleUseCard = async () => {
    if (!selectedCard) return;

    try {
      const response = await api.post(`/api/cards/use`, {
        cardId: selectedCard.id,
        selectedTeam,
        selectedGame,
        selectedCountry,
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
      } else if (selectedCard.name === "Borrow kaizen to buy a country" && response.data.success) {
        toast.success(`Successfully purchased ${response.data.purchasedCountry.name} for ${response.data.purchasedCountry.cost} kaizen! New balance: ${response.data.newBalance} kaizen`, {
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
      setSelectedCountry('');
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
    // Use the card's requiresGameSelection property if available, otherwise fallback to hardcoded list
    const selectedCard = inventory.find(card => card.name === cardName);
    if (selectedCard && selectedCard.requiresGameSelection !== undefined) {
      return selectedCard.requiresGameSelection;
    }
    
    // Fallback to hardcoded list for backward compatibility
    const gameCards = [
      'Secret Info', 'Robin Hood', 'Avenger', 'Betrayal', 
      'Freeze Player', 'Silent Game', 'Flip the Fate'
    ];
    return gameCards.includes(cardName);
  };

  // Helper function to check if card requires team selection
  const requiresTeamSelection = (cardName) => {
    // Use the card's requiresTeamSelection property if available, otherwise fallback to hardcoded list
    const selectedCard = inventory.find(card => card.name === cardName);
    if (selectedCard && selectedCard.requiresTeamSelection !== undefined) {
      return selectedCard.requiresTeamSelection;
    }
    
    // Fallback to hardcoded list for backward compatibility
    const teamCards = ['Robin Hood', 'Avenger', 'Freeze Player'];
    return teamCards.includes(cardName);
  };

  // Helper function to check if card requires country selection
  const requiresCountrySelection = (cardName) => {
    return cardName === "Borrow kaizen to buy a country";
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
            {(() => {
              const shouldShow = requiresGameSelection(selectedCard.name);
              console.log('🎮 Should show game selection for', selectedCard.name, ':', shouldShow);
              return shouldShow;
            })() && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                  Select Game
                </label>
                {console.log('🎮 Debug - selectedCard:', selectedCard)}
                {console.log('🎮 Debug - availableGames:', availableGames)}
                {console.log('🎮 Debug - requiresGameSelection result:', requiresGameSelection(selectedCard.name))}
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
                      if (selectedCard.maxGame) {
                        return parseInt(gameId) <= selectedCard.maxGame;
                      }
                      // Fallback to hardcoded logic for backward compatibility
                      // Flip the Fate can now show all games
                      return true; // All games for other cards
                    })
                    .map((gameId) => {
                      const gameData = gameSettings[gameId];
                      const gameName = gameData && typeof gameData === 'object' ? gameData.name : `Game ${gameId}`;
                      return (
                        <option key={gameId} value={gameId}>
                          {gameName}
                        </option>
                      );
                    })}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Available games: {availableGames.length} | Card requires game: {requiresGameSelection(selectedCard.name) ? 'Yes' : 'No'}
                </div>
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

            {/* Country Selection for Borrow Card */}
            {requiresCountrySelection(selectedCard.name) && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
                  Select Country to Buy
                </label>
                <select
                  className="input"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  required
                >
                  <option value="">Choose a country...</option>
                  {availableCountries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} - {country.cost} kaizen
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Available countries: {availableCountries.length} | Your balance can go down to -200 kaizen
                </div>
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
                  (requiresCountrySelection(selectedCard.name) && !selectedCountry) ||
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
                  setSelectedCountry('');
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