import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, Users, DollarSign, CheckSquare, 
  Plus, Trash2, Download, ChevronLeft, Heart, 
  MapPin, X, ArrowRight, CalendarDays, 
  PieChart, Settings, LogOut, Lock, User, Crown, Key, Loader2, 
  Users as UsersIcon, Link as LinkIcon, Edit3, Save, XCircle, Shield,
  Briefcase, Search, Filter, Camera, Music, Video, Home, Coffee, Scissors, Star, Building, Printer
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, updateDoc, 
  deleteDoc, doc, onSnapshot, query, where 
} from "firebase/firestore";

// --- CONFIG ---
const APP_TITLE = 'Wed.Control';

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'wed-control-v1';

// --- CONSTANTS ---
const COLORS = { primary: '#936142', secondary: '#AC8A69', accent: '#C58970', neutral: '#CCBBA9', dark: '#414942', white: '#FFFFFF', bg: '#F9F7F5' };

const INITIAL_EXPENSES = [
  { category: 'Декор', name: 'Декор и флористика', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Площадка', name: 'Аренда мебели', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Фотограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Ведущий + диджей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Образ', name: 'Стилист', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Торт', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Прочее', name: 'Непредвиденные расходы', plan: 0, fact: 0, paid: 0, note: '' },
];

const INITIAL_TIMING = [
  { time: '09:00', event: 'Пробуждение' },
  { time: '10:00', event: 'Приезд стилиста' },
  { time: '13:00', event: 'Фотосессия' },
  { time: '16:00', event: 'Сбор гостей' },
  { time: '17:00', event: 'Начало ужина' },
  { time: '23:00', event: 'Окончание' },
];

const TASK_TEMPLATES = [
  { text: 'Определить бюджет свадьбы', pos: 0.00 },
  { text: 'Составить список гостей', pos: 0.01 },
  { text: 'Выбрать площадку', pos: 0.12 },
  { text: 'Выбрать фотографа и видео', pos: 0.22 },
  { text: 'Выбрать ведущего', pos: 0.23 },
  { text: 'Выбрать стилиста', pos: 0.25 },
  { text: 'Декор и флористика', pos: 0.35 },
  { text: 'Торт', pos: 0.70 },
  { text: 'Транспорт', pos: 0.89 },
];

const INITIAL_FORM_STATE = { organizerName: '', organizerId: '', groomName: '', brideName: '', date: '', guestsCount: '', prepLocation: 'home', registrationType: 'official', venueName: '', clientPassword: '' };

// --- UTILS ---
const formatDate = (dateStr) => { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); };
const toInputDate = (dateStr) => { if (!dateStr) return ''; return new Date(dateStr).toISOString().split('T')[0]; };
const getDaysUntil = (dateStr) => { const diff = new Date(dateStr) - new Date(); return Math.ceil(diff / (1000 * 60 * 60 * 24)); };
const formatCurrency = (val) => { if (val === undefined || val === null || val === '') return '0'; return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(val); };
const downloadCSV = (data, filename) => { const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + data.map(e => e.join(";")).join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); };

// --- UI COMPONENTS ---
const Footer = () => (
    <footer className="mt-auto py-8 text-center text-[#CCBBA9] text-xs border-t border-[#EBE5E0] w-full print:hidden">
        <p className="mb-2">© {new Date().getFullYear()} {APP_TITLE}</p>
        <a href="https://paraplanner.ru" target="_blank" rel="noreferrer" className="hover:text-[#936142] transition-colors border-b border-transparent hover:border-[#936142]">paraplanner.ru</a>
    </footer>
);

const Card = ({ children, className = "", onClick }) => ( <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-[#EBE5E0] ${className} ${onClick ? 'cursor-pointer hover:border-[#AC8A69] hover:shadow-md transition-all active:scale-[0.99]' : ''}`}> {children} </div> );
const Button = ({ children, onClick, variant = 'primary', className = "", disabled, ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 select-none";
  const variants = { primary: `bg-[${COLORS.primary}] text-white hover:bg-[#7D5238] shadow-lg`, secondary: `bg-[${COLORS.neutral}]/20 text-[${COLORS.dark}] hover:bg-[${COLORS.neutral}]/30`, outline: `border border-[${COLORS.secondary}] text-[${COLORS.primary}] hover:bg-[${COLORS.secondary}]/5`, ghost: `text-[${COLORS.primary}] hover:bg-[${COLORS.secondary}]/10`, danger: `bg-red-50 text-red-600 hover:bg-red-100` };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`} {...props}>{children}</button>;
};
const Input = ({ label, onKeyDown, ...props }) => ( <div className="mb-4"> {label && <label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">{label}</label>} <input onKeyDown={onKeyDown} className="w-full bg-[#F9F7F5] border-none rounded-xl p-4 text-[#414942] placeholder-[#CCBBA9] focus:ring-2 focus:ring-[#936142]/20 transition-all outline-none" {...props} /> </div> );
const MoneyInput = ({ value, onChange, className }) => { const handleChange = (e) => { const rawValue = e.target.value.replace(/\s/g, ''); if (rawValue === '') onChange(0); else if (!isNaN(rawValue)) onChange(parseInt(rawValue, 10)); }; return <input type="text" className={`${className} outline-none bg-transparent`} value={formatCurrency(value)} onChange={handleChange} placeholder="0" />; };
const AutoHeightTextarea = ({ value, onChange, className, placeholder }) => { const textareaRef = useRef(null); useEffect(() => { if(textareaRef.current){textareaRef.current.style.height='auto';textareaRef.current.style.height=textareaRef.current.scrollHeight+'px'} }, [value]); return <textarea ref={textareaRef} className={`${className} resize-none overflow-hidden block`} value={value} onChange={onChange} rows={1} placeholder={placeholder} />; };
const Checkbox = ({ checked, onChange }) => ( <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors duration-300 flex-shrink-0 print:border-[#414942] ${checked ? `bg-[${COLORS.primary}] border-[${COLORS.primary}] print:bg-[#414942]` : `border-[${COLORS.neutral}] bg-transparent`}`}> {checked && <CheckSquare size={14} color="white" />} </div> );
const DownloadMenu = ({ onSelect }) => { const [isOpen, setIsOpen] = useState(false); return ( <div className="relative print:hidden"> <Button variant="outline" onClick={() => setIsOpen(!isOpen)}><Download size={18} /></Button> {isOpen && (<><div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} /><div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EBE5E0] z-20 w-48 overflow-hidden animate-fadeIn">{['excel', 'csv', 'pdf'].map(type => (<button key={type} onClick={() => { onSelect(type); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium flex items-center gap-3 transition-colors uppercase">{type}</button>))}</div></>)} </div> ); };

// --- VIEWS ---

const OrganizersView = ({ currentUser }) => {
    const [organizers, setOrganizers] = useState([]);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [newOrgPass, setNewOrgPass] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPass, setEditPass] = useState('');

    useEffect(() => { 
        if (!currentUser?.agencyId) return; 
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('agencyId', '==', currentUser.agencyId), where('role', '==', 'organizer'));
        const unsubscribe = onSnapshot(q, (snapshot) => { setOrganizers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); 
    }, [currentUser]);

    const addOrganizer = async () => { if (!newOrgName.trim()) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), { name: newOrgName, email: newOrgEmail.toLowerCase().trim(), password: newOrgPass, role: 'organizer', agencyId: currentUser.agencyId, createdAt: new Date().toISOString() }); setNewOrgName(''); setNewOrgEmail(''); setNewOrgPass(''); };
    const deleteOrganizer = async (id) => { if (window.confirm("Удалить?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id)); } };
    const startEditing = (org) => { setEditingId(org.id); setEditName(org.name); setEditEmail(org.email); setEditPass(org.password); };
    const cancelEditing = () => { setEditingId(null); setEditName(''); setEditEmail(''); setEditPass(''); };
    const saveOrganizer = async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', editingId), { name: editName, email: editEmail.toLowerCase().trim(), password: editPass }); setEditingId(null); };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#414942] mb-8">Команда</h2>
            <Card className="p-6 mb-8 bg-white/80 border-[#936142]/20"><h3 className="font-bold text-[#936142] mb-4">Добавить сотрудника</h3><div className="grid gap-4 md:grid-cols-3"><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Имя" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Email" value={newOrgEmail} onChange={e => setNewOrgEmail(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Пароль" value={newOrgPass} onChange={e => setNewOrgPass(e.target.value)} /></div><Button onClick={addOrganizer} className="mt-4 w-full md:w-auto">Добавить</Button></Card>
            <div className="grid gap-4">{organizers.map(org => (<div key={org.id} className="bg-white p-4 rounded-xl shadow-sm">{editingId === org.id ? (<div className="flex gap-2 w-full"><input className="bg-[#F9F7F5] border rounded-lg p-2 flex-1" value={editName} onChange={e => setEditName(e.target.value)} /><button onClick={saveOrganizer}><Save size={18}/></button><button onClick={cancelEditing}><XCircle size={18}/></button></div>) : (<div className="flex justify-between items-center w-full"><div><p className="font-bold text-[#414942]">{org.name}</p><p className="text-xs text-[#AC8A69]">{org.email}</p></div><div className="flex gap-2"><button onClick={() => startEditing(org)} className="text-[#AC8A69]"><Edit3 size={18}/></button><button onClick={() => deleteOrganizer(org.id)} className="text-red-300"><Trash2 size={18}/></button></div></div>)}</div>))}</div>
        </div>
    );
};

const SuperAdminView = () => {
    const [agencies, setAgencies] = useState([]);
    const [newAgencyName, setNewAgencyName] = useState('');
    const [newAgencyEmail, setNewAgencyEmail] = useState('');
    const [newAgencyPass, setNewAgencyPass] = useState('');
    
    useEffect(() => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('role', '==', 'agency_admin'));
        const unsubscribe = onSnapshot(q, (snapshot) => { setAgencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
        return () => unsubscribe();
    }, []);

    const createAgency = async () => {
        if (!newAgencyName) return;
        const agencyId = Math.random().toString(36).substr(2, 9);
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), { name: newAgencyName, email: newAgencyEmail.toLowerCase().trim(), password: newAgencyPass, role: 'agency_admin', agencyId: agencyId, createdAt: new Date().toISOString() });
        setNewAgencyName(''); setNewAgencyEmail(''); setNewAgencyPass(''); alert(`Агентство создано!`);
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#414942] mb-8">Управление Агентствами (Super Admin)</h2>
            <Card className="p-6 mb-8 bg-white border-[#936142]/20"><h3 className="font-bold text-[#936142] mb-4">Создать новое агентство</h3><div className="grid gap-4 md:grid-cols-3"><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Название" value={newAgencyName} onChange={e => setNewAgencyName(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Email" value={newAgencyEmail} onChange={e => setNewAgencyEmail(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Пароль" value={newAgencyPass} onChange={e => setNewAgencyPass(e.target.value)} /></div><Button onClick={createAgency} className="mt-4 w-full md:w-auto">Создать</Button></Card>
            <div className="space-y-4">{agencies.map(a => (<div key={a.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#EBE5E0] flex justify-between items-center"><div><p className="font-bold text-[#414942]">{a.name}</p><p className="text-xs text-[#AC8A69]">{a.email}</p></div><div className="px-3 py-1 bg-[#F9F7F5] rounded-lg text-xs font-bold text-[#936142]">ID: {a.agencyId}</div></div>))}</div>
        </div>
    );
};

const TasksView = ({ tasks, updateProject, formatDate }) => {
  const sortTasks = (taskList) => [...taskList].sort((a, b) => { if (a.done !== b.done) return a.done ? 1 : -1; return new Date(a.deadline) - new Date(b.deadline); });
  const updateTask = (id, field, value) => { const newTasks = tasks.map(t => t.id === id ? { ...t, [field]: value } : t); updateProject('tasks', field === 'done' ? sortTasks(newTasks) : newTasks); };
  const addTask = () => { const newTask = { id: Math.random().toString(36).substr(2, 9), text: 'Новая задача', deadline: new Date().toISOString(), done: false }; updateProject('tasks', sortTasks([...tasks, newTask])); };
  const deleteTask = (id) => updateProject('tasks', tasks.filter(t => t.id !== id));
  return ( <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden"><h2 className="text-2xl font-serif text-[#414942]">Список задач</h2><div className="flex gap-2 w-full md:w-auto"><Button variant="primary" onClick={addTask} className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button></div></div><div className="grid gap-4">{tasks.map((task) => (<div key={task.id} className={`group flex flex-col md:flex-row md:items-start p-4 bg-white rounded-xl border transition-all hover:shadow-md gap-4 print:shadow-none print:border-b print:border-t-0 print:border-x-0 print:rounded-none print:p-2 ${task.done ? 'opacity-50 border-transparent' : 'border-[#EBE5E0]'}`}><div className="flex items-start flex-1 gap-4 pt-1"><Checkbox checked={task.done} onChange={(checked) => updateTask(task.id, 'done', checked)} /><div className="flex-1 min-w-0"><textarea className={`w-full font-medium text-base md:text-lg bg-transparent outline-none resize-none overflow-hidden h-auto ${task.done ? 'line-through text-[#CCBBA9]' : 'text-[#414942]'}`} value={task.text} rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onChange={(e) => updateTask(task.id, 'text', e.target.value)} /></div></div><div className="flex items-center justify-between md:justify-end gap-4 pl-10 md:pl-0 w-full md:w-auto pt-1"><div className="flex items-center gap-2 text-[#AC8A69] bg-[#F9F7F5] px-3 py-1.5 rounded-lg w-full md:w-[160px] print:bg-transparent print:p-0 print:w-auto"><CalendarDays size={14} className="print:hidden"/><input type="date" className={`bg-transparent outline-none text-sm w-full cursor-pointer print:text-right ${new Date(task.deadline) < new Date() && !task.done ? 'text-red-400 font-bold' : ''}`} value={toInputDate(task.deadline)} onChange={(e) => updateTask(task.id, 'deadline', e.target.value ? new Date(e.target.value).toISOString() : task.deadline)} /></div><button onClick={() => deleteTask(task.id)} className="text-[#CCBBA9] hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 print:hidden"><Trash2 size={18} /></button></div></div>))}</div></div> );
};

const BudgetView = ({ expenses, updateProject, downloadCSV }) => {
  const totals = expenses.reduce((acc, item) => ({ plan: acc.plan + Number(item.plan), fact: acc.fact + Number(item.fact), paid: acc.paid + Number(item.paid) }), { plan: 0, fact: 0, paid: 0 });
  const updateExpense = (index, field, val) => { const newExpenses = [...expenses]; newExpenses[index][field] = val; updateProject('expenses', newExpenses); };
  const addExpense = () => updateProject('expenses', [...expenses, { category: 'Новое', name: 'Новая статья', plan: 0, fact: 0, paid: 0, note: '' }]);
  const removeExpense = (index) => { const newExpenses = [...expenses]; newExpenses.splice(index, 1); updateProject('expenses', newExpenses); };
  return ( <div className="animate-fadeIn pb-24 md:pb-0"><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">{['План', 'Факт', 'Внесено', 'Остаток'].map((label, i) => (<Card key={label} className={`p-4 md:p-6 text-center ${i===3 ? 'bg-[#414942] text-white' : ''}`}><p className={`${i===3 ? 'text-white/60' : 'text-[#AC8A69]'} text-[10px] md:text-xs uppercase tracking-widest mb-2`}>{label}</p><p className={`text-lg md:text-2xl font-medium ${i===3 ? 'text-white' : i===2 ? 'text-[#936142]' : 'text-[#414942]'}`}>{formatCurrency(i===0?totals.plan:i===1?totals.fact:i===2?totals.paid:totals.fact-totals.paid)}</p></Card>))}</div><div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden print:shadow-none print:border-none"><div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0"><thead><tr className="bg-[#F9F7F5] text-[#936142] text-xs md:text-sm uppercase tracking-wider print:bg-transparent print:border-b print:border-[#414942]"><th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Статья</th><th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">План</th><th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Факт</th><th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Внесено</th><th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Остаток</th><th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Комментарии</th><th className="p-2 md:p-4 font-semibold w-10 print:hidden"></th></tr></thead><tbody className="divide-y divide-[#EBE5E0] print:divide-[#CCBBA9]">{expenses.map((item, idx) => (<tr key={idx} className="hover:bg-[#F9F7F5]/50 group print:break-inside-avoid"><td className="p-2 md:p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none font-medium text-[#414942] text-sm md:text-base whitespace-normal min-h-[1.5rem]" value={item.name} onChange={(e) => updateExpense(idx, 'name', e.target.value)} /></td><td className="p-2 md:p-4 align-top"><MoneyInput value={item.plan} onChange={(val) => updateExpense(idx, 'plan', val)} className="w-full text-[#414942] text-sm md:text-base" /></td><td className="p-2 md:p-4 align-top"><MoneyInput value={item.fact} onChange={(val) => updateExpense(idx, 'fact', val)} className="w-full text-[#414942] text-sm md:text-base" /></td><td className="p-2 md:p-4 align-top"><MoneyInput value={item.paid} onChange={(val) => updateExpense(idx, 'paid', val)} className="w-full text-[#414942] text-sm md:text-base" /></td><td className="p-2 md:p-4 align-top text-[#AC8A69] text-sm md:text-base">{formatCurrency(item.fact - item.paid)}</td><td className="p-2 md:p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none text-xs text-[#AC8A69] placeholder-[#CCBBA9] min-h-[1.5rem]" placeholder="..." value={item.note || ''} onChange={(e) => updateExpense(idx, 'note', e.target.value)} /></td><td className="p-2 md:p-4 align-top print:hidden"><button onClick={() => removeExpense(idx)} className="text-red-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div></div><div className="flex items-center gap-2 mt-6 print:hidden"><Button onClick={addExpense} variant="primary"><Plus size={18}/> Добавить статью</Button></div></div> );
};

const GuestsView = ({ guests, updateProject }) => {
  const addGuest = () => updateProject('guests', [...guests, { id: Date.now(), name: '', comment: '', seatingName: '', table: '', food: '', drinks: '', transfer: false }]);
  const updateGuest = (id, field, val) => updateProject('guests', guests.map(g => g.id === id ? { ...g, [field]: val } : g));
  const removeGuest = (id) => updateProject('guests', guests.filter(g => g.id !== id));
  return ( <div className="animate-fadeIn pb-24 md:pb-0"><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden"><div className="flex items-baseline gap-4"><h2 className="text-2xl font-serif text-[#414942]">Список гостей</h2><span className="text-[#AC8A69] font-medium">{guests.length} персон</span></div><div className="flex gap-2 w-full md:w-auto"><Button onClick={addGuest} variant="primary" className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button></div></div><div className="grid gap-4 print:hidden">{guests.map((guest, idx) => (<Card key={guest.id} className="p-6 transition-all hover:shadow-md"><div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"><div className="flex items-center justify-between w-full md:w-auto md:col-span-1 md:justify-center md:h-full"><span className="w-8 h-8 rounded-full bg-[#CCBBA9]/30 text-[#936142] flex items-center justify-center font-bold text-sm">{idx + 1}</span><button onClick={() => removeGuest(guest.id)} className="md:hidden text-[#CCBBA9] hover:text-red-400 transition-colors"><Trash2 size={18}/></button></div><div className="w-full md:col-span-3"><label className="text-[10px] uppercase text-[#CCBBA9] font-bold">ФИО</label><input className="w-full text-lg font-medium text-[#414942] bg-transparent border-b border-transparent focus:border-[#AC8A69] outline-none" placeholder="Имя гостя" value={guest.name} onChange={(e) => updateGuest(guest.id, 'name', e.target.value)} /></div><div className="w-1/2 md:w-full md:col-span-2"><label className="text-[10px] uppercase text-[#CCBBA9] font-bold">Стол №</label><input className="w-full bg-transparent border-b border-[#EBE5E0] focus:border-[#AC8A69] outline-none py-1" value={guest.table} onChange={(e) => updateGuest(guest.id, 'table', e.target.value)} /></div><div className="w-full md:col-span-3"><label className="text-[10px] uppercase text-[#CCBBA9] font-bold">Пожелания</label><input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1 mb-1" placeholder="Еда..." value={guest.food} onChange={(e) => updateGuest(guest.id, 'food', e.target.value)} /><input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1" placeholder="Напитки..." value={guest.drinks} onChange={(e) => updateGuest(guest.id, 'drinks', e.target.value)} /></div><div className="w-full md:col-span-2 flex items-center gap-2 pt-4"><label className="flex items-center cursor-pointer select-none"><div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${guest.transfer ? 'bg-[#936142] border-[#936142]' : 'border-[#CCBBA9]'}`}>{guest.transfer && <CheckSquare size={12} color="white"/>}</div><input type="checkbox" className="hidden" checked={guest.transfer} onChange={(e) => updateGuest(guest.id, 'transfer', e.target.checked)} /><span className="text-sm text-[#414942]">Трансфер</span></label></div><div className="hidden md:flex md:col-span-1 justify-end pt-4"><button onClick={() => removeGuest(guest.id)} className="text-[#CCBBA9] hover:text-red-400 transition-colors"><Trash2 size={18}/></button></div></div></Card>))}</div></div> );
};

const TimingView = ({ timing, updateProject }) => {
  const sortTiming = (list) => [...list].sort((a, b) => a.time.localeCompare(b.time));
  const updateTimingItem = (id, field, value) => { const newTiming = timing.map(t => t.id === id ? { ...t, [field]: value } : t); updateProject('timing', newTiming); };
  const removeTimingItem = (id) => updateProject('timing', timing.filter(t => t.id !== id));
  const addTimingItem = () => { const newItem = { id: Math.random().toString(36).substr(2, 9), time: '00:00', event: 'Новый этап' }; updateProject('timing', sortTiming([...timing, newItem])); };
  return ( <div className="animate-fadeIn max-w-2xl mx-auto pb-24 md:pb-0"><div className="hidden print:block mb-8"><h1 className="text-3xl font-serif text-[#414942] mb-2">Тайминг дня</h1></div><div className="relative border-l border-[#EBE5E0] ml-4 md:ml-6 space-y-6 print:border-none print:ml-0 print:space-y-2">{timing.map((item) => (<div key={item.id} className="relative pl-6 group print:pl-0 print:border-b print:pb-2 print:border-[#EBE5E0]"><div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#AC8A69] transition-all group-hover:scale-125 group-hover:border-[#936142] print:hidden"></div><div className="flex items-baseline gap-4"><input className="w-14 md:w-16 text-base md:text-lg font-bold text-[#936142] bg-transparent outline-none text-right font-mono print:text-left print:w-20" value={item.time} onChange={(e) => updateTimingItem(item.id, 'time', e.target.value)} /><input className="flex-1 text-sm md:text-base text-[#414942] bg-transparent outline-none border-b border-transparent focus:border-[#AC8A69] pb-1 transition-colors" value={item.event} onChange={(e) => updateTimingItem(item.id, 'event', e.target.value)} /><button onClick={() => removeTimingItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[#CCBBA9] hover:text-red-400 p-1 print:hidden"><X size={14}/></button></div></div>))}<div className="relative pl-6 pt-2 print:hidden"><button onClick={addTimingItem} className="flex items-center gap-2 text-[#AC8A69] hover:text-[#936142] text-xs font-medium transition-colors"><div className="w-4 h-4 rounded-full border border-current flex items-center justify-center"><Plus size={10}/></div>Добавить этап</button></div></div></div> );
};

const NotesView = ({ notes, updateProject }) => (
  <div className="h-full flex flex-col animate-fadeIn pb-24 md:pb-0">
      <textarea className="flex-1 w-full bg-white p-8 rounded-2xl shadow-sm border border-[#EBE5E0] text-[#414942] leading-relaxed resize-none focus:ring-2 focus:ring-[#936142]/10 outline-none min-h-[50vh] print:shadow-none print:border-none print:p-0" placeholder="Место для важных мыслей, черновиков клятв и идей..." value={notes} onChange={(e) => updateProject('notes', e.target.value)} />
  </div>
);

// --- MAIN COMPONENT ---

export default function WeddingPlanner() {
  const [user, setUser] = useState(null); 
  const [authUser, setAuthUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('active');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showExportMenu, setShowExportMenu] = useState(false);
   
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [newProfilePass, setNewProfilePass] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileSecret, setNewProfileSecret] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');

  useEffect(() => {
    const initAuth = async () => {
        await signInAnonymously(auth);
        const savedUser = localStorage.getItem('wed_user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setNewProfileEmail(parsedUser.email);
                setNewProfilePass(parsedUser.password);
                setNewProfileSecret(parsedUser.secret || '');
                setView('dashboard');
            } catch (e) {
                localStorage.removeItem('wed_user');
            }
        }
    };
    initAuth();
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  // 1. Initial Owner Creation (Check if ANY super_admin exists)
  useEffect(() => {
      if (!authUser) return;
      const initOwner = async () => {
          const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('role', '==', 'super_admin')), (snapshot) => {
              if (snapshot.empty) {
                  // Create the FIRST Super Admin (You)
                  addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), {
                      email: 'owner@wed.control', // Your Login
                      password: 'admin',          // Your Password
                      name: 'Владелец Платформы',
                      role: 'super_admin',
                      agencyId: 'super_admin_id',
                      secret: 'secret'
                  });
              }
              unsub(); 
          });
      };
      initOwner();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !user) return;
    const urlParams = new URLSearchParams(window.location.search);
    const projectIdFromUrl = urlParams.get('id');

    // SAFE QUERY: If user is super_admin, fetch ALL. If agency_admin, fetch theirs. 
    // IF user has NO agencyId (legacy), we fetch projects with NO agencyId OR create a default 'legacy' bucket.
    // To fix white screen: We DO NOT filter by agencyId if the user doesn't have one.
    
    let q;
    if (user.role === 'super_admin') {
        q = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    } else if (user.agencyId) {
        q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), where('agencyId', '==', user.agencyId));
    } else if (user.role === 'client') {
        q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), where('id', '==', user.projectId));
    } else {
        // Fallback for legacy users (display all or filter by organizerId if possible, but for now allow all to prevent lock out)
        q = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    }

    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (projectIdFromUrl && !user && view !== 'client_login') {
          const targetProject = allProjects.find(p => p.id === projectIdFromUrl);
          if (targetProject) {
              setCurrentProject(targetProject);
              setView('client_login');
          }
      }
      setProjects(allProjects);
    });

    return () => unsubscribeProjects();
  }, [user, authUser, view]);

  useEffect(() => {
      if (!currentProject?.id || view !== 'project') return;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
         if (docSnap.exists()) setCurrentProject(prev => ({ ...prev, ...docSnap.data() })); 
      });
      return () => unsubscribe();
  }, [currentProject?.id, view]);

  const handleLogin = async () => {
    if (!authUser) { alert("Соединение..."); return; }
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const foundUser = users.find(u => u.email === loginEmail.toLowerCase().trim() && u.password === loginPass.trim());
        if (foundUser) {
            const userData = { 
                id: foundUser.id, 
                role: foundUser.role || 'agency_admin', // Default to agency_admin if legacy
                name: foundUser.name, 
                email: foundUser.email, 
                password: foundUser.password, 
                secret: foundUser.secret, 
                agencyId: foundUser.agencyId || 'legacy_agency' // Default ID if missing
            };
            setUser(userData);
            localStorage.setItem('wed_user', JSON.stringify(userData));
            setNewProfileEmail(foundUser.email); setNewProfilePass(foundUser.password); setNewProfileSecret(foundUser.secret || '');
            setView('dashboard');
            unsubscribe();
        } else { alert('Неверный Email или пароль'); unsubscribe(); }
    });
  };

  const handleLogout = () => { localStorage.removeItem('wed_user'); setUser(null); setView('login'); setLoginEmail(''); setLoginPass(''); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  const handleRecovery = async () => {
      if (!recoveryEmail || !recoverySecret || !recoveryNewPass) { alert("Заполните все поля"); return; }
      const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), async (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const foundUser = users.find(u => u.email === recoveryEmail.toLowerCase().trim() && u.secret === recoverySecret.trim());
          if (foundUser) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', foundUser.id), { password: recoveryNewPass.trim() });
              alert("Пароль успешно изменен!"); setView('login'); unsubscribe();
          } else { alert("Неверная почта или секретное слово"); unsubscribe(); }
      });
  };

  const handleClientLinkLogin = () => {
      if (currentProject && currentProject.clientPassword === loginPass.trim()) {
          setUser({ id: 'client', role: 'client', projectId: currentProject.id, name: 'Клиент' });
          setView('project'); setActiveTab('overview');
      } else { alert('Неверный пароль доступа'); }
  };

  const updateUserProfile = async () => {
      if (!newProfileEmail.trim() || !newProfilePass.trim()) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.id), { email: newProfileEmail.toLowerCase().trim(), password: newProfilePass.trim(), secret: newProfileSecret.trim() });
      const updatedUser = {...user, email: newProfileEmail, password: newProfilePass, secret: newProfileSecret};
      setUser(updatedUser); localStorage.setItem('wed_user', JSON.stringify(updatedUser)); alert('Данные обновлены'); setShowProfile(false);
  };

  const handleCreateProject = async () => {
    if (!formData.groomName || !formData.brideName || !formData.date) { alert("Заполните имена и дату"); return; }
    setIsCreating(true);
    try {
        const creationDate = new Date(); const weddingDate = new Date(formData.date);
        let projectTasks = TASK_TEMPLATES.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t.text, deadline: new Date(creationDate.getTime() + (weddingDate - creationDate) * t.pos).toISOString(), done: false })).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
        let projectExpenses = [...INITIAL_EXPENSES];
        
        const newProject = { 
            ...formData, 
            clientPassword: formData.clientPassword || Math.floor(1000+Math.random()*9000).toString(), 
            tasks: projectTasks, 
            expenses: projectExpenses, 
            timing: INITIAL_TIMING.map(t=>({...t, id: Math.random().toString(36).substr(2,9)})), 
            guests: [], notes: '', isArchived: false, 
            organizerName: user.name, 
            agencyId: user.agencyId, // Safe agency assignment
            createdAt: new Date().toISOString() 
        };
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), newProject);
        setCurrentProject({ id: docRef.id, ...newProject }); setView('project'); setActiveTab('overview');
    } catch (e) { console.error(e); alert("Ошибка"); } finally { setIsCreating(false); }
  };

  const updateProject = async (field, value) => { if(!currentProject) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id), { [field]: value }); };
  const deleteProject = async () => { if(window.confirm("Удалить?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id)); setCurrentProject(null); setView('dashboard'); setIsEditingProject(false); }};
  const toggleArchiveProject = async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', currentProject.id), { isArchived: !currentProject.isArchived }); setIsEditingProject(false); setView('dashboard'); };

  // --- EXPORT HELPERS ---
  const handleProjectExport = (type) => {
      if (!currentProject) return;
      if (type === 'budget') {
          const totals = currentProject.expenses.reduce((acc, item) => ({ plan: acc.plan + Number(item.plan), fact: acc.fact + Number(item.fact), paid: acc.paid + Number(item.paid) }), { plan: 0, fact: 0, paid: 0 });
          downloadCSV([["Наименование", "План", "Факт", "Внесено", "Остаток", "Комментарий"], ...currentProject.expenses.map(e => [e.name, e.plan, e.fact, e.paid, e.fact - e.paid, e.note || '']), ["ИТОГО", totals.plan, totals.fact, totals.paid, totals.fact - totals.paid, ""]], "budget.csv");
      } else if (type === 'guests') {
          downloadCSV([["ФИО", "Рассадка", "Стол", "Еда", "Напитки", "Трансфер", "Комментарий"], ...currentProject.guests.map(g => [g.name, g.seatingName, g.table, g.food, g.drinks, g.transfer ? "Да" : "Нет", g.comment])], "guests.csv");
      } else if (type === 'pdf') {
          window.print();
      }
      setShowExportMenu(false);
  };

  // --- VIEWS ---
  if (view === 'client_login') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center"><Heart size={48} className="text-[#936142] mx-auto mb-6" /><h2 className="text-2xl font-serif text-[#414942] mb-2">{currentProject?.groomName} & {currentProject?.brideName}</h2><p className="text-[#AC8A69] mb-8">Введите пароль для доступа</p><Input placeholder="Пароль" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} /><Button className="w-full" onClick={handleClientLinkLogin}>Войти</Button></div><Footer/></div>);
  if (view === 'recovery') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4"><h2 className="text-2xl font-bold text-[#414942] mb-4 text-center">Восстановление</h2><Input placeholder="Email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} /><Input placeholder="Секретное слово" value={recoverySecret} onChange={e => setRecoverySecret(e.target.value)} /><Input placeholder="Новый пароль" type="password" value={recoveryNewPass} onChange={e => setRecoveryNewPass(e.target.value)} /><Button className="w-full" onClick={handleRecovery}>Сменить пароль</Button><button onClick={() => setView('login')} className="w-full text-center text-sm text-[#AC8A69] mt-4">Назад ко входу</button></div><Footer/></div>);
  if (view === 'login') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6"><div className="mb-8 text-center"><h1 className="text-4xl font-bold text-[#414942] tracking-tight mb-2">{APP_TITLE}</h1><p className="text-[#AC8A69]">Система управления свадьбами</p></div><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4"><Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={handleKeyDown}/><Input placeholder="Пароль" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={handleKeyDown}/><Button className="w-full" onClick={handleLogin}>Войти</Button><button onClick={() => setView('recovery')} className="w-full text-center text-xs text-[#AC8A69] hover:underline mt-4 block">Забыли пароль?</button></div><Footer/></div>);
  
  if (view === 'manage_organizers') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]"><nav className="p-6 flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full text-[#AC8A69]"><ChevronLeft/></button><h1 className="text-xl font-bold text-[#414942]">Назад</h1></nav><OrganizersView currentUser={user} /></div>);
  if (view === 'vendors_db') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]"><nav className="p-6 flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full text-[#AC8A69]"><ChevronLeft/></button><h1 className="text-xl font-bold text-[#414942]">Назад</h1></nav><VendorsView agencyId={user.agencyId} /></div>);
  if (view === 'super_admin') return (<div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]"><nav className="p-6 flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full text-[#AC8A69]"><ChevronLeft/></button><h1 className="text-xl font-bold text-[#414942]">Назад</h1></nav><SuperAdminView currentUser={user} /></div>);

  const sortedProjects = [...projects].filter(p => dashboardTab === 'active' ? !p.isArchived : p.isArchived).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (view === 'dashboard') {
    return (
      <div className="w-full min-h-screen flex flex-col bg-[#F9F7F5] font-[Montserrat] p-6 md:p-12 print:hidden">
        <div className="max-w-6xl mx-auto w-full flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#414942] tracking-tight">{APP_TITLE}</h1>
                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => setShowProfile(true)} className="text-[#AC8A69] hover:text-[#936142] flex items-center gap-2">Кабинет: {user?.name} <Edit3 size={14}/></button>
                    {user.role === 'super_admin' && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">SUPER ADMIN</span>}
                </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <Button onClick={() => { setFormData({...INITIAL_FORM_STATE, clientPassword: Math.floor(1000+Math.random()*9000).toString()}); setView('create'); window.scrollTo(0,0); }}><Plus size={20}/> Новый проект</Button>
                {user.role === 'agency_admin' && <Button variant="secondary" onClick={() => setView('vendors_db')}><Briefcase size={20}/> База подрядчиков</Button>}
                {user.role === 'agency_admin' && <Button variant="secondary" onClick={() => setView('manage_organizers')}><UsersIcon size={20}/> Команда</Button>}
                {user.role === 'super_admin' && <Button variant="secondary" className="bg-[#414942] text-white hover:bg-[#2C332D]" onClick={() => setView('super_admin')}><Building size={20}/> Агентства</Button>}
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
                              <label className="block text-[10px] font-bold text-[#AC8A69] uppercase tracking-wider mb-2">Секретное слово (для сброса пароля)</label>
                              <div className="flex gap-2 items-center"><Shield size={16} className="text-[#936142]"/><input className="bg-transparent w-full text-[#414942] outline-none" placeholder="Придумайте слово" value={newProfileSecret} onChange={e => setNewProfileSecret(e.target.value)} /></div>
                          </div>
                          <Button onClick={updateUserProfile} className="w-full">Сохранить изменения</Button>
                      </div>
                  </Card>
              </div>
          )}

          <div className="flex gap-4 mb-8 border-b border-[#EBE5E0]">
              <button onClick={() => setDashboardTab('active')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'active' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Активные проекты</button>
              <button onClick={() => setDashboardTab('archived')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'archived' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Архив</button>
          </div>
          {sortedProjects.length === 0 ? (
             <div className="py-20 text-center text-[#CCBBA9]"><div className="inline-block p-4 rounded-full bg-[#EBE5E0]/50 mb-4">{dashboardTab === 'active' ? <Heart size={32} /> : <Archive size={32} />}</div><p className="text-lg">{dashboardTab === 'active' ? 'Нет активных проектов.' : 'Архив пуст.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProjects.map(p => (
                <div key={p.id} onClick={() => { setCurrentProject(p); setView('project'); setActiveTab('overview'); setIsEditingProject(false); }} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer group border border-[#EBE5E0] hover:border-[#AC8A69]/30 relative overflow-hidden active:scale-[0.98]`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Heart size={64} className="text-[#936142] fill-current"/></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3"><p className="text-xs font-bold text-[#AC8A69] uppercase tracking-widest">{formatDate(p.date)}</p></div>
                        <h3 className="text-2xl font-serif text-[#414942] mb-1">{p.groomName} & {p.brideName}</h3>
                        <p className="text-[#CCBBA9] text-sm mb-6">{p.venueName || 'Локация не выбрана'}</p>
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
    return (
      <div className="w-full min-h-screen h-auto overflow-visible bg-[#F9F7F5] font-[Montserrat]">
         <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#EBE5E0] print:hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">{user.role !== 'client' && <button onClick={() => setView('dashboard')} className="p-2 hover:bg-[#F9F7F5] rounded-full transition-colors text-[#AC8A69]"><ChevronLeft /></button>}<span className="text-lg md:text-xl font-bold text-[#936142] tracking-tight whitespace-nowrap">{APP_TITLE}</span></div>
                <div className="hidden md:flex gap-1 bg-[#F9F7F5] p-1 rounded-xl">
                    {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm' : 'text-[#CCBBA9] hover:text-[#414942]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block"><p className="font-serif text-[#414942] font-medium text-sm md:text-base">{currentProject.groomName} & {currentProject.brideName}</p><p className="text-[10px] md:text-xs text-[#AC8A69]">{formatDate(currentProject.date)}</p></div>
                    {user.role !== 'client' && (
                        <>
                            <div className="relative">
                                <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 text-[#AC8A69] hover:text-[#936142]"><Printer size={20} /></button>
                                {showExportMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EBE5E0] z-20 w-48 overflow-hidden animate-fadeIn">
                                            <button onClick={() => handleProjectExport('budget')} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium transition-colors">Скачать смету (Excel)</button>
                                            <button onClick={() => handleProjectExport('guests')} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium transition-colors">Скачать гостей (Excel)</button>
                                            <button onClick={() => handleProjectExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium transition-colors border-t border-[#EBE5E0]">Сохранить как PDF</button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button onClick={() => setIsEditingProject(!isEditingProject)} className="p-2 text-[#AC8A69] hover:text-[#936142]"><Settings size={20} /></button>
                        </>
                    )}
                    <button onClick={handleLogout} className="p-2 text-[#AC8A69] hover:text-[#936142]"><LogOut size={20} /></button>
                </div>
            </div>
            <div className="md:hidden overflow-x-auto whitespace-nowrap px-4 pb-2 pt-2 scrollbar-hide border-b border-[#EBE5E0] bg-white/50 backdrop-blur-sm print:hidden">
                 {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-block mr-2 ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm ring-1 ring-[#936142]/10' : 'text-[#CCBBA9]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>))}
            </div>
         </nav>

         {isEditingProject && user.role !== 'client' && (
             <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl relative animate-slideUp flex flex-col max-h-[90vh]">
                     <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center shrink-0"><h2 className="text-xl font-bold text-[#414942]">Настройки</h2><button onClick={() => setIsEditingProject(false)} className="text-[#AC8A69] hover:text-[#936142] p-1"><X size={24}/></button></div>
                     <div className="p-6 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="bg-[#F9F7F5] p-4 rounded-xl mb-4 border border-[#AC8A69]/20">
                                <p className="text-[10px] text-[#AC8A69] uppercase font-bold mb-2">Доступ для клиента</p>
                                <div className="flex gap-2 mb-2 items-center">
                                    <input className="flex-1 bg-white border border-[#EBE5E0] rounded-lg p-2 text-sm text-[#AC8A69] overflow-hidden text-ellipsis" value={`${SITE_URL}/?id=${currentProject.id}`} readOnly />
                                    <button onClick={() => { navigator.clipboard.writeText(`${SITE_URL}/?id=${currentProject.id}`); alert('Ссылка скопирована!'); }} className="bg-[#936142] text-white p-2 rounded-lg hover:bg-[#7D5238] transition-colors"><LinkIcon size={16}/></button>
                                </div>
                                <Input label="Пароль клиента" value={currentProject.clientPassword} onChange={(e) => updateProject('clientPassword', e.target.value)} />
                            </div>
                            <Input label="Жених" value={currentProject.groomName} onChange={(e) => updateProject('groomName', e.target.value)} />
                            <Input label="Невеста" value={currentProject.brideName} onChange={(e) => updateProject('brideName', e.target.value)} />
                            <Input label="Дата" type="date" value={currentProject.date} onChange={(e) => updateProject('date', e.target.value)} />
                            <Input label="Гостей" type="number" value={currentProject.guestsCount} onChange={(e) => updateProject('guestsCount', e.target.value)} />
                            <Input label="Локация" value={currentProject.venueName} onChange={(e) => updateProject('venueName', e.target.value)} />
                            {user.role === 'owner' && <Input label="Организатор" value={currentProject.organizerName} onChange={(e) => updateProject('organizerName', e.target.value)} />}
                        </div>
                        <div className="flex flex-col gap-2 mt-8">
                            <Button onClick={() => setIsEditingProject(false)} variant="primary" className="w-full">Сохранить</Button>
                            <div className="flex gap-2"><Button onClick={toggleArchiveProject} variant="outline" className="flex-1"><Archive size={16}/> {currentProject.isArchived ? 'Вернуть' : 'В архив'}</Button><Button onClick={deleteProject} variant="danger" className="flex-1"><Trash2 size={16}/> Удалить</Button></div>
                        </div>
                     </div>
                 </div>
             </div>
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
            {activeTab === 'tasks' && <TasksView tasks={currentProject.tasks} updateProject={updateProject} formatDate={formatDate} />}
            {activeTab === 'budget' && <BudgetView expenses={currentProject.expenses} updateProject={updateProject} downloadCSV={downloadCSV} />}
            {activeTab === 'guests' && <GuestsView guests={currentProject.guests} updateProject={updateProject} downloadCSV={downloadCSV} />}
            {activeTab === 'timing' && <TimingView timing={currentProject.timing} updateProject={updateProject} downloadCSV={downloadCSV} />}
            {activeTab === 'notes' && <NotesView notes={currentProject.notes} updateProject={updateProject} />}
         </main>
      </div>
    );
  }
  return null;
}