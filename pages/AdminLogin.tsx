import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig } from '../services/storageService';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const config = getConfig();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials as per simplified request logic
    if (username === 'admin' && password === 'lobo123') {
      localStorage.setItem('lobo_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border-t-8 border-lobo-primary relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lobo-primary to-lobo-secondary"></div>
        
        <div className="px-8 py-10">
          <div className="flex justify-center mb-6">
             {config.logoUrl ? (
               <img src={config.logoUrl} className="h-20 w-20 rounded-full border-4 border-gray-100 shadow-sm object-cover" alt="Logo" />
             ) : (
               <div className="h-20 w-20 bg-lobo-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                 <span className="mb-1">L</span>
               </div>
             )}
          </div>

          <h2 className="text-3xl font-black text-center text-gray-800 mb-2 uppercase tracking-tight">Diretoria Lobo</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Acesso exclusivo para gestão de resultados</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lobo-primary focus:border-transparent transition-all"
                placeholder="Ex: admin"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lobo-primary focus:border-transparent transition-all"
                placeholder="••••••"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-lobo-primary to-orange-600 hover:from-orange-600 hover:to-lobo-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lobo-primary transform hover:scale-[1.02] transition-all"
            >
              ACESSAR PAINEL
            </button>
          </form>
        </div>
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Sistema de Gestão Esportiva v3.0</p>
        </div>
      </div>
    </div>
  );
};