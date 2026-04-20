import React, { useState } from 'react';
import { getConfig, saveConfig, handleImageUpload } from '../../../services/storageService';
import { motion } from 'motion/react';
import { Save, Upload, Palette, Image as ImageIcon, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const SettingsTab: React.FC = () => {
  const [cfg, setCfg] = useState(getConfig());
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');

  const save = () => {
    saveConfig(cfg);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await handleImageUpload(file);
      setCfg({...cfg, logoUrl: url});
    } catch { 
      alert('Erro ao fazer upload da imagem.'); 
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Visual Customization */}
      <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Palette className="w-48 h-48 rotate-12" />
          </div>

          <header className="flex items-center space-x-3 mb-8 relative z-10">
            <div className="p-3 bg-zinc-900 rounded-2xl text-white shadow-xl shadow-zinc-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Identidade Visual</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Personalize o visual do sistema</p>
            </div>
          </header>

          <div className="space-y-10 relative z-10">
            {/* Logo Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-2 text-zinc-500">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Logo da Instituição</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Esta logo aparecerá no cabeçalho de todas as páginas públicas e administrativas. 
                  Recomendamos imagens em formato PNG com fundo transparente.
                </p>
                <label className="inline-flex items-center px-6 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl cursor-pointer transition-all group">
                  <Upload className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-600" />
                  <span className="text-xs font-bold text-zinc-600">Escolher Arquivo</span>
                  <input type="file" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </div>

              <div className="w-full md:w-32 h-32 rounded-2xl border-2 border-dashed border-zinc-100 flex items-center justify-center p-4 bg-zinc-50/50 group overflow-hidden relative">
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {cfg.logoUrl ? (
                  <img src={cfg.logoUrl} className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <Sliders className="w-8 h-8 text-zinc-200" />
                )}
              </div>
            </div>

            {/* Colors Section */}
            <div className="pt-8 border-t border-zinc-100">
              <div className="flex items-center space-x-2 text-zinc-500 mb-6">
                <Palette className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Paleta de Cores</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="group p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Cor Primária</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-14 h-14 rounded-xl shadow-lg group-hover:scale-105 transition-transform overflow-hidden cursor-pointer">
                      <input 
                        type="color" 
                        className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-none p-0 outline-none" 
                        value={cfg.primaryColor} 
                        onChange={e => setCfg({...cfg, primaryColor: e.target.value})} 
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-zinc-900 block font-mono">{cfg.primaryColor.toUpperCase()}</span>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Main accent color</p>
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Cor Secundária</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-14 h-14 rounded-xl shadow-lg group-hover:scale-105 transition-transform overflow-hidden cursor-pointer">
                      <input 
                        type="color" 
                        className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-none p-0 outline-none" 
                        value={cfg.secondaryColor} 
                        onChange={e => setCfg({...cfg, secondaryColor: e.target.value})} 
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-zinc-900 block font-mono">{cfg.secondaryColor.toUpperCase()}</span>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Secondary accents</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.button 
              layout
              whileTap={{ scale: 0.98 }}
              onClick={save} 
              className={cn(
                "w-full py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center space-x-3 shadow-xl",
                status === 'saved' 
                  ? "bg-green-500 text-white shadow-green-100" 
                  : "bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800"
              )}
            >
              {status === 'saved' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Configurações Salvas</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Aplicar Alterações</span>
                </>
              )}
            </motion.button>
          </div>
        </section>
      </div>

      {/* Info Sidebar */}
      <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
        <section className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Sliders className="w-32 h-32 text-white" />
          </div>
          
          <h4 className="text-[10px] font-black p-1 text-zinc-500 uppercase tracking-[0.3em] mb-4 relative z-10 border-b border-zinc-800">Preview ao Vivo</h4>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-8 relative z-10">
            As alterações de cores são aplicadas via variáveis CSS globais, afetando botões, ícones e estados de destaque em todo o sistema.
          </p>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: cfg.primaryColor }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Botões Ativos</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Hex: {cfg.primaryColor}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: cfg.secondaryColor }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Destaques Secundários</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Hex: {cfg.secondaryColor}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
          <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Dica de Design</h5>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            Prefira cores com bom contraste em relação ao fundo branco para garantir a legibilidade do sistema em todas as telas.
          </p>
        </div>
      </div>
    </div>
  );
};
