import React, { useState, useEffect } from 'react';
import { getDb } from '../../../services/storageService';
import { Competition } from '../../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Trophy, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Activity,
  UserCheck,
  DollarSign,
  Flag
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

interface Props {
  activeComp?: Competition | null;
}

export const DashboardTab: React.FC<Props> = ({ activeComp }) => {
  const [db, setDb] = useState(getDb());

  useEffect(() => {
    const handleStorage = () => setDb(getDb());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Stats Calculations
  const displayComp = activeComp || db.competitions.find(c => c.isActive);
  const totalSocios = db.socios.length;
  
  const compAthletics = displayComp ? db.athletics.filter(a => a.competitionId === displayComp.id).length : 0;
  const compModalities = displayComp ? db.modalities.filter(m => m.competitionId === displayComp.id).length : 0;

  const activeSocios = db.socios.filter(s => {
    if (!s.expiryDate) return false;
    const parts = s.expiryDate.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const expiry = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    return expiry >= today;
  }).length;
  const lowStock = db.products.filter(p => p.quantity < 5).length;

  const sociosData = [
    { name: 'Ativos', value: activeSocios },
    { name: 'Inativos', value: Math.max(0, totalSocios - activeSocios) }
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Overview */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-lobo-secondary tracking-tighter uppercase leading-none">Visão Central</h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-none">Inteligência Operacional Atlética Lobo</p>
        </div>
        <div className="flex items-center gap-4">
           {displayComp && (
             <div className="bg-lobo-primary px-6 py-3 rounded-2xl shadow-xl shadow-lobo-primary/20 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-zinc-900" />
                <div>
                   <p className="text-[9px] font-black text-zinc-900/40 uppercase tracking-widest leading-none">Comp. em Foco</p>
                   <p className="text-xs font-black text-zinc-900 leading-none mt-1 uppercase">{displayComp.name}</p>
                </div>
             </div>
           )}
           <div className="bg-lobo-secondary px-6 py-3 rounded-2xl text-white shadow-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-lobo-primary" />
              <div className="text-right">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Data Atual</p>
                 <p className="text-xs font-black leading-none mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
           </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {[
           { 
             label: 'Sócios Ativos', 
             value: activeSocios, 
             icon: UserCheck, 
             color: 'text-blue-500', 
             bg: 'bg-blue-500/10',
             trend: `${totalSocios} total`,
             positive: true
           },
           { 
             label: 'Estoque Crítico', 
             value: lowStock, 
             icon: Package, 
             color: 'text-orange-500', 
             bg: 'bg-orange-500/10',
             trend: 'Atenção',
             positive: lowStock === 0
           },
           { 
             label: 'Saúde do Sistema', 
             value: '100%', 
             icon: ShieldCheck, 
             color: 'text-purple-500', 
             bg: 'bg-purple-500/10',
             trend: 'Protegido',
             positive: true
           }
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group"
           >
              <div className="flex justify-between items-start mb-6">
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                    <stat.icon className={cn("w-7 h-7", stat.color)} />
                 </div>
                 <div className={cn(
                   "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                   stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                 )}>
                   {stat.trend}
                 </div>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
              <h4 className="text-2xl font-black text-zinc-900 tracking-tight tabular-nums">{stat.value}</h4>
           </motion.div>
         ))}
      </section>

      {/* Distribution & Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-lobo-secondary rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-8">Saúde Social</h3>
                  <div className="space-y-6">
                     <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
                           <span>Aderência do Plano</span>
                           <span className="text-lobo-primary">{((activeSocios / (totalSocios || 1)) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(activeSocios / (totalSocios || 1)) * 100}%` }}
                              className="h-full bg-lobo-primary shadow-[0_0_15px_rgba(227,135,2,0.5)]" 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Membros Ativos</p>
                           <p className="text-2xl font-black ">{activeSocios}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Base</p>
                           <p className="text-2xl font-black ">{totalSocios}</p>
                        </div>
                     </div>
                  </div>
               </div>
               <Zap className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] text-lobo-primary rotate-12" />
            </div>

            <div className="bg-white border border-zinc-100 rounded-[3rem] p-8 shadow-sm">
               <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Próximas Competições
               </h3>
               <div className="space-y-4">
                  {db.competitions.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-lobo-primary transition-colors cursor-pointer">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                         c.isActive ? "bg-amber-500 text-white" : "bg-white text-zinc-300 group-hover:text-amber-500"
                       )}>
                          <Trophy className="w-5 h-5" />
                       </div>
                       <div className="flex-grow">
                          <p className="text-[10px] font-black text-zinc-900 uppercase tracking-tight truncate">{c.name}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{c.year}</p>
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-zinc-200" />
                    </div>
                  ))}
                  {db.competitions.length === 0 && (
                    <p className="text-center py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Nenhuma competição</p>
                  )}
               </div>
               <button className="w-full mt-6 py-4 rounded-2xl bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all">Ver Calendário Completo</button>
            </div>
      </section>
    </div>
  );
};
