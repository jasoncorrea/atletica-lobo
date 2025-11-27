import React, { useState, useEffect } from 'react';
import { getDb, saveDb, handleImageUpload } from '../../../services/storageService';
import { Athletic } from '../../../types';

export const AthleticsTab: React.FC = () => {
  const [list, setList] = useState<Athletic[]>([]);
  const [name, setName] = useState('');
  
  const load = () => setList(getDb().athletics);
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDb();
    db.athletics.push({ id: Math.random().toString(), name, logoUrl: null });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load(); setName('');
  };

  const uploadLogo = async (id: string, file: File) => {
    try {
      const url = await handleImageUpload(file);
      const db = getDb();
      const ath = db.athletics.find(a => a.id === id);
      if (ath) ath.logoUrl = url;
      saveDb(db);
      window.dispatchEvent(new Event('storage'));
      load();
    } catch { alert('Erro no upload'); }
  };

  const remove = (id: string) => {
    const db = getDb();
    db.athletics = db.athletics.filter(a => a.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setList(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form onSubmit={add} className="h-fit bg-gray-50 p-4 rounded">
        <label className="block text-sm font-bold mb-2">Nova Atlética</label>
        <div className="flex gap-2">
          <input className="border p-2 w-full rounded bg-white text-gray-900" value={name} onChange={e => setName(e.target.value)} placeholder="Nome" required />
          <button className="bg-lobo-primary text-white px-4 rounded">Add</button>
        </div>
      </form>
      <ul className="space-y-2">
        {list.map(a => (
          <li key={a.id} className="border p-3 rounded flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              {a.logoUrl ? <img src={a.logoUrl} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-gray-200 rounded-full" />}
              <span className="font-bold">{a.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                Logo
                <input type="file" hidden onChange={e => e.target.files?.[0] && uploadLogo(a.id, e.target.files[0])} />
              </label>
              <button type="button" onClick={() => remove(a.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};