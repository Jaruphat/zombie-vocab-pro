import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VocabStore, VocabWord } from '../types';
import { defaultWordSets, defaultWords } from '../data/defaultWordSets';

export const useVocabStore = create<VocabStore>()(
  persist(
    (set, get) => ({
      // Initial state
      words: defaultWords,
      customWords: [],
      wordSets: defaultWordSets,
      selectedWordSets: ['basic-survival'], // Default to first set
      currentWordIndex: 0,

      // Actions
      addWord: (word) => set((state) => ({
        customWords: [...state.customWords, { ...word, id: crypto.randomUUID() }]
      })),

      removeWord: (id) => set((state) => ({
        words: state.words.filter(w => w.id !== id),
        customWords: state.customWords.filter(w => w.id !== id),
        wordSets: state.wordSets.map(set => ({
          ...set,
          words: set.words.filter(w => w.id !== id)
        }))
      })),

      updateWord: (id, updates) => set((state) => ({
        words: state.words.map(w => w.id === id ? { ...w, ...updates } : w),
        customWords: state.customWords.map(w => w.id === id ? { ...w, ...updates } : w),
        wordSets: state.wordSets.map(set => ({
          ...set,
          words: set.words.map(w => w.id === id ? { ...w, ...updates } : w)
        }))
      })),

      setWords: (words) => set({ words }),

      getRandomWord: () => {
        const state = get();
        const activeWords = state.getActiveWords();
        if (activeWords.length === 0) return null;
        return activeWords[Math.floor(Math.random() * activeWords.length)];
      },

      importWords: (words) => set((state) => ({
        customWords: [
          ...state.customWords,
          ...words.map(w => ({ ...w, id: crypto.randomUUID() }))
        ]
      })),

      exportWords: () => {
        const state = get();
        const wordsFromSets = state.wordSets.flatMap(set => set.words);
        const allWords = [...wordsFromSets, ...state.customWords];
        return Array.from(new Map(allWords.map(word => [word.id, word])).values());
      },

      // Word Sets methods
      addWordSet: (wordSet) => set((state) => ({
        wordSets: [...state.wordSets, { ...wordSet, id: crypto.randomUUID() }]
      })),

      removeWordSet: (id) => set((state) => {
        const remainingWordSets = state.wordSets.filter(s => s.id !== id);
        const remainingSelected = state.selectedWordSets.filter(setId => setId !== id);
        return {
          wordSets: remainingWordSets,
          selectedWordSets: remainingSelected.length > 0
            ? remainingSelected
            : remainingWordSets.slice(0, 1).map(set => set.id)
        };
      }),

      updateWordSet: (id, updates) => set((state) => ({
        wordSets: state.wordSets.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      setSelectedWordSets: (setIds) => set((state) => ({
        selectedWordSets: setIds.length > 0
          ? setIds
          : state.wordSets.slice(0, 1).map(set => set.id)
      })),

      getActiveWords: () => {
        const state = get();
        const allSetWords = state.wordSets.flatMap(set => set.words);

        if (state.selectedWordSets.length === 0) {
          // Fallback to all words if no sets selected
          return Array.from(new Map([...allSetWords, ...state.customWords].map(word => [word.id, word])).values());
        }
        
        const activeWords: VocabWord[] = [];
        state.selectedWordSets.forEach(setId => {
          const wordSet = state.wordSets.find(s => s.id === setId);
          if (wordSet) {
            activeWords.push(...wordSet.words);
          }
        });
        
        // Also include custom words
        activeWords.push(...state.customWords);
        
        return Array.from(new Map(activeWords.map(word => [word.id, word])).values());
      },
    }),
    {
      name: 'zombie-vocab-words',
      partialize: (state) => ({
        customWords: state.customWords,
        selectedWordSets: state.selectedWordSets,
        currentWordIndex: state.currentWordIndex,
      }),
    }
  )
);
