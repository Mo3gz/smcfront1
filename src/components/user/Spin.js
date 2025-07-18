import React, { useState } from 'react';
import { RotateCcw, Zap, Heart, Shield, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Confetti from 'react-confetti';

const Spin = ({ socket, userData, setUserData }) => {
  const [spinType, setSpinType] = useState('luck');
  const [promoCode, setPromoCode] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState(null);

  const spinTypes = [
    { id: 'luck', name: 'Lucky Spin', cost: 50, icon: Shield, color: '#feca57' },
    { id: 'attack', name: 'Attack Spin', cost: 50, icon: Zap, color: '#ff6b6b' },
    { id: 'alliance', name: 'Alliance Spin', cost: 50, icon: Heart, color: '#4ecdc4' },
    { id: 'random', name: 'Random Spin', cost: 25, icon: RotateCcw, color: '#667eea' }
  ];

  const handleSpin = async () => {
    if (spinning) return;

    const selectedSpin = spinTypes.find(s => s.id === spinType);
    if (userData.coins < selectedSpin.cost) {
      toast.error('Insufficient coins!');
      return;
    }

    setSpinning(true);
    setResult(null);

    try {
      const response = await axios.post('/api/spin', {
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
        </div>

        {/* Spin Wheel */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="spin-wheel" style={{ 
            transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)',
            transition: spinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}>
            <div className="spin-pointer"></div>
          </div>
          
          <button
            className="btn"
            onClick={handleSpin}
            disabled={spinning}
            style={{ 
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '200px',
              margin: '20px auto 0'
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
                Spin Now!
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
            marginTop: '20px'
          }}>
            <h3 style={{ marginBottom: '12px' }}>🎉 Congratulations!</h3>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {result.name}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {result.effect}
            </div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8, 
              marginTop: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
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