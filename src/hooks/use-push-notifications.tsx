import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Perm = NotificationPermission | "unsupported";

export function useNotificationPermission() {
  const [perm, setPerm] = useState<Perm>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    const result = await Notification.requestPermission();
    setPerm(result);
    return result;
  }, []);

  return { perm, request };
}

/**
 * Global subscriber: listens for new messages addressed to the current user
 * and shows a native browser notification when the user is not actively
 * viewing that conversation (different route or tab hidden).
 */
export function useMessagePushNotifications(userId: string | null) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pathRef = useRef(pathname);
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const channel = supabase
      .channel(`push:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            id: string; match_id: string; sender_id: string; content: string;
          };
          if (msg.sender_id === userId) return;

          // Skip if user is actively reading this conversation and tab is visible
          const onThisConv = pathRef.current === `/app/messages/${msg.match_id}`;
          if (onThisConv && document.visibilityState === "visible") return;

          if (Notification.permission !== "granted") return;

          // Fetch sender display name (best-effort)
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", msg.sender_id)
            .maybeSingle();

          const title = sender?.display_name
            ? `💖 ${sender.display_name}`
            : "💖 Nouveau message";
          const n = new Notification(title, {
            body: msg.content.slice(0, 140),
            icon: sender?.avatar_url ?? "/favicon.ico",
            tag: `match-${msg.match_id}`,
            badge: "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
            navigate({ to: "/app/messages/$matchId", params: { matchId: msg.match_id } });
            n.close();
          };
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, navigate]);
}
