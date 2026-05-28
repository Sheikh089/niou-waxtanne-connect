import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Format E.164 attendu (ex: +221771234567)");

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function syntheticEmail(phone: string) {
  return `phone${phone.replace(/[^0-9]/g, "")}@niouwaxtanne.app`;
}

export const sendWhatsappOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) =>
    z.object({ phone: phoneSchema }).parse(input)
  )
  .handler(async ({ data }) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      throw new Error("WhatsApp non configuré");
    }

    // throttle: max 1 OTP / 30s / phone
    const { data: recent } = await supabaseAdmin
      .from("phone_otps")
      .select("created_at")
      .eq("phone", data.phone)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent && recent[0]) {
      const age = Date.now() - new Date(recent[0].created_at).getTime();
      if (age < 30_000) throw new Error("Patientez avant de redemander un code");
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const code_hash = hashCode(data.phone, code);
    const expires_at = new Date(Date.now() + 5 * 60_000).toISOString();

    const { error: insErr } = await supabaseAdmin
      .from("phone_otps")
      .insert({ phone: data.phone, code_hash, expires_at });
    if (insErr) throw new Error(insErr.message);

    const recipient = data.phone.replace(/^\+/, "");
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: {
            body: `💖 Niou Waxtanne\nVotre code de connexion : ${code}\nValide 5 minutes. Ne le partagez avec personne.`,
          },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error("WhatsApp send failed", res.status, body);
      throw new Error("Envoi WhatsApp impossible. Vérifiez le numéro.");
    }
    return { ok: true };
  });

export const verifyWhatsappOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; code: string }) =>
    z.object({ phone: phoneSchema, code: z.string().regex(/^\d{6}$/) }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("phone_otps")
      .select("id, code_hash, expires_at, consumed, attempts")
      .eq("phone", data.phone)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) throw new Error("Code invalide");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Code expiré");
    if (row.attempts >= 5) throw new Error("Trop de tentatives");

    const ok = hashCode(data.phone, data.code) === row.code_hash;
    if (!ok) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("Code incorrect");
    }

    await supabaseAdmin.from("phone_otps").update({ consumed: true }).eq("id", row.id);

    const email = syntheticEmail(data.phone);
    // Create user if missing (idempotent)
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      phone: data.phone,
      phone_confirm: true,
      user_metadata: { display_name: data.phone, whatsapp: data.phone },
    });
    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      throw new Error(createErr.message);
    }

    // Magic-link token for client to verify
    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Génération de session impossible");
    }

    return { token_hash: link.properties.hashed_token, email };
  });
