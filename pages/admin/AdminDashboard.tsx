
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../services/storageService';
import { Competition, Role } from '../../types';
import { DashboardTab } from './tabs/DashboardTab';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { AthleticsTab } from './tabs/AthleticsTab';
import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ResultsTab } from './tabs/ResultsTab';
import { PenaltiesTab } from './tabs/PenaltiesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { FinanceTab } from './tabs/FinanceTab';
import { InventoryTab } from './tabs/InventoryTab';
import { BirthdaysTab } from './tabs/BirthdaysTab';
import { MarketingTab } from './tabs/MarketingTab';
import { SociosTab } from './tabs/SociosTab';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Layers, 
  CheckSquare, 
  AlertTriangle, 
  Settings, 
  DollarSign, 
  Package,
  LayoutDashboard,
  ShieldCheck,
  Cake,
  Share2,
  UserCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [role, setRole] = useState<Role>('DIRETORIA');

  useEffect(() => {
    if (!localStorage.getItem('lobo_auth')) {
      navigate('/login');
      return;
    }
    const savedRole = localStorage.getItem('lobo_role') as Role;
    if (savedRole) setRole(savedRole);

    refresh();
  }, []);

  const refresh = () => {
    const db = getDb();
    const active = db.competitions.find(c => c.isActive);
    setActiveComp(active || null);
  };

  const tabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, color: 'bg-emerald-500' },
    { id: 'competitions', label: 'Competições', icon: Trophy, color: 'bg-amber-500' },
    { id: 'athletics', label: 'Atléticas', icon: Users, color: 'bg-blue-500' },
    { id: 'modalities', label: 'Modalidades', icon: Layers, color: 'bg-purple-500' },
    { id: 'results', label: 'Resultados', icon: CheckSquare, color: 'bg-green-500' },
    { id: 'penalties', label: 'Penalidades', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'birthdays', label: 'Aniversariantes', icon: Cake, color: 'bg-pink-500' },
    { id: 'socios', label: 'Sócios', icon: UserCheck, color: 'bg-lobo-secondary' },
    { id: 'marketing', label: 'Marketing', icon: Share2, color: 'bg-cyan-500' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'bg-zinc-500' }
  ];

  if (role === 'SUPER_ADMIN') {
    tabs.splice(tabs.length - 1, 0, { id: 'finance', label: 'Financeiro', icon: DollarSign, color: 'bg-emerald-500' });
    tabs.splice(tabs.length - 1, 0, { id: 'inventory', label: 'Estoque', icon: Package, color: 'bg-orange-500' });
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 -m-4 md:-m-8">
      {/* Sidebar - Datletica Style */}
      <aside className="w-20 md:w-72 bg-zinc-900 text-white flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 z-50 shadow-2xl">
        <div className="p-8 flex flex-col items-center md:items-start">
          <div 
            onClick={() => navigate('/')}
            className="w-12 h-12 md:w-16 md:h-16 bg-lobo-primary rounded-[1.5rem] flex items-center justify-center cursor-pointer hover:scale-105 hover:rotate-3 transition-all shadow-lg shadow-lobo-primary/20"
          >
            <Trophy className="w-6 h-6 md:w-10 md:h-10 text-zinc-900" />
          </div>
          <div className="hidden md:block mt-6 overflow-hidden">
            <h1 className="text-lg font-black uppercase tracking-tight truncate leading-none">Atlética Lobo</h1>
            <p className="text-[10px] text-lobo-primary font-bold uppercase tracking-[0.3em] leading-none mt-2">Intelligence Hub</p>
          </div>
        </div>

        <nav className="flex-grow py-4 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="md:px-4 mb-4">
             <p className="hidden md:block text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Dashboard Principal</p>
          </div>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-white text-zinc-900 shadow-xl" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                   "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                   //@ts-ignore
                   isActive ? t.color : "bg-white/5 group-hover:bg-white/10"
                )}>
                   <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                </div>
                <span className="hidden md:block text-xs font-black tracking-tight uppercase">{t.label}</span>
                
                {isActive && (
                   <motion.div 
                    layoutId="sidebarActive"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-lobo-primary rounded-l-full" 
                   />
                )}

                {/* Tooltip for mobile */}
                <span className="md:hidden absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => { localStorage.removeItem('lobo_auth'); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-red-500 transition-all group"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-left">
              Finalizar Sessão
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                 {tabs.find(t => t.id === activeTab)?.label}
               </h2>
               <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-lobo-secondary uppercase tracking-widest">Painel Administrativo</span>
                  <div className="w-1 h-1 rounded-full bg-zinc-200" />
                  <span className="text-[10px] font-bold text-zinc-400">Ver. 2.4.0</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 bg-zinc-50 rounded-2xl border border-zinc-100 italic">
                <LayoutDashboard className="w-4 h-4 text-zinc-300" />
                {activeComp ? (
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Comp: {activeComp.name}</span>
                ) : (
                   <span className="text-[10px] font-black text-red-100 uppercase tracking-widest">Nenhuma Competição Ativa</span>
                )}
             </div>
             
             <div className="flex items-center gap-4 pl-6 border-l border-zinc-100">
               <div className="text-right hidden sm:block">
                 <p className="text-xs font-black text-zinc-900 tracking-tight leading-none">{role}</p>
                 <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Status Verificado</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-lobo-primary shadow-lg shadow-black/10">
                 <Users className="w-6 h-6" />
               </div>
             </div>
          </div>
        </header>

        {/* Content Space */}
        <main className="flex-grow p-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-[1600px] mx-auto"
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'competitions' && <CompetitionsTab onUpdate={refresh} />}
              {activeTab === 'athletics' && <AthleticsTab />}
              {activeTab === 'birthdays' && <BirthdaysTab />}
              {activeTab === 'socios' && <SociosTab />}
              {activeTab === 'marketing' && <MarketingTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'finance' && role === 'SUPER_ADMIN' && <FinanceTab />}
              {activeTab === 'inventory' && role === 'SUPER_ADMIN' && <InventoryTab />}
              
              {(!activeComp && ['modalities', 'results', 'penalties'].includes(activeTab)) ? (
                <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 border border-amber-100">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Bloqueado</h3>
                  <p className="text-zinc-500 text-sm max-w-sm mt-3 font-medium">
                    Você precisa definir uma competição como <span className="font-bold text-lobo-primary">Ativa</span> nas configurações de Competições para gerenciar resultados e modalidades.
                  </p>
                  <button 
                    onClick={() => setActiveTab('competitions')}
                    className="mt-8 bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-lobo-primary transition-all"
                  >
                    Ativar Competição agora
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'modalities' && <ModalitiesTab comp={activeComp!} />}
                  {activeTab === 'results' && <ResultsTab comp={activeComp!} />}
                  {activeTab === 'penalties' && <PenaltiesTab comp={activeComp!} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
