import React, { useState, useEffect } from 'react';

interface BulletEffectProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  bulletType?: 'OrangeSpin' | 'YellowSpin' | 'OrangeScale' | 'YellowScale';
  onComplete?: () => void;
  duration?: number; // milliseconds
}

export const BulletEffect: React.FC<BulletEffectProps> = ({
  startX,
  startY,
  endX,
  endY,
  bulletType = 'YellowSpin',
  onComplete,
  duration = 500
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [isVisible, setIsVisible] = useState(true);

  console.log('🚀 BulletEffect mounted:', { startX, startY, endX, endY, bulletType });

  useEffect(() => {
    // Animate bullet movement
    const moveInterval = setInterval(() => {
      setPosition(prev => {
        const progress = (Date.now() % duration) / duration;
        if (progress >= 1) {
          setIsVisible(false);
          onComplete?.();
          return prev;
        }
        
        return {
          x: startX + (endX - startX) * progress,
          y: startY + (endY - startY) * progress
        };
      });
    }, 16); // ~60fps

    // Animate bullet frames
    const frameInterval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 10);
    }, 50); // Fast spinning animation

    // Cleanup after duration
    const timeout = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(moveInterval);
      clearInterval(frameInterval);
      clearTimeout(timeout);
    };
  }, [startX, startY, endX, endY, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Always show a fallback bullet for testing */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: bulletType.includes('Yellow') ? '#FFD700' : '#FF8C00',
          border: '1px solid white',
          boxShadow: '0 0 4px rgba(255,255,255,0.8)',
        }}
      />
      
      <img
        src={`/assets/characters/soldier/objects/Bullet/${bulletType}__${currentFrame.toString().padStart(3, '0')}.png`}
        alt="bullet"
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '20px',
          height: '20px',
          imageRendering: 'pixelated',
          opacity: 0.9
        }}
        onError={(e) => {
          console.log('❌ Bullet image failed to load:', e.currentTarget.src);
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};