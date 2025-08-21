import React, { useState } from 'react';

const ProgramSchedule = () => {
  const [activeDay, setActiveDay] = useState(1);

  const day1Schedule = [
    { time: '6:00 - 8:00', activity: 'القداس', category: 'prayer' },
    { time: '8:00 - 10:00', activity: 'وصول الأرض', category: 'arrival' },
    { time: '10:00 - 10:30', activity: 'تسكين', category: 'settlement' },
    { time: '10:30 - 11:00', activity: 'تعارف', category: 'introduction' },
    { time: '11:00 - 12:00', activity: 'Big Game', category: 'game' },
    { time: '12:00 - 1:00', activity: 'Opening', category: 'ceremony' },
    { time: '1:00 - 3:00', activity: 'Water Games', category: 'game' },
    { time: '3:00 - 5:30', activity: 'غدا وراحة', category: 'break' },
    { time: '5:30 - 5:45', activity: 'صلاة غروب', category: 'prayer' },
    { time: '5:45 - 7:45', activity: 'Games 1', category: 'game' },
    { time: '7:45 - 8:00', activity: 'مزاد', category: 'auction' },
    { time: '8:00 - 9:00', activity: 'Games 2', category: 'game' },
    { time: '9:00 - 11:00', activity: 'سمر', category: 'evening' },
    { time: '11:00 - 12:00', activity: 'حلقة صلاة', category: 'prayer' },
    { time: '12:00 - 2:00', activity: 'عشا/Card Games', category: 'dinner' }
  ];

  const day2Schedule = [
    { time: '8:00 - 9:00', activity: 'صحيان', category: 'wakeup' },
    { time: '9:00 - 9:30', activity: 'فطار', category: 'breakfast' },
    { time: '9:30 - 10:00', activity: 'Fitness', category: 'fitness' },
    { time: '10:00 - 12:00', activity: 'Games 2', category: 'game' },
    { time: '12:00 - 1:00', activity: 'Content', category: 'content' },
    { time: '1:00 - 1:30', activity: 'خلوة', category: 'retreat' },
    { time: '1:30 - 3:00', activity: 'Big Game', category: 'game' },
    { time: '3:00 - 3:30', activity: 'غدا', category: 'lunch' },
    { time: '3:30 - 3:45', activity: 'مزاد', category: 'auction' },
    { time: '3:45 - 5:00', activity: 'Games 3', category: 'game' },
    { time: '5:00 - 6:00', activity: 'Closing', category: 'ceremony' },
    { time: '6:00 - 8:00', activity: 'وصول الكنيسة', category: 'arrival' }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      prayer: '#4CAF50',
      arrival: '#2196F3',
      settlement: '#FF9800',
      introduction: '#9C27B0',
      game: '#FF5722',
      ceremony: '#E91E63',
      break: '#607D8B',
      auction: '#795548',
      evening: '#3F51B5',
      dinner: '#009688',
      wakeup: '#8BC34A',
      breakfast: '#FFC107',
      fitness: '#00BCD4',
      content: '#9E9E9E',
      retreat: '#673AB7',
      lunch: '#FF5722'
    };
    return colors[category] || '#666';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      prayer: '🙏',
      arrival: '🚌',
      settlement: '🏠',
      introduction: '👋',
      game: '🎮',
      ceremony: '🎭',
      break: '☕',
      auction: '💰',
      evening: '🌙',
      dinner: '🍽️',
      wakeup: '⏰',
      breakfast: '🥐',
      fitness: '💪',
      content: '📚',
      retreat: '🧘',
      lunch: '🍕'
    };
    return icons[category] || '📅';
  };

  const currentSchedule = activeDay === 1 ? day1Schedule : day2Schedule;

  return (
    <div className="program-schedule">
      <div className="program-header">
        <h2 style={{ 
          textAlign: 'center', 
          color: '#333', 
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          برنامج اليوم
        </h2>
        
        <div className="day-selector" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px', 
          marginBottom: '30px' 
        }}>
          <button
            onClick={() => setActiveDay(1)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeDay === 1 ? '#4CAF50' : '#f0f0f0',
              color: activeDay === 1 ? 'white' : '#333',
              transition: 'all 0.3s ease'
            }}
          >
            اليوم الأول
          </button>
          <button
            onClick={() => setActiveDay(2)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeDay === 2 ? '#4CAF50' : '#f0f0f0',
              color: activeDay === 2 ? 'white' : '#333',
              transition: 'all 0.3s ease'
            }}
          >
            اليوم الثاني
          </button>
        </div>
      </div>

      <div className="schedule-container" style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {currentSchedule.map((item, index) => (
          <div
            key={index}
            className="schedule-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              marginBottom: '12px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${getCategoryColor(item.category)}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <div className="schedule-icon" style={{
              fontSize: '24px',
              marginRight: '16px',
              width: '40px',
              textAlign: 'center'
            }}>
              {getCategoryIcon(item.category)}
            </div>
            
            <div className="schedule-content" style={{ flex: 1 }}>
              <div className="schedule-time" style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#666',
                marginBottom: '4px'
              }}>
                {item.time}
              </div>
              <div className="schedule-activity" style={{
                fontSize: '18px',
                fontWeight: '500',
                color: '#333',
                lineHeight: '1.4'
              }}>
                {item.activity}
              </div>
            </div>
            
            <div className="schedule-category" style={{
              padding: '6px 12px',
              backgroundColor: getCategoryColor(item.category),
              color: 'white',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {item.category}
            </div>
          </div>
        ))}
      </div>

      <div className="program-footer" style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        color: '#666',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>ملاحظة:</strong> الأوقات قد تتغير حسب الظروف
        </p>
        <p style={{ margin: 0 }}>
          <strong>Note:</strong> Times may vary depending on circumstances
        </p>
      </div>
    </div>
  );
};

export default ProgramSchedule;
