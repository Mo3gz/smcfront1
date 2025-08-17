import React, { useState, useEffect } from 'react';
import { Coins, HardHat, Clock, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

const MapView = ({ userData, setUserData, socket }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, country: null });
  const [miningStats, setMiningStats] = useState({ totalMiningRate: 0, estimatedNextHour: 0 });
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

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
      const [countriesRes, miningRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/countries`),
        axios.get(`${API_BASE_URL}/api/mining/stats`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        })
      ]);
      
      setCountries(countriesRes.data);
      setMiningStats({
        totalMiningRate: miningRes.data.totalMiningRate || 0,
        estimatedNextHour: miningRes.data.estimatedNextHour || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCountry = (country) => {
    if (country.owner) {
      toast.error('This country is already owned!');
      return;
    }
    if (userData.coins < country.cost) {
      toast.error('Insufficient coins!');
      return;
    }
    setConfirmModal({ open: true, country });
  };

  const confirmBuyCountry = async () => {
    const country = confirmModal.country;
    if (!country) return;
    setConfirmModal({ open: false, country: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/countries/buy`, {
        countryId: country.id
      }, { withCredentials: true });
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

  const handleCollectMining = async () => {
    try {
      setCollecting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/mining/collect`,
        {},
        { 
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          } 
        }
      );
      
      if (response.data.success) {
        toast.success(`Collected ${response.data.coinsCollected} coins!`);
        setUserData(prev => ({
          ...prev,
          coins: response.data.newBalance
        }));
        fetchCountries(); // Refresh data
      }
    } catch (error) {
      console.error('Error collecting coins:', error);
      toast.error(error.response?.data?.error || 'Failed to collect coins');
    } finally {
      setCollecting(false);
    }
  };

  const getTimeSinceLastMined = (lastMined) => {
    if (!lastMined) return 'Never';
    return formatDistanceToNow(new Date(lastMined), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">World Map</h2>
        <div className="flex items-center gap-4">
          {miningStats.totalMiningRate > 0 && (
            <div className="mining-indicator">
              <HardHat size={16} className="icon" />
              <span>Mining: {miningStats.totalMiningRate}/h</span>
            </div>
          )}
          <button
            onClick={handleCollectMining}
            disabled={collecting || miningStats.estimatedNextHour <= 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              collecting || miningStats.estimatedNextHour <= 0
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {collecting ? (
              'Collecting...'
            ) : (
              <>
                <Coins size={16} />
                {miningStats.estimatedNextHour > 0
                  ? `Collect ${Math.floor(miningStats.estimatedNextHour)} coins`
                  : 'Nothing to collect'}
              </>
            )}
          </button>
        </div>
      </div>
      <div className="header">
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
              <div className="country-cost">
                {country.owner ? (
                  <span>+{country.score} points</span>
                ) : (
                  <>
                    <Coins size={14} style={{ marginRight: '4px' }} />
                    {country.cost} coins
                  </>
                )}
              </div>
              {country.owner === userData?.id && country.miningRate > 0 && (
                <div className="country-mining-info">
                  <div className="mining-rate">
                    <HardHat size={12} className="icon" />
                    <span>{country.miningRate} coins/h</span>
                  </div>
                  {country.lastMined && (
                    <div className="mining-rate mt-1">
                      <Clock size={12} className="icon" />
                      <span>{getTimeSinceLastMined(country.lastMined)}</span>
                    </div>
                  )}
                  {country.totalMined > 0 && (
                    <div className="mining-rate mt-1">
                      <Coins size={12} className="icon" />
                      <span>Total: {country.totalMined} coins</span>
                    </div>
                  )}
                </div>
              )}
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
              Are you sure you want to buy <b>{confirmModal.country.name}</b> for <b>{confirmModal.country.cost} coins</b>?
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