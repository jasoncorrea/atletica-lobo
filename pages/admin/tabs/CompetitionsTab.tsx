import React, { useState, useEffect } from 'react';
import { getDb, saveDb, createCompetition } from '../../../services/storageService';
import { Competition } from '../../../types';

interface Props {
  onUpdate: () => void;
}

export const CompetitionsTab: React.FC<Props> = ({ onUpdate }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  const load = () => setCompetitions(getDb().competitions);

  useEffect(() => { load(); }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCompetition(newName, newYear);
    setNewName('');
    window.dispatchEvent(new Event('storage'));
    load();
    onUpdate();
  };

  const handleSetActive = (id: string) => {
    const db = getDb();
    db.competitions.forEach(c => c.isActive = (c.id === id));
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load();
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza? Isso apagará TODOS os resultados e dados desta competição.')) return;
    
    // Optimistic update
    setCompetitions(prev => prev.filter(c => c.id !== id));

    const db = getDb();
    db.competitions = db.competitions.filter(c => c.id !== id);
    // Cleanup related data
    db.modalities = db.modalities.filter(m => m.competitionId !== id);
    db.results = db.results.filter(r => r.competitionId !== id);
    db.penalties = db.penalties.filter(p => p.competitionId !== id);
    
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    onUpdate();
  };

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Nova Competição</h3>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Nome do Evento</label>
            <input 
              type="text" 
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Jogos de Verão"
              className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Ano</label>
            <input 
              type="number" 
              required
              value={newYear}
              onChange={e => setNewYear(Number(e.target.value))}
              className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
            />
          </div>
          <button type="submit" className="bg-lobo-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
            Criar e Configurar (Auto-Seed)
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ano</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {competitions.map(c => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {c.isActive ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Ativa
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleSetActive(c.id)} 
                      className="text-xs text-lobo-primary hover:underline font-bold"
                    >
                      Definir como Ativa
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    type="button"
                    onClick={() => handleDelete(c.id)} 
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};