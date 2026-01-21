import React, { useState } from 'react';
import { X, Trash2, Archive, Download, FileSpreadsheet, FileText, Loader2, Copy, Check, Lock, Link as LinkIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button';
import { Input } from '../ui/Forms';
import { formatDate, formatCurrency } from '../../utils';

export const SettingsModal = ({ project, updateProject, onClose, toggleArchive, deleteProject }) => {
  const [groomName, setGroomName] = useState(project.groomName);
  const [brideName, setBrideName] = useState(project.brideName);
  const [date, setDate] = useState(project.date);
  const [venue, setVenue] = useState(project.venueName || '');
  const [clientPass, setClientPass] = useState(project.clientPassword || '');
  
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // ВЕРНУЛИ ЖЕЛЕЗНУЮ ЛОГИКУ ССЫЛКИ: ?id=...
  const guestLink = `${window.location.origin}/?id=${project.id}`;

  const handleSave = () => {
    updateProject('groomName', groomName);
    updateProject('brideName', brideName);
    updateProject('date', date);
    updateProject('venueName', venue);
    updateProject('clientPassword', clientPass);
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(guestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileName = (ext) => {
    const dateStr = date ? new Date(date).toLocaleDateString('ru-RU') : '';
    return `${groomName} и ${brideName}_${dateStr}_Экспорт проекта.${ext}`.replace(/[\\/:*?"<>|]/g, '_');
  };

  // --- EXCEL ---
  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. СМЕТА
    const totalPlan = project.expenses.reduce((a, b) => a + Number(b.plan), 0);
    const totalFact = project.expenses.reduce((a, b) => a + Number(b.fact), 0);
    const totalPaid = project.expenses.reduce((a, b) => a + Number(b.paid), 0);

    const budgetData = [
        ['Статья', 'План', 'Факт', 'Внесено', 'Остаток', 'Комментарий'],
        ...project.expenses.map(e => [e.name, e.plan, e.fact, e.paid, (e.fact - e.paid), e.note]),
        ['ИТОГО', totalPlan, totalFact, totalPaid, totalFact - totalPaid, '']
    ];
    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
    wsBudget['!cols'] = [{wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 40}];
    XLSX.utils.book_append_sheet(wb, wsBudget, "Смета");

    // 2. ЗАДАЧИ
    const tasksData = [
        ['Задача', 'Дедлайн', 'Статус'],
        ...project.tasks.map(t => [t.text, formatDate(t.deadline), t.done ? 'Выполнено' : 'В работе'])
    ];
    const wsTasks = XLSX.utils.aoa_to_sheet(tasksData);
    wsTasks['!cols'] = [{wch: 50}, {wch: 15}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsTasks, "Задачи");

    // 3. ТАЙМИНГ
    const timingData = [
        ['Время', 'Событие'],
        ...project.timing.map(t => [
            t.time, 
            t.activity || t.title || t.name || t.text || t.description || t.event || ''
        ])
    ];
    const wsTiming = XLSX.utils.aoa_to_sheet(timingData);
    wsTiming['!cols'] = [{wch: 10}, {wch: 60}];
    XLSX.utils.book_append_sheet(wb, wsTiming, "Тайминг");

    // 4. ГОСТИ
    const guestsData = [
        ['ФИО', 'Имя на карточке', 'Стол', 'Еда', 'Напитки', 'Трансфер', 'Комментарий'],
        ...project.guests.map(g => [g.name, g.seatingName, g.table, g.food, g.drinks, g.transfer ? 'Да' : 'Нет', g.comment])
    ];
    const wsGuests = XLSX.utils.aoa_to_sheet(guestsData);
    wsGuests['!cols'] = [{wch: 25}, {wch: 20}, {wch: 8}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 40}];
    XLSX.utils.book_append_sheet(wb, wsGuests, "Гости");

    XLSX.writeFile(wb, getFileName('xlsx'));
  };

  // --- PDF ---
  const handlePdfExport = async () => {
    setIsExporting(true);
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

            // --- ШАПКА ---
            doc.setFontSize(22);
            doc.text(`${groomName} и ${brideName}`, 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(150);
            const dateStr = date ? new Date(date).toLocaleDateString('ru-RU') : '';
            if (dateStr) doc.text(`Дата свадьбы: ${dateStr}`, 14, 28);
            
            doc.setDrawColor(200);
            doc.line(14, 35, 196, 35);

            let finalY = 45;

            const printSectionTitle = (title, y) => {
                doc.setFontSize(16);
                doc.setTextColor(147, 97, 66);
                doc.text(title, 14, y);
                return y + 10;
            };

            const commonStyles = { font: 'Roboto', fontStyle: 'normal', fontSize: 9, cellPadding: 2, overflow: 'linebreak' };
            const headStyles = { fillColor: [147, 97, 66], textColor: 255, fontStyle: 'normal', halign: 'center', valign: 'middle', font: 'Roboto' };

            // 1. СМЕТА
            finalY = printSectionTitle('Смета расходов', finalY);
            
            const totalPlan = project.expenses.reduce((a, b) => a + Number(b.plan), 0);
            const totalFact = project.expenses.reduce((a, b) => a + Number(b.fact), 0);
            const totalPaid = project.expenses.reduce((a, b) => a + Number(b.paid), 0);

            autoTable(doc, {
                startY: finalY,
                head: [['Статья', 'План', 'Факт', 'Внесено', 'Остаток', 'Комментарий']],
                body: project.expenses.map(e => [
                    e.name, 
                    formatCurrency(e.plan), 
                    formatCurrency(e.fact), 
                    formatCurrency(e.paid), 
                    formatCurrency(e.fact - e.paid),
                    e.note
                ]),
                foot: [['ИТОГО', formatCurrency(totalPlan), formatCurrency(totalFact), formatCurrency(totalPaid), formatCurrency(totalFact - totalPaid), '']],
                showFoot: 'lastPage',
                styles: commonStyles,
                headStyles: headStyles,
                footStyles: { fillColor: [249, 247, 245], textColor: [147, 97, 66], fontStyle: 'normal', font: 'Roboto', halign: 'right' },
                columnStyles: { 0: { cellWidth: 'auto' }, 5: { cellWidth: 40 } }
            });
            finalY = doc.lastAutoTable.finalY + 20;

            // 2. ЗАДАЧИ
            finalY = printSectionTitle('Список задач', finalY);
            const sortedTasks = [...project.tasks].sort((a, b) => {
                if (a.done === b.done) return new Date(a.deadline) - new Date(b.deadline);
                return a.done ? 1 : -1;
            });
            autoTable(doc, {
                startY: finalY,
                head: [['Статус', 'Задача', 'Дедлайн']],
                body: sortedTasks.map(t => [t.done ? 'Готово' : 'В работе', t.text, formatDate(t.deadline)]),
                styles: commonStyles,
                headStyles: headStyles,
                columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 } }
            });
            finalY = doc.lastAutoTable.finalY + 20;

            // 3. ТАЙМИНГ
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            finalY = printSectionTitle('Тайминг дня', finalY);
            autoTable(doc, {
                startY: finalY,
                head: [['Время', 'Событие']],
                body: project.timing.map(t => [
                    t.time, 
                    t.activity || t.title || t.name || t.text || t.description || t.event || ''
                ]),
                styles: commonStyles,
                headStyles: headStyles,
                columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 'auto' } }
            });
            finalY = doc.lastAutoTable.finalY + 20;

            // 4. ГОСТИ
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            finalY = printSectionTitle('Список гостей', finalY);

            autoTable(doc, {
                startY: finalY,
                head: [['ФИО', 'Имя на карточке', 'Стол', 'Еда', 'Напитки', 'Трансфер', 'Инфо']],
                body: project.guests.map(g => [
                    g.name, 
                    g.seatingName, 
                    g.table, 
                    g.food, 
                    g.drinks, 
                    g.transfer ? 'Да' : '', 
                    g.comment
                ]),
                styles: { ...commonStyles, fontSize: 8 },
                headStyles: headStyles,
                columnStyles: { 
                    0: { cellWidth: 30 }, 
                    1: { cellWidth: 25 }, 
                    2: { cellWidth: 12, halign: 'center' },
                    3: { cellWidth: 25 }, 
                    4: { cellWidth: 25 }, 
                    5: { cellWidth: 18, halign: 'center' },
                    6: { cellWidth: 'auto' }
                }
            });

            // Футер
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                const footerText = `${i}/${pageCount} - paraplanner.ru`;
                const pageSize = doc.internal.pageSize;
                const textWidth = doc.getStringUnitWidth(footerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                doc.text(footerText, (pageSize.width - textWidth) / 2, pageSize.height - 10);
            }

            doc.save(getFileName('pdf'));
            setIsExporting(false);
        };
        reader.readAsDataURL(blob);
    } catch (e) {
        alert("Ошибка PDF");
        setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center bg-[#F9F7F5]">
            <h2 className="text-2xl font-serif text-[#414942]">Настройки проекта</h2>
            <button onClick={onClose} className="text-[#AC8A69] hover:text-[#936142] transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
            
            {/* 1. ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <div className="space-y-4">
                <h3 className="font-bold text-[#AC8A69] uppercase text-xs tracking-wider">Основная информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Имя жениха" value={groomName} onChange={e => setGroomName(e.target.value)} />
                    <Input label="Имя невесты" value={brideName} onChange={e => setBrideName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Дата свадьбы" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <Input label="Место проведения" value={venue} onChange={e => setVenue(e.target.value)} />
                </div>
            </div>

            {/* 2. ГОСТЕВОЙ ДОСТУП (ССЫЛКА + ПАРОЛЬ) */}
            <div className="bg-[#F9F7F5] p-5 rounded-xl border border-[#AC8A69]/20">
                <h3 className="font-bold text-[#AC8A69] uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    Гостевой доступ
                </h3>

                {/* ССЫЛКА (ПЕРВАЯ) */}
                <div className="mb-4">
                    <label className="block text-[10px] text-[#AC8A69] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <LinkIcon size={10}/> Ссылка для пары
                    </label>
                    <div className="flex gap-2">
                        <input 
                            readOnly 
                            className="w-full bg-white border border-[#EBE5E0] text-[#414942] text-sm rounded-lg px-3 py-2 outline-none select-all text-ellipsis"
                            value={guestLink}
                        />
                        <Button onClick={copyLink} variant="secondary" className="min-w-[40px] px-0 flex items-center justify-center bg-white border border-[#EBE5E0] hover:border-[#AC8A69]">
                            {copied ? <Check size={18} className="text-green-600"/> : <Copy size={18} className="text-[#AC8A69]"/>}
                        </Button>
                    </div>
                </div>

                {/* ПАРОЛЬ (ВТОРОЙ) */}
                <div>
                    <label className="block text-[10px] text-[#AC8A69] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Lock size={10}/> Пароль для гостей
                    </label>
                    <input 
                        className="w-full bg-white border border-[#EBE5E0] text-[#414942] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#AC8A69] transition-colors"
                        placeholder="Не установлен"
                        value={clientPass}
                        onChange={e => setClientPass(e.target.value)}
                    />
                </div>
            </div>

            {/* 3. ЭКСПОРТ */}
            <div className="border-t border-[#EBE5E0] pt-6">
                <h3 className="font-bold text-[#AC8A69] uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    <Download size={14}/> Экспорт всего проекта
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleExcelExport}
                        className="flex items-center justify-center gap-3 p-4 bg-white border border-[#EBE5E0] rounded-xl hover:border-[#AC8A69] hover:shadow-md transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#F9F7F5] text-[#936142] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileSpreadsheet size={20}/>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[#414942] text-sm">Скачать Excel</div>
                            <div className="text-[10px] text-[#CCBBA9]">Все разделы (вкладки)</div>
                        </div>
                    </button>

                    <button 
                        onClick={handlePdfExport}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-3 p-4 bg-white border border-[#EBE5E0] rounded-xl hover:border-[#AC8A69] hover:shadow-md transition-all group disabled:opacity-50"
                    >
                         {isExporting ? (
                            <Loader2 size={24} className="animate-spin text-[#AC8A69]"/>
                        ) : (
                            <>
                            <div className="w-10 h-10 rounded-full bg-[#F9F7F5] text-[#936142] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText size={20}/>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-[#414942] text-sm">Скачать PDF</div>
                                <div className="text-[10px] text-[#CCBBA9]">Единый отчет</div>
                            </div>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 4. УПРАВЛЕНИЕ */}
            <div className="pt-4 border-t border-[#EBE5E0]">
                <h3 className="font-bold text-red-400 uppercase text-xs tracking-wider mb-4">Управление</h3>
                <div className="flex flex-col md:flex-row gap-3">
                    <Button variant="ghost" onClick={toggleArchive} className="text-[#AC8A69] justify-start">
                        <Archive size={16} className="mr-2"/>
                        {project.isArchived ? 'Вернуть из архива' : 'В архив'}
                    </Button>
                    <Button variant="ghost" onClick={deleteProject} className="text-red-400 hover:text-red-600 hover:bg-red-50 justify-start">
                        <Trash2 size={16} className="mr-2"/> Удалить проект
                    </Button>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-[#EBE5E0] bg-[#F9F7F5] flex justify-end">
            <Button onClick={handleSave} className="w-full md:w-auto">Сохранить изменения</Button>
        </div>
      </div>
    </div>
  );
};