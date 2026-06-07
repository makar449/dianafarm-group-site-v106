
/* v280 admin page builder.
   Works together with v273 universal editor on public pages:
   admin writes to dfg_universal_edits_v273 / dfg_universal_design_v273,
   public pages apply those changes automatically.
*/
(function(){
  'use strict';

  const CONTENT_KEY = 'dfg_universal_edits_v273';
  const DESIGN_KEY = 'dfg_universal_design_v273';
  const DATA_KEY = window.DFG_STORAGE_KEY || 'dianafarm_group_data_v232_admin_motion';
  const DEFAULT_DATA = window.DFG_DEFAULT_DATA || {};

  const state = {
    tab: 'siteBuilder',
    mode: 'texts',
    page: 'index.html',
    query: '',
    elements: [],
    selectedKey: '',
    selectedElement: null,
    htmlCache: new Map()
  };

  const textSelector = [
    'h1','h2','h3','h4','h5','h6','p','li','small','figcaption','blockquote',
    'a','button','.btn','label','strong','b','span'
  ].join(',');

  const imageSelector = 'img, source, video[poster]';

  const blockSelector = [
    'section','article','aside','header','footer','nav',
    '.card','[class*="card"]','[class*="panel"]','[class*="feature"]',
    '[class*="review"]','[class*="item"]','[class*="hero"]','.btn','button'
  ].join(',');

  const skipSelector = [
    'script','style','link','meta','noscript','template',
    '.dfg-editor-panel','.dfg-editor-panel *',
    '.dfg-editor-floating','.dfg-editor-floating *',
    '#adminEditorModal','#adminEditorModal *',
    '.admin-shell','.admin-shell *'
  ].join(',');

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[c])); }
  function attr(value){ return esc(value).replace(/`/g,'&#96;'); }
  function readJSON(key, fallback){ try{ return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }catch(e){ return fallback; } }
  function writeJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function contentStore(){ return readJSON(CONTENT_KEY, {}); }
  function saveContent(store){ writeJSON(CONTENT_KEY, store); }
  function designStore(){ return readJSON(DESIGN_KEY, {}); }
  function saveDesign(store){ writeJSON(DESIGN_KEY, store); applyDesign(store); }
  function toast(message){
    const node = qs('#toast');
    if(node){
      node.textContent = message;
      node.classList.add('show');
      clearTimeout(toast.t);
      toast.t = setTimeout(()=>node.classList.remove('show'), 2600);
    }else alert(message);
  }
  function clone(value){ return JSON.parse(JSON.stringify(value || {})); }
  function merge(base, saved){
    if(Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if(!base || typeof base !== 'object') return saved === undefined ? base : saved;
    const out = Object.assign({}, base);
    Object.keys(saved || {}).forEach((key)=>{ out[key] = key in base ? merge(base[key], saved[key]) : saved[key]; });
    return out;
  }
  function siteData(){ return merge(clone(DEFAULT_DATA), readJSON(DATA_KEY, null) || {}); }

  function pageId(filename){
    return (filename || 'index.html').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function cssPath(el){
    if(!el || el === document.body) return 'body';
    const parts = [];
    let node = el;
    while(node && node.nodeType === 1 && node !== document.body && parts.length < 8){
      let part = node.tagName.toLowerCase();
      if(node.id && !node.id.startsWith('dfg-editor')){
        part += '#' + safeCss(node.id);
        parts.unshift(part);
        break;
      }
      const cls = Array.from(node.classList || [])
        .filter(c => !c.startsWith('dfg-') && !c.startsWith('is-'))
        .slice(0,2);
      if(cls.length) part += '.' + cls.map(safeCss).join('.');
      const parent = node.parentElement;
      if(parent){
        const same = Array.from(parent.children).filter(child => child.tagName === node.tagName);
        if(same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function safeCss(value){
    if(window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function keyFor(filename, el){
    return pageId(filename) + '::' + cssPath(el);
  }

  function labelFor(el){
    const txt = (el.textContent || el.getAttribute('alt') || el.getAttribute('src') || el.getAttribute('href') || el.className || el.tagName || '').trim().replace(/\s+/g,' ');
    return txt.slice(0, 120) || el.tagName.toLowerCase();
  }

  function getPages(){
    const fromData = (siteData().sitePages || [])
      .filter(p => p && p.filename)
      .map(p => ({file:p.filename, title:textValue(p.title) || p.filename, id:p.id || ''}));
    const hard = [
      'index.html','services.html','about.html','blog.html','contacts.html','reviews.html',
      'real-estate.html','uae.html','asia.html','b2b.html','cars.html','parking.html',
      'service-residence-bulgaria.html','service-company-registration.html','service-banks-accounts.html',
      'service-supplements-registration.html','service-cosmetics-registration.html','service-pharma-consulting.html',
      'service-nostrification.html','service-international-trade.html','service-turnkey-consulting.html'
    ].map(file=>({file,title:file,id:''}));
    const map = new Map();
    [...fromData, ...hard].forEach(p=>{ if(!map.has(p.file)) map.set(p.file,p); });
    return Array.from(map.values());
  }

  function textValue(value){
    if(!value) return '';
    if(typeof value === 'string') return value;
    return value.ru || value.bg || value.en || Object.values(value)[0] || '';
  }

  async function fetchPage(file){
    if(state.htmlCache.has(file)) return state.htmlCache.get(file);
    const res = await fetch(file + (file.includes('?') ? '&' : '?') + 'adminScan=' + Date.now(), {cache:'no-store'});
    if(!res.ok) throw new Error('Не удалось открыть страницу ' + file);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    state.htmlCache.set(file, doc);
    return doc;
  }

  function isUsefulText(el){
    if(!el || el.closest(skipSelector)) return false;
    if(el.matches('script,style,link,meta,noscript,template,input,textarea,select,option')) return false;
    const raw = (el.textContent || '').trim().replace(/\s+/g,' ');
    if(!raw) return false;
    if(raw.length < 2) return false;
    if(el.children.length > 8 && !el.matches('button,a,.btn')) return false;
    return true;
  }

  function isUsefulImage(el){
    if(!el || el.closest(skipSelector)) return false;
    const src = el.getAttribute('src') || el.getAttribute('srcset') || el.getAttribute('poster') || '';
    return !!src && !src.startsWith('data:image/svg+xml');
  }

  function isUsefulBlock(el){
    if(!el || el.closest(skipSelector)) return false;
    if(el === document.body || el === document.documentElement) return false;
    const cls = String(el.className || '');
    const txt = (el.textContent || '').trim().replace(/\s+/g,' ');
    return el.matches('section,article,aside,header,footer,nav') || /hero|card|panel|feature|review|item|grid|section/i.test(cls) || txt.length > 20;
  }

  function extractElements(doc, file){
    const items = [];

    qsa(textSelector, doc).filter(isUsefulText).forEach((el, index)=>{
      const k = keyFor(file, el);
      items.push({
        type:'text',
        key:k,
        tag:el.tagName.toLowerCase(),
        label:labelFor(el),
        value:(el.textContent || '').trim(),
        href:el.matches('a') ? el.getAttribute('href') || '' : '',
        path:cssPath(el),
        index
      });
    });

    qsa(imageSelector, doc).filter(isUsefulImage).forEach((el,index)=>{
      const k = keyFor(file, el);
      items.push({
        type:'image',
        key:k,
        tag:el.tagName.toLowerCase(),
        label:el.getAttribute('alt') || el.getAttribute('src') || el.getAttribute('poster') || 'Изображение',
        src:el.getAttribute('src') || el.getAttribute('poster') || '',
        alt:el.getAttribute('alt') || '',
        path:cssPath(el),
        index
      });
    });

    qsa('a[href], button, .btn', doc).forEach((el,index)=>{
      if(el.closest(skipSelector)) return;
      const label = labelFor(el);
      if(!label) return;
      const k = keyFor(file, el);
      items.push({
        type:'button',
        key:k,
        tag:el.tagName.toLowerCase(),
        label,
        value:(el.textContent || '').trim(),
        href:el.getAttribute('href') || '',
        path:cssPath(el),
        index
      });
    });

    qsa(blockSelector, doc).filter(isUsefulBlock).forEach((el,index)=>{
      const k = keyFor(file, el);
      const existingStyle = el.getAttribute('style') || '';
      const bgMatch = existingStyle.match(/background(?:-image)?\s*:\s*([^;]+)/i);
      items.push({
        type:'block',
        key:k,
        tag:el.tagName.toLowerCase(),
        label:labelFor(el),
        path:cssPath(el),
        style:existingStyle,
        bg:bgMatch ? bgMatch[1] : '',
        index
      });
    });

    // de-duplicate by key+type
    const seen = new Set();
    return items.filter(item=>{
      const s = item.type + '|' + item.key;
      if(seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }

  async function loadElements(){
    try{
      const doc = await fetchPage(state.page);
      state.elements = extractElements(doc, state.page);
      return state.elements;
    }catch(error){
      state.elements = [];
      toast(error.message);
      return [];
    }
  }

  function filteredElements(){
    const store = contentStore();
    let list = state.elements;
    if(state.mode !== 'all') list = list.filter(item => item.type === state.mode || (state.mode === 'buttons' && item.type === 'button') || (state.mode === 'texts' && item.type === 'text') || (state.mode === 'images' && item.type === 'image') || (state.mode === 'blocks' && item.type === 'block'));
    const q = state.query.toLowerCase().trim();
    if(q) list = list.filter(item => [item.label,item.value,item.src,item.href,item.path,item.key].join(' ').toLowerCase().includes(q));
    return list.map(item => ({...item, saved: store[item.key]}));
  }

  function render(){
    const content = qs('#adminContent');
    const title = qs('#adminTitle');
    if(!content) return;
    if(title) title.textContent = 'Визуальный редактор всего сайта';
    updateStatus('Реальный редактор элементов', 'Выберите страницу → элемент → измените текст, фото, ссылку, фон, цвет или размер. Изменения применяются на публичном сайте.');
    content.innerHTML = `
      <div class="v280-builder">
        <div class="v280-builder-head admin-card admin-card-v228">
          <div>
            <p class="eyebrow">CMS / PAGE BUILDER</p>
            <h2>Можно менять почти любой видимый элемент сайта</h2>
            <p class="form-note">Тексты, фоновые фото, фото услуг, кнопки, ссылки, карточки, секции, цвета, отступы, размеры и скрытие блоков. Для сложных секций используйте “Открыть страницу с визуальным режимом”.</p>
          </div>
          <div class="v280-builder-actions">
            <button class="btn btn--primary" data-v280-open-edit>Открыть страницу с визуальным режимом</button>
            <button class="btn" data-v280-export>Экспорт правок</button>
            <button class="btn btn--ghost" data-v280-import>Импорт</button>
            <button class="btn btn-danger-v228" data-v280-clear>Сбросить правки</button>
          </div>
        </div>

        <div class="admin-card admin-card-v228 v280-toolbar">
          <label class="field">
            <span>Страница</span>
            <select data-v280-page>
              ${getPages().map(p=>`<option value="${attr(p.file)}" ${p.file===state.page?'selected':''}>${esc(p.title)} · ${esc(p.file)}</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>Поиск элемента</span>
            <input data-v280-search placeholder="Например: Все услуги, Подробнее, телефон, hero, card..." value="${attr(state.query)}">
          </label>
          <div class="v280-mode-tabs">
            ${modeButton('texts','Тексты')}
            ${modeButton('images','Фото')}
            ${modeButton('buttons','Кнопки')}
            ${modeButton('blocks','Блоки / фон')}
            ${modeButton('all','Все')}
          </div>
        </div>

        <div class="v280-builder-layout">
          <div class="admin-card admin-card-v228 v280-elements-list">
            <div class="admin-panel-title"><h2>Элементы</h2><span class="admin-pill-v228">${filteredElements().length}</span></div>
            <div class="v280-elements-scroll">
              ${renderList()}
            </div>
          </div>
          <div class="admin-card admin-card-v228 v280-editor-panel">
            ${renderEditor()}
          </div>
        </div>

        <div class="admin-card admin-card-v228">
          <div class="admin-panel-title"><h2>Глобальный дизайн сайта</h2><button class="btn btn--primary" data-v280-save-design>Сохранить дизайн</button></div>
          ${renderDesignForm()}
        </div>
      </div>
    `;
  }

  function modeButton(mode,label){
    return `<button class="btn btn--small ${state.mode===mode?'btn--primary':'btn--ghost'}" data-v280-mode="${mode}">${label}</button>`;
  }

  function iconFor(type){
    return {text:'T',image:'▧',button:'↗',block:'□'}[type] || '•';
  }

  function renderList(){
    const list = filteredElements();
    if(!list.length) return `<div class="admin-empty-v228">Элементы не найдены. Попробуйте другую вкладку или поиск.</div>`;
    return list.slice(0, 420).map(item=>`
      <button class="v280-element-row ${state.selectedKey===item.key?'is-active':''}" data-v280-select="${attr(item.key)}" data-v280-type="${attr(item.type)}">
        <span class="v280-row-icon">${iconFor(item.type)}</span>
        <span class="v280-row-text"><b>${esc(item.label)}</b><small>${esc(item.tag)} · ${esc(item.path)}</small></span>
        ${item.saved ? '<em>изменено</em>' : ''}
      </button>
    `).join('');
  }

  function selected(){
    return filteredElements().find(item => item.key === state.selectedKey) || state.elements.find(item => item.key === state.selectedKey) || null;
  }

  function renderEditor(){
    const item = selected();
    if(!item) return `<div class="v280-editor-empty"><h2>Выберите элемент слева</h2><p class="form-note">После выбора здесь появятся поля для текста, изображения, ссылки, фона, цвета, размеров и скрытия.</p></div>`;
    const saved = contentStore()[item.key] || {};
    const style = saved.style || {};
    const currentText = saved.text ?? item.value ?? item.label ?? '';
    const currentHref = saved.href ?? item.href ?? '';
    const currentSrc = saved.src ?? item.src ?? '';
    const currentAlt = saved.alt ?? item.alt ?? '';

    return `
      <div class="admin-panel-title">
        <div>
          <p class="eyebrow">${esc(item.type)} · ${esc(item.tag)}</p>
          <h2>${esc(item.label || 'Элемент')}</h2>
          <small class="form-note">${esc(item.path)}</small>
        </div>
        <div class="row-actions">
          <button class="btn btn--primary" data-v280-save-element="${attr(item.key)}">Сохранить элемент</button>
          <button class="btn btn-danger-v228" data-v280-reset-element="${attr(item.key)}">Сбросить</button>
        </div>
      </div>

      <div class="admin-form-grid admin-form-grid-v228" data-v280-editor-form>
        ${(item.type === 'text' || item.type === 'button') ? `
          <label class="field field--full"><span>Текст / заголовок / подпись</span><textarea data-v280-field="text">${esc(currentText)}</textarea></label>
        ` : ''}

        ${item.type === 'button' ? `
          <label class="field field--full"><span>Ссылка кнопки / href</span><input data-v280-field="href" value="${attr(currentHref)}" placeholder="contacts.html или #services"></label>
        ` : ''}

        ${item.type === 'image' ? `
          <label class="field field--full"><span>Текущее изображение</span><input data-v280-field="src" value="${attr(currentSrc)}" placeholder="assets/img/..."></label>
          <label class="field"><span>Загрузить новое фото</span><input type="file" accept="image/*" data-v280-file="src"></label>
          <label class="field"><span>Alt / описание</span><input data-v280-field="alt" value="${attr(currentAlt)}"></label>
          <div class="field field--full v280-image-preview">${currentSrc ? `<img src="${attr(currentSrc)}" alt="">` : ''}</div>
        ` : ''}

        ${item.type === 'block' ? `
          <label class="field field--full"><span>Фоновое изображение</span><input data-v280-style="background-image" value="${attr(style['background-image'] || '')}" placeholder="url('assets/img/photo.webp')"></label>
          <label class="field"><span>Загрузить фон</span><input type="file" accept="image/*" data-v280-file="background-image"></label>
          <label class="field"><span>Фон / цвет блока</span><input type="color" data-v280-style-color="background-color" value="${toColor(style['background-color'], '#071625')}"></label>
        ` : ''}

        <label class="field"><span>Цвет текста</span><input type="color" data-v280-style-color="color" value="${toColor(style.color, '#f8ead6')}"></label>
        <label class="field"><span>Размер текста</span><input data-v280-style="font-size" value="${attr(style['font-size'] || '')}" placeholder="например 28px"></label>
        <label class="field"><span>Шрифт</span><input data-v280-style="font-family" value="${attr(style['font-family'] || '')}" placeholder="Georgia или Inter"></label>
        <label class="field"><span>Внутренний отступ</span><input data-v280-style="padding" value="${attr(style.padding || '')}" placeholder="24px"></label>
        <label class="field"><span>Внешний отступ</span><input data-v280-style="margin" value="${attr(style.margin || '')}" placeholder="20px 0"></label>
        <label class="field"><span>Скругление</span><input data-v280-style="border-radius" value="${attr(style['border-radius'] || '')}" placeholder="22px"></label>
        <label class="field"><span>Ширина</span><input data-v280-style="width" value="${attr(style.width || '')}" placeholder="auto / 320px / 100%"></label>
        <label class="field"><span>Минимальная высота</span><input data-v280-style="min-height" value="${attr(style['min-height'] || '')}" placeholder="420px"></label>
        <label class="field"><span>Показывать элемент</span><select data-v280-visible><option value="1" ${style.display==='none'?'':'selected'}>Да</option><option value="0" ${style.display==='none'?'selected':''}>Нет</option></select></label>
      </div>
    `;
  }

  function toColor(value, fallback){
    if(/^#[0-9a-f]{6}$/i.test(String(value||''))) return value;
    return fallback || '#ffffff';
  }

  function renderDesignForm(){
    const d = Object.assign(defaultDesign(), designStore());
    const colorFields = [
      ['--dfg-site-bg','Фон сайта'],
      ['--dfg-site-bg-2','Второй фон'],
      ['--dfg-site-surface','Фон секций'],
      ['--dfg-site-heading','Заголовки'],
      ['--dfg-site-text','Основной текст'],
      ['--dfg-site-accent','Золото / акцент'],
      ['--dfg-site-button-bg','Цвет кнопок'],
      ['--dfg-site-button-text','Текст кнопок']
    ];
    return `
      <div class="admin-form-grid admin-form-grid-v228" data-v280-design-form>
        ${colorFields.map(([key,label])=>`<label class="field"><span>${label}</span><input type="color" data-v280-design="${key}" value="${attr(d[key])}"></label>`).join('')}
        <label class="field"><span>Скругление карточек</span><input data-v280-design="--dfg-site-radius" value="${attr(d['--dfg-site-radius'])}"></label>
        <label class="field"><span>Отступ секций</span><input data-v280-design="--dfg-site-section-padding" value="${attr(d['--dfg-site-section-padding'])}"></label>
        <label class="field field--full"><span>Шрифт текста</span><input data-v280-design="--dfg-site-body-font" value="${attr(d['--dfg-site-body-font'])}"></label>
        <label class="field field--full"><span>Шрифт заголовков</span><input data-v280-design="--dfg-site-heading-font" value="${attr(d['--dfg-site-heading-font'])}"></label>
      </div>
    `;
  }

  function defaultDesign(){
    return {
      '--dfg-site-bg':'#06111f',
      '--dfg-site-bg-2':'#07172e',
      '--dfg-site-surface':'#071625',
      '--dfg-site-card':'rgba(8,24,45,.72)',
      '--dfg-site-heading':'#fff6e8',
      '--dfg-site-text':'#f8ead6',
      '--dfg-site-muted':'rgba(248,234,214,.72)',
      '--dfg-site-accent':'#e2b477',
      '--dfg-site-button-bg':'#e2b477',
      '--dfg-site-button-text':'#06111f',
      '--dfg-site-line':'rgba(226,180,119,.28)',
      '--dfg-site-radius':'22px',
      '--dfg-site-section-padding':'96px',
      '--dfg-site-body-font':'Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',
      '--dfg-site-heading-font':'Georgia,"Times New Roman",serif'
    };
  }

  function applyDesign(store = designStore()){
    Object.entries(store).forEach(([key,value])=>{
      if(value !== undefined && value !== null && value !== ''){
        document.documentElement.style.setProperty(key, value);
      }
    });
  }

  function updateStatus(title,note){
    const node = qs('#adminLiveStatus');
    if(!node) return;
    const b = node.querySelector('b');
    const small = node.querySelector('small');
    if(b) b.textContent = title;
    if(small) small.textContent = note;
  }

  async function openBuilder(){
    await loadElements();
    state.selectedKey = filteredElements()[0]?.key || '';
    render();
  }

  function collectPatch(form, item){
    const patch = {};
    const text = qs('[data-v280-field="text"]', form);
    if(text) patch.text = text.value;
    const href = qs('[data-v280-field="href"]', form);
    if(href) patch.href = href.value;
    const src = qs('[data-v280-field="src"]', form);
    if(src) patch.src = src.value;
    const alt = qs('[data-v280-field="alt"]', form);
    if(alt) patch.alt = alt.value;

    const style = {};
    qsa('[data-v280-style]', form).forEach(input=>{
      const prop = input.dataset.v280Style;
      if(input.value) style[prop] = input.value;
    });
    qsa('[data-v280-style-color]', form).forEach(input=>{
      const prop = input.dataset.v280StyleColor;
      if(input.value) style[prop] = input.value;
    });
    const visible = qs('[data-v280-visible]', form);
    if(visible && visible.value === '0') style.display = 'none';
    if(visible && visible.value === '1' && style.display === 'none') delete style.display;
    if(Object.keys(style).length) patch.style = style;

    return patch;
  }

  async function fileToDataURL(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = ()=>resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function saveElement(key){
    const item = selected();
    const form = qs('[data-v280-editor-form]');
    if(!item || !form) return;
    const patch = collectPatch(form, item);

    for(const fileInput of qsa('[data-v280-file]', form)){
      if(!fileInput.files || !fileInput.files[0]) continue;
      const value = await fileToDataURL(fileInput.files[0]);
      if(fileInput.dataset.v280File === 'src'){
        patch.src = value;
      }else if(fileInput.dataset.v280File === 'background-image'){
        patch.style = patch.style || {};
        patch.style['background-image'] = `url("${value}")`;
        patch.style['background-size'] = patch.style['background-size'] || 'cover';
        patch.style['background-position'] = patch.style['background-position'] || 'center';
      }
    }

    const store = contentStore();
    store[key] = Object.assign({}, store[key] || {}, patch);
    saveContent(store);
    toast('Элемент сохранён. Откройте страницу и проверьте результат.');
    await loadElements();
    render();
  }

  function resetElement(key){
    const store = contentStore();
    delete store[key];
    saveContent(store);
    toast('Элемент сброшен');
    render();
  }

  function saveDesignFromForm(){
    const form = qs('[data-v280-design-form]');
    if(!form) return;
    const next = Object.assign({}, designStore());
    qsa('[data-v280-design]', form).forEach(input=>{
      next[input.dataset.v280Design] = input.value;
    });

    // Also map the new variables into old widely-used CSS variables.
    next['--page'] = next['--dfg-site-bg'];
    next['--card'] = next['--dfg-site-surface'];
    next['--card-white'] = next['--dfg-site-surface'];
    next['--heading'] = next['--dfg-site-heading'];
    next['--text'] = next['--dfg-site-text'];
    next['--accent'] = next['--dfg-site-accent'];
    next['--accent-2'] = next['--dfg-site-button-bg'];
    next['--v172-bg'] = next['--dfg-site-bg'];
    next['--v172-bg-2'] = next['--dfg-site-bg-2'];
    next['--v172-panel'] = next['--dfg-site-surface'];
    next['--v172-gold'] = next['--dfg-site-accent'];
    next['--v172-cream'] = next['--dfg-site-heading'];

    saveDesign(next);
    toast('Дизайн сайта сохранён');
  }

  function exportEdits(){
    const payload = JSON.stringify({content:contentStore(), design:designStore()}, null, 2);
    navigator.clipboard?.writeText(payload).then(()=>toast('JSON правок скопирован')).catch(()=>{
      download('dianafarm-site-edits-v280.json', payload, 'application/json');
    });
  }
  function importEdits(){
    const value = prompt('Вставьте JSON правок из экспорта');
    if(!value) return;
    try{
      const parsed = JSON.parse(value);
      if(parsed.content) saveContent(parsed.content);
      if(parsed.design) saveDesign(parsed.design);
      toast('Правки импортированы');
      render();
    }catch(e){
      alert('JSON не прочитан');
    }
  }
  function clearEdits(){
    if(!confirm('Сбросить все универсальные правки текста/фото/дизайна?')) return;
    localStorage.removeItem(CONTENT_KEY);
    localStorage.removeItem(DESIGN_KEY);
    toast('Универсальные правки сброшены');
    render();
  }
  function download(filename, content, type){
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function openPageEdit(){
    const url = state.page + (state.page.includes('?') ? '&' : '?') + 'edit=1';
    window.open(url, '_blank', 'noopener');
  }

  function injectNav(){
    const nav = qs('#adminNav');
    if(!nav || qs('[data-v280-tab="siteBuilder"]', nav)) return;
    const group = document.createElement('div');
    group.className = 'admin-nav-group-v279';
    group.innerHTML = '<span>5</span><b>Редактор всего сайта</b>';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.v280Tab = 'siteBuilder';
    btn.innerHTML = '<i>✎</i><span>Визуальный редактор</span>';
    nav.appendChild(group);
    nav.appendChild(btn);
  }

  function setActiveButton(){
    qsa('#adminNav button').forEach(btn => btn.classList.toggle('active', btn.dataset.v280Tab === 'siteBuilder'));
  }

  function bind(){
    document.addEventListener('click', async (event)=>{
      const tab = event.target.closest('[data-v280-tab]');
      if(tab){
        event.preventDefault();
        event.stopPropagation();
        setActiveButton();
        await openBuilder();
        return;
      }

      const page = event.target.closest('[data-v280-page]');
      if(page) return;

      const mode = event.target.closest('[data-v280-mode]');
      if(mode){
        state.mode = mode.dataset.v280Mode;
        state.selectedKey = '';
        render();
        return;
      }

      const row = event.target.closest('[data-v280-select]');
      if(row){
        state.selectedKey = row.dataset.v280Select;
        render();
        return;
      }

      const save = event.target.closest('[data-v280-save-element]');
      if(save){
        await saveElement(save.dataset.v280SaveElement);
        return;
      }

      const reset = event.target.closest('[data-v280-reset-element]');
      if(reset){
        resetElement(reset.dataset.v280ResetElement);
        return;
      }

      if(event.target.closest('[data-v280-save-design]')){ saveDesignFromForm(); return; }
      if(event.target.closest('[data-v280-export]')){ exportEdits(); return; }
      if(event.target.closest('[data-v280-import]')){ importEdits(); return; }
      if(event.target.closest('[data-v280-clear]')){ clearEdits(); return; }
      if(event.target.closest('[data-v280-open-edit]')){ openPageEdit(); return; }
    }, true);

    document.addEventListener('change', async (event)=>{
      const page = event.target.closest('[data-v280-page]');
      if(page){
        state.page = page.value;
        state.selectedKey = '';
        await loadElements();
        state.selectedKey = filteredElements()[0]?.key || '';
        render();
        return;
      }
    });
    document.addEventListener('input', (event)=>{
      const search = event.target.closest('[data-v280-search]');
      if(search){
        state.query = search.value;
        const list = qs('.v280-elements-scroll');
        if(list) list.innerHTML = renderList();
      }
    });

    document.addEventListener('input', async (event)=>{
      const previewFile = event.target.closest('[data-v280-file="src"]');
      if(previewFile && previewFile.files && previewFile.files[0]){
        const img = qs('.v280-image-preview img');
        if(img) img.src = await fileToDataURL(previewFile.files[0]);
      }
    });
  }

  function boot(){
    injectNav();
    bind();
    applyDesign();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DFGFullSiteBuilderV280 = { open:openBuilder, exportEdits, importEdits, clearEdits };
})();
