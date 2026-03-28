"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface MyCalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  desc: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const chartData = [
    { name: 'Mon', count: 4 }, { name: 'Tue', count: 9 }, { name: 'Wed', count: 6 },
    { name: 'Thu', count: 15 }, { name: 'Fri', count: 11 }, { name: 'Sat', count: 3 }, { name: 'Sun', count: 8 },
  ];

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) fetchRecentPosts();
  }, [user, authLoading]);

  const fetchRecentPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecentPosts(data);
  };

  const toggleFavorite = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('posts').update({ is_favorite: !currentStatus }).eq('id', postId);
      if (!error) setRecentPosts(prev => prev.map(p => p.id === postId ? { ...p, is_favorite: !currentStatus } : p));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("A dëshironi ta fshini këtë gjenerim përgjithmonë?")) return;
    try {
      await supabase.from('posts').delete().eq('id', id).eq('user_id', user?.id);
      setRecentPosts(prevPosts => prevPosts.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const calendarEvents: MyCalendarEvent[] = [];
  recentPosts.forEach((batch) => {
    const baseDate = batch.start_date ? moment(batch.start_date) : moment(batch.created_at);
    batch.content?.posts?.forEach((post: any, index: number) => {
      const eventDate = moment(baseDate).add(index, 'days').toDate();
      calendarEvents.push({
        id: `${batch.id}-${index}`,
        title: `${batch.business_name}: ${post.hook || "Social Post"}`,
        start: eventDate,
        end: eventDate,
        allDay: true,
        desc: post.caption
      });
    });
  });

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-indigo-500 font-black animate-pulse tracking-widest uppercase text-sm">VAULT LOADING...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
      
      {/* SIDEBAR E PASTËR - Vetëm Navigim dhe Profil */}
      <aside className="w-[320px] bg-slate-900/50 border-r border-slate-800/50 flex flex-col shadow-[25px_0_50px_rgba(0,0,0,0.4)] shrink-0 h-full z-20 backdrop-blur-md">
        <div className="p-8 border-b border-slate-800/50 bg-slate-900/30 text-center">
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center justify-center gap-2">
            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-xl not-italic text-xs shadow-[0_0_20px_rgba(79,70,229,0.5)]">P.ai</span> 
            Posto.ai
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar flex flex-col">
          <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-3xl border border-slate-700/50 shadow-inner">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm">
              {user?.user_metadata?.display_name?.charAt(0) || "U"}
            </div>
            <div className="truncate">
              <p className="font-black text-[11px] text-white truncate uppercase tracking-tight">{user?.user_metadata?.display_name || "Admin"}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase truncate tracking-widest">{user.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-3">
            {/* <button onClick={() => router.push('/')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:cursor-pointer transition-all hover:-translate-y-1">📊 Dashboard</button> */}
            <button onClick={() => router.push('/generate')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(5,150,105,0.3)] hover:cursor-pointer transition-all hover:-translate-y-1">✨ Krijo Postime</button>
            <button onClick={() => router.push('/favorites')} className="w-full py-4 bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:cursor-pointer transition-all hover:text-white hover:-translate-y-1">★ Vault</button>
            <button onClick={() => router.push('/vision')} className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_30px_rgba(124,58,237,0.5)] border border-white/10 flex items-center justify-center gap-3 group transition-all hover:-translate-y-1 hover:cursor-pointer"><span className="text-sm group-hover:rotate-12 transition-transform">📸</span>Image to Text</button>
          </nav>
        </div>
        
        <div className="p-8 border-t border-slate-800/50 bg-slate-900/40 mt-auto">
          <button onClick={handleLogout} className="w-full py-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all italic flex items-center justify-center gap-2 cursor-pointer">Logout 👋</button>
        </div>
      </aside>

      {/* MAIN CONTENT (Mbetet i pandryshuar, por i pastruar nga variablat e formës) */}
      <main className="flex-1 overflow-y-auto p-12 bg-slate-950 h-full relative z-10 no-scrollbar">
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="flex justify-between items-end border-b border-slate-800/50 pb-8">
              <div>
                <p className="text-indigo-500 font-black text-[11px] uppercase tracking-[0.5em] mb-2 italic underline decoration-2 underline-offset-8 decoration-indigo-900">SYSTEM OVERVIEW</p>
                <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white">Dashboard</h2>
              </div>
          </header>
          
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-slate-900/50 border border-slate-800/50 p-10 rounded-[45px] shadow-2xl flex flex-col h-[380px] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="font-black text-white text-base uppercase tracking-wider">Activity Metrics</h3>
                <div className="text-indigo-400 text-[10px] font-black bg-indigo-950/30 px-5 py-2 rounded-full border border-indigo-900/50">LIVE DATA</div>
              </div>
              <div className="flex-1 w-full pb-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={45}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="900" tick={{fill: '#475569'}} dy={12} />
                        <Tooltip cursor={{fill: '#1e293b', radius: 15}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px', color: '#fff'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[12, 12, 12, 12]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 rounded-[45px] shadow-2xl border border-indigo-500/20 text-white flex flex-col justify-between h-[380px]">
                <div>
                    <p className="text-[11px] font-black uppercase text-indigo-400 tracking-widest mb-2">Vault Capacity</p>
                    <p className="text-5xl font-black italic tracking-tighter text-white">Standard</p>
                </div>
                <div className="space-y-4">
                  <div className="h-2.5 bg-slate-800 w-full rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-500 w-[70%] rounded-full shadow-[0_0_20px_#4f46e5]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic opacity-50">
                    <span>Usage</span>
                    <span>70% Full</span>
                  </div>
                </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800/50 p-8 rounded-[40px] backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Marketing Calendar</h3>
              </div>
              <div className="h-[550px]">
                <Calendar<MyCalendarEvent, object>
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  date={calendarDate}
                  onNavigate={(newDate) => setCalendarDate(newDate)}
                  className="custom-calendar-style"
                  views={['month', 'week']}
                  onSelectEvent={(event) => alert(`${event.title}\n\n${event.desc}`)}
                />
              </div>
          </section>

          <section className="pt-6">
             <div className="flex justify-between items-center mb-8 px-4">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 border-b-4 border-indigo-900/30 pb-2">Recent Intelligence</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{recentPosts.length} nodes saved</span>
             </div>
             
             <div className="bg-slate-900/50 rounded-[40px] border border-slate-800/50 shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-4 p-7 bg-slate-900 border-b border-slate-800 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">
                  <div className="text-left pl-6">Client / Business</div>
                  <div>Scheduled</div>
                  <div>Vault</div>
                  <div className="text-right pr-12">Operations</div>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {recentPosts.map((post) => (
                    <div key={post.id} onClick={() => router.push(`/generations/${post.id}`)} className="grid grid-cols-4 p-7 hover:bg-slate-800/40 cursor-pointer transition-all items-center group text-center">
                      <div className="font-black text-white text-lg text-left pl-6 truncate tracking-tight">{post.business_name}</div>
                      <div className="text-xs font-bold text-indigo-400">{post.start_date ? moment(post.start_date).format('DD MMM') : '-'}</div>
                      <div className="flex justify-center">
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(post.id, post.is_favorite); }} className={`text-3xl transition-all duration-300 transform active:scale-150 ${post.is_favorite ? 'text-indigo-500 drop-shadow-[0_0_10px_rgba(79,70,229,0.8)]' : 'text-slate-700 hover:text-slate-400'}`}>
                          {post.is_favorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div className="text-right pr-8">
                          <button onClick={(e) => handleDelete(e, post.id)} className="bg-red-950/20 text-red-500 px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase transition-all opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white border border-red-900/30 shadow-lg">Delete ✕</button>
                      </div>
                    </div>
                  ))}
                  {recentPosts.length === 0 && <div className="p-24 text-center text-slate-600 font-black uppercase tracking-widest italic text-sm">Vault is empty.</div>}
                </div>
             </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .custom-calendar-style { color: #94a3b8; font-family: inherit; }
        .custom-calendar-style .rbc-month-view { border: 1px solid #1e293b; background: #0f172a; border-radius: 30px; }
        .custom-calendar-style .rbc-day-bg { background: transparent; border-left: 1px solid #1e293b; }
        .custom-calendar-style .rbc-off-range-bg { background: #020617; opacity: 0.3; }
        .custom-calendar-style .rbc-header { padding: 15px; font-weight: 900; text-transform: uppercase; font-size: 10px; color: #64748b; border-bottom: 2px solid #1e293b; }
        .custom-calendar-style .rbc-today { background: #1e293b; }
        .custom-calendar-style .rbc-event { background: #4f46e5; border-radius: 12px; font-weight: 800; font-size: 9px; text-transform: uppercase; border: none; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); padding: 5px 10px; }
        .custom-calendar-style .rbc-toolbar button { color: white; border: 1px solid #334155; background: #1e293b; border-radius: 10px; font-weight: 800; text-transform: uppercase; font-size: 9px; padding: 8px 16px; transition: all 0.2s; }
        .custom-calendar-style .rbc-toolbar button:hover { background: #4f46e5; border-color: #4f46e5; cursor: pointer; }
        .custom-calendar-style .rbc-toolbar button.rbc-active { background: #4f46e5; box-shadow: 0 0 15px rgba(79,70,229,0.4); }
        .custom-calendar-style .rbc-month-row { border-top: 1px solid #1e293b; }
      `}</style>
    </div>
  );
}