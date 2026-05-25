import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Shield, Sparkles, Users, Star, Check, ArrowRight, Crown } from "lucide-react";
import heroCouple from "@/assets/hero-couple.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] shadow-glow">
        <Heart className="h-5 w-5 fill-white text-white" />
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Niou <span className="text-gradient-romantic">Waxtanne</span>
      </span>
    </Link>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-2xl glass-strong px-5 py-3 mx-4 md:mx-auto md:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition">Fonctionnalités</a>
          <a href="#how" className="hover:text-foreground transition">Comment ça marche</a>
          <a href="#pricing" className="hover:text-foreground transition">Premium</a>
          <a href="#testimonials" className="hover:text-foreground transition">Témoignages</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground sm:block">
            Se connecter
          </button>
          <button className="rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-105">
            Créer un compte
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.66_0.24_5)] opacity-30 blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-0 h-96 w-96 rounded-full bg-[oklch(0.88_0.17_90)] opacity-15 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium uppercase tracking-widest text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Rencontres africaines premium
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Rencontrez.<br />
            Discutez.<br />
            <span className="text-gradient-romantic">Aimez.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            La nouvelle référence pour des rencontres africaines authentiques.
            Élégant, sécurisé, romantique — fait pour celles et ceux qui cherchent une vraie connexion.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-7 py-3.5 font-semibold text-white shadow-glow transition hover:scale-[1.03]">
              Créer un compte
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button className="rounded-full glass px-7 py-3.5 font-semibold text-foreground transition hover:bg-white/10">
              Se connecter
            </button>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex -space-x-3">
              <img src={testimonial1} alt="" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
              <img src={testimonial2} alt="" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
              <img src={testimonial3} alt="" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-muted-foreground">+250 000 célibataires africains</p>
            </div>
          </div>
        </div>

        {/* Hero visual — phone mockup */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up">
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.88_0.17_90)] opacity-40 blur-3xl" />
          <div className="relative aspect-[9/16] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-elegant">
            <img
              src={heroCouple}
              alt="Couple africain élégant"
              width={1080}
              height={1920}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

            {/* Floating match card */}
            <div className="absolute left-4 top-6 animate-float rounded-2xl glass-strong p-3 shadow-elegant">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)]">
                  <Heart className="h-4 w-4 fill-white text-white" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold">It's a Match !</div>
                  <div className="text-muted-foreground">Aminata, 26</div>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass-strong p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold">Awa & Cheikh</span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gold">
                      <Check className="h-3 w-3 text-gold-foreground" strokeWidth={3} />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ensemble depuis Mars 2026 · Dakar</p>
                </div>
                <Heart className="h-6 w-6 fill-[oklch(0.66_0.24_5)] text-[oklch(0.66_0.24_5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Sparkles, title: "Matching intelligent", desc: "Algorithme basé sur vos affinités, valeurs et centres d'intérêt." },
    { icon: MessageCircle, title: "Messagerie temps réel", desc: "Chat, photos, vocaux, appels vidéo — tout chiffré, tout fluide." },
    { icon: Shield, title: "Profils vérifiés", desc: "Vérification d'identité et anti-faux profils pour des rencontres sereines." },
    { icon: Crown, title: "Expérience premium", desc: "Boost, super likes, filtres avancés et visibilité augmentée." },
    { icon: Users, title: "Communauté africaine", desc: "Pensé par et pour les Africains du continent et de la diaspora." },
    { icon: Heart, title: "Relations sérieuses", desc: "Un espace conçu pour bâtir des relations authentiques et durables." },
  ];
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Fonctionnalités</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Tout ce qu'il faut pour <span className="text-gradient-romantic">trouver l'amour</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une expérience pensée pour la sécurité, l'élégance et les vraies connexions.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[oklch(0.66_0.24_5)] opacity-0 blur-3xl transition group-hover:opacity-30" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.66_0.24_5)]/20 to-[oklch(0.88_0.17_90)]/10 ring-1 ring-white/10">
                  <it.icon className="h-5 w-5 text-[oklch(0.78_0.2_5)]" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Créez votre profil", desc: "Photos, bio, intérêts. En quelques minutes vous êtes prêt(e)." },
    { n: "02", title: "Découvrez & swipez", desc: "Recevez des suggestions ultra-pertinentes chaque jour." },
    { n: "03", title: "Discutez & rencontrez", desc: "Échangez en temps réel, puis transformez l'étincelle en histoire." },
  ];
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Comment ça marche</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Trois étapes vers <span className="text-gradient-romantic">l'amour</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-3xl glass-strong p-8">
              <div className="font-display text-6xl font-bold text-gradient-gold opacity-90">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              {i < 2 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[oklch(0.66_0.24_5)] md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { img: testimonial1, name: "Aminata, 28", city: "Dakar", text: "J'ai rencontré l'homme de ma vie ici. L'app est élégante et sérieuse, ça change tout." },
    { img: testimonial2, name: "Mamadou, 31", city: "Abidjan", text: "Enfin une plateforme premium pensée pour nous. Les profils sont vérifiés, la qualité est là." },
    { img: testimonial3, name: "Fatou & Ibrahim", city: "Paris", text: "Mariés en 2026 grâce à Niou Waxtanne. Merci pour cette belle aventure." },
  ];
  return (
    <section id="testimonials" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Témoignages</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            De vraies histoires, de <span className="text-gradient-romantic">vrais cœurs</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-3xl glass-strong p-6">
              <div className="flex items-center gap-4">
                <img src={t.img} alt={t.name} loading="lazy" width={512} height={512} className="h-14 w-14 rounded-full object-cover ring-2 ring-[oklch(0.66_0.24_5)]/40" />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Gratuit", price: "0", suffix: "FCFA", desc: "Pour commencer l'aventure",
      features: ["Création de profil", "Swipe quotidien limité", "Messages avec vos matches", "Stories utilisateurs"],
      cta: "Commencer", highlight: false,
    },
    {
      name: "Gold", price: "4 900", suffix: "FCFA / mois", desc: "Boostez vos rencontres",
      features: ["Voir qui vous aime", "Swipes illimités", "5 Super Likes / jour", "Boost mensuel", "Filtres avancés"],
      cta: "Passer Gold", highlight: true,
    },
    {
      name: "Platinum", price: "9 900", suffix: "FCFA / mois", desc: "L'expérience ultime",
      features: ["Tout Gold inclus", "Messages prioritaires", "Profil vérifié exclusif", "Boost hebdomadaire", "Visibilité maximale"],
      cta: "Passer Platinum", highlight: false,
    },
  ];
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Abonnements</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Choisissez votre <span className="text-gradient-gold">expérience</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 ${
                p.highlight
                  ? "glass-strong ring-2 ring-[oklch(0.66_0.24_5)] shadow-glow"
                  : "glass"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-4 py-1 text-xs font-semibold text-white">
                  Le plus populaire
                </div>
              )}
              <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.suffix}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.78_0.2_5)]" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`mt-8 w-full rounded-full py-3 font-semibold transition ${
                p.highlight
                  ? "bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white hover:scale-[1.02]"
                  : "glass hover:bg-white/10 text-foreground"
              }`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] glass-strong p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.66_0.24_5)] opacity-30 blur-3xl" />
          <Heart className="mx-auto h-12 w-12 fill-[oklch(0.66_0.24_5)] text-[oklch(0.66_0.24_5)] animate-pulse-glow rounded-full p-2" />
          <h2 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
            Et si votre histoire <br className="hidden sm:block" />
            <span className="text-gradient-romantic">commençait ce soir ?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Rejoignez la communauté africaine de rencontres premium. Gratuit pour commencer.
          </p>
          <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-8 py-4 font-semibold text-white shadow-glow transition hover:scale-105">
            Créer mon profil gratuit
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Rencontrez. Discutez. Aimez.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Produit</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Premium</a></li>
              <li><a href="#how" className="hover:text-foreground">Comment ça marche</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Entreprise</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">À propos</a></li>
              <li><a href="#" className="hover:text-foreground">Sécurité</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Légal</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground">Conditions</a></li>
              <li><a href="#" className="hover:text-foreground">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Niou Waxtanne. Tous droits réservés.</p>
          <p>Fait avec <Heart className="inline h-3 w-3 fill-[oklch(0.66_0.24_5)] text-[oklch(0.66_0.24_5)]" /> en Afrique</p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
