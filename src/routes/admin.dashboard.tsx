import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield, LogOut, Users, Heart, MessageCircle, Flag, BadgeCheck,
  UserPlus, Activity, ScrollText, Loader2,
} from "lucide-react";

type AdminRole = "super_admin" | "admin" | "moderator" | "support";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Admin Niou Waxtanne" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminDashboardPage,
});

const IDLE_MS = 30 * 60 * 1000; // 30 min

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [email, setEmail] = useState<string>("");
  const idleRef = useRef<number | null>(null);

  // Auth + role check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancelled) return;
      if (!r || r.length === 0) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setRoles(r.map((x) => x.role as AdminRole));
      setEmail(user.email ?? "");
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  // Idle auto-logout
  useEffect(() => {
    if (checking) return;
    const reset = () => {
      if (idleRef.current) window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(async () => {
        toast.info("Déconnexion automatique pour inactivité");
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
      }, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (idleRef.current) window.clearTimeout(idleRef.current);
    };
  }, [checking, navigate]);

  async function onLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
      </div>
    );
  }

  const primaryRole = roles.includes("super_admin") ? "Super Admin"
    : roles.includes("admin") ? "Admin"
    : roles.includes("moderator") ? "Modérateur" : "Support";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white">
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Niou Waxtanne — Admin</div>
              <div className="text-xs text-zinc-500">{email} · <span className="text-pink-400">{primaryRole}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-zinc-900">
              Voir le site
            </Link>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-zinc-400">Vue d'ensemble de la plateforme en temps réel</p>
        </div>

        <StatsGrid />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLogins />
          <ComingSoon />
        </div>
      </main>
    </div>
  );
}

function StatsGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();
      const [users, newToday, matches, messages, verified, premium] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      ]);
      return {
        users: users.count ?? 0,
        newToday: newToday.count ?? 0,
        matches: matches.count ?? 0,
        messages: messages.count ?? 0,
        verified: verified.count ?? 0,
        premium: premium.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const cards = useMemo(() => [
    { label: "Utilisateurs", value: data?.users ?? 0, icon: Users, color: "from-pink-500 to-fuchsia-600" },
    { label: "Inscriptions aujourd'hui", value: data?.newToday ?? 0, icon: UserPlus, color: "from-fuchsia-500 to-purple-600" },
    { label: "Matchs", value: data?.matches ?? 0, icon: Heart, color: "from-rose-500 to-pink-600" },
    { label: "Messages", value: data?.messages ?? 0, icon: MessageCircle, color: "from-pink-500 to-rose-600" },
    { label: "Vérifiés", value: data?.verified ?? 0, icon: BadgeCheck, color: "from-emerald-500 to-teal-600" },
    { label: "Premium actifs", value: data?.premium ?? 0, icon: Activity, color: "from-amber-500 to-orange-600" },
  ], [data]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 hover:border-zinc-700 transition">
          <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} shadow-lg`}>
            <c.icon className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {isLoading ? <span className="text-zinc-700">—</span> : c.value.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function RecentLogins() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-recent-logins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_login_logs")
        .select("id,email,success,ip_address,created_at,reason")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    refetchInterval: 60000,
  });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="h-4 w-4 text-pink-400" />
        <h2 className="text-sm font-semibold">Journal des connexions admin</h2>
      </div>
      {isLoading ? (
        <div className="text-xs text-zinc-500">Chargement…</div>
      ) : data && data.length > 0 ? (
        <ul className="divide-y divide-zinc-900">
          {data.map((l) => (
            <li key={l.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="min-w-0">
                <div className="truncate text-white">{l.email}</div>
                <div className="text-zinc-500">
                  {new Date(l.created_at).toLocaleString("fr-FR")} · {l.ip_address ?? "—"}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${l.success ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                {l.success ? "OK" : (l.reason ?? "Échec")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-zinc-500">Aucune connexion enregistrée.</div>
      )}
    </div>
  );
}

function ComingSoon() {
  const modules = [
    { icon: Users, label: "Utilisateurs", desc: "Recherche, suspension, vérification" },
    { icon: Flag, label: "Modération", desc: "Signalements & actions" },
    { icon: BadgeCheck, label: "Vérification", desc: "Validation identité" },
    { icon: Activity, label: "Analytics", desc: "Graphiques temps réel" },
  ];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="text-sm font-semibold mb-4">Prochains modules</h2>
      <ul className="grid grid-cols-2 gap-3">
        {modules.map((m) => (
          <li key={m.label} className="rounded-xl border border-zinc-900 bg-black/40 p-3">
            <m.icon className="h-4 w-4 text-pink-400" />
            <div className="mt-2 text-xs font-semibold text-white">{m.label}</div>
            <div className="text-[11px] text-zinc-500">{m.desc}</div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-zinc-600">
        Les fondations (auth, rôles, journalisation) sont en place. Demande-moi le module suivant à construire.
      </p>
    </div>
  );
}
