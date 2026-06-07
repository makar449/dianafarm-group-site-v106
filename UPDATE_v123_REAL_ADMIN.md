# v123 Real Admin + Live Requests

Implemented:
- Supabase-ready shared backend layer.
- Live requests can be saved into admin CRM through Supabase.
- Admin edits for services, real estate, cars, parking, B2B, blog, social links and contacts can be saved into the shared site data table.
- Uploaded images are saved as data URLs inside site data. With Supabase enabled, the public site loads them from shared DB.
- Public site polls shared site data every 30 seconds, so admin edits appear without rebuilding the static site.
- LocalStorage fallback remains for offline/demo mode.
- Added legal pages under `/pages/`.

Files added:
- assets/js/backend-config.js
- assets/js/remote-backend.js
- SUPABASE_SETUP.md
- UPDATE_v123_REAL_ADMIN.md
