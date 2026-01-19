import React from 'react';
import { X, Link as LinkIcon, Printer, Download, Archive, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Forms';
import { SITE_URL } from '../../constants';

export const SettingsModal = ({ project, updateProject, onClose, toggleArchive, deleteProject, downloadCSV }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-[#414942]">Настройки</h2>
                <button onClick={onClose} className="text-[#AC8A69] hover:text-[#936142] p-1"><X size={24}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
            <div className="space-y-4">
                <div className="bg-[#F9F7F5] p-4 rounded-xl mb-4 border border-[#AC8A69]/20">
                    <p className="text-[10px] text-[#AC8A69] uppercase font-bold mb-2">Доступ для клиента</p>
                    <div className="flex gap-2 mb-2 items-center">
                        <input className="flex-1 bg-white border border-[#EBE5E0] rounded-lg p-2 text-sm text-[#AC8A69] overflow-hidden text-ellipsis" value={`${SITE_URL}/?id=${project.id}`} readOnly />
                        <button onClick={() => { navigator.clipboard.writeText(`${SITE_URL}/?id=${project.id}`); alert('Ссылка скопирована!'); }} className="bg-[#936142] text-white p-2 rounded-lg hover:bg-[#7D5238] transition-colors"><LinkIcon size={16}/></button>
                    </div>
                    <Input label="Пароль клиента" value={project.clientPassword} onChange={(e) => updateProject('clientPassword', e.target.value)} />
                </div>
                <Input label="Жених" value={project.groomName} onChange={(e) => updateProject('groomName', e.target.value)} />
                <Input label="Невеста" value={project.brideName} onChange={(e) => updateProject('brideName', e.target.value)} />
                <Input label="Дата" type="date" value={project.date} onChange={(e) => updateProject('date', e.target.value)} />
                <Input label="Гостей" type="number" value={project.guestsCount} onChange={(e) => updateProject('guestsCount', e.target.value)} />
                <Input label="Локация" value={project.venueName} onChange={(e) => updateProject('venueName', e.target.value)} />
                
                <div className="border-t border-[#EBE5E0] pt-4 mt-4">
                    <h4 className="text-sm font-bold text-[#414942] mb-3">Экспорт проекта</h4>
                    <button onClick={() => {window.print(); onClose();}} className="w-full flex items-center justify-center gap-2 p-3 bg-[#F9F7F5] rounded-xl text-[#414942] hover:bg-[#EBE5E0] transition-colors mb-2"><Printer size={16}/> Печать / PDF</button>
                    <button onClick={() => {downloadCSV([["Наименование", "План", "Факт", "Внесено", "Остаток", "Комментарий"], ...project.expenses.map(e => [e.name, e.plan, e.fact, e.paid, e.fact - e.paid, e.note || ''])], "budget.csv"); onClose();}} className="w-full flex items-center justify-center gap-2 p-3 bg-[#F9F7F5] rounded-xl text-[#414942] hover:bg-[#EBE5E0] transition-colors mb-2"><Download size={16}/> Скачать смету (Excel)</button>
                    <button onClick={() => {downloadCSV([["ФИО", "Рассадка", "Стол", "Еда", "Напитки", "Трансфер", "Комментарий"], ...project.guests.map(g => [g.name, g.seatingName, g.table, g.food, g.drinks, g.transfer ? "Да" : "Нет", g.comment])], "guests.csv"); onClose();}} className="w-full flex items-center justify-center gap-2 p-3 bg-[#F9F7F5] rounded-xl text-[#414942] hover:bg-[#EBE5E0] transition-colors"><Download size={16}/> Скачать гостей (Excel)</button>
                </div>
            </div>
            <div className="flex flex-col gap-2 mt-8">
                <Button onClick={onClose} variant="primary" className="w-full">Сохранить</Button>
                <div className="flex gap-2">
                    <Button onClick={toggleArchive} variant="outline" className="flex-1"><Archive size={16}/> {project.isArchived ? 'Вернуть' : 'В архив'}</Button>
                    <Button onClick={deleteProject} variant="danger" className="flex-1"><Trash2 size={16}/> Удалить</Button>
                </div>
            </div>
            </div>
        </div>
    </div>
  );
};