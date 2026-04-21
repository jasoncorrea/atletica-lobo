import React, { useEffect, useState } from 'react';
import { getDb, calculateLeaderboard, startListener, stopListener, isQuotaExceeded, getConfig } from '../services/storageService';
import { Competition, LeaderboardEntry, Product, PlannerEvent, AppConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, AlertCircle, ChevronDown, ShieldAlert, ShoppingBag, Tag, Package, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'store'>('leaderboard');
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
      
      if (comps.length > 0 && !selectedCompId) {
        const active = comps.find(c => c.isActive) || comps[0];
        setSelectedCompId(active.id);
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
