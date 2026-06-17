import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'pink' | 'lime';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'cyan' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-20 h-20 border-4',
  };

  const colorClasses = {
    cyan: 'border-cyber-cyan/20 border-t-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]',
    pink: 'border-cyber-pink/20 border-t-cyber-pink shadow-[0_0_10px_rgba(255,0,127,0.4)]',
    lime: 'border-cyber-lime/20 border-t-cyber-lime shadow-[0_0_10px_rgba(57,255,20,0.4)]',
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} border-solid`}
      ></div>
      {/* Inner Decorative Point */}
      <div
        className={`absolute rounded-full bg-current ${
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2.5 h-2.5' : 'w-4 h-4'
        } ${
          color === 'cyan'
            ? 'text-cyber-cyan animate-pulse'
            : color === 'pink'
            ? 'text-cyber-pink animate-pulse'
            : 'text-cyber-lime animate-pulse'
        }`}
      ></div>
    </div>
  );
};

export default Spinner;
