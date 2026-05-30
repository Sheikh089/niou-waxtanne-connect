import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const logSchema = z.object({
  email: z.string().email().max(255),
  success: z.boolean(),
  reason: z.string().max(200).optional(),
});

export const logAdminLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((d) => logSchema.parse(d))
  .handler(async ({ data }) => {
    let userId: string | null = null;
    try {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id ?? null;
    } catch {
      // ignore
    }

    const ip = (() => {
      try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; }
    })();
    const ua = (() => {
      try { return getRequestHeader("user-agent") ?? null; } catch { return null; }
    })();

    await supabaseAdmin.from("admin_login_logs").insert({
      user_id: userId,
      email: data.email,
      success: data.success,
      reason: data.reason ?? null,
      ip_address: ip,
      user_agent: ua,
    });
    return { ok: true };
  });
