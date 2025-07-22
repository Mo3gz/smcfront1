import React, { useEffect, useRef, useCallback, useState } from 'react';
import './SpinWheel.css';

// Number of full rotations before stopping
const SPIN_DURATION = 5000; // 5 seconds
const SPIN_ROTATIONS = 5; // Number of full rotations

const SpinWheel = ({ spinType, spinning, result, showResult, onSpinComplete }) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const canvasRef = useRef(null);
  const wheelRef = useRef(null);

  // Get cards based on spin type
  const getCardsForSpin = useCallback(() => {
    // Define cards by type inside useCallback to avoid dependency issues
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
    
    if (spinType === 'random') {
      return [
        ...cardsByType.luck,
        ...cardsByType.attack,
        ...cardsByType.alliance
      ];
    }
    return cardsByType[spinType] || [];
  }, [spinType]);

  // Calculate the angle for a specific card
  const getCardAngle = useCallback((cards, cardName) => {
    const cardsList = getCardsForSpin();
    const index = cardsList.findIndex(card => card.name === cardName);
    if (index === -1) return 0;
    
    const segmentAngle = (2 * Math.PI) / cardsList.length;
    // Return the middle angle of the segment (in radians)
    return (index * segmentAngle) + (segmentAngle / 2);
  }, [getCardsForSpin]);

  // Handle spin animation
  const animateSpin = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / SPIN_DURATION, 1);
    
    // Easing function (easeOutCubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(progress);
    
    // Calculate rotation (multiple full rotations + target rotation)
    const rotation = (SPIN_ROTATIONS * 2 * Math.PI * (1 - easedProgress)) + 
                    (targetRotation * easedProgress);
    
    setCurrentRotation(rotation);
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateSpin);
    } else {
      // Animation complete
      setIsSpinning(false);
      if (onSpinComplete) {
        onSpinComplete();
      }
    }
  }, [targetRotation, onSpinComplete]);

  // Start spinning when spinning prop changes
  useEffect(() => {
    if (spinning && !isSpinning) {
      setIsSpinning(true);
      startTimeRef.current = 0;
      
      // Calculate target rotation based on result
      if (result) {
        const cards = getCardsForSpin();
        const cardIndex = cards.findIndex(card => card.name === result.name);
        if (cardIndex !== -1) {
          // Calculate the angle that would make the result card land at the top
          const segmentAngle = (2 * Math.PI) / cards.length;
          // We want the card to land at the top (270 degrees or 1.5π radians)
          // So we calculate how much to rotate to make that happen
          const targetCardAngle = (cardIndex * segmentAngle) + (segmentAngle / 2);
          // The wheel needs to rotate to position the target card at the top
          // We add 1.5π to position it at the top (270 degrees)
          const rotationToTop = (2 * Math.PI) - targetCardAngle + (1.5 * Math.PI);
          // Add full rotations to make the spin look natural
          setTargetRotation(rotationToTop);
        }
      }
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animateSpin);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinning, result, isSpinning, animateSpin, getCardsForSpin]);

  // Initialize and draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current transformation
    ctx.save();
    
    // Apply rotation for spinning animation
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);
    ctx.translate(-centerX, -centerY);
    
    // Get cards for current spin type
    const cards = getCardsForSpin();
    if (cards.length === 0) return;
    
    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / cards.length;
    
    cards.forEach((card, index) => {
      // Draw segment
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = (index + 1) * segmentAngle - Math.PI / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Set segment color based on card type
      const colors = {
        luck: '#feca57',
        attack: '#ff6b6b',
        alliance: '#4ecdc4'
      };
      
      ctx.fillStyle = colors[card.type] || '#667eea';
      ctx.fill();
      
      // Add text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      
      // Calculate text size to fit in segment
      const maxWidth = radius * 0.8;
      const fontSize = Math.min(16, maxWidth / Math.max(...card.name.split(' ').map(word => word.length)) * 2);
      ctx.font = `bold ${fontSize}px Arial`;
      
      // Draw text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Split text into words and position them vertically
      const words = card.name.split(' ');
      const lineHeight = fontSize * 1.2;
      const totalHeight = words.length * lineHeight - (lineHeight - fontSize);
      let y = -totalHeight / 2;
      
      words.forEach(word => {
        ctx.fillText(word, radius * 0.3, y);
        y += lineHeight;
      });
      
      ctx.restore();
    });
    
    // Restore the transformation before drawing the center circle
    ctx.restore();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
  }, [spinType, getCardsForSpin, currentRotation]);

  return (
    <div className="wheel-container">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className={`wheel ${isSpinning ? 'spinning' : ''}`}
      />
      <div className="wheel-pointer" />
      {result && (
        <div className={`result-overlay ${showResult ? 'show' : ''}`}>
          <div className="result-popup">
            <h3>You got:</h3>
            <h2>{result.name}</h2>
            <p>{result.effect}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
