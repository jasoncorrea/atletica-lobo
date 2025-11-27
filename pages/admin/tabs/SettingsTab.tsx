import React, { useState } from 'react';
import { getConfig, saveConfig, handleImageUpload } from '../../../services/storageService';

interface Props {
  onUpdate: () => void;
}

export const SettingsTab: React.FC<Props> = ({ onUpdate }) => {
  const [config, setConfig] = useState(getConfig());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    saveConfig(config);
    // Dispatch event to update Layout
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => {
        setIsSaving(false);
        onUpdate();
        alert('Configurações salvas!');
    }, 500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await handleImageUpload(e.target.files[0]);
        setConfig({ ...config, logoUrl: base64 });
      } catch (err) {
        alert('Erro ao processar imagem');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Personalização Visual</h3>
      
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Logo Principal (Header)</label>
           <div className="flex items-center space-x-4">
              {config.logoUrl && <img src={config.logoUrl} className="h-16 w-16 object-contain border p-1" />}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cor Primária (Header)</label>
            <div className="flex items-center mt-1">
              <input 
                type="color" 
                value={config.primaryColor}
                onChange={e => setConfig({...config, primaryColor: e.target.value})}
                className="h-10 w-10 border border-gray-300 rounded p-1"
              />
              <span className="ml-2 text-sm text-gray-500">{config.primaryColor}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Padrão Lobo: #e38702</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Cor Secundária (Detalhes)</label>
            <div className="flex items-center mt-1">
              <input 
                type="color" 
                value={config.secondaryColor}
                onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                className="h-10 w-10 border border-gray-300 rounded p-1"
              />
              <span className="ml-2 text-sm text-gray-500">{config.secondaryColor}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Padrão Lobo: #5a0509</p>
          </div>
        </div>

        <div className="pt-4">
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800"
           >
             {isSaving ? 'Salvando...' : 'Salvar Alterações'}
           </button>
        </div>
      </div>
    </div>
  );
};
