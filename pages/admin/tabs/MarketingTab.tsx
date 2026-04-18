import React, { useState, useEffect } from 'react';
import { getDb, saveDb, deleteItem } from '../../../services/storageService';
import { ShareMember, SharePost } from '../../../types';
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
  Sparkles
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export const MarketingTab: React.FC = () => {
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [posts, setPosts] = useState<SharePost[]>([]);
  
  // Member Form
  const [memberName, setMemberName] = useState('');
  
  // Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postLink, setPostLink] = useState('');

  const load = () => {
    const db = getDb();
    setMembers(db.shareMembers || []);
    setPosts(db.sharePosts || []);
  };

  useEffect(() => {
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

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
