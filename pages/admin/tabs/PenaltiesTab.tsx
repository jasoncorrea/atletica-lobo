import React, { useState, useEffect } from 'react';
import { getDb, addItem, deleteItem } from '../../../services/storageService';
import { Competition, Athletic, Penalty } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, ShieldAlert, History, Search, Scale, ChevronDown, Flag } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const PenaltiesTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [aths, setAths] = useState<Athletic[]>([]);
  const [pens, setPens] = useState<Penalty[]>([]);
  const [target, setTarget] = useState('');
  const [pts, setPts] = useState(10);
  const [reason, setReason] = useState('');

  const load = () => {
    const db = getDb();
    setAths(db.athletics.filter(a => a.competitionId === comp.id));
    setPens(db.penalties.filter(p => p.competitionId === comp.id));
  };
  useEffect(() => { 
    const refresh = () => {
      const db = getDb();
      setAths(db.athletics.filter(a => a.competitionId === comp.id));
      setPens(db.penalties.filter(p => p.competitionId === comp.id));
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [comp.id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    
    await addItem('penalties', { 
      competitionId: comp.id, 
      athleticId: target, 
      points: pts, 
      reason, 
      date: Date.now() 
    });
    
    load(); 
    setReason('');
  };

  const remove = async (id: string) => {
    // Removed confirm as it can be unreliable in iframes
    await deleteItem('penalties', id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Danger Form */}
      <div className="lg:col-span-4 sticky top-24">
        <form onSubmit={add} className="bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-lg shadow-red-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-red-900 tracking-tight text-lg leading-tight">Punir Atlética</h3>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Atenção: Ação Irreversível</p>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="relative group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-red-900/50 mb-1.5 ml-1">Atlética Infratora</label>
              <div className="relative">
                <select 
                  className="w-full bg-white text-zinc-900 border border-red-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none appearance-none cursor-pointer" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                  required
                >
                  <option value="">Selecione...</option>
                  {aths.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-red-900/50 mb-1.5 ml-1">Pontos Perdidos</label>
                <div className="relative">
                  <input 
                    className="w-full bg-white text-zinc-900 border border-red-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none" 
                    type="number" 
                    value={pts} 
                    onChange={e => setPts(Number(e.target.value))} 
                    placeholder="0" 
                  />
                  <Scale className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-200 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-red-100/50 p-2 rounded-xl text-[10px] font-black text-red-600 text-center uppercase tracking-widest border border-red-200">
                  Desconto Real
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-red-900/50 mb-1.5 ml-1">Motivo / Infração</label>
              <textarea 
                className="w-full bg-white text-zinc-900 border border-red-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px] resize-none" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Descreva a infração cometida..." 
                required
              />
            </div>

            <button className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>APLICAR PUNIÇÃO</span>
            </button>
          </div>
        </form>

        <div className="mt-6 p-6 bg-lobo-dark rounded-2xl border border-zinc-800 relative group overflow-hidden">
          <History className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-700 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Compliance</h4>
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed relative z-10">
            Todas as punições são registradas com data e hora. A exclusão de uma punição restaura imediatamente os pontos no ranking público.
          </p>
        </div>
      </div>

      {/* Penalty History */}
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Histórico de Infrações</h3>
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{pens.length} ocorrências</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {pens.slice().reverse().map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white border border-zinc-100 rounded-2xl p-5 flex items-start justify-between hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-red-50 w-12 h-12 rounded-xl flex items-center justify-center border border-red-100 flex-shrink-0">
                    <span className="font-black text-red-600 text-sm">-{p.points}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900 tracking-tight text-base mb-1">
                      {aths.find(a => a.id === p.athleticId)?.name || 'Atlética Desconhecida'}
                    </h4>
                    <p className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                      <Flag className="w-3 h-3" />
                      {p.reason}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                      <span>{new Date(p.date || Date.now()).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>{new Date(p.date || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <button 
                    onClick={() => remove(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 bg-zinc-50 text-zinc-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pens.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-emerald-50/30 border border-dashed border-emerald-100 rounded-3xl text-emerald-400">
              <History className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">Nenhuma punição registrada. Fair Play!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
