import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './Button';

export const DownloadMenu = ({ onSelect }) => { 
  const [isOpen, setIsOpen] = useState(false); 
  return ( 
    <div className="relative print:hidden"> 
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)}><Download size={18} /></Button> 
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EBE5E0] z-20 w-48 overflow-hidden animate-fadeIn">
            {['excel', 'csv', 'pdf'].map(type => (
              <button key={type} onClick={() => { onSelect(type); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium flex items-center gap-3 transition-colors uppercase">
                {type}
              </button>
            ))}
          </div>
        </>
      )} 
    </div> 
  ); 
};
