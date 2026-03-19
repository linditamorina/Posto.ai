"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ businessName: "", industry: "", location: "", numPosts: "10" });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const loadingMessages = [
    "Analyzing your industry trends...",
    "Crafting high-conversion hooks...",
    "Integrating local market insights...",
    "Saving to your secure vault..."
  ];

  const chartData = [
    { name: 'Mon', count: 4 }, { name: 'Tue', count: 9 }, { name: 'Wed', count: 6 },
    { name: 'Thu', count: 15 }, { name: 'Fri', count: 11 },
  ];

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) fetchRecentPosts();
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

  const fetchRecentPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setRecentPosts(data);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this generation permanently?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) setRecentPosts(recentPosts.filter(p => p.id !== id));
  };

  const handleGenerate = async () => {
    const num = parseInt(formData.numPosts);
    if (!formData.businessName) return alert("Please enter business name");
    if (num > 10) return alert("Max limit is 10 posts");

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const aiResponse = await response.json();
      const { data, error } = await supabase
        .from('posts')
        .insert([{ business_name: formData.businessName, content: aiResponse.data }])
        .select();

      if (error) throw error;
      router.push(`/generations/${data[0].id}`);
    } catch (err) {
      alert("Error generating content.");
      setLoading(false);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse uppercase tracking-[0.3em]">System Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans relative">
      
      {loading && (
        <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="flex space-x-2 mb-8">
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-5 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-5 h-5 bg-indigo-200 rounded-full animate-bounce"></div>
          </div>
          <p className="text-3xl font-black text-slate-900 animate-pulse tracking-tighter uppercase italic underline decoration-indigo-500 underline-offset-8">
            {loadingMessages[loadingStep]}
          </p>
        </div>
      )}

      <aside className="w-[320px] bg-white border-r p-8 flex flex-col shadow-sm">
        <h1 className="text-2xl font-black text-indigo-600 uppercase italic mb-10 tracking-tighter">Posto.ai</h1>
        
        {/* EMRI DINAMIK KETU */}
        <div className="mb-10 p-6 bg-indigo-50 rounded-[30px] border border-indigo-100 shadow-inner">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Authenticated As</p>
          <p className="font-black text-slate-800 truncate text-lg tracking-tight">
            {user?.user_metadata?.display_name || "User"}
          </p>
          <p className="text-slate-400 truncate text-[10px] font-bold uppercase">{user.email}</p>
        </div>

        <div className="space-y-4 flex-1">
          <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 text-sm font-bold" placeholder="Business Name" onChange={e => setFormData({...formData, businessName: e.target.value})} />
          <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 text-sm font-bold" placeholder="Industry" onChange={e => setFormData({...formData, industry: e.target.value})} />
          <div className="px-2">
             <label className="text-[10px] font-black text-slate-400 uppercase">Posts Count (Max 10)</label>
             <input type="number" min="1" max="10" value={formData.numPosts} className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 text-sm font-bold mt-1" onChange={e => setFormData({...formData, numPosts: e.target.value})} />
          </div>
          <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all uppercase text-xs tracking-widest mt-2">Generate Plan</button>
        </div>
        
        <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black text-red-400 uppercase tracking-widest pt-6 border-t mt-4 hover:text-red-600 transition-colors text-center">Sign Out</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-black tracking-tighter mb-12 uppercase italic underline decoration-slate-100 underline-offset-8">Activity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="md:col-span-2 bg-slate-50 p-8 rounded-[40px] border border-slate-100 h-[320px]">
              <h3 className="font-black text-slate-400 mb-6 uppercase text-[10px] tracking-[0.3em]">Usage Metrics</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{fill: '#94a3b8'}} dy={10} /><Tooltip cursor={{fill: '#fff'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} /><Bar dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={35} /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white flex flex-col justify-center text-center">
               <h3 className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest mb-2">Account Type</h3>
               <p className="text-4xl font-black mb-2 uppercase italic tracking-tighter">Standard</p>
               <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-4">10 Posts/Gen Limit</p>
            </div>
          </div>

          <section>
             <h3 className="text-xl font-black mb-8 italic uppercase tracking-widest border-l-4 border-indigo-600 pl-4">History</h3>
             <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-4 p-6 bg-slate-50/50 border-b font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  <div>Business</div><div>Created At</div><div>Status</div><div>Action</div>
                </div>
                {recentPosts.map((post) => (
                  <div key={post.id} onClick={() => router.push(`/generations/${post.id}`)} className="grid grid-cols-4 p-6 border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-all items-center">
                    <div className="font-black text-slate-800 tracking-tight">{post.business_name}</div>
                    <div className="text-[11px] font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</div>
                    <div><span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase">Stored</span></div>
                    <button onClick={(e) => handleDelete(e, post.id)} className="text-[10px] font-black text-red-300 hover:text-red-600 uppercase tracking-widest transition-colors">Delete</button>
                  </div>
                ))}
                {recentPosts.length === 0 && <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">No generations found yet.</div>}
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}