import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../../../services/storageService';
import { FinanceCategory, Transaction, PaymentAccount, TransactionType } from '../../../types';

export const FinanceTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'transactions' | 'categories' | 'reports'>('transactions');
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // States para Nova Transação
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [acc, setAcc] = useState<PaymentAccount>('Mercado Pago');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // States para Categorias (Criação e Edição)
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const load = () => {
    const db = getDb();
    setCategories(db.financeCategories);
    // Ordena transações da mais recente para a mais antiga
    setTransactions(db.transactions.sort((a, b) => b.date - a.date));
  };

  useEffect(() => { load(); }, []);

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
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: val,
      description: desc,
      categoryId: catId,
      account: acc,
      date: new Date(date).getTime(),
      createdAt: Date.now()
    };

    db.transactions.push(newTx);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    
    // Reset form
    setAmount('');
    setDesc('');
    alert('Lançamento salvo!');
    load();
  };

  const deleteTransaction = (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    const db = getDb();
    db.transactions = db.transactions.filter(t => t.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load();
  };

  // --- LÓGICA DE CATEGORIAS ---

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const db = getDb();
    db.financeCategories.push({
      id: Math.random().toString(36).substr(2, 9),
      name: newCatName.toUpperCase(),
      isDefault: false
    });
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setNewCatName('');
    load();
  };

  const startEditingCategory = (cat: FinanceCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const saveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId || !editingCatName.trim()) return;

    const db = getDb();
    const index = db.financeCategories.findIndex(c => c.id === editingCatId);
    if (index !== -1) {
      db.financeCategories[index].name = editingCatName.toUpperCase();
      saveDb(db);
      window.dispatchEvent(new Event('storage'));
    }
    
    setEditingCatId(null);
    setEditingCatName('');
    load();
  };

  const cancelCategoryEdit = () => {
    setEditingCatId(null);
    setEditingCatName('');
  };

  const deleteCategory = (id: string) => {
    const db = getDb();
    const inUse = db.transactions.some(t => t.categoryId === id);
    if (inUse) {
      alert('Não é possível excluir: existem transações vinculadas a esta categoria. Exclua ou edite as transações primeiro.');
      return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    db.financeCategories = db.financeCategories.filter(c => c.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load();
  };

  // --- RELATÓRIOS ---
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
    return Object.entries(summary).sort((a, b) => b[1] - a[1]); // Order by highest expense
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b pb-4">
        <button onClick={() => setSubTab('transactions')} className={`px-4 py-2 rounded-full text-sm font-bold ${subTab === 'transactions' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Lançamentos</button>
        <button onClick={() => setSubTab('categories')} className={`px-4 py-2 rounded-full text-sm font-bold ${subTab === 'categories' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Categorias</button>
        <button onClick={() => setSubTab('reports')} className={`px-4 py-2 rounded-full text-sm font-bold ${subTab === 'reports' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Relatórios</button>
      </div>

      {subTab === 'transactions' && (
        <div className="grid md:grid-cols-3 gap-8">
          <form onSubmit={addTransaction} className="bg-gray-50 p-6 rounded shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Novo Lançamento</h3>
            
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded font-bold text-sm ${type === 'income' ? 'bg-green-600 text-white' : 'bg-white border text-gray-500'}`}>Entrada</button>
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded font-bold text-sm ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-white border text-gray-500'}`}>Saída</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Valor (R$)</label>
                <input className="w-full p-2 border rounded bg-white text-gray-900" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500">Data</label>
                <input className="w-full p-2 border rounded bg-white text-gray-900" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Descrição</label>
                <input className="w-full p-2 border rounded bg-white text-gray-900" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Venda de Canecas" required />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Conta</label>
                <select className="w-full p-2 border rounded bg-white text-gray-900" value={acc} onChange={e => setAcc(e.target.value as PaymentAccount)}>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="PagBank">PagBank</option>
                </select>
              </div>

              {type === 'expense' && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Categoria</label>
                  <select className="w-full p-2 border rounded bg-white text-gray-900" value={catId} onChange={e => setCatId(e.target.value)} required>
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <button className="w-full bg-gray-900 text-white py-3 rounded font-bold mt-4">Salvar Lançamento</button>
            </div>
          </form>

          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Extrato Recente</h3>
            <div className="bg-white rounded shadow-sm border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Conta</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-800">{t.description}</div>
                        {t.type === 'expense' && (
                          <div className="text-xs text-gray-400 uppercase">{categories.find(c => c.id === t.categoryId)?.name}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-500">{t.account}</td>
                      <td className={`p-3 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'expense' ? '- ' : '+ '}{formatCurrency(t.amount)}
                      </td>
                      <td className="p-3">
                        <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum lançamento encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'categories' && (
        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={addCategory} className="bg-gray-50 p-6 rounded shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-4">Nova Categoria</h3>
            <div className="flex gap-2">
              <input 
                className="flex-1 p-2 border rounded bg-white text-gray-900" 
                placeholder="Nome da Categoria (Ex: UNIFORMES)" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                required 
              />
              <button className="bg-gray-900 text-white px-4 rounded font-bold">Add</button>
            </div>
          </form>

          <div className="bg-white rounded shadow-sm border p-4">
            <h3 className="font-bold text-gray-800 mb-4">Categorias Cadastradas</h3>
            <ul className="divide-y">
              {categories.map(c => (
                <li key={c.id} className="py-3 flex justify-between items-center group">
                  {editingCatId === c.id ? (
                    <form onSubmit={saveCategoryEdit} className="flex gap-2 w-full">
                      <input 
                        className="flex-grow border p-1 rounded text-sm bg-white text-gray-900"
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="text-green-600 text-xs font-bold px-2 py-1 bg-green-50 rounded">Salvar</button>
                      <button type="button" onClick={cancelCategoryEdit} className="text-gray-500 text-xs font-bold px-2 py-1 bg-gray-100 rounded">Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-gray-700">{c.name}</span>
                      <div className="flex items-center gap-2">
                         <button 
                            type="button"
                            onClick={() => startEditingCategory(c)} 
                            className="text-blue-500 text-xs hover:bg-blue-50 px-2 py-1 rounded transition"
                         >
                           Editar
                         </button>
                         <button 
                            type="button"
                            onClick={() => deleteCategory(c.id)} 
                            className="text-red-500 text-xs hover:bg-red-50 px-2 py-1 rounded transition"
                         >
                           Excluir
                         </button>
                         {c.isDefault && <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">Padrão</span>}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {subTab === 'reports' && (
        <div className="space-y-8">
          {/* CARDS DE SALDO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
              <div className="text-gray-500 text-sm font-bold uppercase mb-1">Saldo Geral</div>
              <div className={`text-2xl font-black ${getBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getBalance())}
              </div>
            </div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-sky-400">
              <div className="text-gray-500 text-sm font-bold uppercase mb-1">Mercado Pago</div>
              <div className="text-xl font-bold text-gray-800">{formatCurrency(getBalance('Mercado Pago'))}</div>
            </div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
              <div className="text-gray-500 text-sm font-bold uppercase mb-1">PagBank</div>
              <div className="text-xl font-bold text-gray-800">{formatCurrency(getBalance('PagBank'))}</div>
            </div>
          </div>

          {/* GRÁFICO DE BARRAS CSS */}
          <div className="bg-white p-6 rounded shadow border">
            <h3 className="font-bold text-gray-800 mb-6">Despesas por Categoria</h3>
            <div className="space-y-4">
              {getExpensesByCategory().map(([catName, value], idx, arr) => {
                const maxVal = arr[0][1]; // O maior valor define a escala 100%
                const percent = (value / maxVal) * 100;
                return (
                  <div key={catName}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-gray-700">{catName}</span>
                      <span className="text-gray-600">{formatCurrency(value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div 
                        className="bg-lobo-primary h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {getExpensesByCategory().length === 0 && (
                <div className="text-center text-gray-400 italic">Sem despesas registradas.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};