// "use client";
// import { useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';

// export default function LoginPage() {
//   const [isRegistering, setIsRegistering] = useState(false);
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [isVerificationSent, setIsVerificationSent] = useState(false);
//   const [resetSent, setResetSent] = useState(false);
  
//   const router = useRouter();
//   const { user } = useAuth() || {};

//   const handleAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     if (isRegistering) {
//       const { error } = await supabase.auth.signUp({
//         email, 
//         password,
//         options: { 
//           data: { display_name: username, generations_count: 0 },
//           emailRedirectTo: `${window.location.origin}/auth/callback`,
//         }
//       });
//       if (error) setError(error.message);
//       else setIsVerificationSent(true);
//     } else {
//       const { error } = await supabase.auth.signInWithPassword({ email, password });
//       if (error) setError("Kredencialet e pasakta. Provoni përsëri.");
//       else router.push('/');
//     }
//     setLoading(false);
//   };

//   const handleForgotPassword = async () => {
//     if (!email) {
//       setError("Shkruani email-in tuaj te fusha përkatëse.");
//       return;
//     }
//     setLoading(true);
//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       // Kjo linjë duhet të jetë identike me Redirect URL në Dashboard
//       redirectTo: `${window.location.origin}/reset-password`,
//     });
//     if (error) setError(error.message);
//     else setResetSent(true);
//     setLoading(false);
//   };

//   // Ekrani i suksesit për Reset Password
//   if (resetSent) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
//         <div className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[40px] shadow-2xl max-w-md backdrop-blur-xl animate-in fade-in zoom-in duration-500">
//           <div className="text-5xl mb-6">🔑</div>
//           <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter text-white">Check Your Email</h2>
//           <p className="text-slate-400 mb-8 text-sm font-medium italic">Kemi dërguar linkun e resetimit te <b className="text-white">{email}</b>.</p>
//           <button onClick={() => setResetSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Kthehu te Login</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      
//       {/* Background Decor */}
//       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
//       <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>

//       <div className="w-full max-w-5xl max-h-[90vh] flex flex-col lg:flex-row bg-slate-900/40 rounded-[40px] overflow-hidden border border-slate-800/60 shadow-2xl backdrop-blur-xl relative z-10">
        
//         {/* LEFT SIDE (PROMO) */}
//         <div className="hidden lg:flex lg:w-1/2 bg-slate-950/60 p-12 flex-col justify-center relative border-r border-slate-800/60">
//           <div className="absolute -top-20 -left-20 text-[200px] font-black text-slate-800/5 italic -rotate-12 pointer-events-none">AI</div>
//           <div className="relative z-10 space-y-6">
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
//               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
//               Workspace Platform
//             </div>
//             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Future of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Content.</span></h2>
//             <p className="text-slate-400 text-sm font-medium max-w-sm italic">Generate innovative strategies and original content powered by Artificial Intelligence.</p>
//           </div>
//         </div>

//         {/* RIGHT SIDE (FORM) */}
//         <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto no-scrollbar">
//           <div className="text-left mb-8">
//             <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
//               <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl not-italic text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">P.ai</span>
//               Posto.ai
//             </h1>
//             <p className="text-slate-500 font-black text-[9px] mt-3 uppercase tracking-[0.4em] italic">
//               {isRegistering ? "Register New Node" : "System Access"}
//             </p>
//           </div>

//           {error && (
//             <div className="bg-red-950/20 text-red-500 p-3 rounded-xl mb-6 text-[10px] font-black text-center uppercase border border-red-900/30 animate-shake">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleAuth} className="space-y-5">
//             {isRegistering && (
//               <div className="space-y-1.5">
//                 <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
//                 <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" placeholder="Lindita Morina" onChange={e => setUsername(e.target.value)} required />
//               </div>
//             )}
            
//             <div className="space-y-1.5">
//               <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
//               <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" type="email" placeholder="user@posto.ai" onChange={e => setEmail(e.target.value)} required />
//             </div>

//             <div className="space-y-1.5">
//               <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Password</label>
//               <div className="relative">
//                 <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all pr-12 shadow-inner" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={e => setPassword(e.target.value)} required />
//                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors">
//                   {showPassword ? "👁️‍🗨️" : "👁️"}
//                 </button>
//               </div>
//             </div>

//             {/* Forget Password Positioned Here */}
//             {!isRegistering && (
//               <div className="flex justify-end -mt-2 px-1">
//                 <button 
//                   type="button" 
//                   onClick={handleForgotPassword} 
//                   className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest hover:text-indigo-400 transition-all italic"
//                 >
//                   Forgot Password?
//                 </button>
//               </div>
//             )}

//             <button type="submit" disabled={loading} className="w-full bg-white text-slate-950 p-4 rounded-2xl font-black shadow-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center justify-center">
//               {loading ? "INITIALIZING..." : (isRegistering ? "Establish Account" : "Access Vault")}
//             </button>
//           </form>

//           <div className="mt-8">
//             <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] hover:text-indigo-400 transition-colors flex items-center gap-2">
//               <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
//               {isRegistering ? "Existing Node? Back to Access" : "No Access? Request Account"}
//             </button>
//           </div>
//         </div>
//       </div>

//       <style jsx global>{`
//         .no-scrollbar::-webkit-scrollbar { display: none; }
//         @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
//         .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
//       `}</style>
//     </div>
//   );
// }


"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering) {
      // Regjistrimi pa verifikim email-i
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { 
            display_name: username,
            generations_count: 0 
          }
          // Kemi hequr emailRedirectTo që të mos provokojmë dërgimin e email-it
        }
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Meqë Confirm Email është OFF, përdoruesi regjistrohet dhe kyçet menjëherë
        router.push('/');
        router.refresh();
      }
    } else {
      // Login normal
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Kredencialet e pasakta. Provoni përsëri.");
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Ju lutem shkruani email-in tuaj te fusha përkatëse.");
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

  if (resetSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[40px] shadow-2xl max-w-md backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="text-5xl mb-6">🔑</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter text-white">Check Your Email</h2>
          <p className="text-slate-400 mb-8 text-sm font-medium italic">Kemi dërguar linkun e resetimit te <b className="text-white">{email}</b>.</p>
          <button onClick={() => setResetSent(false)} className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Kthehu te Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col lg:flex-row bg-slate-900/40 rounded-[40px] overflow-hidden border border-slate-800/60 shadow-2xl backdrop-blur-xl relative z-10">
        {/* LEFT SIDE (PROMO) */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-950/60 p-12 flex-col justify-center relative border-r border-slate-800/60">
          <div className="absolute -top-20 -left-20 text-[200px] font-black text-slate-800/5 italic -rotate-12 pointer-events-none">AI</div>
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Workspace Platform
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Future of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Content.</span></h2>
            <p className="text-slate-400 text-sm font-medium max-w-sm italic">Generate innovative strategies and original content powered by Artificial Intelligence.</p>
          </div>
        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="text-left mb-8">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl not-italic text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">P.ai</span>
              Posto.ai
            </h1>
            <p className="text-slate-500 font-black text-[9px] mt-3 uppercase tracking-[0.4em] italic">
              {isRegistering ? "Register New Node" : "System Access"}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/20 text-red-500 p-3 rounded-xl mb-6 text-[10px] font-black text-center uppercase border border-red-900/30 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
                <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" placeholder="Enter name" onChange={e => setUsername(e.target.value)} required />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
              <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all shadow-inner" type="email" placeholder="user@posto.ai" onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Password</label>
              <div className="relative">
                <input className="w-full bg-slate-950/50 border-2 border-slate-800/80 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs font-bold text-white transition-all pr-12 shadow-inner" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors">
                  {showPassword ? "👁️‍G" : "👁️"}
                </button>
              </div>
            </div>

            {!isRegistering && (
              <div className="flex justify-end -mt-2 px-1">
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest hover:text-indigo-400 transition-all italic">Forgot Password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-white text-slate-950 p-4 rounded-2xl font-black shadow-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center justify-center">
              {loading ? "INITIALIZING..." : (isRegistering ? "Establish Account" : "Access Vault")}
            </button>
          </form>

          <div className="mt-8">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] hover:text-indigo-400 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
              {isRegistering ? "Existing Node? Back to Access" : "No Access? Request Account"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}