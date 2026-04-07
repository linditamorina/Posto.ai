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
          description: "Një platformë Workspace e integruar që përdor Inteligjencën Artificiale për të transformuar idetë në strategji reale. Sistemi menaxhon gjenerimin e përmbajtjes, analizat e të dhënave dhe rrjedhën e punës në një vend të vetëm.",
          icon: "🚀"
        },
        {
          title: "Gjenerimi me AI",
          description: "Përdorni fuqinë e AI për të krijuar tekste origjinale. Ju mund të specifikoni kontekstin dhe tonin e zërit, ndërsa sistemi përshtat modelin gjuhësor për të prodhuar rezultate unike që nuk përsëriten.",
          icon: "🧠"
        },
        {
          title: "Hierarkia e Roleve",
          description: "Siguria është prioritet. Adminët kanë qasje të plotë në menaxhimin e përdoruesve dhe kontrollin e stokut, ndërsa User-at fokusohen në ndryshimet operative, duke siguruar një strukturë të pastër biznesi.",
          icon: "🛡️"
        },
        {
          title: "Vault & Sinkronizimi",
          description: "Çdo gjenerim dhe ndryshim ruhet në 'Vault'. Falë integrimit me Supabase, të dhënat tuaja janë të mbrojtura me enkriptim dhe janë të aksesueshme në kohë reale nga çdo pajisje ku jeni të identifikuar.",
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
          description: "An integrated Workspace platform that uses Artificial Intelligence to transform ideas into real strategies. The system manages content generation, data analysis, and workflow in one single place.",
          icon: "🚀"
        },
        {
          title: "AI Generation",
          description: "Use the power of AI to create original content. You can specify context and tone of voice, while the system adapts the language model to produce unique, non-repetitive results.",
          icon: "🧠"
        },
        {
          title: "Role Hierarchy",
          description: "Security is a priority. Admins have full access to user management and stock control, while Users focus on operational changes, ensuring a clean business structure.",
          icon: "🛡️"
        },
        {
          title: "Vault & Sync",
          description: "Every generation and change is stored in the 'Vault'. Thanks to Supabase integration, your data is protected with encryption and accessible in real-time from any authenticated device.",
          icon: "🔒"
        }
      ],
      next: "Next",
      back: "Back",
      finish: "Got it"
    }
  };

  if (!isOpen) return null;

  const activeContent = content[lang];
  const step = activeContent.steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800/60 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative">
        
        {/* Language Toggle */}
        <div className="absolute top-8 right-8 flex gap-2">
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
          {/* Visual Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-indigo-500/20 animate-pulse">
              {step.icon}
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-4 min-h-[160px]">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {step.title}
            </h2>
            <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-1.5 mt-10">
            {activeContent.steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-10 bg-indigo-500' : 'w-2 bg-slate-800'}`} 
              />
            ))}
          </div>

          {/* Navigation Buttons */}
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
                else { onClose(); setCurrentStep(0); }
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