import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Progress, notification, Spin } from 'antd';
import { ThunderboltOutlined, PauseOutlined, GlobalOutlined, BellOutlined } from '@ant-design/icons';
import axios from 'axios';
import MiningStats from './MiningStats';
import CountrySelector from './CountrySelector';
import MiningNotifications from './MiningNotifications';

const MiningDashboard = () => {
  const [isMining, setIsMining] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [offlineMining, setOfflineMining] = useState(null);
  const [activeTab, setActiveTab] = useState('mining');

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
    // Set up interval to update stats every minute
    const interval = setInterval(fetchMiningStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [countriesRes, statsRes] = await Promise.all([
        axios.get('/api/countries'),
        axios.get('/api/mining/stats')
      ]);
      
      setCountries(countriesRes.data);
      
      if (statsRes.data.stats) {
        setStats(statsRes.data.stats);
        setIsMining(true);
      }
      
      if (statsRes.data.offlineMining) {
        setOfflineMining(statsRes.data.offlineMining);
        notification.success({
          message: 'Offline Mining Complete',
          description: `You've mined ${statsRes.data.offlineMining.mined.toFixed(6)} coins while offline!`,
          duration: 5,
        });
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      notification.error({
        message: 'Error',
        description: 'Failed to load mining data. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMiningStats = async () => {
    if (!isMining) return;
    
    try {
      const res = await axios.get('/api/mining/stats');
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching mining stats:', err);
    }
  };

  const handleStartMining = async (countryId) => {
    try {
      await axios.post('/api/mining/start', { countryId });
      const res = await axios.get('/api/mining/stats');
      setStats(res.data.stats);
      setIsMining(true);
      setShowCountrySelect(false);
      
      notification.success({
        message: 'Mining Started',
        description: 'Your mining session has started successfully!',
      });
    } catch (err) {
      console.error('Error starting mining:', err);
      notification.error({
        message: 'Error',
        description: 'Failed to start mining. Please try again.'
      });
    }
  };

  const handleStopMining = async () => {
    try {
      await axios.post('/api/mining/stop');
      setIsMining(false);
      setStats(null);
      
      notification.info({
        message: 'Mining Stopped',
        description: 'Your mining session has been stopped.',
      });
    } catch (err) {
      console.error('Error stopping mining:', err);
      notification.error({
        message: 'Error',
        description: 'Failed to stop mining. Please try again.'
      });
    }
  };

  const calculateProgress = () => {
    if (!stats) return 0;
    const now = new Date();
    const lastActive = new Date(stats.lastActive);
    const timeDiff = (now - lastActive) / 1000; // in seconds
    
    // Calculate progress percentage (resets every hour)
    const progress = (timeDiff % 3600) / 36; // 0-100% per hour
    return Math.min(100, Math.max(0, progress));
  };

  if (loading) {
    return (
      <div className="mining-loading">
        <Spin size="large" />
        <p>Loading mining data...</p>
      </div>
    );
  }

  return (
    <div className="mining-dashboard">
      <Card 
        title={
          <div className="mining-header">
            <ThunderboltOutlined className="mining-icon" />
            <span>Mining Dashboard</span>
            <div className="mining-actions">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                onClick={() => setShowNotifications(!showNotifications)}
              />
              {isMining && (
                <Button 
                  type="primary" 
                  danger 
                  icon={<PauseOutlined />} 
                  onClick={handleStopMining}
                >
                  Stop Mining
                </Button>
              )}
            </div>
          </div>
        }
        className="mining-card"
      >
        {showNotifications && (
          <MiningNotifications 
            onClose={() => setShowNotifications(false)} 
          />
        )}
        
        {!isMining ? (
          <div className="mining-stopped">
            <h3>Mining is currently inactive</h3>
            <p>Start mining to earn coins based on your selected country's mining rate.</p>
            <Button 
              type="primary" 
              size="large" 
              icon={<GlobalOutlined />}
              onClick={() => setShowCountrySelect(true)}
            >
              Select Country & Start Mining
            </Button>
          </div>
        ) : (
          <div className="mining-active">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <div className="mining-progress">
                  <div className="mining-progress-header">
                    <span>Current Mining Progress</span>
                    <span>{calculateProgress().toFixed(1)}%</span>
                  </div>
                  <Progress 
                    percent={calculateProgress()} 
                    status="active" 
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
                
                <MiningStats stats={stats} />
              </Col>
              
              <Col xs={24} md={8}>
                <Card className="mining-country-info">
                  <h4>Current Country</h4>
                  <div className="country-flag">
                    <span className={`flag-icon flag-icon-${stats.country.code.toLowerCase()}`}></span>
                    <span className="country-name">{stats.country.name}</span>
                  </div>
                  <div className="mining-rate">
                    <span>Mining Rate:</span>
                    <span className="rate-value">
                      {stats.estimatedHourlyRate.toFixed(6)} <small>coins/hour</small>
                    </span>
                  </div>
                  <Button 
                    type="default" 
                    block 
                    onClick={() => setShowCountrySelect(true)}
                  >
                    Change Country
                  </Button>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <CountrySelector
        visible={showCountrySelect}
        countries={countries}
        onSelect={handleStartMining}
        onCancel={() => setShowCountrySelect(false)}
      />
    </div>
  );
};

export default MiningDashboard;
