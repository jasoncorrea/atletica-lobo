import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality, Athletic, Result, DEFAULT_SCORE_RULE } from '../../../types';

interface Props {
  competition: Competition;
}

export const ResultsTab: React.FC<Props> = ({ competition }) => {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [athletics, setAthletics] = useState<Athletic[]>([]);
  const [existingResults, setExistingResults] = useState<Result[]>([]);
  
  // Form State
  const [selectedModalityId, setSelectedModalityId] = useState('');
  const [rankings, setRankings] = useState<{[rank: number]: string}>({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentResultId, setCurrentResultId] = useState<string | null>(null);

  const loadData = () => {
    const db = getDb();
    setModalities(db.modalities.filter(m => m.competitionId === competition.id));
    setAthletics(db.athletics);
    setExistingResults(db.results.filter(r => r.competitionId === competition.id));
  };

  useEffect(() => { loadData(); }, [competition]);

  const handleModalityChange = (id: string) => {
    setSelectedModalityId(id);
    const existing = existingResults.find(r => r.modalityId === id);
    if (existing) {
      // Load existing into form for editing
      setRankings(existing.ranking);
      setIsEditing(true);
      setCurrentResultId(existing.id);
    } else {
      // Reset form
      setRankings({});
      setIsEditing(false);
      setCurrentResultId(null);
    }
  };

  const setRank = (rank: number, athleticId: string) => {
    setRankings(prev => ({ ...prev, [rank]: athleticId }));
  };

  const handleSave = () => {
    if (!selectedModalityId) return;

    const db = getDb();
    const resultObj: Result = {
      id: currentResultId || Math.random().toString(36).substring(2, 9),
      competitionId: competition.id,
      modalityId: selectedModalityId,
      ranking: rankings
    };

    if (isEditing) {
      const idx = db.results.findIndex(r => r.id === currentResultId);
      if (idx !== -1) db.results[idx] = resultObj;
    } else {
      db.results.push(resultObj);
    }

    // Mark modality as finished
    const mIdx = db.modalities.findIndex(m => m.id === selectedModalityId);
    if (mIdx !== -1) db.modalities[mIdx].status = 'finished';

    saveDb(db);
    loadData();
    alert('Resultado salvo com sucesso!');
  };

  const getModalityName = (id: string) => {
    const m = modalities.find(mod => mod.id === id);
    return m ? `${m.name} (${m.gender})` : id;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Area */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lançar / Editar Resultados</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Selecione a Modalidade</label>
          <select 
            value={selectedModalityId}
            onChange={(e) => handleModalityChange(e.target.value)}
            className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
          >
            <option value="">-- Selecione --</option>
            {modalities.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.gender}) {m.status === 'finished' ? '✅' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedModalityId && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">Defina os vencedores (1º ao 8º lugar pontuam):</p>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
              <div key={rank} className="flex items-center">
                <span className={`w-8 font-bold ${rank <= 3 ? 'text-lobo-primary' : 'text-gray-500'}`}>{rank}º</span>
                <select
                  value={rankings[rank] || ''}
                  onChange={(e) => setRank(rank, e.target.value)}
                  className="ml-2 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-lobo-primary focus:border-lobo-primary"
                >
                  <option value="">-- Ninguém --</option>
                  {athletics.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            ))}
            
            <div className="pt-4">
              <button 
                type="button"
                onClick={handleSave} 
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors"
              >
                {isEditing ? 'Atualizar Resultado' : 'Salvar Resultado'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Area */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Resultados Lançados</h3>
        {existingResults.length === 0 ? (
          <p className="text-gray-500">Nenhum resultado nesta competição ainda.</p>
        ) : (
          <ul className="space-y-3">
            {existingResults.map(r => (
              <li key={r.id} className="p-3 bg-gray-50 rounded border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lobo-secondary">{getModalityName(r.modalityId)}</span>
                  <button 
                    type="button"
                    onClick={() => handleModalityChange(r.modalityId)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    Editar / Corrigir
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(r.ranking)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .slice(0, 3) // Show top 3 in summary
                    .map(([rank, athId]) => {
                       const ath = athletics.find(a => a.id === athId);
                       return (
                         <div key={rank}>{rank}º: {ath?.name || 'Unknown'}</div>
                       )
                    })
                  }
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};