
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, CheckCircle2, User, Hash, Calendar, MapPin, BadgeCheck, Eye, Trash2, Sliders, Upload, Search, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { cn } from '../../../lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { getConfig, getDb, addItem, deleteItem, startListener, stopListener, db } from '../../../services/storageService';
import { extractDeclarationInfo } from '../../../services/declaracaoService';
import { Declaration } from '../../../types';

// Set up pdfjs worker using the local build handled by Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface CertificateData {
  recipientName: string;
  rg: string;
  ra: string;
  role: string;
  eventName: string;
  location: string;
  dates: string;
  issueCity: string;
  issueDate: string;
  signatureName: string;
  signatureTitle: string;
}

const DEFAULT_DATA: CertificateData = {
  recipientName: 'Aline Sales Rodrigues de Freitas',
  rg: '54.076.528-4',
  ra: '2351072',
  role: 'atleta',
  eventName: '8º Jogos Interathléticos de Ponta Grossa ( JOIA PG)',
  location: 'UTFPR GP',
  dates: '15 e 16 de novembro e 20, 22 e 23 de novembro de 2025',
  issueCity: 'Guarapuava',
  issueDate: '30 de março de 2026',
  signatureName: 'Jason Correa Cardoso',
  signatureTitle: 'Presidente da A.A.A.E UTFPR-GP'
};

const DeclarationsHeader: React.FC<{
  isUploading: boolean;
  onUploadClick: () => void;
}> = ({ isUploading, onUploadClick }) => (
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
    <div>
      <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-4">
        <div className="w-12 h-12 bg-[#5a0509] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#5a0509]/20">
          <FileText className="w-7 h-7" />
        </div>
        Declarações de Atletas
      </h2>
      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4">Gestão e Extração Inteligente de Dados</p>
    </div>

    <div className="flex items-center gap-4">
      <button 
        id="upload-declaration-btn"
        type="button"
        onClick={onUploadClick}
        disabled={isUploading}
        className={cn(
          "relative px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 transition-all duration-300 active:scale-95 group z-[100]",
          isUploading 
            ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
            : "bg-[#5a0509] text-white hover:bg-[#3d0306] hover:-translate-y-1 shadow-[#5a0509]/30"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm",
          isUploading ? "bg-zinc-300" : "bg-white/10 group-hover:bg-white/20"
        )}>
          <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </div>
        <span className="font-black text-xs">
          {isUploading ? 'PROCESSANDO...' : 'ADICIONAR DECLARAÇÃO'}
        </span>
      </button>
    </div>
  </div>
);

export const SecretariaTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'certificados' | 'declaracoes'>('certificados');
  const [data, setData] = useState<CertificateData>(DEFAULT_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState(getConfig());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [declaracoes, setDeclaracoes] = useState<Declaration[]>(getDb().declaracoes || []);
  const [searchQuery, setSearchQuery] = useState('');
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('Mounting SecretariaTab, initialized with', declaracoes.length, 'declarations');
    const handleStorage = () => {
      const freshDb = getDb();
      console.log('Storage event received, new count:', freshDb.declaracoes?.length);
      setDeclaracoes([...(freshDb.declaracoes || [])]);
    };
    window.addEventListener('storage', handleStorage);
    startListener('declaracoes');
    
    // Initial fetch from server just in case listener is slow
    const fetchInitial = async () => {
      try {
        const snap = await getDocs(collection(db, 'declaracoes'));
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Declaration[];
        if (data.length > 0) {
          setDeclaracoes(data);
        }
      } catch (e) {
        console.warn('Initial fetch error:', e);
      }
    };
    fetchInitial();

    return () => {
      window.removeEventListener('storage', handleStorage);
      stopListener('declaracoes');
    };
  }, []);

  const handleDownload = async () => {
    if (!certificateRef.current) {
      alert('Erro: O modelo do certificado ainda não foi carregado.');
      return;
    }
    
    setIsGenerating(true);

    try {
      console.log('Iniciando captura de alta fidelidade...');
      
      // Wait for any pending renders/images
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1123,
        windowHeight: 794,
        onclone: (clonedDoc) => {
          // CRITICAL: Remove all style/link tags from the clone to prevent html2canvas 
          // from failing due to Tailwind 4's modern color functions (oklch)
          const styles = Array.from(clonedDoc.getElementsByTagName('style'));
          const links = Array.from(clonedDoc.getElementsByTagName('link'));
          
          styles.forEach(s => s.remove());
          links.forEach(l => l.remove());
          
          // Clear inherited variables and oklch colors from root/body
          clonedDoc.documentElement.removeAttribute('style');
          clonedDoc.documentElement.className = '';
          clonedDoc.body.removeAttribute('style');
          clonedDoc.body.className = '';
          
          console.log('Ambiente de captura isolado (estilos globais e variáveis removidos).');
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210); // A4 Landscape size in mm
      
      const fileName = `certificado_${data.recipientName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF gerado com sucesso.');
    } catch (error) {
      console.error('Erro crítico na geração do PDF:', error);
      const msg = error instanceof Error ? error.message : 'Erro técnico desconhecido';
      
      let hint = '\n\nDica: Isso geralmente ocorre quando a logo configurada não permite ser baixada diretamente por segurança (CORS). Tente remover a logo nas configurações de marca para confirmar.';
      
      if (msg.includes('oklch')) {
        hint = '\n\nDica: Detectado erro de cor incompatível. Tente atualizar a página.';
      }

      alert(`Não foi possível gerar o PDF.\n\nDetalhes: ${msg}${hint}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: keyof CertificateData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File selection event triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', file.name, file.type, file.size);
    
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Lendo arquivo...');
    try {
      console.log('Reading file as arrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      
      setUploadStatus('Iniciando motor de PDF...');
      console.log('Initialing PDF.js GetDocument...');
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        // Increase tolerance for malformed PDFs
        stopAtErrors: false 
      });
      
      // Implement timeout for PDF loading
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado ao carregar o PDF.')), 10000))
      ]) as any;

      console.log('PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';
      let images: string[] = [];
      const maxPages = Math.min(pdf.numPages, 2); // Limit to 2 pages for performance
      
      for (let i = 1; i <= maxPages; i++) {
        setUploadStatus(`Extraindo conteúdo da página ${i}...`);
        const page = await pdf.getPage(i);
        
        // Try text extraction first
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => {
          if ('str' in item) return item.str;
          return '';
        }).join(' ');
        
        if (pageText.trim().length > 10) {
          fullText += pageText + '\n';
        } else {
          // If no text, extract as image
          setUploadStatus(`Processando página ${i} como imagem...`);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            images.push(imageData.split(',')[1]); // Only base64 part
          }
        }
      }

      if (!fullText.trim() && images.length === 0) {
        throw new Error('Nenhum conteúdo pôde ser lido do PDF. O arquivo pode estar corrompido.');
      }

      setUploadStatus('IA analisando documento...');
      console.log('PDF Content ready:', fullText ? 'Text extracted' : 'Using images', 'sending to Gemini...');
      
      // Chamada direta pelo Frontend (conforme normas do AI Studio Build)
      const extracted = await extractDeclarationInfo(fullText, images);
      
      setUploadStatus('Salvando dados...');
      const newDeclaration: Omit<Declaration, 'id'> = {
        fullName: extracted.nome_completo || 'Não identificado',
        course: extracted.curso || 'Não identificado',
        document: extracted.documento || 'Não identificado',
        issueDate: extracted.data_emissao || 'Não identificado',
        extractedAt: Date.now()
      };

      const savedItem = await addItem('declaracoes', newDeclaration);
      
      // Force local state update immediately to avoid reliance on slow Firestore snapshots
      setDeclaracoes(prev => {
        const exists = prev.some(d => d.id === savedItem.id);
        if (exists) return prev.map(d => d.id === savedItem.id ? savedItem : d);
        return [savedItem, ...prev].sort((a, b) => b.extractedAt - a.extractedAt);
      });

      alert('Declaração processada e salva com sucesso!');
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      alert(`Ocorreu um problema: ${error.message || 'Erro desconhecido ao processar o PDF.'}`);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const filteredDeclaracoes = declaracoes.filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.document.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.extractedAt - a.extractedAt);

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Hidden File Input for Declarations (Root level for ref reliability) */}
      <input 
        id="pdf-upload-input"
        type="file" 
        ref={fileInputRef}
        accept="application/pdf" 
        className="hidden" 
        onChange={handleFileUpload} 
        onClick={(e) => { (e.target as any).value = null; }}
      />

      {/* Sub-tab Switcher */}
      <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('certificados')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeSubTab === 'certificados' 
              ? "bg-white text-[#5a0509] shadow-sm" 
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          Certificados
        </button>
        <button
          onClick={() => setActiveSubTab('declaracoes')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeSubTab === 'declaracoes' 
              ? "bg-white text-[#5a0509] shadow-sm" 
              : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          Declarações
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'certificados' ? (
          <motion.div
            key="certificados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
      {/* Hidden Certificate for Capture (No Transforms) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
         <div 
           ref={certificateRef}
           style={{
             backgroundColor: '#ffffff',
             position: 'relative',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             justifyContent: 'center',
             padding: '80px 64px',
             width: '1123px',
             height: '794px',
             fontFamily: "'Times New Roman', serif",
             color: '#000000',
             border: '20px solid #0f172a',
           }}
         >
            {/* Interior Border Line */}
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                bottom: '16px',
                left: '16px',
                right: '16px',
                border: '1px solid #0f172a',
              }} 
            />

            {/* Watermark Logo (Wolf) */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0,
                overflow: 'hidden',
                opacity: 0.08
              }}
            >
               {config.logoUrl ? (
                 <img 
                  src={config.logoUrl} 
                  crossOrigin="anonymous"
                  style={{
                    width: '740px',
                    height: '740px',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply'
                  }}
                  referrerPolicy="no-referrer"
                  alt="Lobo"
                 />
               ) : (
                 <div style={{ fontSize: '100px', opacity: 0.1, fontWeight: 900 }}>LOBO</div>
               )}
            </div>

            <div 
              style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flexGrow: 1,
                justifyContent: 'center',
                paddingTop: '20px',
                paddingBottom: '40px'
              }}
            >
               <h1 style={{ fontSize: '96px', marginBottom: '12px', marginTop: '0px', letterSpacing: '0.12em', fontFamily: 'serif', textTransform: 'uppercase', fontWeight: 400 }}>CERTIFICADO</h1>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '85%' }}>
                  <p style={{ fontSize: '24px', fontFamily: 'serif' }}>
                    Certificamos para os devidos fins que o Acadêmico
                  </p>

                  <h2 
                    style={{
                      fontSize: '56px',
                      fontWeight: 'normal',
                      fontFamily: 'cursive',
                      fontStyle: 'italic',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      display: 'inline-block',
                      minWidth: '400px',
                      borderBottom: '2px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    {data.recipientName}
                  </h2>

                  <p style={{ fontSize: '20px', lineHeight: '1.6', textAlign: 'justify', fontFamily: 'serif' }}>
                    Inscrito no RG: <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.rg}</span> RA: <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{data.ra}</span>, participou como <span style={{ fontWeight: 'bold' }}>{data.role}</span> da Associação Atlética Acadêmica de Engenharias – <span style={{ fontWeight: 'bold' }}>{data.location}</span> nos <span style={{ fontWeight: 'bold' }}>{data.eventName}</span> realizado na cidade de Ponta Grossa-PR nos dias {data.dates}.
                  </p>
               </div>
            </div>

            <div 
              style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                marginTop: '0px',
                paddingBottom: '0px'
              }}
            >
               <p style={{ fontSize: '20px', fontFamily: 'serif' }}>
                {data.issueCity}, {data.issueDate}.
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60px', justifyContent: 'flex-end' }}>
                     <span style={{ fontSize: '40px', fontFamily: 'cursive', fontStyle: 'italic', color: 'rgba(24, 24, 27, 0.8)', position: 'relative', zIndex: 20, transform: 'translateY(12px)' }}>
                        {data.signatureName}
                     </span>
                     <div style={{ width: '450px', height: '1.5px', backgroundColor: '#0f172a', zIndex: 10 }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <p style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{data.signatureName}</p>
                    <p style={{ fontSize: '16px', fontFamily: 'serif', fontStyle: 'italic', color: '#52525b', marginTop: '2px' }}>{data.signatureTitle}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-4">
             <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                <BadgeCheck className="w-7 h-7" />
             </div>
             Secretaria de Certificados
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4">Emissão e Autenticação de Documentos</p>
        </div>

        <button 
          id="download-btn"
          onClick={handleDownload}
          disabled={isGenerating}
          className={cn(
            "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group border-none cursor-pointer",
            isGenerating ? "bg-zinc-400 text-white" : "bg-[#5a0509] text-white hover:bg-[#300305]"
          )}
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
             <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
          {isGenerating ? 'Gerando Documento...' : 'Baixar Certificado PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          {/* Recipient Details */}
          <section className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
             <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Beneficiário</h3>
             </header>

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.recipientName}
                    onChange={(e) => updateField('recipientName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">RG</label>
                    <input 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                      value={data.rg}
                      onChange={(e) => updateField('rg', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">RA</label>
                    <input 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                      value={data.ra}
                      onChange={(e) => updateField('ra', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Cargo / Participação</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    placeholder="atleta, coordenador, etc."
                    value={data.role}
                    onChange={(e) => updateField('role', e.target.value)}
                  />
                </div>
             </div>
          </section>

          {/* Event Details */}
          <section className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
             <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Informações do Evento</h3>
             </header>

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Título do Evento</label>
                  <textarea 
                    rows={2}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all resize-none"
                    value={data.eventName}
                    onChange={(e) => updateField('eventName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Associação / Campus</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Período / Datas</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.dates}
                    onChange={(e) => updateField('dates', e.target.value)}
                  />
                </div>
             </div>
          </section>

          {/* Signature & Location */}
          <section className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
             <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Emissão</h3>
             </header>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Cidade de Emissão</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.issueCity}
                    onChange={(e) => updateField('issueCity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Data Completa</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.issueDate}
                    onChange={(e) => updateField('issueDate', e.target.value)}
                  />
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Assinatura (Nome)</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.signatureName}
                    onChange={(e) => updateField('signatureName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Cargo do Responsável</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#5a0509] outline-none transition-all"
                    value={data.signatureTitle}
                    onChange={(e) => updateField('signatureTitle', e.target.value)}
                  />
                </div>
             </div>
          </section>
        </div>

        {/* Certificate Preview Column */}
        <div className="lg:col-span-7">
           <div className="sticky top-40 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-zinc-400" />
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Pré-visualização do Documento</h3>
                </div>
              </div>

              {/* Responsive Container for the oversized Certificate */}
              <div className="bg-zinc-100 rounded-[2.5rem] p-6 border border-zinc-200 overflow-hidden shadow-inner flex items-center justify-center min-h-[400px]">
                 <div className="w-full relative overflow-hidden aspect-[297/210] bg-white rounded-xl shadow-2xl border border-zinc-200 flex items-center justify-center">
                    {/* The Actual oversized certificate, scaled down to fit */}
                    <div 
                      className="absolute origin-center transition-all duration-300 pointer-events-none"
                      style={{
                        transform: 'scale(0.4)',
                        width: '1123px',
                        height: '794px'
                      }}
                    >
                       <div 
                         style={{
                           backgroundColor: '#ffffff',
                           position: 'relative',
                           display: 'flex',
                           flexDirection: 'column',
                           alignItems: 'center',
                           justifyContent: 'center',
                           padding: '80px 64px',
                           width: '1123px',
                           height: '794px',
                           fontFamily: "'Times New Roman', serif",
                           color: '#000000',
                           border: '20px solid #0f172a',
                           boxShadow: 'none',
                           pointerEvents: 'auto',
                           userSelect: 'none'
                         }}
                       >
                          {/* Interior Border Line */}
                          <div 
                            style={{
                              position: 'absolute',
                              top: '16px',
                              bottom: '16px',
                              left: '16px',
                              right: '16px',
                              border: '1px solid #0f172a',
                              pointerEvents: 'none'
                            }} 
                          />

                          {/* Watermark Logo (Wolf) */}
                          <div 
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: 0,
                              right: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              zIndex: 0,
                              overflow: 'hidden',
                              opacity: 0.08
                            }}
                          >
                             {config.logoUrl ? (
                               <img 
                                src={config.logoUrl} 
                                style={{
                                  width: '740px',
                                  height: '740px',
                                  objectFit: 'contain',
                                  mixBlendMode: 'multiply'
                                }}
                                referrerPolicy="no-referrer"
                                alt="Lobo"
                               />
                             ) : (
                               <div 
                                  style={{
                                    width: '500px',
                                    height: '500px',
                                    border: '8px dashed #e5e7eb',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '96px',
                                    textTransform: 'uppercase',
                                    color: '#f3f4f6',
                                    transform: 'rotate(-12deg)'
                                  }}
                               >
                                  LOBO
                               </div>
                             )}
                          </div>

                          <div 
                            style={{
                              position: 'relative',
                              zIndex: 10,
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              flexGrow: 1,
                              justifyContent: 'center',
                              paddingTop: '20px',
                              paddingBottom: '40px'
                            }}
                          >
                             <h1 style={{ fontSize: '96px', marginBottom: '12px', marginTop: '0px', letterSpacing: '0.12em', fontFamily: 'serif', textTransform: 'uppercase', fontWeight: 400 }}>CERTIFICADO</h1>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '85%' }}>
                                <p style={{ fontSize: '24px', fontFamily: 'serif' }}>
                                  Certificamos para os devidos fins que o Acadêmico
                                </p>

                                <h2 
                                  style={{
                                    fontSize: '56px',
                                    fontWeight: 'normal',
                                    fontFamily: 'cursive',
                                    fontStyle: 'italic',
                                    letterSpacing: '-0.02em',
                                    paddingTop: '8px',
                                    paddingBottom: '8px',
                                    display: 'inline-block',
                                    minWidth: '400px',
                                    borderBottom: '2px solid rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {data.recipientName}
                                </h2>

                                <p style={{ fontSize: '20px', lineHeight: '1.6', textAlign: 'justify', fontFamily: 'serif' }}>
                                  Inscrito no RG: <span style={{ fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#d1d5db' }}>{data.rg}</span> RA: <span style={{ fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#d1d5db' }}>{data.ra}</span>, participou como <span style={{ fontWeight: 'bold' }}>{data.role}</span> da Associação Atlética Acadêmica de Engenharias – <span style={{ fontWeight: 'bold' }}>{data.location}</span> nos <span style={{ fontWeight: 'bold' }}>{data.eventName}</span> realizado na cidade de Ponta Grossa-PR nos dias {data.dates}.
                                </p>
                             </div>
                          </div>

                          <div 
                            style={{
                              position: 'relative',
                              zIndex: 10,
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '0px',
                              paddingBottom: '0px'
                            }}
                          >
                             <p style={{ fontSize: '20px', fontFamily: 'serif' }}>
                              {data.issueCity}, {data.issueDate}.
                             </p>

                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Formal Signature Area */}
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60px', justifyContent: 'flex-end' }}>
                                   <span 
                                      style={{
                                        fontSize: '40px',
                                        fontFamily: 'cursive',
                                        fontStyle: 'italic',
                                        color: 'rgba(24, 24, 27, 0.8)',
                                        position: 'relative',
                                        zIndex: 20,
                                        transform: 'translateY(12px)'
                                      }}
                                   >
                                      {data.signatureName}
                                   </span>
                                   <div style={{ width: '450px', height: '1.5px', backgroundColor: '#0f172a', zIndex: 10 }} />
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                  <p style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 1 }}>{data.signatureName}</p>
                                  <p style={{ fontSize: '16px', fontFamily: 'serif', fontStyle: 'italic', color: '#52525b', marginTop: '2px' }}>{data.signatureTitle}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                    <FileText className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Dica de Emissão</h5>
                    <p className="text-[10px] text-purple-700 font-bold leading-relaxed opacity-70">
                      O arquivo gerado respeita as proporções A4 Paisagem. O download pode demorar alguns segundos dependendo da velocidade de processamento.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
          </motion.div>
        ) : (
          <motion.div
            key="declaracoes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <DeclarationsHeader 
              isUploading={isUploading} 
              onUploadClick={() => fileInputRef.current?.click()} 
            />

            {/* Content Section: List */}
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="relative group max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#5a0509] transition-colors" />
                <input 
                  type="text"
                  placeholder="Pesquisar por nome, curso ou documento..."
                  className="w-full bg-white border border-zinc-100 rounded-3xl pl-14 pr-8 py-5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#5a0509]/10 outline-none transition-all placeholder:text-zinc-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Declarations List/Table */}
              <div className="bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-50">
                        <th className="px-8 py-6 text-left">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Atleta / Beneficiário</span>
                        </th>
                        <th className="px-8 py-6 text-left">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Curso Acadêmico</span>
                        </th>
                        <th className="px-8 py-6 text-left">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Documento / ID</span>
                        </th>
                        <th className="px-8 py-6 text-left">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Emissão</span>
                        </th>
                        <th className="px-8 py-6 text-right">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredDeclaracoes.length > 0 ? (
                        filteredDeclaracoes.map((decl) => (
                          <motion.tr 
                            layout
                            key={decl.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group hover:bg-zinc-50/50 transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">
                                  {decl.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-zinc-900">{decl.fullName}</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Verificado em {new Date(decl.extractedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1.5 bg-zinc-100 rounded-lg text-[10px] font-black text-zinc-600 uppercase tracking-wider">
                                {decl.course}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-mono font-bold text-zinc-500">{decl.document}</p>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                {decl.issueDate}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => deleteItem('declaracoes', decl.id)}
                                className="p-2.5 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-200">
                                <ShieldCheck className="w-8 h-8" />
                              </div>
                              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Nenhuma declaração encontrada</h4>
                              <p className="text-xs text-zinc-400 font-bold max-w-xs leading-relaxed opacity-60">
                                Faça o upload de um arquivo PDF para extrair as informações automaticamente.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2.5rem] flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#5a0509] flex items-center justify-center text-white shrink-0 shadow-xl shadow-[#5a0509]/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#5a0509] uppercase tracking-[0.2em] mb-2">Processamento com Inteligência Artificial</h4>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed max-w-2xl">
                    Utilizamos modelos avançados de IA para ler seus documentos. Embora altamente precisos, recomendamos validar as informações extraídas. O sistema identifica automaticamente o layout de diferentes instituições acadêmicas.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen loading for extraction */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-lobo-primary flex items-center justify-center mb-8 shadow-2xl shadow-lobo-primary/50 relative">
              <div className="absolute inset-0 rounded-[2rem] border-4 border-lobo-secondary/20 border-t-lobo-secondary animate-spin" />
              <FileText className="w-10 h-10 text-lobo-secondary" />
            </div>
            
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
              Lendo sua Declaração
            </h3>
            <p className="text-lobo-secondary font-black text-xs uppercase tracking-[0.3em] mb-8 animate-pulse">
              {uploadStatus || 'Iniciando processamento...'}
            </p>
            
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest leading-tight">Análise em tempo real</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Isso pode levar de 5 a 10 segundos dependendo do documento.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
