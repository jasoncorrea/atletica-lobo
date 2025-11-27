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

  const renderGender = (g: string) => {
    switch (g) {
      case 'M':
        return <span className="text-blue-600 font-bold">Masculino</span>;
      case 'F':
        return <span className="text-pink-500 font-bold">Feminino</span>;
      case 'Misto':
        return <span className="text-green-600 font-bold">Misto</span>;
      default:
        return <span>{g}</span>;
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 bg-gray-50 p-4 rounded items-end shadow-sm border border-gray-100">
        <div className="flex-grow">
          <label className="text-xs font-bold text-gray-500">Nome da Modalidade</label>
          <input className="w-full border p-2 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-lobo-primary" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Futsal" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">Gênero</label>
          <select className="border p-2 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-lobo-primary" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Misto">Misto</option>
          </select>
        </div>
        <button type="button" onClick={add} className="bg-lobo-secondary hover:bg-red-900 text-white px-6 py-2 rounded font-bold transition">Adicionar</button>
      </div>
      
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map(m => (
          <li key={m.id} className="border p-3 rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-lg">{m.name}</span>
              <span className="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100">
                {renderGender(m.gender)}
              </span>
            </div>
            <button type="button" onClick={() => remove(m.id)} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition">
              Remover
            </button>
          </li>
        ))}
      </ul>
      
      {list.length === 0 && (
        <div className="text-center text-gray-400 py-8">Nenhuma modalidade cadastrada nesta competição.</div>
      )}
    </div>
  );
};