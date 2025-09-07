import React, { useState, useEffect } from 'react';

interface ShootingEffectsProps {
  isActive: boolean;
  playerX: number;
  playerY: number;
  scale: number;
  onComplete?: () => void;
}

export const ShootingEffects: React.FC<ShootingEffectsProps> = ({ 
  isActive, 
  playerX, 
  playerY, 
  scale,
  onComplete 
}) => {
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Start muzzle flash immediately
      setShowMuzzleFlash(true);
      setScreenShake(true);
      
      // Hide muzzle flash after a brief moment
      const muzzleTimer = setTimeout(() => {
        setShowMuzzleFlash(false);
      }, 100);
      
      // Stop screen shake after animation
      const shakeTimer = setTimeout(() => {
        setScreenShake(false);
        onComplete?.();
      }, 200);
      
      return () => {
        clearTimeout(muzzleTimer);
        clearTimeout(shakeTimer);
      };
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <>
      {/* Muzzle Flash Effect */}
      {showMuzzleFlash && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: `${playerX + 40 * scale}px`, // Position at robot's gun
            top: `${playerY + 20 * scale}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Bright muzzle flash */}
          <div
            className="rounded-full animate-pulse bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 opacity-80"
            style={{
              width: `${30 * scale}px`,
              height: `${30 * scale}px`,
              boxShadow: `0 0 ${20 * scale}px ${10 * scale}px rgba(255, 255, 0, 0.6)`,
              animation: 'flash-burst 0.1s ease-out'
            }}
          />
          
          {/* Spark particles */}
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute bg-yellow-300 rounded-full opacity-80"
              style={{
                width: `${(2 + Math.random() * 3) * scale}px`,
                height: `${(2 + Math.random() * 3) * scale}px`,
                left: `${15 * scale + Math.random() * 10 * scale}px`,
                top: `${15 * scale + Math.random() * 10 * scale}px`,
                transform: `rotate(${Math.random() * 360}deg) translateX(${20 + Math.random() * 30}px)`,
                animation: `spark-${i % 3} 0.15s ease-out forwards`
              }}
            />
          ))}
        </div>
      )}

      {/* Screen Shake Container */}
      {screenShake && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            animation: 'screen-shake 0.2s ease-in-out'
          }}
        >
          {/* Optional: Add brief white flash overlay for impact */}
          <div 
            className="absolute inset-0 bg-white opacity-20 rounded-xl"
            style={{
              animation: 'flash-fade 0.1s ease-out forwards'
            }}
          />
        </div>
      )}

      {/* CSS Keyframes as inline styles */}
      <style jsx>{`
        @keyframes flash-burst {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        @keyframes spark-0 {
          0% { transform: rotate(0deg) translateX(0px) scale(1); opacity: 1; }
          100% { transform: rotate(45deg) translateX(30px) scale(0.3); opacity: 0; }
        }

        @keyframes spark-1 {
          0% { transform: rotate(120deg) translateX(0px) scale(1); opacity: 1; }
          100% { transform: rotate(165deg) translateX(25px) scale(0.2); opacity: 0; }
        }

        @keyframes spark-2 {
          0% { transform: rotate(240deg) translateX(0px) scale(1); opacity: 1; }
          100% { transform: rotate(285deg) translateX(35px) scale(0.4); opacity: 0; }
        }

        @keyframes screen-shake {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          10% { transform: translateX(-2px) translateY(1px); }
          20% { transform: translateX(2px) translateY(-1px); }
          30% { transform: translateX(-1px) translateY(2px); }
          40% { transform: translateX(1px) translateY(-2px); }
          50% { transform: translateX(-2px) translateY(1px); }
          60% { transform: translateX(2px) translateY(1px); }
          70% { transform: translateX(-1px) translateY(-1px); }
          80% { transform: translateX(1px) translateY(2px); }
          90% { transform: translateX(-1px) translateY(-1px); }
        }

        @keyframes flash-fade {
          0% { opacity: 0.3; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
};