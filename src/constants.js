import { Home, Camera, Video, Music, Scissors, Heart, Coffee, Briefcase } from 'lucide-react';

export const SITE_URL = 'https://wed-control.vercel.app'; 
export const APP_TITLE = 'ParaPlanner';
export const LOGO_URL = 'https://optim.tildacdn.com/tild6638-3332-4035-b465-346665336138/-/format/webp/Remove_background_fr.png.webp';

// --- FIREBASE CONFIG ---
export const firebaseConfig = {
  apiKey: "AIzaSyApHVEteylAoYqC2TSmJr0zk3LL5n8uep8",
  authDomain: "wed-control.firebaseapp.com",
  projectId: "wed-control",
  storageBucket: "wed-control.firebasestorage.app",
  messagingSenderId: "530816827426",
  appId: "1:530816827426:web:522f7c323cecf599f38a7b"
};

export const APP_ID_DB = 'wed-control-v1';

// --- DESIGN & DATA ---
export const COLORS = { 
  primary: '#936142', 
  secondary: '#AC8A69', 
  accent: '#C58970', 
  neutral: '#CCBBA9', 
  dark: '#414942', 
  white: '#FFFFFF', 
  bg: '#F9F7F5' 
};

export const VENDOR_CATEGORIES = [
  { id: 'venue', label: 'Площадка', icon: Home },
  { id: 'photo', label: 'Фотограф', icon: Camera },
  { id: 'video', label: 'Видеограф', icon: Video },
  { id: 'host', label: 'Ведущий', icon: Music },
  { id: 'style', label: 'Стилист', icon: Scissors },
  { id: 'decor', label: 'Декор', icon: Heart },
  { id: 'food', label: 'Кондитеры', icon: Coffee },
  { id: 'other', label: 'Другое', icon: Briefcase },
];

export const INITIAL_EXPENSES = [
  { category: 'Декор', name: 'Декор и флористика', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Площадка', name: 'Аренда мебели', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Фотограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Ведущий + диджей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Образ', name: 'Стилист', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Торт', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Прочее', name: 'Непредвиденные расходы', plan: 0, fact: 0, paid: 0, note: '' },
];

export const INITIAL_TIMING = [
  { time: '09:00', event: 'Пробуждение' },
  { time: '10:00', event: 'Приезд стилиста' },
  { time: '13:00', event: 'Фотосессия' },
  { time: '16:00', event: 'Сбор гостей' },
  { time: '17:00', event: 'Начало ужина' },
  { time: '23:00', event: 'Окончание' },
];

export const TASK_TEMPLATES = [
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

export const INITIAL_FORM_STATE = { 
  groomName: '', 
  brideName: '', 
  date: '', 
  guestsCount: '', 
  prepLocation: 'home', 
  registrationType: 'official', 
  venueName: '', 
  clientPassword: '' 
};
