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
  const baseClasses = 'font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base',
    lg: 'px-6 py-4 text-base sm:text-lg'
  };
  
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
      text-white border-2 border-orange-600 hover:border-orange-700
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-orange-400 before:to-orange-500 
      before:opacity-0 hover:before:opacity-20 before:transition-opacity
    `,
    secondary: `
      bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
      text-white border-2 border-blue-600 hover:border-blue-700
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400 before:to-blue-500 
      before:opacity-0 hover:before:opacity-20 before:transition-opacity
    `,
    tertiary: `
      bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 
      text-gray-800 border-2 border-gray-300 hover:border-gray-400 hover:text-gray-900
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-50 before:to-gray-100 
      before:opacity-0 hover:before:opacity-50 before:transition-opacity
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
      text-white border-2 border-red-600 hover:border-red-700
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-400 before:to-red-500 
      before:opacity-0 hover:before:opacity-20 before:transition-opacity
    `
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed hover:shadow-lg transform-none hover:scale-100' 
    : 'hover:scale-105 cursor-pointer';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabledClasses}
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center gap-2" style={{ color: 'inherit' }}>
        {icon && <span>{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};