import { useCallback, useEffect, useState } from 'react';
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
  const [playerHp, setPlayerHp] = useState(100);
  const [playerHpMax, setPlayerHpMax] = useState(100);
  const gameStore = useGameStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();
  const settingsStore = useSettingsStore();
  const selectedSoldier = settingsStore.soldierType || 'soldier1';
  const handlePlayerHpChange = useCallback((hp: number, maxHp: number) => {
    setPlayerHp(hp);
    setPlayerHpMax(maxHp);
  }, []);

  useEffect(() => {
    audioSystem.setSoundsEnabled(settingsStore.soundEnabled);
    audioSystem.setMusicEnabled(settingsStore.musicEnabled);
    audioSystem.setSoundVolume(settingsStore.soundVolume);
    audioSystem.setMusicVolume(settingsStore.musicVolume);

    if (settingsStore.musicEnabled) {
      if (scene === 'menu') {
        audioSystem.playMenuMusic();
      } else if (scene === 'game') {
        audioSystem.playGameplayMusic();
      }
    } else {
      audioSystem.stopBackgroundMusic();
    }
  }, [
    audioSystem,
    scene,
    settingsStore.musicEnabled,
    settingsStore.musicVolume,
    settingsStore.soundEnabled,
    settingsStore.soundVolume,
  ]);

  useEffect(() => {
    if (scene === 'menu') {
      setPlayerHp(playerHpMax);
    }
  }, [playerHpMax, scene]);

  const handleUserInteraction = () => {
    audioSystem.resumeAudioContext();
  };

  return (
    <div className="relative h-screen bg-slate-950 p-1 sm:p-2 md:p-3 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/backgrounds/bg2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-28"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(3,18,34,0.92)_0%,rgba(2,13,31,0.86)_36%,rgba(5,38,55,0.85)_100%)]" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/14 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(188,238,255,0.24)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative w-full max-w-7xl h-full flex flex-col">
        {scene === 'menu' ? (
          <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-[#6f4e2e] bg-gradient-to-b from-[#5a3926] via-[#432b1d] to-[#2f1d14] shadow-[0_30px_60px_rgba(0,0,0,0.58)]">
              <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.38),transparent_35%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.2),transparent_38%)]" />

              <div className="relative border-b border-[#8f6a40]/55 px-4 py-4 sm:px-6 sm:py-5">
                <img
                  src="/assets/ui/jungle/load_bar/bg.png"
                  alt=""
                  className="pointer-events-none absolute inset-x-3 top-2 h-2 object-fill opacity-70"
                  draggable={false}
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center rounded-full border border-[#95d278]/55 bg-[#6cb645]/25 px-3 py-1 text-[11px] font-black tracking-wide text-[#e6ffd2] sm:text-xs">
                      SURVIVAL TRAINING MODE
                    </span>
                    <h1 className="mt-2 text-2xl font-black tracking-wide text-[#fff7df] sm:text-4xl">Zombie Vocab</h1>
                    <p className="mt-1 text-sm font-semibold text-[#f4ddaa] sm:text-base">
                      Learn vocabulary by defeating zombies.
                    </p>
                  </div>
                  <div className="hidden sm:flex h-20 w-20 items-end justify-center rounded-2xl border border-[#9f7f4f] bg-[#24160f] p-1.5">
                    <img
                      src={`/assets/characters/soldier/${selectedSoldier}/Idle__000.png`}
                      alt="selected soldier preview"
                      className="h-full w-auto object-contain [image-rendering:pixelated]"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              <div className="relative bg-[#f6efd8]/95 p-4 text-[#3d281a] sm:p-6">
                <div className="rounded-2xl border border-[#d2bc8f] bg-[#fff9ea] p-3 sm:p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-[#6a4a2c]">Mission Brief</p>
                      <p className="mt-1 text-sm font-semibold text-[#5d4228] sm:text-base">
                        Active word pool: {gameStore.level > 1 ? 'Advanced' : 'Starter'} set, {gameStore.score} score.
                      </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7a5a39]">
                      Level {gameStore.level}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <GameButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      handleUserInteraction();
                      setScene('game');
                    }}
                  >
                    {t('startGame')}
                  </GameButton>
                  <GameButton
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => setShowVocabManager(true)}
                  >
                    {t('manageWords')}
                  </GameButton>
                  <GameButton
                    variant="tertiary"
                    size="md"
                    className="w-full"
                    onClick={() => setShowSettings(true)}
                  >
                    {t('settings')}
                  </GameButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col w-full h-full">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_25px_50px_rgba(2,6,23,0.7)] border border-emerald-300/20 overflow-hidden flex flex-col h-full">
              <div className="relative bg-gradient-to-r from-[#4f2f21] via-[#633728] to-[#4f2f21] p-2 sm:p-3 md:p-4 text-white shadow-lg border-b border-[#8f6a40]/35">
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.18),transparent_35%)]" />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="sm:hidden min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <GameStats
                      coins={gameStore.coins}
                      lives={gameStore.lives}
                      hp={playerHp}
                      hpMax={playerHpMax}
                      score={gameStore.score}
                      level={gameStore.level}
                      levelText={t('level')}
                      showFullLevel={false}
                    />
                  </div>

                  <div className="hidden sm:block min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <GameStats
                      coins={gameStore.coins}
                      lives={gameStore.lives}
                      hp={playerHp}
                      hpMax={playerHpMax}
                      score={gameStore.score}
                      level={gameStore.level}
                      levelText={t('level')}
                      showFullLevel={true}
                    />
                  </div>

                  <GameButton
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      handleUserInteraction();
                      setScene('menu');
                    }}
                  >
                    <span className="hidden sm:inline">{t('backToMenu')}</span>
                    <span className="sm:hidden">Menu</span>
                  </GameButton>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <SimpleEnhancedGame
                  scene={scene}
                  onSceneChange={setScene}
                  onPlayerHpChange={handlePlayerHpChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <VocabManager isOpen={showVocabManager} onClose={() => setShowVocabManager(false)} />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
