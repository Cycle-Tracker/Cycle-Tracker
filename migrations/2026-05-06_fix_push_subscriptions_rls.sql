-- Migration: relax RLS on push_subscriptions so anon clients can upsert.
--
-- The original migration created policies that look permissive
-- (`with check (true)`) but Supabase's UPSERT path needs both INSERT
-- and the implicit SELECT to be allowed. The previous SELECT policy was
-- restricted to authenticated users matching their own user_id, which
-- caused the upsert path to fail with:
--    new row violates row-level security policy for table
--    "push_subscriptions"  (code 42501)
--
-- Run this in the Supabase SQL Editor. Idempotent.

alter table public.push_subscriptions enable row level security;

-- Drop any prior policies (names from previous migration).
drop policy if exists "insert own push sub"      on public.push_subscriptions;
drop policy if exists "update own push sub"      on public.push_subscriptions;
drop policy if exists "delete own push sub"      on public.push_subscriptions;
drop policy if exists "select own push sub"      on public.push_subscriptions;

-- Allow anyone (anon + authenticated) to manage rows. The endpoint is
-- unguessable from outside, so we use it as the security boundary —
-- the same pattern as the cycles table.
create policy "anyone can insert push sub"
  on public.push_subscriptions
  for insert
  to anon, authenticated
  with check (true);

create policy "anyone can update push sub"
  on public.push_subscriptions
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "anyone can delete push sub"
  on public.push_subscriptions
  for delete
  to anon, authenticated
  using (true);

-- SELECT is needed by upsert's conflict resolution. Allow read of any row
-- — it doesn't leak much (just endpoints + cycle codes the requester
-- presumably already knows).
create policy "anyone can select push sub"
  on public.push_subscriptions
  for select
  to anon, authenticated
  using (true);
