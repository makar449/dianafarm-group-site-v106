# Secure Supabase setup for DIANAFARM GROUP v284

v284 does not use the old public-anon admin write policies.
Use `sql/supabase-production-rls.sql` if you want Supabase as the production database instead of the built-in JSON backend.

## Required security model

Public anon users may:

- read public site content;
- read approved visible reviews;
- create a new lead.

Public anon users must not:

- read all leads;
- update or delete leads;
- update site data;
- approve/delete reviews;
- upload/manage media.

Admin users may write only after Supabase Auth and an admin profile row in `dfg_admin_profiles`.

## Steps

1. Create a Supabase project.
2. Enable Auth for admin users.
3. Run `sql/supabase-production-rls.sql` in SQL Editor.
4. Create your admin auth user.
5. Insert an admin profile row:

```sql
insert into public.dfg_admin_profiles (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'owner');
```

6. If you choose direct Supabase mode, edit `assets/js/backend-config.js` manually:

```js
window.DFG_BACKEND_CONFIG = {
  enabled: true,
  provider: 'supabase',
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
  tables: {
    siteData: 'dfg_site_data',
    leads: 'dfg_leads',
    reviews: 'dfg_reviews'
  }
};
```

## Recommended production mode

The recommended v284 mode is Node backend mode:

```js
provider: 'production-api'
```

This keeps admin auth, CSRF, validation and media upload on your server instead of exposing write logic directly in the browser.
