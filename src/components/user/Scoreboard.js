import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Scoreboard = ({ socket }) => {
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';

  const fetchScoreboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setScoreboard(response.data);
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard]);

  // Listen for real-time scoreboard updates
  useEffect(() => {
    if (socket) {
      socket.on('scoreboard-update', (updatedUsers) => {
        console.log('Scoreboard updated via socket:', updatedUsers);
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
        
        setScoreboard(updatedScoreboard);
        setLastUpdate(new Date());
        
        // Show a subtle notification for live updates
        toast.success('Scoreboard updated!', {
          duration: 2000,
          icon: '🔄',
          style: {
            background: '#4CAF50',
            color: 'white',
          },
        });
      });

      return () => {
        socket.off('scoreboard-update');
      };
    }
  }, [socket]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Medal style={{ color: '#FFD700' }} size={24} />;
      case 2:
        return <Medal style={{ color: '#C0C0C0' }} size={24} />;
      case 3:
        return <Medal style={{ color: '#CD7F32' }} size={24} />;
      default:
        return <Award size={24} />;
    }
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
        <h1>🏆 Scoreboard</h1>
        <p>Live team rankings</p>
        {lastUpdate && (
          <div style={{ 
            fontSize: '12px', 
            color: '#4CAF50', 
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              background: '#4CAF50', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="card">
        {scoreboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Trophy size={48} color="#667eea" />
            <p style={{ marginTop: '16px', color: '#666' }}>No teams yet</p>
          </div>
        ) : (
          scoreboard.map((team, index) => (
            <div key={team.id} className="scoreboard-item">
              <div className="scoreboard-rank">
                {getRankIcon(index + 1)}
              </div>
              <div className="scoreboard-info">
                <div className="scoreboard-name">{team.teamName}</div>
                <div className="scoreboard-stats">
                  Score: {team.score} • Coins: {team.coins}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#667eea' }}>
                #{index + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Scoreboard; 