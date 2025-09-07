import { VocabWord, VocabQuestion } from '../../types';
import { useVocabStore } from '../../stores/vocabStore';

export class QuestionSystem {
  private static instance: QuestionSystem;
  private usedWords: Set<string> = new Set();

  static getInstance(): QuestionSystem {
    if (!QuestionSystem.instance) {
      QuestionSystem.instance = new QuestionSystem();
    }
    return QuestionSystem.instance;
  }

  generateQuestion(difficulty: number = 1): VocabQuestion | null {
    const vocabStore = useVocabStore.getState();
    const allWords = [...vocabStore.words, ...vocabStore.customWords];
    
    // Filter words by difficulty and exclude recently used words
    const availableWords = allWords.filter(word => 
      word.difficulty <= difficulty + 1 && 
      !this.usedWords.has(word.id)
    );

    // If we've used all words, reset the used set
    if (availableWords.length === 0) {
      this.usedWords.clear();
      const availableWords = allWords.filter(word => word.difficulty <= difficulty + 1);
      if (availableWords.length === 0) return null;
    }

    const selectedWords = availableWords.length > 0 ? availableWords : allWords;
    const word = selectedWords[Math.floor(Math.random() * selectedWords.length)];
    this.usedWords.add(word.id);

    // Generate different question types randomly
    const questionTypes: VocabQuestion['type'][] = ['multipleChoice', 'typing'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    return this.createQuestion(word, questionType);
  }

  private createQuestion(word: VocabWord, type: VocabQuestion['type']): VocabQuestion {
    const baseQuestion = {
      id: crypto.randomUUID(),
      word,
      type,
      correctAnswer: word.meaning,
      timeLimit: this.getTimeLimit(type, word.difficulty)
    };

    switch (type) {
      case 'multipleChoice':
        return {
          ...baseQuestion,
          options: this.generateOptions(word)
        };

      case 'typing':
        return {
          ...baseQuestion,
          options: undefined
        };

      case 'spelling':
        return {
          ...baseQuestion,
          correctAnswer: word.word,
          options: undefined
        };

      default:
        return {
          ...baseQuestion,
          options: this.generateOptions(word)
        };
    }
  }

  private generateOptions(correctWord: VocabWord): string[] {
    const vocabStore = useVocabStore.getState();
    const allWords = [...vocabStore.words, ...vocabStore.customWords];
    
    // Get wrong answers from the same difficulty range
    const wrongOptions = allWords
      .filter(word => 
        word.id !== correctWord.id && 
        Math.abs(word.difficulty - correctWord.difficulty) <= 1
      )
      .map(word => word.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // If not enough wrong options, add some random ones
    while (wrongOptions.length < 3) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      if (randomWord.id !== correctWord.id && !wrongOptions.includes(randomWord.meaning)) {
        wrongOptions.push(randomWord.meaning);
      }
    }

    // Shuffle correct answer with wrong options
    const options = [correctWord.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
    return options;
  }

  private getTimeLimit(type: VocabQuestion['type'], difficulty: number): number {
    const baseTime = {
      multipleChoice: 10000, // 10 seconds
      typing: 15000,         // 15 seconds
      spelling: 20000        // 20 seconds
    };

    const difficultyMultiplier = 1 + (difficulty - 1) * 0.2; // +20% time per difficulty level
    return Math.floor(baseTime[type] * difficultyMultiplier);
  }

  resetUsedWords(): void {
    this.usedWords.clear();
  }

  getUsedWordsCount(): number {
    return this.usedWords.size;
  }
}