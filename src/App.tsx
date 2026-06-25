import { useCallback, useEffect, useRef, useState } from 'react';
import { SimpleEnhancedGame } from './components/game/SimpleEnhancedGame';
import { VocabManager } from './components/vocabulary/VocabManager';
import { SettingsModal } from './components/settings/SettingsModal';
import { useGameStore } from './stores/gameStore';
import { useSettingsStore } from './stores/settingsStore';
import { useVocabStore } from './stores/vocabStore';
import { useRankingStore } from './stores/rankingStore';
import { useTranslation } from './hooks/useTranslation';
import { GameButton } from './components/ui/GameButton';
import { GameStats } from './components/ui/GameStats';
import { AudioSystem } from './game/systems/AudioSystem';
import { RankingModal } from './components/ranking/RankingModal';
import { PlayerBadge } from './components/ranking/PlayerBadge';

function App() {
  const [scene, setScene] = useState<'menu' | 'game'>('menu');
  const [showVocabManager, setShowVocabManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerHpMax, setPlayerHpMax] = useState(100);
  const gameStore = useGameStore();
  const vocabStore = useVocabStore();
  const rankingStore = useRankingStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();
  const settingsStore = useSettingsStore();
  const selectedSoldier = settingsStore.soldierType || 'soldier1';
  const scoreSavedRef = useRef<string | null>(null);
  const activeProfile = rankingStore.getActiveProfile();
  const leaderboardPreview = rankingStore.leaderboard.slice(0, 3);
  const rankingNote =
    rankingStore.leaderboardSource === 'shared'
      ? rankingStore.syncStatus === 'loading' || rankingStore.syncStatus === 'saving'
        ? t('sharedRankingSyncing')
        : t('sharedRankingLive')
      : rankingStore.syncReason === 'not-configured'
        ? t('sharedRankingSetupNote')
        : t('localRankingFallbackNote');
  const selectedWordSetNames = vocabStore.selectedWordSets
    .map((setId) => vocabStore.wordSets.find((set) => set.id === setId)?.name)
    .filter((name): name is string => Boolean(name));
  const missionBriefSetSummary =
    selectedWordSetNames.length === 0
      ? 'All sets'
      : selectedWordSetNames.length <= 2
        ? selectedWordSetNames.join(', ')
        : `${selectedWordSetNames.slice(0, 2).join(', ')} +${selectedWordSetNames.length - 2}`;
  const activeWordCount = vocabStore.getActiveWords().length;
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
      void useRankingStore.getState().refreshLeaderboard(20);
    }
  }, [playerHpMax, scene]);

  useEffect(() => {
    if (gameStore.lives > 0 || gameStore.score === 0) {
      scoreSavedRef.current = null;
    }
  }, [gameStore.lives, gameStore.score]);

  useEffect(() => {
    if (scene !== 'game' || gameStore.lives > 0 || gameStore.score <= 0) {
      return;
    }

    const entrySignature = [
      activeProfile.id,
      gameStore.score,
      gameStore.level,
      selectedWordSetNames.join('|'),
    ].join('::');

    if (scoreSavedRef.current === entrySignature) {
      return;
    }

    void useRankingStore.getState().submitLeaderboardEntry({
      playerId: activeProfile.id,
      playerName: activeProfile.name,
      playerAvatarDataUrl: activeProfile.avatarDataUrl,
      score: gameStore.score,
      level: gameStore.level,
      playedAt: new Date().toISOString(),
      wordSetIds: vocabStore.selectedWordSets,
      wordSetNames: selectedWordSetNames,
    });
    scoreSavedRef.current = entrySignature;
  }, [
    activeProfile.avatarDataUrl,
    activeProfile.id,
    activeProfile.name,
    gameStore.level,
    gameStore.lives,
    gameStore.score,
    scene,
    selectedWordSetNames,
    vocabStore.selectedWordSets,
  ]);

  const handleUserInteraction = () => {
    audioSystem.resumeAudioContext();
  };

  return (
    <div className="relative h-screen bg-[#f6f1e7] p-1 sm:p-2 md:p-3 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/backgrounds/bg2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-14"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(252,248,240,0.9)_0%,rgba(246,239,227,0.88)_40%,rgba(238,229,211,0.9)_100%)]" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#fff0d6]/70 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-[#f4e1bc]/55 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#f9eed8]/45 blur-3xl" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(143,117,84,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative w-full max-w-7xl h-full flex flex-col">
        {scene === 'menu' ? (
          <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border-2 border-[#d9c5a6]/55 bg-gradient-to-b from-[#fffdf8] via-[#f7efe0] to-[#ebdcc5] shadow-[0_18px_36px_rgba(92,73,45,0.24)]">
              <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.38),transparent_35%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.2),transparent_38%)]" />

              <div className="relative border-b border-[#e8dbc5]/45 px-4 py-4 sm:px-6 sm:py-5">
                <div className="pointer-events-none absolute inset-x-3 top-2 h-2 rounded-full bg-gradient-to-r from-[#f5e8cd]/80 via-[#e8d6b6]/70 to-[#d7c09a]/70" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center rounded-full border border-[#d7c19d]/70 bg-[#fff7e8] px-3 py-1 text-[11px] font-black tracking-wide text-[#5b4834] sm:text-xs">
                      SURVIVAL TRAINING MODE
                    </span>
                    <h1 className="mt-2 text-2xl font-black tracking-wide text-[#4a3a28] sm:text-4xl">Zombie Vocab</h1>
                    <p className="mt-1 text-sm font-semibold text-[#6b5843] sm:text-base">
                      Learn vocabulary by defeating zombies.
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-3">
                    <PlayerBadge
                      name={activeProfile.name}
                      avatarDataUrl={activeProfile.avatarDataUrl}
                      subtitle={t('activePlayer')}
                      compact={true}
                    />
                    <div className="flex h-20 w-20 items-end justify-center rounded-2xl border border-[#e8dbc5]/45 bg-[#d3bd98] p-1.5">
                      <img
                        src={`/assets/characters/soldier/${selectedSoldier}/Idle__000.png`}
                        alt="selected soldier preview"
                        className="h-full w-auto object-contain [image-rendering:pixelated]"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative bg-[#fffcf7]/96 p-4 text-[#4a3a28] sm:p-6">
                <div className="rounded-2xl border border-[#e8dbc5]/45 bg-white/90 p-3 sm:p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-[#6b5843]">Mission Brief</p>
                      <p className="mt-1 text-sm font-semibold text-[#6b5843] sm:text-base">
                        Active word pool: {missionBriefSetSummary} • {activeWordCount} words • {gameStore.score} score.
                      </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6b5843]">
                      Level {gameStore.level}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-2xl border border-[#e8dbc5]/45 bg-white/90 p-3 sm:p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-[#6b5843]">{t('currentPlayer')}</p>
                    <PlayerBadge
                      name={activeProfile.name}
                      avatarDataUrl={activeProfile.avatarDataUrl}
                      subtitle={`${t('score')} ${gameStore.score.toLocaleString()}`}
                      className="mt-3"
                    />
                    <p className="mt-3 text-xs font-semibold text-[#7a654b]">{rankingNote}</p>
                  </div>

                  <div className="rounded-2xl border border-[#e8dbc5]/45 bg-white/90 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-[#6b5843]">{t('rankingBoard')}</p>
                        <p className="text-sm font-semibold text-[#6b5843]">{t('topSurvivors')}</p>
                      </div>
                      <GameButton variant="secondary" size="sm" onClick={() => setShowRanking(true)}>
                        {t('playerRanking')}
                      </GameButton>
                    </div>

                    <div className="mt-3 space-y-2">
                      {leaderboardPreview.length > 0 ? (
                        leaderboardPreview.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#efe5d3] bg-[#fffcf7] px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f8efe1] text-xs font-black text-[#7b5f3d]">
                                #{index + 1}
                              </span>
                              <PlayerBadge
                                name={entry.playerName}
                                avatarDataUrl={entry.playerAvatarDataUrl}
                                subtitle={`${t('level')} ${entry.level}`}
                                compact={true}
                                className="min-w-0 flex-1 border-transparent bg-transparent px-0 py-0 shadow-none"
                              />
                            </div>
                            <span className="text-sm font-black text-[#4a3a28]">{entry.score.toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-dashed border-[#dcc9a9] bg-[#fffcf7] px-3 py-3 text-sm font-semibold text-[#7a654b]">
                          {t('noScoresYet')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 mx-auto w-full max-w-2xl space-y-3 sm:space-y-4">
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
                    onClick={() => setShowRanking(true)}
                  >
                    {t('playerRanking')}
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
            <div className="rounded-2xl border border-[#dcc9a9]/70 bg-[#f8f3ea]/92 shadow-[0_18px_40px_rgba(92,73,45,0.22)] backdrop-blur-md overflow-hidden flex flex-col h-full">
              <div className="relative bg-gradient-to-r from-[#fffaf1] via-[#f3e8d3] to-[#e6d6bc] p-2 sm:p-3 md:p-4 text-[#4a3a28] shadow-lg border-b border-[#e8dbc5]/35">
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

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden lg:block">
                      <PlayerBadge
                        name={activeProfile.name}
                        avatarDataUrl={activeProfile.avatarDataUrl}
                        subtitle={t('activePlayer')}
                        compact={true}
                      />
                    </div>
                    <button
                      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-[#9eacb7] bg-[#dce3ea] text-[#324553] hover:bg-[#cfd8e2] transition-colors duration-150 active:translate-y-[1px] flex-shrink-0 shadow-sm"
                      title={t('backToMenu')}
                      onClick={() => {
                        handleUserInteraction();
                        setScene('menu');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
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
      <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} />
    </div>
  );
}

export default App;
