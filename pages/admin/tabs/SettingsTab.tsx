import React, { useState } from 'react';
import { getConfig, saveConfig, handleImageUpload } from '../../../services/storageService';

export const SettingsTab: React.FC = () => {
  const [cfg, setCfg] = useState(getConfig());

  const save = () => {
    saveConfig(cfg);
    window.dispatchEvent(new Event('storage'));
    alert('Salvo!');
  };

  const upload = async (file: File) => {
    try {
      const url = await handleImageUpload(file);
      setCfg({...cfg, logoUrl: url});
    } catch { alert('Erro upload'); }
  };

  return (
    <div className="max-w-md bg-white p-6 rounded shadow border">
      <h3 className="font-bold mb-4">Personalizar</h3>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-1">Logo Header</label>
        <input type="file" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        {cfg.logoUrl && <img src={cfg.logoUrl} className="h-16 mt-2 border" />}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold">Primária</label>
          <input type="color" className="w-full h-10" value={cfg.primaryColor} onChange={e => setCfg({...cfg, primaryColor: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold">Secundária</label>
          <input type="color" className="w-full h-10" value={cfg.secondaryColor} onChange={e => setCfg({...cfg, secondaryColor: e.target.value})} />
        </div>
      </div>
      <button onClick={save} className="w-full bg-black text-white py-2 rounded font-bold">Salvar</button>
    </div>
  );
};