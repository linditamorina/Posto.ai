"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }

    if (password.length < 6) {
      setError("Fjalëkalimi duhet të jetë të paktën 6 karaktere.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/60 p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-xl z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl not-italic text-sm">P.ai</span>
            New Password
          </h1>
          <p className="text-slate-500 font-black text-[9px] mt-3 uppercase tracking-[0.4em] italic">Set your new access code</p>
        </div>

        {error && (
          <div className="bg-red-950/20 text-red-500 p-3 rounded-xl mb-6 text-[10px] font-black text-center uppercase border border-red-900/30">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <p className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Fjalëkalimi u ndryshua! Po ju ridrejtojmë...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">New Password</label>
              <input 
                className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" 
                type="password" 
                placeholder="••••••••" 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Confirm Password</label>
              <input 
                className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" 
                type="password" 
                placeholder="••••••••" 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-white text-slate-950 p-4 rounded-2xl font-black shadow-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center justify-center"
            >
              {loading ? "UPDATING..." : "Confirm Reset"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}