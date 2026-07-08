import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Crown, Check, Zap, Heart, Eye, Sparkles, Filter, BadgeCheck,
  Rocket, MessageCircle, Star, Shield, ArrowLeft, Infinity as InfinityIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/premium")({
  component: PremiumPage,
});

type BillingCycle = "monthly" | "yearly";

type Plan = {
  key: "basic" | "gold" | "vip";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  color: string;
  ring: string;
  featured?: boolean;
  perks: { icon: typeof Heart; label: string; highlight?: boolean }[];
};

const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    tagline: "Pour bien démarrer",
    monthly: 2500,
    yearly: 25000,
    color: "from-slate-500 to-slate-700",
    ring: "border-white/10",
    perks: [
      { icon: Heart, label: "Likes illimités" },
      { icon: Eye, label: "Voir qui vous aime" },
      { icon: MessageCircle, label: "Messagerie prioritaire" },
      { icon: Shield, label: "Mode incognito basique" },
    ],
  },
  {
    key: "gold",
    name: "Gold",
    tagline: "Le plus populaire",
    monthly: 6000,
    yearly: 60000,
    color: "from-gold to-amber-500",
    ring: "border-gold/60",
    featured: true,
    perks: [
      { icon: Heart, label: "Tout Basic inclus", highlight: true },
      { icon: Sparkles, label: "Mise en avant du profil" },
      { icon: Filter, label: "Filtres avancés (âge, ville, intérêts)" },
      { icon: Rocket, label: "1 Boost hebdomadaire" },
      { icon: Star, label: "Badge Gold visible" },
    ],
  },
  {
    key: "vip",
    name: "VIP",
    tagline: "L'expérience ultime",
    monthly: 12000,
    yearly: 120000,
    color: "from-purple-500 to-pink-500",
    ring: "border-purple-400/60",
    perks: [
      { icon: Crown, label: "Tout Gold inclus", highlight: true },
      { icon: BadgeCheck, label: "Badge VIP exclusif" },
      { icon: Rocket, label: "Boost quotidien" },
      { icon: InfinityIcon, label: "Super-Likes illimités" },
      { icon: Shield, label: "Support prioritaire 24/7" },
      { icon: Eye, label: "Mode incognito total" },
    ],
  },
];

const COMPARE_ROWS: { label: string; basic: string | boolean; gold: string | boolean; vip: string | boolean }[] = [
  { label: "Likes par jour", basic: "Illimités", gold: "Illimités", vip: "Illimités" },
  { label: "Voir qui vous aime", basic: true, gold: true, vip: true },
  { label: "Filtres avancés", basic: false, gold: true, vip: true },
  { label: "Mise en avant profil", basic: false, gold: "Hebdo", vip: "Quotidien" },
  { label: "Super-Likes", basic: "5/mois", gold: "20/mois", vip: "Illimités" },
  { label: "Boost profil", basic: false, gold: "1/semaine", vip: "1/jour" },
  { label: "Mode incognito", basic: "Basique", gold: "Avancé", vip: "Total" },
  { label: "Badge de statut", basic: false, gold: "Gold", vip: "VIP" },
  { label: "Support", basic: "Standard", gold: "Prioritaire", vip: "24/7 dédié" },
];

const FAQ = [
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, l'abonnement peut être résilié en un clic depuis votre profil. Vous gardez vos avantages jusqu'à la fin de la période en cours.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Orange Money, Wave, Free Money, cartes bancaires et Mobile Money. Le paiement est 100% sécurisé.",
  },
  {
    q: "L'abonnement est-il renouvelé automatiquement ?",
    a: "Oui, pour éviter toute coupure. Vous pouvez le désactiver à tout moment.",
  },
  {
    q: "Puis-je changer de formule ?",
    a: "Absolument — passez de Basic à Gold ou VIP à tout moment. Le montant est calculé au prorata.",
  },
];

function PremiumPage() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selected, setSelected] = useState<Plan["key"]>("gold");

  const format = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
  const subscribe = (plan: Plan) => {
    setSelected(plan.key);
    toast.success(`Formule ${plan.name} sélectionnée — paiement bientôt disponible 💎`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-10">
      {/* Back */}
      <button
        onClick={() => navigate({ to: "/app/dashboard" })}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour au tableau de bord
      </button>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass-strong p-8 text-center shadow-elegant sm:p-12">
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-[oklch(0.66_0.24_5/0.25)] blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
            <Crown className="h-3 w-3" /> Premium
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-5xl">
            Trouvez l'amour <span className="text-gradient-romantic">plus vite</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Débloquez toutes les fonctionnalités pour maximiser vos chances de rencontres authentiques.
          </p>

          {/* Cycle toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                cycle === "monthly"
                  ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition ${
                cycle === "yearly"
                  ? "bg-gradient-to-r from-gold to-amber-500 text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                -17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = cycle === "monthly" ? plan.monthly : plan.yearly;
          const isSelected = selected === plan.key;
          return (
            <div
              key={plan.key}
              className={`relative overflow-hidden rounded-3xl border ${plan.ring} bg-gradient-to-br from-[oklch(0.22_0.04_5)] via-[oklch(0.18_0.02_20)] to-[oklch(0.16_0.012_20)] p-6 shadow-elegant transition ${
                plan.featured ? "md:-translate-y-3 md:scale-105" : ""
              } ${isSelected ? "ring-2 ring-[oklch(0.88_0.17_90)]" : ""}`}
            >
              {plan.featured && (
                <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-gold to-amber-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gold-foreground">
                  Populaire
                </span>
              )}
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color} shadow-lg`}>
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">{format(price)}</span>
                <span className="text-xs text-muted-foreground">/{cycle === "monthly" ? "mois" : "an"}</span>
              </div>
              {cycle === "yearly" && (
                <p className="mt-1 text-[11px] text-emerald-400">
                  Économisez {format(plan.monthly * 12 - plan.yearly)}
                </p>
              )}
              <ul className="mt-6 space-y-2.5">
                {plan.perks.map((perk) => (
                  <li key={perk.label} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      perk.highlight ? "bg-gold/20 text-gold" : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className={perk.highlight ? "font-semibold" : "text-muted-foreground"}>
                      {perk.label}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan)}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:scale-[1.02] ${
                  plan.featured
                    ? "bg-gradient-to-r from-gold to-amber-500 text-gold-foreground shadow-[0_0_30px_oklch(0.88_0.17_90/0.3)]"
                    : "bg-white/10 text-foreground hover:bg-white/15"
                }`}
              >
                <Zap className="h-4 w-4" /> Choisir {plan.name}
              </button>
            </div>
          );
        })}
      </section>

      {/* Comparatif */}
      <section className="overflow-hidden rounded-3xl glass-strong shadow-elegant">
        <div className="border-b border-white/10 p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Comparatif</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Toutes les fonctionnalités</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Fonctionnalité</th>
                <th className="px-4 py-3 text-center font-medium">Basic</th>
                <th className="px-4 py-3 text-center font-medium text-gold">Gold</th>
                <th className="px-4 py-3 text-center font-medium">VIP</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                  {(["basic", "gold", "vip"] as const).map((k) => {
                    const v = row[k];
                    return (
                      <td key={k} className="px-4 py-3 text-center">
                        {typeof v === "boolean" ? (
                          v ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-400" strokeWidth={3} />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          <span className={k === "gold" ? "font-semibold text-gold" : ""}>{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, title: "Paiement sécurisé", desc: "Transactions chiffrées et protégées" },
          { icon: BadgeCheck, title: "Sans engagement", desc: "Annulez quand vous le souhaitez" },
          { icon: Sparkles, title: "Satisfait ou remboursé", desc: "Sous 7 jours après achat" },
        ].map((t) => (
          <div key={t.title} className="rounded-2xl glass-strong p-5">
            <t.icon className="h-6 w-6 text-gold" />
            <p className="mt-3 font-semibold">{t.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Questions fréquentes</p>
          <h2 className="mt-1 font-display text-2xl font-bold">On répond à tout</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl glass-strong p-5 open:shadow-glow"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[oklch(0.22_0.04_5)] to-[oklch(0.16_0.012_20)] p-8 text-center shadow-elegant">
        <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <Crown className="relative mx-auto h-10 w-10 text-gold" />
        <h2 className="relative mt-3 font-display text-2xl font-bold sm:text-3xl">
          Prêt(e) à rencontrer quelqu'un de spécial ?
        </h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Rejoignez des milliers de célibataires qui ont trouvé l'amour avec Niou Waxtanne Premium.
        </p>
        <button
          onClick={() => subscribe(PLANS[1])}
          className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 px-8 py-3 text-sm font-bold text-gold-foreground shadow-[0_0_40px_oklch(0.88_0.17_90/0.3)] transition hover:scale-[1.03]"
        >
          <Zap className="h-4 w-4" /> Devenir Premium maintenant
        </button>
      </section>
    </div>
  );
}
