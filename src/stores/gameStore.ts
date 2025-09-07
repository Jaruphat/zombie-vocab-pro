import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameStore, VocabQuestion } from '../types';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      scene: 'menu',
      score: 0,
      lives: 3,
      coins: 25,
      level: 1,
      currentQuestion: undefined,

      // Actions
      setScene: (scene) => set({ scene }),
      
      setScore: (score) => set({ score }),
      
      addScore: (points) => set((state) => ({ 
        score: state.score + points,
        coins: state.coins + Math.floor(points / 100) // Earn 1 coin per 100 points
      })),
      
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