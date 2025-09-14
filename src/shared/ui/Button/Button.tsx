import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'action';
  action?: 'R' | 'C' | 'F' | 'M';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'primary',
  action
}) => {
  const getActionStyle = (action: 'R' | 'C' | 'F' | 'M') => {
    const styles = {
      R: 'bg-emerald-500/80 hover:bg-emerald-500 text-white',
      C: 'bg-indigo-500/80 hover:bg-indigo-500 text-white',
      F: 'bg-zinc-700/70 hover:bg-zinc-700 text-white',
      M: 'bg-amber-500/80 hover:bg-amber-500 text-white'
    };
    return styles[action];
  };

  const baseClasses = 'px-4 py-2 rounded-xl font-medium shadow transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100',
    secondary: 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300',
    action: action ? getActionStyle(action) : 'bg-zinc-700 hover:bg-zinc-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      }`}
    >
      {children}
    </button>
  );
};
