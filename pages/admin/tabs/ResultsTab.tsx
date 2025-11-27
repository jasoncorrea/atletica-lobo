
import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { Competition, Modality, Athletic, Result } from '../../../types';

// Modalidades que ativam o modo Chaveamento
const COLLECTIVE_MODALITIES = [
  'Vôlei de Praia', 'Voleibol', 'Tênis', 'Basquetebol', 
  'Futebol', 'Futsal', 'Handebol'
];

interface BracketMatch {
  p1: string | null;
  p2: string | null;
  winner: string | null;
}

export const ResultsTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [mods, setMods] = useState<Modality[]>([]);
  const [aths, setAths] = useState<Athletic[]>([]);
  const [resultsList, setResultsList] = useState<Result[]>([]);
  
  const [selMod, setSelMod] = useState('');
  const [rankings, setRankings] = useState<Record<number, string>>({});

  // Estado para o modo de entrada
  const [inputMode, setInputMode] = useState<'manual' | 'bracket'>('manual');

  // Estado do Chaveamento (Quartas, Semis, Final)
  const [quarters, setQuarters] = useState<BracketMatch[]>([
    { p1: null, p2: null, winner: null },
    { p1: null, p2: null, winner: null },
    { p1: null, p2: null, winner: null },
    { p1: null, p2: null, winner: null }
  ]);
  const [semis, setSemis] = useState<BracketMatch[]>([
    { p1: null, p2: null, winner: null },
    { p1: null, p2: null, winner: null }
  ]);
  const [final, setFinal] = useState<BracketMatch>({ p1: null, p2: null, winner: null });

  useEffect(() => {
    loadData();
  }, [comp]);

  const loadData = () => {
    const db = getDb();
    setMods(db.modalities.filter(m => m.competitionId === comp.id));
    setAths(db.athletics);
    setResultsList(db.results.filter(r => r.competitionId === comp.id));
  };

  const isCollective = (modId: string) => {
    const mod = mods.find(m => m.id === modId);
    if (!mod) return false;
    return COLLECTIVE_MODALITIES.some(name => mod.name.includes(name));
  };

  const resetBracket = () => {
    setQuarters(Array(4).fill({ p1: null, p2: null, winner: null }));
    setSemis(Array(2).fill({ p1: null, p2: null, winner: null }));
    setFinal({ p1: null, p2: null, winner: null });
  };

  // --- LÓGICA DO CHAVEAMENTO ---

  const handleQuarterSelect = (matchIdx: number, slot: 'p1' | 'p2', athId: string) => {
    const newQ = [...quarters];
    newQ[matchIdx] = { ...newQ[matchIdx], [slot]: athId, winner: null }; // Reseta vencedor se mudar time
    setQuarters(newQ);
    // Reseta fases futuras dependentes
    updateSemisFromQuarters(newQ);
  };

  const handleQuarterWinner = (matchIdx: number, winnerId: string | null) => {
    const newQ = [...quarters];
    newQ[matchIdx] = { ...newQ[matchIdx], winner: winnerId };
    setQuarters(newQ);
    updateSemisFromQuarters(newQ);
  };

  const updateSemisFromQuarters = (currentQuarters: BracketMatch[]) => {
    // S1 vem de Q1 e Q2. S2 vem de Q3 e Q4.
    const newS = [...semis];
    newS[0] = { p1: currentQuarters[0].winner, p2: currentQuarters[1].winner, winner: null };
    newS[1] = { p1: currentQuarters[2].winner, p2: currentQuarters[3].winner, winner: null };
    setSemis(newS);
    setFinal({ p1: null, p2: null, winner: null });
  };

  const handleSemiWinner = (matchIdx: number, winnerId: string | null) => {
    const newS = [...semis];
    newS[matchIdx] = { ...newS[matchIdx], winner: winnerId };
    setSemis(newS);
    updateFinalFromSemis(newS);
  };

  const updateFinalFromSemis = (currentSemis: BracketMatch[]) => {
    setFinal({ p1: currentSemis[0].winner, p2: currentSemis[1].winner, winner: null });
  };

  const handleFinalWinner = (winnerId: string | null) => {
    setFinal({ ...final, winner: winnerId });
  };

  // --- CÁLCULO DE RANKING (A MÁGICA DO BACKEND) ---

  const calculateRankingFromBracket = (): Record<number, string> => {
    const r: Record<number, string> = {};
    
    // 1º Lugar: Vencedor da Final
    const championId = final.winner;
    if (!championId) return {}; 
    r[1] = championId;

    // 2º Lugar: Perdedor da Final
    const viceId = final.p1 === championId ? final.p2 : final.p1;
    if (viceId) r[2] = viceId;

    // 3º e 4º Lugar: Regra Específica
    // 3º é quem perdeu na semi para o Campeão
    // 4º é quem perdeu na semi para o Vice
    
    // Descobrir qual semi-final produziu o campeão
    let semiOfChampion = -1;
    if (semis[0].winner === championId) semiOfChampion = 0;
    else if (semis[1].winner === championId) semiOfChampion = 1;

    if (semiOfChampion !== -1) {
      // O perdedor desta semi é o 3º lugar
      const sMatch = semis[semiOfChampion];
      const thirdPlaceId = sMatch.p1 === championId ? sMatch.p2 : sMatch.p1;
      if (thirdPlaceId) r[3] = thirdPlaceId;

      // O perdedor da OUTRA semi é o 4º lugar
      const otherSemiIdx = semiOfChampion === 0 ? 1 : 0;
      const otherSMatch = semis[otherSemiIdx];
      // Quem ganhou a outra semi foi o vice, então pegamos o perdedor
      const fourthPlaceId = otherSMatch.p1 === viceId ? otherSMatch.p2 : otherSMatch.p1;
      if (fourthPlaceId) r[4] = fourthPlaceId;
    }

    // 5º ao 8º: Perdedores das Quartas (Ordem arbitrária baseada na chave para garantir pontos)
    let pos = 5;
    quarters.forEach(q => {
      if (q.winner && q.p1 && q.p2) {
        const loser = q.winner === q.p1 ? q.p2 : q.p1;
        r[pos] = loser;
        pos++;
      }
    });

    return r;
  };

  // --- SALVAMENTO ---

  const save = () => {
    if (!selMod) return;
    
    let finalRanking = rankings;

    // Se estiver no modo Bracket, calcula o ranking antes de salvar
    if (inputMode === 'bracket') {
      if (!final.winner) {
        alert("Defina o campeão na final antes de salvar.");
        return;
      }
      finalRanking = calculateRankingFromBracket();
    }

    const db = getDb();
    const existingIdx = db.results.findIndex(r => r.competitionId === comp.id && r.modalityId === selMod);
    
    const newResult: Result = { 
      id: existingIdx >= 0 ? db.results[existingIdx].id : Math.random().toString(),
      competitionId: comp.id, 
      modalityId: selMod, 
      ranking: finalRanking 
    };
    
    if (existingIdx >= 0) {
      db.results[existingIdx] = newResult;
    } else {
      db.results.push(newResult);
    }

    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    
    alert('Resultado salvo com sucesso!');
    loadData();
    // Reset visual
    if (inputMode === 'bracket') resetBracket();
    else setRankings({});
  };

  const handleEdit = (result: Result) => {
    setSelMod(result.modalityId);
    // Ao editar um resultado antigo, voltamos para o modo manual por segurança, 
    // pois não salvamos o histórico do chaveamento, apenas o ranking final.
    setInputMode('manual');
    setRankings(result.ranking);
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

  // Renderizadores de Chaveamento
  const RenderTeamBox = ({ athId, isWinner, onClick, placeholder }: { athId: string | null, isWinner: boolean, onClick: () => void, placeholder: string }) => {
    const ath = athId ? aths.find(a => a.id === athId) : null;
    return (
      <div 
        onClick={onClick}
        className={`
          border rounded px-2 py-1 text-xs cursor-pointer select-none transition
          ${!athId ? 'bg-gray-100 text-gray-400 border-dashed' : ''}
          ${isWinner ? 'bg-green-100 border-green-500 font-bold text-green-900 shadow-sm transform scale-105' : 'bg-white hover:bg-gray-50'}
        `}
      >
        {ath ? ath.name : placeholder}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* COLUNA DA ESQUERDA: FORMULÁRIO */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded shadow border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-700">Lançar / Editar Resultado</h3>
          
          <label className="block text-sm font-bold text-gray-500 mb-2">Selecione a Modalidade</label>
          <select 
            className="w-full border p-3 mb-4 rounded bg-white text-gray-900 focus:ring-2 focus:ring-lobo-primary focus:outline-none" 
            value={selMod} 
            onChange={e => { 
              setSelMod(e.target.value); 
              const existing = resultsList.find(r => r.modalityId === e.target.value);
              if (existing) {
                setRankings(existing.ranking);
                setInputMode('manual'); // Força manual ao carregar existente
              } else {
                setRankings({});
                resetBracket();
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

          {selMod && isCollective(selMod) && (
            <div className="flex gap-4 mb-6 bg-gray-50 p-2 rounded justify-center">
              <label className={`cursor-pointer px-4 py-2 rounded text-sm font-bold transition ${inputMode === 'manual' ? 'bg-white shadow text-lobo-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                <input type="radio" name="mode" className="hidden" checked={inputMode === 'manual'} onChange={() => setInputMode('manual')} />
                📝 Lista Manual
              </label>
              <label className={`cursor-pointer px-4 py-2 rounded text-sm font-bold transition ${inputMode === 'bracket' ? 'bg-white shadow text-lobo-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                <input type="radio" name="mode" className="hidden" checked={inputMode === 'bracket'} onChange={() => setInputMode('bracket')} />
                🏆 Chaveamento
              </label>
            </div>
          )}

          {selMod ? (
            <>
              {/* MODO MANUAL */}
              {inputMode === 'manual' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded border border-gray-200 animate-fade-in">
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
                </div>
              )}

              {/* MODO CHAVEAMENTO */}
              {inputMode === 'bracket' && (
                <div className="bg-slate-50 p-2 rounded border border-slate-200 overflow-x-auto">
                  <div className="min-w-[500px] flex justify-between gap-4">
                    {/* QUARTAS */}
                    <div className="flex flex-col justify-around space-y-4 w-1/3">
                      <div className="text-center text-xs font-bold text-gray-400 mb-2">QUARTAS</div>
                      {quarters.map((q, idx) => (
                        <div key={idx} className="flex flex-col gap-1 bg-white p-2 rounded border shadow-sm relative">
                          <div className="flex justify-between items-center">
                            <select 
                              className="text-xs border rounded max-w-[100px] bg-white text-gray-900" 
                              value={q.p1 || ''} 
                              onChange={(e) => handleQuarterSelect(idx, 'p1', e.target.value)}
                            >
                              <option value="">Time A</option>
                              {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <button onClick={() => q.p1 && handleQuarterWinner(idx, q.p1)} className={`w-4 h-4 rounded-full ${q.winner === q.p1 ? 'bg-green-500' : 'bg-gray-200'}`}></button>
                          </div>
                          <div className="flex justify-between items-center">
                            <select 
                              className="text-xs border rounded max-w-[100px] bg-white text-gray-900" 
                              value={q.p2 || ''} 
                              onChange={(e) => handleQuarterSelect(idx, 'p2', e.target.value)}
                            >
                              <option value="">Time B</option>
                              {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <button onClick={() => q.p2 && handleQuarterWinner(idx, q.p2)} className={`w-4 h-4 rounded-full ${q.winner === q.p2 ? 'bg-green-500' : 'bg-gray-200'}`}></button>
                          </div>
                          {/* Linhas de conexão (Cosmético) */}
                          <div className={`absolute -right-4 top-1/2 w-4 h-[1px] bg-gray-300`}></div>
                        </div>
                      ))}
                    </div>

                    {/* SEMIS */}
                    <div className="flex flex-col justify-around w-1/3 py-8">
                       <div className="text-center text-xs font-bold text-gray-400 mb-2">SEMIS</div>
                       {semis.map((s, idx) => (
                         <div key={idx} className="flex flex-col gap-2 bg-white p-2 rounded border shadow-sm relative">
                            <RenderTeamBox athId={s.p1} isWinner={s.winner === s.p1 && !!s.p1} onClick={() => s.p1 && handleSemiWinner(idx, s.p1)} placeholder="Venc. Q" />
                            <div className="text-center text-[10px] text-gray-400">vs</div>
                            <RenderTeamBox athId={s.p2} isWinner={s.winner === s.p2 && !!s.p2} onClick={() => s.p2 && handleSemiWinner(idx, s.p2)} placeholder="Venc. Q" />
                            <div className={`absolute -right-4 top-1/2 w-4 h-[1px] bg-gray-300`}></div>
                            <div className={`absolute -left-4 top-1/2 w-4 h-[1px] bg-gray-300`}></div>
                         </div>
                       ))}
                    </div>

                    {/* FINAL */}
                    <div className="flex flex-col justify-center w-1/3 py-16">
                      <div className="text-center text-xs font-bold text-amber-500 mb-2">🏆 FINAL 🏆</div>
                      <div className="flex flex-col gap-2 bg-yellow-50 p-3 rounded border border-yellow-200 shadow-md relative">
                          <RenderTeamBox athId={final.p1} isWinner={final.winner === final.p1 && !!final.p1} onClick={() => final.p1 && handleFinalWinner(final.p1)} placeholder="Finalista" />
                          <div className="text-center text-xs text-gray-400 font-bold">VS</div>
                          <RenderTeamBox athId={final.p2} isWinner={final.winner === final.p2 && !!final.p2} onClick={() => final.p2 && handleFinalWinner(final.p2)} placeholder="Finalista" />
                          <div className={`absolute -left-4 top-1/2 w-4 h-[1px] bg-gray-300`}></div>
                      </div>
                      {final.winner && (
                         <div className="mt-4 text-center">
                            <div className="text-xs text-gray-500">Campeão:</div>
                            <div className="font-bold text-green-700">{aths.find(a => a.id === final.winner)?.name}</div>
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 text-center">* Clique no nome para avançar o vencedor. O sistema calculará 3º lugar baseado em quem perdeu para o campeão.</div>
                </div>
              )}

              <button 
                onClick={save} 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded font-bold text-lg shadow mt-6 transition transform active:scale-95"
              >
                SALVAR RESULTADO
              </button>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border-dashed border-2 border-gray-200">
              Selecione uma modalidade acima para começar.
            </div>
          )}
        </div>
      </div>

      {/* COLUNA DA DIREITA: FEED */}
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
