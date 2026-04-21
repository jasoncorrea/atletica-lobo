import React, { useEffect, useState } from 'react';
import { getConnectionStatus, ConnectionStatus } from '../services/storageService';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import firebaseConfig from '../firebase-applet-config.json';

export const SyncBadge: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());
  const [lastError, setLastError] = useState<string | null>(null);

  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';

  useEffect(() => {
    const handleStatus = (e: any) => {
      setStatus(e.detail);
      if (e.detail === 'error') {
        setLastError(`Falha na conexão ${e.errorCode ? '[' + e.errorCode + ']' : ''}. Verifique o console.`);
      } else {
        setLastError(null);
      }
    };
    window.addEventListener('lobo-connection-changed', handleStatus);
    return () => window.removeEventListener('lobo-connection-changed', handleStatus);
  }, []);

  const config = {
    connecting: { icon: RefreshCw, text: 'Conectando...', color: 'text-blue-500 bg-blue-50', animate: true },
    online: { icon: Wifi, text: 'Sincronizado', color: 'text-green-500 bg-green-50', animate: false },
    offline: { icon: WifiOff, text: 'Modo Offline', color: 'text-amber-500 bg-zinc-100', animate: false },
    error: { icon: AlertCircle, text: 'Erro de Sync', color: 'text-red-500 bg-red-50 border-red-200', animate: false }
  };

  const retry = () => {
    window.dispatchEvent(new CustomEvent('lobo-force-sync'));
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-end gap-1">
      <button 
        onClick={retry}
        title={`${lastError ? lastError + ' | ' : ''}DB: ${dbId}`}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent transition-all hover:scale-105 active:scale-95",
          current.color
        )}
      >
        <Icon className={cn("w-3 h-3", current.animate && "animate-spin")} />
        <span>{current.text}</span>
      </button>
      {lastError && (
        <span className="text-[7px] font-bold text-red-400 uppercase tracking-tighter mr-2">
          Verifique o Console ou Configurações do Firebase
        </span>
      )}
    </div>
  );
};
