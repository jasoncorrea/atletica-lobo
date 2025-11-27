import React, { useEffect, useState } from 'react';
import { getDb, calculateLeaderboard } from '../services/storageService';
import { Competition, LeaderboardEntry } from '../types';

export const PublicDashboard: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const load = () => {
      const db = getDb();
      const comps = db.competitions.sort((a, b) => b.createdAt - a.createdAt);
      setCompetitions(comps);
      if (comps.length > 0 && !selectedCompId) {
        const active = comps.find(c => c.isActive) || comps[0];
        setSelectedCompId(active.id);
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [selectedCompId]);

  useEffect(() => {
    if (selectedCompId) {
      setLeaderboard(calculateLeaderboard(selectedCompId));
    }
  }, [selectedCompId]);

  if (competitions.length === 0) return <div className="text-center py-20 text-gray-500">Nenhuma competição encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-xl font-bold text-lobo-secondary">Classificação Geral</h2>
        <select 
          className="bg-white text-gray-900 border border-gray-300 rounded p-2 text-sm mt-2 sm:mt-0"
          value={selectedCompId}
          onChange={(e) => setSelectedCompId(e.target.value)}
        >
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-lobo-secondary text-white">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Atlética</th>
              <th className="px-6 py-3 text-center">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((entry, idx) => {
              const isLobo = entry.name.toLowerCase().includes('lobo');
              return (
                <tr key={entry.athleticId} className={isLobo ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4 font-bold text-gray-500">{entry.position}</td>
                  <td className="px-6 py-4 flex items-center space-x-4">
                    {entry.logoUrl ? (
                      <img src={entry.logoUrl} className={`h-10 w-10 rounded-full border ${isLobo ? 'border-lobo-primary' : 'border-gray-200'}`} />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs">{entry.name.substring(0,2)}</div>
                    )}
                    <div>
                      <div className={`font-bold ${isLobo ? 'text-lobo-secondary' : 'text-gray-900'}`}>{entry.name}</div>
                      {entry.penalties > 0 && <span className="text-xs text-red-500 font-bold">-{entry.penalties} pts (Punição)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-xl">{entry.totalPoints}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};