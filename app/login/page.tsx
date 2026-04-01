"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering) {
      const { data, error: authError } = await supabase.auth.signUp({
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

      if (authError) {
        setError(authError.message);
      } else {
        // LOGJIKA E RE:
        // Nëse llogaria krijohet dhe sesioni është aktiv (Confirm Email është OFF)
        if (data.session) {
          router.push('/');
          router.refresh();
        } 
        // Nëse përdoruesi u krijua por nuk ka sesion (Confirm Email është ON)
        else if (data.user && !data.session) {
          setIsVerificationSent(true);
        }
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError("Kredencialet e pasakta. Provoni përsëri.");
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  // Funksionet e tjera (ForgotPassword) dhe UI mbeten të njëjta...
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Ju lutem shkruani email-in tuaj.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setResetSent(true);
    setLoading(false);
  };

  if (isVerificationSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[40px] shadow-2xl max-w-md backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="text-5xl mb-6">✉️</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter text-white">Verify Your Email</h2>
          <p className="text-slate-400 mb-8 text-sm font-medium italic">Kemi dërguar një link verifikimi te <b className="text-white">{email}</b>.</p>
          <button onClick={() => setIsVerificationSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Back to Login</button>
        </div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[40px] shadow-2xl max-w-md backdrop-blur-xl">
          <div className="text-5xl mb-6">🔑</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter text-white">Check Your Email</h2>
          <p className="text-slate-400 mb-8 text-sm font-medium italic">Linku i rikuperimit u dërgua me sukses.</p>
          <button onClick={() => setResetSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col lg:flex-row bg-slate-900/40 rounded-[40px] overflow-hidden border border-slate-800/60 shadow-2xl backdrop-blur-xl relative z-10">
        
        <div className="hidden lg:flex lg:w-1/2 bg-slate-950/60 p-12 flex-col justify-center border-r border-slate-800/60">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight italic">Future of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Content.</span></h2>
          <p className="text-slate-400 text-sm font-medium mt-4 italic">Generate innovative strategies and original content powered by Artificial Intelligence.</p>
        </div>

        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="text-left mb-8">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3 italic">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl not-italic text-sm">P.ai</span>
              Posto.ai
            </h1>
          </div>

          {error && <div className="bg-red-950/20 text-red-500 p-3 rounded-xl mb-6 text-[10px] font-black text-center uppercase border border-red-900/30 animate-shake">{error}</div>}

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
                <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white shadow-inner" placeholder="Your Name" onChange={e => setUsername(e.target.value)} required />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
              <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white shadow-inner" type="email" placeholder="user@posto.ai" onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Password</label>
              <div className="relative">
                <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white pr-12 shadow-inner" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400">
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {!isRegistering && (
              <div className="flex justify-end -mt-2">
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest hover:text-indigo-400 transition-all italic">Forgot Password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-white text-slate-950 p-4 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all uppercase text-[10px] tracking-[0.3em] mt-2 italic">
              {loading ? "INITIALIZING..." : (isRegistering ? "Establish Account" : "Access Vault")}
            </button>
          </form>

          <div className="mt-8">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] hover:text-indigo-400 transition-colors flex items-center gap-2">
              {isRegistering ? "Existing Node? Back to Access" : "No Access? Request Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}