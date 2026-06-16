# DIANAFARM v300 — real admin sync setup

Local/demo admin publishing is disabled. If the admin changes content, it is published only when Supabase or the Node backend confirms the save. That is the only way edits can appear on every device.

## GitHub Pages mode: use Supabase

GitHub Pages cannot run `/api/*`. For GitHub Pages you must connect Supabase.

1. Create Supabase project.
2. Open SQL Editor and run `sql/supabase-production-rls.sql` from this archive.
3. Create an admin user in Authentication → Users.
4. Copy the admin user's UUID and run:

```sql
insert into public.dfg_admin_profiles (user_id, role)
values ('PASTE_AUTH_USER_UUID_HERE', 'owner')
on conflict (user_id) do update set role = 'owner';
```

5. Create Storage bucket `dfg-media` and make it public.
6. Open `assets/js/production-config.js` and fill:

```js
provider: 'supabase',
supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
supabaseAdminEmail: 'YOUR_ADMIN_EMAIL@example.com',
```

7. Upload the site to GitHub Pages.
8. Open `/admin.html` and login with the Supabase admin user's password.

`dianafarm2026` is no longer a production publishing password.

## Node backend mode

Use provider `production-api`, host the full site on Render/Railway/VPS, and set:

```env
DFG_NODE_ENV=production
DFG_PORT=8080
DFG_PUBLIC_ORIGIN=https://your-domain.com
DFG_ADMIN_PASSWORD=long-private-password-at-least-16-chars
DFG_SESSION_SECRET=random-64-plus-character-secret
DFG_STORAGE_DIR=/persistent/data
DFG_PUBLIC_DIR=.
```

Run:

```bash
npm install
npm run build:server
npm run start:production
```
