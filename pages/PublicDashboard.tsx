import React, { useEffect, useState } from 'react';
import { getDb, calculateLeaderboard, startListener, stopListener, isQuotaExceeded, getConfig } from '../services/storageService';
import { Competition, LeaderboardEntry, Product, PlannerEvent, AppConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Medal, AlertCircle, ChevronDown, ShieldAlert, ShoppingBag, 
  Tag, Package, Calendar, Clock, MapPin, Sparkles, ChevronUp, 
  ArrowLeft, Flame, Activity, Waves, Target, Footprints, Grid, 
  Award, Crown, User 
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { getAuth } from 'firebase/auth';

export const PublicDashboard: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'desempenho' | 'store'>('leaderboard');
  const [expandedModalities, setExpandedModalities] = useState<Record<string, boolean>>({});
  const auth = getAuth();
  const isAdmin = !!auth.currentUser;

  useEffect(() => {
    const collections = ['competitions', 'athletics', 'results', 'penalties', 'scoreRules', 'products', 'plannerEvents'];
    collections.forEach(startListener);
    return () => collections.forEach(stopListener);
  }, []);

  useEffect(() => {
    const load = () => {
      const db = getDb();
      const comps = db.competitions.sort((a, b) => b.createdAt - a.createdAt);
      setCompetitions(comps);
      setProducts(db.products || []);
      setEvents(db.plannerEvents || []);
      setConfig(getConfig());
      
      let currentCompId = selectedCompId;
      if (comps.length > 0 && !selectedCompId) {
        const active = comps.find(c => c.isActive) || comps[0];
        currentCompId = active.id;
        setSelectedCompId(currentCompId);
      }

      if (currentCompId) {
        setLeaderboard(calculateLeaderboard(currentCompId));
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [selectedCompId]);

  useEffect(() => {
    if (selectedCompId) {
      setLeaderboard(calculateLeaderboard(selectedCompId));
    }
  }, [selectedCompId]);

  const db = getDb();
  const compAthletics = db.athletics.filter(a => a.competitionId === selectedCompId);
  const loboAthletic = compAthletics.find(a => a.name.toLowerCase().includes('lobo')) || compAthletics[0];
  const compModalities = db.modalities.filter(m => m.competitionId === selectedCompId);

  const sortedModalities = [...compModalities].sort((a, b) => {
    const nameA = `${a.name} ${a.gender === 'M' ? 'Masculino' : a.gender === 'F' ? 'Feminino' : 'Misto'}`;
    const nameB = `${b.name} ${b.gender === 'M' ? 'Masculino' : b.gender === 'F' ? 'Feminino' : 'Misto'}`;
    return nameA.localeCompare(nameB);
  });

  const getModalityPlacement = (modalityId: string) => {
    const res = db.results.find(r => r.modalityId === modalityId && r.competitionId === selectedCompId);
    if (!res || !res.ranking) return null;
    
    if (!loboAthletic) return null;
    const rankEntry = Object.entries(res.ranking).find(([_, athId]) => athId === loboAthletic.id);
    if (!rankEntry) return null;
    
    return parseInt(rankEntry[0], 10);
  };

  const getModalityRanking = (modalityId: string) => {
    const res = db.results.find(r => r.modalityId === modalityId && r.competitionId === selectedCompId);
    if (!res || !res.ranking) return [];
    
    return Object.entries(res.ranking)
      .map(([rankStr, athId]) => {
        const rank = parseInt(rankStr, 10);
        const ath = db.athletics.find(a => a.id === athId);
        const name = ath ? ath.name : "Atlética Desconhecida";
        const logoUrl = ath ? ath.logoUrl : null;
        const isLobo = name.toLowerCase().includes('lobo');
        return { position: rank, name, logoUrl, isLobo };
      })
      .sort((a, b) => a.position - b.position);
  };

  const currentComp = competitions.find(c => c.id === selectedCompId);
  const divisionStr = currentComp?.division === '2' || 
    (currentComp && (
      currentComp.name.toUpperCase().trim() === 'SEGUNDA DIVISÃO' || 
      currentComp.name.toUpperCase().trim() === 'SEGUNDA DIVISAO'
    )) ? '2ª Divisão' : '1ª Divisão';

  const toggleModality = (id: string) => {
    setExpandedModalities(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getModalityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('basquete') || lower.includes('basquetebol')) {
      return <Target className="w-5 h-5" />;
    }
    if (lower.includes('futebol') || lower.includes('futsal') || lower.includes('campo')) {
      return <Flame className="w-5 h-5" />;
    }
    if (lower.includes('natacao') || lower.includes('natação')) {
      return <Waves className="w-5 h-5" />;
    }
    if (lower.includes('tenis') || lower.includes('tênis')) {
      return <Target className="w-5 h-5" />;
    }
    if (lower.includes('atletismo')) {
      return <Footprints className="w-5 h-5" />;
    }
    if (lower.includes('xadrez')) {
      return <Grid className="w-5 h-5" />;
    }
    if (lower.includes('judo') || lower.includes('judô')) {
      return <Award className="w-5 h-5" />;
    }
    return <Activity className="w-5 h-5" />;
  };

  if (competitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Nenhuma informação de ranking disponível no momento.</p>
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
          {isQuotaExceeded() && (
             <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 w-fit mb-4">
                <ShieldAlert className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight leading-none text-left">Sync Pausado (Quota)</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest mt-1 text-left">Modo Local Ativo</span>
                </div>
             </div>
          )}
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-lobo-primary animate-pulse" />
            <span>Portal do Atleta</span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Estatísticas Lobos</h2>
        </div>

        {(activeTab === 'leaderboard' || activeTab === 'desempenho') && competitions.length > 0 && (
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

      {/* Event Ticker/Strip */}
      {events.length > 0 && config.publicEventCategories && config.publicEventCategories.length > 0 && (
        <div className="bg-lobo-primary overflow-hidden py-3 rounded-2xl border border-white/10 shadow-lg relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-lobo-primary to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-lobo-primary to-transparent z-10" />
          
          <div className="flex items-center gap-4 animate-scroll-ticker whitespace-nowrap px-4">
            {/* Show only filtered upcoming events */}
            {[...events]
              .filter(e => e.date >= startOfDay(new Date()).getTime() && config.publicEventCategories?.includes(e.category))
              .sort((a, b) => a.date - b.date)
              .slice(0, 10)
              .map(event => (
                <div key={event.id} className="inline-flex items-center gap-3 px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 group hover:border-white transition-colors">
                  <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover:scale-110 transition-transform">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{event.title}</span>
                    <div className="flex items-center gap-2 text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(event.date), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 border-l border-white/10 pl-2">
                          <MapPin className="w-2.5 h-2.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Empty State Ticker */}
            {[...events]
              .filter(e => e.date >= startOfDay(new Date()).getTime() && config.publicEventCategories?.includes(e.category)).length === 0 && (
                <div className="flex items-center gap-3 px-5 py-2 text-white/50 italic text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-white/20" />
                  Nenhum evento público programado para os próximos dias
                </div>
              )}
          </div>
        </div>
      )}

      {/* Featured Home Announcement */}
      {config.homeAnnouncementTitle && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-black/5 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0"
        >
          <div className="p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-zinc-50 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-1 rounded-full bg-lobo-primary" />
              <span className="text-[10px] font-black text-lobo-primary uppercase tracking-widest">Destaque Lobo</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-lobo-secondary tracking-tighter uppercase leading-[0.9] mb-6">
              {config.homeAnnouncementTitle}
            </h2>
            <div className="prose prose-zinc prose-sm max-w-none">
              <p className="text-zinc-500 font-bold leading-relaxed whitespace-pre-wrap">
                {config.homeAnnouncementBody}
              </p>
            </div>
          </div>
          
          <div className="relative h-64 lg:h-auto bg-zinc-50 flex items-center justify-center overflow-hidden">
            {config.homeAnnouncementMediaUrl ? (
              <>
                {config.homeAnnouncementMediaType === 'video' ? (
                  <video 
                    src={config.homeAnnouncementMediaUrl} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    muted 
                    loop 
                    autoPlay 
                    playsInline 
                  />
                ) : (
                  <img 
                    src={config.homeAnnouncementMediaUrl} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    alt="Destaque"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-300">
                <Trophy className="w-12 h-12" />
                <span className="text-[10px] font-black uppercase tracking-widest">Atlética Lobo</span>
              </div>
            )}
          </div>
        </motion.section>
      )}

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
          <Trophy className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Ranking Geral</span>
        </button>
        <button 
          onClick={() => setActiveTab('desempenho')}
          className={cn(
            "relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
            activeTab === 'desempenho' ? "text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {activeTab === 'desempenho' && (
            <motion.div layoutId="tab-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-lg" />
          )}
          <Medal className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Desempenho Lobo</span>
        </button>
        <button 
          onClick={() => setActiveTab('store')}
          className={cn(
            "relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
            activeTab === 'store' ? "text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {activeTab === 'store' && (
            <motion.div layoutId="tab-bg" className="absolute inset-0 bg-zinc-900 rounded-xl shadow-lg" />
          )}
          <ShoppingBag className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Loja Lobo</span>
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
                      
                      return (
                        <motion.tr 
                          key={entry.athleticId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "group transition-colors",
                            isLobo ? "bg-lobo-primary/10" : "hover:bg-zinc-50/50"
                          )}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-3">
                              <span className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm",
                                entry.position === 1 ? "bg-lobo-primary text-white" :
                                entry.position === 2 ? "bg-zinc-300 text-white" :
                                entry.position === 3 ? "bg-zinc-600 text-white" :
                                "bg-zinc-100 text-zinc-400"
                              )}>
                                {entry.position}
                              </span>
                              {entry.position === 1 && <Medal className="w-4 h-4 text-lobo-primary animate-bounce" />}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-5">
                              {entry.logoUrl ? (
                                <img 
                                  src={entry.logoUrl} 
                                  className={cn(
                                    "h-12 w-12 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-110",
                                    isLobo ? "border-2 border-lobo-primary ring-4 ring-lobo-light" : "border border-zinc-100"
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
          ) : activeTab === 'desempenho' ? (
            <div className="w-full max-w-2xl mx-auto space-y-6">
              {/* Profile Card like the Screenshot */}
              <div className="bg-lobo-primary rounded-[2rem] text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
                {/* Decorative Elements */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-white/50 w-full px-6">
                  <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition duration-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-white/90">Lobo</span>
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition duration-300 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                </div>

                <div className="pt-10">
                  <h3 className="font-black text-2.5xl sm:text-3xl tracking-tighter uppercase leading-[0.9] mt-6 text-lobo-secondary">
                    {loboAthletic?.name || "A.A.A.E.XXVIIIFEV UTFPR-GP"}
                  </h3>
                  <p className="text-[10px] text-white/70 font-semibold tracking-wide uppercase mt-3 max-w-md mx-auto leading-relaxed">
                    Associação Atlética Acadêmica de Engenharias XXVIII de Fevereiro UTFPR GP
                  </p>
                  <p className="inline-block text-[10px] bg-lobo-secondary text-lobo-dark font-black tracking-widest uppercase mt-4 px-4 py-2 rounded-full shadow-lg shadow-black/20">
                    {divisionStr}
                  </p>
                </div>

                {/* Circular Mascot Logo Container */}
                <div className="mt-8 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-lobo-secondary to-yellow-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-lobo-secondary bg-lobo-dark flex items-center justify-center overflow-hidden shadow-2xl relative transform transition duration-500 group-hover:scale-105">
                    {config.logoUrl ? (
                      <img 
                        src={config.logoUrl} 
                        className="w-full h-full object-cover" 
                        alt="Logo Lobo"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-3xl font-black text-lobo-secondary select-none animate-pulse">LOBO</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modalities Listing */}
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 p-6 sm:p-8 space-y-4">
                <div className="text-center font-bold font-sans text-[10px] tracking-widest text-zinc-400 uppercase py-2 border-b border-zinc-100">
                  MODALIDADES & RESULTADOS
                </div>
                
                {sortedModalities.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-sm font-bold uppercase tracking-widest">
                     Nenhuma modalidade ativa ou cadastrada
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {sortedModalities.map((m) => {
                      const placement = getModalityPlacement(m.id);
                      const isExpanded = !!expandedModalities[m.id];
                      const ranking = getModalityRanking(m.id);
                      
                      return (
                        <div key={m.id} className="py-2.5">
                          <button
                            onClick={() => toggleModality(m.id)}
                            className="w-full flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-zinc-50/50 transition-all duration-300"
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-sm",
                                placement === 1 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                                placement === 2 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                placement === 3 ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                "bg-lobo-primary/5 text-lobo-primary border border-lobo-primary/5"
                              )}>
                                {getModalityIcon(m.name)}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-zinc-800 text-sm tracking-tight capitalize leading-tight">
                                  {m.name} {m.gender === 'M' ? 'Masculino' : m.gender === 'F' ? 'Feminino' : 'Misto'}
                                </span>
                                <span className={cn(
                                  "text-xs mt-1 font-black",
                                  placement ? "text-lobo-secondary tracking-wide uppercase font-black" : "text-zinc-600 font-medium"
                                )}>
                                  {placement ? `${placement}º lugar` : "Resultados pendentes"}
                                </span>
                              </div>
                            </div>
                            <div className="text-zinc-400 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {/* Accordion content - full ranking */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-4 pb-4 pt-2 ml-16 space-y-2 border-l-2 border-zinc-100">
                                  <div className="text-[9px] font-black tracking-widest text-zinc-400 uppercase mb-3 text-left">
                                    Classificação Final
                                  </div>
                                  {ranking.length === 0 ? (
                                    <p className="text-xs italic text-zinc-400 text-left">Classificação ainda não publicada para esta modalidade.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                      {ranking.map((rank) => (
                                        <div 
                                          key={rank.position}
                                          className={cn(
                                            "flex items-center justify-between p-2 rounded-xl text-xs transition-all",
                                            rank.isLobo 
                                              ? "bg-lobo-primary/10 border border-lobo-primary/20 text-lobo-primary font-black" 
                                              : "bg-zinc-50/50 border border-zinc-100 text-zinc-700 font-medium"
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className={cn(
                                              "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black",
                                              rank.position === 1 ? "bg-amber-100 text-amber-700" :
                                              rank.position === 2 ? "bg-slate-100 text-slate-700" :
                                              rank.position === 3 ? "bg-orange-100 text-orange-700" :
                                              "bg-zinc-200/80 text-zinc-600"
                                            )}>
                                              {rank.position}º
                                            </span>
                                            {rank.logoUrl && (
                                              <img src={rank.logoUrl} className="w-5 h-5 rounded-md object-cover" alt="" referrerPolicy="no-referrer" />
                                            )}
                                            <span>{rank.name}</span>
                                          </div>
                                          {rank.isLobo && (
                                            <div className="flex items-center gap-1 text-[8pt] text-lobo-secondary font-black uppercase tracking-widest pr-1">
                                              <Crown className="w-3 h-3 text-lobo-secondary" />
                                              <span>LOBO!</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-lobo-primary/10 transition-all duration-500"
                >
                  {/* Image Container */}
                  <div className="aspect-square relative overflow-hidden bg-zinc-50">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200">
                        <ShoppingBag className="w-16 h-16" />
                      </div>
                    )}
                    
                    {/* Badge Stock */}
                    <div className="absolute top-4 left-4">
                      {product.quantity > 0 ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                          <Package className="w-3 h-3" />
                          <span>Em Estoque: {product.quantity}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                          <AlertCircle className="w-3 h-3" />
                          <span>Esgotado</span>
                        </div>
                      )}
                    </div>

                    {/* Size Badge */}
                    {product.size && (
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                        TAM: {product.size}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h4 className="text-lg font-black text-zinc-900 tracking-tight leading-tight mb-4 group-hover:text-lobo-primary transition-colors">
                      {product.name}
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-lobo-primary/5 border border-lobo-primary/10">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-lobo-primary uppercase tracking-widest mb-0.5">Preço Sócio</span>
                          <span className="text-xl font-black text-lobo-primary">R$ {product.priceMember.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-2 bg-lobo-primary rounded-xl text-white shadow-lg shadow-lobo-primary/30">
                          <Tag className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Não Sócio</span>
                          <span className="text-sm font-black text-zinc-600">R$ {product.priceNonMember.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {products.length === 0 && (
                <div className="col-span-full py-20 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhum produto em estoque no momento.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
