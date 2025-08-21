import React, { useState, useEffect, useCallback } from 'react';
import { Coins } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const MapView = ({ userData, setUserData, socket }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, country: null });

  const recalculateMiningRate = useCallback((currentCountries = countries) => {
    if (userData?.id) {
      const ownedCountries = currentCountries.filter(c => c.owner === userData.id);
      const calculatedMiningRate = ownedCountries.reduce((sum, c) => sum + (c.miningRate || 0), 0);
      
      // Update user data with calculated mining rate
      setUserData(prev => ({
        ...prev,
        miningRate: calculatedMiningRate
      }));
    }
  }, [userData?.id, setUserData, countries]);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await api.get(`/api/countries`);
      setCountries(response.data);
      
      // Recalculate mining rate based on owned countries
      if (userData?.id) {
        const ownedCountries = response.data.filter(c => c.owner === userData.id);
        const calculatedMiningRate = ownedCountries.reduce((sum, c) => sum + (c.miningRate || 0), 0);
        
        // Update user data with calculated mining rate
        setUserData(prev => ({
          ...prev,
          miningRate: calculatedMiningRate
        }));
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Fetch mining information
  useEffect(() => {
    const fetchMiningInfo = async () => {
      try {
        // Safari-specific authentication
        const userAgent = navigator.userAgent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        const config = { withCredentials: true };
        
        if (isSafari) {
          const storedUsername = localStorage.getItem('safariUsername');
          if (storedUsername) {
            config.headers = { 'x-username': storedUsername };
            console.log('🦁 Mining Info: Adding Safari username:', storedUsername);
          }
        }
        
        const response = await api.get(`/api/mining/info`, config);
        if (response.data) {
          setUserData(prev => ({
            ...prev,
            miningRate: response.data.miningRate,
            totalMined: response.data.totalMined,
            lastMined: response.data.lastMined
          }));
        }
      } catch (error) {
        console.error('Error fetching mining info:', error);
      }
    };

    if (userData?.id) {
      fetchMiningInfo();
    }
  }, [userData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

        // Listen for real-time country updates
      useEffect(() => {
        if (socket) {
          socket.on('countries-update', (updatedCountries) => {
            console.log('Countries updated via socket:', updatedCountries);
            setCountries(updatedCountries);
            setLastUpdate(new Date());
            
            // Recalculate mining rate after countries update
            setTimeout(() => {
              recalculateMiningRate(updatedCountries);
            }, 100);
            
            // Show a subtle notification for live updates (only for non-purchase updates)
            if (updatedCountries.length > countries.length || updatedCountries.some(c => c.owner !== countries.find(oc => oc.id === c.id)?.owner)) {
              toast.success('Map updated!', {
                duration: 2000,
                icon: '🗺️',
                style: {
                  background: '#2196F3',
                  color: 'white',
                },
              });
            }
          });

      // Listen for country visibility updates
      socket.on('country-visibility-update', ({ countryId, visible }) => {
        setCountries(prev => prev.map(country => 
          country.id === countryId 
            ? { ...country, isVisible: visible }
            : country
        ));
      });

      // Listen for global 50 coins countries visibility updates
      socket.on('fifty-coins-countries-visibility-update', (data) => {
        console.log('📡 Global 50 coins visibility update received:', data);
        toast(`50 kaizen countries are now ${data.hidden ? 'hidden' : 'visible'}`, {
          duration: 3000,
          icon: data.hidden ? '👁️‍🗨️' : '👁️',
        });
        
        // Refresh countries list to reflect the new visibility state
        fetchCountries();
      });

      // Listen for mining updates
      socket.on('user-update', (updatedUser) => {
        if (updatedUser.id === userData?.id) {
          setUserData(prev => ({ ...prev, ...updatedUser }));
        }
      });

      return () => {
        socket.off('countries-update');
        socket.off('country-visibility-update');
        socket.off('fifty-coins-countries-visibility-update');
        socket.off('user-update');
      };
    }
  }, [socket, userData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuyCountry = (country) => {
    if (country.owner) {
      toast.error('This country is already owned!');
      return;
    }
    if (userData.coins < country.cost) {
              toast.error('Insufficient kaizen!');
      return;
    }
    setConfirmModal({ open: true, country });
  };

  const confirmBuyCountry = async () => {
    const country = confirmModal.country;
    if (!country) return;
    setConfirmModal({ open: false, country: null });
    try {
      // Safari-specific authentication
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
          console.log('🦁 Buy Country: Adding Safari username:', storedUsername);
        }
      }
      
      const response = await api.post(`/api/countries/buy`, {
        countryId: country.id
      }, config);
      
      // Update user data with new coins, score, and mining rate
      setUserData(prev => ({
        ...prev,
        coins: response.data.user.coins,
        score: response.data.user.score,
        miningRate: response.data.user.miningRate
      }));
      
      // Small delay to ensure socket updates are processed
      setTimeout(() => {
        toast.success(`Successfully bought ${country.name}!`);
      }, 100);
      
      // The countries list will be updated via socket.io 'countries-update' event
      // No need to manually update it here
    } catch (error) {
      console.error('Buy country error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to buy country';
      toast.error(errorMessage);
      
      // If it's a 500 error, suggest refreshing
      if (error.response?.status === 500) {
        toast.error('Server error occurred. Please refresh the page and try again.');
      }
    }
  };



  const getCountryColor = (country) => {
    if (country.owner === userData.id) {
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
    if (country.owner) {
      return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
    }
    return 'rgba(255, 255, 255, 0.9)';
  };

  const getCountryTextColor = (country) => {
    if (country.owner) {
      return 'white';
    }
    return '#333';
  };

  // Recalculate mining rate when countries change
  useEffect(() => {
    if (userData?.id && countries.length > 0) {
      const ownedCountries = countries.filter(c => c.owner === userData.id);
      const calculatedMiningRate = ownedCountries.reduce((sum, c) => sum + (c.miningRate || 0), 0);
      
      setUserData(prev => ({
        ...prev,
        miningRate: calculatedMiningRate
      }));
    }
  }, [countries, userData?.id, setUserData]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="mapview-container">
      <div className="header">
        <h1>🗺️ World Map</h1>
        <p>Conquer countries to boost your score!</p>
        {lastUpdate && (
          <div style={{ 
            fontSize: '12px', 
            color: '#2196F3', 
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              background: '#2196F3', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div className="mining-stats">
            <div className="mining-stat-item">
              <div className="mining-stat-value">
                {countries.filter(c => c.owner === userData?.id).length}
              </div>
              <div className="mining-stat-label">Countries Owned</div>
            </div>
            <div className="mining-stat-item">
              <div className="mining-stat-value">
                {userData?.totalMined || 0}
              </div>
              <div className="mining-stat-label">Total Mined</div>
            </div>
          </div>
        </div>



        <div className="map-grid">
          {countries.filter(country => country.isVisible !== false).map((country) => (
            <div
              key={country.id}
              className="country-item"
              style={{
                background: getCountryColor(country),
                color: getCountryTextColor(country),
                cursor: country.owner ? 'default' : 'pointer'
              }}
              onClick={() => !country.owner && handleBuyCountry(country)}
            >
              <div className="country-name">{country.name}</div>
              <div className="country-cost" style={{ 
                color: country.owner ? 'rgba(255, 255, 255, 0.8)' : '#666' 
              }}>
                {country.owner ? (
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    +{country.score} points
                  </span>
                ) : (
                  <>
                    <Coins size={14} style={{ marginRight: '4px' }} />
                    {country.cost} kaizen
                  </>
                )}
              </div>
              {country.owner === userData?.id && (
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Yours
                </div>
              )}
              {country.owner && country.owner !== userData?.id && (
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Owned
                </div>
              )}
              {/* Display mining rate for all countries */}
              <div className="mining-rate-display">
                ⛏️ {country.miningRate || 0}/hr
              </div>
              {/* Show mining rate more prominently for owned countries */}
              {country.owner === userData?.id && (
                <div className="mining-rate-owned">
                  +{country.miningRate || 0} kaizen/hr
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
          <h4 style={{ color: '#667eea', marginBottom: '12px' }}>How it works</h4>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <p><strong>Buy Countries:</strong> Spend kaizen to own countries and gain their score points</p>
            <p><strong>Score Boost:</strong> Each country gives you bonus points for the scoreboard</p>
            <p><strong>Exclusive:</strong> Once owned, a country cannot be bought by other teams</p>
            <p><strong>Strategy:</strong> Choose wisely - expensive countries give more points!</p>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmModal.open && confirmModal.country && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            minWidth: '320px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: 16 }}>Confirm Purchase</h3>
            <p style={{ marginBottom: 24 }}>
              Are you sure you want to buy <b>{confirmModal.country.name}</b> for <b>{confirmModal.country.cost} kaizen</b>?
            </p>
            <button
              className="btn"
              style={{ marginRight: 16, background: '#667eea', color: 'white', padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 600 }}
              onClick={confirmBuyCountry}
            >
              Yes, Buy
            </button>
            <button
              className="btn"
              style={{ background: '#eee', color: '#333', padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: 600 }}
              onClick={() => setConfirmModal({ open: false, country: null })}
            >
              Cancel
            </button>
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

export default MapView; 