"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) fetchFavorites();
  }, [user, authLoading]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setFavorites(data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const removeFavorite = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_favorite: false })
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setFavorites(favorites.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center font-black text-slate-700 animate-pulse uppercase tracking-[0.3em] text-sm bg-slate-950">Vault Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 md:p-12 font-sans relative overflow-x-hidden">
      
      <div className="absolute top-0 right-0 p-20 md:p-40 opacity-[0.03] text-[30vw] md:text-[20vw] font-black uppercase italic -rotate-12 select-none text-cyan-400 pointer-events-none">FAV</div>

      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-6 md:pb-8 border-slate-900 z-10 relative gap-6">
          <div className="w-full sm:w-auto">
            <p className="text-cyan-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] mb-1.5 italic underline decoration-2 underline-offset-8 decoration-cyan-900">Vault Security</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              <span className="bg-slate-900 text-cyan-500 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full not-italic text-xl md:text-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]">★</span> 
              Favorite Archives
            </h2>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="w-full sm:w-auto flex justify-center items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900 text-slate-500 border-2 border-slate-800 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-950/20 hover:border-cyan-600 hover:text-cyan-500 transition-all active:scale-95"
          >
            ← Back to Dashboard
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
          {favorites.map((post) => (
            <div 
              key={post.id} 
              onClick={() => router.push(`/generations/${post.id}`)}
              className="bg-slate-900 border-2 border-slate-800 p-6 md:p-8 rounded-[25px] md:rounded-[35px] cursor-pointer group relative overflow-hidden transition-all duration-500 shadow-[0_15px_45px_-10px_rgba(15,23,42,0.8),_0_5px_15px_-5px_rgba(34,211,238,0.15)] hover:shadow-[0_25px_55px_-10px_rgba(15,23,42,1),_0_10px_25px_-5px_rgba(34,211,238,0.3)] hover:-translate-y-2"
            >
              <div className="absolute top-0 right-0 p-4 md:p-5 opacity-[0.05] text-4xl md:text-5xl font-black uppercase italic -rotate-12 text-white pointer-events-none">READY</div>

              <div className="flex justify-between items-start mb-5 md:mb-6">
                <span className="text-[9px] md:text-[10px] font-black bg-slate-800 text-cyan-400 px-3 md:px-4 py-1.5 md:py-2 rounded-full uppercase tracking-tighter shadow-inner">Favorite Item</span>
                <button 
                  onClick={(e) => removeFavorite(e, post.id)}
                  className="text-cyan-500 text-2xl md:text-3xl hover:scale-125 transition-transform drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                >
                  ★
                </button>
              </div>
              
              <div className="space-y-1 md:space-y-2 mb-5 md:mb-6 border-l-4 border-slate-800 pl-4">
                 <h3 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight truncate">{post.business_name}</h3>
                 <p className="text-slate-500 text-[9px] md:text-[11px] font-bold uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="text-[9px] md:text-[10px] bg-slate-800 text-slate-400 p-3 md:p-4 rounded-xl font-bold line-clamp-2 italic shadow-inner">
                {(() => {
                  let raw = post.content;
                  if (typeof raw === "string") {
                    try { raw = JSON.parse(raw); } catch (e) { raw = null; }
                  }
                  const postsList = raw?.posts || raw?.data?.posts || (Array.isArray(raw) ? raw : []);
                  return postsList[0]?.caption || postsList[0]?.content || postsList[0]?.hook || "No Preview Available";
                })()}
              </div>
              
              <div className="mt-6 md:mt-8 flex justify-between items-center border-t pt-4 md:pt-5 border-slate-800">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-cyan-500 transition-colors">Stored Plan</p>
                <div className="text-cyan-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  View full plan →
                </div>
              </div>
            </div>
          ))}

          {favorites.length === 0 && (
            <div className="col-span-full p-12 md:p-24 text-center bg-slate-900 rounded-[25px] md:rounded-[35px] border-2 border-dashed border-slate-800 shadow-xl shadow-slate-950/20">
              <p className="text-slate-600 font-black uppercase italic tracking-[0.2em] text-xs md:text-sm">
                Your secure vault is empty. Mark some generations as favorites in the Dashboard!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}