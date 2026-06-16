
/* ===== bundled from v289-public-editor-bridge.js ===== */
/* v289 public bridge: production server is the source of truth. Local universal-edit keys never override server payload. */
(function () {
  'use strict';

  var CACHE_KEY = 'dfg_universal_edits_server_cache_v289';
  var allowedStyle = new Set(['display','color','background','background-color','background-image','background-size','background-position','border-color','border-radius','box-shadow','opacity','font-size','font-weight','text-align','padding','padding-top','padding-right','padding-bottom','padding-left','margin','margin-top','margin-right','margin-bottom','margin-left','min-height','max-width','width','height']);
  var payload = { version: 'empty', updatedAt: '', content: {}, design: {} };
  var remoteSignature = '';
  var applying = false;
  var observer = null;

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) { return null; }
  }

  function writeCache(value) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch (error) {}
  }

  function currentFile() {
    var last = (location.pathname.split('/').pop() || 'index.html').trim();
    return last || 'index.html';
  }

  function pageId(filename) {
    return String(filename || 'index.html').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function selectorFromKey(key) {
    var prefix = pageId(currentFile()) + '::';
    if (!String(key).startsWith(prefix)) return '';
    return String(key).slice(prefix.length);
  }

  function safeUrl(value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if (/^javascript:/i.test(url)) return '';
    if (/^data:/i.test(url)) return '';
    if (/^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/|assets\/|uploads\/)/i.test(url)) return url;
    return '';
  }

  function safeStyleValue(property, value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (/expression\s*\(/i.test(raw)) return '';
    if (/url\s*\(\s*['"]?\s*javascript:/i.test(raw)) return '';
    if (/url\s*\(\s*['"]?\s*data:/i.test(raw)) return '';
    if (property === 'background-image') {
      var match = raw.match(/url\(["']?([^"')]+)["']?\)/i);
      if (match && !safeUrl(match[1])) return '';
    }
    return raw.slice(0, 500);
  }

  function applyDesign() {
    var design = payload.design && typeof payload.design === 'object' ? payload.design : {};
    Object.keys(design).forEach(function (key) {
      var value = design[key];
      if (/^--[a-zA-Z0-9_-]+$/.test(key) && value !== undefined && value !== null && value !== '') {
        document.documentElement.style.setProperty(key, String(value).slice(0, 400));
      }
    });
  }

  function applyPatch(el, patch) {
    if (!el || !patch || typeof patch !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(patch, 'text') && !/^(IMG|SOURCE|VIDEO|INPUT|TEXTAREA|SELECT)$/i.test(el.tagName)) {
      el.textContent = String(patch.text || '').slice(0, 12000);
    }
    if (patch.href && el.matches && el.matches('a[href], area[href]')) {
      var href = safeUrl(patch.href);
      if (href) el.setAttribute('href', href);
    }
    if (patch.src) {
      var src = safeUrl(patch.src);
      if (src && el.matches && el.matches('img')) el.setAttribute('src', src);
      if (src && el.matches && el.matches('source')) el.setAttribute('srcset', src);
      if (src && el.matches && el.matches('video')) el.setAttribute('poster', src);
    }
    if (patch.alt && el.matches && el.matches('img')) el.setAttribute('alt', String(patch.alt).slice(0, 180));
    if (patch.style && typeof patch.style === 'object') {
      Object.keys(patch.style).forEach(function (property) {
        if (!allowedStyle.has(property)) return;
        var safe = safeStyleValue(property, patch.style[property]);
        if (safe) el.style.setProperty(property, safe);
      });
    }
    el.setAttribute('data-v289-editor-applied', 'true');
  }

  function applyContent() {
    var content = payload.content && typeof payload.content === 'object' ? payload.content : {};
    Object.keys(content).forEach(function (key) {
      var selector = selectorFromKey(key);
      if (!selector) return;
      try { applyPatch(document.querySelector(selector), content[key]); } catch (error) {}
    });
  }

  function applyAll() {
    if (applying) return;
    applying = true;
    window.requestAnimationFrame(function () {
      applying = false;
      applyDesign();
      applyContent();
    });
  }

  async function loadRemoteEdits() {
    try {
      if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured || !window.DFG_BACKEND.isConfigured() || !window.DFG_BACKEND.loadUniversalEdits) return;
      var next = await window.DFG_BACKEND.loadUniversalEdits();
      if (!next || typeof next !== 'object') return;
      var normalized = {
        version: String(next.version || 'server'),
        updatedAt: String(next.updatedAt || ''),
        content: next.content && typeof next.content === 'object' ? next.content : {},
        design: next.design && typeof next.design === 'object' ? next.design : {}
      };
      var signature = JSON.stringify(normalized);
      if (signature !== remoteSignature) {
        remoteSignature = signature;
        payload = normalized;
        writeCache(payload);
        applyAll();
      }
    } catch (error) {
      var cached = readCache();
      if (cached && typeof cached === 'object' && cached.updatedAt && !remoteSignature) {
        payload = cached;
        remoteSignature = JSON.stringify(cached);
        applyAll();
      }
      console.warn('Universal edits server sync failed', error);
    }
  }

  function removeVisualDebris() {
    document.querySelectorAll('.service-meteor-layer,.premium-stack__route,.v263-route,.route-line,.hero-signature__scene,.hero-signature__canvas,.hero-signature__beamstage,#dgTradeGlobeV193Root,[id^="dgTradeGlobe"],.cookie-banner,#cookieBanner,#pageLoader').forEach(function (node) {
      if (node && node.parentNode) node.remove();
    });
  }

  function boot() {
    removeVisualDebris();
    loadRemoteEdits();
    window.setInterval(loadRemoteEdits, 12000);
    if (observer) observer.disconnect();
    var timer = 0;
    observer = new MutationObserver(function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { removeVisualDebris(); applyAll(); }, 80);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('pageshow', function () { removeVisualDebris(); loadRemoteEdits(); }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());


/* ===== bundled from v289-mobile-touch-guard.js ===== */
(function(){
  'use strict';
  var blockerSelector = [
    '#pageLoader','.loader#pageLoader','.service-meteor-layer','.premium-stack__route','.v263-route','.route-line',
    '.hero-signature__beamstage','.hero-signature__gold-beam','.hero-signature__route','[id^="dgTradeGlobe"]','#dgTradeGlobeV193Root',
    '.dg-trade-v193-css-orb','.dg-trade-v193-shadow','.cursor-glow','.premium-cursor','.beam','.meteor','.gold-beam','.gold-line'
  ].join(',');
  var interactiveSelector = ['a[href]','button','.btn','[role="button"]','input','textarea','select','label','.chip','.service-chip','.category-chip','[data-filter-toggle]','[data-filter-option]','[data-services-toggle]','[data-open-service]'].join(',');
  function touchLayout(){ return window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 1180px)').matches); }
  function set(node, styles){ if(!node || !node.style) return; Object.keys(styles).forEach(function(k){ node.style[k] = styles[k]; }); }
  function unlockScroll(){
    var html=document.documentElement, body=document.body; if(!body) return;
    html.dataset.v289TouchScroll='unlocked'; body.classList.add('dfg-v289-scroll-unlocked');
    [html,body].forEach(function(node){ set(node,{overflowX:'clip',overflowY:'auto',height:'auto',minHeight:'100%',maxWidth:'100%',webkitOverflowScrolling:'touch',scrollBehavior:'auto',touchAction:'pan-y pinch-zoom'}); });
    if(touchLayout()){ body.style.position='static'; html.style.position=''; }
  }
  function removeBlockers(){
    document.querySelectorAll(blockerSelector).forEach(function(node){ if(!node || !node.style) return; set(node,{pointerEvents:'none',display:'none',visibility:'hidden',opacity:'0',animation:'none',transition:'none'}); if(node.parentNode) node.remove(); });
    document.querySelectorAll('.toast.show,.cookie-banner,#cookieBanner').forEach(function(node){ if(!(node.textContent||'').trim() || !node.classList.contains('is-visible')) set(node,{pointerEvents:'none'}); });
  }
  function normalizeTargets(){
    if(!touchLayout()) return;
    document.querySelectorAll('main,section,.section,.container,.section-inner,.hero-inner,.cards-grid,.services-grid,.object-grid,.blog-grid,.reviews-list-grid,.service-card,.object-card,.blog-card,.review-card,.b2b-card,.promo-card,'+interactiveSelector).forEach(function(node){ set(node,{touchAction:'pan-y pinch-zoom',maxWidth:'100%',minWidth:'0'}); });
    document.querySelectorAll('input,textarea,select').forEach(function(node){ set(node,{touchAction:'manipulation',fontSize:'16px'}); });
    document.querySelectorAll('[data-parallax],[data-tilt-card]').forEach(function(node){ node.removeAttribute('data-parallax'); node.removeAttribute('data-tilt-card'); set(node,{transform:'none',willChange:'auto'}); });
  }
  function neutralizeInvisibleFixed(){
    if(!touchLayout()) return;
    var w=innerWidth||document.documentElement.clientWidth, h=innerHeight||document.documentElement.clientHeight; if(!w||!h) return;
    [[w/2,h/2],[w/2,h-95],[w*.22,h/2],[w*.78,h/2]].forEach(function(p){
      var el=document.elementFromPoint(p[0],p[1]); if(!el || !el.style) return;
      var s=getComputedStyle(el), r=el.getBoundingClientRect();
      var safe=el.closest('.site-header,.main-nav,.modal.is-open,dialog[open],body.menu-open .main-nav');
      if(!safe && (s.position==='fixed'||s.position==='sticky') && r.width>=w*.85 && r.height>=h*.35) el.style.pointerEvents='none';
      if(!safe && (s.visibility==='hidden'||s.opacity==='0')) el.style.pointerEvents='none';
    });
  }
  function harden(){ unlockScroll(); removeBlockers(); normalizeTargets(); setTimeout(neutralizeInvisibleFixed,40); }
  function boot(){ harden(); [120,450,1200,2400].forEach(function(ms){ setTimeout(harden,ms); }); window.addEventListener('pageshow',harden,{passive:true}); window.addEventListener('resize',function(){setTimeout(harden,80);},{passive:true}); window.addEventListener('orientationchange',function(){setTimeout(harden,160);},{passive:true}); document.addEventListener('click',function(){setTimeout(harden,30);},true); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
}());


/* ===== bundled from v290-safe-premium-motion.js ===== */
(function(){
  'use strict';
  var PAGE_LABELS = {
    services: ['Комплексные услуги','Бизнес, документы, сопровождение','Единый маршрут','Сроки, этапы, контроль','Международный контур','Болгария · ЕС · UAE · Азия'],
    about: ['DIANAFARM GROUP','Private business coordination','Экосистема решений','Люди · документы · сделки','Международная работа','Болгария · UAE · Asia'],
    'real-estate': ['Недвижимость','Подбор и сделка под ключ','Проверка объекта','Документы, локация, риски','Сопровождение','От первого запроса до сделки'],
    cars: ['Автомобили','Подбор, аренда, сопровождение','Премиум маршрут','Трансферы и бизнес-поездки','Контроль деталей','Сроки, класс, комфорт'],
    parking: ['Паркинги','Подбор и оформление мест','Локация и доступ','Документы, расходы, сценарий','Безопасное решение','Покупка или аренда'],
    uae: ['UAE / Dubai','Бизнес и резидентские маршруты','Банки и счета','Комплаенс, анкеты, сопровождение','Коммерческий контур','Компания · лицензия · документы'],
    asia: ['Азия / Узбекистан','Маршруты для бизнеса и жизни','Документы','Переводы, подача, коммуникация','Партнёрство','Локальные процессы под контролем'],
    b2b: ['B2B Trade','Поставки и международные направления','Партнёры','Продукция, логистика, документы','Контроль сделки','Коммерческий маршрут'],
    blog: ['Практические статьи','Материалы для бизнеса и жизни','Аналитика','Болгария · ЕС · UAE · Азия','Чек-листы','Документы, процессы, ошибки'],
    contacts: ['Связаться с нами','Персональный маршрут консультации','Быстрый контакт','Телефон, WhatsApp, email','Подбор решения','Опишите задачу — мы вернёмся с шагами']
  };
  function pageKey(){ return document.body && document.body.dataset ? (document.body.dataset.page || '') : ''; }
  function createVisual(labels){
    var wrap = document.createElement('aside');
    wrap.className = 'dfg-v290-hero-visual reveal';
    wrap.setAttribute('aria-label','Премиальная визуальная сцена');
    var icons = ['◆','◈','◎'];
    for(var i=0;i<3;i+=1){
      var card = document.createElement('article');
      card.className = 'dfg-v290-visual-card';
      card.innerHTML = '<i class="dfg-v290-visual-icon" aria-hidden="true">'+icons[i]+'</i><div><strong></strong><span></span></div>';
      card.querySelector('strong').textContent = labels[i*2] || 'DIANAFARM GROUP';
      card.querySelector('span').textContent = labels[i*2+1] || 'Международное сопровождение';
      wrap.appendChild(card);
    }
    return wrap;
  }
  function ensureHeroVisuals(){
    var key = pageKey();
    if(key === 'home' || key === 'reviews' || key.indexOf('service-') === 0) return;
    var labels = PAGE_LABELS[key] || PAGE_LABELS.services;
    document.querySelectorAll('.v9-page-hero__grid').forEach(function(grid){
      if(grid.querySelector('.dfg-v290-hero-visual')) return;
      if(grid.children.length >= 2 && !grid.querySelector('.v9-page-hero__copy + .dfg-v290-hero-visual')) return;
      grid.appendChild(createVisual(labels));
    });
  }
  function ensureReviewVisible(){
    document.querySelectorAll('[data-reviews-slider]').forEach(function(slider){
      var active = slider.querySelector('.review-card.is-active');
      var first = slider.querySelector('.review-card');
      if(!active && first) first.classList.add('is-active');
    });
  }
  function enhanceHomeMotion(){
    var panel = document.querySelector('.hero__trust-panel');
    if(panel) panel.classList.add('dfg-v290-motion-panel');
  }
  function boot(){
    document.documentElement.dataset.v290SafeMotion = 'ready';
    ensureHeroVisuals();
    ensureReviewVisible();
    enhanceHomeMotion();
    setTimeout(ensureReviewVisible,160);
    setTimeout(ensureReviewVisible,700);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
}());


/* ===== bundled from v291-details-final.js ===== */
(function(){
  'use strict';
  var pages={
    'residence-bg':'service-residence-bulgaria.html',
    'company-registration-eu':'service-company-registration.html',
    'banks-accounts':'service-banks-accounts.html',
    'uae-dubai':'uae.html',
    'uzbekistan-asia-service':'asia.html',
    'supplements-registration':'service-supplements-registration.html',
    'cosmetics-registration':'service-cosmetics-registration.html',
    'pharma-consulting':'service-pharma-consulting.html',
    'nostrification':'service-nostrification.html',
    'real-estate-service':'real-estate.html',
    'cars-rent-service':'cars.html',
    'parking-service':'parking.html',
    'international-trade':'service-international-trade.html',
    'international-trade-service':'service-international-trade.html',
    'turnkey-consulting':'service-turnkey-consulting.html'
  };
  function hrefFor(id){ return pages[id] || 'services.html'; }
  function normalize(root){
    (root||document).querySelectorAll('button[data-open-service],button.service-card__details-btn').forEach(function(button){
      var id=button.getAttribute('data-open-service') || button.closest('[data-id]')?.getAttribute('data-id') || '';
      var link=document.createElement('a');
      link.className=(button.className||'btn btn--small service-card__details-btn');
      if(!link.classList.contains('service-card__details-btn')) link.classList.add('service-card__details-btn');
      link.href=hrefFor(id);
      link.setAttribute('data-service-link',id);
      link.innerHTML=button.innerHTML || button.textContent || 'Подробнее';
      button.replaceWith(link);
    });
    (root||document).querySelectorAll('.service-card[data-card-link]').forEach(function(card){
      var id=card.getAttribute('data-id')||'';
      var href=card.getAttribute('data-card-link') || hrefFor(id);
      card.querySelectorAll('a.service-card__details-btn,[data-service-link]').forEach(function(a){
        if(!a.getAttribute('href') || a.getAttribute('href')==='#') a.setAttribute('href',hrefFor(a.getAttribute('data-service-link')||id));
        a.style.pointerEvents='auto';
      });
    });
  }
  function boot(){
    normalize(document);
    var grid=document.getElementById('servicesGrid');
    if(grid && 'MutationObserver' in window){ new MutationObserver(function(){ normalize(grid); }).observe(grid,{childList:true,subtree:true}); }
    document.addEventListener('click',function(event){
      var target=event.target.closest && event.target.closest('a.service-card__details-btn,[data-service-link]');
      if(!target) return;
      var href=target.getAttribute('href') || hrefFor(target.getAttribute('data-service-link')||'');
      if(!href || href==='#') return;
      event.preventDefault();
      event.stopPropagation();
      if(event.stopImmediatePropagation) event.stopImmediatePropagation();
      window.location.assign(href);
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
}());


/* ===== bundled from v293-mobile-parity.js ===== */
(function(){
  'use strict';
  var CATEGORY_LABELS = {
    'categories.cars': 'Автомобили',
    'categories.parking': 'Паркинги',
    'categories.realEstate': 'Недвижимость',
    'categories.business': 'Бизнес и банки',
    'categories.consulting': 'Консалтинг',
    'categories.international': 'Международные направления',
    'categories.trade': 'B2B торговля',
    'categories.product': 'Продукция',
    'categories.fertilizer': 'Удобрения',
    'categories.cosmetics': 'Косметика',
    'categories.raw': 'Сырьё'
  };
  function normalizeTextNode(node){
    if(!node || node.nodeType !== 3) return;
    var value = node.nodeValue;
    var next = value;
    Object.keys(CATEGORY_LABELS).forEach(function(key){
      if(next.indexOf(key) !== -1) next = next.split(key).join(CATEGORY_LABELS[key]);
    });
    if(next !== value) node.nodeValue = next;
  }
  function walk(root){
    if(!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while((node = walker.nextNode())) normalizeTextNode(node);
  }
  function fixLinks(){
    document.querySelectorAll('[data-href]').forEach(function(el){
      var href = el.getAttribute('data-href');
      if(href && !el.getAttribute('href') && el.tagName === 'A') el.setAttribute('href', href);
    });
    document.querySelectorAll('.service-card__details-btn, [data-details-href]').forEach(function(el){
      var href = el.getAttribute('href') || el.getAttribute('data-details-href') || el.dataset.href;
      if(!href) return;
      el.setAttribute('href', href);
      el.addEventListener('click', function(event){
        if(el.tagName === 'A') return;
        event.preventDefault();
        window.location.href = href;
      }, {capture:true});
    });
  }
  function apply(){
    walk(document.body);
    fixLinks();
  }
  document.addEventListener('DOMContentLoaded', function(){
    apply();
    setTimeout(apply, 200);
    setTimeout(apply, 800);
  });
  window.addEventListener('load', apply);
  new MutationObserver(function(){ apply(); }).observe(document.documentElement, {subtree:true, childList:true, characterData:true});
})();


/* ===== bundled from v294-visual-grid-final.js ===== */

(function(){
  'use strict';
  var PAGE_LABELS = {
    home:['DIANAFARM GROUP','Международные решения','Документы','Маршрут без хаоса','Бизнес и жизнь','Болгария · UAE · Азия'],
    services:['Комплексные услуги','Бизнес, документы, сопровождение','Единый маршрут','Сроки, этапы, контроль','Международный контур','Болгария · ЕС · UAE · Азия'],
    about:['DIANAFARM GROUP','Private business coordination','Экосистема решений','Люди · документы · сделки','Международная работа','Болгария · UAE · Asia'],
    'real-estate':['Недвижимость','Подбор и сделка под ключ','Проверка объекта','Документы, локация, риски','Сопровождение','От первого запроса до сделки'],
    cars:['Автомобили','Подбор, аренда, сопровождение','Премиум маршрут','Трансферы и бизнес-поездки','Контроль деталей','Сроки, класс, комфорт'],
    parking:['Паркинги','Подбор и оформление мест','Локация и доступ','Документы, расходы, сценарий','Безопасное решение','Покупка или аренда'],
    uae:['UAE / Dubai','Бизнес и резидентские маршруты','Банки и счета','Комплаенс, анкеты, сопровождение','Коммерческий контур','Компания · лицензия · документы'],
    asia:['Азия / Узбекистан','Маршруты для бизнеса и жизни','Документы','Переводы, подача, коммуникация','Партнёрство','Локальные процессы под контролем'],
    b2b:['B2B Trade','Поставки и международные направления','Партнёры','Продукция, логистика, документы','Контроль сделки','Коммерческий маршрут'],
    blog:['Практические статьи','Материалы для бизнеса и жизни','Аналитика','Болгария · ЕС · UAE · Азия','Чек-листы','Документы, процессы, ошибки'],
    contacts:['Связаться с нами','Персональный маршрут консультации','Быстрый контакт','Телефон, WhatsApp, email','Подбор решения','Опишите задачу — мы вернёмся с шагами']
  };
  function pageKey(){return document.body&&document.body.dataset ? (document.body.dataset.page||'home') : 'home';}
  function makeScene(labels){
    var wrap=document.createElement('aside');
    wrap.className='dfg-v294-visual-scene reveal';
    wrap.setAttribute('aria-label','Премиальная визуальная сцена DIANAFARM GROUP');
    var icons=['◆','◈','◎'];
    for(var i=0;i<3;i+=1){
      var card=document.createElement('article');
      card.className='dfg-v294-visual-card';
      var icon=document.createElement('i');
      icon.className='dfg-v294-visual-icon';
      icon.setAttribute('aria-hidden','true');
      icon.textContent=icons[i];
      var text=document.createElement('div');
      var strong=document.createElement('strong');
      var span=document.createElement('span');
      strong.textContent=labels[i*2]||'DIANAFARM GROUP';
      span.textContent=labels[i*2+1]||'Международное сопровождение';
      text.appendChild(strong);text.appendChild(span);
      card.appendChild(icon);card.appendChild(text);wrap.appendChild(card);
    }
    return wrap;
  }
  function ensureHeroVisuals(){
    var key=pageKey();
    var labels=PAGE_LABELS[key]||PAGE_LABELS.services;
    document.querySelectorAll('.v9-page-hero__grid').forEach(function(grid){
      if(grid.querySelector('.dfg-v294-visual-scene,.dfg-v290-hero-visual,.v9-page-hero__visual,.about-hero-image,.contact-hero-reviews')) return;
      grid.appendChild(makeScene(labels));
    });
  }
  function normalizeHomeCards(){
    var grid=document.querySelector('body[data-page="home"] #servicesGrid.cards-grid--home');
    if(!grid) return;
    grid.querySelectorAll('.service-card').forEach(function(card){
      card.removeAttribute('data-tilt-card');
      var btn=card.querySelector('.service-card__details-btn');
      if(btn&&btn.getAttribute('href')) btn.setAttribute('role','link');
    });
  }
  function ensureReviews(){
    document.querySelectorAll('[data-reviews-slider]').forEach(function(slider){
      var cards=Array.prototype.slice.call(slider.querySelectorAll('.review-card'));
      if(!cards.length) return;
      if(!slider.querySelector('.review-card.is-active')) cards[0].classList.add('is-active');
      if(slider.dataset.v294ReviewCycle==='ready') return;
      slider.dataset.v294ReviewCycle='ready';
      var index=Math.max(0,cards.findIndex(function(card){return card.classList.contains('is-active');}));
      window.setInterval(function(){
        cards.forEach(function(card){card.classList.remove('is-active');});
        index=(index+1)%cards.length;
        cards[index].classList.add('is-active');
      }, Number(slider.getAttribute('data-reviews-interval')||3200));
    });
  }
  function boot(){
    document.documentElement.dataset.v294VisualGrid='ready';
    ensureHeroVisuals();
    normalizeHomeCards();
    ensureReviews();
    window.setTimeout(function(){ensureHeroVisuals();normalizeHomeCards();ensureReviews();},220);
    window.setTimeout(function(){ensureHeroVisuals();normalizeHomeCards();ensureReviews();},900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',boot,{once:true});
})();


/* ===== bundled from v295-i18n-links-final.js ===== */
(function(){
  'use strict';

  var VERSION='v295-i18n-links-final';
  var LANGS=['ru','bg','ka','en'];
  var DETAILS={ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'};
  var ALL_SERVICES={ru:'Все услуги',bg:'Всички услуги',ka:'ყველა სერვისი',en:'All services'};

  function getLang(){
    var v='ru';
    try{v=localStorage.getItem('dfg_lang')||document.documentElement.lang||'ru';}catch(e){v=document.documentElement.lang||'ru';}
    v=String(v||'ru').slice(0,2).toLowerCase();
    return LANGS.indexOf(v)>=0?v:'ru';
  }
  function normalize(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function setText(el,value){if(el&&value!=null&&String(el.textContent).trim()!==String(value))el.textContent=value;}
  function attr(el,name,value){if(el&&value!=null&&el.getAttribute(name)!==String(value))el.setAttribute(name,value);}
  function langText(item){
    var lang=getLang();
    if(!item) return '';
    if(typeof item==='string') return item;
    return item[lang]||item.ru||item.en||item.bg||item.ka||'';
  }

  var map={
    'главная':{ru:'Главная',bg:'Начало',ka:'მთავარი',en:'Home'},
    'услуги':{ru:'Услуги',bg:'Услуги',ka:'სერვისები',en:'Services'},
    'все услуги':{ru:'Все услуги',bg:'Всички услуги',ka:'ყველა სერვისი',en:'All services'},
    'смотреть все услуги':{ru:'Смотреть все услуги',bg:'Вижте всички услуги',ka:'ყველა სერვისის ნახვა',en:'View all services'},
    'о компании':{ru:'О компании',bg:'За нас',ka:'კომპანიის შესახებ',en:'About'},
    'блог':{ru:'Блог',bg:'Блог',ka:'ბლოგი',en:'Blog'},
    'отзывы':{ru:'Отзывы',bg:'Отзиви',ka:'შეფასებები',en:'Reviews'},
    'контакты':{ru:'Контакты',bg:'Контакти',ka:'კონტაქტები',en:'Contacts'},
    'разделы':{ru:'Разделы',bg:'Раздели',ka:'განყოფილებები',en:'Sections'},
    'сделано компанией':{ru:'Сделано компанией',bg:'Изработено от',ka:'შექმნილია კომპანიის მიერ',en:'Made by'},
    'внж / пмж':{ru:'ВНЖ / ПМЖ',bg:'ВНЖ / ПМЖ',ka:'ბინადრობა / მუდმივი',en:'Residence / PR'},
    'внж / пмж болгария':{ru:'ВНЖ / ПМЖ Болгария',bg:'ВНЖ / ПМЖ България',ka:'ბულგარეთის ბინადრობა',en:'Bulgaria residence'},
    'регистрация компаний':{ru:'Регистрация компаний',bg:'Регистрация на фирми',ka:'კომპანიების რეგისტრაცია',en:'Company registration'},
    'банки':{ru:'Банки',bg:'Банки',ka:'ბანკები',en:'Banks'},
    'банки и счета':{ru:'Банки и счета',bg:'Банки и сметки',ka:'ბანკები და ანგარიშები',en:'Banks and accounts'},
    'узбекистан / азия':{ru:'Узбекистан / Азия',bg:'Узбекистан / Азия',ka:'უზბეკეთი / აზია',en:'Uzbekistan / Asia'},
    'азия':{ru:'Азия',bg:'Азия',ka:'აზია',en:'Asia'},
    'недвижимость':{ru:'Недвижимость',bg:'Имоти',ka:'უძრავი ქონება',en:'Real estate'},
    'фармацевтика':{ru:'Фармацевтика',bg:'Фармацевтика',ka:'ფარმაცევტიკა',en:'Pharmaceuticals'},
    'регистрация бадов':{ru:'Регистрация БАДов',bg:'Регистрация на добавки',ka:'დანამატების რეგისტრაცია',en:'Supplements registration'},
    'регистрация косметики':{ru:'Регистрация косметики',bg:'Регистрация на козметика',ka:'კოსმეტიკის რეგისტრაცია',en:'Cosmetics registration'},
    'фармацевтический консалтинг':{ru:'Фармацевтический консалтинг',bg:'Фарма консултинг',ka:'ფარმაცევტული კონსალტინგი',en:'Pharma consulting'},
    'нострификация дипломов':{ru:'Нострификация дипломов',bg:'Нострификация на дипломи',ka:'დიპლომების აღიარება',en:'Diploma recognition'},
    'международная торговля':{ru:'Международная торговля',bg:'Международна търговия',ka:'საერთაშორისო ვაჭრობა',en:'International trade'},
    'торговля':{ru:'Торговля',bg:'Търговия',ka:'ვაჭრობა',en:'Trade'},
    'автомобили':{ru:'Автомобили',bg:'Автомобили',ka:'ავტომობილები',en:'Cars'},
    'паркинги':{ru:'Паркинги',bg:'Паркинги',ka:'პარკინგები',en:'Parking'},
    'фильтр':{ru:'Фильтр',bg:'Филтър',ka:'ფილტრი',en:'Filter'},
    'эффективность':{ru:'Эффективность',bg:'Ефективност',ka:'ეფექტიანობა',en:'Efficiency'},
    'рост':{ru:'Рост',bg:'Растеж',ka:'ზრდა',en:'Growth'},
    'аналитика':{ru:'Аналитика',bg:'Аналитика',ka:'ანალიტიკა',en:'Analytics'},
    'конфиденциальность':{ru:'Конфиденциальность',bg:'Конфиденциалност',ka:'კონფიდენციალურობა',en:'Confidentiality'},
    'международное сопровождение':{ru:'Международное сопровождение',bg:'Международно съпровождане',ka:'საერთაშორისო მხარდაჭერა',en:'International support'},
    'инвестиции':{ru:'Инвестиции',bg:'Инвестиции',ka:'ინვესტიციები',en:'Investments'},
    'результат':{ru:'Результат',bg:'Резултат',ka:'შედეგი',en:'Result'},
    'точность':{ru:'Точность',bg:'Точност',ka:'სიზუსტე',en:'Accuracy'},
    'стратегия':{ru:'Стратегия',bg:'Стратегия',ka:'სტრატეგია',en:'Strategy'},
    'защищённость':{ru:'Защищённость',bg:'Защита',ka:'დაცულობა',en:'Protection'},
    'получить консультацию':{ru:'Получить консультацию',bg:'Получете консултация',ka:'კონსულტაციის მიღება',en:'Get consultation'},
    'консультация':{ru:'Консультация',bg:'Консултация',ka:'კონსულტაცია',en:'Consultation'},
    'наши услуги':{ru:'Наши услуги',bg:'Нашите услуги',ka:'ჩვენი სერვისები',en:'Our services'},
    'оставить заявку':{ru:'Оставить заявку',bg:'Изпрати запитване',ka:'განაცხადის გაგზავნა',en:'Submit request'},
    'запросить маршрут':{ru:'Запросить маршрут',bg:'Заявете маршрут',ka:'მარშრუტის მოთხოვნა',en:'Request a route'},
    'подобрать недвижимость':{ru:'Подобрать недвижимость',bg:'Подбор на имот',ka:'უძრავი ქონების შერჩევა',en:'Select property'},
    'смотреть объекты':{ru:'Смотреть объекты',bg:'Вижте обекти',ka:'ობიექტების ნახვა',en:'View properties'},
    'международная торговля':{ru:'Международная торговля',bg:'Международна търговия',ka:'საერთაშორისო ვაჭრობა',en:'International trade'},
    'надежность и конфиденциальность':{ru:'Надёжность и конфиденциальность',bg:'Надеждност и конфиденциалност',ka:'საიმედოობა და კონფიდენციალურობა',en:'Reliability and confidentiality'},
    'надёжность и конфиденциальность':{ru:'Надёжность и конфиденциальность',bg:'Надеждност и конфиденциалност',ka:'საიმედოობა და კონფიდენციალურობა',en:'Reliability and confidentiality'},
    'гарантируем безопасность данных и полную конфиденциальность.':{ru:'Гарантируем безопасность данных и полную конфиденциальность.',bg:'Гарантираме сигурност на данните и пълна конфиденциалност.',ka:'ვუზრუნველყოფთ მონაცემების უსაფრთხოებას და სრულ კონფიდენციალურობას.',en:'We guarantee data security and full confidentiality.'},
    'международный опыт':{ru:'Международный опыт',bg:'Международен опит',ka:'საერთაშორისო გამოცდილება',en:'International experience'},
    'болгария, ес, оаэ, узбекистан и азия.':{ru:'Болгария, ЕС, ОАЭ, Узбекистан и Азия.',bg:'България, ЕС, ОАЕ, Узбекистан и Азия.',ka:'ბულგარეთი, ევროკავშირი, UAE, უზბეკეთი და აზია.',en:'Bulgaria, EU, UAE, Uzbekistan and Asia.'},
    'комплексный подход':{ru:'Комплексный подход',bg:'Комплексен подход',ka:'კომპლექსური მიდგომა',en:'Comprehensive approach'},
    'решаем задачи любой сложности под ключ.':{ru:'Решаем задачи любой сложности под ключ.',bg:'Решаваме задачи с всякаква сложност до ключ.',ka:'ვჭრით ნებისმიერი სირთულის ამოცანას სრული მხარდაჭერით.',en:'We solve complex tasks turnkey.'},
    'премиальные объекты':{ru:'Премиальные объекты',bg:'Премиум обекти',ka:'პრემიუმ ობიექტები',en:'Premium properties'},
    'виллы, апартаменты и резиденции рядом с морем.':{ru:'Виллы, апартаменты и резиденции рядом с морем.',bg:'Вили, апартаменти и резиденции до морето.',ka:'ვილები, აპარტამენტები და რეზიდენციები ზღვის პირას.',en:'Villas, apartments and residences by the sea.'},
    'проверка сделки':{ru:'Проверка сделки',bg:'Проверка на сделка',ka:'გარიგების შემოწმება',en:'Deal check'},
    'документы, ликвидность, расходы и безопасный маршрут.':{ru:'Документы, ликвидность, расходы и безопасный маршрут.',bg:'Документи, ликвидност, разходи и сигурен маршрут.',ka:'დოკუმენტები, ლიკვიდობა, ხარჯები და უსაფრთხო მარშრუტი.',en:'Documents, liquidity, costs and a safe route.'},
    'инвестиционный сценарий':{ru:'Инвестиционный сценарий',bg:'Инвестиционен сценарий',ka:'საინვესტიციო სცენარი',en:'Investment scenario'},
    'покупка для жизни, аренды или сохранения капитала.':{ru:'Покупка для жизни, аренды или сохранения капитала.',bg:'Покупка за живот, наем или съхранение на капитал.',ka:'შეძენა საცხოვრებლად, გაქირავებისთვის ან კაპიტალის შესანარჩუნებლად.',en:'Purchase for living, rental or capital preservation.'},
    'компания и лицензия':{ru:'Компания и лицензия',bg:'Компания и лиценз',ka:'კომპანია და ლიცენზია',en:'Company and license'},
    'банковский профиль':{ru:'Банковский профиль',bg:'Банков профил',ka:'საბანკო პროფილი',en:'Banking profile'},
    'запуск бизнеса':{ru:'Запуск бизнеса',bg:'Стартиране на бизнес',ka:'ბიზნესის გაშვება',en:'Business launch'},
    'поставщики и партнёры':{ru:'Поставщики и партнёры',bg:'Доставчици и партньори',ka:'მომწოდებლები და პარტნიორები',en:'Suppliers and partners'},
    'документы и логистика':{ru:'Документы и логистика',bg:'Документи и логистика',ka:'დოკუმენტები და ლოგისტიკა',en:'Documents and logistics'},
    'контроль результата':{ru:'Контроль результата',bg:'Контрол на резултата',ka:'შედეგის კონტროლი',en:'Result control'},
    'маршрут запуска в оаэ':{ru:'Маршрут запуска в ОАЭ',bg:'Маршрут за стартиране в ОАЕ',ka:'UAE-ში გაშვების მარშრუტი',en:'UAE launch route'},
    'бизнес-контакты с узбекистаном и азией':{ru:'Бизнес-контакты с Узбекистаном и Азией',bg:'Бизнес контакти с Узбекистан и Азия',ka:'ბიზნეს-კონტაქტები უზბეკეთსა და აზიაში',en:'Business contacts with Uzbekistan and Asia'},
    'недвижимость в болгарии у моря':{ru:'Недвижимость в Болгарии у моря',bg:'Имоти в България край морето',ka:'უძრავი ქონება ბულგარეთში ზღვის პირას',en:'Real estate in Bulgaria by the sea'},
    'premium cars, transfers and route-based rental.':{ru:'Премиальные автомобили, трансферы и аренда под маршрут.',bg:'Премиум автомобили, трансфери и наем според маршрута.',ka:'პრემიუმ ავტომობილები, ტრანსფერები და მარშრუტზე მორგებული ქირაობა.',en:'Premium cars, transfers and route-based rental.'},
    'parking spaces near the sea, in complexes and investment locations.':{ru:'Паркоместа у моря, в закрытых комплексах и инвестиционных локациях.',bg:'Паркоместа край морето, в комплекси и инвестиционни локации.',ka:'პარკინგები ზღვის პირას, კომპლექსებში და საინვესტიციო ლოკაციებში.',en:'Parking spaces near the sea, in complexes and investment locations.'},
    'car rental':{ru:'Авто в аренду',bg:'Автомобили под наем',ka:'ავტომობილის ქირაობა',en:'Car rental'},
    'parking':{ru:'Паркинги',bg:'Паркинги',ka:'პარკინგი',en:'Parking'},
    '01 июни 2026 г.':{ru:'01 июня 2026 г.',bg:'01 юни 2026 г.',ka:'01 ივნისი 2026',en:'01 June 2026'},
    '01 июня 2026 г.':{ru:'01 июня 2026 г.',bg:'01 юни 2026 г.',ka:'01 ივნისი 2026',en:'01 June 2026'},
    'повече':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'},
    'детально':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'},
    'подробнее':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'}
  };

  var hrefLabels={
    'services.html':{ru:'Все услуги',bg:'Всички услуги',ka:'ყველა სერვისი',en:'All services'},
    'service-residence-bulgaria.html':{ru:'ВНЖ / ПМЖ Болгария',bg:'ВНЖ / ПМЖ България',ka:'ბულგარეთის ბინადრობა',en:'Bulgaria residence'},
    'service-company-registration.html':{ru:'Регистрация компаний',bg:'Регистрация на фирми',ka:'კომპანიების რეგისტრაცია',en:'Company registration'},
    'service-banks-accounts.html':{ru:'Банки и счета',bg:'Банки и сметки',ka:'ბანკები და ანგარიშები',en:'Banks and accounts'},
    'uae.html':{ru:'UAE / Dubai',bg:'UAE / Dubai',ka:'UAE / Dubai',en:'UAE / Dubai'},
    'asia.html':{ru:'Узбекистан / Азия',bg:'Узбекистан / Азия',ka:'უზბეკეთი / აზია',en:'Uzbekistan / Asia'},
    'service-supplements-registration.html':{ru:'Регистрация БАДов',bg:'Регистрация на добавки',ka:'დანამატების რეგისტრაცია',en:'Supplements registration'},
    'service-cosmetics-registration.html':{ru:'Регистрация косметики',bg:'Регистрация на козметика',ka:'კოსმეტიკის რეგისტრაცია',en:'Cosmetics registration'},
    'service-pharma-consulting.html':{ru:'Фармацевтический консалтинг',bg:'Фарма консултинг',ka:'ფარმაცევტული კონსალტინგი',en:'Pharma consulting'},
    'service-nostrification.html':{ru:'Нострификация дипломов',bg:'Нострификация на дипломи',ka:'დიპლომების აღიარება',en:'Diploma recognition'},
    'real-estate.html':{ru:'Недвижимость',bg:'Имоти',ka:'უძრავი ქონება',en:'Real estate'},
    'cars.html':{ru:'Авто в аренду',bg:'Авто под наем',ka:'ავტომობილების ქირაობა',en:'Car rental'},
    'parking.html':{ru:'Паркинги',bg:'Паркинги',ka:'პარკინგები',en:'Parking'},
    'b2b.html':{ru:'B2B Offers',bg:'B2B оферти',ka:'B2B შეთავაზებები',en:'B2B Offers'},
    'reviews.html':{ru:'Отзывы',bg:'Отзиви',ka:'შეფასებები',en:'Reviews'},
    'about.html':{ru:'О компании',bg:'За нас',ka:'კომპანიის შესახებ',en:'About'},
    'blog.html':{ru:'Блог',bg:'Блог',ka:'ბლოგი',en:'Blog'},
    'contacts.html':{ru:'Контакты',bg:'Контакти',ka:'კონტაქტები',en:'Contacts'}
  };

  var blogLinks={
    'blog-residence-bg':'service-residence-bulgaria.html',
    'blog-company-bg':'service-company-registration.html',
    'blog-banks-bg':'service-banks-accounts.html',
    'blog-sea-real-estate':'real-estate.html',
    'blog-supplements-registration':'service-supplements-registration.html',
    'blog-uae-beauty':'uae.html',
    'blog-trade-routes':'service-international-trade.html'
  };

  function trValue(v){
    var lang=getLang();
    return v && (v[lang]||v.ru||v.en||v.bg||v.ka) || '';
  }
  function translateText(s){
    var lang=getLang();
    var key=normalize(s);
    var item=map[key];
    return item ? trValue(item) : null;
  }
  function translateElement(el){
    if(!el) return;
    var exact=translateText(el.textContent);
    if(exact) setText(el, exact);
  }
  function textNodes(root){
    if(!root) return [];
    var out=[];
    var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:function(node){
      if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      var parent=node.parentElement;
      if(!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if(parent.closest('.brand,.lang-switch,[data-no-v295-i18n]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var n;
    while((n=walker.nextNode())) out.push(n);
    return out;
  }

  function translateExactText(root){
    textNodes(root||document.body).forEach(function(node){
      var translated=translateText(node.nodeValue);
      if(translated) node.nodeValue=node.nodeValue.replace(node.nodeValue.trim(), translated);
    });
    Array.prototype.forEach.call((root||document).querySelectorAll('input[placeholder],textarea[placeholder],[aria-label],[title],[alt]'), function(el){
      ['placeholder','aria-label','title','alt'].forEach(function(name){
        var value=el.getAttribute(name);
        var translated=translateText(value);
        if(translated) el.setAttribute(name, translated);
      });
    });
  }

  function translateLinks(){
    var lang=getLang();
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function(a){
      var href=(a.getAttribute('href')||'').split('#')[0].split('?')[0];
      var label=hrefLabels[href];
      if(label && a.children.length===0) setText(a, trValue(label));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav="reviews"]'), function(a){setText(a, trValue(hrefLabels['reviews.html']));});
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n="nav.reviews"]'), function(a){setText(a, trValue(hrefLabels['reviews.html']));});
    Array.prototype.forEach.call(document.querySelectorAll('.service-card__details-btn,.blog-card .btn,[data-open-blog]'), function(btn){
      var text=normalize(btn.textContent);
      if(text==='подробнее'||text==='повече'||text==='დეტალურად'||text==='details'||text==='детально') setText(btn, DETAILS[lang]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.services-all-btn a,.hero__actions a[href="services.html"],a.btn[href="services.html"]'), function(a){
      var current=normalize(a.textContent);
      if(current==='все услуги'||current==='смотреть все услуги'||current==='наши услуги'||current==='ყველა სერვისი'||current==='all services'||current==='view all services'||current==='всички услуги'||current==='вижте всички услуги') {
        setText(a, a.classList.contains('btn--dark-mini') ? trValue(map['смотреть все услуги']) : ALL_SERVICES[lang]);
      }
    });
  }

  function fixCategoryLabels(){
    Array.prototype.forEach.call(document.querySelectorAll('.service-card__meta,.badge,.filter-pill,.premium-filter button,button,span,a,small'), function(el){
      var text=normalize(el.textContent);
      if(text==='categories.cars') setText(el, trValue(map['автомобили']));
      if(text==='categories.parking') setText(el, trValue(map['паркинги']));
      if(text==='categories.realestate'||text==='categories.real-estate') setText(el, trValue(map['недвижимость']));
      if(text==='categories.business') setText(el, trValue(map['банки']));
    });
  }

  function translateRails(){
    [
      '.wow-home-rail span',
      '.about-keyword-tape span',
      '.about-hero-showcase__route span',
      '.about-hero-showcase__footer b',
      '.about-hero-showcase__footer small',
      '.service-hero-tags span',
      '.v9-page-hero .hero__actions .btn',
      '.hero__actions .btn',
      '.premium-filter button',
      '.v9-mini-columns span',
      '.v10-process h3',
      '.v10-process p',
      '.v10-process strong',
      '.v8-process strong',
      '.v8-process p',
      '.hero-feature strong',
      '.hero-feature p',
      '.dfg-v294-visual-card strong',
      '.dfg-v294-visual-card span',
      '.footer-grid h3',
      '.site-footer a',
      '.blog-card time',
      '.service-card h3',
      '.service-card p',
      '.service-card__meta',
      '.review-card__badge',
      '.review-card__client strong',
      '.review-card__client span'
    ].forEach(function(selector){
      Array.prototype.forEach.call(document.querySelectorAll(selector), translateElement);
    });
  }

  function translateDynamicContent(){
    var lang=getLang();
    if(!window.DFG_DEFAULT_DATA) return;
    var data=window.DFG_DEFAULT_DATA;
    Array.prototype.forEach.call(document.querySelectorAll('.blog-card'), function(card){
      var title=card.querySelector('h3');
      if(!title) return;
      var article=(data.blogArticles||[]).find(function(item){
        return [item.title && item.title.ru, item.title && item.title.bg, item.title && item.title.en, item.title && item.title.ka].map(normalize).indexOf(normalize(title.textContent))>=0;
      });
      if(article){
        setText(title, langText(article.title));
        var p=card.querySelector('p'); if(p) setText(p, langText(article.excerpt));
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.service-card[data-id]'), function(card){
      var id=card.getAttribute('data-id');
      var item=(data.services||[]).find(function(x){return x.id===id;});
      if(!item) return;
      var h=card.querySelector('h3'); if(h) setText(h, langText(item.title));
      var p=card.querySelector('p'); if(p) setText(p, langText(item.short));
      var meta=card.querySelector('.service-card__meta'); if(meta){
        var cat=item.category||'';
        var categoryMap={business:map['банки'],consulting:{ru:'Консалтинг',bg:'Консултинг',ka:'კონსალტინგი',en:'Consulting'},realEstate:map['недвижимость'],pharma:map['фармацевтика'],cars:map['автомобили'],parking:map['паркинги']};
        if(categoryMap[cat]) setText(meta,trValue(categoryMap[cat]));
      }
    });
  }

  function hardenBlogButtons(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-blog]'), function(button){
      button.type='button';
      button.style.pointerEvents='auto';
      if(!button.dataset.v295Ready) button.dataset.v295Ready='true';
    });
    document.addEventListener('click', function(event){
      var button=event.target.closest && event.target.closest('[data-open-blog]');
      if(!button) return;
      var id=button.getAttribute('data-open-blog');
      if(!id) return;
      var modal=document.getElementById('detailModal');
      var before=modal && modal.open;
      window.setTimeout(function(){
        var after=modal && modal.open;
        if(!after && !before){
          var fallback=blogLinks[id]||'blog.html';
          window.location.href=fallback;
        }
      },180);
    }, false);
  }

  function apply(){
    document.documentElement.lang=getLang();
    translateExactText(document.body);
    translateLinks();
    translateRails();
    fixCategoryLabels();
    translateDynamicContent();
  }
  var timer=0;
  function schedule(delay){clearTimeout(timer);timer=setTimeout(apply,delay||0);}
  function boot(){
    document.documentElement.dataset.dfgV295I18n='ready';
    hardenBlogButtons();
    schedule(0); schedule(250); schedule(900); schedule(1800);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){schedule(0);schedule(700);},{once:true});
  document.addEventListener('click',function(event){if(event.target.closest && event.target.closest('[data-lang],.lang-btn')){schedule(20);schedule(300);schedule(900);}},true);
  try{new MutationObserver(function(){schedule(120);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});}catch(e){}
  window.DFG_V295_I18N_LINKS={apply:apply,version:VERSION};
})();


/* ===== bundled from v296-i18n-overflow-final.js ===== */
(function(){
  'use strict';
  var VERSION='v296-i18n-overflow-final';
  var LANGS=['ru','bg','ka','en'];
  var DETAILS={ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'};
  var SERVICE_LINKS={
    'residence-bg':'service-residence-bulgaria.html','company-registration-eu':'service-company-registration.html','banks-accounts':'service-banks-accounts.html','supplements-registration':'service-supplements-registration.html','cosmetics-registration':'service-cosmetics-registration.html','pharma-consulting':'service-pharma-consulting.html','nostrification':'service-nostrification.html','international-trade-service':'service-international-trade.html','turnkey-consulting':'service-turnkey-consulting.html','uae-dubai':'uae.html','uzbekistan-asia-service':'asia.html','real-estate-service':'real-estate.html','cars-rent-service':'cars.html','parking-service':'parking.html'
  };
  function getLang(){
    var v='ru';
    try{v=localStorage.getItem('dfg_lang')||document.documentElement.lang||'ru';}catch(e){v=document.documentElement.lang||'ru';}
    v=String(v||'ru').slice(0,2).toLowerCase();
    return LANGS.indexOf(v)>=0?v:'ru';
  }
  function normalize(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function isLangObject(v){return v && typeof v==='object' && !Array.isArray(v) && ('ru' in v || 'bg' in v || 'ka' in v || 'en' in v);}
  function langValue(v, lang){
    if(!v) return '';
    if(typeof v==='string' || typeof v==='number') return String(v);
    return v[lang]||v.ru||v.bg||v.en||v.ka||'';
  }
  var manual={
    'главная':{ru:'Главная',bg:'Начало',ka:'მთავარი',en:'Home'},
    'услуги':{ru:'Услуги',bg:'Услуги',ka:'სერვისები',en:'Services'},
    'все услуги':{ru:'Все услуги',bg:'Всички услуги',ka:'ყველა სერვისი',en:'All services'},
    'смотреть все услуги':{ru:'Смотреть все услуги',bg:'Вижте всички услуги',ka:'ყველა სერვისის ნახვა',en:'View all services'},
    'о компании':{ru:'О компании',bg:'За нас',ka:'კომპანიის შესახებ',en:'About'},
    'блог':{ru:'Блог',bg:'Блог',ka:'ბლოგი',en:'Blog'},
    'отзывы':{ru:'Отзывы',bg:'Отзиви',ka:'შეფასებები',en:'Reviews'},
    'контакты':{ru:'Контакты',bg:'Контакти',ka:'კონტაქტები',en:'Contacts'},
    'разделы':{ru:'Разделы',bg:'Раздели',ka:'განყოფილებები',en:'Sections'},
    'юридическая информация':{ru:'Юридическая информация',bg:'Правна информация',ka:'იურიდიული ინფორმაცია',en:'Legal information'},
    'политика конфиденциальности':{ru:'Политика конфиденциальности',bg:'Политика за поверителност',ka:'კონფიდენციალურობის პოლიტიკა',en:'Privacy policy'},
    'условия использования':{ru:'Условия использования',bg:'Условия за ползване',ka:'გამოყენების პირობები',en:'Terms of use'},
    'политика cookies':{ru:'Политика cookies',bg:'Политика за cookies',ka:'Cookies პოლიტიკა',en:'Cookie policy'},
    'правовая информация':{ru:'Правовая информация',bg:'Правна информация',ka:'იურიდიული ინფორმაცია',en:'Legal notice'},
    'внж / пмж':{ru:'ВНЖ / ПМЖ',bg:'ВНЖ / ПМЖ',ka:'ბინადრობა / მუდმივი',en:'Residence / PR'},
    'регистрация компаний':{ru:'Регистрация компаний',bg:'Регистрация на фирми',ka:'კომპანიების რეგისტრაცია',en:'Company registration'},
    'банки':{ru:'Банки',bg:'Банки',ka:'ბანკები',en:'Banks'},
    'банки и счета':{ru:'Банки и счета',bg:'Банки и сметки',ka:'ბანკები და ანგარიშები',en:'Banks and accounts'},
    'узбекистан / азия':{ru:'Узбекистан / Азия',bg:'Узбекистан / Азия',ka:'უზბეკეთი / აზია',en:'Uzbekistan / Asia'},
    'азия':{ru:'Азия',bg:'Азия',ka:'აზია',en:'Asia'},
    'недвижимость':{ru:'Недвижимость',bg:'Имоти',ka:'უძრავი ქონება',en:'Real estate'},
    'фармацевтика':{ru:'Фармацевтика',bg:'Фармацевтика',ka:'ფარმაცევტიკა',en:'Pharmaceuticals'},
    'регистрация бадов':{ru:'Регистрация БАДов',bg:'Регистрация на добавки',ka:'დანამატების რეგისტრაცია',en:'Supplements registration'},
    'регистрация косметики':{ru:'Регистрация косметики',bg:'Регистрация на козметика',ka:'კოსმეტიკის რეგისტრაცია',en:'Cosmetics registration'},
    'фармацевтический консалтинг':{ru:'Фармацевтический консалтинг',bg:'Фармацевтичен консалтинг',ka:'ფარმაცევტული კონსალტინგი',en:'Pharma consulting'},
    'нострификация дипломов':{ru:'Нострификация дипломов',bg:'Нострификация на дипломи',ka:'დიპლომების აღიარება',en:'Diploma recognition'},
    'международная торговля':{ru:'Международная торговля',bg:'Международна търговия',ka:'საერთაშორისო ვაჭრობა',en:'International trade'},
    'торговля':{ru:'Торговля',bg:'Търговия',ka:'ვაჭრობა',en:'Trade'},
    'автомобили':{ru:'Автомобили',bg:'Автомобили',ka:'ავტომობილები',en:'Cars'},
    'авто':{ru:'Авто',bg:'Авто',ka:'ავტომობილები',en:'Cars'},
    'паркинги':{ru:'Паркинги',bg:'Паркинги',ka:'პარკინგები',en:'Parking'},
    'фильтр':{ru:'Фильтр',bg:'Филтър',ka:'ფილტრი',en:'Filter'},
    'эффективность':{ru:'Эффективность',bg:'Ефективност',ka:'ეფექტიანობა',en:'Efficiency'},
    'рост':{ru:'Рост',bg:'Растеж',ka:'ზრდა',en:'Growth'},
    'аналитика':{ru:'Аналитика',bg:'Аналитика',ka:'ანალიტიკა',en:'Analytics'},
    'конфиденциальность':{ru:'Конфиденциальность',bg:'Конфиденциалност',ka:'კონფიდენციალურობა',en:'Confidentiality'},
    'международное сопровождение':{ru:'Международное сопровождение',bg:'Международно съпровождане',ka:'საერთაშორისო მხარდაჭერა',en:'International support'},
    'инвестиции':{ru:'Инвестиции',bg:'Инвестиции',ka:'ინვესტიციები',en:'Investments'},
    'результат':{ru:'Результат',bg:'Резултат',ka:'შედეგი',en:'Result'},
    'получить консультацию':{ru:'Получить консультацию',bg:'Получете консултация',ka:'კონსულტაციის მიღება',en:'Get consultation'},
    'оставить заявку':{ru:'Оставить заявку',bg:'Изпрати запитване',ka:'განაცხადის გაგზავნა',en:'Submit request'},
    'подробнее':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'},
    'повече':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'},
    'details':{ru:'Подробнее',bg:'Повече',ka:'დეტალურად',en:'Details'},
    'categories.cars':{ru:'Автомобили',bg:'Автомобили',ka:'ავტომობილები',en:'Cars'},
    'categories.parking':{ru:'Паркинги',bg:'Паркинги',ka:'პარკინგები',en:'Parking'},
    'categories.business':{ru:'Бизнес и банки',bg:'Бизнес и банки',ka:'ბიზნესი და ბანკები',en:'Business and banking'},
    'categories.realestate':{ru:'Недвижимость',bg:'Имоти',ka:'უძრავი ქონება',en:'Real estate'},
    'консалтинг':{ru:'Консалтинг',bg:'Консултинг',ka:'კონსალტინგი',en:'Consulting'},
    'бизнес и банки':{ru:'Бизнес и банки',bg:'Бизнес и банки',ka:'ბიზნესი და ბანკები',en:'Business and banking'},
    'продукция':{ru:'Продукция',bg:'Продукти',ka:'პროდუქცია',en:'Products'},
    'все темы':{ru:'Все темы',bg:'Всички теми',ka:'ყველა თემა',en:'All topics'},
    'сделано компанией':{ru:'Сделано компанией',bg:'Изработено от',ka:'შექმნილია კომპანიის მიერ',en:'Made by'},
    'клиент по внж / пмж':{ru:'Клиент по ВНЖ / ПМЖ',bg:'Клиент по ВНЖ / ПМЖ',ka:'ბინადრობის კლიენტი',en:'Residence client'},
    'болгария':{ru:'Болгария',bg:'България',ka:'ბულგარეთი',en:'Bulgaria'},
    'компании':{ru:'Компании',bg:'Фирми',ka:'კომპანიები',en:'Companies'},
    'бизнес и банки':{ru:'Бизнес и банки',bg:'Бизнес и банки',ka:'ბიზნესი და ბანკები',en:'Business and banking'},
    'website':{ru:'Сайт',bg:'Сайт',ka:'საიტი',en:'Website'},
    'email':{ru:'Email',bg:'Email',ka:'Email',en:'Email'},
    'tel / whatsapp dubai':{ru:'Tel / WhatsApp Dubai',bg:'Tel / WhatsApp Dubai',ka:'Tel / WhatsApp Dubai',en:'Tel / WhatsApp Dubai'}
  };
  var hrefLabels={
    'index.html':manual['главная'],'services.html':manual['все услуги'],'about.html':manual['о компании'],'blog.html':manual['блог'],'reviews.html':manual['отзывы'],'contacts.html':manual['контакты'],'real-estate.html':manual['недвижимость'],'cars.html':manual['авто'],'parking.html':manual['паркинги'],'uae.html':{ru:'UAE / Dubai',bg:'UAE / Dubai',ka:'UAE / Dubai',en:'UAE / Dubai'},'asia.html':manual['узбекистан / азия'],'b2b.html':{ru:'B2B',bg:'B2B',ka:'B2B',en:'B2B'},'service-residence-bulgaria.html':{ru:'ВНЖ / ПМЖ Болгария',bg:'ВНЖ / ПМЖ България',ka:'ბულგარეთის ბინადრობა',en:'Bulgaria residence'},'service-company-registration.html':manual['регистрация компаний'],'service-banks-accounts.html':manual['банки и счета'],'service-supplements-registration.html':manual['регистрация бадов'],'service-cosmetics-registration.html':manual['регистрация косметики'],'service-pharma-consulting.html':manual['фармацевтический консалтинг'],'service-nostrification.html':manual['нострификация дипломов'],'service-international-trade.html':manual['международная торговля'],'service-turnkey-consulting.html':{ru:'Консалтинг под ключ',bg:'Консултинг до ключ',ka:'სრული კონსალტინგი',en:'Turnkey consulting'}
  };
  var dynamicMap=null;
  function add(map,key,val){key=normalize(key); if(key && val) map[key]=val;}
  function stripHtml(v){return String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
  function buildDynamicMap(){
    if(dynamicMap) return dynamicMap;
    dynamicMap={};
    Object.keys(manual).forEach(function(k){dynamicMap[k]=manual[k];});
    function visit(v){
      if(!v || typeof v!=='object') return;
      if(isLangObject(v)){
        var normalized={ru:langValue(v,'ru'),bg:langValue(v,'bg'),ka:langValue(v,'ka'),en:langValue(v,'en')};
        LANGS.forEach(function(l){add(dynamicMap, normalized[l], normalized); add(dynamicMap, stripHtml(normalized[l]), normalized);});
      }
      if(Array.isArray(v)) v.forEach(visit); else Object.keys(v).forEach(function(k){visit(v[k]);});
    }
    try{visit(window.DFG_DEFAULT_DATA);}catch(e){}
    return dynamicMap;
  }
  function trValue(v){return langValue(v,getLang());}
  function translateString(s){var item=buildDynamicMap()[normalize(s)]; return item ? trValue(item) : null;}
  function setText(el,value){if(el && value && String(el.textContent).trim()!==String(value)) el.textContent=value;}
  function textNodes(root){
    var out=[]; if(!root) return out;
    var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:function(node){
      var text=(node.nodeValue||'').replace(/\s+/g,' ').trim();
      if(!text) return NodeFilter.FILTER_REJECT;
      var p=node.parentElement;
      if(!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT)$/i.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      if(p.closest('.brand,.lang-switch,[data-no-i18n],[data-no-v296-i18n]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var n; while((n=walker.nextNode())) out.push(n); return out;
  }
  function translateTextNodes(){
    textNodes(document.body).forEach(function(node){
      var raw=node.nodeValue; var clean=raw.replace(/\s+/g,' ').trim(); var translated=translateString(clean);
      if(translated) node.nodeValue=raw.replace(clean, translated);
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[placeholder],textarea[placeholder],[aria-label],[title],[alt]'), function(el){
      ['placeholder','aria-label','title','alt'].forEach(function(name){var v=el.getAttribute(name); var t=translateString(v); if(t) el.setAttribute(name,t);});
    });
  }
  function translateLinks(){
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function(a){
      var href=(a.getAttribute('href')||'').split('#')[0].split('?')[0].replace(/^\.\//,'').replace(/^\.\.\//,'');
      var label=hrefLabels[href];
      if(label && a.children.length===0) setText(a,trValue(label));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.service-card__details-btn,.blog-card .btn,[data-open-blog],a.btn[href],button.btn'), function(btn){
      var text=normalize(btn.textContent);
      if(['подробнее','повече','დეტალურად','details','детально'].indexOf(text)>=0) setText(btn, DETAILS[getLang()]);
    });
  }
  function translateDataRenderedCards(){
    var data=window.DFG_DEFAULT_DATA||{};
    Array.prototype.forEach.call(document.querySelectorAll('.service-card[data-id]'), function(card){
      var id=card.getAttribute('data-id'); var item=(data.services||[]).find(function(x){return x.id===id;}); if(!item) return;
      setText(card.querySelector('h3'), langValue(item.title,getLang()));
      var p=card.querySelector('p'); if(p) setText(p, langValue(item.excerpt||item.short,getLang()));
      var meta=card.querySelector('.service-card__meta');
      var cats={business:manual['бизнес и банки'],consulting:manual['консалтинг'],realEstate:manual['недвижимость'],pharma:manual['фармацевтика'],cars:manual['автомобили'],parking:manual['паркинги']};
      if(meta && cats[item.category]) setText(meta,trValue(cats[item.category]));
      var btn=card.querySelector('.service-card__details-btn, a.btn');
      if(btn){ setText(btn, DETAILS[getLang()]); var href=SERVICE_LINKS[id]||btn.getAttribute('href'); if(href) btn.setAttribute('href',href); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.blog-card'), function(card){
      var title=card.querySelector('h3'); if(!title) return;
      var article=(data.blogArticles||[]).find(function(item){return LANGS.some(function(l){return normalize(langValue(item.title,l))===normalize(title.textContent);});});
      if(article){setText(title,langValue(article.title,getLang())); var p=card.querySelector('p'); if(p) setText(p,langValue(article.excerpt,getLang()));}
      var btn=card.querySelector('[data-open-blog],button.btn,a.btn'); if(btn) setText(btn,DETAILS[getLang()]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.review-card'), function(card){
      ['.review-card__badge','.review-card__client strong','.review-card__client span','p'].forEach(function(sel){Array.prototype.forEach.call(card.querySelectorAll(sel), function(el){var t=translateString(el.textContent); if(t) setText(el,t);});});
    });
  }
  function fixTechnicalLabels(){
    Array.prototype.forEach.call(document.querySelectorAll('button,span,a,small,.service-card__meta,.badge,.filter-pill'), function(el){var t=translateString(el.textContent); if(t) setText(el,t);});
  }
  function hardenClickableDetails(){
    Array.prototype.forEach.call(document.querySelectorAll('.service-card[data-id]'), function(card){
      var id=card.getAttribute('data-id'); var href=SERVICE_LINKS[id]||card.getAttribute('data-card-link'); var btn=card.querySelector('.service-card__details-btn,a.btn');
      if(href){card.setAttribute('data-card-link',href); if(btn){btn.setAttribute('href',href); btn.removeAttribute('data-open-service');}}
    });
    if(!document.documentElement.dataset.v296DetailsBound){
      document.documentElement.dataset.v296DetailsBound='true';
      document.addEventListener('click', function(event){
        var link=event.target.closest && event.target.closest('.service-card__details-btn,a[data-service-link]');
        if(link && link.getAttribute('href')) return;
        var card=event.target.closest && event.target.closest('.service-card[data-card-link]');
        if(card && !event.target.closest('a,button,input,select,textarea')){var href=card.getAttribute('data-card-link'); if(href) window.location.href=href;}
      }, true);
    }
  }
  function apply(){
    document.documentElement.lang=getLang();
    translateTextNodes(); translateLinks(); translateDataRenderedCards(); fixTechnicalLabels(); hardenClickableDetails();
    document.documentElement.dataset.dfgV296I18n='ready';
  }
  var timer=0; function schedule(ms){clearTimeout(timer); timer=setTimeout(apply, ms||0);}
  function boot(){apply(); [150,450,900,1600,2600].forEach(schedule);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){schedule(0);schedule(800);},{once:true});
  document.addEventListener('click',function(e){if(e.target.closest && e.target.closest('[data-lang],.lang-btn')){schedule(20);schedule(250);schedule(900);}},true);
  try{new MutationObserver(function(){schedule(80);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});}catch(e){}
  window.DFG_V296_I18N_OVERFLOW={apply:apply,version:VERSION};
})();


/* ===== bundled from v297-dubai-catalog-final.js ===== */

(function(){
  'use strict';
  var VERSION='v297-dubai-catalog-final';
  var LANGS=['ru','bg','ka','en'];
  function getLang(){
    var lang='ru';
    try{lang=localStorage.getItem('dfg_lang')||document.documentElement.lang||'ru';}catch(e){lang=document.documentElement.lang||'ru';}
    lang=String(lang||'ru').slice(0,2).toLowerCase();
    return LANGS.indexOf(lang)>=0?lang:'ru';
  }
  function t(obj){var lang=getLang(); return obj && (obj[lang]||obj.ru||obj.en||obj.bg||obj.ka||'') || '';}
  function text(sel, val){var el=document.querySelector(sel); if(el && val) el.textContent=val;}
  function all(sel, fn){Array.prototype.forEach.call(document.querySelectorAll(sel), fn);}

  var copy={
    eyebrow:{ru:'РусГлобалЭкспорт · партнерская линия услуг',bg:'РусГлобалЕкспорт · партньорска линия услуги',ka:'RusGlobalExport · პარტნიორული სერვისების ხაზი',en:'RusGlobalExport · partner service line'},
    title:{ru:'Экспорт и продажи в ОАЭ под ключ',bg:'Експорт и продажби в ОАЕ до ключ',ka:'ექსპორტი და გაყიდვები UAE-ში სრული მხარდაჭერით',en:'Export and sales launch in the UAE'},
    lead:{ru:'Премиальный блок для компаний, которые хотят вывести продукт, услугу или торговое направление в ОАЭ: аналитика, упаковка предложения, документы, регистрация, партнеры, переговоры, маркетплейсы, сети, склад, платежи и операционный запуск.',bg:'Премиум блок за компании, които искат да изведат продукт, услуга или търговско направление в ОАЕ: анализ, пакетиране на предложението, документи, регистрация, партньори, преговори, маркетплейси, търговски мрежи, склад, плащания и оперативен старт.',ka:'პრემიუმ ბლოკი კომპანიებისთვის, რომლებსაც სურთ პროდუქტის, სერვისის ან სავაჭრო მიმართულების UAE-ში გაშვება: ანალიტიკა, შეთავაზების მომზადება, დოკუმენტები, რეგისტრაცია, პარტნიორები, მოლაპარაკებები, marketplace-ები, ქსელები, საწყობი, გადახდები და ოპერაციული გაშვება.',en:'A premium block for companies launching a product, service or trade direction in the UAE: analytics, offer packaging, documents, registration, partners, negotiations, marketplaces, retail, warehouse, payments and operational launch.'},
    summaryTitle:{ru:'Не просто консультация, а маршрут до практического выхода на рынок',bg:'Не просто консултация, а маршрут до практическо излизане на пазара',ka:'არა მხოლოდ კონსულტაცია, არამედ პრაქტიკული ბაზარზე გასვლის მარშრუტი',en:'Not just consulting, but a practical market-entry route'},
    summaryText:{ru:'Логика блока построена на партнерском каталоге услуг: от первичной диагностики и проверки гипотезы до регистрации продукции, дистрибуции, маркетплейсов, аптечных и торговых сетей ОАЭ.',bg:'Логиката на блока е базирана на партньорски каталог услуги: от първична диагностика и проверка на хипотеза до регистрация на продукти, дистрибуция, маркетплейси, аптечни и търговски мрежи в ОАЕ.',ka:'ბლოკის ლოგიკა ეფუძნება პარტნიორულ მომსახურებათა კატალოგს: პირველადი დიაგნოსტიკიდან და ჰიპოთეზის შემოწმებიდან პროდუქტის რეგისტრაციამდე, დისტრიბუციამდე, marketplace-ებამდე, სააფთიაქო და სავაჭრო ქსელებამდე UAE-ში.',en:'The block follows a partner service catalog: from initial diagnostics and hypothesis testing to product registration, distribution, marketplaces, pharmacy channels and retail chains in the UAE.'},
    catalogTitle:{ru:'Крупные направления',bg:'Основни направления',ka:'ძირითადი მიმართულებები',en:'Core directions'},
    catalogLead:{ru:'Раздел сгруппирован так, чтобы клиент быстро понял весь маршрут: подготовка, документы, партнеры, инфраструктура продаж и запуск.',bg:'Разделът е групиран така, че клиентът бързо да разбере целия маршрут: подготовка, документи, партньори, продажбена инфраструктура и старт.',ka:'სექცია დაჯგუფებულია ისე, რომ კლიენტმა სწრაფად დაინახოს სრული მარშრუტი: მომზადება, დოკუმენტები, პარტნიორები, გაყიდვების ინფრასტრუქტურა და გაშვება.',en:'The section is grouped so clients quickly understand the route: preparation, documents, partners, sales infrastructure and launch.'},
    servicesTitle:{ru:'Практические услуги для запуска в ОАЭ',bg:'Практически услуги за старт в ОАЕ',ka:'პრაქტიკული სერვისები UAE-ში გაშვებისთვის',en:'Practical services for a UAE launch'},
    servicesLead:{ru:'Карточки написаны как готовые продуктовые блоки для сайта: что делаем, зачем это нужно и какой результат получает клиент.',bg:'Картите са оформени като готови продуктови блокове за сайт: какво правим, защо е нужно и какъв резултат получава клиентът.',ka:'ბარათები შექმნილია როგორც მზა პროდუქტის ბლოკები საიტისთვის: რას ვაკეთებთ, რატომ არის საჭირო და რა შედეგს იღებს კლიენტი.',en:'The cards are structured as ready product blocks: what is done, why it matters and what result the client gets.'},
    packagesTitle:{ru:'Пакеты для перепродажи и комплексных проектов',bg:'Пакети за препродажба и комплексни проекти',ka:'პაკეტები გადაყიდვისა და კომპლექსური პროექტებისთვის',en:'Packages for resale and complex projects'},
    ctaTitle:{ru:'Обсудить запуск направления в ОАЭ',bg:'Обсъдете старт на направление в ОАЕ',ka:'განვიხილოთ UAE მიმართულების გაშვება',en:'Discuss a UAE launch'},
    ctaText:{ru:'Оставьте заявку — команда подберёт формат: диагностика, регистрация продукта, marketplace, ритейл, дистрибуция, склад или комплексный проект.',bg:'Изпратете запитване — екипът ще подбере формат: диагностика, регистрация на продукт, marketplace, ритейл, дистрибуция, склад или комплексен проект.',ka:'გააგზავნეთ მოთხოვნა — გუნდი შეარჩევს ფორმატს: დიაგნოსტიკა, პროდუქტის რეგისტრაცია, marketplace, retail, დისტრიბუცია, საწყობი ან კომპლექსური პროექტი.',en:'Submit a request — the team will choose the right format: diagnostics, product registration, marketplace, retail, distribution, warehouse or a complex project.'},
    ctaBtn:{ru:'Получить консультацию',bg:'Получете консултация',ka:'კონსულტაციის მიღება',en:'Get consultation'}
  };
  var categories=[
    {n:'01',title:{ru:'Диагностика, аналитика и стратегия',bg:'Диагностика, анализ и стратегия',ka:'დიაგნოსტიკა, ანალიტიკა და სტრატეგია',en:'Diagnostics, analytics and strategy'},text:{ru:'Консультация, экспортная готовность, проверка гипотезы, исследование рынка и дорожная карта.',bg:'Консултация, експортна готовност, проверка на хипотеза, пазарно проучване и пътна карта.',ka:'კონსულტაცია, ექსპორტისთვის მზადყოფნა, ჰიპოთეზის შემოწმება, ბაზრის კვლევა და საგზაო რუკა.',en:'Consulting, export readiness, hypothesis testing, market research and roadmap.'}},
    {n:'02',title:{ru:'Упаковка продукта и предложения',bg:'Пакетиране на продукт и предложение',ka:'პროდუქტისა და შეთავაზების შეფუთვა',en:'Product and offer packaging'},text:{ru:'Коммерческое предложение, презентация, брендирование, адаптация сайта и материалов.',bg:'Търговско предложение, презентация, брандиране, адаптация на сайт и материали.',ka:'კომერციული შეთავაზება, პრეზენტაცია, ბრენდინგი, საიტისა და მასალების ადაპტაცია.',en:'Commercial offer, presentation, branding, website and material adaptation.'}},
    {n:'03',title:{ru:'Документы, сертификация и регистрация',bg:'Документи, сертификация и регистрация',ka:'დოკუმენტები, სერტიფიკაცია და რეგისტრაცია',en:'Documents, certification and registration'},text:{ru:'Сертификация, регистрация пищевой, косметической и другой продукции в ОАЭ, контракты.',bg:'Сертификация, регистрация на хранителни, козметични и други продукти в ОАЕ, договори.',ka:'სერტიფიკაცია, საკვები, კოსმეტიკური და სხვა პროდუქციის რეგისტრაცია UAE-ში, კონტრაქტები.',en:'Certification, food/cosmetics/other product registration in the UAE, contracts.'}},
    {n:'04',title:{ru:'Партнеры, переговоры, выставки',bg:'Партньори, преговори, изложения',ka:'პარტნიორები, მოლაპარაკებები, გამოფენები',en:'Partners, negotiations and exhibitions'},text:{ru:'Поиск иностранных партнеров, организация переговоров, бизнес-миссии, выставки и коллективные стенды.',bg:'Търсене на чуждестранни партньори, преговори, бизнес мисии, изложения и общи щандове.',ka:'უცხოელი პარტნიორების ძიება, მოლაპარაკებები, ბიზნეს-მისიები, გამოფენები და საერთო სტენდები.',en:'Foreign partner search, negotiations, business missions, exhibitions and shared stands.'}},
    {n:'05',title:{ru:'Продажи и инфраструктура ОАЭ',bg:'Продажби и инфраструктура в ОАЕ',ka:'გაყიდვები და ინფრასტრუქტურა UAE-ში',en:'UAE sales infrastructure'},text:{ru:'Маркетплейсы, торговые сети, аптечные сети, дистрибуция, склад и фулфилмент.',bg:'Маркетплейси, търговски мрежи, аптечни канали, дистрибуция, склад и фулфилмънт.',ka:'marketplace-ები, სავაჭრო ქსელები, სააფთიაქო არხები, დისტრიბუცია, საწყობი და fulfillment.',en:'Marketplaces, retail chains, pharmacy channels, distribution, warehouse and fulfillment.'}},
    {n:'06',title:{ru:'Финансы, импорт и структуры',bg:'Финанси, импорт и структури',ka:'ფინანსები, იმპორტი და სტრუქტურები',en:'Finance, import and structures'},text:{ru:'Платежи, расчеты, импортные маршруты и регистрация компании в ОАЭ под реальные задачи.',bg:'Плащания, разплащания, импортни маршрути и регистрация на компания в ОАЕ според задачата.',ka:'გადახდები, ანგარიშსწორება, იმპორტის მარშრუტები და კომპანიის რეგისტრაცია UAE-ში ამოცანის მიხედვით.',en:'Payments, settlements, import routes and UAE company registration for real business tasks.'}},
    {n:'07',title:{ru:'Экспортный отдел и обучение',bg:'Експортен отдел и обучение',ka:'ექსპორტის განყოფილება და სწავლება',en:'Export department and training'},text:{ru:'Отдел экспорта под ключ, экспорт на аутсорсе, практическое обучение и акселераторы.',bg:'Експортен отдел до ключ, външен експортен екип, практическо обучение и акселератори.',ka:'ექსპორტის განყოფილება სრული ფორმატით, აუთსორსი, პრაქტიკული სწავლება და აქსელერატორები.',en:'Turnkey export department, outsourced export team, practical training and accelerators.'}},
    {n:'08',title:{ru:'Комплексный запуск',bg:'Комплексен старт',ka:'კომპლექსური გაშვება',en:'Complex launch'},text:{ru:'Один управляемый проект: анализ, упаковка, документы, партнеры, переговоры, пилот и масштабирование.',bg:'Един управляван проект: анализ, подготовка, документи, партньори, преговори, пилот и мащабиране.',ka:'ერთი მართული პროექტი: ანალიზი, მომზადება, დოკუმენტები, პარტნიორები, მოლაპარაკებები, პილოტი და მასშტაბირება.',en:'One managed project: analysis, packaging, documents, partners, negotiations, pilot and scaling.'}}
  ];
  var services=[
    {n:'01',title:{ru:'Консультация по экспорту',bg:'Консултация по експорт',ka:'ექსპორტის კონსულტაცია',en:'Export consultation'},text:{ru:'Разбор продукта, рынка, каналов продаж, материалов и рисков до выхода к иностранным партнерам.',bg:'Преглед на продукт, пазар, канали за продажба, материали и рискове преди излизане към чужди партньори.',ka:'პროდუქტის, ბაზრის, გაყიდვების არხების, მასალებისა და რისკების ანალიზი უცხოელ პარტნიორებთან გასვლამდე.',en:'Product, market, sales channel, materials and risk review before approaching foreign partners.'},items:{ru:['первые шаги','риски по цене, логистике и документам','рекомендации по формату проекта'],bg:['първи стъпки','рискове по цена, логистика и документи','препоръки за формат на проекта'],ka:['პირველი ნაბიჯები','ფასის, ლოგისტიკისა და დოკუმენტების რისკები','რეკომენდაციები პროექტის ფორმატზე'],en:['first steps','price, logistics and document risks','project format recommendations']}},
    {n:'02',title:{ru:'Оценка экспортной готовности',bg:'Оценка на експортната готовност',ka:'ექსპორტისთვის მზადყოფნის შეფასება',en:'Export readiness assessment'},text:{ru:'Проверяем продукт, команду, документы, цену, упаковку, производство и логистику.',bg:'Проверяваме продукт, екип, документи, цена, опаковка, производство и логистика.',ka:'ვამოწმებთ პროდუქტს, გუნდს, დოკუმენტებს, ფასს, შეფუთვას, წარმოებას და ლოგისტიკას.',en:'We check product, team, documents, price, packaging, production and logistics.'},items:{ru:['слабые места до продаж','готовность к переговорам','план доработок'],bg:['слаби места преди продажби','готовност за преговори','план за подобрения'],ka:['სუსტი ადგილები გაყიდვებამდე','მოლაპარაკებებისთვის მზადყოფნა','გაუმჯობესების გეგმა'],en:['weak points before sales','negotiation readiness','improvement plan']}},
    {n:'03',title:{ru:'Регистрация продукции в ОАЭ',bg:'Регистрация на продукти в ОАЕ',ka:'პროდუქციის რეგისტრაცია UAE-ში',en:'Product registration in the UAE'},text:{ru:'Сопровождение регистрации пищевой, косметической и другой продукции для импорта и продажи в ОАЭ.',bg:'Съпровождане на регистрация на хранителни, козметични и други продукти за внос и продажба в ОАЕ.',ka:'საკვები, კოსმეტიკური და სხვა პროდუქციის რეგისტრაციის მხარდაჭერა UAE-ში იმპორტისა და გაყიდვისთვის.',en:'Registration support for food, cosmetics and other products for import and sale in the UAE.'},items:{ru:['категория продукта','этикетки и описания','маршрут допуска к продажам'],bg:['категория продукт','етикети и описания','маршрут до продажби'],ka:['პროდუქტის კატეგორია','ეტიკეტები და აღწერები','გაყიდვების დაშვების მარშრუტი'],en:['product category','labels and descriptions','sales approval route']}},
    {n:'04',title:{ru:'Маркетплейсы ОАЭ',bg:'Маркетплейси в ОАЕ',ka:'UAE marketplace-ები',en:'UAE marketplaces'},text:{ru:'Размещение продукции на Amazon.ae, Noon и других площадках с подготовкой карточек и листинга.',bg:'Разполагане на продукти в Amazon.ae, Noon и други платформи с подготовка на листинги.',ka:'პროდუქციის განთავსება Amazon.ae, Noon და სხვა პლატფორმებზე ბარათებისა და listing-ის მომზადებით.',en:'Product listing on Amazon.ae, Noon and other platforms with listing preparation.'},items:{ru:['подбор площадок','карточки товара','логистика и прием оплат'],bg:['избор на платформи','продуктови карти','логистика и плащания'],ka:['პლატფორმების შერჩევა','პროდუქტის ბარათები','ლოგისტიკა და გადახდები'],en:['platform selection','product listings','logistics and payments']}},
    {n:'05',title:{ru:'Торговые и аптечные сети',bg:'Търговски и аптечни мрежи',ka:'სავაჭრო და სააფთიაქო ქსელები',en:'Retail and pharmacy chains'},text:{ru:'Подготовка входа продукции в розничные и аптечные каналы ОАЭ: требования, материалы, переговоры.',bg:'Подготовка за вход в retail и аптечни канали в ОАЕ: изисквания, материали, преговори.',ka:'პროდუქტის მომზადება UAE-ის retail და სააფთიაქო არხებში შესასვლელად: მოთხოვნები, მასალები, მოლაპარაკებები.',en:'Preparation for entering UAE retail and pharmacy channels: requirements, materials and negotiations.'},items:{ru:['оценка категории','материалы для закупщиков','пилотное размещение'],bg:['оценка на категория','материали за купувачи','пилотно разполагане'],ka:['კატეგორიის შეფასება','მასალები შემსყიდველებისთვის','პილოტური განთავსება'],en:['category review','buyer materials','pilot placement']}},
    {n:'06',title:{ru:'Дистрибуция, склад и фулфилмент',bg:'Дистрибуция, склад и фулфилмънт',ka:'დისტრიბუცია, საწყობი და fulfillment',en:'Distribution, warehouse and fulfillment'},text:{ru:'Локальная инфраструктура для поставки, хранения, комплектации заказов и регулярных продаж.',bg:'Локална инфраструктура за доставка, съхранение, комплектоване на поръчки и регулярни продажби.',ka:'ადგილობრივი ინფრასტრუქტურა მიწოდებისთვის, შენახვისთვის, შეკვეთების комплектაციისა და რეგულარული გაყიდვებისთვის.',en:'Local infrastructure for supply, storage, order preparation and recurring sales.'},items:{ru:['склад в Дубае','каналы продаж','отчетность и контроль'],bg:['склад в Дубай','канали за продажба','отчетност и контрол'],ka:['საწყობი დუბაიში','გაყიდვების არხები','ანგარიშგება და კონტროლი'],en:['Dubai warehouse','sales channels','reporting and control']}},
    {n:'07',title:{ru:'Платежи и расчеты',bg:'Плащания и разплащания',ka:'გადახდები და ანგარიშსწორება',en:'Payments and settlements'},text:{ru:'Разбор платежной схемы, маршрутов оплаты и связки платежей с контрактом, поставкой и документами.',bg:'Преглед на платежна схема, маршрути на плащане и връзка с договор, доставка и документи.',ka:'გადახდის სქემის, მარშრუტებისა და გადახდების კონტრაქტთან, მიწოდებასთან და დოკუმენტებთან დაკავშირების ანალიზი.',en:'Payment scheme review, payment routes and linkage with contract, delivery and documents.'},items:{ru:['законная модель','маршруты оплат','контроль ограничений'],bg:['законен модел','платежни маршрути','контрол на ограничения'],ka:['კანონიერი მოდელი','გადახდის მარშრუტები','შეზღუდვების კონტროლი'],en:['legal model','payment routes','restriction control']}},
    {n:'08',title:{ru:'Регистрация компании в ОАЭ',bg:'Регистрация на компания в ОАЕ',ka:'კომპანიის რეგისტრაცია UAE-ში',en:'UAE company registration'},text:{ru:'Открытие компании под международную торговлю, экспорт, реэкспорт, услуги и работу с партнерами.',bg:'Откриване на компания за международна търговия, експорт, реекспорт, услуги и партньорства.',ka:'კომპანიის გახსნა საერთაშორისო ვაჭრობისთვის, ექსპორტისთვის, реэкспортისთვის, სერვისებისთვის და პარტნიორებთან მუშაობისთვის.',en:'Company formation for international trade, export, re-export, services and partner work.'},items:{ru:['free zone / mainland','документы и расходы','юридическая структура'],bg:['free zone / mainland','документи и разходи','юридическа структура'],ka:['free zone / mainland','დოკუმენტები და ხარჯები','იურიდიული სტრუქტურა'],en:['free zone / mainland','documents and costs','legal structure']}},
    {n:'09',title:{ru:'Комплексный вывод на рынок',bg:'Комплексно излизане на пазара',ka:'ბაზარზე კომპლექსური გასვლა',en:'Complete market entry'},text:{ru:'Один управляемый проект: анализ, упаковка, документы, партнеры, переговоры, пилотная поставка и масштабирование.',bg:'Един управляван проект: анализ, пакетиране, документи, партньори, преговори, пилотна доставка и мащабиране.',ka:'ერთი მართული პროექტი: ანალიზი, შეფუთვა, დოკუმენტები, პარტნიორები, მოლაპარაკებები, პილოტური მიწოდება და მასშტაბირება.',en:'One managed project: analysis, packaging, documents, partners, negotiations, pilot shipment and scaling.'},items:{ru:['единый оператор','контроль этапов','понятный результат'],bg:['един оператор','контрол на етапи','ясен резултат'],ka:['ერთი ოპერატორი','ეტაპების კონტროლი','გასაგები შედეგი'],en:['single operator','stage control','clear result']}}
  ];
  var packages=[
    {title:{ru:'Экспортный старт',bg:'Експортен старт',ka:'ექსპორტის სტარტი',en:'Export start'},text:{ru:'Консультация, готовность, гипотеза и первичная дорожная карта.',bg:'Консултация, готовност, хипотеза и първична пътна карта.',ka:'კონსულტაცია, მზადყოფნა, ჰიპოთეზა და საწყისი საგზაო რუკა.',en:'Consulting, readiness, hypothesis and initial roadmap.'}},
    {title:{ru:'Рынок + партнеры',bg:'Пазар + партньори',ka:'ბაზარი + პარტნიორები',en:'Market + partners'},text:{ru:'Исследование, таможенная аналитика, портрет партнера и база компаний.',bg:'Проучване, митническа аналитика, профил на партньор и база компании.',ka:'კვლევა, საბაჟო ანალიტიკა, პარტნიორის პროფილი და კომპანიების ბაზა.',en:'Research, customs analytics, partner profile and company base.'}},
    {title:{ru:'Переговоры и миссия',bg:'Преговори и мисия',ka:'მოლაპარაკებები და მისია',en:'Negotiations and mission'},text:{ru:'Поиск партнеров, КП, онлайн-встречи и бизнес-миссия.',bg:'Търсене на партньори, оферта, онлайн срещи и бизнес мисия.',ka:'პარტნიორების ძიება, შეთავაზება, ონლაინ შეხვედრები და ბიზნეს მისია.',en:'Partner search, offer, online meetings and business mission.'}},
    {title:{ru:'Запуск продаж в ОАЭ',bg:'Старт на продажби в ОАЕ',ka:'გაყიდვების გაშვება UAE-ში',en:'UAE sales launch'},text:{ru:'Регистрация, склад, marketplace/retail, дистрибуция и платежная логика.',bg:'Регистрация, склад, marketplace/retail, дистрибуция и платежна логика.',ka:'რეგისტრაცია, საწყობი, marketplace/retail, დისტრიბუცია და გადახდის ლოგიკა.',en:'Registration, warehouse, marketplace/retail, distribution and payment logic.'}},
    {title:{ru:'Экспортный отдел',bg:'Експортен отдел',ka:'ექსპორტის განყოფილება',en:'Export department'},text:{ru:'Диагностика, CRM, процессы, обучение менеджеров и регулярная B2B-работа.',bg:'Диагностика, CRM, процеси, обучение на мениджъри и регулярна B2B работа.',ka:'დიაგნოსტიკა, CRM, პროცესები, მენეჯერების სწავლება და რეგულარული B2B მუშაობა.',en:'Diagnostics, CRM, processes, manager training and recurring B2B work.'}}
  ];
  function buildCategory(item){return '<article class="rge-dubai-category"><span>'+item.n+'</span><h3>'+t(item.title)+'</h3><p>'+t(item.text)+'</p></article>';}
  function buildService(item){
    var lis=(item.items&&t(item.items)||[]).map(function(x){return '<li>'+x+'</li>';}).join('');
    return '<article class="rge-dubai-card"><div class="rge-dubai-card__top"><span class="rge-dubai-card__num">'+item.n+'</span><span class="rge-dubai-card__mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.8-2.8 8.4-7 10-4.2-1.6-7-5.2-7-10V6z"></path><path d="M9 12l2 2 4-5"></path></svg></span></div><h4>'+t(item.title)+'</h4><p>'+t(item.text)+'</p><ul>'+lis+'</ul></article>';
  }
  function buildPackage(item){return '<article class="rge-dubai-package"><strong>'+t(item.title)+'</strong><span>'+t(item.text)+'</span></article>';}
  function renderRge(){
    var root=document.querySelector('[data-rge-dubai]');
    if(!root) return;
    text('[data-rge="eyebrow"]', t(copy.eyebrow));
    text('[data-rge="title"]', t(copy.title));
    text('[data-rge="lead"]', t(copy.lead));
    text('[data-rge="summaryTitle"]', t(copy.summaryTitle));
    text('[data-rge="summaryText"]', t(copy.summaryText));
    text('[data-rge="catalogTitle"]', t(copy.catalogTitle));
    text('[data-rge="catalogLead"]', t(copy.catalogLead));
    text('[data-rge="servicesTitle"]', t(copy.servicesTitle));
    text('[data-rge="servicesLead"]', t(copy.servicesLead));
    text('[data-rge="packagesTitle"]', t(copy.packagesTitle));
    text('[data-rge="ctaTitle"]', t(copy.ctaTitle));
    text('[data-rge="ctaText"]', t(copy.ctaText));
    text('[data-rge="ctaBtn"]', t(copy.ctaBtn));
    var cg=document.querySelector('[data-rge-categories]'); if(cg) cg.innerHTML=categories.map(buildCategory).join('');
    var sg=document.querySelector('[data-rge-services]'); if(sg) sg.innerHTML=services.map(buildService).join('');
    var pg=document.querySelector('[data-rge-packages]'); if(pg) pg.innerHTML=packages.map(buildPackage).join('');
    document.documentElement.dataset.dfgV297Dubai='ready';
  }
  function removeOvalShells(){
    all('.hero-feature__icon,.card-icon,.v10-page-proof__icon,.v103-hero-proof__icon,.v161-market-proof__icon,.rge-dubai-icon,.rge-dubai-card__mark', function(el){
      el.style.borderRadius='0';
      el.style.border='0';
      el.style.background='transparent';
      el.style.boxShadow='none';
      el.style.backdropFilter='none';
    });
  }
  function apply(){renderRge(); removeOvalShells();}
  var timer=0; function schedule(ms){clearTimeout(timer); timer=setTimeout(apply,ms||0);}
  function boot(){apply(); [120,420,900,1700].forEach(schedule);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){schedule(0);schedule(700);},{once:true});
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-lang],.lang-btn')){schedule(20);schedule(240);schedule(900);}},true);
  try{new MutationObserver(function(){schedule(90);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});}catch(e){}
  window.DFG_V297_DUBAI_CATALOG={version:VERSION,apply:apply};
})();


/* ===== v298 final system bridge: safe navigation, translated labels, no stale cache ===== */
(function(){
  'use strict';
  var VERSION='v298-final-system';
  var servicePages={
    'residence-bg':'service-residence-bulgaria.html','company-registration-eu':'service-company-registration.html','banks-accounts':'service-banks-accounts.html','uae-dubai':'uae.html','uzbekistan-asia-service':'asia.html','supplements-registration':'service-supplements-registration.html','cosmetics-registration':'service-cosmetics-registration.html','pharma-consulting':'service-pharma-consulting.html','nostrification':'service-nostrification.html','real-estate-service':'real-estate.html','cars-rent-service':'cars.html','parking-service':'parking.html','international-trade':'service-international-trade.html','international-trade-service':'service-international-trade.html','turnkey-consulting':'service-turnkey-consulting.html'
  };
  function getLang(){try{return (localStorage.getItem('dfg_lang')||document.documentElement.lang||'ru').slice(0,2).toLowerCase();}catch(e){return (document.documentElement.lang||'ru').slice(0,2).toLowerCase();}}
  function hardenServiceLinks(){
    document.querySelectorAll('.service-card').forEach(function(card){
      var id=card.getAttribute('data-id')||'';
      var href=card.getAttribute('data-card-link')||servicePages[id]||'';
      var link=card.querySelector('a.service-card__details-btn, a[data-service-link], a.btn');
      if(href && link){ link.setAttribute('href',href); link.removeAttribute('role'); }
    });
  }
  function translateTechnicalLabels(){
    var lang=getLang();
    var map={
      ru:{'categories.cars':'Автомобили','categories.parking':'Паркинги','categories.business':'Бизнес и банки','categories.consulting':'Консалтинг','categories.realEstate':'Недвижимость'},
      bg:{'categories.cars':'Автомобили','categories.parking':'Паркинги','categories.business':'Бизнес и банки','categories.consulting':'Консултинг','categories.realEstate':'Недвижими имоти'},
      en:{'categories.cars':'Cars','categories.parking':'Parking','categories.business':'Business and banking','categories.consulting':'Consulting','categories.realEstate':'Real estate'},
      ka:{'categories.cars':'ავტომობილები','categories.parking':'პარკინგები','categories.business':'ბიზნესი და ბანკები','categories.consulting':'კონსალტინგი','categories.realEstate':'უძრავი ქონება'}
    };
    var dict=map[lang]||map.ru;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){return /categories\./.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n){var v=n.nodeValue; Object.keys(dict).forEach(function(k){v=v.split(k).join(dict[k]);}); n.nodeValue=v;});
  }
  function markReady(){document.documentElement.dataset.dfgV298Final='ready';}
  function apply(){hardenServiceLinks();translateTechnicalLabels();markReady();}
  var timer=0; function schedule(ms){clearTimeout(timer);timer=setTimeout(apply,ms||0);}
  function boot(){apply();[80,240,700,1400,2600].forEach(schedule);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){schedule(0);schedule(900);},{once:true});
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-lang],.lang-btn,.filter-btn,.service-card')){schedule(30);schedule(350);schedule(1000);}},true);
  try{new MutationObserver(function(){schedule(120);}).observe(document.documentElement,{subtree:true,childList:true,characterData:true});}catch(e){}
  window.DFG_V298_FINAL={version:VERSION,apply:apply};
})();
