import React, { useState, useEffect } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';
import styled from 'styled-components';
import WheelOfFortune from './WheelOfFortune';

// Move these above all hooks and state
const spinTypes = [
  { id: 'luck', name: 'Lucky Spin', cost: 50, icon: Shield, color: '#feca57' },
  { id: 'attack', name: 'Attack Spin', cost: 50, icon: Zap, color: '#ff6b6b' },
  { id: 'alliance', name: 'Alliance Spin', cost: 50, icon: Heart, color: '#4ecdc4' },
  { id: 'random', name: 'Random Spin', cost: 25, icon: RotateCcw, color: '#667eea' }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

// Define the cards data structure
const allCards = {
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
  ],
  random: []
};

const SpinContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const SpinTypeSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
`;

const SpinTypeButton = styled.button`
  background: ${props => props.active ? props.color : '#2c3e50'};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const PromoCodeInput = styled.div`
  margin: 20px 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  
  input {
    padding: 10px 15px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    width: 200px;
    
    &:focus {
      outline: none;
      border-color: #4a90e2;
    }
  }
`;

const SpinButton = styled.button`
  background: linear-gradient(45deg, #4a00e0, #8e2de2);
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  margin: 20px 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 0, 224, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 0, 224, 0.4);
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Spin = ({ socket, userData, setUserData }) => {
  const [spinType, setSpinType] = useState('luck');
  const [promoCode, setPromoCode] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [promoValid, setPromoValid] = useState(null); // null: not checked, true: valid, false: invalid
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [finalCost, setFinalCost] = useState(spinTypes.find(s => s.id === spinType).cost);

  useEffect(() => {
    // Update final cost when spinType or discount changes
    const baseCost = spinTypes.find(s => s.id === spinType).cost;
    setFinalCost(Math.max(0, Math.floor(baseCost * (1 - discount / 100))));
  }, [spinType, discount]);

  // Validate promo code when it changes
  useEffect(() => {
    if (!promoCode) {
      setDiscount(0);
      setPromoValid(null);
      return;
    }
    setCheckingPromo(true);
    axios.post(`${API_BASE_URL}/api/promocode/validate`, { code: promoCode }, { withCredentials: true })
      .then(res => {
        if (res.data.valid) {
          setDiscount(res.data.discount);
          setPromoValid(true);
        } else {
          setDiscount(0);
          setPromoValid(false);
        }
      })
      .catch(() => {
        setDiscount(0);
        setPromoValid(false);
      })
      .finally(() => setCheckingPromo(false));
  }, [promoCode]);

  // Listen for real-time user updates (coins, score changes)
  useEffect(() => {
    if (socket) {
      socket.on('user-update', (updatedUser) => {
        console.log('User updated via socket in Spin:', updatedUser);
        if (updatedUser.id === userData?.id) {
          setUserData(prev => ({ ...prev, ...updatedUser }));
        }
      });

      return () => {
        socket.off('user-update');
      };
    }
  }, [socket, userData?.id, setUserData]);

  const handleSpin = async () => {
    if (spinning) return;
    if (finalCost > 0 && userData.coins < finalCost) {
      toast.error('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/spin`, {
        spinType,
        promoCode: promoCode || undefined
      }, { withCredentials: true });

      // Simulate spin animation
      setTimeout(() => {
        setResult(response.data.card);
        setShowConfetti(true);
        setUserData(prev => ({
          ...prev,
          coins: response.data.remainingCoins
        }));
        setPromoCode('');
        setSpinning(false);
        
        // Show congratulations message prominently
        toast.success(`🎉 Congratulations! You got ${response.data.card.name}!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        });
        
        setTimeout(() => setShowConfetti(false), 3000);
      }, 3000);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Spin failed!');
      setSpinning(false);
    }
  };

  return (
    <SpinContainer>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      
      <h2>Spin the Wheel</h2>
      
      <SpinTypeSelector>
        {spinTypes.map((type) => (
          <SpinTypeButton
            key={type.id}
            color={type.color}
            active={spinType === type.id}
            onClick={() => setSpinType(type.id)}
            disabled={spinning}
          >
            <type.icon size={20} />
            {type.name} ({type.cost} Coins)
          </SpinTypeButton>
        ))}
      </SpinTypeSelector>
      
      <WheelOfFortune 
        spinType={spinType} 
        result={result} 
        spinning={spinning} 
        cards={allCards} 
      />
      
      <PromoCodeInput>
        <input
          type="text"
          placeholder="Enter promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          disabled={spinning || checkingPromo}
        />
        {checkingPromo && <span>Checking...</span>}
        {promoValid === true && <span style={{ color: '#2ecc71' }}>✓ {discount}% off applied!</span>}
        {promoValid === false && <span style={{ color: '#e74c3c' }}>Invalid promo code</span>}
      </PromoCodeInput>
      
      <SpinButton 
        onClick={handleSpin}
        disabled={spinning || (finalCost > 0 && userData.coins < finalCost)}
      >
        {spinning ? 'Spinning...' : `SPIN (${finalCost} Coins)`}
      </SpinButton>
      
      {finalCost > 0 && userData.coins < finalCost && (
        <p style={{ color: '#e74c3c' }}>You need {finalCost - userData.coins} more coins to spin!</p>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '24px' }}>🎉 Congratulations!</h3>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            {result.name}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '12px' }}>
            {result.effect}
          </div>
          <div style={{ 
            fontSize: '14px', 
            opacity: 0.8, 
            marginTop: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            {result.type} card
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: 'rgba(102, 126, 234, 0.1)', 
        borderRadius: '12px' 
      }}>
        <h4 style={{ color: '#667eea', marginBottom: '12px' }}>Spin Information</h4>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          <p><strong>Lucky Spin:</strong> Get random luck cards</p>
          <p><strong>Attack Spin:</strong> Get powerful attack cards</p>
          <p><strong>Alliance Spin:</strong> Get strategic alliance cards</p>
          <p><strong>Random Spin:</strong> Get any type of card (cheaper!)</p>
        </div>
      </div>
    </SpinContainer>
  );
};

export default Spin;