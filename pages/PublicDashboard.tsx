import React, { useEffect, useState } from 'react';
import { getDb, calculateLeaderboard } from '../services/storageService';
import { Competition, LeaderboardEntry } from '../types';

export const PublicDashboard: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const db = getDb();
    // Sort competitions by date desc
    const sortedComps = db.competitions.sort((a, b) => b.createdAt - a.createdAt);
    setCompetitions(sortedComps);

    if (sortedComps.length > 0) {
      // Default to active or first
      const active = sortedComps.find(c => c.isActive) || sortedComps[0];
      setSelectedCompId(active.id);
    }
  }, []);

  useEffect(() => {
    if (selectedCompId) {
      setLeaderboard(calculateLeaderboard(selectedCompId));
    }
  }, [selectedCompId]);

  if (competitions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-600">Nenhuma competição ativa no momento.</h2>
        <p className="text-gray-500 mt-2">Aguarde o início dos jogos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-lobo-secondary mb-2 sm:mb-0">Classificação Geral</h2>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-600">Competição:</label>
          <select 
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-lobo-primary focus:border-lobo-primary sm:text-sm rounded-md border bg-white text-gray-900"
          >
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-lobo-secondary text-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-16">#</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Atlética</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Pontos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry, idx) => {
                const isLobo = entry.name.toLowerCase().includes('lobo');
                const isTop3 = idx < 3;
                
                return (
                  <tr 
                    key={entry.athleticId} 
                    className={`
                      transition-all duration-150 relative
                      ${isLobo 
                        ? 'bg-orange-50 border-l-4 border-lobo-primary' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm
                        ${idx === 0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200' : ''}
                        ${idx === 1 ? 'bg-gray-300 text-gray-800 ring-2 ring-gray-200' : ''}
                        ${idx === 2 ? 'bg-amber-600 text-amber-100 ring-2 ring-amber-200' : ''}
                        ${idx > 2 ? 'text-gray-500 bg-gray-100' : ''}
                      `}>
                        {entry.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-14 w-14 relative group">
                          {entry.logoUrl ? (
                            <img 
                              className={`h-14 w-14 rounded-full object-cover border-2 shadow-sm ${isLobo ? 'border-lobo-primary' : 'border-white'}`} 
                              src={entry.logoUrl} 
                              alt={entry.name} 
                            />
                          ) : (
                            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border-2 ${isLobo ? 'bg-lobo-secondary text-white border-lobo-primary' : 'bg-gray-200 text-gray-400 border-white'}`}>
                              {entry.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isTop3 && (
                            <span className="absolute -top-2 -right-2 text-xl drop-shadow-md transform group-hover:scale-110 transition-transform">
                               {idx === 0 && '👑'}
                               {idx === 1 && '🥈'}
                               {idx === 2 && '🥉'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className={`font-bold ${isLobo ? 'text-lobo-secondary text-lg' : 'text-gray-900 text-base'}`}>
                            {entry.name}
                          </div>
                          {entry.penalties > 0 && (
                            <div className="text-xs text-red-600 font-bold bg-red-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                              -{entry.penalties} pts (Punição)
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-3xl font-black ${isLobo ? 'text-lobo-primary' : 'text-gray-900'}`}>
                        {entry.totalPoints}
                      </div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pontos Totais</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};