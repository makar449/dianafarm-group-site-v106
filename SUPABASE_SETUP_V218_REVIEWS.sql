-- DIANAFARM GROUP v218 — Supabase backend for reviews moderation
-- Run this in Supabase SQL editor if you want shared admin/reviews backend.

create table if not exists dfg_reviews (
  id text primary key,
  created_at timestamptz default now(),
  status text default 'pending' check (status in ('pending','approved','rejected')),
  visible boolean default true,
  rating int default 5 check (rating between 1 and 5),
  author text default '',
  country text default '',
  service text default '',
  text jsonb default '{}'::jsonb
);

alter table dfg_reviews enable row level security;

drop policy if exists "public read approved visible reviews" on dfg_reviews;
create policy "public read approved visible reviews"
on dfg_reviews for select
using (status = 'approved' and visible = true);

-- For full admin writes through the current static admin panel using the anon key,
-- keep the next policy enabled only for trusted/private deployments.
-- For production-grade auth, replace this with authenticated-role policies.
drop policy if exists "anon manage reviews for static admin" on dfg_reviews;
create policy "anon manage reviews for static admin"
on dfg_reviews for all
to anon
using (true)
with check (true);
