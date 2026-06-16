(function () {
  'use strict';
  const external = window.DFG_PRODUCTION_CONFIG || {};
  const params = new URLSearchParams(window.location.search || '');
  const host = String(window.location.hostname || '').toLowerCase();
  const protocol = String(window.location.protocol || '').toLowerCase();
  const isStaticFile = protocol === 'file:';
  const isGitHubPages = host.endsWith('.github.io') || host === 'github.io';
  const clean = (value) => String(value || '').trim();
  const isFilled = (value) => {
    const text = clean(value);
    return Boolean(text && !/YOUR_|PASTE_|REPLACE_|example|localhost-placeholder/i.test(text));
  };
  const provider = clean(params.get('provider') || external.provider || (isGitHubPages || isStaticFile ? 'supabase' : 'production-api'));
  const apiBaseUrl = clean(params.get('apiBaseUrl') || params.get('api') || external.apiBaseUrl || '');
  const supabaseUrl = clean(params.get('supabaseUrl') || external.supabaseUrl || '');
  const supabaseAnonKey = clean(params.get('supabaseAnonKey') || external.supabaseAnonKey || '');
  const supabaseAdminEmail = clean(params.get('adminEmail') || external.supabaseAdminEmail || '');
  const supabaseStorageBucket = clean(external.supabaseStorageBucket || 'dfg-media');
  const hasSupabase = provider === 'supabase' && isFilled(supabaseUrl) && isFilled(supabaseAnonKey) && isFilled(supabaseAdminEmail);
  const hasProductionApi = (provider === 'production-api' && !(isGitHubPages || isStaticFile)) || (provider === 'production-api' && isFilled(apiBaseUrl));
  window.DFG_BACKEND_CONFIG = {
    enabled: Boolean(hasSupabase || hasProductionApi),
    provider: hasSupabase ? 'supabase' : 'production-api',
    apiBaseUrl,
    staticMode: Boolean(isGitHubPages || isStaticFile),
    staticHost: Boolean(isGitHubPages || isStaticFile),
    allowLocalAdminFallback: false,
    staticAdminPassword: '',
    supabaseUrl,
    supabaseAnonKey,
    supabaseAdminEmail,
    supabaseStorageBucket,
    tables: Object.assign({ siteData: 'dfg_site_data', leads: 'dfg_leads', reviews: 'dfg_reviews' }, external.tables || {})
  };
})();
