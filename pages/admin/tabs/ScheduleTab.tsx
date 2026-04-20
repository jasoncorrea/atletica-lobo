import React, { useState, useEffect } from 'react';
import { getDb, updateItem, deleteItem } from '../../../services/storageService';
import { ManagementEvent, ManagementEventType } from '../../../types';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';

export const ScheduleTab: React.FC = () => {
  const [events, setEvents] = useState<ManagementEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
  
  // Encontrar o último evento para saber até onde mostrar
  let endMonth = new Date();
  if (events.length > 0) {
    const eventDates = events.map(e => new Date(e.date + 'T12:00:00'));
    const maxDate = new Date(Math.max(...eventDates.map(d => d.getTime())));
    if (maxDate > endMonth) {
      endMonth = new Date(maxDate);
    }
  }
  // No mínimo mostrar 2 meses
  const monthsToShow = [];
  let currentMonth = new Date(startMonth);
  
  while (currentMonth <= endMonth || monthsToShow.length < 2) {
    monthsToShow.push(new Date(currentMonth));
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  const renderCalendar = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthEvents = events.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });

    return (
      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="bg-zinc-900 p-6 flex items-center justify-between">
          <h3 className="text-white font-black uppercase tracking-widest text-xs">
            {monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-lobo-primary" />
             <div className="w-2 h-2 rounded-full bg-white/20" />
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-7 border-b border-zinc-50">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-zinc-400 py-2">{d}</div>
          ))}
        </div>
        
        <div className="flex-grow grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-16 md:h-24 border-r border-b border-zinc-50 last:border-r-0" />;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = monthEvents.filter(e => e.date === dayStr);
            const isToday = new Date().toISOString().split('T')[0] === dayStr;

            return (
              <div key={day} className={cn(
                "h-16 md:h-24 border-r border-b border-zinc-50 p-1 md:p-2 relative group overflow-hidden last:border-r-0",
                isToday && "bg-orange-50/50"
              )}>
                <span className={cn(
                  "text-[10px] font-black tabular-nums transition-colors z-10 relative",
                  isToday ? "text-lobo-primary" : "text-zinc-600"
                )}>
                  {day}
                </span>
                
                <div className="mt-1 space-y-0.5 relative z-10">
                  {dayEvents.map(e => (
                    <div 
                      key={e.id}
                      className={cn(
                        "text-[8px] font-bold p-1 rounded-md border truncate cursor-help",
                        e.isImportant 
                          ? "bg-lobo-primary/10 border-lobo-primary/20 text-lobo-primary" 
                          : "bg-zinc-100 border-zinc-200 text-zinc-600"
                      )}
                      title={`${e.title} ${e.time ? `- ${e.time}` : ''}`}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>

                {dayEvents.length > 0 && (
                   <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <button 
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          dayEvents.forEach(evt => handleDelete(evt.id));
                        }}
                        className="pointer-events-auto p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic">Cronograma</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Planejamento e eventos da Atlética Lobo.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-lobo-secondary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all flex items-center gap-3"
        >
          <Plus className="w-4 h-4 text-lobo-primary" />
          Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {monthsToShow.map((m, i) => (
          <div key={i}>
            {renderCalendar(m)}
          </div>
        ))}
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
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="bg-zinc-900 p-8 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-lobo-primary/20 flex items-center justify-center">
                     <Plus className="w-5 h-5 text-lobo-primary" />
                   </div>
                   <h3 className="text-white font-black uppercase tracking-widest text-lg">Lançar Evento</h3>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleAdd} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título do Evento</label>
                      <input 
                        required
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-5 py-4 font-black text-xs text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-2 focus:ring-lobo-primary/20 transition-all outline-none"
                        placeholder="Ex: Reunião Geral"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data</label>
                      <input 
                        type="date"
                        required
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-5 py-4 font-black text-xs text-zinc-900 outline-none focus:ring-2 focus:ring-lobo-primary/20 transition-all"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo</label>
                      <select 
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl px-5 py-4 font-black text-xs text-zinc-900 outline-none focus:ring-2 focus:ring-lobo-primary/20 transition-all"
                        value={type}
                        onChange={e => setType(e.target.value as ManagementEventType)}
                      >
                        <option value="EVENTO">Evento</option>
                        <option value="REUNIAO">Reunião</option>
                        <option value="COMPROMISSO">Compromisso</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Horário (Opcional)</label>
                      <div className="relative">
                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input 
                          className="w-full bg-zinc-50 border-zinc-100 rounded-2xl pl-12 pr-5 py-4 font-black text-xs text-zinc-900 placeholder:text-zinc-300 outline-none"
                          placeholder="Ex: 19:30"
                          value={time}
                          onChange={e => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input 
                        className="w-full bg-zinc-50 border-zinc-100 rounded-2xl pl-12 pr-5 py-4 font-black text-xs text-zinc-900 placeholder:text-zinc-300 outline-none"
                        placeholder="Ex: Sala de Reunião Bloco A"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <input 
                      type="checkbox"
                      id="important"
                      className="w-5 h-5 rounded-lg border-zinc-200 text-lobo-primary focus:ring-lobo-primary cursor-pointer"
                      checked={isImportant}
                      onChange={e => setIsImportant(e.target.checked)}
                    />
                    <label htmlFor="important" className="text-xs font-black text-zinc-900 uppercase cursor-pointer select-none">Evento Importante (Destaque)</label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-lobo-secondary text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-3"
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
