"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import PdfButton from "../app/components/PdfButton";

const localizer = momentLocalizer(moment);

interface MyCalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  desc: string;
  business?: string;
  fullData?: any;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ name: string; count: number }[]>([]);
  const [usagePercent, setUsagePercent] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const VAULT_LIMIT = 50;

  const [selectedDayEvents, setSelectedDayEvents] = useState<MyCalendarEvent[] | null>(null);
  
  // State i ri per Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) fetchDashboardData();
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user) return;
    const { data: allPosts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !allPosts) return;

    setRecentPosts(allPosts.slice(0, 10));

    const daysMap: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = moment().subtract(i, 'days').format('ddd');
      daysMap[d] = 0;
    }
    allPosts.forEach(post => {
      const postDay = moment(post.created_at).format('ddd');
      if (daysMap[postDay] !== undefined) daysMap[postDay]++;
    });

    setChartData(Object.keys(daysMap).map(day => ({ name: day, count: daysMap[day] })));
    const count = allPosts.length;
    setTotalPosts(count);
    setUsagePercent(Math.round(Math.min((count / VAULT_LIMIT) * 100, 100)));
  };

  const toggleFavorite = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('posts').update({ is_favorite: !currentStatus }).eq('id', postId);
      if (!error) setRecentPosts(prev => prev.map(p => p.id === postId ? { ...p, is_favorite: !currentStatus } : p));
    } catch (err) { console.error(err); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    try {
      await supabase.from('posts').delete().eq('id', deleteTarget.id).eq('user_id', user.id);
      setDeleteTarget(null);
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const calendarEvents: MyCalendarEvent[] = [];
  
  recentPosts.forEach((batch) => {
    const startDate = batch.start_date ? moment(batch.start_date) : moment(batch.created_at);
    // Nëse nuk ka end_date, llogarisim si default 7 ditë (ose mund të ndryshojmë sipas dëshirës)
    const endDate = batch.end_date ? moment(batch.end_date) : moment(startDate).add(7, 'days');
    
    const diffDays = moment(endDate).diff(moment(startDate), 'days');
    const postsArray = batch.content?.posts || [];
    const totalPosts = postsArray.length;

    postsArray.forEach((post: any, index: number) => {
      let eventDate;

      if (diffDays > totalPosts && totalPosts > 0) {
        // FORMULA 2: Ndarja e ditëve në "blloqe" dhe caktimi i një date random brenda bllokut
        const step = Math.floor(diffDays / totalPosts);
        const randomOffsetInStep = Math.floor(Math.random() * step);
        const finalOffset = (index * step) + randomOffsetInStep;
        
        eventDate = moment(startDate).add(finalOffset, 'days').toDate();
      } else {
        // Rasti normal, njera pas tjetres nese koha eshte e vogel
        eventDate = moment(startDate).add(index, 'days').toDate();
      }

      calendarEvents.push({
        id: batch.id,
        title: post.hook || "Social Post",
        business: batch.business_name,
        start: eventDate,
        end: eventDate,
        allDay: true,
        desc: post.caption,
        fullData: batch
      });
    });
  });

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-indigo-500 font-black animate-pulse tracking-widest uppercase text-sm">VAULT LOADING...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
      
      {/* SIDEBAR */}
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
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="font-black text-[11px] text-white truncate uppercase tracking-tight">{user?.user_metadata?.display_name || "Lena"}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase truncate tracking-widest">{user.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-3">
            <button onClick={() => router.push('/generate')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-1">✨ Krijo Postime</button>
            <button onClick={() => router.push('/favorites')} className="w-full py-4 bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:text-white hover:-translate-y-1">★ Vault</button>
            <button onClick={() => router.push('/vision')} className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(124,58,237,0.3)] border border-white/10 flex items-center justify-center gap-3 group transition-all hover:-translate-y-1"><span className="text-sm group-hover:rotate-12 transition-transform">📸</span>Image to Text</button>
            <button onClick={() => router.push('/text-to-image')} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(245,158,11,0.3)] border border-white/10 flex items-center justify-center gap-3 group transition-all hover:-translate-y-1"><span className="text-sm group-hover:scale-125 transition-transform">🎨</span>Text to Image</button>
          </nav>
        </div>
        
        <div className="p-8 border-t border-slate-800/50 bg-slate-900/40 mt-auto">
          <button onClick={handleLogout} className="w-full py-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all italic flex items-center justify-center gap-2 cursor-pointer">Logout 👋</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
                <div className="text-indigo-400 text-[10px] font-black bg-indigo-950/30 px-5 py-2 rounded-full border border-indigo-900/50 animate-pulse">LIVE DATA</div>
              </div>
              <div className="flex-1 w-full pb-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={45}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="900" tick={{fill: '#475569'}} dy={12} />
                        <Tooltip cursor={{fill: '#1e293b', radius: 15}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[12, 12, 12, 12]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 rounded-[45px] shadow-2xl border border-indigo-500/20 text-white flex flex-col justify-between h-[380px]">
                <div>
                    <p className="text-[11px] font-black uppercase text-indigo-400 tracking-widest mb-2">Vault Capacity</p>
                    <p className="text-5xl font-black italic tracking-tighter text-white">{usagePercent}%</p>
                </div>
                <div className="h-2.5 bg-slate-800 w-full rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${usagePercent}%` }}></div>
                </div>
            </div>
          </section>

          {/* CALENDAR SECTION */}
          <section className="bg-slate-900/50 border border-slate-800/50 p-8 rounded-[40px] backdrop-blur-sm shadow-2xl overflow-hidden min-h-[650px] flex flex-col">
              <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Marketing Calendar</h3>
              </div>
              <div className="flex-1 min-h-[500px]">
                <Calendar<MyCalendarEvent, object>
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  date={calendarDate}
                  onNavigate={(newDate) => setCalendarDate(newDate)}
                  className="custom-calendar-style"
                  views={['month']}
                  onSelectEvent={(event) => router.push(`/generations/${event.id}`)}
                  onShowMore={(events) => setSelectedDayEvents(events as MyCalendarEvent[])}
                />
              </div>
          </section>

          {/* TABLE SECTION */}
          <section className="pt-6 pb-20">
             <div className="flex justify-between items-center mb-8 px-4">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 border-b-4 border-indigo-900/30 pb-2">Recent Intelligence</h3>
             </div>
             
             <div className="bg-slate-900/50 rounded-[40px] border border-slate-800/50 shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-5 p-7 bg-slate-900 border-b border-slate-800 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">
                  <div className="text-left pl-6">Client</div>
                  <div>Scheduled</div>
                  <div>Vault</div>
                  <div>Export</div>
                  <div className="text-right pr-12">Action</div>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="grid grid-cols-5 p-7 hover:bg-slate-800/40 transition-all items-center group text-center">
                      <div onClick={() => router.push(`/generations/${post.id}`)} className="font-black text-white text-lg text-left pl-6 truncate cursor-pointer tracking-tight">{post.business_name}</div>
                      <div className="text-xs font-bold text-indigo-400">{post.start_date ? moment(post.start_date).format('DD MMM') : '-'}</div>
                      <div className="flex justify-center">
                        <button onClick={() => toggleFavorite(post.id, post.is_favorite)} className={`text-3xl transition-all ${post.is_favorite ? 'text-indigo-500' : 'text-slate-700'}`}>
                          {post.is_favorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <PdfButton post={post} />
                      </div>
                      <div className="text-right pr-8">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({id: post.id, name: post.business_name});
                            }} 
                            className="bg-red-950/20 text-red-500 px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 border border-red-900/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          >
                            Delete ✕
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </section>
        </div>
      </main>

      {/* CALENDAR SHOW MORE MODAL */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSelectedDayEvents(null)}></div>
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[45px] shadow-3xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl">Daily Schedule</h3>
              <button onClick={() => setSelectedDayEvents(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-white font-black hover:bg-red-500 transition-all cursor-pointer">✕</button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-800/50">
                  {selectedDayEvents.map((ev, idx) => (
                    <tr key={idx} className="group hover:bg-slate-800/30">
                      <td className="p-4 font-black text-white italic">{ev.business}</td>
                      <td className="p-4 text-xs font-bold text-slate-400">{ev.title}</td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <PdfButton post={ev.fullData} />
                        <button onClick={() => router.push(`/generations/${ev.id}`)} className="bg-slate-800 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full hover:bg-indigo-600 transition-all cursor-pointer">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeleteTarget(null)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/20 rounded-[45px] shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl mb-2">Konfirmo Fshirjen</h3>
                <p className="text-slate-400 text-sm font-medium px-4">
                  A jeni të sigurt që dëshironi të fshini strategjinë për <span className="text-white font-black italic">"{deleteTarget.name}"</span>? Ky veprim nuk mund të kthehet mbrapa.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all cursor-pointer"
                >
                  Po, Fshije Përgjithmonë
                </button>
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-4 bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all cursor-pointer"
                >
                  Anulo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-calendar-style { color: #94a3b8; font-family: inherit; height: 100% !important; min-height: 500px; }
        .custom-calendar-style .rbc-month-view { border: 1px solid #1e293b; background: #0f172a; border-radius: 30px; overflow: hidden; }
        .custom-calendar-style .rbc-header { padding: 15px; font-weight: 900; text-transform: uppercase; font-size: 10px; color: #64748b; border-bottom: 2px solid #1e293b; }
        .custom-calendar-style .rbc-day-bg { border-left: 1px solid #1e293b; }
        .custom-calendar-style .rbc-today { background: rgba(79, 70, 229, 0.1); }
        .custom-calendar-style .rbc-event { background: #4f46e5; border-radius: 12px; font-weight: 800; font-size: 9px; text-transform: uppercase; border: none; padding: 5px 10px; margin-bottom: 2px; }
        .custom-calendar-style .rbc-show-more { background: #1e293b; color: #818cf8; font-weight: 900; font-size: 10px; border-radius: 8px; padding: 2px 8px; margin-top: 4px; display: inline-block; cursor: pointer; }
        .custom-calendar-style .rbc-toolbar button { color: white; border: 1px solid #334155; background: #1e293b; border-radius: 10px; font-weight: 800; text-transform: uppercase; font-size: 9px; padding: 8px 16px; margin: 0 4px; }
        .custom-calendar-style .rbc-toolbar button:hover { background: #4f46e5; cursor: pointer; }
        .custom-calendar-style .rbc-toolbar button.rbc-active { background: #4f46e5; border-color: #4f46e5; }
        .rbc-off-range-bg { background: #0a0f1d !important; }
      `}</style>
    </div>
  );
}