import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, LogIn, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const AdminLogin: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Firebase Auth login to enable cloud writes
      const auth = getAuth();
      
      // Auto-map simple names to emails for Firebase compatibility
      const email = user.includes('@') ? user : `${user}@lobo.com`;
      
      await signInWithEmailAndPassword(auth, email, pass);

      const role = user === 'dev' ? 'SUPER_ADMIN' : 'DIRETORIA';
      localStorage.setItem('lobo_auth', 'true');
      localStorage.setItem('lobo_role', role);
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setError('O login por E-mail/Senha não está ativado no seu novo projeto do Firebase. Ative-o no console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Usuário ou senha incorretos para o novo projeto.');
      } else {
        setError('Erro de conexão: ' + err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-zinc-200 border border-zinc-100 p-8 md:p-12 relative overflow-hidden">
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <ShieldCheck className="w-64 h-64 -rotate-12" />
          </div>

          <header className="relative z-10 text-center mb-10">
            <div className="inline-flex p-4 bg-lobo-primary/10 rounded-3xl text-lobo-primary mb-6 ring-4 ring-lobo-primary/5">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Acesso Restrito</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Diretoria & Staff LOBOS</p>
          </header>

          <form onSubmit={handle} className="relative z-10 space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-xs font-bold text-red-900 leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-lobo-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none transition-all"
                  placeholder="Seu usuário" 
                  value={user} 
                  onChange={e => setUser(e.target.value)} 
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-lobo-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password"
                  className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-lobo-primary focus:bg-white outline-none transition-all" 
                  placeholder="Senha de acesso" 
                  value={pass} 
                  onChange={e => setPass(e.target.value)} 
                  required
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm tracking-widest text-white uppercase transition-all flex items-center justify-center space-x-2 shadow-xl active:scale-95",
                loading ? "bg-zinc-400 cursor-not-allowed" : "bg-lobo-primary hover:bg-lobo-secondary shadow-lobo-primary/20"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Autenticar</span>
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest pb-2">
            Sistema de Gestão Esportiva • v2.0
          </footer>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default group">
          <ShieldAlert className="w-5 h-5 text-lobo-primary" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-lobo-primary transition-colors">Ambiente Criptografado</p>
        </div>
      </motion.div>
    </div>
  );
};
