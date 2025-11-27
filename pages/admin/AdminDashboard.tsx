
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../services/storageService';
import { Competition, Role } from '../../types';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { AthleticsTab } from './tabs/AthleticsTab';
import { ModalitiesTab } from './tabs/ModalitiesTab';
import { ResultsTab } from './tabs/ResultsTab';
import { PenaltiesTab } from './tabs/PenaltiesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { FinanceTab } from './tabs/FinanceTab';
import { InventoryTab } from './tabs/InventoryTab';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('competitions');
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [role, setRole] = useState<Role>('DIRETORIA');

  useEffect(() => {
    if (!localStorage.getItem('lobo_auth')) {
      navigate('/login');
      return;
    }
    const savedRole = localStorage.getItem('lobo_role') as Role;
    if (savedRole) setRole(savedRole);

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

  // Adiciona abas para Super Admin
  if (role === 'SUPER_ADMIN') {
    tabs.push({ id: 'finance', label: 'Financeiro 💰' });
    tabs.push({ id: 'inventory', label: 'Estoque 📦' });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold">Painel Admin</h1>
           <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">{role === 'SUPER_ADMIN' ? 'Modo Desenvolvedor' : 'Modo Diretoria'}</span>
        </div>
        {activeComp && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Editando: {activeComp.name}</span>}
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeTab === t.id ? 'bg-lobo-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
        {activeTab === 'competitions' && <CompetitionsTab onUpdate={refresh} />}
        {activeTab === 'athletics' && <AthleticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'finance' && role === 'SUPER_ADMIN' && <FinanceTab />}
        {activeTab === 'inventory' && role === 'SUPER_ADMIN' && <InventoryTab />}
        
        {(!activeComp && ['modalities', 'results', 'penalties'].includes(activeTab)) ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded border border-red-100">
            Selecione ou crie uma competição ativa primeiro na aba <b>Competições</b>.
          </div>
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
