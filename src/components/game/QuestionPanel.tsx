import React, { useState, useEffect } from 'react';
import type { VocabQuestion } from '../../types';
// import { useTouchGestures } from '../../hooks/useTouchGestures';
// import { useViewport } from '../../hooks/useViewport';
import { useTranslation } from '../../hooks/useTranslation';

interface QuestionPanelProps {
  question: VocabQuestion | null;
  timeRemaining: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  timeRemaining,
  onAnswer,
  disabled = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [arrangedLetters, setArrangedLetters] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  // const viewport = useViewport();
  const { t } = useTranslation();

  useEffect(() => {
    // Reset answers when new question appears
    setSelectedAnswer('');
    setTypedAnswer('');
    setArrangedLetters([]);
  }, [question?.id]);

  if (!question) {
    return null;
  }

  const timePercentage = (timeRemaining / question.timeLimit) * 100;
  const isUrgent = timePercentage < 30;

  const handleSubmit = () => {
    if (disabled) return;
    
    let answer = '';
    if (question.type === 'multipleChoice') {
      answer = selectedAnswer;
    } else if (question.type === 'letterArrangement') {
      answer = arrangedLetters.join('');
    } else {
      answer = typedAnswer;
    }
    
    if (answer.trim()) {
      onAnswer(answer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-black/35 backdrop-blur-sm rounded-xl p-2 sm:p-3 max-h-[34vh] sm:max-h-[38vh] overflow-y-auto">
      {/* Time Bar - Compact */}
      <div className="mb-1 sm:mb-2">
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              isUrgent ? 'bg-red-500' : timePercentage < 60 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.max(0, timePercentage)}%` }}
          />
        </div>
      </div>

      {/* Question Word - Compact */}
      <div className="mb-2 sm:mb-3">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-sm text-white p-1 sm:p-2 rounded-lg text-center shadow-lg border border-orange-400/30">
          <span className="text-sm sm:text-lg font-bold">{question.word.word}</span>
        </div>
      </div>

      {/* Answer Options - 1x4 Row Layout */}
      {question.type === 'multipleChoice' && question.options && (
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedAnswer(option);
                // Auto submit when option is selected
                if (!disabled) {
                  setTimeout(() => onAnswer(option), 100); // Small delay for visual feedback
                }
              }}
              disabled={disabled}
              className={`p-1 sm:p-2 rounded-lg border-2 text-center transition-all duration-200 touch-target ${
                selectedAnswer === option
                  ? 'border-orange-400 bg-orange-400/90 text-white backdrop-blur-sm shadow-lg'
                  : 'border-white/30 bg-white/80 hover:border-orange-300 hover:bg-orange-200/80 text-gray-800 backdrop-blur-sm'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-xs sm:text-sm leading-tight font-medium">{option}</div>
            </button>
          ))}
        </div>
      )}

      {/* Letter Arrangement */}
      {question.type === 'letterArrangement' && question.scrambledLetters && (
        <div className="mb-2 sm:mb-3 space-y-2 sm:space-y-3">
          {/* Answer Area */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-2 sm:p-3 min-h-[50px] flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
            {arrangedLetters.length > 0 ? (
              arrangedLetters.map((letter, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newArranged = [...arrangedLetters];
                    newArranged.splice(index, 1);
                    setArrangedLetters(newArranged);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-blue-600 transition-all shadow-sm"
                >
                  {letter}
                </button>
              ))
            ) : (
              <span className="text-gray-400 text-sm">{t('clickLetters')}</span>
            )}
          </div>
          
          {/* Available Letters */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {question.scrambledLetters
              .filter(letter => !arrangedLetters.includes(letter) || 
                arrangedLetters.filter(l => l === letter).length < 
                question.scrambledLetters!.filter(l => l === letter).length
              )
              .map((letter, index) => (
                <button
                  key={`${letter}-${index}`}
                  onClick={() => {
                    setArrangedLetters([...arrangedLetters, letter]);
                    // Auto-submit when complete
                    if (arrangedLetters.length + 1 === question.scrambledLetters!.length && !disabled) {
                      const finalAnswer = [...arrangedLetters, letter].join('');
                      setTimeout(() => onAnswer(finalAnswer), 100);
                    }
                  }}
                  disabled={disabled}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-lg font-bold text-base sm:text-lg transition-all shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {letter}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Typing Input */}
      {(question.type === 'typing' || question.type === 'spelling') && (
        <div className="mb-2 sm:mb-3">
          <input
            type="text"
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={t('typeAnswerHere')}
            className="w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-base sm:text-lg disabled:opacity-50"
            autoFocus
          />
        </div>
      )}

      {/* Submit Button - Only show for typing/spelling modes */}
      {(question.type === 'typing' || question.type === 'spelling') && (
        <button
          onClick={handleSubmit}
          disabled={disabled || !typedAnswer.trim()}
          className="w-full py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
        >
          {t('submitAnswer')}
        </button>
      )}
      
      {/* Progress Indicator for Letter Arrangement */}
      {question.type === 'letterArrangement' && (
        <div className="text-center text-xs sm:text-sm text-gray-400">
          {t('progress')}: {arrangedLetters.length} / {question.scrambledLetters?.length || 0} letters
        </div>
      )}
    </div>
  );
};
