"use client";
import { useState } from "react";
import { jsPDF } from "jspdf";

export default function Dashboard() {
  const [formData, setFormData] = useState({
    businessName: "", industry: "", location: "", tone: "Miqësor & Lokal", 
    month: "Mars 2026", numPosts: "15", offers: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Kontrolli për limitin e postimeve
  const isOverLimit = parseInt(formData.numPosts) > 15;

  const handleGenerate = async () => {
    if (!formData.businessName || isOverLimit) return;

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      alert("Gabim gjatë lidhjes me AI.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("U kopjua!");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(`Posto.ai: ${formData.businessName}`, 10, 20);
    
    let y = 40;
    result.posts.forEach((post: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Postimi ${post.id}: ${post.hook}`, 10, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(post.caption, 180);
      doc.text(splitText, 10, y);
      y += (splitText.length * 7) + 10;
    });
    doc.save(`Plani_${formData.businessName}.pdf`);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[380px] bg-white border-r border-slate-200 p-8 flex flex-col shadow-xl z-20 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tighter uppercase">Posto.ai</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1 italic underline decoration-indigo-200">BASIC PLAN</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <input className="w-full border p-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Emri i Biznesit" onChange={e => setFormData({...formData, businessName: e.target.value})} />
            <input className="w-full border p-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Industria" onChange={e => setFormData({...formData, industry: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className="w-full border p-4 rounded-2xl bg-slate-50 outline-none" placeholder="Qyteti" onChange={e => setFormData({...formData, location: e.target.value})} />
            <div>
              <input 
                type="number" 
                min="1" 
                max="15" 
                value={formData.numPosts} 
                className={`w-full border p-4 rounded-2xl bg-slate-50 outline-none transition-all ${isOverLimit ? 'border-red-500 ring-2 ring-red-100' : ''}`} 
                onChange={e => setFormData({...formData, numPosts: e.target.value})} 
              />
              {isOverLimit && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1 uppercase">Max limit: 15 postime</p>}
            </div>
          </div>

          <textarea className="w-full border p-4 rounded-2xl bg-slate-50 h-24 text-sm outline-none" placeholder="Ofertat tuaja (opsionale)..." onChange={e => setFormData({...formData, offers: e.target.value})} />

          <button 
            onClick={handleGenerate} 
            disabled={loading || isOverLimit} 
            className={`w-full py-5 rounded-2xl font-black text-white shadow-lg transition-all ${loading || isOverLimit ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-slate-900'}`}
          >
            {loading ? "DUKE PUNUAR..." : "GJENERO PËRMBAJTJEN"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-12 bg-white relative">
        {result && (
          <div className="absolute top-8 right-12">
            <button onClick={exportPDF} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors">
              EXPORT PDF
            </button>
          </div>
        )}

        {!result ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <h2 className="text-xl font-bold italic tracking-tighter">Gati për të gjeneruar 1-15 postime?</h2>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto pb-20">
            <h2 className="text-3xl font-black mb-12 tracking-tight">REZULTATET E GJENERUARA ✨</h2>
            
            <div className="space-y-10">
              {result.posts?.map((post: any) => (
                <article key={post.id} className="group border-b border-slate-100 pb-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full uppercase italic">Postimi {post.id}</span>
                    <button onClick={() => copyToClipboard(post.caption)} className="text-[10px] font-bold text-slate-300 hover:text-indigo-600 uppercase transition-colors">Copy Caption</button>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">{post.hook}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">"{post.caption}"</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.hashtags?.map((tag: string, i: number) => (
                      <span key={i} className="text-indigo-400 text-xs font-bold">#{tag.replace('#','')}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}