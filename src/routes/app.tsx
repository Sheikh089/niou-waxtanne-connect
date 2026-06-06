import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { Heart, MessageCircle, User, LogOut, Flame, Bell, BellOff, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationPermission, useMessagePushNotifications } from "@/hooks/use-push-notifications";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const { perm, request: requestNotif } = useNotificationPermission();
  useMessagePushNotifications(user?.id ?? null);

  const enableNotifs = async () => {
    const result = await requestNotif();
    if (result === "granted") toast.success("Notifications activées 🔔");
    else if (result === "denied") toast.error("Notifications refusées. Activez-les dans les réglages du navigateur.");
    else if (result === "unsupported") toast.error("Votre navigateur ne supporte pas les notifications.");
  };


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setOnboarded(data?.onboarding_completed ?? false));
  }, [user, pathname]);

  // Gate: force redirect to profile until onboarding is completed
  useEffect(() => {
    if (onboarded === false && pathname !== "/app/profile") {
      navigate({ to: "/app/profile" });
    }
  }, [onboarded, pathname, navigate]);

  if (loading || !user || onboarded === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.88_0.17_90)]" />
      </div>
    );
  }

  const tabs = [
    { to: "/app/dashboard", label: "Accueil", icon: LayoutDashboard, exact: false },
    { to: "/app", label: "Découvrir", icon: Flame, exact: true },
    { to: "/app/matches", label: "Matchs", icon: Heart, exact: false },
    { to: "/app/messages", label: "Messages", icon: MessageCircle, exact: false },
    { to: "/app/profile", label: "Profil", icon: User, exact: false },
  ];

  const showNav = onboarded;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-auto" />
            <span className="font-display text-lg font-bold">
              Niou <span className="text-gradient-romantic">Waxtanne</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {perm !== "unsupported" && (
              <button
                onClick={enableNotifs}
                title={perm === "granted" ? "Notifications activées" : "Activer les notifications"}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-muted ${
                  perm === "granted" ? "text-[oklch(0.66_0.24_5)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {perm === "granted" ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">
                  {perm === "granted" ? "Notifications" : "Activer alertes"}
                </span>
              </button>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Quitter
            </button>
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {showNav && (
        <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full glass-strong px-2 py-2 shadow-glow">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
