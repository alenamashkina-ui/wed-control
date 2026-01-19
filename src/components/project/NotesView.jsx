import React from 'react';

export const NotesView = ({ notes, updateProject }) => (
  <div className="h-full flex flex-col animate-fadeIn pb-24 md:pb-0">
      <div className="mb-6"><h2 className="text-2xl font-serif text-[#414942]">Заметки</h2></div>
      <textarea className="flex-1 w-full bg-white p-8 rounded-2xl shadow-sm border border-[#EBE5E0] text-[#414942] leading-relaxed resize-none focus:ring-2 focus:ring-[#936142]/10 outline-none min-h-[50vh] print:shadow-none print:border-none print:p-0" placeholder="Место для важных мыслей, черновиков клятв и идей..." value={notes} onChange={(e) => updateProject('notes', e.target.value)} />
  </div>
);