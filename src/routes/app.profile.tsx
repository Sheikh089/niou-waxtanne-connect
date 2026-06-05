import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, Save, Camera, X, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

const INTERESTS = [
  "voyage", "musique", "cuisine", "sport", "cinéma", "lecture", "danse",
  "mode", "photographie", "art", "spiritualité", "famille", "entrepreneuriat",
  "nature", "gastronomie", "tech", "football", "yoga", "rire", "aventure",
];

type Form = {
  display_name: string;
  bio: string;
  age: string;
  gender: string;
  looking_for: string;
  city: string;
  country: string;
  avatar_url: string;
  whatsapp: string;
  photos: string[];
  interests: string[];
};

const empty: Form = {
  display_name: "", bio: "", age: "", gender: "", looking_for: "",
  city: "", country: "Sénégal", avatar_url: "", whatsapp: "", photos: [], interests: [],
};

function Profile() {
  const navigate = useNavigate();
  const fromOnboarding = useRouterState({ select: (s) => s.location.search }) as { onboarding?: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(0); // wizard step (only when onboarding)
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: wa } = await supabase.rpc("get_my_whatsapp");
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          age: data.age?.toString() ?? "",
          gender: data.gender ?? "",
          looking_for: data.looking_for ?? "",
          city: data.city ?? "",
          country: data.country ?? "Sénégal",
          avatar_url: data.avatar_url ?? "",
          whatsapp: (wa as string | null) ?? "",
          photos: data.photos ?? [],
          interests: data.interests ?? [],
        });
        setCompleted(data.onboarding_completed ?? false);
      }
      setLoading(false);
    })();
  }, []);

  const isOnboarding = !completed || fromOnboarding?.onboarding === "1";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image > 5 Mo"); return; }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({
      ...f,
      photos: [...f.photos, pub.publicUrl],
      avatar_url: f.avatar_url || pub.publicUrl,
    }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (url: string) => {
    setForm((f) => ({
      ...f,
      photos: f.photos.filter((p) => p !== url),
      avatar_url: f.avatar_url === url ? (f.photos.find((p) => p !== url) ?? "") : f.avatar_url,
    }));
  };

  const toggleInterest = (i: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter((x) => x !== i)
        : f.interests.length >= 8 ? f.interests : [...f.interests, i],
    }));
  };

  const isComplete =
    form.photos.length >= 1 &&
    form.bio.trim().length >= 20 &&
    form.interests.length >= 3 &&
    form.city.trim().length > 0 &&
    form.display_name.trim().length > 0 &&
    form.age && parseInt(form.age) >= 18;

  const save = async (markComplete: boolean) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
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
        whatsapp: form.whatsapp || null,
        photos: form.photos,
        interests: form.interests,
        onboarding_completed: markComplete ? true : completed,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (markComplete) {
      setCompleted(true);
      toast.success("Profil complété ! Bienvenue 💖");
      navigate({ to: "/app" });
    } else {
      toast.success("Profil enregistré 💖");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const field = "w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.66_0.24_5)]";
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";

  // ====== Onboarding wizard ======
  if (isOnboarding) {
    const steps = [
      { title: "Vos photos", desc: "Ajoutez au moins une photo qui vous représente." },
      { title: "Présentez-vous", desc: "Quelques mots sincères font toute la différence." },
      { title: "Vos centres d'intérêt", desc: "Choisissez 3 à 8 passions." },
      { title: "Où êtes-vous ?", desc: "Pour rencontrer près de chez vous." },
    ];
    const canNext = [
      form.photos.length >= 1,
      form.display_name.trim().length > 0 && form.bio.trim().length >= 20 && form.age && parseInt(form.age) >= 18,
      form.interests.length >= 3,
      form.city.trim().length > 0,
    ];

    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Étape {step + 1} sur {steps.length}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold">{steps[step].title}</h1>
            <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.88_0.17_90)]" : "bg-muted"}`} />
          ))}
        </div>

        <div className="rounded-3xl glass-strong p-6">
          {step === 0 && (
            <div>
              <div className="grid grid-cols-3 gap-3">
                {form.photos.map((p) => (
                  <div key={p} className="group relative aspect-square overflow-hidden rounded-2xl">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(p)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                      <X className="h-3 w-3 text-white" />
                    </button>
                    {form.avatar_url === p && (
                      <div className="absolute bottom-1 left-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-semibold text-black">Principal</div>
                    )}
                  </div>
                ))}
                {form.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-[oklch(0.66_0.24_5)] hover:text-foreground"
                  >
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              <p className="mt-3 text-xs text-muted-foreground">Jusqu'à 6 photos. La première est votre photo principale.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={label}>Prénom</label>
                <input className={field} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Aminata" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Âge</label>
                  <input type="number" min={18} max={99} className={field} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
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
              <div>
                <label className={label}>Bio (20 caractères min)</label>
                <textarea rows={4} className={field} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ce qui vous fait vibrer, ce que vous cherchez…" />
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{form.bio.length}/300</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = form.interests.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInterest(i)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                        on
                          ? "border-transparent bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {on && <Check className="mr-1 inline h-3 w-3" />}
                      {i}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{form.interests.length}/8 sélectionnés (min. 3)</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Ville</label>
                  <input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dakar" />
                </div>
                <div>
                  <label className={label}>Pays</label>
                  <input className={field} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={label}>WhatsApp (optionnel)</label>
                <input className={field} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+221771234567" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground disabled:opacity-30"
          >
            Retour
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext[step]}
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-40"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              disabled={!isComplete || saving}
              onClick={() => save(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Terminer
            </button>
          )}
        </div>
      </div>
    );
  }

  // ====== Edit mode (profile already completed) ======
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">Mon profil</h1>
      <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-5 rounded-3xl glass-strong p-6">
        <div>
          <label className={label}>Photos</label>
          <div className="grid grid-cols-3 gap-3">
            {form.photos.map((p) => (
              <div key={p} className="group relative aspect-square overflow-hidden rounded-2xl">
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removePhoto(p)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1">
                  <X className="h-3 w-3 text-white" />
                </button>
                <button type="button" onClick={() => setForm({ ...form, avatar_url: p })} className={`absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${form.avatar_url === p ? "bg-gold/90 text-black" : "bg-black/60 text-white"}`}>
                  {form.avatar_url === p ? "Principal" : "Définir"}
                </button>
              </div>
            ))}
            {form.photos.length < 6 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>

        <div>
          <label className={label}>Prénom</label>
          <input required className={field} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </div>
        <div>
          <label className={label}>Bio</label>
          <textarea rows={3} className={field} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Âge</label><input type="number" min={18} max={99} className={field} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
          <div>
            <label className={label}>Genre</label>
            <select className={field} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option><option value="femme">Femme</option><option value="homme">Homme</option><option value="autre">Autre</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Je recherche</label>
          <select className={field} value={form.looking_for} onChange={(e) => setForm({ ...form, looking_for: e.target.value })}>
            <option value="">—</option><option value="femme">Une femme</option><option value="homme">Un homme</option><option value="tous">Tout le monde</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Ville</label><input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className={label}>Pays</label><input className={field} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
        </div>
        <div>
          <label className={label}>WhatsApp</label>
          <input className={field} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+221…" />
        </div>
        <div>
          <label className={label}>Centres d'intérêt</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = form.interests.includes(i);
              return (
                <button key={i} type="button" onClick={() => toggleInterest(i)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-transparent bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white" : "border-border text-muted-foreground"}`}>
                  {i}
                </button>
              );
            })}
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </form>
    </div>
  );
}
