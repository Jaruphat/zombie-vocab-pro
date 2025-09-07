import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionPanel } from './QuestionPanel';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { VocabQuestion } from '../../types';
import { useVocabStore } from '../../stores/vocabStore';
import { PlayerSprite, ZombieSprite } from './sprites';
import { WordSetsSelector } from '../vocabulary/WordSetsSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { AudioSystem } from '../../game/systems/AudioSystem';
import type { ZombieVariant } from '../../types';

interface SimpleEnhancedGameProps {
  scene: 'menu' | 'game';
  onSceneChange?: (scene: 'menu' | 'game') => void;
}

export const SimpleEnhancedGame: React.FC<SimpleEnhancedGameProps> = ({ scene, onSceneChange }) => {
  const gameStore = useGameStore();
  const vocabStore = useVocabStore();
  const settingsStore = useSettingsStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();
  
  const [currentQuestion, setCurrentQuestion] = useState<VocabQuestion | null>(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [showResult, setShowResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  
  // Sprite states
  const [playerState, setPlayerState] = useState<'idle' | 'shooting' | 'celebrating' | 'hurt'>('idle');
  const [zombieStates, setZombieStates] = useState<('idle' | 'walking' | 'attacking' | 'dying' | 'dead')[]>([]);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  
  
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
  const [useEmojisFallback, setUseEmojisFallback] = useState(false); // Use sprites as default
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
  }>>([]);
  const zombieIdRef = useRef(0);
  
  // Use refs to store current values
  const currentQuestionRef = useRef(currentQuestion);
  const questionTimeRemainingRef = useRef(questionTimeRemaining);
  const zombiesRef = useRef(zombies);

  // Update refs when values change
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    questionTimeRemainingRef.current = questionTimeRemaining;
    zombiesRef.current = zombies;
  });

  // Forward reference for handleTimeUp
  const handleTimeUpRef = useRef<() => void>();

  // Helper function to randomly select zombie variant (excluding variant_1 which has wrong structure)
  const getRandomZombieVariant = useCallback((): ZombieVariant => {
    const variants: ZombieVariant[] = [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15]; // Removed variant_2 and variant_11 (missing files)
    return variants[Math.floor(Math.random() * variants.length)];
  }, []);

  // Function to spawn new zombie
  const spawnZombie = useCallback(() => {
    // Generate unique ID using timestamp and counter to prevent duplicates
    const uniqueId = `zombie-${Date.now()}-${zombieIdRef.current++}`;
    const newZombie = {
      id: uniqueId,
      position: 80 + Math.random() * 15, // Random start position between 80-95% (within screen bounds)
      targetPosition: 0 + Math.random() * 3, // Walk right to player position (0-3%)
      state: 'walking' as const,
      variant: getRandomZombieVariant(), // Randomly select from variants 2-15
      verticalOffset: Math.random() * 10 // Random vertical offset for variety
    };
    
    setZombies(prev => [...prev, newZombie]);
  }, [getRandomZombieVariant]);


  // Zombie spawning system - one by one spawning
  useEffect(() => {
    if (!currentQuestion || questionTimeRemaining <= 0) return;
    
    // Spawn first zombie when question starts
    if (zombies.length === 0) {
      spawnZombie(); // Spawn only 1 zombie initially
    }
    
    // Spawn new zombie every 3.5-4.5 seconds (more consistent)
    const spawnInterval = setInterval(() => {
      const currentQ = currentQuestionRef.current;
      const currentZombies = zombiesRef.current;
      
      if (currentQ && currentZombies.length < 5) { // Max 5 zombies at once
        spawnZombie();
      }
    }, 3500 + Math.random() * 1000); // 3.5-4.5 seconds (more consistent)

    return () => clearInterval(spawnInterval);
  }, [currentQuestion, spawnZombie]);

  // Zombie movement animation and cleanup
  useEffect(() => {
    if (!currentQuestion || questionTimeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      const currentQ = currentQuestionRef.current;
      const timeRemaining = questionTimeRemainingRef.current;
      
      setZombies(prevZombies => 
        prevZombies.map(zombie => {
          // Only move if zombie is walking and question is active
          if (zombie.state === 'walking' && currentQ && zombie.position > zombie.targetPosition) {
            // Calculate speed based on remaining time - zombies gradually speed up
            const timeRatio = timeRemaining / 10000; // 10 seconds max
            const baseSpeed = 0.2; // Slightly faster base speed
            const urgencySpeed = Math.max(0.15, 0.4 * (1 - timeRatio)); // More urgency speed
            const speed = baseSpeed + urgencySpeed;
            
            const newPos = Math.max(zombie.targetPosition, zombie.position - speed);
            
            // Check if zombie has reached player (very close now)
            if (newPos <= 5 && currentQ && zombie.state === 'walking') { // 5% from left edge = player reached
              // First, zombie attacks
              setTimeout(() => {
                setZombies(prev => prev.map(z => 
                  z.id === zombie.id ? { ...z, state: 'attacking', position: newPos } : z
                ));
              }, 0);
              
              // Then player gets hurt and life is lost (after attack animation)
              setTimeout(() => {
                gameStore.removeLive();
                setPlayerState('hurt');
                setShowResult({ correct: false, points: 0 });
                setCurrentQuestion(null);
                
                // Remove this zombie after attack
                setTimeout(() => {
                  setZombies(prev => prev.filter(z => z.id !== zombie.id));
                }, 500);
                
                // Reset after showing result
                setTimeout(() => {
                  setShowResult(null);
                  setPlayerState('idle');
                  if (gameStore.lives > 0) {
                    const nextQuestion = generateQuestion();
                    setCurrentQuestion(nextQuestion);
                    setQuestionTimeRemaining(nextQuestion.timeLimit);
                  }
                }, 1500);
              }, 600); // Wait for attack animation
              
              return { ...zombie, position: newPos, state: 'attacking' };
            }
            
            return { ...zombie, position: newPos };
          }
          return zombie;
        }).filter(zombie => 
          // Remove dead zombies after a delay
          zombie.state !== 'dead' || Date.now() % 10000 > 5000
        )
      );
    }, 50); // 20 FPS movement

    return () => clearInterval(interval);
  }, [currentQuestion]); // Only depend on currentQuestion

  // Question timer
  useEffect(() => {
    if (!currentQuestion || questionTimeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        const next = prev - 100;
        if (next <= 0) {
          handleTimeUp();
          return 0;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [currentQuestion]); // FIXED: Only depend on currentQuestion, not questionTimeRemaining

  const generateQuestion = (): VocabQuestion => {
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
    
    const word = words[Math.floor(Math.random() * words.length)];
    
    // Determine language direction
    const direction = settingsStore.languageDirection === 'mixed' 
      ? (Math.random() > 0.5 ? 'en-to-th' : 'th-to-en')
      : settingsStore.languageDirection;
    
    // Determine question type
    const availableTypes = Object.entries(settingsStore.questionTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type as 'multipleChoice' | 'typing' | 'spelling' | 'letterArrangement');
    
    const questionType = availableTypes.length > 0 
      ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
      : 'multipleChoice';
    
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
  };


  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    
    const correct = answer === currentQuestion.correctAnswer;
    const points = correct ? 100 * gameStore.level : 0;
    
    if (correct) {
      gameStore.addScore(points);
      
      // Play shooting sound and trigger animation
      audioSystem.playShootSound();
      audioSystem.playCorrectAnswerSound();
      setPlayerState('shooting');
      
      // Find closest walking zombie to shoot - do this smoothly
      const walkingZombie = zombies.find(z => z.state === 'walking');
      if (walkingZombie) {
        // Delay zombie death to sync with shooting animation
        setTimeout(() => {
          setZombies(prev => prev.map(z => 
            z.id === walkingZombie.id ? { ...z, state: 'dying' } : z
          ));
        }, 200); // Faster sync with shooting animation
      }
      
      // Generate next question immediately - single state update
      if (gameStore.lives > 0) {
        const nextQuestion = generateQuestion();
        // Update both question and timer in a single batch
        setTimeout(() => {
          setCurrentQuestion(nextQuestion);
          setQuestionTimeRemaining(nextQuestion.timeLimit);
        }, 0); // Next tick to avoid conflicting with current render
      } else {
        setCurrentQuestion(null);
      }
    } else {
      gameStore.removeLive();
      
      // Play wrong answer sound
      audioSystem.playWrongAnswerSound();
      
      // Batch all wrong answer state updates
      setPlayerState('hurt');
      setZombies(prev => prev.map(z => z.state === 'attacking' ? { ...z, state: 'idle' } : z));
      setShowResult({ correct, points });
      setCurrentQuestion(null);
      
      // Handle wrong answer recovery
      setTimeout(() => {
        setShowResult(null);
        setPlayerState('idle');
        if (gameStore.lives > 0) {
          const nextQuestion = generateQuestion();
          setCurrentQuestion(nextQuestion);
          setQuestionTimeRemaining(nextQuestion.timeLimit);
        }
      }, 1500);
    }
  };

  const handleTimeUp = () => {
    if (currentQuestion) {
      // Lose life and spawn new zombie
      gameStore.removeLive();
      setPlayerState('hurt');
      
      // Spawn a new zombie from the left
      spawnZombie();
      
      setShowResult({ correct: false, points: 0 });
      setCurrentQuestion(null);
      
      // Reset after showing result
      setTimeout(() => {
        setShowResult(null);
        setPlayerState('idle');
        if (gameStore.lives > 0) {
          const nextQuestion = generateQuestion();
          setCurrentQuestion(nextQuestion);
          setQuestionTimeRemaining(nextQuestion.timeLimit);
        }
      }, 1500);
    }
  };

  // Assign to ref after declaration
  handleTimeUpRef.current = handleTimeUp;

  const handlePlayerAnimationComplete = (state: string) => {
    if (state === 'shooting-complete') {
      // After shooting animation completes, return to idle
      setPlayerState('idle');
    } else if (state === 'celebrating-complete' || state === 'hurt-complete') {
      setPlayerState('idle');
    }
  };

  const handleZombieAnimationComplete = (zombieId: string, state: string) => {
    if (state === 'death-complete') {
      setZombies(prev => prev.map(z => 
        z.id === zombieId ? { ...z, state: 'dead' } : z
      ));
    } else if (state === 'attack-complete' || state === 'attacking-complete') {
      // After attack completes, zombie should be removed (already handled in collision logic)
      // Or zombie can continue walking if still alive
      setZombies(prev => prev.map(z => {
        if (z.id === zombieId) {
          return { ...z, state: 'idle' }; // Stay idle after attack
        }
        return z;
      }));
    }
  };

  if (scene !== 'game') {
    return null;
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Simple Game Canvas */}
      <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden max-w-6xl mx-auto w-full">
        
        {/* Background Scene */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main Graveyard Background */}
          <img 
            src={currentBackground} 
            alt="graveyard background" 
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: 'center 70%' // Move background up - characters now positioned higher
            }}
          />
          
        </div>

        {/* Player positioned at left side - aligned with ground line */}
        <div 
            className="absolute left-4 sm:left-8 z-30"
            style={{ 
              position: 'absolute', 
              // Different bottom position for Bravo vs other soldiers
              bottom: settingsStore.soldierType === 'soldier2' ? 'calc(24% + 5px)' : 'calc(33% + 5px)', 
              left: 'clamp(16px, 4vw, 32px)', 
              zIndex: 30, 
              transform: 'translateY(var(--player-ground-offset)) scale(var(--player-scale))', // Use CSS custom property for ground alignment
              '--player-scale': 'var(--mobile-portrait-player-scale, var(--mobile-landscape-player-scale, clamp(0.8, 3vw + 1.5rem, 1.8)))',
              transformOrigin: 'center bottom' // Scale from bottom center point
            } as React.CSSProperties}
          >
            {useEmojisFallback ? (
              <div className="text-3xl sm:text-6xl animate-bounce">🧑‍💼</div>
            ) : (
              <PlayerSprite
                x={0}
                y={0}
                scale={settingsStore.soldierType === 'soldier2' ? 2.5 : 2.0} // Scale back to normal for Bravo
                state={playerState}
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
                console.log(`Zombie ${zombie.id} clicked!`);
                if (zombie.state !== 'dying' && zombie.state !== 'dead') {
                  // Start combat by setting zombie to attacking
                  setZombies(prev => prev.map(z => 
                    z.id === zombie.id ? { ...z, state: 'attacking' } : z
                  ));
                  
                  if (!currentQuestion) {
                    const question = generateQuestion();
                    setCurrentQuestion(question);
                    setQuestionTimeRemaining(question.timeLimit);
                    setShowResult(null);
                  }
                }
              }}
              onMouseEnter={() => console.log(`Zombie ${zombie.id} hover`)}
              title={zombie.state === 'dead' ? 'Defeated!' : zombie.state === 'dying' ? 'Dying...' : 'Click to fight!'}
              style={{ 
                left: `${zombie.position}%`, // Use percentage positioning
                // Move zombies higher up to match new player position  
                bottom: 'calc(27% + 34px)', // Align with new ground level
                pointerEvents: zombie.state === 'dying' || zombie.state === 'dead' ? 'none' : 'auto', 
                userSelect: 'none',
                opacity: zombie.state === 'dead' ? 0.3 : 1,
                // Combined transform: scale + translateY for ground alignment + vertical offset for variety
                transform: `translateY(calc(80% + ${zombie.verticalOffset}px)) scale(var(--zombie-scale))`,
                '--zombie-scale': 'var(--mobile-portrait-zombie-scale, var(--mobile-landscape-zombie-scale, clamp(0.4, 1.5vw + 0.5rem, 0.8)))' as string, // Responsive zombie scale
                transformOrigin: 'center bottom', // Scale from bottom center point
                transition: zombie.state === 'walking' ? 'none' : 'all 0.3s ease' // Smooth transitions for non-walking states
              }}
            >
              {useEmojisFallback ? (
                <div className="text-3xl sm:text-6xl">
                  {zombie.state === 'dead' ? '💀' : 
                   zombie.state === 'dying' ? '😵' :
                   zombie.state === 'attacking' ? '🧟‍♂️' :
                   zombie.state === 'walking' ? '🧟‍♂️' :
                   '🧟‍♂️'}
                </div>
              ) : (
                <ZombieSprite
                  x={0}
                  y={0}
                  scale={1.8} // Reduced base scale, now handled by CSS transform
                  state={zombie.state}
                  variant={zombie.variant} // Pass the random variant
                  flipX={true} // Flip horizontally to face forward
                  onAnimationComplete={(animState) => handleZombieAnimationComplete(zombie.id, animState)}
                />
              )}
            </div>
          ))}


        {/* Combat Instructions */}
        {!currentQuestion && !showResult && showInstructions && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl p-2" data-testid="combat-instructions">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-6 text-center shadow-2xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">🎯 Ready for Battle!</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Click on any zombie to start combat</p>
              
              {/* Language Direction Toggle */}
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Language Mode:</p>
                <div className="flex gap-1 sm:gap-2 justify-center">
                  {[
                    { value: 'en-to-th', label: 'EN→TH', desc: 'EN to TH' },
                    { value: 'th-to-en', label: 'TH→EN', desc: 'TH to EN' },
                    { value: 'mixed', label: '🔀', desc: 'Mixed' }
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => settingsStore.setLanguageDirection(value as any)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        settingsStore.languageDirection === value
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                      }`}
                      title={desc}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Sets Selection */}
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{t('wordSets')}:</p>
                  <button
                    onClick={() => setShowWordSetsSelector(true)}
                    className="px-2 sm:px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    📚 {t('selectSet')}
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>{t('selectedSets')}: {vocabStore.selectedWordSets.length}</p>
                  <p>{t('wordCount')}: {vocabStore.getActiveWords().length}</p>
                </div>
              </div>

              {/* Question Types Toggle */}
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Game Modes:</p>
                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsStore.questionTypes.multipleChoice}
                      onChange={(e) => settingsStore.setQuestionTypes({
                        ...settingsStore.questionTypes,
                        multipleChoice: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs sm:text-sm">🔢 Multiple Choice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsStore.questionTypes.letterArrangement}
                      onChange={(e) => settingsStore.setQuestionTypes({
                        ...settingsStore.questionTypes,
                        letterArrangement: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs sm:text-sm">🔤 Letter Arrangement</span>
                  </label>
                </div>
              </div>

              
              <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Answer vocabulary questions correctly to defeat zombies!
              </div>

              {/* Start Game Button */}
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setShowInstructions(false);
                    // Reset game state for fresh start
                    setZombies([]);
                    setPlayerState('idle');
                    setShowResult(null);
                    
                    // Randomize background for new game
                    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                    setCurrentBackground(randomBackground);
                    
                    // Start the game by generating first question
                    setTimeout(() => {
                      const newQuestion = generateQuestion();
                      setCurrentQuestion(newQuestion);
                      setQuestionTimeRemaining(newQuestion.timeLimit);
                    }, 50);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base"
                >
                  🎮 Start Playing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Settings Button when instructions are hidden */}
        {!currentQuestion && !showResult && !showInstructions && gameStore.lives > 0 && (
          <button
            onClick={() => setShowInstructions(true)}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 z-30"
            title="Show game settings"
          >
            ⚙️
          </button>
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

        {/* Question Panel - Now inside game background */}
        {currentQuestion && (
          <div className="absolute inset-x-0 bottom-0 z-40">
            <QuestionPanel
              question={currentQuestion}
              timeRemaining={questionTimeRemaining}
              onAnswer={handleAnswer}
              onTimeUp={handleTimeUp}
              disabled={false}
            />
          </div>
        )}
      </div> {/* End of Game Canvas */}

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
                  // Reset all game state
                  gameStore.resetGame();
                  setZombies([]);
                  setCurrentQuestion(null);
                  setQuestionTimeRemaining(0);
                  setShowResult(null);
                  setPlayerState('idle');
                  setShowInstructions(true);
                  
                  // Randomize background for new game
                  const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                  setCurrentBackground(randomBackground);
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

      {/* Word Sets Selector Modal */}
      <WordSetsSelector
        isOpen={showWordSetsSelector}
        onClose={() => setShowWordSetsSelector(false)}
      />
    </div>
  );
};