"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Supozojmë se keni një AuthContext

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
  const { user } = useAuth() || {}; // Marrim user-in nëse është i loguar

  // Nëse ka gabim "Refresh Token Not Found", ky funksion do të pastrojë sesionin
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); // Pastron çdo mbetje të korruptuar
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
            generations_count: 0 // Inicimi i numëruesit
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) setError(error.message);
      else setIsVerificationSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Kredencialet janë të gabuara. Provo përsëri ose pastro sesionin.");
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  if (isVerificationSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6 text-center relative">
        <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="bg-slate-900/40 border border-slate-800/60 p-12 rounded-[50px] shadow-2xl max-w-md backdrop-blur-xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-8">✉️</div>
          <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tighter text-white">Verifiko Email-in</h2>
          <p className="text-slate-400 mb-10 font-medium italic">Kemi dërguar një vegëz në <b className="text-white">{email}</b>.</p>
          <button onClick={() => setIsVerificationSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Kthehu te Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/40 p-10 md:p-14 rounded-[50px] border border-slate-800/60 shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-md backdrop-blur-xl relative z-10 transition-all duration-500">
        
        {/* COUNTERI I GJENERIMEVE (I shtuar siç kërkove) */}
        {!isRegistering && (
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 px-6 py-2 rounded-full border-4 border-slate-950 shadow-[0_10px_20px_rgba(79,70,229,0.3)] z-20">
              <p className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                Gjenerimet: <span className="text-yellow-300 ml-1">{user?.user_metadata?.generations_count || 0}</span>
              </p>
           </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter flex justify-center items-center gap-2">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl not-italic text-sm">P.ai</span>
            Posto.ai
          </h1>
          <p className="text-slate-500 font-black text-[10px] mt-4 uppercase tracking-[0.5em] italic">
            {isRegistering ? "Register Node" : "System Access"}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 text-red-500 p-4 rounded-2xl mb-8 text-[11px] font-black text-center uppercase tracking-widest border border-red-900/30">
            {error}
            <button onClick={handleLogout} className="block w-full mt-2 text-[9px] underline opacity-70 hover:opacity-100">Reset Session Cache</button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
              <input 
                className="w-full bg-slate-800/40 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold text-white transition-all" 
                placeholder="Lindita Morina" 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
            <input 
              className="w-full bg-slate-800/40 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold text-white transition-all" 
              type="email" 
              placeholder="user@posto.ai" 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Password</label>
            <div className="relative">
              <input 
                className="w-full bg-slate-800/40 border-2 border-slate-700/30 p-4 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold text-white transition-all pr-14" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
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
            className="w-full bg-white text-slate-950 p-5 rounded-[22px] font-black shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase text-[11px] tracking-[0.3em] mt-6 flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            {loading ? "INITIALIZING..." : (isRegistering ? "Establish Account" : "Access Vault")}
          </button>
        </form>

        <div className="mt-10 flex flex-col gap-4 items-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] hover:text-indigo-400 transition-colors"
            >
              {isRegistering ? "Existing Node? Back to Access" : "No Access? Request Account"}
            </button>

            {/* LOGOUT BUTTON - Për të pastruar gabimet e refresh token */}
            {!isRegistering && (
               <button 
                 onClick={handleLogout}
                 className="mt-2 text-red-500/50 hover:text-red-500 text-[8px] font-bold uppercase tracking-[0.2em] transition-colors"
               >
                 Terminate Session & Reset
               </button>
            )}
        </div>
      </div>
    </div>
  );
}