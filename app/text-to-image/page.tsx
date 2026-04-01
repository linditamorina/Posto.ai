"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STYLES = [
  { id: "photo", label: "📸 Realistic", suffix: "ultra-realistic, 8k resolution, cinematic lighting, shot on 35mm lens, highly detailed textures, professional photography" },
  { id: "studio", label: "🏢 Studio", suffix: "studio lighting, clean background, product photography, high-end commercial style" },
  { id: "street", label: "🌆 Street", suffix: "street photography style, natural lighting, urban setting, candid, grainy film look" }
];

export default function TextToImage() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Animacioni i progresit (simulim)
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return prev;
          return prev + Math.floor(Math.random() * 3) + 1;
        });
      }, 600);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    
    try {
      const fullPrompt = `${prompt}, ${selectedStyle.suffix}`;

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Diçka shkoi keq gjatë gjenerimit.");
      }

      if (data.url) {
        setProgress(100);
        setGeneratedImage(data.url);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-art-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-slate-800/50 pb-8 text-center sm:text-left">
          <button 
            onClick={() => router.push('/')} 
            className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10"
          >
            ← Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
             <span className="bg-amber-500 text-black px-2 py-0.5 rounded-lg not-italic text-xs md:text-sm">PRO</span>
             Text to Image
          </h1>
          <div className="hidden sm:block w-24"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: SETTINGS */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[45px] shadow-2xl backdrop-blur-xl space-y-6">
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-4">Stili i Artit</label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(s)}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                        selectedStyle.id === s.id 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-4">Përshkrimi (SQ/EN)</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Shkruaj idenë tënde këtu..."
                  className="w-full h-44 bg-slate-950/50 border border-slate-800 rounded-[30px] p-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-slate-300 shadow-inner"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
              >
                {isGenerating ? "Duke procesuar..." : "Gjenero Magic ✨"}
              </button>
            </div>
          </div>

          {/* RIGHT: RESULT */}
          <div className="lg:col-span-7 h-full">
            <div className="bg-slate-900/20 border-2 border-dashed border-slate-800/50 rounded-[50px] aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl">
              
              {generatedImage ? (
                <>
                  <img 
                    src={generatedImage} 
                    alt="AI Generated" 
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" 
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={downloadImage}
                      className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105"
                    >
                      Download Image ⬇
                    </button>
                  </div>
                </>
              ) : !isGenerating && !error && (
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800/20 rounded-full flex items-center justify-center mx-auto border border-slate-800/50">
                       <span className="text-3xl grayscale opacity-30">🎨</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.4em]">
                       Gati për krijim
                    </p>
                </div>
              )}

              {error && (
                <div className="text-center p-10">
                  <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3">⚠️ Gabim</p>
                  <p className="text-slate-400 text-xs italic mb-6">{error}</p>
                  <button onClick={handleGenerate} className="text-indigo-400 font-bold text-[10px] uppercase underline">Provo përsëri</button>
                </div>
              )}

              {/* OVERLAY LOADING ME PËRQINDJE */}
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-8">
                  <div className="relative flex items-center justify-center">
                    <div className="w-28 h-28 border-2 border-indigo-500/10 rounded-full"></div>
                    <div className="w-28 h-28 border-t-2 border-indigo-500 rounded-full animate-spin absolute top-0"></div>
                    <span className="absolute text-indigo-400 font-black text-sm">{progress}%</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">
                      {progress < 30 ? "Duke përkthyer shqip..." : "Duke gjeneruar artin..."}
                    </p>
                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
                       <div 
                         className="h-full bg-indigo-500 transition-all duration-500" 
                         style={{ width: `${progress}%` }}
                       ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}