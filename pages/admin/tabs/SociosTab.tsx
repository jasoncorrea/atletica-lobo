import React, { useState, useEffect } from 'react';
import { getDb, saveDb, deleteItem } from '../../../services/storageService';
import { Socio, ShareMember } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Upload, 
  FileSpreadsheet, 
  Filter, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import * as XLSX from 'xlsx';

export const SociosTab: React.FC = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<{success: boolean, message: string} | null>(null);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Ativo', '2026']);

  const load = () => {
    const db = getDb();
    setSocios(db.socios || []);
  };

  useEffect(() => {
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        processImportData(data);
      } catch (error) {
        setImportStatus({ success: false, message: 'Erro ao ler arquivo. Verifique se é um Excel ou CSV válido.' });
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImportData = (data: any[]) => {
    if (data.length === 0) {
      setImportStatus({ success: false, message: 'Arquivo está vazio.' });
      setIsImporting(false);
      return;
    }

    // Mapping based on user's image
    // Comprador, RA, Cpf do Comprador, Telefone do Comprador, Plano, Fim do Plano
    
    const processed = data.map((row: any) => {
      const name = row['Comprador'] || row['comprador'];
      const ra = row['RA'] || row['ra'];
      const rg = row['RG'] || row['rg'];
      const cpf = row['Cpf do Comprador'] || row['cpf'];
      const phone = row['Telefone do Comprador'] || row['telefone'];
      const plan = row['Plano'] || row['plano'];
      const expiryRaw = row['Fim do Plano'] || row['fim do plano'];
      
      if (!name) return null;

      let expiryYear = 0;
      let expiryFormatted = '';

      if (expiryRaw instanceof Date) {
        expiryYear = expiryRaw.getFullYear();
        expiryFormatted = expiryRaw.toLocaleDateString('pt-BR');
      } else if (expiryRaw) {
        const yearMatch = String(expiryRaw).match(/\d{4}/);
        if (yearMatch) expiryYear = parseInt(yearMatch[0]);
        expiryFormatted = String(expiryRaw);
      }

      // Check if active (current date vs expiry) or future year 2025+
      const today = new Date();
      const isActiveByDate = expiryRaw instanceof Date && expiryRaw >= today;
      const isActiveByYear = expiryYear >= 2025;

      return {
        id: `socio_${name}_${ra || Math.random().toString(36).substr(2, 5)}`.replace(/\s+/g, '_'),
        name: String(name),
        ra: ra ? String(ra) : undefined,
        rg: rg ? String(rg) : undefined,
        cpf: cpf ? String(cpf) : undefined,
        phone: phone ? String(phone) : undefined,
        status: (isActiveByDate || isActiveByYear) ? 'Ativo' : 'Inativo',
        expiryDate: expiryFormatted,
        plan: plan ? String(plan) : undefined,
        expiryYear,
        isValid: isActiveByDate || isActiveByYear
      };
    }).filter(Boolean) as any[];

    // Filter only those active OR expiring in 2025 or later
    const filtered = processed.filter(s => s.isValid);
    
    setImportPreview(filtered);
    setImportStatus({ 
      success: true, 
      message: `${filtered.length} associados válidos encontrados (${processed.length - filtered.length} filtrados).` 
    });
    setIsImporting(false);
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) return;

    try {
      const db = getDb();
      const newSocios: Socio[] = importPreview.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        expiryDate: p.expiryDate,
        plan: p.plan,
        ra: p.ra,
        rg: p.rg,
        cpf: p.cpf,
        phone: p.phone,
        expiryYear: p.expiryYear
      }));

      db.socios = newSocios;
      await saveDb(db);
      
      // Force local update
      load();
      
      setImportPreview([]);
      setImportStatus({ success: true, message: 'Lista de sócios atualizada com sucesso!' });
      setTimeout(() => setImportStatus(null), 5000);
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportStatus({ success: false, message: 'Falha ao salvar no banco de dados. Tente novamente.' });
    }
  };

  const clearSocios = async () => {
    if (!confirm('Deseja limpar toda a lista de sócios?')) return;
    const db = getDb();
    db.socios = [];
    await saveDb(db);
    load();
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const filteredSocios = socios.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cpf?.includes(searchTerm) ||
      s.ra?.includes(searchTerm);
    
    if (!matchesSearch) return false;

    // Multi-select logic
    if (activeFilters.length === 0) return true; // Se nada selecionado, mostra tudo (ou nada, mas usuário disse que quer ver as opções)
    
    return activeFilters.some(filter => {
      if (filter === 'Ativo') return s.status === 'Ativo';
      if (filter === '2026') return s.expiryYear === 2026;
      if (filter === '2025') return s.expiryYear === 2025;
      return false;
    });
  });

  return (
    <div className="space-y-10">
      <header className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-lobo-primary rounded-2xl text-white shadow-xl shadow-lobo-primary/20">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Gestão de Sócios</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Integração Datletica</p>
        </div>
      </header>

      {/* Import Section */}
      <section className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lobo-primary rounded-xl text-white">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Importar Base Datletica</h3>
            </div>
            
            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
              Exporte seus associados no painel da Datletica e suba o arquivo aqui. 
              O sistema utiliza as colunas <span className="font-bold underline text-lobo-primary">Comprador</span> e <span className="font-bold underline text-lobo-primary">Fim do Plano</span> para filtrar automaticamente apenas os sócios ativos em 2026+.
            </p>

            <div className="relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="hidden" 
                id="file-upload"
                disabled={isImporting}
              />
              <label 
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                  isImporting ? "bg-zinc-100 border-zinc-200 cursor-wait" : "bg-white border-zinc-200 hover:border-lobo-primary hover:bg-lobo-primary/[0.02]"
                )}
              >
                <Upload className={cn("w-10 h-10 mb-4 transition-colors", isImporting ? "text-zinc-300" : "text-zinc-400 group-hover:text-lobo-primary")} />
                <span className="text-sm font-black text-zinc-700 tracking-tight">
                  {isImporting ? 'Processando arquivo...' : 'Selecionar Planilha Datletica (.xlsx)'}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{isImporting ? 'Lendo colunas: Comprador, Fim do Plano...' : 'Clique ou arraste o arquivo aqui'}</span>
              </label>
            </div>

            {importStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-2xl flex items-start gap-4",
                  importStatus.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}
              >
                {importStatus.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-[10px] sm:text-xs font-bold leading-normal uppercase tracking-wider">{importStatus.message}</p>
              </motion.div>
            )}

            {importPreview.length > 0 && (
              <button 
                onClick={confirmImport}
                className="w-full bg-lobo-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-lobo-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirmar Importação de {importPreview.length} Sócios Ativos
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black text-zinc-900 uppercase tracking-widest">
              <Filter className="w-4 h-4 text-lobo-primary" />
              Lógica de Registro Ativa
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-900">IDENTIFICA COLUNAS</p>
                  <p className="text-[9px] text-zinc-500 font-bold">Puxa automaticamente: RA, CPF, Celular e Plano.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-lobo-secondary flex items-center justify-center text-white shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-900">VERIFICAÇÃO 2026+</p>
                  <p className="text-[9px] text-zinc-500 font-bold">Quem vence em 2026, 2027 ou está ativo hoje entra na lista.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-900">DADOS COMPLETOS</p>
                  <p className="text-[9px] text-zinc-500 font-bold">Clique no nome para ver RA e CPF do Comprador.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col gap-3">
             <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input 
                className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all shadow-sm"
                placeholder="Buscar por nome, RA ou CPF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">Filtrar por:</span>
              {['Ativo', '2026', '2025'].map(filter => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    activeFilters.includes(filter)
                      ? "bg-lobo-primary border-lobo-primary text-white shadow-md shadow-lobo-primary/20"
                      : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 shadow-sm"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {socios.length > 0 && (
            <button 
              onClick={clearSocios}
              className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Lista ({socios.length})
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-zinc-50/80">
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sócio (Comprador)</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">RA</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Plano</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fim do Plano</th>
                 <th className="px-6 py-4"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-zinc-100">
               {filteredSocios.map(s => (
                 <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors group">
                   <td className="px-6 py-4">
                     <button 
                       onClick={() => setSelectedSocio(s)}
                       className="text-sm font-black text-zinc-800 text-left hover:text-lobo-primary transition-colors underline decoration-zinc-200 underline-offset-4"
                     >
                       {s.name}
                     </button>
                   </td>
                   <td className="px-6 py-4">
                     <span className="text-[10px] font-black text-zinc-400 tabular-nums">{s.ra || '---'}</span>
                   </td>
                   <td className="px-6 py-4">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase">{s.plan || 'N/A'}</span>
                   </td>
                   <td className="px-6 py-4">
                     <div className={cn(
                       "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                       s.status === 'Ativo' 
                        ? "bg-green-50 text-green-600 border-green-200" 
                        : "bg-amber-50 text-amber-600 border-amber-200"
                     )}>
                       {s.expiryDate || '---'}
                     </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button 
                        onClick={() => deleteItem('socios', s.id)}
                        className="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </td>
                 </tr>
               ))}
               {filteredSocios.length === 0 && (
                 <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <Users className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                      <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">Nenhum associado encontrado</p>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Socio Detail Modal */}
      <AnimatePresence>
        {selectedSocio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSocio(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-lobo-primary p-8 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <button onClick={() => setSelectedSocio(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <Trash2 className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedSocio.name}</h3>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">{selectedSocio.plan}</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">RG</span>
                    <p className="font-black text-zinc-900 tabular-nums">{selectedSocio.rg || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">CPF</span>
                    <p className="font-black text-zinc-900 tabular-nums">{selectedSocio.cpf || 'Não informado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">RA / Matrícula</span>
                    <p className="font-black text-zinc-900 tabular-nums">{selectedSocio.ra || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Telefone</span>
                    <p className="font-black text-zinc-900 tabular-nums text-xs">{selectedSocio.phone || 'Não informado'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vencimento</span>
                    <p className="text-sm font-black text-lobo-primary">{selectedSocio.expiryDate}</p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    selectedSocio.status === 'Ativo' ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                  )}>
                    Sócio {selectedSocio.status}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSocio(null)}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm tracking-tight hover:bg-zinc-800 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-gradient-to-r from-lobo-secondary to-zinc-900 rounded-3xl text-white flex items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
          <Info className="w-8 h-8 text-lobo-primary" />
        </div>
        <div>
          <h4 className="text-lg font-black tracking-tight leading-tight mb-1">Como extrair os dados da Datletica?</h4>
          <p className="text-[10px] opacity-70 font-bold leading-relaxed max-w-xl">
            No seu painel Administrativo da Datletica, vá em <span className="text-lobo-primary">Associados/Sócios</span>, aplique os filtros desejados e exporte para <span className="text-lobo-primary">Excel</span>. O site vai ler as colunas <span className="underline italic">Comprador</span>, <span className="underline italic">RA</span>, <span className="underline italic">Cpf do Comprador</span> e <span className="underline italic">Fim do Plano</span> automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
