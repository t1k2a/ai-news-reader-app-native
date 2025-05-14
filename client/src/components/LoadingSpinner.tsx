import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };
  
  return (
    <div className={`flex justify-center items-center py-4 ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeMap[size]} border-t-blue-500 border-blue-500/30`}
      />
    </div>
  );
}