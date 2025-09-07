import { useGameStore } from '../../stores/gameStore';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: GameStats) => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface GameStats {
  totalScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  zombiesKilled: number;
  maxStreak: number;
  currentStreak: number;
  wordsLearned: string[];
  gamesPlayed: number;
  totalPlayTime: number; // in seconds
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: UpgradeEffect;
}

export interface UpgradeEffect {
  type: 'damage' | 'health' | 'time' | 'coins' | 'experience';
  multiplier: number;
  baseValue: number;
}

export class ProgressionSystem {
  private static instance: ProgressionSystem;
  private stats: GameStats;
  private achievements: Achievement[];
  private upgrades: Upgrade[];
  
  static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem();
    }
    return ProgressionSystem.instance;
  }

  constructor() {
    this.stats = this.loadStats();
    this.achievements = this.initializeAchievements();
    this.upgrades = this.initializeUpgrades();
  }

  private loadStats(): GameStats {
    const saved = localStorage.getItem('zombie-vocab-stats');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      totalScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      zombiesKilled: 0,
      maxStreak: 0,
      currentStreak: 0,
      wordsLearned: [],
      gamesPlayed: 0,
      totalPlayTime: 0
    };
  }

  private saveStats(): void {
    localStorage.setItem('zombie-vocab-stats', JSON.stringify(this.stats));
  }

  private initializeAchievements(): Achievement[] {
    const savedAchievements = localStorage.getItem('zombie-vocab-achievements');
    let achievements: Achievement[] = [];
    
    if (savedAchievements) {
      achievements = JSON.parse(savedAchievements);
    } else {
      achievements = [
        {
          id: 'first_kill',
          name: 'First Blood',
          description: 'Defeat your first zombie',
          icon: '🩸',
          condition: (stats) => stats.zombiesKilled >= 1,
          unlocked: false
        },
        {
          id: 'vocabulary_master',
          name: 'Vocabulary Master',
          description: 'Learn 50 different words',
          icon: '📚',
          condition: (stats) => stats.wordsLearned.length >= 50,
          unlocked: false
        },
        {
          id: 'streak_master',
          name: 'Streak Master',
          description: 'Get 10 correct answers in a row',
          icon: '🔥',
          condition: (stats) => stats.maxStreak >= 10,
          unlocked: false
        },
        {
          id: 'zombie_slayer',
          name: 'Zombie Slayer',
          description: 'Defeat 100 zombies',
          icon: '⚔️',
          condition: (stats) => stats.zombiesKilled >= 100,
          unlocked: false
        },
        {
          id: 'perfect_accuracy',
          name: 'Sharpshooter',
          description: 'Answer 20 questions with 100% accuracy',
          icon: '🎯',
          condition: (stats) => stats.questionsAnswered >= 20 && stats.correctAnswers === stats.questionsAnswered,
          unlocked: false
        },
        {
          id: 'high_scorer',
          name: 'High Scorer',
          description: 'Reach 10,000 total points',
          icon: '💎',
          condition: (stats) => stats.totalScore >= 10000,
          unlocked: false
        }
      ];
    }
    
    return achievements;
  }

  private initializeUpgrades(): Upgrade[] {
    const savedUpgrades = localStorage.getItem('zombie-vocab-upgrades');
    let upgrades: Upgrade[] = [];
    
    if (savedUpgrades) {
      upgrades = JSON.parse(savedUpgrades);
    } else {
      upgrades = [
        {
          id: 'weapon_damage',
          name: 'Weapon Upgrade',
          description: 'Increase damage dealt to zombies',
          icon: '🔫',
          cost: 50,
          maxLevel: 5,
          currentLevel: 0,
          effect: {
            type: 'damage',
            multiplier: 1.25,
            baseValue: 25
          }
        },
        {
          id: 'extra_health',
          name: 'Body Armor',
          description: 'Increase maximum health',
          icon: '🛡️',
          cost: 75,
          maxLevel: 3,
          currentLevel: 0,
          effect: {
            type: 'health',
            multiplier: 1.5,
            baseValue: 100
          }
        },
        {
          id: 'bonus_time',
          name: 'Time Extension',
          description: 'Get more time to answer questions',
          icon: '⏰',
          cost: 40,
          maxLevel: 4,
          currentLevel: 0,
          effect: {
            type: 'time',
            multiplier: 1.2,
            baseValue: 1.0
          }
        },
        {
          id: 'coin_multiplier',
          name: 'Lucky Charm',
          description: 'Earn more coins from victories',
          icon: '🍀',
          cost: 100,
          maxLevel: 3,
          currentLevel: 0,
          effect: {
            type: 'coins',
            multiplier: 1.5,
            baseValue: 1.0
          }
        }
      ];
    }
    
    return upgrades;
  }

  // Public methods for tracking progress
  public recordAnswer(correct: boolean, points: number, wordId: string): void {
    this.stats.questionsAnswered++;
    this.stats.totalScore += points;
    
    if (correct) {
      this.stats.correctAnswers++;
      this.stats.currentStreak++;
      this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
      
      // Track learned words
      if (!this.stats.wordsLearned.includes(wordId)) {
        this.stats.wordsLearned.push(wordId);
      }
    } else {
      this.stats.currentStreak = 0;
    }
    
    this.checkAchievements();
    this.saveStats();
  }

  public recordZombieKill(): void {
    this.stats.zombiesKilled++;
    this.checkAchievements();
    this.saveStats();
  }

  public startGame(): void {
    this.stats.gamesPlayed++;
    this.saveStats();
  }

  public addPlayTime(seconds: number): void {
    this.stats.totalPlayTime += seconds;
    this.saveStats();
  }

  // Level system
  public getCurrentLevel(): number {
    const gameStore = useGameStore.getState();
    return Math.floor(this.stats.totalScore / 1000) + 1;
  }

  public getExperienceToNextLevel(): number {
    const currentLevel = this.getCurrentLevel();
    const nextLevelXP = currentLevel * 1000;
    return nextLevelXP - (this.stats.totalScore % 1000);
  }

  public getLevelProgress(): number {
    const currentLevelXP = this.stats.totalScore % 1000;
    return (currentLevelXP / 1000) * 100;
  }

  // Achievement system
  private checkAchievements(): void {
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.condition(this.stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        this.onAchievementUnlocked(achievement);
      }
    });
    
    localStorage.setItem('zombie-vocab-achievements', JSON.stringify(this.achievements));
  }

  private onAchievementUnlocked(achievement: Achievement): void {
    // Trigger achievement notification
    console.log(`Achievement Unlocked: ${achievement.name}!`);
    // In a real implementation, you'd show a toast notification
  }

  // Upgrade system
  public canAffordUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return false;
    
    const gameStore = useGameStore.getState();
    const cost = this.getUpgradeCost(upgrade);
    return gameStore.coins >= cost;
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || !this.canAffordUpgrade(upgradeId)) return false;
    
    const gameStore = useGameStore.getState();
    const cost = this.getUpgradeCost(upgrade);
    
    // Deduct coins
    gameStore.setCoins(gameStore.coins - cost);
    
    // Upgrade level
    upgrade.currentLevel++;
    
    localStorage.setItem('zombie-vocab-upgrades', JSON.stringify(this.upgrades));
    return true;
  }

  private getUpgradeCost(upgrade: Upgrade): number {
    return Math.floor(upgrade.cost * Math.pow(1.5, upgrade.currentLevel));
  }

  public getUpgradeEffect(upgradeId: string): number {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.currentLevel === 0) return upgrade?.effect.baseValue || 1;
    
    return upgrade.effect.baseValue * Math.pow(upgrade.effect.multiplier, upgrade.currentLevel);
  }

  // Getters
  public getStats(): GameStats {
    return { ...this.stats };
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getUpgrades(): Upgrade[] {
    return [...this.upgrades];
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  public getProgress(): {
    level: number;
    xpToNext: number;
    levelProgress: number;
    totalAchievements: number;
    unlockedAchievements: number;
  } {
    return {
      level: this.getCurrentLevel(),
      xpToNext: this.getExperienceToNextLevel(),
      levelProgress: this.getLevelProgress(),
      totalAchievements: this.achievements.length,
      unlockedAchievements: this.getUnlockedAchievements().length
    };
  }
}