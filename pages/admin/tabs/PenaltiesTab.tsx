import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Athletic, Penalty } from '../../../types';

export const PenaltiesTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [aths, setAths] = useState<Athletic[]>([]);
  const [pens, setPens] = useState<Penalty[]>([]);
  const [target, setTarget] = useState('');
  const [pts, setPts] = useState(10);
  const [reason, setReason] = useState('');

  const load = () => {
    const db = getDb();
    setAths(db.athletics);
    setPens(db.penalties.filter(p => p.competitionId === comp.id));
  };
  useEffect(() => { load(); }, [comp]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDb();
    db.penalties.push({ id: Math.random().toString(), competitionId: comp.id, athleticId: target, points: pts, reason, date: Date.now() });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load(); setReason('');
  };

  const remove = (id: string) => {
    const db = getDb();
    db.penalties = db.penalties.filter(p => p.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setPens(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={add} className="bg-red-50 p-4 rounded h-fit">
        <h3 className="font-bold text-red-800 mb-4">Aplicar Punição</h3>
        <select className="w-full border p-2 mb-2 rounded bg-white text-gray-900" value={target} onChange={e => setTarget(e.target.value)} required>
          <option value="">Atlética</option>
          {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="w-full border p-2 mb-2 rounded bg-white text-gray-900" type="number" value={pts} onChange={e => setPts(Number(e.target.value))} placeholder="Pontos" />
        <input className="w-full border p-2 mb-4 rounded bg-white text-gray-900" value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo" />
        <button className="w-full bg-red-600 text-white py-2 rounded font-bold">Aplicar</button>
      </form>
      <ul className="space-y-2">
        {pens.map(p => (
          <li key={p.id} className="border p-3 rounded flex justify-between bg-white">
            <div>
              <span className="font-bold text-red-600">-{p.points}</span>
              <span className="mx-2">|</span>
              <span>{aths.find(a => a.id === p.athleticId)?.name}</span>
              <div className="text-xs text-gray-500">{p.reason}</div>
            </div>
            <button type="button" onClick={() => remove(p.id)} className="text-red-500 text-xs border border-red-200 px-2 rounded">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
};