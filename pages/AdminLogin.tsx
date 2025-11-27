import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset login antigo
    localStorage.removeItem('lobo_role');

    if (user === 'admin' && pass === 'lobo123') {
      // Perfil Diretoria (Básico)
      localStorage.setItem('lobo_auth', 'true');
      localStorage.setItem('lobo_role', 'DIRETORIA');
      navigate('/admin/dashboard');
    } else if (user === 'dev' && pass === 'jason123') {
      // Perfil Super Admin (Financeiro)
      localStorage.setItem('lobo_auth', 'true');
      localStorage.setItem('lobo_role', 'SUPER_ADMIN');
      navigate('/admin/dashboard');
    } else {
      alert('Credenciais incorretas');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <form onSubmit={handle} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm border-t-4 border-lobo-primary">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Acesso Restrito</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Diretoria & Desenvolvedor</p>
        <div className="space-y-4">
          <input 
            className="w-full border p-3 rounded bg-white text-gray-900 focus:ring-2 focus:ring-lobo-primary outline-none transition"
            placeholder="Usuário" 
            value={user} onChange={e => setUser(e.target.value)} 
          />
          <input 
            type="password"
            className="w-full border p-3 rounded bg-white text-gray-900 focus:ring-2 focus:ring-lobo-primary outline-none transition" 
            placeholder="Senha" 
            value={pass} onChange={e => setPass(e.target.value)} 
          />
          <button className="w-full bg-lobo-primary text-white py-3 rounded font-bold hover:bg-orange-600 shadow-lg transform active:scale-95 transition">
            ENTRAR
          </button>
        </div>
      </form>
    </div>
  );
};