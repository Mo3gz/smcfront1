import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const WheelContainer = styled.div`
  width: 100%;
  max-width: 600px;  /* Increased max width */
  min-height: 400px;  /* Added min height */
  margin: 0 auto;
  position: relative;
  aspect-ratio: 1/1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
`;

const Wheel = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  transform: rotate(${props => props.rotation}deg);
  border: 8px solid #2c3e50;  /* Added border to wheel */
`;

const WheelSegment = styled.div`
  position: absolute;
  width: 50%;
  height: 50%;
  transform-origin: bottom right;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 30px;  /* Increased padding */
  box-sizing: border-box;
  background: ${props => props.color};
  transform: rotate(${props => props.rotation}deg) skewY(${props => props.skew}deg);
  left: 0;
  top: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);  /* Added border between segments */
  
  span {
    transform: skewY(${props => -props.skew}deg) rotate(${props => props.rotation/2}deg);
    display: inline-block;
    width: 100%;
    text-align: center;
    font-size: 16px;  /* Increased font size */
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);  /* Enhanced text shadow */
    padding: 0 25px;  /* Increased padding */
    box-sizing: border-box;
    white-space: nowrap;  /* Prevent text wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
    transform-origin: center center;
    
    /* Better contrast for text */
    background: rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
  }
`;

const Pointer = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #ff4757;
  z-index: 10;
  filter: drop-shadow(0 0 5px rgba(0,0,0,0.3));
  
  &::after {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid #ff4757;
    box-sizing: border-box;
  }
`;

const WheelOfFortune = ({ items, onSpinEnd, spinning }) => {
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);
  
  // Calculate segment angles and colors
  const segments = items.map((item, index) => {
    const segmentAngle = 360 / items.length;
    const rotation = index * segmentAngle;
    const skew = 90 - segmentAngle;
    
    // Generate colors based on index
    const hue = (index * (360 / items.length)) % 360;
    const color = `hsl(${hue}, 70%, 60%)`;
    
    return {
      ...item,
      rotation,
      skew,
      color
    };
  });

  useEffect(() => {
    if (spinning && wheelRef.current) {
      // Add multiple full rotations plus a bit more for the final position
      const newRotation = rotationRef.current + 5 * 360 + (Math.random() * 360);
      rotationRef.current = newRotation % 360;
      
      // Trigger the spin animation
      wheelRef.current.style.transform = `rotate(${-rotationRef.current}deg)`;
      
      // Notify parent when spin is complete
      const timer = setTimeout(() => {
        if (onSpinEnd) {
          const segmentIndex = Math.floor((items.length - (rotationRef.current / (360 / items.length)) % items.length)) % items.length;
          onSpinEnd(items[segmentIndex]);
        }
      }, 4000); // Match this with CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [spinning, items, onSpinEnd]);

  return (
    <WheelContainer>
      <Wheel ref={wheelRef} rotation={-rotationRef.current}>
        {segments.map((segment, index) => (
          <WheelSegment
            key={index}
            rotation={segment.rotation}
            skew={segment.skew}
            color={segment.color}
          >
            <span>{segment.name}</span>
          </WheelSegment>
        ))}
      </Wheel>
      <Pointer />
    </WheelContainer>
  );
};

export default WheelOfFortune;
