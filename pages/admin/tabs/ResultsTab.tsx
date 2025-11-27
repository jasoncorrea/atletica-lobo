import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality, Athletic } from '../../../types';

export const ResultsTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [mods, setMods] = useState<Modality[]>([]);
  const [aths, setAths] = useState<Athletic[]>([]);
  const [selMod, setSelMod] = useState('');
  const [rankings, setRankings] = useState<Record<number, string>>({});

  useEffect(() => {
    const db = getDb();
    setMods(db.modalities.filter(m => m.competitionId === comp.id));
    setAths(db.athletics);
  }, [comp]);

  const save = () => {
    if (!selMod) return;
    const db = getDb();
    const existingIdx = db.results.findIndex(r => r.competitionId === comp.id && r.modalityId === selMod);
    const newResult = { id: Math.random().toString(), competitionId: comp.id, modalityId: selMod, ranking: rankings };
    
    if (existingIdx >= 0) db.results[existingIdx] = newResult;
    else db.results.push(newResult);

    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    alert('Salvo!');
  };

  return (
    <div className="max-w-xl mx-auto">
      <label className="block font-bold mb-2">Selecione Modalidade</label>
      <select className="w-full border p-2 mb-6 rounded bg-white text-gray-900" value={selMod} onChange={e => { setSelMod(e.target.value); setRankings({}); }}>
        <option value="">-- Selecione --</option>
        {mods.map(m => <option key={m.id} value={m.id}>{m.name} ({m.gender})</option>)}
      </select>

      {selMod && (
        <div className="bg-gray-50 p-6 rounded space-y-3">
          {[1,2,3,4,5,6,7,8].map(r => (
            <div key={r} className="flex items-center gap-2">
              <span className="w-8 font-bold">{r}º</span>
              <select 
                className="flex-grow border p-2 rounded bg-white text-gray-900" 
                value={rankings[r] || ''} 
                onChange={e => setRankings({...rankings, [r]: e.target.value})}
              >
                <option value="">-- Ninguém --</option>
                {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ))}
          <button onClick={save} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-4">SALVAR RESULTADO</button>
        </div>
      )}
    </div>
  );
};