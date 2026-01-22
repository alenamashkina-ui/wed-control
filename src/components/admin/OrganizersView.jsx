import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, User, Mail, Key } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { APP_ID_DB } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Forms';
import { Card } from '../ui/Card';

// МЫ УБРАЛИ ОТСЮДА СТРОКУ "const db = getFirestore()", ОНА ВЫЗЫВАЛА ОШИБКУ

export const OrganizersView = ({ currentUser, db }) => { // <--- Теперь мы принимаем db как инструмент
  const [organizers, setOrganizers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    name: '',
    email: '',
    password: '', 
    // Phone убрали
    role: 'organizer',
    agencyId: currentUser.agencyId || 'legacy_agency' 
  };
  
  const [formData, setFormData] = useState(initialForm);

  // 1. Загружаем список
  useEffect(() => {
    if (!currentUser?.agencyId || !db) return; // Проверка: если базы нет, ждем
    
    const q = query(
      collection(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users'), 
      where('agencyId', '==', currentUser.agencyId),
      where('role', '==', 'organizer')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrganizers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [currentUser, db]);

  // 2. Сохранение
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Заполните Имя, Email и Пароль");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', editingId), {
          name: formData.name,
          email: formData.email.toLowerCase().trim(),
          password: formData.password.trim()
          // Phone убрали
        });
      } else {
        await addDoc(collection(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users'), {
          ...formData,
          email: formData.email.toLowerCase().trim(),
          password: formData.password.trim(),
          createdAt: new Date().toISOString()
        });
      }
      setIsEditing(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert("Ошибка при сохранении");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить этого организатора?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', id));
    }
  };

  const startEdit = (org) => {
    setFormData(org);
    setEditingId(org.id);
    setIsEditing(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-2xl md:text-3xl font-serif text-[#414942]">Команда</h1>
           {/* text-sm на мобильном, text-base на десктопе */}
           <p className="text-[#AC8A69] mt-2 text-sm md:text-base">
             Добавьте организаторов, чтобы они могли вести проекты
           </p>
        </div>
        {!isEditing && (
          <Button onClick={() => { setFormData(initialForm); setIsEditing(true); }} className="w-full md:w-auto">
            <Plus size={20} /> <span className="ml-2">Добавить</span>
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="p-6 md:p-8 max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#414942]">
                {editingId ? 'Редактирование' : 'Новый сотрудник'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-[#CCBBA9] hover:text-[#936142]">
                <X size={24}/>
            </button>
          </div>
          
          <div className="space-y-4">
            <Input 
                icon={User} 
                label="Имя Фамилия" 
                placeholder="Анна Иванова" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
                icon={Mail} 
                label="Email (Логин)" 
                placeholder="anna@agency.ru" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <Input 
                icon={Key} 
                label="Пароль" 
                placeholder="Пароль" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            
            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} className="flex-1 justify-center"><Save size={18} className="mr-2"/> Сохранить</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {organizers.length === 0 ? (
            <div className="text-center py-10 text-[#CCBBA9] border-2 border-dashed border-[#EBE5E0] rounded-xl">
                Пока нет сотрудников. Нажмите "Добавить".
            </div>
          ) : (
            organizers.map(org => (
              <div key={org.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#EBE5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F9F7F5] rounded-full flex items-center justify-center text-[#936142] flex-shrink-0">
                      <User size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-[#414942] text-base md:text-lg">{org.name}</h3>
                      <p className="text-sm text-[#AC8A69]">{org.email}</p>
                      <p className="text-xs text-[#CCBBA9] mt-0.5">Пароль: {org.password}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button onClick={() => startEdit(org)} className="p-2 text-[#AC8A69] hover:bg-[#F9F7F5] rounded-full transition-colors">
                      <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(org.id)} className="p-2 text-[#CCBBA9] hover:text-red-400 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};