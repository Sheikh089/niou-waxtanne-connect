import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, X, Sparkles, MapPin, Loader2 } from "lucide-react";
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
};

function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: liked } = await supabase.from("likes").select("to_user").eq("from_user", user.id);
      const excluded = [user.id, ...(liked?.map((l) => l.to_user) ?? [])];
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, bio, age, city, country, avatar_url, interests")
        .not("id", "in", `(${excluded.join(",")})`)
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.66_0.24_5)]" />
      </div>
    );
  }

  const current = profiles[index];

  if (!current) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass-strong">
          <Sparkles className="h-8 w-8 text-gold" />
        </div>
        <h2 className="font-display text-2xl font-bold">Vous avez tout vu</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Revenez bientôt — de nouveaux profils inspirants rejoignent Niou Waxtanne chaque jour.
        </p>
      </div>
    );
  }

  return (
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
  );
}
