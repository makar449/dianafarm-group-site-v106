# DIANAFARM GROUP v123 — Real Admin / Live Requests setup

GitHub Pages is a static host. A real shared admin panel needs a shared database.
This version supports Supabase through `assets/js/backend-config.js`.

## 1. Create Supabase project
Create a new project at Supabase and copy:
- Project URL
- anon public key

## 2. Run SQL
Open Supabase SQL editor and run:

```sql
create table if not exists public.dfg_site_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.dfg_leads (
  id text primary key,
  created_at timestamptz not null default now(),
  type text,
  status text not null default 'new',
  lang text,
  page text,
  booking_date text,
  booking_time text,
  data jsonb not null default '{}'::jsonb
);

-- Fast demo/public static mode. This makes the frontend work on GitHub Pages.
-- For real production security, replace with Supabase Auth / Edge Functions.
alter table public.dfg_site_data enable row level security;
alter table public.dfg_leads enable row level security;

drop policy if exists "dfg_site_public_read" on public.dfg_site_data;
drop policy if exists "dfg_site_public_write" on public.dfg_site_data;
drop policy if exists "dfg_leads_public_insert" on public.dfg_leads;
drop policy if exists "dfg_leads_public_admin" on public.dfg_leads;

create policy "dfg_site_public_read" on public.dfg_site_data
for select using (true);

create policy "dfg_site_public_write" on public.dfg_site_data
for insert with check (true);

create policy "dfg_site_public_update" on public.dfg_site_data
for update using (true) with check (true);

create policy "dfg_leads_public_insert" on public.dfg_leads
for insert with check (true);

create policy "dfg_leads_public_admin" on public.dfg_leads
for select using (true);

create policy "dfg_leads_public_update" on public.dfg_leads
for update using (true) with check (true);

create policy "dfg_leads_public_delete" on public.dfg_leads
for delete using (true);
```

## 3. Enable backend in the site
Open `assets/js/backend-config.js` and set:

```js
window.DFG_BACKEND_CONFIG = {
  enabled: true,
  provider: 'supabase',
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_PUBLIC_KEY',
  tables: {
    siteData: 'dfg_site_data',
    leads: 'dfg_leads'
  }
};
```

## 4. Publish again to GitHub Pages
Commit and push the updated site.

## 5. First admin sync
Open `/admin.html`, login, open "Интеграции", click "Синхронизировать Supabase" or save any item.
The initial site data will be created in Supabase.

## Important security note
This GitHub Pages version can work as a real shared demo/admin because Supabase stores data centrally.
For sensitive production data, use Supabase Auth, server-side API routes or Edge Functions so private leads are not publicly readable by the anon key.
