import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality } from '../../../types';
import { GENDERS } from '../../../constants';

interface Props {
  competition: Competition;
}

export const ModalitiesTab: React.FC<Props> = ({ competition }) => {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Modality['gender']>('M');

  const load = () => {
    const db = getDb();
    setModalities(db.modalities.filter(m => m.competitionId === competition.id));
  };

  useEffect(() => { load(); }, [competition]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault(); // In case it's wrapped in a form or triggered by Enter
    const db = getDb();
    db.modalities.push({
      id: Math.random().toString(36).substring(2, 9),
      competitionId: competition.id,
      name: newName,
      gender: newGender,
      status: 'pending'
    });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setNewName('');
    load();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Excluir modalidade? Resultados associados serão perdidos.')) return;
    
    // 1. Otimistic UI Update: Remove immediately from state
    setModalities(prev => prev.filter(m => m.id !== id));

    // 2. Persist to DB
    const db = getDb();
    db.modalities = db.modalities.filter(m => m.id !== id);
    db.results = db.results.filter(r => r.modalityId !== id);
    saveDb(db);
    
    // 3. Dispatch global event for leaderboards
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        <div className="flex-grow min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Nova Modalidade</label>
          <input 
            type="text" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex: Poker, Truco..."
            className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700">Gênero</label>
          <select 
            value={newGender}
            onChange={e => setNewGender(e.target.value as any)}
            className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
          >
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            <option value="Misto">Misto</option>
          </select>
        </div>
        <button 
          type="button" 
          onClick={(e) => handleAdd(e)} 
          disabled={!newName} 
          className="bg-lobo-secondary text-white px-4 py-2 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Adicionar
        </button>
      </div>

      {/* List */}
      <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {modalities.map(m => (
            <li key={m.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-sm font-bold text-gray-900">{m.name}</span>
                <span className={`ml-3 px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${m.gender === 'M' ? 'bg-blue-100 text-blue-800' : m.gender === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}`}>
                  {m.gender}
                </span>
                {m.status === 'finished' && (
                  <span className="ml-2 text-xs text-green-600 font-semibold border border-green-200 px-1.5 rounded">
                    Concluído
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => handleDelete(m.id)} 
                className="flex-shrink-0 ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Remover
              </button>
            </li>
          ))}
          {modalities.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-500 text-sm">
              Nenhuma modalidade cadastrada nesta competição.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};