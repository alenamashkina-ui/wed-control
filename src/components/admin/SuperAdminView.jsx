import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db, appId } from '../../firebase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const SuperAdminView = () => {
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
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), { name: newAgencyName, email: newAgencyEmail.toLowerCase().trim(), password: newAgencyPass.trim(), role: 'agency_admin', agencyId: agencyId, createdAt: new Date().toISOString() });
        setNewAgencyName(''); setNewAgencyEmail(''); setNewAgencyPass(''); alert(`Агентство создано!`);
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#414942] mb-8">Управление Агентствами</h2>
            <Card className="p-6 mb-8 bg-white border-[#936142]/20"><h3 className="font-bold text-[#936142] mb-4">Создать новое агентство</h3><div className="grid gap-4 md:grid-cols-3"><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Название" value={newAgencyName} onChange={e => setNewAgencyName(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Email" value={newAgencyEmail} onChange={e => setNewAgencyEmail(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Пароль" value={newAgencyPass} onChange={e => setNewAgencyPass(e.target.value)} /></div><Button onClick={createAgency} className="mt-4 w-full md:w-auto">Создать</Button></Card>
            <div className="space-y-4">{agencies.map(a => (<div key={a.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#EBE5E0] flex justify-between items-center"><div><p className="font-bold text-[#414942]">{a.name}</p><p className="text-xs text-[#AC8A69]">{a.email}</p></div><div className="px-3 py-1 bg-[#F9F7F5] rounded-lg text-xs font-bold text-[#936142]">ID: {a.agencyId}</div></div>))}</div>
        </div>
    );
};