import React, { useState, useEffect } from 'react';
import { getDb, saveDb, deleteItem } from '../../../services/storageService';
import { ManagementEvent, ManagementEventType } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Tag as TagIcon,
  MessageSquare,
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const EVENT_TYPES: { type: ManagementEventType, label: string, color: string, bg: string }[] = [
  { type: 'reuniao', label: 'Reunião', color: 'text-blue-500', bg: 'bg-blue-500' },
  { type: 'evento', label: 'Evento', color: 'text-purple-500', bg: 'bg-purple-500' },
  { type: 'competicao', label: 'Competição', color: 'text-amber-500', bg: 'bg-amber-500' },
  { type: 'post', label: 'Publicação/Post', color: 'text-cyan-500', bg: 'bg-cyan-500' },
  { type: 'prazo', label: 'Prazo/Entrega', color: 'text-red-500', bg: 'bg-red-500' },
  { type: 'outro', label: 'Outro', color: 'text-zinc-500', bg: 'bg-zinc-500' },
];

export const ScheduleTab: React.FC = () => {
  const [events, setEvents] = useState<ManagementEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ManagementEventType>('reuniao');

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
    if (!title || !date) return;

    setIsSaving(true);
    try {
      const db = getDb();
      const newEvent: ManagementEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: title.toUpperCase(),
        description: desc,
        date,
        type
      };

      // Adiciona localmente primeiro para ser instantâneo
      const updatedEvents = [...(db.managementEvents || []), newEvent];
      db.managementEvents = updatedEvents;
      setEvents(updatedEvents);
      
      // Fecha o modal e limpa os campos IMEDIATAMENTE para UX snappiness
      setShowAddModal(false);
      setTitle('');
      setDesc('');
      setIsSaving(false);

      // Salva no banco de dados em background sem bloquear a UI
      saveDb(db).catch(err => {
        console.error("Erro ao sincronizar cronograma:", err);
        // Se falhar no fundo, avisa o usuário pois o dado pode não ter sido persistido
        alert('Atenção: O evento foi adicionado visualmente, mas houve um erro ao salvar no servidor. Verifique sua conexão e tente novamente.');
      });
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao adicionar evento.');
      setIsSaving(false);
    }
  };

  const removeEvent = async (id: string) => {
    if (!confirm('Deseja excluir este evento do cronograma?')) return;
    try {
      await deleteItem('managementEvents', id);
    } catch (err) {
      alert('Erro ao excluir evento.');
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcula os meses para exibir (hoje até o último evento)
  const getMonthsToDisplay = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Encontra a data mais distante nos eventos
    let maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1); // Padrão 3 meses
    
    events.forEach(e => {
      const eventDate = new Date(e.date);
      if (eventDate > maxDate) {
        maxDate = eventDate;
      }
    });

    const months = [];
    let current = new Date(start);
    
    while (current <= maxDate || months.length < 1) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
      // Limite de segurança para 2 anos
      if (months.length > 24) break;
    }
    
    return months;
  };

  const monthsToDisplay = getMonthsToDisplay();

  const MonthCard: React.FC<{ date: Date }> = ({ date: monthDate }) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = monthDate.toLocaleString('pt-BR', { month: 'long' });

    return (
      <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{monthName} {year}</span>
        </div>
        
        <div className="grid grid-cols-7 bg-zinc-50/20 border-b border-zinc-50">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
            <div key={d} className="py-2 text-center text-[8px] font-black text-zinc-300 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-grow">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[70px] bg-zinc-50/10 border-r border-b border-zinc-50/50" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div key={day} className={cn(
                "min-h-[70px] border-r border-b border-zinc-50 p-1.5 flex flex-col relative group hover:bg-zinc-50 transition-colors",
                isToday && "bg-indigo-50/50"
              )}>
                <span className={cn(
                  "text-[10px] font-black mb-1 shrink-0",
                  isToday ? "text-indigo-600" : "text-zinc-400"
                )}>{day}</span>
                
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.map(e => {
                    const typeMeta = EVENT_TYPES.find(t => t.type === e.type);
                    return (
                      <div 
                        key={e.id}
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[7px] font-extrabold uppercase tracking-tighter truncate text-white leading-none shadow-sm",
                          typeMeta?.bg || 'bg-zinc-500'
                        )}
                        title={`${e.title}: ${e.description || ''}`}
                      >
                        {e.title}
                      </div>
                    );
                  })}
                </div>

                {/* Tooltip on hover (desktop only) */}
                {dayEvents.length > 0 && (
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-zinc-900 text-white p-2 rounded-lg text-[8px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 w-32 mb-1 shadow-xl">
                      {dayEvents.map(e => (
                        <div key={e.id} className="mb-1 last:mb-0">
                          <span className="font-black block uppercase tracking-tighter">{e.title}</span>
                          <span className="text-[7px] block opacity-60 leading-tight line-clamp-2">{e.description}</span>
                        </div>
                      ))}
                   </div>
                )}
              </div>
            );
          })}
          
          {/* Empty spaces at the end */}
          {Array.from({ length: (7 - (firstDay + daysInMonth) % 7) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="min-h-[70px] bg-zinc-50/10 border-r border-b border-zinc-50/50" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            Cronograma da Gestão
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4 italic">Planejamento Estratégico da Atlética Lobo</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
            <input 
              className="bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64 shadow-sm"
              placeholder="Buscar no cronograma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Multi-Month Calendar View */}
        <div className="xl:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {monthsToDisplay.map((monthDate, idx) => (
              <MonthCard key={idx} date={monthDate} />
            ))}
          </div>
        </div>

        {/* Legend & Upcoming */}
        <div className="xl:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-8">
            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Categorias do Planner</h4>
              <div className="grid grid-cols-2 gap-3">
                {EVENT_TYPES.map(cat => (
                  <div key={cat.type} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", cat.bg)} />
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tight">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                <span>Próximos Compromissos</span>
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
              </h4>
              <div className="space-y-4">
                {events
                  .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
                  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map((e, idx) => {
                    const typeMeta = EVENT_TYPES.find(t => t.type === e.type);
                    const eventDate = new Date(e.date);
                    return (
                      <motion.div 
                        key={e.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-all group group-event"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex flex-col items-center justify-center border shrink-0 bg-white shadow-sm", typeMeta?.color)}>
                          <span className="text-xs font-black leading-none">{eventDate.getDate() + 1}</span>
                          <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 mt-0.5">
                            {eventDate.toLocaleString('pt-BR', { month: 'short' }).slice(0, 3)}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h5 className="text-xs font-black text-zinc-900 truncate uppercase tracking-tight mb-1">{e.title}</h5>
                          <div className="flex items-center gap-2">
                             <span className={cn("text-[9px] font-bold uppercase", typeMeta?.color)}>{typeMeta?.label}</span>
                             <div className="w-1 h-1 rounded-full bg-zinc-200" />
                             <span className="text-[9px] font-bold text-zinc-300 uppercase">{e.description?.substring(0, 20)}...</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeEvent(e.id)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                {events.length === 0 && (
                  <div className="py-12 text-center opacity-30">
                    <Sparkles className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Agenda Limpa por enquanto</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Visão Estratégica</h4>
                   <AlertCircle className="w-4 h-4 text-white/50" />
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-tight leading-tight uppercase">Mantenha o foco nos prazos da diretoria</h3>
                   <p className="text-[10px] text-white/50 font-bold mt-4 uppercase tracking-widest leading-relaxed">
                     O sucesso de uma gestão está na organização das datas. Use este planner para alinhar reuniões e entregas críticas.
                   </p>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">Gestão Lobo 2026</span>
                   </div>
                </div>
             </div>
             <CalendarIcon className="absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.05] text-white rotate-12 transition-transform group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-12 space-y-8">
                <header className="flex items-center justify-between border-b border-zinc-50 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase leading-none">Novo Evento</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">Adicionar ao Cronograma da Gestão</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-all">
                    <Plus className="w-5 h-5 text-zinc-400 rotate-45" />
                  </button>
                </header>

                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título do Evento</label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-300"
                        placeholder="EX: REUNIÃO DE DIRETORIA"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input 
                          type="date"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                      <div className="relative">
                        <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <select 
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                          value={type}
                          onChange={e => setType(e.target.value as ManagementEventType)}
                        >
                          {EVENT_TYPES.map(cat => (
                            <option key={cat.type} value={cat.type}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações (Opcional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-5 w-4 h-4 text-zinc-300" />
                      <textarea 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-300 min-h-[120px] resize-none"
                        placeholder="Detalhes ou pauta da reunião..."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isSaving}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                      isSaving ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-zinc-900 text-white hover:bg-indigo-600"
                    )}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar no Cronograma'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
