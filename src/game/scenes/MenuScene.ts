import * as PIXI from 'pixi.js';
import { GameScene } from '../../types';

class MenuScene implements GameScene {
  public container: PIXI.Container;
  private background!: PIXI.Graphics;
  private title!: PIXI.Text;
  private startButton!: PIXI.Graphics;
  private startButtonText!: PIXI.Text;

  constructor() {
    this.container = new PIXI.Container();
    this.init();
  }

  public init(): void {
    this.createBackground();
    this.createTitle();
    this.createStartButton();
    this.createCharacters();
  }

  private createBackground(): void {
    this.background = new PIXI.Graphics();
    
    // Create gradient background
    const gradient = this.background.beginTexture();
    this.background.beginFill(0x667eea);
    this.background.drawRect(0, 0, 800, 600);
    this.background.beginFill(0x764ba2);
    this.background.drawRect(0, 300, 800, 300);
    this.background.endFill();
    
    this.container.addChild(this.background);
  }

  private createTitle(): void {
    const titleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 64,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#2D3748',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 8,
      dropShadowDistance: 4,
    });

    this.title = new PIXI.Text('ZOMBIE VOCAB ARENA', titleStyle);
    this.title.anchor.set(0.5);
    this.title.position.set(400, 150);
    
    this.container.addChild(this.title);
  }

  private createStartButton(): void {
    // Create button background
    this.startButton = new PIXI.Graphics();
    this.startButton.beginFill(0xFF6B35);
    this.startButton.drawRoundedRect(0, 0, 200, 60, 15);
    this.startButton.endFill();
    this.startButton.position.set(300, 350);
    
    // Make it interactive
    this.startButton.interactive = true;
    this.startButton.buttonMode = true;
    
    // Add hover effects
    this.startButton.on('pointerover', () => {
      this.startButton.tint = 0xF7931E;
      this.startButton.scale.set(1.05);
    });
    
    this.startButton.on('pointerout', () => {
      this.startButton.tint = 0xFFFFFF;
      this.startButton.scale.set(1.0);
    });
    
    // Add click handler
    this.startButton.on('pointerdown', () => {
      // We'll add game store integration later
      console.log('Start button clicked!');
      // For now, just log - we'll integrate with game store later
    });

    // Create button text
    const buttonStyle = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#ffffff',
    });

    this.startButtonText = new PIXI.Text('Start', buttonStyle);
    this.startButtonText.anchor.set(0.5);
    this.startButtonText.position.set(100, 30);
    
    this.startButton.addChild(this.startButtonText);
    this.container.addChild(this.startButton);
  }

  private createCharacters(): void {
    // Create simple character representations using graphics
    // We'll replace these with sprites later
    
    // Player character
    const player = new PIXI.Graphics();
    player.beginFill(0xFF6B35);
    player.drawRect(0, 0, 30, 50);
    player.endFill();
    player.beginFill(0xFFDBAC);
    player.drawCircle(15, -10, 15);
    player.endFill();
    player.position.set(200, 450);
    this.container.addChild(player);
    
    // Zombie character
    const zombie = new PIXI.Graphics();
    zombie.beginFill(0x90EE90);
    zombie.drawRect(0, 0, 30, 50);
    zombie.endFill();
    zombie.beginFill(0x90EE90);
    zombie.drawCircle(15, -10, 15);
    zombie.endFill();
    zombie.position.set(570, 450);
    this.container.addChild(zombie);
    
    // Add simple floating animation
    let time = 0;
    const animate = () => {
      time += 0.05;
      player.y = 450 + Math.sin(time) * 5;
      zombie.y = 450 + Math.sin(time + Math.PI) * 5;
    };
    
    // We'll need to integrate this with the game loop properly later
    const ticker = PIXI.Ticker.shared;
    ticker.add(animate);
  }

  public update(deltaTime: number): void {
    // Animation updates will go here
    // For now, animations are handled in createCharacters
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

export default MenuScene;