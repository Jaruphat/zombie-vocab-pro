import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VocabStore, VocabWord, WordSet } from '../types';

// Sample word sets
const sampleWordSets: WordSet[] = [
  {
    id: 'basic-survival',
    name: 'ชุดที่ 1: ความอยู่รอด',
    description: 'คำศัพท์พื้นฐานเกี่ยวกับการเอาชีวิตรอด',
    color: '#10B981',
    icon: '🛡️',
    words: [
      { id: '1', word: 'zombie', meaning: 'ซอมบี้', difficulty: 1 },
      { id: '2', word: 'survive', meaning: 'เอาชีวิตรอด', difficulty: 2 },
      { id: '3', word: 'defend', meaning: 'ป้องกัน', difficulty: 2 },
      { id: '4', word: 'escape', meaning: 'หลบหนี', difficulty: 1 },
      { id: '5', word: 'danger', meaning: 'อันตราย', difficulty: 1 },
      { id: '6', word: 'safe', meaning: 'ปลอดภัย', difficulty: 1 },
      { id: '7', word: 'weapon', meaning: 'อาวุธ', difficulty: 2 },
      { id: '8', word: 'attack', meaning: 'โจมตี', difficulty: 2 },
      { id: '9', word: 'health', meaning: 'สุขภาพ', difficulty: 2 },
      { id: '10', word: 'strength', meaning: 'ความแข็งแรง', difficulty: 3 }
    ]
  },
  {
    id: 'technology',
    name: 'ชุดที่ 2: เทคโนโลยี',
    description: 'คำศัพท์เกี่ยวกับเทคโนโลยีและคอมพิวเตอร์',
    color: '#3B82F6',
    icon: '💻',
    words: [
      { id: '11', word: 'computer', meaning: 'คอมพิวเตอร์', difficulty: 1 },
      { id: '12', word: 'keyboard', meaning: 'แป้นพิมพ์', difficulty: 2 },
      { id: '13', word: 'internet', meaning: 'อินเทอร์เน็ต', difficulty: 2 },
      { id: '14', word: 'software', meaning: 'ซอฟต์แวร์', difficulty: 2 },
      { id: '15', word: 'hardware', meaning: 'ฮาร์ดแวร์', difficulty: 2 },
      { id: '16', word: 'download', meaning: 'ดาวน์โหลด', difficulty: 2 },
      { id: '17', word: 'upload', meaning: 'อัปโหลด', difficulty: 2 },
      { id: '18', word: 'database', meaning: 'ฐานข้อมูล', difficulty: 3 },
      { id: '19', word: 'program', meaning: 'โปรแกรม', difficulty: 2 },
      { id: '20', word: 'network', meaning: 'เครือข่าย', difficulty: 3 }
    ]
  },
  {
    id: 'daily-life',
    name: 'ชุดที่ 3: ชีวิตประจำวัน',
    description: 'คำศัพท์ใช้ในชีวิตประจำวัน',
    color: '#F59E0B',
    icon: '🏠',
    words: [
      { id: '21', word: 'house', meaning: 'บ้าน', difficulty: 1 },
      { id: '22', word: 'family', meaning: 'ครอบครัว', difficulty: 1 },
      { id: '23', word: 'food', meaning: 'อาหาร', difficulty: 1 },
      { id: '24', word: 'water', meaning: 'น้ำ', difficulty: 1 },
      { id: '25', word: 'sleep', meaning: 'นอน', difficulty: 1 },
      { id: '26', word: 'work', meaning: 'ทำงาน', difficulty: 1 },
      { id: '27', word: 'study', meaning: 'เรียน', difficulty: 1 },
      { id: '28', word: 'friend', meaning: 'เพื่อน', difficulty: 1 },
      { id: '29', word: 'school', meaning: 'โรงเรียน', difficulty: 1 },
      { id: '30', word: 'teacher', meaning: 'ครู', difficulty: 1 }
    ]
  },
  {
    id: 'advanced',
    name: 'ชุดที่ 4: ขั้นสูง',
    description: 'คำศัพท์ระดับสูงสำหรับผู้เรียนขั้นสูง',
    color: '#8B5CF6',
    icon: '🎓',
    words: [
      { id: '31', word: 'philosophy', meaning: 'ปรัชญา', difficulty: 4 },
      { id: '32', word: 'psychology', meaning: 'จิตวิทยา', difficulty: 4 },
      { id: '33', word: 'strategy', meaning: 'กลยุทธ์', difficulty: 3 },
      { id: '34', word: 'vocabulary', meaning: 'คำศัพท์', difficulty: 3 },
      { id: '35', word: 'environment', meaning: 'สิ่งแวดล้อม', difficulty: 3 },
      { id: '36', word: 'development', meaning: 'การพัฒนา', difficulty: 3 },
      { id: '37', word: 'opportunity', meaning: 'โอกาส', difficulty: 3 },
      { id: '38', word: 'responsibility', meaning: 'ความรับผิดชอบ', difficulty: 4 },
      { id: '39', word: 'achievement', meaning: 'ความสำเร็จ', difficulty: 3 },
      { id: '40', word: 'experience', meaning: 'ประสบการณ์', difficulty: 3 }
    ]
  }
];

// Keep some sample words for backward compatibility
const sampleWords: VocabWord[] = sampleWordSets[0].words;

export const useVocabStore = create<VocabStore>()(
  persist(
    (set, get) => ({
      // Initial state
      words: sampleWords,
      customWords: [],
      wordSets: sampleWordSets,
      selectedWordSets: ['basic-survival'], // Default to first set
      currentWordIndex: 0,

      // Actions
      addWord: (word) => set((state) => ({
        customWords: [...state.customWords, { ...word, id: crypto.randomUUID() }]
      })),

      removeWord: (id) => set((state) => ({
        words: state.words.filter(w => w.id !== id),
        customWords: state.customWords.filter(w => w.id !== id)
      })),

      updateWord: (id, updates) => set((state) => ({
        words: state.words.map(w => w.id === id ? { ...w, ...updates } : w),
        customWords: state.customWords.map(w => w.id === id ? { ...w, ...updates } : w)
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
        return [...state.words, ...state.customWords];
      },

      // Word Sets methods
      addWordSet: (wordSet) => set((state) => ({
        wordSets: [...state.wordSets, { ...wordSet, id: crypto.randomUUID() }]
      })),

      removeWordSet: (id) => set((state) => ({
        wordSets: state.wordSets.filter(s => s.id !== id),
        selectedWordSets: state.selectedWordSets.filter(setId => setId !== id)
      })),

      updateWordSet: (id, updates) => set((state) => ({
        wordSets: state.wordSets.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      setSelectedWordSets: (setIds) => set({ selectedWordSets: setIds }),

      getActiveWords: () => {
        const state = get();
        if (state.selectedWordSets.length === 0) {
          // Fallback to all words if no sets selected
          return [...state.words, ...state.customWords];
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
        
        return activeWords;
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