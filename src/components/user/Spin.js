import React, { useState, useEffect } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';

// Move these above all hooks and state
const spinTypes = [
  { id: 'lucky', name: '🎡 Lucky Spin', cost: 50, icon: Shield, color: '#feca57' },
  { id: 'gamehelper', name: '🛠 Game Helper', cost: 75, icon: Zap, color: '#ff6b6b' },
  { id: 'challenge', name: '⚔ Challenge', cost: 100, icon: Heart, color: '#4ecdc4' },
  { id: 'hightier', name: '🔥 High Tier', cost: 150, icon: Gift, color: '#ff9ff3' },
  { id: 'lowtier', name: '🥉 Low Tier', cost: 25, icon: RotateCcw, color: '#74b9ff' },
  { id: 'random', name: '🎲 Random', cost: 30, icon: RotateCcw, color: '#667eea' }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

const Spin = ({ socket, userData, setUserData }) => {
  const [spinType, setSpinType] = useState('lucky');
  const [promoCode, setPromoCode] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [promoValid, setPromoValid] = useState(null); // null: not checked, true: valid, false: invalid
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [finalCost, setFinalCost] = useState(spinTypes.find(s => s.id === spinType).cost);
  
  // New states for special functionality
  const [mcqQuestion, setMcqQuestion] = useState(null);
  const [mcqAnswer, setMcqAnswer] = useState(null);
  const [mcqTimer, setMcqTimer] = useState(null);
  const [speedBuyTimer, setSpeedBuyTimer] = useState(null);

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
    setMcqQuestion(null);
    setSpeedBuyTimer(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/spin`, {
        spinType,
        promoCode: promoCode || undefined
      }, { withCredentials: true });

      // Simulate spin animation
      setTimeout(() => {
        const { card, remainingCoins, actionType, additionalData } = response.data;
        
        // Update user coins
        setUserData(prev => ({
          ...prev,
          coins: remainingCoins
        }));

        // Handle different action types
        switch(actionType) {
          case 'instant':
            // Instant coin changes
            const coinChange = card.coinChange || 0;
            toast.success(`${card.name}! ${coinChange > 0 ? '+' : ''}${coinChange} coins instantly!`, {
              duration: 4000,
              position: 'top-center',
              style: {
                background: coinChange > 0 ? '#4CAF50' : '#f44336',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }
            });
            break;

          case 'instant_tax':
            // Border tax
            toast.info(`You paid ${additionalData.taxAmount} coins in border tax for ${additionalData.ownedCountries} countries.`, {
              duration: 4000,
              position: 'top-center'
            });
            break;

          case 'random_gift':
            // Random gift to another team
            toast.success(`You gifted 50 coins to ${additionalData.giftedTeam}!`, {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#4CAF50',
                color: 'white'
              }
            });
            break;

          case 'speed_buy':
            // Speed buy challenge
            setSpeedBuyTimer(additionalData.duration * 60); // Convert to seconds
            toast.success(`Speed Buy Challenge started! You have ${additionalData.duration} minutes to buy a country for +50 reward!`, {
              duration: 6000,
              position: 'top-center',
              style: {
                background: '#ff9500',
                color: 'white'
              }
            });
            break;

          case 'mcq':
            // MCQ challenge
            setMcqQuestion(additionalData.question);
            setMcqTimer(additionalData.timeLimit);
            toast.success('Answer the spiritual question within 10 seconds for +15 coins!', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#667eea',
                color: 'white'
              }
            });
            break;

          case 'admin':
            // Admin action required
            toast.info(`${card.name} - Admin will handle this action.`, {
              duration: 4000,
              position: 'top-center'
            });
            break;

          default:
            // Regular card
            toast.success(`🎉 Congratulations! You got ${card.name}!`, {
              duration: 4000,
              position: 'top-center',
              style: {
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }
            });
        }

        setResult(card);
        setShowConfetti(true);
        setPromoCode('');
        setSpinning(false);
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

  // MCQ handling
  const handleMcqAnswer = async (selectedAnswer) => {
    if (!mcqQuestion) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcq/answer`, {
        questionId: mcqQuestion.id,
        answer: selectedAnswer
      }, { withCredentials: true });

      if (response.data.correct) {
        toast.success(`Correct! You earned ${response.data.reward} coins!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#4CAF50',
            color: 'white'
          }
        });
      } else {
        toast.error(`Wrong answer! The correct answer was option ${response.data.correctAnswer + 1}.`, {
          duration: 4000,
          position: 'top-center'
        });
      }
      
      setMcqQuestion(null);
      setMcqTimer(null);
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  // Timer countdown effects
  useEffect(() => {
    if (mcqTimer > 0) {
      const timer = setTimeout(() => {
        setMcqTimer(mcqTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (mcqTimer === 0) {
      toast.error('Time expired for MCQ!');
      setMcqQuestion(null);
      setMcqTimer(null);
    }
  }, [mcqTimer]);

  useEffect(() => {
    if (speedBuyTimer > 0) {
      const timer = setTimeout(() => {
        setSpeedBuyTimer(speedBuyTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (speedBuyTimer === 0) {
      toast.error('Speed Buy challenge expired!');
      setSpeedBuyTimer(null);
    }
  }, [speedBuyTimer]);

  return (
    <div className="spin-container">
      <div className="header">
        <h1>🎰 Spin & Win</h1>
        <p>Try your luck to get powerful cards!</p>
      </div>

      {showConfetti && <Confetti />}

      <div className="card">
        {/* Spin Type Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Choose Spin Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          
          <button
            className="btn"
            onClick={handleSpin}
            disabled={spinning || (promoCode && promoValid === false)}
            style={{ 
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '200px',
              margin: '20px auto 0',
              background: finalCost === 0 ? '#4ecdc4' : undefined
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

        {/* MCQ Question */}
        {mcqQuestion && (
          <div style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0 }}>🕌 Spiritual Question</h4>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '4px 12px', 
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {mcqTimer}s
              </div>
            </div>
            
            <p style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '500' }}>
              {mcqQuestion.question}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {mcqQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMcqAnswer(index)}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                >
                  {index + 1}. {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Speed Buy Timer */}
        {speedBuyTimer && (
          <div style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #ff9500 0%, #ff5722 100%)', 
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 12px 0' }}>⚡ Speed Buy Challenge</h4>
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              Buy a country within {Math.floor(speedBuyTimer / 60)}:{(speedBuyTimer % 60).toString().padStart(2, '0')} 
              for +50 coins reward!
            </p>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              {Math.floor(speedBuyTimer / 60)}:{(speedBuyTimer % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Spin Info */}
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
          <h4 style={{ color: '#667eea', marginBottom: '12px' }}>Spin Information</h4>
          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            <p><strong>🎡 Lucky Spin:</strong> Instant coins, gifts, and special actions</p>
            <p><strong>🛠 Game Helper:</strong> Strategic cards requiring game/team selection</p>
            <p><strong>⚔ Challenge:</strong> Skill-based challenges with timers</p>
            <p><strong>🔥 High Tier:</strong> Premium rewards and powerful effects</p>
            <p><strong>🥉 Low Tier:</strong> Basic rewards, affordable entry point</p>
            <p><strong>🎲 Random:</strong> Get any type from Lucky, Game Helper, or Challenge</p>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>
          Developed by <strong style={{ color: 'white' }}>Ayman</strong>
        </p>
      </div>
    </div>
  );
};

export default Spin; 