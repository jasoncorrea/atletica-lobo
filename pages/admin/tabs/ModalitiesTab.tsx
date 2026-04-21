import React, { useState, useEffect } from 'react';
import { getDb, addItem, deleteItem } from '../../../services/storageService';
import { Competition, Modality } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Trash2, Layers, Search, Ghost, User, UserCheck, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const ModalitiesTab: React.FC<{ comp: Competition }> = ({ comp }) => {
  const [list, setList] = useState<Modality[]>([]);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('M');

  const load = () => setList(getDb().modalities.filter(m => m.competitionId === comp.id));
  useEffect(() => { 
    const refresh = () => setList(getDb().modalities.filter(m => m.competitionId === comp.id));
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [comp.id]);

  const add = async () => {
    if (!name.trim()) return;
    await addItem('modalities', { 
      competitionId: comp.id, 
      name, 
      gender: gender as any, 
      status: 'pending' 
    });
    load(); 
    setName('');
  };

  const remove = async (id: string) => {
    // Removed confirm as it can be unreliable in iframes
    await deleteItem('modalities', id);
  };

  const getGenderMeta = (g: string) => {
    switch (g) {
      case 'M':
        return { label: 'Masculino', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: User };
      case 'F':
        return { label: 'Feminino', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', icon: UserCheck };
      case 'Misto':
        return { label: 'Misto', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Users };
      default:
        return { label: g, color: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-100', icon: Target };
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Creation Area */}
      <div className="xl:col-span-4 sticky top-24">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-2 bg-lobo-dark rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-black text-zinc-900 tracking-tight text-lg">Nova Modalidade</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Modalidade</label>
              <input 
                className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none transition-all" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Futsal, Vôlei..." 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Categoria / Gênero</label>
              <div className="grid grid-cols-3 gap-2">
                {['M', 'F', 'Misto'].map(g => {
                  const meta = getGenderMeta(g);
                  const isActive = gender === g;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                        isActive 
                          ? cn("bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-md", meta.color)
                          : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100"
                      )}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={add}
              className="w-full bg-lobo-dark text-white py-3.5 rounded-xl font-black text-sm shadow-xl shadow-zinc-900/10 hover:bg-zinc-800 transition-all active:scale-95"
            >
              CADASTRAR MODALIDADE
            </button>
          </div>
        </div>

        <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 relative group overflow-hidden">
          <Target className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-200/50 grayscale opacity-20 group-hover:rotate-12 transition-transform duration-700" />
          <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2 relative z-10">Lembrete</h4>
          <p className="text-xs text-amber-800/70 font-medium leading-relaxed relative z-10">
            Cada modalidade criada nesta competição poderá ter seu resultado lançado individualmente para pontuar no ranking geral.
          </p>
        </div>
      </div>

      {/* List Area */}
      <div className="xl:col-span-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Modalidades em {comp.name}</h3>
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{list.length} unidades</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {list.map((m, idx) => {
              const meta = getGenderMeta(m.gender);
              const Icon = meta.icon;
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white border border-zinc-100 rounded-2xl p-4 flex justify-between items-center hover:border-zinc-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2.5 rounded-xl border", meta.bg, meta.border, meta.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-zinc-900 tracking-tight">{m.name}</h4>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", meta.color)}>
                        {meta.label}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => remove(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl text-zinc-400">
            <Ghost className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Sem modalidades vinculadas</p>
          </div>
        )}
      </div>
    </div>
  );
};
