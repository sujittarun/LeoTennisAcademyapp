// ============================================================
// Academy Manager — nightly reconcile + alert (Supabase Edge Function)
// SCAFFOLD. Runs on a schedule (Supabase cron, e.g. nightly + hourly),
// diffs each day's ledger against what actually reached the partner
// channels (reconcile_report), reads the sync engine's alarm signals
// (platform_health), and PAGES you via a webhook when anything crosses
// a threshold — so drift/stuck-jobs surface before a tenant notices.
//
// Deploy:   supabase functions deploy reconcile
// Schedule: dashboard → Edge Functions → cron, e.g. "0 * * * *" (hourly)
//           and "30 20 * * *" (02:00 IST full-day reconcile)
// Secrets:  ALERT_WEBHOOK_URL  (Slack/Discord/generic incoming webhook)
//           SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected by the
//           platform. The service role bypasses the operator-only guards.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const WEBHOOK = Deno.env.get("ALERT_WEBHOOK_URL") ?? "";

// thresholds that constitute "page me"
const MAX_GAPS = 0;          // any un-propagated booking is drift
const MAX_FAILED_JOBS = 0;   // any dead-lettered push
const MAX_QUEUE_AGE_MIN = 30; // queue older than this = worker stalled

async function post(text: string): Promise<void> {
  if (!WEBHOOK) { console.log("[no ALERT_WEBHOOK_URL] " + text); return; }
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }), // Slack/Discord-compatible
  }).catch((e) => console.error("alert post failed", e));
}

Deno.serve(async () => {
  const today = new Date().toISOString().slice(0, 10);

  // service role → call operator RPCs directly (guards are for JWT callers)
  const { data: rec } = await db.rpc("reconcile_report", { p_date: today });
  const { data: health } = await db.rpc("platform_health");

  const gaps = rec?.gap_count ?? 0;
  const staleR = (rec?.stale_channels ?? []).length;
  const failed = health?.jobs?.failed ?? 0;
  const pending = health?.jobs?.pending ?? 0;
  const oldest = health?.jobs?.oldest_pending_mins ?? 0;
  const dead = (health?.dead_letters ?? []).length;

  const problems: string[] = [];
  if (gaps > MAX_GAPS) problems.push(`${gaps} propagation gap(s) — bookings not blocked on every channel`);
  if (failed > MAX_FAILED_JOBS || dead > 0) problems.push(`${failed || dead} dead-lettered push job(s)`);
  if (pending > 0 && oldest > MAX_QUEUE_AGE_MIN) problems.push(`sync queue stalled: ${pending} jobs, oldest ${oldest}m`);
  if (staleR > 0) problems.push(`${staleR} channel(s) not synced in >6h`);

  if (problems.length) {
    await post(`⚠ Academy Manager — sync health (${today})\n• ` + problems.join("\n• "));
  }

  return new Response(JSON.stringify({ ok: true, date: today, problems }), {
    headers: { "Content-Type": "application/json" },
  });
});
