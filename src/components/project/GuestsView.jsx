import React from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DownloadMenu } from '../ui/DownloadMenu';

export const GuestsView = ({ guests, updateProject, downloadCSV }) => {
  const addGuest = () => updateProject('guests', [...guests, { id: Date.now(), name: '', comment: '', seatingName: '', table: '', food: '', drinks: '', transfer: false }]);
  const updateGuest = (id, field, val) => updateProject('guests', guests.map(g => g.id === id ? { ...g, [field]: val } : g));
  const removeGuest = (id) => updateProject('guests', guests.filter(g => g.id !== id));
  const handleExport = (type) => { if (type === 'pdf') window.print(); else downloadCSV([["ФИО", "Рассадка", "Стол", "Еда", "Напитки", "Трансфер", "Комментарий"], ...guests.map(g => [g.name, g.seatingName, g.table, g.food, g.drinks, g.transfer ? "Да" : "Нет", g.comment])], "guests.csv"); };
  
  return ( 
    <div className="animate-fadeIn pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div className="flex items-baseline gap-4">
          <h2 className="text-2xl font-serif text-[#414942]">Список гостей</h2>
          <span className="text-[#AC8A69] font-medium">{guests.length} персон</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={addGuest} variant="primary" className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button>
          <DownloadMenu onSelect={handleExport} />
        </div>
      </div>
      <div className="grid gap-4 print:hidden">
        {guests.map((guest, idx) => (
          <Card key={guest.id} className="p-6 transition-all hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="flex items-center justify-between w-full md:w-auto md:col-span-1 md:justify-center md:h-full">
                <span className="w-8 h-8 rounded-full bg-[#CCBBA9]/30 text-[#936142] flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                <button onClick={() => removeGuest(guest.id)} className="md:hidden text-[#CCBBA9] hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
              </div>
              <div className="w-full md:col-span-3">
                <label className="text-[10px] uppercase text-[#CCBBA9] font-bold">ФИО</label>
                <input className="w-full text-lg font-medium text-[#414942] bg-transparent border-b border-transparent focus:border-[#AC8A69] outline-none" placeholder="Имя гостя" value={guest.name} onChange={(e) => updateGuest(guest.id, 'name', e.target.value)} />
              </div>
              <div className="w-1/2 md:w-full md:col-span-2">
                <label className="text-[10px] uppercase text-[#CCBBA9] font-bold">Стол №</label>
                <input className="w-full bg-transparent border-b border-[#EBE5E0] focus:border-[#AC8A69] outline-none py-1" value={guest.table} onChange={(e) => updateGuest(guest.id, 'table', e.target.value)} />
              </div>
              <div className="w-full md:col-span-3">
                <label className="text-[10px] uppercase text-[#CCBBA9] font-bold">Пожелания</label>
                <input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1 mb-1" placeholder="Еда..." value={guest.food} onChange={(e) => updateGuest(guest.id, 'food', e.target.value)} />
                <input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1" placeholder="Напитки..." value={guest.drinks} onChange={(e) => updateGuest(guest.id, 'drinks', e.target.value)} />
              </div>
              <div className="w-full md:col-span-2 flex items-center gap-2 pt-4">
                <label className="flex items-center cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${guest.transfer ? 'bg-[#936142] border-[#936142]' : 'border-[#CCBBA9]'}`}>
                    {guest.transfer && <CheckSquare size={12} color="white"/>}
                  </div>
                  <input type="checkbox" className="hidden" checked={guest.transfer} onChange={(e) => updateGuest(guest.id, 'transfer', e.target.checked)} />
                  <span className="text-sm text-[#414942]">Трансфер</span>
                </label>
              </div>
              <div className="hidden md:flex md:col-span-1 justify-end pt-4">
                <button onClick={() => removeGuest(guest.id)} className="text-[#CCBBA9] hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div> 
  );
};