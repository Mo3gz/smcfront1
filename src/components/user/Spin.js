import React, { useState, useEffect } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';

// Card data - moved from AdminDashboard.js
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
  ]
};

// Generate segments for the wheel
const generateWheelSegments = (cards) => {
  const segments = [];
  const segmentAngle = 360 / cards.length;
  
  cards.forEach((card, index) => {
    const angle = index * segmentAngle;
    segments.push({
      ...card,
      startAngle: angle,
      endAngle: angle + segmentAngle,
      color: `hsl(${index * (360 / cards.length)}, 70%, 60%)`
    });
  });
  
  return segments;
};

// Move these above all hooks and state
const spinTypes = [
  { id: 'luck', name: 'Lucky Spin', cost: 50, icon: Shield, color: '#feca57', cards: allCards.luck },
  { id: 'attack', name: 'Attack Spin', cost: 50, icon: Zap, color: '#ff6b6b', cards: allCards.attack },
  { id: 'alliance', name: 'Alliance Spin', cost: 50, icon: Heart, color: '#4ecdc4', cards: allCards.alliance },
  { id: 'random', name: 'Random Spin', cost: 25, icon: RotateCcw, color: '#667eea', cards: [...allCards.luck, ...allCards.attack, ...allCards.alliance] }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

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

  const getSpinIcon = (type) => {
    const spinType = spinTypes.find(s => s.id === type);
    const IconComponent = spinType.icon;
    return <IconComponent size={24} />;
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

        {/* Enhanced Spin Wheel */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          position: 'relative',
          padding: '20px 0'
        }}>
          {/* Wheel Container */}
          <div style={{
            width: '280px',
            height: '280px',
            margin: '0 auto',
            position: 'relative',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '8px solid #2d3748',
            backgroundColor: '#2d3748',
            transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)',
            transition: spinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}>
            {/* Wheel Segments with Card Names */}
            {generateWheelSegments(spinTypes.find(s => s.id === spinType).cards).map((segment, index) => (
              <div 
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: `conic-gradient(
                    from ${segment.startAngle}deg,
                    ${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg
                  )`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.sin((segment.startAngle * Math.PI) / 180) * 50}% ${50 - Math.cos((segment.startAngle * Math.PI) / 180) * 50}%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${segment.startAngle + segment.endAngle / 2}deg)`,
                  transformOrigin: 'center',
                }}
              >
                <div style={{
                  transform: 'rotate(90deg)',
                  width: '100%',
                  textAlign: 'center',
                  paddingLeft: '60px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100px'
                }}>
                  {segment.name}
                </div>
              </div>
            ))}
            
            {/* Pattern Overlay */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 49.5%, rgba(255,255,255,0.3) 49.5%, rgba(255,255,255,0.3) 50.5%, transparent 50.5%)',
              backgroundSize: '20px 20px',
              opacity: 0.3
            }} />
            
            {/* Center Circle */}
            <div style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              background: '#2d3748',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '4px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%'
              }} />
            </div>
            
            {/* Spin Type Indicator */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {spinTypes.find(s => s.id === spinType).name}
            </div>
            
            {/* Spin Cost */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#2d3748',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <span>🎫</span>
              <span>{finalCost === 0 ? 'FREE SPIN!' : `${finalCost} coins`}</span>
            </div>
          </div>
          
          {/* Pointer */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '30px solid #e53e3e',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            zIndex: 10
          }}></div>
          
          {/* Spin Button */}
          <button
            className="btn"
            onClick={handleSpin}
            disabled={spinning || (promoCode && promoValid === false)}
            style={{ 
              marginTop: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '220px',
              padding: '14px 24px',
              margin: '40px auto 0',
              background: finalCost === 0 
                ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
              },
              ':active': {
                transform: 'translateY(0)'
              },
              ':disabled': {
                background: '#cbd5e0',
                cursor: 'not-allowed',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {spinning ? (
              <>
                <div className="spinner" style={{ 
                  width: '20px', 
                  height: '20px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s ease-in-out infinite'
                }}></div>
                <span>Spinning...</span>
              </>
            ) : (
              <>
                <RotateCcw size={20} />
                <span>{finalCost === 0 ? 'SPIN FOR FREE!' : 'SPIN NOW!'}</span>
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            textAlign: 'center',
            marginTop: '20px',
            animation: 'slideInFromTop 0.5s ease-out',
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