import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
// import { BasicSprite } from '../game/sprites/BasicSprite';

// Component to show preview of specific soldier
const SoldierPreview: React.FC<{ soldierType: string }> = ({ soldierType }) => {
  // Scale up soldier2 (Bravo) to match others in preview
  const scale = soldierType === 'soldier2' ? 1.4 : 1.0;
  
  return (
    <img
      src={`/assets/characters/soldier/${soldierType}/Idle__000.png`}
      alt={`${soldierType} preview`}
      style={{ 
        width: `${48 * scale}px`, 
        height: `${64 * scale}px`, 
        objectFit: 'contain',
        imageRendering: 'pixelated'
      }}
      onError={(e) => {
        // Fallback to emoji if image fails to load
        e.currentTarget.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.textContent = '🪖';
        fallback.style.fontSize = '32px';
        e.currentTarget.parentNode?.appendChild(fallback);
      }}
    />
  );
};

interface SoldierSelectorProps {
  onSoldierSelected?: (soldier: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4') => void;
  className?: string;
}

const SoldierSelector: React.FC<SoldierSelectorProps> = ({
  onSoldierSelected,
  className = ''
}) => {
  const { soldierType, setSoldierType } = useSettingsStore();

  const soldiers = [
    { value: 'soldier1', name: 'Soldier Alpha', bgColor: 'bg-green-600', hoverColor: 'hover:bg-green-700' },
    { value: 'soldier2', name: 'Soldier Bravo', bgColor: 'bg-blue-600', hoverColor: 'hover:bg-blue-700' },
    { value: 'soldier3', name: 'Soldier Charlie', bgColor: 'bg-red-600', hoverColor: 'hover:bg-red-700' },
    { value: 'soldier4', name: 'Soldier Delta', bgColor: 'bg-purple-600', hoverColor: 'hover:bg-purple-700' },
  ] as const;

  const handleSoldierSelect = (soldier: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4') => {
    setSoldierType(soldier);
    onSoldierSelected?.(soldier);
  };

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold text-game-dark mb-2">🪖 Choose Your Soldier</h2>
      <p className="text-game-dark/70 text-center mb-6">Select a soldier character for your mission</p>
      
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4 w-full max-w-4xl">
        {soldiers.map((soldier) => (
          <div
            key={soldier.value}
            className={`
              relative flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105
              ${soldierType === soldier.value 
                ? `${soldier.bgColor} shadow-lg ring-4 ring-white ring-opacity-50 scale-105` 
                : 'bg-white shadow-md hover:shadow-lg border-2 border-gray-200'
              }
            `}
            onClick={() => handleSoldierSelect(soldier.value)}
          >
            {/* Soldier Preview */}
            <div className="mb-3 bg-gray-100 rounded-lg p-2 w-24 h-24 flex items-center justify-center overflow-hidden">
              <SoldierPreview soldierType={soldier.value} />
            </div>
            
            {/* Soldier Name */}
            <span className={`text-sm font-bold ${soldierType === soldier.value ? 'text-white' : 'text-gray-700'}`}>
              {soldier.name}
            </span>
            
            {/* Selection Indicator */}
            {soldierType === soldier.value && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Current Selection Display */}
      <div className="mt-6 p-4 bg-white rounded-xl shadow-md border-2 border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 rounded-lg p-2 w-16 h-16 flex items-center justify-center overflow-hidden">
            <SoldierPreview soldierType={soldierType} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected:</p>
            <p className="text-lg font-bold text-game-dark capitalize">{soldiers.find(s => s.value === soldierType)?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoldierSelector;