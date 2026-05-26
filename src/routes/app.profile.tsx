import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    age: "",
    gender: "",
    looking_for: "",
    city: "",
    country: "",
    avatar_url: "",
    interests: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          age: data.age?.toString() ?? "",
          gender: data.gender ?? "",
          looking_for: data.looking_for ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          avatar_url: data.avatar_url ?? "",
          interests: (data.interests ?? []).join(", "),
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name,
        bio: form.bio || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        looking_for: form.looking_for || null,
        city: form.city || null,
        country: form.country || null,
        avatar_url: form.avatar_url || null,
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profil enregistré 💖");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const field = "w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]";
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">Mon profil</h1>
      <form onSubmit={save} className="space-y-5 rounded-3xl glass-strong p-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5/0.3)] to-[oklch(0.88_0.17_90/0.2)]">
            {form.avatar_url && <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1">
            <label className={label}>URL de la photo</label>
            <input className={field} value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" />
          </div>
        </div>

        <div>
          <label className={label}>Prénom</label>
          <input required className={field} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </div>

        <div>
          <label className={label}>Bio</label>
          <textarea rows={3} className={field} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Quelques mots sur vous…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Âge</label>
            <input type="number" min="18" max="99" className={field} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div>
            <label className={label}>Genre</label>
            <select className={field} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Je recherche</label>
          <select className={field} value={form.looking_for} onChange={(e) => setForm({ ...form, looking_for: e.target.value })}>
            <option value="">—</option>
            <option value="femme">Une femme</option>
            <option value="homme">Un homme</option>
            <option value="tous">Tout le monde</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Ville</label>
            <input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dakar" />
          </div>
          <div>
            <label className={label}>Pays</label>
            <input className={field} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Sénégal" />
          </div>
        </div>

        <div>
          <label className={label}>Centres d'intérêt (séparés par des virgules)</label>
          <input className={field} value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="voyage, musique, cuisine" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </form>
    </div>
  );
}
