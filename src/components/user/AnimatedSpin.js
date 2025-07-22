import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';
import styled from 'styled-components';

// Styled components
const Container = styled.div`max-width: 600px; margin: 2rem auto; padding: 2rem; border-radius: 15px; background: #1e293b;`;
const CardDisplay = styled.div`background: #0f172a; border-radius: 12px; padding: 2rem; margin: 1.5rem 0; min-height: 250px; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; border: 2px solid ${({ color }) => color || '#334155'};`;
const CardName = styled.h3`font-size: 1.75rem; color: #fff; margin: 0; text-align: center; opacity: ${({ show }) => (show ? 1 : 0)}; transform: ${({ show }) => (show ? 'translateY(0)' : 'translateY(10px)')}; transition: all 0.3s ease-out;`;
const CardType = styled.span`display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-top: 1rem; background: ${({ type }) => type === 'luck' ? '#f59e0b' : type === 'attack' ? '#ef4444' : type === 'alliance' ? '#3b82f6' : '#8b5cf6'}; color: white; opacity: ${({ show }) => (show ? 1 : 0)}; transform: ${({ show }) => (show ? 'scale(1)' : 'scale(0.9)')}; transition: all 0.3s ease-out;`;
const CardEffect = styled.p`margin-top: 1rem; color: #94a3b8; text-align: center; font-size: 1rem; line-height: 1.5; opacity: ${({ show }) => (show ? 1 : 0)}; transform: ${({ show }) => (show ? 'translateY(0)' : 'translateY(10px)')}; transition: all 0.3s ease-out;`;
const ProgressBar = styled.div`width: 100%; height: 8px; background: #334155; border-radius: 4px; margin: 1.5rem 0; overflow: hidden;`;
const ProgressFill = styled.div`height: 100%; background: ${({ color }) => color}; width: ${({ progress }) => `${progress}%`}; transition: width 0.1s linear;`;
const ButtonGroup = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;`;
const SpinButton = styled.button`padding: 0.75rem 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; background: ${({ active, color }) => (active ? color : '#334155')}; color: ${({ active }) => (active ? '#fff' : '#94a3b8')};`;
const StartButton = styled.button`width: 100%; padding: 1rem; border: none; border-radius: 8px; background: #3b82f6; color: white; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-top: 1rem;`;

const spinTypes = [
  { id: 'luck', name: 'Luck', cost: 50, color: '#f59e0b' },
  { id: 'attack', name: 'Attack', cost: 50, color: '#ef4444' },
  { id: 'alliance', name: 'Alliance', cost: 50, color: '#3b82f6' },
  { id: 'random', name: 'Random', cost: 25, color: '#8b5cf6' }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

const AnimatedSpin = ({ socket, userData, setUserData }) => {
  const [spinType, setSpinType] = useState('luck');
  const [spinning, setSpinning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalCost, setFinalCost] = useState(spinTypes[0].cost);

  // Update final cost when spinType or discount changes
  useEffect(() => {
    const baseCost = spinTypes.find(s => s.id === spinType)?.cost || 50;
    setFinalCost(Math.max(0, Math.floor(baseCost * (1 - discount / 100))));
  }, [spinType, discount]);

  // Handle spin animation and API call
  const handleSpin = async () => {
    if (spinning) return;
    if (finalCost > 0 && userData?.coins < finalCost) {
      toast.error('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setProgress(0);
    setShowResult(false);
    setShowConfetti(false);

    // Start animation
    const startTime = Date.now();
    const duration = 3000; // 3 seconds
    
    // Animation loop
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      // Change card during animation
      if (newProgress < 100) {
        const randomType = spinTypes[Math.floor(Math.random() * 3)].id;
        const cards = getCardsByType(randomType);
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        setCurrentCard(randomCard);
        requestAnimationFrame(animate);
      } else {
        // Animation complete, make API call
        completeSpin();
      }
    };

    // Start animation
    requestAnimationFrame(animate);
  };

  // Complete the spin with API call
  const completeSpin = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/spin`,
        { spinType, promoCode: promoCode || undefined },
        { withCredentials: true }
      );

      setCurrentCard(response.data.card);
      setShowResult(true);
      setShowConfetti(true);
      
      // Update user data
      if (response.data.remainingCoins !== undefined) {
        setUserData(prev => ({
          ...prev,
          coins: response.data.remainingCoins
        }));
      }
      
      // Reset promo code on successful use
      setPromoCode('');
      setDiscount(0);
      
      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error('Spin error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete spin');
    } finally {
      setSpinning(false);
    }
  };

  // Get cards by type for animation
  const getCardsByType = (type) => {
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
    
    if (type === 'random') {
      const allCards = [...cards.luck, ...cards.attack, ...cards.alliance];
      return allCards;
    }
    
    return cards[type] || [];
  };

  // Handle promo code validation
  const validatePromoCode = async () => {
    if (!promoCode) {
      setDiscount(0);
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/promocode/validate`,
        { code: promoCode },
        { withCredentials: true }
      );
      
      if (response.data.valid) {
        setDiscount(response.data.discount);
        toast.success(`Promo code applied! ${response.data.discount}% off!`);
      } else {
        setDiscount(0);
        toast.error('Invalid promo code');
      }
    } catch (error) {
      console.error('Promo code validation error:', error);
      setDiscount(0);
      toast.error('Failed to validate promo code');
    }
  };

  // Get current color based on spin type
  const getCurrentColor = () => {
    return spinTypes.find(t => t.id === spinType)?.color || '#3b82f6';
  };

  return (
    <Container>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <h2>Card Picker</h2>
      
      <ButtonGroup>
        {spinTypes.map((type) => (
          <SpinButton
            key={type.id}
            active={spinType === type.id}
            color={type.color}
            onClick={() => setSpinType(type.id)}
            disabled={spinning}
          >
            {type.name} ({type.cost} coins)
          </SpinButton>
        ))}
      </ButtonGroup>
      
      <div>
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Promo code"
          disabled={spinning}
        />
        <button onClick={validatePromoCode} disabled={!promoCode || spinning}>
          Apply
        </button>
        {discount > 0 && <span> {discount}% off! Final cost: {finalCost} coins</span>}
      </div>
      
      <CardDisplay color={getCurrentColor()}>
        {currentCard ? (
          <>
            <CardName show={showResult || !spinning}>{currentCard.name}</CardName>
            <CardType type={currentCard.type} show={showResult || !spinning}>
              {currentCard.type.charAt(0).toUpperCase() + currentCard.type.slice(1)}
            </CardType>
            {showResult && (
              <CardEffect show={showResult}>{currentCard.effect}</CardEffect>
            )}
          </>
        ) : (
          <CardName show={true}>Ready to spin!</CardName>
        )}
      </CardDisplay>
      
      <ProgressBar>
        <ProgressFill progress={progress} color={getCurrentColor()} />
      </ProgressBar>
      
      <StartButton 
        onClick={handleSpin} 
        disabled={spinning || (finalCost > 0 && userData?.coins < finalCost)}
        style={{ backgroundColor: getCurrentColor() }}
      >
        {spinning ? 'Spinning...' : `Spin (Cost: ${finalCost} coins)`}
      </StartButton>
      
      {userData?.coins !== undefined && (
        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#94a3b8' }}>
          Your coins: {userData.coins}
        </div>
      )}
    </Container>
  );
};

export default AnimatedSpin;
