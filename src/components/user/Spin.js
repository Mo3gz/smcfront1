import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';
import styled from 'styled-components';

// Card data
const cardsData = {
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

// Spin types with colors and icons
const spinTypes = [
  { id: 'luck', name: 'Lucky Spin', cost: 50, icon: Shield, color: '#feca57' },
  { id: 'attack', name: 'Attack Spin', cost: 50, icon: Zap, color: '#ff6b6b' },
  { id: 'alliance', name: 'Alliance Spin', cost: 50, icon: Heart, color: '#4ecdc4' },
  { id: 'random', name: 'Random Spin', cost: 25, icon: RotateCcw, color: '#667eea' }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

// Styled components for the wheel
const WheelContainer = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 10px #2d3436, 
              0 0 0 20px #fff, 
              0 0 0 22px #2d3436, 
              0 0 40px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  @media (max-width: 480px) {
    width: 280px;
    height: 280px;
  }
`;

const Wheel = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  transform: rotate(${props => props.rotation || 0}deg);
  will-change: transform;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.1) 100%);
    border-radius: 50%;
    z-index: 5;
    pointer-events: none;
  }
`;

const WheelSegment = styled.div`
  position: absolute;
  width: 50%;
  height: 50%;
  transform-origin: 100% 100%;
  left: 0;
  top: 0;
  background: ${props => props.color};
  transform: rotate(${props => props.rotate}deg) skewY(${props => 90 - props.angle}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  transition: all 0.3s ease;
  cursor: pointer;
  filter: ${props => props.isSelected ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' : 'none'};
  z-index: ${props => props.isSelected ? 5 : 1};
  
  &:hover {
    filter: brightness(1.1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
    z-index: 2;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
    transition: background 0.3s ease;
  }
  
  & > div {
    transform: skewY(${props => props.angle - 90}deg) rotate(${props => props.angle / 2}deg);
    width: 70%;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.7);
    word-break: break-word;
    line-height: 1.2;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 1;
  }
  
  ${props => props.isSelected && `
    & > div {
      transform: skewY(${props.angle - 90}deg) rotate(${props.angle / 2}deg) scale(1.1);
      font-weight: 800;
    }
  `}
`;

const WheelCenter = styled.div`
  position: absolute;
  width: 50px;
  height: 50px;
  background: #fff;
  border: 8px solid #2d3436;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: #2d3436;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  }
`;

const WheelPointer = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #e74c3c;
  z-index: 11;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -30px;
    left: -10px;
    width: 20px;
    height: 20px;
    background: #e74c3c;
    border-radius: 50%;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -15px;
    left: -5px;
    width: 10px;
    height: 10px;
    background: #fff;
    border-radius: 50%;
    opacity: 0.5;
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
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinInProgress, setSpinInProgress] = useState(false);
  const wheelRef = useRef(null);

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

  const spinWheel = async () => {
    if (spinning || spinInProgress) return;
    if (finalCost > 0 && userData.coins < finalCost) {
      toast.error('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setSpinInProgress(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/spin`, {
        spinType,
        promoCode: promoCode || undefined
      }, { withCredentials: true });

      // Get the cards for the current spin type
      let currentCards = [];
      if (spinType === 'random') {
        // For random spin, pick a random type first
        const types = ['luck', 'attack', 'alliance'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        currentCards = cardsData[randomType];
      } else {
        currentCards = cardsData[spinType];
      }

      // Find the index of the result card
      const resultIndex = currentCards.findIndex(card => 
        card.name === response.data.card.name && 
        card.type === response.data.card.type
      );

      if (resultIndex === -1) {
        throw new Error('Invalid card result from server');
      }

      // Calculate the rotation needed to land on the result
      const segments = currentCards.length;
      const segmentAngle = 360 / segments;
      const targetRotation = 3600 + (360 - (resultIndex * segmentAngle)) + (segmentAngle / 2);
      const currentRotation = wheelRotation % 360;
      
      // Add extra rotations for visual effect
      const extraRotations = 5; // Number of full rotations before stopping
      const totalRotation = wheelRotation + (360 * extraRotations) + (360 - currentRotation) + targetRotation;
      
      // Set the rotation with transition
      setWheelRotation(totalRotation);

          // Update user data and show result after animation
      setTimeout(() => {
        // First, show the confetti and update the result
        setShowConfetti(true);
        setResult(response.data.card);
        
        // Update user data
        setUserData(prev => ({
          ...prev,
          coins: response.data.remainingCoins
        }));
        
        // Show congratulations message with a slight delay
        setTimeout(() => {
          toast.success(`🎉 Congratulations! You got ${response.data.card.name}!`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '12px',
              padding: '12px 20px'
            }
          });
        }, 500);
        
        // Clean up
        setPromoCode('');
        setSpinning(false);
        
        // Hide confetti after delay
        setTimeout(() => {
          setShowConfetti(false);
          setSpinInProgress(false);
        }, 5000);
      }, 4000); // Slightly reduce the delay for better UX

    } catch (error) {
      toast.error(error.response?.data?.error || 'Spin failed!');
      setSpinning(false);
    }
  };

  const getSpinIcon = (type) => {
    const spinType = spinTypes.find(s => s.id === type);
    const IconComponent = spinType.icon;
    return <IconComponent size={24} />;
  };

  // Generate wheel segments based on current spin type
  const renderWheelSegments = () => {
    let currentCards = [];
    
    if (spinType === 'random') {
      // For random wheel, show all cards from all types
      currentCards = [
        ...cardsData.luck,
        ...cardsData.attack,
        ...cardsData.alliance
      ];
    } else {
      currentCards = cardsData[spinType];
    }

    const segmentAngle = 360 / currentCards.length;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A373', '#F4A261', '#E9C46A'];

    return currentCards.map((card, index) => {
      const rotate = segmentAngle * index;
      const color = colors[index % colors.length];
      const isSelected = result && 
                        card.name === result.name && 
                        card.type === result.type;
      
      return (
        <WheelSegment 
          key={index}
          color={color}
          rotate={rotate}
          angle={segmentAngle}
          isSelected={isSelected}
          onClick={() => {
            if (!spinning && !spinInProgress) {
              setResult(card);
            }
          }}
        >
          <div>{card.name}</div>
        </WheelSegment>
      );
    });
  };

  return (
    <div>
      <div className="header">
        <h1>🎰 Spin & Win</h1>
        <p>Try your luck to get powerful cards!</p>
      </div>

      {showConfetti && <Confetti />}

      <div className="card">
        {/* Spin Type Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Choose Spin Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {spinTypes.map((spin) => (
              <div
                key={spin.id}
                className={`card-item ${spinType === spin.id ? 'active' : ''}`}
                style={{
                  background: spinType === spin.id ? spin.color : 'rgba(255, 255, 255, 0.9)',
                  color: spinType === spin.id ? 'white' : '#333',
                  cursor: 'pointer',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: spinType === spin.id ? '2px solid' + spin.color : '2px solid transparent'
                }}
                onClick={() => setSpinType(spin.id)}
              >
                <div style={{ marginBottom: '8px' }}>
                  {getSpinIcon(spin.id)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {spin.name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {spin.cost} coins
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600' }}>
            Promo Code (Optional)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code for discount"
              style={{ flex: 1 }}
            />
            <Gift size={20} color="#667eea" style={{ alignSelf: 'center' }} />
          </div>
          {checkingPromo && <div style={{ color: '#888', marginTop: 4 }}>Checking promo code...</div>}
          {promoValid === true && (
            <div style={{ color: 'green', marginTop: 4 }}>Promo code valid! Discount: {discount}%</div>
          )}
          {promoValid === false && (
            <div style={{ color: 'red', marginTop: 4 }}>Invalid or already used promo code.</div>
          )}
        </div>
        {/* Show price after discount */}
        <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: 16 }}>
          Price after discount: {finalCost === 0 ? 'Free!' : `${finalCost} coins`}
        </div>

        {/* Spin Wheel */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>
            {spinType === 'luck' && 'Lucky Spin'}
            {spinType === 'attack' && 'Attack Spin'}
            {spinType === 'alliance' && 'Alliance Spin'}
            {spinType === 'random' && 'Random Spin'}
          </h3>
          
          <WheelContainer>
            <Wheel 
              ref={wheelRef}
              rotation={wheelRotation}
              style={{
                transition: spinInProgress ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
              }}
            >
              {renderWheelSegments()}
              <WheelCenter />
            </Wheel>
            <WheelPointer />
          </WheelContainer>
          
          <button
            className="btn"
            onClick={spinWheel}
            disabled={spinning || (promoCode && promoValid === false)}
            style={{ 
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '200px',
              margin: '20px auto 0',
              background: finalCost === 0 ? '#4ecdc4' : undefined,
              opacity: (spinning || (promoCode && promoValid === false)) ? 0.7 : 1,
              cursor: (spinning || (promoCode && promoValid === false)) ? 'not-allowed' : 'pointer'
            }}
          >
            {spinning ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                Spinning...
              </>
            ) : (
              <>
                <RotateCcw size={20} />
                {finalCost === 0 ? 'Spin for Free!' : 'Spin Now!'}
              </>
            )}
          </button>
          
          <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Cost: {finalCost} coin{finalCost !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{ 
            margin: '30px auto',
            maxWidth: '400px',
            perspective: '1000px',
            animation: 'slideInFromTop 0.5s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
              borderRadius: '16px',
              padding: '25px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transform: 'rotateX(5deg)',
              transformStyle: 'preserve-3d',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: result.type === 'luck' ? '#feca57' : 
                          result.type === 'attack' ? '#ff6b6b' : 
                          result.type === 'alliance' ? '#4ecdc4' : '#667eea'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '8px',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                opacity: 0.05,
                zIndex: 0
              }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <span style={{
                    background: result.type === 'luck' ? 'rgba(254, 202, 87, 0.2)' : 
                              result.type === 'attack' ? 'rgba(255, 107, 107, 0.2)' : 
                              'rgba(78, 205, 196, 0.2)',
                    color: result.type === 'luck' ? '#d4a50f' : 
                          result.type === 'attack' ? '#d63031' : '#0a7e76',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {result.type} Card
                  </span>
                  <div style={{
                    fontSize: '24px',
                    color: '#333',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    🎉
                  </div>
                </div>
                
                <h3 style={{ 
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#2d3436',
                  margin: '15px 0',
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  lineHeight: '1.3'
                }}>
                  {result.name}
                </h3>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  padding: '15px',
                  borderRadius: '12px',
                  margin: '20px 0',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#2d3436',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  position: 'relative'
                }}>
                  {result.effect}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                  <span style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: '#636e72',
                    padding: '6px 15px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Spin again to get more cards!
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              zIndex: -1
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.02)',
              zIndex: -1
            }}></div>
          </div>
        )}

        {/* Spin Info */}
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
          <h4 style={{ color: '#667eea', marginBottom: '12px' }}>Spin Information</h4>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <p><strong>Lucky Spin:</strong> Get random luck cards</p>
            <p><strong>Attack Spin:</strong> Get powerful attack cards</p>
            <p><strong>Alliance Spin:</strong> Get strategic alliance cards</p>
            <p><strong>Random Spin:</strong> Get any type of card (cheaper!)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spin; 