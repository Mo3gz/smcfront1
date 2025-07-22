import React, { useEffect, useRef, useCallback, useState } from 'react';
import './SpinWheel.css';

// Animation constants
const SPIN_DURATION = 3000; // 3 seconds

const SpinWheel = ({ spinType, spinning, result, showResult, onSpinComplete }) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const startRotation = useRef(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const canvasRef = useRef(null);

  // Get cards based on spin type
  const getCardsForSpin = useCallback(() => {
    // Define cards by type inside useCallback to avoid dependency issues
    const cardsByType = {
      luck: [
        { name: "I'mphoteric", type: 'luck', effect: '+400 Coins instantly' },
        { name: "Everything Against Me", type: 'luck', effect: 'Instantly lose 250 Coins' },
        { name: 'El-7aramy', type: 'luck', effect: 'Btsr2 100 coin men ay khema, w law et3raft birg3o el double' }
      ],
      attack: [
        { name: 'Wesh-le-Wesh', type: 'attack', effect: '1v1 battle' },
        { name: 'Ana-el-7aramy', type: 'attack', effect: 'Btakhod 100 coin men ay khema mnghir ay challenge' },
        { name: 'Ana-w-Bas', type: 'attack', effect: 'Bt3mel risk 3ala haga' }
      ],
      alliance: [
        { name: 'El-Nadala', type: 'alliance', effect: 'Bt3mel t7alof w tlghih f ay wa2t w takhod el coins 3ady' },
        { name: 'El-Sohab', type: 'alliance', effect: 'Bt3mel t7alof 3ady' },
        { name: 'El-Melok', type: 'alliance', effect: 'Btst5dm el khema el taniaa y3melo el challenges makanak' }
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

  // Handle spin animation
  const animateSpin = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / SPIN_DURATION, 1);
    
    // Easing function (easeOutCubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    
    // Calculate current rotation using easing
    const easedProgress = easeOutCubic(progress);
    const rotation = startRotation + ((targetRotation - startRotation) * easedProgress);
    
    // Update the rotation, keeping it within 2π
    setCurrentRotation(rotation % (2 * Math.PI));
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateSpin);
    } else {
      // Animation complete
      setIsSpinning(false);
      if (onSpinComplete) {
        onSpinComplete();
      }
    }
  }, [startRotation, targetRotation, onSpinComplete]);

  // Start spinning when spinning prop changes
  useEffect(() => {
    if (spinning && !isSpinning) {
      console.log('Starting spin animation');
      setIsSpinning(true);
      startTimeRef.current = performance.now();
      
      // Start the animation
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / SPIN_DURATION, 1);
        
        // Easing function (easeOutCubic)
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        // Calculate rotation
        const rotation = startRotation.current + ((targetRotation - startRotation.current) * easedProgress);
        setCurrentRotation(rotation % (2 * Math.PI));
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          console.log('Spin animation complete');
          setIsSpinning(false);
          if (onSpinComplete) {
            onSpinComplete();
          }
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinning, isSpinning, targetRotation, onSpinComplete]);

  // Set up the target rotation when the component mounts or when spin type changes
  useEffect(() => {
    const cards = getCardsForSpin();
    if (cards.length > 0 && result) {
      const cardIndex = cards.findIndex(card => card.name === result.name);
      if (cardIndex !== -1) {
        // Calculate the angle for the target card
        const segmentAngle = (2 * Math.PI) / cards.length;
        const targetCardAngle = (cardIndex * segmentAngle) + (segmentAngle / 2);
        
        // Calculate rotation to position the card at the top (270 degrees)
        const rotationToTop = (2 * Math.PI) - targetCardAngle + (1.5 * Math.PI);
        
        // Add full rotations (5 spins) before stopping at the target
        const fullRotations = 5;
        const totalRotation = (fullRotations * 2 * Math.PI) + rotationToTop;
        
        // Set the start and target rotations
        startRotation.current = currentRotation;
        setTargetRotation(currentRotation + totalRotation);
      }
    }
  }, [result, spinType, getCardsForSpin, currentRotation]);

  // Initialize and draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const size = Math.min(400, window.innerWidth * 0.8);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
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
    <div className="wheel-container" style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
        <canvas 
          ref={canvasRef} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div className="wheel-pointer" style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '30px',
          backgroundColor: '#ff6b6b',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          zIndex: 10
        }}></div>
      </div>
      
      {showResult && result && (
        <div className="result-overlay" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 20,
          maxWidth: '90%',
          width: '300px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>You got:</h3>
          <h2 style={{ margin: '0 0 10px 0', color: '#4a6cf7' }}>{result.name}</h2>
          <p style={{ margin: '0', color: '#666' }}>{result.effect}</p>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
