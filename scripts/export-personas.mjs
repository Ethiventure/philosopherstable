/**
 * export-personas: dump lean Low room-personas to public/room/personas.json.
 * The cron room-tick runs under plain node (no `@/` alias, no bundler),
 * so personas are exported here — deterministic, versioned, reviewable.
 * Re-run after any persona/style edit: npm run room:personas
 * Room voice = Low register by design (short plain chatter, not sittings).
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = join(tmpdir(), `room-personas-${Date.now()}`);
mkdirSync(work, { recursive: true });
const tmp = join(work, 'entry.mjs');
const out = join(work, 'bundle.mjs');

const entry = `import { PHILOSOPHER_DATA } from ${JSON.stringify(join(root, 'src/philosophers/index.ts'))};
import { renderLowStyleEssence } from ${JSON.stringify(join(root, 'src/philosophers/shared/low-style.ts'))};
import { SEAT_TRIOS } from ${JSON.stringify(join(root, 'src/philosophers/trios.ts'))};
import { PROMPT_VERSION } from ${JSON.stringify(join(root, 'src/lib/dialectic/prompts.ts'))};
const seats = {};
for (const p of PHILOSOPHER_DATA) {
  const persona = [
    'You are ' + p.full_name + '.',
    'ANALYTICAL CENTRE: ' + p.analytical_center.join(', ') + '.',
    'EMOTIONAL TONE: ' + p.profile.emotional_tone,
    '',
    ...renderLowStyleEssence(p.style_essence, SEAT_TRIOS[p.slug]),
  ].join('\\n');
  seats[p.slug] = { name: p.full_name, short: p.name, persona };
}
console.log(JSON.stringify({ promptVersion: PROMPT_VERSION, exportedAt: new Date().toISOString(), seats }));
`;
writeFileSync(tmp, entry);
const raw = execSync(`npx esbuild ${JSON.stringify(tmp)} --bundle --platform=node --format=esm --alias:@=${JSON.stringify(join(root, 'src'))} --outfile=${JSON.stringify(out)} --log-level=error && node ${JSON.stringify(out)}`, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const data = JSON.parse(raw);
mkdirSync(join(root, 'public', 'room'), { recursive: true });
writeFileSync(join(root, 'public', 'room', 'personas.json'), `${JSON.stringify(data)}\n`);
rmSync(work, { recursive: true, force: true });
console.log(`personas: ${Object.keys(data.seats).length} seats, prompt ${data.promptVersion}`);
for (const [slug, s] of Object.entries(data.seats)) {
  console.log(`  ${slug}: ~${Math.round(s.persona.length / 4)} tokens`);
}
