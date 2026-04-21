import React, { useState, useEffect, useMemo } from 'react';
import { getDb, updateItem, deleteItem } from '../../../services/storageService';
import { ManagementEvent, ManagementEventType } from '../../../types';
import { 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  MapPin, 
  Search,
  Bell,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';

const CATEGORIES: { type: ManagementEventType; label: string; color: string }[] = [
  { type: 'REUNIAO', label: 'REUNIÃO', color: 'bg-blue-500' },
  { type: 'EVENTO', label: 'EVENTO', color: 'bg-purple-500' },
  { type: 'COMPETICAO', label: 'COMPETIÇÃO', color: 'bg-orange-500' },
  { type: 'POST', label: 'PUBLICAÇÃO/POST', color: 'bg-cyan-500' },
  { type: 'PRAZO_ENTREGA', label: 'PRAZO/ENTREGA', color: 'bg-red-500' },
  { type: 'OUTRO', label: 'OUTRO', color: 'bg-zinc-400' },
];

export const ScheduleTab: React.FC = () => {
  const [events, setEvents] = useState<ManagementEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // States para novo evento
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ManagementEventType>('EVENTO');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const load = () => {
    const db = getDb();
    setEvents(db.managementEvents || []);
  };

  useEffect(() => {
    load();
    window.addEventListener('lobo-db-sync', load);
    return () => window.removeEventListener('lobo-db-sync', load);
  }, []);

  const filteredEvents = useMemo(() => {
    if (!search) return events;
    return events.filter(e => 
      e.title.toLowerCase().includes(search.toLowerCase()) || 
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter(e => new Date(e.date + 'T12:00:00') >= now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: ManagementEvent = {
        id: crypto.randomUUID(),
        title,
        date,
        type,
        time,
        location,
        description: desc,
        isImportant
    };

    try {
        await updateItem('managementEvents', newEvent);
        setShowAddModal(false);
        resetForm();
    } catch (err) {
        console.error("Erro ao adicionar evento:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este evento?')) {
        try {
            await deleteItem('managementEvents', id);
        } catch (err) {
            console.error("Erro ao excluir evento:", err);
        }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('EVENTO');
    setTime('');
    setLocation('');
    setDesc('');
    setIsImportant(false);
  };

  // Lógica de Calendários
  const startMonth = new Date();
  startMonth.setDate(1);
  
  let endMonth = new Date();
  if (events.length > 0) {
    const eventDates = events.map(e => new Date(e.date + 'T12:00:00'));
    const maxDate = new Date(Math.max(...eventDates.map(d => d.getTime())));
    if (maxDate > endMonth) {
      endMonth = new Date(maxDate);
    }
  }
  const monthsToShow = [];
  let currentMonthIterator = new Date(startMonth);
  while (currentMonthIterator <= endMonth || monthsToShow.length < 2) {
    monthsToShow.push(new Date(currentMonthIterator));
    currentMonthIterator.setMonth(currentMonthIterator.getMonth() + 1);
  }

  const renderCalendar = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthEvents = filteredEvents.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
    });

    return (
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-8 border-b border-zinc-50">
          <h3 className="text-zinc-900 font-black uppercase tracking-widest text-xs">
            {monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="p-4 grid grid-cols-7 border-b border-zinc-50">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-zinc-300 py-2">{d}</div>
          ))}
        </div>
        
        <div className="flex-grow grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-16 md:h-20 border-r border-b border-zinc-50 last:border-r-0" />;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = monthEvents.filter(e => e.date === dayStr);
            const isToday = new Date().toISOString().split('T')[0] === dayStr;

            return (
              <div key={day} className={cn(
                "h-16 md:h-20 border-r border-b border-zinc-50 p-1 relative group overflow-hidden last:border-r-0",
                isToday && "bg-blue-50/30"
              )}>
                <span className={cn(
                  "text-[10px] font-black tabular-nums transition-colors z-10 relative",
                  isToday ? "text-blue-600" : "text-zinc-400"
                )}>
                  {day}
                </span>
                
                <div className="mt-1 flex flex-wrap gap-0.5 relative z-10">
                  {dayEvents.map(e => {
                    const cat = CATEGORIES.find(c => c.type === e.type);
                    return (
                      <div 
                        key={e.id}
                        className={cn("w-1.5 h-1.5 rounded-full", cat?.color || 'bg-zinc-400')}
                        title={`${e.title} ${e.time ? `- ${e.time}` : ''}`}
                      />
                    );
                  })}
                </div>

                {dayEvents.length > 0 && (
                   <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <button 
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          dayEvents.forEach(evt => handleDelete(evt.id));
                        }}
                        className="pointer-events-auto p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all outline-none"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Estilo Ref */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
             <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Cronograma da Gestão</h2>
            <p className="text-zinc-400 text-sm font-black uppercase italic tracking-widest mt-0.5">Planejamento Estratégico da Atlética Lobo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-zinc-400 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar no cronograma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-zinc-100 rounded-[1.5rem] pl-14 pr-8 py-5 w-full md:w-80 font-bold text-xs text-zinc-900 placeholder:text-zinc-300 shadow-sm focus:ring-4 focus:ring-zinc-100 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-200 hover:shadow-zinc-300 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendários (8 Colunas) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {monthsToShow.map((m, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
              {renderCalendar(m)}
            </div>
          ))}
        </div>

        {/* Sidebar (4 Colunas) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Categorias */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-sm">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Categorias do Planner</h4>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat.type} className="bg-zinc-50/50 rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-zinc-100 transition-all cursor-default">
                  <div className={cn("w-3 h-3 rounded-full shrink-0", cat.color)} />
                  <span className="text-[10px] font-black text-zinc-700 tracking-tight">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos Compromissos */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Próximos Compromissos</h4>
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(e => {
                  const cat = CATEGORIES.find(c => c.type === e.type);
                  return (
                    <div key={e.id} className="group p-4 rounded-2xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-1 h-10 rounded-full mt-1", cat?.color || 'bg-zinc-400')} />
                        <div className="flex-grow">
                          <h5 className="text-xs font-black text-zinc-900 line-clamp-1">{e.title}</h5>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black text-indigo-500 uppercase">
                              {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                            {e.time && (
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Clock className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-bold">{e.time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-zinc-200" />
                </div>
                <p className="text-zinc-300 text-[10px] font-black uppercase italic tracking-widest">Agenda limpa por enquanto</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo Evento */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              <div className="bg-zinc-900 p-8 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                     <Plus className="w-5 h-5 text-indigo-400" />
                   </div>
                   <h3 className="text-white font-black uppercase tracking-widest text-lg">Lançar Evento</h3>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleAdd} className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título do Evento</label>
                      <input 
                        required
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-6 py-5 font-black text-xs text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        placeholder="Ex: Reunião Geral"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data</label>
                      <input 
                        type="date"
                        required
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-6 py-5 font-black text-xs text-zinc-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo</label>
                      <select 
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-6 py-5 font-black text-xs text-zinc-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                        value={type}
                        onChange={e => setType(e.target.value as ManagementEventType)}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.type} value={cat.type}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Horário (Opcional)</label>
                      <div className="relative">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input 
                          className="w-full bg-zinc-50 border-zinc-100 rounded-2xl pl-14 pr-6 py-5 font-black text-xs text-zinc-900 placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                          placeholder="Ex: 19:30"
                          value={time}
                          onChange={e => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input 
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl pl-14 pr-6 py-5 font-black text-xs text-zinc-900 placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        placeholder="Ex: Sala de Reunião Bloco A"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <input 
                      type="checkbox"
                      id="important"
                      className="w-6 h-6 rounded-lg border-zinc-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={isImportant}
                      onChange={e => setIsImportant(e.target.checked)}
                    />
                    <label htmlFor="important" className="text-xs font-black text-zinc-900 uppercase cursor-pointer select-none tracking-tight">Evento Importante (Destaque)</label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white h-20 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  Confirmar Evento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

