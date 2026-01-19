import React, { useRef, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils';

export const Input = ({ label, onKeyDown, ...props }) => ( 
  <div className="mb-4"> 
    {label && <label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">{label}</label>} 
    <input onKeyDown={onKeyDown} className="w-full bg-[#F9F7F5] border-none rounded-xl p-4 text-[#414942] placeholder-[#CCBBA9] focus:ring-2 focus:ring-[#936142]/20 transition-all outline-none" {...props} /> 
  </div> 
);

export const MoneyInput = ({ value, onChange, className }) => { 
  const handleChange = (e) => { 
    const rawValue = e.target.value.replace(/\s/g, ''); 
    if (rawValue === '') onChange(0); 
    else if (!isNaN(rawValue)) onChange(parseInt(rawValue, 10)); 
  }; 
  return <input type="text" className={`${className} outline-none bg-transparent`} value={formatCurrency(value)} onChange={handleChange} placeholder="0" />; 
};

export const AutoHeightTextarea = ({ value, onChange, className, placeholder }) => { 
  const textareaRef = useRef(null); 
  useEffect(() => { 
    if(textareaRef.current){
      textareaRef.current.style.height='auto';
      textareaRef.current.style.height=textareaRef.current.scrollHeight+'px';
    } 
  }, [value]); 
  return <textarea ref={textareaRef} className={`${className} resize-none overflow-hidden block`} value={value} onChange={onChange} rows={1} placeholder={placeholder} />; 
};

export const Checkbox = ({ checked, onChange }) => ( 
  <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors duration-300 flex-shrink-0 print:border-[#414942] ${checked ? `bg-[${COLORS.primary}] border-[${COLORS.primary}] print:bg-[#414942]` : `border-[${COLORS.neutral}] bg-transparent`}`}> 
    {checked && <CheckSquare size={14} color="white" />} 
  </div> 
);
