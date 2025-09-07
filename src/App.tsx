import { useState, useEffect } from 'react';
import { SimpleEnhancedGame } from './components/game/SimpleEnhancedGame';
import { VocabManager } from './components/vocabulary/VocabManager';
import { SettingsModal } from './components/settings/SettingsModal';
import { useGameStore } from './stores/gameStore';
import { useSettingsStore } from './stores/settingsStore';
import { useTranslation } from './hooks/useTranslation';
import { GameButton } from './components/ui/GameButton';
import { GameStats } from './components/ui/GameStats';
import { AudioSystem } from './game/systems/AudioSystem';

function App() {
  const [scene, setScene] = useState<'menu' | 'game'>('menu');
  const [showVocabManager, setShowVocabManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const gameStore = useGameStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();
  const settingsStore = useSettingsStore();

  // Handle background music based on scene and settings
  useEffect(() => {
    // Sync AudioSystem with settings
    audioSystem.setSoundsEnabled(settingsStore.soundEnabled);
    audioSystem.setMusicEnabled(settingsStore.musicEnabled);
    audioSystem.setSoundVolume(settingsStore.soundVolume);
    audioSystem.setMusicVolume(settingsStore.musicVolume);
    
    // Play music if enabled
    if (settingsStore.musicEnabled) {
      if (scene === 'menu') {
        // Play menu music
        audioSystem.playMenuMusic();
      } else if (scene === 'game') {
        // Play gameplay music
        audioSystem.playGameplayMusic();
      }
    } else {
      audioSystem.stopBackgroundMusic();
    }
    
    // Cleanup function to stop music when component unmounts
    return () => {
      // Don't stop music on scene change, let it transition naturally
    };
  }, [scene, settingsStore.musicEnabled, settingsStore.soundEnabled, settingsStore.soundVolume, settingsStore.musicVolume, audioSystem]);

  // Handle user interaction for audio context
  const handleUserInteraction = () => {
    audioSystem.resumeAudioContext();
  };

  return (
    <div className="h-screen bg-gray-100 p-1 sm:p-2 md:p-3 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-7xl h-full flex flex-col">
        

        {scene === 'menu' ? (
          // Menu Screen - Game Controls in Center
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-hidden">
              <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">🧟‍♂️ Zombie Vocab</h1>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">Learn vocabulary by defeating zombies!</p>
              
              <div className="space-y-3">
                <GameButton 
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    handleUserInteraction();
                    setScene('game');
                  }}
                  icon="🎮"
                >
                  {t('startGame')}
                </GameButton>
                <GameButton 
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => setShowVocabManager(true)}
                  icon="📚"
                >
                  {t('manageWords')}
                </GameButton>
                <GameButton 
                  variant="tertiary"
                  size="md"
                  className="w-full"
                  onClick={() => setShowSettings(true)}
                  icon="⚙️"
                >
                  {t('settings')}
                </GameButton>
              </div>
            </div>
          </div>
        ) : (
          // Game Screen - Full height
          <div className="flex-1 flex flex-col w-full h-full">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden flex flex-col h-full">
              
              {/* Game Stats Bar with Back Button */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 sm:p-3 md:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  {/* Mobile compact view */}
                  <div className="sm:hidden">
                    <GameStats 
                      coins={gameStore.coins}
                      lives={gameStore.lives}
                      score={gameStore.score}
                      level={gameStore.level}
                      levelText={t('level')}
                      showFullLevel={false}
                    />
                  </div>
                  
                  {/* Desktop full view */}
                  <div className="hidden sm:block">
                    <GameStats 
                      coins={gameStore.coins}
                      lives={gameStore.lives}
                      score={gameStore.score}
                      level={gameStore.level}
                      levelText={t('level')}
                      showFullLevel={true}
                    />
                  </div>
                  
                  {/* Back to Menu Button */}
                  <GameButton 
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      handleUserInteraction();
                      setScene('menu');
                    }}
                  >
                    <span className="hidden sm:inline">📋 {t('backToMenu')}</span>
                    <span className="sm:hidden">📋</span>
                  </GameButton>
                </div>
              </div>

              {/* Enhanced Game Canvas */}
              <div className="flex-1 overflow-hidden">
                <SimpleEnhancedGame scene={scene} onSceneChange={setScene} />
              </div>

            </div>
          </div>
        )}

        
      </div>

      {/* Vocabulary Manager Modal */}
      <VocabManager 
        isOpen={showVocabManager}
        onClose={() => setShowVocabManager(false)}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;