import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GameSchedule = () => {
  const { user } = useAuth();
  const [gameSchedule, setGameSchedule] = useState([]);
  const [activeContentSet, setActiveContentSet] = useState('');

  const [loading, setLoading] = useState(true);
  const [scheduleVisible, setScheduleVisible] = useState(true);

  // Determine user's team based on their teamName
  const getUserTeamKey = (teamName) => {
    // Map team names to team keys (team1, team2, etc.)
    const teamMapping = {
      'Team 1': 'team1',
      'Team 2': 'team2', 
      'Team 3': 'team3',
      'Team 4': 'team4',
      'Team 5': 'team5',
      'Team 6': 'team6',
      'Team 7': 'team7',
      'Team 8': 'team8',
      'Ayman': 'team1', // Admin user
      // Add more mappings as needed for different team naming conventions
      '1': 'team1',
      '2': 'team2',
      '3': 'team3',
      '4': 'team4',
      '5': 'team5',
      '6': 'team6',
      '7': 'team7',
      '8': 'team8'
    };
    
    return teamMapping[teamName] || 'team1'; // Default to team1 if no mapping found
  };

  // Fetch game schedule for user's team
  const fetchGameSchedule = useCallback(async () => {
    try {
      if (!user || !user.teamName) {
        console.log('No user or teamName available');
        return;
      }

      const userTeamKey = getUserTeamKey(user.teamName);
      console.log('Fetching schedule for user team:', user.teamName, '->', userTeamKey);
      
      const response = await api.get(`/api/game-schedule?team=${userTeamKey}`);
      setGameSchedule(response.data.schedule || []);
      setActiveContentSet(response.data.activeContentSet || '');

      setScheduleVisible(response.data.visible !== false);
    } catch (error) {
      console.error('Error fetching game schedule:', error);
      toast.error('Failed to load game schedule');
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGameSchedule();
      setLoading(false);
    };
    
    if (user) {
      loadData();
    }
  }, [user, fetchGameSchedule]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
        <h3>Loading Your Game Schedule...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%', width: '100%' }}>
      <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>
        📅 Your Game Schedule
      </h2>



      {/* Game Schedule Section */}
      {scheduleVisible && (
        <div style={{ 
          padding: '20px', 
          border: '2px solid #4facfe', 
          borderRadius: '12px',
          background: '#f0f8ff'
        }}>
          <h3 style={{ 
            marginBottom: '20px', 
            color: '#4facfe',
            textAlign: 'center'
          }}>
            📋 Schedule for {activeContentSet.replace('contentSet', 'Set ')}
          </h3>
          
          {gameSchedule.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {gameSchedule.map((game, index) => (
                <div key={index} style={{
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Calendar size={20} color="#4facfe" />
                    <span style={{ fontWeight: '600', color: '#333' }}>
                      Shift {game.shiftNumber}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                      padding: '4px 8px', 
                      background: '#4facfe', 
                      color: 'white', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Game
                    </div>
                    <span style={{ color: '#555' }}>{game.game}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MapPin size={16} color="#666" />
                    <span style={{ color: '#666', fontSize: '14px' }}>{game.gamePlace}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666'
            }}>
              <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
              <h4>No games scheduled</h4>
              <p>Check back later for updates to your team's schedule.</p>
            </div>
          )}
        </div>
      )}

      {!scheduleVisible && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#666'
        }}>
          <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
          <h4>Game Schedule Hidden</h4>
          <p>The game schedule is currently not available.</p>
        </div>
      )}
    </div>
  );
};

export default GameSchedule;
