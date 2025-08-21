import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RotateCcw, Gift, TrendingDown, Shuffle, Swords, Star, HeartHandshake, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Confetti from 'react-confetti';

// Move these above all hooks and state
const spinTypes = [
  { id: 'lucky', name: 'Lucky Spin', cost: 50, icon: Star, color: '#feca57' }, // clover (using Star as clover)
  { id: 'gamehelper', name: 'Game Helper', cost: 50, icon: HeartHandshake, color: '#ff6b6b' }, // heart-handshake (using Heart as heart-handshake)
  { id: 'challenge', name: 'Challenge', cost: 50, icon: Swords, color: '#4ecdc4' }, // swords/codesandbox
  { id: 'random', name: 'Random', cost: 30, icon: Shuffle, color: '#667eea' }, // shuffle
  { id: 'hightier', name: 'High Tier', cost: 50, icon: Crown, color: '#ff9ff3' }, // trending up (using Crown for high tier)
  { id: 'lowtier', name: 'Low Tier', cost: 50, icon: TrendingDown, color: '#74b9ff' }, // trending low
];

const Spin = ({ socket, userData, setUserData }) => {
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [spinType, setSpinType] = useState('lucky');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoValid, setPromoValid] = useState(null); // null: not checked, true: valid, false: invalid
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [finalCost, setFinalCost] = useState(spinTypes.find(s => s.id === spinType).cost);
  
  // New states for special functionality
  const [mcqQuestion, setMcqQuestion] = useState(null);
  const [mcqTimer, setMcqTimer] = useState(null);
  const [speedBuyTimer, setSpeedBuyTimer] = useState(null);
  
  // Spin limitation states
  const [spinLimitations, setSpinLimitations] = useState({});
  const [spinCounts, setSpinCounts] = useState({ lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 });
  const [cardProgress, setCardProgress] = useState({});

  useEffect(() => {
    // Update final cost when spinType or discount changes
    const baseCost = spinTypes.find(s => s.id === spinType).cost;
    setFinalCost(Math.max(0, Math.floor(baseCost * (1 - discount / 100))));
  }, [spinType, discount]);

  // Validate promo code when it changes with debounce
  useEffect(() => {
    if (!promoCode) {
      setDiscount(0);
      setPromoValid(null);
      return;
    }
    
    // Debounce the API call to prevent excessive requests
    const timeoutId = setTimeout(() => {
      setCheckingPromo(true);
      api.post(`/api/promocode/validate`, { code: promoCode })
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
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
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

      socket.on('spin-counts-reset', (data) => {
        console.log('📡 Spin counts reset socket event received:', data);
        console.log('📡 Current userData ID:', userData?.id);
        console.log('📡 Event user ID:', data.userId);
        console.log('📡 IDs match?', data.userId === userData?.id);
        
        if (data.userId === userData?.id) {
          console.log('🔄 Spin counts reset event received for current user:', data);
          
          // Show simple notification
          toast.success(data.message, {
            duration: 3000,
            position: 'top-center'
          });
          
          // Refresh user data to get updated spin counts
          setUserData(prev => {
            const updatedUserData = {
              ...prev,
              teamSettings: {
                ...prev.teamSettings,
                spinCounts: { lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 }
              }
            };
            console.log('🔄 Updated userData with reset spin counts:', updatedUserData);
            return updatedUserData;
          });
          
          // Also directly update the local spinCounts state
          setSpinCounts({ lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 });
          console.log('🔄 Directly reset local spinCounts state');
        } else {
          console.log('📡 Spin reset event received but not for current user');
        }
      });

      // Listen for team settings updates from admin
      socket.on('user-team-settings-updated', (data) => {
        console.log('📡 Team settings update socket event received:', data);
        console.log('📡 Current userData ID:', userData?.id);
        console.log('📡 Event user ID:', data.userId);
        
        if (data.userId === userData?.id) {
          // Refresh card progress when team settings are updated
          const fetchCardProgress = async () => {
            const progressData = {};
            
            for (const spinType of ['lucky', 'gamehelper', 'challenge', 'hightier', 'lowtier']) {
              try {
                const response = await api.get(`/api/cards/progress/${spinType}`);
                progressData[spinType] = response.data;
              } catch (error) {
                console.error(`Error fetching card progress for ${spinType}:`, error);
              }
            }
            
            setCardProgress(progressData);
          };
          
          fetchCardProgress();
        }
        
        if (data.userId === userData?.id) {
          console.log('🔄 Team settings updated via socket:', data.teamSettings);
          console.log('🔄 New spin counts:', data.teamSettings?.spinCounts);
          
          // Update user data with new team settings
          setUserData(prev => ({
            ...prev,
            teamSettings: data.teamSettings
          }));
          
          // Also update local spin counts if they exist
          if (data.teamSettings?.spinCounts) {
            setSpinCounts(data.teamSettings.spinCounts);
            console.log('🔄 Updated local spinCounts from team settings:', data.teamSettings.spinCounts);
          }
        } else {
          console.log('📡 Team settings update received but not for current user');
        }
      });

             // Listen for spin limitation status updates from backend
       socket.on('spin-limitation-status', (data) => {
         console.log('📡 Spin limitation status received:', data);
         console.log('📡 Current userData ID:', userData?.id);
         console.log('📡 Event user ID:', data.userId);
         
         if (data.userId === userData?.id) {
           console.log('🔄 Spin limitation status for current user:', data);
           console.log('🔄 Enabled spin types:', data.enabledSpinTypes);
           console.log('🔄 Completed spin types:', data.completedSpinTypes);
           console.log('🔄 All completed:', data.allCompleted);
           console.log('🔄 Should reset:', data.shouldReset);
           
           // Update local states with real-time data from backend
           setSpinLimitations(data.spinLimitations);
           setSpinCounts(data.currentSpinCounts);
           
           // Backend automatically handles the reset, no need for manual trigger
           if (data.shouldReset && data.allCompleted) {
             console.log('🎯 Backend indicates all enabled spin types completed! Reset will be handled automatically.');
           }
         }
       });

      // Listen for fifty coins countries visibility updates
      socket.on('fifty-coins-countries-visibility-update', (data) => {
        console.log('Fifty coins countries visibility updated in Spin:', data);
        // This could be used to update any spin-related functionality if needed
      });

      return () => {
        socket.off('user-update');
        socket.off('spin-counts-reset');
        socket.off('user-team-settings-updated');
        socket.off('spin-limitation-status');
        socket.off('fifty-coins-countries-visibility-update');
      };
    }
  }, [socket, userData?.id, setUserData]);

  // Update spin limitations and counts when userData changes
  const userDataRef = useRef(userData);
  userDataRef.current = userData;
  
  useEffect(() => {
    const currentUserData = userDataRef.current;
    console.log('🔄 userData changed:', currentUserData);
    console.log('🔄 userData.teamSettings:', currentUserData?.teamSettings);
    
    if (currentUserData?.teamSettings) {
      const limitations = currentUserData.teamSettings.spinLimitations || {};
      const counts = currentUserData.teamSettings.spinCounts || { lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 };
      
      // Only update if the values are actually different to prevent infinite loops
      setSpinLimitations(prev => {
        const newLimitations = JSON.stringify(limitations);
        const prevLimitations = JSON.stringify(prev);
        if (newLimitations !== prevLimitations) {
          console.log('🔄 Setting spin limitations:', limitations);
          return limitations;
        }
        return prev;
      });
      
      setSpinCounts(prev => {
        const newCounts = JSON.stringify(counts);
        const prevCounts = JSON.stringify(prev);
        if (newCounts !== prevCounts) {
          console.log('🔄 Setting spin counts:', counts);
          return counts;
        }
        return prev;
      });
      
      console.log('🔄 Updated spinCounts state to:', counts);
    } else {
      console.log('⚠️ No teamSettings found in userData, spins will be enabled by default');
      // If no teamSettings exist, don't set any limitations (spins will be enabled by default)
      // Only set default spin counts
      setSpinCounts(prev => {
        const defaultCounts = { lucky: 0, gamehelper: 0, challenge: 0, hightier: 0, lowtier: 0, random: 0 };
        const newCounts = JSON.stringify(defaultCounts);
        const prevCounts = JSON.stringify(prev);
        if (newCounts !== prevCounts) {
          return defaultCounts;
        }
        return prev;
      });
    }
  }, [userData?.teamSettings]); // Only depend on teamSettings, not the entire userData object

  // Memoized function to check if a spin type is disabled
  const isSpinDisabled = useCallback((spinId) => {
    const spinCategory = spinId === 'lucky' ? 'lucky' : 
                        spinId === 'gamehelper' ? 'gamehelper' :
                        spinId === 'challenge' ? 'challenge' :
                        spinId === 'hightier' ? 'hightier' :
                        spinId === 'lowtier' ? 'lowtier' :
                        spinId === 'random' ? 'random' : 'lucky';
    
    const limitation = spinLimitations[spinCategory];
    const currentCount = spinCounts[spinCategory] || 0;
    
    // If no limitation exists, spin is enabled (no restrictions)
    if (!limitation) {
      return false; // No limitation = spin is enabled
    }
    
    // If limitation is disabled, spin is disabled
    if (!limitation.enabled || limitation.limit === 0) {
      return true; // Disabled = spin is disabled
    }
    
    // Check if user has reached the limit for this spin type
    const reachedLimit = currentCount >= limitation.limit;
    return reachedLimit;
  }, [spinLimitations, spinCounts]);

  // Memoized function to get spin status message
  const getSpinStatusMessage = useCallback((spinId) => {
    const spinCategory = spinId === 'lucky' ? 'lucky' : 
                        spinId === 'gamehelper' ? 'gamehelper' :
                        spinId === 'challenge' ? 'challenge' :
                        spinId === 'hightier' ? 'hightier' :
                        spinId === 'lowtier' ? 'lowtier' :
                        spinId === 'random' ? 'random' : 'lucky';
    
    const limitation = spinLimitations[spinCategory];
    
    // If no limitation exists, spin is available (no restrictions)
    if (!limitation) {
      return 'Available'; // No limitation = spin is available
    }
    
    // If limitation is disabled, spin is disabled
    if (!limitation.enabled || limitation.limit === 0) {
      return 'Disabled'; // Disabled = spin is disabled
    }
    
    const current = spinCounts[spinCategory] || 0;
    const limit = limitation.limit;
    
    if (current >= limit) {
      return `Limit reached (${current}/${limit})`;
    }
    
    return `Available (${current}/${limit})`;
  }, [spinLimitations, spinCounts]);

  // Fetch card progress for all spin types
  useEffect(() => {
    const fetchCardProgress = async () => {
      const progressData = {};
      
      for (const spinType of ['lucky', 'gamehelper', 'challenge', 'hightier', 'lowtier']) {
        try {
          const response = await api.get(`/api/cards/progress/${spinType}`);
          progressData[spinType] = response.data;
        } catch (error) {
          console.error(`Error fetching card progress for ${spinType}:`, error);
          // Fallback to local calculation if API fails
          const receivedCards = userData?.teamSettings?.receivedCards || {};
          const receivedCardsForType = receivedCards[spinType] || [];
          const collectedCards = receivedCardsForType.length;
          
          progressData[spinType] = {
            collected: collectedCards,
            total: 0,
            remaining: 0,
            percentage: 0
          };
        }
      }
      
      setCardProgress(progressData);
    };
    
    if (userData?.id) {
      fetchCardProgress();
    }
  }, [userData?.id, userData?.teamSettings?.receivedCards]);

  // Memoized function to get card collection progress
  const getCardCollectionProgress = useCallback((spinId) => {
    // Random spin type has no card collection tracking
    if (spinId === 'random') {
      return {
        collected: 0,
        total: 0,
        remaining: 0,
        percentage: 0
      };
    }
    
    return cardProgress[spinId] || {
      collected: 0,
      total: 0,
      remaining: 0,
      percentage: 0
    };
  }, [cardProgress]);

  const handleSpin = async () => {
    if (spinning) return;
    if (finalCost > 0 && userData.coins < finalCost) {
              toast.error('Insufficient kaizen!');
      return;
    }

    setSpinning(true);
    setSpinResult(null);
    setMcqQuestion(null);
    setSpeedBuyTimer(null);

    try {
      const response = await api.post(`/api/spin`, {
        spinType,
        promoCode: promoCode || undefined
      }, { withCredentials: true });

      // Simulate spin animation
      setTimeout(() => {
                 const { card, remainingCoins, actionType, additionalData } = response.data;
        
        // Always set spinning to false first
        setSpinning(false);
        
        // Update user coins
        setUserData(prev => ({
          ...prev,
          coins: remainingCoins
        }));

        // Always show the result card first
        setSpinResult(card);
        setShowResult(true);
        setPromoCode('');

        // Card collection progress notifications suppressed as requested

        // Handle different action types with appropriate messages
        switch(actionType) {
          case 'instant':
            // Instant coin changes
            const coinChange = card.coinChange || 0;
            toast.success(`${card.name}! ${coinChange > 0 ? '+' : ''}${coinChange} kaizen instantly!`, {
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



          case 'random_gift':
            // Random gift to another team
            toast.success(`You gifted 50 kaizen to ${additionalData.giftedTeam}!`, {
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
            toast.success('Mystery Question Challenge! Answer within 13 seconds (+100 for correct, no penalty for wrong). No card added to inventory.', {
              duration: 6000,
              position: 'top-center',
              style: {
                background: '#667eea',
                color: 'white'
              }
            });
            // Animated scroll to MCQ question after a short delay
            setTimeout(() => {
              const mcqElement = document.querySelector('[data-mcq-question]');
              if (mcqElement) {
                mcqElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }
            }, 500);
            break;

          case 'admin':
            // Admin action required
            toast.success(`🎉 You got ${card.name}! Card added to inventory - Admin will handle this action.`, {
              duration: 4000,
              position: 'top-center',
              style: {
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }
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

        setTimeout(() => setShowResult(false), 3000);

      }, 2000);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Spin failed!');
      setSpinning(false);
    }
  };

  const getSpinIcon = useCallback((type) => {
    const spinType = spinTypes.find(s => s.id === type);
    const IconComponent = spinType.icon;
    return <IconComponent size={24} />;
  }, []);

  // Memoized spin types rendering to prevent unnecessary re-renders
  const memoizedSpinTypes = useMemo(() => {
    return spinTypes.map((spin) => {
      const isDisabled = isSpinDisabled(spin.id);
      const statusMessage = getSpinStatusMessage(spin.id);
      const cardProgress = getCardCollectionProgress(spin.id);
      
      return (
        <div
          key={spin.id}
          className={`card-item ${spinType === spin.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
          style={{
            background: isDisabled ? '#f5f5f5' : (spinType === spin.id ? spin.color : 'rgba(255, 255, 255, 0.9)'),
            color: isDisabled ? '#999' : (spinType === spin.id ? 'white' : '#333'),
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: spinType === spin.id ? '2px solid' + spin.color : '2px solid transparent',
            opacity: isDisabled ? 0.6 : 1,
            position: 'relative'
          }}
          onClick={() => !isDisabled && setSpinType(spin.id)}
        >
          {isDisabled && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#ff4757',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              OFFLINE
            </div>
          )}
          <div style={{ marginBottom: '8px' }}>
            {getSpinIcon(spin.id)}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            {spin.name}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            {spin.cost} kaizen
          </div>
          
          {/* Card Collection Progress */}
          {cardProgress.total > 0 && spin.id !== 'random' && (
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.8,
              color: isDisabled ? '#999' : (spinType === spin.id ? 'white' : '#666'),
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {cardProgress.remaining === 1 ? '🎯' : '📊'} {cardProgress.collected}/{cardProgress.total} cards
              {cardProgress.remaining === 1 && (
                <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}> (Last card!)</span>
              )}
            </div>
          )}
          
          {/* Progress Bar */}
          {cardProgress.total > 0 && spin.id !== 'random' && (
            <div style={{
              width: '100%',
              height: '4px',
              background: isDisabled ? '#ddd' : 'rgba(0,0,0,0.1)',
              borderRadius: '2px',
              marginBottom: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${cardProgress.percentage}%`,
                height: '100%',
                background: isDisabled ? '#999' : (spinType === spin.id ? 'white' : spin.color),
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
          
          {statusMessage && (
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.8,
              color: isDisabled ? '#ff4757' : '#666',
              fontWeight: 'bold'
            }}>
              {statusMessage}
            </div>
          )}
        </div>
      );
    });
     }, [spinType, isSpinDisabled, getSpinStatusMessage, getSpinIcon, getCardCollectionProgress]);

  // MCQ handling
  const handleMcqAnswer = async (selectedAnswer) => {
    if (!mcqQuestion) {
      console.error('❌ MCQ: No question available');
      return;
    }
    
    console.log('🔍 MCQ: Submitting answer:', { questionId: mcqQuestion.id, answer: selectedAnswer });
    
    try {
      const response = await api.post(`/api/mcq/answer`, {
        questionId: mcqQuestion.id,
        answer: selectedAnswer
      }, { withCredentials: true });

      console.log('✅ MCQ: Answer submitted successfully:', response.data);

      if (response.data.correct) {
        toast.success(`🎉 Correct! You earned ${response.data.reward} kaizen!`, {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#4CAF50',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        });
                    } else {
                toast(`❌ Wrong answer! No penalty - the correct answer was option ${response.data.correctAnswer + 1}.`, {
                  duration: 4000,
                  position: 'top-center',
                  style: {
                    background: '#ff9500',
                    color: 'white',
                    fontSize: '14px'
                  }
                });
                            }
        
        // Hide the question from UI
        setMcqQuestion(null);
        setMcqTimer(null);
    } catch (error) {
      console.error('❌ MCQ: Error submitting answer:', error);
      console.error('❌ MCQ: Error response:', error.response?.data);
      console.error('❌ MCQ: Error status:', error.response?.status);
      toast.error(`Failed to submit answer: ${error.response?.data?.error || error.message || 'Unknown error'}`);
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

      {showResult && <Confetti />}

      <div className="card">
        {/* Spin Type Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Choose Spin Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {memoizedSpinTypes}
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
          Price after discount: {finalCost === 0 ? 'Free!' : `${finalCost} kaizen`}
        </div>



        {/* Spin Wheel */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          
          <button
            className="btn"
            onClick={handleSpin}
            disabled={spinning || (promoCode && promoValid === false) || isSpinDisabled(spinType)}
            style={{ 
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '200px',
              margin: '20px auto 0',
              background: isSpinDisabled(spinType) ? '#f5f5f5' : (finalCost === 0 ? '#4ecdc4' : undefined),
              color: isSpinDisabled(spinType) ? '#999' : undefined,
              cursor: isSpinDisabled(spinType) ? 'not-allowed' : 'pointer',
              opacity: isSpinDisabled(spinType) ? 0.6 : 1
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
                {isSpinDisabled(spinType) ? 'Spin Disabled' : (finalCost === 0 ? 'Spin for Free!' : 'Spin Now!')}
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {spinResult && (
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
              {spinResult.name}
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '12px' }}>
              {spinResult.effect}
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
              {spinResult.type} card
            </div>
          </div>
        )}

        {/* MCQ Question */}
        {mcqQuestion && (
          <div 
            data-mcq-question
            style={{ 
              marginTop: '24px', 
              padding: '20px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              borderRadius: '12px',
              color: 'white'
            }}
          >
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
              for +50 kaizen reward!
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
            <p><strong>Lucky Spin:</strong> Instant kaizen, gifts, and special actions</p>
            <p><strong>Game Helper:</strong> Strategic cards requiring game/team selection</p>
            <p><strong>Challenge:</strong> Skill-based challenges with timers</p>
            <p><strong>Random:</strong> Get any type from Lucky, Game Helper, or Challenge</p>
            <p><strong>High Tier:</strong> Premium rewards and powerful effects</p>
            <p><strong>Low Tier:</strong> Basic rewards, affordable entry point</p>
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