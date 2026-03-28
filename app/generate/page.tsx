"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import moment from 'moment';

export default function GeneratePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ 
    businessName: "", 
    industry: "", 
    location: "Mitrovicë",
    month: new Date().toLocaleString('sq-AL', { month: 'long' }),
    offers: "" 
  });
  
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("sq");
  const [maxGenerations, setMaxGenerations] = useState(5);

  const [dateRange, setDateRange] = useState({
    start: moment().format('YYYY-MM-DD'),
    end: moment().add(7, 'days').format('YYYY-MM-DD')
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const isFormReady = formData.businessName.trim() !== "" && formData.industry.trim() !== "";

  const tones = [
    { label: "Professional", icon: "💼" },
    { label: "Friendly/Local", icon: "🇽🇰" },
    { label: "Luxury", icon: "✨" },
    { label: "Sales", icon: "🚀" }
  ];

  const loadingMessages = [
    "Duke analizuar tregun...",
    "Duke përzgjedhur tonin...",
    "Duke analizuar foton tuaj...",
    "Gati për publikim..."
  ];

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
  if (!isFormReady) return;
  setLoading(true); 
  
  try {
    const payload = { 
      ...formData, 
      numPosts: maxGenerations, 
      tone, 
      language, 
      selectedImage, 
      startDate: dateRange.start, 
      endDate: dateRange.end 
    };

    console.log("Po dërgoj këto të dhëna në API:", payload);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // KËTU ËSHTË NDRYSHIMI KRYESOR PËR TË GJETUR GABIMIN
    if (!response.ok) {
      const errorText = await response.text(); // Kapim mesazhin e vërtetë nga serveri
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Serveri ktheu gabimin ${response.status}: ${errorText}`);
    }

    const aiResponse = await response.json();
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
          business_name: formData.businessName, 
          content: aiResponse.data, 
          user_id: user?.id,
          start_date: dateRange.start,
          end_date: dateRange.end,
          location: formData.location,
          reference_image: selectedImage
      }])
      .select();

    if (error) throw error;
    if (data) router.push(`/generations/${data[0].id}`);

  } catch (err: any) {
    console.error("Detajet e gabimit:", err);
    alert(`Gabim: ${err.message}`);
  } finally {
    setLoading(false); 
  }
};

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden p-12">
      
      {loading && (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8 shadow-[0_0_50px_rgba(79,70,229,0.3)]"></div>
          <p className="text-3xl font-black text-white animate-pulse tracking-tighter uppercase italic">{loadingMessages[loadingStep]}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex justify-between items-center border-b border-slate-800 pb-8 px-4">
          <div>
            <p className="text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] mb-2 italic">CREATION STUDIO</p>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white">Generate Posts</h2>
          </div>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 hover:-translate-y-1 transition-all cursor-pointer">🏠 Dashboard</button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* KOLONA 1: Detajet Bazë */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[35px] shadow-2xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 border-b border-slate-800 pb-4 mb-6">Informacionet e Biznesit</h3>
            
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase pl-1 mb-1.5 block">Business Name *</label>
              <input className="w-full bg-slate-800/50 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" placeholder="P.sh. Savory Cafe" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase pl-1 mb-1.5 block">Industry *</label>
              <input className="w-full bg-slate-800/50 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" placeholder="P.sh. Gastronomi" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase pl-1 mb-1.5 block">Location (City)</label>
              <input className="w-full bg-slate-800/50 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" placeholder="P.sh. Mitrovicë" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>

            <div className="p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-3xl space-y-3">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block pl-1">Schedule Range</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-indigo-500" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <input type="date" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-indigo-500" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
              </div>
            </div>
          </div>

          {/* KOLONA 2: Konfigurimi i AI */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[35px] shadow-2xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 border-b border-slate-800 pb-4 mb-6">Konfigurimi i Përmbajtjes</h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="group space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase pl-1 block">Language</label>
                <div className="flex gap-2">
                  <button onClick={() => setLanguage('sq')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${language === 'sq' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg hover:-translate-y-1' : 'bg-slate-800/40 border-slate-700/30 text-slate-500 hover:border-slate-600 hover:-translate-y-1'}`}>SQ 🇽🇰</button>
                  <button onClick={() => setLanguage('en')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${language === 'en' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg hover:-translate-y-1' : 'bg-slate-800/40 border-slate-700/30 text-slate-500 hover:border-slate-600 hover:-translate-y-1'}`}>EN 🇺🇸</button>
                </div>
              </div>

              <div className="group space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase block pl-1">Max Posts</label>
                  <input type="number" min="1" max="10" value={maxGenerations} onChange={(e) => setMaxGenerations(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full h-[46px] bg-slate-800/50 border-2 border-slate-700/30 px-4 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-white transition-all shadow-inner" />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase pl-1 block">Tone of Voice</label>
              <div className="grid grid-cols-2 gap-3">
                {tones.map((t) => (
                  <button key={t.label} onClick={() => setTone(t.label)} className={`py-4 rounded-xl text-[9px] font-black uppercase transition-all border-2 cursor-pointer hover:-translate-y-1 ${tone === t.label ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]" : "bg-slate-800/40 border-slate-700/30 text-slate-500 hover:border-slate-600"}`}>
                    <span className="text-lg block mb-1">{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase pl-1 block">Visual Reference (Opsionale)</label>
              <div onClick={() => fileInputRef.current?.click()} className={`relative h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-500 cursor-pointer ${selectedImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-indigo-500/30'}`}>
                {selectedImage ? <img src={selectedImage} alt="Reference" className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-2xl block mb-1">📸</span><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ngarko Foto</span></div>}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!isFormReady || loading} className={`w-full p-5 mt-4 rounded-2xl font-black uppercase text-[12px] tracking-[0.3em] transition-all duration-300 ${isFormReady && !loading ? "bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:-translate-y-1 active:scale-95 cursor-pointer" : "bg-slate-800 text-slate-600 cursor-not-allowed border-2 border-dashed border-slate-700"}`}>
              {loading ? "Gjenerimi po fillon..." : "Generate AI Posts ✨"}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}