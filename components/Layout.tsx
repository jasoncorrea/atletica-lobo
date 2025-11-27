import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConfig, isOnline } from '../services/storageService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState(getConfig());
  const [cloudActive, setCloudActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const update = () => {
      setConfig(getConfig());
      setCloudActive(isOnline());
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header style={{ backgroundColor: config.primaryColor }} className="text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
             {config.logoUrl ? (
               <img src={config.logoUrl} className="h-12 w-12 rounded-full border-2 border-white" />
             ) : (
               <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-lobo-primary font-bold">L</div>
             )}
             <div>
               <h1 className="text-xl font-black uppercase">Atlética Lobo</h1>
               <span className="text-xs font-bold uppercase tracking-widest opacity-90">Central de Jogos</span>
             </div>
          </div>
          <div>
            {!isAdmin ? (
               <button onClick={() => navigate('/login')} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition">Admin</button>
            ) : (
               <button onClick={() => navigate('/')} className="text-sm bg-white text-lobo-primary font-bold px-3 py-1 rounded">Sair</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-500 py-6 text-center text-xs">
        <p>© 2025 Atlética Lobo. O maior do sul.</p>
        <div className="flex justify-center items-center mt-2 space-x-2">
           {cloudActive ? (
             <span className="text-green-500 font-bold">● Cloud Online</span>
           ) : (
             <span className="text-gray-600">● Modo Local</span>
           )}
        </div>
      </footer>
    </div>
  );
};