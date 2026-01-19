import React from 'react';
import { COLORS } from '../../constants';

export const Button = ({ children, onClick, variant = 'primary', className = "", disabled, ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 select-none";
  const variants = { 
    primary: `bg-[${COLORS.primary}] text-white hover:bg-[#7D5238] shadow-lg`, 
    secondary: `bg-[${COLORS.neutral}]/20 text-[${COLORS.dark}] hover:bg-[${COLORS.neutral}]/30`, 
    outline: `border border-[${COLORS.secondary}] text-[${COLORS.primary}] hover:bg-[${COLORS.secondary}]/5`, 
    ghost: `text-[${COLORS.primary}] hover:bg-[${COLORS.secondary}]/10`, 
    danger: `bg-red-50 text-red-600 hover:bg-red-100` 
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`} {...props}>{children}</button>;
};
