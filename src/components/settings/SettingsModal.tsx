import React, { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import SoldierSelector from '../ui/SoldierSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { AudioSystem } from '../../game/systems/AudioSystem';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const settingsStore = useSettingsStore();
  const { t } = useTranslation();
  const audioSystem = AudioSystem.getInstance();

  // Sync AudioSystem with settings store
  useEffect(() => {
    audioSystem.setSoundsEnabled(settingsStore.soundEnabled);
    audioSystem.setMusicEnabled(settingsStore.musicEnabled);
    audioSystem.setSoundVolume(settingsStore.soundVolume);
    audioSystem.setMusicVolume(settingsStore.musicVolume);
  }, [settingsStore.soundEnabled, settingsStore.musicEnabled, settingsStore.soundVolume, settingsStore.musicVolume, audioSystem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full max-h-[95vh] sm:max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                ⚙️ {t('gameSettings')}
              </h2>
              <p className="text-gray-100 mt-1 text-sm sm:text-base">{t('customizeSettings')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[60vh] space-y-4 sm:space-y-6">
          
          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🔊 {t('audio')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">{t('soundEffects')}</label>
                <button
                  onClick={() => {
                    const newState = !settingsStore.soundEnabled;
                    settingsStore.setSoundEnabled(newState);
                    // Play test sound to show toggle works
                    if (newState) {
                      audioSystem.playButtonClickSound();
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settingsStore.soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settingsStore.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Sound Volume Slider */}
              {settingsStore.soundEnabled && (
                <div className="flex items-center justify-between">
                  <label className="text-gray-700 font-medium text-sm">{t('soundVolume') || 'Volume'}</label>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">🔇</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settingsStore.soundVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value);
                        settingsStore.setSoundVolume(volume);
                        // Play test sound to preview volume
                        if (volume > 0) {
                          audioSystem.playButtonClickSound();
                        }
                      }}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${settingsStore.soundVolume * 100}%, #e5e7eb ${settingsStore.soundVolume * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500">🔊</span>
                    <span className="text-xs text-gray-600 w-8">{Math.round(settingsStore.soundVolume * 100)}%</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">{t('backgroundMusic')}</label>
                <button
                  onClick={() => {
                    const newState = !settingsStore.musicEnabled;
                    settingsStore.setMusicEnabled(newState);
                    // Handle background music toggle
                    if (!newState) {
                      audioSystem.stopBackgroundMusic();
                    } else {
                      // Restart current music based on current scene - will be handled by App.tsx useEffect
                      audioSystem.playMenuMusic(); // Default to menu music
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settingsStore.musicEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settingsStore.musicEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Music Volume Slider */}
              {settingsStore.musicEnabled && (
                <div className="flex items-center justify-between">
                  <label className="text-gray-700 font-medium text-sm">{t('musicVolume') || 'Music Volume'}</label>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">🎵</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settingsStore.musicVolume}
                      onChange={(e) => {
                        const volume = parseFloat(e.target.value);
                        settingsStore.setMusicVolume(volume);
                      }}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settingsStore.musicVolume * 100}%, #e5e7eb ${settingsStore.musicVolume * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500">🎶</span>
                    <span className="text-xs text-gray-600 w-8">{Math.round(settingsStore.musicVolume * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🎮 {t('game')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">{t('difficulty')}</label>
                <select
                  value={settingsStore.difficulty}
                  onChange={(e) => settingsStore.setDifficulty(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">😊 {t('easy')}</option>
                  <option value="medium">😐 {t('medium')}</option>
                  <option value="hard">😤 {t('hard')}</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">{t('autoSave')}</label>
                <button
                  onClick={() => settingsStore.setAutoSave(!settingsStore.autoSave)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settingsStore.autoSave ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settingsStore.autoSave ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🌐 {t('language')}
            </h3>
            
            <div className="space-y-4">
              {/* UI Language Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('uiLanguage')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'en', label: 'English', flag: '🇬🇧' },
                    { value: 'th', label: 'ไทย', flag: '🇹🇭' }
                  ].map(({ value, label, flag }) => (
                    <button
                      key={value}
                      onClick={() => settingsStore.setUiLanguage(value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        settingsStore.uiLanguage === value
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 border border-gray-200'
                      }`}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Language Direction */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('languageDirection')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'en-to-th', label: '🇬🇧→🇹🇭', desc: t('englishToThai') },
                    { value: 'th-to-en', label: '🇹🇭→🇬🇧', desc: t('thaiToEnglish') },
                    { value: 'mixed', label: '🔀', desc: t('mixed') }
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => settingsStore.setLanguageDirection(value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        settingsStore.languageDirection === value
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 border border-gray-200'
                      }`}
                      title={desc}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Soldier Character Selection */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🪖 {t('soldierSelection')}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <SoldierSelector />
            </div>
          </div>

          {/* Question Types */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              ❓ {t('questionFormats')}
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsStore.questionTypes.multipleChoice}
                  onChange={(e) => settingsStore.setQuestionTypes({
                    ...settingsStore.questionTypes,
                    multipleChoice: e.target.checked
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">🔢 {t('multipleChoiceOption')}</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsStore.questionTypes.letterArrangement}
                  onChange={(e) => settingsStore.setQuestionTypes({
                    ...settingsStore.questionTypes,
                    letterArrangement: e.target.checked
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">🔤 {t('letterArrangementOption')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 text-base"
            >
              ✅ {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};