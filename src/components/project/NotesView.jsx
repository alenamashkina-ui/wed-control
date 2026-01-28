import React, { useState, useEffect } from 'react';

export const NotesView = ({ notes, updateProject }) => {
  // Создаем локальное состояние для мгновенного отклика при вводе
  const [localNotes, setLocalNotes] = useState(notes || '');

  // Синхронизируем локальное состояние с данными из проекта (например, при первой загрузке)
  useEffect(() => {
    if (notes !== undefined) {
      setLocalNotes(notes);
    }
  }, [notes]);

  // Обработчик изменений: обновляем локально (мгновенно) и отправляем в базу
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalNotes(newValue);
    updateProject('notes', newValue);
  };

  return (
    <div className="h-full flex flex-col animate-fadeIn pb-24 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-[#414942]">Заметки</h2>
      </div>
      <textarea
        className="flex-1 w-full bg-white p-8 rounded-2xl shadow-sm border border-[#EBE5E0] text-[#414942] leading-relaxed resize-none focus:ring-2 focus:ring-[#936142]/10 outline-none min-h-[50vh] print:shadow-none print:border-none print:p-0"
        placeholder="Место для важных мыслей, черновиков клятв и идей..."
        value={localNotes}
        onChange={handleChange}
      />
    </div>
  );
};