import React, { useState, useEffect } from 'react';
import { getDb, saveDb, handleImageUpload } from '../../../services/storageService';
import { Athletic } from '../../../types';

export const AthleticsTab: React.FC = () => {
  const [list, setList] = useState<Athletic[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const load = () => setList(getDb().athletics);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const db = getDb();

    if (editingId) {
      // Modo Edição: Atualiza o existente
      const index = db.athletics.findIndex(a => a.id === editingId);
      if (index !== -1) {
        db.athletics[index].name = name;
        saveDb(db);
        window.dispatchEvent(new Event('storage'));
        alert('Atlética atualizada com sucesso!');
      }
    } else {
      // Modo Criação: Adiciona novo
      db.athletics.push({ id: Math.random().toString(), name, logoUrl: null });
      saveDb(db);
      window.dispatchEvent(new Event('storage'));
    }

    load(); 
    resetForm();
  };

  const startEditing = (athletic: Athletic) => {
    setName(athletic.name);
    setEditingId(athletic.id);
    // Rola a página para o topo para ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const uploadLogo = async (id: string, file: File) => {
    try {
      const url = await handleImageUpload(file);
      const db = getDb();
      const ath = db.athletics.find(a => a.id === id);
      if (ath) ath.logoUrl = url;
      saveDb(db);
      window.dispatchEvent(new Event('storage'));
      load();
    } catch { alert('Erro no upload'); }
  };

  const remove = (id: string) => {
    if (editingId === id) resetForm(); // Cancela edição se excluir o item sendo editado
    const db = getDb();
    db.athletics = db.athletics.filter(a => a.id !== id);
    saveDb(db);
    window.dispatchEvent(new Event('storage'));
    setList(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className={`h-fit p-4 rounded transition-colors ${editingId ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50'}`}>
        <label className="block text-sm font-bold mb-2">
          {editingId ? 'Editando Atlética' : 'Nova Atlética'}
        </label>
        <div className="flex flex-col gap-2">
          <input 
            className="border p-2 w-full rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-lobo-primary" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nome da Atlética" 
            required 
          />
          <div className="flex gap-2">
            <button type="submit" className={`flex-grow text-white px-4 py-2 rounded font-bold transition ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-lobo-primary hover:bg-orange-600'}`}>
              {editingId ? 'Salvar Alteração' : 'Adicionar'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-400">
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <ul className="space-y-2">
        {list.map(a => (
          <li key={a.id} className={`border p-3 rounded flex justify-between items-center bg-white transition ${editingId === a.id ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center gap-3">
              {a.logoUrl ? <img src={a.logoUrl} className="w-8 h-8 rounded-full object-cover border" /> : <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">?</div>}
              <span className="font-bold text-gray-800">{a.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => startEditing(a)} 
                className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded font-medium transition"
              >
                Editar
              </button>
              
              <label className="cursor-pointer text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded font-medium transition">
                {a.logoUrl ? 'Trocar Logo' : 'Add Logo'}
                <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && uploadLogo(a.id, e.target.files[0])} />
              </label>

              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); remove(a.id); }} 
                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded font-medium transition"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};