import React, { useState, useEffect } from 'react';
import { getDb, addItem, saveItems, deleteItem } from '../../../services/storageService';
import { FinanceCategory, Transaction, PaymentAccount, TransactionType } from '../../../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Plus, 
  Minus, 
  Download, 
  Filter, 
  Calendar as CalendarIcon,
  ShoppingBag,
  PartyPopper,
  Zap,
  Trash2,
  PieChart as PieChartIcon,
  X
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const FinanceTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'summary' | 'transactions' | 'categories'>('summary');
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // States para Nova Transação
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [acc, setAcc] = useState<PaymentAccount>('Mercado Pago');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // States para Categorias
  const [newCatName, setNewCatName] = useState('');

  // State para Filtro de Extrato
  const [filterCategory, setFilterCategory] = useState('');

  const load = () => {
    const db = getDb();
    
    const rawCats = db.financeCategories || [];
    const uniqueCats = Array.from(new Map(rawCats.map(c => [c.id, c])).values());
    setCategories(uniqueCats);
    
    const rawTxs = db.transactions || [];
    const uniqueTxs = Array.from(new Map(rawTxs.map(t => [t.id, t])).values());
    setTransactions(uniqueTxs.sort((a, b) => b.date - a.date));
  };

  useEffect(() => { 
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;
    if (type === 'expense' && !catId) {
      alert('Selecione uma categoria para saídas.');
      return;
    }

    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Valor inválido');
      return;
    }

    const db = getDb();
    const newTx: any = {
      type,
      amount: val,
      description: desc,
      categoryId: catId,
      account: acc,
      date: new Date(date).getTime(),
      createdAt: Date.now()
    };

    addItem('transactions', newTx);
    
    setAmount('');
    setDesc('');
    setShowAddModal(false);
    load();
  };

  const deleteTransaction = async (id: string) => {
    // Removed confirm as it can be unreliable in iframes
    await deleteItem('transactions', id);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    
    await addItem('financeCategories', {
      name: newCatName.toUpperCase(),
      isDefault: false
    });
    
    setNewCatName('');
    load();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => !filterCategory || t.categoryId === filterCategory);
  };

  const getBalance = (account?: PaymentAccount) => {
    return transactions
      .filter(t => !account || t.account === account)
      .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
  };

  const getExpensesByCategory = () => {
    const summary: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sem Categoria';
        summary[catName] = (summary[catName] || 0) + t.amount;
      });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  };

  const menuItems = [
    { id: 'summary', label: 'Resumo' },
    { id: 'transactions', label: 'Extrato' },
    { id: 'categories', label: 'Categorias' }
  ];

  const statCards = [
    { label: 'Renda com Festas', value: 0, icon: PartyPopper, color: 'bg-lobo-secondary' },
    { label: 'Renda com Produtos', value: 0, icon: ShoppingBag, color: 'bg-lobo-secondary' },
    { label: 'Mensalidades', value: getBalance(), icon: Zap, color: 'bg-lobo-secondary' },
    { label: 'Renda Avulsa', value: 0, icon: DollarSign, color: 'bg-lobo-secondary' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Finance Navigation */}
      <div className="flex items-center border-b border-zinc-200">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSubTab(item.id as any)}
            className={cn(
              "px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
              subTab === item.id ? "text-lobo-secondary" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {item.label}
            {subTab === item.id && (
              <motion.div 
                layoutId="financeTab"
                className="absolute bottom-0 left-8 right-8 h-0.5 bg-lobo-secondary" 
              />
            )}
          </button>
        ))}
      </div>

      {subTab === 'summary' && (
        <div className="space-y-10">
          {/* Summary Cards Row */}
          <section>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-6">Geração de Renda</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-6 rounded-2xl text-white shadow-lg shadow-black/5 relative overflow-hidden group", card.color)}
                >
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black tracking-tight mb-1">{formatCurrency(card.value)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{card.label}</p>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Action Bar */}
          <section className="bg-zinc-100/50 border border-zinc-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-lobo-secondary text-lobo-dark rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                <Download className="w-3.5 h-3.5" />
                Exportar
              </button>
              <div className="h-6 w-px bg-zinc-200 mx-2" />
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">
                <CalendarIcon className="w-3.5 h-3.5" />
                Selecionar Período
                <Plus className="w-3 h-3 text-zinc-400" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </button>
            </div>
          </section>

          {/* Secondary Stats & Quick Actions */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Receivables/Payables */}
              <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">A receber</p>
                  <p className="text-2xl font-black text-zinc-900 tracking-tight">R$ 0,00</p>
                </div>
                <button 
                  onClick={() => { setType('income'); setShowAddModal(true); }}
                  className="mt-8 w-full bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all"
                >
                  Novo Recebimento
                </button>
              </div>

              <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">A pagar</p>
                  <p className="text-2xl font-black text-zinc-900 tracking-tight">R$ 0,00</p>
                </div>
                <button 
                  onClick={() => { setType('expense'); setShowAddModal(true); }}
                  className="mt-8 w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-all"
                >
                  Novo Pagamento
                </button>
              </div>
            </div>

            <div className="bg-lobo-dark text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6 text-lobo-primary" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight mb-2 uppercase">Resultado Atual</h4>
                  <p className="text-4xl font-black text-lobo-primary tracking-tighter">{formatCurrency(getBalance())}</p>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Entradas</p>
                    <p className="text-sm font-black text-green-400">{formatCurrency(transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0))}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Saídas</p>
                    <p className="text-sm font-black text-red-400">{formatCurrency(transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0))}</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-lobo-primary/10 rounded-full -mr-32 -mb-32 blur-3xl" />
            </div>
          </section>

          {/* Charts Placeholder */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight uppercase">DRE - Gráfico</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Receitas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Despesas</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-4 px-4">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                       <div className="w-full bg-zinc-50 rounded-t-lg relative group h-48 flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            className="w-1/2 bg-green-500/80 rounded-t-sm group-hover:brightness-110 transition-all"
                          />
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h * 0.6}%` }}
                            className="w-1/2 bg-red-500/80 rounded-t-sm group-hover:brightness-110 transition-all"
                          />
                       </div>
                       <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Mês {i+1}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 tracking-tight uppercase mb-8">Distribuição por Categoria</h3>
                <div className="space-y-5">
                   {getExpensesByCategory().slice(0, 5).map(([cat, val], i) => {
                     const total = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
                     const percentage = total > 0 ? (val / total) * 100 : 0;
                     return (
                       <div key={cat} className="space-y-1.5">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{cat}</span>
                            <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{formatCurrency(val)}</span>
                         </div>
                         <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-lobo-secondary rounded-full" 
                           />
                         </div>
                       </div>
                     );
                   })}
                   {getExpensesByCategory().length === 0 && (
                     <div className="h-48 flex flex-col items-center justify-center text-center opacity-30">
                        <PieChartIcon className="w-12 h-12 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhuma despesa para análise</p>
                     </div>
                   )}
                </div>
             </div>
          </section>
        </div>
      )}

      {subTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Histórico de Lançamentos</h3>
            <div className="flex items-center gap-3">
              <select 
                className="bg-zinc-100 border-none rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-lobo-primary transition-all pointer-events-auto"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-lobo-secondary text-lobo-dark px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-lobo-primary/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Lançamento
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Conta</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Valor</th>
                      <th className="px-6 py-4 w-20"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                   {getFilteredTransactions().map(t => (
                      <tr key={t.id} className="group hover:bg-zinc-50/50 transition-colors">
                         <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-zinc-400 tabular-nums">
                               {new Date(t.date).toLocaleDateString()}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div>
                               <p className="text-sm font-black text-zinc-900 tracking-tight">{t.description}</p>
                               <span className="text-[9px] font-bold text-lobo-primary/60 uppercase tracking-widest">
                                  {categories.find(c => c.id === t.categoryId)?.name || 'Geral'}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                               {t.account}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <span className={cn(
                               "text-sm font-black tabular-nums",
                               t.type === 'income' ? "text-green-600" : "text-red-500"
                            )}>
                               {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount).replace('R$', '').trim()}
                            </span>
                            <span className="ml-1 text-[10px] font-bold text-zinc-400">BRL</span>
                         </td>
                         <td className="px-6 py-4">
                            <button 
                               onClick={() => deleteTransaction(t.id)}
                               className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {getFilteredTransactions().length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center opacity-20">
                   <Activity className="w-16 h-16 mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest">Nenhum lançamento registrado</p>
                </div>
             )}
          </div>
        </div>
      )}

      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm h-fit">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase mb-6">Nova Categoria</h3>
              <form onSubmit={addCategory} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Nome da Categoria</label>
                    <input 
                       className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-lobo-primary transition-all"
                       placeholder="Ex: EVENTOS, UNIFORMES..."
                       value={newCatName} 
                       onChange={e => setNewCatName(e.target.value)}
                       required 
                    />
                 </div>
                 <button className="w-full bg-lobo-dark text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-lobo-primary transition-all">
                    Criar Categoria
                 </button>
              </form>
           </div>

           <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase mb-6">Categorias do Clube</h3>
              <div className="grid grid-cols-1 gap-3">
                 {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group transition-all hover:border-lobo-primary/20">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-lobo-primary shadow-sm shadow-lobo-primary/50" />
                          <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">{c.name}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          {c.isDefault ? (
                             <span className="px-2 py-0.5 bg-zinc-200 rounded-md text-[8px] font-black text-zinc-500 uppercase">Sistema</span>
                          ) : (
                             <button onClick={() => deleteTransaction(c.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AnimatePresence>
         {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                  className="absolute inset-0 bg-lobo-dark/80 backdrop-blur-sm" 
               />
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
               >
                  <div className="p-10">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">
                           {type === 'income' ? 'Registrar Entrada' : 'Registrar Saída'}
                        </h3>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                           <X className="w-6 h-6 text-zinc-400" />
                        </button>
                     </div>
                     
                     <form onSubmit={addTransaction} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                              type="button" 
                              onClick={() => setType('income')}
                              className={cn(
                                 "p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                 type === 'income' ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-zinc-200 text-zinc-400"
                              )}
                           >
                              Entrada
                           </button>
                           <button 
                              type="button" 
                              onClick={() => setType('expense')}
                              className={cn(
                                 "p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                 type === 'expense' ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-zinc-200 text-zinc-400"
                              )}
                           >
                              Saída
                           </button>
                        </div>

                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Valor (R$)</label>
                                 <input 
                                    className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary"
                                    type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required 
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Data</label>
                                 <input 
                                    className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary"
                                    type="date" value={date} onChange={e => setDate(e.target.value)} required 
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Descrição do Lançamento</label>
                              <input 
                                 className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary"
                                 value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Venda de Ingressos" required 
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Conta</label>
                                 <select 
                                    className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary"
                                    value={acc} onChange={e => setAcc(e.target.value as PaymentAccount)}
                                 >
                                    <option value="Mercado Pago">Mercado Pago</option>
                                    <option value="PagBank">PagBank</option>
                                 </select>
                              </div>
                              {type === 'expense' && (
                                 <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Categoria</label>
                                    <select 
                                       className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary"
                                       value={catId} onChange={e => setCatId(e.target.value)} required
                                    >
                                       <option value="">Selecione...</option>
                                       {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                           <button 
                              type="button"
                              onClick={() => setShowAddModal(false)}
                              className="flex-1 bg-zinc-100 text-zinc-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                           >
                              Cancelar
                           </button>
                           <button 
                              type="submit"
                              className="flex-2 bg-lobo-secondary text-lobo-dark py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lobo-primary/20 hover:brightness-110 transition-all"
                           >
                              Salvar Lançamento
                           </button>
                        </div>
                     </form>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
