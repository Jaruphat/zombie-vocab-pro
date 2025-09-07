import { Zombie } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export interface SpawnWave {
  id: string;
  zombieCount: number;
  zombieTypes: ('basic' | 'fast' | 'boss')[];
  spawnDelay: number; // milliseconds between spawns
  difficulty: number;
}

export class SpawnSystem {
  private static instance: SpawnSystem;
  private currentWave: number = 1;
  private activeZombies: Zombie[] = [];
  private spawnTimer: number = 0;
  private waveInProgress: boolean = false;
  private zombiesSpawned: number = 0;
  private zombiesToSpawn: number = 0;
  
  // Callbacks
  public onZombieSpawn?: (zombie: Zombie) => void;
  public onWaveStart?: (waveNumber: number, wave: SpawnWave) => void;
  public onWaveComplete?: (waveNumber: number) => void;

  static getInstance(): SpawnSystem {
    if (!SpawnSystem.instance) {
      SpawnSystem.instance = new SpawnSystem();
    }
    return SpawnSystem.instance;
  }

  public startWave(): void {
    if (this.waveInProgress) return;
    
    const wave = this.generateWave(this.currentWave);
    this.waveInProgress = true;
    this.zombiesSpawned = 0;
    this.zombiesToSpawn = wave.zombieCount;
    this.spawnTimer = 0;
    
    this.onWaveStart?.(this.currentWave, wave);
  }

  private generateWave(waveNumber: number): SpawnWave {
    const gameStore = useGameStore.getState();
    const level = gameStore.level;
    
    // Base zombie count increases with wave and level
    const baseCount = Math.min(3 + Math.floor(waveNumber / 2), 8);
    const zombieCount = baseCount + Math.floor(level / 3);
    
    // Determine zombie types based on wave and difficulty
    const zombieTypes: ('basic' | 'fast' | 'boss')[] = [];
    
    // Always include basic zombies
    const basicCount = Math.max(1, zombieCount - Math.floor(waveNumber / 3));
    for (let i = 0; i < basicCount; i++) {
      zombieTypes.push('basic');
    }
    
    // Add fast zombies starting from wave 3
    if (waveNumber >= 3) {
      const fastCount = Math.min(2, Math.floor(waveNumber / 3));
      for (let i = 0; i < fastCount; i++) {
        zombieTypes.push('fast');
      }
    }
    
    // Add boss zombie every 5th wave
    if (waveNumber % 5 === 0) {
      zombieTypes.push('boss');
    }
    
    // Spawn delay decreases with difficulty
    const baseDelay = 2000; // 2 seconds
    const spawnDelay = Math.max(500, baseDelay - (level * 100) - (waveNumber * 50));
    
    return {
      id: `wave_${waveNumber}`,
      zombieCount: zombieTypes.length,
      zombieTypes,
      spawnDelay,
      difficulty: level
    };
  }

  public update(deltaTime: number): void {
    if (!this.waveInProgress) return;
    
    this.spawnTimer += deltaTime * 1000; // Convert to milliseconds
    
    const wave = this.generateWave(this.currentWave);
    
    // Check if it's time to spawn the next zombie
    if (this.zombiesSpawned < this.zombiesToSpawn && 
        this.spawnTimer >= wave.spawnDelay) {
      
      this.spawnZombie(wave.zombieTypes[this.zombiesSpawned], wave.difficulty);
      this.zombiesSpawned++;
      this.spawnTimer = 0;
    }
    
    // Check if wave is complete
    if (this.zombiesSpawned >= this.zombiesToSpawn && 
        this.activeZombies.filter(z => !z.isDying && z.health > 0).length === 0) {
      this.completeWave();
    }
  }

  private spawnZombie(type: 'basic' | 'fast' | 'boss', difficulty: number): void {
    const zombie: Zombie = this.createZombie(type, difficulty);
    this.activeZombies.push(zombie);
    this.onZombieSpawn?.(zombie);
  }

  private createZombie(type: 'basic' | 'fast' | 'boss', difficulty: number): Zombie {
    const baseStats = this.getZombieBaseStats(type);
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.2;
    
    // Random spawn position (right side of screen)
    const spawnX = 800 + Math.random() * 200;
    const spawnY = 320 + (Math.random() - 0.5) * 100;
    
    return {
      id: `zombie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: spawnX,
      y: spawnY,
      health: Math.floor(baseStats.health * difficultyMultiplier),
      maxHealth: Math.floor(baseStats.health * difficultyMultiplier),
      speed: baseStats.speed * (1 + (difficulty - 1) * 0.1),
      type,
      animations: {
        walk: [],
        attack: [],
        death: []
      },
      isDying: false
    };
  }

  private getZombieBaseStats(type: 'basic' | 'fast' | 'boss'): {
    health: number;
    speed: number;
  } {
    switch (type) {
      case 'basic':
        return { health: 50, speed: 0.5 };
      case 'fast':
        return { health: 30, speed: 1.0 };
      case 'boss':
        return { health: 150, speed: 0.3 };
      default:
        return { health: 50, speed: 0.5 };
    }
  }

  private completeWave(): void {
    this.waveInProgress = false;
    this.onWaveComplete?.(this.currentWave);
    
    // Award bonus coins for completing wave
    const gameStore = useGameStore.getState();
    const bonusCoins = 5 + Math.floor(this.currentWave / 2);
    gameStore.addCoins(bonusCoins);
    
    this.currentWave++;
    
    // Brief pause before next wave (handled by game logic)
  }

  public removeZombie(zombieId: string): void {
    this.activeZombies = this.activeZombies.filter(z => z.id !== zombieId);
  }

  public getActiveZombies(): Zombie[] {
    return [...this.activeZombies];
  }

  public getCurrentWave(): number {
    return this.currentWave;
  }

  public isWaveInProgress(): boolean {
    return this.waveInProgress;
  }

  public getWaveProgress(): {
    current: number;
    total: number;
    remaining: number;
  } {
    const alive = this.activeZombies.filter(z => !z.isDying && z.health > 0).length;
    const spawned = this.zombiesSpawned;
    const total = this.zombiesToSpawn;
    
    return {
      current: spawned - alive,
      total: total,
      remaining: total - (spawned - alive)
    };
  }

  public reset(): void {
    this.currentWave = 1;
    this.activeZombies = [];
    this.waveInProgress = false;
    this.zombiesSpawned = 0;
    this.zombiesToSpawn = 0;
    this.spawnTimer = 0;
  }

  // Difficulty scaling methods
  public getDifficultyMultiplier(): number {
    const gameStore = useGameStore.getState();
    return 1 + ((gameStore.level - 1) * 0.15) + ((this.currentWave - 1) * 0.1);
  }

  public getRecommendedLevel(): number {
    return Math.ceil(this.currentWave / 3);
  }

  public shouldShowWarning(): boolean {
    const gameStore = useGameStore.getState();
    return gameStore.level < this.getRecommendedLevel();
  }
}