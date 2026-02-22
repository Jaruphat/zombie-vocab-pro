import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

const SOLDIER_TYPES = ['soldier1', 'soldier2', 'soldier3', 'soldier4'] as const;

const SoldierPreview: React.FC<{ soldierType: string }> = ({ soldierType }) => {
  const scale = soldierType === 'soldier2' ? 1.4 : 1.0;

  return (
    <img
      src={`/assets/characters/soldier/${soldierType}/Idle__000.png`}
      alt={`${soldierType} preview`}
      style={{
        width: `${48 * scale}px`,
        height: `${64 * scale}px`,
        objectFit: 'contain',
        imageRendering: 'pixelated',
      }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.textContent = 'S';
        fallback.style.fontSize = '32px';
        fallback.style.fontWeight = '700';
        fallback.style.color = '#5b3a21';
        e.currentTarget.parentNode?.appendChild(fallback);
      }}
    />
  );
};

interface SoldierSelectorProps {
  onSoldierSelected?: (soldier: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4') => void;
  className?: string;
}

const SoldierSelector: React.FC<SoldierSelectorProps> = ({ onSoldierSelected, className = '' }) => {
  const { soldierType, setSoldierType, randomizeSoldier, setRandomizeSoldier } = useSettingsStore();

  const soldiers = [
    { value: 'soldier1', name: 'Soldier Alpha' },
    { value: 'soldier2', name: 'Soldier Bravo' },
    { value: 'soldier3', name: 'Soldier Charlie' },
    { value: 'soldier4', name: 'Soldier Delta' },
  ] as const;

  const getRandomSoldier = (exclude?: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4') => {
    const pool = exclude ? SOLDIER_TYPES.filter((type) => type !== exclude) : SOLDIER_TYPES;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleSoldierSelect = (soldier: 'soldier1' | 'soldier2' | 'soldier3' | 'soldier4') => {
    setRandomizeSoldier(false);
    setSoldierType(soldier);
    onSoldierSelected?.(soldier);
  };

  const handleRandomModeSelect = () => {
    setRandomizeSoldier(true);
    const randomizedSoldier = getRandomSoldier(soldierType);
    setSoldierType(randomizedSoldier);
    onSoldierSelected?.(randomizedSoldier);
  };

  const selectedSoldierLabel = soldiers.find((s) => s.value === soldierType)?.name ?? 'Soldier Alpha';

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="rounded-2xl border border-[#b99662] bg-[#fff6df]/90 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-4">
        <h2 className="text-xl font-black uppercase tracking-wide text-[#3d281a] sm:text-2xl">Choose Your Soldier</h2>
        <p className="mt-1 text-sm font-semibold text-[#6d4a2e]">Select a soldier character for your mission</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        <button
          type="button"
          className={`
            group relative flex min-h-[190px] flex-col items-center rounded-2xl border p-4 transition-all duration-200
            ${randomizeSoldier
              ? 'border-[#5ecf55] bg-gradient-to-b from-[#4d8f2e] via-[#3c7126] to-[#2f5b1f] text-white shadow-[0_14px_22px_rgba(0,0,0,0.35)]'
              : 'border-[#cdb084] bg-[#f7efdb] text-[#4f3521] shadow-[0_10px_18px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_14px_22px_rgba(0,0,0,0.24)]'
            }
          `}
          onClick={handleRandomModeSelect}
        >
          <div className="pointer-events-none absolute left-4 right-4 top-4 h-2 rounded-full bg-[#5a4632]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]" />
          <div
            className={`mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border ${
              randomizeSoldier ? 'border-[#cde9b0] bg-[#ffffff1f]' : 'border-[#d8c09a] bg-[#fff9ea]'
            }`}
          >
            <img
              src="/assets/ui/jungle/btn/menu.png"
              alt=""
              className="h-12 w-12 object-contain opacity-90"
              draggable={false}
            />
          </div>
          <span className={`text-sm font-black uppercase tracking-wide ${randomizeSoldier ? 'text-white' : 'text-[#4f3521]'}`}>
            Random Mode
          </span>
          <span className={`mt-1 text-[11px] font-semibold ${randomizeSoldier ? 'text-[#e8ffd0]' : 'text-[#7a5a39]'}`}>
            Change every level
          </span>
          {randomizeSoldier && (
            <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-white/80 bg-[#2fe173] shadow-[0_0_0_2px_rgba(8,31,14,0.35)]" />
          )}
          {!randomizeSoldier && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_50%)]" />
          )}
        </button>

        {soldiers.map((soldier) => {
          const isActive = soldierType === soldier.value && !randomizeSoldier;

          return (
            <button
              key={soldier.value}
              type="button"
              className={`
                group relative flex min-h-[190px] flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200
                ${isActive
                  ? 'border-[#5ecf55] bg-gradient-to-b from-[#4d8f2e] via-[#3c7126] to-[#2f5b1f] text-white shadow-[0_14px_22px_rgba(0,0,0,0.35)]'
                  : 'border-[#cdb084] bg-[#f7efdb] text-[#4f3521] shadow-[0_10px_18px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_14px_22px_rgba(0,0,0,0.24)]'
                }
              `}
              onClick={() => handleSoldierSelect(soldier.value)}
            >
              <div className="pointer-events-none absolute left-4 right-4 top-4 h-2 rounded-full bg-[#5a4632]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]" />
              <div
                className={`mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border ${
                  isActive ? 'border-[#cde9b0] bg-[#ffffff1f]' : 'border-[#d8c09a] bg-[#fff9ea]'
                }`}
              >
                <SoldierPreview soldierType={soldier.value} />
              </div>
              <span className={`text-sm font-black tracking-wide ${isActive ? 'text-white' : 'text-[#4f3521]'}`}>
                {soldier.name}
              </span>

              {isActive && (
                <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-white/80 bg-[#2fe173] shadow-[0_0_0_2px_rgba(8,31,14,0.35)]" />
              )}
              {!isActive && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_50%)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#b99662] bg-[#fff6df]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#d8c09a] bg-[#fff9ea]">
            {randomizeSoldier ? (
              <img
                src="/assets/ui/jungle/btn/menu.png"
                alt=""
                className="h-8 w-8 object-contain"
                draggable={false}
              />
            ) : (
              <SoldierPreview soldierType={soldierType} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a5a39]">Selected</p>
            <p className="truncate text-lg font-black text-[#3d281a]">
              {randomizeSoldier ? 'Random (Every Level)' : selectedSoldierLabel}
            </p>
            {randomizeSoldier && (
              <p className="text-xs font-semibold text-[#7a5a39]">Current: {selectedSoldierLabel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoldierSelector;
