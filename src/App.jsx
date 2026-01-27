import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, Plus, Trash2, ChevronLeft, Heart, 
  MapPin, X, ArrowRight, CalendarDays, PieChart, Settings, 
  LogOut, Link as LinkIcon, Edit3, Shield, Printer, 
  Star, Building, Briefcase, CheckSquare, MessageCircle, Loader2,
  ListFilter 
} from 'lucide-react'; 

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, updateDoc, 
  deleteDoc, doc, onSnapshot, query, where, getDocs, getDoc 
} from "firebase/firestore";

import { 
  SITE_URL, APP_TITLE, LOGO_URL, firebaseConfig, APP_ID_DB,
  COLORS, VENDOR_CATEGORIES, INITIAL_EXPENSES, INITIAL_TIMING, 
  TASK_TEMPLATES, INITIAL_FORM_STATE, OUTDOOR_TASKS, OUTDOOR_EXPENSE,
  SUPPORT_CONTACT
} from './constants';

import { 
  formatDate, toInputDate, getDaysUntil, formatCurrency, downloadCSV 
} from './utils';

import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Forms';
import { Logo } from './components/ui/Logo';
import { Footer } from './components/common/Footer';

import { TasksView } from './components/project/TasksView';
import { TimingView } from './components/project/TimingView';
import { BudgetView } from './components/project/BudgetView';
import { GuestsView } from './components/project/GuestsView';
import { NotesView } from './components/project/NotesView';
import { CreateView } from './components/project/CreateView';
import { SettingsModal } from './components/project/SettingsModal';
import { OrganizersView } from './components/admin/OrganizersView';
import { SuperAdminView } from './components/admin/SuperAdminView';
import { VendorsView } from './components/admin/VendorsView';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = APP_ID_DB;

export default function WeddingPlanner() {
  
  const urlParams = new URLSearchParams(window.location.search);
  const linkId = urlParams.get('id');
  
  const [view, setView] = useState(linkId ? 'client_login' : 'login'); 

  const [user, setUser] = useState(null); 
  const [authUser, setAuthUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('active');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [organizersList, setOrganizersList] = useState([]);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  const [sortBy, setSortBy] = useState('date'); 
    
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [newProfilePass, setNewProfilePass] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileSecret, setNewProfileSecret] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ==========================================
  // 1. СНАЧАЛА ОБЪЯВЛЯЕМ ВСЕ ФУНКЦИИ (HANDLERS)
  // ==========================================

  // Навигация
  const openProject = (project) => {
      setCurrentProject(project);
      setView('project');
      setActiveTab('overview');
      setIsEditingProject(false);
      window.history.pushState({ view: 'project' }, '', '?mode=project');
  };

  const openDashboard = () => {
      setView('dashboard');
      window.history.pushState({ view: 'dashboard' }, '', window.location.pathname);
  };

  const openOtherView = (viewName) => {
      setView(viewName);
      if (viewName === 'create') setFormData({...INITIAL_FORM_STATE, clientPassword: Math.floor(1000+Math.random()*9000).toString()});
      window.scrollTo(0,0);
      window.history.pushState({ view: viewName }, '', `?mode=${viewName}`);
  };

  // Логин
  const handleLogin = async (email = loginEmail, pass = loginPass, isAuto = false) => {
    // Если authUser еще нет, инициализируем анонимно (нужно для доступа к базе)
    if (!auth.currentUser) { await signInAnonymously(auth); }
    
    setIsLoginLoading(true);
    try {
        const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const cleanInputEmail = email.toLowerCase().trim();
        const cleanInputPass = String(pass).trim();
        
        const foundUser = users.find(u => (u.email||'').toLowerCase().trim() === cleanInputEmail && String(u.password||'').trim() === cleanInputPass);
        
        if (foundUser) {
            const userData = { ...foundUser, agencyId: foundUser.agencyId || 'legacy_agency' };
            setUser(userData);
            localStorage.setItem('wed_user', JSON.stringify(userData));
            setNewProfileEmail(foundUser.email); setNewProfilePass(foundUser.password); setNewProfileSecret(foundUser.secret || '');
            
            // Если зашли по ссылке - чистим URL
            if (isAuto) {
                window.history.replaceState(null, '', '/');
            }
            setView('dashboard');
        } else { 
            if (!isAuto) alert('Неверный Email или пароль.'); 
        }
    } catch (e) { 
        console.error(e); 
        if (!isAuto) alert("Ошибка: " + e.message); 
    } finally { 
        setIsLoginLoading(false); 
    }
  };

  const handleLogout = () => { localStorage.removeItem('wed_user'); setUser(null); setView('login'); window.history.pushState(null, '', '/'); };

  const handleClientLinkLogin = async () => {
      if (!linkId) { alert("Ошибка ссылки"); return; }
      if (!loginPass) { alert("Введите пароль"); return; }
      setIsLoginLoading(true);
      try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', linkId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (String(data.clientPassword).trim() === String(loginPass).trim()) {
                  const projectData = { id: docSnap.id, ...data };
                  setCurrentProject(projectData);
                  setUser({ id: 'client', role: 'client', projectId: projectData.id, name: 'Гость' });
                  setView('project');
              } else { alert("Неверный пароль от проекта"); }
          } else { alert("Проект не найден. Проверьте ссылку."); }
      } catch (e) { console.error(e); alert("Ошибка доступа или соединения"); } finally { setIsLoginLoading(false); }
  };

  const handleCreateProject = async () => { 
    if (!formData.groomName || !formData.brideName || !formData.date) { alert("Заполните имена и дату"); return; }
    setIsCreating(true);
    try {
        const creationDate = new Date(); const weddingDate = new Date(formData.date);
        let rawTasks = [...TASK_TEMPLATES];
        if (formData.registrationType === 'outdoor' || formData.registrationType === 'both') rawTasks = [...rawTasks, ...OUTDOOR_TASKS];
        let projectTasks = rawTasks.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t.text, deadline: new Date(creationDate.getTime() + (weddingDate - creationDate) * t.pos).toISOString(), done: false })).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
        const projectExpenses = INITIAL_EXPENSES.map(e => ({ ...e }));
        if (formData.registrationType === 'outdoor' || formData.registrationType === 'both') {
            const hostIndex = projectExpenses.findIndex(e => e.name === 'Ведущий + диджей');
            if (hostIndex !== -1) projectExpenses.splice(hostIndex + 1, 0, { ...OUTDOOR_EXPENSE }); else projectExpenses.push({ ...OUTDOOR_EXPENSE });
        }
        const projectTiming = INITIAL_TIMING.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) }));
        let finalOrgId = user.id; let finalOrgName = user.name;
        if (user.role === 'agency_admin' && formData.organizerId && formData.organizerId !== 'owner') { 
            const selectedOrg = organizersList.find(o => o.id === formData.organizerId); 
            if (selectedOrg) { finalOrgId = selectedOrg.id; finalOrgName = selectedOrg.name; } 
        }
        const newProject = { ...formData, clientPassword: formData.clientPassword || Math.floor(1000+Math.random()*9000).toString(), tasks: projectTasks, expenses: projectExpenses, timing: projectTiming, guests: [], notes: '', isArchived: false, organizerName: finalOrgName, organizerId: finalOrgId, agencyId: user.agencyId || 'legacy_agency', createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), newProject);
        setCurrentProject({ id: docRef.id, ...newProject }); 
        
        setView('project'); setActiveTab('overview');
        window.history.pushState({ view: 'project' }, '', '?mode=project');
    } catch (e) { console.error(e); alert("Ошибка создания"); } finally { setIsCreating(false); }
  };

  const updateProject = async (field, value) => { if(!currentProject) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id), { [field]: value }); };
  const deleteProject = async () => { if(window.confirm("Удалить?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id)); setCurrentProject(null); openDashboard(); setIsEditingProject(false); }};
  const toggleArchiveProject = async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id), { isArchived: !currentProject.isArchived }); setIsEditingProject(false); openDashboard(); };
  
  const updateUserProfile = async () => { 
      if (user.email === 'demo@paraplanner.ru') { alert("В демо-режиме изменение профиля заблокировано."); return; }
      if (!newProfileEmail.trim() || !newProfilePass.trim()) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id), { email: newProfileEmail.toLowerCase().trim(), password: newProfilePass.trim(), secret: newProfileSecret.trim() }); const updatedUser = {...user, email: newProfileEmail, password: newProfilePass, secret: newProfileSecret}; setUser(updatedUser); localStorage.setItem('wed_user', JSON.stringify(updatedUser)); alert('Данные обновлены'); setShowProfile(false); 
  };
  
  const handleRecovery = async () => { const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'users')); const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); const foundUser = users.find(u => u.email === recoveryEmail.toLowerCase().trim() && u.secret === recoverySecret.trim()); if (foundUser) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', foundUser.id), { password: recoveryNewPass.trim() }); alert("Пароль изменен!"); setView('login'); } else { alert("Неверные данные"); } };


  // ==========================================
  // 2. ТЕПЕРЬ ЗАПУСКАЕМ ЭФФЕКТЫ (USE EFFECT)
  // ==========================================

  // --- SCROLL MAGIC ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, activeTab]);

  // --- HISTORY MAGIC ---
  useEffect(() => {
    const handlePopState = (event) => {
        if (view === 'project') {
            setView('dashboard');
            setCurrentProject(null);
        } 
        else if (view === 'create' || view === 'manage_organizers' || view === 'vendors_db') {
            setView('dashboard');
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  // --- ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ (АВТОРИЗАЦИЯ + ДЕМО) ---
  useEffect(() => {
    const initApp = async () => {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

        // 1. Проверяем авто-вход (DEMO LINK)
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'demo_login') {
            handleLogin('demo@paraplanner.ru', 'demo123', true);
            return; 
        }

        // 2. Если ссылки нет, проверяем сохраненную сессию
        const savedUser = localStorage.getItem('wed_user');
        if (savedUser && !linkId) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setNewProfileEmail(parsedUser.email || '');
                setNewProfilePass(parsedUser.password || '');
                setNewProfileSecret(parsedUser.secret || '');
                setView('dashboard');
            } catch (e) {
                localStorage.removeItem('wed_user');
            }
        }
    };

    initApp();
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  // 3. Data Sync
  useEffect(() => {
    if (!authUser || !user) return;
    if (user.role === 'client') return;
    if (user.role === 'super_admin') return; 

    let q;
    if (user.agencyId) {
        q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), where('agencyId', '==', user.agencyId));
    } else {
        q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), where('organizerId', '==', user.id)); 
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(allProjects);
    });
    
    if (user.role === 'agency_admin') {
        const orgQ = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('agencyId', '==', user.agencyId), where('role', '==', 'organizer'));
        onSnapshot(orgQ, (snap) => setOrganizersList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => unsubscribe();
  }, [user, authUser, view]);

  // 4. Project Sync
  useEffect(() => {
      if (!currentProject?.id || view !== 'project') return;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
         if (docSnap.exists()) setCurrentProject(prev => ({ ...prev, ...docSnap.data() })); 
      });
      return () => unsubscribe();
  }, [currentProject?.id, view]);


  // --- VIEWS ---
  
  if (view === 'client_login') {
      return (
        <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                <Logo className="h-24 mx-auto mb-6" />
                <h2 className="text-2xl font-serif text-[#414942] mb-2">Добро пожаловать</h2>
                <p className="text-[#AC8A69] mb-8">Введите пароль от вашей свадьбы</p>
                <Input placeholder="Пароль" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleClientLinkLogin()}/>
                <Button className="w-full mt-4" onClick={handleClientLinkLogin} disabled={isLoginLoading}>{isLoginLoading ? 'Вход...' : 'Войти'}</Button>
                <div className="mt-6 flex justify-center"><a href={SUPPORT_CONTACT} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-[#CCBBA9] hover:text-[#936142] transition-colors"><MessageCircle size={14} /> Поддержка</a></div>
            </div>
            <Footer/>
        </div>
      );
  }

  if (view === 'recovery') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4"><h2 className="text-2xl font-bold text-[#414942] mb-4 text-center">Восстановление</h2><Input placeholder="Email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} /><Input placeholder="Секретное слово" value={recoverySecret} onChange={e => setRecoverySecret(e.target.value)} /><Input placeholder="Новый пароль" type="password" value={recoveryNewPass} onChange={e => setRecoveryNewPass(e.target.value)} /><Button className="w-full" onClick={handleRecovery}>Сменить пароль</Button><div className="flex flex-col gap-3 mt-4"><button onClick={() => setView('login')} className="w-full text-center text-sm text-[#AC8A69]">Назад</button><a href={SUPPORT_CONTACT} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs text-[#CCBBA9] hover:text-[#936142] transition-colors"><MessageCircle size={14} />Написать в поддержку</a></div></div><Footer/></div>);
  
  if (view === 'login') return (
    <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
            <div className="text-center mb-6"><Logo className="w-full h-auto mx-auto mb-4" /><p className="text-[#AC8A69]">Система управления свадьбами</p></div>
            
            <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleLogin()}/>
            <Input placeholder="Пароль" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleLogin()}/>
            
            <Button className="w-full" onClick={() => handleLogin()} disabled={isLoginLoading}>
                {isLoginLoading ? <><Loader2 className="animate-spin mr-2" size={18} /> Вход...</> : 'Войти'}
            </Button>
            
            <div className="flex flex-col gap-3 mt-4"><button onClick={() => setView('recovery')} className="w-full text-center text-xs text-[#AC8A69] hover:underline">Забыли пароль?</button><a href={SUPPORT_CONTACT} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs text-[#CCBBA9] hover:text-[#936142] transition-colors"><MessageCircle size={14} />Написать в поддержку</a></div>
        </div>
        <Footer/>
    </div>
  );
  
  if (view === 'create') return <CreateView formData={formData} setFormData={setFormData} handleCreateProject={handleCreateProject} setView={openDashboard} user={user} organizersList={organizersList} />;
  
  if (view === 'manage_organizers') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]"><nav className="p-6 flex items-center gap-4"><button onClick={openDashboard} className="p-2 hover:bg-white rounded-full text-[#AC8A69]"><ChevronLeft/></button><h1 className="text-xl font-bold text-[#414942]">Назад</h1></nav><OrganizersView currentUser={user} db={db} /></div>);
  if (view === 'vendors_db') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]"><nav className="p-6 flex items-center gap-4"><button onClick={openDashboard} className="p-2 hover:bg-white rounded-full text-[#AC8A69]"><ChevronLeft/></button><h1 className="text-xl font-bold text-[#414942]">Назад</h1></nav><VendorsView agencyId={user.agencyId} /></div>);
  
  if (view === 'super_admin' || (view === 'dashboard' && user?.role === 'super_admin')) {
      return <SuperAdminView onLogout={handleLogout} currentUser={user} db={db} />;
  }

  // Сортировка проектов
  const sortedProjects = [...projects]
    .filter(p => dashboardTab === 'active' ? !p.isArchived : p.isArchived)
    .sort((a, b) => {
        if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'organizer') return (a.organizerName || '').localeCompare(b.organizerName || '');
        return 0;
    });

  if (view === 'dashboard') {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#F9F7F5] font-[Montserrat] p-6 md:p-12 print:hidden">
        <div className="max-w-6xl mx-auto w-full flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <Logo className="h-16 md:h-20 -ml-2 md:-ml-3" />
                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => setShowProfile(true)} className="text-[#AC8A69] hover:text-[#936142] flex items-center gap-2">Кабинет: {user?.name} <Edit3 size={14}/></button>
                </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <Button onClick={() => openOtherView('create')}><Plus size={20}/> Новый проект</Button>
                {/* Скрываем кнопки для Демо */}
                {user.email !== 'demo@paraplanner.ru' && user.role === 'organizer' && user.agencyId === 'legacy_agency' && <Button variant="secondary" onClick={() => openOtherView('vendors_db')}><Briefcase size={20}/> База подрядчиков</Button>}
                {user.email !== 'demo@paraplanner.ru' && user.role === 'agency_admin' && <Button variant="secondary" onClick={() => openOtherView('manage_organizers')}><Users size={20}/> Команда</Button>}
                <Button variant="ghost" onClick={handleLogout}><LogOut size={20}/></Button>
            </div>
          </header>
          {showProfile && (
              <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                  <Card className="w-full max-w-md p-6 relative">
                      <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-[#AC8A69]"><X size={20}/></button>
                      <h3 className="font-bold text-[#414942] mb-4 text-xl">Ваш профиль</h3>
                      <div className="space-y-4">
                          <Input label="Email для входа" value={newProfileEmail} onChange={e => setNewProfileEmail(e.target.value)} />
                          <Input label="Пароль" value={newProfilePass} onChange={e => setNewProfilePass(e.target.value)} />
                          <div className="bg-[#F9F7F5] p-3 rounded-xl border border-[#AC8A69]/30">
                              <label className="block text-[10px] font-bold text-[#AC8A69] uppercase tracking-wider mb-2">Секретное слово</label>
                              <div className="flex gap-2 items-center"><Shield size={16} className="text-[#936142]"/><input className="bg-transparent w-full text-[#414942] outline-none" placeholder="Придумайте слово" value={newProfileSecret} onChange={e => setNewProfileSecret(e.target.value)} /></div>
                          </div>
                          <Button onClick={updateUserProfile} className="w-full">Сохранить</Button>
                      </div>
                  </Card>
              </div>
          )}

          {/* ВКЛАДКИ И СОРТИРОВКА */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-[#EBE5E0] mb-8 gap-4">
              <div className="flex gap-4">
                  <button onClick={() => setDashboardTab('active')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'active' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Активные проекты</button>
                  <button onClick={() => setDashboardTab('archived')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'archived' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Архив</button>
              </div>
              <div className="flex items-center gap-2 pb-2">
                    <div className="relative group">
                        <div className="flex items-center gap-1 cursor-pointer text-[#CCBBA9] hover:text-[#936142] transition-colors">
                            <ListFilter size={16} />
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-medium outline-none cursor-pointer appearance-none pr-4"
                            >
                                <option value="date">По дате</option>
                                <option value="organizer">По организатору</option>
                            </select>
                        </div>
                    </div>
              </div>
          </div>

          {sortedProjects.length === 0 ? (
             <div className="py-20 text-center text-[#CCBBA9]"><div className="inline-block p-4 rounded-full bg-[#EBE5E0]/50 mb-4">{dashboardTab === 'active' ? <Heart size={32} /> : <Briefcase size={32} />}</div><p className="text-lg">{dashboardTab === 'active' ? 'Нет активных проектов.' : 'Архив пуст.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProjects.map(p => (
                <div key={p.id} onClick={() => openProject(p)} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer group border border-[#EBE5E0] hover:border-[#AC8A69]/30 relative overflow-hidden active:scale-[0.98]`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Heart size={64} className="text-[#936142] fill-current"/></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3"><p className="text-xs font-bold text-[#AC8A69] uppercase tracking-widest">{formatDate(p.date)}</p></div>
                        <h3 className="text-2xl font-serif text-[#414942] mb-1">{p.groomName} & {p.brideName}</h3>
                        <p className="text-sm text-[#CCBBA9] mb-6">{p.venueName || 'Локация не выбрана'}</p>
                        <div className="flex items-center justify-between mt-8 border-t border-[#F9F7F5] pt-4"><div><p className="text-[10px] text-[#CCBBA9] uppercase">Организатор</p><p className="text-xs text-[#AC8A69] font-bold">{p.organizerName || 'Не назначен'}</p></div><span className="text-[#936142] group-hover:translate-x-1 transition-transform"><ArrowRight size={20}/></span></div>
                    </div>
                </div>
                ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  if (view === 'project' && currentProject) {
    const daysLeft = getDaysUntil(currentProject.date);
    const isClient = user.role === 'client';
    const isDemoUser = user.email === 'demo@paraplanner.ru';

    return (
      <div className="w-full min-h-screen h-auto overflow-visible bg-[#F9F7F5] font-[Montserrat]">
         <div className="hidden print:block text-center text-xl font-bold mb-4 text-[#936142] pt-4">paraplanner.ru</div>
         <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#EBE5E0] print:hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">{!isClient && <button onClick={openDashboard} className="p-2 hover:bg-[#F9F7F5] rounded-full transition-colors text-[#AC8A69]"><ChevronLeft /></button>}<Logo className="h-10 md:h-12" /></div>
                <div className="hidden md:flex gap-1 bg-[#F9F7F5] p-1 rounded-xl">
                    {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm' : 'text-[#CCBBA9] hover:text-[#414942]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block"><p className="font-serif text-[#414942] font-medium text-sm md:text-base">{currentProject.groomName} & {currentProject.brideName}</p><p className="text-[10px] md:text-xs text-[#AC8A69]">{formatDate(currentProject.date)}</p></div>
                    {!isClient && <button onClick={() => setIsEditingProject(!isEditingProject)} className="p-2 text-[#AC8A69] hover:text-[#936142]"><Settings size={20} /></button>}
                    <button onClick={handleLogout} className="p-2 text-[#AC8A69] hover:text-[#936142]"><LogOut size={20} /></button>
                </div>
            </div>
            <div className="md:hidden overflow-x-auto whitespace-nowrap px-4 pb-2 pt-2 scrollbar-hide border-b border-[#EBE5E0] bg-white/50 backdrop-blur-sm print:hidden">
                 {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-block mr-2 ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm ring-1 ring-[#936142]/10' : 'text-[#CCBBA9]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>))}
            </div>
         </nav>
         {isEditingProject && !isClient && (
             <SettingsModal project={currentProject} updateProject={updateProject} onClose={() => setIsEditingProject(false)} toggleArchive={toggleArchiveProject} deleteProject={deleteProject} isDemo={isDemoUser} />
         )}
         <main className="max-w-7xl mx-auto p-4 md:p-12 animate-fadeIn pb-24 print:p-0">
            {activeTab === 'overview' && (
                <div className="space-y-6 md:space-y-8 pb-10">
                    <div className="relative rounded-[2rem] overflow-hidden bg-[#936142] text-white p-8 md:p-12 text-center md:text-left shadow-2xl shadow-[#936142]/30">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div><h1 className="text-3xl md:text-6xl font-serif mb-4">{currentProject.groomName} <span className="text-[#C58970]">&</span> {currentProject.brideName}</h1><div className="flex items-center justify-center md:justify-start gap-4 text-[#EBE5E0]"><MapPin size={18}/><span className="text-base md:text-lg tracking-wide">{currentProject.venueName || 'Локация не выбрана'}</span></div></div>
                            <div className="text-center md:text-right"><div className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">{daysLeft}</div><div className="text-[10px] md:text-sm uppercase tracking-[0.2em] opacity-80 mt-2">Дней до свадьбы</div></div>
                        </div>
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#AC8A69] rounded-full mix-blend-overlay opacity-50 blur-3xl"></div><div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#C58970] rounded-full mix-blend-overlay opacity-50 blur-3xl"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('tasks')}><CheckSquare className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-2xl md:text-3xl font-bold text-[#414942]">{currentProject.tasks.filter(t => !t.done).length}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Активных задач</p></div></Card>
                        <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('budget')}><PieChart className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-lg md:text-xl font-bold text-[#414942]">{Math.round((currentProject.expenses.reduce((a,b)=>a+Number(b.paid),0) / (currentProject.expenses.reduce((a,b)=>a+Number(b.fact),0) || 1)) * 100)}%</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Бюджет оплачен</p></div></Card>
                        <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('guests')}><Users className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-2xl md:text-3xl font-bold text-[#414942]">{currentProject.guests.length}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Гостей</p></div></Card>
                        <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('timing')}><Clock className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-lg md:text-xl font-bold text-[#414942]">{currentProject.timing[0]?.time || '09:00'}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Начало дня</p></div></Card>
                    </div>
                    <div><h3 className="text-lg md:text-xl font-serif text-[#414942] mb-4 md:mb-6">Ближайшие дедлайны</h3><div className="grid gap-3 md:gap-4">{currentProject.tasks.filter(t => !t.done).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3).map(task => (<div key={task.id} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-[#EBE5E0]"><div className="flex items-center gap-4"><div className="w-1.5 md:w-2 h-10 md:h-12 bg-[#C58970] rounded-full"></div><div><p className="font-medium text-sm md:text-base text-[#414942]">{task.text}</p><p className="text-xs md:text-sm text-[#AC8A69]">{formatDate(task.deadline)}</p></div></div><Button variant="ghost" onClick={() => setActiveTab('tasks')} className="p-2"><ArrowRight size={18} md:size={20}/></Button></div>))}</div></div>
                </div>
            )}
            {activeTab === 'tasks' && <TasksView tasks={currentProject.tasks} updateProject={updateProject} formatDate={formatDate} project={currentProject} />}
            {activeTab === 'budget' && <BudgetView expenses={currentProject.expenses} updateProject={updateProject} project={currentProject} />}
            {activeTab === 'guests' && <GuestsView guests={currentProject.guests} updateProject={updateProject} project={currentProject} />}
            {activeTab === 'timing' && <TimingView timing={currentProject.timing} updateProject={updateProject} project={currentProject} />}
            {activeTab === 'notes' && <NotesView notes={currentProject.notes} updateProject={updateProject} />}
         </main>
      </div>
    );
  }
  return null;
}