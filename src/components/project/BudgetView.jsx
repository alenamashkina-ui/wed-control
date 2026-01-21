import React, { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AutoHeightTextarea } from '../ui/Forms';
import { DownloadMenu } from '../ui/DownloadMenu';
import { formatCurrency } from '../../utils';

export const BudgetView = ({ expenses, updateProject, project }) => {
  // 1. Расчет итогов
  const totals = useMemo(() => {
    return expenses.reduce((acc, item) => ({
      plan: acc.plan + Number(item.plan || 0),
      fact: acc.fact + Number(item.fact || 0),
      paid: acc.paid + Number(item.paid || 0),
    }), { plan: 0, fact: 0, paid: 0 });
  }, [expenses]);

  const balance = totals.fact - totals.paid;

  // 2. Управление данными
  const updateExpense = (index, field, val) => {
    const newExpenses = [...expenses];
    newExpenses[index][field] = val;
    updateProject('expenses', newExpenses);
  };

  const addExpense = () => {
    updateProject('expenses', [
      ...expenses, 
      { 
        id: Math.random().toString(36).substr(2, 9),
        category: 'Новое', 
        name: 'Новая статья', 
        plan: 0, 
        fact: 0, 
        paid: 0, 
        note: '' 
      }
    ]);
  };

  const removeExpense = (index) => {
    if (window.confirm('Удалить статью?')) {
        const newExpenses = [...expenses];
        newExpenses.splice(index, 1);
        updateProject('expenses', newExpenses);
    }
  };

  // 3. Логика исчезающего нуля
  const handleFocus = (index, field, val) => {
    if (Number(val) === 0) updateExpense(index, field, '');
  };

  const handleBlur = (index, field, val) => {
    if (val === '' || val === null || isNaN(Number(val))) updateExpense(index, field, 0);
  };

  // 4. Логика экспорта
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

    // --- EXCEL ---
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

    // --- CSV ---
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

                doc.setFontSize(14);
                doc.text(`Смета: ${groom} и ${bride}`, 14, 15);
                if (dateStr) doc.text(`Дата: ${dateStr}`, 14, 22);

                const tableBody = tableData.map(r => [
                    r.name, 
                    formatCurrency(r.plan), 
                    formatCurrency(r.fact), 
                    formatCurrency(r.paid), 
                    formatCurrency(r.rest), 
                    r.note
                ]);
                
                const tableFoot = [[
                    'ИТОГО', 
                    formatCurrency(totals.plan), 
                    formatCurrency(totals.fact), 
                    formatCurrency(totals.paid), 
                    formatCurrency(totals.fact - totals.paid), 
                    ''
                ]];

                autoTable(doc, {
                    head: [['Статья расходов', 'План', 'Факт', 'Внесено', 'Остаток', 'Комментарий']],
                    body: tableBody,
                    foot: tableFoot,
                    startY: 30,
                    showFoot: 'lastPage',
                    styles: { 
                        font: 'Roboto', 
                        fontStyle: 'normal', 
                        fontSize: 9, 
                        cellPadding: 2,
                        valign: 'middle' 
                    },
                    headStyles: { 
                        fillColor: [147, 97, 66], 
                        textColor: 255, 
                        fontStyle: 'normal',
                        halign: 'center' 
                    },
                    footStyles: { 
                        fillColor: [249, 247, 245], 
                        textColor: [147, 97, 66], 
                        fontStyle: 'bold',
                        halign: 'right' 
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto', halign: 'left' },
                        1: { cellWidth: 20, halign: 'center' },
                        2: { cellWidth: 20, halign: 'center' },
                        3: { cellWidth: 20, halign: 'center' },
                        4: { cellWidth: 20, halign: 'center' },
                        5: { cellWidth: 45, halign: 'left' }
                    },
                    margin: { bottom: 20 }
                });

                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    const footerText = `${i}/${pageCount} - paraplanner.ru`;
                    const pageSize = doc.internal.pageSize;
                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    const textWidth = doc.getStringUnitWidth(footerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
                }

                doc.save(`${fileName}.pdf`);
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            alert("Ошибка PDF");
        }
    }
  };

  return (
    <div className="animate-fadeIn pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-3xl font-serif text-[#414942]">Смета расходов</h2>
            <div className="flex gap-2 print:hidden">
                 <DownloadMenu onSelect={handleExport} />
                 <Button onClick={addExpense} variant="primary" className="flex items-center gap-2">
                    <Plus size={18}/> Добавить статью
                </Button>
            </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">
        {['План', 'Факт', 'Внесено', 'Остаток'].map((label, i) => (
          <Card key={label} className={`p-4 md:p-6 text-center ${i===3 ? 'bg-[#414942] text-white' : ''}`}>
            <p className={`${i===3 ? 'text-white/60' : 'text-[#AC8A69]'} text-[10px] md:text-xs uppercase tracking-widest mb-2`}>{label}</p>
            <p className={`text-lg md:text-2xl font-medium ${i===3 ? 'text-white' : i===2 ? 'text-[#936142]' : 'text-[#414942]'}`}>
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
                <th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Статья расходов</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">План</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Факт</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Внесено</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Остаток</th>
                <th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Комментарии</th>
                <th className="p-2 md:p-4 font-semibold w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE5E0] print:divide-[#CCBBA9]">
              {expenses.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#F9F7F5]/50 group print:break-inside-avoid">
                  {/* НАЗВАНИЕ */}
                  <td className="p-2 md:p-4 align-top">
                    <AutoHeightTextarea 
                        className="w-full bg-transparent outline-none font-medium text-[#414942] text-sm md:text-base whitespace-normal min-h-[1.5rem]" 
                        value={item.name} 
                        onChange={(e) => updateExpense(idx, 'name', e.target.value)} 
                    />
                  </td>
                  
                  {/* ЦИФРЫ - Добавлен onWheel={(e) => e.target.blur()} чтобы отключить смену цифр тачпадом */}
                  <td className="p-2 md:p-4 align-top">
                    <input 
                        type="number"
                        value={item.plan} 
                        onChange={(e) => updateExpense(idx, 'plan', e.target.value)}
                        onFocus={() => handleFocus(idx, 'plan', item.plan)}
                        onBlur={() => handleBlur(idx, 'plan', item.plan)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-transparent outline-none text-[#414942] text-sm md:text-base placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="p-2 md:p-4 align-top">
                    <input 
                        type="number"
                        value={item.fact} 
                        onChange={(e) => updateExpense(idx, 'fact', e.target.value)}
                        onFocus={() => handleFocus(idx, 'fact', item.fact)}
                        onBlur={() => handleBlur(idx, 'fact', item.fact)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-transparent outline-none text-[#414942] text-sm md:text-base placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="p-2 md:p-4 align-top">
                    <input 
                        type="number"
                        value={item.paid} 
                        onChange={(e) => updateExpense(idx, 'paid', e.target.value)}
                        onFocus={() => handleFocus(idx, 'paid', item.paid)}
                        onBlur={() => handleBlur(idx, 'paid', item.paid)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-transparent outline-none text-[#414942] text-sm md:text-base placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  
                  {/* ОСТАТОК */}
                  <td className="p-2 md:p-4 align-top text-[#AC8A69] text-sm md:text-base">
                    {formatCurrency(item.fact - item.paid)}
                  </td>
                  
                  {/* КОММЕНТАРИЙ */}
                  <td className="p-2 md:p-4 align-top">
                    <AutoHeightTextarea 
                        className="w-full bg-transparent outline-none text-xs text-[#AC8A69] placeholder-[#CCBBA9] min-h-[1.5rem]" 
                        placeholder="..." 
                        value={item.note || ''} 
                        onChange={(e) => updateExpense(idx, 'note', e.target.value)} 
                    />
                  </td>
                  
                  {/* УДАЛЕНИЕ */}
                  <td className="p-2 md:p-4 align-top print:hidden">
                    <button onClick={() => removeExpense(idx)} className="text-red-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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