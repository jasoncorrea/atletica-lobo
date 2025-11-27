import React, { useState, useEffect } from 'react';
import { getDb, saveDb, handleImageUpload } from '../../../services/storageService';
import { Athletic } from '../../../types';

export const AthleticsTab: React.FC = () => {
  const [athletics, setAthletics] = useState<Athletic[]>([]);
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const load = () => setAthletics(getDb().athletics);
  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      // Create local preview
      const reader = new FileReader();
      reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDb();
    let logoUrl = editingId ? db.athletics.find(a => a.id === editingId)?.logoUrl : null;

    if (logoFile) {
      try {
        logoUrl = await handleImageUpload(logoFile);
      } catch (err) {
        alert('Erro ao processar imagem. Tente uma imagem menor ou verifique se o armazenamento está cheio.');
        return;
      }
    }

    try {
      if (editingId) {
        const idx = db.athletics.findIndex(a => a.id === editingId);
        if (idx !== -1) {
          db.athletics[idx] = { ...db.athletics[idx], name, logoUrl: logoUrl || db.athletics[idx].logoUrl };
        }
      } else {
        db.athletics.push({
          id: Math.random().toString(36).substring(2, 9),
          name,
          logoUrl: logoUrl || null
        });
      }

      saveDb(db);
      window.dispatchEvent(new Event('storage')); // Sync global
      resetForm();
      load();
    } catch (error) {
      // Error handled in saveDb with alert
      console.error("Failed to save athletic", error);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Excluir atlética?')) return;
    
    // Optimistic Update
    setAthletics(prev => prev.filter(a => a.id !== id));

    const db = getDb();
    db.athletics = db.athletics.filter(a => a.id !== id);
    saveDb(db);
    
    // Sync global
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (a: Athletic) => {
    setEditingId(a.id);
    setName(a.name);
    setUploadPreview(a.logoUrl);
    setLogoFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLogoFile(null);
    setUploadPreview(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Form */}
      <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit sticky top-4">
        <h3 className="text-lg font-medium mb-4">{editingId ? 'Editar Atlética' : 'Nova Atlética'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-lobo-primary focus:border-lobo-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo (Imagem)</label>
            <div className="mt-1 flex items-center space-x-4">
               {uploadPreview && (
                 <img src={uploadPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
               )}
               <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-lobo-primary hover:file:bg-orange-100"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              A imagem será redimensionada e otimizada automaticamente para economizar espaço.
            </p>
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 bg-lobo-primary text-white py-2 rounded-md hover:bg-orange-600 transition-colors">
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {athletics.map(a => (
          <div key={a.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {a.logoUrl ? (
                <img src={a.logoUrl} className="h-10 w-10 rounded-full object-cover border border-gray-200" alt={a.name} />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">N/A</div>
              )}
              <span className="font-bold text-gray-900">{a.name}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                type="button"
                onClick={() => handleEdit(a)} 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                Editar
              </button>
              <button 
                type="button"
                onClick={() => handleDelete(a.id)} 
                className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};