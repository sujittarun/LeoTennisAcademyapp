// ============================================================
// CourtSync — partner poller (Supabase Edge Function)
// SCAFFOLD, not yet deployed. The outbound half: on a schedule
// (Supabase cron), pull recent bookings from each partner's venue
// API and reconcile them into the ledger. Use this for partners
// that don't offer webhooks. Deploy + schedule with:
//   supabase functions deploy partner-poll
//   (cron trigger every ~5 min in the dashboard)
// The production partner_sync() SQL function is the DB-side twin;
// this function is where the real Playo/Hudle/District HTTP calls go.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// each partner needs an adapter that maps its API shape to our ledger row
const ADAPTERS: Record<string, (cfg: any) => Promise<any[]>> = {
  Playo: async (cfg) => {
    // TODO: real call — GET https://partner.playo.io/venues/{cfg.venue_id}/bookings
    //   headers: { Authorization: `Bearer ${cfg.api_key}` }
    // map each to { ext_ref, sport, court, date, hour, amount, phone }
    return [];
  },
  Hudle: async (_cfg) => [],
  District: async (_cfg) => [],
};

Deno.serve(async () => {
  const { data: integrations } = await db.from("integrations")
    .select("tenant_id, channel, config").eq("enabled", true);

  let imported = 0;
  for (const it of integrations ?? []) {
    const adapter = ADAPTERS[it.channel];
    if (!adapter) continue;
    const bookings = await adapter(it.config).catch(() => []);
    for (const b of bookings) {
      const { error } = await db.from("bookings").upsert({
        id: `B-EXT${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        tenant_id: it.tenant_id, source: it.channel, ext_ref: b.ext_ref,
        sport: b.sport, court: b.court, date: b.date, hour: b.hour,
        amount: b.amount, name: `${it.channel} booking`, phone: b.phone ?? null,
        status: "confirmed",
      }, { onConflict: "tenant_id,source,ext_ref", ignoreDuplicates: true });
      if (!error) imported++;
    }
    await db.from("integrations").update({ last_sync_at: new Date().toISOString(), last_result: `polled ${bookings.length}` })
      .eq("tenant_id", it.tenant_id).eq("channel", it.channel);
  }
  return new Response(JSON.stringify({ imported }), { headers: { "Content-Type": "application/json" } });
});
