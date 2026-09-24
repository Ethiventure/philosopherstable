/**
 * room-cron: Cloudflare Worker that starts one Senior Common Room turn
 * every 45 minutes (~32 turns/day) via GitHub's workflow_dispatch API.
 *
 * Why this exists: GitHub's own `schedule` trigger starts our room-tick
 * workflow ~6x/day on a quiet repo (throttled, not broken). This worker
 * is the clock GitHub won't be — one HTTPS call per tick, no server kept.
 *
 * Cost: Workers Free plan. 32 cron invocations/day against a 100,000/day
 * allowance; outbound calls aren't billed. $0. Verified Sep 23 2026
 * against developers.cloudflare.com pricing + cron-triggers docs.
 *
 * Setup outcome Sep 24 2026: dashboard agent deployed the code exactly
 * but was denied the cron trigger and holds no secrets. Owner finishes
 * manually (worker → Settings): (1) Triggers → Cron Triggers → Add
 * an every-45-minutes trigger (:00 and :45 UTC); (2) Variables and Secrets
 * (paste GitHub fine-grained token: this repo, Actions READ+WRITE);
 * (3) Deploy. GH_REPO landed as a secret instead of a plain variable —
 * harmless (code reads either), leave it.
 *  Confirm: worker → Settings → Triggers shows the cron; View events
 *  shows firings (allow ~15 min). First room turn lands within ~45 min
 *  (+ minutes for the file host to catch up).
 * Current method (kept until the Worker proves better): GitHub `schedule`
 * (every 20 minutes) in `.github/workflows/room-tick.yml` starts the workflow ~6x/day
 * on this quiet repo. ROLLBACK RULE: if the Worker isn't landing real
 * turns at :00/:45 cadence within 2 days of switch-on, delete the Worker
 * and keep the GitHub schedule — comparison is turns/day, nothing else.
 * Rotation: when the token expires, make a new one and repeat the secret
 * step only. No code change, ever. Never commit the token.
 */

const DISPATCH_URL = (repo) =>
  `https://api.github.com/repos/${repo}/actions/workflows/room-tick.yml/dispatches`;

export default {
  async scheduled(event, env, ctx) {
    if (!env.GH_PAT) throw new Error('GH_PAT secret missing (wrangler secret put GH_PAT)');
    const res = await fetch(DISPATCH_URL(env.GH_REPO), {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GH_PAT}`,
        'Content-Type': 'application/json',
        'User-Agent': 'philosopherstable-room-cron',
      },
      // Blank inputs = roster order (room-tick.mjs advances its own cursor).
      body: JSON.stringify({ ref: 'main', inputs: {} }),
    });
    // GitHub answers 204 when the run is accepted. Anything else means the
    // run never started — throw so the failure shows in Cron Events.
    if (res.status !== 204) {
      throw new Error(`dispatch refused: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
  },
};
