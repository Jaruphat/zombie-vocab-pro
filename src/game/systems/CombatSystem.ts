import * as PIXI from 'pixi.js';
import { Player, Zombie, VocabQuestion } from '../../types';
import { QuestionSystem } from './QuestionSystem';
import { AudioSystem } from './AudioSystem';
import { ProgressionSystem } from './ProgressionSystem';

export class CombatSystem {
  private static instance: CombatSystem;
  private questionSystem: QuestionSystem;
  private audioSystem: AudioSystem;
  private progressionSystem: ProgressionSystem;
  private currentQuestion: VocabQuestion | null = null;
  private questionTimer: number = 0;
  private isQuestionActive: boolean = false;

  // Callbacks for UI integration
  public onQuestionStart?: (question: VocabQuestion) => void;
  public onQuestionEnd?: (correct: boolean, points: number) => void;
  public onZombieHit?: (zombie: Zombie, damage: number) => void;
  public onPlayerHit?: (damage: number) => void;

  static getInstance(): CombatSystem {
    if (!CombatSystem.instance) {
      CombatSystem.instance = new CombatSystem();
    }
    return CombatSystem.instance;
  }

  constructor() {
    this.questionSystem = QuestionSystem.getInstance();
    this.audioSystem = AudioSystem.getInstance();
    this.progressionSystem = ProgressionSystem.getInstance();
  }

  startCombat(zombie: Zombie, level: number): void {
    if (this.isQuestionActive) return;

    const question = this.questionSystem.generateQuestion(level);
    if (!question) return;

    this.currentQuestion = question;
    this.questionTimer = question.timeLimit;
    this.isQuestionActive = true;

    // Play combat start sound
    this.audioSystem.resumeAudioContext();
    this.audioSystem.playButtonClickSound();

    this.onQuestionStart?.(question);
  }

  submitAnswer(answer: string): boolean {
    if (!this.currentQuestion || !this.isQuestionActive) return false;

    const isCorrect = this.checkAnswer(answer);
    const points = this.calculatePoints(isCorrect);

    this.endQuestion(isCorrect, points);
    return isCorrect;
  }

  private checkAnswer(answer: string): boolean {
    if (!this.currentQuestion) return false;

    const correct = this.currentQuestion.correctAnswer.toLowerCase().trim();
    const provided = answer.toLowerCase().trim();

    return provided === correct;
  }

  private calculatePoints(correct: boolean): number {
    if (!this.currentQuestion) return 0;

    const basePoints = 100;
    const difficultyMultiplier = this.currentQuestion.word.difficulty;
    const speedBonus = Math.max(0, this.questionTimer / this.currentQuestion.timeLimit);
    
    if (correct) {
      return Math.floor(basePoints * difficultyMultiplier * (1 + speedBonus));
    } else {
      return 0;
    }
  }

  private endQuestion(correct: boolean, points: number): void {
    this.isQuestionActive = false;
    this.questionTimer = 0;

    // Play sound effects
    if (correct) {
      this.audioSystem.playCorrectAnswerSound();
      this.audioSystem.playShootSound();
    } else {
      this.audioSystem.playWrongAnswerSound();
    }

    // Record progress
    if (this.currentQuestion) {
      this.progressionSystem.recordAnswer(
        correct, 
        points, 
        this.currentQuestion.word.id
      );
      
      // Check for level up
      const currentLevel = this.progressionSystem.getCurrentLevel();
      const gameStore = (window as any).gameStore?.getState();
      if (gameStore && currentLevel > gameStore.level) {
        gameStore.setLevel(currentLevel);
        this.audioSystem.playLevelUpSound();
      }
    }

    this.onQuestionEnd?.(correct, points);
    this.currentQuestion = null;
  }

  update(deltaTime: number): void {
    if (this.isQuestionActive && this.currentQuestion) {
      this.questionTimer -= deltaTime * 1000;

      if (this.questionTimer <= 0) {
        this.endQuestion(false, 0);
      }
    }
  }

  getCurrentQuestion(): VocabQuestion | null {
    return this.currentQuestion;
  }

  getQuestionTimeRemaining(): number {
    return Math.max(0, this.questionTimer);
  }

  isInCombat(): boolean {
    return this.isQuestionActive;
  }

  forceEndQuestion(): void {
    if (this.isQuestionActive) {
      this.endQuestion(false, 0);
    }
  }
}