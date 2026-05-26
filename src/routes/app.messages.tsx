import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/messages")({
  component: MessagesLayout,
});

type Conv = {
  matchId: string;
  other: { id: string; display_name: string; avatar_url: string | null };
  lastMessage?: string;
};

function MessagesLayout() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/app/messages";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ms } = await supabase
        .from("matches")
        .select("id, user_a, user_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      if (!ms?.length) return;
      const otherIds = ms.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", otherIds);
      const profMap = new Map(profs?.map((p) => [p.id, p]) ?? []);
      setConversations(ms.map((m) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a;
        const p = profMap.get(otherId);
        return {
          matchId: m.id,
          other: p ?? { id: otherId, display_name: "Anonyme", avatar_url: null },
        };
      }));
    })();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <aside className={`${isDetail ? "hidden md:block" : ""}`}>
        <h1 className="mb-4 font-display text-2xl font-bold">Messages</h1>
        {conversations.length === 0 ? (
          <div className="rounded-2xl glass-strong p-6 text-center text-sm text-muted-foreground">
            Aucune conversation. Matchez d'abord !
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => {
              const active = pathname === `/app/messages/${c.matchId}`;
              return (
                <Link
                  key={c.matchId}
                  to="/app/messages/$matchId"
                  params={{ matchId: c.matchId }}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                    active ? "bg-gradient-to-r from-[oklch(0.66_0.24_5/0.2)] to-transparent" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                    {c.other.avatar_url ? (
                      <img src={c.other.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/40">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.other.display_name}</div>
                    <div className="truncate text-xs text-muted-foreground">Touchez pour discuter</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </aside>
      <section className={`${!isDetail ? "hidden md:block" : ""}`}>
        <Outlet />
      </section>
    </div>
  );
}
