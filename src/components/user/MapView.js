import React, { useState, useEffect } from 'react';
import { Coins, HardHat, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

const MapView = ({ userData, setUserData, socket }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, country: null });
  const [miningStats, setMiningStats] = useState({ 
    totalMiningRate: 0, 
    estimatedNextMinute: 0,
    totalMined: 0
  });
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
      const token = localStorage.getItem('token');
      console.log('🔑 Token from localStorage:', token ? 'Found' : 'Not found');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // First, test the token with a simple endpoint
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/api/debug/token-test`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        console.log('✅ Token test successful:', testResponse.data);
      } catch (testError) {
        console.error('❌ Token test failed:', {
          status: testError.response?.status,
          data: testError.response?.data,
          message: testError.message
        });
        throw testError;
      }
      
      // If token test passes, fetch the actual data
      const [countriesRes, miningRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/countries`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }),
        axios.get(`${API_BASE_URL}/api/mining/stats`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        })
      ]);
      
      console.log('✅ Countries response:', countriesRes.status, countriesRes.data?.length);
      console.log('✅ Mining stats response:', miningRes.status, miningRes.data);
      
      setCountries(countriesRes.data);
      setMiningStats({
        totalMiningRate: miningRes.data?.totalMiningRate || 0,
        estimatedNextMinute: miningRes.data?.estimatedNextMinute || 0,
        totalMined: miningRes.data?.totalMined || 0
      });
    } catch (error) {
      console.error('Error fetching data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Redirect to login or refresh token
      } else {
        toast.error('Failed to load map data. Please try again.');
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
    if (!userData) {
      toast.error('User data not available. Please refresh the page.');
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
      const response = await axios.post(
        `${API_BASE_URL}/api/countries/buy`,
        { countryId: country.id },
        { 
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true 
        }
      );
      
      setCountries(prev =>
        prev.map(c =>
          c.id === country.id
            ? { ...c, owner: userData?.id || null, lastMined: new Date().toISOString() }
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
      console.error('Buy country error:', error);
      toast.error(error.response?.data?.error || 'Failed to buy country');
    }
  };

  const getCountryColor = (country) => {
    if (userData && country.owner === userData.id) {
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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">World Map</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleCollectMining}
              disabled={collecting || miningStats.totalMined <= 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                collecting || miningStats.totalMined <= 0
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
              title={miningStats.totalMiningRate <= 0 ? "No active mining" : `Mining at ${miningStats.totalMiningRate.toFixed(2)} coins/min`}
            >
              {collecting ? (
                'Collecting...'
              ) : (
                <>
                  <Coins size={16} />
                  {miningStats.totalMined > 0
                    ? `Collect ${Math.floor(miningStats.totalMined)} coins`
                    : miningStats.totalMiningRate > 0
                    ? 'Mining in progress...'
                    : 'Nothing to collect'}
                </>
              )}
            </button>
            {miningStats.totalMiningRate > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Earning ~{miningStats.totalMiningRate.toFixed(2)} coins/min
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Conquer countries to boost your score!</h3>
        {lastUpdate && (
          <div className="flex items-center justify-center text-sm text-blue-500 dark:text-blue-400 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {countries.map((country) => (
            <div
              key={country.id}
              className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                !country.owner ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
              }`}
              style={{
                background: getCountryColor(country),
                color: getCountryTextColor(country),
              }}
              onClick={() => !country.owner && handleBuyCountry(country)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{country.name}</h3>
                  {country.owner && (
                    <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full">
                      {country.owner === userData?.id ? 'Yours' : 'Owned'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-medium">
                      {country.cost} <Coins size={12} className="inline" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mining Rate:</span>
                    <span className="font-medium">{country.miningRate}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">{country.score || 0}</span>
                  </div>
                  {country.lastMined && (
                    <div className="text-xs text-opacity-80 flex items-center mt-1">
                      <Clock size={12} className="mr-1" />
                      {getTimeSinceLastMined(country.lastMined)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={fetchCountries}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && confirmModal.country && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Confirm Purchase
            </h3>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>Buy <span className="font-semibold">{confirmModal.country.name}</span> for {confirmModal.country.cost} coins?</p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Mining Rate:</span>
                  <span className="font-medium">{confirmModal.country.miningRate} coins/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Score Bonus:</span>
                  <span className="font-medium">+{confirmModal.country.score || 0} points</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setConfirmModal({ open: false, country: null })}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBuyCountry}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView; 