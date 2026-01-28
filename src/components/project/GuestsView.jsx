import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, User, Utensils, Wine, MessageSquare, MapPin } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button';
import { DownloadMenu } from '../ui/DownloadMenu';
import { AutoHeightTextarea } from '../ui/Forms';

// --- МИНИ-КОМПОНЕНТ ДЛЯ ОДНОГО ГОСТЯ (Решает проблему скачков курсора) ---
const GuestRow = ({ guest, idx, updateGuest, removeGuest }) => {
    // Локальное состояние для мгновенного отклика
    const [localData, setLocalData] = useState(guest);

    // Синхронизация, если данные изменились извне (но аккуратно)
    useEffect(() => {
        setLocalData(guest);
    }, [guest]);

    // Обработчик изменений
    const handleChange = (field, value) => {
        // 1. Мгновенно обновляем интерфейс
        setLocalData(prev => ({ ...prev, [field]: value }));
        // 2. Отправляем в базу
        updateGuest(guest.id, field, value);
    };

    return (
        <div className="group bg-white rounded-xl border border-[#EBE5E0] hover:border-[#AC8A69]/50 transition-all shadow-sm">
            <div className="flex flex-col md:flex-row">
                
                {/* ЛЕВАЯ КОЛОНКА */}
                <div className="p-5 md:w-5/12 border-b md:border-b-0 md:border-r border-[#EBE5E0] flex flex-col justify-between">
                    <div className="flex items-start gap-3 mb-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F9F7F5] text-[#CCBBA9] text-xs font-bold flex items-center justify-center mt-1">
                            {idx + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="block text-[10px] text-[#CCBBA9] font-bold uppercase tracking-wider mb-1">ФИО Гостя</label>
                                <input 
                                    className="w-full text-base font-medium text-[#414942] placeholder-[#EBE5E0] outline-none bg-transparent"
                                    placeholder="Иван Иванов"
                                    value={localData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-[#CCBBA9] font-bold uppercase tracking-wider mb-1">Имя на карточке</label>
                                <input 
                                    className="w-full text-sm text-[#414942] placeholder-[#EBE5E0] outline-none bg-transparent"
                                    placeholder="Ваня"
                                    value={localData.seatingName}
                                    onChange={(e) => handleChange('seatingName', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pl-9">
                        <span className="text-xs text-[#AC8A69] font-bold uppercase">Стол №</span>
                        <input 
                            className="w-12 text-center text-sm font-bold text-[#414942] bg-[#F9F7F5] rounded py-1 outline-none focus:ring-1 focus:ring-[#AC8A69]"
                            placeholder="-"
                            value={localData.table}
                            onChange={(e) => handleChange('table', e.target.value)}
                        />
                    </div>
                </div>

                {/* ЦЕНТРАЛЬНАЯ КОЛОНКА */}
                <div className="p-5 md:w-5/12 border-b md:border-b-0 md:border-r border-[#EBE5E0] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1 text-[10px] text-[#CCBBA9] font-bold uppercase tracking-wider mb-1">
                                <Utensils size={10}/> Еда
                            </label>
                            <AutoHeightTextarea 
                                className="w-full text-sm text-[#414942] placeholder-[#EBE5E0] outline-none bg-transparent resize-none overflow-hidden"
                                placeholder="Аллергии, меню..."
                                value={localData.food}
                                onChange={(e) => handleChange('food', e.target.value)}
                                rows={1}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-[10px] text-[#CCBBA9] font-bold uppercase tracking-wider mb-1">
                                <Wine size={10}/> Напитки
                            </label>
                            <AutoHeightTextarea 
                                className="w-full text-sm text-[#414942] placeholder-[#EBE5E0] outline-none bg-transparent resize-none overflow-hidden"
                                placeholder="Предпочтения..."
                                value={localData.drinks}
                                onChange={(e) => handleChange('drinks', e.target.value)}
                                rows={1}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-[10px] text-[#CCBBA9] font-bold uppercase tracking-wider mb-1">
                            <MessageSquare size={10}/> Комментарий
                        </label>
                        <AutoHeightTextarea 
                            className="w-full text-sm text-[#414942] placeholder-[#EBE5E0] outline-none bg-transparent resize-none overflow-hidden"
                            placeholder="Заметки..."
                            value={localData.comment}
                            onChange={(e) => handleChange('comment', e.target.value)}
                            rows={1}
                        />
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА */}
                <div className="p-4 md:w-2/12 flex md:flex-col justify-between items-center md:items-end bg-[#FAFAFA] md:bg-transparent">
                    
                    <div 
                        onClick={() => handleChange('transfer', !localData.transfer)}
                        className={`cursor-pointer px-3 py-2 rounded-lg border transition-all flex items-center gap-2 select-none w-full md:w-auto justify-center ${localData.transfer ? 'bg-[#936142] border-[#936142] text-white' : 'bg-white border-[#EBE5E0] text-[#CCBBA9] hover:border-[#AC8A69]'}`}
                    >
                        {localData.transfer ? <Check size={14}/> : <MapPin size={14}/>}
                        <span className="text-xs font-bold uppercase">Трансфер</span>
                    </div>

                    <button 
                        onClick={() => removeGuest(guest.id)} 
                        className="text-[#EBE5E0] hover:text-red-400 transition-colors p-2"
                        title="Удалить"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const GuestsView = ({ guests, updateProject, project }) => {
  
  const groom = project?.groomName || 'Жених';
  const bride = project?.brideName || 'Невеста';
  const dateStr = project?.date ? new Date(project.date).toLocaleDateString('ru-RU') : '';
  
  const fileName = `${groom} и ${bride}_${dateStr}_Список гостей`.replace(/[\\/:*?"<>|]/g, '_');

  // --- ACTIONS ---
  const addGuest = () => {
    updateProject('guests', [
      ...guests, 
      { 
        id: Date.now(), 
        name: '', 
        seatingName: '', 
        comment: '', 
        table: '', 
        food: '', 
        drinks: '', 
        transfer: false 
      }
    ]);
  };

  const updateGuest = (id, field, val) => {
    updateProject('guests', guests.map(g => g.id === id ? { ...g, [field]: val } : g));
  };

  const removeGuest = (id) => {
    if (window.confirm('Удалить этого гостя?')) {
      updateProject('guests', guests.filter(g => g.id !== id));
    }
  };

  // --- EXPORT ---
  const handleExport = async (type) => {
    const tableData = guests.map(g => ({
        name: g.name,
        seating: g.seatingName,
        table: g.table,
        food: g.food,
        drinks: g.drinks,
        transfer: g.transfer ? "Да" : "Нет",
        comment: g.comment
    }));

    // --- EXCEL ---
    if (type === 'excel') {
        const wsData = [
            ['ФИО', 'Имя на карточке', 'Стол', 'Еда', 'Напитки', 'Трансфер', 'Комментарий'],
            ...tableData.map(r => [r.name, r.seating, r.table, r.food, r.drinks, r.transfer, r.comment])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        ws['!cols'] = [
            {wch: 25}, 
            {wch: 20}, 
            {wch: 8}, 
            {wch: 25}, 
            {wch: 25}, 
            {wch: 10}, 
            {wch: 50}
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Гости");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
    
    // --- CSV ---
    else if (type === 'csv') {
        const BOM = "\uFEFF";
        const columns = `ФИО;Имя на карточке;Стол;Еда;Напитки;Трансфер;Комментарий\n`;
        
        const body = tableData.map(r => 
            `"${(r.name||'').replace(/"/g, '""')}";"${(r.seating||'').replace(/"/g, '""')}";"${(r.table||'').replace(/"/g, '""')}";"${(r.food||'').replace(/"/g, '""')}";"${(r.drinks||'').replace(/"/g, '""')}";${r.transfer};"${(r.comment||'').replace(/"/g, '""')}"`
        ).join('\n');
        
        const csvContent = BOM + columns + body;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `${fileName}.csv`);
    }
    
    // --- PDF ---
    else if (type === 'pdf') {
        const doc = new jsPDF();
        try {
            const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const fontBase64 = reader.result.split(',')[1];
                doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
                doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                doc.setFont('Roboto');

                // ЗАГОЛОВОК PDF
                doc.setFontSize(14);
                doc.text(`${groom} и ${bride}`, 14, 15);
                if (dateStr) doc.text(dateStr, 14, 22);
                
                doc.setFontSize(18);
                doc.text("Список гостей", 14, 35);

                const tableBody = tableData.map(r => [
                    r.name, 
                    r.seating, 
                    r.table, 
                    r.food, 
                    r.drinks, 
                    r.transfer, 
                    r.comment
                ]);
                
                autoTable(doc, {
                    head: [['ФИО', 'Имя на карточке', 'Стол', 'Еда', 'Напитки', 'Трансфер', 'Инфо']],
                    body: tableBody,
                    startY: 40,
                    styles: { 
                        font: 'Roboto', 
                        fontStyle: 'normal', 
                        fontSize: 9, 
                        cellPadding: 3, 
                        valign: 'middle',
                        overflow: 'linebreak' 
                    },
                    headStyles: { 
                        fillColor: [147, 97, 66], 
                        textColor: 255, 
                        fontStyle: 'normal', 
                        halign: 'center' 
                    },
                    columnStyles: {
                        0: { cellWidth: 30 }, 
                        1: { cellWidth: 25 }, 
                        2: { cellWidth: 15, halign: 'center' }, 
                        3: { cellWidth: 25 }, 
                        4: { cellWidth: 25 }, 
                        5: { cellWidth: 22, halign: 'center' }, 
                        6: { cellWidth: 'auto' } 
                    },
                    margin: { bottom: 20 },

                    // ФУТЕР
                    didDrawPage: function (data) {
                        const pageSize = doc.internal.pageSize;
                        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                        
                        doc.setFontSize(8);
                        doc.setTextColor(150);

                        const brand = "paraplanner.ru";
                        const brandWidth = doc.getStringUnitWidth(brand) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                        doc.text(brand, (pageWidth - brandWidth) / 2, pageHeight - 10);

                        const str = 'Стр. ' + doc.internal.getNumberOfPages();
                        const strWidth = doc.getStringUnitWidth(str) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                        doc.text(str, pageWidth - data.settings.margin.right - strWidth, pageHeight - 10);
                    }
                });

                doc.save(`${fileName}.pdf`);
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            alert("Ошибка создания PDF");
        }
    }
  };

  const transferCount = guests.filter(g => g.transfer).length;

  return ( 
    <div className="animate-fadeIn pb-24 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-serif text-[#414942]">Список гостей</h2>
          <div className="flex gap-6 mt-2 text-sm text-[#AC8A69]">
             <span className="font-medium">Всего: {guests.length}</span>
             <span className="w-px h-4 bg-[#EBE5E0]"></span>
             <span className="font-medium">Нужен трансфер: {transferCount}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {/* Сначала кнопка Добавить, потом Скачать */}
          <Button onClick={addGuest} variant="primary" className="flex-1 md:flex-none flex items-center gap-2">
            <Plus size={18}/> Добавить гостя
          </Button>
          <DownloadMenu onSelect={handleExport} />
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3 print:hidden">
        {guests.length === 0 ? (
            <div className="text-center py-24 text-[#CCBBA9] border border-dashed border-[#EBE5E0] rounded-2xl bg-[#F9F7F5]/30">
                <p className="mb-4">В списке пока никого нет</p>
                <Button variant="ghost" onClick={addGuest}>Добавить первого гостя</Button>
            </div>
        ) : (
            guests.map((guest, idx) => (
                <GuestRow 
                    key={guest.id} 
                    guest={guest} 
                    idx={idx} 
                    updateGuest={updateGuest} 
                    removeGuest={removeGuest} 
                />
            ))
        )}
      </div>
    </div> 
  );
};