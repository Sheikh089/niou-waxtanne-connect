import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Heart, X, Sparkles, MapPin, Loader2, LayoutGrid, Flame, BadgeCheck,
  Search, SlidersHorizontal, Crown, Star, MessageCircle, Undo2, Zap,
} from "lucide-react";
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
  gender: string | null;
  looking_for: string | null;
  is_premium?: boolean;
  is_verified?: boolean;
};

type SortKey = "recent" | "premium" | "verified" | "young" | "old";

const GENDER_OPTIONS = [
  { key: "all", label: "Tous" },
  { key: "female", label: "Femmes" },
  { key: "male", label: "Hommes" },
  { key: "other", label: "Autre" },
] as const;

function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"swipe" | "grid">("grid");

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]["key"]>("all");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 65]);
  const [cityFilter, setCityFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [withPhoto, setWithPhoto] = useState(true);
  const [sort, setSort] = useState<SortKey>("recent");

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

      const { data: all } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests, gender, looking_for, is_premium, is_verified")
        .eq("onboarding_completed", true)
        .eq("status", "active")
        .neq("id", user.id)
        .order("is_premium", { ascending: false })
        .order("last_seen", { ascending: false })
        .limit(300);

      const blockedIds = new Set(blocked?.map((b) => b.blocked) ?? []);
      const allFiltered = (all ?? []).filter((p) => !blockedIds.has(p.id)) as Profile[];
      setAllProfiles(allFiltered);

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests, gender, looking_for, is_premium, is_verified")
        .eq("onboarding_completed", true)
        .eq("status", "active")
        .not("id", "in", `(${excludedForSwipe.join(",")})`)
        .limit(30);
      setProfiles((data ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    allProfiles.forEach((p) => p.city && set.add(p.city));
    return Array.from(set).sort();
  }, [allProfiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allProfiles.filter((p) => {
      if (withPhoto && !p.avatar_url) return false;
      if (verifiedOnly && !p.is_verified) return false;
      if (premiumOnly && !p.is_premium) return false;
      if (gender !== "all" && p.gender !== gender) return false;
      if (cityFilter && p.city !== cityFilter) return false;
      if (p.age != null && (p.age < ageRange[0] || p.age > ageRange[1])) return false;
      if (q) {
        const hay = [p.display_name, p.bio, p.city, p.country, ...(p.interests ?? [])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (sort) {
      case "premium": list = [...list].sort((a, b) => Number(b.is_premium) - Number(a.is_premium)); break;
      case "verified": list = [...list].sort((a, b) => Number(b.is_verified) - Number(a.is_verified)); break;
      case "young": list = [...list].sort((a, b) => (a.age ?? 999) - (b.age ?? 999)); break;
      case "old": list = [...list].sort((a, b) => (b.age ?? 0) - (a.age ?? 0)); break;
      default: break;
    }
    return list;
  }, [allProfiles, search, gender, ageRange, cityFilter, verifiedOnly, premiumOnly, withPhoto, sort]);

  const activeFiltersCount =
    (verifiedOnly ? 1 : 0) +
    (premiumOnly ? 1 : 0) +
    (gender !== "all" ? 1 : 0) +
    (cityFilter ? 1 : 0) +
    (ageRange[0] !== 18 || ageRange[1] !== 65 ? 1 : 0) +
    (!withPhoto ? 0 : 0);

  const resetFilters = () => {
    setSearch(""); setGender("all"); setAgeRange([18, 65]);
    setCityFilter(""); setVerifiedOnly(false); setPremiumOnly(false);
    setWithPhoto(true); setSort("recent");
  };

  const swipe = async (isLike: boolean, superLike = false) => {
    const current = profiles[index];
    if (!current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user: user.id, to_user: current.id, is_like: isLike,
    });
    if (error) { toast.error("Action impossible"); return; }
    if (isLike) {
      if (superLike) toast.success(`⭐ Super Like envoyé à ${current.display_name}`);
      const { data: m } = await supabase
        .from("matches").select("id")
        .or(`and(user_a.eq.${user.id},user_b.eq.${current.id}),and(user_a.eq.${current.id},user_b.eq.${user.id})`)
        .maybeSingle();
      if (m) toast.success(`✨ Match avec ${current.display_name} !`);
    }
    setHistory((h) => [...h, index]);
    setIndex((i) => i + 1);
  };

  const undo = () => {
    if (!history.length) { toast.info("Rien à annuler"); return; }
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setIndex(last);
    toast.info("Action annulée");
  };

  const likeFromGrid = async (target: Profile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user: user.id, to_user: target.id, is_like: true,
    });
    if (error) { toast.error("Déjà envoyé ou action impossible"); return; }
    toast.success(`💖 Like envoyé à ${target.display_name}`);
    const { data: m } = await supabase.from("matches").select("id")
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Découvrir</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              <span className="text-gradient-romantic">{filtered.length}</span> profils à rencontrer
            </h1>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-full glass-strong p-1">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                view === "grid" ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grille
            </button>
            <button
              onClick={() => setView("swipe")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                view === "swipe" ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow" : "text-muted-foreground"
              }`}
            >
              <Flame className="h-3.5 w-3.5" /> Swipe
            </button>
          </div>
        </div>

        {view === "grid" && (
          <>
            {/* Search + filter toggle */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, ville, centre d'intérêt…"
                  className="w-full rounded-full glass-strong py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[oklch(0.66_0.24_5)]"
                />
              </div>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
                    : "glass-strong text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGender(g.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    gender === g.key
                      ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white"
                      : "glass-strong text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.label}
                </button>
              ))}
              <button
                onClick={() => setVerifiedOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  verifiedOnly ? "bg-blue-500 text-white" : "glass-strong text-muted-foreground hover:text-foreground"
                }`}
              >
                <BadgeCheck className="h-3.5 w-3.5" /> Vérifiés
              </button>
              <button
                onClick={() => setPremiumOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  premiumOnly ? "bg-gradient-to-r from-gold to-amber-500 text-gold-foreground" : "glass-strong text-muted-foreground hover:text-foreground"
                }`}
              >
                <Crown className="h-3.5 w-3.5" /> Premium
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="rounded-3xl glass-strong p-5 shadow-elegant">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Age */}
                  <div>
                    <label className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                      Âge <span className="font-mono text-foreground">{ageRange[0]} – {ageRange[1]}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={18} max={80} value={ageRange[0]}
                        onChange={(e) => setAgeRange([Math.min(Number(e.target.value), ageRange[1]), ageRange[1]])}
                        className="w-full accent-[oklch(0.66_0.24_5)]"
                      />
                      <input
                        type="range" min={18} max={80} value={ageRange[1]}
                        onChange={(e) => setAgeRange([ageRange[0], Math.max(Number(e.target.value), ageRange[0])])}
                        className="w-full accent-[oklch(0.66_0.24_5)]"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Ville</label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full rounded-full bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.66_0.24_5)]"
                    >
                      <option value="">Toutes les villes</option>
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Trier par</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="w-full rounded-full bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.66_0.24_5)]"
                    >
                      <option value="recent">Plus récents</option>
                      <option value="premium">Premium d'abord</option>
                      <option value="verified">Vérifiés d'abord</option>
                      <option value="young">Du plus jeune</option>
                      <option value="old">Du plus âgé</option>
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox" checked={withPhoto}
                        onChange={(e) => setWithPhoto(e.target.checked)}
                        className="h-4 w-4 accent-[oklch(0.66_0.24_5)]"
                      />
                      Avec photo uniquement
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      {view === "grid" ? (
        filtered.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass-strong">
              <Sparkles className="h-8 w-8 text-gold" />
            </div>
            <h2 className="font-display text-2xl font-bold">Aucun profil ne correspond</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Essayez d'élargir vos critères ou de réinitialiser les filtres.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-2 text-sm font-medium text-white"
              >
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl glass-strong shadow-elegant transition hover:scale-[1.02] hover:shadow-glow"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.display_name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Heart className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-x-2 top-2 flex items-start justify-between">
                    {p.is_premium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                        <Crown className="h-3 w-3" /> PREMIUM
                      </span>
                    ) : <span />}
                    {p.is_verified && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                        <BadgeCheck className="h-4 w-4" />
                      </span>
                    )}
                  </div>
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
                    <div className="mt-2 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => likeFromGrid(p)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] py-1.5 text-xs font-medium text-white"
                      >
                        <Heart className="h-3.5 w-3.5 fill-white" /> Like
                      </button>
                      <button
                        onClick={() => toast.info("Likez d'abord pour discuter")}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
                        title="Message"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
              <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                {current.is_premium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-bold text-gold-foreground">
                    <Crown className="h-3 w-3" /> PREMIUM
                  </span>
                )}
                <span className="ml-auto rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                  {index + 1} / {profiles.length}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-32">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-3xl font-bold text-white">
                      {current.display_name}{current.age ? `, ${current.age}` : ""}
                      {current.is_verified && <BadgeCheck className="h-5 w-5 text-blue-400" />}
                    </h2>
                    {(current.city || current.country) && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                        <MapPin className="h-3.5 w-3.5" />
                        {[current.city, current.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {current.bio && <p className="mt-3 text-sm text-white/90 line-clamp-3">{current.bio}</p>}
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

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={undo}
              className="flex h-12 w-12 items-center justify-center rounded-full glass-strong text-amber-400 transition hover:scale-110"
              title="Annuler"
            >
              <Undo2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => swipe(false)}
              className="flex h-16 w-16 items-center justify-center rounded-full glass-strong text-muted-foreground transition hover:scale-110 hover:text-white"
              title="Passer"
            >
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={() => swipe(true, true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-glow transition hover:scale-110"
              title="Super Like"
            >
              <Star className="h-6 w-6 fill-white" />
            </button>
            <button
              onClick={() => swipe(true)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow transition hover:scale-110"
              title="J'aime"
            >
              <Heart className="h-9 w-9 fill-white" />
            </button>
            <button
              onClick={() => toast.info("Boost bientôt disponible 💎")}
              className="flex h-12 w-12 items-center justify-center rounded-full glass-strong text-gold transition hover:scale-110"
              title="Boost"
            >
              <Zap className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
