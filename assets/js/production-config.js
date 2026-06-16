(function () {
  'use strict';

  /**
   * v300 real remote publishing config.
   * GitHub Pages cannot save admin edits globally by itself.
   * Use Supabase mode for GitHub Pages, or production-api mode for Render/Railway/VPS.
   */
  window.DFG_PRODUCTION_CONFIG = {
    provider: 'supabase',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseAdminEmail: '',
    supabaseStorageBucket: 'dfg-media',
    apiBaseUrl: '',
    tables: {
      siteData: 'dfg_site_data',
      leads: 'dfg_leads',
      reviews: 'dfg_reviews'
    },
    allowLocalAdminFallback: false
  };
})();
