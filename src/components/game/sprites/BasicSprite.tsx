import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';

import type { ZombieVariant } from '../../../types';

interface BasicSpriteProps {
  type: 'zombie' | 'player';
  state: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  flipX?: boolean;
  variant?: ZombieVariant; // For zombie variants (1-15)
  onAnimationComplete?: (state: string) => void;
  className?: string;
}

export const BasicSprite: React.FC<BasicSpriteProps> = ({
  type,
  state,
  x = 0,
  y = 0,
  width = 64,
  height = 64,
  scale = 1,
  flipX = false,
  variant = 1, // Default to variant 1
  onAnimationComplete,
  className = ''
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get soldier type from settings store (soldier1-soldier4, default to soldier1)
  const soldierType = useSettingsStore(state => state.soldierType || 'soldier1');


  // Frame mappings for different states
  const getFrameInfo = () => {
    if (type === 'zombie') {
      // Use variant-specific paths (all variants are now in variants folder)
      const variantPath = `/assets/characters/zombie/variants/variant_${variant}`;
      
      switch (state) {
        case 'idle':
          // Use Idle sequence for all variants (10 frames)
          // Some variants use idle1_, some use idle2_
          const idlePattern = variant === 6 ? 'idle2' : 'idle1';
          const frames = Array.from({ length: 10 }, (_, i) => 
            `${variantPath}/idle/${idlePattern}_${(i + 1).toString().padStart(2, '0')}.png`
          );
          return {
            frames,
            frameRate: 300, // ms per frame
            loop: true
          };
        case 'walking':
          // Use Walk sequence for all variants (20 frames)
          const walkFrames = Array.from({ length: 20 }, (_, i) => 
            `${variantPath}/walk/walk_${(i + 1).toString().padStart(2, '0')}.png`
          );
          return {
            frames: walkFrames,
            frameRate: 120,
            loop: true
          };
        case 'attacking':
          // Use Attack sequence for all variants (8 frames)
          const attackFrames = Array.from({ length: 8 }, (_, i) => 
            `${variantPath}/attack/attack_${(i + 1).toString().padStart(2, '0')}.png`
          );
          return {
            frames: attackFrames,
            frameRate: 100,
            loop: false
          };
        case 'dying':
          // Use Dead sequence for all variants as death animation (10 frames)
          const dyingFrames = Array.from({ length: 10 }, (_, i) => 
            `${variantPath}/dead/dead_${(i + 1).toString().padStart(2, '0')}.png`
          );
          return {
            frames: dyingFrames,
            frameRate: 120,
            loop: false
          };
        case 'dead':
          // Use last frame of dead animation for all variants
          return {
            frames: [`${variantPath}/dead/dead_10.png`],
            frameRate: 1000,
            loop: false
          };
        default:
          return {
            frames: [`${variantPath}/idle/idle1_01.png`],
            frameRate: 1000,
            loop: false
          };
      }
    } else {
      // Soldier sprites - using selected soldier type
      const basePath = `/assets/characters/soldier/${soldierType}`;
      
      switch (state) {
        case 'idle':
          // Generate frames for idle animation (Idle__000.png to Idle__009.png)
          const idleFrames = Array.from({ length: 10 }, (_, i) => 
            `${basePath}/Idle__${i.toString().padStart(3, '0')}.png`
          );
          return {
            frames: idleFrames,
            frameRate: 100, // Smooth idle animation
            loop: true
          };
        case 'shooting':
          // Use Shoot animation (Shoot__000.png to Shoot__009.png)
          const shootFrames = Array.from({ length: 10 }, (_, i) => 
            `${basePath}/Shoot__${i.toString().padStart(3, '0')}.png`
          );
          return {
            frames: shootFrames,
            frameRate: 50, // Fast shooting animation
            loop: false
          };
        case 'celebrating':
          // Use Happy animation for celebrating (Happy__000.png to Happy__009.png)
          const happyFrames = Array.from({ length: 10 }, (_, i) => 
            `${basePath}/Happy__${i.toString().padStart(3, '0')}.png`
          );
          return {
            frames: happyFrames,
            frameRate: 100,
            loop: false
          };
        case 'hurt':
          // Use Hurt animation (Hurt__000.png to Hurt__009.png)
          const hurtFrames = Array.from({ length: 10 }, (_, i) => 
            `${basePath}/Hurt__${i.toString().padStart(3, '0')}.png`
          );
          return {
            frames: hurtFrames,
            frameRate: 120,
            loop: false
          };
        case 'walking':
          // Use Walk animation (Walk__000.png to Walk__009.png)
          const walkFrames = Array.from({ length: 10 }, (_, i) => 
            `${basePath}/Walk__${i.toString().padStart(3, '0')}.png`
          );
          return {
            frames: walkFrames,
            frameRate: 80,
            loop: true
          };
        default:
          // Default to first idle frame
          return {
            frames: [`${basePath}/Idle__000.png`],
            frameRate: 1000,
            loop: false
          };
      }
    }
  };

  const frameInfo = getFrameInfo();

  useEffect(() => {
    setCurrentFrame(0);
    setImageError(false);
    setIsLoading(true);
    
    // Handle single frame or static animations
    if (frameInfo.frames.length <= 1) {
      return;
    }

    // Handle both looping and non-looping animations
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        
        if (frameInfo.loop) {
          // For looping animations, cycle through frames continuously
          return next % frameInfo.frames.length;
        } else {
          // For non-looping animations, stop at the last frame
          if (next >= frameInfo.frames.length) {
            // Animation completed, trigger callback and stay on last frame
            if (onAnimationComplete) {
              setTimeout(() => onAnimationComplete(state + '-complete'), 0);
            }
            return frameInfo.frames.length - 1; // Stay on last frame
          }
          return next;
        }
      });
    }, frameInfo.frameRate);

    return () => clearInterval(interval);
  }, [state, type, soldierType, variant]); // Include variant and soldierType to re-render when they change

  // Show emoji fallback if image fails to load or explicitly requested
  if (imageError) {
    // Fallback to emoji (disabled)
    const emojiMap = {
      zombie: {
        idle: '🧟‍♂️',
        walking: '🧟‍♂️',
        attacking: '🧟‍♂️',
        dying: '😵',
        dead: '💀'
      },
      player: {
        idle: '🪖',
        shooting: '🔫',
        celebrating: '🎉',
        hurt: '😵',
        walking: '🏃'
      }
    };
    
    const emoji = emojiMap[type][state as keyof typeof emojiMap[typeof type]] || emojiMap[type].idle || '❓';
    
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          fontSize: `${32 * scale}px`,
          transform: flipX ? 'scaleX(-1)' : 'none',
          // backgroundColor: 'rgba(0,0,255,0.1)', // Debug background for emoji - removed for production
          // border: '1px solid rgba(255,0,0,0.3)', // Debug border for emoji - removed for production
        }}
      >
        {emoji}
      </div>
    );
  }

  const currentImageSrc = frameInfo.frames[currentFrame];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={currentImageSrc}
        alt={`${type}-${state}-${currentFrame}`}
        className={className}
        onError={(e) => {
          console.warn(`Failed to load sprite: ${currentImageSrc}`);
          setImageError(true);
        }}
        onLoad={(e) => {
          // Successfully loaded
        }}
        style={{
          position: 'relative',
          display: 'block',
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          transform: flipX ? 'scaleX(-1)' : 'none',
          imageRendering: 'pixelated',
          objectFit: 'contain',
          // backgroundColor: 'rgba(255,0,0,0.1)', // Debug background - removed for production
          // border: '1px solid rgba(0,255,0,0.3)', // Debug border - removed for production
        }}
      />
    </div>
  );
};