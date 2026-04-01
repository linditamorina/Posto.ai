"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STYLES = [
  { id: "photo", label: "📸 Realistic", suffix: "ultra-realistic, 8k resolution, cinematic lighting, shot on 35mm lens, highly detailed textures, professional photography" },
  { id: "studio", label: "🏢 Studio", suffix: "studio lighting, clean background, product photography, high-end commercial style" },
  { id: "street", label: "🌆 Street", suffix: "street photography style, natural lighting, urban setting, candid, grainy film look" }
];

export default function TextToImage() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Modals & States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showContentPrompt, setShowContentPrompt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const router = useRouter();

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
    setGeneratedContent(null);
    try {
      const fullPrompt = `${prompt}, ${selectedStyle.suffix}`;
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      if (data.url) {
        setProgress(100);
        setGeneratedImage(data.url);
        setShowContentPrompt(true); // Show question after generation
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateContent = async () => {
    setShowContentPrompt(false);
    setIsGeneratingContent(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: prompt, 
          selectedImage: generatedImage,
          numPosts: 3,
          language: "en" // Set to English
        }),
      });
      const result = await response.json();
      if (result.data) {
        setGeneratedContent(result.data);
      }
    } catch (err) {
      console.error("Error generating content:", err);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const saveToVault = async () => {
    if (!generatedImage) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("You must be logged in!");

      const { error } = await supabase
        .from("posts")
        .insert([
          { 
            reference_image: generatedImage, 
            business_name: "AI Generated Art",
            content: generatedContent, 
            user_id: user.id,
            is_favorite: true,
            created_at: new Date()
          }
        ]);

      if (error) throw error;
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 font-sans relative overflow-x-hidden">
      
      {/* MODAL: CONTENT GENERATION QUESTION */}
      {showContentPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl scale-in-center">
            <div className="text-4xl">✍️</div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Generate Copy?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Would you like AI to generate 3 professional posts based on this image and your prompt?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowContentPrompt(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">No</button>
              <button onClick={handleGenerateContent} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">Yes, Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(79,70,229,0.2)] scale-in-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
              <span className="text-4xl">🛡️</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Saved to Vault</h3>
              <p className="text-slate-400 text-xs">The image was successfully archived in your personal collection.</p>
            </div>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Continue</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex justify-between items-center border-b border-slate-800/50 pb-8">
          <button onClick={() => router.push('/')} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10 hover:text-white transition-all">
            ← Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
             <span className="bg-amber-500 text-black px-2 py-0.5 rounded-lg not-italic text-xs md:text-sm">PRO</span>
             Text to Image
          </h1>
          <div className="hidden sm:block w-24"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[45px] shadow-2xl backdrop-blur-xl space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-4">Art Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((s) => (
                    <button key={s.id} onClick={() => setSelectedStyle(s)} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all border ${selectedStyle.id === s.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-4">Description (EN/SQ)</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your idea here..."
                  className="w-full h-44 bg-slate-950/50 border border-slate-800 rounded-[30px] p-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-slate-300 shadow-inner"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
              >
                {isGenerating ? "Processing..." : "Generate Magic ✨"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/20 border-2 border-dashed border-slate-800/50 rounded-[50px] aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl">
              {generatedImage ? (
                <>
                  <img src={generatedImage} alt="AI Art" className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                    <button onClick={downloadImage} className="w-48 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105">
                      Download Image ⬇
                    </button>
                    <button 
                      onClick={saveToVault}
                      disabled={isSaving}
                      className="w-48 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 border border-indigo-400/30 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save to Vault 🛡️"}
                    </button>
                  </div>
                </>
              ) : isGenerating ? (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-8">
                  <div className="relative flex items-center justify-center">
                    <div className="w-28 h-28 border-2 border-indigo-500/10 rounded-full"></div>
                    <div className="w-28 h-28 border-t-2 border-indigo-500 rounded-full animate-spin absolute top-0"></div>
                    <span className="absolute text-indigo-400 font-black text-sm">{progress}%</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">Generating your art...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800/20 rounded-full flex items-center justify-center mx-auto border border-slate-800/50">
                        <span className="text-3xl grayscale opacity-30">🎨</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.4em]">Ready to create</p>
                </div>
              )}
            </div>

            {/* CONTENT LOADING & DISPLAY SECTION */}
            {isGeneratingContent && (
               <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[35px] animate-pulse flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Writing professional copy...</p>
               </div>
            )}

            {generatedContent && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 ml-4">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">AI Copywriting Plan</h4>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {generatedContent.posts?.map((post: any, i: number) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[30px] shadow-xl group hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Idea {i+1}</span>
                         <span className="text-[8px] text-slate-600 font-bold uppercase">{post.hashtags?.split(' ')[0] || '#Content'}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{post.caption}"</p>
                      <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-bold">
                        {post.hashtags}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}