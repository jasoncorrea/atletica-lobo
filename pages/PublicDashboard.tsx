import React, { useEffect, useState } from 'react';
import { getDb, calculateLeaderboard, saveDb, deleteItem } from '../services/storageService';
import { Competition, LeaderboardEntry, BirthdayMember, ShareMember, SharePost, ShareRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, AlertCircle, ChevronDown, Award, Cake, Calendar, Star, Users, Share2, CheckCircle2, Circle, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAuth } from 'firebase/auth';

export const PublicDashboard: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [shareMembers, setShareMembers] = useState<ShareMember[]>([]);
  const [sharePosts, setSharePosts] = useState<SharePost[]>([]);
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'birthdays' | 'marketing'>('leaderboard');
  const auth = getAuth();
  const isAdmin = !!auth.currentUser;

  useEffect(() => {
    const load = () => {
      const db = getDb();
      const comps = db.competitions.sort((a, b) => b.createdAt - a.createdAt);
      setCompetitions(comps);
      setBirthdays(db.birthdays || []);
      setShareMembers(db.shareMembers || []);
      setSharePosts(db.sharePosts || []);
      setShareRecords(db.shareRecords || []);
      
      if (comps.length > 0 && !selectedCompId) {
        const active = comps.find(c => c.isActive) || comps[0];
        setSelectedCompId(active.id);
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [selectedCompId]);

  const toggleShare = async (memberId: string, postId: string) => {
    if (!isAdmin) return;
    
    const recordId = `${memberId}_${postId}`;
    const exists = shareRecords.some(r => r.id === recordId);
    
    if (exists) {
      await deleteItem('shareRecords', recordId);
    } else {
      const db = getDb();
      const newRecord: ShareRecord = { id: recordId, memberId, postId, shared: true };
      db.shareRecords = [...(db.shareRecords || []), newRecord];
      await saveDb(db);
    }
  };

  useEffect(() => {
    if (selectedCompId) {
      setLeaderboard(calculateLeaderboard(selectedCompId));
    }
  }, [selectedCompId]);

  const isBirthdaySoon = (dateStr: string) => {
    const today = new Date();
    const birth = new Date(dateStr);
    // Adjust for date object behavior
    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate() + 1;
    
    return today.getMonth() === birthMonth && today.getDate() === birthDay;
  };

  const sortedBirthdays = [...birthdays].sort((a, b) => {
    const dateA = new Date(a.birthDate);
    const dateB = new Date(b.birthDate);
    return dateA.getMonth() - dateB.getMonth() || dateA.getDate() - dateB.getDate();
  });

  // Set default tab if leaderboard or birthdays are empty but marketing has data
  useEffect(() => {
    if (activeTab === 'leaderboard' && competitions.length === 0 && shareMembers.length > 0) {
      setActiveTab('marketing');
    }
  }, [competitions.length, birthdays.length, shareMembers.length]);

  if (competitions.length === 0 && birthdays.length === 0 && shareMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Nenhuma informação disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Trophy className="w-48 h-48 -rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-lobo-primary animate-pulse" />
            <span>Portal do Atleta</span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Estatísticas Lobos</h2>
        </div>

        {activeTab === 'leaderboard' && competitions.length > 0 && (
          <div className="relative z-10 w-full md:w-auto">
            <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-1">Selecionar Competição</label>
            <div className="relative group">
              <select 
                className="w-full md:w-64 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none appearance-none transition-all cursor-pointer"
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
              >
                {competitions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <nav className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm w-fit mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
            activeTab === 'leaderboard' ? "text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {activeTab === 'leaderboard' && (
            <motion.div layoutId="tab-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-lg" />
          )}
          <Award className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Ranking</span>
        </button>
        <button 
          onClick={() => setActiveTab('birthdays')}
          className={cn(
            "relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
            activeTab === 'birthdays' ? "text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {activeTab === 'birthdays' && (
            <motion.div layoutId="tab-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-lg" />
          )}
          <Cake className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Aniversariantes</span>
        </button>
        <button 
          onClick={() => setActiveTab('marketing')}
          className={cn(
            "relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
            activeTab === 'marketing' ? "text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {activeTab === 'marketing' && (
            <motion.div layoutId="tab-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-lg" />
          )}
          <Share2 className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Marketing</span>
        </button>
      </nav>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'leaderboard' ? (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Posição</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Instituição</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {leaderboard.map((entry, idx) => {
                      const isLobo = entry.name.toLowerCase().includes('lobo');
                      const isTop3 = entry.position <= 3;
                      
                      return (
                        <motion.tr 
                          key={entry.athleticId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "group transition-colors",
                            isLobo ? "bg-orange-50/30" : "hover:bg-zinc-50/50"
                          )}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-3">
                              <span className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm",
                                entry.position === 1 ? "bg-amber-400 text-white" :
                                entry.position === 2 ? "bg-zinc-300 text-white" :
                                entry.position === 3 ? "bg-amber-600 text-white" :
                                "bg-zinc-100 text-zinc-400"
                              )}>
                                {entry.position}
                              </span>
                              {entry.position === 1 && <Medal className="w-4 h-4 text-amber-500 animate-bounce" />}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-5">
                              {entry.logoUrl ? (
                                <img 
                                  src={entry.logoUrl} 
                                  className={cn(
                                    "h-12 w-12 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-110",
                                    isLobo ? "border-2 border-lobo-primary ring-4 ring-orange-100" : "border border-zinc-100"
                                  )} 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-sm font-black text-zinc-300">
                                  {entry.name.substring(0,2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className={cn(
                                  "font-black tracking-tight text-lg",
                                  isLobo ? "text-lobo-secondary" : "text-zinc-900"
                                )}>
                                  {entry.name}
                                </span>
                                {entry.penalties > 0 && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Punição: -{entry.penalties} pts</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-2xl font-black text-zinc-900 tabular-nums">
                                {entry.totalPoints}
                              </span>
                              <span className="text-[8px] font-black text-zinc-300 uppercase tracking-tighter">Pontos</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'birthdays' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBirthdays.map((m, idx) => {
                const today = isBirthdaySoon(m.birthDate);
                const bDate = new Date(m.birthDate);
                const day = bDate.getDate() + 1;
                const month = bDate.toLocaleString('pt-BR', { month: 'long' });

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "bg-white rounded-3xl p-6 border transition-all duration-300 group flex items-start gap-5",
                      today ? "border-pink-200 shadow-xl shadow-pink-100 bg-pink-50/20" : "border-zinc-100 hover:border-zinc-300 shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-transform group-hover:rotate-6",
                      today ? "bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-200" : "bg-zinc-50 border-zinc-100 text-zinc-400"
                    )}>
                      <span className="text-xl font-black leading-none">{day}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">{month.slice(0, 3)}</span>
                      {today && <Star className="w-3 h-3 mt-2 fill-white" />}
                    </div>

                    <div className="flex-1 py-1">
                      <h4 className="text-lg font-black text-zinc-900 tracking-tight leading-tight mb-1">{m.name}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        <span>{m.role}</span>
                      </div>
                      
                      {today && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                          <Cake className="w-3 h-3" />
                          <span>Parabéns Hoje!</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {sortedBirthdays.length === 0 && (
                <div className="col-span-full py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                  <Calendar className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhum aniversariante registrado.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Checklist de Engajamento</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Controle de compartilhamento nas redes sociais</p>
                </div>
                {!isAdmin && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Apenas administradores podem marcar</span>
                  </div>
                )}
              </div>

              {shareMembers.length > 0 && sharePosts.length > 0 ? (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50">Membro</th>
                        {sharePosts.map(post => (
                          <th key={post.id} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50 min-w-[140px]">
                            <div className="flex flex-col items-center gap-1">
                              <span>{post.title}</span>
                              {post.link && (
                                <a href={post.link} target="_blank" rel="noreferrer" className="text-[8px] text-lobo-primary hover:underline">Link</a>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {shareMembers.map((member, mIdx) => (
                        <motion.tr 
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: mIdx * 0.05 }}
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="text-sm font-black text-zinc-800 tracking-tight">{member.name}</span>
                          </td>
                          {sharePosts.map(post => {
                            const recordId = `${member.id}_${post.id}`;
                            const isShared = shareRecords.some(r => r.id === recordId);
                            
                            return (
                              <td key={post.id} className="px-6 py-5 text-center">
                                <button
                                  disabled={!isAdmin}
                                  onClick={() => toggleShare(member.id, post.id)}
                                  className={cn(
                                    "p-3 rounded-2xl transition-all active:scale-95",
                                    !isAdmin ? "cursor-default opacity-40" : "hover:bg-zinc-50",
                                    isShared ? "text-green-500 bg-green-50" : "text-zinc-200"
                                  )}
                                >
                                  {isShared ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 border-zinc-200" />}
                                </button>
                              </td>
                            );
                          })}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <Share2 className="w-12 h-12 text-zinc-100 mb-4" />
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    Aguardando configuração de membros e posts no painel administrativo.
                  </p>
                </div>
              )}

              {/* Public Mini-Dashboard */}
              <div className="mt-12 pt-8 border-t border-zinc-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg text-lobo-primary">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Ranking de Engajamento</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    {shareMembers
                      .map(m => {
                        const shareCount = shareRecords.filter(r => r.memberId === m.id).length;
                        return { ...m, shareCount };
                      })
                      .sort((a, b) => b.shareCount - a.shareCount)
                      .map(m => {
                        const percentage = sharePosts.length > 0 ? (m.shareCount / sharePosts.length) * 100 : 0;
                        
                        return (
                          <div key={m.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-zinc-600 font-bold">{m.name}</span>
                              <span className="text-lobo-primary">{m.shareCount} / {sharePosts.length}</span>
                            </div>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full bg-lobo-primary"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  <div className="bg-lobo-primary/5 rounded-3xl p-6 flex flex-col items-center text-center">
                    <Trophy className="w-10 h-10 text-lobo-primary mb-3" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Destaque Social</span>
                    <h5 className="text-xl font-black text-lobo-secondary tracking-tight">
                      {shareMembers.length > 0 ? 
                        [...shareMembers].sort((a,b) => 
                          shareRecords.filter(r => r.memberId === b.id).length - 
                          shareRecords.filter(r => r.memberId === a.id).length
                        )[0].name : "---"}
                    </h5>
                    <p className="text-[10px] font-bold text-lobo-primary/60 mt-1 uppercase">Maior Engajamento</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
