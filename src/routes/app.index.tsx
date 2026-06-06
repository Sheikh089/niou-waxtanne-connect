import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, X, Sparkles, MapPin, Loader2, LayoutGrid, Flame, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  component: Discover,
});

type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  is_premium?: boolean;
  is_verified?: boolean;
};

function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"swipe" | "grid">("grid");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: liked }, { data: blocked }] = await Promise.all([
        supabase.from("likes").select("to_user").eq("from_user", user.id),
        supabase.from("blocks").select("blocked").eq("blocker", user.id),
      ]);
      const excludedForSwipe = [
        user.id,
        ...(liked?.map((l) => l.to_user) ?? []),
        ...(blocked?.map((b) => b.blocked) ?? []),
      ];

      // All published ads (active profiles, onboarded), excluding self & blocked
      const { data: all } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests, is_premium, is_verified")
        .eq("onboarding_completed", true)
        .eq("status", "active")
        .neq("id", user.id)
        .order("is_premium", { ascending: false })
        .order("last_seen", { ascending: false })
        .limit(200);

      const blockedIds = new Set(blocked?.map((b) => b.blocked) ?? []);
      const allFiltered = (all ?? []).filter((p) => !blockedIds.has(p.id)) as Profile[];
      setAllProfiles(allFiltered);

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests, is_premium, is_verified")
        .eq("onboarding_completed", true)
        .eq("status", "active")
        .not("id", "in", `(${excludedForSwipe.join(",")})`)
        .limit(30);
      setProfiles((data ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);


  const swipe = async (isLike: boolean) => {
    const current = profiles[index];
    if (!current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user: user.id,
      to_user: current.id,
      is_like: isLike,
    });
    if (error) {
      toast.error("Action impossible");
      return;
    }
    if (isLike) {
      const { data: m } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a.eq.${user.id},user_b.eq.${current.id}),and(user_a.eq.${current.id},user_b.eq.${user.id})`)
        .maybeSingle();
      if (m) toast.success(`✨ Match avec ${current.display_name} !`);
    }
    setIndex((i) => i + 1);
  };

  const likeFromGrid = async (target: Profile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user: user.id,
      to_user: target.id,
      is_like: true,
    });
    if (error) {
      toast.error("Déjà envoyé ou action impossible");
      return;
    }
    toast.success(`💖 Like envoyé à ${target.display_name}`);
    const { data: m } = await supabase
      .from("matches")
      .select("id")
      .or(`and(user_a.eq.${user.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${user.id})`)
      .maybeSingle();
    if (m) toast.success(`✨ Match avec ${target.display_name} !`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.66_0.24_5)]" />
      </div>
    );
  }

  const current = profiles[index];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Toggle */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setView("grid")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            view === "grid"
              ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
              : "glass-strong text-muted-foreground hover:text-white"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Toutes les annonces
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{allProfiles.length}</span>
        </button>
        <button
          onClick={() => setView("swipe")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            view === "swipe"
              ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
              : "glass-strong text-muted-foreground hover:text-white"
          }`}
        >
          <Flame className="h-4 w-4" />
          Découvrir
        </button>
      </div>

      {view === "grid" ? (
        allProfiles.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass-strong">
              <Sparkles className="h-8 w-8 text-gold" />
            </div>
            <h2 className="font-display text-2xl font-bold">Aucune annonce pour le moment</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Revenez bientôt — de nouveaux profils rejoignent Niou Waxtanne chaque jour.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {allProfiles.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl glass-strong shadow-glow transition hover:scale-[1.02]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.display_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Heart className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                  {p.is_premium && (
                    <span className="absolute left-2 top-2 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold text-black">
                      PREMIUM
                    </span>
                  )}
                  {p.is_verified && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-12">
                    <h3 className="font-display text-base font-bold text-white">
                      {p.display_name}{p.age ? `, ${p.age}` : ""}
                    </h3>
                    {(p.city || p.country) && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                        <MapPin className="h-3 w-3" />
                        {[p.city, p.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <button
                      onClick={() => likeFromGrid(p)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Heart className="h-3.5 w-3.5 fill-white" /> Like
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : !current ? (
        <div className="flex h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass-strong">
            <Sparkles className="h-8 w-8 text-gold" />
          </div>
          <h2 className="font-display text-2xl font-bold">Vous avez tout vu</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Revenez bientôt — de nouveaux profils inspirants rejoignent Niou Waxtanne chaque jour.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-3xl glass-strong shadow-glow">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt={current.display_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Heart className="h-24 w-24 text-white/30" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-32">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-white">
                      {current.display_name}{current.age ? `, ${current.age}` : ""}
                    </h2>
                    {(current.city || current.country) && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                        <MapPin className="h-3.5 w-3.5" />
                        {[current.city, current.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {current.bio && <p className="mt-3 text-sm text-white/90">{current.bio}</p>}
                {current.interests && current.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {current.interests.slice(0, 5).map((i) => (
                      <span key={i} className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white backdrop-blur">{i}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => swipe(false)}
              className="flex h-16 w-16 items-center justify-center rounded-full glass-strong text-muted-foreground transition hover:scale-110 hover:text-white"
            >
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={() => swipe(true)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow transition hover:scale-110"
            >
              <Heart className="h-9 w-9 fill-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
