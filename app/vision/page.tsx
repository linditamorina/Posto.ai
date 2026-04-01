"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import moment from "moment";

export default function VisionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("Mitrovicë");
  const [businessDescription, setBusinessDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketingPost, setMarketingPost] = useState<any>(null);
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedImage,
          businessName,
          location,
          businessDescription,
          industry: "Retail/Market",
          numPosts: 1,
          tone: "Professional & Modern",
          language: "sq"
        }),
      });

      const responseData = await res.json();
      if (responseData.data?.posts) {
        setMarketingPost(responseData.data.posts[0]);
      }
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    if (!marketingPost || !user) return;
    setCreatePostLoading(true);
    try {
      const { error } = await supabase.from("posts").insert([{
        business_name: businessName || "Vision AI",
        content: { posts: [marketingPost] },
        user_id: user?.id,
        start_date: moment().format("YYYY-MM-DD"),
        location: location,
        reference_image: selectedImage,
        is_favorite: true,
      }]);
      if (error) throw error;
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setCreatePostLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 p-4 sm:p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative z-10">
        
        {/* Header - Minimal & Consistent */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/50 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <span className="text-white font-black text-xl italic">V</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Vision AI</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Neural Marketing</p>
            </div>
          </div>
          <button onClick={() => router.push("/")} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            🏠 Home
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Side: Parameters */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-[#111827]/50 backdrop-blur-xl border border-slate-800/60 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                  <input 
                    className="w-full bg-[#0B0F1A] border border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500/50 text-sm font-bold transition-all placeholder:text-slate-700" 
                    placeholder="Business Name" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Region</label>
                  <input 
                    className="w-full bg-[#0B0F1A] border border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500/50 text-sm font-bold transition-all placeholder:text-slate-700" 
                    placeholder="Mitrovicë" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Context Analysis</label>
                <textarea 
                  className="w-full bg-[#0B0F1A] border border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500/50 text-sm font-bold transition-all min-h-[120px] resize-none placeholder:text-slate-700" 
                  placeholder="What are we promoting? (Albanian or English)" 
                  value={businessDescription} 
                  onChange={e => setBusinessDescription(e.target.value)} 
                />
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-56 rounded-[2rem] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden ${selectedImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/30'}`}
              >
                {selectedImage ? (
                  <img src={selectedImage} className="w-full h-full object-cover" alt="Visual Reference" />
                ) : (
                  <div className="text-center">
                    <span className="text-3xl block mb-2 opacity-50">🖼️</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Visual Input Required</p>
                  </div>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const r = new FileReader();
                    r.onload = () => setSelectedImage(r.result as string);
                    r.readAsDataURL(file);
                  }
                }} accept="image/*" />
              </div>

              <button 
                onClick={analyzeImage}
                disabled={loading || !selectedImage}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {loading ? "Processing Intelligence..." : "Execute Vision ✨"}
              </button>
            </div>
          </section>

          {/* Right Side: Output */}
          <section className="lg:col-span-7">
            {marketingPost ? (
              <div className="bg-[#111827]/30 border border-slate-800/60 p-8 md:p-12 rounded-[3rem] space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Analysis Result</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 italic px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800">📍 {location}</span>
                </div>

                <div className="space-y-10">
                  <div className="group">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4 group-hover:text-indigo-400 transition-colors">Headline Hook</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight italic tracking-tighter uppercase">
                      "{marketingPost?.hook}"
                    </h2>
                  </div>

                  <div className="relative group">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4 group-hover:text-indigo-400 transition-colors">Semantic Content</span>
                    <div className="bg-[#0B0F1A]/80 border border-slate-800/40 p-8 rounded-[2.5rem] relative z-10">
                      <p className="text-lg font-medium leading-relaxed text-slate-300 italic">
                        {marketingPost?.caption}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800/50">
                    <div className="flex flex-wrap gap-2">
                      {marketingPost?.hashtags?.split(' ').filter(Boolean).map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] font-black text-indigo-400 bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/20 uppercase tracking-tighter">
                          #{tag.replace('#', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSavePost}
                  disabled={createPostLoading}
                  className="w-full py-5 bg-white text-black hover:bg-slate-200 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  {createPostLoading ? "Syncing..." : (
                    <>
                      <span>Secure to Vault</span>
                      <span className="text-lg">🔒</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="h-full min-h-[500px] border border-slate-800 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 text-center bg-slate-900/10">
                <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                  <span className="text-4xl grayscale opacity-20">⚡</span>
                </div>
                <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] leading-loose">
                  Neural Sync Pending<br/>
                  <span className="text-slate-800 text-[8px] font-medium lowercase italic">Provide reference data to begin analysis</span>
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* TOAST */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl flex items-center gap-4">
            <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
            Asset Secured
          </div>
        </div>
      )}
    </div>
  );
}