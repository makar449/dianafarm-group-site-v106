(function () {
  'use strict';

  // v123 Real Admin backend config.
  // Leave enabled:false for local/demo mode. For real shared admin:
  // 1) Create Supabase project.
  // 2) Run SQL from SUPABASE_SETUP.md.
  // 3) Paste your Project URL and anon public key below.
  window.DFG_BACKEND_CONFIG = {
    enabled: false,
    provider: 'supabase',
    supabaseUrl: '',
    supabaseAnonKey: '',
    tables: {
      siteData: 'dfg_site_data',
      leads: 'dfg_leads',
      reviews: 'dfg_reviews'
    }
  };
})();
