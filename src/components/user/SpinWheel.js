import React, { useEffect, useRef, useCallback } from 'react';
import './SpinWheel.css';

const SpinWheel = ({ spinType, spinning, result }) => {
  const canvasRef = useRef(null);
  const wheelRef = useRef(null);
  
  // Define cards by type
  const cardsByType = {
    luck: [
      { name: "I'mphoteric", type: 'luck', effect: '+400 Coins instantly' },
      { name: "Everything Against Me", type: 'luck', effect: 'Instantly lose 250 Coins' },
      { name: 'El 7aramy', type: 'luck', effect: 'Btsr2 100 coin men ay khema, w law et3raft birg3o el double' }
    ],
    attack: [
      { name: 'Wesh l Wesh', type: 'attack', effect: '1v1 battle' },
      { name: 'Ana el 7aramy', type: 'attack', effect: 'Btakhod 100 coin men ay khema mnghir ay challenge' },
      { name: 'Ana w Bas', type: 'attack', effect: 'Bt3mel risk 3ala haga' }
    ],
    alliance: [
      { name: 'El Nadala', type: 'alliance', effect: 'Bt3mel t7alof w tlghih f ay wa2t w takhod el coins 3ady' },
      { name: 'El Sohab', type: 'alliance', effect: 'Bt3mel t7alof 3ady' },
      { name: 'El Melok', type: 'alliance', effect: 'Btst5dm el khema el taniaa y3melo el challenges makanak' }
    ]
  };

  // Get cards based on spin type
  const getCardsForSpin = useCallback(() => {
    if (spinType === 'random') {
      return [
        ...cardsByType.luck,
        ...cardsByType.attack,
        ...cardsByType.alliance
      ];
    }
    return cardsByType[spinType] || [];
  }, [spinType]);

  // Initialize wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    const wheel = wheelRef.current;
    if (!canvas || !wheel) return;

    const cards = getCardsForSpin();
    if (cards.length === 0) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / cards.length;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    
    cards.forEach((card, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = (index + 1) * segmentAngle - Math.PI / 2;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Draw segment border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      
      // Adjust text position
      const textRadius = radius * 0.7;
      
      // Draw text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, 14 - cards.length)}px Arial`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Split long text into multiple lines
      const maxChars = 10;
      const words = card.name.split(' ');
      let line = '';
      let y = -textRadius / 2;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length <= maxChars) {
          line = testLine;
        } else {
          if (line) {
            ctx.fillText(line, textRadius - 20, y);
            y += 15;
          }
          line = word;
        }
      }
      if (line) {
        ctx.fillText(line, textRadius - 20, y);
      }
      
      ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
  }, [spinType, spinning, getCardsForSpin]);

  return (
    <div className="wheel-container">
      <div 
        ref={wheelRef} 
        className="wheel" 
        style={{ transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)' }}
      >
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={300}
          style={{
            transition: spinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)'
          }}
        />
      </div>
      <div className="wheel-pointer"></div>
    </div>
  );
};

export default SpinWheel;
