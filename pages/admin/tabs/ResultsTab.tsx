
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, deleteItem } from '../../../services/storageService';
import { Competition, Modality, Athletic, Result } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ChevronRight, 
  RotateCcw, 
  Save, 
  Layout, 
  List as ListIcon, 
  Search,
  CheckCircle2,
  Medal,
  Award,
  ChevronDown,
  Edit2,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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
  const [inputMode, setInputMode] = useState<'manual' | 'bracket'>('manual');

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
    setAths(db.athletics.filter(a => a.competitionId === comp.id));
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

  const handleQuarterSelect = (matchIdx: number, slot: 'p1' | 'p2', athId: string) => {
    const newQ = [...quarters];
    newQ[matchIdx] = { ...newQ[matchIdx], [slot]: athId, winner: null };
    setQuarters(newQ);
    updateSemisFromQuarters(newQ);
  };

  const handleQuarterWinner = (matchIdx: number, winnerId: string | null) => {
    const newQ = [...quarters];
    newQ[matchIdx] = { ...newQ[matchIdx], winner: winnerId };
    setQuarters(newQ);
    updateSemisFromQuarters(newQ);
  };

  const updateSemisFromQuarters = (currentQuarters: BracketMatch[]) => {
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

  const calculateRankingFromBracket = (): Record<number, string> => {
    const r: Record<number, string> = {};
    const championId = final.winner;
    if (!championId) return {}; 
    r[1] = championId;
    const viceId = final.p1 === championId ? final.p2 : final.p1;
    if (viceId) r[2] = viceId;
    let semiOfChampion = -1;
    if (semis[0].winner === championId) semiOfChampion = 0;
    else if (semis[1].winner === championId) semiOfChampion = 1;
    if (semiOfChampion !== -1) {
      const sMatch = semis[semiOfChampion];
      const thirdPlaceId = sMatch.p1 === championId ? sMatch.p2 : sMatch.p1;
      if (thirdPlaceId) r[3] = thirdPlaceId;
      const otherSemiIdx = semiOfChampion === 0 ? 1 : 0;
      const otherSMatch = semis[otherSemiIdx];
      const fourthPlaceId = otherSMatch.p1 === viceId ? otherSMatch.p2 : otherSMatch.p1;
      if (fourthPlaceId) r[4] = fourthPlaceId;
    }
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

  const save = () => {
    if (!selMod) return;
    let finalRanking = rankings;
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
      id: existingIdx >= 0 ? db.results[existingIdx].id : Math.random().toString(36).substr(2, 9),
      competitionId: comp.id, 
      modalityId: selMod, 
      ranking: finalRanking 
    };
    if (existingIdx >= 0) db.results[existingIdx] = newResult;
    else db.results.push(newResult);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    loadData();
    if (inputMode === 'bracket') resetBracket();
    else setRankings({});
  };

  const deleteResult = async (id: string) => {
    if (!confirm('Deseja excluir este resultado permanentemente?')) return;
    try {
      await deleteItem('results', id);
      loadData();
    } catch (err) {
      alert('Erro ao excluir resultado.');
    }
  };

  const handleEdit = (result: Result) => {
    setSelMod(result.modalityId);
    setInputMode('manual');
    setRankings(result.ranking);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getModalityName = (id: string) => {
    const m = mods.find(m => m.id === id);
    if (!m) return 'Desconhecida';
    return m.name;
  };

  const getWinnerName = (result: Result) => {
    const winnerId = result.ranking[1];
    if (!winnerId) return 'Sem campeão';
    const winner = aths.find(a => a.id === winnerId);
    return winner?.name || '---';
  };

  const RenderTeamBox = ({ 
    athId, 
    isWinner, 
    onClick, 
    placeholder,
    className 
  }: { 
    athId: string | null, 
    isWinner: boolean, 
    onClick: () => void, 
    placeholder: string,
    className?: string
  }) => {
    const ath = athId ? aths.find(a => a.id === athId) : null;
    return (
      <motion.div 
        whileHover={{ x: 2 }}
        onClick={onClick}
        className={cn(
          "relative group border rounded-xl px-3 py-2 text-xs cursor-pointer select-none transition-all duration-300 shadow-sm",
          !athId ? "bg-zinc-50 text-zinc-400 border-dashed border-zinc-300" : "bg-white border-zinc-200 hover:border-zinc-400",
          isWinner && "bg-green-50 border-green-500 ring-1 ring-green-500 text-green-900 font-black",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span className="truncate max-w-[120px]">{ath ? ath.name : placeholder}</span>
          {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-1" />}
        </div>
        {isWinner && (
          <div className="absolute -top-1 -right-1">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500 w-2 h-2 rounded-full border border-white" />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Editor Area */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-lobo-primary/10 rounded-xl text-lobo-primary">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Gestão de Resultados</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Lançamento por modalidade</p>
              </div>
            </div>
            
            {selMod && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setSelMod(''); setRankings({}); resetBracket(); }}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 flex items-center gap-1 bg-zinc-50 px-3 py-1.5 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </motion.button>
            )}
          </header>
          
          <div className="space-y-6">
            <div className="relative group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Modalidade Alvo</label>
              <div className="relative">
                <select 
                  className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none appearance-none cursor-pointer group-hover:bg-zinc-100 transition-colors" 
                  value={selMod} 
                  onChange={e => { 
                    setSelMod(e.target.value); 
                    const existing = resultsList.find(r => r.modalityId === e.target.value);
                    if (existing) {
                      setRankings(existing.ranking);
                      setInputMode('manual');
                    } else {
                      setRankings({});
                      resetBracket();
                    }
                  }}
                >
                  <option value="">Selecione uma modalidade para gerenciar</option>
                  {mods.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.gender}) {resultsList.some(r => r.modalityId === m.id) ? '✓' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selMod && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  {isCollective(selMod) && (
                    <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                      <button 
                        onClick={() => setInputMode('manual')}
                        className={cn(
                          "flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-bold transition-all",
                          inputMode === 'manual' ? "bg-white text-lobo-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        <ListIcon className="w-4 h-4" />
                        <span>Lista Direta</span>
                      </button>
                      <button 
                        onClick={() => setInputMode('bracket')}
                        className={cn(
                          "flex items-center space-x-2 px-6 py-2 rounded-lg text-xs font-bold transition-all",
                          inputMode === 'bracket' ? "bg-white text-lobo-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        <Layout className="w-4 h-4" />
                        <span>Chaveamento</span>
                      </button>
                    </div>
                  )}

                  {inputMode === 'manual' ? (
                    <motion.div 
                      layout
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200"
                    >
                      {[1,2,3,4,5,6,7,8].map(r => (
                        <div key={r} className="flex items-center space-x-3 group">
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm border shadow-sm",
                            r === 1 && "bg-amber-500 text-white border-amber-600",
                            r === 2 && "bg-zinc-200 text-zinc-600 border-zinc-300",
                            r === 3 && "bg-orange-700 text-white border-orange-800",
                            r > 3 && "bg-white text-zinc-400 border-zinc-200"
                          )}>
                            {r}º
                          </div>
                          <div className="relative flex-grow">
                            <select 
                              className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none appearance-none cursor-pointer transition-all" 
                              value={rankings[r] || ''} 
                              onChange={e => setRankings({...rankings, [r]: e.target.value})}
                            >
                              <option value="">Selecione...</option>
                              {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      layout
                      className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 overflow-x-auto relative"
                    >
                      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                      
                      <div className="min-w-[800px] flex justify-between gap-12 relative z-10">
                        {/* QUARTAS */}
                        <div className="flex flex-col justify-around gap-8 w-64">
                          <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] text-center border-b border-zinc-800 pb-2 mb-4">Quartas de Final</h4>
                          {quarters.map((q, idx) => (
                            <div key={idx} className="relative">
                              <div className="flex flex-col gap-1.5 p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-xl backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                  <select 
                                    className="bg-zinc-900 text-white text-[10px] font-bold border border-zinc-700 rounded-lg px-2 py-1 flex-grow outline-none focus:border-lobo-primary transition-colors"
                                    value={q.p1 || ''} 
                                    onChange={(e) => handleQuarterSelect(idx, 'p1', e.target.value)}
                                  >
                                    <option value="">Time A</option>
                                    {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>
                                  <button 
                                    onClick={() => q.p1 && handleQuarterWinner(idx, q.p1)}
                                    className={cn(
                                      "w-5 h-5 rounded-lg border border-zinc-600 flex items-center justify-center transition-all",
                                      q.winner === q.p1 ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-zinc-950 hover:border-zinc-500"
                                    )}
                                  >
                                    <Trophy className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select 
                                    className="bg-zinc-900 text-white text-[10px] font-bold border border-zinc-700 rounded-lg px-2 py-1 flex-grow outline-none focus:border-lobo-primary transition-colors"
                                    value={q.p2 || ''} 
                                    onChange={(e) => handleQuarterSelect(idx, 'p2', e.target.value)}
                                  >
                                    <option value="">Time B</option>
                                    {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>
                                  <button 
                                    onClick={() => q.p2 && handleQuarterWinner(idx, q.p2)}
                                    className={cn(
                                      "w-5 h-5 rounded-lg border border-zinc-600 flex items-center justify-center transition-all",
                                      q.winner === q.p2 ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-zinc-950 hover:border-zinc-500"
                                    )}
                                  >
                                    <Trophy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="absolute left-full top-1/2 w-6 h-px bg-zinc-700 -translate-y-px" />
                            </div>
                          ))}
                        </div>

                        {/* SEMIS */}
                        <div className="flex flex-col justify-around gap-16 w-64 pt-12">
                           <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] text-center border-b border-zinc-800 pb-2 mb-4">Semifinais</h4>
                           {semis.map((s, idx) => (
                             <div key={idx} className="relative">
                               <div className="absolute right-full top-1/2 w-6 h-px bg-zinc-700 -translate-y-px" />
                               <div className="flex flex-col gap-3 p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700 shadow-2xl">
                                  <RenderTeamBox 
                                    athId={s.p1} 
                                    isWinner={s.winner === s.p1 && !!s.p1} 
                                    onClick={() => s.p1 && handleSemiWinner(idx, s.p1)} 
                                    placeholder="Vencedor Q" 
                                    className="bg-zinc-900 border-zinc-700 text-zinc-300"
                                  />
                                  <div className="flex items-center gap-3 px-2">
                                    <div className="h-px flex-grow bg-zinc-700 opacity-30" />
                                    <span className="text-[8px] font-black text-zinc-500 uppercase">VS</span>
                                    <div className="h-px flex-grow bg-zinc-700 opacity-30" />
                                  </div>
                                  <RenderTeamBox 
                                    athId={s.p2} 
                                    isWinner={s.winner === s.p2 && !!s.p2} 
                                    onClick={() => s.p2 && handleSemiWinner(idx, s.p2)} 
                                    placeholder="Vencedor Q" 
                                    className="bg-zinc-900 border-zinc-700 text-zinc-300"
                                  />
                               </div>
                               <div className="absolute left-full top-1/2 w-6 h-px bg-zinc-700 -translate-y-px" />
                             </div>
                           ))}
                        </div>

                        {/* FINAL */}
                        <div className="flex flex-col justify-center gap-8 w-64">
                          <div className="text-center">
                            <div className="inline-flex items-center space-x-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 mb-6">
                              <Trophy className="w-4 h-4 text-amber-500" />
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Grande Final</span>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute right-full top-1/2 w-6 h-px bg-zinc-700 -translate-y-px" />
                            <div className="bg-gradient-to-b from-amber-500/10 to-transparent p-6 rounded-3xl border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.05)] flex flex-col gap-4">
                                <RenderTeamBox 
                                  athId={final.p1} 
                                  isWinner={final.winner === final.p1 && !!final.p1} 
                                  onClick={() => final.p1 && handleFinalWinner(final.p1)} 
                                  placeholder="Finalista A" 
                                  className="bg-zinc-950 border-amber-900/50 text-zinc-100"
                                />
                                <div className="text-center text-[10px] font-black text-amber-500/50 uppercase tracking-widest italic">O Campeão</div>
                                <RenderTeamBox 
                                  athId={final.p2} 
                                  isWinner={final.winner === final.p2 && !!final.p2} 
                                  onClick={() => final.p2 && handleFinalWinner(final.p2)} 
                                  placeholder="Finalista B" 
                                  className="bg-zinc-950 border-amber-900/50 text-zinc-100"
                                />
                            </div>
                          </div>

                          {final.winner && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-12 text-center p-4 bg-amber-500 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                            >
                              <div className="text-[10px] font-black text-amber-950 uppercase tracking-widest opacity-70">Campeão Absoluto</div>
                              <Award className="w-8 h-8 text-amber-950 mx-auto my-1" />
                              <div className="font-black text-lg text-amber-950 tracking-tight leading-tight">
                                {aths.find(a => a.id === final.winner)?.name}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={save} 
                    className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-zinc-900/20 mt-4 flex items-center justify-center space-x-3 transition-opacity hover:opacity-90"
                  >
                    <Save className="w-6 h-6" />
                    <span>PUBLICAR RESULTADOS</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* History Area */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <section className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 min-h-[400px]">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-zinc-400" />
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Atividade Recente</h3>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{resultsList.length} total</span>
          </header>
          
          <div className="space-y-3">
            {resultsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 opacity-50 grayscale">
                <Search className="w-12 h-12 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro</p>
              </div>
            ) : (
              resultsList.slice().reverse().map(r => (
                <motion.div 
                  key={r.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleEdit(r)}
                  className={cn(
                    "bg-white p-4 rounded-xl border border-zinc-100 shadow-sm cursor-pointer group transition-all duration-300",
                    selMod === r.modalityId ? "ring-2 ring-lobo-primary ring-offset-2" : "hover:border-zinc-300 hover:shadow-md"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Resultado Final</span>
                      <span className="font-black text-sm text-zinc-900 tracking-tight">{getModalityName(r.modalityId)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-zinc-100 p-1.5 rounded-lg text-zinc-400 group-hover:bg-lobo-primary group-hover:text-white transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteResult(r.id); }}
                        className="bg-red-50 p-1.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2 border-t border-zinc-50">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-zinc-700 truncate">{getWinnerName(r)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 grayscale opacity-50 select-none">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Consistência de Dados</h4>
          </div>
          <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
            Ao salvar um resultado, a pontuação é recalculada instantaneamente para todas as atléticas citadas no ranking desta modalidade.
          </p>
        </div>
      </div>
    </div>
  );
};
