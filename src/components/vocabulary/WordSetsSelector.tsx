import React from 'react';
import { useVocabStore } from '../../stores/vocabStore';
import { useTranslation } from '../../hooks/useTranslation';
import { GameButton } from '../ui/GameButton';

interface WordSetsSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordSetsSelector: React.FC<WordSetsSelectorProps> = ({ isOpen, onClose }) => {
  const vocabStore = useVocabStore();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSetToggle = (setId: string) => {
    const isSelected = vocabStore.selectedWordSets.includes(setId);
    if (isSelected) {
      if (vocabStore.selectedWordSets.length > 1) {
        vocabStore.setSelectedWordSets(vocabStore.selectedWordSets.filter((id) => id !== setId));
      }
      return;
    }

    vocabStore.setSelectedWordSets([...vocabStore.selectedWordSets, setId]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-[2px]">
      <div className="relative mx-auto flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-[#d9c5a6]/55 bg-gradient-to-b from-[#fffaf1] via-[#f3e8d3] to-[#e6d6bc] shadow-[0_28px_55px_rgba(0,0,0,0.55)] sm:max-w-3xl">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_8%,rgba(255,255,255,0.35),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.2),transparent_38%)]" />

        <div className="relative border-b border-[#e8dbc5]/45 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-[#4a3a28] sm:text-2xl">
                {t('selectWordSets')}
              </h2>
              <p className="text-xs text-[#6b5843] sm:text-sm">{t('chooseWordSetsDescription')}</p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#e8dbc5]/45 bg-[#d4be98] shadow-md transition hover:brightness-110"
              aria-label="Close word set selector"
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

        <div className="game-scroll relative min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {vocabStore.wordSets.map((wordSet) => {
              const isSelected = vocabStore.selectedWordSets.includes(wordSet.id);

              return (
                <button
                  key={wordSet.id}
                  type="button"
                  onClick={() => handleSetToggle(wordSet.id)}
                  className={`relative rounded-2xl border p-3 text-left transition sm:p-4 ${
                    isSelected
                      ? 'border-emerald-300 bg-[#fff7e8] shadow-[0_10px_20px_rgba(0,0,0,0.2)]'
                      : 'border-[#dcc9a9] bg-[#f8efe1] hover:bg-[#f2e6d3]'
                  }`}
                >
                  <div className="absolute right-3 top-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-black ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-500 text-white'
                          : 'border-[#d2bb96] bg-[#f2e4cf] text-[#6d5a45]'
                      }`}
                    >
                      {isSelected ? 'OK' : ''}
                    </span>
                  </div>

                  <div className="pr-8">
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 text-xl shadow-inner"
                        style={{ backgroundColor: `${wordSet.color}30`, color: wordSet.color }}
                      >
                        {wordSet.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-[#4a3a28]">{wordSet.name}</h3>
                        <p className="text-xs font-semibold text-[#6b5843]">{wordSet.words.length} words</p>
                      </div>
                    </div>

                    <p className="mb-2 text-sm text-[#6b5843]">{wordSet.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {wordSet.words.slice(0, 4).map((word) => (
                        <span
                          key={word.id}
                          className="rounded-md border border-[#efe5d3] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#6f5b46]"
                        >
                          {word.word}
                        </span>
                      ))}
                      {wordSet.words.length > 4 && (
                        <span className="rounded-md border border-[#efe5d3] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#866f56]">
                          +{wordSet.words.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-[#eadfcb] bg-[#fffcf7]/96 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-4">
            <h4 className="mb-2 text-sm font-black uppercase tracking-wide text-[#4a3a28]">
              {t('selectedSetsCount')} ({vocabStore.selectedWordSets.length})
            </h4>
            <p className="text-sm font-semibold text-[#6b5843]">
              Total words: {vocabStore.getActiveWords().length}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {vocabStore.selectedWordSets.map((setId) => {
                const wordSet = vocabStore.wordSets.find((set) => set.id === setId);
                if (!wordSet) return null;
                return (
                  <span
                    key={setId}
                    className="rounded-full border border-[#e2d5bf] bg-white px-2.5 py-1 text-xs font-bold text-[#6d5a45]"
                  >
                    {wordSet.icon} {wordSet.name.includes(': ') ? wordSet.name.split(': ')[1] : wordSet.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative shrink-0 border-t border-[#e8dbc5]/45 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <GameButton
              variant="secondary"
              size="sm"
              onClick={() => vocabStore.setSelectedWordSets(vocabStore.wordSets.map((set) => set.id))}
            >
              Select All
            </GameButton>
            <GameButton variant="primary" size="md" onClick={onClose}>
              Done
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};


