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
  fillSrc: string;
  minWidth: string;
  label: string;
  fillPercent?: number;
}

const StatPill: React.FC<StatPillProps> = ({
  value,
  iconSrc,
  fillSrc,
  minWidth,
  label,
  fillPercent = 100,
}) => (
  <div className={`relative h-9 sm:h-10 ${minWidth}`}>
    <img
      src="/assets/ui/jungle/load_bar/bg.png"
      alt=""
      className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
      draggable={false}
    />
    <div className="absolute inset-[3px] rounded-full overflow-hidden pointer-events-none">
      <img
        src={fillSrc}
        alt=""
        className="absolute inset-y-0 left-0 h-full object-fill opacity-90 select-none transition-all duration-150"
        style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
        draggable={false}
      />
    </div>
    <img
      src={iconSrc}
      alt=""
      className="absolute left-[-5px] sm:left-[-6px] top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 object-contain select-none pointer-events-none"
      draggable={false}
    />
    <span
      className="absolute inset-0 flex items-center justify-center pl-8 sm:pl-9 pr-3 font-black text-white text-xs sm:text-sm tabular-nums tracking-wide"
      style={{ textShadow: '0 2px 0 rgba(0,0,0,0.35)' }}
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
    ? '/assets/ui/jungle/load_bar/1.png'
    : hpPercent > 30
      ? '/assets/ui/jungle/load_bar/3.png'
      : '/assets/ui/jungle/load_bar/2.png';

  return (
    <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
      <StatPill
        value={coins}
        iconSrc="/assets/ui/jungle/upgrade/luck.png"
        fillSrc="/assets/ui/jungle/load_bar/1.png"
        minWidth={isCompact ? 'min-w-[54px] sm:min-w-[98px]' : 'min-w-[72px] sm:min-w-[104px]'}
        label="coins"
      />
      <StatPill
        value={lives}
        iconSrc="/assets/ui/jungle/upgrade/heart.png"
        fillSrc="/assets/ui/jungle/load_bar/3.png"
        minWidth={isCompact ? 'min-w-[48px] sm:min-w-[86px]' : 'min-w-[62px] sm:min-w-[88px]'}
        label="lives"
      />
      {typeof hpValue === 'number' && (
        <StatPill
          value={showFullLevel ? `HP ${hpValue}/${hpTotal}` : hpValue}
          iconSrc="/assets/ui/jungle/upgrade/heart.png"
          fillSrc={hpFillSrc}
          minWidth={isCompact ? 'min-w-[64px] sm:min-w-[118px]' : 'min-w-[112px] sm:min-w-[146px]'}
          label="hp"
          fillPercent={hpPercent}
        />
      )}
      <StatPill
        value={score}
        iconSrc="/assets/ui/jungle/upgrade/star.png"
        fillSrc="/assets/ui/jungle/load_bar/3.png"
        minWidth={isCompact ? 'min-w-[62px] sm:min-w-[112px]' : 'min-w-[78px] sm:min-w-[120px]'}
        label="score"
      />
      <StatPill
        value={showFullLevel ? `${levelText} ${level}` : level}
        iconSrc="/assets/ui/jungle/upgrade/time.png"
        fillSrc="/assets/ui/jungle/load_bar/2.png"
        minWidth={showFullLevel ? 'min-w-[84px] sm:min-w-[128px]' : 'min-w-[46px] sm:min-w-[84px]'}
        label="level"
      />
    </div>
  );
};
