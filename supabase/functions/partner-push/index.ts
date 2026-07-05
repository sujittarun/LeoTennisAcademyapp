// ============================================================
// CourtSync — partner block PUSH (Supabase Edge Function)
// SCAFFOLD, not yet deployed. The outbound cross-partner block:
// when a slot is taken on ANY channel, call the OTHER partners' APIs
// to block that slot on their platforms. This is the real HTTP twin
// of the propagate_block() SQL function (which currently just logs).
// Trigger it from a Postgres webhook on bookings INSERT, or call it
// from confirm/record after a court is claimed.
// Deploy: supabase functions deploy partner-push
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// per-partner "block this slot" adapters — real API calls go here
const BLOCKERS: Record<string, (cfg: any, slot: any) => Promise<void>> = {
  Playo: async (cfg, slot) => {
    // await fetch(`https://partner.playo.io/venues/${cfg.venue_id}/block`, {
    //   method: "POST", headers: { Authorization: `Bearer ${cfg.api_key}` },
    //   body: JSON.stringify({ court: slot.court, date: slot.date, hour: slot.hour }) });
  },
  Hudle: async (_cfg, _slot) => {},
  District: async (_cfg, _slot) => {},
};

Deno.serve(async (req) => {
  // Postgres webhook payload: { record: <new bookings row> }
  const { record } = await req.json().catch(() => ({ record: null }));
  if (!record || record.status === "cancelled" || !record.court) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const { data: others } = await db.from("integrations")
    .select("channel, config").eq("tenant_id", record.tenant_id)
    .eq("enabled", true).neq("channel", record.source);

  const slot = { court: record.court, date: record.date, hour: record.hour };
  for (const it of others ?? []) {
    const blocker = BLOCKERS[it.channel];
    let status = "ok", detail = `block ${slot.court} ${slot.date} ${slot.hour}:00 (from ${record.source})`;
    try { if (blocker) await blocker(it.config, slot); }
    catch (e) { status = "error"; detail = String(e).slice(0, 160); }
    await db.from("sync_log").insert({
      tenant_id: record.tenant_id, channel: it.channel, action: "push",
      ext_ref: record.ext_ref, status, detail,
    });
  }
  return new Response(JSON.stringify({ pushed: (others ?? []).length }), { headers: { "Content-Type": "application/json" } });
});
