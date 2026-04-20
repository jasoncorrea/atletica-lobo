import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, ShieldAlert, Database } from 'lucide-react';

export const QuotaAlert: React.FC = () => {
  const [errorInfo, setErrorInfo] = useState<any>(null);

  useEffect(() => {
    const handleQuota = (e: any) => {
      setErrorInfo(e.detail);
    };
    window.addEventListener('lobo-quota-exceeded', handleQuota);
    return () => window.removeEventListener('lobo-quota-exceeded', handleQuota);
  }, []);

  if (!errorInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-lg px-4">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="bg-zinc-900 text-white rounded-[2rem] p-6 shadow-2xl border border-white/10 overflow-hidden relative"
        >
          {/* Decorative background element */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
          
          <div className="flex gap-5 items-start relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Aviso de Sistema</h4>
                <button 
                  onClick={() => setErrorInfo(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              
              <h3 className="text-lg font-black tracking-tight leading-tight mb-2 uppercase">Lobo em Modo Offline</h3>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                {errorInfo.error}
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                          <ShieldAlert className="w-3 h-3 text-orange-400" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Integridade de Dados</span>
                </div>

                <button 
                  onClick={() => {
                    if (confirm('Deseja limpar todos os dados locais? Isso forçará o carregamento inicial assim que a cota resetar.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors"
                >
                  Limpar Cache
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
