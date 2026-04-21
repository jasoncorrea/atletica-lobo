import React, { useState, useEffect } from 'react';
import { getDb, addItem, deleteItem } from '../../../services/storageService';
import { ShareMember, SharePost, ShareRecord } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  UserPlus, 
  Trash2, 
  Plus, 
  Hash, 
  Link as LinkIcon, 
  FileText,
  User,
  Users,
  Search,
  Sparkles,
  TrendingUp,
  BarChart2,
  Trophy,
  PieChart as PieIcon,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const MarketingTab: React.FC = () => {
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [records, setRecords] = useState<ShareRecord[]>([]);
  
  // Member Form
  const [memberName, setMemberName] = useState('');
  
  // Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postLink, setPostLink] = useState('');

  const load = () => {
    const db = getDb();
    setMembers(db.shareMembers || []);
    setPosts(db.sharePosts || []);
    setRecords(db.shareRecords || []);
  };

  useEffect(() => {
    load();
    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Stats Calculations
  const memberStats = members.map(m => ({
    name: m.name,
    shares: records.filter(r => r.memberId === m.id).length
  })).sort((a, b) => b.shares - a.shares);

  const totalPossibleShares = members.length * posts.length;
  const currentTotalShares = records.length;
  const healthRatio = totalPossibleShares > 0 ? (currentTotalShares / totalPossibleShares) * 100 : 0;

  const topMember = memberStats[0]?.shares > 0 ? memberStats[0] : null;

  const postStats = posts.map(p => ({
    name: p.title.substring(0, 15) + (p.title.length > 15 ? '...' : ''),
    shares: records.filter(r => r.postId === p.id).length
  }));

  const COLORS = ['#E38702', '#1e1b4b', '#ecfdf5', '#f8fafc'];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) return;
    
    await addItem('shareMembers', {
      name: memberName.toUpperCase()
    });
    
    setMemberName('');
    load();
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle) return;
    
    await addItem('sharePosts', {
      title: postTitle.toUpperCase(),
      link: postLink || undefined,
      date: Date.now()
    });
    
    setPostTitle('');
    setPostLink('');
    load();
  };

  const removeMember = async (id: string) => {
    if (!confirm('Deseja remover este membro?')) return;
    await deleteItem('shareMembers', id);
    load();
  };

  const removePost = async (id: string) => {
    if (!confirm('Deseja remover este post?')) return;
    await deleteItem('sharePosts', id);
    load();
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-4">
             <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                <Share2 className="w-7 h-7" />
             </div>
             Engajamento Social
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4">Controle de Compartilhamento e Viralização</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                 <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Checks Totais</p>
                <p className="text-xl font-black text-zinc-900 tabular-nums">{currentTotalShares}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Summary Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Eficiência de Campanha</h4>
            <div className="flex items-end gap-3 mb-4">
              <h3 className="text-5xl font-black text-lobo-primary tracking-tighter">{healthRatio.toFixed(0)}%</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Engajamento Real</p>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${healthRatio}%` }}
                className="h-full bg-lobo-primary shadow-[0_0_15px_rgba(227,135,2,0.6)]" 
              />
            </div>
            <p className="text-[9px] font-bold text-white/20 mt-4 uppercase tracking-widest">
              {currentTotalShares} de {totalPossibleShares} compartilhamentos esperados
            </p>
          </div>
          <TrendingUp className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] text-white rotate-12 transition-transform group-hover:scale-110" />
        </div>

        <div className="lg:col-span-1 bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Top Contribuidor</h4>
            {topMember ? (
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase leading-none">{topMember.name}</h3>
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">{topMember.shares} Shares</p>
              </div>
            ) : (
              <p className="text-xl font-black text-zinc-300 italic">AGUARDANDO...</p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-6">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Liderando o Ranking</span>
          </div>
        </div>

        <div className="lg:col-span-1 bg-cyan-500 p-8 rounded-[2.5rem] shadow-xl shadow-cyan-500/20 text-white flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Canais de Mídia</h4>
              <BarChart2 className="w-5 h-5 text-white/40" />
           </div>
           <div>
              <h3 className="text-4xl font-black tracking-tighter">{posts.length}</h3>
              <p className="text-xs font-bold text-white/60 uppercase mt-1 tracking-widest">Postagens Monitoradas</p>
           </div>
           <div className="pt-6 border-t border-white/10 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Estratégia Lobos 2026</span>
           </div>
        </div>
      </section>

      {/* Analytics Charts */}
      {members.length > 0 && posts.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-lobo-primary" />
              Ranking de Impacto Individual
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberStats} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f8fafc" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '10px' }}
                  />
                  <Bar dataKey="shares" radius={[0, 12, 12, 0]} barSize={24}>
                    {memberStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#E38702' : '#f1f5f9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              Viralização por Conteúdo
            </h3>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postStats}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="shares"
                    >
                      {postStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '10px' }}
                    />
                  </PieChart>
               </ResponsiveContainer>
               <div className="flex flex-wrap justify-center gap-6 mt-4">
                  {postStats.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">{p.name}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Members Management */}
        <section className="space-y-6">
          <div className="bg-zinc-50 border border-zinc-100 rounded-[2.5rem] p-10">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-8 flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-lobo-primary" />
              Recrutamento Fiscal
            </h3>
            <form onSubmit={handleAddMember} className="flex gap-3">
              <div className="relative flex-1">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input 
                  className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all placeholder:text-zinc-300"
                  placeholder="Nome COMPLETO do Fiscal"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                className="bg-zinc-900 text-white px-6 rounded-2xl hover:bg-lobo-primary hover:text-zinc-900 shadow-xl active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </form>
          </div>

          <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
             <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tropa Ativa</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-zinc-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black text-zinc-600">{members.length} Agentes</span>
                </div>
             </div>
             <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {members.map(m => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-8 py-5 flex items-center justify-between group hover:bg-zinc-50/80 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-lobo-primary/10 group-hover:text-lobo-primary transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-zinc-800 uppercase tracking-tighter">{m.name}</span>
                      </div>
                      <button 
                        onClick={() => removeMember(m.id)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
          </div>
        </section>

        {/* Posts Management */}
        <section className="space-y-6">
          <div className="bg-zinc-50 border border-zinc-100 rounded-[2.5rem] p-10">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-8 flex items-center gap-3">
              <FileText className="w-6 h-6 text-cyan-500" />
              Arsenal de Conteúdo
            </h3>
            <form onSubmit={handleAddPost} className="space-y-4">
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input 
                  className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all placeholder:text-zinc-300"
                  placeholder="Título da Campanha / Postagem"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                  <input 
                    className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all placeholder:text-zinc-300"
                    placeholder="URL de Redirecionamento"
                    value={postLink}
                    onChange={e => setPostLink(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-zinc-900 text-white px-6 rounded-2xl hover:bg-cyan-500 shadow-xl active:scale-95 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
             <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Arquivos de Mídia</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-zinc-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                   <span className="text-[9px] font-black text-zinc-600">{posts.length} Ativos</span>
                </div>
             </div>
             <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {posts.map(p => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-8 py-5 flex items-center justify-between group hover:bg-zinc-50/80 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-800 uppercase tracking-tighter">{p.title}</span>
                        {p.link && (
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-1 h-1 rounded-full bg-cyan-500" />
                             <a href={p.link} target="_blank" rel="noreferrer" className="text-[9px] text-cyan-600 font-black uppercase tracking-widest hover:underline">
                               Link de Verificação
                             </a>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removePost(p.id)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};
