/**
 * export-personas: dump room personas to public/room/personas.json.
 * The cron room-tick runs under plain node (no `@/` alias, no bundler),
 * so personas are exported here — deterministic, versioned, reviewable.
 * Re-run after any thinking-file edit: npm run room:personas
 *
 * Room voice = THINK mode, anonymous (Sep 30 2026): the thinking slice
 * with no life file and no expression file — moves must identify, names
 * never ride. All ops ship (no per-turn selection in a static file;
 * the prompt says use what fits). Genzie keeps her old-style entry:
 * fictional seat, no corpus, no thinking file — rude margins voice.
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
import { renderThinkingPersona } from ${JSON.stringify(join(root, 'src/philosophers/thinking-select.ts'))};
import { ANONYMOUS_LEAD } from ${JSON.stringify(join(root, 'src/philosophers/thinking-select.ts'))};
import { getThinkingPilot } from ${JSON.stringify(join(root, 'src/philosophers/index.ts'))};
import { PROMPT_VERSION } from ${JSON.stringify(join(root, 'src/lib/dialectic/prompts.ts'))};
const seats = {};
for (const p of PHILOSOPHER_DATA) {
  const entry = getThinkingPilot(p.slug);
  if (!entry) {
    // Genzie and any unmigrated seat keep the old-style room persona.
    const e = p.style_essence;
    seats[p.slug] = { name: p.full_name, short: p.name, persona: [
      'You are ' + p.full_name + '.',
      'ANALYTICAL CENTRE: ' + p.analytical_center.join(', ') + '.',
      'EMOTIONAL TONE: ' + p.profile.emotional_tone,
      '',
      'CHARACTERISTIC MOVEMENT: ' + e.characteristic_movement,
      'REGISTER: ' + e.prompt,
    ].join('\\n') };
    continue;
  }
  const t = entry.thinking;
  const persona = renderThinkingPersona(t, 'think',
    { operations: t.operations, faultLine: null }, null, null, ANONYMOUS_LEAD);
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
