import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, MoreVertical, ShieldAlert, Ban, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/messages/$matchId")({
  component: Conversation,
});

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

const REPORT_REASONS = [
  "Comportement inapproprié",
  "Faux profil",
  "Harcèlement",
  "Contenu offensant",
  "Spam / arnaque",
  "Autre",
];

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", oId)
        .single();
      if (active) setOther(prof);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (active) {
        setMessages((msgs ?? []) as Message[]);
        // mark received messages as read
        const unread = (msgs ?? []).filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
        if (unread.length) {
          await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread);
        }
      }

      // Realtime: postgres_changes for messages + presence for typing/online
      const ch = supabase
        .channel(`match:${matchId}`, { config: { presence: { key: user.id } } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          async (payload) => {
            const m = payload.new as Message;
            setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
            if (m.sender_id !== user.id) {
              await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const m = payload.new as Message;
            setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          }
        )
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
          if (status === "SUBSCRIBED") {
            await ch.track({ online_at: new Date().toISOString() });
          }
        });
      channelRef.current = ch;
    })();

    return () => {
      active = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [matchId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const onTyping = (val: string) => {
    setInput(val);
    if (!channelRef.current || !me) return;
    if (typingTimeout.current) return; // throttle
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { user: me } });
    typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 1500);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !me) return;
    setInput("");
    await supabase.from("messages").insert({ match_id: matchId, sender_id: me, content: text });
  };

  const blockUser = async () => {
    if (!me || !otherId) return;
    if (!confirm("Bloquer cet utilisateur ? Vous ne pourrez plus échanger.")) return;
    const { error } = await supabase.from("blocks").insert({ blocker: me, blocked: otherId });
    if (error) toast.error(error.message);
    else {
      toast.success("Utilisateur bloqué");
      navigate({ to: "/app/messages" });
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !otherId) return;
    const { error } = await supabase.from("reports").insert({
      reporter: me, reported: otherId, reason: reportReason,
      details: reportDetails || null, match_id: matchId,
    });
    if (error) { toast.error(error.message); return; }
    setReportOpen(false);
    setReportDetails("");
    toast.success("Signalement envoyé. Merci de protéger la communauté.");
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col rounded-3xl glass-strong overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <Link to="/app/messages" className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
          {other?.avatar_url && <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />}
          {otherOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />}
        </div>
        <div className="flex-1">
          <div className="font-display text-lg font-semibold">{other?.display_name ?? "…"}</div>
          <div className="text-[11px] text-muted-foreground">
            {otherTyping ? "écrit…" : otherOnline ? "en ligne" : "hors ligne"}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="rounded-full p-2 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
              <button onClick={() => { setMenuOpen(false); setReportOpen(true); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Signaler
              </button>
              <button onClick={() => { setMenuOpen(false); blockUser(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted">
                <Ban className="h-4 w-4" />
                Bloquer
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Dites bonjour 💖 et lancez la conversation.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
                      : "bg-muted/40 text-foreground"
                  }`}
                >
                  {m.content}
                </div>
                {mine && (
                  <div className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                    {m.read_at ? (
                      <><CheckCheck className="h-3 w-3 text-[oklch(0.66_0.24_5)]" /> Lu</>
                    ) : (
                      <><Check className="h-3 w-3" /> Envoyé</>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-muted/40 px-4 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border/40 p-3">
        <input
          value={input}
          onChange={(e) => onTyping(e.target.value)}
          placeholder="Écrivez un message…"
          className="flex-1 rounded-full border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow transition hover:scale-105 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

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
