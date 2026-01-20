import React, { useState } from 'react';
import { Check, Trash2, Calendar, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const TasksView = ({ tasks, updateProject, formatDate }) => {
  const [filter, setFilter] = useState('all'); // all, active, done

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

  // Сортировка: Сначала просроченные, потом ближайшие, в конце выполненные
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done === b.done) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return a.done ? 1 : -1;
  });

  const filteredTasks = sortedTasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const activeCount = tasks.filter(t => !t.done).length;

  return (
    <div className="animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-serif text-[#414942]">Список задач</h2>
                <p className="text-[#AC8A69] mt-2">Осталось выполнить: {activeCount}</p>
            </div>
            <div className="bg-white p-1 rounded-xl shadow-sm border border-[#EBE5E0] flex">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#F9F7F5] text-[#936142]' : 'text-[#CCBBA9]'}`}>Все</button>
                <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'active' ? 'bg-[#F9F7F5] text-[#936142]' : 'text-[#CCBBA9]'}`}>В работе</button>
                <button onClick={() => setFilter('done')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'done' ? 'bg-[#F9F7F5] text-[#936142]' : 'text-[#CCBBA9]'}`}>Готово</button>
            </div>
        </div>

        <div className="space-y-3">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 text-[#CCBBA9]">
                    <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Задач в этом списке нет</p>
                </div>
            ) : (
                filteredTasks.map(task => {
                    const isOverdue = !task.done && new Date(task.deadline) < new Date() && new Date().getDate() !== new Date(task.deadline).getDate();
                    
                    return (
                        <div 
                            key={task.id} 
                            // ИЗМЕНЕНИЕ ЗДЕСЬ: items-start вместо items-center, чтобы выровнять по верху
                            className={`group flex items-start gap-4 p-4 md:p-5 rounded-2xl transition-all border ${task.done ? 'bg-[#F9F7F5]/50 border-transparent opacity-60' : 'bg-white border-[#EBE5E0] hover:border-[#AC8A69]/50 shadow-sm'}`}
                        >
                            {/* Кнопка чекбокса */}
                            <button 
                                onClick={() => toggleTask(task.id, task.done)}
                                className={`flex-shrink-0 mt-1 transition-colors ${task.done ? 'text-[#936142]' : 'text-[#CCBBA9] hover:text-[#AC8A69]'}`}
                            >
                                {task.done ? <CheckCircle2 size={24} className="fill-[#936142]/10"/> : <Circle size={24}/>}
                            </button>

                            {/* Текст задачи */}
                            {/* ИЗМЕНЕНИЕ ЗДЕСЬ: break-words позволяет переносить слова, min-w-0 предотвращает выход за границы */}
                            <div className="flex-1 min-w-0 pt-0.5" onClick={() => toggleTask(task.id, task.done)}>
                                <p className={`font-medium text-base mb-1 transition-all break-words cursor-pointer ${task.done ? 'line-through text-[#CCBBA9]' : 'text-[#414942]'}`}>
                                    {task.text}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-bold' : 'text-[#AC8A69]'}`}>
                                        {isOverdue ? <AlertCircle size={14}/> : <Calendar size={14}/>}
                                        {formatDate(task.deadline)}
                                    </span>
                                </div>
                            </div>

                            {/* Кнопка удаления */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className="flex-shrink-0 p-2 text-[#CCBBA9] hover:text-red-400 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};