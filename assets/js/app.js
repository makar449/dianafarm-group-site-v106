(function () {
  'use strict';

  document.documentElement.setAttribute('data-v169-final-polish','true');
  const DATA_KEY = window.DFG_STORAGE_KEY;
  const LEADS_KEY = window.DFG_LEADS_KEY;
  const DRAFT_KEY = window.DFG_DRAFT_KEY || `${DATA_KEY}_draft`;
  const PENDING_LEADS_KEY = 'dfg_pending_leads_v285';
  const DEFAULT_DATA = window.DFG_DEFAULT_DATA;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const isDraftPreview = () => new URLSearchParams(location.search).get('preview') === 'draft';
  const isProductionServerDataMode = () => !isDraftPreview() && Boolean(window.DFG_BACKEND && window.DFG_BACKEND.isConfigured && window.DFG_BACKEND.isConfigured());

  let data = loadData();
  let remoteDataSignature = '';
  let lang = localStorage.getItem('dfg_lang') || data.settings.defaultLang || 'ru';
  let serviceCategory = 'all';
  const filters = {
    realEstate: { dealType: 'all', city: 'all', category: 'all', status: 'all', search: '' },
    parking: { type: 'all', status: 'all', search: '' },
    cars: { status: 'all', brand: 'all', search: '' },
    b2b: { category: 'all' }
  };


  const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = () => window.matchMedia('(max-width: 1024px)').matches;
  const isGitHubPages = () => /github\.io$/i.test(location.hostname);
  function shouldUseHeavyEffects() {
    return false;
  }

  const propertyCategories = {
    apartment: { ru: 'апартамент', bg: 'апартамент', en: 'apartment' },
    studio: { ru: 'студия', bg: 'студио', en: 'studio' },
    house: { ru: 'дом / вилла', bg: 'къща / вила', en: 'house / villa' },
    commercial: { ru: 'коммерция', bg: 'търговски обект', en: 'commercial' },
    land: { ru: 'земельный участок', bg: 'земя', en: 'land plot' },
    investment: { ru: 'инвестиционный объект', bg: 'инвестиционен обект', en: 'investment' }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));


  const isMobileStableMode = () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  function forceMobileStableView() {
    if (!isMobileStableMode()) return;
    document.documentElement.classList.add('dfg-mobile-stable');
    document.body?.classList.add('dfg-mobile-stable');
    $$('.reveal, .reveal-group > *').forEach((node) => node.classList.add('in-view'));
    $$('[data-parallax], [data-tilt-card]').forEach((node) => {
      node.style.transform = '';
      node.removeAttribute('data-parallax');
    });
  }

  window.addEventListener('pageshow', forceMobileStableView);
  window.addEventListener('online', flushPendingLeads);
  window.setTimeout(flushPendingLeads, 1800);
  window.addEventListener('orientationchange', () => window.setTimeout(forceMobileStableView, 120));

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('storage', (event) => {
    const watchedKey = isDraftPreview() ? DRAFT_KEY : DATA_KEY;
    if (event.key === watchedKey) {
      data = loadData();
      renderAll();
      applyTranslations();
      normalizeAboutHeroTitleV154();
      preserveDraftPreviewLinks();
    }
  });

  function loadData() {
    try {
      if (isProductionServerDataMode()) return clone(DEFAULT_DATA);
      const storageKey = isDraftPreview() ? DRAFT_KEY : DATA_KEY;
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return saved ? mergeDefaults(clone(DEFAULT_DATA), saved) : clone(DEFAULT_DATA);
    } catch (error) {
      console.warn('Cannot load saved site data, fallback to defaults', error);
      return clone(DEFAULT_DATA);
    }
  }

  function mergeDefaults(base, saved) {
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if (!base || typeof base !== 'object') return saved === undefined ? base : saved;
    const output = { ...base };
    Object.keys(saved || {}).forEach((key) => {
      output[key] = key in base ? mergeDefaults(base[key], saved[key]) : saved[key];
    });
    return output;
  }

  function arrangeCatalogLayouts() {
    arrangeCatalogLayout({
      gridSelector: '#realEstateGrid',
      filterSelector: '#realEstateFilters',
      sectionClass: 'catalog-layout-v111--realestate'
    });
    arrangeCatalogLayout({
      gridSelector: '#parkingGrid',
      filterSelector: '#parkingFilters',
      sectionClass: 'catalog-layout-v111--parking'
    });
    arrangeCatalogLayout({
      gridSelector: '#carsGrid',
      filterSelector: '#carsFilters',
      sectionClass: 'catalog-layout-v111--cars'
    });
  }

  function updateCatalogFilterTitles() {
    $$('.catalog-filter-title-v111 strong').forEach((node) => {
      node.textContent = t('filters.search');
    });
  }

  function arrangeCatalogLayout(config) {
    const grid = document.querySelector(config.gridSelector);
    const filtersEl = document.querySelector(config.filterSelector);
    if (!grid || !filtersEl || grid.closest('.catalog-main-v111')) return;

    const listContainer = grid.closest('.container');
    if (!listContainer) return;
    const listSection = listContainer.closest('section');

    const row = listContainer.querySelector('.v9-section-row');
    const featured = listContainer.querySelector('.v9-featured-property');
    const wideContact = listContainer.querySelector('.v9-wide-contact');
    const sourceFilterSection = filtersEl.closest('.v9-filter-bar, .page-section');

    const layout = document.createElement('div');
    layout.className = `catalog-layout-v111 ${config.sectionClass || ''}`;
    const main = document.createElement('div');
    main.className = 'catalog-main-v111';
    const aside = document.createElement('aside');
    aside.className = 'catalog-aside-v111';

    const asideCard = document.createElement('div');
    asideCard.className = 'catalog-filter-card-v111';
    const filterTitle = document.createElement('div');
    filterTitle.className = 'catalog-filter-title-v111';
    filterTitle.innerHTML = `<span>FILTER</span><strong>${esc(t('filters.search'))}</strong>`;

    if (row) main.appendChild(row);
    main.appendChild(grid);
    if (featured) main.appendChild(featured);
    if (wideContact) main.appendChild(wideContact);
    asideCard.appendChild(filterTitle);
    asideCard.appendChild(filtersEl);
    aside.appendChild(asideCard);
    layout.appendChild(main);
    layout.appendChild(aside);

    listContainer.insertBefore(layout, listContainer.firstChild);
    if (sourceFilterSection && sourceFilterSection.parentNode) {
      if (sourceFilterSection.id && listSection && !listSection.id) listSection.id = sourceFilterSection.id;
      if (sourceFilterSection.dataset.block && listSection && !listSection.dataset.block) listSection.dataset.block = sourceFilterSection.dataset.block;
      sourceFilterSection.remove();
    }
  }

  async function init() {
    forceMobileStableView();
    showDraftPreviewBanner();
    await loadRemoteSiteData({ silent: true, beforeFirstRender: true });
    applySEO();
    applyTranslations();
    arrangeCatalogLayouts();
    renderAll();
    normalizeAboutHeroTitleV154();
    preserveDraftPreviewLinks();
    bindGlobalEvents();
    initLanguageHoverKeepOpen();
    initAgileCreditEffect();
    if (!isMobileStableMode()) loadOptionalGsap();
    initAnimations();
    if (!isProductionServerDataMode()) showCookieBanner();
    handleServiceHash();
    if (!isDraftPreview()) initRemoteSync();
    window.addEventListener('hashchange', handleServiceHash);
    forceMobileStableView();
  }

  function normalizeAboutHeroTitleV154() {
    if (document.body.dataset.page !== 'about') return;
    const title = document.querySelector('.v9-page-hero__copy h1');
    if (!title) return;
    title.classList.add('about-title-fit');
    title.setAttribute('data-hard-about-title', 'true');
    title.innerHTML = 'DIANAFARM<br>GROUP';
  }

  function initRemoteSync() {
    if (isDraftPreview() || !window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return;
    loadRemoteSiteData({ silent: true });
    loadRemoteReviews({ silent: true });
    window.setInterval(() => { loadRemoteSiteData({ silent: true }); loadRemoteReviews({ silent: true }); }, 30000);
  }

  async function loadRemoteSiteData(options = {}) {
    if (isDraftPreview() || !window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return false;
    try {
      const remote = await window.DFG_BACKEND.loadSiteData();
      if (!remote) return false;
      const signature = JSON.stringify(remote);
      if (signature === remoteDataSignature) return false;
      remoteDataSignature = signature;
      data = mergeDefaults(clone(DEFAULT_DATA), remote);
      if (!isProductionServerDataMode()) localStorage.setItem(DATA_KEY, JSON.stringify(data));
      if (!options.beforeFirstRender) {
        renderAll();
        applyTranslations();
        normalizeAboutHeroTitleV154();
      }
      return true;
    } catch (error) {
      console.warn('Remote site data sync failed', error);
      return false;
    }
  }


  async function loadRemoteReviews(options = {}) {
    if (isDraftPreview() || !window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured() || !window.DFG_BACKEND.listReviews) return;
    try {
      const reviews = await window.DFG_BACKEND.listReviews('approved');
      if (!reviews || !reviews.length) return;
      data.reviews = reviews;
      renderReviews();
      initReviewsSliderPublicRefresh();
    } catch (error) {
      console.warn('Remote reviews sync failed', error);
    }
  }

  function initReviewsSliderPublicRefresh() {
    document.querySelectorAll('[data-reviews-slider]').forEach((slider) => {
      slider.dataset.reviewsReady = '';
    });
    if (window.DFG_INIT_REVIEWS_SLIDER) window.DFG_INIT_REVIEWS_SLIDER();
  }

  function renderAll() {
    renderHomeBlocks();
    renderServices();
    renderAdvantages();
    renderLocations();
    renderRealEstate();
    renderParkings();
    renderCars();
    renderB2B();
    renderPromotions();
    renderBlog();
    renderBrands();
    renderContacts();
    renderSocials();
    renderReviews();
    renderLegal();
    renderInlineForms('consultation');
    updateCatalogFilterTitles();
    wireWhatsAppLinks();
    enhanceWhatsAppRotators();
    enhanceImages();
    refreshRevealItems();
    forceMobileStableView();
    normalizeAboutHeroTitleV154();
    finalV156Cleanup();
  }


  function showDraftPreviewBanner() {
    if (!isDraftPreview() || document.querySelector('.draft-preview-banner-v146')) return;
    document.documentElement.classList.add('is-draft-preview-v146');
    const banner = document.createElement('div');
    banner.className = 'draft-preview-banner-v146';
    banner.innerHTML = '<strong>Черновик</strong><span>Это предпросмотр из админ-панели. Посетители его не видят, пока вы не нажмёте “Опубликовать”.</span>';
    document.body.appendChild(banner);
  }

  function preserveDraftPreviewLinks() {
    if (!isDraftPreview()) return;
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http') || href.includes('preview=draft')) return;
      if (!/\.html(\?|#|$)/.test(href) && href !== './' && href !== '/') return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        url.searchParams.set('preview', 'draft');
        link.setAttribute('href', `${url.pathname.split('/').pop() || 'index.html'}${url.search}${url.hash}`);
      } catch (error) {}
    });
  }

  function applySEO() {
    const seo = data.settings.seo || {};
    if (seo.title) document.title = text(seo.title);
    const desc = $('meta[name="description"]');
    if (desc && seo.description) desc.setAttribute('content', text(seo.description));
    const keys = $('meta[name="keywords"]');
    if (keys && seo.keywords) keys.setAttribute('content', seo.keywords);
    if (seo.googleSearchConsoleCode && !$('meta[name="google-site-verification"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      meta.content = seo.googleSearchConsoleCode;
      document.head.appendChild(meta);
    }
    injectAnalytics(seo.googleAnalyticsId);
  }

  function applyTranslations() {
    document.documentElement.lang = lang;
    $$('.lang-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.lang === lang));
    $$('.lang-switch--premium').forEach((switcher) => {
      const buttons = $$('.lang-btn', switcher);
      const active = buttons.find((btn) => btn.dataset.lang === lang) || buttons[0];
      if (active) switcher.prepend(active);
      switcher.dataset.currentLang = (active?.dataset.lang || lang || 'ru').toUpperCase();
    });
    $$('[data-i18n]').forEach((node) => {
      const value = t(node.dataset.i18n);
      if (value) node.textContent = value;
    });
    applySEO();
    applyStaticPageCopy();
  }


  function applyStaticPageCopy() {
    const page = document.body.dataset.page || 'home';
    const copy = {
      ru: {
        services: ['Международные услуги под ключ', 'Полный спектр решений для бизнеса и жизни в Европе, Азии и на Ближнем Востоке. Одна команда — ваш надёжный партнёр на каждом этапе.'],
        'real-estate': ['Недвижимость в Болгарии у моря', 'Премиальные квартиры и виллы у моря для жизни, отдыха и инвестиций.'],
        uae: ['UAE / Dubai Direction', 'Регистрация компаний, лицензии, банки, beauty, FMCG и сопровождение выхода на рынок ОАЭ.'],
        asia: ['Uzbekistan / Asia', 'Бизнес-коммуникация, поставщики, импорт / экспорт, документы и логистика в Азии.'],
        b2b: ['B2B Offers', 'Международная торговля, косметика, удобрения, сырьё, документы, логистика и коммерческие запросы.'],
        blog: ['Блог и аналитика', 'Практические материалы о Болгарии, недвижимости, бизнесе, банках, UAE, косметике и БАДах.'],
        about: ['DIANAFARM GROUP', 'Международная экосистема брендов для частных клиентов, производителей, инвесторов и бизнеса.'],
        contacts: ['Получить консультацию', 'Расскажите о вашей задаче — наши эксперты предложат лучшее решение для вашего бизнеса и жизни.']
      },
      bg: {
        services: ['Международни услуги до ключ', 'Пълен спектър решения за бизнес и живот в Европа, Азия и Близкия изток. Една команда — надежден партньор на всеки етап.'],
        'real-estate': ['Имоти в България край морето', 'Премиални апартаменти и вили край морето за живот, почивка и инвестиции.'],
        uae: ['UAE / Dubai направление', 'Регистрация на фирми, лицензи, банки, beauty, FMCG и пазарен достъп в ОАЕ.'],
        asia: ['Узбекистан / Азия', 'Бизнес комуникация, доставчици, импорт / експорт, документи и логистика в Азия.'],
        b2b: ['B2B оферти', 'Международна търговия, козметика, торове, суровини, документи, логистика и търговски запитвания.'],
        blog: ['Блог и анализи', 'Практични материали за България, имоти, бизнес, банки, UAE, козметика и добавки.'],
        about: ['DIANAFARM GROUP', 'Международна екосистема от брандове за частни клиенти, производители, инвеститори и бизнес.'],
        contacts: ['Получете консултация', 'Разкажете ни за задачата — нашите експерти ще предложат най-доброто решение за вашия бизнес и живот.']
      },
      ka: {
        services: ['საერთაშორისო მომსახურება სრული მხარდაჭერის ფორმატით', 'სრული გადაწყვეტილებები ბიზნესისა და ცხოვრებისათვის ევროპაში, აზიასა და ახლო აღმოსავლეთში. ერთი გუნდი — საიმედო პარტნიორი ყველა ეტაპზე.'],
        'real-estate': ['უძრავი ქონება ბულგარეთის ზღვისპირეთში', 'პრემიუმ აპარტამენტები და ვილები ზღვის პირას ცხოვრებისთვის, დასვენებისა და ინვესტიციებისთვის.'],
        uae: ['UAE / Dubai მიმართულება', 'კომპანიების რეგისტრაცია, ლიცენზიები, ბანკები, beauty, FMCG და UAE ბაზარზე გასვლის მხარდაჭერა.'],
        asia: ['უზბეკეთი / აზია', 'ბიზნეს-კომუნიკაცია, მომწოდებლები, იმპორტი / ექსპორტი, დოკუმენტები და ლოგისტიკა აზიაში.'],
        b2b: ['B2B შეთავაზებები', 'საერთაშორისო ვაჭრობა, კოსმეტიკა, სასუქები, ნედლეული, დოკუმენტები, ლოგისტიკა და კომერციული მოთხოვნები.'],
        blog: ['ბლოგი და ანალიტიკა', 'პრაქტიკული მასალები ბულგარეთზე, უძრავ ქონებაზე, ბიზნესზე, ბანკებზე, UAE-ზე, კოსმეტიკასა და დანამატებზე.'],
        about: ['DIANAFARM GROUP', 'საერთაშორისო ბრენდების ეკოსისტემა კერძო კლიენტებისთვის, მწარმოებლებისთვის, ინვესტორებისა და ბიზნესისთვის.'],
        contacts: ['მიიღეთ კონსულტაცია', 'მოგვიყევით თქვენი ამოცანის შესახებ — ჩვენი ექსპერტები შემოგთავაზებენ საუკეთესო გადაწყვეტილებას ბიზნესისა და ცხოვრებისათვის.']
      },
      en: {
        services: ['International turnkey services', 'A full spectrum of solutions for business and life across Europe, Asia and the Middle East. One team — your reliable partner at every stage.'],
        'real-estate': ['Real Estate by the sea in Bulgaria', 'Premium seaside apartments and villas for living, holidays and investments.'],
        uae: ['UAE / Dubai Direction', 'Company registration, licenses, banking, beauty, FMCG and UAE market entry support.'],
        asia: ['Uzbekistan / Asia', 'Business communication, suppliers, import / export, documents and logistics across Asia.'],
        b2b: ['B2B Offers', 'International trade, cosmetics, fertilizers, raw materials, documents, logistics and commercial requests.'],
        blog: ['Blog and insights', 'Practical materials on Bulgaria, real estate, business, banks, UAE, cosmetics and supplements.'],
        about: ['DIANAFARM GROUP', 'An international ecosystem of brands for private clients, producers, investors and businesses.'],
        contacts: ['Get a consultation', 'Tell us about your request — our experts will propose the best solution for your business and life.']
      }
    };
    const selected = (copy[lang] || copy.ru)[page];
    if (selected) {
      const title = $('.v9-page-hero__copy h1');
      const desc = $('.v9-page-hero__copy p');
      if (title) {
        if (document.body.dataset.page === 'about') {
          title.classList.add('about-title-fit');
          title.setAttribute('data-hard-about-title', 'true');
          title.innerHTML = 'DIANAFARM<br>GROUP';
        } else {
          title.innerHTML = esc(selected[0]).replace(/ /, '<br>');
        }
      }
      if (desc) desc.textContent = selected[1];
    }
    const labels = {
      ru: { allServices: 'Все услуги', brands: 'Наши бренды', social: 'Мы в социальных сетях' },
      bg: { allServices: 'Всички услуги', brands: 'Нашите брандове', social: 'Ние в социалните мрежи' },
      ka: { allServices: 'ყველა მომსახურება', brands: 'ჩვენი ბრენდები', social: 'ჩვენ სოციალურ ქსელებში' },
      en: { allServices: 'All services', brands: 'Our brands', social: 'Follow us' }
    }[lang] || {};
    $$('.nav-dropdown__menu a:first-child').forEach((a) => { a.textContent = labels.allServices || 'Все услуги'; });
    $$('.section--v9-about .section-head .eyebrow').forEach((el) => { el.textContent = labels.brands || 'Наши бренды'; });
    $$('.section--v9-socials h2').forEach((el) => { el.textContent = labels.social || 'Мы в социальных сетях'; });
  }

  function t(path) {
    const get = (obj) => path.split('.').reduce((acc, key) => acc && acc[key], obj);
    return get(data.translations?.[lang]) || get(data.translations?.ru) || path;
  }

  function text(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return value[lang] || value.ru || value.bg || value.en || Object.values(value)[0] || '';
  }

  function list(value) {
    if (Array.isArray(value)) return value;
    const localized = text(value);
    if (Array.isArray(localized)) return localized;
    if (typeof localized === 'string') return localized.split('\n').map((item) => item.trim()).filter(Boolean);
    return [];
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }


  function sanitizeHtml(value) {
    const raw = String(value || '');
    if (!raw.trim()) return '';
    const allowedTags = new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','A','H3','H4','BLOCKQUOTE','SPAN']);
    const allowedAttrs = {
      A: new Set(['href','title','target','rel']),
      SPAN: new Set(['class'])
    };
    const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return '';

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.textContent || '');
      if (node.nodeType !== Node.ELEMENT_NODE) return doc.createTextNode('');
      const tag = node.tagName;
      if (!allowedTags.has(tag)) {
        const fragment = doc.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => fragment.appendChild(cleanNode(child)));
        return fragment;
      }
      const out = doc.createElement(tag.toLowerCase());
      Array.from(node.attributes || []).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const valueAttr = String(attribute.value || '').trim();
        const tagAllowedAttrs = allowedAttrs[tag] || new Set();
        if (name.startsWith('on') || name === 'style') return;
        if (!tagAllowedAttrs.has(name)) return;
        if (name === 'href') {
          const safeHref = /^(https?:|mailto:|tel:|\/|#)/i.test(valueAttr) && !/^javascript:/i.test(valueAttr);
          if (!safeHref) return;
        }
        out.setAttribute(name, valueAttr);
      });
      if (tag === 'A') {
        out.setAttribute('rel', 'noopener noreferrer');
        if (!out.getAttribute('target')) out.setAttribute('target', '_blank');
      }
      Array.from(node.childNodes).forEach((child) => out.appendChild(cleanNode(child)));
      return out;
    };

    const fragment = doc.createDocumentFragment();
    Array.from(root.childNodes).forEach((child) => fragment.appendChild(cleanNode(child)));
    const container = doc.createElement('div');
    container.appendChild(fragment);
    return container.innerHTML;
  }

  function leadMessage(key) {
    const messages = {
      ru: { invalid: 'Проверьте имя и телефон: эти поля обязательны.', rate: 'Заявка уже отправлена. Повторите через минуту.', queued: 'Заявка сохранена. Если связь с сервером пропала, сайт отправит её повторно автоматически.' },
      bg: { invalid: 'Проверете име и телефон: тези полета са задължителни.', rate: 'Заявката вече е изпратена. Опитайте отново след минута.', queued: 'Заявката е запазена. Ако връзката със сървъра прекъсне, сайтът ще опита отново автоматично.' },
      ka: { invalid: 'შეამოწმეთ სახელი და ტელეფონი: ეს ველები აუცილებელია.', rate: 'განაცხადი უკვე გაგზავნილია. სცადეთ ერთ წუთში.', queued: 'განაცხადი შენახულია. თუ სერვერთან კავშირი დაიკარგა, საიტი ხელახლა გაგზავნის ავტომატურად.' },
      en: { invalid: 'Please check name and phone: both fields are required.', rate: 'The request has already been sent. Please try again in a minute.', queued: 'The request is saved. If the server connection is interrupted, the site will retry automatically.' }
    };
    return (messages[lang] || messages.ru)[key] || messages.ru[key];
  }

  function normalizeLeadValue(value, max = 1200) {
    return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function normalizeLeadValues(values) {
    const clean = {};
    Object.entries(values || {}).forEach(([key, value]) => {
      if (key === 'company' || key === 'website') return;
      clean[key] = normalizeLeadValue(value, key === 'message' ? 2000 : 240);
    });
    return clean;
  }

  function isLeadSpam(values) {
    return Boolean(normalizeLeadValue(values.company || values.website || '', 240));
  }

  function isLeadRateLimited(values) {
    try {
      const key = 'dfg_lead_last_submit_v283';
      const previous = JSON.parse(localStorage.getItem(key) || 'null');
      const fingerprint = [values.name, values.phone, values.email, values.topic, values.object, values.carType].map((value) => normalizeLeadValue(value, 160).toLowerCase()).join('|');
      if (previous && previous.fingerprint === fingerprint && Date.now() - Number(previous.createdAt || 0) < 60000) return true;
      localStorage.setItem(key, JSON.stringify({ fingerprint, createdAt: Date.now() }));
      return false;
    } catch (error) {
      return false;
    }
  }

  function validateLeadValues(values) {
    const name = normalizeLeadValue(values.name, 160);
    const phone = normalizeLeadValue(values.phone, 160);
    if (name.length < 2 || phone.length < 5) return false;
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return false;
    return true;
  }

  function renderHomeBlocks() {
    const blocks = data.homeBlocks || [];
    $$('[data-block]').forEach((section) => {
      const deletedBlocks = data.settings?.deletedBlocks || [];
      const block = blocks.find((item) => item.id === section.dataset.block);
      section.style.order = block ? Number(block.order) || 0 : 0;
      section.classList.toggle('hidden', deletedBlocks.includes(section.dataset.block) || (block ? block.visible === false : false));
    });
  }

  function renderServices() {
    const services = (data.services || []).filter((item) => item.visible !== false);
    const homeServiceIds = [
      'residence-bg',
      'company-registration-eu',
      'banks-accounts',
      'uae-dubai',
      'uzbekistan-asia-service',
      'supplements-registration',
      'cosmetics-registration',
      'pharma-consulting',
      'nostrification',
      'real-estate-service',
      'cars-rent-service',
      'parking-service',
      'international-trade-service',
      'turnkey-consulting'
    ];
    const serviceFilterGroups = [
      ['all', t('filters.all')],
      ['residence-bg', 'ВНЖ / ПМЖ'],
      ['company-registration-eu', 'Регистрация компаний'],
      ['banks-accounts', 'Банки и счета'],
      ['supplements-registration', 'БАДы'],
      ['cosmetics-registration', 'Косметика'],
      ['pharma-consulting', 'Фармацевтика'],
      ['nostrification', 'Дипломы'],
      ['uae-dubai', 'UAE / Dubai'],
      ['uzbekistan-asia-service', 'Азия'],
      ['real-estate-service', 'Недвижимость'],
      ['cars-rent-service', 'Авто'],
      ['parking-service', 'Паркинги'],
      ['international-trade-service', 'Торговля'],
      ['turnkey-consulting', 'Под ключ']
    ];
    const filtersEl = $('#serviceFilters');
    if (filtersEl) {
      filtersEl.innerHTML = serviceFilterGroups.map(([key, label]) =>
        `<button class="filter-btn premium-filter__button ${serviceCategory === key ? 'active' : ''}" data-service-category="${esc(key)}">${esc(label)}</button>`
      ).join('');
    }
    const serviceMap = new Map(services.map((item) => [item.id, item]));
    const shown = serviceCategory === 'all'
      ? (document.body.dataset.page === 'services' ? services : homeServiceIds.map((id) => serviceMap.get(id)).filter(Boolean))
      : (serviceMap.has(serviceCategory)
        ? [serviceMap.get(serviceCategory)].filter(Boolean)
        : services.filter((item) => item.category === serviceCategory));
    const grid = $('#servicesGrid');
    if (!grid) return;
    grid.innerHTML = shown.map((item) => `
      <article id="service-${esc(item.id)}" class="service-card" data-id="${esc(item.id)}" data-card-link="${esc(servicePageFor(item.id))}" data-tilt-card tabindex="0">
        <div class="service-card__image">
          <img src="${esc(mainImage(item))}" alt="${esc(text(item.title))}" loading="lazy">
          <div class="card-icon">${serviceIcon(item.id)}</div>
        </div>
        <div class="service-card__body">
          <div class="service-card__copy">
            <h3>${esc(text(item.title))}</h3>
            <p>${esc(text(item.excerpt))}</p>
          </div>
          <div class="service-card__footer">
            <span class="service-card__meta">${esc(categoryLabel(item.category))}</span>
            <div class="service-card__footer-actions service-card__footer-actions--details-only">
              <a class="btn btn--small service-card__details-btn" href="${esc(servicePageFor(item.id))}" data-service-link="${esc(item.id)}">${esc(t('buttons.details'))}</a>
            </div>
          </div>
        </div>
      </article>
    `).join('') || emptyState();
  }

  function servicePageFor(id) {
    const pages = {
      'residence-bg': 'service-residence-bulgaria.html',
      'company-registration-eu': 'service-company-registration.html',
      'banks-accounts': 'service-banks-accounts.html',
      'uae-dubai': 'uae.html',
      'uzbekistan-asia-service': 'asia.html',
      'supplements-registration': 'service-supplements-registration.html',
      'cosmetics-registration': 'service-cosmetics-registration.html',
      'pharma-consulting': 'service-pharma-consulting.html',
      'nostrification': 'service-nostrification.html',
      'real-estate-service': 'real-estate.html',
      'cars-rent-service': 'cars.html',
      'parking-service': 'parking.html',
      'international-trade': 'service-international-trade.html',
      'international-trade-service': 'service-international-trade.html',
      'turnkey-consulting': 'service-turnkey-consulting.html'
    };
    return pages[id] || 'services.html';
  }

  function serviceIcon(id) {
    const svg = {
      'residence-bg': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l2 3v15H7z"/><path d="M9 7h6M9 11h6M9 15h4"/><path d="M5 6h2v15H5z"/></svg>',
      'company-registration-eu': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M6 20V8l6-4 6 4v12"/><path d="M9 20v-6h6v6M9 9h.1M12 9h.1M15 9h.1"/></svg>',
      'banks-accounts': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18L12 4z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M4 18h16M3 21h18"/></svg>',
      'uae-dubai': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9"/><path d="M12 9c-3.2 0-5.4 1.8-6 5 2.5-1.4 4.5-1.2 6 0 1.5-1.2 3.5-1.4 6 0-.6-3.2-2.8-5-6-5z"/><path d="M12 9V4M9 7l3-3 3 3"/></svg>',
      'uzbekistan-asia-service': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.5 3.6 5.2 3.6 8S14.4 17.5 12 20c-2.4-2.5-3.6-5.2-3.6-8S9.6 6.5 12 4z"/></svg>',
      'supplements-registration': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c6-1 10-5 12-12"/><path d="M6 20c-1-6 3-11 10-12 0 7-4 11-10 12z"/><path d="M8 16c2 .1 4-.4 6-2"/></svg>',
      'cosmetics-registration': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8v12H8z"/><path d="M10 8V5h4v3"/><path d="M9 3h6"/><path d="M11 12h2M11 15h2"/></svg>',
      'pharma-consulting': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3h4"/><path d="M11 3v5L6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2L13 8V3"/><path d="M8 16h8"/></svg>',
      'nostrification': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c2.8 2 7.2 2 10 0v-5"/><path d="M21 8v5"/></svg>',
      'real-estate-service': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/></svg>',
      'cars-rent-service': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16h12l-1.2-4.2A3 3 0 0 0 13.9 10H10a3 3 0 0 0-2.8 1.8L6 16z"/><path d="M5 16h14v3H5z"/><path d="M7 19h.1M17 19h.1"/></svg>',
      'parking-service': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V4h6a5 5 0 0 1 0 10H9"/><path d="M9 12h4a3 3 0 0 0 0-6H9z"/></svg>'
    };
    return svg[id] || '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 18H4z"/></svg>';
  }

  function renderAdvantages() {
    const grid = $('#advantagesGrid');
    if (!grid) return;
    grid.innerHTML = (data.advantages || []).map((item) => `
      <article class="advantage-card">
        <strong>${esc(text(item.title))}</strong>
        <p>${esc(text(item.text))}</p>
      </article>
    `).join('');
  }

  function renderLocations() {
    const grid = $('#locationGrid');
    if (!grid) return;
    grid.innerHTML = (data.locations || []).map((item, index) => `
      <article class="location-card">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${esc(text(item.name))}</h3>
        <p>${esc(text(item.text))}</p>
      </article>
    `).join('');
  }

  function renderRealEstate(options = {}) {
    const items = (data.realEstate || []).filter((item) => item.visible !== false);
    if (!options.skipFilters) renderRealEstateFilters(items);
    const filtered = items.filter((item) => {
      const searchText = normalizeSearch(flattenSearch(item));
      return (filters.realEstate.dealType === 'all' || item.dealType === filters.realEstate.dealType)
        && (filters.realEstate.city === 'all' || item.city === filters.realEstate.city)
        && (filters.realEstate.category === 'all' || item.category === filters.realEstate.category)
        && (filters.realEstate.status === 'all' || item.status === filters.realEstate.status)
        && matchesSearch(searchText, filters.realEstate.search);
    });
    const grid = $('#realEstateGrid');
    if (!grid) return;
    grid.innerHTML = filtered.map((item) => objectCardHTML('realEstate', item, [
      dealLabel(item.dealType), propCategoryLabel(item.category), item.city, item.areaM2, item.rooms ? `${item.rooms} ${t('labels.rooms').toLowerCase()}` : ''
    ])).join('') || emptyState();
  }

  function renderRealEstateFilters(items) {
    const el = $('#realEstateFilters');
    if (!el) return;
    const cities = unique(items.map((item) => item.city).filter(Boolean));
    const cats = unique(items.map((item) => item.category).filter(Boolean));
    const statuses = unique(items.map((item) => item.status).filter(Boolean));
    el.innerHTML = `
      ${selectHTML('dealType', 'realEstate', [{ value: 'all', label: t('filters.all') }, { value: 'sale', label: t('filters.sale') }, { value: 'rent', label: t('filters.rent') }], filters.realEstate.dealType)}
      ${selectHTML('category', 'realEstate', [{ value: 'all', label: t('filters.category') }].concat(cats.map((cat) => ({ value: cat, label: propCategoryLabel(cat) }))), filters.realEstate.category)}
      ${selectHTML('city', 'realEstate', [{ value: 'all', label: t('filters.city') }].concat(cities.map((city) => ({ value: city, label: city }))), filters.realEstate.city)}
      ${selectHTML('status', 'realEstate', [{ value: 'all', label: t('filters.status') }].concat(statuses.map((status) => ({ value: status, label: statusLabel(status) }))), filters.realEstate.status)}
      <input data-filter="realEstate.search" type="search" value="${esc(filters.realEstate.search)}" placeholder="${esc(t('filters.search'))}">
    `;
  }

  function renderParkings(options = {}) {
    const items = (data.parkings || []).filter((item) => item.visible !== false);
    if (!options.skipFilters) renderParkingFilters(items);
    const filtered = items.filter((item) => {
      const searchText = normalizeSearch(flattenSearch(item));
      return (filters.parking.type === 'all' || item.type === filters.parking.type)
        && (filters.parking.status === 'all' || item.status === filters.parking.status)
        && matchesSearch(searchText, filters.parking.search);
    });
    const grid = $('#parkingGrid');
    if (!grid) return;
    grid.innerHTML = filtered.map((item) => objectCardHTML('parking', item, [
      dealLabel(item.type), `${t('labels.placeNumber')}: ${item.placeNumber}`, item.location, item.barrier ? t('labels.barrier') : '', item.access24 ? t('labels.access24') : ''
    ])).join('') || emptyState();
  }

  function renderParkingFilters(items) {
    const el = $('#parkingFilters');
    if (!el) return;
    const statuses = unique(items.map((item) => item.status).filter(Boolean));
    el.innerHTML = `
      ${selectHTML('type', 'parking', [{ value: 'all', label: t('filters.all') }, { value: 'sale', label: t('filters.sale') }, { value: 'rent', label: t('filters.rent') }], filters.parking.type)}
      ${selectHTML('status', 'parking', [{ value: 'all', label: t('filters.status') }].concat(statuses.map((status) => ({ value: status, label: statusLabel(status) }))), filters.parking.status)}
      <input data-filter="parking.search" type="search" value="${esc(filters.parking.search)}" placeholder="${esc(t('filters.search'))}">
    `;
  }

  function renderCars(options = {}) {
    const items = (data.cars || []).filter((item) => item.visible !== false);
    if (!options.skipFilters) renderCarFilters(items);
    const filtered = items.filter((item) => {
      const searchText = normalizeSearch(flattenSearch(item));
      return (filters.cars.status === 'all' || item.status === filters.cars.status)
        && (filters.cars.brand === 'all' || item.brand === filters.cars.brand)
        && matchesSearch(searchText, filters.cars.search);
    });
    const grid = $('#carsGrid');
    if (!grid) return;
    grid.innerHTML = filtered.map((item) => objectCardHTML('car', item, [
      item.location || item.city || 'Болгария', item.year, text(item.rentalType), item.transmission ? text(item.transmission) : '', item.fuel ? text(item.fuel) : '', item.seats ? `${item.seats} ${t('labels.seats').toLowerCase()}` : ''
    ])).join('') || emptyState();
  }

  function renderCarFilters(items) {
    const el = $('#carsFilters');
    if (!el) return;
    const statuses = unique(items.map((item) => item.status).filter(Boolean));
    const brands = unique(items.map((item) => item.brand).filter(Boolean));
    el.innerHTML = `
      ${selectHTML('brand', 'cars', [{ value: 'all', label: t('labels.brand') }].concat(brands.map((brand) => ({ value: brand, label: brand }))), filters.cars.brand)}
      ${selectHTML('status', 'cars', [{ value: 'all', label: t('filters.status') }].concat(statuses.map((status) => ({ value: status, label: statusLabel(status) }))), filters.cars.status)}
      <input data-filter="cars.search" type="search" value="${esc(filters.cars.search)}" placeholder="${esc(t('filters.search'))}">
    `;
  }

  function renderB2B() {
    const items = (data.b2bOffers || []).filter((item) => item.visible !== false);
    const el = $('#b2bFilters');
    const cats = unique(items.map((item) => item.category).filter(Boolean));
    if (el) {
      el.innerHTML = [`<button class="filter-btn ${filters.b2b.category === 'all' ? 'active' : ''}" data-b2b-category="all">${esc(t('filters.all'))}</button>`]
        .concat(cats.map((cat) => `<button class="filter-btn ${filters.b2b.category === cat ? 'active' : ''}" data-b2b-category="${esc(cat)}">${esc(categoryLabel(cat))}</button>`))
        .join('');
      el.dataset.activeCategory = filters.b2b.category;
    }

    const grid = $('#b2bGrid');
    if (!grid) return;

    const cardHTML = (item) => `
      <article class="b2b-card b2b-card--rich">
        <div class="b2b-card__image"><img src="${esc(mainImage(item))}" alt="${esc(text(item.title))}" loading="lazy" decoding="async"></div>
        <div class="b2b-card__body">
          <span class="b2b-card__category">${esc(categoryLabel(item.category))}</span>
          <h3>${esc(text(item.title))}</h3>
          <p>${esc(text(item.excerpt))}</p>
          <ul>${(item.products || []).slice(0, 6).map((product) => `<li>${esc(product)}</li>`).join('')}</ul>
          <div class="service-card__footer">
            <span class="service-card__meta">${esc(item.geography || '')}</span>
            <button class="btn btn--small" data-open-b2b="${esc(item.id)}">${esc(t('buttons.offer'))}</button>
          </div>
        </div>
      </article>`;

    const active = filters.b2b.category;
    const groups = active === 'all'
      ? cats.map((cat) => ({ cat, items: items.filter((item) => item.category === cat) })).filter((group) => group.items.length)
      : [{ cat: active, items: items.filter((item) => item.category === active) }];

    grid.classList.add('b2b-category-layout');
    grid.innerHTML = groups.map((group) => `
      <section class="b2b-category-section" data-b2b-group="${esc(group.cat)}">
        <div class="b2b-category-head">
          <span>${esc(group.items.length.toString().padStart(2, '0'))}</span>
          <div>
            <p class="eyebrow">B2B category</p>
            <h2>${esc(categoryLabel(group.cat))}</h2>
          </div>
        </div>
        <div class="b2b-category-grid">${group.items.map(cardHTML).join('')}</div>
      </section>
    `).join('') || emptyState();

    finalV156Cleanup();
    enhanceImages(grid);
  }

  function renderPromotions() {
    const grid = $('#promotionsGrid');
    if (!grid) return;
    const items = (data.promotions || []).filter((item) => item.visible !== false);
    grid.innerHTML = items.map((item) => `
      <article class="b2b-card">
        <div class="b2b-card__image"><img src="${esc(mainImage(item))}" alt="${esc(text(item.title))}" loading="lazy"></div>
        <h3>${esc(text(item.title))}</h3>
        <p>${esc(text(item.excerpt))}</p>
        <div class="service-card__footer">
          <span class="text-link">${esc(categoryLabel(item.category))}</span>
          <button class="btn btn--small" data-open-promo="${esc(item.id)}">${esc(text(item.cta) || t('buttons.consult'))}</button>
        </div>
      </article>
    `).join('') || emptyState();
  }

  function renderBlog() {
    const grid = $('#blogGrid');
    if (!grid) return;
    const articles = (data.blogArticles || []).filter((item) => item.visible !== false);
    grid.innerHTML = articles.map((item) => {
      const isBrandCover = item.id === 'blog-residence-bg';
      const isRealEstate = item.category === 'realEstate' || item.id === 'blog-sea-real-estate';
      return `
      <article class="blog-card ${isBrandCover ? 'blog-card--brandcover' : ''} ${isRealEstate ? 'blog-card--realestate' : ''}" data-tilt-card>
        ${item.image ? `<div class="blog-card__image"><img src="${esc(item.image)}" alt="${esc(text(item.title))}" loading="lazy"></div>` : ''}
        <div class="blog-card__body">
          <time>${esc(formatDate(item.date))}</time>
          <h3>${esc(text(item.title))}</h3>
          <p>${esc(text(item.excerpt))}</p>
          <div class="blog-card__footer blog-card__footer--details-only">
            <button class="btn btn--small" data-open-blog="${esc(item.id)}">${esc(t('buttons.details'))}</button>
          </div>
        </div>
      </article>`;
    }).join('') || emptyState();
  }

  function renderBrands() {
    const grid = $('#brandStack');
    if (!grid) return;
    grid.innerHTML = (data.brands || []).map((item) => `
      <article class="brand-card">
        <div class="brand-card__mark">${esc((item.name || 'D').trim().charAt(0))}</div>
        <div><h3>${esc(item.name)}</h3><p>${esc(text(item.text))}</p></div>
      </article>
    `).join('');
  }


  function renderReviews() {
    const sliders = Array.from(document.querySelectorAll('[data-reviews-slider]'));
    if (!sliders.length) return;
    const defaults = Array.from(sliders[0].querySelectorAll('.review-card')).map((card, index) => ({ html: card.outerHTML, index }));
    const approved = (data.reviews || []).filter((item) => item.visible !== false && String(item.status || 'approved') === 'approved');
    const items = approved.length ? approved : [];
    if (!items.length) return;
    sliders.forEach((slider) => {
      slider.dataset.reviewsReady = '';
      slider.innerHTML = items.map((item, index) => reviewCardHTML(item, index === 0)).join('');
    });
  }

  function reviewCardHTML(item, active) {
    const rating = Math.max(1, Math.min(5, Number(item.rating || 5)));
    const stars = '★★★★★'.slice(0, rating);
    const body = text(item.text) || '';
    const service = item.service || 'DIANAFARM GROUP';
    const country = item.country || '';
    const author = item.author || service;
    return `<article class="review-card ${active ? 'is-active' : ''}">
      <div class="review-card__top"><span class="review-card__badge">${esc(service)}</span><span class="review-card__rating">${esc(stars)}</span></div>
      <p>${esc(body)}</p>
      <div class="review-card__footer"><strong>${esc(author)}</strong><span>${esc(country)}</span></div>
    </article>`;
  }

  function renderContacts() {
    const el = $('#contactsList');
    if (!el) return;
    const contacts = data.settings.contacts || {};
    const icons = { bulgaria: 'BG', dubai: 'DXB', uzbekistan: 'UZ' };
    const websiteLabel = (url = '') => {
      const clean = String(url).replace(/^https?:\/\//, '');
      return /trythis\.ae|trythis\.az/i.test(clean) ? `${clean} — TryThis` : clean;
    };
    el.innerHTML = Object.entries(contacts).map(([key, contact]) => `
      <article class="contact-item contact-item--v92">
        <div class="contact-item__mark">${esc(icons[key] || '•')}</div>
        <div class="contact-item__body">
          <strong>${esc(contact.title || contact.country || key)}</strong>
          ${contact.address ? `<span>${esc(contact.address)}</span>` : ''}
          ${contact.phone ? `<a href="tel:${esc(contact.phone.replace(/\s/g, ''))}">${esc(contact.phone)}</a>` : ''}
          ${contact.email ? `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ''}
          ${contact.website ? `<a href="${esc(contact.website)}" target="_blank" rel="noopener">${esc(websiteLabel(contact.website))}</a>` : ''}
        </div>
      </article>
    `).join('');
  }

  function renderSocials() {
    const visible = (data.socialLinks || []).filter((item) => item.visible !== false && item.url);
    const isContactsPage = document.body && document.body.dataset.page === 'contacts';
    const grid = $('#socialGrid');
    if (grid) {
      grid.innerHTML = isContactsPage
        ? humanSocialBoardHTML(visible)
        : visible.map((item) => socialPill(item)).join('');
    }

    // Footer should stay clean: no long TikTok / Instagram / Facebook list there.
    const footer = $('#footerSocials');
    if (footer) footer.innerHTML = '';

    // Contacts page: compact list for the right contact column.
    const contact = $('#contactSocials');
    if (contact) contact.innerHTML = contactSocialDisclosureHTML(visible);

    const header = $('#headerSocials');
    if (header) header.innerHTML = visible.map((item) => socialHeadLink(item)).join('');
  }

  function humanSocialBoardHTML(items) {
    const groups = [
      { key: 'tiktok', title: 'TikTok', note: 'короткие видео и направления', match: /tiktok/i },
      { key: 'instagram', title: 'Instagram', note: 'визуальные обновления проектов', match: /instagram/i },
      { key: 'facebook', title: 'Facebook', note: 'локальные новости и контакты', match: /facebook/i }
    ];
    return `<div class="human-social-board">${groups.map((group) => {
      const groupItems = items.filter((item) => group.match.test(`${item.network || ''} ${item.title || ''} ${item.icon || ''}`));
      if (!groupItems.length) return '';
      return `<article class="human-social-card human-social-card--${esc(group.key)}">
        <div class="human-social-card__head"><span></span><div><strong>${esc(group.title)}</strong><small>${esc(group.note)}</small></div></div>
        <div class="human-social-card__links">${groupItems.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener"><span>${esc(fullSocialTitle(item))}</span><i aria-hidden="true">→</i></a>`).join('')}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function groupedSocialLinksHTML(items, options = {}) {
    const groups = [
      { key: 'tiktok', title: 'TikTok', match: /tiktok/i },
      { key: 'instagram', title: 'Instagram', match: /instagram/i },
      { key: 'facebook', title: 'Facebook', match: /facebook/i }
    ];
    const mode = options.mode === 'wide' ? ' social-accordion-v129--wide social-accordion-v133--wide' : ' social-accordion-v129--compact social-accordion-v133--compact';
    return `<div class="social-accordion-v128 social-accordion-v129 social-accordion-v133${mode}">${groups.map((group) => {
      const groupItems = items.filter((item) => group.match.test(`${item.network || ''} ${item.title || ''} ${item.icon || ''}`));
      if (!groupItems.length) return '';
      return `<details class="social-accordion-v128__group social-accordion-v129__group social-accordion-v133__group">
        <summary><span class="social-accordion-v133__name">${esc(group.title)}</span><i class="social-accordion-v133__arrow" aria-hidden="true"><span></span></i></summary>
        <div class="social-accordion-v128__links social-accordion-v129__links social-accordion-v133__links">
          ${groupItems.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener"><span>${esc(fullSocialTitle(item))}</span><i class="social-accordion-v133__link-arrow" aria-hidden="true"><span></span></i></a>`).join('')}
        </div>
      </details>`;
    }).join('')}</div>`;
  }

  function socialDisclosureLabel() {
    const labels = {
      ru: 'Социальные сети',
      bg: 'Социални мрежи',
      en: 'Social media',
      ka: 'სოციალური ქსელები'
    };
    return labels[lang] || labels.ru;
  }

  function contactSocialDisclosureHTML(items) {
    const groups = [
      { key: 'tiktok', title: 'TikTok', items: items.filter((item) => /tiktok/i.test(`${item.network || ''} ${item.title || ''} ${item.icon || ''}`)) },
      { key: 'instagram', title: 'Instagram', items: items.filter((item) => /instagram/i.test(`${item.network || ''} ${item.title || ''} ${item.icon || ''}`)) },
      { key: 'facebook', title: 'Facebook', items: items.filter((item) => /facebook/i.test(`${item.network || ''} ${item.title || ''} ${item.icon || ''}`)) }
    ].filter((group) => group.items.length);
    if (!groups.length) return '';
    return `<div class="contact-socials-accordion" aria-label="${esc(socialDisclosureLabel())}">
      <div class="contact-socials-accordion__title">${esc(socialDisclosureLabel())}</div>
      ${groups.map((group) => `
      <details class="contact-socials-accordion__group contact-socials-accordion__group--${esc(group.key)}">
        <summary><span>${esc(group.title)}</span><i aria-hidden="true"></i></summary>
        <div class="contact-socials-accordion__links">${group.items.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener"><span>${esc(fullSocialTitle(item))}</span></a>`).join('')}</div>
      </details>`).join('')}</div>`;
  }

  function fullSocialTopic(item) {
    const title = String(item.title || '').trim();
    return title.replace(/^TikTok\s*\|\s*/i, '')
      .replace(/^Instagram\s*\|\s*/i, '')
      .replace(/^Facebook\s*\|\s*/i, '')
      .trim() || title || 'Official account';
  }


  function fullSocialTitle(item) {
    const title = String(item.title || '').trim();
    return title || `${item.network || 'Social'} account`;
  }

  function renderLegal() {
    const grid = $('#legalGrid');
    if (!grid) return;
    grid.innerHTML = (data.legalPages || []).map((item) => `
      <a class="legal-card" href="pages/${item.id}.html">
        <h3>${esc(text(item.title))}</h3>
        <p>${esc(text(item.text))}</p>
      </a>
    `).join('');
  }

  function renderInlineForms(type) {
    const root = $('#inlineForms');
    if (!root) return;
    $$('#formTabs .tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.formTab === type));
    root.innerHTML = leadFormHTML(type, {}, false);
  }

  function objectCardHTML(type, item, meta) {
    const title = type === 'car' ? `${item.brand} ${item.model}` : text(item.title);
    const price = type === 'car' ? item.priceDay : item.price;
    const status = statusLabel(item.status);
    const requestKey = type === 'car' ? 'buttons.carRequest' : 'buttons.objectRequest';
    const locationTokens = [item.city, item.location, item.district, item.complex].filter(Boolean).map((v) => String(v).toLowerCase());
    const isLocationValue = (value) => {
      const raw = String(value || '').trim();
      const normalized = raw.toLowerCase();
      return locationTokens.includes(normalized) || /(святой|влас|равда|бургас|созополь|несеб|помор|болгар|sofia|bulgaria|sveti|vlas|ravda|burgas|sozopol|nessebar|pomorie)/i.test(raw);
    };
    const metaHTML = meta.filter(Boolean).slice(0, 6).map((value) => `<span class="${isLocationValue(value) ? 'object-meta__location' : ''}">${esc(value)}</span>`).join('');
    return `
      <article class="object-card object-card--${esc(type)}" data-open-object="${esc(type)}:${esc(item.id)}">
        <div class="object-card__media">
          <img src="${esc(mainImage(item))}" alt="${esc(title)}" loading="lazy">
          <div class="badge-row">
            <span class="badge badge--gold">${esc(status)}</span>
            <span class="badge badge--green">${esc(type === 'car' ? t('nav.cars') : dealLabel(item.dealType || item.type || item.rentalType))}</span>
          </div>
        </div>
        <div class="object-card__body">
          <h3>${esc(title)}</h3>
          <div class="object-meta">${metaHTML}</div>
          <div class="object-price">${esc(price || '')}</div>
          <div class="object-card__actions object-card__actions--no-whatsapp">
            <button class="btn btn--small" data-open-object="${esc(type)}:${esc(item.id)}">${esc(t('buttons.details'))}</button>
            <button class="btn btn--small" data-open-form="${type === 'car' ? 'car' : 'realEstate'}" data-context="${esc(title)}">${esc(t(requestKey))}</button>
          </div>
        </div>
      </article>
    `;
  }

  function selectHTML(field, group, options, current) {
    const active = options.find((opt) => String(opt.value) === String(current)) || options[0] || { value: 'all', label: field };
    return `
      <div class="premium-filter" data-filter-widget="${esc(group)}.${esc(field)}">
        <button class="premium-filter__button" type="button" data-filter-toggle aria-expanded="false">
          <span class="premium-filter__label">${esc(labelForFilter(field))}</span>
          <strong>${esc(active.label)}</strong>
          <i aria-hidden="true">⌄</i>
        </button>
        <div class="premium-filter__menu" role="listbox">
          ${options.map((opt) => `<button type="button" class="premium-filter__option ${String(opt.value) === String(current) ? 'active' : ''}" data-filter-option="${esc(opt.value)}">${esc(opt.label)}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function labelForFilter(field) {
    const labels = {
      dealType: t('labels.type'),
      type: t('labels.type'),
      category: t('labels.category'),
      city: t('labels.city'),
      status: t('labels.status'),
      brand: t('labels.brand')
    };
    return labels[field] || field;
  }

  function mainImage(item) {
    if (item.images && item.images[0]) return item.images[0];
    if (item.image) return item.image;
    return 'assets/img/hero-sea-office.svg';
  }

  function categoryLabel(category) {
    if (!category) return '';
    const fallback = {
      consulting: 'Консалтинг',
      business: 'Бизнес и банки',
      international: 'Международные направления',
      product: 'Продукция',
      realEstate: 'Недвижимость',
      trade: 'B2B торговля',
      fertilizer: 'Удобрения',
      cosmetics: 'Косметика',
      raw: 'Сырьё',
      cars: 'Автомобили',
      parking: 'Паркинги',
      apartment: 'Апартаменты',
      house: 'Дома',
      investment: 'Инвестиции'
    };
    const key = `categories.${category}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return fallback[category] || text(category) || category;
  }

  function dealLabel(type) {
    if (!type) return '';
    if (type === 'sale') return t('filters.sale');
    if (type === 'rent') return t('filters.rent');
    return text(type);
  }

  function statusLabel(status) {
    if (!status) return '';
    return t(`filters.${status}`) || status;
  }

  function propCategoryLabel(category) {
    return text(propertyCategories[category] || category);
  }

  function unique(array) {
    return Array.from(new Set(array));
  }

  function flattenSearch(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(flattenSearch).join(' ');
    if (typeof value === 'object') return Object.values(value).map(flattenSearch).join(' ');
    return '';
  }

  function normalizeSearch(value) {
    return String(value || '').toLowerCase().replace(/[\s\u00a0]+/g, ' ').trim();
  }

  function matchesSearch(searchText, query) {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return true;
    return normalizedQuery.split(' ').every((part) => searchText.includes(part));
  }

  function emptyState() {
    return `<div class="empty-state">${esc(t('misc.noResults'))}</div>`;
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'bg' ? 'bg-BG' : lang === 'ka' ? 'ka-GE' : 'ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date));
    } catch {
      return date || '';
    }
  }

  function socialPill(item) {
    const safeUrl = item.url === '#' ? '#' : item.url;
    const label = compactSocialLabel(item);
    return `<a class="social-pill social-pill--compact" href="${esc(safeUrl)}" target="_blank" rel="noopener" data-social-network="${esc(label.network.toLowerCase())}" aria-label="${esc(item.title)}">${socialIcon(item.icon || item.network)}<span class="social-pill__text"><strong>${esc(label.network)}</strong><em>${esc(label.topic)}</em></span></a>`;
  }

  function compactSocialLabel(item) {
    const rawNetwork = String(item.network || item.icon || '').trim();
    const rawTitle = String(item.title || '').trim();
    const network = /facebook/i.test(rawNetwork + ' ' + rawTitle) ? 'Facebook'
      : /instagram/i.test(rawNetwork + ' ' + rawTitle) ? 'Instagram'
      : /tiktok/i.test(rawNetwork + ' ' + rawTitle) ? 'TikTok'
      : (rawNetwork || 'Social');
    let topic = rawTitle.replace(/^TikTok\s*\|?\s*/i, '')
      .replace(/^Instagram\s*\|?\s*/i, '')
      .replace(/^Facebook\s*\|?\s*/i, '')
      .replace(/^Difarm\s*/i, '')
      .replace(/^DIANAFARM\s*/i, '')
      .replace(/^\|\s*/, '')
      .trim();
    if (!topic || topic.toLowerCase() === network.toLowerCase()) topic = 'Official';
    return { network, topic };
  }

  function socialHeadLink(item) {
    const safeUrl = item.url === '#' ? '#' : item.url;
    const label = String(item.network || item.icon || '').slice(0, 2).toUpperCase();
    return `<a class="social-head" href="${esc(safeUrl)}" target="_blank" rel="noopener" aria-label="${esc(item.title)}">${esc(label)}</a>`;
  }


  function imageFallbackSrc() {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#07111D"/>
            <stop offset=".58" stop-color="#10234B"/>
            <stop offset="1" stop-color="#D4A373"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="760" fill="url(#g)"/>
        <circle cx="600" cy="330" r="110" fill="none" stroke="#E8C47E" stroke-width="8" opacity=".48"/>
        <text x="600" y="348" text-anchor="middle" fill="#E8C47E" font-family="Georgia,serif" font-size="120" font-weight="700">D</text>
        <text x="600" y="505" text-anchor="middle" fill="#FFF9EF" font-family="Arial,sans-serif" font-size="42" font-weight="700" letter-spacing="6">DIANAFARM GROUP</text>
      </svg>
    `);
  }

  function enhanceImages(root = document) {
    $$('img', root).forEach((img, index) => {
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
      const isHeroOrEarlyCatalog = index < 6 || !!img.closest('.hero, .v9-page-hero');
      if (isHeroOrEarlyCatalog) {
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', index < 4 ? 'high' : 'auto');
      } else if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (img.dataset.imageEnhanced === 'true') return;
      img.dataset.imageEnhanced = 'true';
      img.addEventListener('error', () => {
        if (img.dataset.fallbackApplied === 'true') return;
        img.dataset.fallbackApplied = 'true';
        img.src = imageFallbackSrc();
        img.classList.add('is-fallback-image');
      }, { passive: true });
    });
  }

  function socialIcon(name) {
    const raw = String(name || '').toLowerCase();
    const label = raw.includes('facebook') || raw === 'fb' ? 'FB'
      : raw.includes('instagram') || raw === 'in' ? 'IN'
      : raw.includes('tiktok') || raw === 'ti' || raw === 'tt' ? 'TT'
      : String(name || '').slice(0, 2).toUpperCase();
    return `<span class="social-icon" aria-hidden="true"><span>${esc(label)}</span></span>`;
  }

  function injectAnalytics(id) {
    if (!id || window.__dfgAnalyticsInjected) return;
    window.__dfgAnalyticsInjected = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  function bindGlobalEvents() {
    $('#menuToggle')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
    $$('#mainNav a').forEach((link) => link.addEventListener('click', () => document.body.classList.remove('menu-open')));
    $$('#mainNav .nav-dropdown__menu a').forEach((link) => link.addEventListener('click', () => document.body.classList.remove('menu-open')));

    document.addEventListener('click', (event) => {
      const servicesToggle = event.target.closest('[data-services-toggle]');
      if (servicesToggle) {
        event.preventDefault();
        event.stopPropagation();
        const dropdown = servicesToggle.closest('[data-services-dropdown]');
        const isOpen = dropdown?.classList.toggle('is-open');
        servicesToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        return;
      }

      if (!event.target.closest('[data-services-dropdown]')) {
        closeServicesDropdowns();
      }


      const langSwitch = event.target.closest('.lang-switch--premium');
      if (langSwitch && !event.target.closest('[data-lang]')) {
        event.preventDefault();
        langSwitch.classList.toggle('is-open');
        return;
      }

      const langBtn = event.target.closest('[data-lang]');
      if (langBtn) {
        const switcher = langBtn.closest('.lang-switch--premium');
        if (switcher && langBtn.classList.contains('active') && !switcher.classList.contains('is-open')) {
          switcher.classList.add('is-open');
          return;
        }
        lang = langBtn.dataset.lang;
        localStorage.setItem('dfg_lang', lang);
        applyTranslations();
        renderAll();
        switcher?.classList.remove('is-open');
        return;
      }

      if (!event.target.closest('.lang-switch--premium')) {
        $$('.lang-switch--premium.is-open').forEach((switcher) => switcher.classList.remove('is-open'));
      }

      const filterToggle = event.target.closest('[data-filter-toggle]');
      if (filterToggle) {
        event.preventDefault();
        const widget = filterToggle.closest('[data-filter-widget]');
        const isOpen = !widget.classList.contains('is-open');
        $$('[data-filter-widget].is-open').forEach((item) => item.classList.remove('is-open'));
        widget.classList.toggle('is-open', isOpen);
        filterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        return;
      }

      const filterOption = event.target.closest('[data-filter-option]');
      if (filterOption) {
        event.preventDefault();
        const widget = filterOption.closest('[data-filter-widget]');
        const [group, field] = widget.dataset.filterWidget.split('.');
        filters[group][field] = filterOption.dataset.filterOption;
        widget.classList.remove('is-open');
        if (group === 'realEstate') renderRealEstate();
        if (group === 'parking') renderParkings();
        if (group === 'cars') renderCars();
        refreshRevealItems();
        return;
      }

      if (!event.target.closest('[data-filter-widget]')) {
        $$('[data-filter-widget].is-open').forEach((item) => item.classList.remove('is-open'));
      }

      const serviceFilter = event.target.closest('[data-service-category]');
      if (serviceFilter) {
        serviceCategory = serviceFilter.dataset.serviceCategory;
        renderServices();
        refreshRevealItems();
        return;
      }

      const b2bFilter = event.target.closest('[data-b2b-category]');
      if (b2bFilter) {
        filters.b2b.category = b2bFilter.dataset.b2bCategory;
        renderB2B();
        refreshRevealItems();
        return;
      }

      const openService = event.target.closest('[data-open-service]');
      if (openService) {
        openServiceModal(openService.dataset.openService);
        return;
      }

      const cardLink = event.target.closest('[data-card-link]');
      if (cardLink && !event.target.closest('a[href]') && !event.target.closest('button')) {
        window.location.href = cardLink.dataset.cardLink;
        return;
      }

      const openObject = event.target.closest('[data-open-object]');
      if (openObject && !event.target.closest('a[href]') && !event.target.closest('[data-open-form]')) {
        const [type, id] = openObject.dataset.openObject.split(':');
        openObjectModal(type, id);
        return;
      }

      const openB2B = event.target.closest('[data-open-b2b]');
      if (openB2B) {
        openB2BModal(openB2B.dataset.openB2b);
        return;
      }

      const openPromo = event.target.closest('[data-open-promo]');
      if (openPromo) {
        openPromoModal(openPromo.dataset.openPromo);
        return;
      }

      const openBlog = event.target.closest('[data-open-blog]');
      if (openBlog) {
        openBlogModal(openBlog.dataset.openBlog);
        return;
      }

      const openForm = event.target.closest('[data-open-form]');
      if (openForm) {
        openFormModal(openForm.dataset.openForm, { context: openForm.dataset.context || '' });
        return;
      }

      if (!event.target.closest('.lang-switch--premium')) {
        $$('.lang-switch--premium.is-open').forEach((el) => el.classList.remove('is-open'));
      }

      if (event.target.closest('[data-close-modal]')) {
        event.target.closest('dialog')?.close();
        return;
      }

      const formTab = event.target.closest('[data-form-tab]');
      if (formTab) {
        renderInlineForms(formTab.dataset.formTab);
      }
    });

    const handleFilterControl = (event) => {
      const control = event.target.closest('[data-filter]');
      if (!control) return;
      const [group, field] = control.dataset.filter.split('.');
      filters[group][field] = control.value;
      const skipFilters = field === 'search';
      if (group === 'realEstate') renderRealEstate({ skipFilters });
      if (group === 'parking') renderParkings({ skipFilters });
      if (group === 'cars') renderCars({ skipFilters });
      refreshRevealItems();
    };
    document.addEventListener('input', handleFilterControl);
    document.addEventListener('change', handleFilterControl);

    document.addEventListener('submit', async (event) => {
      const form = event.target.closest('[data-lead-form]');
      if (!form) return;
      event.preventDefault();
      if (form.dataset.submitting === 'true') return;
      const type = form.dataset.leadForm;
      const rawValues = Object.fromEntries(new FormData(form).entries());
      if (isLeadSpam(rawValues)) return;
      const cleanValues = normalizeLeadValues(rawValues);
      if (!validateLeadValues(cleanValues)) { showToast(leadMessage('invalid')); return; }
      if (isLeadRateLimited(cleanValues)) { showToast(leadMessage('rate')); return; }
      const lead = collectLead(form, type);
      const submitButton = form.querySelector('button[type="submit"]');
      const previousButtonText = submitButton ? submitButton.textContent : '';
      form.dataset.submitting = 'true';
      form.classList.add('is-submitting');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      }
      try {
        saveLead(lead);
        const dispatchResult = await dispatchLead(lead);
        if (dispatchResult && dispatchResult.queued) queueLeadForRetry(lead);
        form.reset();
        form.classList.add('is-sent');
        const success = form.querySelector('.lead-form__success');
        if (success) success.textContent = dispatchResult && dispatchResult.queued ? leadMessage('queued') : t('forms.success');
        showToast(dispatchResult && dispatchResult.queued ? leadMessage('queued') : t('forms.success'));
        setTimeout(() => form.classList.remove('is-sent'), 5200);
        const dialog = form.closest('dialog');
        if (dialog) setTimeout(() => dialog.close(), 900);
      } catch (error) {
        console.warn('Lead submit failed', error);
        queueLeadForRetry(lead);
        showToast(leadMessage('queued'));
      } finally {
        form.dataset.submitting = 'false';
        form.classList.remove('is-submitting');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-busy');
          if (previousButtonText) submitButton.textContent = previousButtonText;
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      const card = event.target.closest('[data-card-link]');
      if (!card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = card.dataset.cardLink;
      }
    });

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  function wireWhatsAppLinks() {
    $$('[data-whatsapp]').forEach((link) => {
      const key = link.dataset.whatsapp;
      link.setAttribute('href', whatsappLink(key));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    });
  }

  function whatsappLink(key, context = '') {
    const contact = data.settings.contacts?.[key] || data.settings.contacts?.bulgaria || {};
    const phone = String(contact.whatsapp || contact.phone || '').replace(/\D/g, '');
    const waHello = lang === 'en' ? 'Hello' : lang === 'bg' ? 'Здравейте' : lang === 'ka' ? 'გამარჯობა' : 'Здравствуйте';
    const waText = lang === 'en' ? 'I would like a DIANAFARM GROUP consultation.' : lang === 'bg' ? 'Искам консултация с DIANAFARM GROUP.' : lang === 'ka' ? 'მსურს DIANAFARM GROUP-ის კონსულტაცია.' : 'Хочу консультацию DIANAFARM GROUP.';
    const message = encodeURIComponent(`${waHello}! ${waText}${context ? ' ' + context : ''}`);
    return phone ? `https://wa.me/${phone}?text=${message}` : '#';
  }


  function whatsappCountryLabels() {
    const labels = {
      ru: { bulgaria: 'Bulgaria', dubai: 'Dubai', uzbekistan: 'Uzbekistan' },
      bg: { bulgaria: 'Bulgaria', dubai: 'Dubai', uzbekistan: 'Uzbekistan' },
      en: { bulgaria: 'Bulgaria', dubai: 'Dubai', uzbekistan: 'Uzbekistan' },
      ka: { bulgaria: 'Bulgaria', dubai: 'Dubai', uzbekistan: 'Uzbekistan' }
    };
    return labels[lang] || labels.ru;
  }

  function inferWhatsAppKey(source) {
    const payload = typeof source === 'string'
      ? source
      : [source?.id, source?.category, source?.slug, source?.location, source?.city, source?.country, text(source?.title), text(source?.excerpt)].filter(Boolean).join(' ');
    const haystack = String(payload || '').toLowerCase();
    if (/(dubai|uae|emirat|trythis|new era|middle east)/i.test(haystack)) return 'dubai';
    if (/(uzbek|asia|ташкент|узбекистан)/i.test(haystack)) return 'uzbekistan';
    return 'bulgaria';
  }

  function whatsappRotatorButton(contextText = '', initialKey = 'bulgaria', extraClass = '') {
    const labels = whatsappCountryLabels();
    const buttonClass = ['btn', 'btn--whatsapp', 'btn--whatsapp-rotator', 'btn--whatsapp-rotator--inline', 'whatsapp-rotator', extraClass].filter(Boolean).join(' ');
    const label = labels[initialKey] || initialKey;
    return `<a class="${buttonClass}" data-whatsapp-rotator data-wa-current="${esc(initialKey)}" data-wa-context="${esc(contextText)}" href="${esc(whatsappLink(initialKey, contextText))}" target="_blank" rel="noopener"><span class="wa-static">WhatsApp</span><span class="wa-country">${esc(label)}</span></a>`;
  }

  function enhanceWhatsAppRotators() {
    const keys = ['bulgaria', 'dubai', 'uzbekistan'];
    const labels = whatsappCountryLabels();
    const buttons = $$('.whatsapp-rotator, [data-whatsapp-rotator]');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      if (!btn.querySelector('.wa-static')) {
        btn.innerHTML = '<span class="wa-static">WhatsApp</span><span class="wa-country"></span>';
      }
      const countryNode = btn.querySelector('.wa-country');
      btn._waSetCountry = (nextKey) => {
        const key = nextKey || btn.dataset.waCurrent || keys[0];
        const label = labels[key] || key;
        btn.dataset.waCurrent = key;
        btn.setAttribute('href', whatsappLink(key, btn.dataset.waContext || ''));
        btn.setAttribute('aria-label', `WhatsApp ${label}`);
        if (!countryNode) return;
        window.clearTimeout(btn._waChangeTimer);
        window.clearTimeout(btn._waCleanTimer);
        const currentLabel = (countryNode.textContent || '').trim();
        countryNode.setAttribute('aria-live', 'polite');
        if (!currentLabel || currentLabel === label) {
          countryNode.textContent = label;
          countryNode.classList.remove('is-leaving');
          countryNode.classList.add('is-changing');
          btn._waCleanTimer = window.setTimeout(() => countryNode.classList.remove('is-changing'), 560);
          return;
        }
        countryNode.classList.remove('is-changing');
        countryNode.classList.add('is-leaving');
        btn._waChangeTimer = window.setTimeout(() => {
          countryNode.textContent = label;
          countryNode.classList.remove('is-leaving');
          countryNode.classList.add('is-changing');
          btn._waCleanTimer = window.setTimeout(() => countryNode.classList.remove('is-changing'), 560);
        }, 170);
      };
    });

    const syncState = window.__waRotatorSync || (window.__waRotatorSync = { index: 0, timer: null, buttons: [] });
    syncState.buttons = buttons;

    let initialKey = buttons[0].dataset.waCurrent || keys[0];
    if (!keys.includes(initialKey)) initialKey = keys[0];
    syncState.index = keys.indexOf(initialKey);
    buttons.forEach((btn) => {
      btn.dataset.waRotatorReady = 'true';
      btn._waSetCountry(initialKey);
    });

    if (syncState.timer) return;
    syncState.timer = window.setInterval(() => {
      syncState.index = (syncState.index + 1) % keys.length;
      const nextKey = keys[syncState.index];
      (window.__waRotatorSync?.buttons || []).forEach((btn) => {
        if (typeof btn._waSetCountry === 'function') btn._waSetCountry(nextKey);
      });
    }, 2000);
  }


  function initAgileCreditEffect() {
    const resetLink = (link) => {
      if (!link) return;
      link.classList.remove('is-shattering', 'is-pressed');
      link.removeAttribute('aria-busy');
      link.querySelectorAll('.agile-credit__particle').forEach((particle) => particle.remove());
    };

    $$('.agile-credit a').forEach((link) => {
      resetLink(link);

      if (link.dataset.agileReturnResetReady !== 'true') {
        link.dataset.agileReturnResetReady = 'true';
        window.addEventListener('pageshow', () => resetLink(link));
        window.addEventListener('focus', () => resetLink(link));
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') resetLink(link);
        });
      }

      if (link.dataset.agileEffectReady === 'true') return;
      link.dataset.agileEffectReady = 'true';

      link.addEventListener('click', (event) => {
        const href = link.href || link.getAttribute('href');
        if (!href || href === '#') return;
        event.preventDefault();
        if (link.classList.contains('is-shattering')) return;

        resetLink(link);
        link.classList.add('is-shattering', 'is-pressed');
        link.setAttribute('aria-busy', 'true');

        const count = 16;
        for (let i = 0; i < count; i += 1) {
          const particle = document.createElement('span');
          particle.className = 'agile-credit__particle';
          const angle = (Math.PI * 2 * i / count) + (Math.random() * 0.46 - 0.23);
          const distance = 22 + Math.random() * 54;
          particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
          particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
          particle.style.setProperty('--r', `${Math.random() * 160 - 80}deg`);
          particle.style.setProperty('--d', `${Math.random() * 0.1}s`);
          particle.style.setProperty('--s', `${4 + Math.random() * 4}px`);
          link.appendChild(particle);
        }

        window.setTimeout(() => {
          window.location.href = href;
        }, 430);
      });
    });
  }

  function initLanguageHoverKeepOpen() {
    $$('.lang-switch--premium').forEach((switcher) => {
      if (switcher.dataset.hoverReady === 'true') return;
      switcher.dataset.hoverReady = 'true';
      let closeTimer;
      const open = () => {
        window.clearTimeout(closeTimer);
        switcher.classList.add('is-open');
      };
      const close = () => {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          if (!switcher.matches(':hover') && !switcher.contains(document.activeElement)) {
            switcher.classList.remove('is-open');
          }
        }, 420);
      };
      switcher.addEventListener('mouseenter', open);
      switcher.addEventListener('focusin', open);
      switcher.addEventListener('mouseleave', close);
      switcher.addEventListener('focusout', close);
    });
  }


  function formatFormLeadText(type) {
    const raw = esc(formLeadText(type));
    if (type !== 'consultation') return raw;
    const replacements = [
      ['понятный маршрут сопровождения', '<br>понятный маршрут сопровождения'],
      ['ясен маршрут за съдействие', '<br>ясен маршрут за съдействие'],
      ['გასაგებ მხარდაჭერის მარშრუტს', '<br>გასაგებ მხარდაჭერის მარშრუტს'],
      ['clear support route', '<br>clear support route']
    ];
    let html = raw;
    replacements.forEach(([from, to]) => { html = html.replace(from, to); });
    return html;
  }

  function formLeadText(type) {
    const copy = {
      ru: {
        consultation: 'Расскажите о задаче, стране и сроках - мы предложим понятный маршрут сопровождения.',
        realEstate: 'Опишите объект, бюджет и цель покупки или аренды — подготовим персональную подборку.',
        b2b: 'Опишите товар, рынок и документы — подготовим маршрут сделки и коммерческого запроса.'
      },
      bg: {
        consultation: 'Разкажете за задачата, държавата и сроковете — ще предложим ясен маршрут за съдействие.',
        realEstate: 'Опишете имота, бюджета и целта — ще подготвим персонална подборка.',
        car: 'Посочете дати, формат на наема и предпочитания - ще проверим наличност и условия.',
        b2b: 'Опишете продукта, пазара и документите - ще подготвим маршрут на сделката.'
      },
      ka: {
        consultation: 'მოგვიყევით ამოცანაზე, ქვეყანასა და ვადებზე - შემოგთავაზებთ გასაგებ მხარდაჭერის მარშრუტს.',
        realEstate: 'აღწერეთ ობიექტი, ბიუჯეტი და მიზანი - მოვამზადებთ პერსონალურ არჩევანს.',
        car: 'მიუთითეთ თარიღები, არენდის ფორმატი და სურვილები - შევამოწმებთ ხელმისაწვდომობას და პირობებს.',
        b2b: 'აღწერეთ პროდუქტი, ბაზარი და დოკუმენტები - მოვამზადებთ გარიგებისა და კომერციული მოთხოვნის მარშრუტს.'
      },
      en: {
        consultation: 'Tell us about the task, country and timing - we will propose a clear support route.',
        realEstate: 'Describe the property, budget and purchase or rental goal - we will prepare a personal selection.',
        car: 'Specify dates, rental format and car preferences - we will check availability and terms.',
        b2b: 'Describe the product, market and documents - we will prepare the deal and commercial request route.'
      }
    };
    const selected = copy[lang] || copy.ru;
    return selected[type] || selected.consultation;
  }

  function formExperienceBadgeHTML(type) {
    if (type !== 'consultation') return '';
    const copy = {
      ru: ['Международный опыт', 'BG · EU · UAE · Asia'],
      bg: ['Международен опит', 'BG · EU · UAE · Asia'],
      ka: ['საერთაშორისო გამოცდილება', 'BG · EU · UAE · Asia'],
      en: ['International experience', 'BG · EU · UAE · Asia']
    };
    const [title, label] = copy[lang] || copy.ru;
    return `<aside class="lead-form__experience-badge" aria-label="${esc(title)}"><i>${fieldIcon('country')}</i><span><strong>${esc(title)}</strong><small>${esc(label)}</small></span></aside>`;
  }

  function formTrustHTML(type) {
    const sets = {
      ru: {
        consultation: [['100% конфиденциальность', 'данные защищены'], ['Ответ 24 часа', 'в рабочее время'], ['Международный опыт', 'BG · EU · UAE · Asia']],
        realEstate: [['Юридическая чистота', 'проверка объекта'], ['Персональная подборка', 'по бюджету и цели'], ['WhatsApp связь', 'быстрый контакт']],
        car: [['Быстрый ответ', 'даты и доступность'], ['Прозрачные условия', 'цены и залог'], ['Трансфер', 'по запросу']],
        b2b: [['Конфиденциально', 'B2B коммуникация'], ['Документы', 'LOI / ICPO / PDF'], ['Международно', 'EU · UAE · Asia']]
      },
      bg: {
        consultation: [['100% конфиденциалност', 'данните са защитени'], ['Отговор до 24 часа', 'в работно време'], ['Международен опит', 'BG · EU · UAE · Asia']],
        realEstate: [['Правна чистота', 'проверка на имота'], ['Персонална подборка', 'по бюджет и цел'], ['WhatsApp връзка', 'бърз контакт']],
        car: [['Бърз отговор', 'дати и наличност'], ['Прозрачни условия', 'цени и депозит'], ['Трансфер', 'по заявка']],
        b2b: [['Конфиденциално', 'B2B комуникация'], ['Документи', 'LOI / ICPO / PDF'], ['Международно', 'EU · UAE · Asia']]
      },
      ka: {
        consultation: [['100% კონფიდენციალურობა', 'მონაცემები დაცულია'], ['პასუხი 24 საათში', 'სამუშაო დროს'], ['საერთაშორისო გამოცდილება', 'BG · EU · UAE · Asia']],
        realEstate: [['იურიდიული სისუფთავე', 'ობიექტის შემოწმება'], ['პერსონალური შერჩევა', 'ბიუჯეტისა და მიზნის მიხედვით'], ['WhatsApp კავშირი', 'სწრაფი კონტაქტი']],
        car: [['სწრაფი პასუხი', 'თარიღები და ხელმისაწვდომობა'], ['გამჭვირვალე პირობები', 'ფასები და დეპოზიტი'], ['ტრანსფერი', 'მოთხოვნით']],
        b2b: [['კონფიდენციალურად', 'B2B კომუნიკაცია'], ['დოკუმენტები', 'LOI / ICPO / PDF'], ['საერთაშორისოდ', 'EU · UAE · Asia']]
      },
      en: {
        consultation: [['100% confidentiality', 'data protected'], ['24h response', 'during business hours'], ['International experience', 'BG · EU · UAE · Asia']],
        realEstate: [['Legal clarity', 'property check'], ['Personal selection', 'by budget and goal'], ['WhatsApp contact', 'fast communication']],
        car: [['Fast response', 'dates and availability'], ['Transparent terms', 'prices and deposit'], ['Transfer', 'on request']],
        b2b: [['Confidential', 'B2B communication'], ['Documents', 'LOI / ICPO / PDF'], ['International', 'EU · UAE · Asia']]
      }
    };
    const chips = (sets[lang] || sets.ru)[type] || (sets[lang] || sets.ru).consultation;
    const visibleChips = type === 'consultation' ? chips.slice(0, 2) : chips;
    return `<div class="lead-form__trust lead-form__trust--${esc(type)}">${visibleChips.map(([title, text]) => `<span><i>${fieldIcon('trust')}</i><strong>${esc(title)}</strong><small>${esc(text)}</small></span>`).join('')}</div>`;
  }

  function fieldIcon(name) {
    const icons = {
      name: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-4.2 3.5-6.3 7.5-6.3s6.7 2.1 7.5 6.3"/></svg>',
      phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5l3 3-2 2c1.4 2.8 3.4 4.8 6 6l2-2 3 3c.5.5.5 1.3 0 1.8-1.2 1.1-2.7 1.6-4.3 1.1-4.9-1.4-8.8-5.3-10.3-10.3-.5-1.6 0-3.1 1.1-4.3.5-.5 1.3-.5 1.8 0z"/></svg>',
      email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>',
      country: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.4 3.5 5.1 3.5 8s-1.2 5.6-3.5 8c-2.3-2.4-3.5-5.1-3.5-8s1.2-5.6 3.5-8z"/></svg>',
      topic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"/><path d="M8 9h8M8 13h5"/></svg>',
      object: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/></svg>',
      buyRent: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/><path d="M12 4v16M4 12h16"/></svg>',
      budget: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4z"/><circle cx="12" cy="12" r="2.5"/><path d="M7 10v4M17 10v4"/></svg>',
      dates: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14v14H5z"/><path d="M8 4v4M16 4v4M5 10h14"/></svg>',
      preferredDate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14v14H5z"/><path d="M8 4v4M16 4v4M5 10h14"/><path d="M8 14h3M13 14h3M8 17h3"/></svg>',
      preferredTime: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
      carType: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16h12l-1-5H7z"/><path d="M8 16v2M16 16v2M8 11l1.2-3h5.6L16 11"/></svg>',
      message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>',
      trust: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.8-2.8 8.4-7 10-4.2-1.6-7-5.2-7-10V6z"/><path d="M9 12l2 2 4-5"/></svg>'
    };
    return icons[name] || icons.topic;
  }

  function placeholderFor(name, label) {
    const placeholders = {
      ru: {
        name: 'Ваше имя', phone: '+359 / +971 / +998 ...', email: 'name@company.com', country: 'Страна / регион', topic: 'Например: ВНЖ, компания, банк, UAE, B2B', message: 'Коротко опишите задачу, сроки, страну и желаемый результат', object: 'Название объекта или локация', buyRent: 'Покупка / аренда', budget: 'Например: до €250 000', dates: 'Например: 12–19 июля', preferredDate: 'Выберите дату', preferredTime: 'Например: 14:30', carType: 'Седан, SUV, с водителем, трансфер'
      },
      bg: {
        name: 'Вашето име', phone: '+359 / +971 / +998 ...', email: 'name@company.com', country: 'Държава / регион', topic: 'Например: пребиваване, фирма, банка, UAE, B2B', message: 'Опишете накратко задачата, сроковете, държавата и желания резултат', object: 'Име на имот или локация', buyRent: 'Покупка / наем', budget: 'Например: до €250 000', dates: 'Например: 12–19 юли', preferredDate: 'Изберете дата', preferredTime: 'Например: 14:30', carType: 'Седан, SUV, с шофьор, трансфер'
      },
      ka: {
        name: 'თქვენი სახელი', phone: '+359 / +971 / +998 ...', email: 'name@company.com', country: 'ქვეყანა / რეგიონი', topic: 'მაგალითად: ბინადრობა, კომპანია, ბანკი, UAE, B2B', message: 'მოკლედ აღწერეთ ამოცანა, ვადები, ქვეყანა და სასურველი შედეგი', object: 'ობიექტის სახელი ან ლოკაცია', buyRent: 'ყიდვა / ქირა', budget: 'მაგალითად: €250 000-მდე', dates: 'მაგალითად: 12–19 ივლისი', preferredDate: 'აირჩიეთ თარიღი', preferredTime: 'მაგალითად: 14:30', carType: 'სედანი, SUV, მძღოლით, ტრანსფერი'
      },
      en: {
        name: 'Your name', phone: '+359 / +971 / +998 ...', email: 'name@company.com', country: 'Country / region', topic: 'Example: residence, company, bank, UAE, B2B', message: 'Briefly describe the task, timing, country and desired result', object: 'Property name or location', buyRent: 'Purchase / rent', budget: 'Example: up to €250 000', dates: 'Example: 12–19 July', preferredDate: 'Select date', preferredTime: 'Example: 14:30', carType: 'Sedan, SUV, chauffeur, transfer'
      }
    };
    return (placeholders[lang] || placeholders.ru)[name] || label;
  }

  function leadFormHTML(type, options = {}, compact = true) {
    const title = type === 'realEstate' ? t('forms.realEstate') : type === 'car' ? t('forms.car') : type === 'b2b' ? 'Request an Offer' : t('forms.consultation');
    const context = options.context || '';
    const fields = {
      consultation: [
        ['name', t('forms.name'), 'text', true], ['phone', t('forms.phone'), 'tel', true], ['email', t('forms.email'), 'email', false], ['country', t('forms.country'), 'text', false], ['topic', t('forms.topic'), 'text', false], ['preferredDate', t('forms.preferredDate'), 'date', false], ['preferredTime', t('forms.preferredTime'), 'time', false], ['message', t('forms.message'), 'textarea', false]
      ],
      realEstate: [
        ['name', t('forms.name'), 'text', true], ['phone', t('forms.phone'), 'tel', true], ['object', t('forms.object'), 'text', false, context], ['buyRent', t('forms.buyRent'), 'text', false], ['budget', t('forms.budget'), 'text', false], ['preferredDate', t('forms.preferredDate'), 'date', false], ['preferredTime', t('forms.preferredTime'), 'time', false], ['message', t('forms.message'), 'textarea', false]
      ],
      car: [
        ['name', t('forms.name'), 'text', true], ['phone', t('forms.phone'), 'tel', true], ['dates', t('forms.dates'), 'text', false], ['preferredDate', t('forms.preferredDate'), 'date', false], ['preferredTime', t('forms.preferredTime'), 'time', false], ['carType', t('forms.carType'), 'text', false, context], ['message', t('forms.message'), 'textarea', false]
      ],
      b2b: [
        ['name', t('forms.name'), 'text', true], ['phone', t('forms.phone'), 'tel', true], ['email', t('forms.email'), 'email', false], ['country', t('forms.country'), 'text', false], ['topic', t('forms.topic'), 'text', false, context], ['preferredDate', t('forms.preferredDate'), 'date', false], ['preferredTime', t('forms.preferredTime'), 'time', false], ['message', t('forms.message'), 'textarea', false]
      ]
    }[type] || [];
    return `
      <form class="lead-form lead-form--premium lead-form--${esc(type)}" data-lead-form="${esc(type)}">
        <div class="lead-form__head">
          <span>${esc(type === 'b2b' ? 'Commercial request' : 'Private request')}</span>
          ${compact ? `<div class="lead-form__title-row"><h3>${esc(title)}</h3>${formExperienceBadgeHTML(type)}</div>` : ''}
          <p>${formatFormLeadText(type)}</p>
        </div>
        <div class="dfg-hp-field" aria-hidden="true"><label>Company<input name="company" type="text" tabindex="-1" autocomplete="off"></label></div>
        <div class="form-grid">
          ${fields.map(([name, label, inputType, required, value]) => fieldHTML(name, label, inputType, required, value || '')).join('')}
        </div>
        ${formTrustHTML(type)}
        <button class="btn btn--primary btn--wide" type="submit"><span>${esc(t('forms.send'))}</span><i aria-hidden="true">→</i></button>
        <p class="form-note">🔒 ${esc(text(data.legalPages?.find((item) => item.id === 'disclaimer')?.text || ''))}</p>
        <div class="lead-form__success" aria-live="polite">${esc(t('forms.success'))}</div>
      </form>
    `;
  }

  function fieldHTML(name, label, inputType, required, value) {
    const requiredAttr = required ? 'required' : '';
    const full = inputType === 'textarea' ? ' field--full' : '';
    const requiredMark = required ? ' <em>*</em>' : '';
    const icon = fieldIcon(name);
    const placeholder = placeholderFor(name, label);
    if (inputType === 'textarea') {
      return `<label class="field field--premium${full}"><span>${esc(label)}${requiredMark}</span><div class="field__control field__control--textarea"><i>${icon}</i><textarea name="${esc(name)}" placeholder="${esc(placeholder)}" ${requiredAttr}>${esc(value)}</textarea></div></label>`;
    }
    const extraAttr = inputType === 'date' ? ` min="${new Date().toISOString().slice(0,10)}"` : '';
    return `<label class="field field--premium${full}"><span>${esc(label)}${requiredMark}</span><div class="field__control"><i>${icon}</i><input name="${esc(name)}" type="${esc(inputType)}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${requiredAttr}${extraAttr}></div></label>`;
  }

  function collectLead(form, type) {
    const rawValues = Object.fromEntries(new FormData(form).entries());
    const values = normalizeLeadValues(rawValues);
    return {
      id: `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      type: normalizeLeadValue(type, 80),
      lang,
      status: 'new',
      deliveryStatus: 'local_saved',
      data: values,
      page: location.href.split('#')[0]
    };
  }

  function saveLead(lead) {
    try {
      const leads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
      leads.unshift(lead);
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads.slice(0, 500)));
    } catch (error) {
      console.warn('Lead local save failed', error);
    }
  }

  async function dispatchLead(lead) {
    if (window.DFG_BACKEND && window.DFG_BACKEND.isConfigured && window.DFG_BACKEND.isConfigured()) {
      try {
        await window.DFG_BACKEND.saveLead(lead);
        markLeadDelivered(lead.id, 'server_saved');
        flushPendingLeads();
        return { ok: true, queued: false };
      } catch (error) {
        console.warn('Lead backend save failed', error);
        return { ok: false, queued: true };
      }
    }
    const integrations = data.settings?.integrations || {};
    const endpoint = String(integrations.leadWebhookUrl || '').trim();
    if (!integrations.leadWebhookEnabled || !endpoint) return { ok: true, queued: false };
    const payload = {
      source: 'DIANAFARM GROUP website',
      siteVersion: data.version || 'v285-production-real',
      lead
    };
    try {
      const body = JSON.stringify(payload);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
      if (!response.ok) throw new Error('Webhook rejected lead: ' + response.status);
      markLeadDelivered(lead.id, 'webhook_sent');
      return { ok: true, queued: false };
    } catch (error) {
      console.warn('Lead webhook dispatch failed', error);
      return { ok: false, queued: true };
    }
  }

  function queueLeadForRetry(lead) {
    try {
      const queue = JSON.parse(localStorage.getItem(PENDING_LEADS_KEY) || '[]').filter((item) => item && item.id !== lead.id);
      queue.unshift(Object.assign({}, lead, { deliveryStatus: 'queued_retry', queuedAt: new Date().toISOString() }));
      localStorage.setItem(PENDING_LEADS_KEY, JSON.stringify(queue.slice(0, 100)));
    } catch (error) {
      console.warn('Lead retry queue failed', error);
    }
  }

  async function flushPendingLeads() {
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured || !window.DFG_BACKEND.isConfigured()) return;
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem(PENDING_LEADS_KEY) || '[]');
    } catch (error) {
      queue = [];
    }
    if (!Array.isArray(queue) || !queue.length) return;
    const remaining = [];
    for (const lead of queue.slice(0, 20)) {
      try {
        await window.DFG_BACKEND.saveLead(lead);
        markLeadDelivered(lead.id, 'server_saved');
      } catch (error) {
        remaining.push(lead);
      }
    }
    try {
      localStorage.setItem(PENDING_LEADS_KEY, JSON.stringify(remaining.concat(queue.slice(20)).slice(0, 100)));
    } catch (error) {
      console.warn('Lead retry queue update failed', error);
    }
  }

  function markLeadDelivered(id, status) {
    try {
      const leads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
      const next = leads.map((lead) => lead && lead.id === id ? Object.assign({}, lead, { deliveryStatus: status }) : lead);
      localStorage.setItem(LEADS_KEY, JSON.stringify(next.slice(0, 500)));
    } catch (error) {
      console.warn('Lead delivery status update failed', error);
    }
  }

  function openFormModal(type, options = {}) {
    const modal = $('#formModal');
    const content = $('#modalFormContent');
    if (!modal || !content) return;
    content.innerHTML = `<div class="modal-body">${leadFormHTML(type, options)}</div>`;
    modal.showModal();
  }


  function serviceModalDetails(item) {
    const title = text(item.title);
    const full = text(item.fullText || item.excerpt);
    const bullets = list(item.bullets);
    const fallbackMap = {
      'residence-bg': ['анализ основания для ВНЖ / ПМЖ и семейного сценария', 'проверка документов и подготовка понятного списка действий', 'маршрут подачи, коммуникация и контроль сроков', 'сопровождение после подачи и ответы на практические вопросы'],
      'company-registration-eu': ['подбор структуры компании и подготовка учредительных документов', 'адрес, банковская подготовка и бухгалтерский маршрут', 'объяснение обязательств после регистрации', 'сопровождение запуска компании под ключ'],
      'banks-accounts': ['предварительный комплаенс и анкеты', 'структурирование источника средств и деловой логики', 'переписка с банком и сопровождение до активации', 'снижение риска отказа из-за неполного пакета'],
      'uae-dubai': ['подбор маршрута UAE / Dubai под бизнес-задачу', 'лицензия, резидентский сценарий и банковское сопровождение', 'коммерческие коммуникации между ЕС, ОАЭ и Азией', 'ориентация на запуск и результат, а не на общие консультации'],
      'uzbekistan-asia-service': ['поиск поставщиков и деловых контактов', 'переговоры, документы и перевод коммерческой логики', 'импорт / экспорт и локальная бизнес-коммуникация', 'сопровождение сделки до понятного результата'],
      'supplements-registration': ['первичная проверка состава и маркировки', 'регуляторный маршрут для ЕС, Болгарии, ОАЭ и Азии', 'подготовка досье и коммуникация с профильными сторонами', 'вывод продукта на рынок без лишних ошибок'],
      'cosmetics-registration': ['CPNP / PIF и safety assessment маршрут', 'INCI, маркировка, private label и проверка упаковки', 'подготовка документов для международного рынка', 'практический запуск косметического продукта'],
      'pharma-consulting': ['GMP / GDP и регуляторные вопросы', 'поиск партнёров и подготовка коммуникации', 'документы, коммерческие предложения и сопровождение', 'стратегический консалтинг для фармпроектов'],
      'nostrification': ['проверка диплома и цели признания', 'переводы, легализация и подготовка комплекта', 'коммуникация с институциями и контроль сроков', 'сопровождение до результата'],
      'real-estate-service': ['подбор недвижимости по цели и бюджету', 'проверка объекта, документов и сценария покупки', 'переговоры, бронь, сделка и последующее сопровождение', 'ориентация на ликвидность и понятные риски'],
      'international-trade-service': ['структурирование запроса LOI / ICPO / offer', 'поиск производителя, покупателя или партнёра', 'коммерческая переписка и документы', 'логистика, сроки и контроль сделки'],
      'turnkey-consulting': ['разбор задачи и выбор маршрута', 'один координатор вместо разрозненных контактов', 'документы, коммуникация, партнёры и контроль сроков', 'комплексное сопровождение до результата']
    };
    const checks = (bullets.length ? bullets : (fallbackMap[item.id] || [])).slice(0, 6);
    const extra = ['Персональный маршрут без шаблонных решений', 'Конфиденциальность данных и деловой коммуникации', 'Понятные этапы, сроки и зона ответственности'];
    return `
      <div class="service-modal-copy rich-modal-text">
        <p>${esc(full)}</p>
        <p>Перед началом работы мы уточняем конечную цель, страну, сроки, бюджет и ограничения, чтобы не предлагать общие шаблонные советы. После этого собираем рабочий маршрут: какие документы готовим, какие шаги делаем первыми, где возможны риски и какой результат должен быть на каждом этапе.</p>
        <p>Для клиента это означает не просто консультацию, а понятную практическую схему действий с контролем сроков, конфиденциальностью коммуникации и фокусом на конечный результат. Мы объясняем, что входит в помощь сейчас, какие действия потребуются позже и как связаны между собой юридическая, банковская, коммерческая и организационная части задачи.</p>
      </div>
      <div class="service-modal-checks">
        <h3>Что входит в помощь</h3>
        <div class="service-modal-checks__grid">
          ${checks.concat(extra).slice(0, 7).map((item) => `<span><i aria-hidden="true">✓</i>${esc(item)}</span>`).join('')}
        </div>
      </div>
      <div class="rich-modal-grid">
        <article><h4>Формат</h4><p>Подробный разбор задачи, документов, бюджета, сроков и приоритетов без лишнего информационного шума.</p></article>
        <article><h4>Маршрут</h4><p>Пошаговая последовательность действий: что готовим, куда подаём, с кем коммуницируем и какой следующий шаг после каждого этапа.</p></article>
        <article><h4>Контроль</h4><p>Отдельно отмечаем риски, сроки, зоны ответственности и практические детали, чтобы клиент понимал не только «что делать», но и «почему именно так».</p></article>
        <article><h4>Результат</h4><p>${esc(title)} оформляется как рабочий маршрут с понятным результатом, а не как короткая справка без сопровождения.</p></article>
      </div>
    `;
  }

  function richModalParagraphs(paragraphs) {
    return `<div class="rich-modal-text">${paragraphs.filter(Boolean).map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</div>`;
  }

  function richModalInfoGrid(items) {
    return `<div class="rich-modal-grid">${items.filter((item) => item && item.title && item.text).map((item) => `<article><h4>${esc(item.title)}</h4><p>${esc(item.text)}</p></article>`).join('')}</div>`;
  }

  function openServiceModal(id) {
    const item = (data.services || []).find((service) => service.id === id);
    if (!item) return;
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(item.image || 'assets/img/service-consulting.svg')}" alt="${esc(text(item.title))}"></div>
        <div class="modal-body">
          <p class="eyebrow">${esc(categoryLabel(item.category))}</p>
          <h2>${esc(text(item.title))}</h2>
          ${serviceModalDetails(item)}
          <div class="modal-actions service-modal-actions">
            <button class="btn btn--primary" data-open-form="consultation" data-context="${esc(text(item.title))}">${esc(t('buttons.consult'))}</button>
            ${whatsappRotatorButton(text(item.title), inferWhatsAppKey(item), 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function openObjectModal(type, id) {
    const collections = { realEstate: data.realEstate, parking: data.parkings, car: data.cars };
    const item = (collections[type] || []).find((entry) => entry.id === id);
    if (!item) return;
    if (type === 'realEstate') return openPropertyModal(item);
    if (type === 'parking') return openParkingModal(item);
    if (type === 'car') return openCarModal(item);
  }

  function openPropertyModal(item) {
    const title = text(item.title);
    const narrative = [
      text(item.fullDescription || item.shortDescription),
      `Мы подробно разбираем формат объекта, его локацию, сценарий покупки и все практические детали: вид сделки, состояние, ликвидность, расходы после покупки и реальную полезность объекта для жизни, отдыха или инвестиций.`,
      `Перед показом уточняем цель клиента, желаемый бюджет, сроки, состав семьи и инвестиционный горизонт. На этой основе готовим shortlist без случайных объектов и сопровождаем путь от первого интереса до безопасной сделки и следующих шагов после покупки.`
    ];
    const perks = list(item.advantages);
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(mainImage(item))}" alt="${esc(title)}"></div>
        <div class="modal-body">
          <p class="eyebrow">Real Estate · ${esc(dealLabel(item.dealType))}</p>
          <h2>${esc(title)}</h2>
          ${richModalParagraphs(narrative)}
          <div class="modal-details">
            ${detail(t('labels.price'), item.price)}
            ${detail(t('labels.category'), propCategoryLabel(item.category))}
            ${detail(t('labels.city'), item.city)}
            ${detail(t('labels.complex'), item.complex)}
            ${detail(t('labels.area'), item.areaM2)}
            ${detail(t('labels.floor'), item.floor)}
            ${detail(t('labels.rooms'), item.rooms)}
            ${detail(t('labels.status'), statusLabel(item.status))}
            ${detail(t('labels.location'), item.location)}
          </div>
          ${richModalInfoGrid([
            { title: 'Что анализируем', text: 'Юридическую чистоту, состояние объекта, сценарий владения, возможную доходность, расходы на содержание и общий инвестиционный профиль.' },
            { title: 'Как подбираем', text: 'Фильтруем объекты по задаче: для жизни, отдыха, аренды или капитального размещения, чтобы не перегружать клиента лишними вариантами.' },
            { title: 'Что получает клиент', text: 'Понятный shortlist, аргументы по каждому варианту, сопровождение переговоров, бронь, сделку и помощь после покупки.' },
            { title: 'Почему это важно', text: 'Даже красивый объект может не подходить по документам, расходам или сценарию использования — мы проверяем это заранее.' }
          ])}
          ${perks.length ? `<div class="service-modal-checks"><h3>Преимущества объекта</h3><div class="service-modal-checks__grid">${perks.map((bullet) => `<span><i aria-hidden="true">✓</i>${esc(bullet)}</span>`).join('')}</div></div>` : ''}
          <div class="modal-actions modal-actions--single">
            <button class="btn btn--primary" data-open-form="realEstate" data-context="${esc(title)}">${esc(t('buttons.objectRequest'))}</button>
            ${whatsappRotatorButton(title, inferWhatsAppKey(item), 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function openParkingModal(item) {
    const title = text(item.title);
    const typeLabel = dealLabel(item.type);
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(mainImage(item))}" alt="${esc(title)}"></div>
        <div class="modal-body">
          <p class="eyebrow">Parking · ${esc(typeLabel)}</p>
          <h2>${esc(title)}</h2>
          ${richModalParagraphs([
            text(item.description),
            'Мы не ограничиваемся коротким описанием места: уточняем локацию, тип доступа, формат аренды или покупки, сценарий использования и практические нюансы — от въезда и шлагбаума до юридических деталей по объекту.',
            'Клиент получает не просто адрес, а понятное решение: подходит ли это место под личное использование, инвестиционный сценарий, аренду или обслуживание объекта рядом.'
          ])}
          <div class="modal-details">
            ${detail(t('labels.price'), item.price)}
            ${detail(t('labels.placeNumber'), item.placeNumber)}
            ${detail(t('labels.location'), item.location)}
            ${detail(t('labels.barrier'), item.barrier ? t('misc.yes') : t('misc.no'))}
            ${detail(t('labels.access24'), item.access24 ? t('misc.yes') : t('misc.no'))}
            ${detail(t('labels.status'), statusLabel(item.status))}
          </div>
          ${richModalInfoGrid([
            { title: 'До запроса', text: 'Фиксируем цель, район, формат паркоместа, сроки, бюджет и ограничения по доступу.' },
            { title: 'Что проверяем', text: 'Локацию, удобство въезда, фактическую доступность, формат владения или аренды и связанный объект.' },
            { title: 'Что входит', text: 'Подбор вариантов, навигация по документам, помощь с заявкой и сопровождение переговоров.' },
            { title: 'Итог', text: 'Понятный маршрут без случайных мест и без потери времени на неподходящие варианты.' }
          ])}
          <div class="modal-actions modal-actions--single">
            <button class="btn btn--primary" data-open-form="realEstate" data-context="${esc(title)}">${esc(t('buttons.objectRequest'))}</button>
            ${whatsappRotatorButton(title, inferWhatsAppKey(item), 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function openCarModal(item) {
    const title = `${item.brand} ${item.model}`;
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(mainImage(item))}" alt="${esc(title)}"></div>
        <div class="modal-body">
          <p class="eyebrow">Cars for Rent</p>
          <h2>${esc(title)}</h2>
          ${richModalParagraphs([
            text(item.conditions),
            'Мы подробно объясняем формат аренды, доступность автомобиля, условия депозита, сроки, лимиты и практические детали, чтобы запрос был понятным ещё до бронирования.',
            'При необходимости подбираем альтернативы под стиль поездки: деловые встречи, длительное пребывание, комфортный отдых или представительские задачи.'
          ])}
          <div class="modal-details">
            ${detail(t('labels.year'), item.year)}
            ${detail(t('labels.rentalType'), text(item.rentalType))}
            ${detail(t('labels.day'), item.priceDay)}
            ${detail(t('labels.week'), item.priceWeek)}
            ${detail(t('labels.month'), item.priceMonth)}
            ${detail(t('labels.deposit'), item.deposit)}
            ${detail(t('labels.transmission'), text(item.transmission))}
            ${detail(t('labels.fuel'), text(item.fuel))}
            ${detail(t('labels.seats'), item.seats)}
            ${detail(t('labels.status'), statusLabel(item.status))}
          </div>
          ${richModalInfoGrid([
            { title: 'Для кого подходит', text: 'Для командировок, частного отдыха, длительного проживания или деловых встреч с нужным уровнем комфорта.' },
            { title: 'Что уточняем', text: 'Даты, район, формат поездки, необходимость подачи автомобиля и ограничения по бюджету.' },
            { title: 'Что получаете', text: 'Понятные условия аренды, прозрачный расчёт и альтернативы, если нужен другой класс автомобиля.' },
            { title: 'Премиальный подход', text: 'Никаких случайных вариантов — только автомобили, которые реально соответствуют сценарию клиента.' }
          ])}
          <div class="modal-actions modal-actions--single">
            <button class="btn btn--primary" data-open-form="car" data-context="${esc(title)}">${esc(t('buttons.carRequest'))}</button>
            ${whatsappRotatorButton(title, inferWhatsAppKey(item), 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function openB2BModal(id) {
    const item = (data.b2bOffers || []).find((offer) => offer.id === id);
    if (!item) return;
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(mainImage(item))}" alt="${esc(text(item.title))}"></div>
        <div class="modal-body">
          <p class="eyebrow">B2B Offers · ${esc(categoryLabel(item.category))}</p>
          <h2>${esc(text(item.title))}</h2>
          <p>${esc(text(item.description))}</p>
          <div class="modal-details">
            ${detail(t('labels.geography'), item.geography)}
            ${detail(t('labels.certificates'), (item.certificates || []).length ? `${item.certificates.length} PDF` : '—')}
          </div>
          <ul>${(item.products || []).map((product) => `<li>${esc(product)}</li>`).join('')}</ul>
          ${certificateLinks(item.certificates)}
          <div class="modal-actions">
            <button class="btn btn--primary" data-open-form="b2b" data-context="${esc(text(item.title))}">${esc(t('buttons.offer'))}</button>
            ${whatsappRotatorButton(text(item.title), 'dubai', 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function openPromoModal(id) {
    const item = (data.promotions || []).find((promo) => promo.id === id);
    if (!item) return;
    openDetail(`
      <div class="modal-content">
        <div class="modal-media"><img src="${esc(mainImage(item))}" alt="${esc(text(item.title))}"></div>
        <div class="modal-body">
          <p class="eyebrow">Offers · ${esc(categoryLabel(item.category))}</p>
          <h2>${esc(text(item.title))}</h2>
          <p>${esc(text(item.description || item.excerpt))}</p>
          <div class="modal-actions">
            <button class="btn btn--primary" data-open-form="consultation" data-context="${esc(text(item.title))}">${esc(text(item.cta) || t('buttons.consult'))}</button>
            ${whatsappRotatorButton(text(item.title), inferWhatsAppKey(item), 'modal-actions__wa')}
          </div>
        </div>
      </div>
    `);
  }

  function renderArticleContent(item) {
    const rich = text(item.contentHtml);
    if (rich) return sanitizeHtml(rich);
    const body = text(item.content || item.excerpt);
    return body
      .split(/\n\n+/)
      .map((paragraph) => `<p>${esc(paragraph.trim())}</p>`)
      .join('');
  }

  function openBlogModal(id) {
    const item = (data.blogArticles || []).find((article) => article.id === id);
    if (!item) return;
    openDetail(`
      <div class="modal-body modal-body--article">
        ${item.image ? `<div class="blog-card__image"><img src="${esc(item.image)}" alt="${esc(text(item.title))}"></div>` : ''}
        <p class="eyebrow">${esc(formatDate(item.date))} · ${esc(categoryLabel(item.category))}</p>
        <h2>${esc(text(item.title))}</h2>
        <div class="article-content">${renderArticleContent(item)}</div>
        ${item.videoUrl ? `<p><a class="text-link" href="${esc(item.videoUrl)}" target="_blank" rel="noopener">Видео / media link</a></p>` : ''}
        <div class="modal-actions">
          <button class="btn btn--primary" data-open-form="consultation" data-context="${esc(text(item.title))}">${esc(t('buttons.consult'))}</button>
          ${whatsappRotatorButton(text(item.title), inferWhatsAppKey(item), 'modal-actions__wa')}
        </div>
      </div>
    `);
  }

  function openDetail(html) {
    const modal = $('#detailModal');
    const content = $('#modalContent');
    if (!modal || !content) return;

    const commit = () => {
      content.classList.remove('is-detail-ready');
      content.classList.add('is-detail-animating');
      content.innerHTML = html;
      wireWhatsAppLinks();
      enhanceWhatsAppRotators();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          content.classList.remove('is-detail-animating');
          content.classList.add('is-detail-ready');
        });
      });
    };

    if (modal.open) {
      commit();
      return;
    }

    modal.classList.add('is-detail-open');
    commit();
    modal.showModal();
  }

  function detail(label, value) {
    if (!value && value !== 0) return '';
    return `<div class="detail-chip"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;
  }

  function certificateLinks(certificates = []) {
    if (!certificates.length) return '';
    return `<div class="file-preview">${certificates.map((file) => `<a href="${esc(file.url || file.dataUrl || '#')}" target="_blank" rel="noopener">${esc(file.name || 'Certificate PDF')}</a>`).join('')}</div>`;
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function updateActiveNav() {
    const page = document.body.dataset.page;
    if (page) {
      const map = { 'home': 'home', 'services': 'services', 'real-estate': 'services', 'cars': 'services', 'parking': 'services', 'uae': 'services', 'asia': 'services', 'b2b': 'b2b', 'blog': 'blog', 'about': 'about', 'contacts': 'contacts', 'reviews': 'reviews' };
      const active = page && page.startsWith('service-') ? 'services' : (map[page] || page);
      $$('.main-nav a').forEach((link) => link.classList.toggle('active', link.dataset.nav === active));
      return;
    }
    const sections = $$('.page-section[id]').filter((section) => !section.classList.contains('hidden'));
    const current = sections.reduce((active, section) => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.34 ? section.id : active;
    }, 'home');
    $$('.main-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  }


  function closeServicesDropdowns() {
    $$('[data-services-dropdown].is-open').forEach((dropdown) => {
      dropdown.classList.remove('is-open');
      dropdown.querySelector('[data-services-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  }

  function handleServiceHash() {
    if (document.body.dataset.page !== 'services') return;
    const hash = window.location.hash || '';
    if (!hash.startsWith('#service-')) return;
    const serviceId = hash.replace('#service-', '');
    if (!serviceId) return;
    if (serviceCategory !== 'all') {
      serviceCategory = 'all';
      renderServices();
      refreshRevealItems();
    }
    window.setTimeout(() => {
      const target = document.getElementById(`service-${serviceId}`);
      if (!target) return;
      target.scrollIntoView({ behavior: isMobileStableMode() ? 'auto' : 'smooth', block: 'center' });
      target.classList.add('service-card--selected');
      window.setTimeout(() => target.classList.remove('service-card--selected'), 2800);
    }, 140);
  }

  function showCookieBanner() {
    const banner = $('#cookieBanner');
    const button = $('#acceptCookies');
    if (!banner || !button) return;
    if (!localStorage.getItem('dfg_cookies_ok')) banner.classList.add('is-visible');
    button.addEventListener('click', () => {
      localStorage.setItem('dfg_cookies_ok', '1');
      banner.classList.remove('is-visible');
    });
  }


  function loadOptionalGsap() {
    if (!shouldUseHeavyEffects()) return;
    if (window.gsap || window.__dfgGsapRequested) return;
    window.__dfgGsapRequested = true;
    const gsapScript = document.createElement('script');
    gsapScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    gsapScript.async = true;
    gsapScript.onload = () => {
      const triggerScript = document.createElement('script');
      triggerScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';
      triggerScript.async = true;
      triggerScript.onload = () => initAnimations();
      document.head.appendChild(triggerScript);
    };
    document.head.appendChild(gsapScript);
  }

  function initAnimations() {
    const loader = $('#pageLoader');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hideLoader = () => loader?.classList.add('is-hidden');
    setTimeout(hideLoader, reduce ? 0 : 160);

    if (!reduce && window.gsap) {
      if (window.__dfgGsapAnimated) return;
      window.__dfgGsapAnimated = true;
      const gsap = window.gsap;
      if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
      gsap.from('.hero__copy > *', { opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.35 });
      gsap.from('.hero__trust-panel > *', { opacity: 0, x: 28, duration: 0.85, stagger: 0.12, ease: 'power3.out', delay: 0.5 });
      if (window.ScrollTrigger) {
        gsap.to('[data-parallax]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        $$('.reveal').forEach((node) => {
          gsap.to(node, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 84%' } });
        });
        $$('.reveal-group').forEach((group) => {
          gsap.to(Array.from(group.children), { opacity: 1, y: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 84%' } });
        });
      } else {
        revealWithObserver();
      }
    } else {
      revealWithObserver();
    }
    if (shouldUseHeavyEffects()) {
      initTiltCards();
      initPremiumPointerGlow();
      initLuxurySectionGlow();
      initMagneticButtons();
    }
  }

  function revealWithObserver() {
    const nodes = $$('.reveal, .reveal-group > *');
    if (isMobileStableMode()) {
      nodes.forEach((node) => node.classList.add('in-view'));
      return;
    }
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 6% 0px' });
    nodes.forEach((node) => observer.observe(node));
  }

  function refreshRevealItems() {
    if (shouldUseHeavyEffects() && window.ScrollTrigger && window.gsap) {
      window.ScrollTrigger.refresh();
      return;
    }
    revealWithObserver();
  }


  function finalV156Cleanup() {
    // About page: remove the standalone Russian letter "О" from the big hero title, even if i18n/cache rewrites it.
    if (document.body.dataset.page === 'about') {
      const title = document.querySelector('.v9-page-hero__copy h1');
      if (title) {
        const normalized = title.textContent.replace(/\s+/g, ' ').trim();
        if (/^О\s+DIANAFARM\s+GROUP$/i.test(normalized) || /DIANAFARM\s+GROUP/i.test(normalized)) {
          title.classList.add('about-title-fit');
          title.setAttribute('data-hard-about-title', 'true');
          title.innerHTML = 'DIANAFARM<br>GROUP';
        }
      }
    }
    // Listing cards: WhatsApp must not appear there. It stays only in detail modals and contacts.
    document.querySelectorAll('.service-card .btn--whatsapp, .service-card [data-whatsapp], .service-card [data-whatsapp-rotator], .blog-card .btn--whatsapp, .blog-card [data-whatsapp], .blog-card [data-whatsapp-rotator], .b2b-card .btn--whatsapp, .b2b-card [data-whatsapp], .b2b-card [data-whatsapp-rotator], .promo-card .btn--whatsapp, .promo-card [data-whatsapp], .promo-card [data-whatsapp-rotator]').forEach((el) => el.remove());
  }

  function initPremiumPointerGlow() {
    const hero = document.querySelector('.hero--landing');
    if (!hero || hero.dataset.glowReady === 'true') return;
    hero.dataset.glowReady = 'true';
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + '%';
      const y = ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + '%';
      hero.style.setProperty('--hero-glow-x', x);
      hero.style.setProperty('--hero-glow-y', y);
    }, { passive: true });
  }

  function initLuxurySectionGlow() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = $$('.section--v8-realestate, .section--v8-parking, .section--v8-cars, .section--v8-b2b, .section--v8-blog, .section--v8-about, .section--v8-contacts, .section--v8-services');
    sections.forEach((section) => {
      if (section.dataset.luxuryGlowReady === 'true') return;
      section.dataset.luxuryGlowReady = 'true';
      section.addEventListener('pointermove', (event) => {
        const rect = section.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + '%';
        const y = ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + '%';
        section.style.setProperty('--section-glow-x', x);
        section.style.setProperty('--section-glow-y', y);
      }, { passive: true });
    });
  }

  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.btn--primary, .header-contact, .btn--dark-mini').forEach((btn) => {
      if (btn.dataset.magneticReady === 'true') return;
      btn.dataset.magneticReady = 'true';
      btn.addEventListener('pointermove', (event) => {
        const rect = btn.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  function initTiltCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('[data-tilt-card]').forEach((card) => {
      if (card.dataset.tiltReady === 'true') return;
      card.dataset.tiltReady = 'true';
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
        card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
  finalV156Cleanup();
  window.addEventListener('load', finalV156Cleanup);
})();
(function(){
  function v165MobileLock(){
    var mobile = window.matchMedia && window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    if(!mobile) return;
    document.documentElement.setAttribute('data-v165-mobile-lock','true');
    document.documentElement.classList.add('dfg-mobile-stable');
    if(document.body){
      document.body.classList.add('dfg-mobile-stable');
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
    }
    var loader = document.getElementById('pageLoader');
    if(loader){
      loader.classList.add('is-hidden');
      loader.style.display = 'none';
      loader.style.pointerEvents = 'none';
    }
    document.querySelectorAll('.reveal, .reveal-group > *').forEach(function(node){
      node.classList.add('in-view');
      node.style.opacity = '1';
      node.style.visibility = 'visible';
      node.style.transform = 'none';
    });
    document.querySelectorAll('[data-parallax], [data-tilt-card]').forEach(function(node){
      node.style.transform = 'none';
    });
  }
  v165MobileLock();
  document.addEventListener('DOMContentLoaded', v165MobileLock, {passive:true});
  window.addEventListener('load', v165MobileLock, {passive:true});
  window.addEventListener('pageshow', v165MobileLock, {passive:true});
  window.addEventListener('resize', function(){ window.setTimeout(v165MobileLock, 80); }, {passive:true});
  window.addEventListener('orientationchange', function(){ window.setTimeout(v165MobileLock, 160); }, {passive:true});
})();

/* v166 mobile fluidity lock: keep page alive on phones without touching WhatsApp logic */
(function(){
  function isPhone(){
    return window.matchMedia && window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  }
  function applyMobileFluidityLock(){
    if(!isPhone()) return;
    var html = document.documentElement;
    var body = document.body;
    html.setAttribute('data-v166-mobile-fluidity','true');
    html.classList.add('dfg-mobile-stable');
    if(body){
      body.classList.add('dfg-mobile-stable');
      body.style.overflowY = 'auto';
      body.style.overflowX = 'hidden';
      body.style.touchAction = 'pan-y';
      body.style.webkitOverflowScrolling = 'touch';
    }
    var loader = document.getElementById('pageLoader');
    if(loader){
      loader.classList.add('is-hidden');
      loader.style.display = 'none';
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      loader.style.pointerEvents = 'none';
    }
    document.querySelectorAll('.reveal, .reveal-group > *').forEach(function(node){
      node.classList.add('in-view');
      node.style.opacity = '1';
      node.style.visibility = 'visible';
      node.style.transform = 'none';
    });
    document.querySelectorAll('[data-parallax], [data-tilt-card]').forEach(function(node){
      node.removeAttribute('data-parallax');
      node.removeAttribute('data-tilt-card');
      node.style.transform = 'none';
    });
    // Prevent accidental horizontal layout overflow from old desktop locks.
    var vw = Math.max(html.clientWidth || 0, window.innerWidth || 0);
    document.querySelectorAll('main, section, .container, .v9-page-hero__grid, .v103-hero-proof, .v161-market-proof, .service-card, .object-card, .blog-card, .b2b-card, .v10-process article, .v103-process article').forEach(function(node){
      node.style.maxWidth = '100%';
      node.style.minWidth = '0';
      if(node.scrollWidth > vw + 8){
        node.style.overflowX = 'hidden';
      }
    });
  }
  var scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    window.setTimeout(function(){ scheduled = false; applyMobileFluidityLock(); }, 60);
  }
  applyMobileFluidityLock();
  document.addEventListener('DOMContentLoaded', applyMobileFluidityLock, {passive:true});
  window.addEventListener('load', applyMobileFluidityLock, {passive:true});
  window.addEventListener('pageshow', applyMobileFluidityLock, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', function(){ window.setTimeout(applyMobileFluidityLock, 180); }, {passive:true});
})();

/* v169 reviews carousel: supports full reviews page and compact contact hero */
(function(){
  function initOneReviewsSlider(slider){
    if(!slider || slider.dataset.reviewsReady === 'true') return;
    var cards = Array.prototype.slice.call(slider.querySelectorAll('.review-card'));
    if(cards.length < 2) return;
    slider.dataset.reviewsReady = 'true';
    var index = Math.max(0, cards.findIndex(function(card){ return card.classList.contains('is-active'); }));
    if(index < 0) index = 0;
    cards.forEach(function(card, i){ card.classList.toggle('is-active', i === index); });
    var paused = false;
    function show(next){
      cards[index].classList.remove('is-active');
      index = ((next % cards.length) + cards.length) % cards.length;
      cards[index].classList.add('is-active');
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    var interval = Number(slider.dataset.reviewsInterval || 2000);
    var timer = window.setInterval(function(){ if(!paused) show(index + 1); }, interval);
    slider.addEventListener('mouseenter', function(){ paused = true; });
    slider.addEventListener('mouseleave', function(){ paused = false; });
    slider.addEventListener('focusin', function(){ paused = true; });
    slider.addEventListener('focusout', function(){ paused = false; });
    window.addEventListener('pagehide', function(){ window.clearInterval(timer); }, {once:true});
  }
  function initReviewsSlider(){
    Array.prototype.slice.call(document.querySelectorAll('[data-reviews-slider]')).forEach(initOneReviewsSlider);
  }
  window.DFG_INIT_REVIEWS_SLIDER = initReviewsSlider;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReviewsSlider);
  else initReviewsSlider();
  window.addEventListener('pageshow', initReviewsSlider, {passive:true});
})();


/* v217 page transitions + light UI polish */
(function(){
  function markReady(){
    document.body && document.body.classList.add('page-is-ready');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markReady, {once:true});
  else markReady();
  window.addEventListener('load', markReady, {once:true, passive:true});
  window.addEventListener('pageshow', markReady, {passive:true});

  document.addEventListener('click', function(event){
    var link = event.target.closest('a[href]');
    if(!link) return;
    var href = link.getAttribute('href') || '';
    if(!href || href.charAt(0) === '#' || link.target === '_blank' || link.hasAttribute('download')) return;
    if(/^(mailto:|tel:|javascript:)/i.test(href)) return;
    var url;
    try { url = new URL(link.href, window.location.href); } catch(err) { return; }
    if(url.origin !== window.location.origin) return;
    if(url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    if(window.matchMedia && window.matchMedia('(pointer: coarse), (max-width: 900px)').matches) return;
    event.preventDefault();
    document.body.classList.add('page-is-leaving');
    var loader = document.getElementById('pageLoader');
    if(loader){
      loader.classList.remove('is-hidden');
      loader.style.display = 'grid';
      loader.style.opacity = '1';
      loader.style.visibility = 'visible';
      loader.style.pointerEvents = 'auto';
    }
    window.setTimeout(function(){ window.location.href = url.href; }, 220);
  }, true);
})();


/* v219PremiumUX: lightweight micro-interactions, no canvas/no heavy timers */
(function v219PremiumUX(){
  const raf = (fn) => window.requestAnimationFrame ? requestAnimationFrame(fn) : setTimeout(fn, 16);
  function init(){
    document.documentElement.classList.add('v219-premium-ux');
    document.querySelectorAll('.object-card, .service-card, .blog-card, .b2b-card, .location-card, .advantage-card, .review-card').forEach((el, i)=>{
      el.style.setProperty('--v219-i', String(i % 6));
      el.classList.add('v219-motion-ready');
    });
    document.querySelectorAll('.object-meta span').forEach((span)=>{
      const txt = (span.textContent || '').trim();
      if(/святой|влас|равда|бургас|созопол|несеб|помор|болгар|dubai|uae|sofia|varna|sveti|vlas|ravda|burgas|bulgaria/i.test(txt)) span.classList.add('object-meta__location');
    });
    document.querySelectorAll('button, .btn').forEach((btn)=>{
      if(!btn.dataset.v219Bound){
        btn.dataset.v219Bound = '1';
        btn.addEventListener('pointerdown', ()=>{
          btn.classList.add('is-clicked');
          setTimeout(()=>btn.classList.remove('is-clicked'), 180);
        }, {passive:true});
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>raf(init)); else raf(init);
  window.addEventListener('pageshow', ()=>raf(init), {passive:true});
})();


