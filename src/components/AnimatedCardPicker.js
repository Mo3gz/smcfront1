import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// Card data
const cards = {
  luck: [
    { name: "i`amphoteric", type: 'luck', effect: '+400 Coins instantly' },
    { name: "Everything Against Me", type: 'luck', effect: 'Instantly lose 250 Coins' },
    { name: 'el 7aramy', type: 'luck', effect: 'Btsr2 100 coin men ay khema, w law et3raft birg3o el double' }
  ],
  attack: [
    { name: 'wesh l wesh', type: 'attack', effect: '1v1 battle' },
    { name: 'ana el 7aramy', type: 'attack', effect: 'Btakhod 100 coin men ay khema mnghir ay challenge' },
    { name: 'ana w bas', type: 'attack', effect: 'Bt3mel risk 3ala haga' }
  ],
  alliance: [
    { name: 'el nadala', type: 'alliance', effect: 'Bt3mel t7alof w tlghih f ay wa2t w takhod el coins 3ady' },
    { name: 'el sohab', type: 'alliance', effect: 'Bt3mel t7alof 3ady' },
    { name: 'el melok', type: 'alliance', effect: 'Btst5dm el khema el taniaa y3melo el challenges makanak' }
  ]
};

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const Container = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 15px;
  background: #1e293b;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SpinButton = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ active, color }) => (active ? color : '#334155')};
  color: ${({ active }) => (active ? '#fff' : '#94a3b8')};
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CardDisplay = styled.div`
  background: #0f172a;
  border-radius: 12px;
  padding: 2rem;
  margin: 1.5rem 0;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const CardName = styled.h3`
  font-size: 1.75rem;
  color: #fff;
  margin: 0;
  text-align: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const CardType = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 1rem;
  background: ${({ type }) => 
    type === 'luck' ? '#f59e0b' : 
    type === 'attack' ? '#ef4444' : 
    '#3b82f6'};
  color: white;
`;

const CardEffect = styled.p`
  margin-top: 1rem;
  color: #94a3b8;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  margin: 1.5rem 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ color }) => color};
  width: ${({ progress }) => `${progress}%`};
  transition: width 0.1s linear;
`;

const StartButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #64748b;
    cursor: not-allowed;
    transform: none;
  }
`;

const AnimatedCardPicker = () => {
  const [selectedType, setSelectedType] = useState('luck');
  const [isSpinning, setIsSpinning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Get available spin types
  const spinTypes = [
    { id: 'luck', name: 'Luck', color: '#f59e0b' },
    { id: 'attack', name: 'Attack', color: '#ef4444' },
    { id: 'alliance', name: 'Alliance', color: '#3b82f6' },
    { id: 'random', name: 'Random', color: '#8b5cf6' }
  ];

  // Get random card from a specific type or random type
  const getRandomCard = (type) => {
    let cardType = type;
    let availableCards = [];
    
    if (type === 'random') {
      // Select random type for random spin
      const types = ['luck', 'attack', 'alliance'];
      cardType = types[Math.floor(Math.random() * types.length)];
    }
    
    availableCards = [...cards[cardType]];
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
  };

  // Handle spin animation
  const startSpin = () => {
    setIsSpinning(true);
    setProgress(0);
    setShowResult(false);
    
    // Animation interval (change card every 100ms)
    const interval = setInterval(() => {
      setCurrentCard(getRandomCard(selectedType));
    }, 100);
    
    // Progress bar animation (3 seconds)
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Animation complete
        clearInterval(interval);
        setIsSpinning(false);
        setShowResult(true);
      }
    };
    
    requestAnimationFrame(updateProgress);
  };

  return (
    <Container>
      <Title>Card Picker</Title>
      
      <ButtonGroup>
        {spinTypes.map((type) => (
          <SpinButton
            key={type.id}
            active={selectedType === type.id}
            color={type.color}
            onClick={() => setSelectedType(type.id)}
            disabled={isSpinning}
          >
            {type.name}
          </SpinButton>
        ))}
      </ButtonGroup>
      
      <CardDisplay>
        {currentCard ? (
          <>
            <CardName>{currentCard.name}</CardName>
            <CardType type={currentCard.type}>
              {currentCard.type.charAt(0).toUpperCase() + currentCard.type.slice(1)}
            </CardType>
            {showResult && (
              <CardEffect>{currentCard.effect}</CardEffect>
            )}
          </>
        ) : (
          <CardName>Ready to spin!</CardName>
        )}
      </CardDisplay>
      
      <ProgressBar>
        <ProgressFill 
          progress={progress} 
          color={spinTypes.find(t => t.id === selectedType)?.color || '#3b82f6'} 
        />
      </ProgressBar>
      
      <StartButton 
        onClick={startSpin} 
        disabled={isSpinning}
      >
        {isSpinning ? 'Spinning...' : 'Start Spin'}
      </StartButton>
    </Container>
  );
};

export default AnimatedCardPicker;
