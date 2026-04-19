import React, { useState, useEffect } from 'react';
import { getDb, saveDb, deleteItem } from '../../../services/storageService';
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
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
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

  const COLORS = ['#E38702', '#5a0509', '#fdf6ec', '#cbd5e1'];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) return;
    
    const db = getDb();
    const newMember: ShareMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: memberName
    };
    
    db.shareMembers = [...(db.shareMembers || []), newMember];
    await saveDb(db);
    setMemberName('');
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle) return;
    
    const db = getDb();
    const newPost: SharePost = {
      id: Math.random().toString(36).substr(2, 9),
      title: postTitle,
      link: postLink || undefined,
      date: Date.now()
    };
    
    db.sharePosts = [...(db.sharePosts || []), newPost];
    await saveDb(db);
    setPostTitle('');
    setPostLink('');
  };

  const removeMember = async (id: string) => {
    if (!confirm('Deseja remover este membro do controle?')) return;
    await deleteItem('shareMembers', id);
  };

  const removePost = async (id: string) => {
    if (!confirm('Deseja remover este post do controle?')) return;
    await deleteItem('sharePosts', id);
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-lobo-primary rounded-2xl text-white shadow-xl shadow-lobo-primary/20">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Controle de Compartilhamento</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Gestão de Engajamento Social</p>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-lobo-primary/10 flex items-center justify-center text-lobo-primary shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Taxa de Engajamento</span>
            <div className="flex items-end gap-2">
              <h4 className="text-2xl font-black text-zinc-900 leading-none">{healthRatio.toFixed(0)}%</h4>
              <span className="text-[10px] font-bold text-zinc-400 mb-0.5">{currentTotalShares}/{totalPossibleShares} checks</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${healthRatio}%` }}
                 className="h-full bg-lobo-primary" 
               />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-lobo-secondary/10 flex items-center justify-center text-lobo-secondary shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Membro em Destaque</span>
            <h4 className="text-xl font-black text-zinc-900 leading-tight">
              {topMember ? topMember.name : "Nenhum ainda"}
            </h4>
            <span className="text-[10px] font-black text-lobo-secondary uppercase tracking-widest">
              {topMember ? `${topMember.shares} compartilhamentos` : "--"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Posts no Controle</span>
            <h4 className="text-2xl font-black text-zinc-900 leading-none">{posts.length}</h4>
            <span className="text-[10px] font-bold text-zinc-400">Total de publicações</span>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      {members.length > 0 && posts.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-50 rounded-[2.5rem] p-8">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-lobo-primary" />
              Ranking de Engajamento por Membro
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberStats} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: '10px' }}
                  />
                  <Bar dataKey="shares" radius={[0, 4, 4, 0]} barSize={20}>
                    {memberStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#E38702' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-lobo-primary" />
              Proporção de Alcance por Post
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={postStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="shares"
                  >
                    {postStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {postStats.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Management */}
        <div className="space-y-6">
          <section className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
            <h3 className="flex items-center gap-2 text-sm font-black text-zinc-900 mb-4">
              <UserPlus className="w-4 h-4 text-lobo-primary" />
              Adicionar Membro para Controle
            </h3>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input 
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all"
                  placeholder="Nome do integrante"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                className="bg-lobo-primary text-white p-3 rounded-xl hover:bg-lobo-primary/90 shadow-lg shadow-lobo-primary/10 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </section>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Membros Participantes</span>
               <span className="text-[10px] font-black text-lobo-primary bg-lobo-primary/10 px-2 py-0.5 rounded-full">{members.length}</span>
             </div>
             <div className="divide-y divide-zinc-50 max-h-[400px] overflow-y-auto custom-scrollbar">
               <AnimatePresence>
                 {members.map(m => (
                   <motion.div 
                     key={m.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                         <User className="w-4 h-4 text-zinc-400" />
                       </div>
                       <span className="text-sm font-bold text-zinc-800">{m.name}</span>
                     </div>
                     <button 
                       onClick={() => removeMember(m.id)}
                       className="p-2 text-zinc-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {members.length === 0 && (
                 <div className="p-10 text-center">
                   <Users className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nenhum membro cadastrado</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Posts Management */}
        <div className="space-y-6">
          <section className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
            <h3 className="flex items-center gap-2 text-sm font-black text-zinc-900 mb-4">
              <FileText className="w-4 h-4 text-lobo-primary" />
              Nova Publicação para Compartilhar
            </h3>
            <form onSubmit={handleAddPost} className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input 
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all"
                  placeholder="Título ou descrição do post"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                  <input 
                    className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all"
                    placeholder="Link do post (opcional)"
                    value={postLink}
                    onChange={e => setPostLink(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-lobo-primary text-white p-3 rounded-xl hover:bg-lobo-primary/90 shadow-lg shadow-lobo-primary/10 active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>
          </section>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Posts Atuais</span>
               <span className="text-[10px] font-black text-lobo-primary bg-lobo-primary/10 px-2 py-0.5 rounded-full">{posts.length}</span>
             </div>
             <div className="divide-y divide-zinc-50 max-h-[400px] overflow-y-auto custom-scrollbar">
               <AnimatePresence>
                 {posts.map(p => (
                   <motion.div 
                     key={p.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50/50 transition-colors"
                   >
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-zinc-800">{p.title}</span>
                       {p.link && (
                         <a href={p.link} target="_blank" rel="noreferrer" className="text-[10px] text-lobo-primary font-bold hover:underline truncate max-w-[200px]">
                           Ver publicação
                         </a>
                       )}
                     </div>
                     <button 
                       onClick={() => removePost(p.id)}
                       className="p-2 text-zinc-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {posts.length === 0 && (
                 <div className="p-10 text-center">
                   <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nenhuma publicação cadastrada</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-4">
        <Sparkles className="w-5 h-5 text-lobo-primary shrink-0" />
        <p className="text-xs text-lobo-secondary font-bold leading-normal">
          Dica: Os membros e postagens cadastrados aqui aparecerão na <span className="font-black italic">Página Principal</span> na aba "Marketing", onde os fiscais poderão dar o "check" em tempo real.
        </p>
      </div>
    </div>
  );
};
