"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const router = useRouter();
  const { user } = useAuth() || {};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.refresh();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { 
            display_name: username,
            generations_count: 0 
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) setError(error.message);
      else setIsVerificationSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Invalid credentials. Please try again or reset session.");
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  if (isVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center relative">
        <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="bg-slate-900/40 border border-slate-800/60 p-8 md:p-12 rounded-[40px] md:rounded-[50px] shadow-2xl max-w-md backdrop-blur-xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-5xl md:text-6xl mb-6 md:mb-8">✉️</div>
          <h2 className="text-2xl md:text-3xl font-black mb-4 uppercase italic tracking-tighter text-white">Verify Email</h2>
          <p className="text-slate-400 mb-8 md:text-sm font-medium italic">We sent a verification link to <b className="text-white">{email}</b>.</p>
          <button onClick={() => setIsVerificationSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white p-4 md:p-8">
      
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-600/15 rounded-full blur-[100px] md:blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-cyan-600/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row bg-slate-900/40 rounded-[40px] md:rounded-[50px] overflow-hidden border border-slate-800/60 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl relative z-10 transition-all duration-500">
        
        {/* ================= LEFT SIDE: INTRO (PROMO) ================= */}
        <div className="w-full lg:w-1/2 bg-slate-950/60 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative border-b lg:border-b-0 lg:border-right border-slate-800/60 overflow-hidden order-2 lg:order-1">
          
          <div className="absolute -top-20 -left-20 text-[200px] font-black text-slate-800/10 italic -rotate-12 select-none pointer-events-none">AI</div>
          
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Workspace Platform
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none italic">
                Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Content.</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                Generate innovative strategies and original content powered by Artificial Intelligence. Designed to streamline your creative workflow through a clean and efficient interface.
              </p>
            </div>

            <div className="space-y-5 pt-4">
              <div className="flex items-start gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-xl text-indigo-400 shrink-0 border border-slate-800 group-hover:border-indigo-500/50 group-hover:scale-110 transition-all shadow-inner">
                  ⚡
                </div>
                <div>
                  <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-wide">Instant Generation</h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Create posts and strategic ideas in seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-xl text-cyan-400 shrink-0 border border-slate-800 group-hover:border-cyan-500/50 group-hover:scale-110 transition-all shadow-inner">
                  🔒
                </div>
                <div>
                  <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-wide">Secure Vault</h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Store your favorites in your dedicated private archive.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: FORM (ACCESS) ================= */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 relative order-1 lg:order-2">
          <div className="text-left mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl not-italic text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">P.ai</span>
              Posto.ai
            </h1>
            <p className="text-slate-500 font-black text-[9px] md:text-[10px] mt-4 uppercase tracking-[0.4em] md:tracking-[0.5em] italic">
              {isRegistering ? "Register New Node" : "System Access"}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/20 text-red-500 p-3 md:p-4 rounded-2xl mb-6 md:mb-8 text-[10px] md:text-[11px] font-black text-center uppercase tracking-widest border border-red-900/30">
              {error}
              <button onClick={handleLogout} className="block w-full mt-2 text-[8px] md:text-[9px] underline opacity-70 hover:opacity-100">Reset Session Cache</button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 md:space-y-6">
            {isRegistering && (
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
                <input 
                  className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 md:p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-800/50 text-xs md:text-sm font-bold text-white transition-all shadow-inner" 
                  placeholder="Lindita Morina" 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
            )}
            
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
              <input 
                className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 md:p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-800/50 text-xs md:text-sm font-bold text-white transition-all shadow-inner" 
                type="email" 
                placeholder="user@posto.ai" 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Password</label>
              <div className="relative">
                <input 
                  className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 md:p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-slate-800/50 text-xs md:text-sm font-bold text-white transition-all pr-12 md:pr-14 shadow-inner" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.013a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-white text-slate-950 p-4 md:p-5 rounded-[20px] md:rounded-[22px] font-black shadow-[0_15px_30px_rgba(255,255,255,0.05)] hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] md:text-[11px] tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-8 flex items-center justify-center gap-3 overflow-hidden relative"
            >
              {loading ? "INITIALIZING..." : (isRegistering ? "Establish Account" : "Access Vault")}
            </button>
          </form>

          <div className="mt-8 md:mt-10">
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                className="text-slate-500 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                {isRegistering ? "Existing Node? Back to Access" : "No Access? Request Account"}
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}