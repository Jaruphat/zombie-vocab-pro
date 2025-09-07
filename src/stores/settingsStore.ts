import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsStore } from '../types';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initial state
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.5, // 0.0 to 1.0
      musicVolume: 0.3, // 0.0 to 1.0
      difficulty: 'medium',
      autoSave: true,
      languageDirection: 'en-to-th',
      soldierType: 'soldier1',
      uiLanguage: 'en', // Default to English UI
      questionTypes: {
        multipleChoice: true,
        typing: false,
        spelling: false,
        letterArrangement: false
      },

      // Actions
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setLanguageDirection: (direction) => set({ languageDirection: direction }),
      setSoldierType: (type) => set({ soldierType: type }),
      setUiLanguage: (language) => set({ uiLanguage: language }),
      setQuestionTypes: (types) => set({ questionTypes: types }),
    }),
    {
      name: 'zombie-vocab-settings',
    }
  )
);