import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nouveau mot de passe — Niou Waxtanne" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase emits PASSWORD_RECOVERY after the user lands here from the email link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also accept already-active recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour 💖");
    navigate({ to: "/app" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.66_0.24_5)] opacity-30 blur-[120px]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <img src={logo} alt="Niou Waxtanne" className="h-12 w-auto" />
          <span className="font-display text-2xl font-bold">
            Niou <span className="text-gradient-romantic">Waxtanne</span>
          </span>
        </Link>
        <div className="w-full rounded-3xl glass-strong p-8">
          <h1 className="font-display text-3xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Choisissez un nouveau mot de passe sécurisé."
              : "Ouvrez le lien reçu par email pour activer cet écran."}
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={!ready}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 pl-10 text-sm outline-none focus:border-[oklch(0.66_0.24_5)] disabled:opacity-50"
                placeholder="Nouveau mot de passe"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              Mettre à jour
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link to="/auth" className="text-gold hover:underline">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
