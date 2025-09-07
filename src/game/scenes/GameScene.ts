import * as PIXI from 'pixi.js';
import { GameScene, Zombie, Player, Weapon } from '../../types';
import { CombatSystem } from '../systems/CombatSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { useGameStore } from '../../stores/gameStore';

class BattleScene implements GameScene {
  public container: PIXI.Container;
  private background!: PIXI.Sprite;
  private player!: PIXI.Graphics;
  private zombies: PIXI.Graphics[] = [];
  private zombieData: Zombie[] = [];
  private playerData: Player;
  private combatSystem: CombatSystem;
  private particleSystem: ParticleSystem;
  private gameLoop?: () => void;
  private backgroundTextures: PIXI.Texture[] = [];
  private currentBackgroundIndex: number = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.combatSystem = CombatSystem.getInstance();
    this.particleSystem = ParticleSystem.getInstance();
    
    // Initialize player data
    this.playerData = {
      id: 'player1',
      x: 120,
      y: 350,
      health: 100,
      maxHealth: 100,
      weapon: {
        type: 'pistol',
        damage: 25,
        fireRate: 1000,
        ammo: 12,
        maxAmmo: 12
      },
      animations: {
        idle: [],
        shooting: [],
        reload: []
      }
    };
    
    // Initialize asynchronously
    this.init().catch(error => {
      console.error('Failed to initialize BattleScene:', error);
    });
  }

  public async init(): Promise<void> {
    await this.loadBackgroundTextures();
    this.createBackground();
    this.createPlayer();
    this.createZombies();
    this.setupGameLoop();
  }

  private async loadBackgroundTextures(): Promise<void> {
    const backgroundFiles = ['bg1.png', 'bg2.png', 'bg3.png'];
    
    try {
      for (const filename of backgroundFiles) {
        const texture = await PIXI.Texture.fromURL(`/assets/backgrounds/${filename}`);
        this.backgroundTextures.push(texture);
      }
      console.log(`Loaded ${this.backgroundTextures.length} background textures`);
    } catch (error) {
      console.error('Error loading background textures:', error);
      // Create a fallback solid color texture if loading fails
      const fallbackTexture = PIXI.Texture.WHITE;
      this.backgroundTextures.push(fallbackTexture);
    }
  }

  private createBackground(): void {
    // Start with random background for new game
    this.currentBackgroundIndex = Math.floor(Math.random() * this.backgroundTextures.length);
    
    if (this.backgroundTextures.length > 0) {
      this.background = new PIXI.Sprite(this.backgroundTextures[this.currentBackgroundIndex]);
      
      // Scale background to fit game area
      this.background.width = 800;
      this.background.height = 600;
      
      console.log(`Started with background ${this.currentBackgroundIndex + 1}`);
    } else {
      // Fallback to graphics if textures failed to load
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x87CEEB);
      graphics.drawRect(0, 0, 800, 200);
      graphics.beginFill(0x228B22);
      graphics.drawRect(0, 200, 800, 400);
      graphics.endFill();
      this.background = graphics as any; // Type workaround
      console.log('Using fallback background (no textures loaded)');
    }
    
    this.container.addChild(this.background);
  }

  private createPlayer(): void {
    this.player = new PIXI.Graphics();
    
    // Body
    this.player.beginFill(0xFF6B35);
    this.player.drawRect(-15, 0, 30, 50);
    
    // Head
    this.player.beginFill(0xFFDBAC);
    this.player.drawCircle(0, -10, 15);
    
    // Gun
    this.player.beginFill(0x2D3748);
    this.player.drawRect(15, 10, 40, 8);
    this.player.endFill();
    
    this.player.position.set(120, 350);
    this.container.addChild(this.player);
  }

  private createZombies(): void {
    for (let i = 0; i < 3; i++) {
      const zombie = new PIXI.Graphics();
      
      // Body
      zombie.beginFill(0x90EE90);
      zombie.drawRect(-12, 0, 24, 45);
      
      // Head
      zombie.beginFill(0x90EE90);
      zombie.drawCircle(0, -8, 18);
      
      // Eyes
      zombie.beginFill(0xFF0000);
      zombie.drawCircle(-6, -12, 4);
      zombie.drawCircle(6, -12, 4);
      zombie.endFill();
      
      zombie.position.set(600 + i * 80, 350);
      zombie.interactive = true;
      zombie.cursor = 'pointer';
      
      // Create zombie data
      const zombieData: Zombie = {
        id: `zombie_${i}`,
        x: 600 + i * 80,
        y: 350,
        health: 50 + i * 10,
        maxHealth: 50 + i * 10,
        speed: 0.5 + i * 0.1,
        type: 'basic',
        animations: {
          walk: [],
          attack: [],
          death: []
        },
        isDying: false
      };
      
      // Add click handler for combat
      zombie.on('pointerdown', () => {
        if (!this.combatSystem.isInCombat()) {
          const gameStore = useGameStore.getState();
          this.combatSystem.startCombat(zombieData, gameStore.level);
        }
      });
      
      this.zombies.push(zombie);
      this.zombieData.push(zombieData);
      this.container.addChild(zombie);
    }
  }

  private setupGameLoop(): void {
    let time = 0;
    
    this.gameLoop = () => {
      time += 0.02;
      
      // Update combat system
      this.combatSystem.update(0.016); // ~60fps delta time
      
      // Animate zombies walking
      this.zombies.forEach((zombie, index) => {
        const zombieData = this.zombieData[index];
        
        if (!zombieData.isDying) {
          const walkOffset = Math.sin(time + index * 0.5) * 3;
          const baseX = 600 + index * 80;
          
          // Move zombies towards player if not in combat
          if (!this.combatSystem.isInCombat()) {
            zombieData.x -= zombieData.speed;
            zombie.x = zombieData.x + walkOffset;
          } else {
            zombie.x = zombieData.x + walkOffset;
          }
          
          // Reset zombie position if it gets too close
          if (zombieData.x < 200) {
            zombieData.x = 800 + index * 80;
            zombieData.health = zombieData.maxHealth; // Restore health when respawning
          }
          
          // Update health bar
          this.updateZombieHealthBar(zombie, zombieData);
        } else {
          // Death animation
          zombie.alpha -= 0.05;
          zombie.rotation += 0.1;
          if (zombie.alpha <= 0) {
            // Respawn zombie
            zombieData.isDying = false;
            zombieData.health = zombieData.maxHealth;
            zombieData.x = 800 + index * 80;
            zombie.alpha = 1;
            zombie.rotation = 0;
          }
        }
      });
      
      // Update player position
      this.playerData.x = this.player.x;
      this.playerData.y = this.player.y;
    };
    
    const ticker = PIXI.Ticker.shared;
    ticker.add(this.gameLoop);
  }

  private updateZombieHealthBar(zombie: PIXI.Graphics, zombieData: Zombie): void {
    const healthPercentage = zombieData.health / zombieData.maxHealth;
    
    // Remove existing health bar
    const existingBar = zombie.getChildByName('healthBar') as PIXI.Graphics;
    if (existingBar) {
      zombie.removeChild(existingBar);
    }
    
    // Create new health bar
    const healthBar = new PIXI.Graphics();
    healthBar.name = 'healthBar';
    
    // Background
    healthBar.beginFill(0x000000);
    healthBar.drawRect(-15, -35, 30, 4);
    
    // Health
    const color = healthPercentage > 0.5 ? 0x00FF00 : healthPercentage > 0.25 ? 0xFFFF00 : 0xFF0000;
    healthBar.beginFill(color);
    healthBar.drawRect(-15, -35, 30 * healthPercentage, 4);
    healthBar.endFill();
    
    zombie.addChild(healthBar);
  }

  public update(deltaTime: number): void {
    // Game logic updates are handled in the game loop
  }

  public destroy(): void {
    if (this.gameLoop) {
      PIXI.Ticker.shared.remove(this.gameLoop);
    }
    this.container.destroy({ children: true });
  }

  // Public methods for external access
  public getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  public getZombieData(): Zombie[] {
    return this.zombieData;
  }

  public getPlayerData(): Player {
    return this.playerData;
  }

  public dealDamageToZombie(zombieId: string, damage: number): void {
    const zombie = this.zombieData.find(z => z.id === zombieId);
    if (zombie) {
      zombie.health = Math.max(0, zombie.health - damage);
      
      // Create hit effect
      this.particleSystem.createHitEffect(zombie.x, zombie.y - 20, this.container);
      
      if (zombie.health <= 0) {
        zombie.isDying = true;
        this.particleSystem.createDeathEffect(zombie.x, zombie.y, this.container);
      }
    }
  }
}

export default BattleScene;