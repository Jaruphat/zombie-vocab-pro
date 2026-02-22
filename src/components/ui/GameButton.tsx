import React from 'react';

interface GameButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const GameButton: React.FC<GameButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon
}) => {
  const baseClasses = 'group relative isolate overflow-visible rounded-full font-black uppercase tracking-wide transition-all duration-200 active:translate-y-[1px] active:scale-[0.99]';
  const sizeClasses = {
    sm: {
      root: 'h-10 px-3 pl-10 text-xs min-w-[86px]',
      icon: 'w-8 h-8 left-1',
    },
    md: {
      root: 'h-12 px-5 pl-14 text-sm sm:text-base min-w-[170px]',
      icon: 'w-10 h-10 left-1',
    },
    lg: {
      root: 'h-14 px-6 pl-16 text-base sm:text-lg min-w-[210px]',
      icon: 'w-12 h-12 left-1',
    },
  };

  const variantFillMap: Record<NonNullable<GameButtonProps['variant']>, string> = {
    primary: '/assets/ui/jungle/load_bar/1.png',
    secondary: '/assets/ui/jungle/load_bar/2.png',
    tertiary: '/assets/ui/jungle/load_bar/3.png',
    danger: '/assets/ui/jungle/load_bar/3.png',
  };

  const variantIconMap: Record<NonNullable<GameButtonProps['variant']>, string> = {
    primary: '/assets/ui/jungle/btn/play.png',
    secondary: '/assets/ui/jungle/btn/upgrade.png',
    tertiary: '/assets/ui/jungle/btn/settings.png',
    danger: '/assets/ui/jungle/btn/menu.png',
  };

  const variantTintMap: Record<NonNullable<GameButtonProps['variant']>, string> = {
    primary: 'bg-emerald-400/10',
    secondary: 'bg-cyan-400/10',
    tertiary: 'bg-amber-400/10',
    danger: 'bg-rose-500/14',
  };

  const disabledClasses = disabled
    ? 'opacity-45 cursor-not-allowed'
    : 'cursor-pointer hover:scale-[1.02] hover:-translate-y-[1px]';

  const sizing = sizeClasses[size];
  const fillSrc = variantFillMap[variant];
  const iconSrc = variantIconMap[variant];
  const tintClass = variantTintMap[variant];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${sizing.root}
        ${disabledClasses}
        ${className}
      `}
    >
      <img
        src="/assets/ui/jungle/load_bar/bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        draggable={false}
      />
      <div className="absolute inset-[3px] rounded-full overflow-hidden pointer-events-none">
        <img
          src={fillSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-fill opacity-90"
          draggable={false}
        />
      </div>
      <span className={`absolute inset-[3px] rounded-full pointer-events-none ${tintClass}`} />
      <img
        src={iconSrc}
        alt=""
        className={`absolute top-1/2 -translate-y-1/2 ${sizing.icon} object-contain pointer-events-none select-none`}
        draggable={false}
      />
      <span className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),transparent_52%)]" />
      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.28)_43%,transparent_76%)]" />
      <span className="relative z-10 flex items-center justify-center gap-2 text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.32)' }}>
        <span>{children}</span>
        {icon && <span className="text-[0.9em] opacity-90">{icon}</span>}
      </span>
    </button>
  );
};
