"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { PLATFORM_INFO, SocialAccount, isExpired } from "../components/platforms";

const ERRORS: Record<string, string> = {
  cancelled: "Lidhja u anulua.",
  invalid_state: "Lidhja skadoi ose u hap në një shfletues tjetër. Provoni përsëri.",
  no_accounts: "Nuk u gjet asnjë Faqe Facebook. Instagram duhet të jetë llogari Business/Creator e lidhur me një Faqe.",
  server: "Gabim në server.",
};

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [providers, setProviders] = useState({ linkedin: false, meta: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/social/accounts");
    const data = await res.json();
    if (res.ok) {
      setAccounts(data.accounts || []);
      setProviders(data.providers);
    } else {
      setNotice({ type: "error", text: data.error });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) load();
  }, [user, authLoading, router, load]);

  // Rezultati i kthimit nga LinkedIn/Facebook
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      setNotice({ type: "ok", text: `U lidhën ${params.get("count") || ""} llogari me sukses.` });
    } else if (error) {
      setNotice({ type: "error", text: ERRORS[error] || error });
    }
    if (connected || error) window.history.replaceState(null, "", "/accounts");
  }, []);

  const connect = async (provider: "linkedin" | "meta") => {
    setConnecting(provider);
    try {
      const res = await apiFetch("/api/social/connect", { provider });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
      setConnecting(null);
    }
  };

  const disconnect = async (id: string) => {
    const res = await apiFetch("/api/social/accounts", { id }, "DELETE");
    if (res.ok) setAccounts(prev => prev.filter(a => a.id !== id));
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 md:p-16 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <button onClick={() => router.push("/")} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-400 transition-all mb-8 md:mb-12">
          <span className="text-base md:text-lg group-hover:-translate-x-1 transition-transform">←</span> Return to Base
        </button>

        <p className="text-indigo-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.5em] mb-3 italic opacity-80">One-click publishing</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white leading-tight mb-8 md:mb-10">Connected Accounts</h1>

        {notice && (
          <div className={`p-4 rounded-2xl mb-6 text-[10px] font-black uppercase tracking-widest border ${notice.type === "ok" ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40" : "bg-red-950/20 text-red-400 border-red-900/30"}`}>
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => connect("linkedin")}
            disabled={!providers.linkedin || connecting !== null}
            className="p-6 rounded-[25px] bg-slate-900/60 border border-slate-800 hover:border-[#0A66C2] transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white font-black mb-4">in</span>
            <p className="text-white font-black uppercase text-sm tracking-tight">{connecting === "linkedin" ? "Opening LinkedIn..." : "Connect LinkedIn"}</p>
            <p className="text-slate-500 text-[11px] mt-1">Your personal LinkedIn profile.</p>
          </button>
          <button
            onClick={() => connect("meta")}
            disabled={!providers.meta || connecting !== null}
            className="p-6 rounded-[25px] bg-slate-900/60 border border-slate-800 hover:border-[#1877F2] transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-flex gap-1 mb-4">
              <span className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[#1877F2] text-white font-black">f</span>
              <span className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-pink-600 to-purple-600 text-white font-black">◎</span>
            </span>
            <p className="text-white font-black uppercase text-sm tracking-tight">{connecting === "meta" ? "Opening Facebook..." : "Connect Facebook & Instagram"}</p>
            <p className="text-slate-500 text-[11px] mt-1">Facebook Pages and Instagram Business/Creator accounts linked to them.</p>
          </button>
        </div>
        {(!providers.linkedin || !providers.meta) && !loading && (
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest -mt-6 mb-10">Platforms that look disabled have not been set up on the server yet.</p>
        )}

        <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4 border-l-4 border-indigo-600 pl-3">Your accounts</h2>
        {loading ? (
          <p className="text-slate-600 text-xs font-black uppercase tracking-widest animate-pulse">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No accounts connected yet.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map(a => {
              const info = PLATFORM_INFO[a.platform];
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-[20px] bg-slate-900/40 border border-slate-800/60">
                  <span className={`w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl text-white font-black ${info.color}`}>{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{a.display_name || info.label}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isExpired(a) ? "text-amber-500" : "text-slate-500"}`}>
                      {info.label}{isExpired(a) ? " · expired, reconnect" : ""}
                    </p>
                  </div>
                  <button onClick={() => disconnect(a.id)} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all px-3 py-2">Disconnect</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
