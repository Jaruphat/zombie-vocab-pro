import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`game-card p-6 ${className}`}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-2xl font-bold text-game-dark ${className}`}>
      {children}
    </h2>
  );
};

const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };