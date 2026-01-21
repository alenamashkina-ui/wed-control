import React, { useState } from 'react';
import { Trash2, Calendar, AlertCircle, CheckCircle2, Circle, Plus } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '../ui/Button'; 
import { DownloadMenu } from '../ui/DownloadMenu';

export const TasksView = ({ tasks, updateProject, formatDate, project }) => {
  const [filter, setFilter] = useState('all'); 
  
  const [editingId, setEditingId] = useState(null); 
  const [editingDateId, setEditingDateId] = useState(null); 
  const [editText, setEditText] = useState('');

  // --- ДАННЫЕ ДЛЯ ФАЙЛОВ ---
  const groom = project?.groomName || 'Жених';
  const bride = project?.brideName || 'Невеста';
  const dateStr = project?.date ? formatDate(project.date) : '';
  const fileName = `${groom} и ${bride}_${dateStr}_Задачи`.replace(/[\\/:*?"<>|]/g, '_');

  // --- ЛОГИКА ---
  const addTask = () => {
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'Новая задача',
      deadline: new Date().toISOString(), 
      done: false
    };
    // Добавляем в массив (сортировка сделает остальное)
    updateProject('tasks', [newTask, ...tasks]);
    
    // Сразу включаем редактирование названия
    setEditingId(newTask.id);
    setEditText(newTask.text);
  };

  const toggleTask = (taskId, currentStatus) => {
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, done: !currentStatus } : t
    );
    updateProject('tasks', newTasks);
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Удалить эту задачу?')) {
      const newTasks = tasks.filter(t => t.id !== taskId);
      updateProject('tasks', newTasks);
    }
  };

  // --- РЕДАКТИРОВАНИЕ ТЕКСТА ---
  const startEditing = (task) => {
    if (task.done) return; 
    setEditingId(task.id);
    setEditText(task.text);
    setEditingDateId(null); 
  };

  const saveEdit = (taskId) => {
    if (editText.trim() === '') return; 
    const newTasks = tasks.map(t => 
        t.id === taskId ? { ...t, text: editText } : t
    );
    updateProject('tasks', newTasks);
    setEditingId(null);
  };

  const handleKeyDown = (e, taskId) => {
    if (e.key === 'Enter') {
        saveEdit(taskId);
    } else if (e.key === 'Escape') {
        setEditingId(null);
    }
  };

  // --- РЕДАКТИРОВАНИЕ ДАТЫ ---
  const toInputDate = (isoString) => {
      if (!isoString) return '';
      return new Date(isoString).toISOString().split('T')[0];
  };

  const handleDateChange = (taskId, newDateString) => {
      if (!newDateString) return;
      const newTasks = tasks.map(t => 
        t.id === taskId ? { ...t, deadline: new Date(newDateString).toISOString() } : t
      );
      updateProject('tasks', newTasks);
      setEditingDateId(null); 
  };

  // --- ЭКСПОРТ ---
  const handleExport = async (type) => {
    const activeTasks = tasks.filter(t => !t.done).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (type === 'excel') {
      const tableData = activeTasks.map(t => ({
        'Задача': t.text,
        'Дедлайн': formatDate(t.deadline),
      }));
      const ws = XLSX.utils.json_to_sheet(tableData);
      ws['!cols'] = [{ wch: 60 }, { wch: 15 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Задачи");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } 
    else if (type === 'csv') {
      const BOM = "\uFEFF"; 
      const header = `Задача;Дедлайн\n`;
      const body = activeTasks.map(t => {
        const safeText = t.text.replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, " ");
        return `"${safeText}";"${formatDate(t.deadline)}"`;
      }).join('\n');
      const csvContent = BOM + header + body;
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
          doc.text("Список задач", 14, 35);
          const tableHead = [['Задача', 'Дедлайн']];
          const tableBody = activeTasks.map(t => [t.text, formatDate(t.deadline)]);
          autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: 40,
            styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 10 },
            headStyles: { fillColor: [147, 97, 66], textColor: 255, fontStyle: 'normal' },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40 } },
            didDrawPage: function (data) {
                const str = 'Стр. ' + doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
                const brand = "paraplanner.ru";
                const brandWidth = doc.getStringUnitWidth(brand) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                doc.text(brand, (pageSize.width - brandWidth) / 2, pageHeight - 10);
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

  // --- СОРТИРОВКА ДЛЯ ЭКРАНА ---
  const sortedTasks = [...tasks].sort((a, b) => {
    // 1. Выполненные всегда внизу
    if (a.done !== b.done) {
        return a.done ? 1 : -1;
    }
    // 2. Активные сортируем по дате (сначала старые/сегодняшние, потом будущие)
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const filteredTasks = sortedTasks.filter(t => {
    if (filter === 'done') return t.done;
    return true; // 'all'
  });

  const activeCount = tasks.filter(t => !t.done).length;

  return (
    <div className="animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-serif text-[#414942]">Список задач</h2>
                <p className="text-[#AC8A69] mt-2">Осталось выполнить: {activeCount}</p>
            </div>
            
            <div className="flex items-center gap-3">
                <DownloadMenu onSelect={handleExport} />
                
                <Button onClick={addTask} className="flex items-center gap-2">
                    <Plus size={18}/> Добавить
                </Button>

                <div className="bg-white p-1 rounded-xl shadow-sm border border-[#EBE5E0] flex ml-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#F9F7F5] text-[#936142]' : 'text-[#CCBBA9]'}`}>Все</button>
                    <button onClick={() => setFilter('done')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'done' ? 'bg-[#F9F7F5] text-[#936142]' : 'text-[#CCBBA9]'}`}>Выполненные</button>
                </div>
            </div>
        </div>

        <div className="space-y-3">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 text-[#CCBBA9]">
                    <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Задач в этом списке нет</p>
                    <Button variant="ghost" onClick={addTask} className="mt-2">Создать задачу</Button>
                </div>
            ) : (
                filteredTasks.map(task => {
                    const isOverdue = !task.done && new Date(task.deadline) < new Date() && new Date().getDate() !== new Date(task.deadline).getDate();
                    const isEditing = editingId === task.id;
                    const isDateEditing = editingDateId === task.id;

                    return (
                        <div 
                            key={task.id} 
                            className={`group flex items-start md:items-center gap-4 p-4 md:p-5 rounded-2xl transition-all border ${task.done ? 'bg-[#F9F7F5]/50 border-transparent opacity-60' : 'bg-white border-[#EBE5E0] hover:border-[#AC8A69]/50 shadow-sm'}`}
                        >
                            {/* ЧЕКБОКС */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    toggleTask(task.id, task.done);
                                }}
                                className={`flex-shrink-0 transition-colors ${task.done ? 'text-[#936142]' : 'text-[#CCBBA9] hover:text-[#AC8A69]'}`}
                            >
                                {task.done ? <CheckCircle2 size={24} className="fill-[#936142]/10"/> : <Circle size={24}/>}
                            </button>

                            {/* ТЕКСТ ЗАДАЧИ */}
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <input 
                                        autoFocus
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onBlur={() => saveEdit(task.id)}
                                        onKeyDown={(e) => handleKeyDown(e, task.id)}
                                        className="w-full bg-transparent outline-none text-[#414942] font-medium text-base p-0 m-0"
                                    />
                                ) : (
                                    <p 
                                        onClick={() => startEditing(task)}
                                        className={`font-medium text-base transition-all break-words cursor-pointer ${task.done ? 'line-through text-[#CCBBA9] cursor-default' : 'text-[#414942] hover:text-[#936142]'}`}
                                    >
                                        {task.text}
                                    </p>
                                )}
                            </div>

                            {/* ПРАВАЯ ЧАСТЬ: ДАТА + КОРЗИНА */}
                            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                                
                                {/* ДАТА */}
                                {isDateEditing && !task.done ? (
                                    <input 
                                        type="date"
                                        autoFocus
                                        value={toInputDate(task.deadline)}
                                        onChange={(e) => handleDateChange(task.id, e.target.value)}
                                        onBlur={() => setEditingDateId(null)} 
                                        className="text-xs border border-[#AC8A69] rounded px-2 py-1 text-[#414942] outline-none"
                                    />
                                ) : (
                                    <div 
                                        onClick={() => !task.done && setEditingDateId(task.id)}
                                        className={`flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-md transition-colors ${isOverdue ? 'text-red-500 font-bold bg-red-50' : 'text-[#AC8A69] hover:bg-[#F9F7F5] hover:text-[#936142]'}`}
                                    >
                                        {isOverdue ? <AlertCircle size={14}/> : <Calendar size={14}/>}
                                        <span className="hidden md:inline">{formatDate(task.deadline)}</span>
                                        <span className="md:hidden">{new Date(task.deadline).getDate()}.{new Date(task.deadline).getMonth()+1}</span>
                                    </div>
                                )}

                                {/* УДАЛЕНИЕ */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                    className="p-2 text-[#CCBBA9] hover:text-red-400 hover:bg-red-50 rounded-full transition-all"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};