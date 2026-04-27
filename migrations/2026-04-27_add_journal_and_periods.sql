-- Migration: add journal_entries and periods_log to the shared cycles table.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run multiple times.
--
-- Why:
--  - journal_entries: shared journal between partners (each partner reads
--    everything but only edits their own rows; merging is done client-side).
--  - periods_log: every period START date the woman has logged, so both
--    partners share an accurate cycle history (used by the History tab and
--    by predictions).
--
-- Both columns store JSON arrays. We default them to [] so reads never return
-- null (the client already tolerates null, but [] keeps the shape clean).

ALTER TABLE public.cycles
  ADD COLUMN IF NOT EXISTS journal_entries jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.cycles
  ADD COLUMN IF NOT EXISTS periods_log jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Optional: backfill any pre-existing rows that somehow have null
-- (shouldn't happen with the DEFAULT above, but kept for safety).
UPDATE public.cycles
   SET journal_entries = '[]'::jsonb
 WHERE journal_entries IS NULL;

UPDATE public.cycles
   SET periods_log = '[]'::jsonb
 WHERE periods_log IS NULL;

-- Sanity check (uncomment to inspect from the SQL editor):
-- SELECT code, jsonb_array_length(journal_entries) AS n_entries,
--        jsonb_array_length(periods_log)     AS n_periods
--   FROM public.cycles;
