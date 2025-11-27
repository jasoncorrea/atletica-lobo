
import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality, Athletic, Result } from '../../../types';

export const ResultsTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [mods, setMods] = useState<Modality[]>([]);
  const [aths, setAths] = useState<Athletic[]>([]);
  const [resultsList, setResultsList] = useState<Result[]>([]);
  
  const [selMod, setSelMod] = useState('');
  const [rankings, setRankings] = useState<Record<number, string>>({});

  // Carrega dados iniciais
  useEffect(() => {
    loadData();
  }, [comp]);

  const loadData = () => {
    const db = getDb();
    setMods(db.modalities.filter(m => m.competitionId === comp.id));
    setAths(db.athletics);
    // Carrega apenas resultados desta competição
    setResultsList(db.results.filter(r => r.competitionId === comp.id));
  };

  const save = () => {
    if (!selMod) return;
    const db = getDb();
    
    // Verifica se já existe resultado para essa modalidade nesta competição
    const existingIdx = db.results.findIndex(r => r.competitionId === comp.id && r.modalityId === selMod);
    
    const newResult: Result = { 
      id: existingIdx >= 0 ? db.results[existingIdx].id : Math.random().toString(), // Mantém ID se editando
      competitionId: comp.id, 
      modalityId: selMod, 
      ranking: rankings 
    };
    
    if (existingIdx >= 0) {
      db.results[existingIdx] = newResult;
    } else {
      db.results.push(newResult);
    }

    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    
    alert('Resultado salvo com sucesso!');
    loadData(); // Atualiza o feed
    // Não limpa o formulário imediatamente para permitir ajustes se necessário, 
    // ou pode limpar se preferir: setSelMod(''); setRankings({});
  };

  const handleEdit = (result: Result) => {
    setSelMod(result.modalityId);
    setRankings(result.ranking);
    // Rola para o topo para facilitar a edição em mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getModalityName = (id: string) => {
    const m = mods.find(m => m.id === id);
    if (!m) return 'Desconhecida';
    const colorClass = m.gender === 'M' ? 'text-blue-600' : m.gender === 'F' ? 'text-pink-600' : 'text-green-600';
    return <span className="font-bold"><span className="text-gray-800">{m.name}</span> <span className={`text-xs ${colorClass}`}>({m.gender})</span></span>;
  };

  const getWinnerName = (result: Result) => {
    const winnerId = result.ranking[1];
    if (!winnerId) return <span className="text-gray-400 italic">Sem campeão</span>;
    const winner = aths.find(a => a.id === winnerId);
    return winner ? <span className="text-sm text-green-700 font-bold">🏆 {winner.name}</span> : '---';
  };

  // Filtra as modalidades que AINDA NÃO tem resultado (para ajudar no dropdown)
  // Mas no dropdown mostraremos todas, talvez com um marcador visual
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* COLUNA DA ESQUERDA: FORMULÁRIO (Ocupa 2/3 em telas grandes) */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded shadow border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-700">Lançar / Editar Resultado</h3>
          
          <label className="block text-sm font-bold text-gray-500 mb-2">Selecione a Modalidade</label>
          <select 
            className="w-full border p-3 mb-6 rounded bg-white text-gray-900 focus:ring-2 focus:ring-lobo-primary focus:outline-none" 
            value={selMod} 
            onChange={e => { 
              setSelMod(e.target.value); 
              // Se mudar a modalidade no dropdown, tenta carregar o resultado existente se houver
              const existing = resultsList.find(r => r.modalityId === e.target.value);
              if (existing) {
                setRankings(existing.ranking);
              } else {
                setRankings({});
              }
            }}
          >
            <option value="">-- Selecione para lançar --</option>
            {mods.map(m => {
              const hasResult = resultsList.some(r => r.modalityId === m.id);
              return (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.gender}) {hasResult ? '✅' : ''}
                </option>
              );
            })}
          </select>

          {selMod ? (
            <div className="space-y-3 bg-gray-50 p-4 rounded border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4,5,6,7,8].map(r => {
                  let badgeColor = "bg-gray-200 text-gray-600";
                  if (r === 1) badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-300 border";
                  if (r === 2) badgeColor = "bg-gray-100 text-gray-600 border-gray-300 border";
                  if (r === 3) badgeColor = "bg-orange-100 text-orange-700 border-orange-300 border";

                  return (
                    <div key={r} className="flex items-center gap-2">
                      <span className={`w-10 h-10 flex items-center justify-center rounded font-bold shrink-0 ${badgeColor}`}>
                        {r}º
                      </span>
                      <select 
                        className="flex-grow border p-2 rounded bg-white text-gray-900 focus:outline-none focus:border-lobo-primary" 
                        value={rankings[r] || ''} 
                        onChange={e => setRankings({...rankings, [r]: e.target.value})}
                      >
                        <option value="">-- Selecione --</option>
                        {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={save} 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded font-bold text-lg shadow mt-6 transition transform active:scale-95"
              >
                SALVAR RESULTADO
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border-dashed border-2 border-gray-200">
              Selecione uma modalidade acima para começar.
            </div>
          )}
        </div>
      </div>

      {/* COLUNA DA DIREITA: FEED (Ocupa 1/3 em telas grandes) */}
      <div className="lg:col-span-1">
        <div className="bg-gray-50 p-4 rounded h-full border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>📋 Resultados Lançados</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{resultsList.length}</span>
          </h3>
          
          {resultsList.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">Nenhum resultado lançado ainda.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {resultsList.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => handleEdit(r)}
                  className={`bg-white p-3 rounded shadow-sm border border-gray-200 cursor-pointer hover:border-lobo-primary hover:shadow-md transition relative ${selMod === r.modalityId ? 'ring-2 ring-lobo-primary ring-offset-1' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm">{getModalityName(r.modalityId)}</div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 rounded font-medium">Editar</span>
                  </div>
                  <div>{getWinnerName(r)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
