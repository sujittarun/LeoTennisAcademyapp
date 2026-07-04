// ============================================================
// CourtSync — partner webhook receiver (Supabase Edge Function)
// SCAFFOLD, not yet deployed. This is the inbound half of the
// channel-manager: Playo/Hudle/District call this URL when a booking
// is made or cancelled on their platform, and we write it into the
// shared ledger (idempotent via ext_ref). Deploy with:
//   supabase functions deploy partner-webhook
// and register the URL + a shared secret in each partner's dashboard.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const URL = Deno.env.get("SUPABASE_URL")!;
// per-partner shared secrets, set as function env vars
const SECRETS: Record<string, string> = {
  Playo: Deno.env.get("PLAYO_WEBHOOK_SECRET") ?? "",
  Hudle: Deno.env.get("HUDLE_WEBHOOK_SECRET") ?? "",
  District: Deno.env.get("DISTRICT_WEBHOOK_SECRET") ?? "",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // { channel, secret, tenant_id, event: 'booked'|'cancelled',
  //   ext_ref, sport, court, date, hour, amount, name, phone }
  const body = await req.json().catch(() => null);
  if (!body) return new Response("bad request", { status: 400 });

  // authenticate the partner (never trust the payload alone)
  if (!SECRETS[body.channel] || body.secret !== SECRETS[body.channel]) {
    return new Response("unauthorized", { status: 401 });
  }

  const db = createClient(URL, SERVICE_KEY);

  if (body.event === "cancelled") {
    await db.from("bookings").update({ status: "cancelled" })
      .eq("tenant_id", body.tenant_id).eq("source", body.channel).eq("ext_ref", body.ext_ref);
  } else {
    // idempotent upsert keyed by (tenant, channel, ext_ref)
    await db.from("bookings").upsert({
      id: `B-EXT${Date.now()}`,
      tenant_id: body.tenant_id, source: body.channel, ext_ref: body.ext_ref,
      sport: body.sport, court: body.court, date: body.date, hour: body.hour,
      amount: body.amount, name: `${body.channel} booking`, phone: body.phone ?? null,
      status: "confirmed",
    }, { onConflict: "tenant_id,source,ext_ref", ignoreDuplicates: true });
  }

  await db.from("sync_log").insert({
    tenant_id: body.tenant_id, channel: body.channel, action: "webhook",
    ext_ref: body.ext_ref, status: "ok", detail: body.event,
  });

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
