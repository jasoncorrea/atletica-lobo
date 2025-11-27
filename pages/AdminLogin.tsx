import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'lobo123') {
      localStorage.setItem('lobo_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      alert('Credenciais incorretas');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <form onSubmit={handle} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm border-t-4 border-lobo-primary">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login Diretoria</h2>
        <div className="space-y-4">
          <input 
            className="w-full border p-3 rounded bg-white text-gray-900"
            placeholder="Usuário" 
            value={user} onChange={e => setUser(e.target.value)} 
          />
          <input 
            type="password"
            className="w-full border p-3 rounded bg-white text-gray-900" 
            placeholder="Senha" 
            value={pass} onChange={e => setPass(e.target.value)} 
          />
          <button className="w-full bg-lobo-primary text-white py-3 rounded font-bold hover:bg-orange-600">ENTRAR</button>
        </div>
      </form>
    </div>
  );
};