// Game Types
export interface GameState {
  scene: 'menu' | 'game' | 'paused' | 'gameOver';
  score: number;
  lives: number;
  coins: number;
  level: number;
  currentQuestion?: VocabQuestion;
}

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  difficulty: number;
  category?: string;
}

export interface WordSet {
  id: string;
  name: string;
  description: string;
  words: VocabWord[];
  color: string;
  icon: string;
}

export interface VocabQuestion {
  id: string;
  type: 'multipleChoice' | 'spelling' | 'typing' | 'letterArrangement';
  word: VocabWord;
  options?: string[];
  correctAnswer: string;
  timeLimit: number;
  direction?: 'en-to-th' | 'th-to-en'; // Language direction
  scrambledLetters?: string[]; // For letter arrangement mode
}

export interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  weapon: Weapon;
  animations: PlayerAnimations;
}

export type ZombieVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface Zombie {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'basic' | 'fast' | 'boss';
  variant?: ZombieVariant; // Zombie visual variant (1-15)
  animations: ZombieAnimations;
  isDying: boolean;
}

export interface Weapon {
  type: 'pistol' | 'rifle' | 'shotgun';
  damage: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
}

export interface PlayerAnimations {
  idle: string[];
  shooting: string[];
  reload: string[];
}

export interface ZombieAnimations {
  walk: string[];
  attack: string[];
  death: string[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
  difficulty: 'easy' | 'medium' | 'hard';
  autoSave: boolean;
  languageDirection: 'en-to-th' | 'th-to-en' | 'mixed';
  soldierType: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4';
  uiLanguage: 'th' | 'en'; // UI language selection
  questionTypes: {
    multipleChoice: boolean;
    typing: boolean;
    spelling: boolean;
    letterArrangement: boolean;
  };
}

export interface GameStats {
  totalScore: number;
  gamesPlayed: number;
  wordsLearned: number;
  accuracy: number;
  bestStreak: number;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Store Types
export interface GameStore extends GameState {
  setScene: (scene: GameState['scene']) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setLives: (lives: number) => void;
  removeLive: () => void;
  setCoins: (coins: number) => void;
  addCoins: (amount: number) => void;
  setLevel: (level: number) => void;
  setCurrentQuestion: (question: VocabQuestion | undefined) => void;
  resetGame: () => void;
}

export interface VocabStore {
  words: VocabWord[];
  customWords: VocabWord[];
  wordSets: WordSet[];
  selectedWordSets: string[]; // Array of selected word set IDs
  currentWordIndex: number;
  addWord: (word: VocabWord) => void;
  removeWord: (id: string) => void;
  updateWord: (id: string, updates: Partial<VocabWord>) => void;
  setWords: (words: VocabWord[]) => void;
  getRandomWord: () => VocabWord | null;
  importWords: (words: VocabWord[]) => void;
  exportWords: () => VocabWord[];
  // Word Sets methods
  addWordSet: (wordSet: WordSet) => void;
  removeWordSet: (id: string) => void;
  updateWordSet: (id: string, updates: Partial<WordSet>) => void;
  setSelectedWordSets: (setIds: string[]) => void;
  getActiveWords: () => VocabWord[]; // Get words from selected sets
}

export interface SettingsStore extends GameSettings {
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setDifficulty: (difficulty: GameSettings['difficulty']) => void;
  setAutoSave: (enabled: boolean) => void;
  setLanguageDirection: (direction: GameSettings['languageDirection']) => void;
  setSoldierType: (type: GameSettings['soldierType']) => void;
  setUiLanguage: (language: GameSettings['uiLanguage']) => void;
  setQuestionTypes: (types: GameSettings['questionTypes']) => void;
}

// PixiJS Game Types
export interface GameApplication {
  app: PIXI.Application;
  currentScene: PIXI.Container;
  loader: PIXI.Loader;
  ticker: PIXI.Ticker;
}

export interface GameScene {
  container: PIXI.Container;
  init: () => void;
  update: (deltaTime: number) => void;
  destroy: () => void;
}