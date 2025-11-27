import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality } from '../../../types';

export const ModalitiesTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [list, setList] = useState<Modality[]>([]);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('M');

  const load = () => setList(getDb().modalities.filter(m => m.competitionId === comp.id));
  useEffect(() => { load(); }, [comp]);

  const add = () => {
    if (!name) return;
    const db = getDb();
    db.modalities.push({ id: Math.random().toString(), competitionId: comp.id, name, gender: gender as any, status: 'pending' });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load(); setName('');
  };

  const remove = (id: string) => {
    const db = getDb();
    db.modalities = db.modalities.filter(m => m.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setList(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 bg-gray-50 p-4 rounded items-end">
        <div className="flex-grow">
          <label className="text-xs font-bold">Modalidade</label>
          <input className="w-full border p-2 rounded bg-white text-gray-900" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold">Gênero</label>
          <select className="border p-2 rounded bg-white text-gray-900" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Misto">Misto</option>
          </select>
        </div>
        <button type="button" onClick={add} className="bg-lobo-secondary text-white px-4 py-2 rounded">Adicionar</button>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map(m => (
          <li key={m.id} className="border p-3 rounded flex justify-between bg-white">
            <span className="font-medium">{m.name} ({m.gender})</span>
            <button type="button" onClick={() => remove(m.id)} className="text-red-500 text-sm">Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
};