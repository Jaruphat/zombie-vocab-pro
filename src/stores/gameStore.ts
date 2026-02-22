import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameStore } from '../types';

const SCORE_STEP_PER_LEVEL = 700;
const MAX_LEVEL = 30;

const getLevelFromScore = (score: number): number => {
  if (score <= 0) return 1;

  // Cumulative requirement curve:
  // scoreNeeded(level n) = SCORE_STEP_PER_LEVEL * (n - 1) * n / 2
  const normalizedScore = score / SCORE_STEP_PER_LEVEL;
  const levelIndex = Math.floor((Math.sqrt(1 + 8 * normalizedScore) - 1) / 2);
  return Math.min(MAX_LEVEL, levelIndex + 1);
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // Initial state
      scene: 'menu',
      score: 0,
      lives: 3,
      coins: 25,
      level: 1,
      currentQuestion: undefined,

      // Actions
      setScene: (scene) => set({ scene }),
      
      setScore: (score) => {
        const safeScore = Math.max(0, score);
        set((state) => ({
          score: safeScore,
          level: Math.max(state.level, getLevelFromScore(safeScore)),
        }));
      },
      
      addScore: (points) => set((state) => {
        const nextScore = Math.max(0, state.score + points);
        return {
          score: nextScore,
          level: Math.max(state.level, getLevelFromScore(nextScore)),
          coins: state.coins + Math.floor(points / 100) // Earn 1 coin per 100 points
        };
      }),
      
      setLives: (lives) => set({ lives }),
      
      removeLive: () => set((state) => ({ 
        lives: Math.max(0, state.lives - 1)
      })),
      
      setCoins: (coins) => set({ coins }),
      
      addCoins: (amount) => set((state) => ({ 
        coins: state.coins + amount 
      })),
      
      setLevel: (level) => set({ level }),
      
      setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
      
      resetGame: () => set({
        scene: 'menu',
        score: 0,
        lives: 3,
        level: 1,
        currentQuestion: undefined
      }),
    }),
    {
      name: 'zombie-vocab-game-state',
      partialize: (state) => ({
        score: state.score,
        coins: state.coins,
        level: state.level,
      }),
    }
  )
);
