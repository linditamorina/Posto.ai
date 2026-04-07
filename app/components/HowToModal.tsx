"use client";
import { useState } from 'react';

export default function HowToModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [lang, setLang] = useState<'sq' | 'en'>('sq');
  const [currentStep, setCurrentStep] = useState(0);

  const content = {
    sq: {
      steps: [
        {
          title: "Ekosistemi Posto.ai",
          description: "Një platformë Workspace e integruar që përdor Inteligjencën Artificiale për të transformuar idetë në strategji reale.",
          icon: "🚀"
        },
        {
          title: "Text to Image (AI Art)",
          description: "Shndërroni përshkrimet tuaja në vizuale mahnitëse. Shkruani një 'prompt' të detajuar dhe AI do të gjenerojë imazhe unike për postimet tuaja, duke eliminuar nevojën për foto stock.",
          icon: "🎨"
        },
        {
          title: "Image to Text (Vision)",
          description: "Ngarkoni një imazh dhe AI do ta analizojë atë. Sistemi mund të nxjerrë përshkrime, të kuptojë kontekstin vizual ose të gjenerojë mbishkrime (captions) bazuar direkt në përmbajtjen e fotos.",
          icon: "👁️"
        },
        {
          title: "Gjenerimi me AI",
          description: "Përdorni fuqinë e AI për të krijuar tekste origjinale. Ju mund të specifikoni kontekstin dhe tonin e zërit për rezultate unike.",
          icon: "🧠"
        },
        {
          title: "Hierarkia e Roleve",
          description: "Adminët menaxhojnë përdoruesit dhe stokun, ndërsa User-at fokusohen në operacione, duke siguruar strukturë të pastër.",
          icon: "🛡️"
        },
        {
          title: "Vault & Sinkronizimi",
          description: "Çdo gjenerim ruhet në 'Vault' me enkriptim via Supabase, i aksesueshëm në kohë reale nga çdo pajisje.",
          icon: "🔒"
        }
      ],
      next: "Vazhdo",
      back: "Mbrapa",
      finish: "E kuptova"
    },
    en: {
      steps: [
        {
          title: "Posto.ai Ecosystem",
          description: "An integrated Workspace platform that uses AI to transform ideas into real-world marketing strategies.",
          icon: "🚀"
        },
        {
          title: "Text to Image (AI Art)",
          description: "Turn your descriptions into stunning visuals. Enter a detailed prompt and the AI will generate unique images, removing the need for generic stock photos.",
          icon: "🎨"
        },
        {
          title: "Image to Text (Vision)",
          description: "Upload an image and let the AI analyze it. The system can extract descriptions, understand visual context, or generate captions based on the photo.",
          icon: "👁️"
        },
        {
          title: "AI Generation",
          description: "Leverage AI to create original text. Specify context and tone of voice for tailored, non-repetitive results.",
          icon: "🧠"
        },
        {
          title: "Role Hierarchy",
          description: "Admins manage users and stock, while Users focus on operations, ensuring a clean and secure business structure.",
          icon: "🛡️"
        },
        {
          title: "Vault & Sync",
          description: "Every generation is secured in the 'Vault' via Supabase encryption, accessible in real-time across all devices.",
          icon: "🔒"
        }
      ],
      next: "Next",
      back: "Back",
      finish: "Got it"
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setCurrentStep(0), 300);
  };

  if (!isOpen) return null;

  const activeContent = content[lang];
  const step = activeContent.steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800/60 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative">
        
        {/* Exit Button */}
        <button 
          onClick={handleClose}
          className="absolute top-8 left-8 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all z-10"
        >
          <span className="text-sm font-black">✕</span>
        </button>

        {/* Language Toggle */}
        <div className="absolute top-8 right-8 flex gap-2 z-10">
          {['sq', 'en'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as 'sq' | 'en')}
              className={`px-2 py-1 text-[9px] font-black rounded-lg border transition-all ${lang === l ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-indigo-500/20 animate-pulse">
              {step.icon}
            </div>
          </div>

          <div className="text-center space-y-4 min-h-[160px]">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {step.title}
            </h2>
            <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-1.5 mt-10">
            {activeContent.steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-10 bg-indigo-500' : 'w-2 bg-slate-800'}`} 
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 border-2 border-slate-800 text-slate-400 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic"
              >
                {activeContent.back}
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < activeContent.steps.length - 1) setCurrentStep(prev => prev + 1);
                else { handleClose(); }
              }}
              className="flex-1 bg-white text-slate-950 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg italic"
            >
              {currentStep === activeContent.steps.length - 1 ? activeContent.finish : activeContent.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}