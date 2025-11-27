import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Athletic, Penalty } from '../../../types';

interface Props {
  competition: Competition;
}

export const PenaltiesTab: React.FC<Props> = ({ competition }) => {
  const [athletics, setAthletics] = useState<Athletic[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  
  // Form
  const [targetAthletic, setTargetAthletic] = useState('');
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('');

  const load = () => {
    const db = getDb();
    setAthletics(db.athletics);
    setPenalties(db.penalties.filter(p => p.competitionId === competition.id));
  };

  useEffect(() => { load(); }, [competition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDb();
    db.penalties.push({
      id: Math.random().toString(36).substring(2, 9),
      competitionId: competition.id,
      athleticId: targetAthletic,
      points: Number(points),
      reason,
      date: Date.now()
    });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setReason('');
    load();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remover esta penalidade? A pontuação será restaurada.')) return;
    
    // Optimistic Update: Remove from UI immediately
    setPenalties(prev => prev.filter(p => p.id !== id));

    const db = getDb();
    db.penalties = db.penalties.filter(p => p.id !== id);
    saveDb(db);
    
    // Sync Global
    window.dispatchEvent(new Event('storage'));
  };

  const getAthleticName = (id: string) => athletics.find(a => a.id === id)?.name || id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className="text-lg font-bold text-red-800 mb-4">Aplicar Nova Penalidade</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Atlética</label>
            <select 
              required
              value={targetAthletic}
              onChange={e => setTargetAthletic(e.target.value)}
              className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">-- Selecione --</option>
              {athletics.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pontos a Deduzir (Positivo)</label>
            <input 
              type="number" 
              required
              min="1"
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: Digite 10 para subtrair 10 pontos.</p>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Motivo</label>
             <input 
               type="text" 
               required
               value={reason}
               onChange={e => setReason(e.target.value)}
               placeholder="Ex: W.O., Briga de torcida..."
               className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
             />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors">
            Aplicar Penalidade
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Histórico de Punições</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {penalties.map(p => (
            <li key={p.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-red-700">-{p.points} pts</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-medium text-gray-900">{getAthleticName(p.athleticId)}</span>
                  <p className="text-sm text-gray-500 mt-1">{p.reason}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="flex-shrink-0 ml-4 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-medium"
                >
                  Excluir (Restaurar Pts)
                </button>
              </div>
            </li>
          ))}
          {penalties.length === 0 && <li className="px-6 py-4 text-gray-500 text-sm">Nenhuma penalidade aplicada.</li>}
        </ul>
      </div>
    </div>
  );
};