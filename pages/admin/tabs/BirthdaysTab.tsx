import React, { useState, useEffect } from 'react';
import { getDb, updateItem, deleteItem } from '../../../services/storageService';
import { BirthdayMember } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Cake, UserPlus, Trash2, Calendar, User, Briefcase, Search, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const BirthdaysTab: React.FC = () => {
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setMembers(getDb().birthdays || []);
  };

  useEffect(() => {
    load();
    window.addEventListener('lobo-db-sync', load);
    return () => window.removeEventListener('lobo-db-sync', load);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !date) return;

    const newMember: BirthdayMember = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      birthDate: date,
    };

    try {
      await updateItem('birthdays', newMember);
      setName('');
      setRole('');
      setDate('');
      load();
    } catch (err) {
      alert('Erro ao salvar aniversariante.');
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm('Remover este membro da lista de aniversariantes?')) return;
    try {
      await deleteItem('birthdays', id);
      load();
    } catch (err) {
      alert('Erro ao apagar membro. Tente novamente.');
    }
  };

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.role.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    // Basic sort by month/day for upcoming
    const dateA = new Date(a.birthDate);
    const dateB = new Date(b.birthDate);
    return dateA.getMonth() - dateB.getMonth() || dateA.getDate() - dateB.getDate();
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Registration Form */}
      <div className="lg:col-span-4 sticky top-24">
        <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
            <Cake className="w-32 h-32 rotate-12" />
          </div>

          <header className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="p-2.5 bg-lobo-primary rounded-xl text-white shadow-lg shadow-lobo-primary/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-zinc-900 tracking-tight">Novo Aniversariante</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Diretoria & Membros</p>
            </div>
          </header>

          <form onSubmit={handleAdd} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-lobo-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome do membro"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Cargo / Função</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-lobo-primary transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none transition-all"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Ex: Presidente, Diretor Geral"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Data de Nascimento</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-lobo-primary transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <input 
                  type="date"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none transition-all"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="w-full bg-lobo-primary text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-lobo-primary/20 hover:bg-lobo-primary/90 transition-all active:scale-95 flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>CADASTRAR MEMBRO</span>
            </button>
          </form>
        </section>
      </div>

      {/* Members List */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Calendário de Aniversários</h3>
            <span className="text-[10px] font-bold text-zinc-400">{members.length} membros registrados</span>
          </div>

          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-lobo-primary transition-colors" />
            <input 
              className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all shadow-sm"
              placeholder="Buscar membro ou cargo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, idx) => {
              const bDate = new Date(m.birthDate);
              const day = bDate.getDate() + 1; // Correction for Date object
              const month = bDate.toLocaleString('pt-BR', { month: 'long' });
              
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group bg-white border border-zinc-100 rounded-2xl p-4 flex items-center justify-between hover:border-lobo-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-lobo-primary/5 border border-lobo-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-black text-lobo-primary leading-none">{day}</span>
                      <span className="text-[8px] font-black text-lobo-primary/40 uppercase leading-none mt-0.5">{month.slice(0, 3)}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 tracking-tight">{m.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.role}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeMember(m.id)}
                    className="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl opacity-50">
              <Cake className="w-10 h-10 text-zinc-300 mb-3" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nenhum aniversariante encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
