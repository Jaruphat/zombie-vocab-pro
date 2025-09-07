import React from 'react';

interface GameStatsProps {
  coins: number;
  lives: number;
  score: number;
  level: number;
  levelText: string;
  showFullLevel?: boolean;
}

export const GameStats: React.FC<GameStatsProps> = ({ 
  coins, 
  lives, 
  score, 
  level, 
  levelText, 
  showFullLevel = true 
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
      {/* Coins */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-200 shadow-inner"></div>
        </div>
        <span className="font-bold text-sm sm:text-base text-yellow-100">{coins}</span>
      </div>
      
      {/* Lives */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-sm transform rotate-45"></div>
          <div className="absolute top-0.5 left-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
          <div className="absolute top-0.5 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
        </div>
        <span className="font-bold text-sm sm:text-base text-red-100">{lives}</span>
      </div>
      
      {/* Score */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-sm" 
               style={{ 
                 clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
               }}>
          </div>
        </div>
        <span className="font-bold text-sm sm:text-base text-yellow-100">{score}</span>
      </div>
      
      {/* Level */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-blue-300 bg-blue-500 flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-200 rounded-full"></div>
        </div>
        {showFullLevel ? (
          <span className="font-bold text-sm sm:text-base text-blue-100">{levelText} {level}</span>
        ) : (
          <span className="font-bold text-sm text-blue-100">{level}</span>
        )}
      </div>
    </div>
  );
};