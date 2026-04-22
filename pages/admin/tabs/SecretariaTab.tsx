
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, CheckCircle2, User, Hash, Calendar, MapPin, BadgeCheck, Eye, Trash2, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '../../../lib/utils';
import { getConfig } from '../../../services/storageService';

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

export const SecretariaTab: React.FC = () => {
  const [data, setData] = useState<CertificateData>(DEFAULT_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState(getConfig());
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorage = () => setConfig(getConfig());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDownload = async () => {
    if (!certificateRef.current) {
      alert('Erro: Elemento do certificado não encontrado.');
      return;
    }
    
    setIsGenerating(true);

    try {
      console.log('Iniciando captura do certificado...');
      
      // html2canvas can sometimes fail if images aren't fully loaded
      // We give a small delay just in case of pending paints
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        windowWidth: 1123,
        windowHeight: 794
      });

      console.log('Canvas gerado com sucesso.');
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `certificado_${data.recipientName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      console.log(`PDF "${fileName}" salvo com sucesso.`);
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Não foi possível gerar o PDF. Verifique se há algum problema com a conexão ou imagens.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: keyof CertificateData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
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
             justifyContent: 'space-between',
             padding: '64px',
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
                opacity: 0.1
              }}
            >
               {config.logoUrl ? (
                 <img 
                  src={config.logoUrl} 
                  style={{
                    width: '600px',
                    height: '600px',
                    objectFit: 'contain',
                    filter: 'grayscale(100%)'
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
                justifyContent: 'center'
              }}
            >
               <h1 style={{ fontSize: '128px', marginBottom: '48px', letterSpacing: '0.12em', fontFamily: 'serif', textTransform: 'uppercase', fontWeight: 400 }}>CERTIFICADO</h1>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '90%' }}>
                  <p style={{ fontSize: '30px', fontFamily: 'serif' }}>
                    Certificamos para os devidos fins que o Acadêmico
                  </p>

                  <h2 
                    style={{
                      fontSize: '48px',
                      fontWeight: 900,
                      fontStyle: 'italic',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      display: 'inline-block',
                      minWidth: '400px',
                      borderBottom: '2px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    {data.recipientName}
                  </h2>

                  <p style={{ fontSize: '24px', lineHeight: '1.7', textAlign: 'justify', fontFamily: 'serif' }}>
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
                gap: '48px',
                marginTop: '48px'
              }}
            >
               <p style={{ fontSize: '24px', fontFamily: 'serif' }}>
                {data.issueCity}, {data.issueDate}.
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <span style={{ fontSize: '48px', fontFamily: 'cursive', fontStyle: 'italic', color: 'rgba(24, 24, 27, 0.8)', marginBottom: '-24px', position: 'relative', zIndex: 20 }}>
                        {data.signatureName}
                     </span>
                     <div style={{ width: '450px', height: '1.5px', backgroundColor: '#0f172a' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>{data.signatureName}</p>
                    <p style={{ fontSize: '18px', fontFamily: 'serif', fontStyle: 'italic', color: '#52525b', marginTop: '4px' }}>{data.signatureTitle}</p>
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
                           justifyContent: 'space-between',
                           padding: '64px',
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
                                  width: '600px',
                                  height: '600px',
                                  objectFit: 'contain',
                                  filter: 'grayscale(100%)'
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
                              justifyContent: 'center'
                            }}
                          >
                             <h1 style={{ fontSize: '128px', marginBottom: '48px', letterSpacing: '0.12em', fontFamily: 'serif', textTransform: 'uppercase', fontWeight: 400 }}>CERTIFICADO</h1>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '90%' }}>
                                <p style={{ fontSize: '30px', fontFamily: 'serif' }}>
                                  Certificamos para os devidos fins que o Acadêmico
                                </p>

                                <h2 
                                  style={{
                                    fontSize: '48px',
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    letterSpacing: '-0.02em',
                                    paddingTop: '16px',
                                    paddingBottom: '16px',
                                    display: 'inline-block',
                                    minWidth: '400px',
                                    borderBottom: '2px solid rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {data.recipientName}
                                </h2>

                                <p style={{ fontSize: '24px', lineHeight: '1.7', textAlign: 'justify', fontFamily: 'serif' }}>
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
                              gap: '48px',
                              marginTop: '48px'
                            }}
                          >
                             <p style={{ fontSize: '24px', fontFamily: 'serif' }}>
                              {data.issueCity}, {data.issueDate}.
                             </p>

                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Formal Signature Area */}
                                <div style={{ position: 'relative', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                   <span 
                                      style={{
                                        fontSize: '48px',
                                        fontFamily: 'cursive',
                                        fontStyle: 'italic',
                                        color: 'rgba(24, 24, 27, 0.8)',
                                        marginBottom: '-24px',
                                        position: 'relative',
                                        zIndex: 20
                                      }}
                                   >
                                      {data.signatureName}
                                   </span>
                                   <div style={{ width: '450px', height: '1.5px', backgroundColor: '#0f172a' }} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <p style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 1 }}>{data.signatureName}</p>
                                  <p style={{ fontSize: '18px', fontFamily: 'serif', fontStyle: 'italic', color: '#52525b', marginTop: '4px' }}>{data.signatureTitle}</p>
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
    </div>
  );
};
