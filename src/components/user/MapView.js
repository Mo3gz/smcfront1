import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';

const MapView = ({ userData, setUserData, socket }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  // Listen for real-time country updates
  useEffect(() => {
    if (socket) {
      socket.on('countries-update', (updatedCountries) => {
        console.log('Countries updated via socket:', updatedCountries);
        setCountries(updatedCountries);
        setLastUpdate(new Date());
        
        // Show a subtle notification for live updates
        toast.success('Map updated!', {
          duration: 2000,
          icon: '🗺️',
          style: {
            background: '#2196F3',
            color: 'white',
          },
        });
      });

      return () => {
        socket.off('countries-update');
      };
    }
  }, [socket]);

  const fetchCountries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/countries`);
      setCountries(response.data);
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCountry = async (country) => {
    if (country.owner) {
      toast.error('This country is already owned!');
      return;
    }

    if (userData.coins < country.cost) {
      toast.error('Insufficient coins!');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/countries/buy`, {
        countryId: country.id
      }, { withCredentials: true });

      // Update local state immediately for better UX
      setCountries(prev => 
        prev.map(c => 
          c.id === country.id 
            ? { ...c, owner: userData.id }
            : c
        )
      );

      setUserData(prev => ({
        ...prev,
        coins: response.data.user.coins,
        score: response.data.user.score
      }));

      toast.success(`Successfully bought ${country.name}!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to buy country');
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            background: 'rgba(102, 126, 234, 0.1)', 
            padding: '16px', 
            borderRadius: '12px' 
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#667eea' }}>
                {userData?.coins || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Your Coins</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#667eea' }}>
                {countries.filter(c => c.owner === userData?.id).length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Countries Owned</div>
            </div>
          </div>
        </div>

        <div className="map-grid">
          {countries.map((country) => (
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
                    {country.cost} coins
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
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
          <h4 style={{ color: '#667eea', marginBottom: '12px' }}>How it works</h4>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <p><strong>Buy Countries:</strong> Spend coins to own countries and gain their score points</p>
            <p><strong>Score Boost:</strong> Each country gives you bonus points for the scoreboard</p>
            <p><strong>Exclusive:</strong> Once owned, a country cannot be bought by other teams</p>
            <p><strong>Strategy:</strong> Choose wisely - expensive countries give more points!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView; 