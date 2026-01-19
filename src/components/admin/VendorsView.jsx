import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Edit3, Trash2, Heart, Link as LinkIcon, Star } from 'lucide-react';
import { db, appId } from '../../firebase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Forms';
import { VENDOR_CATEGORIES } from '../../constants';
import { formatCurrency } from '../../utils';

export const VendorsView = ({ agencyId }) => {
    const [vendors, setVendors] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [filterCat, setFilterCat] = useState('all');
    
    // Form State
    const [editingId, setEditingId] = useState(null);
    const [vName, setVName] = useState('');
    const [vCat, setVCat] = useState('photo');
    const [vCustomCat, setVCustomCat] = useState('');
    const [vPrice, setVPrice] = useState('');
    const [vLink, setVLink] = useState('');
    const [vPhoto, setVPhoto] = useState('');
    const [vDesc, setVDesc] = useState('');

    useEffect(() => {
        let q;
        if (agencyId) {
             q = query(collection(db, 'artifacts', appId, 'public', 'data', 'vendors'), where('agencyId', '==', agencyId));
        } else {
             q = collection(db, 'artifacts', appId, 'public', 'data', 'vendors');
        }
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [agencyId]);

    const handleSave = async () => {
        if (!vName) return;
        const categoryToSave = vCat === 'custom' ? vCustomCat : vCat;
        const data = {
            name: vName, category: categoryToSave, price: vPrice, link: vLink, photo: vPhoto, description: vDesc, 
            agencyId: agencyId || 'legacy_agency'
        };
        if (editingId) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vendors', editingId), data);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vendors'), { ...data, createdAt: new Date().toISOString() });
        }
        resetForm();
    };

    const handleEdit = (vendor) => {
        setEditingId(vendor.id);
        setVName(vendor.name);
        setVPrice(vendor.price);
        setVLink(vendor.link);
        setVPhoto(vendor.photo);
        setVDesc(vendor.description);
        const isStandard = VENDOR_CATEGORIES.some(c => c.id === vendor.category);
        if (isStandard) { setVCat(vendor.category); setVCustomCat(''); } else { setVCat(vendor.category); setVCustomCat(''); }
        setShowAdd(true);
        window.scrollTo(0,0);
    };

    const handleDelete = async (id) => {
        if (confirm('Удалить из базы?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vendors', id));
    };

    const resetForm = () => {
        setEditingId(null); setVName(''); setVPrice(''); setVLink(''); setVPhoto(''); setVDesc(''); setVCat('photo'); setVCustomCat(''); setShowAdd(false);
    }

    const customCategoriesFromDB = vendors.map(v => v.category).filter(c => !VENDOR_CATEGORIES.some(vc => vc.id === c)).filter((value, index, self) => self.indexOf(value) === index);
    const allFilterCategories = [...VENDOR_CATEGORIES, ...customCategoriesFromDB.map(c => ({ id: c, label: c, icon: Star }))];
    const filteredVendors = filterCat === 'all' ? vendors : vendors.filter(v => v.category === filterCat);

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-[#414942]">База подрядчиков</h1>
                <Button onClick={() => { if(showAdd) resetForm(); else setShowAdd(true); }}>{showAdd ? 'Отмена' : 'Добавить профиль'}</Button>
            </div>
            {showAdd && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-[#AC8A69]/20 mb-8 animate-slideUp">
                    <h3 className="font-bold text-[#936142] mb-6">{editingId ? 'Редактирование' : 'Новый подрядчик'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-[#AC8A69] uppercase ml-1">Категория</label>
                            <select className="w-full bg-[#F9F7F5] rounded-xl p-4 outline-none mb-2" value={vCat} onChange={e => setVCat(e.target.value)}>
                                {VENDOR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                {customCategoriesFromDB.map(c => (<option key={c} value={c}>{c}</option>))}
                                <option value="custom">+ Своя категория...</option>
                            </select>
                            {vCat === 'custom' && (<input className="w-full bg-[#F9F7F5] rounded-xl p-4 outline-none border-2 border-[#AC8A69]/20" placeholder="Название категории" value={vCustomCat} onChange={e => setVCustomCat(e.target.value)} />)}</div>
                            <Input label="Название / Имя" value={vName} onChange={e => setVName(e.target.value)} placeholder="Иван Иванов" />
                            <Input label="Стоимость (от)" value={vPrice} onChange={e => setVPrice(e.target.value)} placeholder="50 000" />
                        </div>
                        <div className="space-y-4">
                            <Input label="Ссылка" value={vLink} onChange={e => setVLink(e.target.value)} placeholder="instagram.com/..." />
                            <Input label="Ссылка на фото (URL)" value={vPhoto} onChange={e => setVPhoto(e.target.value)} placeholder="https://..." />
                            <div><label className="text-xs font-bold text-[#AC8A69] uppercase ml-1">Описание / Условия</label><textarea className="w-full bg-[#F9F7F5] rounded-xl p-4 outline-none min-h-[100px]" value={vDesc} onChange={e => setVDesc(e.target.value)} placeholder="Детали работы..." /></div>
                        </div>
                    </div>
                    <Button onClick={handleSave} className="mt-4 w-full">{editingId ? 'Сохранить изменения' : 'Сохранить в базу'}</Button>
                </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                <button onClick={() => setFilterCat('all')} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${filterCat === 'all' ? 'bg-[#414942] text-white' : 'bg-white text-[#414942] border border-[#EBE5E0]'}`}>Все</button>
                {allFilterCategories.map(c => (<button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors flex items-center gap-2 ${filterCat === c.id ? 'bg-[#936142] text-white' : 'bg-white text-[#414942] border border-[#EBE5E0]'}`}><c.icon size={14}/> {c.label}</button>))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredVendors.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#EBE5E0] group relative">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => handleEdit(v)} className="bg-white/90 p-2 rounded-full text-[#414942] hover:text-[#936142] hover:bg-white shadow-sm"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(v.id)} className="bg-white/90 p-2 rounded-full text-red-300 hover:text-red-500 hover:bg-white shadow-sm"><Trash2 size={16}/></button>
                        </div>
                        <div className="aspect-square bg-[#F9F7F5] relative overflow-hidden">
                            {v.photo ? (<img src={v.photo} alt={v.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-[#CCBBA9]/50"><Heart size={48} className="text-[#CCBBA9] opacity-50"/></div>)}
                            <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold text-[#414942] shadow-sm">{allFilterCategories.find(c => c.id === v.category)?.label || v.category}</div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-[#414942] text-lg mb-1 truncate">{v.name}</h3>
                            <p className="text-[#936142] font-medium mb-3">{v.price ? `${formatCurrency(v.price)} ₽` : 'Цена по запросу'}</p>
                            <p className="text-sm text-[#AC8A69] line-clamp-2 mb-4 h-10">{v.description}</p>
                            {v.link && (<a href={v.link.startsWith('http') ? v.link : `https://${v.link}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#F9F7F5] text-[#414942] text-sm hover:bg-[#EBE5E0] transition-colors font-medium">Ссылка <LinkIcon size={14}/></a>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};