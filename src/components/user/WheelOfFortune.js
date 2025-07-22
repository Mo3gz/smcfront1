import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation for the wheel spin
const spin = (startAngle) => keyframes`
  from {
    transform: rotate(${startAngle}deg);
  }
  to {
    transform: rotate(${startAngle + 3600}deg);
  }
`;

const WheelContainer = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  margin: 20px auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Wheel = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  transform: rotate(${props => props.rotation}deg);
  animation: ${props => props.spinning ? spin(props.startRotation) : 'none'} 3s ease-out forwards;
`;

const WheelSection = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 50%, 50% 0, ${props => props.x1}% ${props => props.y1}%, 50% 50%);
  background: ${props => props.color};
  transform-origin: 50% 50%;
  transform: rotate(${props => props.rotation}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 10px;
  text-align: center;
`;

const CardName = styled.span`
  position: absolute;
  width: 100px;
  transform: rotate(${props => -props.rotation}deg);
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 2;
`;

const Pointer = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  z-index: 10;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 20px solid #ff4757;
  }
`;

const ResultDisplay = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
  h3 {
    margin: 0 0 5px 0;
    color: #fff;
  }
  p {
    margin: 0;
    color: #ddd;
  }
`;

const WheelOfFortune = ({ spinType, result, spinning, cards }) => {
  const [rotation, setRotation] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const wheelRef = useRef(null);
  
  // Get the current spin type's cards
  const currentCards = cards[spinType] || [];
  
  // Calculate wheel segments
  const segmentAngle = 360 / currentCards.length;
  
  // Handle spin animation when result changes
  useEffect(() => {
    if (result && currentCards.length > 0) {
      // Find the index of the result card
      const resultIndex = currentCards.findIndex(card => card.name === result.name);
      if (resultIndex !== -1) {
        // Calculate the target rotation to land on the result
        const targetRotation = 360 - (resultIndex * segmentAngle) + 3600; // Add multiple rotations
        setStartRotation(prevRotation => prevRotation % 360);
        setRotation(targetRotation);
      }
    }
  }, [result, currentCards, segmentAngle, rotation]);

  // Generate wheel sections
  const renderWheelSections = () => {
    return currentCards.map((card, index) => {
      const rotate = index * segmentAngle;
      const color = getColorForType(spinType, index);
      
      return (
        <WheelSection 
          key={index}
          rotation={rotate}
          color={color}
          x1={50 + 50 * Math.cos(((rotate + segmentAngle / 2) * Math.PI) / 180)}
          y1={50 + 50 * Math.sin(((rotate + segmentAngle / 2) * Math.PI) / 180)}
        >
          <CardName rotation={rotate + segmentAngle / 2}>
            {card.name}
          </CardName>
        </WheelSection>
      );
    });
  };

  // Get color based on spin type and index
  const getColorForType = (type, index) => {
    const colors = {
      luck: ['#FF9F43', '#FF6B6B', '#FECA57'],
      attack: ['#FF6B6B', '#FF7979', '#FF9F43'],
      alliance: ['#4ECDC4', '#54A0FF', '#5F27CD'],
      random: ['#A55EEA', '#45AAF2', '#26DE81']
    };
    
    const typeColors = colors[type] || colors.random;
    return typeColors[index % typeColors.length];
  };

  return (
    <>
      <WheelContainer>
        <Pointer />
        <Wheel 
          ref={wheelRef}
          rotation={rotation}
          spinning={spinning}
          startRotation={startRotation}
        >
          {renderWheelSections()}
        </Wheel>
      </WheelContainer>
      
      {result && (
        <ResultDisplay>
          <h3>{result.name}</h3>
          <p>{result.effect}</p>
        </ResultDisplay>
      )}
    </>
  );
};

export default WheelOfFortune;
