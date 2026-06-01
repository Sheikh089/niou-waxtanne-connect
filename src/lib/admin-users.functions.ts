import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  const ok = roles.some((r) =>
    ["super_admin", "admin", "moderator", "support"].includes(r),
  );
  if (!ok) throw new Error("Forbidden: admin role required");
  return roles;
}

function canDelete(roles: string[]) {
  return roles.includes("super_admin") || roles.includes("admin");
}

const listSchema = z.object({
  search: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  premium: z.boolean().optional(),
  verified: z.boolean().optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
  ageMin: z.number().int().min(18).max(99).optional(),
  ageMax: z.number().int().min(18).max(99).optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = supabaseAdmin
      .from("profiles")
      .select(
        "id, display_name, avatar_url, age, gender, city, country, is_premium, is_verified, status, last_seen, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search) {
      const s = data.search.trim();
      q = q.or(`display_name.ilike.%${s}%,city.ilike.%${s}%`);
    }
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.gender) q = q.eq("gender", data.gender);
    if (typeof data.premium === "boolean") q = q.eq("is_premium", data.premium);
    if (typeof data.verified === "boolean") q = q.eq("is_verified", data.verified);
    if (data.status) q = q.eq("status", data.status);
    if (data.ageMin) q = q.gte("age", data.ageMin);
    if (data.ageMax) q = q.lte("age", data.ageMax);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const adminGetUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const [{ data: profile, error: pErr }, { data: authUser }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(data.id),
    ]);
    if (pErr) throw new Error(pErr.message);

    const [likes, matches, messages, reportsAgainst, actions] = await Promise.all([
      supabaseAdmin.from("likes").select("id", { count: "exact", head: true }).eq("from_user", data.id),
      supabaseAdmin.from("matches").select("id", { count: "exact", head: true }).or(`user_a.eq.${data.id},user_b.eq.${data.id}`),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", data.id),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("reported", data.id),
      supabaseAdmin.from("admin_user_actions").select("id, action, reason, created_at, admin_id").eq("target_user_id", data.id).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      profile,
      email: authUser?.user?.email ?? null,
      lastSignInAt: authUser?.user?.last_sign_in_at ?? null,
      counts: {
        likes: likes.count ?? 0,
        matches: matches.count ?? 0,
        messages: messages.count ?? 0,
        reportsAgainst: reportsAgainst.count ?? 0,
      },
      actions: actions.data ?? [],
    };
  });

const actionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["suspend", "ban", "reactivate", "verify", "unverify", "delete"]),
  reason: z.string().max(500).optional(),
  suspendDays: z.number().int().min(1).max(365).optional(),
});

export const adminUserAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => actionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertAdmin(context.userId);

    if (data.id === context.userId) {
      throw new Error("Action interdite sur votre propre compte");
    }

    if (data.action === "delete") {
      if (!canDelete(roles)) throw new Error("Seuls les admins peuvent supprimer");
      // Log first then delete (FK-free)
      await supabaseAdmin.from("admin_user_actions").insert({
        admin_id: context.userId,
        target_user_id: data.id,
        action: "delete",
        reason: data.reason ?? null,
      });
      // Delete auth user; profile cascades via handle_new_user trigger? No, manual cleanup.
      await supabaseAdmin.from("profiles").delete().eq("id", data.id);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const patch: Record<string, unknown> = {};
    if (data.action === "suspend") {
      patch.status = "suspended";
      const days = data.suspendDays ?? 7;
      patch.suspended_until = new Date(Date.now() + days * 86400000).toISOString();
    } else if (data.action === "ban") {
      patch.status = "banned";
      patch.suspended_until = null;
    } else if (data.action === "reactivate") {
      patch.status = "active";
      patch.suspended_until = null;
    } else if (data.action === "verify") {
      patch.is_verified = true;
    } else if (data.action === "unverify") {
      patch.is_verified = false;
    }
    if (data.reason) patch.moderation_note = data.reason;

    const { error } = await supabaseAdmin.from("profiles").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("admin_user_actions").insert({
      admin_id: context.userId,
      target_user_id: data.id,
      action: data.action,
      reason: data.reason ?? null,
      metadata: patch as never,
    });

    return { ok: true };
  });
