import React, { useState, useEffect, useRef } from 'react';

interface SimpleAnimationState {
  name: string;
  frames: string[];
  frameRate: number; // milliseconds per frame
  loop: boolean;
  onComplete?: () => void;
}

interface SimpleAnimatedSpriteProps {
  animations: SimpleAnimationState[];
  currentAnimation: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  flipX?: boolean;
  onAnimationComplete?: (animationName: string) => void;
  className?: string;
}

export const SimpleAnimatedSprite: React.FC<SimpleAnimatedSpriteProps> = ({
  animations,
  currentAnimation,
  x = 0,
  y = 0,
  width = 64,
  height = 64,
  scale = 1,
  flipX = false,
  onAnimationComplete,
  className = ''
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number>(0);

  const currentAnimationConfig = animations.find(a => a.name === currentAnimation);
  const currentFrames = currentAnimationConfig?.frames || [];

  useEffect(() => {
    if (!currentAnimationConfig || !isPlaying || currentFrames.length === 0) {
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Reset frame index when animation changes
    setCurrentFrameIndex(0);
    animationStartTimeRef.current = Date.now();

    // Start new animation interval
    intervalRef.current = setInterval(() => {
      setCurrentFrameIndex(prev => {
        const nextFrame = prev + 1;
        
        // Check if animation completed
        if (nextFrame >= currentFrames.length) {
          if (currentAnimationConfig.loop) {
            return 0; // Loop back to first frame
          } else {
            // Animation completed
            setIsPlaying(false);
            currentAnimationConfig.onComplete?.();
            onAnimationComplete?.(currentAnimation);
            return prev; // Stay on last frame
          }
        }
        
        return nextFrame;
      });
    }, 1000 / currentAnimationConfig.frameRate); // Convert FPS to milliseconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentAnimation, currentAnimationConfig, isPlaying, currentFrames.length, onAnimationComplete]);

  // Reset playing state when animation changes
  useEffect(() => {
    setIsPlaying(true);
    setCurrentFrameIndex(0);
  }, [currentAnimation]);

  if (!currentAnimationConfig || currentFrames.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ 
          width: `${width * scale}px`, 
          height: `${height * scale}px`,
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const currentFrame = currentFrames[currentFrameIndex];

  return (
    <img
      src={currentFrame}
      alt={`${currentAnimation}-${currentFrameIndex}`}
      className={className}
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: flipX ? 'scaleX(-1)' : 'none',
        imageRendering: 'pixelated', // Keep pixel art crisp
        objectFit: 'contain',
      }}
      onLoad={() => {
        // Preload next frame
        if (currentFrameIndex + 1 < currentFrames.length) {
          const nextImg = new Image();
          nextImg.src = currentFrames[currentFrameIndex + 1];
        }
      }}
    />
  );
};