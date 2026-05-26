import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/matches")({
  component: Matches,
});

type MatchRow = {
  id: string;
  other: { id: string; display_name: string; avatar_url: string | null } | null;
};

function Matches() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ms } = await supabase
        .from("matches")
        .select("id, user_a, user_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (!ms?.length) { setLoading(false); return; }
      const otherIds = ms.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", otherIds);
      const profMap = new Map(profs?.map((p) => [p.id, p]) ?? []);
      setMatches(ms.map((m) => ({
        id: m.id,
        other: profMap.get(m.user_a === user.id ? m.user_b : m.user_a) ?? null,
      })));
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Vos matchs</h1>
      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl glass-strong py-16 text-center">
          <Heart className="mb-3 h-10 w-10 text-[oklch(0.66_0.24_5)]" />
          <p className="font-medium">Aucun match pour le moment</p>
          <p className="mt-1 text-sm text-muted-foreground">Continuez à swiper depuis Découvrir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {matches.map((m) => (
            <Link
              key={m.id}
              to="/app/messages/$matchId"
              params={{ matchId: m.id }}
              className="group relative overflow-hidden rounded-2xl glass-strong transition hover:scale-[1.02]"
            >
              <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                {m.other?.avatar_url ? (
                  <img src={m.other.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Heart className="h-10 w-10 text-white/30" />
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-white">{m.other?.display_name ?? "—"}</span>
                  <MessageCircle className="h-4 w-4 text-white/80" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
