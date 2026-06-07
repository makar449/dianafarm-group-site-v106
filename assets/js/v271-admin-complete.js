
/* v271 ADMIN COMPLETE — UX guide, mobile stability, lead statistics, back arrows */
(function(){
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

  const sectionGuides = {
    dashboard: [
      ['Маршрут работы', 'Идите по порядку: главная → услуги → о компании → блог → отзывы → контакты.'],
      ['Что безопасно менять', 'Тексты, названия, фото, порядок, видимость, SEO и контакты.'],
      ['Как не запутаться', 'Сначала сохраните черновик, потом откройте предпросмотр, затем публикуйте.']
    ],
    services: [
      ['Услуги', 'Добавляйте новые услуги, меняйте названия, краткие и полные описания.'],
      ['Фото услуг', 'В поле изображения можно выбрать фото из папки, медиа или галереи телефона.'],
      ['Пункты и преимущества', 'Каждый пункт пишите с новой строки: это станет аккуратным списком на сайте.']
    ],
    sitePages: [
      ['Страницы и шапка', 'Редактируйте основные разделы: главная, услуги, о компании, блог, отзывы, контакты.'],
      ['Видимость', 'Скрывайте ненужные страницы и включайте нужные разделы без удаления данных.'],
      ['SEO', 'Заполняйте title и description отдельно для каждой языковой версии.']
    ],
    homeBlocks: [
      ['Главная сайта', 'Меняйте главные блоки, заголовки, подписи, изображения и порядок показа.'],
      ['Фото', 'Загружайте изображения из галереи или папок и проверяйте предпросмотр.'],
      ['Аккуратность', 'Не перегружайте первый экран: короткий заголовок и понятная кнопка работают лучше.']
    ],
    blogArticles: [
      ['Блог', 'Добавляйте статьи, меняйте заголовки, текст, дату и изображение материала.'],
      ['Связь с услугами', 'Статьи можно привязывать к темам и услугам, чтобы заказчику было проще читать.'],
      ['Черновик', 'Сначала проверяйте статью через предпросмотр, потом публикуйте.']
    ],
    blogTopics: [
      ['Темы блога', 'Создавайте направления блога: ВНЖ, банки, недвижимость, торговля, UAE, Азия.'],
      ['Порядок', 'Указывайте порядок, чтобы важные темы показывались выше.'],
      ['Связь', 'Привязывайте тему к категории услуги, если статья должна вести клиента к услуге.']
    ],
    reviews: [
      ['Отзывы', 'Добавляйте отзывы, меняйте текст, статус, услугу и страну.'],
      ['Модерация', 'Используйте статусы: новая, одобрена, отклонена. На сайте лучше показывать только проверенные.'],
      ['Доверие', 'Пишите коротко и конкретно: какая услуга, какой результат, какая страна.']
    ],
    contacts: [
      ['Контакты', 'Меняйте телефоны, WhatsApp, email, адреса, кнопки и рабочие сценарии.'],
      ['Заявки', 'Проверяйте, куда ведут кнопки: консультация, WhatsApp Bulgaria, Dubai или Uzbekistan.'],
      ['Языки', 'После правки проверьте RU / BG / KA / EN, чтобы контакты были понятны всем.']
    ],
    realEstate: [
      ['Недвижимость', 'Добавляйте объекты, галерею, цену, город, статус и описание.'],
      ['Галерея', 'Можно загрузить несколько фото из папки или галереи телефона.'],
      ['Фильтры', 'Тип, город, категория и статус влияют на поиск объектов на сайте.']
    ],
    cars: [
      ['Авто', 'Добавляйте автомобили, фото, цену, статус и описание.'],
      ['Фото', 'Первое фото будет главным в карточке, остальные — галерея.'],
      ['Публикация', 'Скрывайте проданные или неактуальные позиции, не удаляя их навсегда.']
    ],
    parkings: [
      ['Паркинги', 'Добавляйте места, локацию, статус, цену и условия.'],
      ['Описание', 'Указывайте доступ, шлагбаум, документы, аренду или покупку.'],
      ['Порядок', 'Актуальные предложения держите видимыми, закрытые скрывайте.']
    ],
    b2bOffers: [
      ['B2B', 'Добавляйте коммерческие предложения, поставщиков и направления.'],
      ['Документы', 'Загружайте PDF или фото документов, если они нужны клиенту.'],
      ['Фильтры', 'Категории помогают клиенту быстрее найти нужное направление.']
    ],
    socialLinks: [
      ['Соцсети', 'Меняйте ссылки на Telegram, Instagram, WhatsApp и другие каналы.'],
      ['Иконки', 'Короткий код помогает красиво подписать кнопку.'],
      ['Проверка', 'После изменения откройте сайт и проверьте, что ссылка ведёт правильно.']
    ],
    seo: [
      ['SEO', 'Заполняйте мета-заголовки и описания для страниц.'],
      ['Языки', 'Для каждого языка лучше делать отдельное описание.'],
      ['Индексация', 'Не используйте слишком длинные заголовки — они обрезаются в поиске.']
    ],
    leads: [
      ['CRM', 'Здесь собираются заявки с сайта и формы консультации.'],
      ['Статусы', 'Новая → В работе → Готово. Так видно, кто уже обработан.'],
      ['Экспорт', 'Кнопка CSV выгружает таблицу заявок для клиента или менеджера.']
    ],
    integrations: [
      ['Интеграции', 'Подключайте Supabase или внешние сервисы для общей базы заявок.'],
      ['Когда нужно', 'Если админкой пользуются несколько устройств, лучше включить общую базу.'],
      ['Безопасность', 'Не публикуйте ключи и пароли в открытом доступе.']
    ],
    backup: [
      ['Backup', 'Экспортируйте JSON перед крупными изменениями.'],
      ['Восстановление', 'Импорт JSON возвращает структуру сайта из сохранённой копии.'],
      ['Правило', 'Перед массовыми правками всегда делайте резервную копию.']
    ]
  };

  const dashboardCards = [
    ['Главная', 'Главная страница админ панели', 'Быстрый маршрут, подсказки, черновик, предпросмотр и последние заявки.', 'dashboard'],
    ['Услуги', 'Каталог и страницы услуг', 'Добавление услуг, замена фото, названий, описаний, пунктов и преимуществ.', 'services'],
    ['О компании', 'Страницы и шапка', 'Основные разделы сайта, видимость пунктов, SEO и тексты о компании.', 'sitePages'],
    ['Блог', 'Статьи и темы', 'Материалы, аналитика, изображения статей, рубрики и привязка к услугам.', 'blogArticles'],
    ['Отзывы', 'Доверие клиентов', 'Добавление и модерация отзывов, статус, услуга, страна и текст.', 'reviews'],
    ['Контакты', 'Связь и заявки', 'Телефоны, WhatsApp, email, адреса, кнопки и сценарии обращения.', 'contacts']
  ];

  function storageKey(name, fallback){
    return window[name] || fallback;
  }

  function safeDate(value){
    const d = new Date(value || Date.now());
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function getLeads(){
    try{
      return JSON.parse(localStorage.getItem(storageKey('DFG_LEADS_KEY', 'dianafarm_group_leads_v123_real_admin')) || '[]');
    }catch(e){
      return [];
    }
  }

  function leadStats(){
    const leads = getLeads();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const countSince = (t) => leads.filter((lead) => safeDate(lead.createdAt).getTime() >= t).length;
    return {
      today: countSince(todayStart),
      week: countSince(weekAgo),
      month: countSince(monthStart),
      year: countSince(yearStart),
      total: leads.length
    };
  }

  function currentTab(){
    return $('#adminNav button.active')?.dataset.adminTab || 'dashboard';
  }

  function setMainTitle(){
    const title = $('#adminTitle');
    if(!title) return;
    if(currentTab() === 'dashboard') title.textContent = 'Главная страница админ панели';
  }

  function injectDashboardGuide(){
    const content = $('#adminContent');
    if(!content || currentTab() !== 'dashboard' || $('.v271-admin-guide', content)) return;

    const stats = leadStats();
    const guide = document.createElement('div');
    guide.className = 'v271-admin-guide';
    guide.innerHTML = `
      <div class="v271-admin-guide__head">
        <div>
          <p class="eyebrow">Порядок работы</p>
          <h2>Главная страница админ панели</h2>
          <p>Админка устроена по понятной последовательности: главная, услуги, о компании, блог, отзывы, контакты. Заказчик может менять тексты, названия, фото, добавлять услуги, пункты, галереи и проверять всё через предпросмотр.</p>
        </div>
        <button class="btn btn--primary" data-admin-tab="services">Начать с услуг</button>
      </div>
      <div class="v271-guide-grid">
        ${dashboardCards.map(([name, label, text, tab]) => `
          <article class="v271-guide-card">
            <small>${name}</small>
            <b>${label}</b>
            <span>${text}</span>
            <button class="btn btn--ghost" data-admin-tab="${tab}">Открыть</button>
          </article>
        `).join('')}
      </div>
      <div class="v271-media-guide">
        <div class="v271-media-guide__item"><b>Фото и медиа</b><span>В карточках услуг и объектов нажмите “Загрузить из медиа / папки / галереи”. На телефоне откроется галерея, на ПК — выбор файла.</span></div>
        <div class="v271-media-guide__item"><b>Пункты и списки</b><span>Каждый новый пункт пишите с новой строки. Так можно добавлять преимущества, этапы, галереи и детали без кода.</span></div>
        <div class="v271-media-guide__item"><b>Черновик</b><span>Сначала сохраните черновик и откройте предпросмотр. Только после проверки нажимайте публикацию.</span></div>
      </div>
      <div class="v271-lead-stats" aria-label="Статистика заявок">
        <div class="v271-lead-stat"><strong>${stats.today}</strong><span>сегодня</span></div>
        <div class="v271-lead-stat"><strong>${stats.week}</strong><span>7 дней</span></div>
        <div class="v271-lead-stat"><strong>${stats.month}</strong><span>месяц</span></div>
        <div class="v271-lead-stat"><strong>${stats.year}</strong><span>год</span></div>
      </div>
    `;
    content.prepend(guide);
  }

  function injectSectionHelp(){
    const tab = currentTab();
    const guide = sectionGuides[tab];
    if(!guide || tab === 'dashboard') return;

    const card = $('#adminContent .admin-card');
    if(!card || $('.v271-section-help', card)) return;

    const panelTitle = $('.admin-panel-title', card) || card.firstElementChild;
    if(!panelTitle) return;

    const help = document.createElement('div');
    help.className = 'v271-section-help';
    help.innerHTML = guide.map(([title, text]) => `
      <div class="v271-section-help__item">
        <b>${title}</b>
        <span>${text}</span>
      </div>
    `).join('');
    panelTitle.insertAdjacentElement('afterend', help);
  }

  function injectLeadStats(){
    if(currentTab() !== 'leads') return;
    const card = $('#adminContent .admin-card');
    if(!card || $('.v271-lead-stats', card)) return;
    const stats = leadStats();
    const node = document.createElement('div');
    node.className = 'v271-lead-stats';
    node.innerHTML = `
      <div class="v271-lead-stat"><strong>${stats.today}</strong><span>заявок сегодня</span></div>
      <div class="v271-lead-stat"><strong>${stats.week}</strong><span>за неделю</span></div>
      <div class="v271-lead-stat"><strong>${stats.month}</strong><span>за месяц</span></div>
      <div class="v271-lead-stat"><strong>${stats.year}</strong><span>за год</span></div>
    `;
    const title = $('.admin-panel-title', card);
    if(title) title.insertAdjacentElement('afterend', node);
    else card.prepend(node);
  }

  function enhanceFileFields(){
    $$('.admin-file-field-v228').forEach((field) => {
      const drop = $('.file-drop-v228', field);
      if(drop && !drop.dataset.v271Text){
        drop.dataset.v271Text = '1';
        const input = $('input[type="file"]', drop);
        const multiple = input?.hasAttribute('multiple');
        drop.childNodes.forEach((node) => {
          if(node.nodeType === Node.TEXT_NODE) node.textContent = '';
        });
        drop.insertAdjacentText('afterbegin', multiple ? 'Добавить фото из медиа / папки / галереи' : 'Заменить фото из медиа / папки / галереи');
      }
      if(!$('.v271-media-hint', field)){
        const hint = document.createElement('small');
        hint.className = 'v271-media-hint';
        hint.textContent = 'Можно выбрать файл на компьютере, фото из папки или изображение из галереи телефона. Для галереи первое фото становится главным.';
        field.appendChild(hint);
      }
    });
  }

  function enhanceEditorBack(){
    const modal = $('#adminEditorModal');
    if(!modal || !modal.open) return;
    const head = $('.admin-editor-head-v228', modal);
    if(!head || $('.v271-back-btn', head)) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v271-back-btn';
    btn.textContent = '← Назад к списку';
    btn.addEventListener('click', () => {
      try { modal.close(); } catch(e) {}
    });
    head.appendChild(btn);
  }

  function enhanceSidebar(){
    const toggle = $('#v271SidebarToggle');
    if(toggle && !toggle.dataset.v271Bound){
      toggle.dataset.v271Bound = '1';
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        document.body.classList.toggle('v271-sidebar-open');
      });
    }

    $('#adminNav')?.addEventListener('click', (event) => {
      if(event.target.closest('button')) document.body.classList.remove('v271-sidebar-open');
    });

    if(!document.body.dataset.v271OverlayBound){
      document.body.dataset.v271OverlayBound = '1';
      document.addEventListener('click', (event) => {
        if(!document.body.classList.contains('v271-sidebar-open')) return;
        if(event.target.closest('.admin-sidebar') || event.target.closest('#v271SidebarToggle')) return;
        document.body.classList.remove('v271-sidebar-open');
      }, true);
    }
  }

  function normalizeActions(){
    $$('.admin-actions .btn, .row-actions .btn').forEach((btn) => {
      if(!btn.title) btn.title = btn.textContent.trim();
    });
  }

  function runEnhance(){
    if(!document.body.classList.contains('admin-body')) return;
    setMainTitle();
    injectDashboardGuide();
    injectSectionHelp();
    injectLeadStats();
    enhanceFileFields();
    enhanceEditorBack();
    enhanceSidebar();
    normalizeActions();
  }

  document.addEventListener('DOMContentLoaded', () => {
    runEnhance();
    const content = $('#adminContent');
    if(content){
      new MutationObserver(() => window.requestAnimationFrame(runEnhance)).observe(content, { childList:true, subtree:true });
    }
    const modal = $('#adminEditorModal');
    if(modal){
      new MutationObserver(() => window.requestAnimationFrame(runEnhance)).observe(modal, { childList:true, subtree:true, attributes:true, attributeFilter:['open'] });
    }
  });

  document.addEventListener('click', () => window.setTimeout(runEnhance, 80), true);
  window.addEventListener('resize', runEnhance, { passive:true });
})();
