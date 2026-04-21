import React, { useState, useEffect } from 'react';
import { getDb, saveDb, handleImageUpload, deleteItem } from '../../../services/storageService';
import { Athletic, Competition } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Camera, Shield } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  comp: Competition;
}

export const AthleticsTab: React.FC<Props> = ({ comp }) => {
  const [list, setList] = useState<Athletic[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  const load = () => {
    const athletics = getDb().athletics.filter(a => a.competitionId === comp.id);
    setList(athletics);
  };

  useEffect(() => {
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [comp.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const db = getDb();

    if (editingId) {
      const index = db.athletics.findIndex(a => a.id === editingId);
      if (index !== -1) {
        db.athletics[index].name = name;
        saveDb(db);
      }
    } else {
      db.athletics.push({ 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        logoUrl: null,
        competitionId: comp.id
      });
      saveDb(db);
    }
    
    setTimeout(load, 100);
    resetForm();
  };

  const startEditing = (athletic: Athletic) => {
    setName(athletic.name);
    setEditingId(athletic.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const uploadLogo = async (id: string, file: File) => {
    try {
      setIsUploading(id);
      const url = await handleImageUpload(file);
      const db = getDb();
      const ath = db.athletics.find(a => a.id === id);
      if (ath) ath.logoUrl = url;
      saveDb(db);
      window.dispatchEvent(new Event('storage'));
      load();
    } catch { 
      // Ignored
    } finally {
      setIsUploading(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta atlética? Isso pode afetar resultados passados.')) return;
    if (editingId === id) resetForm();
    try {
      await deleteItem('athletics', id);
      load();
    } catch (err) {
      alert('Erro ao apagar atlética.');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Form Sidebar */}
      <div className="xl:col-span-4 sticky top-24">
        <motion.form 
          layout
          onSubmit={handleSubmit} 
          className={cn(
            "p-6 rounded-2xl border transition-all duration-300 shadow-sm",
            editingId ? "bg-amber-50 border-amber-200" : "bg-white border-zinc-200"
          )}
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className={cn(
              "p-2 rounded-lg",
              editingId ? "bg-amber-100 text-amber-600" : "bg-lobo-primary/10 text-lobo-primary"
            )}>
              {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <h3 className="font-black text-zinc-900 tracking-tight">
              {editingId ? 'Editar Atlética' : 'Cadastrar Atlética'}
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">
                Nome da Instituição
              </label>
              <input 
                className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:outline-none transition-all" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Atlética Lobo" 
                required 
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                className={cn(
                  "flex-grow text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95",
                  editingId 
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" 
                    : "bg-lobo-primary hover:bg-orange-600 shadow-lobo-primary/20"
                )}
              >
                {editingId ? 'Salvar Alteração' : 'Adicionar Instituição'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="bg-zinc-200 text-zinc-600 px-4 py-3 rounded-xl font-black hover:bg-zinc-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.form>

        <div className="mt-6 p-6 bg-zinc-900 rounded-2xl text-white overflow-hidden relative grayscale opacity-40 select-none">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-20 h-20 rotate-12" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-50">Dica Lobo</p>
          <p className="text-xs font-medium leading-relaxed">
            Mantenha os nomes curtos e objetivos para uma melhor visualização na tabela de classificação geral.
          </p>
        </div>
      </div>

      {/* List Area */}
      <div className="xl:col-span-8 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest ml-1">Instituições Cadastradas</h3>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">{list.length} unidades</span>
        </div>

        <AnimatePresence mode="popLayout">
          {list.map((a, idx) => (
            <motion.div 
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group relative bg-white border border-zinc-100 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center transition-all duration-300",
                editingId === a.id ? "ring-2 ring-amber-500 border-transparent shadow-lg" : "hover:border-zinc-300 hover:shadow-md"
              )}
            >
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="relative group/photo">
                  {a.logoUrl ? (
                    <img src={a.logoUrl} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-cover border border-zinc-100" />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center">
                      <Shield className="w-5 h-5 text-zinc-300" />
                    </div>
                  )}
                  
                  <label className={cn(
                    "absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover/photo:opacity-100 transition-opacity",
                    isUploading === a.id && "opacity-100"
                  )}>
                    {isUploading === a.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && uploadLogo(a.id, e.target.files[0])} />
                  </label>
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-black text-zinc-900 tracking-tight">{a.name}</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      U-ID: {a.id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4 sm:mt-0 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startEditing(a)} 
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 px-4 py-2.5 rounded-xl transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => remove(a.id)} 
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
