/*
# Enable pgvector and create core schema for The Dialectical Cabinet

## Summary
Creates the full database schema for a multi-agent philosophical reasoning system
where nine historically grounded philosopher agents discuss contemporary questions
through a three-pass dialectical protocol with RAG-grounded source citations.

## New Tables
1. `philosophers` - The nine cabinet members with structured intellectual profiles
2. `corpus_sources` - Bibliography/licensing manifest for each philosopher's works
3. `corpus_chunks` - Vectorized text chunks from each philosopher's corpus for RAG retrieval
4. `corpus_passages` - Curated key passages for citation display in the UI
5. `meetings` - Cabinet sessions (question, seating order, pass count, status)
6. `interventions` - Each agent's contribution during a meeting
7. `position_memory` - Each agent's evolving positions across passes
8. `pass_summaries` - Problem Map, Dialectical Map, Spiral Synthesis outputs

## Security
- RLS enabled on all tables
- Public read/write (single-tenant, no sign-in) via `TO anon, authenticated`
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. PHILOSOPHERS TABLE
CREATE TABLE IF NOT EXISTS philosophers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  birth_year integer,
  death_year integer,
  historical_boundary text,
  seat_order integer NOT NULL DEFAULT 0,
  icon_name text NOT NULL DEFAULT 'Feather',
  accent_color text NOT NULL DEFAULT '#4a392d',
  profile jsonb NOT NULL DEFAULT '{}',
  analytical_center jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- 2. CORPUS SOURCES TABLE (bibliography/licensing manifest)
CREATE TABLE IF NOT EXISTS corpus_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  philosopher_id uuid NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
  author text NOT NULL,
  title text NOT NULL,
  publication_date text,
  work_type text NOT NULL DEFAULT 'book',
  language text NOT NULL DEFAULT 'en',
  source_url text,
  licence_status text NOT NULL DEFAULT 'COPYRIGHT_STATUS_UNCERTAIN',
  source_reliability text DEFAULT 'medium',
  full_text_ingested boolean NOT NULL DEFAULT false,
  metadata_only boolean NOT NULL DEFAULT false,
  translation_notes text,
  is_magnum_opus boolean NOT NULL DEFAULT false,
  is_final_work boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. CORPUS CHUNKS TABLE (vectorized text for RAG)
CREATE TABLE IF NOT EXISTS corpus_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  philosopher_id uuid NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES corpus_sources(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  chunk_text text NOT NULL,
  section_label text,
  work_title text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- 4. CORPUS PASSAGES TABLE (curated key passages for UI citation display)
CREATE TABLE IF NOT EXISTS corpus_passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  philosopher_id uuid NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES corpus_sources(id) ON DELETE CASCADE,
  passage_text text NOT NULL,
  citation_label text NOT NULL,
  work_title text NOT NULL,
  section_label text,
  created_at timestamptz DEFAULT now()
);

-- 5. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  seating_order text[] NOT NULL DEFAULT '{}',
  num_passes integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'draft',
  current_pass integer NOT NULL DEFAULT 0,
  current_agent_index integer NOT NULL DEFAULT 0,
  transformed_question text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. INTERVENTIONS TABLE
CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  philosopher_id uuid NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
  pass_number integer NOT NULL DEFAULT 1,
  seat_position integer NOT NULL DEFAULT 0,
  response_text text NOT NULL DEFAULT '',
  retrieved_chunk_ids uuid[] DEFAULT '{}',
  citations jsonb NOT NULL DEFAULT '[]',
  position_label text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 7. POSITION MEMORY TABLE
CREATE TABLE IF NOT EXISTS position_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  philosopher_id uuid NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
  original_position text,
  pass_1_position text,
  pass_2_position text,
  pass_3_position text,
  changed_my_mind_about text,
  still_defend text,
  adopted_from_other_agent text,
  rejected_from_other_agent text,
  new_conceptual_distinction text,
  unresolved_tension text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, philosopher_id)
);

-- 8. PASS SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS pass_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  pass_number integer NOT NULL DEFAULT 1,
  summary_type text NOT NULL DEFAULT 'problem_map',
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, pass_number, summary_type)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_philosopher ON corpus_chunks(philosopher_id);
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_source ON corpus_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_corpus_chunks_embedding ON corpus_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_corpus_sources_philosopher ON corpus_sources(philosopher_id);
CREATE INDEX IF NOT EXISTS idx_corpus_passages_philosopher ON corpus_passages(philosopher_id);
CREATE INDEX IF NOT EXISTS idx_interventions_meeting ON interventions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_interventions_meeting_pass ON interventions(meeting_id, pass_number);
CREATE INDEX IF NOT EXISTS idx_position_memory_meeting ON position_memory(meeting_id);
CREATE INDEX IF NOT EXISTS idx_pass_summaries_meeting ON pass_summaries(meeting_id);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE philosophers ENABLE ROW LEVEL SECURITY;
ALTER TABLE corpus_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE corpus_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE corpus_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_summaries ENABLE ROW LEVEL SECURITY;

-- POLICIES (single-tenant, no auth — public read/write via anon + authenticated)

-- philosophers
DROP POLICY IF EXISTS "anon_select_philosophers" ON philosophers;
CREATE POLICY "anon_select_philosophers" ON philosophers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_philosophers" ON philosophers;
CREATE POLICY "anon_insert_philosophers" ON philosophers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_philosophers" ON philosophers;
CREATE POLICY "anon_update_philosophers" ON philosophers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_philosophers" ON philosophers;
CREATE POLICY "anon_delete_philosophers" ON philosophers FOR DELETE TO anon, authenticated USING (true);

-- corpus_sources
DROP POLICY IF EXISTS "anon_select_corpus_sources" ON corpus_sources;
CREATE POLICY "anon_select_corpus_sources" ON corpus_sources FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_corpus_sources" ON corpus_sources;
CREATE POLICY "anon_insert_corpus_sources" ON corpus_sources FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_corpus_sources" ON corpus_sources;
CREATE POLICY "anon_update_corpus_sources" ON corpus_sources FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_corpus_sources" ON corpus_sources;
CREATE POLICY "anon_delete_corpus_sources" ON corpus_sources FOR DELETE TO anon, authenticated USING (true);

-- corpus_chunks
DROP POLICY IF EXISTS "anon_select_corpus_chunks" ON corpus_chunks;
CREATE POLICY "anon_select_corpus_chunks" ON corpus_chunks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_corpus_chunks" ON corpus_chunks;
CREATE POLICY "anon_insert_corpus_chunks" ON corpus_chunks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_corpus_chunks" ON corpus_chunks;
CREATE POLICY "anon_update_corpus_chunks" ON corpus_chunks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_corpus_chunks" ON corpus_chunks;
CREATE POLICY "anon_delete_corpus_chunks" ON corpus_chunks FOR DELETE TO anon, authenticated USING (true);

-- corpus_passages
DROP POLICY IF EXISTS "anon_select_corpus_passages" ON corpus_passages;
CREATE POLICY "anon_select_corpus_passages" ON corpus_passages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_corpus_passages" ON corpus_passages;
CREATE POLICY "anon_insert_corpus_passages" ON corpus_passages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_corpus_passages" ON corpus_passages;
CREATE POLICY "anon_update_corpus_passages" ON corpus_passages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_corpus_passages" ON corpus_passages;
CREATE POLICY "anon_delete_corpus_passages" ON corpus_passages FOR DELETE TO anon, authenticated USING (true);

-- meetings
DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE TO anon, authenticated USING (true);

-- interventions
DROP POLICY IF EXISTS "anon_select_interventions" ON interventions;
CREATE POLICY "anon_select_interventions" ON interventions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_interventions" ON interventions;
CREATE POLICY "anon_insert_interventions" ON interventions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_interventions" ON interventions;
CREATE POLICY "anon_update_interventions" ON interventions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_interventions" ON interventions;
CREATE POLICY "anon_delete_interventions" ON interventions FOR DELETE TO anon, authenticated USING (true);

-- position_memory
DROP POLICY IF EXISTS "anon_select_position_memory" ON position_memory;
CREATE POLICY "anon_select_position_memory" ON position_memory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_position_memory" ON position_memory;
CREATE POLICY "anon_insert_position_memory" ON position_memory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_position_memory" ON position_memory;
CREATE POLICY "anon_update_position_memory" ON position_memory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_position_memory" ON position_memory;
CREATE POLICY "anon_delete_position_memory" ON position_memory FOR DELETE TO anon, authenticated USING (true);

-- pass_summaries
DROP POLICY IF EXISTS "anon_select_pass_summaries" ON pass_summaries;
CREATE POLICY "anon_select_pass_summaries" ON pass_summaries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pass_summaries" ON pass_summaries;
CREATE POLICY "anon_insert_pass_summaries" ON pass_summaries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pass_summaries" ON pass_summaries;
CREATE POLICY "anon_update_pass_summaries" ON pass_summaries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pass_summaries" ON pass_summaries;
CREATE POLICY "anon_delete_pass_summaries" ON pass_summaries FOR DELETE TO anon, authenticated USING (true);

-- VECTOR SIMILARITY SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  filter_philosopher_id uuid,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  work_title text,
  section_label text,
  source_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.chunk_text,
    cc.work_title,
    cc.section_label,
    cc.source_id,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM corpus_chunks cc
  WHERE cc.philosopher_id = filter_philosopher_id
    AND cc.embedding IS NOT NULL
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;