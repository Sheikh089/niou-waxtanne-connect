import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, LogOut, Search, Filter, Loader2, BadgeCheck, Crown,
  Ban, ShieldOff, ShieldCheck, Trash2, Eye, ArrowLeft, X,
} from "lucide-react";
import { adminListUsers, adminGetUser, adminUserAction } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Admin Niou Waxtanne" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminUsersPage,
});

type Filters = {
  search: string;
  city: string;
  gender: "" | "male" | "female" | "other";
  premium: "" | "yes" | "no";
  verified: "" | "yes" | "no";
  status: "" | "active" | "suspended" | "banned";
  ageMin: string;
  ageMax: string;
};

const EMPTY: Filters = {
  search: "", city: "", gender: "", premium: "", verified: "",
  status: "", ageMin: "", ageMax: "",
};

function AdminUsersPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/admin/login" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancelled) return;
      if (!r || r.length === 0) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      setEmail(user.email ?? "");
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const list = useServerFn(adminListUsers);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-users", applied, page],
    queryFn: () => list({
      data: {
        search: applied.search || undefined,
        city: applied.city || undefined,
        gender: applied.gender || undefined,
        premium: applied.premium === "" ? undefined : applied.premium === "yes",
        verified: applied.verified === "" ? undefined : applied.verified === "yes",
        status: applied.status || undefined,
        ageMin: applied.ageMin ? Number(applied.ageMin) : undefined,
        ageMax: applied.ageMax ? Number(applied.ageMax) : undefined,
        page,
        pageSize,
      },
    }),
    enabled: !checking,
  });

  function apply() { setPage(0); setApplied(filters); }
  function reset() { setFilters(EMPTY); setApplied(EMPTY); setPage(0); }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-6 w-6 text-pink-500 animate-spin" /></div>;
  }

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white">
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="h-9 w-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Utilisateurs</div>
              <div className="text-xs text-zinc-500">{email}</div>
            </div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
            <p className="mt-1 text-sm text-zinc-400">{total.toLocaleString("fr-FR")} profil(s)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-pink-400" />
            <h2 className="text-sm font-semibold">Filtres</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Nom ou ville…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:border-pink-500 focus:outline-none"
              />
            </div>
            <input
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              placeholder="Ville"
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
            />
            <select
              value={filters.gender}
              onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value as Filters["gender"] }))}
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">Sexe</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
            <select
              value={filters.premium}
              onChange={(e) => setFilters((f) => ({ ...f, premium: e.target.value as Filters["premium"] }))}
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">Premium</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Filters["status"] }))}
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">Statut</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="banned">Banni</option>
            </select>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-2">
              <input
                value={filters.ageMin}
                onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value.replace(/\D/g, "") }))}
                placeholder="Âge min"
                className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
              />
              <span className="text-zinc-600">–</span>
              <input
                value={filters.ageMax}
                onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value.replace(/\D/g, "") }))}
                placeholder="Âge max"
                className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
              />
            </div>
            <select
              value={filters.verified}
              onChange={(e) => setFilters((f) => ({ ...f, verified: e.target.value as Filters["verified"] }))}
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">Vérifié</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
            <div className="flex gap-2 col-span-2">
              <button onClick={apply} className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-600 text-sm font-medium hover:opacity-90 transition">
                Appliquer
              </button>
              <button onClick={reset} className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sm transition">
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Profil</th>
                  <th className="text-left px-4 py-3 font-medium">Ville</th>
                  <th className="text-left px-4 py-3 font-medium">Âge</th>
                  <th className="text-left px-4 py-3 font-medium">Sexe</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-medium">Badges</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-zinc-500"><Loader2 className="h-5 w-5 mx-auto animate-spin text-pink-500" /></td></tr>
                ) : (data?.rows ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-zinc-500">Aucun utilisateur trouvé.</td></tr>
                ) : data!.rows.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                            {u.display_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{u.display_name}</div>
                          <div className="text-xs text-zinc-500 truncate">{new Date(u.created_at).toLocaleDateString("fr-FR")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{u.city ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.age ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.gender ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status as string} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-400" />}
                        {u.is_premium && <Crown className="h-4 w-4 text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(u.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-900 text-xs text-zinc-500">
            <div>{isFetching && <Loader2 className="h-3 w-3 inline animate-spin mr-1" />}Page {page + 1} / {pages}</div>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">Précédent</button>
              <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">Suivant</button>
            </div>
          </div>
        </div>
      </main>

      {selectedId && <UserDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    suspended: "bg-amber-500/15 text-amber-400",
    banned: "bg-rose-500/15 text-rose-400",
  };
  const labels: Record<string, string> = { active: "Actif", suspended: "Suspendu", banned: "Banni" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-zinc-800 text-zinc-400"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const get = useServerFn(adminGetUser);
  const act = useServerFn(adminUserAction);
  const [reason, setReason] = useState("");
  const [suspendDays, setSuspendDays] = useState("7");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => get({ data: { id } }),
  });

  const m = useMutation({
    mutationFn: (vars: { action: "suspend" | "ban" | "reactivate" | "verify" | "unverify" | "delete" }) =>
      act({
        data: {
          id,
          action: vars.action,
          reason: reason || undefined,
          suspendDays: vars.action === "suspend" ? Number(suspendDays) || 7 : undefined,
        },
      }),
    onSuccess: (_r, vars) => {
      toast.success(`Action « ${vars.action} » effectuée`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      if (vars.action === "delete") onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function confirmAction(action: "suspend" | "ban" | "reactivate" | "verify" | "unverify" | "delete", label: string) {
    if (action === "delete" || action === "ban") {
      if (!window.confirm(`Confirmer : ${label} ?\nCette action est irréversible.`)) return;
    }
    m.mutate({ action });
  }

  const p = data?.profile;
  const verified = !!p?.is_verified;

  return (
    <div className="fixed inset-0 z-50 flex" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-full max-w-2xl h-full bg-zinc-950 border-l border-zinc-800 overflow-y-auto relative">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/95 backdrop-blur">
          <h2 className="text-sm font-semibold">Profil utilisateur</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !p ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin text-pink-500" /></div>
        ) : (
          <div className="p-6 space-y-6 text-white">
            <div className="flex items-start gap-4">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl">{p.display_name?.[0]?.toUpperCase()}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold truncate">{p.display_name}</h3>
                  {p.is_verified && <BadgeCheck className="h-5 w-5 text-emerald-400" />}
                  {p.is_premium && <Crown className="h-5 w-5 text-amber-400" />}
                </div>
                <div className="text-xs text-zinc-500 mt-1">{data.email ?? "—"}</div>
                <div className="mt-2"><StatusBadge status={p.status as string} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Likes" value={data.counts.likes} />
              <Stat label="Matchs" value={data.counts.matches} />
              <Stat label="Messages" value={data.counts.messages} />
              <Stat label="Signalements" value={data.counts.reportsAgainst} highlight={data.counts.reportsAgainst > 0} />
            </div>

            <Section title="Informations">
              <Info label="Âge" value={p.age ?? "—"} />
              <Info label="Sexe" value={p.gender ?? "—"} />
              <Info label="Recherche" value={p.looking_for ?? "—"} />
              <Info label="Ville" value={p.city ?? "—"} />
              <Info label="Pays" value={p.country ?? "—"} />
              <Info label="WhatsApp" value={p.whatsapp ?? "—"} />
              <Info label="Inscrit le" value={new Date(p.created_at).toLocaleString("fr-FR")} />
              <Info label="Dernière connexion" value={data.lastSignInAt ? new Date(data.lastSignInAt).toLocaleString("fr-FR") : "—"} />
            </Section>

            {p.bio && (
              <Section title="Bio">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap col-span-2">{p.bio}</p>
              </Section>
            )}

            {p.interests && p.interests.length > 0 && (
              <Section title="Centres d'intérêt">
                <div className="col-span-2 flex flex-wrap gap-1.5">
                  {p.interests.map((i: string) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-zinc-900 text-xs text-zinc-300">{i}</span>
                  ))}
                </div>
              </Section>
            )}

            {p.photos && p.photos.length > 0 && (
              <Section title="Photos">
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  {p.photos.map((src: string, i: number) => (
                    <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  ))}
                </div>
              </Section>
            )}

            {p.moderation_note && (
              <Section title="Note de modération">
                <p className="text-sm text-amber-300 col-span-2">{p.moderation_note}</p>
              </Section>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4 space-y-3">
              <h4 className="text-sm font-semibold">Actions de modération</h4>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="Motif (optionnel)…"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Suspension (jours)</label>
                <input
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value.replace(/\D/g, ""))}
                  className="w-20 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn onClick={() => confirmAction("suspend", "Suspendre")} disabled={m.isPending} icon={ShieldOff} label="Suspendre" tone="amber" />
                <ActionBtn onClick={() => confirmAction("ban", "Bannir")} disabled={m.isPending} icon={Ban} label="Bannir" tone="rose" />
                <ActionBtn onClick={() => confirmAction("reactivate", "Réactiver")} disabled={m.isPending} icon={ShieldCheck} label="Réactiver" tone="emerald" />
                <ActionBtn
                  onClick={() => confirmAction(verified ? "unverify" : "verify", verified ? "Retirer la vérification" : "Vérifier")}
                  disabled={m.isPending}
                  icon={BadgeCheck}
                  label={verified ? "Retirer vérif." : "Vérifier"}
                  tone="teal"
                />
                <ActionBtn onClick={() => confirmAction("delete", "Supprimer définitivement")} disabled={m.isPending} icon={Trash2} label="Supprimer" tone="rose" full />
              </div>
            </div>

            {data.actions && data.actions.length > 0 && (
              <Section title="Historique des actions">
                <ul className="col-span-2 divide-y divide-zinc-900">
                  {data.actions.map((a) => (
                    <li key={a.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white font-medium">{a.action}</span>
                        {a.reason && <span className="text-zinc-500"> · {a.reason}</span>}
                      </div>
                      <span className="text-zinc-600">{new Date(a.created_at).toLocaleString("fr-FR")}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-rose-500/40 bg-rose-500/5" : "border-zinc-800 bg-black/40"}`}>
      <div className="text-lg font-bold">{value.toLocaleString("fr-FR")}</div>
      <div className="text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border border-zinc-800 bg-black/40 p-4">
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-sm text-white truncate">{value}</div>
    </div>
  );
}

function ActionBtn({
  onClick, disabled, icon: Icon, label, tone, full,
}: {
  onClick: () => void; disabled?: boolean; icon: React.ComponentType<{ className?: string }>;
  label: string; tone: "amber" | "rose" | "emerald" | "teal"; full?: boolean;
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30",
    teal: "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-teal-500/30",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "col-span-2" : ""} inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
