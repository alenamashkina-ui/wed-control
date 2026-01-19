import React from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Forms';
import { DownloadMenu } from '../ui/DownloadMenu';
import { toInputDate } from '../../utils';

export const TasksView = ({ tasks, updateProject, formatDate }) => {
  const sortTasks = (taskList) => [...taskList].sort((a, b) => { if (a.done !== b.done) return a.done ? 1 : -1; return new Date(a.deadline) - new Date(b.deadline); });
  const updateTask = (id, field, value) => { const newTasks = tasks.map(t => t.id === id ? { ...t, [field]: value } : t); updateProject('tasks', field === 'done' ? sortTasks(newTasks) : newTasks); };
  const addTask = () => { const newTask = { id: Math.random().toString(36).substr(2, 9), text: 'Новая задача', deadline: new Date().toISOString(), done: false }; updateProject('tasks', sortTasks([...tasks, newTask])); };
  const deleteTask = (id) => updateProject('tasks', tasks.filter(t => t.id !== id));
  const handleExport = (type) => { if (type === 'pdf') window.print(); else downloadCSV([["Задача", "Дедлайн", "Статус"], ...tasks.map(t => [t.text, formatDate(t.deadline), t.done ? "Выполнено" : "В работе"])], "tasks.csv"); };
  
  return ( 
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-2xl font-serif text-[#414942]">Список задач</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="primary" onClick={addTask} className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button>
          <DownloadMenu onSelect={handleExport} />
        </div>
      </div>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className={`group flex flex-col md:flex-row md:items-start p-4 bg-white rounded-xl border transition-all hover:shadow-md gap-4 print:shadow-none print:border-b print:border-t-0 print:border-x-0 print:rounded-none print:p-2 ${task.done ? 'opacity-50 border-transparent' : 'border-[#EBE5E0]'}`}>
            <div className="flex items-start flex-1 gap-4 pt-1">
              <Checkbox checked={task.done} onChange={(checked) => updateTask(task.id, 'done', checked)} />
              <div className="flex-1 min-w-0">
                <textarea className={`w-full font-medium text-base md:text-lg bg-transparent outline-none resize-none overflow-hidden h-auto ${task.done ? 'line-through text-[#CCBBA9]' : 'text-[#414942]'}`} value={task.text} rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onChange={(e) => updateTask(task.id, 'text', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-4 pl-10 md:pl-0 w-full md:w-auto pt-1">
              <div className="flex items-center gap-2 text-[#AC8A69] bg-[#F9F7F5] px-3 py-1.5 rounded-lg w-full md:w-[160px] print:bg-transparent print:p-0 print:w-auto">
                <CalendarDays size={14} className="print:hidden"/>
                <input type="date" className={`bg-transparent outline-none text-sm w-full cursor-pointer print:text-right ${new Date(task.deadline) < new Date() && !task.done ? 'text-red-400 font-bold' : ''}`} value={toInputDate(task.deadline)} onChange={(e) => updateTask(task.id, 'deadline', e.target.value ? new Date(e.target.value).toISOString() : task.deadline)} />
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-[#CCBBA9] hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 print:hidden"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div> 
  );
};