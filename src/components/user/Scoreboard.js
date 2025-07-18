import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import axios from 'axios';

const Scoreboard = () => {
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreboard();
  }, []);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';

  const fetchScoreboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
      setScoreboard(response.data);
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
    } finally {
      setLoading(false);
    }
  };

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