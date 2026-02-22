import React, { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import SoldierSelector from '../ui/SoldierSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { AudioSystem } from '../../game/systems/AudioSystem';
import type { GameSettings } from '../../types';
import { GameButton } from '../ui/GameButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToggleProps {
  enabled: boolean;
  onClick: () => void;
}

const ToggleSwitch: React.FC<ToggleProps> = ({ enabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative h-8 w-16 rounded-full border-2 transition-colors ${
        enabled ? 'border-emerald-300 bg-emerald-600/90' : 'border-[#6a4f2d] bg-[#2f2116]'
      }`}
      type="button"
      aria-pressed={enabled}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-9' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const settingsStore = useSettingsStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();

  useEffect(() => {
    audioSystem.setSoundsEnabled(settingsStore.soundEnabled);
    audioSystem.setMusicEnabled(settingsStore.musicEnabled);
    audioSystem.setSoundVolume(settingsStore.soundVolume);
    audioSystem.setMusicVolume(settingsStore.musicVolume);
  }, [
    audioSystem,
    settingsStore.soundEnabled,
    settingsStore.musicEnabled,
    settingsStore.soundVolume,
    settingsStore.musicVolume,
  ]);

  if (!isOpen) return null;

  const panelClass =
    'rounded-2xl border border-[#7d5b36] bg-[#f6efd8]/95 p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]';
  const sectionTitleClass = 'text-sm sm:text-base font-black uppercase tracking-wide text-[#3d281a]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-[2px]">
      <div className="relative flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-[#6f4e2e] bg-gradient-to-b from-[#5a3926] via-[#432b1d] to-[#2f1d14] shadow-[0_30px_60px_rgba(0,0,0,0.55)] sm:max-w-4xl">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.45),transparent_35%),radial-gradient(circle_at_85%_0,rgba(255,255,255,0.18),transparent_38%)]" />

        <div className="relative border-b border-[#8f6a40]/60 px-3 py-3 sm:px-5 sm:py-4">
          <img
            src="/assets/ui/jungle/load_bar/bg.png"
            alt=""
            className="pointer-events-none absolute inset-x-2 top-2 h-2 object-fill opacity-70"
            draggable={false}
          />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-[#fff7df] sm:text-2xl">
                {t('gameSettings')}
              </h2>
              <p className="text-xs text-[#f4ddaa] sm:text-sm">{t('customizeSettings')}</p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#9f7f4f] bg-[#2a1a11] shadow-md transition hover:brightness-110"
              aria-label="Close settings"
            >
              <img
                src="/assets/ui/jungle/btn/close.png"
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
            </button>
          </div>
        </div>

        <div className="game-scroll relative min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-5">
          <section className={panelClass}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={sectionTitleClass}>{t('audio')}</h3>
              <span className="rounded-full border border-[#8d6a3e] bg-[#f9f4e4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#66452b] sm:text-xs">
                Mixer
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <label className="text-sm font-semibold text-[#402818]">{t('soundEffects')}</label>
                <ToggleSwitch
                  enabled={settingsStore.soundEnabled}
                  onClick={() => {
                    const next = !settingsStore.soundEnabled;
                    settingsStore.setSoundEnabled(next);
                    if (next) audioSystem.playButtonClickSound();
                  }}
                />
              </div>

              {settingsStore.soundEnabled && (
                <div className="rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#402818]">Sound Volume</span>
                    <span className="text-xs font-bold text-[#5a3926]">
                      {Math.round(settingsStore.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settingsStore.soundVolume}
                    onChange={(e) => {
                      const volume = parseFloat(e.target.value);
                      settingsStore.setSoundVolume(volume);
                      if (volume > 0) audioSystem.playButtonClickSound();
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#d7c190]"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${
                        settingsStore.soundVolume * 100
                      }%, #d7c190 ${settingsStore.soundVolume * 100}%, #d7c190 100%)`,
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <label className="text-sm font-semibold text-[#402818]">{t('backgroundMusic')}</label>
                <ToggleSwitch
                  enabled={settingsStore.musicEnabled}
                  onClick={() => {
                    const next = !settingsStore.musicEnabled;
                    settingsStore.setMusicEnabled(next);
                    if (!next) {
                      audioSystem.stopBackgroundMusic();
                    } else {
                      audioSystem.playMenuMusic();
                    }
                  }}
                />
              </div>

              {settingsStore.musicEnabled && (
                <div className="rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#402818]">Music Volume</span>
                    <span className="text-xs font-bold text-[#5a3926]">
                      {Math.round(settingsStore.musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settingsStore.musicVolume}
                    onChange={(e) => settingsStore.setMusicVolume(parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#d7c190]"
                    style={{
                      background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                        settingsStore.musicVolume * 100
                      }%, #d7c190 ${settingsStore.musicVolume * 100}%, #d7c190 100%)`,
                    }}
                  />
                </div>
              )}
            </div>
          </section>

          <section className={panelClass}>
            <h3 className={`${sectionTitleClass} mb-3`}>{t('game')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <label className="text-sm font-semibold text-[#402818]">{t('difficulty')}</label>
                <select
                  value={settingsStore.difficulty}
                  onChange={(e) => settingsStore.setDifficulty(e.target.value as GameSettings['difficulty'])}
                  className="rounded-xl border border-[#ae8b57] bg-[#f4ebd3] px-3 py-1.5 text-sm font-semibold text-[#402818] outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="easy">{t('easy')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="hard">{t('hard')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <label className="text-sm font-semibold text-[#402818]">{t('autoSave')}</label>
                <ToggleSwitch
                  enabled={settingsStore.autoSave}
                  onClick={() => settingsStore.setAutoSave(!settingsStore.autoSave)}
                />
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h3 className={`${sectionTitleClass} mb-3`}>{t('language')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#402818]">{t('uiLanguage')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'en', label: 'English' },
                    { value: 'th', label: 'Thai' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => settingsStore.setUiLanguage(value as GameSettings['uiLanguage'])}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        settingsStore.uiLanguage === value
                          ? 'border-emerald-300 bg-emerald-600 text-white shadow-md'
                          : 'border-[#b99764] bg-[#f4ebd3] text-[#4a2f1b] hover:bg-[#eee0be]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#402818]">
                  {t('languageDirection')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'en-to-th', label: 'EN->TH', desc: t('englishToThai') },
                    { value: 'th-to-en', label: 'TH->EN', desc: t('thaiToEnglish') },
                    { value: 'mixed', label: 'Mix', desc: t('mixed') },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        settingsStore.setLanguageDirection(value as GameSettings['languageDirection'])
                      }
                      className={`rounded-xl border px-2 py-2 text-xs font-bold transition sm:text-sm ${
                        settingsStore.languageDirection === value
                          ? 'border-cyan-300 bg-cyan-600 text-white shadow-md'
                          : 'border-[#b99764] bg-[#f4ebd3] text-[#4a2f1b] hover:bg-[#eee0be]'
                      }`}
                      title={desc}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h3 className={`${sectionTitleClass} mb-3`}>{t('soldierSelection')}</h3>
            <div className="rounded-2xl border border-[#d2bc8f] bg-white/65 p-3 sm:p-4">
              <SoldierSelector />
            </div>
          </section>

          <section className={panelClass}>
            <h3 className={`${sectionTitleClass} mb-3`}>{t('questionFormats')}</h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <input
                  type="checkbox"
                  checked={settingsStore.questionTypes.multipleChoice}
                  onChange={(e) =>
                    settingsStore.setQuestionTypes({
                      ...settingsStore.questionTypes,
                      multipleChoice: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <span className="text-sm font-semibold text-[#402818]">{t('multipleChoiceOption')}</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8c49a] bg-white/70 px-3 py-2">
                <input
                  type="checkbox"
                  checked={settingsStore.questionTypes.letterArrangement}
                  onChange={(e) =>
                    settingsStore.setQuestionTypes({
                      ...settingsStore.questionTypes,
                      letterArrangement: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <span className="text-sm font-semibold text-[#402818]">{t('letterArrangementOption')}</span>
              </label>
            </div>
          </section>
        </div>

        <div className="relative border-t border-[#8f6a40]/60 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex justify-end">
            <GameButton variant="primary" size="md" onClick={onClose}>
              {t('save')}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};
