import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Shield, Sparkles, Users, Star, Check, ArrowRight, Crown, Target, Eye, Gem, HeartHandshake, Video, MapPin, Languages, Search, BellRing, EyeOff, BadgeCheck, Flame, Zap, Lock, Camera, Award, FileCheck2, ShieldCheck, BookOpen, Calendar, LockKeyhole } from "lucide-react";
import heroCouple from "@/assets/hero-couple.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import logo from "@/assets/logo.png";

function Logo({ className = "", size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-12" : "h-9";
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <img src={logo} alt="Niou Waxtanne" className={`${h} w-auto object-contain drop-shadow-[0_0_20px_oklch(0.66_0.24_5/0.5)]`} />
      <span className={`font-display font-bold tracking-tight ${size === "lg" ? "text-2xl" : "text-xl"}`}>
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
          <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground sm:block">
            Se connecter
          </Link>
          <Link to="/auth" className="rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-105">
            Créer un compte
          </Link>
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
            Là où les cœurs africains se rencontrent pour écrire de vraies histoires.
            Une plateforme premium, sûre et inclusive — pensée pour des relations sincères et durables.
          </p>


          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-7 py-3.5 font-semibold text-white shadow-glow transition hover:scale-[1.03]">
              Créer un compte
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link to="/auth" className="rounded-full glass px-7 py-3.5 font-semibold text-foreground transition hover:bg-white/10">
              Se connecter
            </Link>
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
  return null;
}


function Brand() {
  const pillars = [
    { icon: Target, title: "Mission", desc: "Connecter les cœurs africains à travers des rencontres sincères et authentiques." },
    { icon: Eye, title: "Vision", desc: "Devenir la plateforme de référence en Afrique pour des relations sérieuses et durables." },
    { icon: Gem, title: "Valeurs", desc: "Authenticité, Respect, Sécurité, Engagement, Diversité." },
    { icon: HeartHandshake, title: "Promesse", desc: "Ici, chaque connexion a le potentiel de changer une vie." },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Notre ADN</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Là où les cœurs se <span className="text-gradient-romantic">retrouvent</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Niou Waxtanne est né d'une conviction : l'amour existe partout en Afrique,
            mais chaque histoire mérite la bonne rencontre pour s'écrire.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl glass p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] shadow-glow">
                <p.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm">
          {["Chaleureuse", "Élégante", "Moderne", "Romantique", "Inclusive", "Inspirante"].map((tag) => (
            <span key={tag} className="rounded-full glass px-4 py-1.5 text-foreground/80">
              {tag}
            </span>
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
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-8 py-4 font-semibold text-white shadow-glow transition hover:scale-105">
            Créer mon profil gratuit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PopularProfiles() {
  const profiles = [
    { img: testimonial1, name: "Aminata", age: 26, city: "Dakar", tags: ["Voyage", "Art"], verified: true },
    { img: testimonial2, name: "Mamadou", age: 31, city: "Abidjan", tags: ["Sport", "Musique"], verified: true },
    { img: testimonial3, name: "Fatou", age: 28, city: "Paris", tags: ["Mode", "Cuisine"], verified: true },
    { img: testimonial1, name: "Awa", age: 24, city: "Thiès", tags: ["Lecture", "Cinéma"], verified: false },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Profils populaires</p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Découvrez des <span className="text-gradient-romantic">cœurs à conquérir</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Une sélection des profils les plus aimés cette semaine.</p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.map((p, i) => (
            <div key={i} className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-elegant transition hover:-translate-y-1">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              {p.verified && (
                <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-gold shadow-glow">
                  <Check className="h-4 w-4 text-gold-foreground" strokeWidth={3} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-semibold">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.age}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.city}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] backdrop-blur">{t}</span>
                  ))}
                </div>
              </div>
              <button className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] shadow-glow opacity-0 transition group-hover:opacity-100">
                <Heart className="h-5 w-5 fill-white text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveMatches() {
  const matches = [
    { a: "Awa", b: "Cheikh", city: "Dakar", when: "il y a 2 min" },
    { a: "Marième", b: "Ousmane", city: "Thiès", when: "il y a 5 min" },
    { a: "Khadi", b: "Moussa", city: "Saint-Louis", when: "il y a 8 min" },
    { a: "Bineta", b: "Lamine", city: "Mbour", when: "il y a 12 min" },
  ];
  return (
    <section className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-72 -translate-y-1/2 bg-gradient-to-r from-transparent via-[oklch(0.66_0.24_5)]/10 to-transparent blur-3xl" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-gold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.66_0.24_5)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.66_0.24_5)]" />
            </span>
            En direct
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Des matchs <span className="text-gradient-romantic">en temps réel</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Pendant que vous lisez, des cœurs se rencontrent partout en Afrique.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {matches.map((m, i) => (
            <div key={i} className="rounded-2xl glass-strong p-5 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] ring-2 ring-background grid place-items-center text-xs font-semibold text-white">
                    {m.a[0]}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.88_0.17_90)] to-gold ring-2 ring-background grid place-items-center text-xs font-semibold text-gold-foreground">
                    {m.b[0]}
                  </div>
                </div>
                <Heart className="h-5 w-5 fill-[oklch(0.66_0.24_5)] text-[oklch(0.66_0.24_5)]" />
              </div>
              <p className="mt-3 text-sm font-semibold">{m.a} & {m.b}</p>
              <p className="text-xs text-muted-foreground">{m.city} · {m.when}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-4 text-center">
          {[
            { v: "250K+", l: "Membres" },
            { v: "1,2M", l: "Matchs créés" },
            { v: "12K+", l: "Histoires d'amour" },
            { v: "98%", l: "Profils vérifiés" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl glass p-5">
              <div className="font-display text-3xl font-bold text-gradient-gold">{s.v}</div>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Security() {
  const items = [
    { icon: BadgeCheck, title: "Vérification d'identité", desc: "Selfie + pièce d'identité validés par notre équipe." },
    { icon: Lock, title: "Chiffrement end-to-end", desc: "Vos conversations restent strictement privées." },
    { icon: FileCheck2, title: "Modération 24/7", desc: "Une équipe humaine veille sur la communauté." },
    { icon: EyeOff, title: "Mode discret & blocage", desc: "Vous contrôlez qui vous voit et qui vous parle." },
  ];
  return (
    <section id="security" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Sécurité & vérification</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">
              Votre sécurité, <span className="text-gradient-romantic">notre priorité</span>
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Niou Waxtanne est conçu pour que vous puissiez rencontrer en toute sérénité.
              Profils vérifiés, modération continue et outils de contrôle complets.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.title} className="rounded-2xl glass p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.66_0.24_5)]/30 to-gold/20 ring-1 ring-white/10">
                    <it.icon className="h-5 w-5 text-[oklch(0.78_0.2_5)]" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-gold opacity-30 blur-3xl" />
            <div className="rounded-[2.5rem] glass-strong p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] shadow-glow">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold">Charte de confiance</p>
                  <p className="text-xs text-muted-foreground">Engagement Niou Waxtanne</p>
                </div>
              </div>
              <ul className="mt-6 space-y-4 text-sm">
                {[
                  "Aucune donnée vendue à des tiers, jamais.",
                  "Photos & messages stockés de manière sécurisée.",
                  "Signalement traité en moins de 24 h.",
                  "Conseils sécurité avant chaque premier rendez-vous.",
                  "Bouton SOS pour rendez-vous en cas de besoin.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span className="text-foreground/90">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Blog() {
  const posts = [
    {
      img: testimonial3,
      tag: "Couples",
      date: "20 mai 2026",
      title: "Mariages mixtes en Afrique : célébrer la diversité",
      excerpt: "Quand l'amour traverse les frontières culturelles, il devient une vraie aventure humaine.",
    },
    {
      img: testimonial1,
      tag: "Conseils",
      date: "12 mai 2026",
      title: "Premier rendez-vous à Dakar : nos meilleurs spots",
      excerpt: "Plages, rooftops, cafés cachés — voici où faire battre les cœurs.",
    },
    {
      img: testimonial2,
      tag: "Relations",
      date: "05 mai 2026",
      title: "L'art de la conversation : briser la glace avec élégance",
      excerpt: "Les premières phrases comptent. Voici comment captiver dès le premier message.",
    },
  ];
  return (
    <section id="blog" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">Blog relationnel</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">
              Inspiration & <span className="text-gradient-romantic">conseils</span>
            </h2>
          </div>
          <a href="#" className="hidden items-center gap-1 text-sm text-foreground/80 hover:text-foreground sm:inline-flex">
            Tous les articles <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <article key={p.title} className="group overflow-hidden rounded-3xl glass-strong transition hover:-translate-y-1">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-[oklch(0.66_0.24_5)]/20 px-2 py-0.5 text-[oklch(0.78_0.2_5)]">{p.tag}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
                  Lire l'article <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.66_0.24_5)]/60 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              L'app de rencontres africaines premium pour des relations sérieuses et authentiques.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {["IG", "TT", "FB", "X"].map((s) => (
                <a key={s} href="#" aria-label={s} className="grid h-9 w-9 place-items-center rounded-full glass hover:bg-white/10 text-xs font-semibold">
                  {s}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Produit</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Premium</a></li>
              <li><a href="#how" className="hover:text-foreground">Comment ça marche</a></li>
              <li><a href="#security" className="hover:text-foreground">Sécurité</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Communauté</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#blog" className="hover:text-foreground">Blog</a></li>
              <li><a href="#testimonials" className="hover:text-foreground">Témoignages</a></li>
              <li><a href="#" className="hover:text-foreground">Histoires d'amour</a></li>
              <li><a href="#" className="hover:text-foreground">Événements</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Légal</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground">Conditions</a></li>
              <li><a href="#" className="hover:text-foreground">Cookies</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Niou Waxtanne. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="opacity-40 hover:opacity-100 transition-opacity" title="Espace administrateur">
              <LockKeyhole className="h-3.5 w-3.5" />
            </Link>
            <p>Fait avec <Heart className="inline h-3 w-3 fill-[oklch(0.66_0.24_5)] text-[oklch(0.66_0.24_5)]" /> en Afrique</p>
          </div>
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
        <Brand />
        <HowItWorks />
        <PopularProfiles />
        <LiveMatches />
        <Testimonials />
        <Pricing />
        <Security />
        <Blog />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
