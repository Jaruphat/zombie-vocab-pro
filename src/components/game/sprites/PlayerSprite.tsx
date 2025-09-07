import React from 'react';
import { BasicSprite } from './BasicSprite';

interface PlayerSpriteProps {
  x?: number;
  y?: number;
  scale?: number;
  state?: 'idle' | 'walking' | 'shooting' | 'hurt' | 'celebrating';
  flipX?: boolean;
  onAnimationComplete?: (state: string) => void;
  className?: string;
}

export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  state = 'idle',
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
      flipX={flipX}
      onAnimationComplete={onAnimationComplete}
      className={className}
    />
  );
};