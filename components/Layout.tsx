import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConfig, isOnline } from '../services/storageService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState(getConfig());
  const [cloudActive, setCloudActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Refresh basic data on mount
    setConfig(getConfig());
    setCloudActive(isOnline());
    
    // Listen for custom event 'dbUpdated' to refresh components if needed
    const handleUpdate = () => {
      setConfig(getConfig());
      setCloudActive(isOnline());
    };
    window.addEventListener('storage', handleUpdate); 
    
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header 
        style={{ backgroundColor: config.primaryColor }} 
        className="text-white shadow-xl sticky top-0 z-50 border-b-4 border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative">
               {config.logoUrl ? (
                 <img 
                   src={config.logoUrl} 
                   alt="Logo" 
                   className="h-14 w-14 object-contain bg-white rounded-full p-0.5 ring-4 ring-white/30 shadow-md group-hover:scale-105 transition-transform" 
                 />
               ) : (
                 <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-lobo-primary font-black text-2xl ring-4 ring-white/30 shadow-md">
                   L
                 </div>
               )}
             </div>
             <div>
               <h1 className="text-2xl font-black leading-none tracking-tight uppercase drop-shadow-sm">
                 ATLÉTICA LOBO
               </h1>
               <span className="text-xs text-white/90 font-bold tracking-[0.2em] uppercase block mt-1">
                 Central de Jogos
               </span>
             </div>
          </div>

          <div className="flex items-center">
            {!isAdmin ? (
               <button 
                 onClick={() => navigate('/login')}
                 className="text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all"
               >
                 Área da Diretoria
               </button>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline text-xs bg-black/20 px-2 py-1 rounded text-white/80">Modo Admin</span>
                <button 
                  onClick={() => navigate('/')}
                  className="text-sm bg-white text-lobo-primary font-bold px-4 py-2 rounded shadow hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-8 text-center text-sm border-t border-gray-800">
        <p className="mb-2">© {new Date().getFullYear()} Atlética Lobo. O maior do sul.</p>
        <div className="flex justify-center items-center space-x-2 text-xs opacity-50">
           <p>Desenvolvido para gestão esportiva de alto nível.</p>
           {cloudActive ? (
             <span className="flex items-center text-green-500" title="Sincronização em Nuvem Ativa">
               <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
               Cloud On
             </span>
           ) : (
             <span className="flex items-center text-gray-600" title="Modo Local">
               <span className="w-2 h-2 rounded-full bg-gray-600 mr-1"></span>
               Local
             </span>
           )}
        </div>
      </footer>
    </div>
  );
};