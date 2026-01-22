import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
// AutoHeightTextarea убрали, будем использовать нативный input
import { DownloadMenu } from '../ui/DownloadMenu';
import { formatCurrency } from '../../utils';

export const BudgetView = ({ expenses, updateProject, project }) => {
  const [activeField, setActiveField] = useState({ index: null, field: null });

  // 1. Итоги
  const totals = useMemo(() => {
    return expenses.reduce((acc, item) => ({
      plan: acc.plan + Number(item.plan || 0),
      fact: acc.fact + Number(item.fact || 0),
      paid: acc.paid + Number(item.paid || 0),
    }), { plan: 0, fact: 0, paid: 0 });
  }, [expenses]);

  // 2. Управление
  const updateExpense = (index, field, val) => {
    const newExpenses = [...expenses];
    const cleanVal = (field === 'plan' || field === 'fact' || field === 'paid') ? Number(val) : val;
    newExpenses[index] = { ...newExpenses[index], [field]: cleanVal };
    updateProject('expenses', newExpenses);
  };

  const addExpense = () => {
    const newItem = { 
        id: Math.random().toString(36).substr(2, 9), 
        category: 'Новое', 
        name: 'Новая статья', 
        plan: 0, 
        fact: 0, 
        paid: 0, 
        note: '' 
    };
    updateProject('expenses', [newItem, ...expenses]);
  };

  const removeExpense = (index) => {
    if (window.confirm('Удалить статью?')) {
        const newExpenses = [...expenses];
        newExpenses.splice(index, 1);
        updateProject('expenses', newExpenses);
    }
  };

  // 3. Фокус
  const handleFocus = (index, field) => {
    setActiveField({ index, field });
  };

  const handleBlur = () => {
    setActiveField({ index: null, field: null });
  };

  // 4. Функция авто-высоты для обычного textarea
  const adjustHeight = (e) => {
    e.target.style.height = 'auto'; // Сброс высоты
    e.target.style.height = `${e.target.scrollHeight}px`; // Установка по контенту
  };

  // 5. Экспорт
  const handleExport = async (type) => {
    const groom = project?.groomName || 'Жених';
    const bride = project?.brideName || 'Невеста';
    const dateStr = project?.date ? new Date(project.date).toLocaleDateString('ru-RU') : '';
    const fileName = `${groom} и ${bride}_${dateStr}_Смета`.replace(/[\\/:*?"<>|]/g, '_');

    const tableData = expenses.map(e => ({
        name: e.name,
        plan: Number(e.plan),
        fact: Number(e.fact),
        paid: Number(e.paid),
        rest: Number(e.fact) - Number(e.paid),
        note: e.note || ''
    }));

    if (type === 'excel') {
        const wsData = [
            ['Статья расходов', 'План', 'Факт', 'Внесено', 'Остаток', 'Комментарий'],
            ...tableData.map(r => [r.name, r.plan, r.fact, r.paid, r.rest, r.note]),
            ['ИТОГО', totals.plan, totals.fact, totals.paid, totals.fact - totals.paid, '']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 40}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Смета");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
    else if (type === 'csv') {
        const BOM = "\uFEFF";
        const columns = `Статья расходов;План;Факт;Внесено;Остаток;Комментарий\n`;
        const body = tableData.map(r => 
            `"${r.name.replace(/"/g, '""')}";${r.plan};${r.fact};${r.paid};${r.rest};"${r.note.replace(/"/g, '""')}"`
        ).join('\n');
        const footer = `\nИТОГО;${totals.plan};${totals.fact};${totals.paid};${totals.fact - totals.paid};`;
        const csvContent = BOM + columns + body + footer;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `${fileName}.csv`);
    }
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
                doc.text("Смета расходов", 14, 35);
                const tableBody = tableData.map(r => [r.name, formatCurrency(r.plan), formatCurrency(r.fact), formatCurrency(r.paid), formatCurrency(r.rest), r.note]);
                const tableFoot = [['ИТОГО', formatCurrency(totals.plan), formatCurrency(totals.fact), formatCurrency(totals.paid), formatCurrency(totals.fact - totals.paid), '']];
                autoTable(doc, {
                    head: [['Статья расходов', 'План', 'Факт', 'Внесено', 'Остаток', 'Комментарий']],
                    body: tableBody,
                    foot: tableFoot,
                    startY: 40,
                    showFoot: 'lastPage',
                    styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 9, cellPadding: 2, valign: 'middle' },
                    headStyles: { fillColor: [147, 97, 66], textColor: 255, fontStyle: 'normal', halign: 'center' },
                    footStyles: { fillColor: [249, 247, 245], textColor: [147, 97, 66], fontStyle: 'normal', halign: 'right', font: 'Roboto' },
                    columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 20, halign: 'center' }, 5: { cellWidth: 45, halign: 'left' } },
                    margin: { bottom: 20 },
                    didDrawPage: function (data) {
                        const pageSize = doc.internal.pageSize;
                        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                        doc.setFontSize(8); doc.setTextColor(150);
                        doc.text("paraplanner.ru", (pageSize.width - 20) / 2, pageHeight - 10);
                    }
                });
                doc.save(`${fileName}.pdf`);
            };
            reader.readAsDataURL(blob);
        } catch (e) { alert("Ошибка PDF"); }
    }
  };

  return (
    <div className="animate-fadeIn pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-[#414942]">Смета расходов</h2>
            <div className="flex gap-2 print:hidden w-full md:w-auto">
                 <DownloadMenu onSelect={handleExport} />
                 <Button onClick={addExpense} variant="primary" className="flex items-center justify-center gap-2 flex-1 md:flex-none">
                    <Plus size={18}/> <span className="md:hidden">Добавить</span><span className="hidden md:inline">Добавить статью</span>
                </Button>
            </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 print:hidden">
        {['План', 'Факт', 'Внесено', 'Остаток'].map((label, i) => (
          <Card key={label} className={`p-3 md:p-6 text-center ${i===3 ? 'bg-[#414942] text-white' : ''}`}>
            <p className={`${i===3 ? 'text-white/60' : 'text-[#AC8A69]'} text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2`}>{label}</p>
            <p className={`text-base md:text-2xl font-medium ${i===3 ? 'text-white' : i===2 ? 'text-[#936142]' : 'text-[#414942]'}`}>
              {formatCurrency(i===0?totals.plan:i===1?totals.fact:i===2?totals.paid:totals.fact-totals.paid)}
            </p>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0">
            <thead>
              <tr className="bg-[#F9F7F5] text-[#936142] text-xs md:text-sm uppercase tracking-wider print:bg-transparent print:border-b print:border-[#414942]">
                <th className="p-3 md:p-4 font-semibold w-[200px] min-w-[200px]">Статья расходов</th>
                <th className="p-3 md:p-4 font-semibold w-[120px] min-w-[120px]">План</th>
                <th className="p-3 md:p-4 font-semibold w-[120px] min-w-[120px]">Факт</th>
                <th className="p-3 md:p-4 font-semibold w-[120px] min-w-[120px]">Внесено</th>
                <th className="p-3 md:p-4 font-semibold w-[120px] min-w-[120px]">Остаток</th>
                <th className="p-3 md:p-4 font-semibold w-[200px] min-w-[200px]">Комментарии</th>
                <th className="p-3 md:p-4 font-semibold w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE5E0] print:divide-[#CCBBA9]">
              {expenses.map((item, idx) => (
                // Используем align-top, чтобы при переносе строки цифры оставались напротив первой строки
                <tr key={item.id || idx} className="hover:bg-[#F9F7F5]/50 group print:break-inside-avoid">
                  
                  {/* НАЗВАНИЕ - ТЕПЕРЬ ОБЫЧНЫЙ TEXTAREA */}
                  <td className="py-2 px-2 md:p-4 align-top">
                    <textarea 
                        rows={1}
                        // pt-0.5 для выравнивания текста по высоте с цифрами
                        className="w-full bg-transparent outline-none font-medium text-[#414942] text-[13px] md:text-base resize-none overflow-hidden leading-[1.2] py-0 m-0 block placeholder-transparent pt-0.5" 
                        value={item.name} 
                        onChange={(e) => {
                            updateExpense(idx, 'name', e.target.value);
                            adjustHeight(e);
                        }}
                        // При загрузке подстраиваем высоту
                        ref={el => el && adjustHeight({target: el})}
                    />
                  </td>
                  
                  {/* ПЛАН */}
                  <td className="py-2 px-2 md:p-4 align-top">
                    <input 
                        type="number" 
                        value={activeField.index === idx && activeField.field === 'plan' && item.plan === 0 ? '' : item.plan} 
                        onChange={(e) => updateExpense(idx, 'plan', e.target.value)}
                        onFocus={() => handleFocus(idx, 'plan')}
                        onBlur={() => handleBlur()}
                        onWheel={(e) => e.target.blur()} 
                        className="w-full bg-transparent outline-none text-[#414942] text-[13px] md:text-base placeholder-transparent leading-[1.2] py-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* ФАКТ */}
                  <td className="py-2 px-2 md:p-4 align-top">
                    <input 
                        type="number"
                        value={activeField.index === idx && activeField.field === 'fact' && item.fact === 0 ? '' : item.fact} 
                        onChange={(e) => updateExpense(idx, 'fact', e.target.value)}
                        onFocus={() => handleFocus(idx, 'fact')}
                        onBlur={() => handleBlur()}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-transparent outline-none text-[#414942] text-[13px] md:text-base placeholder-transparent leading-[1.2] py-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* ВНЕСЕНО */}
                  <td className="py-2 px-2 md:p-4 align-top">
                    <input 
                        type="number"
                        value={activeField.index === idx && activeField.field === 'paid' && item.paid === 0 ? '' : item.paid} 
                        onChange={(e) => updateExpense(idx, 'paid', e.target.value)}
                        onFocus={() => handleFocus(idx, 'paid')}
                        onBlur={() => handleBlur()}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-transparent outline-none text-[#414942] text-[13px] md:text-base placeholder-transparent leading-[1.2] py-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  
                  {/* ОСТАТОК */}
                  <td className="py-2 px-2 md:p-4 align-top text-[#AC8A69] text-[13px] md:text-base leading-[1.2]">
                    {formatCurrency(item.fact - item.paid)}
                  </td>
                  
                  {/* КОММЕНТАРИЙ - ТЕПЕРЬ ОБЫЧНЫЙ TEXTAREA */}
                  <td className="py-2 px-2 md:p-4 align-top">
                    <textarea 
                        rows={1}
                        className="w-full bg-transparent outline-none text-[11px] md:text-xs text-[#AC8A69] placeholder-[#CCBBA9] resize-none overflow-hidden leading-[1.2] py-0 m-0 block pt-0.5" 
                        placeholder="..." 
                        value={item.note || ''} 
                        onChange={(e) => {
                            updateExpense(idx, 'note', e.target.value);
                            adjustHeight(e);
                        }}
                        ref={el => el && adjustHeight({target: el})}
                    />
                  </td>
                  
                  {/* УДАЛЕНИЕ */}
                  <td className="py-2 px-2 md:p-4 align-top print:hidden">
                    <button onClick={() => removeExpense(idx)} className="text-red-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center pt-0.5">
                        <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div> 
  );
};