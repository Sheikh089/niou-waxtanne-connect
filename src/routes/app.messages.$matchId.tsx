import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Send, MoreVertical, ShieldAlert, Ban, Check, CheckCheck,
  Paperclip, Image as ImageIcon, Video as VideoIcon, Mic, Square, X, Play, Pause, Phone, VideoIcon as Vid2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/messages/$matchId")({
  component: Conversation,
});

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  read_at: string | null;
  media_url: string | null;
  media_type: "image" | "audio" | "video" | null;
  duration_ms: number | null;
};

const REPORT_REASONS = [
  "Comportement inapproprié",
  "Faux profil",
  "Harcèlement",
  "Contenu offensant",
  "Spam / arnaque",
  "Autre",
];

const BUCKET = "chat-media";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDur(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Conversation() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [other, setOther] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunks = useRef<Blob[]>([]);
  const recStart = useRef<number>(0);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileImg = useRef<HTMLInputElement>(null);
  const fileVid = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);

      const { data: match } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .eq("id", matchId)
        .single();
      if (!match || !active) return;
      const oId = match.user_a === user.id ? match.user_b : match.user_a;
      setOtherId(oId);
      const { data: prof } = await supabase
        .from("profiles").select("display_name, avatar_url").eq("id", oId).single();
      if (active) setOther(prof);

      const { data: msgs } = await supabase
        .from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
      if (active) {
        const list = (msgs ?? []) as unknown as Message[];
        setMessages(list);
        const unread = list.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
        if (unread.length) {
          await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread);
        }
      }

      const ch = supabase
        .channel(`match:${matchId}`, { config: { presence: { key: user.id } } })
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          async (payload) => {
            const m = payload.new as Message;
            setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
            if (m.sender_id !== user.id) {
              await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
            }
          })
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const m = payload.new as Message;
            setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          })
        .on("broadcast", { event: "typing" }, (p) => {
          if (p.payload.user !== user.id) {
            setOtherTyping(true);
            setTimeout(() => setOtherTyping(false), 2500);
          }
        })
        .on("presence", { event: "sync" }, () => {
          const state = ch.presenceState() as Record<string, unknown[]>;
          setOtherOnline(Object.keys(state).some((k) => k === oId));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") await ch.track({ online_at: new Date().toISOString() });
        });
      channelRef.current = ch;
    })();

    return () => {
      active = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (recTimer.current) clearInterval(recTimer.current);
    };
  }, [matchId]);

  // Sign media URLs on demand
  useEffect(() => {
    const missing = messages
      .filter((m) => m.media_url && !signedUrls[m.media_url])
      .map((m) => m.media_url as string);
    if (!missing.length) return;
    (async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 3600);
      if (!data) return;
      const next: Record<string, string> = {};
      data.forEach((d) => { if (d.signedUrl && d.path) next[d.path] = d.signedUrl; });
      setSignedUrls((p) => ({ ...p, ...next }));
    })();
  }, [messages, signedUrls]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const onTyping = (val: string) => {
    setInput(val);
    if (!channelRef.current || !me) return;
    if (typingTimeout.current) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { user: me } });
    typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 1500);
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !me) return;
    setInput("");
    const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: me, content: text });
    if (error) toast.error(error.message);
  };

  const uploadAndSend = async (file: Blob, kind: "image" | "audio" | "video", ext: string, durationMs?: number) => {
    if (!me) return;
    setAttachOpen(false);
    const path = `${me}/${matchId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: (file as File).type || (kind === "audio" ? "audio/webm" : kind === "video" ? "video/mp4" : "image/jpeg"),
      upsert: false,
    });
    if (upErr) { toast.error(upErr.message); return; }
    const payload: Record<string, unknown> = {
      match_id: matchId, sender_id: me, content: null, media_url: path, media_type: kind,
    };
    if (durationMs) payload.duration_ms = durationMs;
    const { error } = await supabase.from("messages").insert(payload as never);
    if (error) toast.error(error.message);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error("Image trop lourde (max 15 Mo)"); return; }
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    await uploadAndSend(f, "image", ext);
  };
  const onPickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast.error("Vidéo trop lourde (max 50 Mo)"); return; }
    const ext = (f.name.split(".").pop() || "mp4").toLowerCase();
    await uploadAndSend(f, "video", ext);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recChunks.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size) recChunks.current.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunks.current, { type: "audio/webm" });
        const dur = Date.now() - recStart.current;
        if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
        setRecElapsed(0);
        setRecording(false);
        await uploadAndSend(blob, "audio", "webm", dur);
      };
      recRef.current = mr;
      recStart.current = Date.now();
      mr.start();
      setRecording(true);
      recTimer.current = setInterval(() => setRecElapsed(Date.now() - recStart.current), 200);
    } catch {
      toast.error("Micro indisponible");
    }
  };
  const stopRecording = () => recRef.current?.stop();
  const cancelRecording = () => {
    if (!recRef.current) return;
    recRef.current.onstop = null;
    recRef.current.stop();
    recRef.current.stream.getTracks().forEach((t) => t.stop());
    if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    setRecElapsed(0);
    setRecording(false);
  };

  const blockUser = async () => {
    if (!me || !otherId) return;
    if (!confirm("Bloquer cet utilisateur ? Vous ne pourrez plus échanger.")) return;
    const { error } = await supabase.from("blocks").insert({ blocker: me, blocked: otherId });
    if (error) toast.error(error.message);
    else { toast.success("Utilisateur bloqué"); navigate({ to: "/app/messages" }); }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !otherId) return;
    const { error } = await supabase.from("reports").insert({
      reporter: me, reported: otherId, reason: reportReason,
      details: reportDetails || null, match_id: matchId,
    });
    if (error) { toast.error(error.message); return; }
    setReportOpen(false); setReportDetails("");
    toast.success("Signalement envoyé. Merci de protéger la communauté.");
  };

  // Group messages by day for separators
  const grouped = useMemo(() => {
    const out: Array<{ type: "sep"; day: string } | { type: "msg"; m: Message }> = [];
    let last = "";
    for (const m of messages) {
      const d = new Date(m.created_at).toDateString();
      if (d !== last) { out.push({ type: "sep", day: fmtDay(m.created_at) }); last = d; }
      out.push({ type: "msg", m });
    }
    return out;
  }, [messages]);

  return (
    <div
      className="relative flex h-[calc(100vh-180px)] flex-col overflow-hidden rounded-3xl border border-border/40 shadow-2xl"
      style={{
        backgroundColor: "oklch(0.18 0.02 320)",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, oklch(0.66 0.24 5 / 0.08) 0, transparent 40%), radial-gradient(circle at 80% 90%, oklch(0.88 0.17 90 / 0.05) 0, transparent 35%)",
      }}
    >
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-xl">
        <Link to="/app/messages" className="md:hidden text-white/80">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
          {other?.avatar_url && <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />}
          {otherOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-green-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-display text-base font-semibold text-white">{other?.display_name ?? "…"}</div>
          <div className="text-[11px] text-white/60">
            {otherTyping ? <span className="text-[oklch(0.88_0.17_90)]">écrit…</span> : otherOnline ? "en ligne" : "hors ligne"}
          </div>
        </div>
        <button className="rounded-full p-2 text-white/70 hover:bg-white/10" title="Bientôt"><Phone className="h-4 w-4" /></button>
        <button className="rounded-full p-2 text-white/70 hover:bg-white/10" title="Bientôt"><Vid2 className="h-4 w-4" /></button>
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="rounded-full p-2 text-white/80 hover:bg-white/10">
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg">
              <button onClick={() => { setMenuOpen(false); setReportOpen(true); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Signaler
              </button>
              <button onClick={() => { setMenuOpen(false); blockUser(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted">
                <Ban className="h-4 w-4" /> Bloquer
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MESSAGES */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="py-12 text-center text-sm text-white/60">
            Dites bonjour 💖 et lancez la conversation.
          </div>
        )}
        {grouped.map((g, i) =>
          g.type === "sep" ? (
            <div key={`s-${i}`} className="my-3 flex justify-center">
              <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">
                {g.day}
              </span>
            </div>
          ) : (() => {
            const m = g.m;
            const mine = m.sender_id === me;
            const url = m.media_url ? signedUrls[m.media_url] : undefined;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`group max-w-[78%] sm:max-w-[65%] rounded-2xl px-2 pt-2 pb-1 shadow-md ${
                  mine
                    ? "bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.52_0.22_5)] text-white rounded-br-sm"
                    : "bg-white/95 text-zinc-900 rounded-bl-sm"
                }`}>
                  {m.media_type === "image" && (
                    <button onClick={() => url && setLightbox(url)} className="block overflow-hidden rounded-xl">
                      {url
                        ? <img src={url} alt="" className="max-h-72 w-full object-cover" />
                        : <div className="h-48 w-64 animate-pulse bg-black/20" />}
                    </button>
                  )}
                  {m.media_type === "video" && (
                    url
                      ? <video src={url} controls className="max-h-72 w-full rounded-xl" />
                      : <div className="h-48 w-64 animate-pulse rounded-xl bg-black/20" />
                  )}
                  {m.media_type === "audio" && (
                    <AudioBubble src={url} mine={mine} duration={m.duration_ms ?? undefined} />
                  )}
                  {m.content && (
                    <div className="whitespace-pre-wrap break-words px-2 py-1 text-[14.5px] leading-snug">{m.content}</div>
                  )}
                  <div className={`flex items-center justify-end gap-1 px-2 pb-0.5 text-[10px] ${mine ? "text-white/80" : "text-zinc-500"}`}>
                    <span>{fmtTime(m.created_at)}</span>
                    {mine && (m.read_at
                      ? <CheckCheck className="h-3.5 w-3.5 text-[oklch(0.78_0.19_220)]" />
                      : <Check className="h-3.5 w-3.5" />)}
                  </div>
                </div>
              </div>
            );
          })()
        )}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-white/95 px-4 py-2.5 shadow">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* COMPOSER */}
      {recording ? (
        <div className="flex items-center gap-3 border-t border-white/10 bg-black/40 p-3 backdrop-blur-xl">
          <button onClick={cancelRecording} className="rounded-full p-2 text-white/80 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-mono">{fmtDur(recElapsed)}</span>
            <span className="text-xs text-white/60">Enregistrement…</span>
          </div>
          <button onClick={stopRecording} className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow">
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="relative flex items-end gap-2 border-t border-white/10 bg-black/40 p-2.5 backdrop-blur-xl">
          {/* Attach menu */}
          <div className="relative">
            <button type="button" onClick={() => setAttachOpen((o) => !o)} className="rounded-full p-2.5 text-white/80 hover:bg-white/10">
              <Paperclip className="h-5 w-5" />
            </button>
            {attachOpen && (
              <div className="absolute bottom-12 left-0 z-40 flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur">
                <button type="button" onClick={() => { setAttachOpen(false); fileImg.current?.click(); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white hover:bg-white/10">
                  <ImageIcon className="h-4 w-4 text-[oklch(0.78_0.19_220)]" /> Photo
                </button>
                <button type="button" onClick={() => { setAttachOpen(false); fileVid.current?.click(); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white hover:bg-white/10">
                  <VideoIcon className="h-4 w-4 text-[oklch(0.7_0.2_140)]" /> Vidéo
                </button>
              </div>
            )}
          </div>
          <input ref={fileImg} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <input ref={fileVid} type="file" accept="video/*" className="hidden" onChange={onPickVideo} />

          <textarea
            value={input}
            onChange={(e) => onTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Écrivez un message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-[oklch(0.66_0.24_5)] max-h-32"
          />

          {input.trim() ? (
            <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow transition hover:scale-105">
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={startRecording} className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow transition hover:scale-105" title="Message vocal">
              <Mic className="h-4 w-4" />
            </button>
          )}
        </form>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {/* Report dialog */}
      {reportOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={submitReport} className="w-full max-w-md space-y-4 rounded-3xl bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl font-bold">Signaler un utilisateur</h2>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Motif</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]">
                {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Détails (optionnel)</label>
              <textarea rows={3} value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} maxLength={500} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm">Annuler</button>
              <button type="submit" className="flex-1 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-4 py-2.5 text-sm font-semibold text-white shadow-glow">Envoyer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AudioBubble({ src, mine, duration }: { src?: string; mine: boolean; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(duration ? duration / 1000 : 0);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); } else { void a.play(); }
  };

  return (
    <div className={`flex items-center gap-3 px-1 py-1 ${mine ? "" : ""}`}>
      <button onClick={toggle} className={`flex h-9 w-9 items-center justify-center rounded-full ${mine ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-800"}`}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className={`h-1.5 w-full overflow-hidden rounded-full ${mine ? "bg-white/25" : "bg-zinc-200"}`}>
          <div
            className={`h-full ${mine ? "bg-white" : "bg-[oklch(0.66_0.24_5)]"}`}
            style={{ width: dur ? `${(pos / dur) * 100}%` : "0%" }}
          />
        </div>
        <span className={`text-[10px] ${mine ? "text-white/80" : "text-zinc-500"} font-mono`}>
          {fmtDur((playing || pos ? pos : dur) * 1000 || 0)}
        </span>
      </div>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setPos(0); }}
          onLoadedMetadata={(e) => {
            const d = (e.currentTarget as HTMLAudioElement).duration;
            if (isFinite(d) && d > 0) setDur(d);
          }}
          onTimeUpdate={(e) => setPos((e.currentTarget as HTMLAudioElement).currentTime)}
        />
      )}
    </div>
  );
}
