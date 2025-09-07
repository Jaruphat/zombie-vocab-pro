import React, { useState } from 'react';
import { useVocabStore } from '../../stores/vocabStore';
import type { VocabWord, WordSet } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface VocabManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VocabManager: React.FC<VocabManagerProps> = ({ isOpen, onClose }) => {
  const vocabStore = useVocabStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'words' | 'sets'>('words');
  const [newWord, setNewWord] = useState({ word: '', meaning: '', difficulty: 1 });
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [filter, setFilter] = useState<'all' | 'default' | 'custom'>('all');
  const [importText, setImportText] = useState('');
  
  // Word Sets states
  const [newWordSet, setNewWordSet] = useState({ 
    name: '', 
    description: '', 
    color: '#3B82F6', 
    icon: '📚'
  });
  const [editingWordSet, setEditingWordSet] = useState<WordSet | null>(null);
  const [selectedSetWords, setSelectedSetWords] = useState<VocabWord[]>([]);

  if (!isOpen) return null;

  const allWords = [...vocabStore.words, ...vocabStore.customWords];
  const filteredWords = allWords.filter(word => {
    if (filter === 'default') return vocabStore.words.includes(word);
    if (filter === 'custom') return vocabStore.customWords.includes(word);
    return true;
  });

  const handleAddWord = () => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    
    vocabStore.addWord({
      id: '', // Will be generated
      word: newWord.word.trim(),
      meaning: newWord.meaning.trim(),
      difficulty: newWord.difficulty
    });
    
    setNewWord({ word: '', meaning: '', difficulty: 1 });
  };

  const handleEditWord = (word: VocabWord) => {
    setEditingWord({ ...word });
  };

  const handleUpdateWord = () => {
    if (!editingWord) return;
    
    vocabStore.updateWord(editingWord.id, {
      word: editingWord.word.trim(),
      meaning: editingWord.meaning.trim(),
      difficulty: editingWord.difficulty
    });
    
    setEditingWord(null);
  };

  const handleDeleteWord = (id: string) => {
    if (confirm('Are you sure you want to delete this word?')) {
      vocabStore.removeWord(id);
    }
  };

  const handleImportWords = () => {
    if (!importText.trim()) return;
    
    try {
      // Try JSON format first
      const jsonWords = JSON.parse(importText);
      if (Array.isArray(jsonWords)) {
        vocabStore.importWords(jsonWords);
        setImportText('');
        return;
      }
    } catch {
      // Try CSV format
      const lines = importText.trim().split('\n');
      const csvWords = lines.map((line, index) => {
        const [word, meaning, difficulty = '1'] = line.split(',').map(s => s.trim());
        if (!word || !meaning) return null;
        
        return {
          id: `import_${index}`,
          word,
          meaning,
          difficulty: parseInt(difficulty) || 1
        };
      }).filter(Boolean) as VocabWord[];
      
      if (csvWords.length > 0) {
        vocabStore.importWords(csvWords);
        setImportText('');
      }
    }
  };

  const handleExportWords = () => {
    const words = vocabStore.exportWords();
    const jsonString = JSON.stringify(words, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zombie-vocab-words.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Word Sets handlers
  const handleAddWordSet = () => {
    if (!newWordSet.name.trim()) return;
    
    const wordSet: WordSet = {
      id: crypto.randomUUID(),
      name: newWordSet.name,
      description: newWordSet.description,
      color: newWordSet.color,
      icon: newWordSet.icon,
      words: selectedSetWords
    };
    
    vocabStore.addWordSet(wordSet);
    setNewWordSet({ name: '', description: '', color: '#3B82F6', icon: '📚' });
    setSelectedSetWords([]);
  };

  const handleEditWordSet = (wordSet: WordSet) => {
    setEditingWordSet({ ...wordSet });
    setSelectedSetWords([...wordSet.words]);
  };

  const handleUpdateWordSet = () => {
    if (!editingWordSet) return;
    
    vocabStore.updateWordSet(editingWordSet.id, {
      name: editingWordSet.name,
      description: editingWordSet.description,
      color: editingWordSet.color,
      icon: editingWordSet.icon,
      words: selectedSetWords
    });
    
    setEditingWordSet(null);
    setSelectedSetWords([]);
  };

  const handleDeleteWordSet = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      vocabStore.removeWordSet(id);
    }
  };

  const handleToggleWordInSet = (word: VocabWord) => {
    const isSelected = selectedSetWords.some(w => w.id === word.id);
    if (isSelected) {
      setSelectedSetWords(selectedSetWords.filter(w => w.id !== word.id));
    } else {
      setSelectedSetWords([...selectedSetWords, word]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-2xl md:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">📚 {t('vocabularyManager')}</h2>
              <p className="opacity-90 text-sm sm:text-base">{t('addEditManage')}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'words', label: `📝 ${t('manageWords')}` },
              { id: 'sets', label: `📚 ${t('manageWordSets')}` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-180px)]">
          <>
            {activeTab === 'words' && (
              <>
                {/* Filter & Stats */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {['all', 'default', 'custom'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter === f
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'All Words' : f === 'default' ? 'Default' : 'Custom'}
                      <span className="ml-2 text-sm">
                        ({f === 'all' ? allWords.length : 
                          f === 'default' ? vocabStore.words.length : 
                          vocabStore.customWords.length})
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleExportWords}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium"
                  >
                    📥 Export
                  </button>
                </div>
              </div>

              {/* Add New Word */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3">➕ Add New Word</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="English word"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Thai meaning"
                    value={newWord.meaning}
                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <select
                    value={newWord.difficulty}
                    onChange={(e) => setNewWord({ ...newWord, difficulty: parseInt(e.target.value) })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value={1}>Easy (1)</option>
                    <option value={2}>Medium (2)</option>
                    <option value={3}>Hard (3)</option>
                  </select>
                  <button
                    onClick={handleAddWord}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-medium"
                  >
                    Add Word
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3">📝 Import Words</h3>
                <textarea
                  placeholder="Paste JSON or CSV data here...&#10;CSV format: word,meaning,difficulty&#10;Example: hello,สวัสดี,1"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-24 resize-none"
                />
                <button
                  onClick={handleImportWords}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium"
                >
                  Import Words
                </button>
              </div>

              {/* Word List */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 mb-3">
                  📖 Word List ({filteredWords.length} words)
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredWords.map((word) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                    >
                      <div className="flex-1">
                        {editingWord?.id === word.id ? (
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editingWord.word}
                              onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-purple-500"
                            />
                            <input
                              type="text"
                              value={editingWord.meaning}
                              onChange={(e) => setEditingWord({ ...editingWord, meaning: e.target.value })}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-purple-500"
                            />
                            <select
                              value={editingWord.difficulty}
                              onChange={(e) => setEditingWord({ ...editingWord, difficulty: parseInt(e.target.value) })}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-purple-500"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            <span className="font-medium text-gray-800">{word.word}</span>
                            <span className="text-gray-600">{word.meaning}</span>
                            <span className="text-sm text-gray-500">
                              Level {word.difficulty}
                              {vocabStore.customWords.includes(word) && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Custom</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {editingWord?.id === word.id ? (
                          <>
                            <button
                              onClick={handleUpdateWord}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-all text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWord(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditWord(word)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-sm"
                            >
                              Edit
                            </button>
                            {vocabStore.customWords.includes(word) && (
                              <button
                                onClick={() => handleDeleteWord(word.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'sets' && (
            <>
              {/* Word Sets Management */}
              <div className="space-y-6">
                
                {/* Add New Word Set Form */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {editingWordSet ? t('editWordSet') : t('addWordSet')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('wordSetName')}
                      </label>
                      <input
                        type="text"
                        value={editingWordSet ? editingWordSet.name : newWordSet.name}
                        onChange={(e) => {
                          if (editingWordSet) {
                            setEditingWordSet({...editingWordSet, name: e.target.value});
                          } else {
                            setNewWordSet({...newWordSet, name: e.target.value});
                          }
                        }}
                        placeholder={t('wordSetName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('description')}
                      </label>
                      <input
                        type="text"
                        value={editingWordSet ? editingWordSet.description : newWordSet.description}
                        onChange={(e) => {
                          if (editingWordSet) {
                            setEditingWordSet({...editingWordSet, description: e.target.value});
                          } else {
                            setNewWordSet({...newWordSet, description: e.target.value});
                          }
                        }}
                        placeholder={t('description')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('setColor')}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={editingWordSet ? editingWordSet.color : newWordSet.color}
                          onChange={(e) => {
                            if (editingWordSet) {
                              setEditingWordSet({...editingWordSet, color: e.target.value});
                            } else {
                              setNewWordSet({...newWordSet, color: e.target.value});
                            }
                          }}
                          className="w-12 h-10 border border-gray-300 rounded-lg"
                        />
                        <span className="text-sm text-gray-500">
                          {editingWordSet ? editingWordSet.color : newWordSet.color}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('icon')}
                      </label>
                      <input
                        type="text"
                        value={editingWordSet ? editingWordSet.icon : newWordSet.icon}
                        onChange={(e) => {
                          if (editingWordSet) {
                            setEditingWordSet({...editingWordSet, icon: e.target.value});
                          } else {
                            setNewWordSet({...newWordSet, icon: e.target.value});
                          }
                        }}
                        placeholder="📚"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Word Selection for Set */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('selectWords')} ({selectedSetWords.length} {t('words')})
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {allWords.map((word) => (
                          <label key={word.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={selectedSetWords.some(w => w.id === word.id)}
                              onChange={() => handleToggleWordInSet(word)}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              <strong>{word.word}</strong> - {word.meaning}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={editingWordSet ? handleUpdateWordSet : handleAddWordSet}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium"
                    >
                      {editingWordSet ? `💾 ${t('saveChanges')}` : `➕ ${t('addWordSetAction')}`}
                    </button>
                    
                    {editingWordSet && (
                      <button
                        onClick={() => {
                          setEditingWordSet(null);
                          setSelectedSetWords([]);
                        }}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                      >
                        ❌ {t('cancel')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Word Sets List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{t('allWordSets')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {vocabStore.wordSets.map((wordSet) => (
                      <div
                        key={wordSet.id}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all"
                        style={{ borderLeftColor: wordSet.color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: wordSet.color + '20', color: wordSet.color }}
                            >
                              {wordSet.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{wordSet.name}</h4>
                              <p className="text-sm text-gray-600">{wordSet.words.length} {t('words')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditWordSet(wordSet)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-sm"
                            >
                              ✏️ {t('edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteWordSet(wordSet.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm"
                            >
                              🗑️ {t('delete')}
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{wordSet.description}</p>
                        
                        {/* Preview words */}
                        <div className="flex flex-wrap gap-1">
                          {wordSet.words.slice(0, 5).map((word) => (
                            <span key={word.id} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                              {word.word}
                            </span>
                          ))}
                          {wordSet.words.length > 5 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                              +{wordSet.words.length - 5} {t('more')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {vocabStore.wordSets.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-xl mb-2">📚</p>
                      <p>{t('noWordSets')}</p>
                      <p className="text-sm">{t('createFirstSet')}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          </>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 text-base"
            >
              ✅ Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};