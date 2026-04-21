
import React, { useState, useEffect } from 'react';
import { getDb, addItem, deleteItem, updateItem, isQuotaExceeded, getConfig, saveConfig } from '../../../services/storageService';
import { PlannerEvent, AppConfig } from '../../../types';
import { 
  getDaysInMonth, 
  startOfMonth, 
  getDay, 
  format, 
  addMonths, 
  isSameDay, 
  startOfDay, 
  endOfMonth, 
  isSameMonth,
  differenceInCalendarMonths,
  addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Clock, 
  MapPin, 
  Search,
  Bell,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_COLORS: Record<string, string> = {
  'REUNIÃO': 'bg-blue-500',
  'EVENTO': 'bg-purple-500',
  'COMPETIÇÃO': 'bg-amber-500',
  'PUBLICAÇÃO/POST': 'bg-cyan-500',
  'PRAZO/ENTREGA': 'bg-red-500',
  'AMISTOSO/ESPORTES': 'bg-green-500',
  'PRODUTOS': 'bg-pink-500',
  'OUTRO': 'bg-zinc-500',
};

const CATEGORY_BG: Record<string, string> = {
  'REUNIÃO': 'bg-blue-50',
  'EVENTO': 'bg-purple-50',
  'COMPETIÇÃO': 'bg-amber-50',
  'PUBLICAÇÃO/POST': 'bg-cyan-50',
  'PRAZO/ENTREGA': 'bg-red-50',
  'AMISTOSO/ESPORTES': 'bg-green-50',
  'PRODUTOS': 'bg-pink-50',
  'OUTRO': 'bg-zinc-50',
};

const CATEGORY_TEXT: Record<string, string> = {
  'REUNIÃO': 'text-blue-600',
  'EVENTO': 'text-purple-600',
  'COMPETIÇÃO': 'text-amber-600',
  'PUBLICAÇÃO/POST': 'text-cyan-600',
  'PRAZO/ENTREGA': 'text-red-600',
  'AMISTOSO/ESPORTES': 'text-green-600',
  'PRODUTOS': 'text-pink-600',
  'OUTRO': 'text-zinc-600',
};

export const ScheduleTab: React.FC = () => {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, title: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateInput, setDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<PlannerEvent>>({
    category: 'REUNIÃO',
  });

  useEffect(() => {
    const refresh = () => {
      const allEvents = getDb().plannerEvents || [];
      const seen = new Set();
      const uniqueEvents = allEvents.filter(e => {
        if (!e.id || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
      setEvents(uniqueEvents);
      setConfig(getConfig());
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const togglePublicCategory = async (category: string) => {
    const currentCategories = config.publicEventCategories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    const newConfig = { ...config, publicEventCategories: newCategories };
    setConfig(newConfig);
    await saveConfig(newConfig);
  };

  const handleAddEvent = async () => {
    if (isSaving) return;
    
    const parsedDate = new Date(dateInput + 'T12:00:00');
    
    if (!newEvent.title || isNaN(parsedDate.getTime())) {
      alert('Por favor, preencha o título e uma data válida.');
      return;
    }
    
    setIsSaving(true);
    try {
      await addItem('plannerEvents', {
        ...newEvent,
        title: newEvent.title.trim().toUpperCase(),
        date: parsedDate.getTime()
      });
      
      setShowModal(false);
      setNewEvent({ category: 'REUNIÃO' });
      setDateInput(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      console.error("Error adding event:", error);
      alert('Erro ao salvar o compromisso. Verifique se você está logado ou se há conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirmDelete) return;
    
    setIsSaving(true);
    try {
      await deleteItem('plannerEvents', confirmDelete.id);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert('Erro ao excluir o compromisso.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = React.useMemo(() => startOfDay(new Date()), []);

  const monthsToShow = React.useMemo(() => {
    const lastEventDate = events.length > 0 
      ? new Date(Math.max(...events.map(e => e.date))) 
      : today;
    
    const totalMonths = Math.min(12, Math.max(3, differenceInCalendarMonths(lastEventDate, today) + 1));
    return Array.from({ length: totalMonths }, (_, i) => addMonths(today, i));
  }, [events, today]); // today is stable enough or can be memoized if needed, but here it's fine

  const upcomingEvents = React.useMemo(() => {
    return [...events]
      .filter(e => e.date >= startOfDay(today).getTime())
      .sort((a, b) => a.date - b.date)
      .slice(0, 15);
  }, [events, today]);

  const renderCalendar = React.useCallback((monthDate: Date) => {
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDayOfMonth = getDay(startOfMonth(monthDate));
    const paddingDays = firstDayOfMonth === 0 ? 0 : firstDayOfMonth; // Simple 0=Sun to 6=Sat
    
    const days = [];
    for (let i = 0; i < paddingDays; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), i));

    const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const monthKey = format(monthDate, 'yyyy-MM');

    return (
      <div key={`calendar-${monthKey}`} className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 overflow-hidden group hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 group-hover:text-lobo-secondary transition-colors">
            {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekdays.map((d, idx) => (
            <div key={`weekday-${monthKey}-${idx}`} className="text-center text-[10px] font-black text-zinc-300 py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-50">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${monthKey}-${idx}`} className="bg-white aspect-square" />;
            
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
            const isToday = isSameDay(day, today);
            const isSelectedMonth = isSameMonth(day, monthDate);
            const dayKey = `day-${monthKey}-${day.getDate()}`;

            return (
              <div 
                key={dayKey} 
                className={cn(
                  "bg-white min-h-[80px] p-2 flex flex-col items-stretch justify-start relative group/day transition-colors border-r border-b border-zinc-50 last:border-r-0",
                  !isSelectedMonth && "opacity-20 pointer-events-none"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-lg transition-all",
                    isToday ? "bg-lobo-secondary text-white shadow-lg shadow-lobo-secondary/30" : "text-zinc-400 group-hover/day:text-zinc-900"
                  )}>
                    {day.getDate()}
                  </span>
                </div>
                
                <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                  {dayEvents.slice(0, 6).map((e, dotIdx) => (
                    <button 
                      key={`dot-${e.id}-${dotIdx}`} 
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setConfirmDelete({ id: e.id, title: e.title });
                      }}
                      className={cn(
                        "text-[9px] font-black uppercase truncate px-2 py-1 rounded-md text-white w-full text-left hover:brightness-110 transition-all active:scale-[0.98] shadow-sm",
                        CATEGORY_COLORS[e.category]
                      )}
                      title={`${e.title} (Clique para opções)`}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 6 && (
                    <div className="text-[7px] font-black text-center text-zinc-300 uppercase pt-0.5">
                      +{dayEvents.length - 6} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [events, today]);

  return (
    <div className="space-y-10 pb-20">
      {/* Settings Section */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Bell className="w-24 h-24 text-lobo-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-lobo-light rounded-2xl text-lobo-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Feed Público na Home</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Selecione quais categorias aparecerão na faixa da página inicial</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {Object.keys(CATEGORY_COLORS).map(cat => {
              const isSelected = config.publicEventCategories?.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => togglePublicCategory(cat)}
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border flex items-center gap-2",
                    isSelected 
                      ? "bg-lobo-dark text-white border-lobo-dark shadow-lg shadow-zinc-900/20" 
                      : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-lobo-primary" : "bg-zinc-200")} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Cronograma da Gestão</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-3 italic">Planejamento Estratégico da Atlética Lobo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-lobo-secondary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar no cronograma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-zinc-100 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold text-zinc-900 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-lobo-primary/20 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-lobo-dark text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-lobo-primary" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-9 space-y-8">
          {monthsToShow.map(m => renderCalendar(m))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-8">
          {/* Categories Card */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-7">
             <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 px-1">Categorias do Planner</h3>
             <div className="grid grid-cols-1 gap-2">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-50 group hover:bg-white hover:border-zinc-100 transition-all cursor-default">
                    <div className={cn("w-3 h-3 rounded-full shrink-0", color)} />
                    <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-900 tracking-tight">{cat.split('/')[0]}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
               <Bell className="w-12 h-12 text-lobo-secondary" />
            </div>

            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              Próximos Compromissos
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-lobo-primary animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-lobo-primary/40" />
              </div>
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => (
                  <div key={`${event.id}-${idx}`} className="group/item relative p-4 rounded-3xl bg-zinc-50 border border-zinc-50 hover:bg-white hover:border-zinc-100 hover:shadow-xl hover:shadow-black/5 transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg", CATEGORY_BG[event.category], CATEGORY_TEXT[event.category])}>
                          {event.category}
                       </span>
                       <button 
                        onClick={() => setConfirmDelete({ id: event.id, title: event.title })}
                        disabled={isSaving}
                        className="opacity-60 hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-all active:scale-90 disabled:opacity-30"
                        title="Excluir Compromisso"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <h4 className="text-xs font-black text-zinc-900 uppercase leading-tight mb-2">{event.title}</h4>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase">{format(new Date(event.date), "dd 'de' MMM", { locale: ptBR })}</span>
                       </div>
                       {event.location && (
                         <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase truncate max-w-[100px]">{event.location}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                   <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-zinc-200" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Agenda limpa por enquanto</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[3rem] shadow-2xl z-[110] overflow-hidden"
            >
              <div className="bg-lobo-dark p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Plus className="w-20 h-20 text-lobo-primary" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Novo Compromisso</h3>
                <p className="text-[9px] text-lobo-primary font-bold uppercase tracking-[0.3em] mt-2 italic">Adicionar ao Cronograma Oficial</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título do Evento</label>
                  <input 
                    type="text" 
                    value={newEvent.title || ''}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value.toUpperCase()})}
                    placeholder="EX: REUNIÃO DE DIRETORIA"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-lobo-primary/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data</label>
                    <input 
                      type="date" 
                      value={dateInput}
                      onChange={e => setDateInput(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-900 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      value={newEvent.category}
                      onChange={e => setNewEvent({...newEvent, category: e.target.value as any})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-900 outline-none"
                    >
                      {Object.keys(CATEGORY_COLORS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ) as any)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local (Opcional)</label>
                  <input 
                    type="text" 
                    value={newEvent.location || ''}
                    onChange={e => setNewEvent({...newEvent, location: e.target.value.toUpperCase()})}
                    placeholder="EX: SALA DE REUNIÕES OU GOOGLE MEET"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-900 outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 border border-zinc-100 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddEvent}
                    disabled={isSaving || isQuotaExceeded()}
                    className="flex-1 py-4 bg-lobo-secondary text-lobo-dark font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Compromisso'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl z-[160] overflow-hidden p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-2">Excluir Compromisso?</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                Você está prestes a remover o evento <span className="text-zinc-900">"{confirmDelete.title}"</span>. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 border border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteEvent}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {isSaving ? 'Limpando...' : 'Sim, Excluir'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
