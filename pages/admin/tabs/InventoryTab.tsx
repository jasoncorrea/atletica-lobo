import React, { useState, useEffect } from 'react';
import { getDb, addItem, updateItem, deleteItem, handleImageUpload } from '../../../services/storageService';
import { Product } from '../../../types';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Tag,
  ArrowLeft,
  Upload,
  Box,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SIZES = ['Único', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

export const InventoryTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'list' | 'add'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState('Único');
  const [qty, setQty] = useState('');
  const [priceMember, setPriceMember] = useState('');
  const [priceNonMember, setPriceNonMember] = useState('');
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const load = () => {
    const all = getDb().products || [];
    const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
    setProducts(unique);
  };

  useEffect(() => { 
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSize('Único');
    setQty('');
    setPriceMember('');
    setPriceNonMember('');
    setImgUrl(null);
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setSize(p.size || 'Único');
    setQty(p.quantity.toString());
    setPriceMember(p.priceMember.toString());
    setPriceNonMember(p.priceNonMember.toString());
    setImgUrl(p.imageUrl);
    setSubTab('add');
  };

  const handleDelete = async (id: string) => {
    // Removed confirm as it can be unreliable in iframes
    await deleteItem('products', id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qty || !priceMember || !priceNonMember) return;

    const priceM = parseFloat(String(priceMember).replace(',', '.'));
    const priceNM = parseFloat(String(priceNonMember).replace(',', '.'));
    const quantity = parseInt(qty);

    const productData = {
      name: name.toUpperCase(),
      size,
      quantity,
      priceMember: priceM,
      priceNonMember: priceNM,
      imageUrl: imgUrl
    };

    if (editingId) {
      await updateItem('products', editingId, productData);
    } else {
      await addItem('products', productData);
    }

    resetForm();
    setSubTab('list');
    load();
  };

  const handleUpload = async (file: File) => {
    try {
      const url = await handleImageUpload(file);
      setImgUrl(url);
    } catch {
      alert('Erro ao carregar imagem.');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((acc, p) => acc + (p.quantity * p.priceMember), 0);
  const lowStock = products.filter(p => p.quantity < 5).length;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Inventory Navigation & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-lobo-primary" />
            Gestão de Estoque
          </h2>
          <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest">Produtos, Uniformes e Acessórios</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-100/50 p-2 rounded-2xl border border-zinc-200">
          <button 
            onClick={() => { setSubTab('list'); resetForm(); }}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              subTab === 'list' ? "bg-zinc-900 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            Estoque Atual
          </button>
          <button 
            onClick={() => setSubTab('add')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              subTab === 'add' ? "bg-lobo-secondary text-white shadow-xl" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {editingId ? 'Editar Item' : 'Novo Produto'}
          </button>
        </div>
      </div>

      {subTab === 'list' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lobo-primary/10 flex items-center justify-center text-lobo-primary">
                 <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Itens</p>
                <p className="text-xl font-black text-zinc-900 tabular-nums">{products.length}</p>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Valor Total</p>
                <p className="text-xl font-black text-zinc-900 tabular-nums">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Estoque Baixo</p>
                <p className="text-xl font-black text-zinc-900 tabular-nums">{lowStock} <span className="text-xs font-bold text-zinc-400 ml-1">itens</span></p>
              </div>
            </div>
            <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lobo-primary flex items-center justify-center text-zinc-900">
                 <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Vendas Loja</p>
                <p className="text-xl font-black tabular-nums">R$ 0,00</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
            <input 
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary transition-all shadow-sm"
              placeholder="Buscar por nome do produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-black/5 transition-all"
                >
                  <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200">
                        <ImageIcon className="w-16 h-16 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                       <span className={cn(
                         "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg",
                         p.quantity < 5 ? "bg-red-500 text-white" : "bg-white text-zinc-900 border border-zinc-100"
                       )}>
                         QTD: {p.quantity}
                       </span>
                       {p.size && p.size !== 'Único' && (
                         <span className="px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                           TAM: {p.size}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="h-12">
                      <h4 className="text-sm font-black text-zinc-900 leading-tight uppercase line-clamp-2">{p.name}</h4>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sócio</p>
                          <p className="text-base font-black text-emerald-600 tracking-tight">{formatCurrency(p.priceMember)}</p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Padrão</p>
                          <p className="text-base font-black text-zinc-900 tracking-tight">{formatCurrency(p.priceNonMember)}</p>
                       </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-20">
                <Package className="w-20 h-20 mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-widest italic">Nenhum item em estoque</p>
              </div>
            )}
          </div>
        </>
      )}

      {subTab === 'add' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto"
        >
          <button 
            onClick={() => { setSubTab('list'); resetForm(); }}
            className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Listagem
          </button>

          <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-[3rem] p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Definições Básicas</h3>
                  <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Nome Comercial do Produto</label>
                        <input className="w-full bg-zinc-100 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: CAMISA JOGOS 2026" />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Tamanho / Grade</label>
                           <div className="relative">
                              <select 
                                 className="w-full bg-zinc-100 appearance-none border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all"
                                 value={size}
                                 onChange={e => setSize(e.target.value)}
                              >
                                 {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Quantidade em Lote</label>
                           <input type="number" className="w-full bg-zinc-100 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all" value={qty} onChange={e => setQty(e.target.value)} required placeholder="0" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Tabela de Preços</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Preço Sócio Lobo</label>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-emerald-600">R$</span>
                           <input type="number" step="0.01" className="bg-transparent border-none p-0 text-xl font-black text-emerald-700 outline-none w-full" value={priceMember} onChange={e => setPriceMember(e.target.value)} required placeholder="0,00" />
                        </div>
                     </div>
                     <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Preço Não Sócio</label>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-zinc-400">R$</span>
                           <input type="number" step="0.01" className="bg-transparent border-none p-0 text-xl font-black text-zinc-900 outline-none w-full" value={priceNonMember} onChange={e => setPriceNonMember(e.target.value)} required placeholder="0,00" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-6">
                  <button className="w-full bg-lobo-secondary text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-lobo-primary/20 hover:brightness-110 active:scale-[0.98] transition-all">
                     Confirmar e Salvar Registro
                  </button>
               </div>
            </div>

            <div className="space-y-8">
               <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Visual do Produto</h3>
               <div className="relative group">
                  <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[3.5rem] aspect-square flex flex-col items-center justify-center p-4 relative overflow-hidden">
                     {imgUrl ? (
                        <motion.img 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={imgUrl} 
                          className="w-full h-full object-contain p-10" 
                        />
                     ) : (
                        <div className="flex flex-col items-center text-center">
                           <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-black/[0.02] mb-6">
                              <Upload className="w-10 h-10 text-zinc-300" />
                           </div>
                           <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Imagens de Alta Resolução</p>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Clique abaixo para carregar</p>
                        </div>
                     )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.5rem] flex items-center justify-center backdrop-blur-sm pointer-events-none">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Imagem</span>
                  </div>
                  <label className="mt-6 w-full flex items-center justify-center gap-3 bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-lobo-primary transition-colors">
                     <Upload className="w-4 h-4" />
                     Selecionar Arquivo
                     <input type="file" hidden accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                     }} />
                  </label>
               </div>

               <div className="p-8 bg-zinc-100/50 rounded-[2.5rem] border border-zinc-100">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Tag className="w-5 h-5 text-lobo-primary" />
                     </div>
                     <div>
                        <h5 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-1">Dica de Gestão</h5>
                        <p className="text-[10px] font-bold text-zinc-400 leading-relaxed uppercase">Mantenha os nomes dos produtos padronizados para facilitar a leitura dos relatórios de estoque e vendas no PDV.</p>
                     </div>
                  </div>
               </div>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};
