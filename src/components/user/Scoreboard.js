import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Scoreboard = ({ socket }) => {
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [previousScoreboard, setPreviousScoreboard] = useState([]);
  const [highlightedTeams, setHighlightedTeams] = useState(new Set());

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

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
        
        // Compare with previous scoreboard to detect changes
        const changes = detectScoreboardChanges(previousScoreboard, updatedScoreboard);
        
        // Highlight teams with changes
        if (changes.length > 0) {
          const teamsToHighlight = new Set(changes.map(change => change.teamId));
          setHighlightedTeams(teamsToHighlight);
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedTeams(new Set());
          }, 3000);
          
          // Show detailed notifications for changes
          changes.forEach(change => {
            if (change.type === 'score') {
              const icon = change.difference > 0 ? '📈' : '📉';
              const color = change.difference > 0 ? '#4CAF50' : '#f44336';
              toast.success(`${icon} ${change.teamName}: ${change.difference > 0 ? '+' : ''}${change.difference} points`, {
                duration: 3000,
                style: {
                  background: color,
                  color: 'white',
                },
              });
            } else if (change.type === 'coins') {
              const icon = change.difference > 0 ? '💰' : '💸';
              const color = change.difference > 0 ? '#4CAF50' : '#f44336';
              toast.success(`${icon} ${change.teamName}: ${change.difference > 0 ? '+' : ''}${change.difference} coins`, {
                duration: 3000,
                style: {
                  background: color,
                  color: 'white',
                },
              });
            }
          });
        }
        
        setPreviousScoreboard(scoreboard);
        setScoreboard(updatedScoreboard);
        setLastUpdate(new Date());
      });

      // Listen for user updates (from spinning, buying countries, etc.)
      socket.on('user-update', (updatedUser) => {
        console.log('User updated via socket:', updatedUser);
        // The scoreboard-update event will handle the display
      });

      return () => {
        socket.off('scoreboard-update');
        socket.off('user-update');
      };
    }
  }, [socket, previousScoreboard, scoreboard]);

  // Function to detect changes in scoreboard
  const detectScoreboardChanges = (oldScoreboard, newScoreboard) => {
    const changes = [];
    
    newScoreboard.forEach(newTeam => {
      const oldTeam = oldScoreboard.find(team => team.id === newTeam.id);
      if (oldTeam) {
        // Check for score changes
        if (newTeam.score !== oldTeam.score) {
          changes.push({
            teamId: newTeam.id,
            teamName: newTeam.teamName,
            type: 'score',
            difference: newTeam.score - oldTeam.score,
            oldValue: oldTeam.score,
            newValue: newTeam.score
          });
        }
        
        // Check for coin changes
        if (newTeam.coins !== oldTeam.coins) {
          changes.push({
            teamId: newTeam.id,
            teamName: newTeam.teamName,
            type: 'coins',
            difference: newTeam.coins - oldTeam.coins,
            oldValue: oldTeam.coins,
            newValue: newTeam.coins
          });
        }
      }
    });
    
    return changes;
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

  const getChangeIcon = (team) => {
    if (!highlightedTeams.has(team.id)) return null;
    
    const oldTeam = previousScoreboard.find(t => t.id === team.id);
    if (!oldTeam) return null;
    
    if (team.score > oldTeam.score) {
      return <TrendingUp size={16} style={{ color: '#4CAF50' }} />;
    } else if (team.score < oldTeam.score) {
      return <TrendingDown size={16} style={{ color: '#f44336' }} />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="scoreboard-container">
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
            <div 
              key={team.id} 
              className={`scoreboard-item ${highlightedTeams.has(team.id) ? 'highlighted' : ''}`}
              style={{
                background: highlightedTeams.has(team.id) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                border: highlightedTeams.has(team.id) ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="scoreboard-rank">
                {getRankIcon(index + 1)}
              </div>
              <div className="scoreboard-info">
                <div className="scoreboard-name">
                  {team.teamName}
                  {getChangeIcon(team)}
                </div>
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
      <div style={{ textAlign: 'center', padding: '20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>
          Developed by <strong style={{ color: 'white' }}>Ayman</strong>
        </p>
      </div>
    </div>
  );
};

export default Scoreboard; 