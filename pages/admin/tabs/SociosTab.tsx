import React, { useState, useEffect } from 'react';
import { getDb, saveItems, deleteItem, clearCollection } from '../../../services/storageService';
import { Socio } from '../../../types';
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
  Info,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Hash,
  Smartphone
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

    const seenIds = new Map<string, number>();

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

      const today = new Date();
      today.setHours(0,0,0,0);
      
      const isActive = (expiryRaw instanceof Date && expiryRaw >= today) || (expiryYear >= 2026);

      const baseId = `socio_${String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_')}_${ra ? String(ra).replace(/[^a-zA-Z0-9]/g, '') : Math.random().toString(36).substr(2, 5)}`.substr(0, 90);
      
      // Uniqueness Control
      let finalId = baseId;
      const count = seenIds.get(baseId) || 0;
      if (count > 0) {
        finalId = `${baseId}_${count}`;
      }
      seenIds.set(baseId, count + 1);

      return {
        id: finalId,
        name: String(name),
        ra: ra ? String(ra) : '',
        rg: rg ? String(rg) : '',
        cpf: cpf ? String(cpf) : '',
        phone: phone ? String(phone) : '',
        status: isActive ? 'Ativo' : 'Inativo',
        expiryDate: expiryFormatted,
        plan: plan ? String(plan) : 'Padrão',
        expiryYear,
        isValid: true // Keep all members for history
      };
    }).filter(Boolean) as any[];

    // No filtered step, we want the whole base for management
    const filtered = processed;
    
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
      await saveItems('socios', importPreview as Socio[]);
      load();
      setImportPreview([]);
      setImportStatus({ success: true, message: 'Lista de sócios atualizada com sucesso!' });
      setTimeout(() => setImportStatus(null), 5000);
    } catch (error: any) {
      setImportStatus({ 
        success: false, 
        message: 'Falha ao salvar no banco de dados. ' + (error?.message || '') 
      });
    }
  };

  const clearSocios = async () => {
    if (!confirm('Deseja limpar toda a lista de sócios?')) return;
    await clearCollection('socios');
    load();
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const isSocioActive = (s: Socio) => {
    if (!s.expiryDate) return false;
    // Assuming format DD/MM/YYYY
    const parts = s.expiryDate.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS Months 0-11
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    const expiry = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    return expiry >= today;
  };

  const filteredSocios = socios.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cpf?.includes(searchTerm) ||
      s.ra?.includes(searchTerm);
    
    if (!matchesSearch) return false;
    if (activeFilters.length === 0) return true;
    
    return activeFilters.some(filter => {
      if (filter === 'Ativo') return isSocioActive(s);
      if (filter === '2026') return (s.expiryYear ?? 0) === 2026;
      if (filter === '2025') return (s.expiryYear ?? 0) === 2025;
      return false;
    });
  });

  const activeCount = socios.filter(isSocioActive).length;
  const count2026 = socios.filter(s => (s.expiryYear ?? 0) >= 2026).length;
  const count2025 = socios.filter(s => (s.expiryYear ?? 0) === 2025).length;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-lobo-secondary" />
            Gestão de Associados
          </h2>
          <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest">Controle operacional e financeiro da base</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={clearSocios}
             className="px-4 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
           >
             Limpar Base
           </button>
           <div className="w-px h-8 bg-zinc-200 mx-2 hidden lg:block" />
           <p className="text-xs font-black text-zinc-900 tabular-nums">
             Total: <span className="text-lobo-secondary text-base ml-1">{socios.length}</span>
           </p>
        </div>
      </div>

      {/* Main Grid: Import & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-lobo-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Importação Datletica</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  Suba sua exportação <span className="text-lobo-primary font-bold">.xlsx</span> para atualizar a base. O sistema aplicará filtros automáticos de validade.
                </p>
                <div className="flex flex-wrap gap-2">
                   {['Comprador', 'RA', 'CPF', 'Vencimento'].map(tag => (
                     <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/50 uppercase tracking-wider">{tag}</span>
                   ))}
                </div>
              </div>

              <div className="relative">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={isImporting} />
                <label 
                  htmlFor="file-upload"
                  className={cn(
                    "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all h-full aspect-video sm:aspect-square",
                    isImporting ? "bg-white/5 border-white/10" : "bg-white/5 border-white/20 hover:border-lobo-primary hover:bg-white/[0.08]"
                  )}
                >
                  <Upload className={cn("w-10 h-10 mb-4 transition-colors", isImporting ? "text-white/20" : "text-white/40 group-hover:text-lobo-primary")} />
                  <span className="text-xs font-black tracking-tight text-center px-4">
                    {isImporting ? 'Lendo planilha...' : 'Upload Planilha'}
                  </span>
                </label>
              </div>
            </div>

            {importPreview.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={confirmImport}
                className="w-full bg-lobo-primary text-zinc-900 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-lobo-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirmar {importPreview.length} Sócios
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </motion.button>
            )}

            {importStatus && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "p-4 rounded-2xl flex items-center gap-3",
                  importStatus.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}
              >
                {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <p className="text-[10px] font-black uppercase tracking-wider">{importStatus.message}</p>
              </motion.div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-lobo-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        </section>

        <section className="bg-white border border-zinc-200 p-8 rounded-[3rem] shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-xs font-black text-zinc-900 uppercase tracking-widest">
              <Zap className="w-4 h-4 text-lobo-primary" />
              Painel de Status
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
               <div className="p-5 bg-zinc-50 rounded-[1.8rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                        <UserCheck className="w-5 h-5" />
                     </div>
                     <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">Ativos Hoje</span>
                  </div>
                  <span className="text-xl font-black text-zinc-900 tabular-nums">{activeCount}</span>
               </div>

               <div className="p-5 bg-zinc-50 rounded-[1.8rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-lobo-primary/10 flex items-center justify-center text-lobo-primary">
                        <Calendar className="w-5 h-5" />
                     </div>
                     <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">Validade 2026+</span>
                  </div>
                  <span className="text-xl font-black text-zinc-900 tabular-nums">{count2026}</span>
               </div>

               <div className="p-5 bg-zinc-50 rounded-[1.8rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-zinc-900/10 flex items-center justify-center text-zinc-900">
                        <CreditCard className="w-5 h-5" />
                     </div>
                     <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">Em 2025</span>
                  </div>
                  <span className="text-xl font-black text-zinc-900 tabular-nums">{count2025}</span>
               </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center gap-3 opacity-30">
             <ShieldCheck className="w-5 h-5 text-zinc-500" />
             <p className="text-[9px] font-bold text-zinc-500 leading-tight uppercase tracking-widest italic">Processamento local seguro</p>
          </div>
        </section>
      </div>

      {/* List Filters & Actions */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-zinc-100/50 p-4 rounded-[2rem] border border-zinc-200">
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
            <input 
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-lobo-primary outline-none transition-all shadow-sm"
              placeholder="Pesquisar por nome, plano, RA ou CPF..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {['Ativo', '2026', '2025'].map(filter => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  activeFilters.includes(filter)
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-black/10"
                    : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 shadow-sm"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-100">
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Associado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Matrícula (RA)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assinatura</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredSocios.map(s => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => setSelectedSocio(s)}
                          className="flex flex-col items-start"
                        >
                          <span className="text-sm font-black text-zinc-900 group-hover:text-lobo-primary transition-colors tracking-tight uppercase leading-tight select-none">
                            {s.name}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 mt-0.5 select-none">{s.cpf ? `CPF: ${s.cpf}` : 'Sem identificação'}</span>
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-black text-zinc-400 tabular-nums flex items-center gap-1.5">
                           <Hash className="w-3 h-3" />
                           {s.ra || '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tight bg-zinc-100 px-3 py-1 rounded-lg">
                           {s.plan || 'Plano Padrão'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", isSocioActive(s) ? "bg-green-500" : "bg-amber-500")} />
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             isSocioActive(s) ? "text-green-600" : "text-amber-600"
                           )}>
                             {s.expiryDate || '---'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                           onClick={() => deleteItem('socios', s.id)}
                           className="w-9 h-9 rounded-xl text-zinc-200 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSocios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                         <div className="flex flex-col items-center justify-center opacity-20">
                            <Users className="w-16 h-16 mb-4" />
                            <p className="text-sm font-black text-zinc-900 uppercase tracking-widest italic">Base de dados vazia para esta busca</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Socio Detail Modal */}
      <AnimatePresence>
        {selectedSocio && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSocio(null)}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-zinc-900 p-12 text-white relative">
                 <div className="absolute top-0 right-0 p-8">
                    <button onClick={() => setSelectedSocio(null)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="space-y-4">
                    <div className={cn(
                       "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                       selectedSocio.status === 'Ativo' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                       {selectedSocio.status}
                    </div>
                    <div>
                       <h3 className="text-4xl font-black tracking-tight leading-tight uppercase">{selectedSocio.name}</h3>
                       <p className="text-xs font-black text-lobo-primary uppercase tracking-[0.2em] mt-2 mb-6">{selectedSocio.plan || 'Associado Lobo'}</p>
                    </div>
                 </div>

                 <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Users className="w-64 h-64 -mb-20 -mr-20" />
                 </div>
              </div>

              <div className="p-12">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Informações Pessoais</h5>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                <CreditCard className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Documento (CPF)</p>
                                <p className="text-sm font-black text-zinc-800 tabular-nums uppercase">{selectedSocio.cpf || 'NÃO INFORMADO'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                <FileText className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">RG</p>
                                <p className="text-sm font-black text-zinc-800 tabular-nums uppercase">{selectedSocio.rg || 'NÃO INFORMADO'}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Vínculo Acadêmico</h5>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                <Hash className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Matrícula (RA)</p>
                                <p className="text-sm font-black text-zinc-800 tabular-nums uppercase">{selectedSocio.ra || 'NÃO INFORMADO'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                <Smartphone className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Celular</p>
                                <p className="text-sm font-black text-zinc-800 tabular-nums uppercase">{selectedSocio.phone || 'NÃO INFORMADO'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lobo-primary">
                          <Calendar className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Validade do Plano</p>
                          <p className="text-lg font-black text-zinc-900 tabular-nums uppercase">{selectedSocio.expiryDate}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Processado via</p>
                       <span className="text-[10px] font-black text-lobo-secondary bg-lobo-primary/5 px-3 py-1 rounded-lg">DATLETICA INTEGRATED</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-10 bg-zinc-100/80 rounded-[3rem] border border-zinc-200">
         <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-zinc-200 flex items-center justify-center shadow-lg shadow-black/[0.03]">
               <Info className="w-8 h-8 text-lobo-primary" />
            </div>
            <div className="flex-1 space-y-2">
               <h4 className="text-lg font-black tracking-tight uppercase">Guia de Importação Eficiente</h4>
               <p className="text-[11px] font-medium text-zinc-400 leading-relaxed max-w-2xl">
                  Ao exportar da Datletica, certifique-se de manter as colunas originais: <span className="text-zinc-900 font-black">Comprador, RA, Cpf do Comprador, Telefone do Comprador</span> e <span className="text-zinc-900 font-black">Fim do Plano</span>. O sistema prioriza dados limpos para garantir uma gestão de acesso impecável eventos e jogos universitários.
               </p>
            </div>
            <div className="flex flex-col items-center lg:items-end opacity-20">
               <Zap className="w-8 h-8 mb-2" />
               <span className="text-[8px] font-black uppercase tracking-[0.4em]">Integrated DB</span>
            </div>
         </div>
      </footer>
    </div>
  );
};
