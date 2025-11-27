import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../services/storageService';
import { Competition } from '../../types';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { AthleticsTab } from './tabs/AthleticsTab';
import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ResultsTab } from './tabs/ResultsTab';
import { PenaltiesTab } from './tabs/PenaltiesTab';
import { SettingsTab } from './tabs/SettingsTab';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('competitions');
  const [activeComp, setActiveComp] = useState<Competition | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('lobo_auth')) navigate('/login');
    refresh();
  }, []);

  const refresh = () => {
    const db = getDb();
    const active = db.competitions.find(c => c.isActive);
    setActiveComp(active || null);
  };

  const tabs = [
    { id: 'competitions', label: 'Competições' },
    { id: 'athletics', label: 'Atléticas' },
    { id: 'modalities', label: 'Modalidades' },
    { id: 'results', label: 'Resultados' },
    { id: 'penalties', label: 'Penalidades' },
    { id: 'settings', label: 'Config' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        {activeComp && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Editando: {activeComp.name}</span>}
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === t.id ? 'bg-lobo-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
        {activeTab === 'competitions' && <CompetitionsTab onUpdate={refresh} />}
        {activeTab === 'athletics' && <AthleticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
        
        {(!activeComp && ['modalities', 'results', 'penalties'].includes(activeTab)) ? (
          <div className="text-center py-10 text-red-500">Selecione ou crie uma competição ativa primeiro.</div>
        ) : (
          <>
            {activeTab === 'modalities' && <ModalitiesTab comp={activeComp!} />}
            {activeTab === 'results' && <ResultsTab comp={activeComp!} />}
            {activeTab === 'penalties' && <PenaltiesTab comp={activeComp!} />}
          </>
        )}
      </div>
    </div>
  );
};