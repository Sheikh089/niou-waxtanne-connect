import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminLoginAttempt } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Shield, Lock, Mail, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administration — Niou Waxtanne" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authed admin, skip
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (roles && roles.length > 0) navigate({ to: "/admin/dashboard" });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        await logAdminLoginAttempt({ data: { email, success: false, reason: error?.message ?? "unknown" } }).catch(() => {});
        toast.error("Identifiants invalides");
        setLoading(false);
        return;
      }
      // Verify admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (!roles || roles.length === 0) {
        await logAdminLoginAttempt({ data: { email, success: false, reason: "no_admin_role" } }).catch(() => {});
        await supabase.auth.signOut();
        toast.error("Accès refusé. Compte non administrateur.");
        setLoading(false);
        return;
      }

      await logAdminLoginAttempt({ data: { email, success: true } }).catch(() => {});
      toast.success("Connexion réussie");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-lg shadow-pink-500/30">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">Administration</h1>
          <p className="mt-2 text-sm text-zinc-400">Espace réservé aux administrateurs Niou Waxtanne</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur p-6 shadow-2xl">
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <div className="mt-1.5 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black/50 pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="email@exemple.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Mot de passe</label>
            <div className="mt-1.5 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black/50 pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:shadow-pink-500/50 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Se connecter
          </button>

          <div className="pt-2 text-center">
            <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">← Retour au site</Link>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Connexion surveillée et journalisée
        </p>
      </div>
    </div>
  );
}
