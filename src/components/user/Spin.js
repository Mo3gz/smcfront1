import React, { useState, useEffect } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';
import SpinWheel from './SpinWheel';

// Move these above all hooks and state
const spinTypes = [
  { id: 'luck', name: 'Lucky Spin', cost: 50, icon: Shield, color: '#feca57' },
  { id: 'attack', name: 'Attack Spin', cost: 50, icon: Zap, color: '#ff6b6b' },
  { id: 'alliance', name: 'Alliance Spin', cost: 50, icon: Heart, color: '#4ecdc4' },
  { id: 'random', name: 'Random Spin', cost: 25, icon: RotateCcw, color: '#667eea' }
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

const Spin = ({ socket, userData, setUserData }) => {
  const [spinType, setSpinType] = useState('luck');
  const [promoCode, setPromoCode] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
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

  // Get auth token from cookies
  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  // Create axios config with auth headers
  const createAuthConfig = () => {
    const token = getAuthToken();
    return {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
  };

  // Validate promo code when it changes
  useEffect(() => {
    if (!promoCode) {
      setDiscount(0);
      setPromoValid(null);
      return;
    }
    setCheckingPromo(true);
    
    axios.post(
      `${API_BASE_URL}/api/promocode/validate`,
      { code: promoCode },
      createAuthConfig()
    )
    .then(res => {
      if (res.data.valid) {
        setDiscount(res.data.discount);
        setPromoValid(true);
      } else {
        setDiscount(0);
        setPromoValid(false);
      }
    })
    .catch((error) => {
      console.error('Promo code validation error:', error);
      setDiscount(0);
      setPromoValid(false);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Optionally redirect to login
      }
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
  }, [socket, userData?.id, setUserData, createAuthConfig]);

  const handleSpin = async () => {
    if (spinning) return;
    if (finalCost > 0 && userData.coins < finalCost) {
      toast.error('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setShowResult(false);
    setSpinComplete(false);
    setResult(null);
    setShowConfetti(false);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/spin`,
        {
          spinType,
          promoCode: promoCode || undefined
        },
        createAuthConfig()
      );

      // Store the result and start the wheel animation
      setResult({
        ...response.data.card,
        remainingCoins: response.data.remainingCoins
      });
      
    } catch (error) {
      console.error('Spin error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to spin. Please try again.';
      toast.error(errorMessage);
      setSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    if (!result) return;
    
    setShowConfetti(true);
    setShowResult(true);
    setSpinComplete(true);
    
    // Update user data with remaining coins from the server
    if (result.remainingCoins !== undefined) {
      setUserData(prev => ({
        ...prev,
        coins: result.remainingCoins
      }));
    }
    
    // Reset promo code after successful spin
    setPromoCode('');
    setDiscount(0);
    setPromoValid(null);
    
    // Show congratulations message
    toast.success(`🎉 Congratulations! You got ${result.name}!`, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    });
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
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

        {/* Spin Wheel */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="wheel-container">
            <SpinWheel 
              spinType={spinType} 
              spinning={spinning} 
              result={result}
              showResult={showResult}
              onSpinComplete={handleSpinComplete}
            />
          </div>
          
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