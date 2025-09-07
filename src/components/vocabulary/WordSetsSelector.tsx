import React from 'react';
import { useVocabStore } from '../../stores/vocabStore';
import { useTranslation } from '../../hooks/useTranslation';

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
      // Remove from selection (but keep at least one selected)
      if (vocabStore.selectedWordSets.length > 1) {
        vocabStore.setSelectedWordSets(
          vocabStore.selectedWordSets.filter(id => id !== setId)
        );
      }
    } else {
      // Add to selection
      vocabStore.setSelectedWordSets([...vocabStore.selectedWordSets, setId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📚 {t('selectWordSets')}
              </h2>
              <p className="text-purple-100 mt-1">{t('chooseWordSetsDescription')}</p>
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4 md:grid-cols-2">
            {vocabStore.wordSets.map((wordSet) => {
              const isSelected = vocabStore.selectedWordSets.includes(wordSet.id);
              
              return (
                <div
                  key={wordSet.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleSetToggle(wordSet.id)}
                >
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    isSelected ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </div>

                  {/* Word Set Info */}
                  <div className="pr-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: wordSet.color + '20', color: wordSet.color }}
                      >
                        {wordSet.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{wordSet.name}</h3>
                        <p className="text-sm text-gray-600">{wordSet.words.length} คำ</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{wordSet.description}</p>
                    
                    {/* Sample words preview */}
                    <div className="flex flex-wrap gap-1">
                      {wordSet.words.slice(0, 4).map((word) => (
                        <span 
                          key={word.id}
                          className="px-2 py-1 bg-gray-100 text-xs rounded-md text-gray-600"
                        >
                          {word.word}
                        </span>
                      ))}
                      {wordSet.words.length > 4 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{wordSet.words.length - 4} เพิ่มเติม
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-2">
              📊 {t('selectedSetsCount')} ({vocabStore.selectedWordSets.length})
            </h4>
            <div className="text-sm text-gray-600">
              <p>จำนวนคำทั้งหมด: {vocabStore.getActiveWords().length} คำ</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {vocabStore.selectedWordSets.map((setId) => {
                  const wordSet = vocabStore.wordSets.find(s => s.id === setId);
                  return wordSet ? (
                    <span 
                      key={setId}
                      className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-md"
                    >
                      {wordSet.icon} {wordSet.name.split(': ')[1]}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
            >
              ✅ เสร็จสิ้น
            </button>
            <button
              onClick={() => {
                // Select all sets
                vocabStore.setSelectedWordSets(vocabStore.wordSets.map(s => s.id));
              }}
              className="px-4 py-3 bg-gray-500 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
            >
              🎯 เลือกทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};