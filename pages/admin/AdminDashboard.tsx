
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb, getConfig, refreshAuth } from '../../services/storageService';
import { Competition, Role, AppConfig } from '../../types';
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
  UserCheck,
  Menu,
  X as CloseIcon,
  ChevronRight,
  Cloud,
  Gamepad,
  History,
  FolderOpen,
  Camera,
  Tag,
  Megaphone,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [role, setRole] = useState<Role>('DIRETORIA');
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [showDriveLinks, setShowDriveLinks] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const driveFolders = [
    { name: 'Geral (Minha Unidade)', icon: FolderOpen, color: 'text-zinc-600', bg: 'bg-zinc-100', link: 'https://drive.google.com/drive/folders/1zs49o7pf-xjI4RfhnGpqf4UGXcEEAYRL?usp=sharing' },
    { name: 'Marketing / Comunicação', icon: Megaphone, color: 'text-lobo-primary', bg: 'bg-orange-50', link: 'https://drive.google.com/drive/folders/1ktlXSzMT-ZdgNA3b3onIlBeLQyM4KbPd?usp=sharing' },
    { name: 'Produtos / Comercial', icon: Tag, color: 'text-emerald-500', bg: 'bg-emerald-50', link: 'https://drive.google.com/drive/folders/1yKJq2iMJx6htQlFT3-k3c-UGXQFhbUW1?usp=sharing' },
    { name: 'Diretoria de Esportes', icon: Gamepad, color: 'text-blue-500', bg: 'bg-blue-50', link: 'https://drive.google.com/drive/folders/1e8ye8kdNDrx6Nq2WbZLwOBbl99nWjW0t?usp=sharing' },
    { name: 'Secretaria / Atas', icon: History, color: 'text-purple-500', bg: 'bg-purple-50', link: 'https://drive.google.com/drive/folders/1P8WuOtIXnhFNi2ixVHTvs1KMSwol_FMM?usp=sharing' },
    { name: 'Fotos / Cobertura', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-50', link: 'https://drive.google.com/drive/folders/1-wCB-5XloAGaP6gB666et0rqJtRnvsCw?usp=sharing' },
  ];

  useEffect(() => {
    if (!localStorage.getItem('lobo_auth')) {
      navigate('/login');
      return;
    }
    const savedRole = localStorage.getItem('lobo_role') as Role;
    if (savedRole) setRole(savedRole);

    const updateConfig = () => setConfig(getConfig());
    window.addEventListener('lobo-db-sync', updateConfig);
    refresh();
    refreshAuth();
    return () => window.removeEventListener('lobo-db-sync', updateConfig);
  }, []);

  const refresh = () => {
    const db = getDb();
    const active = db.competitions.find(c => c.isActive);
    setActiveComp(active || null);
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(['competitions']);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, color: 'bg-emerald-500' },
    { 
      id: 'competitions_group', 
      label: 'Competições', 
      icon: Trophy, 
      color: 'bg-amber-500',
      children: [
        { id: 'competitions', label: 'Todas Competições', icon: Trophy, color: 'bg-amber-500' },
        { id: 'athletics', label: 'Atléticas', icon: Users, color: 'bg-blue-500' },
        { id: 'modalities', label: 'Modalidades', icon: Layers, color: 'bg-purple-500' },
        { id: 'results', label: 'Resultados', icon: CheckSquare, color: 'bg-green-500' },
        { id: 'penalties', label: 'Penalidades', icon: AlertTriangle, color: 'bg-red-500' },
      ]
    },
    { id: 'socios', label: 'Sócios', icon: UserCheck, color: 'bg-lobo-secondary' },
    { id: 'birthdays', label: 'Aniversariantes', icon: Cake, color: 'bg-pink-500' },
    { id: 'inventory', label: 'Estoque', icon: Package, color: 'bg-orange-500' },
    { id: 'marketing', label: 'Marketing', icon: Share2, color: 'bg-cyan-500' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'bg-zinc-500' }
  ];

  if (role === 'SUPER_ADMIN') {
    navItems.splice(navItems.length - 1, 0, { id: 'finance', label: 'Financeiro', icon: DollarSign, color: 'bg-emerald-500' });
  }

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const allTabs = navItems.flatMap(item => item.children ? [item, ...item.children] : [item]);
  const activeTabLabel = allTabs.find(t => t.id === activeTab)?.label || 'Painel';

  return (
    <div className="flex min-h-screen bg-zinc-50 relative overflow-x-hidden">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-80 bg-lobo-secondary text-white flex flex-col z-[70] lg:hidden shadow-2xl"
            >
              <div className="p-8 flex items-center justify-between border-b border-white/5">
                <div className="flex flex-col">
                  <h1 className="text-lg font-black uppercase tracking-tight">Menu Lobo</h1>
                  <p className="text-[9px] text-lobo-primary font-bold uppercase tracking-[0.2em] mt-1">Navegação Interna</p>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-6 space-y-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const hasChildren = !!item.children;
                  const isExpanded = expandedMenus.includes(item.id);
                  const isParentActive = hasChildren && item.children?.some(c => c.id === activeTab);
                  const isActive = activeTab === item.id || isParentActive;

                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          if (hasChildren) toggleMenu(item.id);
                          else {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-tight",
                          isActive ? "bg-white text-lobo-secondary" : "text-white/40 hover:bg-white/5"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isActive ? item.color : "bg-white/5")}>
                          <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-white/40")} />
                        </div>
                        {item.label}
                        {hasChildren && <ChevronRight className={cn("ml-auto w-4 h-4 transition-transform", isExpanded && "rotate-90")} />}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="pl-6 space-y-1 mt-1">
                          {item.children?.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab(sub.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest",
                                activeTab === sub.id ? "bg-white/10 text-white" : "text-white/20"
                              )}
                            >
                              <sub.icon className="w-3.5 h-3.5" />
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={() => { localStorage.removeItem('lobo_auth'); navigate('/login'); }}
                  className="w-full h-14 rounded-2xl border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Sair do Painel
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-72 bg-lobo-secondary text-white flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-8 pb-4 flex flex-col items-center pt-12">
          <div 
            onClick={() => navigate('/')}
            className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center cursor-pointer hover:scale-105 hover:rotate-3 transition-all shadow-lg shadow-black/20 overflow-hidden"
          >
            {config.logoUrl ? (
              <img src={config.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Trophy className="w-10 h-10 text-zinc-900" />
            )}
          </div>
          <div className="mt-6 overflow-hidden">
            <h1 className="text-lg font-black uppercase tracking-tight truncate leading-none">Atlética Lobo</h1>
            <p className="text-[10px] text-lobo-primary font-bold uppercase tracking-[0.3em] leading-none mt-3">Painel de Gestão</p>
          </div>
        </div>

        <nav className="flex-grow py-4 pl-10 pr-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
             <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Dashboard Principal</p>
          </div>
          
          {navItems.map(item => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isExpanded = expandedMenus.includes(item.id);
            const isParentActive = hasChildren && item.children?.some(c => c.id === activeTab);
            const isActive = activeTab === item.id || isParentActive;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (hasChildren) toggleMenu(item.id);
                    else setActiveTab(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                    isActive && !hasChildren
                      ? "bg-white text-lobo-secondary shadow-xl" 
                      : (isParentActive ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5")
                  )}
                >
                  <div className={cn(
                     "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                     //@ts-ignore
                     (isActive && !hasChildren) ? item.color : "bg-white/5 group-hover:bg-white/10"
                  )}>
                     <Icon className={cn("w-4 h-4", (isActive && !hasChildren) ? "text-white" : "text-white/40 group-hover:text-white")} />
                  </div>
                  <span className="text-xs font-black tracking-tight uppercase">{item.label}</span>
                  
                  {isActive && !hasChildren && (
                     <motion.div 
                      layoutId="sidebarActive"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-lobo-primary rounded-l-full" 
                     />
                  )}

                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      className="ml-auto opacity-20 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>

                {hasChildren && isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-6 space-y-1"
                  >
                    {item.children?.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(sub.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                            isSubActive 
                              ? "bg-white text-lobo-secondary shadow-lg" 
                              : "text-white/30 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div className={cn(
                             "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                             //@ts-ignore
                             isSubActive ? sub.color : "bg-white/5"
                          )}>
                             <SubIcon className={cn("w-3 h-3", isSubActive ? "text-white" : "text-white/40")} />
                          </div>
                          <span className="text-[10px] font-black tracking-tight uppercase">{sub.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => { localStorage.removeItem('lobo_auth'); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-red-500 transition-all group"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-left">
              Finalizar Sessão
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col lg:pl-72 w-full">
        {/* Top Bar */}
        <header className="h-28 md:h-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between shrink-0 sticky top-0 z-40 px-6 md:px-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col">
               <h2 className="text-xl md:text-2xl font-black text-lobo-secondary tracking-tighter uppercase leading-none">
                 {activeTabLabel}
               </h2>
               <div className="flex items-center gap-2 mt-1 md:mt-2">
                  <span className="text-[8px] md:text-[10px] font-black text-lobo-secondary uppercase tracking-widest">Gestão Lobo</span>
                  <div className="w-1 h-1 rounded-full bg-zinc-200" />
                  <span className="text-[8px] md:text-[10px] font-bold text-zinc-400">V. 3.0</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative mr-2">
               <button 
                 onClick={() => setShowDriveLinks(!showDriveLinks)}
                 className={cn(
                   "flex items-center justify-center w-12 h-12 md:w-auto md:px-6 md:py-2.5 rounded-2xl border transition-all shadow-sm active:scale-95 group",
                   showDriveLinks ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                 )}
               >
                 <Cloud className={cn("w-5 h-5 md:w-4 md:h-4 transition-colors", showDriveLinks ? "text-lobo-primary" : "text-zinc-400 group-hover:text-lobo-primary")} />
                 <span className="hidden md:block text-[10px] font-black uppercase tracking-widest ml-3">Drive</span>
               </button>

               <AnimatePresence>
                 {showDriveLinks && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowDriveLinks(false)} />
                     <motion.div
                       initial={{ opacity: 0, scale: 0.95, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: 10 }}
                       className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-zinc-100 overflow-hidden z-50 p-2"
                     >
                       <div className="px-5 py-4 border-b border-zinc-50">
                         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1">Drive</p>
                         <h4 className="text-xs font-black text-zinc-900 uppercase">Acesso Rápido</h4>
                       </div>
                       <div className="p-2 space-y-1">
                         {driveFolders.map((folder, i) => (
                           <a key={i} href={folder.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-all group">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", folder.bg)}>
                               <folder.icon className={cn("w-5 h-5", folder.color)} />
                             </div>
                             <div className="flex-grow">
                               <p className="text-[11px] font-black text-zinc-900 tracking-tight leading-none mb-1">{folder.name}</p>
                             </div>
                           </a>
                         ))}
                       </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>

             <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-lobo-secondary uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                <span className="text-xs font-black text-zinc-900 tabular-nums">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
             </div>

             <div className="hidden sm:flex items-center gap-4 pl-6 border-l border-zinc-100 h-10">
               <button 
                 onClick={() => navigate('/')}
                 title="Ver Site Público"
                 className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-lobo-secondary flex items-center justify-center text-lobo-primary shadow-lg shadow-black/10 hover:scale-105 transition-transform group"
               >
                 <ExternalLink className="w-5 h-5 md:w-6 md:h-6 group-hover:text-white transition-colors" />
               </button>
             </div>
          </div>
        </header>

        {/* Content Space */}
        <main className="flex-grow p-6 md:p-10 pb-28 md:pb-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-[1600px] mx-auto"
            >
              {activeTab === 'dashboard' && <DashboardTab activeComp={activeComp} />}
              {activeTab === 'competitions' && <CompetitionsTab onUpdate={refresh} />}
              {activeTab === 'athletics' && activeComp && <AthleticsTab comp={activeComp} />}
              {activeTab === 'birthdays' && <BirthdaysTab />}
              {activeTab === 'socios' && <SociosTab />}
              {activeTab === 'marketing' && <MarketingTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'finance' && role === 'SUPER_ADMIN' && <FinanceTab />}
              {activeTab === 'inventory' && <InventoryTab />}
              
              {(!activeComp && ['modalities', 'results', 'penalties', 'athletics'].includes(activeTab)) ? (
                <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 border border-amber-100">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Bloqueado</h3>
                  <p className="text-zinc-500 text-sm max-w-sm mt-3 font-medium">
                    Você precisa definir uma competição como <span className="font-bold text-lobo-primary">Ativa</span>.
                  </p>
                  <button 
                    onClick={() => setActiveTab('competitions')}
                    className="mt-8 bg-lobo-secondary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                  >
                    Ativar
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

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-zinc-100 h-20 px-4 flex items-center justify-around z-40 lg:hidden">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
            { id: 'socios', icon: UserCheck, label: 'Sócios' },
            { id: 'inventory', icon: Package, label: 'Estoque' },
            { id: 'finance', icon: DollarSign, label: 'Grana' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            if (item.id === 'finance' && role !== 'SUPER_ADMIN') return null;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1 relative py-1 px-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive ? "bg-lobo-secondary text-white shadow-lg" : "text-zinc-400"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[8px] font-black uppercase tracking-tighter", isActive ? "text-lobo-secondary" : "text-zinc-400")}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-zinc-400"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
               <Menu className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">Mais</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
