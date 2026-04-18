import React, { useState, useEffect } from 'react';
import { getDb, saveDb, createCompetition } from '../../../services/storageService';
import { Competition } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trophy, Trash2, CheckCircle2, Calendar, Target, Flag } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const CompetitionsTab: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [list, setList] = useState<Competition[]>([]);
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const load = () => setList(getDb().competitions);
  useEffect(() => { load(); }, []);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCompetition(name, year);
    window.dispatchEvent(new Event('storage'));
    load(); 
    onUpdate(); 
    setName('');
  };

  const remove = (id: string) => {
    if (!confirm('Excluir esta competição apagará todas as modalidades e resultados vinculados. Continuar?')) return;
    const db = getDb();
    db.competitions = db.competitions.filter(c => c.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setList(prev => prev.filter(c => c.id !== id));
    onUpdate();
  };

  const setActive = (id: string) => {
    const db = getDb();
    db.competitions.forEach(c => c.isActive = c.id === id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load(); 
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Creation Sidebar */}
      <div className="xl:col-span-4 sticky top-24">
        <form onSubmit={add} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-lobo-primary/10 rounded-lg text-lobo-primary">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-black text-zinc-900 tracking-tight text-lg">Nova Competição</h3>
          </div>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Nome do Evento</label>
            <input 
              className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none transition-all placeholder:text-zinc-300" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Interatléticas 2025" 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Ano de Realização</label>
            <input 
              className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none transition-all" 
              type="number" 
              value={year} 
              onChange={e => setYear(Number(e.target.value))} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-black text-sm shadow-xl shadow-zinc-900/10 hover:bg-zinc-800 transition-all active:scale-95"
          >
            CRIAR COMPETIÇÃO
          </button>
        </form>

        <div className="mt-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative overflow-hidden group">
          <Target className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-200/50 group-hover:scale-110 transition-transform duration-500" />
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 relative z-10">Diretrizes</h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed relative z-10">
            Apenas uma competição pode estar ativa por vez. Ao ativar uma nova, a anterior deixará de receber atualizações automáticas no painel.
          </p>
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="xl:col-span-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Histórico de Eventos</h3>
          <span className="text-[10px] font-bold text-zinc-400">{list.length} registros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {list.map((c, idx) => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "relative p-5 rounded-2xl border group transition-all duration-300",
                  c.isActive 
                    ? "bg-white border-lobo-primary shadow-[0_10px_30px_rgba(227,135,2,0.1)] ring-1 ring-lobo-primary" 
                    : "bg-white border-zinc-100 hover:border-zinc-300 shadow-sm"
                )}
              >
                {c.isActive && (
                  <div className="absolute top-4 right-4 animate-bounce">
                    <CheckCircle2 className="w-5 h-5 text-lobo-primary" />
                  </div>
                )}

                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 text-zinc-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.year}</span>
                  </div>

                  <h4 className="text-lg font-black text-zinc-900 tracking-tight mb-6">
                    {c.name}
                  </h4>

                  <div className="mt-auto flex items-center space-x-2 pt-4 border-t border-zinc-50">
                    {!c.isActive ? (
                      <button 
                        onClick={() => setActive(c.id)}
                        className="flex-grow flex items-center justify-center space-x-2 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Ativar</span>
                      </button>
                    ) : (
                      <div className="flex-grow flex items-center justify-center space-x-2 bg-lobo-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <span>Gestão Ativa</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => remove(c.id)}
                      className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
