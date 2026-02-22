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
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl border font-black tracking-wide transition-colors duration-150 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50';

  const sizeClasses = {
    sm: {
      root: 'h-9 min-w-[90px] px-3 text-xs',
    },
    md: {
      root: 'h-11 min-w-[130px] px-4 text-sm sm:text-base',
    },
    lg: {
      root: 'h-12 min-w-[170px] px-5 text-base sm:text-lg',
    },
  };

  const variantClasses: Record<NonNullable<GameButtonProps['variant']>, string> = {
    primary: 'border-[#7fd95f] bg-[#52a538] text-white hover:bg-[#468f31]',
    secondary: 'border-[#dcc9a9] bg-[#f8efe1] text-[#5d4b38] hover:bg-[#f2e4cf]',
    tertiary: 'border-[#f1c55f] bg-[#d8921e] text-[#fff9ec] hover:bg-[#c18017]',
    danger: 'border-[#9eacb7] bg-[#dce3ea] text-[#324553] hover:bg-[#cfd8e2]',
  };

  const disabledClasses = disabled ? '' : 'cursor-pointer';

  const sizing = sizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${sizing.root}
        ${variantClass}
        ${disabledClasses}
        ${className}
      `}
    >
      <span className="flex items-center justify-center gap-2">
        {icon && <span className="text-[0.95em] opacity-90">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};


