import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

export interface AnimationState {
  name: string;
  frames: string[];
  frameRate: number; // frames per second
  loop: boolean;
  onComplete?: () => void;
}

interface AnimatedSpriteProps {
  animations: AnimationState[];
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

export const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.AnimatedSprite | null>(null);
  const texturesRef = useRef<Map<string, PIXI.Texture[]>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load textures for all animations
  useEffect(() => {
    let isMounted = true;

    const loadTextures = async () => {
      const textureMap = new Map<string, PIXI.Texture[]>();

      try {
        for (const animation of animations) {
          const textures: PIXI.Texture[] = [];
          
          for (const framePath of animation.frames) {
            const texture = await PIXI.Assets.load(framePath);
            textures.push(texture);
          }
          
          textureMap.set(animation.name, textures);
        }

        if (isMounted) {
          texturesRef.current = textureMap;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load sprite textures:', error);
      }
    };

    loadTextures();

    return () => {
      isMounted = false;
    };
  }, [animations]);

  // Initialize PIXI application
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let isMounted = true;

    const initializeApp = async () => {
      try {
        const app = new PIXI.Application();
        
        // Initialize the app with the canvas
        await app.init({
          canvas: canvas,
          width: width,
          height: height,
          backgroundColor: 0x000000,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!isMounted) {
          app.destroy(true);
          return;
        }

        appRef.current = app;

        // Create initial animated sprite
        const initialTextures = texturesRef.current.get(currentAnimation) || [];
        if (initialTextures.length > 0) {
          const sprite = new PIXI.AnimatedSprite(initialTextures);
          sprite.anchor.set(0.5);
          sprite.x = width / 2;
          sprite.y = height / 2;
          sprite.scale.set(scale * (flipX ? -1 : 1), scale);
          
          const currentAnimationConfig = animations.find(a => a.name === currentAnimation);
          if (currentAnimationConfig) {
            sprite.animationSpeed = currentAnimationConfig.frameRate / 60; // Convert to PIXI's speed format
            sprite.loop = currentAnimationConfig.loop;
            
            if (currentAnimationConfig.onComplete || onAnimationComplete) {
              sprite.onComplete = () => {
                currentAnimationConfig.onComplete?.();
                onAnimationComplete?.(currentAnimation);
              };
            }
          }

          sprite.play();
          app.stage.addChild(sprite);
          spriteRef.current = sprite;
        }
      } catch (error) {
        console.error('Failed to initialize PIXI application:', error);
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [isLoaded, width, height, scale, currentAnimation, animations, flipX, onAnimationComplete]);

  // Update animation when currentAnimation changes
  useEffect(() => {
    if (!spriteRef.current || !isLoaded) return;

    const sprite = spriteRef.current;
    const newTextures = texturesRef.current.get(currentAnimation);
    
    if (newTextures && newTextures.length > 0) {
      sprite.textures = newTextures;
      sprite.scale.set(scale * (flipX ? -1 : 1), scale);
      
      const animationConfig = animations.find(a => a.name === currentAnimation);
      if (animationConfig) {
        sprite.animationSpeed = animationConfig.frameRate / 60;
        sprite.loop = animationConfig.loop;
        
        if (animationConfig.onComplete || onAnimationComplete) {
          sprite.onComplete = () => {
            animationConfig.onComplete?.();
            onAnimationComplete?.(currentAnimation);
          };
        } else {
          sprite.onComplete = undefined;
        }
      }
      
      sprite.gotoAndPlay(0);
    }
  }, [currentAnimation, animations, scale, flipX, onAnimationComplete, isLoaded]);

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
      }}
    />
  );
};

export default AnimatedSprite;
export type { AnimationState };