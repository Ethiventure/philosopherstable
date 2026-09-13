/**
 * RAG grounding for the app: index-first, live-fetch fallback.
 *
 * The static per-author shards (public/rag/) load lazily — one thinker's
 * slice only, cached in memory, never in the bundle. When the index has
 * nothing for the thinker (or the fetch fails), callers fall back to the
 * live extract.js path. Toggle-gated by settings.grounding like before.
 */
import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';
import { prepareIndex, searchIndex, type PreparedIndex } from './rag-search';
import { joinShard, type AuthorShard } from './rag-shard';

interface ShardHit {
  prepared: PreparedIndex;
  author: string;
  works: { id: string; title: string; source_url: string; corpus_source_url?: string | null }[];
}

interface CachedAuthor {
  shards: ShardHit[];
}

const cache = new Map<string, CachedAuthor>();

function manifestNumberForUrl(url: string): number | null {
  const i = CORPUS_SOURCES_DATA.findIndex((s) => s.source_url === url);
  return i >= 0 ? i + 1 : null;
}

async function loadThinker(authorName: string): Promise<CachedAuthor | null> {
  const key = authorName.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const manifest = (await (await fetch('rag/manifest.json')).json()) as {
      authors: { file: string; author: string }[];
    };
    // Match on family name so "Georg Wilhelm Friedrich Hegel" finds the
    // "G.W.F. Hegel" shard. Rank exact > starts-with > includes, and keep
    // every shard of the family (Marx solos + the Marx-and-Engels joint
    // shard) — searching only one would strand the Manifesto.
    const last = key.split(/[\s.]+/).filter(Boolean).pop() ?? key;
    const rank = (a: string): number => {
      const al = a.toLowerCase();
      if (al === key) return 0;
      if (al.startsWith(key) || key.startsWith(al)) return 1;
      if (al.includes(last)) return 2;
      return 3;
    };
    const entries = manifest.authors
      .filter((a) => rank(a.author) < 3)
      .sort((a, b) => rank(a.author) - rank(b.author))
      .slice(0, 3);
    if (!entries.length) return null;
    const shards: ShardHit[] = [];
    for (const entry of entries) {
      try {
        const shard = (await (await fetch(`rag/${entry.file}`)).json()) as AuthorShard & {
          works: { id: string; title: string; source_url: string; corpus_source_url?: string | null }[];
        };
        const joined = joinShard(shard);
        if (joined.length) shards.push({ prepared: prepareIndex(joined), author: entry.author, works: shard.works });
      } catch {
        // One unreadable shard never sinks the family.
      }
    }
    if (!shards.length) return null;
    const loaded: CachedAuthor = { shards };
    cache.set(key, loaded);
    return loaded;
  } catch {
    return null;
  }
}

export interface RagGrounding {
  /** Prompt block citing the manifest number, same contract as live grounding. */
  block: string;
  /** Receipt for verification UI + export honesty. */
  receipt: { title: string; number: number; passages: string[]; reason: string | null };
  /** Full chunks for the clickable-sources UI (desk). */
  chunks: { title: string; text: string; source_url: string }[];
}

/**
 * Searched passages from the thinker's OWN indexed works. Never touches
 * another thinker's shard: the author filter is structural.
 */
export async function searchThinkerPassages(
  authorName: string,
  query: string,
  limit = 5,
): Promise<RagGrounding | null> {
  const loaded = await loadThinker(authorName);
  if (!loaded) return null;
  // One shard per family member, each filtered on its own author string
  // (initials formatting differs); merge by score and keep the best.
  // Fail-soft like the old live path: any merged passages ground the turn,
  // even weak ones — the receipt says what was shown either way.
  const allWorks = loaded.shards.flatMap((s) => s.works);
  const workOf = (title: string, url: string) =>
    allWorks.find((w) => w.title === title)
    ?? { title, source_url: url, corpus_source_url: null as string | null };
  const merged = loaded.shards
    .flatMap((s) => searchIndex(s.prepared, query, { author: s.author, limit }).selected)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);
  if (!merged.length) return null;
  const first = merged[0];
  const work = workOf(first.passage.work_title, first.passage.source_url);
  // Prefer the corpus reading link for footnote numbering (the indexed fetch
  // URL may be an OCR dump with no manifest entry of its own).
  const number = manifestNumberForUrl(work.corpus_source_url ?? work.source_url) ?? manifestNumberForUrl(first.passage.source_url);
  if (number === null) return null;
  const quoted = merged.map((s) => `> ${s.passage.text}`).join('\n');
  return {
    block: [
      `INDEXED PASSAGES from '${work.title}' [${number}] — searched from this thinker's own indexed works for this question. Borrow visibly: weave at least two distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from these passages into your own sentences, and cite the use [${number}]. Reaching for their less famous vocabulary beats restating their greatest hits: prefer the passage's own terms over your stock summary of this thinker. What you don't borrow, closely paraphrase, always citing [${number}]:`,
      quoted,
    ].join('\n'),
    receipt: {
      title: work.title,
      number,
      passages: merged.map((s) => s.passage.text),
      reason: null,
    },
    chunks: merged.map((s) => {
      const w = workOf(s.passage.work_title, s.passage.source_url);
      return { title: w.title, text: s.passage.text, source_url: w.source_url };
    }),
  };
}
