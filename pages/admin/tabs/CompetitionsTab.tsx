import React, { useState, useEffect } from 'react';
import { getDb, updateItem, deleteItem, createCompetition, saveItems } from '../../../services/storageService';
import { Competition } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trophy, Trash2, CheckCircle2, Calendar, Target, Flag, Sparkles, LayoutGrid, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const CompetitionsTab: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [list, setList] = useState<Competition[]>([]);
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const load = () => {
    const competitions = getDb().competitions;
    const unique = Array.from(new Map(competitions.map(c => [c.id, c])).values());
    setList(unique);
  };
  useEffect(() => { 
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCompetition(name, year);
    window.dispatchEvent(new Event('storage'));
    load(); 
    onUpdate(); 
    setName('');
  };

  const remove = async (id: string) => {
    // Removed confirm as it can be unreliable in iframes
    await deleteItem('competitions', id);
    onUpdate();
  };

  const setActive = async (id: string) => {
    const current = getDb().competitions;
    const updates = current.map(c => ({
      ...c,
      isActive: c.id === id
    }));
    
    // We update the whole collection because we need to clear other active states
    await saveItems('competitions', updates);
    load(); 
    onUpdate();
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Welcome & Stats */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 italic">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Event Engine v2.0</span>
          </div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Arena de Competições</h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Orquestração de Torneios e Interatléticas</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl border border-zinc-100 shadow-sm text-right">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Registradas</p>
             <p className="text-xl font-black text-zinc-900 leading-none">{list.length}</p>
          </div>
          <div className="bg-lobo-primary px-6 py-4 rounded-3xl shadow-xl shadow-lobo-primary/20 text-lobo-secondary">
             <p className="text-[10px] font-black text-lobo-secondary/60 uppercase tracking-widest leading-none mb-1">Ano Corrente</p>
             <p className="text-xl font-black leading-none">{new Date().getFullYear()}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Creation Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-4 sticky top-28"
        >
          <div className="bg-lobo-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-lobo-secondary rounded-2xl text-lobo-dark">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Nova Competição</h3>
              </div>
              
              <form onSubmit={add} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Nome de Guerra do Evento</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:ring-2 focus:ring-lobo-primary outline-none transition-all placeholder:text-white/20" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ex: INTERLOBOS 2026" 
                    required 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Calendário Esportivo</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:ring-2 focus:ring-lobo-primary outline-none transition-all" 
                      type="number" 
                      value={year} 
                      onChange={e => setYear(Number(e.target.value))} 
                      required 
                    />
                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-lobo-secondary text-lobo-dark py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-lobo-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Confirmar Inclusão
                </button>
              </form>
            </div>
            
            {/* Decoration */}
            <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
              <Trophy className="w-80 h-80 rotate-12" />
            </div>
          </div>

          <div className="mt-8 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex items-start gap-4">
             <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-lobo-secondary" />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-1.5 leading-none">Regra de Ativação</h4>
                <p className="text-[10px] text-zinc-400 font-bold leading-relaxed uppercase tracking-tight">
                   O sistema autoriza apenas UM evento ativo por ciclo. A ativação encerra operações em eventos legados.
                </p>
             </div>
          </div>
        </motion.div>

        {/* Competitions Grid */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5" />
              Arquivos de Batalha
            </h3>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-lobo-primary animate-pulse" />
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Consistência de Dados Ativa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {list.length === 0 && (
                <div className="col-span-full py-40 border-2 border-dashed border-zinc-100 rounded-[3rem] flex flex-col items-center justify-center opacity-30 italic">
                   <Clock className="w-16 h-16 text-zinc-300 mb-6" />
                   <p className="text-sm font-black uppercase tracking-widest">Nenhuma história escrita ainda...</p>
                </div>
              )}
              {[...list].sort((a, b) => b.year - a.year).map((c, idx) => (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "relative p-8 rounded-[2.5rem] border transition-all duration-500 group overflow-hidden",
                    c.isActive 
                      ? "bg-lobo-secondary text-lobo-primary border-lobo-secondary shadow-2xl shadow-lobo-primary/10" 
                      : "bg-white text-zinc-900 border-zinc-200 hover:border-lobo-primary hover:shadow-xl group"
                  )}
                >
                  <div className="relative z-10 flex flex-col h-full space-y-6">
                    <div className="flex items-center justify-between">
                       <div className={cn(
                         "flex items-center gap-2 px-3 py-1.5 rounded-full",
                         c.isActive ? "bg-lobo-primary text-white" : "bg-zinc-100 text-zinc-400"
                       )}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{c.year}</span>
                       </div>
                       {c.isActive && (
                         <div className="flex items-center gap-2 text-lobo-primary">
                            <span className="text-[10px] font-black uppercase tracking-widest">Ativo no Comando</span>
                            <CheckCircle2 className="w-4 h-4 fill-lobo-primary text-lobo-primary" />
                         </div>
                       )}
                    </div>

                    <div className="space-y-1">
                      <h4 className={cn(
                        "text-2xl font-black tracking-tighter uppercase leading-tight",
                        c.isActive ? "text-lobo-primary" : "text-zinc-900 group-hover:text-lobo-primary transition-colors"
                      )}>
                        {c.name}
                      </h4>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        c.isActive ? "text-lobo-primary/40" : "text-zinc-400"
                      )}>
                        Identificador: {c.id.slice(0, 8)}
                      </p>
                    </div>

                    <div className="pt-6 mt-auto">
                      <div className="flex items-center gap-3">
                        {!c.isActive ? (
                          <button 
                            onClick={() => setActive(c.id)}
                            className="flex-grow flex items-center justify-center gap-3 bg-zinc-900 text-white hover:bg-lobo-primary hover:text-zinc-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                          >
                            <Flag className="w-4 h-4" />
                            Assumir Controle
                          </button>
                        ) : (
                          <div className="flex-grow flex items-center justify-center gap-3 bg-lobo-primary text-lobo-secondary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner">
                            <Sparkles className="w-4 h-4 animate-pulse text-lobo-secondary" />
                            Sistema Operacional
                          </div>
                        )}
                        
                        <button 
                          onClick={() => remove(c.id)}
                          className={cn(
                            "w-14 h-14 flex items-center justify-center rounded-2xl transition-all active:scale-90 shadow-lg",
                            c.isActive ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                          )}
                        >
                          <Trash2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decoration cards */}
                  <Trophy className={cn(
                    "absolute -right-10 -bottom-10 w-40 h-40 opacity-[0.03] transition-transform duration-700 group-hover:-translate-y-4 group-hover:rotate-6",
                    c.isActive ? "text-white" : "text-lobo-primary"
                  )} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
