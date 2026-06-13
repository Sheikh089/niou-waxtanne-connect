import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Niou Waxtanne" },
      { name: "description", content: "Rejoignez Niou Waxtanne, l'app de rencontres africaines premium." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email pour confirmer.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue 💖");
        navigate({ to: "/app" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Email envoyé. Vérifiez votre boîte de réception.");
        setMode("signin");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error) {
      toast.error("Connexion Google impossible");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.66_0.24_5)] opacity-30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[oklch(0.88_0.17_90)] opacity-20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <img src={logo} alt="Niou Waxtanne" className="h-12 w-auto drop-shadow-[0_0_20px_oklch(0.66_0.24_5/0.5)]" />
          <span className="font-display text-2xl font-bold">
            Niou <span className="text-gradient-romantic">Waxtanne</span>
          </span>
        </Link>

        <div className="w-full rounded-3xl glass-strong p-8">
          <h1 className="font-display text-3xl font-bold">
            {mode === "signin" && "Bon retour parmi nous"}
            {mode === "signup" && "Créez votre histoire"}
            {mode === "forgot" && "Mot de passe oublié"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" && "Connectez-vous pour retrouver vos matchs."}
            {mode === "signup" && "Rejoignez la communauté premium."}
            {mode === "forgot" && "Saisissez votre email, nous vous enverrons un lien."}
          </p>

          {mode !== "forgot" && (
            <>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => oauth()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou email <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prénom</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]"
                  placeholder="Aminata"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 pl-10 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]"
                  placeholder="vous@email.com"
                />
              </div>
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 pl-10 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]"
                    placeholder="••••••••"
                  />
                </div>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="mt-2 text-xs text-muted-foreground hover:text-gold hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {mode === "signin" && "Se connecter"}
              {mode === "signup" && "Créer mon compte"}
              {mode === "forgot" && "Envoyer le lien"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <>
                <button onClick={() => setMode("signin")} className="font-medium text-gold hover:underline">
                  Retour à la connexion
                </button>
              </>
            ) : (
              <>
                {mode === "signin" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="font-medium text-gold hover:underline"
                >
                  {mode === "signin" ? "Inscription" : "Connexion"}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
