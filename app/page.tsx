"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import PdfButton from "../app/components/PdfButton";
import HowToModal from "./components/HowToModal";

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

const CustomMonthEvent = ({ event }: { event: MyCalendarEvent }) => {
  return (
    <div className="flex items-center w-full h-full px-2 py-0.5">
      <span className="truncate text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-indigo-200">{event.title}</span>
    </div>
  );
};

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
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      setSelectedDayEvents(null);
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const calendarEvents = useMemo(() => {
    const events: MyCalendarEvent[] = [];
    recentPosts.forEach((batch) => {
      const startDate = batch.start_date ? moment(batch.start_date) : moment(batch.created_at);
      const postsArray = batch.content?.posts || [];

      postsArray.forEach((post: any, index: number) => {
        const eventDate = moment(startDate).add(index, 'days').toDate();
        events.push({
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
    return events;
  }, [recentPosts]);

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-indigo-500 font-black animate-pulse tracking-widest uppercase text-sm">VAULT LOADING...</div>;
  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
      
      {/* Butoni i Help-it */}
      <button 
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center hover:border-indigo-500 transition-all group shadow-xl z-50"
      >
        <span className="text-indigo-400 group-hover:text-white font-black italic">?</span>
      </button>

      <HowToModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* --- MOBILE HEADER (Fixed Top) --- */}
      <div className="md:hidden flex items-center justify-between p-5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-[60] shrink-0">
        <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg not-italic text-[10px] shadow-[0_0_15px_rgba(79,70,229,0.5)]">P.ai</span> 
          Posto.ai
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-indigo-400 transition-colors p-2 text-2xl">
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`fixed md:relative z-[80] top-0 left-0 h-full w-[280px] md:w-[320px] bg-slate-900 md:bg-slate-900/50 border-r border-slate-800/50 flex flex-col shadow-[25px_0_50px_rgba(0,0,0,0.4)] shrink-0 transition-transform duration-300 backdrop-blur-xl md:backdrop-blur-md ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Sidebar Header */}
        <div className="p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/30 flex justify-between items-center shrink-0">
          <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center justify-center gap-2">
            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-xl not-italic text-xs shadow-[0_0_20px_rgba(79,70,229,0.5)]">P.ai</span> 
            Posto.ai
          </h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2">✕</button>
        </div>
        
        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar flex flex-col">
          {/* User Profile */}
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-800/40 rounded-[20px] border border-slate-700/50 shadow-inner">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xs md:text-sm shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="font-black text-[10px] md:text-[11px] text-white truncate uppercase tracking-tight">{user?.user_metadata?.display_name || "User"}</p>
              <p className="text-[8px] md:text-[9px] text-indigo-400 font-black uppercase truncate tracking-widest">{user.email}</p>
            </div>
          </div>

          {/* Nav Buttons */}
          <nav className="flex flex-col gap-2.5">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 mb-1">Navigation</p>
            <button onClick={() => { router.push('/generate'); setIsMobileMenuOpen(false); }} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:-translate-y-1">✨ CREATE POSTS</button>
            <button onClick={() => { router.push('/favorites'); setIsMobileMenuOpen(false); }} className="w-full py-3.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:text-white">★ VAULT</button>
            
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 mt-4 mb-1">AI Intelligence</p>
            <button onClick={() => { router.push('/vision'); setIsMobileMenuOpen(false); }} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all">📸 IMAGE TO TEXT</button>
            <button onClick={() => { router.push('/text-to-image'); setIsMobileMenuOpen(false); }} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all">🎨 TEXT TO IMAGE</button>
          </nav>

          {/* Logout Section - Locked to bottom of scroll area */}
          <div className="pt-6 mt-auto">
            <button onClick={handleLogout} className="w-full py-3.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all italic flex items-center justify-center gap-2">LOGOUT 👋</button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-slate-950 h-full w-full relative z-10 no-scrollbar pt-24 md:pt-12">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800/50 pb-6 md:pb-8 gap-4">
              <div>
                <p className="text-indigo-500 font-black text-[9px] md:text-[11px] uppercase tracking-[0.5em] mb-1 md:mb-2 italic underline decoration-2 underline-offset-8 decoration-indigo-900">SYSTEM OVERVIEW</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white">Dashboard</h2>
              </div>
          </header>
          
          {/* Metrics Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 p-6 md:p-10 rounded-[30px] md:rounded-[45px] shadow-2xl flex flex-col h-[300px] md:h-[380px] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
                <h3 className="font-black text-white text-sm md:text-base uppercase tracking-wider">Activity Metrics</h3>
                <div className="text-indigo-400 text-[8px] md:text-[10px] font-black bg-indigo-950/30 px-3 md:px-5 py-1.5 md:py-2 rounded-full border border-indigo-900/50 animate-pulse">LIVE DATA</div>
              </div>
              <div className="flex-1 w-full pb-6 md:pb-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={isMobile ? 20 : 45}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={isMobile ? 9 : 11} fontWeight="900" tick={{fill: '#475569'}} dy={12} />
                        <Tooltip cursor={{fill: '#1e293b', radius: 15}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[12, 12, 12, 12]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 md:p-10 rounded-[30px] md:rounded-[45px] shadow-2xl border border-indigo-500/20 text-white flex flex-col justify-between h-[200px] md:h-[380px]">
                <div>
                    <p className="text-[9px] md:text-[11px] font-black uppercase text-indigo-400 tracking-widest mb-1 md:mb-2">Vault Capacity</p>
                    <p className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">{usagePercent}%</p>
                </div>
                <div className="h-2 md:h-2.5 bg-slate-800 w-full rounded-full overflow-hidden shadow-inner mt-6 md:mt-0">
                    <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${usagePercent}%` }}></div>
                </div>
            </div>
          </section>

          {/* Calendar Section */}
          <section className="bg-slate-900/50 border border-slate-800/50 p-4 sm:p-6 md:p-8 rounded-[30px] md:rounded-[40px] backdrop-blur-sm shadow-2xl overflow-hidden min-h-[500px] md:min-h-[650px] flex flex-col">
            <div className="flex justify-between items-center mb-4 md:mb-6 px-2 shrink-0">
              <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-slate-500">
                MARKETING CALENDAR
              </h3>
            </div>
            <div className="flex-1 min-h-[400px] md:min-h-[500px]">
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
                components={{
                  event: CustomMonthEvent,
                }}
                messages={{
                  showMore: (total) => `+${total} Posts`,
                }}
                popup={false}
              />
            </div>
        </section>

          {/* Recent Intelligence List */}
          <section className="pt-4 md:pt-6 pb-10 md:pb-20">
              <div className="flex justify-between items-center mb-6 md:mb-8 px-2 md:px-4">
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-slate-500 border-b-2 md:border-b-4 border-indigo-900/30 pb-2">Recent Intelligence</h3>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block bg-slate-900/50 rounded-[40px] border border-slate-800/50 shadow-2xl overflow-hidden backdrop-blur-sm">
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
                              <div onClick={() => router.push(`/generations/${post.id}`)} className="font-black text-white text-lg text-left pl-6 truncate cursor-pointer tracking-tight underline decoration-indigo-500/0 hover:decoration-indigo-500 transition-all">{post.business_name}</div>
                              <div className="text-xs font-bold text-indigo-400">{post.start_date ? moment(post.start_date).format('DD MMM') : '-'}</div>
                              <div className="flex justify-center">
                                  <button onClick={() => toggleFavorite(post.id, post.is_favorite)} className={`text-3xl transition-all hover:scale-125 ${post.is_favorite ? 'text-indigo-500' : 'text-slate-700'}`}>
                                      {post.is_favorite ? '★' : '☆'}
                                  </button>
                              </div>
                              <div className="flex justify-center scale-90 group-hover:scale-100 transition-transform">
                                  <PdfButton post={post} />
                              </div>
                              <div className="text-right pr-8">
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: post.id, name: post.business_name}); }} className="bg-red-950/20 text-red-500 px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 border border-red-900/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer">Delete ✕</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                  {recentPosts.map((post) => (
                      <div key={post.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-[25px] space-y-4 shadow-xl">
                          <div className="flex justify-between items-start">
                              <div onClick={() => router.push(`/generations/${post.id}`)}>
                                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Client</p>
                                  <h4 className="text-xl font-black text-white italic tracking-tighter">{post.business_name}</h4>
                              </div>
                              <button onClick={() => toggleFavorite(post.id, post.is_favorite)} className={`text-2xl ${post.is_favorite ? 'text-indigo-500' : 'text-slate-700'}`}>
                                  {post.is_favorite ? '★' : '☆'}
                              </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                              <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Scheduled</p>
                                  <p className="text-xs font-bold text-slate-300">{post.start_date ? moment(post.start_date).format('DD MMM, YYYY') : 'Not Set'}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1 text-right">Documents</p>
                                  <PdfButton post={post} />
                              </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                              <button onClick={() => router.push(`/generations/${post.id}`)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">View Details</button>
                              <button onClick={() => setDeleteTarget({id: post.id, name: post.business_name})} className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all">✕</button>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
        </div>
      </main>

      {/* --- DAILY SCHEDULE MODAL --- */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedDayEvents(null)}></div>
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[30px] md:rounded-[45px] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-xl md:text-2xl">Daily Schedule</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">
                  {moment(selectedDayEvents[0]?.start).format('DD MMMM YYYY')}
                </p>
              </div>
              <button onClick={() => setSelectedDayEvents(null)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-red-500 transition-all cursor-pointer">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
              <div className="hidden md:block">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead className="text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-2">Client</th>
                      <th className="px-6 py-2">Hook/Title</th>
                      <th className="px-6 py-2 text-center">PDF</th>
                      <th className="px-6 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayEvents.map((ev, idx) => (
                      <tr key={idx} className="bg-slate-800/20 hover:bg-slate-800/50 transition-all">
                        <td className="px-6 py-4 rounded-l-2xl font-black text-white italic">{ev.business}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400 max-w-[200px] truncate">{ev.title}</td>
                        <td className="px-6 py-4"><div className="flex justify-center scale-90"><PdfButton post={ev.fullData} /></div></td>
                        <td className="px-6 py-4 text-right rounded-r-2xl">
                          <button onClick={() => router.push(`/generations/${ev.id}`)} className="bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full hover:bg-indigo-500 transition-all">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {selectedDayEvents.map((ev, idx) => (
                  <div key={idx} className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-[25px] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Client</p>
                        <h4 className="text-lg font-black text-white italic tracking-tighter">{ev.business}</h4>
                      </div>
                      <div className="scale-90"><PdfButton post={ev.fullData} /></div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Hook</p>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed line-clamp-2">{ev.title}</p>
                    </div>
                    <button onClick={() => router.push(`/generations/${ev.id}`)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Open Post</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeleteTarget(null)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/20 rounded-[30px] md:rounded-[45px] shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-10 text-center space-y-4 md:space-y-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <span className="text-2xl md:text-3xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-xl md:text-2xl mb-2">Confirm Delete</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium px-2 md:px-4">
                  Are you sure you want to delete the strategy for <span className="text-white font-black italic">"{deleteTarget.name}"</span>?
                </p>
              </div>
              <div className="flex flex-col gap-2 md:gap-3 pt-4">
                <button onClick={confirmDelete} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all cursor-pointer">Yes, Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="w-full py-3 md:py-4 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GLOBAL STYLES --- */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-calendar-style { color: #94a3b8; font-family: inherit; height: 100% !important; min-height: 500px; }
        .custom-calendar-style .rbc-month-view { border: 1px solid #1e293b; background: #0f172a; border-radius: 20px; overflow: hidden; }
        .custom-calendar-style .rbc-header { padding: 10px; font-weight: 900; text-transform: uppercase; font-size: 10px; color: #64748b; border-bottom: 1px solid #1e293b; }
        .custom-calendar-style .rbc-day-bg { border-left: 1px solid #1e293b; }
        .custom-calendar-style .rbc-month-row { border-top: 1px solid #1e293b; }
        .custom-calendar-style .rbc-today { background: rgba(79, 70, 229, 0.15) !important; }
        .rbc-off-range-bg { background: #070b14 !important; }

        .custom-calendar-style .rbc-show-more {
          background: #4f46e5 !important;
          color: white !important;
          font-weight: 900 !important;
          font-size: 9px !important;
          padding: 5px 8px !important;
          border-radius: 10px !important;
          text-decoration: none !important;
          display: block !important;
          margin: 3px auto !important;
          text-align: center !important;
          width: 92% !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4) !important;
          transition: all 0.2s ease !important;
          border: none !important;
        }

        .custom-calendar-style .rbc-event {
          background: rgba(79, 70, 229, 0.1) !important;
          border-left: 3px solid #4f46e5 !important;
          border-radius: 6px !important;
          margin-bottom: 2px !important;
          padding: 0 !important;
          height: 22px !important;
        }

        @media (max-width: 768px) {
          .custom-calendar-style .rbc-show-more {
            font-size: 7px !important;
            padding: 3px 4px !important;
          }
          .custom-calendar-style .rbc-event {
            height: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}