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
  const [loading, setLoading] = useState(false);
  const [marketingPost, setMarketingPost] = useState<any>(null);
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kontrolli i madhësisë (Max 4MB për të shmangur 413 error)
      if (file.size > 4 * 1024 * 1024) {
        alert("Fotoja është shumë e madhe. Ju lutem zgjidhni një foto nën 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      // NDRYSHIMI KRYESOR: Thërrasim /api/generate nëse aty e ke route-in
      // Nëse e ke krijuar specifikisht app/api/vision/route.ts, sigurohu që emri i folderit është i saktë.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          selectedImage, 
          businessName, 
          location,
          industry: "General", // Default për vision
          numPosts: 1, 
          tone: "Friendly/Local",
          language: "sq" 
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Server Error:", errorData);
        throw new Error(`Gabim nga serveri: ${res.status}`);
      }

      const responseData = await res.json();
      
      // Përshtatja me strukturën e JSON që kthen Llama
      if (responseData.data && responseData.data.posts) {
        setMarketingPost(responseData.data.posts[0]);
      } else {
        throw new Error("Struktura e të dhënave nuk është e saktë.");
      }
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Analizimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
  if (!marketingPost || !user) return;
  setCreatePostLoading(true);
  try {
    const payload = {
      business_name: businessName || "AI Vision Business",
      content: { posts: [marketingPost] }, // Ruajmë postimin brenda array-it content
      user_id: user?.id,
      start_date: moment().format("YYYY-MM-DD"),
      location: location,
      reference_image: selectedImage,
      is_favorite: true,
    };

    const { error } = await supabase.from("posts").insert([payload]);

    if (error) throw error;

    // SHFAQ NJOFTIMIN
    setShowToast(true);
    
    // HIQE NJOFTIMIN PAS 3 SEKONDAVE
    setTimeout(() => setShowToast(false), 3000);

  } catch (err) {
    console.error(err);
    alert("Gabim gjatë ruajtjes.");
  } finally {
    setCreatePostLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-8">
          <div>
            <p className="text-pink-500 font-black text-[10px] uppercase tracking-[0.5em] mb-2 italic">IMAGE INTELLIGENCE</p>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Vision AI</h1>
          </div>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all cursor-pointer">🏠 Back</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-[30px] border border-slate-800 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 pl-1">Business Name</label>
                <input 
                  className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl outline-none focus:border-pink-500 text-sm font-bold transition-all" 
                  placeholder="Emri i biznesit..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 pl-1">Location (City)</label>
                <input 
                  className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl outline-none focus:border-pink-500 text-sm font-bold transition-all" 
                  placeholder="P.sh. Mitrovicë, Prishtinë..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`h-48 rounded-[30px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${selectedImage ? 'border-pink-500 bg-pink-500/5' : 'border-slate-800 hover:border-pink-500/50'}`}
              >
                {selectedImage ? (
                  <img src={selectedImage} className="h-full w-full object-cover rounded-[28px]" alt="Selected" />
                ) : (
                  <div className="text-center">
                    <span className="text-3xl block mb-2">📸</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload Reference Image</p>
                  </div>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
              </div>

              <button 
                onClick={analyzeImage}
                disabled={!selectedImage || loading}
                className="w-full py-5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-[20px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Analyzing..." : "Analyze with AI ✨"}
              </button>
            </div>
          </div>

          <div className="relative">
            {marketingPost ? (
              <div className="bg-white text-slate-900 p-8 rounded-[40px] shadow-[0_20px_60px_rgba(255,255,255,0.05)] space-y-6 animate-result">
                <div className="flex justify-between items-start">
                  <span className="bg-pink-100 text-pink-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic">AI Draft</span>
                  <span className="text-[10px] font-bold text-slate-400">📍 {location}</span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight leading-tight">{marketingPost.hook}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-600">{marketingPost.caption}</p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-2">Hashtags</p>
                    <p className="text-xs font-bold text-indigo-600">{marketingPost.hashtags}</p>
                  </div>
                </div>

                <button 
                  onClick={handleSavePost}
                  disabled={createPostLoading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all cursor-pointer shadow-lg"
                >
                  {createPostLoading ? "Saving..." : "Save to Vault 🔒"}
                </button>
              </div>
            ) : (
              <div className="h-full border-2 border-slate-900 border-dashed rounded-[40px] flex items-center justify-center p-12 text-center">
                <p className="text-slate-700 font-black uppercase tracking-widest text-xs leading-loose">
                  Waiting for analysis...<br/>Results will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-result { animation: slideUp 0.6s ease-out forwards; }
      `}</style>

      {/* TOAST NOTIFICATION */}
        {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center gap-3">
            <span>✅</span> U ruajt me sukses në Vault!
            </div>
        </div>
        )}
    </div>
  );
}