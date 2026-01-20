import React from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Forms';

export const CreateView = ({ formData, setFormData, handleCreateProject, setView, user, organizersList }) => {
  return (
    <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] p-6 md:p-12 animate-fadeIn">
        <div className="max-w-2xl mx-auto">
            <button onClick={() => setView('dashboard')} className="flex items-center text-[#AC8A69] hover:text-[#936142] mb-6 transition-colors">
                <ChevronLeft size={20}/> Назад
            </button>
            <h1 className="text-3xl font-serif text-[#414942] mb-8">Создание проекта</h1>
            <Card className="p-8 space-y-6">
                <Input label="Имя Жениха" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} placeholder="Александр" />
                <Input label="Имя Невесты" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} placeholder="Екатерина" />
                <Input label="Дата свадьбы" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                
                {/* --- ВЕРНУЛИ ПОЛЕ ТИП РЕГИСТРАЦИИ --- */}
                <div className="bg-[#F9F7F5] p-3 rounded-xl border border-[#AC8A69]/30">
                     <label className="block text-[10px] font-bold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">Тип регистрации</label>
                     <select 
                        className="w-full bg-transparent text-[#414942] outline-none border-none p-1"
                        value={formData.registrationType}
                        onChange={e => setFormData({...formData, registrationType: e.target.value})}
                     >
                        <option value="official">Только ЗАГС</option>
                        <option value="outdoor">Выездная регистрация</option>
                        <option value="both">И ЗАГС, и Выездная</option>
                     </select>
                </div>

                {/* --- ВЕРНУЛИ ПОЛЕ МЕСТО СВАДЬБЫ --- */}
                <Input label="Место свадьбы (Банкет)" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} placeholder="Название площадки или ресторана" />

                <Input label="Пароль для пары (для входа)" value={formData.clientPassword} onChange={e => setFormData({...formData, clientPassword: e.target.value})} />
                
                {user.role === 'agency_admin' && (
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">Ответственный организатор</label>
                        <select className="w-full bg-[#F9F7F5] border-none rounded-xl p-4 text-[#414942] outline-none" value={formData.organizerId || ''} onChange={e => setFormData({...formData, organizerId: e.target.value})}>
                            <option value="owner">Я (Администратор)</option>
                            {organizersList.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>
                )}
                
                <Button onClick={handleCreateProject} className="w-full mt-4"><Plus size={20}/> Создать проект</Button>
            </Card>
        </div>
    </div>
  );
};