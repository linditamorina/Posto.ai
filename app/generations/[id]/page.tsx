"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

// NGARKIMI DINAMIK: Ky buton nuk do të ekzistojë në Server
const PdfButton = dynamic(() => import("../../components/PdfButton"), { 
  ssr: false,
  loading: () => <button className="bg-slate-200 text-slate-400 px-8 py-3 rounded-2xl text-xs font-black uppercase animate-pulse" disabled>Loading PDF Engine...</button>
});

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10">
           <button onClick={() => router.push('/')} className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              ← Dashboard
           </button>
           
           {/* BUTONI I PDF-IT TANI ËSHTË I SIGURT */}
           <PdfButton post={post} />
        </div>

        <header className="mb-12 border-b border-slate-200 pb-10">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase italic mb-4 leading-[0.9]">{post.business_name}</h1>
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">
            Content Strategy • {new Date(post.created_at).toLocaleDateString()}
          </p>
        </header>

        <div className="space-y-12 pb-20">
          {post.content?.posts?.map((item: any) => (
            <div key={item.id} className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100 relative group">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest">
                  Post {item.id}
                </div>
                <button 
                  onClick={() => handleCopy(item.caption, item.id)}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {copiedId === item.id ? "✓ Copied" : "Copy Content"}
                </button>
              </div>
              <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-tight leading-tight">{item.hook}</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium italic mb-8">"{item.caption}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}