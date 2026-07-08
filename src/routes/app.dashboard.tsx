import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Heart, Star, MessageCircle, X, BadgeCheck, MapPin, Sparkles,
  Crown, Zap, Camera, User, Briefcase, Tag, ShieldCheck, ArrowRight,
  Flame, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
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
  is_premium: boolean;
  is_verified: boolean;
  last_seen: string | null;
};

type Me = {
  id: string;
  display_name: string | null;
  bio: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  is_verified: boolean;
  is_premium: boolean;
  looking_for: string | null;
  gender: string | null;
};

type RecentMatch = {
  id: string;
  created_at: string;
  other: Profile | null;
};

const PLANS = [
  { key: "basic", name: "Basic", price: "2 500 FCFA", perks: ["Likes illimités", "Voir qui vous aime"] },
  { key: "gold", name: "Gold", price: "6 000 FCFA", perks: ["Tout Basic", "Mise en avant", "Filtres avancés"], featured: true },
  { key: "vip", name: "VIP", price: "12 000 FCFA", perks: ["Tout Gold", "Badge VIP", "Boost quotidien"] },
];

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [recos, setRecos] = useState<Profile[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, { data: liked }, { data: blocked }, { data: ms }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("likes").select("to_user").eq("from_user", user.id),
        supabase.from("blocks").select("blocked").eq("blocker", user.id),
        supabase
          .from("matches")
          .select("id, user_a, user_b, created_at")
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (prof) setMe(prof as Me);
      const likedSet = new Set(liked?.map((l) => l.to_user) ?? []);
      setLikedIds(likedSet);
      const excluded = [user.id, ...likedSet, ...(blocked?.map((b) => b.blocked) ?? [])];

      const { data: candidates } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests, is_premium, is_verified, last_seen")
        .eq("onboarding_completed", true)
        .eq("status", "active")
        .not("id", "in", `(${excluded.join(",")})`)
        .order("is_premium", { ascending: false })
        .order("last_seen", { ascending: false })
        .limit(24);
      setRecos((candidates ?? []) as Profile[]);

      if (ms?.length) {
        const otherIds = ms.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
        const { data: others } = await supabase
          .from("profiles")
          .select("id, display_name, bio, age, city, country, avatar_url, interests, is_premium, is_verified, last_seen")
          .in("id", otherIds);
        const map = new Map((others ?? []).map((o) => [o.id, o as Profile]));
        setRecentMatches(
          ms.map((m) => ({
            id: m.id,
            created_at: m.created_at,
            other: map.get(m.user_a === user.id ? m.user_b : m.user_a) ?? null,
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const completion = useMemo(() => {
    if (!me) return { pct: 0, missing: [] as { label: string; icon: typeof Camera }[] };
    const checks: { ok: boolean; label: string; icon: typeof Camera }[] = [
      { ok: !!me.avatar_url, label: "Photo principale", icon: Camera },
      { ok: !!(me.bio && me.bio.length > 20), label: "Bio détaillée", icon: User },
      { ok: !!me.looking_for, label: "Profession / objectif", icon: Briefcase },
      { ok: !!(me.interests && me.interests.length >= 3), label: "Centres d'intérêt", icon: Tag },
      { ok: !!me.city, label: "Ville", icon: MapPin },
      { ok: me.is_verified, label: "Vérification", icon: ShieldCheck },
    ];
    const ok = checks.filter((c) => c.ok).length;
    return {
      pct: Math.round((ok / checks.length) * 100),
      missing: checks.filter((c) => !c.ok).map(({ label, icon }) => ({ label, icon })),
    };
  }, [me]);

  const compatibility = (other: Profile) => {
    if (!me) return 60;
    let score = 50;
    const myInt = new Set((me.interests ?? []).map((i) => i.toLowerCase()));
    const theirInt = (other.interests ?? []).map((i) => i.toLowerCase());
    const shared = theirInt.filter((i) => myInt.has(i)).length;
    score += Math.min(shared * 8, 30);
    if (me.city && other.city && me.city.toLowerCase() === other.city.toLowerCase()) score += 10;
    if (me.country && other.country && me.country === other.country) score += 5;
    if (me.age && other.age && Math.abs(me.age - other.age) <= 5) score += 5;
    return Math.min(99, score);
  };

  const sendLike = async (target: Profile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user: user.id, to_user: target.id, is_like: true,
    });
    if (error) { toast.error("Action impossible"); return; }
    setLikedIds((s) => new Set(s).add(target.id));
    setRecos((r) => r.filter((p) => p.id !== target.id));
    toast.success(`💖 Like envoyé à ${target.display_name}`);
  };

  const pass = (target: Profile) => {
    setRecos((r) => r.filter((p) => p.id !== target.id));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.66_0.24_5)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-8 shadow-elegant">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[oklch(0.66_0.24_5/0.3)] blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-[oklch(0.88_0.17_90/0.2)] blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-[oklch(0.66_0.24_5)] sm:h-20 sm:w-20">
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)]">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              {me?.is_verified && (
                <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 ring-2 ring-background">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Bienvenue</p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {me?.display_name ?? "—"}
                {me?.is_premium && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 align-middle text-[10px] font-bold text-gold-foreground">
                    <Crown className="h-3 w-3" /> PREMIUM
                  </span>
                )}
              </h1>
              {(me?.city || me?.country) && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[me?.city, me?.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
            <Stat icon={Heart} label="Matchs" value={recentMatches.length} />
            <Stat icon={Sparkles} label="Suggestions" value={recos.length} />
            <Stat icon={Flame} label="Profil" value={`${completion.pct}%`} />
          </div>
        </div>
      </section>

      {/* Profile completion + Premium upsell */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Completion */}
        <div className="relative overflow-hidden rounded-3xl glass-strong p-6 shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Profil</p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Votre profil est à <span className="text-gradient-romantic">{completion.pct}%</span>
              </h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white font-bold">
              {completion.pct}%
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.88_0.17_90)] transition-all"
              style={{ width: `${completion.pct}%` }}
            />
          </div>
          {completion.missing.length > 0 ? (
            <>
              <p className="mt-4 text-xs text-muted-foreground">Informations manquantes :</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {completion.missing.map((m) => (
                  <li key={m.label} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs">
                    <m.icon className="h-3.5 w-3.5 text-[oklch(0.66_0.24_5)]" /> {m.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-emerald-400">✓ Profil complet, parfait !</p>
          )}
          <button
            onClick={() => navigate({ to: "/app/profile" })}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:scale-[1.02]"
          >
            Compléter mon profil <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Premium */}
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[oklch(0.22_0.04_5)] via-[oklch(0.18_0.02_20)] to-[oklch(0.16_0.012_20)] p-6 shadow-elegant">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-500">
              <Crown className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Premium</p>
              <h2 className="font-display text-xl font-bold">Passez à la vitesse supérieure</h2>
            </div>
          </div>
          <ul className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            {["Likes illimités","Voir qui vous aime","Mise en avant","Filtres avancés","Badge Premium","Boost gratuit"].map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-muted-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-gold" /> {p}
              </li>
            ))}
          </ul>
          <div className="relative mt-5 grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-3 text-center ${
                  plan.featured
                    ? "border-gold/60 bg-gold/10 shadow-[0_0_30px_oklch(0.88_0.17_90/0.2)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                <p className="mt-1 text-sm font-bold">{plan.price}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate({ to: "/app/premium" })}
            className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-5 py-2.5 text-sm font-bold text-gold-foreground transition hover:scale-[1.02]"
          >
            <Zap className="h-4 w-4" /> Passer Premium
          </button>

        </div>
      </section>

      {/* Recommandations */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Pour vous</p>
            <h2 className="font-display text-2xl font-bold">Notre sélection</h2>
          </div>
          <Link to="/app" className="text-xs text-[oklch(0.66_0.24_5)] hover:underline">
            Tout voir →
          </Link>
        </div>

        {recos.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-3xl glass-strong text-center">
            <Sparkles className="mb-2 h-8 w-8 text-gold" />
            <p className="text-sm text-muted-foreground">Aucune recommandation pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recos.slice(0, 8).map((p) => {
              const score = compatibility(p);
              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-3xl glass-strong shadow-elegant transition hover:scale-[1.02] hover:shadow-glow"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.display_name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Heart className="h-12 w-12 text-white/30" />
                      </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute inset-x-2 top-2 flex items-start justify-between">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        💞 {score}%
                      </span>
                      <div className="flex gap-1">
                        {p.is_premium && (
                          <span className="flex h-6 items-center rounded-full bg-gold/90 px-1.5 text-[10px] font-bold text-gold-foreground">
                            <Crown className="h-3 w-3" />
                          </span>
                        )}
                        {p.is_verified && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                            <BadgeCheck className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 pt-12">
                      <h3 className="font-display text-base font-bold text-white">
                        {p.display_name}{p.age ? `, ${p.age}` : ""}
                      </h3>
                      {(p.city || p.country) && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                          <MapPin className="h-3 w-3" />
                          {[p.city, p.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); pass(p); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
                        title="Passer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.success("⭐ Ajouté aux favoris (bientôt)"); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-gold-foreground hover:scale-110"
                        title="Favori"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.info("Likez d'abord pour discuter"); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
                        title="Message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); sendLike(p); }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow hover:scale-110"
                        title="J'aime"
                      >
                        <Heart className="h-5 w-5 fill-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Matchs récents */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Récents</p>
            <h2 className="font-display text-2xl font-bold">Vos derniers matchs</h2>
          </div>
          <Link to="/app/matches" className="text-xs text-[oklch(0.66_0.24_5)] hover:underline">
            Voir tous les matchs →
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-3xl glass-strong text-sm text-muted-foreground">
            Aucun match pour le moment — continuez à découvrir des profils !
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recentMatches.map((m) => {
              if (!m.other) return null;
              const days = Math.max(0, Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000));
              const score = compatibility(m.other);
              return (
                <Link
                  key={m.id}
                  to="/app/messages/$matchId"
                  params={{ matchId: m.id }}
                  className="group relative overflow-hidden rounded-2xl glass-strong shadow-elegant transition hover:scale-[1.03] hover:shadow-glow"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                    {m.other.avatar_url ? (
                      <img src={m.other.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Heart className="h-8 w-8 text-white/30" />
                      </div>
                    )}
                  </div>
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {score}%
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-2">
                    <p className="truncate text-xs font-semibold text-white">{m.other.display_name}</p>
                    <p className="text-[10px] text-white/70">
                      {days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : `Il y a ${days}j`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <Icon className="mx-auto mb-1 h-4 w-4 text-[oklch(0.66_0.24_5)]" />
      <p className="font-display text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
