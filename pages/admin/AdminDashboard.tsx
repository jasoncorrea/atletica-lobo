import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competition } from '../../types';
import { getDb } from '../../services/storageService';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { AthleticsTab } from './tabs/AthleticsTab';
import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ResultsTab } from './tabs/ResultsTab';
import { PenaltiesTab } from './tabs/PenaltiesTab';
import { SettingsTab } from './tabs/SettingsTab';

const TABS = [
  { id: 'results', label: 'Resultados', icon: '🏆' },
  { id: 'penalties', label: 'Penalidades', icon: '⚖️' },
  { id: 'modalities', label: 'Modalidades', icon: '📋' },
  { id: 'athletics', label: 'Atléticas', icon: '🛡️' },
  { id: 'competitions', label: 'Competições', icon: '📅' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('results');
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const isAuth = localStorage.getItem('lobo_auth');
    if (!isAuth) navigate('/login');
    loadActiveComp();
  }, [refreshTrigger]);

  const loadActiveComp = () => {
    const db = getDb();
    const active = db.competitions.find(c => c.isActive);
    setActiveCompetition(active || null);
  };

  const forceRefresh = () => setRefreshTrigger(prev => prev + 1);

  const renderContent = () => {
    if (!activeCompetition && activeTab !== 'competitions' && activeTab !== 'athletics' && activeTab !== 'settings') {
      return (
        <div className="text-center py-12 bg-white rounded-lg border border-red-200">
          <p className="text-red-600 font-medium">Você precisa selecionar ou criar uma Competição Ativa primeiro.</p>
          <button onClick={() => setActiveTab('competitions')} className="mt-4 text-lobo-primary underline">Ir para Competições</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'competitions': return <CompetitionsTab onUpdate={forceRefresh} />;
      case 'athletics': return <AthleticsTab />;
      case 'modalities': return <ModalitiesTab competition={activeCompetition!} />;
      case 'results': return <ResultsTab competition={activeCompetition!} />;
      case 'penalties': return <PenaltiesTab competition={activeCompetition!} />;
      case 'settings': return <SettingsTab onUpdate={forceRefresh} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
           {activeCompetition && (
             <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
               Editando: {activeCompetition.name} ({activeCompetition.year})
             </span>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === tab.id
                  ? 'border-lobo-primary text-lobo-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
};
