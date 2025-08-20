import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { Calendar, MapPin } from 'lucide-react';

const GameSchedule = () => {
  const [gameSchedule, setGameSchedule] = useState([]);
  const [activeContentSet, setActiveContentSet] = useState('');
  const [loading, setLoading] = useState(true);
  const [scheduleVisible, setScheduleVisible] = useState(true);

  // Fetch game schedule
  const fetchGameSchedule = async () => {
    try {
      const response = await api.get('/api/game-schedule');
      setGameSchedule(response.data.schedule || []);
      setActiveContentSet(response.data.activeContentSet || '');
      setScheduleVisible(response.data.visible !== false);
    } catch (error) {
      console.error('Error fetching game schedule:', error);
      toast.error('Failed to load game schedule');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGameSchedule();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
        <h3>Loading Game Schedule...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>
        📅 Game Schedule
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
            marginBottom: '16px', 
            color: '#4facfe', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <Calendar size={24} />
            Game Schedule
            {activeContentSet && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#666',
                marginLeft: '8px'
              }}>
                ({activeContentSet.replace('contentSet', 'Content Set ')})
              </span>
            )}
          </h3>
          
          {gameSchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No game schedule available at the moment.
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px'
            }}>
              {gameSchedule.map((game, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '16px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '16px',
                    color: '#4facfe'
                  }}>
                    Shift {game.shiftNumber}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: '#333'
                  }}>
                    {game.game}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '14px', 
                    color: '#666' 
                  }}>
                    <MapPin size={16} />
                    {game.gamePlace}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden Schedule Message */}
      {!scheduleVisible && (
        <div style={{ 
          padding: '20px', 
          border: '2px solid #ddd', 
          borderRadius: '12px',
          background: '#f9f9f9',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '8px', color: '#666' }}>
            📅 Game Schedule
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Game schedule is currently hidden by the administrator.
          </p>
        </div>
      )}
    </div>
  );
};

export default GameSchedule;
