import React from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { DownloadMenu } from '../ui/DownloadMenu';

export const TimingView = ({ timing, updateProject, downloadCSV }) => {
  const sortTiming = (list) => [...list].sort((a, b) => a.time.localeCompare(b.time));
  const updateTimingItem = (id, field, value) => { const newTiming = timing.map(t => t.id === id ? { ...t, [field]: value } : t); updateProject('timing', newTiming); };
  const removeTimingItem = (id) => updateProject('timing', timing.filter(t => t.id !== id));
  const addTimingItem = () => { const newItem = { id: Math.random().toString(36).substr(2, 9), time: '00:00', event: 'Новый этап' }; updateProject('timing', sortTiming([...timing, newItem])); };
  const handleExport = (type) => { if (type === 'pdf') window.print(); else downloadCSV([["Время", "Событие"], ...timing.map(t => [t.time, t.event])], "timing.csv"); };
  
  return ( 
    <div className="animate-fadeIn max-w-2xl mx-auto pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-2xl font-serif text-[#414942]">Тайминг</h2>
        <DownloadMenu onSelect={handleExport} />
      </div>
      <div className="hidden print:block mb-8"><h1 className="text-3xl font-serif text-[#414942] mb-2">Тайминг дня</h1></div>
      <div className="relative border-l border-[#EBE5E0] ml-4 md:ml-6 space-y-6 print:border-none print:ml-0 print:space-y-2">
        {timing.map((item) => (
          <div key={item.id} className="relative pl-6 group print:pl-0 print:border-b print:pb-2 print:border-[#EBE5E0]">
            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#AC8A69] transition-all group-hover:scale-125 group-hover:border-[#936142] print:hidden"></div>
            <div className="flex items-baseline gap-4">
              <input className="w-14 md:w-16 text-base md:text-lg font-bold text-[#936142] bg-transparent outline-none text-right font-mono print:text-left print:w-20" value={item.time} onChange={(e) => updateTimingItem(item.id, 'time', e.target.value)} />
              <input className="flex-1 text-sm md:text-base text-[#414942] bg-transparent outline-none border-b border-transparent focus:border-[#AC8A69] pb-1 transition-colors" value={item.event} onChange={(e) => updateTimingItem(item.id, 'event', e.target.value)} />
              <button onClick={() => removeTimingItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[#CCBBA9] hover:text-red-400 p-1 print:hidden"><X size={14}/></button>
            </div>
          </div>
        ))}
        <div className="relative pl-6 pt-2 print:hidden">
          <button onClick={addTimingItem} className="flex items-center gap-2 text-[#AC8A69] hover:text-[#936142] text-xs font-medium transition-colors">
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center"><Plus size={10}/></div>
            Добавить этап
          </button>
        </div>
      </div>
    </div> 
  );
};