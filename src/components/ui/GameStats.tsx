import React from 'react';

interface GameStatsProps {
  coins: number;
  lives: number;
  score: number;
  level: number;
  levelText: string;
  showFullLevel?: boolean;
  hp?: number;
  hpMax?: number;
}

interface StatPillProps {
  value: string | number;
  iconSrc: string;
  fillClass: string;
  minWidth: string;
  label: string;
  fillPercent?: number;
}

const StatPill: React.FC<StatPillProps> = ({
  value,
  iconSrc,
  fillClass,
  minWidth,
  label,
  fillPercent = 100,
}) => (
  <div className={`relative h-9 overflow-hidden rounded-full border border-[#b4946d] bg-[#bda382] ${minWidth}`}>
    <div className="absolute inset-[3px] rounded-full overflow-hidden pointer-events-none bg-[#cbb394]">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-150 ${fillClass}`}
        style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
      />
    </div>
    <img
      src={iconSrc}
      alt=""
      className="absolute left-0.5 top-1/2 h-8 w-8 -translate-y-1/2 object-contain select-none pointer-events-none"
      draggable={false}
    />
    <span
      className="absolute inset-0 flex items-center justify-center pl-8 pr-3 font-black text-white text-xs sm:text-sm tabular-nums tracking-wide"
      aria-label={label}
    >
      {value}
    </span>
  </div>
);

export const GameStats: React.FC<GameStatsProps> = ({
  coins,
  lives,
  score,
  level,
  levelText,
  showFullLevel = true,
  hp,
  hpMax,
}) => {
  const isCompact = !showFullLevel;
  const hpValue = typeof hp === 'number' ? Math.max(0, Math.round(hp)) : undefined;
  const hpTotal = typeof hpMax === 'number' && hpMax > 0 ? hpMax : 100;
  const hpPercent = typeof hpValue === 'number' ? (hpValue / hpTotal) * 100 : 100;
  const hpFillSrc = hpPercent > 60
    ? 'bg-gradient-to-r from-[#26d3d9] to-[#1dbec4]'
    : hpPercent > 30
      ? 'bg-gradient-to-r from-[#facc15] to-[#eab308]'
      : 'bg-gradient-to-r from-[#fb7185] to-[#ef4444]';

  return (
    <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
      <StatPill
        value={coins}
        iconSrc="/assets/ui/jungle/upgrade/luck.png"
        fillClass="bg-gradient-to-r from-[#26d3d9] to-[#1dbec4]"
        minWidth={isCompact ? 'min-w-[54px] sm:min-w-[98px]' : 'min-w-[72px] sm:min-w-[104px]'}
        label="coins"
      />
      <StatPill
        value={lives}
        iconSrc="/assets/ui/jungle/upgrade/heart.png"
        fillClass="bg-gradient-to-r from-[#fb7185] to-[#ef4444]"
        minWidth={isCompact ? 'min-w-[48px] sm:min-w-[86px]' : 'min-w-[62px] sm:min-w-[88px]'}
        label="lives"
      />
      {typeof hpValue === 'number' && (
        <StatPill
          value={showFullLevel ? `HP ${hpValue}/${hpTotal}` : hpValue}
          iconSrc="/assets/ui/jungle/upgrade/heart.png"
          fillClass={hpFillSrc}
          minWidth={isCompact ? 'min-w-[64px] sm:min-w-[118px]' : 'min-w-[112px] sm:min-w-[146px]'}
          label="hp"
          fillPercent={hpPercent}
        />
      )}
      <StatPill
        value={score}
        iconSrc="/assets/ui/jungle/upgrade/star.png"
        fillClass="bg-gradient-to-r from-[#facc15] to-[#eab308]"
        minWidth={isCompact ? 'min-w-[62px] sm:min-w-[112px]' : 'min-w-[78px] sm:min-w-[120px]'}
        label="score"
      />
      <StatPill
        value={showFullLevel ? `${levelText} ${level}` : level}
        iconSrc="/assets/ui/jungle/upgrade/time.png"
        fillClass="bg-gradient-to-r from-[#84cc16] to-[#65a30d]"
        minWidth={showFullLevel ? 'min-w-[84px] sm:min-w-[128px]' : 'min-w-[46px] sm:min-w-[84px]'}
        label="level"
      />
    </div>
  );
};

