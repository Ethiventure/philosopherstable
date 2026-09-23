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
 * Setup (owner, ~10 minutes, once):
 *  1. Free Cloudflare account → Workers & Pages.
 *  2. GitHub → Settings → Developer settings → Personal access tokens →
 *     Fine-grained tokens → Generate: this repo only, Actions READ+WRITE
 *     (starting a workflow needs write; the token never touches code).
 *  3. `npx wrangler login` then in this directory:
 *       wrangler secret put GH_PAT     # paste the token, stored encrypted
 *       wrangler deploy
 *     GH_REPO ships below in wrangler.toml (public name, not a secret).
 *  4. Dashboard → worker → Settings → Triggers shows the cron; View events
 *     shows each firing. First room turn lands within ~45 min (+ minutes
 *     for the file host to catch up).
 * Rotation: when the token expires, make a new one and repeat step 3 only.
 * No code change, ever. Never commit the token.
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
