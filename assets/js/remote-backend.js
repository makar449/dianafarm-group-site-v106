(function () {
  'use strict';

  const cfg = window.DFG_BACKEND_CONFIG || {};
  const SUPABASE_ACCESS_KEY = 'dfg_supabase_access_token_v300';
  const SUPABASE_REFRESH_KEY = 'dfg_supabase_refresh_token_v300';
  const SUPABASE_EXPIRES_KEY = 'dfg_supabase_expires_at_v300';
  let csrfToken = readCookie('dfg_csrf');
  let supabaseAccessToken = sessionStorage.getItem(SUPABASE_ACCESS_KEY) || '';
  let supabaseRefreshToken = sessionStorage.getItem(SUPABASE_REFRESH_KEY) || '';
  let supabaseExpiresAt = Number(sessionStorage.getItem(SUPABASE_EXPIRES_KEY) || '0');

  function provider() { return String(cfg.provider || 'production-api'); }
  function isProductionApi() { return Boolean(cfg.enabled && provider() === 'production-api'); }
  function isSupabase() {
    return Boolean(cfg.enabled && provider() === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey && cfg.supabaseAdminEmail && !String(cfg.supabaseUrl).includes('YOUR_') && !String(cfg.supabaseAnonKey).includes('YOUR_'));
  }
  function isConfigured() { return isProductionApi() || isSupabase(); }
  function apiBase() { return String(cfg.apiBaseUrl || '').replace(/\/$/, ''); }
  function supabaseBaseUrl() { return String(cfg.supabaseUrl || '').replace(/\/$/, ''); }
  function table(name) { return encodeURIComponent((cfg.tables && cfg.tables[name]) || name); }
  function storageBucket() { return encodeURIComponent(String(cfg.supabaseStorageBucket || 'dfg-media')); }
  function readCookie(name) {
    return document.cookie.split(';').map((part) => part.trim()).reduce((found, part) => {
      if (found) return found;
      const prefix = `${name}=`;
      return part.startsWith(prefix) ? decodeURIComponent(part.slice(prefix.length)) : '';
    }, '');
  }
  function rememberSupabaseSession(payload) {
    if (!payload || !payload.access_token) return;
    supabaseAccessToken = payload.access_token;
    supabaseRefreshToken = payload.refresh_token || supabaseRefreshToken || '';
    supabaseExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in || 3600) - 60) * 1000;
    sessionStorage.setItem(SUPABASE_ACCESS_KEY, supabaseAccessToken);
    if (supabaseRefreshToken) sessionStorage.setItem(SUPABASE_REFRESH_KEY, supabaseRefreshToken);
    sessionStorage.setItem(SUPABASE_EXPIRES_KEY, String(supabaseExpiresAt));
  }
  function clearSupabaseSession() {
    supabaseAccessToken = '';
    supabaseRefreshToken = '';
    supabaseExpiresAt = 0;
    sessionStorage.removeItem(SUPABASE_ACCESS_KEY);
    sessionStorage.removeItem(SUPABASE_REFRESH_KEY);
    sessionStorage.removeItem(SUPABASE_EXPIRES_KEY);
  }
  async function refreshSupabaseSessionIfNeeded() {
    if (!isSupabase() || !supabaseRefreshToken) return;
    if (supabaseAccessToken && supabaseExpiresAt && Date.now() < supabaseExpiresAt) return;
    const response = await fetch(`${supabaseBaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: supabaseRefreshToken })
    });
    if (!response.ok) { clearSupabaseSession(); throw new Error('Сессия Supabase истекла. Войдите снова.'); }
    rememberSupabaseSession(await response.json());
  }

  async function apiRequest(path, options = {}) {
    if (!isProductionApi()) throw new Error('Production API не настроен');
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const method = String(options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      csrfToken = csrfToken || readCookie('dfg_csrf');
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }
    const response = await fetch(`${apiBase()}${path}`, Object.assign({}, options, { headers, credentials: 'include' }));
    if (!response.ok) {
      let message = `API request failed: ${response.status}`;
      try { const payload = await response.json(); if (payload && payload.message) message = payload.message; } catch (error) {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return response.json();
  }

  async function supabaseRequest(path, options = {}) {
    if (!isSupabase()) throw new Error('Supabase не настроен');
    const method = String(options.method || 'GET').toUpperCase();
    const adminRequired = options.admin === true || !['GET', 'HEAD', 'OPTIONS'].includes(method) || /dfg_leads|dfg_admin_profiles/.test(path) || (path.includes(table('reviews')) && !path.includes('status=eq.approved'));
    if (adminRequired) await refreshSupabaseSessionIfNeeded();
    const bearer = adminRequired && supabaseAccessToken ? supabaseAccessToken : cfg.supabaseAnonKey;
    const headers = Object.assign({ apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }, options.headers || {});
    const response = await fetch(`${supabaseBaseUrl()}${path}`, Object.assign({}, options, { headers }));
    if (!response.ok) { const text = await response.text().catch(() => ''); throw new Error(`Supabase request failed: ${response.status} ${text}`); }
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return response.json();
  }

  async function supabaseLogin(password) {
    if (!isSupabase()) throw new Error('Supabase не настроен: заполните assets/js/production-config.js');
    const email = String(cfg.supabaseAdminEmail || '').trim();
    if (!email) throw new Error('Не указан supabaseAdminEmail в production-config.js');
    const response = await fetch(`${supabaseBaseUrl()}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    if (!response.ok) { const text = await response.text().catch(() => ''); throw new Error(`Supabase login failed: ${response.status} ${text}`); }
    const payload = await response.json();
    rememberSupabaseSession(payload);
    const userId = payload.user && payload.user.id ? payload.user.id : '';
    const profiles = await supabaseRequest(`/rest/v1/dfg_admin_profiles?user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`, { admin: true });
    if (!profiles || !profiles[0]) { clearSupabaseSession(); throw new Error('Пользователь вошёл, но не найден в dfg_admin_profiles. Добавьте owner/admin profile row.'); }
    return { ok: true, provider: 'supabase', role: profiles[0].role };
  }
  async function login(password) {
    if (isSupabase()) return supabaseLogin(password);
    if (!isProductionApi()) throw new Error('Production backend не настроен');
    const payload = await apiRequest('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    csrfToken = payload && payload.csrfToken ? payload.csrfToken : readCookie('dfg_csrf');
    return payload;
  }
  async function logout() {
    if (isSupabase()) {
      if (supabaseAccessToken) await fetch(`${supabaseBaseUrl()}/auth/v1/logout`, { method: 'POST', headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${supabaseAccessToken}` } }).catch(() => null);
      clearSupabaseSession();
      return { ok: true };
    }
    if (!isProductionApi()) return { skipped: true };
    return apiRequest('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) });
  }
  async function session() {
    if (isSupabase()) {
      await refreshSupabaseSessionIfNeeded();
      if (!supabaseAccessToken) throw new Error('Supabase session is missing');
      const response = await fetch(`${supabaseBaseUrl()}/auth/v1/user`, { headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${supabaseAccessToken}` } });
      if (!response.ok) { clearSupabaseSession(); throw new Error('Supabase session check failed'); }
      return { ok: true, provider: 'supabase', user: await response.json() };
    }
    if (!isProductionApi()) return { skipped: true };
    const payload = await apiRequest('/api/admin/session');
    csrfToken = payload && payload.csrfToken ? payload.csrfToken : readCookie('dfg_csrf');
    return payload;
  }
  async function loadSiteData() {
    if (isProductionApi()) return apiRequest('/api/site-data');
    if (!isSupabase()) return null;
    const rows = await supabaseRequest(`/rest/v1/${table('siteData')}?id=eq.main&select=data,updated_at&limit=1`);
    return rows && rows[0] ? rows[0].data : null;
  }
  async function saveSiteData(data) {
    if (isProductionApi()) return apiRequest('/api/admin/site-data', { method: 'PUT', body: JSON.stringify(data) });
    if (!isSupabase()) throw new Error('Remote publishing is not configured');
    return supabaseRequest(`/rest/v1/${table('siteData')}?on_conflict=id`, { method: 'POST', admin: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() }) });
  }
  async function loadUniversalEdits() { if (isProductionApi()) return apiRequest('/api/universal-edits'); return { version: 'remote-site-data-v300', updatedAt: '', content: {}, design: {} }; }
  async function loadAdminUniversalEdits() { if (isProductionApi()) return apiRequest('/api/admin/universal-edits'); return loadUniversalEdits(); }
  async function saveUniversalEdits(payload) { if (!isProductionApi()) return { skipped: true }; return apiRequest('/api/admin/universal-edits', { method: 'PUT', body: JSON.stringify(payload || { content: {}, design: {} }) }); }
  function leadToRow(lead) { const details = lead.data || {}; return { id: lead.id, created_at: lead.createdAt || new Date().toISOString(), type: lead.type || 'consultation', status: lead.status || 'new', lang: lead.lang || document.documentElement.lang || 'ru', page: lead.page || location.href, booking_date: details.preferredDate || details.dates || '', booking_time: details.preferredTime || '', data: details, delivery_status: lead.deliveryStatus || 'server_saved' }; }
  function rowToLead(row) { return { id: row.id, createdAt: row.created_at || row.createdAt, type: row.type || 'consultation', status: row.status || 'new', lang: row.lang || 'ru', page: row.page || '', data: row.data || {}, deliveryStatus: row.deliveryStatus || row.delivery_status || 'server_saved', remote: true }; }
  async function saveLead(lead) { if (isProductionApi()) return apiRequest('/api/leads', { method: 'POST', body: JSON.stringify(lead) }); if (!isSupabase()) return { skipped: true }; return supabaseRequest(`/rest/v1/${table('leads')}?on_conflict=id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(leadToRow(lead)) }); }
  async function listLeads() { if (isProductionApi()) return apiRequest('/api/admin/leads'); if (!isSupabase()) return []; const rows = await supabaseRequest(`/rest/v1/${table('leads')}?select=*&order=created_at.desc`, { admin: true }); return (rows || []).map(rowToLead); }
  async function updateLeadStatus(id, status) { if (isProductionApi()) return apiRequest(`/api/admin/leads/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }); if (!isSupabase()) throw new Error('Remote publishing is not configured'); return supabaseRequest(`/rest/v1/${table('leads')}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', admin: true, headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status }) }); }
  async function deleteLead(id) { if (isProductionApi()) return apiRequest(`/api/admin/leads/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!isSupabase()) throw new Error('Remote publishing is not configured'); return supabaseRequest(`/rest/v1/${table('leads')}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', admin: true, headers: { Prefer: 'return=minimal' } }); }
  function reviewToRow(review) { return { id: review.id, created_at: review.createdAt || new Date().toISOString(), status: review.status || 'pending', visible: review.visible !== false, rating: Number(review.rating || 5), author: review.author || '', country: review.country || '', service: review.service || '', text: review.text || {} }; }
  function rowToReview(row) { return { id: row.id, createdAt: row.created_at || row.createdAt, status: row.status || 'pending', visible: row.visible !== false, rating: Number(row.rating || 5), author: row.author || '', country: row.country || '', service: row.service || '', text: row.text || {}, remote: true }; }
  async function listReviews(status) { if (isProductionApi()) return apiRequest(status ? `/api/reviews?status=${encodeURIComponent(status)}` : '/api/admin/reviews'); if (!isSupabase()) return []; const query = status ? `?select=*&status=eq.${encodeURIComponent(status)}&visible=eq.true&order=created_at.desc` : '?select=*&order=created_at.desc'; const rows = await supabaseRequest(`/rest/v1/${table('reviews')}${query}`, { admin: !status }); return (rows || []).map(rowToReview); }
  async function saveReview(review) { if (isProductionApi()) return apiRequest('/api/admin/reviews', { method: 'PUT', body: JSON.stringify(review) }); if (!isSupabase()) throw new Error('Remote publishing is not configured'); return supabaseRequest(`/rest/v1/${table('reviews')}?on_conflict=id`, { method: 'POST', admin: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(reviewToRow(review)) }); }
  async function updateReviewStatus(id, status) { if (isProductionApi()) { const reviews = await listReviews(); const review = (reviews || []).find((item) => String(item.id) === String(id)); if (!review) throw new Error('Review not found'); review.status = status; review.visible = status === 'approved'; return saveReview(review); } if (!isSupabase()) throw new Error('Remote publishing is not configured'); return supabaseRequest(`/rest/v1/${table('reviews')}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', admin: true, headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status, visible: status === 'approved' }) }); }
  async function deleteReview(id) { if (isProductionApi()) return apiRequest(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!isSupabase()) throw new Error('Remote publishing is not configured'); return supabaseRequest(`/rest/v1/${table('reviews')}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', admin: true, headers: { Prefer: 'return=minimal' } }); }
  async function uploadMedia(file) {
    if (isProductionApi()) { const base64 = await fileToBase64(file); return apiRequest('/api/admin/media', { method: 'POST', body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64 }) }); }
    if (!isSupabase()) throw new Error('Remote media upload is not configured');
    await refreshSupabaseSessionIfNeeded();
    if (!supabaseAccessToken) throw new Error('Войдите в Supabase admin session перед загрузкой файла.');
    const safeExt = (String(file.name || '').split('.').pop() || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
    const id = `media_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const path = `uploads/${id}.${safeExt}`;
    const response = await fetch(`${supabaseBaseUrl()}/storage/v1/object/${storageBucket()}/${path}`, { method: 'POST', headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${supabaseAccessToken}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }, body: file });
    if (!response.ok) { const text = await response.text().catch(() => ''); throw new Error(`Supabase storage upload failed: ${response.status} ${text}`); }
    const publicUrl = `${supabaseBaseUrl()}/storage/v1/object/public/${storageBucket()}/${path}`;
    return { id, path: publicUrl, originalName: file.name || path, mimeType: file.type || '', sizeBytes: file.size || 0 };
  }
  function fileToBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '').replace(/^data:[^;]+;base64,/, '')); reader.onerror = () => reject(new Error('File read failed')); reader.readAsDataURL(file); }); }
  window.DFG_BACKEND = { isConfigured, login, logout, session, loadSiteData, saveSiteData, loadUniversalEdits, loadAdminUniversalEdits, saveUniversalEdits, saveLead, listLeads, updateLeadStatus, deleteLead, listReviews, saveReview, updateReviewStatus, deleteReview, uploadMedia };
})();
