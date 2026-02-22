import React, { useRef, useState } from 'react';
import { useVocabStore } from '../../stores/vocabStore';
import type { VocabWord, WordSet } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { GameButton } from '../ui/GameButton';

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
  const wordSetEditorRef = useRef<HTMLDivElement | null>(null);
  
  // Word Sets states
  const [newWordSet, setNewWordSet] = useState({
    name: '', 
    description: '', 
    color: '#3B82F6', 
    icon: 'book'
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
    setNewWordSet({ name: '', description: '', color: '#3B82F6', icon: 'book' });
    setSelectedSetWords([]);
  };

  const handleEditWordSet = (wordSet: WordSet) => {
    setEditingWordSet({ ...wordSet });
    setSelectedSetWords([...wordSet.words]);
    requestAnimationFrame(() => {
      wordSetEditorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
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
    <div className="vocab-game-modal fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-[#d9c5a6]/55 bg-gradient-to-b from-[#fffaf1] via-[#f3e8d3] to-[#e6d6bc] shadow-[0_30px_60px_rgba(0,0,0,0.58)] sm:max-h-[90vh] sm:max-w-2xl md:max-w-5xl">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_8%,rgba(255,255,255,0.38),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(255,255,255,0.2),transparent_38%)]" />

        {/* Header */}
        <div className="relative border-b border-[#e8dbc5]/45 p-4 text-[#4a3a28] sm:p-5">
          <div className="pointer-events-none absolute inset-x-3 top-2 h-2 rounded-full bg-gradient-to-r from-[#f5e8cd]/80 via-[#e8d6b6]/70 to-[#d7c09a]/70" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide sm:text-2xl">{t('vocabularyManager')}</h2>
              <p className="text-xs text-[#6b5843] sm:text-sm">{t('addEditManage')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#e8dbc5]/45 bg-[#d4be98] shadow-md transition hover:brightness-110"
              aria-label="Close vocabulary manager"
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

        {/* Tabs */}
        <div className="border-b border-[#e8dbc5]/45 bg-[#d4be98]/45 px-3 pt-2 sm:px-4">
          <div className="flex">
            {[
              { id: 'words', label: t('manageWords') },
              { id: 'sets', label: t('manageWordSets') }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'words' | 'sets')}
                className={`rounded-t-xl px-4 py-2 text-sm font-black uppercase tracking-wide transition-all sm:px-6 sm:py-3 ${
                  activeTab === tab.id
                    ? 'border border-b-0 border-[#e8dbc5] bg-[#fffcf7] text-[#4a3a28] shadow-[0_-4px_10px_rgba(0,0,0,0.15)]'
                    : 'border border-transparent text-[#6b5843] hover:bg-[#d8c7aa]/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="game-scroll relative min-h-0 flex-1 overflow-y-auto bg-[#fffcf7]/96 p-3 text-[#4a3a28] sm:p-6">
          <>
            {activeTab === 'words' && (
              <>
                {/* Filter & Stats */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {['all', 'default', 'custom'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f as 'all' | 'default' | 'custom')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter === f
                          ? 'bg-[#c9781f] text-white'
                          : 'bg-[#f8efe1] text-[#6b5843] hover:bg-[#f2e4cf]'
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
                    type="button"
                    onClick={handleExportWords}
                    className="px-4 py-2 bg-[#5a8f2f] text-white rounded-lg hover:bg-[#4b7827] transition-all font-medium"
                  >
                    Export
                  </button>
                </div>
              </div>

              {/* Add New Word */}
              <div className="bg-[#f8efe1] rounded-xl p-4 mb-6">
                <h3 className="font-bold text-[#4a3a28] mb-3">Add New Word</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="English word"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="px-3 py-2 border border-[#dcc9a9] rounded-lg focus:outline-none focus:border-[#c9781f]"
                  />
                  <input
                    type="text"
                    placeholder="Thai meaning"
                    value={newWord.meaning}
                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                    className="px-3 py-2 border border-[#dcc9a9] rounded-lg focus:outline-none focus:border-[#c9781f]"
                  />
                  <select
                    value={newWord.difficulty}
                    onChange={(e) => setNewWord({ ...newWord, difficulty: parseInt(e.target.value) })}
                    className="px-3 py-2 border border-[#dcc9a9] rounded-lg focus:outline-none focus:border-[#c9781f]"
                  >
                    <option value={1}>Easy (1)</option>
                    <option value={2}>Medium (2)</option>
                    <option value={3}>Hard (3)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddWord}
                    className="px-4 py-2 bg-[#c9781f] text-white rounded-lg hover:bg-[#b06716] transition-all font-medium"
                  >
                    Add Word
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-[#f8efe1] rounded-xl p-4 mb-6">
                <h3 className="font-bold text-[#4a3a28] mb-3">Import Words</h3>
                <textarea
                  placeholder="Paste JSON or CSV data here...&#10;CSV format: word,meaning,difficulty&#10;Example: hello,สวัสดี,1"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 border border-[#dcc9a9] rounded-lg focus:outline-none focus:border-[#5a8f2f] h-24 resize-none"
                />
                <button
                  type="button"
                  onClick={handleImportWords}
                  className="mt-2 px-4 py-2 bg-[#5a8f2f] text-white rounded-lg hover:bg-[#4b7827] transition-all font-medium"
                >
                  Import Words
                </button>
              </div>

              {/* Word List */}
              <div className="space-y-2">
                <h3 className="font-bold text-[#4a3a28] mb-3">
                  Word List ({filteredWords.length} words)
                </h3>
                
                <div className="game-scroll max-h-96 space-y-2 overflow-y-auto">
                  {filteredWords.map((word) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-3 bg-white border border-[#d9c59d] rounded-lg hover:shadow-sm transition-all"
                    >
                      <div className="flex-1">
                        {editingWord?.id === word.id ? (
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editingWord.word}
                              onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                              className="px-2 py-1 border border-[#dcc9a9] rounded focus:outline-none focus:border-[#c9781f]"
                            />
                            <input
                              type="text"
                              value={editingWord.meaning}
                              onChange={(e) => setEditingWord({ ...editingWord, meaning: e.target.value })}
                              className="px-2 py-1 border border-[#dcc9a9] rounded focus:outline-none focus:border-[#c9781f]"
                            />
                            <select
                              value={editingWord.difficulty}
                              onChange={(e) => setEditingWord({ ...editingWord, difficulty: parseInt(e.target.value) })}
                              className="px-2 py-1 border border-[#dcc9a9] rounded focus:outline-none focus:border-[#c9781f]"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            <span className="font-medium text-[#4a3a28]">{word.word}</span>
                            <span className="text-[#6b5843]">{word.meaning}</span>
                            <span className="text-sm text-[#866f56]">
                              Level {word.difficulty}
                              {vocabStore.customWords.includes(word) && (
                                <span className="ml-2 px-2 py-1 bg-[#dcedbc] text-[#3d5f1f] rounded text-xs">Custom</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {editingWord?.id === word.id ? (
                          <>
                            <button
                              type="button"
                              onClick={handleUpdateWord}
                              className="px-3 py-1 bg-[#5a8f2f] text-white rounded hover:bg-[#4b7827] transition-all text-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingWord(null)}
                              className="px-3 py-1 bg-[#8b7357] text-white rounded hover:bg-[#745f47] transition-all text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditWord(word)}
                              className="px-3 py-1 bg-[#5a8f2f] text-white rounded hover:bg-[#4b7827] transition-all text-sm"
                            >
                              Edit
                            </button>
                            {vocabStore.customWords.includes(word) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteWord(word.id)}
                                className="px-3 py-1 bg-[#b64532] text-white rounded hover:bg-[#963827] transition-all text-sm"
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
                <div
                  ref={wordSetEditorRef}
                  className={`rounded-xl p-6 transition-shadow ${
                    editingWordSet ? 'bg-[#fff6e6] ring-2 ring-[#8bc34a]/45 shadow-[0_0_0_3px_rgba(139,195,74,0.12)]' : 'bg-[#f8efe1]'
                  }`}
                >
                  <h3 className="text-lg font-bold text-[#4a3a28] mb-4">
                    {editingWordSet ? t('editWordSet') : t('addWordSet')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6b5843] mb-2">
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
                        className="w-full px-3 py-2 border border-[#dcc9a9] rounded-lg focus:ring-2 focus:ring-[#5a8f2f] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#6b5843] mb-2">
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
                        className="w-full px-3 py-2 border border-[#dcc9a9] rounded-lg focus:ring-2 focus:ring-[#5a8f2f] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#6b5843] mb-2">
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
                          className="w-12 h-10 border border-[#dcc9a9] rounded-lg"
                        />
                        <span className="text-sm text-[#866f56]">
                          {editingWordSet ? editingWordSet.color : newWordSet.color}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#6b5843] mb-2">
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
                        placeholder="book"
                        className="w-full px-3 py-2 border border-[#dcc9a9] rounded-lg focus:ring-2 focus:ring-[#5a8f2f] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Word Selection for Set */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#6b5843] mb-2">
                      {t('selectWords')} ({selectedSetWords.length} {t('words')})
                    </label>
                    <div className="game-scroll max-h-40 overflow-y-auto rounded-lg border border-[#dcc9a9] bg-white p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {allWords.map((word) => (
                          <label key={word.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[#f4e9d4] rounded">
                            <input
                              type="checkbox"
                              checked={selectedSetWords.some(w => w.id === word.id)}
                              onChange={() => handleToggleWordInSet(word)}
                              className="rounded border-[#dcc9a9] text-blue-500 focus:ring-[#5a8f2f]"
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
                      type="button"
                      onClick={editingWordSet ? handleUpdateWordSet : handleAddWordSet}
                      className="px-6 py-2 bg-[#5a8f2f] text-white rounded-lg hover:bg-[#4b7827] transition-all font-medium"
                    >
                      {editingWordSet ? t('saveChanges') : t('addWordSetAction')}
                    </button>
                    
                    {editingWordSet && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWordSet(null);
                          setSelectedSetWords([]);
                        }}
                        className="px-6 py-2 bg-[#8b7357] text-white rounded-lg hover:bg-[#745f47] transition-all"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Word Sets List */}
                <div>
                  <h3 className="text-lg font-bold text-[#4a3a28] mb-4">{t('allWordSets')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {vocabStore.wordSets.map((wordSet) => (
                      <div
                        key={wordSet.id}
                        className="p-4 border border-[#d9c59d] rounded-xl hover:shadow-lg transition-all"
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
                              <h4 className="font-bold text-[#4a3a28]">{wordSet.name}</h4>
                              <p className="text-sm text-[#6b5843]">{wordSet.words.length} {t('words')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleEditWordSet(wordSet);
                              }}
                              className="relative z-10 px-3 py-1 bg-[#5a8f2f] text-white rounded hover:bg-[#4b7827] transition-all text-sm"
                            >
                              {t('edit')}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleDeleteWordSet(wordSet.id);
                              }}
                              className="relative z-10 px-3 py-1 bg-[#b64532] text-white rounded hover:bg-[#963827] transition-all text-sm"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-[#6b5843] mb-2">{wordSet.description}</p>
                        
                        {/* Preview words */}
                        <div className="flex flex-wrap gap-1">
                          {wordSet.words.slice(0, 5).map((word) => (
                            <span key={word.id} className="px-2 py-1 bg-[#f8efe1] text-xs rounded text-[#6b5843]">
                              {word.word}
                            </span>
                          ))}
                          {wordSet.words.length > 5 && (
                            <span className="px-2 py-1 text-xs text-[#866f56]">
                              +{wordSet.words.length - 5} {t('more')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {vocabStore.wordSets.length === 0 && (
                    <div className="text-center py-12 text-[#866f56]">
                      <p className="text-xl mb-2">SETS</p>
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
        <div className="shrink-0 border-t border-[#e8dbc5]/45 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex justify-end">
            <GameButton variant="primary" size="md" onClick={onClose}>
              Done
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};
