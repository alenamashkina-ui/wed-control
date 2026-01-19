import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Edit3, Trash2, CheckSquare, X } from 'lucide-react';
import { db, appId } from '../../firebase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const OrganizersView = ({ currentUser }) => {
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

    const addOrganizer = async () => { if (!newOrgName.trim()) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), { name: newOrgName, email: newOrgEmail.toLowerCase().trim(), password: newOrgPass.trim(), role: 'organizer', agencyId: currentUser.agencyId, createdAt: new Date().toISOString() }); setNewOrgName(''); setNewOrgEmail(''); setNewOrgPass(''); };
    const deleteOrganizer = async (id) => { if (window.confirm("Удалить?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id)); } };
    const startEditing = (org) => { setEditingId(org.id); setEditName(org.name); setEditEmail(org.email); setEditPass(org.password); };
    const cancelEditing = () => { setEditingId(null); setEditName(''); setEditEmail(''); setEditPass(''); };
    const saveOrganizer = async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', editingId), { name: editName, email: editEmail.toLowerCase().trim(), password: editPass.trim() }); setEditingId(null); };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#414942] mb-8">Команда</h2>
            <Card className="p-6 mb-8 bg-white/80 border-[#936142]/20"><h3 className="font-bold text-[#936142] mb-4">Добавить сотрудника</h3><div className="grid gap-4 md:grid-cols-3"><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Имя" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Email" value={newOrgEmail} onChange={e => setNewOrgEmail(e.target.value)} /><input className="bg-[#F9F7F5] border-none rounded-xl p-3" placeholder="Пароль" value={newOrgPass} onChange={e => setNewOrgPass(e.target.value)} /></div><Button onClick={addOrganizer} className="mt-4 w-full md:w-auto">Добавить</Button></Card>
            <div className="grid gap-4">{organizers.map(org => (<div key={org.id} className="bg-white p-4 rounded-xl shadow-sm">{editingId === org.id ? (<div className="flex gap-2 w-full"><input className="bg-[#F9F7F5] border rounded-lg p-2 flex-1" value={editName} onChange={e => setEditName(e.target.value)} /><button onClick={saveOrganizer}><CheckSquare size={18}/></button><button onClick={cancelEditing}><X size={18}/></button></div>) : (<div className="flex justify-between items-center w-full"><div><p className="font-bold text-[#414942]">{org.name}</p><p className="text-xs text-[#AC8A69]">{org.email}</p></div><div className="flex gap-2"><button onClick={() => startEditing(org)} className="text-[#AC8A69]"><Edit3 size={18}/></button><button onClick={() => deleteOrganizer(org.id)} className="text-red-300"><Trash2 size={18}/></button></div></div>)}</div>))}</div>
        </div>
    );
};