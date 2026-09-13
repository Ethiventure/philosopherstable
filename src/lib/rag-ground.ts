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

interface CachedAuthor {
  prepared: PreparedIndex;
  author: string;
  works: { id: string; title: string; source_url: string }[];
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
    // Match on family name: "Georg Wilhelm Friedrich Hegel" must find the
    // "G.W.F. Hegel" shard, where initials defeat substring matching.
    const last = key.split(/[\s.]+/).filter(Boolean).pop() ?? key;
    const entry = manifest.authors.find((a) => a.author.toLowerCase().includes(last));
    if (!entry) return null;
    const shard = (await (await fetch(`rag/${entry.file}`)).json()) as AuthorShard & {
      works: { id: string; title: string; source_url: string }[];
    };
    const joined = joinShard(shard);
    if (!joined.length) return null;
    const loaded: CachedAuthor = { prepared: prepareIndex(joined), author: entry.author, works: shard.works };
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
  // Filter on the shard's own author string (e.g. "G.W.F. Hegel"), not the
  // caller's fuller name — same family, different initials formatting.
  const debug = searchIndex(loaded.prepared, query, { author: loaded.author, limit });
  if (debug.evidence === 'none' || !debug.selected.length) return null;
  const first = debug.selected[0];
  const work = loaded.works.find((w) => w.title === first.passage.work_title)
    ?? { title: first.passage.work_title, source_url: first.passage.source_url };
  const number = manifestNumberForUrl(work.source_url) ?? manifestNumberForUrl(first.passage.source_url);
  if (number === null) return null;
  const quoted = debug.selected.map((s) => `> ${s.passage.text}`).join('\n');
  return {
    block: [
      `INDEXED PASSAGES from "${work.title}" [${number}] — searched from this thinker's own indexed works for this question; quote them verbatim where you use them (copy the exact words inside "double quotes" so the claim stays checkable); otherwise closely paraphrase, always citing [${number}]:`,
      quoted,
    ].join('\n'),
    receipt: {
      title: work.title,
      number,
      passages: debug.selected.map((s) => s.passage.text),
      reason: null,
    },
    chunks: debug.selected.map((s) => ({ title: work.title, text: s.passage.text, source_url: work.source_url })),
  };
}
