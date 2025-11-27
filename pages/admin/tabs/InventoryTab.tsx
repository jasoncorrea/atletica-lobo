
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, handleImageUpload } from '../../../services/storageService';
import { Product } from '../../../types';

const SIZES = ['Único', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

export const InventoryTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'list' | 'add'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState('Único'); // Default
  const [qty, setQty] = useState('');
  const [priceMember, setPriceMember] = useState('');
  const [priceNonMember, setPriceNonMember] = useState('');
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const load = () => {
    const db = getDb();
    setProducts(db.products);
  };

  useEffect(() => { load(); }, []);

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
    setSubTab('add'); // Muda para a aba de formulário
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    const db = getDb();
    db.products = db.products.filter(p => p.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    load();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qty || !priceMember || !priceNonMember) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const db = getDb();
    const newProduct: Product = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name,
      size,
      quantity: parseInt(qty),
      priceMember: parseFloat(priceMember.replace(',', '.')),
      priceNonMember: parseFloat(priceNonMember.replace(',', '.')),
      imageUrl: imgUrl
    };

    if (editingId) {
      const idx = db.products.findIndex(p => p.id === editingId);
      if (idx !== -1) db.products[idx] = newProduct;
    } else {
      db.products.push(newProduct);
    }

    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    
    alert('Produto salvo com sucesso!');
    resetForm();
    setSubTab('list');
    load();
  };

  const handleUpload = async (file: File) => {
    try {
      const url = await handleImageUpload(file);
      setImgUrl(url);
    } catch {
      alert('Erro ao carregar imagem. Tente uma menor.');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b pb-4">
        <button 
          onClick={() => { setSubTab('list'); resetForm(); }} 
          className={`px-4 py-2 rounded-full text-sm font-bold ${subTab === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Lista de Produtos
        </button>
        <button 
          onClick={() => setSubTab('add')} 
          className={`px-4 py-2 rounded-full text-sm font-bold ${subTab === 'add' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {editingId ? 'Editar Produto' : 'Adicionar Produto'}
        </button>
      </div>

      {subTab === 'list' && (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 w-16">Img</th>
                <th className="p-3">Produto</th>
                <th className="p-3 text-center">Qtd</th>
                <th className="p-3">Preços</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} className="w-10 h-10 object-cover rounded bg-gray-200" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">📷</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{p.name}</span>
                      {p.size && p.size !== 'Único' && (
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded border border-gray-300">
                          {p.size}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded font-bold ${p.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-xs text-gray-500">Sócio: <span className="font-bold text-green-700">{formatCurrency(p.priceMember)}</span></div>
                    <div className="text-xs text-gray-500">Não Sócio: <span className="font-bold text-gray-800">{formatCurrency(p.priceNonMember)}</span></div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-2 py-1 rounded">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-xs font-bold bg-red-50 px-2 py-1 rounded">Excluir</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'add' && (
        <form onSubmit={handleSave} className="max-w-2xl bg-gray-50 p-6 rounded shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-gray-800">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-grow">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nome do Produto</label>
                  <input className="w-full p-2 border rounded bg-white text-gray-900" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Moletom Lobo" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Tamanho</label>
                  <select 
                    className="w-full p-2 border rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-lobo-primary"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Quantidade Inicial</label>
                <input type="number" className="w-full p-2 border rounded bg-white text-gray-900" value={qty} onChange={e => setQty(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-green-600 mb-1">Preço Sócio (R$)</label>
                  <input type="number" step="0.01" className="w-full p-2 border rounded bg-white text-gray-900" value={priceMember} onChange={e => setPriceMember(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Preço Não Sócio (R$)</label>
                  <input type="number" step="0.01" className="w-full p-2 border rounded bg-white text-gray-900" value={priceNonMember} onChange={e => setPriceNonMember(e.target.value)} required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Imagem do Produto</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-white min-h-[200px]">
                {imgUrl ? (
                  <img src={imgUrl} className="max-h-32 object-contain mb-2" />
                ) : (
                  <div className="text-gray-300 text-4xl mb-2">📷</div>
                )}
                <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded transition">
                  Escolher Imagem
                  <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
             <button className="bg-lobo-primary hover:bg-orange-600 text-white py-3 px-8 rounded font-bold shadow-lg transition">
               Salvar Produto
             </button>
             {editingId && (
               <button type="button" onClick={() => { setSubTab('list'); resetForm(); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded font-bold transition">
                 Cancelar
               </button>
             )}
          </div>
        </form>
      )}
    </div>
  );
};
