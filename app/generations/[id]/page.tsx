"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic"; // 1. Shto këtë

// 2. Importo butonin në mënyrë dinamike me SSR false
const PdfButton = dynamic(() => import("@/app/components/PdfButton"), { 
  ssr: false 
});

export default function GenerationDetails() {
  const { id } = useParams(); 
  const { user } = useAuth();
  const router = useRouter();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) fetchPost();
  }, [user, id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
      if (error || !data) {
        router.push("/");
      } else {
        setPost(data);
        setIsFavorite(data.is_favorite ?? false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, uniqueId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(uniqueId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = async () => {
    try {
      const { error } = await supabase.from("posts").update({ is_favorite: !isFavorite }).eq("id", id);
      if (!error) setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-indigo-500 font-black animate-pulse uppercase tracking-[0.4em] text-sm text-center px-4">
      Decrypting Archive...
    </div>
  );

  // LOGJIKA E PËRMIRËSUAR PËR PARSIMIN E PËRMBAJTJES
  let rawContent = post?.content;
  if (typeof rawContent === 'string') {
    try { 
      rawContent = JSON.parse(rawContent); 
    } catch (e) { 
      console.error("JSON Parse error:", e); 
    }
  }

  // Sigurohemi që gjejmë listën e postimeve kudo që të jetë në objekt
  const postList = rawContent?.posts || rawContent?.data?.posts || (Array.isArray(rawContent) ? rawContent : []);
  const offerList = rawContent?.special_offers || rawContent?.data?.special_offers || rawContent?.offers || [];

  // Përgatitja e objektit për PDF (sigurohemi që ka strukturën që pret PdfButton)
  const postForPdf = post ? {
    ...post,
    content: rawContent?.posts ? rawContent : { posts: postList }
  } : null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 md:p-16 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-6 sm:gap-4">
          <button 
            onClick={() => router.back()} 
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-400 transition-all"
          >
            <span className="text-base md:text-lg group-hover:-translate-x-1 transition-transform">←</span> Return to Base
          </button>
          
          <div className="flex flex-row items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {post && <PdfButton post={postForPdf} />}
            
            <button onClick={toggleFavorite} className={`flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 rounded-[14px] md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all duration-500 border-2 w-full sm:w-auto ${isFavorite ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)]" : "bg-slate-900 border-slate-800 text-slate-500 hover:border-indigo-600 hover:text-white"}`}>
              <span className="text-base md:text-lg">{isFavorite ? "★" : "☆"}</span>
              {isFavorite ? "Saved" : "Store"}
            </button>
          </div>
        </header>

        {post?.reference_image && (
          <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <p className="text-indigo-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.5em] mb-3 md:mb-4 italic ml-2 opacity-80">Visual Inspiration Source</p>
            <div className="rounded-[30px] md:rounded-[50px] overflow-hidden border border-slate-800/60 shadow-2xl aspect-[16/9] md:aspect-[21/9] bg-slate-900">
              <img 
                src={post.reference_image} 
                alt="Reference Source" 
                className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700 active:scale-105 cursor-zoom-in" 
              />
            </div>
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[30px] md:rounded-[50px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
          <div className="p-6 sm:p-10 md:p-14 border-b border-slate-800/60 bg-slate-900/20">
            <p className="text-indigo-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] mb-3 md:mb-4 italic opacity-80 underline underline-offset-4 md:underline-offset-8 decoration-indigo-950">AI Strategic Model</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase italic text-white leading-tight break-words">{post?.business_name}</h1>
          </div>

          <div className="p-6 sm:p-10 md:p-14 space-y-8 md:space-y-12">
            <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-600 mb-6 md:mb-8 border-l-4 border-indigo-600 pl-3 md:pl-4">Content Nodes</h2>
            
            {/* LISTIMI I POSTIMEVE */}
            {postList.length > 0 ? postList.map((p: any, idx: number) => (
              <div key={idx} className="group bg-slate-800/30 p-6 sm:p-8 md:p-10 rounded-[25px] md:rounded-[40px] border border-slate-700/30 transition-all duration-500 hover:bg-slate-800/50 hover:border-indigo-500/30">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <span className="bg-slate-900 text-indigo-400 px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-slate-800 shadow-inner">Node #{idx + 1}</span>
                  <button onClick={() => copyToClipboard(`${p.hook || ''}\n\n${p.caption || ''}`, `post-${idx}`)} className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-500 hover:text-indigo-400 transition-all">
                    {copiedId === `post-${idx}` ? "✓" : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 md:mb-4 italic leading-tight tracking-tight">"{p.hook || p.title || "Innovation Insight"}"</h3>
                <p className="text-slate-400 leading-relaxed font-medium text-base sm:text-lg opacity-90">{p.caption || p.content}</p>
                
                {p.hashtags && (
                  <div className="flex flex-wrap gap-2 md:gap-3 pt-5 md:pt-6 border-t border-slate-800/40 mt-5 md:mt-6">
                    {Array.isArray(p.hashtags) && p.hashtags.map((tag: any, i: number) => (
                      <span key={i} className="text-[9px] md:text-[10px] font-black text-indigo-500 bg-indigo-950/20 px-3 py-1.5 md:px-4 md:py-2 rounded-[10px] md:rounded-xl border border-indigo-900/30 uppercase">#{tag.replace('#', '')}</span>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <p className="text-slate-500 text-xs md:text-sm italic">No nodes found in this archive.</p>
            )}

            {/* LISTIMI I OFERTAVE */}
            {offerList.length > 0 && (
              <div className="mt-10 md:mt-16 p-6 sm:p-10 md:p-12 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[30px] md:rounded-[45px] border border-indigo-500/20 shadow-2xl">
                <h3 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-6 md:mb-8 flex items-center gap-3">Exclusive Offers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {offerList.map((offer: any, index: number) => {
                    const offerText = typeof offer === 'string' ? offer : (offer.title + (offer.description ? ` - ${offer.description}` : ''));
                    return (
                      <div key={index} className="group relative bg-slate-900/60 p-4 sm:p-6 rounded-[20px] md:rounded-3xl border border-indigo-500/10 font-black text-xs md:text-sm text-indigo-200 flex justify-between items-center transition-all hover:bg-slate-800/80 gap-4">
                        <div className="flex items-start">
                          <span className="text-indigo-500 mr-2 mt-0.5">►</span>
                          <span className="leading-snug">{offerText}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(offerText, `offer-${index}`)} 
                          className="p-2 rounded-lg md:rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 hover:text-indigo-400 transition-all active:scale-90 shrink-0"
                        >
                          {copiedId === `offer-${index}` ? "✓" : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-slate-900/60 border-t border-slate-800/60 flex flex-col items-center gap-2 md:gap-3">
            <button onClick={scrollToTop} className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all border-b border-transparent hover:border-slate-500 pb-1">
                Return to Top ▲
            </button>
            <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] md:tracking-[0.5em] opacity-30 mt-1">End of AI Strategy - 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}