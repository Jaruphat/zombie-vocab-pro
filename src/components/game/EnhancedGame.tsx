import React, { useState, useEffect, useRef } from 'react';
import { QuestionPanel } from './QuestionPanel';
import { useGameStore } from '../../stores/gameStore';
import BattleScene from '../../game/scenes/GameScene';
import type { VocabQuestion } from '../../types';
import * as PIXI from 'pixi.js';

interface EnhancedGameProps {
  scene: 'menu' | 'game';
  onSceneChange?: (scene: 'menu' | 'game') => void;
}

export const EnhancedGame: React.FC<EnhancedGameProps> = ({ scene, onSceneChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const battleSceneRef = useRef<BattleScene | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<VocabQuestion | null>(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [combatActive, setCombatActive] = useState(false);
  const [showResult, setShowResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  
  const gameStore = useGameStore();

  // Initialize PixiJS and Battle Scene
  useEffect(() => {
    if (!canvasRef.current || scene !== 'game') return;

    const initializeGame = async () => {
      try {
        const app = new PIXI.Application();
        
        app.init({
          canvas: canvasRef.current!,
          width: 800,
          height: 500,
          backgroundColor: 0x1099bb,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true,
        });

        appRef.current = app;
        
        // Create battle scene
        const battleScene = new BattleScene();
        battleSceneRef.current = battleScene;
        app.stage.addChild(battleScene.container);

        // Setup combat system callbacks
        const combatSystem = battleScene.getCombatSystem();
        
        combatSystem.onQuestionStart = (question: VocabQuestion) => {
          setCurrentQuestion(question);
          setQuestionTimeRemaining(question.timeLimit);
          setCombatActive(true);
          setShowResult(null);
        };

        combatSystem.onQuestionEnd = (correct: boolean, points: number) => {
          setCombatActive(false);
          setCurrentQuestion(null);
          setShowResult({ correct, points });
          
          if (correct) {
            gameStore.addScore(points);
            // Deal damage to zombie
            const zombies = battleScene.getZombieData();
            if (zombies.length > 0) {
              battleScene.dealDamageToZombie(zombies[0].id, 25);
            }
          } else {
            gameStore.removeLive();
          }

          // Hide result after 2 seconds
          setTimeout(() => {
            setShowResult(null);
          }, 2000);
        };

        // Update question timer
        const updateTimer = () => {
          if (combatSystem.isInCombat()) {
            setQuestionTimeRemaining(combatSystem.getQuestionTimeRemaining());
          }
        };
        
        app.ticker.add(updateTimer);
        
        // Make canvas responsive
        const resize = () => {
          if (!canvasRef.current) return;
          const parent = canvasRef.current.parentElement;
          if (!parent) return;
          
          const parentWidth = parent.clientWidth;
          const parentHeight = parent.clientHeight;
          
          const scale = Math.min(parentWidth / 800, parentHeight / 500);
          canvasRef.current.style.width = `${800 * scale}px`;
          canvasRef.current.style.height = `${500 * scale}px`;
        };
        
        resize();
        window.addEventListener('resize', resize);
        
        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initializeGame();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      battleSceneRef.current = null;
      window.removeEventListener('resize', () => {});
    };
  }, [scene]);

  const handleAnswer = (answer: string) => {
    if (!battleSceneRef.current || !currentQuestion) return;
    
    const combatSystem = battleSceneRef.current.getCombatSystem();
    combatSystem.submitAnswer(answer);
  };

  const handleTimeUp = () => {
    if (!battleSceneRef.current) return;
    
    const combatSystem = battleSceneRef.current.getCombatSystem();
    combatSystem.forceEndQuestion();
  };

  if (scene !== 'game') {
    return null;
  }

  return (
    <div className="relative">
      {/* Game Canvas */}
      <div className="relative h-[400px] md:h-[500px] bg-gray-900 rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <div className="text-white text-xl font-bold animate-pulse">
              🎮 Loading Enhanced Game...
            </div>
          </div>
        )}

        {/* Game Overlay - Combat Instructions */}
        {isInitialized && !combatActive && !showResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">🎯 Ready for Battle!</h3>
              <p className="text-gray-600 mb-4">Click on any zombie to start combat</p>
              <div className="text-sm text-gray-500">
                Answer vocabulary questions correctly to defeat zombies!
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {showResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-2xl border-4 ${
              showResult.correct ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="text-4xl mb-2">
                {showResult.correct ? '🎉' : '💀'}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                showResult.correct ? 'text-green-600' : 'text-red-600'
              }`}>
                {showResult.correct ? 'Correct!' : 'Wrong Answer!'}
              </h3>
              {showResult.correct && (
                <p className="text-lg text-gray-600">
                  +{showResult.points} points!
                </p>
              )}
              {!showResult.correct && (
                <p className="text-lg text-gray-600">
                  You lost a life!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Question Panel */}
      {currentQuestion && (
        <QuestionPanel
          question={currentQuestion}
          timeRemaining={questionTimeRemaining}
          onAnswer={handleAnswer}
          onTimeUp={handleTimeUp}
          disabled={!combatActive}
        />
      )}

      {/* Game Over Check */}
      {gameStore.lives <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-2xl max-w-md">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-gray-700 mb-2">Final Score: {gameStore.score}</p>
            <p className="text-gray-600 mb-6">Better luck next time!</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  gameStore.resetGame();
                  window.location.reload(); // Simple reset
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => onSceneChange?.('menu')}
                className="w-full px-6 py-3 border-2 border-gray-400 bg-transparent text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                🏠 Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};