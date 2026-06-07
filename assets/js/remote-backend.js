(function () {
  'use strict';

  const cfg = window.DFG_BACKEND_CONFIG || {};

  function isConfigured() {
    return Boolean(
      cfg.enabled &&
      cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      !String(cfg.supabaseUrl).includes('YOUR_') &&
      !String(cfg.supabaseAnonKey).includes('YOUR_')
    );
  }

  function baseUrl() {
    return String(cfg.supabaseUrl || '').replace(/\/$/, '');
  }

  function table(name) {
    return encodeURIComponent((cfg.tables && cfg.tables[name]) || name);
  }

  async function request(path, options = {}) {
    if (!isConfigured()) throw new Error('Backend is not configured');
    const headers = Object.assign({
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }, options.headers || {});
    const response = await fetch(`${baseUrl()}${path}`, Object.assign({}, options, { headers }));
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Supabase request failed: ${response.status} ${text}`);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return response.json();
  }

  async function loadSiteData() {
    if (!isConfigured()) return null;
    const rows = await request(`/rest/v1/${table('siteData')}?id=eq.main&select=data,updated_at&limit=1`);
    return rows && rows[0] ? rows[0].data : null;
  }

  async function saveSiteData(data) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('siteData')}?on_conflict=id`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: 'main',
        data,
        updated_at: new Date().toISOString()
      })
    });
  }

  function leadToRow(lead) {
    const details = lead.data || {};
    return {
      id: lead.id,
      created_at: lead.createdAt || new Date().toISOString(),
      type: lead.type || 'consultation',
      status: lead.status || 'new',
      lang: lead.lang || document.documentElement.lang || 'ru',
      page: lead.page || location.href,
      booking_date: details.preferredDate || details.dates || '',
      booking_time: details.preferredTime || '',
      data: details
    };
  }

  function rowToLead(row) {
    return {
      id: row.id,
      createdAt: row.created_at,
      type: row.type || 'consultation',
      status: row.status || 'new',
      lang: row.lang || 'ru',
      page: row.page || '',
      data: row.data || {},
      remote: true
    };
  }

  async function saveLead(lead) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('leads')}?on_conflict=id`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(leadToRow(lead))
    });
  }

  async function listLeads() {
    if (!isConfigured()) return [];
    const rows = await request(`/rest/v1/${table('leads')}?select=*&order=created_at.desc`);
    return (rows || []).map(rowToLead);
  }

  async function updateLeadStatus(id, status) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('leads')}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status })
    });
  }

  async function deleteLead(id) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('leads')}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }


  function reviewToRow(review) {
    return {
      id: review.id,
      created_at: review.createdAt || new Date().toISOString(),
      status: review.status || 'pending',
      visible: review.visible !== false,
      rating: Number(review.rating || 5),
      author: review.author || '',
      country: review.country || '',
      service: review.service || '',
      text: review.text || {}
    };
  }

  function rowToReview(row) {
    return {
      id: row.id,
      createdAt: row.created_at,
      status: row.status || 'pending',
      visible: row.visible !== false,
      rating: Number(row.rating || 5),
      author: row.author || '',
      country: row.country || '',
      service: row.service || '',
      text: row.text || {},
      remote: true
    };
  }

  async function listReviews(status) {
    if (!isConfigured()) return [];
    const query = status ? `?select=*&status=eq.${encodeURIComponent(status)}&order=created_at.desc` : '?select=*&order=created_at.desc';
    const rows = await request(`/rest/v1/${table('reviews')}${query}`);
    return (rows || []).map(rowToReview);
  }

  async function saveReview(review) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('reviews')}?on_conflict=id`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(reviewToRow(review))
    });
  }

  async function updateReviewStatus(id, status) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('reviews')}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status })
    });
  }

  async function deleteReview(id) {
    if (!isConfigured()) return { skipped: true };
    return request(`/rest/v1/${table('reviews')}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }

  window.DFG_BACKEND = {
    isConfigured,
    loadSiteData,
    saveSiteData,
    saveLead,
    listLeads,
    updateLeadStatus,
    deleteLead,
    listReviews,
    saveReview,
    updateReviewStatus,
    deleteReview
  };
})();
