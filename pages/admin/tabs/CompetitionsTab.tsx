import React, { useState, useEffect } from 'react';
import { getDb, saveDb, createCompetition } from '../../../services/storageService';
import { Competition } from '../../../types';

export const CompetitionsTab: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [list, setList] = useState<Competition[]>([]);
  const [name, setName] = useState('');
  const [year, setYear] = useState(2025);

  const load = () => setList(getDb().competitions);
  useEffect(() => { load(); }, []);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    createCompetition(name, year);
    window.dispatchEvent(new Event('storage'));
    load(); onUpdate(); setName('');
  };

  const remove = (id: string) => {
    const db = getDb();
    db.competitions = db.competitions.filter(c => c.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setList(prev => prev.filter(c => c.id !== id));
    onUpdate();
  };

  const setActive = (id: string) => {
    const db = getDb();
    db.competitions.forEach(c => c.isActive = c.id === id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load(); onUpdate();
  };

  return (
    <div>
      <form onSubmit={add} className="flex gap-4 mb-6 bg-gray-50 p-4 rounded">
        <input className="border p-2 rounded flex-grow bg-white text-gray-900" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Evento" required />
        <input className="border p-2 rounded w-24 bg-white text-gray-900" type="number" value={year} onChange={e => setYear(Number(e.target.value))} required />
        <button type="submit" className="bg-lobo-primary text-white px-4 rounded">Criar</button>
      </form>
      <ul className="divide-y">
        {list.map(c => (
          <li key={c.id} className="py-3 flex justify-between items-center">
            <div>
              <span className="font-bold">{c.name} ({c.year})</span>
              {c.isActive && <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 rounded">ATIVA</span>}
            </div>
            <div className="space-x-2">
              {!c.isActive && <button type="button" onClick={() => setActive(c.id)} className="text-blue-600 text-sm">Ativar</button>}
              <button type="button" onClick={() => remove(c.id)} className="text-red-600 text-sm">Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};