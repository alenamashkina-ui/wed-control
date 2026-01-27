import { Home, Camera, Video, Music, Scissors, Heart, Coffee, Briefcase } from 'lucide-react';

// --- ИЗМЕНЕНИЕ ЗДЕСЬ: Ставим адрес твоей страницы на Тильде ---
export const SITE_URL = 'https://paraplanner.ru/app'; 

export const APP_TITLE = 'ParaPlanner';
export const LOGO_URL = 'https://optim.tildacdn.com/tild3963-3763-4632-a531-353431666665/-/format/webp/Remove_background_fr.webp';

// --- КОНТАКТ ПОДДЕРЖКИ ---
export const SUPPORT_CONTACT = 'https://t.me/alena_mashkina'; 

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
  { category: 'Полиграфия', name: 'Свадебная полиграфия', plan: 0, fact: 0, paid: 0, note: 'Приглашения, меню, рассадка' },
  { category: 'Полиграфия', name: 'Создание сайта', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Предсвадебная съемка (Love Story)', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Фотограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Фотокнига', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Видеограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Монтаж SDE-ролика', plan: 0, fact: 0, paid: 0, note: 'Монтаж в день свадьбы' },
  { category: 'Фото и Видео', name: 'Мобильный видеомейкер', plan: 0, fact: 0, paid: 0, note: 'Reels / Stories' },
  { category: 'Программа', name: 'Ведущий + диджей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Техническое обеспечение', name: 'Звук и свет', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Спецэффекты', plan: 0, fact: 0, paid: 0, note: 'Тяжелый дым, конфетти' },
  { category: 'Образ', name: 'Стилист невесты', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Образ', name: 'Стилист для гостей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Кавер-группа', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Бытовой райдер артистов', plan: 0, fact: 0, paid: 0, note: 'Еда, гримерка' },
  { category: 'Место и Логистика', name: 'Номер в отеле', plan: 0, fact: 0, paid: 0, note: 'Сборы или первая брачная ночь' },
  { category: 'Место и Логистика', name: 'Размещение иногородних гостей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Постановка свадебного танца', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Транспорт', name: 'Аренда автомобиля', plan: 0, fact: 0, paid: 0, note: 'Для пары' },
  { category: 'Транспорт', name: 'Автобусы для гостей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Транспорт', name: 'Вечерняя развозка', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Аниматор для детей / Няня', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Свадебный ужин', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Торт', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Напитки и алкоголь', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Декор', name: 'Комплименты для гостей', plan: 0, fact: 0, paid: 0, note: 'Бонбоньерки' },
  { category: 'Программа', name: 'Фейерверк / Салют', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Команда', name: 'Организация и координация', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Прочее', name: 'Непредвиденные расходы', plan: 0, fact: 0, paid: 0, note: 'Резервный фонд' },
];

export const INITIAL_TIMING = [
  { time: '09:00', event: 'Пробуждение' },
  { time: '09:30', event: 'Завтрак' },
  { time: '10:00', event: 'Приезд стилиста' },
  { time: '12:00', event: 'Начало работы фотографа и видеооператора' },
  { time: '13:00', event: 'Подача автомобиля. Прогулка. Фотосессия' },
  { time: '16:30', event: 'Сбор гостей' },
  { time: '17:00', event: 'Начало ужина' },
  { time: '23:00', event: 'Окончание' },
];

export const OUTDOOR_TASKS = [
  { text: 'Выбрать место проведения выездной регистрации', pos: 0.18 },
  { text: 'Выбрать регистратора', pos: 0.32 },
  { text: 'Утвердить сценарий и речь церемонии', pos: 0.52 },
  { text: 'Сочинить клятвы', pos: 0.54 }
];

export const OUTDOOR_EXPENSE = { category: 'Программа', name: 'Выездной регистратор', plan: 0, fact: 0, paid: 0, note: '' };

export const TASK_TEMPLATES = [
  { text: 'Определить бюджет свадьбы', pos: 0.00 },
  { text: 'Составить список гостей', pos: 0.02 },
  { text: 'Заполнить анкету', pos: 0.04 },
  { text: 'Выбрать дату регистрации', pos: 0.06 },
  { text: 'Выбрать день свадьбы', pos: 0.08 },
  { text: 'Составить тайминг свадебного дня', pos: 0.10 },
  { text: 'Подать заявления в ЗАГС', pos: 0.12 },
  { text: 'Утвердить концепцию свадьбы', pos: 0.14 },
  { text: 'Выбрать место проведения свадьбы', pos: 0.16 },
  { text: 'Продумать план Б на случай непогоды', pos: 0.20 },
  { text: 'Утвердить текст для приглашений', pos: 0.22 },
  { text: 'Заказать приглашения', pos: 0.24 },
  { text: 'Выбрать фотографа', pos: 0.26 },
  { text: 'Выбрать видеооператора', pos: 0.28 },
  { text: 'Выбрать ведущего', pos: 0.30 },
  { text: 'Выбрать стилиста', pos: 0.34 },
  { text: 'Запланировать репетицию образа', pos: 0.36 },
  { text: 'Выбрать стилиста для мам и подружек', pos: 0.38 },
  { text: 'Забронировать автомобиль с водителем', pos: 0.40 },
  { text: 'Выбрать артистов для шоу-программы', pos: 0.42 },
  { text: 'Выбрать студию декора', pos: 0.44 },
  { text: 'Утвердить стилистику и цветовую палитру свадьбы', pos: 0.46 },
  { text: 'Утвердить с декоратором смету по декору', pos: 0.48 },
  { text: 'Утвердить маршрут и локации для фотосессии', pos: 0.50 },
  { text: 'Заказать звуковое, световое, видеооборудование и спецэффекты', pos: 0.56 },
  { text: 'Заказать комплименты для гостей', pos: 0.58 },
  { text: 'Утвердить меню', pos: 0.60 },
  { text: 'Утвердить программу с ведущим', pos: 0.62 },
  { text: 'Забронировать номер в отеле', pos: 0.64 },
  { text: 'Забронировать автомобиль с водителем', pos: 0.66 },
  { text: 'Купить свадебное платье', pos: 0.68 },
  { text: 'Купить костюм для жениха', pos: 0.70 },
  { text: 'Купить обручальные кольца', pos: 0.72 },
  { text: 'Выбрать парфюм для свадьбы', pos: 0.74 },
  { text: 'Выбрать кондитера, утвердить дизайн и начинки для свадебного торта', pos: 0.76 },
  { text: 'Заказать напитки', pos: 0.78 },
  { text: 'Организовать девичник', pos: 0.80 },
  { text: 'Организовать мальчишник', pos: 0.82 },
  { text: 'Продумать образы на сборы в день свадьбы', pos: 0.84 },
  { text: 'Выбрать школу танцев, музыкальную композицию и разучить вместе с хореографом свадебный танец', pos: 0.86 },
  { text: 'Провести опрос гостей об их присутствии на свадьбе, пожеланиях по еде и напиткам и необходимости места в автобусе', pos: 0.88 },
  { text: 'Забронировать отель для приезжих гостей', pos: 0.90 },
  { text: 'Забронировать автобусы для гостей', pos: 0.92 },
  { text: 'Забронировать автобус для вечерней развозки гостей', pos: 0.94 },
  { text: 'Составить план рассадки гостей', pos: 0.96 },
  { text: 'Заказать питание для команды', pos: 0.98 },
  { text: 'Составить плейлист для ди-джея', pos: 0.99 },
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