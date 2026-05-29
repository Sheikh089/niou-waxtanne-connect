import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}
function inIframe() {
  try { return window.self !== window.top; } catch { return true; }
}

const DISMISS_KEY = "nw_install_dismissed_at";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [bipEvent, setBipEvent] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || inIframe()) return;

    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored && Date.now() - Number(stored) < DISMISS_DAYS * 86400_000) {
      setDismissed(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos()) {
      // Show iOS guide after 4s (give user time to look around)
      const t = setTimeout(() => setShowIos(true), 4000);
      return () => { window.removeEventListener("beforeinstallprompt", onBip); clearTimeout(t); };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setBipEvent(null);
    setShowIos(false);
    setDismissed(true);
  };

  const install = async () => {
    if (!bipEvent) return;
    await bipEvent.prompt();
    const choice = await bipEvent.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setBipEvent(null);
  };

  if (dismissed || isStandalone() || inIframe()) return null;

  // Android / Chrome / Edge / desktop with PWA support
  if (bipEvent) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[60] md:left-auto md:right-4 md:w-[360px]">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white shadow-glow">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Installer Niou Waxtanne</div>
            <div className="text-[11px] text-muted-foreground">Accès rapide depuis votre écran d'accueil</div>
          </div>
          <button onClick={install} className="rounded-full bg-gradient-to-r from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] px-3 py-2 text-xs font-semibold text-white shadow-glow">
            Installer
          </button>
          <button onClick={dismiss} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS guide
  if (showIos) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[60] md:left-auto md:right-4 md:w-[360px]">
        <div className="rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.66_0.24_5)] to-[oklch(0.58_0.22_5)] text-white">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Installer sur iPhone</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Appuyez sur <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5"><Share className="h-3 w-3" />Partager</span>{" "}
                puis <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5"><Plus className="h-3 w-3" />Ajouter à l'écran d'accueil</span>.
              </p>
            </div>
            <button onClick={dismiss} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
