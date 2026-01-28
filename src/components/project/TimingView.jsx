import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button';
import { DownloadMenu } from '../ui/DownloadMenu';

// --- КОМПОНЕНТ СТРОКИ (TIMING ITEM) ---
const TimingItem = ({ item, onUpdate, onRemove }) => {
    // Локальное состояние: храним данные пока пользователь печатает
    const [localTime, setLocalTime] = useState(item.time);
    const [localEvent, setLocalEvent] = useState(item.event);
    
    // Ссылка на текстовое поле для авто-высоты
    const textareaRef = useRef(null);

    // Функция авто-расширения высоты
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Сбрасываем, чтобы пересчитать уменьшение
            textarea.style.height = `${textarea.scrollHeight}px`; // Ставим высоту по контенту
        }
    };

    // Синхронизация при изменении пропсов (например, после сортировки)
    useEffect(() => { 
        setLocalTime(item.time); 
    }, [item.time]);

    useEffect(() => { 
        setLocalEvent(item.event);
        // Небольшая задержка, чтобы React успел отрисовать значение перед расчетом высоты
        setTimeout(adjustHeight, 0);
    }, [item.event]);

    // Сохраняем в базу и СОРТИРУЕМ только когда убрали курсор (onBlur)
    const handleBlur = () => {
        if (localTime !== item.time || localEvent !== item.event) {
            onUpdate(item.id, localTime, localEvent);
        }
    };

    // --- МАГИЯ ВВОДА ВРЕМЕНИ ---
    const handleTimeChange = (e) => {
        // 1. Оставляем только цифры
        let v = e.target.value.replace(/\D/g, '');
        
        // 2. Ограничиваем длину (HHMM = 4 цифры)
        if (v.length > 4) v = v.slice(0, 4);

        // 3. Если введено больше 2 цифр, вставляем двоеточие
        if (v.length > 2) {
            v = v.slice(0, 2) + ':' + v.slice(2);
        }

        setLocalTime(v);
    };

    return (
        <div className="relative pl-6 group print:pl-0 print:border-b print:pb-2 print:border-[#EBE5E0]">
            {/* Точка timeline */}
            <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#AC8A69] transition-all group-hover:scale-125 group-hover:border-[#936142] print:hidden"></div>
            
            <div className="flex items-start gap-3 md:gap-4">
                {/* ВРЕМЯ */}
                <input 
                    className="w-16 md:w-20 text-base md:text-lg font-bold text-[#936142] bg-transparent outline-none text-right font-mono print:text-left print:w-20 placeholder-red-300/50 pt-1" 
                    value={localTime} 
                    placeholder="00:00"
                    onChange={handleTimeChange} // Используем нашу новую функцию
                    onBlur={handleBlur} 
                    maxLength={5} // Ограничение визуальной длины (12:34)
                />
                
                {/* СОБЫТИЕ (Теперь Textarea) */}
                <textarea 
                    ref={textareaRef}
                    rows={1}
                    className="flex-1 text-sm md:text-base text-[#414942] bg-transparent outline-none border-b border-transparent focus:border-[#AC8A69] pb-1 transition-colors resize-none overflow-hidden block pt-1.5 leading-normal" 
                    value={localEvent} 
                    placeholder="Описание этапа..."
                    onChange={(e) => {
                        setLocalEvent(e.target.value);
                        adjustHeight();
                    }}
                    onBlur={handleBlur}
                />
                
                <button onClick={() => onRemove(item.id)} className="opacity-0 group-hover:opacity-100 text-[#CCBBA9] hover:text-red-400 p-1 print:hidden mt-1">
                    <X size={14}/>
                </button>
            </div>
        </div>
    );
};

export const TimingView = ({ timing, updateProject, project }) => {
  
  // Данные для файлов
  const groom = project?.groomName || 'Жених';
  const bride = project?.brideName || 'Невеста';
  const dateStr = project?.date ? new Date(project.date).toLocaleDateString('ru-RU') : '';
  const fileName = `${groom} и ${bride}_${dateStr}_Тайминг`.replace(/[\\/:*?"<>|]/g, '_');

  // --- ЛОГИКА ---
  
  // Вспомогательная функция сортировки
  const sortList = (list) => {
      return [...list].sort((a, b) => {
          // Пустое время всегда сверху
          if (!a.time) return -1;
          if (!b.time) return 1;
          return a.time.localeCompare(b.time);
      });
  };

  // ОБНОВЛЕНИЕ + СОРТИРОВКА
  const handleItemUpdate = (id, newTime, newEvent) => {
      // 1. Обновляем измененный элемент
      const updatedList = timing.map(t => t.id === id ? { ...t, time: newTime, event: newEvent } : t);
      
      // 2. Сразу сортируем весь список
      const sortedList = sortList(updatedList);

      // 3. Сохраняем
      updateProject('timing', sortedList);
  };
  
  const removeTimingItem = (id) => {
      if (window.confirm('Удалить этот этап?')) {
        updateProject('timing', timing.filter(t => t.id !== id));
      }
  };
  
  const addTimingItem = () => { 
      const newItem = { 
          id: Math.random().toString(36).substr(2, 9), 
          time: '', // Пустое время = встанет в начало
          event: '' 
      }; 
      // Добавляем в начало
      updateProject('timing', [newItem, ...timing]); 
  };

  // --- ЭКСПОРТ ---
  const handleExport = async (type) => {
    // Экспортируем всегда отсортированный список
    const sortedList = sortList(timing);
    const tableData = sortedList.map(t => ({ time: t.time, event: t.event }));

    // EXCEL
    if (type === 'excel') {
        const wsData = [['Время', 'Событие'], ...tableData.map(r => [r.time, r.event])];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch: 10}, {wch: 60}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Тайминг");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
    // CSV
    else if (type === 'csv') {
        const BOM = "\uFEFF";
        const columns = `Время;Событие\n`; 
        const body = tableData.map(r => `${r.time};"${(r.event||'').replace(/"/g, '""')}"`).join('\n');
        const csvContent = BOM + columns + body;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `${fileName}.csv`);
    }
    // PDF
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

                doc.setFontSize(14);
                doc.text(`${groom} и ${bride}`, 14, 15);
                if (dateStr) doc.text(dateStr, 14, 22);
                doc.setFontSize(18);
                doc.text("Тайминг дня", 14, 35);

                autoTable(doc, {
                    head: [['Время', 'Событие']],
                    body: tableData.map(r => [r.time, r.event]),
                    startY: 40,
                    styles: { 
                        font: 'Roboto', 
                        fontSize: 10, 
                        cellPadding: 3, 
                        valign: 'middle',
                        overflow: 'linebreak' // Важно для переноса в PDF
                    },
                    headStyles: { 
                        fillColor: [147, 97, 66], 
                        textColor: 255, 
                        halign: 'center',
                        font: 'Roboto', 
                        fontStyle: 'normal'
                    },
                    columnStyles: { 0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 'auto' } }
                });
                doc.save(`${fileName}.pdf`);
            };
            reader.readAsDataURL(blob);
        } catch (e) { alert("Ошибка создания PDF"); }
    }
  };
  
  return ( 
    <div className="animate-fadeIn max-w-2xl mx-auto pb-24 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-2xl font-serif text-[#414942]">Тайминг</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={addTimingItem} className="flex items-center gap-2 w-full md:w-auto justify-center">
                <Plus size={18}/> <span className="md:hidden">Добавить</span><span className="hidden md:inline">Добавить этап</span>
            </Button>
            <DownloadMenu onSelect={handleExport} />
        </div>
      </div>
      
      <div className="hidden print:block mb-8"><h1 className="text-3xl font-serif text-[#414942] mb-2">Тайминг дня</h1></div>
      
      <div className="relative border-l border-[#EBE5E0] ml-4 md:ml-6 space-y-6 print:border-none print:ml-0 print:space-y-2">
        {timing.map((item) => (
          <TimingItem 
            key={item.id} 
            item={item} 
            onUpdate={handleItemUpdate} 
            onRemove={removeTimingItem} 
          />
        ))}
      </div>
    </div> 
  );
};