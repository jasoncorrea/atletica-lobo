
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../services/storageService';
import { Competition, Role } from '../../types';
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
  const [activeTab, setActiveTab] = useState('competitions');
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
    { id: 'competitions', label: 'Competições', icon: Trophy },
    { id: 'athletics', label: 'Atléticas', icon: Users },
    { id: 'modalities', label: 'Modalidades', icon: Layers },
    { id: 'results', label: 'Resultados', icon: CheckSquare },
    { id: 'penalties', label: 'Penalidades', icon: AlertTriangle },
    { id: 'birthdays', label: 'Aniversariantes', icon: Cake },
    { id: 'socios', label: 'Sócios', icon: UserCheck },
    { id: 'marketing', label: 'Marketing', icon: Share2 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  if (role === 'SUPER_ADMIN') {
    tabs.push({ id: 'finance', label: 'Financeiro', icon: DollarSign });
    tabs.push({ id: 'inventory', label: 'Estoque', icon: Package });
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full -mr-16 -mt-16 flex items-center justify-center">
          <ShieldCheck className="w-12 h-12 text-zinc-100" />
        </div>

        <div className="relative z-10">
           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-lobo-primary" />
             <span>Controle de Gestão</span>
           </div>
           <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
             Painel Administrativo
           </h1>
           <div className="mt-2 inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200">
             <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider tabular-nums">
               {role === 'SUPER_ADMIN' ? 'Modo Desenvolvedor (Root)' : 'Nível Diretoria'}
             </span>
           </div>
        </div>

        {activeComp && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex flex-col items-end"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Competição Ativa</span>
            <div className="bg-green-500 text-white px-4 py-1.5 rounded-xl text-sm font-black shadow-lg shadow-green-500/20 border border-green-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {activeComp.name}
            </div>
          </motion.div>
        )}
      </header>

      {/* Tabs Navigation */}
      <nav className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative group flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300",
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-lobo-primary rounded-xl shadow-lg shadow-lobo-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn("relative z-10 w-4 h-4 transition-transform", isActive && "scale-110")} />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <motion.div 
        layout
        className="bg-white border border-zinc-200 rounded-2xl shadow-sm min-h-[500px] overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8"
          >
            {activeTab === 'competitions' && <CompetitionsTab onUpdate={refresh} />}
            {activeTab === 'athletics' && <AthleticsTab />}
            {activeTab === 'birthdays' && <BirthdaysTab />}
            {activeTab === 'socios' && <SociosTab />}
            {activeTab === 'marketing' && <MarketingTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'finance' && role === 'SUPER_ADMIN' && <FinanceTab />}
            {activeTab === 'inventory' && role === 'SUPER_ADMIN' && <InventoryTab />}
            
            {(!activeComp && ['modalities', 'results', 'penalties'].includes(activeTab)) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 border border-red-100">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Ação Necessária</h3>
                <p className="text-zinc-500 text-sm max-w-xs mt-2">
                  Você precisa selecionar ou criar uma competição ativa na aba 
                  <span className="font-bold text-lobo-primary"> Competições</span> para gerenciar esta seção.
                </p>
                <button 
                  onClick={() => setActiveTab('competitions')}
                  className="mt-6 bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl"
                >
                  Ir para Competições
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
      </motion.div>
    </div>
  );
};
