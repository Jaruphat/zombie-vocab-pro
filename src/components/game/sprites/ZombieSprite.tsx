import React, { useState } from 'react';
import { BasicSprite } from './BasicSprite';
import type { ZombieVariant } from '../../../types';

interface ZombieSpriteProps {
  x?: number;
  y?: number;
  scale?: number;
  state?: 'idle' | 'walking' | 'attacking' | 'dying' | 'dead';
  variant?: ZombieVariant; // Zombie visual variant (1-15)
  flipX?: boolean;
  onAnimationComplete?: (state: string) => void;
  className?: string;
}

export const ZombieSprite: React.FC<ZombieSpriteProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  state = 'idle',
  variant = 3, // Default to variant 3 (variants 1,2,11 have missing files)
  flipX = false,
  onAnimationComplete,
  className = ''
}) => {
  const [isDead, setIsDead] = useState(false);

  const handleAnimationComplete = (animationName: string) => {
    if (animationName === 'dying-complete') {
      setIsDead(true);
      onAnimationComplete?.('death-complete');
    } else {
      onAnimationComplete?.(animationName);
    }
  };

  // Use 'dead' state if zombie has died
  const currentState = isDead && state !== 'dying' ? 'dead' : state;

  return (
    <BasicSprite
      type="zombie"
      state={currentState}
      x={x}
      y={y}
      width={80}
      height={80}
      scale={scale}
      variant={variant}
      flipX={flipX}
      onAnimationComplete={handleAnimationComplete}
      className={className}
    />
  );
};