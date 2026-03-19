"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State i ri për syrin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { display_name: username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) setError(error.message);
      else setIsVerificationSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Invalid credentials! Please check your email or password.");
      else router.push('/');
    }
    setLoading(false);
  };

  if (isVerificationSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <div className="bg-white p-10 rounded-[40px] shadow-xl max-w-md border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="text-5xl mb-6">✉️</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter text-slate-900">Verify your email</h2>
          <p className="text-slate-500 mb-8 font-medium italic">
            Hi {username}, we sent a link to <b>{email}</b>. Click it to activate your account!
          </p>
          <button onClick={() => setIsVerificationSent(false)} className="text-indigo-600 font-black uppercase text-xs tracking-widest hover:underline transition-all">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-indigo-600 uppercase italic tracking-tighter">Posto.ai</h1>
          <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.3em]">
            {isRegistering ? "Join the community" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-[11px] font-black text-center uppercase tracking-wider border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Full Name / Username</label>
              <input 
                className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 font-bold text-sm transition-all focus:bg-white" 
                placeholder="e.g. Lindita" 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Email Address</label>
            <input 
              className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 font-bold text-sm transition-all focus:bg-white" 
              type="email" 
              placeholder="lindita@example.com" 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Password (min 6 characters)</label>
            <div className="relative">
              <input 
                className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 outline-none focus:border-indigo-500 font-bold text-sm transition-all focus:bg-white pr-12" 
                type={showPassword ? "text" : "password"} // Ndryshimi dinamik
                placeholder="••••••••" 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              {/* BUTONI I SYRIT */}
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.013a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 uppercase text-xs tracking-widest mt-4 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : (isRegistering ? "Create Account" : "Log In")}
          </button>
        </form>

        <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="w-full mt-8 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
          {isRegistering ? "Already have an account? Log In" : "Don't have an account? Sign Up Free"}
        </button>
      </div>
    </div>
  );
}