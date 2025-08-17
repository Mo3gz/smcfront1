import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaCoins, FaClock, FaInfoCircle } from 'react-icons/fa';
import { GiMining } from 'react-icons/gi';
import api from '../../utils/api';

const MiningDashboard = () => {
  const { currentUser } = useAuth();
  const [miningStats, setMiningStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);

  useEffect(() => {
    const loadMiningStats = async () => {
      try {
        const response = await api.get('/api/mining/stats');
        if (response.data.success) {
          setMiningStats(response.data.data);
        }
      } catch (error) {
        console.error('Error loading mining stats:', error);
        toast.error('Failed to load mining data');
      } finally {
        setIsLoading(false);
      }
    };

    loadMiningStats();
    // Refresh every 5 minutes
    const interval = setInterval(loadMiningStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMine = async (countryId) => {
    if (isMining) return;
    
    try {
      setIsMining(true);
      const response = await api.post(`/api/mining/mine/${countryId}`);
      
      if (response.data.success) {
        // Update the UI with the new data
        const updatedStats = miningStats.map(stat => {
          if (stat.countryId === countryId) {
            return {
              ...stat,
              lastMined: new Date().toISOString(),
              timeSinceLastMine: 0,
              coinsAvailable: 0
            };
          }
          return stat;
        });
        
        setMiningStats(updatedStats);
        
        toast.success(`Successfully mined ${response.data.coinsMined} coins!`);
        
        // Update user balance in the UI (you might want to implement this in your auth context)
        if (currentUser && currentUser.updateBalance) {
          currentUser.updateBalance(response.data.newBalance);
        }
      }
    } catch (error) {
      console.error('Mining error:', error);
      toast.error(error.response?.data?.message || 'Failed to mine coins');
    } finally {
      setIsMining(false);
    }
  };

  const formatTime = (hours) => {
    if (hours < 1) {
      const minutes = Math.ceil(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (miningStats.length === 0) {
    return (
      <div className="text-center p-8">
        <GiMining className="mx-auto text-6xl text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No mining data available</h3>
        <p className="mt-1 text-sm text-gray-500">You don't own any countries that can mine coins yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <GiMining className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Mining Dashboard</h2>
          <div className="ml-auto flex items-center text-sm text-gray-500">
            <FaInfoCircle className="mr-1" />
            <span>Coins are mined automatically when you're offline</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {miningStats.map((stat) => (
            <div key={stat.countryId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{stat.countryName}</h3>
                  <p className="text-sm text-gray-500">Mining Rate: {stat.miningRate} coins/hour</p>
                </div>
                <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {stat.coinsAvailable > 0 ? 'Ready to mine' : 'Mining...'}
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available Coins:</span>
                  <span className="font-medium flex items-center">
                    <FaCoins className="text-yellow-500 mr-1" />
                    {Math.floor(stat.coinsAvailable)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Mined:</span>
                  <span className="text-gray-700">
                    {new Date(stat.lastMined).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Mine In:</span>
                  <span className="text-gray-700 flex items-center">
                    <FaClock className="mr-1" />
                    {stat.coinsAvailable > 0 ? 'Now' : formatTime(stat.nextMineIn)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleMine(stat.countryId)}
                disabled={isMining || stat.coinsAvailable === 0}
                className={`mt-4 w-full py-2 px-4 rounded-md text-sm font-medium text-white ${
                  stat.coinsAvailable > 0
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isMining ? 'Mining...' : `Mine ${Math.floor(stat.coinsAvailable)} Coins`}
              </button>
              
              {stat.coinsAvailable === 0 && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Check back in {formatTime(stat.nextMineIn)} to mine more coins
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaInfoCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How Mining Works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Each country mines coins at its own rate per hour</p>
              <p>• Coins are automatically mined even when you're offline</p>
              <p>• Collect your mined coins by clicking the "Mine" button</p>
              <p>• The longer you wait, the more coins you'll collect (up to 24 hours)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningDashboard;
