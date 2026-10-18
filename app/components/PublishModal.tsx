"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { PLATFORM_INFO, SocialAccount, isExpired } from "./platforms";

interface PublishResult {
  accountId: string;
  platform: string;
  name: string | null;
  status: "success" | "failed";
  url: string | null;
  error: string | null;
}

interface Props {
  postId: string;
  postIndex: number;
  defaultText: string;
  hasImage: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export default function PublishModal({ postId, postIndex, defaultText, hasImage, onClose, onPublished }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState(defaultText);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Instagram nuk lejon postime pa imazh
  const isDisabled = (a: SocialAccount) => isExpired(a) || (a.platform === "instagram" && !hasImage);

  useEffect(() => {
    apiFetch("/api/social/accounts").then(async res => {
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      const list: SocialAccount[] = data.accounts || [];
      setAccounts(list);
      setSelected(list.filter(a => !(isExpired(a) || (a.platform === "instagram" && !hasImage))).map(a => a.id));
    });
  }, [hasImage]);

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await apiFetch("/api/social/publish", { postId, postIndex, accountIds: selected, text });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      onPublished();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-[30px] p-6 md:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Publish Post #{postIndex + 1}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        {error && <div className="bg-red-950/20 text-red-400 p-3 rounded-xl mb-4 text-[10px] font-black uppercase border border-red-900/30">{error}</div>}

        {results ? (
          <div className="space-y-3">
            {results.map(r => (
              <div key={r.accountId} className={`p-4 rounded-2xl border ${r.status === "success" ? "border-emerald-900/50 bg-emerald-950/20" : "border-red-900/40 bg-red-950/20"}`}>
                <p className="text-white font-black text-sm">
                  {r.status === "success" ? "✓" : "✕"} {PLATFORM_INFO[r.platform]?.label} · {r.name}
                </p>
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-[11px] font-bold underline">View post</a>}
                {r.error && <p className="text-red-400 text-[11px] mt-1">{r.error}</p>}
              </div>
            ))}
            <button onClick={onClose} className="w-full mt-4 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-600 hover:text-white transition-all">Done</button>
          </div>
        ) : accounts === null ? (
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">{error ? "" : "Loading accounts..."}</p>
        ) : accounts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm mb-6">Connect a social account first.</p>
            <button onClick={() => router.push("/accounts")} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Connect accounts</button>
          </div>
        ) : (
          <>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Post text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={7}
              className="w-full mt-1.5 mb-5 bg-slate-950/50 border-2 border-slate-800 p-3.5 rounded-2xl outline-none focus:border-indigo-500 text-xs text-white leading-relaxed"
            />
            {!hasImage && <p className="text-amber-500/80 text-[10px] font-bold mb-3">This post has no image, so Instagram is unavailable.</p>}

            <div className="space-y-2 mb-6">
              {accounts.map(a => {
                const info = PLATFORM_INFO[a.platform];
                const disabled = isDisabled(a);
                return (
                  <label key={a.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${disabled ? "opacity-40 cursor-not-allowed border-slate-800" : "cursor-pointer border-slate-800 hover:border-indigo-600"} ${selected.includes(a.id) ? "bg-indigo-950/30 border-indigo-700" : ""}`}>
                    <input type="checkbox" checked={selected.includes(a.id)} disabled={disabled} onChange={() => toggle(a.id)} className="accent-indigo-500" />
                    <span className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-white text-xs font-black ${info.color}`}>{info.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-white text-xs font-black truncate">{a.display_name || info.label}</span>
                      <span className="block text-slate-500 text-[9px] font-black uppercase tracking-widest">{info.label}{isExpired(a) ? " · expired" : ""}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={publish}
              disabled={publishing || selected.length === 0 || !text.trim()}
              className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing..." : `Publish to ${selected.length} account${selected.length === 1 ? "" : "s"}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
