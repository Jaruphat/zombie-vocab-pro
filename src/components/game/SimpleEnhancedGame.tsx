import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionPanel } from './QuestionPanel';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { VocabQuestion, GameSettings, PlayerShootStyle } from '../../types';
import { useVocabStore } from '../../stores/vocabStore';
import { PlayerSprite, ZombieSprite } from './sprites';
import { WordSetsSelector } from '../vocabulary/WordSetsSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { AudioSystem } from '../../game/systems/AudioSystem';
import type { ZombieVariant } from '../../types';
import { GameButton } from '../ui/GameButton';

const LANGUAGE_MODE_OPTIONS: Array<{
  value: GameSettings['languageDirection'];
  label: string;
  desc: string;
}> = [
    { value: 'en-to-th', label: 'EN->TH', desc: 'EN to TH' },
    { value: 'th-to-en', label: 'TH->EN', desc: 'TH to EN' },
    { value: 'mixed', label: 'MIX', desc: 'Mixed' },
  ];

const DIFFICULTY_SPEED_MULTIPLIER: Record<GameSettings['difficulty'], number> = {
  easy: 0.92,
  medium: 1.0,
  hard: 1.12,
};

const DIFFICULTY_SPAWN_OFFSET_MS: Record<GameSettings['difficulty'], number> = {
  easy: 250,
  medium: 0,
  hard: -250,
};

const PLAYER_HP_MAX = 100;
const ZOMBIE_ATTACK_DAMAGE: Record<GameSettings['difficulty'], number> = {
  easy: 18,
  medium: 24,
  hard: 30,
};

const SOLDIER_TYPES: GameSettings['soldierType'][] = ['soldier1', 'soldier2', 'soldier3', 'soldier4'];
// Keep only full-body character variants in spawn pool.
// Variants 1-2 are legacy flat sprites that look out of place in current gameplay.
const ZOMBIE_VARIANTS_POOL: ZombieVariant[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const SOLDIER_GROUND_LANE_OFFSET_PX: Record<GameSettings['soldierType'], number> = {
  soldier1: 60,
  soldier2: 22,
  soldier3: 60,
  soldier4: 60,
};
const ZOMBIE_GROUND_LANE_OFFSET_PX = 60;
const SOLDIER_MUZZLE_BOTTOM_PCT: Record<GameSettings['soldierType'], string> = {
  soldier1: '42%',
  soldier2: '37%',
  soldier3: '42%',
  soldier4: '42%',
};
const SOLDIER_BULLET_START_Y_PCT: Record<GameSettings['soldierType'], number> = {
  soldier1: 52,
  soldier2: 56,
  soldier3: 52,
  soldier4: 52,
};

interface SimpleEnhancedGameProps {
  scene: 'menu' | 'game';
  onSceneChange?: (scene: 'menu' | 'game') => void;
  onPlayerHpChange?: (hp: number, maxHp: number) => void;
}

interface BulletEffect {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  lengthPx: number;
  thicknessPx: number;
  gradient: string;
  glow: string;
  impactColor: string;
  impactGlow: string;
  impactRing: string;
  spriteSrc: string;
  spriteSizePx: number;
  spriteRotateDeg: number;
  spriteSpin: boolean;
}

interface ImpactEffect {
  id: string;
  x: number;
  y: number;
  frameSources: string[];
  frameIndex: number;
  sizePx: number;
  glow: string;
}

interface BulletProfile {
  durationMs: number;
  lengthPx: number;
  thicknessPx: number;
  gradient: string;
  glow: string;
  muzzleGradient: string;
  muzzleGlow: string;
  impactColor: string;
  impactGlow: string;
  impactRing: string;
}

type BulletObjectVariant = 'Grenade' | 'OrangeScale' | 'OrangeSpin' | 'YellowScale' | 'YellowSpin';
type MuzzleObjectVariant = 'OrangeMuzzle' | 'YellowMuzzle';
type ExplosionObjectVariant = 'GroundExplo' | 'MidAirExplo';

interface BulletObjectConfig {
  muzzle: MuzzleObjectVariant;
  spriteSizePx: number;
  spin: boolean;
  trailGradient?: string;
  trailGlow?: string;
  impactColor?: string;
  impactGlow?: string;
  impactRing?: string;
}

const BULLET_OBJECT_CONFIGS: Record<BulletObjectVariant, BulletObjectConfig> = {
  Grenade: {
    muzzle: 'OrangeMuzzle',
    spriteSizePx: 24,
    spin: true,
    trailGradient: 'linear-gradient(90deg, rgba(251,191,36,0.25) 0%, rgba(249,115,22,0.15) 100%)',
    trailGlow: '0 0 8px rgba(251,191,36,0.35)',
    impactColor: '#f97316',
    impactGlow: '0 0 14px rgba(249,115,22,0.95)',
    impactRing: 'rgba(253,186,116,0.95)',
  },
  OrangeScale: {
    muzzle: 'OrangeMuzzle',
    spriteSizePx: 20,
    spin: false,
    trailGradient: 'linear-gradient(90deg, rgba(253,186,116,0.45) 0%, rgba(251,146,60,0.2) 100%)',
    trailGlow: '0 0 10px rgba(249,115,22,0.6)',
    impactColor: '#fb923c',
    impactGlow: '0 0 12px rgba(251,146,60,0.95)',
    impactRing: 'rgba(254,215,170,0.95)',
  },
  OrangeSpin: {
    muzzle: 'OrangeMuzzle',
    spriteSizePx: 20,
    spin: true,
    trailGradient: 'linear-gradient(90deg, rgba(253,186,116,0.45) 0%, rgba(251,146,60,0.2) 100%)',
    trailGlow: '0 0 10px rgba(249,115,22,0.6)',
    impactColor: '#fb923c',
    impactGlow: '0 0 12px rgba(251,146,60,0.95)',
    impactRing: 'rgba(254,215,170,0.95)',
  },
  YellowScale: {
    muzzle: 'YellowMuzzle',
    spriteSizePx: 20,
    spin: false,
    trailGradient: 'linear-gradient(90deg, rgba(254,240,138,0.55) 0%, rgba(250,204,21,0.18) 100%)',
    trailGlow: '0 0 10px rgba(234,179,8,0.55)',
    impactColor: '#fde047',
    impactGlow: '0 0 12px rgba(250,204,21,0.95)',
    impactRing: 'rgba(254,249,195,0.95)',
  },
  YellowSpin: {
    muzzle: 'YellowMuzzle',
    spriteSizePx: 20,
    spin: true,
    trailGradient: 'linear-gradient(90deg, rgba(254,240,138,0.55) 0%, rgba(250,204,21,0.18) 100%)',
    trailGlow: '0 0 10px rgba(234,179,8,0.55)',
    impactColor: '#fde047',
    impactGlow: '0 0 12px rgba(250,204,21,0.95)',
    impactRing: 'rgba(254,249,195,0.95)',
  },
};

const SOLDIER_BULLET_VARIANTS: Record<GameSettings['soldierType'], BulletObjectVariant[]> = {
  soldier1: ['YellowScale', 'YellowSpin'],
  soldier2: ['OrangeScale', 'OrangeSpin'],
  soldier3: ['YellowSpin', 'OrangeSpin', 'Grenade'],
  soldier4: ['OrangeScale', 'YellowScale', 'Grenade'],
};

const EXPLOSION_FRAME_COUNT = 11;

const BULLET_PROFILES: Record<GameSettings['soldierType'], BulletProfile> = {
  soldier1: {
    durationMs: 190,
    lengthPx: 24,
    thicknessPx: 4,
    gradient: 'linear-gradient(90deg, #ffffff 0%, #fde047 45%, #fb923c 100%)',
    glow: '0 0 8px rgba(251,191,36,0.95), 0 0 16px rgba(249,115,22,0.75)',
    muzzleGradient: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.95) 45%, rgba(249,115,22,0) 80%)',
    muzzleGlow: 'drop-shadow(0 0 10px rgba(251,191,36,0.75))',
    impactColor: '#fde047',
    impactGlow: '0 0 12px rgba(251,191,36,0.95)',
    impactRing: 'rgba(255,255,255,0.85)',
  },
  soldier2: {
    durationMs: 170,
    lengthPx: 28,
    thicknessPx: 5,
    gradient: 'linear-gradient(90deg, #e0f2fe 0%, #7dd3fc 45%, #2563eb 100%)',
    glow: '0 0 8px rgba(56,189,248,0.95), 0 0 18px rgba(37,99,235,0.75)',
    muzzleGradient: 'radial-gradient(circle, rgba(224,242,254,0.95) 0%, rgba(56,189,248,0.9) 45%, rgba(37,99,235,0) 80%)',
    muzzleGlow: 'drop-shadow(0 0 10px rgba(56,189,248,0.8))',
    impactColor: '#7dd3fc',
    impactGlow: '0 0 12px rgba(56,189,248,0.95)',
    impactRing: 'rgba(186,230,253,0.9)',
  },
  soldier3: {
    durationMs: 140,
    lengthPx: 32,
    thicknessPx: 3,
    gradient: 'linear-gradient(90deg, #ffe4e6 0%, #fb7185 50%, #be123c 100%)',
    glow: '0 0 10px rgba(244,63,94,0.95), 0 0 20px rgba(190,24,93,0.7)',
    muzzleGradient: 'radial-gradient(circle, rgba(255,228,230,0.95) 0%, rgba(244,63,94,0.9) 45%, rgba(190,24,93,0) 80%)',
    muzzleGlow: 'drop-shadow(0 0 10px rgba(244,63,94,0.8))',
    impactColor: '#fb7185',
    impactGlow: '0 0 12px rgba(244,63,94,0.95)',
    impactRing: 'rgba(255,228,230,0.9)',
  },
  soldier4: {
    durationMs: 210,
    lengthPx: 22,
    thicknessPx: 5,
    gradient: 'linear-gradient(90deg, #ecfccb 0%, #86efac 45%, #16a34a 100%)',
    glow: '0 0 8px rgba(74,222,128,0.95), 0 0 16px rgba(22,163,74,0.75)',
    muzzleGradient: 'radial-gradient(circle, rgba(236,252,203,0.95) 0%, rgba(74,222,128,0.9) 45%, rgba(22,163,74,0) 80%)',
    muzzleGlow: 'drop-shadow(0 0 10px rgba(74,222,128,0.8))',
    impactColor: '#86efac',
    impactGlow: '0 0 12px rgba(74,222,128,0.95)',
    impactRing: 'rgba(220,252,231,0.9)',
  },
};

export const SimpleEnhancedGame: React.FC<SimpleEnhancedGameProps> = ({ scene, onSceneChange, onPlayerHpChange }) => {
  const gameStore = useGameStore();
  const vocabStore = useVocabStore();
  const settingsStore = useSettingsStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();
  const selectedWordSetsKey = vocabStore.selectedWordSets.join('|');

  const [currentQuestion, setCurrentQuestion] = useState<VocabQuestion | null>(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [showResult, setShowResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);

  // Sprite states
  const [playerState, setPlayerState] = useState<'idle' | 'walking' | 'running' | 'melee' | 'shooting' | 'celebrating' | 'hurt'>('idle');
  const [playerShootStyle, setPlayerShootStyle] = useState<PlayerShootStyle>('base');
  // const [zombieStates, setZombieStates] = useState<('idle' | 'walking' | 'attacking' | 'dying' | 'dead')[]>([]);
  // const [spritesLoaded, setSpritesLoaded] = useState(false);


  // Background system with 5 backgrounds
  const backgrounds = [
    '/assets/backgrounds/bg1.png',
    '/assets/backgrounds/bg2.png',
    '/assets/backgrounds/bg3.png',
    '/assets/backgrounds/bg4.png',
    '/assets/backgrounds/bg5.png'
  ];
  const [currentBackground, setCurrentBackground] = useState<string>(() => {
    return backgrounds[Math.floor(Math.random() * backgrounds.length)];
  });
  const [useEmojisFallback] = useState(false); // Use sprites as default
  const [showInstructions, setShowInstructions] = useState(true);
  const [showWordSetsSelector, setShowWordSetsSelector] = useState(false);

  // Dynamic zombie management
  const [zombies, setZombies] = useState<Array<{
    id: string;
    position: number;
    targetPosition: number;
    state: 'idle' | 'walking' | 'attacking' | 'dying' | 'dead';
    variant: ZombieVariant;
    verticalOffset: number;
    deathDirection: 'left' | 'right';
    deathDepth: 'front' | 'back';
    deathTilt: number;
    deathSkid: number;
    deathDrop: number;
    deathPitch: number;
  }>>([]);
  const zombieIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const [bulletEffects, setBulletEffects] = useState<BulletEffect[]>([]);
  const [impactEffects, setImpactEffects] = useState<ImpactEffect[]>([]);
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [muzzleSpriteSrc, setMuzzleSpriteSrc] = useState<string | null>(null);
  const [isRecoiling, setIsRecoiling] = useState(false);
  const [screenShakeOffset, setScreenShakeOffset] = useState({ x: 0, y: 0 });
  const [playerHp, setPlayerHp] = useState(PLAYER_HP_MAX);
  const playerHpRef = useRef(PLAYER_HP_MAX);
  const projectileTimeoutsRef = useRef<number[]>([]);
  const shootRecoveryTimeoutRef = useRef<number | null>(null);
  const spawnTimeoutRef = useRef<number | null>(null);
  const multipleChoiceSolvedWordIdsRef = useRef<Set<string>>(new Set());

  // Use refs to store current values
  const currentQuestionRef = useRef(currentQuestion);
  const questionTimeRemainingRef = useRef(questionTimeRemaining);
  const zombiesRef = useRef(zombies);

  // Update refs when values change
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    questionTimeRemainingRef.current = questionTimeRemaining;
    zombiesRef.current = zombies;
    playerHpRef.current = playerHp;
  });

  useEffect(() => {
    onPlayerHpChange?.(playerHp, PLAYER_HP_MAX);
  }, [onPlayerHpChange, playerHp]);

  // Forward reference for handleTimeUp
  const handleTimeUpRef = useRef<() => void>(() => { });
  const generateQuestionRef = useRef<(() => VocabQuestion) | null>(null);

  // Randomly select from all available zombie variants.
  const getRandomZombieVariant = useCallback((): ZombieVariant => {
    return ZOMBIE_VARIANTS_POOL[Math.floor(Math.random() * ZOMBIE_VARIANTS_POOL.length)];
  }, []);

  const getRandomDeathPose = useCallback(() => {
    const deathDirection: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    const deathDepth: 'front' | 'back' = Math.random() > 0.5 ? 'front' : 'back';
    const tiltMagnitude = 12 + Math.random() * 12;
    const deathTilt = deathDirection === 'left' ? -tiltMagnitude : tiltMagnitude;
    const deathSkid = 9 + Math.random() * 12;
    const deathDrop = deathDepth === 'front' ? 10 + Math.random() * 8 : 4 + Math.random() * 6;
    const deathPitch = deathDepth === 'front'
      ? -(14 + Math.random() * 14)
      : 8 + Math.random() * 12;

    return {
      deathDirection,
      deathDepth,
      deathTilt,
      deathSkid,
      deathDrop,
      deathPitch
    };
  }, []);

  const clearMultipleChoiceProgress = useCallback(() => {
    multipleChoiceSolvedWordIdsRef.current.clear();
  }, []);

  const rollRandomSoldierIfEnabled = useCallback((forceDifferent = true) => {
    const store = useSettingsStore.getState();
    if (!store.randomizeSoldier) return;

    const pool = forceDifferent
      ? SOLDIER_TYPES.filter((type) => type !== store.soldierType)
      : SOLDIER_TYPES;

    const nextSoldier = pool[Math.floor(Math.random() * pool.length)];
    if (nextSoldier) {
      store.setSoldierType(nextSoldier);
    }
  }, []);

  const getZombieSpeedMultiplier = useCallback(() => {
    const levelBonus = Math.min(0.9, (gameStore.level - 1) * 0.12); // Level 2+ feels noticeably faster
    const difficultyMultiplier = DIFFICULTY_SPEED_MULTIPLIER[settingsStore.difficulty];
    return (1 + levelBonus) * difficultyMultiplier;
  }, [gameStore.level, settingsStore.difficulty]);

  const getZombieSpawnDelayMs = useCallback(() => {
    const levelReduction = Math.min(2000, (gameStore.level - 1) * 140);
    const difficultyOffset = DIFFICULTY_SPAWN_OFFSET_MS[settingsStore.difficulty];
    const minDelay = Math.max(1600, 3500 - levelReduction + difficultyOffset);
    const maxDelay = Math.max(minDelay + 500, 4500 - levelReduction + difficultyOffset);
    return minDelay + Math.random() * (maxDelay - minDelay);
  }, [gameStore.level, settingsStore.difficulty]);

  const getZombieAttackDamage = useCallback(() => {
    return ZOMBIE_ATTACK_DAMAGE[settingsStore.difficulty];
  }, [settingsStore.difficulty]);

  const getCombatDistanceThresholds = useCallback(() => {
    const speedMultiplier = getZombieSpeedMultiplier();
    const speedDelta = Math.max(-0.15, Math.min(0.95, speedMultiplier - 1));
    const difficultyBias = settingsStore.difficulty === 'easy'
      ? -1
      : settingsStore.difficulty === 'hard'
        ? 2
        : 0;

    const melee = Math.max(8, Math.round(11 + speedDelta * 6 + difficultyBias));
    const running = Math.max(melee + 10, Math.round(33 + speedDelta * 12 + difficultyBias * 2));
    const walking = Math.max(running + 12, Math.round(56 + speedDelta * 16 + difficultyBias * 2.5));

    return {
      melee,
      running,
      walking,
    };
  }, [getZombieSpeedMultiplier, settingsStore.difficulty]);

  const clearSpawnTimeout = useCallback(() => {
    if (spawnTimeoutRef.current !== null) {
      window.clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
  }, []);

  const clearShootRecoveryTimeout = useCallback(() => {
    if (shootRecoveryTimeoutRef.current !== null) {
      window.clearTimeout(shootRecoveryTimeoutRef.current);
      shootRecoveryTimeoutRef.current = null;
    }
  }, []);

  const resetPlayerHp = useCallback(() => {
    playerHpRef.current = PLAYER_HP_MAX;
    setPlayerHp(PLAYER_HP_MAX);
  }, []);

  const applyZombieDamage = useCallback((damage: number) => {
    const nextHp = Math.max(0, playerHpRef.current - damage);
    playerHpRef.current = nextHp;
    setPlayerHp(nextHp);
    return nextHp;
  }, []);

  const scheduleProjectileTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      projectileTimeoutsRef.current = projectileTimeoutsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);
    projectileTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearProjectileTimeouts = useCallback(() => {
    projectileTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    projectileTimeoutsRef.current = [];
  }, []);

  const triggerScreenShake = useCallback((intensityPx: number, durationMs: number) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setScreenShakeOffset({ x: 0, y: 0 });
      return;
    }

    const stepMs = 24;
    const totalSteps = Math.max(4, Math.floor(durationMs / stepMs));

    for (let step = 0; step < totalSteps; step += 1) {
      scheduleProjectileTimeout(() => {
        const falloff = 1 - step / totalSteps;
        const spread = Math.max(0.4, falloff) * intensityPx;
        setScreenShakeOffset({
          x: (Math.random() * 2 - 1) * spread,
          y: (Math.random() * 2 - 1) * spread * 0.65,
        });
      }, step * stepMs);
    }

    scheduleProjectileTimeout(() => {
      setScreenShakeOffset({ x: 0, y: 0 });
    }, durationMs + 30);
  }, [scheduleProjectileTimeout]);

  const returnPlayerToReady = useCallback(() => {
    clearShootRecoveryTimeout();
    setPlayerState('idle');
    setPlayerShootStyle('base');
  }, [clearShootRecoveryTimeout]);

  // Function to spawn new zombie
  const spawnZombie = useCallback(() => {
    // Generate unique ID using timestamp and counter to prevent duplicates
    const uniqueId = `zombie-${Date.now()}-${zombieIdRef.current++}`;
    const deathPose = getRandomDeathPose();
    const newZombie = {
      id: uniqueId,
      position: 80 + Math.random() * 15, // Random start position between 80-95% (within screen bounds)
      targetPosition: 0 + Math.random() * 3, // Walk right to player position (0-3%)
      state: 'walking' as const,
      variant: getRandomZombieVariant(),
      verticalOffset: -2 + Math.random() * 4, // Keep lane depth subtle so feet stay on the same ground line
      ...deathPose
    };

    setZombies(prev => [...prev, newZombie]);
  }, [getRandomDeathPose, getRandomZombieVariant]);

  const removeLifeAndGetRemainingLives = useCallback(() => {
    useGameStore.getState().removeLive();
    return useGameStore.getState().lives;
  }, []);

  const clearActiveQuestion = useCallback(() => {
    currentQuestionRef.current = null;
    setCurrentQuestion(null);
  }, []);

  const queueNextQuestion = useCallback((delayMs = 0) => {
    const startQuestion = () => {
      const questionFactory = generateQuestionRef.current;
      if (!questionFactory) return;

      const nextQuestion = questionFactory();
      currentQuestionRef.current = nextQuestion;
      setCurrentQuestion(nextQuestion);
      setQuestionTimeRemaining(nextQuestion.timeLimit);
    };

    if (delayMs > 0) {
      setTimeout(startQuestion, delayMs);
      return;
    }

    startQuestion();
  }, []);

  const activeBulletProfile = BULLET_PROFILES[settingsStore.soldierType];

  const fireBulletAtZombie = useCallback((target: { position: number; verticalOffset: number }) => {
    const profile = BULLET_PROFILES[settingsStore.soldierType];
    const bulletId = `bullet-${Date.now()}-${effectIdRef.current++}`;
    const impactId = `impact-${Date.now()}-${effectIdRef.current++}`;
    const durationMs = profile.durationMs;
    const padFrame = (frame: number) => frame.toString().padStart(3, '0');
    const bulletVariants = SOLDIER_BULLET_VARIANTS[settingsStore.soldierType];
    const bulletVariant = bulletVariants[Math.floor(Math.random() * bulletVariants.length)];
    const bulletConfig = BULLET_OBJECT_CONFIGS[bulletVariant];
    const bulletFrame = Math.floor(Math.random() * 10);
    const bulletSpriteSrc = `/assets/characters/soldier/objects/Bullet/${bulletVariant}__${padFrame(bulletFrame)}.png`;
    const muzzleFrame = Math.floor(Math.random() * 10);
    const nextMuzzleSpriteSrc = `/assets/characters/soldier/objects/Muzzle/${bulletConfig.muzzle}__${padFrame(muzzleFrame)}.png`;
    const impactGlow = bulletConfig.impactGlow ?? profile.impactGlow;
    const trailGradient = bulletConfig.trailGradient ?? profile.gradient;
    const trailGlow = bulletConfig.trailGlow ?? profile.glow;
    const explosionVariant: ExplosionObjectVariant = bulletVariant === 'Grenade' ? 'GroundExplo' : 'MidAirExplo';
    const explosionFrameDurationMs = bulletVariant === 'Grenade' ? 42 : 34;
    const explosionFrameSources = Array.from({ length: EXPLOSION_FRAME_COUNT }, (_, frame) =>
      `/assets/characters/soldier/objects/Explosion/${explosionVariant}__${padFrame(frame)}.png`
    );

    const startX = 14;
    const startY = SOLDIER_BULLET_START_Y_PCT[settingsStore.soldierType];
    const endX = Math.min(95, target.position + 2.5);
    const endY = Math.max(34, 55 - target.verticalOffset * 0.2);
    const distanceRatio = Math.max(0, Math.min(1, (endX - 8) / 87)); // 0 = close to player, 1 = far
    const perspectiveScale = 0.9 + (1 - distanceRatio) * 0.35;
    const baseExplosionSize = bulletVariant === 'Grenade' ? 92 : 72;
    const explosionSizePx = Math.round(baseExplosionSize * perspectiveScale);
    const shakeIntensity = (bulletVariant === 'Grenade' ? 7.0 : 4.2) * (0.85 + (1 - distanceRatio) * 0.35);
    const shakeDurationMs = bulletVariant === 'Grenade' ? 220 : 170;

    setMuzzleSpriteSrc(nextMuzzleSpriteSrc);
    setShowMuzzleFlash(true);
    scheduleProjectileTimeout(() => {
      setShowMuzzleFlash(false);
      setMuzzleSpriteSrc(null);
    }, 90);
    setIsRecoiling(true);
    scheduleProjectileTimeout(() => setIsRecoiling(false), 110);

    setBulletEffects((prev) => [
      ...prev,
      {
        id: bulletId,
        startX,
        startY,
        endX,
        endY,
        durationMs,
        lengthPx: profile.lengthPx,
        thicknessPx: profile.thicknessPx,
        gradient: trailGradient,
        glow: trailGlow,
        impactGlow,
        impactColor: profile.impactColor,
        impactRing: profile.impactRing,
        spriteSrc: bulletSpriteSrc,
        spriteSizePx: bulletConfig.spriteSizePx,
        spriteRotateDeg: Math.floor(Math.random() * 360),
        spriteSpin: bulletConfig.spin,
      }
    ]);

    scheduleProjectileTimeout(() => {
      setImpactEffects((prev) => [
        ...prev,
        {
          id: impactId,
          x: endX,
          y: endY,
          frameSources: explosionFrameSources,
          frameIndex: 0,
          sizePx: explosionSizePx,
          glow: impactGlow,
        }
      ]);
      triggerScreenShake(shakeIntensity, shakeDurationMs);

      explosionFrameSources.forEach((_, frameIndex) => {
        if (frameIndex === 0) return;
        scheduleProjectileTimeout(() => {
          setImpactEffects((prev) => prev.map((impact) =>
            impact.id === impactId
              ? { ...impact, frameIndex }
              : impact
          ));
        }, frameIndex * explosionFrameDurationMs);
      });

      scheduleProjectileTimeout(() => {
        setImpactEffects((prev) => prev.filter((impact) => impact.id !== impactId));
      }, explosionFrameSources.length * explosionFrameDurationMs + 40);
    }, Math.max(0, durationMs - 20));

    scheduleProjectileTimeout(() => {
      setBulletEffects((prev) => prev.filter((bullet) => bullet.id !== bulletId));
    }, durationMs + 40);
  }, [scheduleProjectileTimeout, settingsStore.soldierType, triggerScreenShake]);

  const generateQuestion = useCallback((): VocabQuestion => {
    const words = vocabStore.getActiveWords();

    if (words.length === 0) {
      // Fallback words if none available
      const fallbackWords = [
        { id: '1', word: 'hello', meaning: 'สวัสดี', difficulty: 1 },
        { id: '2', word: 'goodbye', meaning: 'ลาก่อน', difficulty: 1 },
        { id: '3', word: 'thank you', meaning: 'ขอบคุณ', difficulty: 1 },
        { id: '4', word: 'yes', meaning: 'ใช่', difficulty: 1 }
      ];
      words.push(...fallbackWords);
    }

    // Determine language direction
    const direction = settingsStore.languageDirection === 'mixed'
      ? (Math.random() > 0.5 ? 'en-to-th' : 'th-to-en')
      : settingsStore.languageDirection;

    // Determine question type
    const availableTypes = Object.entries(settingsStore.questionTypes)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type as 'multipleChoice' | 'typing' | 'spelling' | 'letterArrangement');

    const questionType = availableTypes.length > 0
      ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
      : 'multipleChoice';

    let candidateWords = words;
    if (questionType === 'multipleChoice') {
      const unseenWords = words.filter(word => !multipleChoiceSolvedWordIdsRef.current.has(word.id));
      if (unseenWords.length > 0) {
        candidateWords = unseenWords;
      }
    }

    const word = candidateWords[Math.floor(Math.random() * candidateWords.length)];

    // Generate question based on direction and type
    const questionWord = direction === 'en-to-th' ? word.word : word.meaning;
    const correctAnswer = direction === 'en-to-th' ? word.meaning : word.word;

    let options: string[] = [];
    let scrambledLetters: string[] = [];

    if (questionType === 'multipleChoice') {
      // Generate wrong options from the same direction
      const wrongOptions = words
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => direction === 'en-to-th' ? w.meaning : w.word);

      // Ensure we have enough options
      while (wrongOptions.length < 3) {
        wrongOptions.push(direction === 'en-to-th'
          ? 'ตัวเลือกผิด ' + (wrongOptions.length + 1)
          : 'Wrong ' + (wrongOptions.length + 1)
        );
      }

      options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
    } else if (questionType === 'letterArrangement') {
      // Scramble letters for letter arrangement mode
      const letters = correctAnswer.split('');
      scrambledLetters = [...letters].sort(() => Math.random() - 0.5);
    }

    return {
      id: crypto.randomUUID(),
      type: questionType,
      word: { ...word, word: questionWord }, // Show the word in question direction
      options,
      correctAnswer,
      timeLimit: 10000, // 10 seconds
      direction,
      scrambledLetters
    };
  }, [settingsStore.languageDirection, settingsStore.questionTypes, vocabStore]);

  useEffect(() => {
    generateQuestionRef.current = generateQuestion;
  }, [generateQuestion]);

  useEffect(() => {
    clearMultipleChoiceProgress();
  }, [clearMultipleChoiceProgress, selectedWordSetsKey, vocabStore.customWords.length]);

  useEffect(() => {
    return () => {
      clearSpawnTimeout();
      clearProjectileTimeouts();
      setScreenShakeOffset({ x: 0, y: 0 });
      resetPlayerHp();
      clearShootRecoveryTimeout();
      clearMultipleChoiceProgress();
    };
  }, [clearMultipleChoiceProgress, clearProjectileTimeouts, clearShootRecoveryTimeout, clearSpawnTimeout, resetPlayerHp]);

  useEffect(() => {
    if (scene !== 'game') {
      clearSpawnTimeout();
      clearProjectileTimeouts();
      setScreenShakeOffset({ x: 0, y: 0 });
      resetPlayerHp();
      clearMultipleChoiceProgress();
      setBulletEffects([]);
      setImpactEffects([]);
      setShowMuzzleFlash(false);
      setMuzzleSpriteSrc(null);
      setIsRecoiling(false);
      returnPlayerToReady();
    }
  }, [clearMultipleChoiceProgress, clearProjectileTimeouts, clearSpawnTimeout, resetPlayerHp, returnPlayerToReady, scene]);

  // Zombie spawning system - one by one spawning
  useEffect(() => {
    if (!currentQuestion) {
      clearSpawnTimeout();
      return;
    }

    // Spawn first zombie when question starts
    if (zombiesRef.current.length === 0) {
      spawnZombie();
    }

    const scheduleSpawn = () => {
      const delayMs = getZombieSpawnDelayMs();
      spawnTimeoutRef.current = window.setTimeout(() => {
        const currentQ = currentQuestionRef.current;
        const currentZombies = zombiesRef.current;

        if (currentQ && currentZombies.length < 5) {
          spawnZombie();
        }

        // Keep scheduling while a question is still active
        if (currentQuestionRef.current) {
          scheduleSpawn();
        }
      }, delayMs);
    };

    scheduleSpawn();

    return () => {
      clearSpawnTimeout();
    };
  }, [clearSpawnTimeout, currentQuestion, getZombieSpawnDelayMs, spawnZombie]);

  // Zombie movement animation
  useEffect(() => {
    if (!currentQuestion) return;

    const interval = setInterval(() => {
      const currentQ = currentQuestionRef.current;
      const timeRemaining = questionTimeRemainingRef.current;
      const speedMultiplier = getZombieSpeedMultiplier();

      setZombies(prevZombies =>
        prevZombies.map(zombie => {
          // Only move if zombie is walking and question is active
          if (zombie.state === 'walking' && currentQ && zombie.position > zombie.targetPosition) {
            // Calculate speed based on remaining time - zombies gradually speed up
            const questionDuration = Math.max(1000, currentQ.timeLimit || 10000);
            const timeRatio = Math.max(0, Math.min(1, timeRemaining / questionDuration));
            const baseSpeed = 0.2;
            const urgencySpeed = Math.max(0.15, 0.4 * (1 - timeRatio));
            const speed = (baseSpeed + urgencySpeed) * speedMultiplier;

            const newPos = Math.max(zombie.targetPosition, zombie.position - speed);

            // Zombie reached player
            if (newPos <= 5) {
              scheduleProjectileTimeout(() => {
                if (!currentQuestionRef.current) return;

                const damage = getZombieAttackDamage();
                const nextHp = applyZombieDamage(damage);
                clearShootRecoveryTimeout();
                setPlayerShootStyle('base');
                setPlayerState('hurt');
                triggerScreenShake(3.2 + damage * 0.045, 160);

                scheduleProjectileTimeout(() => {
                  setZombies(prev => prev.filter(z => z.id !== zombie.id));
                }, 420);

                if (nextHp <= 0) {
                  const remainingLives = removeLifeAndGetRemainingLives();
                  resetPlayerHp();
                  setShowResult({ correct: false, points: 0 });
                  clearActiveQuestion();

                  scheduleProjectileTimeout(() => {
                    setShowResult(null);
                    setPlayerState('idle');
                    if (remainingLives > 0) {
                      queueNextQuestion();
                    }
                  }, 1500);
                  return;
                }

                scheduleProjectileTimeout(() => {
                  setPlayerState((previous) => (previous === 'hurt' ? 'idle' : previous));
                }, 360);
              }, 600);

              return { ...zombie, position: newPos, state: 'attacking' as const };
            }

            return { ...zombie, position: newPos };
          }
          return zombie;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [applyZombieDamage, clearActiveQuestion, clearShootRecoveryTimeout, currentQuestion, getZombieAttackDamage, getZombieSpeedMultiplier, queueNextQuestion, removeLifeAndGetRemainingLives, resetPlayerHp, scheduleProjectileTimeout, triggerScreenShake]);

  useEffect(() => {
    if (!currentQuestion || showResult || gameStore.lives <= 0) return;
    if (playerState === 'shooting' || playerState === 'hurt' || playerState === 'celebrating') return;

    const activeFrontline = zombies.filter((zombie) => zombie.state === 'walking' || zombie.state === 'attacking');
    if (activeFrontline.length === 0) {
      if (playerState !== 'idle') setPlayerState('idle');
      return;
    }

    const nearestDistance = activeFrontline.reduce(
      (closest, zombie) => Math.min(closest, zombie.position),
      100
    );
    const thresholds = getCombatDistanceThresholds();

    if (nearestDistance <= thresholds.melee) {
      if (playerState !== 'melee') setPlayerState('melee');
      return;
    }

    if (nearestDistance <= thresholds.running) {
      if (playerState !== 'running') setPlayerState('running');
      return;
    }

    if (nearestDistance <= thresholds.walking) {
      if (playerState !== 'walking') setPlayerState('walking');
      return;
    }

    if (playerState !== 'idle') setPlayerState('idle');
  }, [currentQuestion, gameStore.lives, getCombatDistanceThresholds, playerState, showResult, zombies]);

  // Question timer
  useEffect(() => {
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        const next = prev - 100;
        if (next <= 0) {
          handleTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentQuestion]);

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;

    const correct = answer === currentQuestion.correctAnswer;
    const points = correct ? 100 * gameStore.level : 0;

    if (correct) {
      gameStore.addScore(points);

      if (currentQuestion.type === 'multipleChoice') {
        multipleChoiceSolvedWordIdsRef.current.add(currentQuestion.word.id);

        const activeWordIds = Array.from(
          new Set(vocabStore.getActiveWords().map((word) => word.id))
        );
        const solvedCount = activeWordIds.filter((id) => multipleChoiceSolvedWordIdsRef.current.has(id)).length;

        if (activeWordIds.length > 0 && solvedCount >= activeWordIds.length) {
          clearMultipleChoiceProgress();

          const runtimeGameStore = useGameStore.getState();
          const nextLevel = Math.max(2, runtimeGameStore.level + 1);
          runtimeGameStore.setLevel(nextLevel);

          // Level-up moment: force a stage refresh and harder pace.
          setCurrentBackground((prev) => {
            const candidates = backgrounds.filter((bg) => bg !== prev);
            return candidates[Math.floor(Math.random() * candidates.length)] ?? prev;
          });

          rollRandomSoldierIfEnabled(true);
        }
      }

      audioSystem.playCorrectAnswerSound();

      const targetZombie = zombies
        .filter((zombie) => zombie.state === 'walking' || zombie.state === 'attacking')
        .sort((a, b) => a.position - b.position)[0];

      if (targetZombie) {
        const thresholds = getCombatDistanceThresholds();
        const meleeReach = thresholds.melee + (targetZombie.state === 'attacking' ? 2.5 : 0);

        if (targetZombie.position <= meleeReach) {
          clearShootRecoveryTimeout();
          setPlayerShootStyle('base');
          setPlayerState('melee');
          triggerScreenShake(3.6, 150);

          const deathPose = getRandomDeathPose();
          scheduleProjectileTimeout(() => {
            setZombies(prev => prev.map(z =>
              z.id === targetZombie.id
                ? { ...z, state: 'dying', ...deathPose }
                : z
            ));
          }, 140);
        } else {
          // Ranged attack flow.
          audioSystem.playShootSound();
          clearShootRecoveryTimeout();
          setPlayerShootStyle('base');
          setPlayerState('shooting');
          fireBulletAtZombie(targetZombie);

          const deathPose = getRandomDeathPose();
          scheduleProjectileTimeout(() => {
            setZombies(prev => prev.map(z =>
              z.id === targetZombie.id
                ? { ...z, state: 'dying', ...deathPose }
                : z
            ));
          }, 230);
        }
      }

      // Generate next question immediately - single state update
      if (useGameStore.getState().lives > 0) {
        queueNextQuestion();
      } else {
        clearActiveQuestion();
      }
    } else {
      const remainingLives = removeLifeAndGetRemainingLives();
      resetPlayerHp();

      // Play wrong answer sound
      audioSystem.playWrongAnswerSound();

      // Batch all wrong answer state updates
      clearShootRecoveryTimeout();
      setPlayerShootStyle('base');
      setPlayerState('hurt');
      setZombies(prev => prev.map(z => z.state === 'attacking' ? { ...z, state: 'walking' } : z));
      setShowResult({ correct, points });
      clearActiveQuestion();

      // Handle wrong answer recovery
      setTimeout(() => {
        setShowResult(null);
        setPlayerState('idle');
        if (remainingLives > 0) {
          queueNextQuestion();
        }
      }, 1500);
    }
  };

  const handleTimeUp = useCallback(() => {
    if (!currentQuestionRef.current) return;

    // Lose life and spawn new zombie
    const remainingLives = removeLifeAndGetRemainingLives();
    resetPlayerHp();
    clearShootRecoveryTimeout();
    setPlayerShootStyle('base');
    setPlayerState('hurt');
    spawnZombie();

    setShowResult({ correct: false, points: 0 });
    clearActiveQuestion();

    // Reset after showing result
    setTimeout(() => {
      setShowResult(null);
      setPlayerState('idle');
      if (remainingLives > 0) {
        queueNextQuestion();
      }
    }, 1500);
  }, [clearActiveQuestion, clearShootRecoveryTimeout, queueNextQuestion, removeLifeAndGetRemainingLives, resetPlayerHp, spawnZombie]);

  // Assign to ref after declaration
  handleTimeUpRef.current = handleTimeUp;

  const handlePlayerAnimationComplete = (state: string) => {
    if (state === 'shooting-complete') {
      // Return to idle right after shooting so the idle loop is visible again.
      clearShootRecoveryTimeout();
      shootRecoveryTimeoutRef.current = window.setTimeout(() => {
        shootRecoveryTimeoutRef.current = null;
        setPlayerState((previous) => (previous === 'shooting' ? 'idle' : previous));
        setPlayerShootStyle('base');
      }, 35);
      return;
    } else if (state === 'celebrating-complete' || state === 'hurt-complete') {
      setPlayerState('idle');
    }
  };

  const handleZombieAnimationComplete = (zombieId: string, state: string) => {
    if (state === 'death-complete') {
      setZombies(prev => prev.map(z =>
        z.id === zombieId ? { ...z, state: 'dead' } : z
      ));
      const corpseDurationMs = 1400 + Math.random() * 900;
      setTimeout(() => {
        setZombies(prev => prev.filter(z => z.id !== zombieId));
      }, corpseDurationMs); // Keep corpse visible for a moment before removing
    } else if (state === 'attack-complete' || state === 'attacking-complete') {
      // After attack animation, resume walking if still alive
      setZombies(prev => prev.map(z => {
        if (z.id === zombieId) {
          return { ...z, state: 'walking' };
        }
        return z;
      }));
    }
  };

  if (scene !== 'game') {
    return null;
  }

  // Tuning knobs for lane alignment:
  // Increase px => move sprite up, decrease px => move sprite down.
  const playerGroundBottom = `calc(24% + ${SOLDIER_GROUND_LANE_OFFSET_PX[settingsStore.soldierType]}px)`;
  const zombieGroundBottom = `calc(24% + ${ZOMBIE_GROUND_LANE_OFFSET_PX}px)`;
  const muzzleBottom = SOLDIER_MUZZLE_BOTTOM_PCT[settingsStore.soldierType];

  return (
    <div className="relative h-full flex flex-col">
      {/* Simple Game Canvas */}
      <div
        className="relative flex-1 min-h-0 rounded-xl overflow-hidden max-w-6xl mx-auto w-full"
        style={{
          transform: `translate3d(${screenShakeOffset.x.toFixed(2)}px, ${screenShakeOffset.y.toFixed(2)}px, 0)`,
          willChange: 'transform',
        }}
      >

        {/* Background Scene */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main Graveyard Background */}
          <img
            src={currentBackground}
            alt="graveyard background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: 'center 78%'
            }}
          />

        </div>

        {/* Projectile effects layer */}
        <div className="absolute inset-0 pointer-events-none z-[35] overflow-hidden">
          {showMuzzleFlash && (
            <div
              className={`muzzle-flash ${muzzleSpriteSrc ? 'muzzle-flash-sprite' : ''}`}
              style={{
                left: 'clamp(58px, 12vw, 128px)',
                bottom: muzzleBottom,
                '--muzzle-gradient': activeBulletProfile.muzzleGradient,
                '--muzzle-glow': activeBulletProfile.muzzleGlow,
              } as React.CSSProperties}
            >
              {muzzleSpriteSrc && (
                <img
                  src={muzzleSpriteSrc}
                  alt=""
                  className="muzzle-sprite"
                  draggable={false}
                />
              )}
            </div>
          )}

          {bulletEffects.map((bullet) => (
            <div
              key={bullet.id}
              className="bullet-tracer"
              style={{
                '--bullet-start-x': `${bullet.startX}%`,
                '--bullet-start-y': `${bullet.startY}%`,
                '--bullet-end-x': `${bullet.endX}%`,
                '--bullet-end-y': `${bullet.endY}%`,
                '--bullet-duration': `${bullet.durationMs}ms`,
                '--bullet-length': `${bullet.lengthPx}px`,
                '--bullet-thickness': `${bullet.thicknessPx}px`,
                '--bullet-gradient': bullet.gradient,
                '--bullet-glow': bullet.glow,
                ...({
                  ['--bullet-sprite-size']: `${bullet.spriteSizePx}px`,
                  ['--bullet-sprite-rotation']: `${bullet.spriteRotateDeg}deg`,
                }),
              } as React.CSSProperties}
            >
              <img
                src={bullet.spriteSrc}
                alt=""
                className={`bullet-sprite ${bullet.spriteSpin ? 'bullet-sprite-spin' : ''}`}
                draggable={false}
              />
            </div>
          ))}

          {impactEffects.map((impact) => (
            <div
              key={impact.id}
              className="bullet-impact-explosion"
              style={{
                left: `${impact.x}%`,
                top: `${impact.y}%`,
                '--impact-size': `${impact.sizePx}px`,
                '--impact-glow': impact.glow,
              } as React.CSSProperties}
            >
              <img
                src={impact.frameSources[impact.frameIndex]}
                alt=""
                className="bullet-impact-sprite"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Player positioned at left side - aligned with ground line */}
        <div
          className="absolute left-4 sm:left-8 z-30"
          style={{
            position: 'absolute',
            bottom: playerGroundBottom,
            left: 'clamp(16px, 4vw, 32px)',
            zIndex: 30,
            transform: `translateX(${isRecoiling ? '-12px' : '0px'}) translateY(var(--player-ground-nudge)) scale(var(--player-scale))`,
            transition: 'transform 95ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            '--player-scale': 'var(--mobile-portrait-player-scale, var(--mobile-landscape-player-scale, clamp(0.8, 3vw + 1.5rem, 1.8)))',
            transformOrigin: 'center bottom',
            filter: 'drop-shadow(0 8px 6px rgba(8,12,30,0.45))'
          } as React.CSSProperties}
        >
          {useEmojisFallback ? (
            <div className="text-2xl sm:text-4xl font-black text-white/90">PLAYER</div>
          ) : (
            <PlayerSprite
              x={0}
              y={0}
              scale={settingsStore.soldierType === 'soldier2' ? 2.5 : 2.0} // Scale back to normal for Bravo
              state={playerState}
              shootingStyle={playerShootStyle}
              flipX={false}
              onAnimationComplete={handlePlayerAnimationComplete}
            />
          )}
        </div>

        {/* Zombies positioned based on their movement */}
        {zombies.map((zombie) => (
          <div
            key={zombie.id}
            className="absolute cursor-pointer hover:scale-110 transform transition-all duration-200 select-none z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (zombie.state !== 'dying' && zombie.state !== 'dead') {
                if (!currentQuestion) {
                  const question = generateQuestion();
                  currentQuestionRef.current = question;
                  setCurrentQuestion(question);
                  setQuestionTimeRemaining(question.timeLimit);
                  setShowResult(null);
                }
              }
            }}
            title={zombie.state === 'dead' ? 'Defeated!' : zombie.state === 'dying' ? 'Dying...' : 'Click to fight!'}
            style={{
              left: `${zombie.position}%`, // Use percentage positioning
              bottom: zombieGroundBottom,
              pointerEvents: zombie.state === 'dying' || zombie.state === 'dead' ? 'none' : 'auto',
              userSelect: 'none',
              opacity: zombie.state === 'dead' ? 0.58 : zombie.state === 'dying' ? 0.9 : 1,
              // Keep sprite death frames as main animation, add subtle random body direction/depth for variety
              transform: zombie.state === 'dying'
                ? `perspective(900px) translateX(${((zombie.deathDirection === 'left' ? -1 : 1) * zombie.deathSkid * 0.52).toFixed(1)}px) translateY(calc(var(--zombie-ground-nudge) + ${(zombie.verticalOffset + zombie.deathDrop * 0.35).toFixed(1)}px)) rotate(${(zombie.deathTilt * 0.66).toFixed(1)}deg) rotateX(${(zombie.deathPitch * 0.72).toFixed(1)}deg) scale(${zombie.deathDepth === 'front' ? 1.03 : 0.98}) scale(var(--zombie-scale))`
                : zombie.state === 'dead'
                  ? `perspective(900px) translateX(${((zombie.deathDirection === 'left' ? -1 : 1) * zombie.deathSkid).toFixed(1)}px) translateY(calc(var(--zombie-ground-nudge) + ${(zombie.verticalOffset + zombie.deathDrop).toFixed(1)}px)) rotate(${zombie.deathTilt.toFixed(1)}deg) rotateX(${zombie.deathPitch.toFixed(1)}deg) scale(${zombie.deathDepth === 'front' ? 1.06 : 0.94}) scale(var(--zombie-scale))`
                  : `translateY(calc(var(--zombie-ground-nudge) + ${zombie.verticalOffset.toFixed(1)}px)) scale(var(--zombie-scale))`,
              filter: zombie.state === 'dead'
                ? `${zombie.deathDepth === 'front' ? 'brightness(0.74) saturate(0.8)' : 'brightness(0.88) saturate(0.92)'} drop-shadow(0 8px 6px rgba(5,7,18,0.5))`
                : 'drop-shadow(0 8px 6px rgba(5,7,18,0.42))',
              transformOrigin: 'center bottom', // Scale from bottom center point
              transition: zombie.state === 'walking'
                ? 'none'
                : zombie.state === 'dying'
                  ? 'transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 520ms ease'
                  : 'transform 340ms ease, opacity 520ms ease, filter 420ms ease', // Smooth transitions for non-walking states
              // CSS custom properties
              ...({ ['--zombie-scale']: 'var(--mobile-portrait-zombie-scale, var(--mobile-landscape-zombie-scale, clamp(0.4, 1.5vw + 0.5rem, 0.8)))' })
            } as React.CSSProperties}
          >
            {useEmojisFallback ? (
              <div className={`text-3xl sm:text-6xl ${zombie.state === 'walking' ? 'zombie-walk-bob' : ''}`}>
                {zombie.state === 'dead'
                  ? 'X'
                  : zombie.state === 'dying'
                    ? 'KO'
                    : zombie.state === 'attacking'
                      ? 'ATK'
                      : zombie.state === 'walking'
                        ? 'WALK'
                        : 'Z'}
              </div>
            ) : (
              <div className={zombie.state === 'walking' ? 'zombie-walk-bob' : ''}>
                <ZombieSprite
                  x={0}
                  y={0}
                  scale={1.8} // Reduced base scale, now handled by CSS transform
                  state={zombie.state}
                  variant={zombie.variant} // Pass the random variant
                  flipX={true} // Flip horizontally to face forward
                  onAnimationComplete={(animState) => handleZombieAnimationComplete(zombie.id, animState)}
                />
              </div>
            )}
          </div>
        ))}


        {/* Combat Instructions */}
        {!currentQuestion && !showResult && showInstructions && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 p-2 sm:p-3"
            data-testid="combat-instructions"
          >
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-[#d9c5a6]/55 bg-gradient-to-b from-[#fffaf1] via-[#f3e8d3] to-[#e6d6bc] p-3 text-[#4a3a28] shadow-[0_22px_45px_rgba(0,0,0,0.55)] sm:max-w-2xl sm:p-5">
              <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.36),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.16),transparent_40%)]" />

              <div className="game-scroll relative max-h-[82vh] space-y-3 overflow-y-auto rounded-2xl border border-[#eadfcb] bg-[#fffcf7]/96 p-3 text-[#4a3a28] sm:space-y-4 sm:p-4">
                <div className="text-center">
                  <h3 className="text-xl font-black uppercase tracking-wide sm:text-3xl">Ready for Battle</h3>
                  <p className="mt-1 text-sm text-[#6b5843] sm:text-base">
                    Click any zombie to begin combat.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#efe5d3] bg-white/90 p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#4a3a28] sm:text-sm">
                    Language Mode
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_MODE_OPTIONS.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => settingsStore.setLanguageDirection(value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-black transition sm:text-sm ${settingsStore.languageDirection === value
                          ? 'border-[#2f5f28] bg-[#5a8f2f] text-white shadow-md'
                          : 'border-[#dcc9a9] bg-[#f8efe1] text-[#5d4b38] hover:bg-[#f2e4cf]'
                          }`}
                        title={desc}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#efe5d3] bg-white/90 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-[#4a3a28] sm:text-sm">
                      {t('wordSets')}
                    </p>
                    <GameButton variant="secondary" size="sm" onClick={() => setShowWordSetsSelector(true)}>
                      {t('selectSet')}
                    </GameButton>
                  </div>
                  <div className="text-xs font-semibold text-[#6b5843] sm:text-sm">
                    <p>{t('selectedSets')}: {vocabStore.selectedWordSets.length}</p>
                    <p>{t('wordCount')}: {vocabStore.getActiveWords().length}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#efe5d3] bg-white/90 p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#4a3a28] sm:text-sm">
                    Game Modes
                  </p>
                  <div className="space-y-2 text-sm text-[#4a3a28]">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f8efe1] px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={settingsStore.questionTypes.multipleChoice}
                        onChange={(e) =>
                          settingsStore.setQuestionTypes({
                            ...settingsStore.questionTypes,
                            multipleChoice: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-emerald-600"
                      />
                      <span className="font-semibold">Multiple Choice</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f8efe1] px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={settingsStore.questionTypes.letterArrangement}
                        onChange={(e) =>
                          settingsStore.setQuestionTypes({
                            ...settingsStore.questionTypes,
                            letterArrangement: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-emerald-600"
                      />
                      <span className="font-semibold">Letter Arrangement</span>
                    </label>
                  </div>
                </div>

                <p className="text-center text-xs font-semibold text-[#6b5843] sm:text-sm">
                  Answer vocabulary questions correctly to defeat zombies.
                </p>

                <GameButton
                  variant="primary"
                  size="lg"
                  className="mx-auto w-full max-w-[420px]"
                  onClick={() => {
                    setShowInstructions(false);
                    clearMultipleChoiceProgress();
                    clearProjectileTimeouts();
                    setScreenShakeOffset({ x: 0, y: 0 });
                    resetPlayerHp();
                    setZombies([]);
                    setBulletEffects([]);
                    setImpactEffects([]);
                    setShowMuzzleFlash(false);
                    setMuzzleSpriteSrc(null);
                    setIsRecoiling(false);
                    returnPlayerToReady();
                    setShowResult(null);
                    rollRandomSoldierIfEnabled(false);

                    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                    setCurrentBackground(randomBackground);

                    setTimeout(() => {
                      const newQuestion = generateQuestion();
                      currentQuestionRef.current = newQuestion;
                      setCurrentQuestion(newQuestion);
                      setQuestionTimeRemaining(newQuestion.timeLimit);
                    }, 50);
                  }}
                >
                  Start Playing
                </GameButton>
              </div>
            </div>
          </div>
        )}

        {/* Floating Settings Button when instructions are hidden */}
        {!currentQuestion && !showResult && !showInstructions && gameStore.lives > 0 && (
          <div className="absolute right-3 top-3 z-30 sm:right-4 sm:top-4">
            <GameButton variant="tertiary" size="sm" onClick={() => setShowInstructions(true)}>
              Options
            </GameButton>
          </div>
        )}

        {/* Result Display */}
        {showResult && (
          <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-black/50 p-3 sm:p-4">
            <div
              className={`relative w-full max-w-sm overflow-hidden rounded-3xl border-2 p-5 text-center shadow-[0_25px_45px_rgba(0,0,0,0.58)] sm:p-6 ${showResult.correct
                ? 'border-[#9dcf79] bg-gradient-to-b from-[#fffef9] via-[#f8f2e6] to-[#ecdfc7] text-[#3f5f2f]'
                : 'border-[#d79b8d] bg-gradient-to-b from-[#fffdf9] via-[#f7eee7] to-[#ecd9cf] text-[#6f3a2f]'
                }`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.35),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.18),transparent_42%)]" />
              <img
                src="/assets/ui/jungle/load_bar/bg.png"
                alt=""
                className="pointer-events-none absolute left-3 right-3 top-3 h-2 object-fill opacity-75"
                draggable={false}
              />
              <div className="relative">
                <div className="text-4xl font-black tracking-wide sm:text-5xl">
                  {showResult.correct ? 'WIN' : 'KO'}
                </div>
                <h3
                  className={`mt-2 text-xl font-black uppercase tracking-wide sm:text-2xl ${showResult.correct ? 'text-[#5c8a3f]' : 'text-[#b34f3e]'
                    }`}
                >
                  {showResult.correct ? 'Target Down' : 'Hit Taken'}
                </h3>
                {showResult.correct ? (
                  <p className="mt-3 text-base font-bold text-[#3d6e2e] sm:text-lg">
                    +{showResult.points} score
                  </p>
                ) : (
                  <p className="mt-3 text-base font-bold text-[#a14b3a] sm:text-lg">
                    You lost a life
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div> {/* End of Game Canvas */}

      {/* Question Panel - Docked below game canvas to avoid blocking gameplay */}
      {currentQuestion && (
        <div className="relative z-40 px-1 sm:px-2 md:px-3 pb-1 sm:pb-2">
          <QuestionPanel
            question={currentQuestion}
            timeRemaining={questionTimeRemaining}
            onAnswer={handleAnswer}
            disabled={false}
          />
        </div>
      )}

      {/* Game Over Check */}
      {gameStore.lives <= 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-black/80 p-3 sm:p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#d9c5a6] bg-gradient-to-b from-[#fffef9] via-[#f5ecdd] to-[#ead9bc] p-6 text-center text-[#4a3a28] shadow-[0_24px_48px_rgba(92,73,45,0.35)] sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_24%_0%,rgba(255,255,255,0.35),transparent_36%),radial-gradient(circle_at_84%_20%,rgba(255,255,255,0.2),transparent_40%)]" />
            <img
              src="/assets/ui/jungle/load_bar/bg.png"
              alt=""
              className="pointer-events-none absolute left-3 right-3 top-3 h-2 object-fill opacity-70"
              draggable={false}
            />
            <div className="relative">
              <div className="text-5xl font-black tracking-wide text-[#b34f3e] sm:text-6xl">KO</div>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-[#6d3e33]">Mission Failed</h2>
              <p className="mt-4 text-lg font-bold text-[#4a3a28]">Final Score: {gameStore.score}</p>
              <p className="mt-1 text-sm font-semibold text-[#7a5e45]">Regroup and deploy again.</p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <GameButton
                  variant="primary"
                  size="md"
                  className="w-full max-w-[260px]"
                  onClick={() => {
                    // Reset all game state
                    gameStore.resetGame();
                    clearMultipleChoiceProgress();
                    clearProjectileTimeouts();
                    setScreenShakeOffset({ x: 0, y: 0 });
                    resetPlayerHp();
                    setZombies([]);
                    setBulletEffects([]);
                    setImpactEffects([]);
                    setShowMuzzleFlash(false);
                    setMuzzleSpriteSrc(null);
                    setIsRecoiling(false);
                    currentQuestionRef.current = null;
                    setCurrentQuestion(null);
                    setQuestionTimeRemaining(0);
                    setShowResult(null);
                    returnPlayerToReady();
                    setShowInstructions(true);

                    rollRandomSoldierIfEnabled(false);

                    // Randomize background for new game
                    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                    setCurrentBackground(randomBackground);
                  }}
                >
                  Play Again
                </GameButton>
                <GameButton
                  variant="danger"
                  size="md"
                  className="w-full max-w-[260px]"
                  onClick={() => onSceneChange?.('menu')}
                >
                  Back to Menu
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word Sets Selector Modal */}
      <WordSetsSelector
        isOpen={showWordSetsSelector}
        onClose={() => setShowWordSetsSelector(false)}
      />
    </div>
  );
};
