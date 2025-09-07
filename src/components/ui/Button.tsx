import React from 'react';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-game-primary to-game-secondary text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 focus:ring-game-primary/50',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500/50',
    outline: 'border-2 border-game-primary bg-transparent text-game-primary hover:bg-game-primary hover:text-white focus:ring-game-primary/50',
    ghost: 'text-game-dark hover:bg-game-primary/10 focus:ring-game-primary/50',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;