import React from 'react';
import { BasicSprite } from './BasicSprite';
import type { PlayerShootStyle } from '../../../types';

interface PlayerSpriteProps {
  x?: number;
  y?: number;
  scale?: number;
  state?: 'idle' | 'walking' | 'running' | 'melee' | 'shooting' | 'hurt' | 'celebrating';
  shootingStyle?: PlayerShootStyle;
  flipX?: boolean;
  onAnimationComplete?: (state: string) => void;
  className?: string;
}

export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  state = 'idle',
  shootingStyle = 'base',
  flipX = false,
  onAnimationComplete,
  className = ''
}) => {
  return (
    <BasicSprite
      type="player"
      state={state}
      x={x}
      y={y}
      width={60}
      height={80}
      scale={scale}
      shootingStyle={shootingStyle}
      flipX={flipX}
      onAnimationComplete={onAnimationComplete}
      className={className}
    />
  );
};
