import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';

interface PixiGameProps {
  scene: 'menu' | 'game';
  onSceneChange?: (scene: 'menu' | 'game') => void;
}

const PixiGame: React.FC<PixiGameProps> = ({ scene, onSceneChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize PixiJS Application
    const app = new PIXI.Application();
    
    app.init({
      canvas: canvasRef.current,
      width: 800,
      height: 500,
      backgroundColor: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    }).then(() => {
      appRef.current = app;
      setIsInitialized(true);
      
      // Make canvas responsive
      const resize = () => {
        if (!canvasRef.current) return;
        const parent = canvasRef.current.parentElement;
        if (!parent) return;
        
        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;
        
        const scale = Math.min(
          parentWidth / 800,
          parentHeight / 500
        );
        
        canvasRef.current.style.width = `${800 * scale}px`;
        canvasRef.current.style.height = `${500 * scale}px`;
      };
      
      resize();
      window.addEventListener('resize', resize);
      
      // Initialize first scene
      updateScene(scene);
    });

    return () => {
      window.removeEventListener('resize', () => {});
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current && isInitialized) {
      updateScene(scene);
    }
  }, [scene, isInitialized]);

  const updateScene = (currentScene: 'menu' | 'game') => {
    if (!appRef.current) return;

    // Clear current scene
    appRef.current.stage.removeChildren();

    if (currentScene === 'menu') {
      createMenuScene();
    } else {
      createGameScene();
    }
  };

  const createMenuScene = () => {
    if (!appRef.current) return;

    // Background gradient
    const background = new PIXI.Graphics();
    background.rect(0, 0, 800, 500);
    background.fill({ color: 0x667eea });
    background.rect(0, 250, 800, 250);
    background.fill({ color: 0x764ba2 });
    appRef.current.stage.addChild(background);

    // Title
    const titleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#2D3748', width: 3 },
      dropShadow: {
        color: '#000000',
        blur: 4,
        angle: Math.PI / 4,
        distance: 6,
      },
    });

    const title = new PIXI.Text({
      text: 'ZOMBIE VOCAB ARENA',
      style: titleStyle,
    });
    title.anchor.set(0.5);
    title.position.set(400, 120);
    appRef.current.stage.addChild(title);

    // Subtitle
    const subtitleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fill: '#FDE047',
    });

    const subtitle = new PIXI.Text({
      text: 'Click Start to begin your vocabulary adventure!',
      style: subtitleStyle,
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(400, 170);
    appRef.current.stage.addChild(subtitle);

    // Start Button
    const buttonBg = new PIXI.Graphics();
    buttonBg.roundRect(0, 0, 200, 60, 15);
    buttonBg.fill({ color: 0xFF6B35 });
    buttonBg.position.set(300, 220);
    buttonBg.eventMode = 'static';
    buttonBg.cursor = 'pointer';

    // Button hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.tint = 0xF7931E;
      buttonBg.scale.set(1.05);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.tint = 0xFFFFFF;
      buttonBg.scale.set(1.0);
    });

    buttonBg.on('pointertap', () => {
      onSceneChange?.('game');
    });

    // Button text
    const buttonTextStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#ffffff',
    });

    const buttonText = new PIXI.Text({
      text: 'Start Game',
      style: buttonTextStyle,
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(100, 30);
    buttonBg.addChild(buttonText);

    appRef.current.stage.addChild(buttonBg);

    // Animated characters
    const player = createCharacter(150, 320, 0xFF6B35);
    player.label = 'player';
    appRef.current.stage.addChild(player);
    
    const zombie = createZombie(650, 320, 0x90EE90);
    zombie.label = 'zombie';
    appRef.current.stage.addChild(zombie);

    // Add floating animation
    let time = 0;
    const animate = () => {
      if (!appRef.current) return;
      
      time += 0.02;
      
      // Find and animate characters
      const chars = appRef.current.stage.children.filter(child => 
        child.label === 'player' || child.label === 'zombie'
      );
      
      chars.forEach((char, index) => {
        if (char.label === 'player') {
          char.y = 320 + Math.sin(time) * 8;
        } else if (char.label === 'zombie') {
          char.y = 320 + Math.sin(time + Math.PI) * 8;
        }
      });
    };

    appRef.current.ticker.add(animate);
  };

  const createGameScene = () => {
    if (!appRef.current) return;

    // Clear any existing tickers
    appRef.current.ticker.destroy();

    // Create new background
    createGameBackground();
    
    // Create player
    const player = createCharacter(120, 350, 0xFF6B35);
    player.label = 'player';
    appRef.current.stage.addChild(player);

    // Create zombies
    const zombies = [];
    for (let i = 0; i < 3; i++) {
      const zombie = createZombie(600 + i * 100, 350, 0x90EE90);
      zombie.label = `zombie_${i}`;
      zombies.push(zombie);
      appRef.current.stage.addChild(zombie);
    }

    // Battle text
    const battleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#000000', width: 2 },
    });

    const battleText = new PIXI.Text({
      text: 'BATTLE IN PROGRESS!',
      style: battleStyle,
    });
    battleText.anchor.set(0.5);
    battleText.position.set(400, 80);
    appRef.current.stage.addChild(battleText);

    // Back button
    const backButton = new PIXI.Graphics();
    backButton.roundRect(0, 0, 150, 40, 10);
    backButton.fill({ color: 0x666666 });
    backButton.position.set(20, 20);
    backButton.eventMode = 'static';
    backButton.cursor = 'pointer';

    backButton.on('pointertap', () => {
      onSceneChange?.('menu');
    });

    const backTextStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: '#ffffff',
    });

    const backText = new PIXI.Text({
      text: '← Back to Menu',
      style: backTextStyle,
    });
    backText.anchor.set(0.5);
    backText.position.set(75, 20);
    backButton.addChild(backText);

    appRef.current.stage.addChild(backButton);

    // Add click-to-shoot functionality
    appRef.current.stage.eventMode = 'static';
    appRef.current.stage.on('pointertap', (event) => {
      const clickPos = event.data.global;
      createShootingEffect(120, 350, clickPos.x, clickPos.y);
      
      // Check if any zombie was hit
      zombies.forEach((zombie) => {
        const distance = Math.sqrt(
          Math.pow(clickPos.x - zombie.x, 2) + Math.pow(clickPos.y - zombie.y, 2)
        );
        if (distance < 50) {
          createHitEffect(zombie.x, zombie.y);
          // Add hit animation
          zombie.tint = 0xFF0000; // Red flash
          setTimeout(() => {
            zombie.tint = 0xFFFFFF;
          }, 100);
        }
      });
    });

    // Game animation loop with enhanced zombie animations
    let gameTime = 0;
    const gameAnimate = () => {
      if (!appRef.current) return;
      
      gameTime += 0.02;
      
      // Animate zombies with realistic walking
      zombies.forEach((zombie, index) => {
        const walkCycle = gameTime + index * 0.5;
        
        // Horizontal bobbing
        const walkOffset = Math.sin(walkCycle * 2) * 3;
        
        // Vertical bobbing (up and down movement while walking)
        const verticalBob = Math.abs(Math.sin(walkCycle * 4)) * 2;
        zombie.y = 350 - verticalBob;
        
        // Arm swinging animation
        const armSwing = Math.sin(walkCycle * 3) * 0.3;
        zombie.rotation = armSwing * 0.1; // Slight body lean
        
        // Move towards player
        zombie.x -= 0.4;
        zombie.x += walkOffset;
        
        // Add stumbling effect
        if (Math.random() < 0.002) { // 0.2% chance per frame
          zombie.x += (Math.random() - 0.5) * 4;
        }
        
        // Reset position when too close
        if (zombie.x < 180) {
          zombie.x = 850 + index * 120 + Math.random() * 50;
          zombie.rotation = 0;
        }
        
        // Eye glow pulsing effect
        const eyeGlowIntensity = 0.3 + Math.sin(gameTime * 5) * 0.1;
        // Note: In a real implementation, you'd store references to the glow objects
        // and update their alpha values here
      });
      
      // Player idle animation
      const playerChar = appRef.current.stage.children.find(child => child.label === 'player');
      if (playerChar) {
        playerChar.y = 350 + Math.sin(gameTime * 1.5) * 1.5; // Subtle breathing
      }

      // Parallax scrolling effect
      const clouds = appRef.current.stage.children.filter(child => 
        child.label && child.label.startsWith('cloud')
      );
      clouds.forEach((cloud, index) => {
        cloud.x -= 0.1 + index * 0.05; // Different speeds for each cloud
        if (cloud.x < -100) {
          cloud.x = 900; // Reset position
        }
      });

      // Trees gentle swaying
      const trees = appRef.current.stage.children.filter(child => 
        child.label && child.label.startsWith('tree')
      );
      trees.forEach((tree, index) => {
        const sway = Math.sin(gameTime * 0.5 + index) * 0.02;
        tree.rotation = sway;
      });

      // Mountain parallax (very slow)
      const mountains = appRef.current.stage.children.find(child => child.label === 'mountains');
      if (mountains) {
        mountains.x -= 0.02;
        if (mountains.x < -50) mountains.x = 0;
      }

      // Hills parallax (medium speed)
      const hills = appRef.current.stage.children.find(child => child.label === 'hills');
      if (hills) {
        hills.x -= 0.05;
        if (hills.x < -50) hills.x = 0;
      }
    };

    appRef.current.ticker.add(gameAnimate);
  };

  const createGameBackground = () => {
    if (!appRef.current) return;

    // Sky with atmospheric colors
    const sky = new PIXI.Graphics();
    sky.rect(0, 0, 800, 180);
    sky.fill({ color: 0xFF6B47 }); // Sunset orange
    
    sky.rect(0, 60, 800, 60);
    sky.fill({ color: 0x87CEEB }); // Light blue
    
    sky.rect(0, 120, 800, 60);
    sky.fill({ color: 0x98D8E8 }); // Sky blue
    appRef.current.stage.addChild(sky);

    // Mountains (parallax layer 1 - farthest)
    const mountains = new PIXI.Graphics();
    mountains.moveTo(0, 160);
    mountains.lineTo(200, 120);
    mountains.lineTo(400, 140);
    mountains.lineTo(600, 110);
    mountains.lineTo(800, 130);
    mountains.lineTo(800, 180);
    mountains.lineTo(0, 180);
    mountains.closePath();
    mountains.fill({ color: 0x696969 });
    mountains.label = 'mountains';
    appRef.current.stage.addChild(mountains);

    // Hills (parallax layer 2 - middle)
    const hills = new PIXI.Graphics();
    hills.moveTo(0, 150);
    hills.lineTo(150, 130);
    hills.lineTo(350, 145);
    hills.lineTo(550, 125);
    hills.lineTo(750, 140);
    hills.lineTo(800, 145);
    hills.lineTo(800, 180);
    hills.lineTo(0, 180);
    hills.closePath();
    hills.fill({ color: 0x8FBC8F });
    hills.label = 'hills';
    appRef.current.stage.addChild(hills);

    // Ground with texture
    const ground = new PIXI.Graphics();
    ground.rect(0, 180, 800, 120);
    ground.fill({ color: 0x228B22 });
    
    // Ground details
    ground.rect(0, 280, 800, 20);
    ground.fill({ color: 0x006400 });
    appRef.current.stage.addChild(ground);

    // Trees (parallax layer 3 - closest background)
    const createTree = (x: number, y: number, scale: number = 1) => {
      const tree = new PIXI.Container();
      tree.position.set(x, y);
      tree.scale.set(scale);
      
      // Trunk
      const trunk = new PIXI.Graphics();
      trunk.rect(-4, 0, 8, 40);
      trunk.fill({ color: 0x8B4513 });
      
      // Canopy
      const canopy = new PIXI.Graphics();
      canopy.circle(0, -10, 25);
      canopy.fill({ color: 0x228B22 });
      
      // Canopy shadow
      const canopyShadow = new PIXI.Graphics();
      canopyShadow.circle(5, -5, 20);
      canopyShadow.fill({ color: 0x1F5F1F });
      
      tree.addChild(trunk, canopyShadow, canopy);
      return tree;
    };

    // Add multiple trees at different positions
    const tree1 = createTree(100, 140, 0.8);
    tree1.label = 'tree1';
    const tree2 = createTree(300, 135, 1.0);
    tree2.label = 'tree2';
    const tree3 = createTree(700, 145, 0.9);
    tree3.label = 'tree3';
    
    appRef.current.stage.addChild(tree1, tree2, tree3);

    // Clouds (animated)
    const createCloud = (x: number, y: number, scale: number = 1) => {
      const cloud = new PIXI.Container();
      cloud.position.set(x, y);
      cloud.scale.set(scale);
      
      const cloudShape = new PIXI.Graphics();
      cloudShape.circle(0, 0, 20);
      cloudShape.fill({ color: 0xFFFFFF, alpha: 0.8 });
      cloudShape.circle(-15, 5, 15);
      cloudShape.fill({ color: 0xFFFFFF, alpha: 0.8 });
      cloudShape.circle(15, 5, 15);
      cloudShape.fill({ color: 0xFFFFFF, alpha: 0.8 });
      
      cloud.addChild(cloudShape);
      return cloud;
    };

    const cloud1 = createCloud(150, 50, 1.0);
    cloud1.label = 'cloud1';
    const cloud2 = createCloud(500, 40, 0.8);
    cloud2.label = 'cloud2';
    const cloud3 = createCloud(700, 60, 0.6);
    cloud3.label = 'cloud3';
    
    appRef.current.stage.addChild(cloud1, cloud2, cloud3);

    // Sun with glow effect
    const sunGlow = new PIXI.Graphics();
    sunGlow.circle(650, 70, 40);
    sunGlow.fill({ color: 0xFFD700, alpha: 0.3 });
    
    const sun = new PIXI.Graphics();
    sun.circle(650, 70, 25);
    sun.fill({ color: 0xFFD700 });
    
    appRef.current.stage.addChild(sunGlow, sun);
  };

  // Particle effect functions
  const createShootingEffect = (startX: number, startY: number, endX: number, endY: number) => {
    if (!appRef.current) return;

    // Muzzle flash
    const muzzleFlash = new PIXI.Graphics();
    muzzleFlash.circle(0, 0, 8);
    muzzleFlash.fill({ color: 0xFFD700 });
    muzzleFlash.position.set(startX + 40, startY + 15);
    appRef.current.stage.addChild(muzzleFlash);

    // Sparks
    for (let i = 0; i < 8; i++) {
      const spark = new PIXI.Graphics();
      spark.circle(0, 0, 2);
      spark.fill({ color: 0xFFA500 });
      
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 10 + Math.random() * 15;
      spark.position.set(
        startX + 40 + Math.cos(angle) * distance,
        startY + 15 + Math.sin(angle) * distance
      );
      
      appRef.current.stage.addChild(spark);
      
      // Animate spark
      const sparkSpeed = Math.random() * 3 + 2;
      const sparkLife = 30; // frames
      let sparkFrame = 0;
      
      const animateSpark = () => {
        sparkFrame++;
        spark.x += Math.cos(angle) * sparkSpeed;
        spark.y += Math.sin(angle) * sparkSpeed + 0.1; // gravity
        spark.alpha = 1 - (sparkFrame / sparkLife);
        
        if (sparkFrame >= sparkLife) {
          appRef.current?.stage.removeChild(spark);
        } else {
          requestAnimationFrame(animateSpark);
        }
      };
      requestAnimationFrame(animateSpark);
    }

    // Bullet trail
    const bulletTrail = new PIXI.Graphics();
    bulletTrail.moveTo(startX + 40, startY + 15);
    bulletTrail.lineTo(endX, endY);
    bulletTrail.stroke({ color: 0xFFFF00, width: 3, alpha: 0.8 });
    appRef.current.stage.addChild(bulletTrail);

    // Remove effects after animation
    setTimeout(() => {
      if (appRef.current) {
        appRef.current.stage.removeChild(muzzleFlash);
        appRef.current.stage.removeChild(bulletTrail);
      }
    }, 200);
  };

  const createHitEffect = (x: number, y: number) => {
    if (!appRef.current) return;

    // Blood splatter effect
    for (let i = 0; i < 12; i++) {
      const splatter = new PIXI.Graphics();
      splatter.circle(0, 0, Math.random() * 4 + 2);
      splatter.fill({ color: 0x8B0000 });
      
      const angle = (Math.PI * 2 * i) / 12;
      const distance = Math.random() * 20 + 10;
      splatter.position.set(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance
      );
      
      appRef.current.stage.addChild(splatter);
      
      // Animate splatter
      let splatterLife = 60; // frames
      let splatterFrame = 0;
      
      const animateSplatter = () => {
        splatterFrame++;
        splatter.y += 0.5; // gravity
        splatter.alpha = 1 - (splatterFrame / splatterLife);
        splatter.scale.set(splatter.scale.x * 0.99); // shrink
        
        if (splatterFrame >= splatterLife) {
          appRef.current?.stage.removeChild(splatter);
        } else {
          requestAnimationFrame(animateSplatter);
        }
      };
      requestAnimationFrame(animateSplatter);
    }

    // Impact flash
    const impact = new PIXI.Graphics();
    impact.circle(0, 0, 15);
    impact.fill({ color: 0xFFFFFF, alpha: 0.8 });
    impact.position.set(x, y);
    appRef.current.stage.addChild(impact);

    let impactScale = 1;
    const animateImpact = () => {
      impactScale += 0.3;
      impact.scale.set(impactScale);
      impact.alpha *= 0.8;
      
      if (impact.alpha < 0.1) {
        appRef.current?.stage.removeChild(impact);
      } else {
        requestAnimationFrame(animateImpact);
      }
    };
    requestAnimationFrame(animateImpact);
  };

  const createCharacter = (x: number, y: number, color: number) => {
    const character = new PIXI.Container();
    character.position.set(x, y);
    
    // Shadow
    const shadow = new PIXI.Graphics();
    shadow.ellipse(0, 45, 20, 8);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    character.addChild(shadow);
    
    // Body with gradient effect (using multiple rectangles)
    const body = new PIXI.Graphics();
    body.rect(-15, 0, 30, 50);
    body.fill({ color });
    
    // Body highlight
    const bodyHighlight = new PIXI.Graphics();
    bodyHighlight.rect(-10, 5, 20, 15);
    bodyHighlight.fill({ color: 0xFFFFFF, alpha: 0.3 });
    character.addChild(body, bodyHighlight);
    
    // Arms
    const leftArm = new PIXI.Graphics();
    leftArm.rect(-25, 10, 12, 25);
    leftArm.fill({ color: 0xFFB5A3 });
    
    const rightArm = new PIXI.Graphics();
    rightArm.rect(13, 10, 12, 25);
    rightArm.fill({ color: 0xFFB5A3 });
    character.addChild(leftArm, rightArm);
    
    // Legs
    const leftLeg = new PIXI.Graphics();
    leftLeg.rect(-10, 50, 8, 25);
    leftLeg.fill({ color: 0x4A5568 });
    
    const rightLeg = new PIXI.Graphics();
    rightLeg.rect(2, 50, 8, 25);
    rightLeg.fill({ color: 0x4A5568 });
    character.addChild(leftLeg, rightLeg);
    
    // Head with better shading
    const head = new PIXI.Graphics();
    head.circle(0, -10, 18);
    head.fill({ color: 0xFFDBAC });
    
    // Head highlight
    const headHighlight = new PIXI.Graphics();
    headHighlight.circle(-3, -15, 8);
    headHighlight.fill({ color: 0xFFFFFF, alpha: 0.4 });
    character.addChild(head, headHighlight);
    
    // Hair
    const hair = new PIXI.Graphics();
    hair.rect(-15, -25, 30, 12);
    hair.fill({ color: 0x8B4513 });
    character.addChild(hair);
    
    // Eyes
    const leftEye = new PIXI.Graphics();
    leftEye.circle(-5, -12, 2);
    leftEye.fill({ color: 0x000000 });
    
    const rightEye = new PIXI.Graphics();
    rightEye.circle(5, -12, 2);
    rightEye.fill({ color: 0x000000 });
    character.addChild(leftEye, rightEye);
    
    // Gun (for player) with better details
    if (color === 0xFF6B35) {
      const gun = new PIXI.Graphics();
      gun.rect(18, 12, 40, 8);
      gun.fill({ color: 0x2D3748 });
      
      // Gun barrel
      const barrel = new PIXI.Graphics();
      barrel.rect(55, 14, 8, 4);
      barrel.fill({ color: 0x1A202C });
      
      // Gun grip
      const grip = new PIXI.Graphics();
      grip.rect(15, 20, 8, 12);
      grip.fill({ color: 0x8B4513 });
      
      character.addChild(gun, barrel, grip);
    }
    
    return character;
  };

  const createZombie = (x: number, y: number, color: number) => {
    const zombie = new PIXI.Container();
    zombie.position.set(x, y);
    
    // Shadow
    const shadow = new PIXI.Graphics();
    shadow.ellipse(0, 40, 18, 6);
    shadow.fill({ color: 0x000000, alpha: 0.4 });
    zombie.addChild(shadow);
    
    // Body with torn clothing effect
    const body = new PIXI.Graphics();
    body.rect(-12, 0, 24, 45);
    body.fill({ color });
    
    // Torn shirt details
    const tornShirt1 = new PIXI.Graphics();
    tornShirt1.rect(-8, 5, 16, 8);
    tornShirt1.fill({ color: 0x4A5D23 }); // Darker green for shirt
    
    const tornShirt2 = new PIXI.Graphics();
    tornShirt2.rect(-6, 25, 12, 6);
    tornShirt2.fill({ color: 0x4A5D23 });
    
    zombie.addChild(body, tornShirt1, tornShirt2);
    
    // Arms with claws
    const leftArm = new PIXI.Graphics();
    leftArm.rect(-20, 8, 10, 30);
    leftArm.fill({ color: 0x7FDD7F });
    
    // Left hand claws
    const leftClaw1 = new PIXI.Graphics();
    leftClaw1.rect(-22, 35, 3, 8);
    leftClaw1.fill({ color: 0x8B4513 });
    
    const leftClaw2 = new PIXI.Graphics();
    leftClaw2.rect(-18, 37, 3, 6);
    leftClaw2.fill({ color: 0x8B4513 });
    
    const rightArm = new PIXI.Graphics();
    rightArm.rect(10, 8, 10, 30);
    rightArm.fill({ color: 0x7FDD7F });
    
    // Right hand claws
    const rightClaw1 = new PIXI.Graphics();
    rightClaw1.rect(19, 35, 3, 8);
    rightClaw1.fill({ color: 0x8B4513 });
    
    const rightClaw2 = new PIXI.Graphics();
    rightClaw2.rect(15, 37, 3, 6);
    rightClaw2.fill({ color: 0x8B4513 });
    
    zombie.addChild(leftArm, rightArm, leftClaw1, leftClaw2, rightClaw1, rightClaw2);
    
    // Legs
    const leftLeg = new PIXI.Graphics();
    leftLeg.rect(-8, 45, 6, 25);
    leftLeg.fill({ color: 0x6FCD6F });
    
    const rightLeg = new PIXI.Graphics();
    rightLeg.rect(2, 45, 6, 25);
    rightLeg.fill({ color: 0x6FCD6F });
    zombie.addChild(leftLeg, rightLeg);
    
    // Head with decay spots
    const head = new PIXI.Graphics();
    head.circle(0, -8, 16);
    head.fill({ color });
    
    // Decay spots
    const decay1 = new PIXI.Graphics();
    decay1.circle(-8, -5, 3);
    decay1.fill({ color: 0x4A5D23 });
    
    const decay2 = new PIXI.Graphics();
    decay2.circle(6, -12, 2);
    decay2.fill({ color: 0x4A5D23 });
    
    zombie.addChild(head, decay1, decay2);
    
    // Glowing red eyes
    const leftEye = new PIXI.Graphics();
    leftEye.circle(-5, -10, 4);
    leftEye.fill({ color: 0xFF0000 });
    
    // Eye glow effect
    const leftEyeGlow = new PIXI.Graphics();
    leftEyeGlow.circle(-5, -10, 6);
    leftEyeGlow.fill({ color: 0xFF0000, alpha: 0.3 });
    
    const rightEye = new PIXI.Graphics();
    rightEye.circle(5, -10, 4);
    rightEye.fill({ color: 0xFF0000 });
    
    const rightEyeGlow = new PIXI.Graphics();
    rightEyeGlow.circle(5, -10, 6);
    rightEyeGlow.fill({ color: 0xFF0000, alpha: 0.3 });
    
    // Pupils
    const leftPupil = new PIXI.Graphics();
    leftPupil.circle(-5, -10, 2);
    leftPupil.fill({ color: 0xFFFF00 });
    
    const rightPupil = new PIXI.Graphics();
    rightPupil.circle(5, -10, 2);
    rightPupil.fill({ color: 0xFFFF00 });
    
    zombie.addChild(leftEyeGlow, rightEyeGlow, leftEye, rightEye, leftPupil, rightPupil);
    
    // Mouth with teeth
    const mouth = new PIXI.Graphics();
    mouth.rect(-8, -2, 16, 6);
    mouth.fill({ color: 0x000000 });
    
    // Teeth
    const tooth1 = new PIXI.Graphics();
    tooth1.rect(-6, -2, 2, 8);
    tooth1.fill({ color: 0xFFFFF0 });
    
    const tooth2 = new PIXI.Graphics();
    tooth2.rect(-2, -2, 2, 6);
    tooth2.fill({ color: 0xFFFFF0 });
    
    const tooth3 = new PIXI.Graphics();
    tooth3.rect(2, -2, 2, 8);
    tooth3.fill({ color: 0xFFFFF0 });
    
    const tooth4 = new PIXI.Graphics();
    tooth4.rect(6, -2, 2, 6);
    tooth4.fill({ color: 0xFFFFF0 });
    
    zombie.addChild(mouth, tooth1, tooth2, tooth3, tooth4);
    
    return zombie;
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <div className="text-white text-xl font-bold animate-pulse">
            🎮 Loading PixiJS Game...
          </div>
        </div>
      )}
    </div>
  );
};

export default PixiGame;