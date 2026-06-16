-- DIANAFARM GROUP secure Supabase schema.
-- This replaces the old static/demo policy set. Public users may create leads and read approved public content only.
-- Admin writes require authenticated users with an admin profile row.

create table if not exists public.dfg_admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.dfg_site_data (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.dfg_leads (
  id text primary key,
  created_at timestamptz not null default now(),
  type text not null default 'consultation',
  status text not null default 'new' check (status in ('new','in_progress','done','archived','spam')),
  lang text not null default 'ru',
  page text not null default '',
  booking_date text not null default '',
  booking_time text not null default '',
  data jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'server_saved',
  spam_score int not null default 0
);

create table if not exists public.dfg_reviews (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  visible boolean not null default false,
  rating int not null check (rating between 1 and 5),
  author text not null default '',
  country text not null default '',
  service text not null default '',
  text jsonb not null default '{}'::jsonb
);

create table if not exists public.dfg_media (
  id text primary key,
  created_at timestamptz not null default now(),
  path text not null,
  mime_type text not null,
  size_bytes int not null,
  uploaded_by uuid references auth.users(id)
);

alter table public.dfg_admin_profiles enable row level security;
alter table public.dfg_site_data enable row level security;
alter table public.dfg_leads enable row level security;
alter table public.dfg_reviews enable row level security;
alter table public.dfg_media enable row level security;

drop policy if exists "admin profiles self read" on public.dfg_admin_profiles;
drop policy if exists "site public read" on public.dfg_site_data;
drop policy if exists "site admin write" on public.dfg_site_data;
drop policy if exists "leads public insert" on public.dfg_leads;
drop policy if exists "leads admin read" on public.dfg_leads;
drop policy if exists "leads admin update" on public.dfg_leads;
drop policy if exists "leads admin delete" on public.dfg_leads;
drop policy if exists "reviews public approved read" on public.dfg_reviews;
drop policy if exists "reviews public insert pending" on public.dfg_reviews;
drop policy if exists "reviews admin all" on public.dfg_reviews;
drop policy if exists "media public read" on public.dfg_media;
drop policy if exists "media admin all" on public.dfg_media;

create or replace function public.dfg_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dfg_admin_profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'admin', 'editor')
  );
$$;

create policy "admin profiles self read"
  on public.dfg_admin_profiles for select
  using (auth.uid() = user_id);

create policy "site public read"
  on public.dfg_site_data for select
  using (id = 'main');

create policy "site admin write"
  on public.dfg_site_data for all
  using (public.dfg_is_admin())
  with check (public.dfg_is_admin());

create policy "leads public insert"
  on public.dfg_leads for insert
  with check (
    coalesce(length(data::text), 0) <= 12000
    and status = 'new'
  );

create policy "leads admin read"
  on public.dfg_leads for select
  using (public.dfg_is_admin());

create policy "leads admin update"
  on public.dfg_leads for update
  using (public.dfg_is_admin())
  with check (public.dfg_is_admin());

create policy "leads admin delete"
  on public.dfg_leads for delete
  using (public.dfg_is_admin());

create policy "reviews public approved read"
  on public.dfg_reviews for select
  using (status = 'approved' and visible = true);

create policy "reviews public insert pending"
  on public.dfg_reviews for insert
  with check (status = 'pending' and visible = false);

create policy "reviews admin all"
  on public.dfg_reviews for all
  using (public.dfg_is_admin())
  with check (public.dfg_is_admin());

create policy "media public read"
  on public.dfg_media for select
  using (true);

create policy "media admin all"
  on public.dfg_media for all
  using (public.dfg_is_admin())
  with check (public.dfg_is_admin());


-- v300 storage bucket for admin media uploads.
insert into storage.buckets (id, name, public)
values ('dfg-media', 'dfg-media', true)
on conflict (id) do update set public = true;

drop policy if exists "dfg media public read" on storage.objects;
drop policy if exists "dfg media admin insert" on storage.objects;
drop policy if exists "dfg media admin update" on storage.objects;
drop policy if exists "dfg media admin delete" on storage.objects;

create policy "dfg media public read" on storage.objects for select using (bucket_id = 'dfg-media');
create policy "dfg media admin insert" on storage.objects for insert with check (bucket_id = 'dfg-media' and public.dfg_is_admin());
create policy "dfg media admin update" on storage.objects for update using (bucket_id = 'dfg-media' and public.dfg_is_admin()) with check (bucket_id = 'dfg-media' and public.dfg_is_admin());
create policy "dfg media admin delete" on storage.objects for delete using (bucket_id = 'dfg-media' and public.dfg_is_admin());
