// ============================================================
// CourtSync — sync worker (Supabase Edge Function)
// SCAFFOLD. The durable propagation worker: runs on a schedule
// (Supabase cron, ~every 30s), claims ready jobs from sync_jobs,
// and makes the REAL partner block/unblock HTTP call using THAT
// account's stored credentials. Replaces the dummy processing in
// the process_sync_jobs() SQL function.
// Deploy: supabase functions deploy sync-worker
//         (schedule it in the dashboard, e.g. */1 * * * *)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// per-channel block/unblock adapters — real partner API calls
async function callPartner(channel: string, action: string, cfg: any, payload: any): Promise<void> {
  // const base = { Playo: "https://partner.playo.io", Hudle: "...", District: "..." }[channel];
  // await fetch(`${base}/venues/${cfg.venue_id}/${action}`, {
  //   method: "POST", headers: { Authorization: `Bearer ${cfg.api_key}` },
  //   body: JSON.stringify({ court: payload.court, date: payload.date, hour: payload.hour }),
  // });
  // throw on non-2xx so the job retries with backoff.
}

Deno.serve(async () => {
  // claim a batch (SKIP LOCKED keeps concurrent workers safe)
  const { data: jobs } = await db.rpc("claim_sync_jobs", { p_limit: 50 }).catch(() => ({ data: [] as any[] }));
  let done = 0, failed = 0;

  for (const j of jobs ?? []) {
    // load this account's config (holds venue_id + a Vault secret_id — NOT the key)
    const { data: intg } = await db.from("integrations")
      .select("config").eq("tenant_id", j.tenant_id).eq("channel", j.channel).maybeSingle();
    const cfg = intg?.config ?? {};
    // decrypt THIS account's own partner key from Vault (service role only)
    let apiKey = "";
    if (cfg.secret_id) {
      const { data: sec } = await db.schema("vault").from("decrypted_secrets")
        .select("decrypted_secret").eq("id", cfg.secret_id).maybeSingle();
      apiKey = sec?.decrypted_secret ?? "";
    }
    try {
      await callPartner(j.channel, j.action, { ...cfg, api_key: apiKey }, j.payload);
      await db.from("sync_jobs").update({ status: "done", attempts: j.attempts + 1 }).eq("id", j.id);
      await db.from("sync_log").insert({
        tenant_id: j.tenant_id, channel: j.channel, action: "push",
        ext_ref: j.ext_ref, status: "ok",
        detail: `${j.action} ${j.payload.court} ${j.payload.date} ${j.payload.hour}:00 (from ${j.payload.source})`,
      });
      done++;
    } catch (e) {
      const attempts = j.attempts + 1;
      await db.from("sync_jobs").update({
        attempts, status: attempts >= 5 ? "failed" : "pending",
        next_run_at: new Date(Date.now() + attempts * 30_000).toISOString(),
        last_error: String(e).slice(0, 200),
      }).eq("id", j.id);
      failed++;
    }
  }
  return new Response(JSON.stringify({ done, failed }), { headers: { "Content-Type": "application/json" } });
});
