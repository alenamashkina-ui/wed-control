import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, Trash2, ShieldAlert, User, Mail, 
  Phone, MapPin, Search, Loader2, Plus, Edit2, X, Save,
  Briefcase, Users, Calendar, ListFilter, Settings, Shield
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, where, 
  onSnapshot, deleteDoc, doc, getDocs, addDoc, updateDoc 
} from "firebase/firestore";

import { firebaseConfig, APP_ID_DB } from '../../constants';
import { formatDate } from '../../utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Forms';
import { Footer } from '../common/Footer';
import { Logo } from '../ui/Logo';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function SuperAdminView({ onLogout, currentUser }) {
  // Данные
  const [rawUsers, setRawUsers] = useState([]);
  const [rawProjects, setRawProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); 
  
  // Состояния
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Модалка Агентства
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [agencyFormData, setAgencyFormData] = useState({ name: '', email: '', password: '', phone: '' });

  // Модалка Профиля Супер-Админа
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ 
      email: currentUser?.email || '', 
      password: currentUser?.password || '', 
      secret: currentUser?.secret || '' 
  });

  // 1. ПОДПИСКА НА ДАННЫЕ
  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users'), (snapshot) => {
        setRawUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProjects = onSnapshot(collection(db, 'artifacts', APP_ID_DB, 'public', 'data', 'projects'), (snapshot) => {
        setRawProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const timer = setTimeout(() => setLoading(false), 800);
    return () => { unsubUsers(); unsubProjects(); clearTimeout(timer); };
  }, []);

  // 2. ПЕРЕСЧЕТ
  const processedAgencies = useMemo(() => {
      const admins = rawUsers.filter(u => u.role === 'agency_admin');
      return admins.map(agency => {
          const targetId = agency.agencyId || agency.id;
          const employees = rawUsers.filter(u => u.role === 'organizer' && (u.agencyId === targetId || u.agencyId === agency.id));
          const projects = rawProjects.filter(p => p.agencyId === targetId || p.agencyId === agency.id || p.organizerId === agency.id);
          return { ...agency, stats: { employees: employees.length, projects: projects.length } };
      })
      .filter(a => (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
          if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
          return 0;
      });
  }, [rawUsers, rawProjects, searchTerm, sortBy]);

  // 3. УДАЛЕНИЕ
  const handleDeleteAgency = async (agencyUser) => {
    if (!window.confirm(`Удалить агентство "${agencyUser.name}" и ВСЕ его данные?`)) return;
    setIsDeleting(true);
    try {
      const targetId = agencyUser.agencyId || agencyUser.id;
      const projectsToDelete = rawProjects.filter(p => p.agencyId === targetId || p.organizerId === agencyUser.id);
      await Promise.all(projectsToDelete.map(p => deleteDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'projects', p.id))));
      const usersToDelete = rawUsers.filter(u => u.agencyId === targetId && u.id !== agencyUser.id);
      await Promise.all(usersToDelete.map(u => deleteDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', u.id))));
      await deleteDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', agencyUser.id));
      alert('Агентство удалено.');
    } catch (error) { alert("Ошибка: " + error.message); } finally { setIsDeleting(false); }
  };

  // 4. СОХРАНЕНИЕ АГЕНТСТВА
  const handleSaveAgency = async () => {
      const cleanEmail = agencyFormData.email.toLowerCase().trim();
      const cleanPass = agencyFormData.password.trim(); 
      if (!cleanEmail || !cleanPass) { alert("Email и пароль обязательны"); return; }
      setIsSaving(true);
      try {
          const usersRef = collection(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users');
          const existingUser = rawUsers.find(u => u.email === cleanEmail);
          if (existingUser) {
              if (!editingAgency || (editingAgency && existingUser.id !== editingAgency.id)) {
                  alert("Email занят!"); setIsSaving(false); return;
              }
          }
          const userData = { name: agencyFormData.name, email: cleanEmail, password: cleanPass, phone: agencyFormData.phone };
          if (editingAgency) {
              await updateDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', editingAgency.id), userData);
          } else {
              const docRef = await addDoc(usersRef, { ...userData, role: 'agency_admin', createdAt: new Date().toISOString() });
              await updateDoc(docRef, { agencyId: docRef.id });
          }
          setShowAgencyModal(false);
      } catch (e) { alert("Ошибка: " + e.message); } finally { setIsSaving(false); }
  };

  // 5. ОБНОВЛЕНИЕ ПРОФИЛЯ СУПЕР АДМИНА
  const handleUpdateProfile = async () => {
      if (!profileData.email || !profileData.password) return;
      try {
          await updateDoc(doc(db, 'artifacts', APP_ID_DB, 'public', 'data', 'users', currentUser.id), {
              email: profileData.email.toLowerCase().trim(),
              password: profileData.password.trim(),
              secret: profileData.secret.trim()
          });
          alert("Ваш профиль обновлен");
          setShowProfileModal(false);
      } catch(e) {
          alert("Ошибка обновления профиля: " + e.message);
      }
  };

  const openCreateModal = () => { setEditingAgency(null); setAgencyFormData({ name: '', email: '', password: '', phone: '' }); setShowAgencyModal(true); };
  const openEditModal = (agency) => { setEditingAgency(agency); setAgencyFormData({ name: agency.name || '', email: agency.email || '', password: agency.password || '', phone: agency.phone || '' }); setShowAgencyModal(true); };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F9F7F5] font-[Montserrat] p-6 md:p-12">
      <div className="max-w-6xl mx-auto w-full flex-1">
          
          {/* ХЕДЕР */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <Logo className="h-16 md:h-20 -ml-2 md:-ml-3" />
                <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => setShowProfileModal(true)} className="text-[#AC8A69] hover:text-[#936142] flex items-center gap-2 font-medium transition-colors">
                        <Settings size={16} /> Кабинет: {currentUser?.name || 'Super Admin'}
                    </button>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">SUPER ADMIN</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={openCreateModal}><Plus size={20} /> Добавить агентство</Button>
                <Button variant="ghost" onClick={onLogout}><X size={20} /> Выход</Button>
            </div>
          </header>

          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-[#EBE5E0] pb-6">
            <div>
                <h1 className="text-3xl font-serif text-[#414942] mb-2">Агентства</h1>
                <p className="text-[#CCBBA9]">Управление лицензиями ({processedAgencies.length})</p>
            </div>
            
            {/* ФИЛЬТРЫ И ПОИСК (КОМПАКТНО) */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CCBBA9]" size={18}/>
                    <input type="text" placeholder="Поиск..." className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#EBE5E0] focus:border-[#AC8A69] outline-none text-[#414942] text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {/* Сортировка - маленькая кнопка/дропдаун */}
                <div className="relative group">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#EBE5E0] hover:border-[#AC8A69] cursor-pointer transition-colors">
                        <ListFilter size={18} className="text-[#AC8A69]" />
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-sm text-[#414942] font-medium outline-none cursor-pointer appearance-none pr-4"
                        >
                            <option value="date">По дате</option>
                            <option value="name">По имени</option>
                        </select>
                    </div>
                </div>
            </div>
          </div>

          {loading ? (
              <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#936142]" size={40}/></div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedAgencies.map(agency => (
                    <div key={agency.id} className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-[#EBE5E0] hover:border-[#AC8A69]/30 flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[#F9F7F5] rounded-2xl text-[#936142] group-hover:bg-[#936142] group-hover:text-white transition-colors">
                                    <Building size={24} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(agency)} className="p-2 text-[#AC8A69] hover:bg-[#F9F7F5] rounded-full transition-colors"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteAgency(agency)} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#414942] mb-1 line-clamp-1">{agency.name || 'Без названия'}</h3>
                            <div className="text-sm text-[#AC8A69] mb-4 flex items-center gap-2"><Mail size={12}/> {agency.email}</div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-[#F9F7F5] rounded-xl p-3 flex flex-col items-center justify-center">
                                    <span className="font-bold text-xl text-[#414942]">{agency.stats.employees}</span>
                                    <span className="text-[10px] uppercase text-[#CCBBA9] font-bold tracking-wider">Команда</span>
                                </div>
                                <div className="bg-[#F9F7F5] rounded-xl p-3 flex flex-col items-center justify-center">
                                    <span className="font-bold text-xl text-[#414942]">{agency.stats.projects}</span>
                                    <span className="text-[10px] uppercase text-[#CCBBA9] font-bold tracking-wider">Проекты</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[#F9F7F5] flex justify-between items-center text-xs">
                            <span className="text-[#CCBBA9] flex items-center gap-1"><Calendar size={12}/> {agency.createdAt ? formatDate(agency.createdAt) : '—'}</span>
                            <span className="text-[#AC8A69] bg-[#AC8A69]/10 px-2 py-1 rounded font-medium">Pass: {agency.password}</span>
                        </div>
                    </div>
                ))}
              </div>
          )}
          {processedAgencies.length === 0 && !loading && (<div className="text-center py-20 text-[#CCBBA9]">Агентства не найдены</div>)}
      </div>
      <Footer />

      {/* МОДАЛКА АГЕНТСТВА */}
      {showAgencyModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-md p-6 relative animate-fadeIn">
                  <button onClick={() => setShowAgencyModal(false)} className="absolute top-4 right-4 text-[#AC8A69] hover:text-[#936142]"><X size={24}/></button>
                  <h3 className="text-2xl font-serif text-[#414942] mb-6">{editingAgency ? 'Редактировать' : 'Новое агентство'}</h3>
                  <div className="space-y-4">
                      <Input label="Название" placeholder="Agency Name" value={agencyFormData.name} onChange={e => setAgencyFormData({...agencyFormData, name: e.target.value})} />
                      <Input label="Email" placeholder="mail@example.com" value={agencyFormData.email} onChange={e => setAgencyFormData({...agencyFormData, email: e.target.value})} />
                      <Input type="text" label="Пароль" placeholder="Пароль" value={agencyFormData.password} onChange={e => setAgencyFormData({...agencyFormData, password: e.target.value})} />
                      <Input label="Телефон" value={agencyFormData.phone} onChange={e => setAgencyFormData({...agencyFormData, phone: e.target.value})} />
                      <Button className="w-full mt-4" onClick={handleSaveAgency} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}{editingAgency ? 'Сохранить' : 'Создать'}</Button>
                  </div>
              </Card>
          </div>
      )}

      {/* МОДАЛКА ПРОФИЛЯ СУПЕР-АДМИНА */}
      {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-md p-6 relative animate-fadeIn">
                  <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-[#AC8A69] hover:text-[#936142]"><X size={24}/></button>
                  <h3 className="text-2xl font-serif text-[#414942] mb-6">Ваш профиль</h3>
                  <div className="space-y-4">
                      <Input label="Email для входа" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} />
                      <Input type="text" label="Пароль" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} />
                      <div className="bg-[#F9F7F5] p-3 rounded-xl border border-[#AC8A69]/30">
                          <label className="block text-[10px] font-bold text-[#AC8A69] uppercase tracking-wider mb-2">Секретное слово (для восстановления)</label>
                          <div className="flex gap-2 items-center"><Shield size={16} className="text-[#936142]"/><input className="bg-transparent w-full text-[#414942] outline-none" value={profileData.secret} onChange={e => setProfileData({...profileData, secret: e.target.value})} /></div>
                      </div>
                      <Button className="w-full mt-4" onClick={handleUpdateProfile}>Сохранить изменения</Button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
}