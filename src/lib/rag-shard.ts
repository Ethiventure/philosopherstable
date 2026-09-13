/**
 * Shard join: slim on-disk passages + work records → full IndexPassage.
 * Erasable-syntax TS: node CLI tools import this directly.
 */
import type { IndexPassage } from './rag-search.ts';

export interface ShardWork {
  id: string;
  title: string;
  passages: number;
  source_url: string;
}

export interface ShardPassage {
  id: string;
  work_id: string;
  section: string | null;
  path: string | null;
  ord: number;
  words: number;
  text: string;
}

export interface AuthorShard {
  author: string;
  works: ShardWork[];
  passages: ShardPassage[];
}

export function joinShard(shard: AuthorShard): IndexPassage[] {
  const works = new Map(shard.works.map((w) => [w.id, w]));
  const out: IndexPassage[] = [];
  for (const p of shard.passages) {
    const w = works.get(p.work_id);
    if (!w) continue;
    out.push({
      id: p.id, work_id: p.work_id, author: shard.author, work_title: w.title,
      section_title: p.section, section_path: p.path, ordinal: p.ord,
      word_count: p.words, text: p.text, source_url: w.source_url,
    });
  }
  return out;
}
