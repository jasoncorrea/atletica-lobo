import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, ShieldAlert, Database, Search } from 'lucide-react';

export const QuotaAlert: React.FC = () => {
  const [errorInfo, setErrorInfo] = useState<any>(null);

  useEffect(() => {
    const handleQuota = (e: any) => {
      setErrorInfo(e.detail);
    };
    const handleResolved = () => {
      setErrorInfo(null);
    };
    window.addEventListener('lobo-quota-exceeded', handleQuota);
    window.addEventListener('lobo-quota-resolved', handleResolved);
    return () => {
      window.removeEventListener('lobo-quota-exceeded', handleQuota);
      window.removeEventListener('lobo-quota-resolved', handleResolved);
    };
  }, []);

  if (!errorInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="bg-zinc-900 border border-zinc-700 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            {/* Status Sidebar */}
            <div className="bg-red-500 w-full md:w-32 flex flex-col items-center justify-center py-6 md:py-0 gap-2">
               <ShieldAlert className="w-10 h-10 text-zinc-900" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">Offline</span>
            </div>

            <div className="flex-1 p-8 md:p-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <AlertCircle className="w-4 h-4 text-red-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 italic">Alerta de Infraestrutura</h3>
                </div>
                <button onClick={() => setErrorInfo(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-600 hover:text-white">
                   <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-3 leading-none">Cota de Dados Bloqueada</h4>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-lg">
                  {errorInfo.error}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button 
                  onClick={() => window.dispatchEvent(new Event('lobo-force-sync'))}
                  className="flex items-center gap-3 bg-red-500 text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                >
                  <Search className="w-4 h-4" />
                  Revalidar Conexão
                </button>

                <button 
                  onClick={() => {
                    if (confirm('Atenção: Limpar o cache local removerá os dados salvos no navegador. Deseja continuar?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors py-3 px-4"
                >
                  Reset Manual
                </button>
                
                <div className="flex-1" />

                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Modo Local Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
