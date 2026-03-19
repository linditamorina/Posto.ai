"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GenerationResult() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
      if (error) router.push('/');
      else setPost(data);
      setLoading(false);
    };
    if (id) fetchPost();
  }, [id, router]);

  const handleCopy = (text: string, postId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;

    // --- 1. HEADER DESIGN ---
    doc.setFillColor(79, 70, 229); // Indigo color
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Posto.ai", margin, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AI CONTENT STRATEGY PLAN", pageWidth - margin - 50, 25);

    // --- 2. BUSINESS INFO ---
    y = 55;
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(post.business_name.toUpperCase(), margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated on: ${new Date(post.created_at).toLocaleDateString()}`, margin, y);
    
    y += 15;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // --- 3. CONTENT LOOP ---
    post.content.posts.forEach((p: any, index: number) => {
      // Check for new page
      if (y > 240) {
        doc.addPage();
        y = 30;
      }

      // Post Card Header
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 12, 3, 3, "F");
      
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`STRATEGY #${p.id}`, margin + 5, y + 8);
      
      y += 22;

      // Hook
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(13);
      doc.text(p.hook, margin, y);
      
      y += 10;

      // Caption
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      const splitText = doc.splitTextToSize(`"${p.caption}"`, pageWidth - (margin * 2));
      doc.text(splitText, margin, y);
      
      y += (splitText.length * 6) + 10;

      // Hashtags
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const tags = p.hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ');
      doc.text(tags, margin, y);

      y += 20; // Space between posts
    });

    // --- 4. FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 282, pageWidth - margin, 282);
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("STRATEGIST: LINDITA MORINA", margin, 290);
      doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - margin - 20, 290);
    }

    doc.save(`Plan_${post.business_name.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-indigo-600 uppercase tracking-widest text-xs">Loading Strategy...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10">
           <button onClick={() => router.push('/')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-slate-900 transition-colors flex items-center gap-2">
              <span className="text-lg">←</span> Dashboard
           </button>
           <button 
             onClick={exportPDF} 
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
           >
             Download Professional PDF
           </button>
        </div>

        <header className="mb-12 border-b border-slate-200 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-1 w-12 bg-indigo-600"></span>
            <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em]">Official Output</p>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase italic mb-4 leading-[0.9]">{post.business_name}</h1>
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">
            Content Strategy & Social Media Planning • {new Date(post.created_at).toLocaleDateString()}
          </p>
        </header>

        <div className="space-y-12 pb-20">
          {post.content?.posts?.map((item: any) => (
            <div key={item.id} className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative group">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest">
                  Post {item.id}
                </div>
                <button 
                  onClick={() => handleCopy(item.caption, item.id)}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  {copiedId === item.id ? "✓ Copied to clipboard" : "Copy Content"}
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-tight leading-tight">{item.hook}</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium italic mb-8">"{item.caption}"</p>
              
              <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-3">
                {item.hashtags?.map((tag: string, i: number) => (
                  <span key={i} className="text-indigo-500 font-black text-xs lowercase bg-indigo-50 px-3 py-1 rounded-lg">#{tag.replace('#','')}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="text-center py-10 border-t border-slate-200">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Powered by Posto.ai Engine</p>
        </footer>
      </div>
    </div>
  );
}