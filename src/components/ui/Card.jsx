import React from 'react';

export const Card = ({ children, className = "", onClick }) => ( 
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-[#EBE5E0] ${className} ${onClick ? 'cursor-pointer hover:border-[#AC8A69] hover:shadow-md transition-all active:scale-[0.99]' : ''}`}> 
    {children} 
  </div> 
);
