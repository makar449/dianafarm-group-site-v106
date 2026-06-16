(function () {
  'use strict';

  const DATA_KEY = window.DFG_STORAGE_KEY;
  const LEADS_KEY = window.DFG_LEADS_KEY;
  const DRAFT_KEY = window.DFG_DRAFT_KEY || `${DATA_KEY}_draft`;
  const DEFAULT_DATA = window.DFG_DEFAULT_DATA;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const langs = ['ru', 'bg', 'ka', 'en'];

  let data = loadData();
  let draftData = loadDraftData();
  let activeTab = 'instructions';
  let fileState = {};
  let editContext = null;
  let syncingLeads = false;
  let leadsSyncedOnce = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setButtonBusy(button, isBusy, label = 'Секунду...') {
    if (!button) return;
    if (isBusy) {
      button.dataset.originalText = button.textContent.trim();
      button.classList.add('is-busy');
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = label;
    } else {
      button.classList.remove('is-busy');
      button.removeAttribute('aria-busy');
      button.disabled = false;
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    }
  }

  async function withButtonFeedback(button, fn, loadingLabel = 'Сохраняем...') {
    try {
      setButtonBusy(button, true, loadingLabel);
      await Promise.resolve(fn());
    } catch (error) {
      console.error(error);
      toast('Ошибка действия. Проверьте данные и повторите.');
    } finally {
      setButtonBusy(button, false);
    }
  }

  function updateAdminStatus(title = 'Готово к работе', note = 'Изменения можно сохранить как черновик или опубликовать') {
    const node = $('#adminLiveStatus');
    if (!node) return;
    const strong = node.querySelector('b');
    const small = node.querySelector('small');
    if (strong) strong.textContent = title;
    if (small) small.textContent = note;
  }


  const schemas = {
    sitePages: {
      title: 'Основные страницы сайта',
      columns: ['title', 'type', 'filename', 'visible'],
      fields: [
        field('id', 'ID страницы', 'text'),
        field('visible', 'Страница активна', 'checkbox'),
        field('filename', 'Файл страницы', 'text', { hint: 'Например: index.html, services.html, service-residence-bulgaria.html' }),
        field('type', 'Тип страницы', 'text', { hint: 'Основная страница / Каталог / Страница услуги / Направление' }),
        field('title', 'Главный заголовок', 'multilang'),
        field('subtitle', 'Краткое описание страницы', 'multilangTextarea'),
        // v280 Поля первого экрана: эти значения реально применяются на публичных страницах.
        field('heroEyebrow', 'Надпись над заголовком / eyebrow', 'multilang'),
        field('heroTitle', 'Заголовок на странице', 'multilang'),
        field('heroSubtitle', 'Описание на странице', 'multilangTextarea'),
        field('heroImage', 'Фоновая фотография первого экрана', 'image'),
        field('primaryButtonText', 'Текст главной кнопки', 'multilang'),
        field('primaryButtonHref', 'Ссылка главной кнопки', 'text'),
        field('secondaryButtonText', 'Текст второй кнопки', 'multilang'),
        field('secondaryButtonHref', 'Ссылка второй кнопки', 'text'),
        field('seoTitle', 'SEO title', 'multilang'),
        field('seoDescription', 'SEO description', 'multilangTextarea')
      ]
    },
    services: {
      title: 'Услуги',
      columns: ['title', 'category', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('featured', 'Карточка на главной', 'checkbox'),
        field('category', 'Категория', 'text', { hint: 'Можно написать новую категорию.' }),
        field('icon', 'Короткая иконка / буквы', 'text'),
        field('image', 'Изображение услуги', 'image'),
        field('title', 'Название', 'multilang'),
        field('excerpt', 'Краткое описание', 'multilangTextarea'),
        field('fullText', 'Полное описание', 'multilangTextarea'),
        field('bullets', 'Преимущества / пункты', 'multilangList')
      ]
    },
    realEstate: {
      title: 'Недвижимость',
      columns: ['title', 'price', 'status', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('title', 'Название объекта', 'multilang'),
        field('dealType', 'Тип', 'select', { options: [['sale', 'продажа'], ['rent', 'аренда']] }),
        field('category', 'Категория', 'text', { hint: 'apartment / studio / house / commercial / land / investment или своя категория.' }),
        field('city', 'Город', 'text'),
        field('district', 'Район', 'text'),
        field('complex', 'Комплекс', 'text'),
        field('price', 'Цена', 'text'),
        field('areaM2', 'Площадь', 'text'),
        field('floor', 'Этаж', 'text'),
        field('rooms', 'Количество комнат', 'text'),
        field('images', 'Фото / галерея', 'images'),
        field('shortDescription', 'Краткое описание', 'multilangTextarea'),
        field('fullDescription', 'Полное описание', 'multilangTextarea'),
        field('advantages', 'Преимущества', 'multilangList'),
        field('location', 'Карта / локация', 'text'),
        field('status', 'Статус', 'select', { options: [['available', 'свободно'], ['sold', 'продано'], ['rented', 'сдано'], ['reserved', 'резерв']] }),
        field('whatsappContact', 'WhatsApp кнопка', 'select', { options: [['bulgaria', 'Bulgaria'], ['dubai', 'Dubai'], ['uzbekistan', 'Uzbekistan']] })
      ]
    },
    parkings: {
      title: 'Паркинги',
      columns: ['title', 'price', 'status', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('title', 'Название', 'multilang'),
        field('placeNumber', 'Номер места', 'text'),
        field('type', 'Тип', 'select', { options: [['sale', 'продажа'], ['rent', 'аренда']] }),
        field('location', 'Локация', 'text'),
        field('price', 'Цена', 'text'),
        field('images', 'Фото', 'images'),
        field('description', 'Описание', 'multilangTextarea'),
        field('barrier', 'Наличие шлагбаума', 'checkbox'),
        field('access24', 'Доступ 24/7', 'checkbox'),
        field('status', 'Статус', 'select', { options: [['available', 'свободно'], ['sold', 'продано'], ['rented', 'сдано'], ['reserved', 'резерв']] }),
        field('whatsappContact', 'WhatsApp кнопка', 'select', { options: [['bulgaria', 'Bulgaria'], ['dubai', 'Dubai'], ['uzbekistan', 'Uzbekistan']] })
      ]
    },
    cars: {
      title: 'Автомобили',
      columns: ['title', 'priceDay', 'status', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('brand', 'Марка', 'text'),
        field('model', 'Модель', 'text'),
        field('year', 'Год', 'text'),
        field('images', 'Фото', 'images'),
        field('rentalType', 'Тип аренды', 'multilang'),
        field('priceDay', 'Цена за день', 'text'),
        field('priceWeek', 'Цена за неделю', 'text'),
        field('priceMonth', 'Цена за месяц', 'text'),
        field('deposit', 'Залог', 'text'),
        field('transmission', 'Коробка передач', 'multilang'),
        field('fuel', 'Топливо', 'multilang'),
        field('seats', 'Количество мест', 'text'),
        field('conditions', 'Условия', 'multilangTextarea'),
        field('status', 'Статус', 'select', { options: [['available', 'свободно'], ['reserved', 'резерв'], ['rented', 'сдано']] }),
        field('whatsappContact', 'WhatsApp кнопка', 'select', { options: [['bulgaria', 'Bulgaria'], ['dubai', 'Dubai'], ['uzbekistan', 'Uzbekistan']] })
      ]
    },
    b2bOffers: {
      title: 'B2B Offers',
      columns: ['title', 'category', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('category', 'Категория', 'text', { hint: 'fertilizer / cosmetics / raw или новая категория.' }),
        field('image', 'Изображение', 'image'),
        field('title', 'Название', 'multilang'),
        field('excerpt', 'Краткое описание', 'multilangTextarea'),
        field('description', 'Полное описание', 'multilangTextarea'),
        field('products', 'Товары / услуги', 'simpleList'),
        field('geography', 'География', 'text'),
        field('certificates', 'PDF сертификаты', 'pdfFiles')
      ]
    },
    promotions: {
      title: 'Акции',
      columns: ['title', 'category', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('category', 'Категория', 'text'),
        field('image', 'Изображение', 'image'),
        field('title', 'Название акции', 'multilang'),
        field('excerpt', 'Краткое описание', 'multilangTextarea'),
        field('description', 'Полное описание', 'multilangTextarea'),
        field('cta', 'Текст кнопки', 'multilang')
      ]
    },
    blogArticles: {
      title: 'Блог',
      columns: ['title', 'category', 'date', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('category', 'Категория', 'text'),
        field('date', 'Дата', 'date'),
        field('image', 'Фото статьи', 'image'),
        field('videoUrl', 'Видео / ссылка', 'text'),
        field('title', 'Заголовок', 'multilang'),
        field('excerpt', 'Краткий текст', 'multilangTextarea'),
        field('content', 'Полный текст', 'multilangTextarea')
      ]
    },

    blogTopics: {
      title: 'Темы блога и услуг',
      columns: ['title', 'linkedServiceCategory', 'order', 'visible'],
      fields: [
        field('id', 'ID темы', 'text'),
        field('visible', 'Показывать тему', 'checkbox'),
        field('order', 'Порядок', 'text'),
        field('title', 'Название темы', 'multilang'),
        field('description', 'Описание темы', 'multilangTextarea'),
        field('linkedServiceCategory', 'Связанная категория услуг', 'text', { hint: 'consulting / business / realEstate / product / international / trade или пусто.' })
      ]
    },
    reviews: {
      title: 'Отзывы',
      columns: ['author', 'service', 'status', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать на сайте', 'checkbox'),
        field('status', 'Статус модерации', 'select', { options: [['pending', 'на модерации'], ['approved', 'одобрен'], ['rejected', 'отклонён']] }),
        field('rating', 'Оценка', 'select', { options: [['5', '5 звёзд'], ['4', '4 звезды'], ['3', '3 звезды'], ['2', '2 звезды'], ['1', '1 звезда']] }),
        field('author', 'Автор / подпись', 'text'),
        field('service', 'Направление', 'text'),
        field('country', 'Страна / география', 'text'),
        field('text', 'Текст отзыва', 'multilangTextarea')
      ]
    },
    socialLinks: {
      title: 'Соцсети',
      columns: ['title', 'network', 'visible'],
      fields: [
        field('id', 'ID / URL slug', 'text'),
        field('visible', 'Показывать', 'checkbox'),
        field('title', 'Название соцсети / аккаунта', 'text'),
        field('network', 'Соцсеть', 'text'),
        field('url', 'Ссылка', 'text'),
        field('icon', 'Иконка / короткий код', 'text')
      ]
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  function field(name, label, type, extra = {}) {
    return { name, label, type, ...extra };
  }

  async function init() {
    bindEvents();
    const logged = sessionStorage.getItem('dfg_admin_logged') === '1';
    if (!logged) return;
    if (!window.DFG_BACKEND?.isConfigured()) {
      sessionStorage.removeItem('dfg_admin_logged');
      renderRemoteRequiredNotice();
      return;
    }
    if (window.DFG_BACKEND.session) {
      try {
        await window.DFG_BACKEND.session();
        showAdmin();
      } catch (error) {
        sessionStorage.removeItem('dfg_admin_logged');
        console.warn('Admin session check failed', error);
        renderRemoteRequiredNotice(error?.message || 'Remote session check failed');
      }
    }
  }


  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] || ch;
    });
  }

  function renderRemoteRequiredNotice(reason = '') {
    const loginCard = document.querySelector('.admin-login, .admin-login-card, .login-card') || document.querySelector('main') || document.body;
    const existing = document.getElementById('dfgRemoteRequiredNotice');
    if (existing) existing.remove();
    const box = document.createElement('div');
    box.id = 'dfgRemoteRequiredNotice';
    box.className = 'admin-remote-required-v300';
    box.innerHTML = `
      <strong>Админка не работает в демо-режиме.</strong>
      <span>Чтобы изменения были видны на всех устройствах, подключи Supabase или запусти Node production backend. Локальное сохранение в браузер отключено.</span>
      ${reason ? `<small>${escapeHtml(String(reason))}</small>` : ''}
    `;
    loginCard.appendChild(box);
  }

  function bindEvents() {
    $('#loginForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector('button[type="submit"]');
      const password = new FormData(form).get('password');
      const rawPassword = String(password || '');
      if (!window.DFG_BACKEND?.isConfigured() || !window.DFG_BACKEND.login) {
        renderRemoteRequiredNotice();
        toast('Админка не в демо-режиме: сначала подключи Supabase или production backend.');
        return;
      }
      try {
        if (submitButton) submitButton.disabled = true;
        await window.DFG_BACKEND.login(rawPassword);
        sessionStorage.setItem('dfg_admin_logged', '1');
        sessionStorage.removeItem('dfg_admin_static_mode');
        showAdmin();
      } catch (error) {
        console.warn('Admin login failed', error);
        toast(error?.message || 'Неверный пароль или remote backend недоступен.');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });

    document.addEventListener('click', async (event) => {
      const clickedButton = event.target.closest('button, .btn');
      if (clickedButton) {
        clickedButton.classList.add('is-clicked');
        window.setTimeout(() => clickedButton.classList.remove('is-clicked'), 220);
      }

      const passwordToggle = event.target.closest('[data-toggle-password]');
      if (passwordToggle) {
        const input = $('#adminPasswordInput');
        if (input) {
          const nextType = input.type === 'password' ? 'text' : 'password';
          input.type = nextType;
          passwordToggle.textContent = nextType === 'password' ? 'Показать' : 'Скрыть';
        }
        return;
      }

      const tab = event.target.closest('[data-admin-tab]');
      if (tab) {
        activeTab = tab.dataset.adminTab;
        renderActiveTab();
        return;
      }

      const saveAllButton = event.target.closest('[data-save-all], #saveAllBtn');
      if (saveAllButton) {
        event.preventDefault();
        withButtonFeedback(saveAllButton, async () => {
          const published = await saveData();
          if (!published) throw new Error('Production-сервер не подтвердил публикацию.');
          draftData = clone(data);
          saveDraftData(draftData);
          updateAdminStatus('Опубликовано на сервере', 'Live-версия обновлена. Production-сервер подтвердил публикацию. Изменения доступны всем устройствам.');
          toast('Опубликовано на сервере. Сайт обновлён на всех устройствах.');
        }, 'Публикуем...');
        return;
      }

      const saveDraftBtn = event.target.closest('[data-save-draft]');
      if (saveDraftBtn) {
        event.preventDefault();
        const form = saveDraftBtn.closest('[data-editor-form]');
        if (form) saveEditor(form, 'draft');
        return;
      }

      const previewDraftBtn = event.target.closest('[data-preview-draft]');
      if (previewDraftBtn) {
        event.preventDefault();
        const form = previewDraftBtn.closest('[data-editor-form]');
        if (form) previewEditor(form);
        return;
      }

      const contactDraftBtn = event.target.closest('[data-contacts-save-draft]');
      if (contactDraftBtn) {
        event.preventDefault();
        const form = contactDraftBtn.closest('[data-contacts-form]');
        if (form) {
          const nextDraft = applyContactsFormTo(mergeDefaults(clone(DEFAULT_DATA), draftData || data), form);
          saveDraftData(nextDraft);
          toast('Черновик контактов сохранён');
        }
        return;
      }

      const contactPreviewBtn = event.target.closest('[data-contacts-preview-draft]');
      if (contactPreviewBtn) {
        event.preventDefault();
        const form = contactPreviewBtn.closest('[data-contacts-form]');
        if (form) {
          const nextDraft = applyContactsFormTo(mergeDefaults(clone(DEFAULT_DATA), draftData || data), form);
          saveDraftData(nextDraft);
          openDraftPreview('contacts.html');
        }
        return;
      }

      const previewItem = event.target.closest('[data-preview-item]');
      if (previewItem) {
        ensureDraftExists();
        openDraftPreview(previewPageFor(previewItem.dataset.previewItem));
        return;
      }

      const previewSite = event.target.closest('[data-preview-site]');
      if (previewSite) {
        ensureDraftExists();
        openDraftPreview(previewSite.dataset.previewSite || 'index.html');
        return;
      }

      const publishDraft = event.target.closest('[data-publish-draft]');
      if (publishDraft && confirm('Опубликовать текущий черновик на сайт?')) {
        data = mergeDefaults(clone(DEFAULT_DATA), draftData);
        const published = await saveData();
        if (!published) { toast('Черновик не опубликован: сервер не подтвердил изменения.'); return; }
        renderActiveTab();
        toast('Черновик опубликован на сервере');
        return;
      }

      const resetDraft = event.target.closest('[data-reset-draft]');
      if (resetDraft && confirm('Сбросить черновик к текущей опубликованной версии?')) {
        draftData = clone(data);
        saveDraftData(draftData);
        renderActiveTab();
        toast('Черновик сброшен к опубликованной версии');
        return;
      }

      if (event.target.closest('#logoutBtn')) {
        if (window.DFG_BACKEND?.logout) window.DFG_BACKEND.logout().catch((error) => console.warn('Logout failed', error));
        sessionStorage.removeItem('dfg_admin_logged');
        location.reload();
        return;
      }

      const add = event.target.closest('[data-add]');
      if (add) {
        openEditor(add.dataset.add, null);
        return;
      }

      const edit = event.target.closest('[data-edit]');
      if (edit) {
        openEditor(edit.dataset.edit, Number(edit.dataset.index));
        return;
      }

      const duplicate = event.target.closest('[data-duplicate]');
      if (duplicate) {
        await duplicateItem(duplicate.dataset.duplicate, Number(duplicate.dataset.index));
        return;
      }

      const del = event.target.closest('[data-delete]');
      if (del) {
        await deleteItem(del.dataset.delete, Number(del.dataset.index));
        return;
      }

      const toggle = event.target.closest('[data-toggle-visible]');
      if (toggle) {
        await toggleVisible(toggle.dataset.toggleVisible, Number(toggle.dataset.index));
        return;
      }

      if (event.target.closest('[data-admin-close]')) {
        $('#adminEditorModal')?.close();
        return;
      }

      const blockDeleteClick = event.target.closest('[data-delete-block]');
      if (blockDeleteClick) {
        deleteHomeBlock(Number(blockDeleteClick.dataset.index));
        return;
      }

      const removeFile = event.target.closest('[data-remove-file]');
      if (removeFile) {
        const key = removeFile.dataset.removeFile;
        const index = Number(removeFile.dataset.index);
        fileState[key].splice(index, 1);
        renderFilePreview(key, removeFile.dataset.fileType);
        return;
      }

      const clearLeads = event.target.closest('[data-clear-leads]');
      if (clearLeads && confirm('Удалить все заявки из CRM?')) {
        const previousLeads = loadLeads();
        localStorage.setItem(LEADS_KEY, '[]');
        if (window.DFG_BACKEND?.isConfigured()) previousLeads.forEach((lead) => window.DFG_BACKEND.deleteLead(lead.id).catch(() => {}));
        leadsSyncedOnce = false;
        renderLeads();
        toast('CRM очищена');
        return;
      }

      const deleteLead = event.target.closest('[data-delete-lead]');
      if (deleteLead) {
        const leadId = deleteLead.dataset.deleteLead;
        const leads = loadLeads().filter((lead) => lead.id !== leadId);
        localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
        if (window.DFG_BACKEND?.isConfigured()) window.DFG_BACKEND.deleteLead(leadId).catch((error) => console.warn('Remote lead delete failed', error));
        renderLeads();
        toast('Заявка удалена');
        return;
      }

      const refreshRemote = event.target.closest('[data-refresh-remote]');
      if (refreshRemote) {
        syncSiteFromRemote(false);
        syncLeadsFromRemote(false);
        return;
      }

      const refreshLeads = event.target.closest('[data-refresh-leads]');
      if (refreshLeads) {
        syncLeadsFromRemote(false);
        return;
      }

      const exportLeads = event.target.closest('[data-export-leads]');
      if (exportLeads) {
        exportLeadsCsv();
        return;
      }

      const exportData = event.target.closest('[data-export-data]');
      if (exportData) {
        downloadBlob('dianafarm-data-backup.json', JSON.stringify(data, null, 2), 'application/json');
        return;
      }

      const resetData = event.target.closest('[data-reset-data]');
      if (resetData && confirm('Сбросить сайт к заводским данным? Текущие изменения будут потеряны.')) {
        data = clone(DEFAULT_DATA);
        await saveData();
        renderActiveTab();
        toast('Данные сброшены');
      }
    });

    document.addEventListener('submit', async (event) => {
      const editor = event.target.closest('[data-editor-form]');
      if (editor) {
        event.preventDefault();
        saveEditor(editor);
        return;
      }

      const contacts = event.target.closest('[data-contacts-form]');
      if (contacts) {
        event.preventDefault();
        saveContacts(contacts);
        return;
      }

      const seo = event.target.closest('[data-seo-form]');
      if (seo) {
        event.preventDefault();
        saveSeo(seo);
        return;
      }

      const integrations = event.target.closest('[data-integrations-form]');
      if (integrations) {
        event.preventDefault();
        saveIntegrations(integrations);
        return;
      }
    });

    document.addEventListener('change', async (event) => {
      const fileInput = event.target.closest('[data-file-field]');
      if (fileInput) {
        await handleFileInput(fileInput);
        return;
      }

      const blockDelete = event.target.closest('[data-delete-block]');
      if (blockDelete) {
        deleteHomeBlock(Number(blockDelete.dataset.index));
        return;
      }

      const blockInput = event.target.closest('[data-block-field]');
      if (blockInput) {
        updateBlockField(blockInput);
        return;
      }

      const leadStatus = event.target.closest('[data-lead-status]');
      if (leadStatus) {
        updateLeadStatus(leadStatus.dataset.leadStatus, leadStatus.value);
      }

      const importFile = event.target.closest('#importDataFile');
      if (importFile && importFile.files[0]) {
        importData(importFile.files[0]);
      }
    });

    document.addEventListener('input', (event) => {
      const blockInput = event.target.closest('[data-block-field]');
      if (blockInput) updateBlockField(blockInput, false);
    });
  }

  function showAdmin() {
    $('#loginScreen')?.classList.add('hidden');
    $('#adminShell')?.classList.remove('hidden');
    renderActiveTab();
    syncSiteFromRemote(true);
    syncLeadsFromRemote(true);
    syncReviewsFromRemote(true);
  }

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
      return saved ? mergeDefaults(clone(DEFAULT_DATA), saved) : clone(DEFAULT_DATA);
    } catch (error) {
      console.warn(error);
      return clone(DEFAULT_DATA);
    }
  }

  function loadDraftData() {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return saved ? mergeDefaults(clone(DEFAULT_DATA), saved) : clone(loadData());
    } catch (error) {
      console.warn(error);
      return clone(loadData());
    }
  }

  function saveDraftData(nextDraft = draftData) {
    draftData = mergeDefaults(clone(DEFAULT_DATA), nextDraft || data);
    draftData.updatedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }

  function ensureDraftExists() {
    if (!localStorage.getItem(DRAFT_KEY)) saveDraftData(clone(data));
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

  async function saveData() {
    data.updatedAt = new Date().toISOString();
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) {
      updateAdminStatus('Публикация заблокирована', 'Remote backend не подключён. Локальный демо-save отключён.');
      appendPublishJournal('site-data', 'blocked-no-remote', data.updatedAt);
      toast('Не опубликовано: подключи Supabase или production backend. Локально на один ПК больше не сохраняю.');
      return false;
    }
    updateAdminStatus('Публикуется…', 'Ждём подтверждение remote backend.');
    const pushed = await pushSiteDataToRemote();
    if (pushed) {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      updateAdminStatus('Опубликовано на сервере', 'Remote backend принял изменения. Все устройства получат эту версию.');
      appendPublishJournal('site-data', 'success', data.updatedAt);
      toast('Опубликовано. Изменения доступны всем устройствам.');
    } else {
      updateAdminStatus('Не опубликовано', 'Remote backend не подтвердил публикацию. Локальная подмена отключена.');
      appendPublishJournal('site-data', 'failed', data.updatedAt);
      toast('Не опубликовано: сервер/Supabase не подтвердил сохранение.');
    }
    return pushed;
  }

  async function syncSiteFromRemote(silent = false) {
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return;
    try {
      const remote = await window.DFG_BACKEND.loadSiteData();
      if (!remote) {
        await window.DFG_BACKEND.saveSiteData(data);
        if (!silent) toast('Создана первая production-запись сайта')
        return;
      }
      data = mergeDefaults(clone(DEFAULT_DATA), remote);
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      renderActiveTab();
      if (!silent) toast('Данные сайта загружены с production-сервера')
    } catch (error) {
      console.warn('Production site sync failed', error);
      if (!silent) toast('Production API недоступен. Проверь сервер.')
    }
  }

  async function pushSiteDataToRemote() {
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return false;
    try {
      await window.DFG_BACKEND.saveSiteData(data);
      return true;
    } catch (error) {
      console.warn('Production site save failed', error);
      return false;
    }
  }

  function appendPublishJournal(kind, status, at) {
    try {
      const key = 'dfg_publish_journal_v289';
      const journal = JSON.parse(localStorage.getItem(key) || '[]');
      journal.unshift({ kind, status, at: at || new Date().toISOString(), userAgent: navigator.userAgent.slice(0, 160) });
      localStorage.setItem(key, JSON.stringify(journal.slice(0, 30)));
    } catch (error) {}
  }

  function renderActiveTab() {
    $$('#adminNav button').forEach((btn) => btn.classList.toggle('active', btn.dataset.adminTab === activeTab));
    const title = $('#adminTitle');
    if (title) title.textContent = tabTitle(activeTab);
    updateAdminStatus(tabTitle(activeTab), 'Порядок: основные страницы → блог услуг и темы → заявки. У каждой записи есть отдельная страница редактирования.');
    if (activeTab === 'instructions') renderInstructions();
    else if (activeTab === 'dashboard') renderDashboard();
    else if (schemas[activeTab]) renderCollection(activeTab);
    else if (activeTab === 'contacts') renderContactsEditor();
    else if (activeTab === 'homeBlocks') renderHomeBlocksEditor();
    else if (activeTab === 'seo') renderSeoEditor();
    else if (activeTab === 'integrations') renderIntegrationsEditor();
    else if (activeTab === 'leads') renderLeads();
    else if (activeTab === 'backup') renderBackup();
  }

  function tabTitle(tab) {
    if (schemas[tab]) return schemas[tab].title;
    return {
      instructions: 'Как пользоваться админ панелью',
      dashboard: 'Главная страница админ панели',
      sitePages: 'Основные страницы сайта',
      blogTopics: 'Темы блога и услуг',
      contacts: 'Контакты',
      homeBlocks: 'Блоки главной',
      seo: 'SEO',
      integrations: 'Интеграции',
      leads: 'Заявки',
      backup: 'Резервная копия'
    }[tab] || tab;
  }


function renderInstructions() {
    $('#adminContent').innerHTML = `
      <div class="admin-instruction-hero-v282 admin-card admin-card-v228">
        <div>
          <p class="eyebrow">Блок 0 · инструкция</p>
          <h2>Как пользоваться админ панелью</h2>
          <p class="form-note">Эта страница сделана для заказчика. Здесь простыми словами написано, куда нажимать и что менять. Если не уверены — сначала сохраните черновик или скачайте backup.</p>
        </div>
        <div class="admin-instruction-safe-v282">
          <strong>Главное правило</strong>
          <span>Сначала редактируйте. Потом смотрите предпросмотр. Только после проверки нажимайте “Опубликовать сайт”.</span>
        </div>
      </div>

      <div class="admin-instruction-steps-v282">
        ${instructionStep('01', 'Сначала выберите раздел слева', 'Слева находится меню. Нажмите нужный раздел: “Основные страницы”, “Услуги”, “Блог”, “Отзывы”, “Контакты”, “Заявки” и так далее. После клика справа откроется таблица или форма редактирования.')}
        ${instructionStep('02', 'Найдите нужную запись', 'В таблицах каждая строка — это отдельный объект: страница, услуга, статья, отзыв, машина, объект недвижимости или акция. Чтобы изменить запись, нажмите кнопку “Редактировать”.')}
        ${instructionStep('03', 'Измените поля', 'В открывшемся окне меняйте только те поля, которые нужны. Заголовок меняет заголовок. Описание меняет текст. Фото меняет картинку. Ссылка меняет куда ведёт кнопка. Галочка “Показывать” включает или скрывает объект на сайте.')}
        ${instructionStep('04', 'Проверьте перед публикацией', 'После правок можно сохранить черновик и открыть предпросмотр. Если всё выглядит правильно, нажмите “Опубликовать сайт” или “Опубликовать черновик”.')}
      </div>

      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228">
          <div><p class="eyebrow">Что за что отвечает</p><h2>Разделы админ панели</h2></div>
        </div>
        <div class="admin-help-grid-v282">
          ${helpCard('Главная', 'Показывает быстрые кнопки, последние заявки, количество страниц, услуг, статей и отзывов. Это стартовая страница для контроля.')}
          ${helpCard('Основные страницы', 'Здесь редактируются страницы сайта: главная, все услуги, о компании, блог, контакты, отзывы и страницы направлений. Меняйте название, описание, фон первого экрана, кнопки, SEO и видимость страницы.')}
          ${helpCard('Услуги', 'Здесь лежат карточки услуг. Можно добавить новую услугу, изменить название, описание, категорию, фото, ссылку кнопки, порядок и скрыть услугу с сайта.')}
          ${helpCard('Контакты и WhatsApp', 'Здесь меняются телефоны, почта, WhatsApp-кнопки, текст формы, адреса, соцсети и пароль входа в админку.')}
          ${helpCard('Заявки', 'Здесь появляются реальные заявки с сайта. Можно посмотреть клиента, телефон, сообщение, дату, поменять статус, экспортировать CSV и очистить обработанные заявки.')}
          ${helpCard('Блоки главной', 'Это отдельные блоки на главной странице: преимущества, шаги, CTA, карточки и другие секции. Меняйте текст, порядок, фото и включение блока.')}
          ${helpCard('Недвижимость', 'Каталог объектов недвижимости. Можно менять название объекта, цену, локацию, фото, описание, статус и WhatsApp-контакт.')}
          ${helpCard('Автомобили', 'Каталог авто. Можно менять марку, модель, год, фото, цены за день/неделю/месяц, условия аренды и статус.')}
          ${helpCard('Паркинги', 'Каталог паркингов. Меняется локация, цена, фото, описание, статус и условия доступа.')}
          ${helpCard('B2B предложения', 'Раздел международной торговли. Меняйте категорию, фото, название, описание, список товаров, географию и сертификаты.')}
          ${helpCard('Акции', 'Промо-блоки и специальные предложения. Можно менять название акции, описание, категорию, фото и видимость.')}
          ${helpCard('Блог', 'Статьи сайта. Меняйте заголовок, дату, фото, краткий текст, полный текст, тему и видимость статьи.')}
          ${helpCard('Темы блога и услуг', 'Темы связывают блог с услугами. Например: ВНЖ, банки, недвижимость, торговля. Здесь меняется название темы, порядок и привязка к категории.')}
          ${helpCard('Отзывы', 'Отзывы клиентов. Можно добавить отзыв, изменить текст, страну, услугу, автора, статус модерации и показывать или скрывать отзыв.')}
          ${helpCard('Соцсети', 'Ссылки на Telegram, Instagram, WhatsApp, сайт партнёра и другие внешние страницы. Меняйте название, сеть, ссылку и видимость.')}
          ${helpCard('SEO', 'Техническое описание для поисковиков и соцсетей. Меняйте title, description и картинку для страницы. Если не знаете что писать — лучше не трогать.')}
          ${helpCard('Интеграции', 'Подключение Supabase. Нужно, чтобы заявки и изменения были общими на разных устройствах, а не только в одном браузере.')}
          ${helpCard('Backup / JSON', 'Резервная копия сайта. Перед большой правкой скачайте backup. Если что-то сломали — загрузите backup обратно.')}
          ${helpCard('Визуальный редактор', 'Дополнительный редактор из v280. Он помогает выбрать страницу и изменить видимые элементы: текст, картинку, фон, кнопку, цвет, размер, отступы или скрытие блока.')}
        </div>
      </div>

      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228">
          <div><p class="eyebrow">Что менять в полях</p><h2>Понятно по каждому типу поля</h2></div>
        </div>
        <div class="admin-field-guide-v282">
          ${fieldGuide('ID / URL slug', 'Короткое техническое имя записи. Лучше писать латиницей без пробелов. Пример: service-banks. Если не понимаете — не меняйте.')}
          ${fieldGuide('Показывать на сайте / Видимость', 'Если включено — блок виден посетителям. Если выключено — блок остаётся в админке, но исчезает с сайта.')}
          ${fieldGuide('Название / Заголовок', 'Главный текст карточки или страницы. Изменили здесь — изменится название на сайте.')}
          ${fieldGuide('Описание / Краткое описание', 'Обычный текст под заголовком. Пишите коротко и понятно, без огромных абзацев.')}
          ${fieldGuide('Полное описание', 'Текст внутри страницы “Подробнее” или в расширенном блоке. Сюда можно писать больше деталей.')}
          ${fieldGuide('Фото / Изображение / Галерея', 'Нажмите “Загрузить файл”, выберите картинку на компьютере и сохраните запись. Для карточек лучше горизонтальные фото хорошего качества.')}
          ${fieldGuide('Кнопка / ссылка', 'Текст кнопки — что написано на кнопке. Ссылка — куда человек попадёт после клика. Пример ссылки: contacts.html или #services.')}
          ${fieldGuide('Категория', 'Нужна для фильтров. Если категория написана неправильно, карточка может попасть не туда. Используйте одинаковые названия категорий.')}
          ${fieldGuide('Цена / Статус', 'Показывается в каталогах. Статус помогает понять: доступно, продано, в работе, новая заявка и так далее.')}
          ${fieldGuide('RU / BG / KA / EN', 'Это языки. RU — русский, BG — болгарский, KA — грузинский, EN — английский. Заполняйте все языки, чтобы при смене языка не оставался старый текст.')}
        </div>
      </div>

      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228">
          <div><p class="eyebrow">Порядок безопасной работы</p><h2>Как не сломать сайт</h2></div>
        </div>
        <ol class="admin-safe-list-v282">
          <li><b>Перед большой правкой:</b> зайдите в “Backup / JSON” и скачайте резервную копию.</li>
          <li><b>Меняете текст:</b> откройте запись, измените нужное поле, сохраните.</li>
          <li><b>Меняете фото:</b> загрузите новую картинку, дождитесь превью, сохраните запись.</li>
          <li><b>Скрываете блок:</b> выключите “Показывать” или нажмите “Скрыть” в таблице.</li>
          <li><b>Проверяете:</b> нажмите “Предпросмотр” или “Перейти на сайт”.</li>
          <li><b>Публикуете:</b> если всё нормально, нажмите “Опубликовать сайт”.</li>
          <li><b>Если что-то пошло не так:</b> загрузите backup обратно или отмените последние изменения.</li>
        </ol>
      </div>
    `;
  }

  function instructionStep(num, title, text) {
    return `<div class="admin-instruction-step-v282"><b>${esc(num)}</b><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }

  function helpCard(title, text) {
    return `<article class="admin-help-card-v282"><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`;
  }

  function fieldGuide(title, text) {
    return `<div class="admin-field-guide-item-v282"><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
  }

  function parseLeadDate(lead) {
    const value = lead?.createdAt || lead?.created_at || lead?.date || lead?.timestamp;
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function leadStats(leads = loadLeads()) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const countFrom = (start) => leads.filter((lead) => parseLeadDate(lead) >= start).length;
    return {
      today: countFrom(todayStart),
      week: countFrom(weekStart),
      month: countFrom(monthStart),
      year: countFrom(yearStart),
      total: leads.length
    };
  }

  function renderLeadStats(leads = loadLeads()) {
    const s = leadStats(leads);
    return `
      <div class="admin-lead-stats-v282" aria-label="Статистика заявок">
        ${leadStatCard('Сегодня', s.today, 'С начала текущего дня')}
        ${leadStatCard('Неделя', s.week, 'За последние 7 дней')}
        ${leadStatCard('Месяц', s.month, 'С 1 числа текущего месяца')}
        ${leadStatCard('Год', s.year, 'С 1 января текущего года')}
        ${leadStatCard('Всего', s.total, 'Все заявки в CRM')}
      </div>
    `;
  }

  function leadStatCard(label, value, note) {
    return `<div class="admin-lead-stat-card-v282"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
  }


function renderDashboard() {
    const leads = loadLeads();
    const approvedReviews = (data.reviews || []).filter((item) => item.status !== 'rejected' && item.visible !== false).length;
    $('#adminContent').innerHTML = `
      <div class="admin-welcome-v228">
        <div>
          <p class="eyebrow">Простой режим</p>
          <h2>Что нужно сделать?</h2>
          <p>Порядок простой: сначала основные страницы сайта, затем блог услуг и темы, затем заявки. Все страницы, услуги, темы и записи открываются для правки отдельной кнопкой.</p>
        </div>
        <div class="admin-quick-v228 admin-quick-v230 admin-quick-v231">
          <button class="btn btn--primary" data-admin-tab="instructions">Инструкция</button>
          <button class="btn btn--ghost" data-admin-tab="sitePages">Основные страницы</button>
          <button class="btn btn--ghost" data-admin-tab="services">Все услуги</button>
          <button class="btn btn--ghost" data-admin-tab="blogArticles">Блог услуг</button>
          <button class="btn btn--ghost" data-admin-tab="blogTopics">Темы</button>
          <button class="btn btn--ghost" data-admin-tab="leads">Заявки</button>
        </div>
      </div>
      <div class="admin-grid admin-grid-v228">
        ${stat('Страницы', data.sitePages?.filter((item) => item.visible !== false).length || 0)}
        ${stat('Услуги', data.services?.filter((item) => item.visible !== false).length || 0)}
        ${stat('Темы блога', data.blogTopics?.filter((item) => item.visible !== false).length || 0)}
        ${stat('Статьи', data.blogArticles?.filter((item) => item.visible !== false).length || 0)}
        ${stat('Отзывы', approvedReviews)}
        ${stat('Заявки', leads.length)}
      </div>
      <div class="admin-card admin-draft-panel admin-draft-panel-v228">
        <div class="admin-panel-title">
          <div><p class="eyebrow">Черновик</p><h2>Проверка перед публикацией</h2></div>
          <span class="admin-status-pill">${draftStatusHTML()}</span>
        </div>
        <div class="admin-guide-v228">
          <span><b>1</b> Правка</span>
          <span><b>2</b> Черновик</span>
          <span><b>3</b> Предпросмотр</span>
          <span><b>4</b> Публикация</span>
        </div>
        <p class="form-note">Черновик не меняет сайт для посетителей. Сначала проверьте страницу, потом нажмите “Опубликовать черновик”.</p>
        <div class="admin-actions admin-actions-clean-v228">
          <button class="btn btn--primary" data-preview-site="index.html">Открыть предпросмотр</button>
          <button class="btn btn--ghost" data-publish-draft>Опубликовать черновик</button>
          <button class="btn" data-reset-draft>Сбросить черновик</button>
        </div>
      </div>
      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title"><div><p class="eyebrow">Последние заявки</p><h2>CRM</h2></div><button class="btn btn--small" data-admin-tab="leads">Все заявки</button></div>
        ${leadsTable(leads.slice(0, 5))}
      </div>
      <div class="admin-note-v228">
        <strong>Подсказка:</strong> фото и тексты сохраняются в этом браузере. Для общей админки на нескольких устройствах включите Supabase во вкладке “Интеграции”.
      </div>
    `;
  }

function stat(label, number) {
    return `<div class="stat-card stat-card-v228"><strong>${esc(number)}</strong><span>${esc(label)}</span></div>`;
  }

function renderCollection(collectionName) {
    const schema = schemas[collectionName];
    const rows = data[collectionName] || [];
    $('#adminContent').innerHTML = `
      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228">
          <div>
            <p class="eyebrow">Раздел админки</p>
            <h2>${esc(schema.title)}</h2>
            <small class="form-note">У каждой записи есть своя страница правки: редактируйте, скрывайте ненужное или добавляйте новое.</small>
          </div>
          <button class="btn btn--primary" data-add="${esc(collectionName)}">Добавить запись</button>
        </div>
        <div class="admin-table-wrap admin-table-wrap-v228">
          <table class="admin-table admin-table-v228">
            <thead><tr><th>Запись</th><th>Статус</th><th>Видимость</th><th>Действия</th></tr></thead>
            <tbody>
              ${rows.map((item, index) => collectionRow(collectionName, item, index)).join('') || `<tr><td colspan="4" class="admin-empty-v228">Пока нет записей. Нажмите “Добавить запись”.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

function collectionRow(collectionName, item, index) {
    const title = getItemTitle(collectionName, item);
    const second = collectionName === 'reviews'
      ? `${statusLabel(item.status)}${item.service ? ' · ' + item.service : ''}`
      : (collectionName === 'sitePages'
        ? `${item.type || 'Страница'} · ${item.filename || ''}`
        : (collectionName === 'blogTopics'
          ? `${item.linkedServiceCategory || 'общая тема'} · порядок ${item.order || '—'}`
          : (item.category || item.status || item.network || item.date || item.price || '—')));
    const visible = item.visible === false ? 'Скрыто' : 'На сайте';
    return `
      <tr>
        <td class="admin-row-main-v228"><strong>${esc(title || '(без названия)')}</strong><small>${esc(item.id || '')}</small></td>
        <td>${esc(second)}</td>
        <td><span class="admin-pill-v228 ${item.visible === false ? 'is-muted' : 'is-live'}">${visible}</span></td>
        <td>
          <div class="row-actions row-actions-v228">
            <button class="btn btn--small btn--primary" data-edit="${esc(collectionName)}" data-index="${index}">Редактировать</button>
            <button class="btn btn--small" data-toggle-visible="${esc(collectionName)}" data-index="${index}">${item.visible === false ? 'Показать' : 'Скрыть'}</button>
            <button class="btn btn--small btn-danger-v228" data-delete="${esc(collectionName)}" data-index="${index}">Удалить</button>
          </div>
        </td>
      </tr>
    `;
  }

function getItemTitle(collectionName, item) {
    if (collectionName === 'sitePages' || collectionName === 'blogTopics') return text(item.title) || item.filename || item.id;
    if (collectionName === 'cars') return `${item.brand || ''} ${item.model || ''}`.trim();
    if (collectionName === 'socialLinks') return item.title || item.network || '';
    if (collectionName === 'reviews') return item.author || item.service || item.country || '';
    return text(item.title) || item.id || '';
  }

  function statusLabel(status) {
    return ({ pending: 'На модерации', approved: 'Одобрен', rejected: 'Отклонён', available: 'Свободно', sold: 'Продано', rented: 'Сдано', reserved: 'Резерв' }[status]) || status || '—';
  }

function openEditor(collectionName, index) {
    const schema = schemas[collectionName];
    const isNew = index === null || Number.isNaN(index);
    const item = isNew ? createDefaultItem(schema, collectionName) : clone(data[collectionName][index]);
    editContext = { collectionName, index: isNew ? null : index, schema };
    fileState = {};

    const formHTML = `
      <div class="modal-body modal-body-v228">
        <div class="admin-editor-head-v228">
          <div>
            <p class="eyebrow">${isNew ? 'Новая запись' : 'Редактирование'}</p>
            <h2>${esc(schema.title)}</h2>
            <small>Заполните нужные поля. Пустые языковые версии можно оставить пустыми.</small>
          </div>
        </div>
        <form class="lead-form admin-editor-form-v228" data-editor-form="${esc(collectionName)}">
          <div class="admin-form-grid admin-form-grid-v228">
            ${schema.fields.map((f) => editorFieldHTML(f, item)).join('')}
          </div>
          <div class="admin-actions admin-editor-actions-v228">
            <button class="btn btn--primary" type="submit">Сохранить на сайт</button>
            <button class="btn btn--ghost" type="button" data-save-draft>Сохранить черновик</button>
            <button class="btn" type="button" data-preview-draft>Предпросмотр</button>
            <button class="btn" type="button" data-admin-close>Закрыть</button>
          </div>
        </form>
      </div>
    `;
    $('#adminEditorContent').innerHTML = formHTML;
    $('#adminEditorModal').showModal();
    schema.fields.filter((f) => ['images', 'image', 'pdfFiles'].includes(f.type)).forEach((f) => renderFilePreview(f.name, f.type));
  }

  function createDefaultItem(schema, collectionName) {
    const item = { id: `${collectionName}-${Date.now()}`, visible: true };
    schema.fields.forEach((f) => {
      if (item[f.name] !== undefined) return;
      if (f.type === 'checkbox') item[f.name] = false;
      else if (f.type === 'multilang' || f.type === 'multilangTextarea') item[f.name] = { ru: '', bg: '', ka: '', en: '' };
      else if (f.type === 'multilangList') item[f.name] = { ru: [], bg: [], ka: [], en: [] };
      else if (f.type === 'simpleList' || f.type === 'images' || f.type === 'pdfFiles') item[f.name] = [];
      else if (f.type === 'image') item[f.name] = '';
      else if (f.type === 'select') item[f.name] = f.options?.[0]?.[0] || '';
      else if (f.type === 'date') item[f.name] = new Date().toISOString().slice(0, 10);
      else item[f.name] = '';
    });
    if (collectionName === 'cars') item.status = 'available';
    if (collectionName === 'realEstate' || collectionName === 'parkings') item.whatsappContact = 'bulgaria';
    return item;
  }

  function editorFieldHTML(f, item) {
    const value = item[f.name];
    const full = ['multilangTextarea', 'multilangList', 'images', 'pdfFiles', 'simpleList'].includes(f.type) ? ' field--full' : '';
    const hint = f.hint ? `<small class="form-note">${esc(f.hint)}</small>` : '';
    if (f.type === 'checkbox') {
      return `<label class="field admin-switch-field-v228${full}"><span>${esc(f.label)}</span><span class="admin-switch-v228"><input type="checkbox" name="${esc(f.name)}" ${value ? 'checked' : ''}><i></i><b>${value ? 'Да' : 'Нет'}</b></span>${hint}</label>`;
    }
    if (f.type === 'select') {
      return `<label class="field${full}"><span>${esc(f.label)}</span><select name="${esc(f.name)}">${(f.options || []).map(([val, label]) => `<option value="${esc(val)}" ${String(value) === String(val) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>${hint}</label>`;
    }
    if (f.type === 'textarea') {
      return `<label class="field field--full"><span>${esc(f.label)}</span><textarea name="${esc(f.name)}">${esc(value || '')}</textarea>${hint}</label>`;
    }
    if (f.type === 'multilang' || f.type === 'multilangTextarea') {
      const textarea = f.type === 'multilangTextarea';
      return `<div class="field field--full admin-lang-field-v228"><span>${esc(f.label)}</span><div class="lang-tabs lang-tabs-v228"><span>RU</span><span>BG</span><span>KA</span><span>EN</span></div>${langs.map((lng) => textarea ? `<textarea name="${esc(f.name)}.${lng}" placeholder="${lng.toUpperCase()}">${esc(value?.[lng] || '')}</textarea>` : `<input name="${esc(f.name)}.${lng}" placeholder="${lng.toUpperCase()}" value="${esc(value?.[lng] || '')}">`).join('')}${hint}</div>`;
    }
    if (f.type === 'multilangList') {
      return `<div class="field field--full admin-lang-field-v228"><span>${esc(f.label)} <small>каждый пункт с новой строки</small></span><div class="lang-tabs lang-tabs-v228"><span>RU</span><span>BG</span><span>KA</span><span>EN</span></div>${langs.map((lng) => `<textarea name="${esc(f.name)}.${lng}" placeholder="${lng.toUpperCase()}">${esc((value?.[lng] || []).join('\n'))}</textarea>`).join('')}${hint}</div>`;
    }
    if (f.type === 'simpleList') {
      return `<label class="field field--full"><span>${esc(f.label)} <small>каждый пункт с новой строки</small></span><textarea name="${esc(f.name)}">${esc((value || []).join('\n'))}</textarea>${hint}</label>`;
    }
    if (['images', 'image', 'pdfFiles'].includes(f.type)) {
      const multiple = f.type !== 'image';
      fileState[f.name] = f.type === 'image' ? (value ? [value] : []) : (Array.isArray(value) ? value : []);
      return `<div class="field field--full admin-file-field-v228"><span>${esc(f.label)}</span><label class="file-drop-v228">Загрузить файл<input type="file" ${multiple ? 'multiple' : ''} accept="${f.type === 'pdfFiles' ? 'application/pdf' : 'image/*'}" data-file-field="${esc(f.name)}" data-file-type="${esc(f.type)}"></label><div class="file-preview" data-file-preview="${esc(f.name)}"></div>${hint}</div>`;
    }
    return `<label class="field${full}"><span>${esc(f.label)}</span><input type="${f.type === 'date' ? 'date' : 'text'}" name="${esc(f.name)}" value="${esc(value || '')}">${hint}</label>`;
  }

  function collectEditorItem(form) {
    const { collectionName, schema } = editContext;
    const formData = new FormData(form);
    const item = {};
    schema.fields.forEach((f) => {
      if (f.type === 'checkbox') item[f.name] = Boolean(form.elements[f.name]?.checked);
      else if (f.type === 'multilang' || f.type === 'multilangTextarea') {
        item[f.name] = Object.fromEntries(langs.map((lng) => [lng, formData.get(`${f.name}.${lng}`) || '']));
      } else if (f.type === 'multilangList') {
        item[f.name] = Object.fromEntries(langs.map((lng) => [lng, splitLines(formData.get(`${f.name}.${lng}`))]));
      } else if (f.type === 'simpleList') item[f.name] = splitLines(formData.get(f.name));
      else if (f.type === 'images') item[f.name] = fileState[f.name] || [];
      else if (f.type === 'image') item[f.name] = (fileState[f.name] || [])[0] || '';
      else if (f.type === 'pdfFiles') item[f.name] = fileState[f.name] || [];
      else item[f.name] = formData.get(f.name) || '';
    });
    item.id = slug(item.id || getItemTitle(collectionName, item) || `${collectionName}-${Date.now()}`);
    return item;
  }

  function writeEditorItem(targetData, item) {
    const { collectionName, index } = editContext;
    if (!targetData[collectionName]) targetData[collectionName] = [];
    if (index === null) {
      const existingIndex = targetData[collectionName].findIndex((entry) => String(entry.id) === String(item.id));
      if (existingIndex >= 0) targetData[collectionName][existingIndex] = item;
      else targetData[collectionName].unshift(item);
    } else targetData[collectionName][index] = item;
    return targetData;
  }

  async function saveEditor(form, mode = 'publish') {
    const { collectionName } = editContext;
    const item = collectEditorItem(form);
    if (mode === 'draft') {
      const nextDraft = writeEditorItem(mergeDefaults(clone(DEFAULT_DATA), draftData || data), item);
      saveDraftData(nextDraft);
      updateAdminStatus('Черновик сохранён', 'Теперь можно открыть предпросмотр и проверить страницу до публикации.');
      toast('Черновик сохранён. Нажмите “Посмотреть”, чтобы увидеть его на сайте.');
      return;
    }
    data = writeEditorItem(data, item);
    const published = await saveData();
    if (!published) { toast('Изменение не опубликовано: сервер не подтвердил сохранение.'); return; }
    if (collectionName === 'reviews' && window.DFG_BACKEND?.isConfigured()) window.DFG_BACKEND.saveReview(item).catch((error) => console.warn('Remote review save failed', error));
    draftData = clone(data);
    saveDraftData(draftData);
    $('#adminEditorModal').close();
    renderCollection(collectionName);
    updateAdminStatus('Опубликовано', 'Production-сервер подтверждает публикацию. Изменения доступны всем устройствам.');
    toast('Опубликовано на production-сервере. Изменения доступны всем устройствам.');
  }

  function previewEditor(form) {
    const { collectionName } = editContext;
    const item = collectEditorItem(form);
    const nextDraft = writeEditorItem(mergeDefaults(clone(DEFAULT_DATA), draftData || data), item);
    saveDraftData(nextDraft);
    openDraftPreview(previewPageFor(collectionName, item));
  }

  function previewPageFor(collectionName, item = null) {
    const map = {
      sitePages: item?.filename || 'index.html',
      services: 'services.html',
      blogTopics: 'blog.html',
      realEstate: 'real-estate.html',
      cars: 'cars.html',
      parkings: 'parking.html',
      b2bOffers: 'b2b.html',
      promotions: 'index.html',
      blogArticles: 'blog.html',
      reviews: 'reviews.html',
      socialLinks: 'contacts.html',
      contacts: 'contacts.html',
      homeBlocks: 'index.html',
      seo: 'index.html'
    };
    const page = map[collectionName] || 'index.html';
    return item?.id && ['services'].includes(collectionName) ? `${page}#${encodeURIComponent(item.id)}` : page;
  }

  function openDraftPreview(page = 'index.html') {
    saveDraftData(draftData || data);
    const url = new URL(page, location.href);
    url.searchParams.set('preview', 'draft');
    window.open(url.href, '_blank', 'noopener');
  }

  function draftStatusHTML() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return 'черновик ещё не создан';
    try {
      const parsed = JSON.parse(saved);
      return `обновлён ${new Date(parsed.updatedAt || Date.now()).toLocaleString()}`;
    } catch {
      return 'черновик есть';
    }
  }

  async function duplicateItem(collectionName, index) {
    const copy = clone(data[collectionName][index]);
    copy.id = slug(`${copy.id || collectionName}-copy-${Date.now()}`);
    if (copy.title && typeof copy.title === 'object') copy.title.ru = `${copy.title.ru || copy.id} — копия`;
    data[collectionName].splice(index + 1, 0, copy);
    const published = await saveData();
    if (!published) { toast('Изменение не опубликовано: сервер не подтвердил сохранение.'); return; }
    if (collectionName === 'reviews' && window.DFG_BACKEND?.isConfigured()) window.DFG_BACKEND.saveReview(copy).catch((error) => console.warn('Remote review save failed', error));
    draftData = clone(data);
    saveDraftData(draftData);
    renderCollection(collectionName);
    toast('Копия создана');
  }

  async function deleteItem(collectionName, index) {
    if (!confirm('Удалить запись?')) return;
    const removed = data[collectionName][index];
    data[collectionName].splice(index, 1);
    const published = await saveData();
    if (!published) { toast('Изменение не опубликовано: сервер не подтвердил сохранение.'); return; }
    if (collectionName === 'reviews' && removed?.id && window.DFG_BACKEND?.isConfigured()) window.DFG_BACKEND.deleteReview(removed.id).catch((error) => console.warn('Remote review delete failed', error));
    draftData = clone(data);
    saveDraftData(draftData);
    renderCollection(collectionName);
    toast('Удалено');
  }

  async function toggleVisible(collectionName, index) {
    const item = data[collectionName][index];
    item.visible = item.visible === false;
    const published = await saveData();
    if (!published) { toast('Изменение не опубликовано: сервер не подтвердил сохранение.'); return; }
    if (collectionName === 'reviews' && window.DFG_BACKEND?.isConfigured()) window.DFG_BACKEND.saveReview(item).catch((error) => console.warn('Remote review save failed', error));
    draftData = clone(data);
    saveDraftData(draftData);
    renderCollection(collectionName);
  }

  function renderContactsEditor() {
    const contacts = data.settings.contacts || {};
    $('#adminContent').innerHTML = `
      <form class="admin-card admin-card-v228" data-contacts-form>
        <div class="admin-panel-title admin-panel-title-v228"><div><p class="eyebrow">Связь</p><h2>Контакты и WhatsApp</h2><small class="form-note">Поля подписаны понятно. Меняйте только то, что должно отображаться на сайте.</small></div></div>
        <div class="admin-contact-grid-v228">
          ${Object.entries(contacts).map(([key, contact]) => contactGroupHTML(key, contact)).join('')}
        </div>
        <details class="admin-details-v228"><summary>Безопасность админ-панели</summary><div class="admin-note-v228"><strong>Пароль больше не хранится во frontend.</strong><br>Для изменения доступа поменяйте DFG_ADMIN_PASSWORD в .env.production.local на сервере и перезапустите backend.</div></details>
        <div class="admin-actions admin-editor-actions-v228"><button class="btn btn--primary" type="submit">Сохранить контакты</button><button class="btn btn--ghost" type="button" data-contacts-save-draft>Сохранить черновик</button><button class="btn" type="button" data-contacts-preview-draft>Предпросмотр</button></div>
      </form>
    `;
  }

function contactGroupHTML(key, contact) {
    const labels = { title: 'Название', country: 'Страна', phone: 'Телефон', whatsapp: 'WhatsApp', email: 'Email', website: 'Сайт' };
    const fields = ['title', 'country', 'phone', 'whatsapp', 'email', 'website'];
    return `<section class="admin-contact-card-v228"><h3>${esc(contact.title || key)}</h3><div class="admin-form-grid admin-form-grid-v228">${fields.map((name) => `<label class="field"><span>${esc(labels[name] || name)}</span><input name="contacts.${esc(key)}.${esc(name)}" value="${esc(contact[name] || '')}"></label>`).join('')}</div></section>`;
  }

  function applyContactsFormTo(targetData, form) {
    const formData = new FormData(form);
    if (!targetData.settings) targetData.settings = {};
    if (!targetData.settings.contacts) targetData.settings.contacts = clone(data.settings.contacts || {});
    Object.keys(targetData.settings.contacts || {}).forEach((key) => {
      ['title', 'country', 'phone', 'whatsapp', 'email', 'website'].forEach((name) => {
        targetData.settings.contacts[key][name] = formData.get(`contacts.${key}.${name}`) || '';
      });
    });
    return targetData;
  }

  function saveContacts(form) {
    data = applyContactsFormTo(data, form);
    saveData();
    draftData = clone(data);
    saveDraftData(draftData);
    updateAdminStatus('Контакты опубликованы', 'Кнопки связи и контакты обновлены.');
    toast('Контакты опубликованы');
  }

  function renderHomeBlocksEditor() {
    const blocks = (data.homeBlocks || []).map((block, originalIndex) => ({ ...block, originalIndex })).sort((a,b) => a.order - b.order);
    $('#adminContent').innerHTML = `
      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228"><div><p class="eyebrow">Главная страница</p><h2>Порядок блоков</h2><small class="form-note">Поменяйте порядок, скройте блок или удалите ненужный блок с главной.</small></div><button class="btn btn--primary" data-save-all>Сохранить порядок</button></div>
        <div class="admin-block-list-v228">
          ${blocks.map((block) => `
            <div class="admin-block-item-v228">
              <div><strong>${esc(block.title || block.id)}</strong><small>${esc(block.id || '')}</small></div>
              <label class="field"><span>Порядок</span><input type="number" value="${esc(block.order)}" data-block-field="order" data-index="${block.originalIndex}"></label>
              <label class="admin-switch-field-v228"><span>Показывать</span><span class="admin-switch-v228"><input type="checkbox" ${block.visible !== false ? 'checked' : ''} data-block-field="visible" data-index="${block.originalIndex}"><i></i><b>${block.visible !== false ? 'Да' : 'Нет'}</b></span></label>
              <button class="btn btn--small btn-danger-v228" data-delete-block data-index="${block.originalIndex}" type="button">Удалить</button>
            </div>`).join('') || '<p class="admin-empty-v228">Блоков нет.</p>'}
        </div>
      </div>
    `;
  }

  function deleteHomeBlock(index) {
    if (!data.homeBlocks || !data.homeBlocks[index]) return;
    const block = data.homeBlocks[index];
    if (!confirm(`Удалить блок «${block.title || block.id}» с главной страницы?`)) return;
    if (!data.settings) data.settings = {};
    if (!Array.isArray(data.settings.deletedBlocks)) data.settings.deletedBlocks = [];
    if (block.id && !data.settings.deletedBlocks.includes(block.id)) data.settings.deletedBlocks.push(block.id);
    data.homeBlocks.splice(index, 1);
    saveData();
    draftData = clone(data);
    saveDraftData(draftData);
    renderHomeBlocksEditor();
    toast('Блок удалён с главной страницы');
  }

  function updateBlockField(input, persist = true) {
    const index = Number(input.dataset.index);
    const fieldName = input.dataset.blockField;
    if (!data.homeBlocks[index]) return;
    data.homeBlocks[index][fieldName] = fieldName === 'visible' ? input.checked : Number(input.value);
    if (persist) {
      saveData();
      draftData = clone(data);
      saveDraftData(draftData);
      toast('Порядок блоков обновлён');
    }
  }

  function renderSeoEditor() {
    const seo = data.settings.seo || {};
    $('#adminContent').innerHTML = `
      <form class="admin-card admin-card-v228" data-seo-form>
        <div class="admin-panel-title admin-panel-title-v228"><div><p class="eyebrow">Поиск</p><h2>SEO настройки</h2><small class="form-note">Заполняется один раз. Не меняйте без необходимости.</small></div></div>
        <div class="admin-form-grid admin-form-grid-v228">
          ${multiInput('title', 'Заголовок страницы', seo.title, false)}
          ${multiInput('description', 'Описание для поиска', seo.description, true)}
          <label class="field field--full"><span>Ключевые слова</span><textarea name="keywords">${esc(seo.keywords || '')}</textarea></label>
          <label class="field"><span>Google Analytics ID</span><input name="googleAnalyticsId" placeholder="G-XXXXXXXXXX" value="${esc(seo.googleAnalyticsId || '')}"></label>
          <label class="field"><span>Google Search Console</span><input name="googleSearchConsoleCode" placeholder="meta verification" value="${esc(seo.googleSearchConsoleCode || '')}"></label>
        </div>
        <div class="admin-actions admin-editor-actions-v228"><button class="btn btn--primary" type="submit">Сохранить SEO</button></div>
      </form>
    `;
  }

  function multiInput(name, label, value = {}, textarea = false) {
    return `<div class="field field--full"><span>${esc(label)}</span><div class="lang-tabs"><span>RU</span><span>BG</span><span>KA</span><span>EN</span></div>${langs.map((lng) => textarea ? `<textarea name="${name}.${lng}">${esc(value?.[lng] || '')}</textarea>` : `<input name="${name}.${lng}" value="${esc(value?.[lng] || '')}">`).join('')}</div>`;
  }

  function saveSeo(form) {
    const formData = new FormData(form);
    data.settings.seo.title = Object.fromEntries(langs.map((lng) => [lng, formData.get(`title.${lng}`) || '']));
    data.settings.seo.description = Object.fromEntries(langs.map((lng) => [lng, formData.get(`description.${lng}`) || '']));
    data.settings.seo.keywords = formData.get('keywords') || '';
    data.settings.seo.googleAnalyticsId = formData.get('googleAnalyticsId') || '';
    data.settings.seo.googleSearchConsoleCode = formData.get('googleSearchConsoleCode') || '';
    saveData();
    toast('SEO сохранено');
  }


  function renderIntegrationsEditor() {
    const integrations = data.settings.integrations || {};
    $('#adminContent').innerHTML = `
      <form class="admin-card admin-card-v228" data-integrations-form>
        <div class="admin-panel-title admin-panel-title-v228"><div><p class="eyebrow">Технический раздел</p><h2>Интеграции</h2><small class="form-note">Для обычного клиента достаточно статуса ниже. Остальное трогать не нужно.</small></div></div>
        <div class="admin-integration-status-v228 ${window.DFG_BACKEND?.isConfigured() ? 'is-on' : ''}">
          <strong>${window.DFG_BACKEND?.isConfigured() ? 'Remote publishing включён' : 'Remote publishing не настроен'}</strong>
          <span>${window.DFG_BACKEND?.isConfigured() ? 'Админка публикует в общий backend/Supabase. Изменения видны всем устройствам.' : 'Локальный демо-режим отключён: подключи Supabase или production backend.'}</span>
        </div>
        <details class="admin-details-v228" open><summary>Настройки заявок</summary>
          <div class="admin-form-grid admin-form-grid-v228">
            <label class="field"><span>Webhook</span><select name="leadWebhookEnabled"><option value="false" ${integrations.leadWebhookEnabled ? '' : 'selected'}>Выключен</option><option value="true" ${integrations.leadWebhookEnabled ? 'selected' : ''}>Включен</option></select></label>
            <label class="field field--full"><span>Webhook URL</span><input name="leadWebhookUrl" placeholder="https://hook..." value="${esc(integrations.leadWebhookUrl || '')}"></label>
            <label class="field"><span>Email уведомлений</span><input name="notificationEmail" value="${esc(integrations.notificationEmail || data.settings.contacts?.bulgaria?.email || '')}"></label>
            <label class="field"><span>WhatsApp для заявок</span><select name="whatsappLeadContact"><option value="bulgaria" ${integrations.whatsappLeadContact === 'bulgaria' ? 'selected' : ''}>Bulgaria</option><option value="dubai" ${integrations.whatsappLeadContact === 'dubai' ? 'selected' : ''}>Dubai</option><option value="uzbekistan" ${integrations.whatsappLeadContact === 'uzbekistan' ? 'selected' : ''}>Uzbekistan</option></select></label>
            <label class="field field--full"><span>Заметка</span><textarea name="notes">${esc(integrations.notes || '')}</textarea></label>
          </div>
        </details>
        <div class="admin-actions admin-editor-actions-v228"><button class="btn btn--primary" type="submit">Сохранить интеграции</button><button class="btn btn--ghost" type="button" data-refresh-remote>Синхронизировать</button></div>
      </form>
    `;
  }

  function saveIntegrations(form) {
    const formData = new FormData(form);
    if (!data.settings.integrations) data.settings.integrations = {};
    data.settings.integrations.leadWebhookEnabled = formData.get('leadWebhookEnabled') === 'true';
    data.settings.integrations.leadWebhookUrl = formData.get('leadWebhookUrl') || '';
    data.settings.integrations.notificationEmail = formData.get('notificationEmail') || '';
    data.settings.integrations.whatsappLeadContact = formData.get('whatsappLeadContact') || 'bulgaria';
    data.settings.integrations.notes = formData.get('notes') || '';
    saveData();
    toast('Интеграции сохранены');
  }

  function renderLeads() {
    const leads = loadLeads();
    $('#adminContent').innerHTML = `
      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228">
          <div><p class="eyebrow">Клиенты</p><h2>Заявки</h2><small class="form-note">Статистика считается только по реальным заявкам из CRM: локально из браузера или из Supabase, если он подключён.</small></div>
          <div class="admin-actions admin-actions-clean-v228">
            <button class="btn btn--ghost" data-refresh-leads>Обновить</button>
            <button class="btn btn--ghost" data-export-leads>CSV</button>
            <button class="btn btn-danger-v228" data-clear-leads>Очистить</button>
          </div>
        </div>
        ${renderLeadStats(leads)}
        <div class="admin-note-v228 admin-note-compact-v282"><strong>Важно:</strong> “Сегодня” считается с 00:00 текущего дня. “Неделя” — последние 7 дней. “Месяц” — с 1 числа текущего месяца. “Год” — с 1 января. Рандомных данных здесь нет.</div>
        ${leadsTable(leads)}
      </div>
    `;
    if (window.DFG_BACKEND?.isConfigured() && !leadsSyncedOnce && !syncingLeads) syncLeadsFromRemote(true);
    syncReviewsFromRemote(true);
  }

function publishJournalHTML() {
    let journal = [];
    try { journal = JSON.parse(localStorage.getItem('dfg_publish_journal_v289') || '[]'); } catch (error) { journal = []; }
    if (!journal.length) return '<p class="admin-empty-v228">Публикаций в этой админ-сессии пока нет.</p>';
    return `<div class="admin-table-wrap admin-table-wrap-v228"><table class="admin-table admin-table-v228"><thead><tr><th>Время</th><th>Тип</th><th>Статус</th></tr></thead><tbody>${journal.slice(0, 8).map((item) => `<tr><td>${esc(new Date(item.at).toLocaleString())}</td><td>${esc(item.kind)}</td><td><strong>${esc(item.status === 'success' ? 'Опубликовано на сервере' : 'Ошибка публикации')}</strong></td></tr>`).join('')}</tbody></table></div>`;
  }

function leadsTable(leads) {
    if (!leads.length) return '<p class="admin-empty-v228">Пока нет заявок. Отправьте тестовую форму на сайте — заявка появится здесь.</p>';
    return `<div class="admin-table-wrap admin-table-wrap-v228"><table class="admin-table admin-table-v228"><thead><tr><th>Дата</th><th>Клиент</th><th>Тип</th><th>Детали</th><th>Статус</th><th>Доставка</th><th></th></tr></thead><tbody>${leads.map((lead) => `
      <tr>
        <td>${esc(new Date(lead.createdAt).toLocaleString())}<br><small>${esc(lead.data?.preferredDate || lead.data?.dates || '')} ${esc(lead.data?.preferredTime || '')}</small></td>
        <td><strong>${esc(lead.data?.name || 'Без имени')}</strong><small>${esc(lead.data?.phone || '')}${lead.data?.email ? ' · ' + esc(lead.data.email) : ''}</small></td>
        <td>${esc(lead.type || 'заявка')}</td>
        <td>${esc(Object.entries(lead.data || {}).filter(([k]) => !['name','phone','email','preferredDate','preferredTime'].includes(k)).map(([k,v]) => `${k}: ${v}`).join(' | ') || '—')}</td>
        <td><select data-lead-status="${esc(lead.id)}"><option value="new" ${lead.status === 'new' ? 'selected' : ''}>Новая</option><option value="in_progress" ${lead.status === 'in_progress' ? 'selected' : ''}>В работе</option><option value="done" ${lead.status === 'done' ? 'selected' : ''}>Готово</option></select></td>
        <td><small>${esc(lead.deliveryStatus || 'server_saved')}</small>${lead.deliveryError ? `<br><small>${esc(lead.deliveryError)}</small>` : ''}</td>
        <td><button class="btn btn--small btn-danger-v228" data-delete-lead="${esc(lead.id)}">Удалить</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function loadLeads() {
    try { return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); }
    catch { return []; }
  }

  async function syncLeadsFromRemote(silent = false) {
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return;
    syncingLeads = true;
    try {
      const leads = await window.DFG_BACKEND.listLeads();
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
      leadsSyncedOnce = true;
      if (activeTab === 'leads' || activeTab === 'dashboard') renderActiveTab();
      if (!silent) toast('CRM обновлена из Supabase');
    } catch (error) {
      console.warn('Supabase leads sync failed', error);
      if (!silent) toast('Не удалось обновить CRM из Supabase');
    } finally {
      syncingLeads = false;
    }
  }


  async function syncReviewsFromRemote(silent = false) {
    if (!window.DFG_BACKEND || !window.DFG_BACKEND.isConfigured()) return;
    try {
      const reviews = await window.DFG_BACKEND.listReviews();
      data.reviews = reviews;
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      saveDraftData(data);
      if (activeTab === 'reviews' || activeTab === 'dashboard') renderActiveTab();
      if (!silent) toast('Отзывы обновлены из Supabase');
    } catch (error) {
      console.warn('Supabase reviews sync failed', error);
      if (!silent) toast('Отзывы: Supabase недоступен, работаем локально');
    }
  }

  function updateLeadStatus(id, status) {
    const leads = loadLeads();
    const lead = leads.find((item) => item.id === id);
    if (lead) lead.status = status;
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    if (window.DFG_BACKEND?.isConfigured()) {
      window.DFG_BACKEND.updateLeadStatus(id, status).catch((error) => console.warn('Remote lead status failed', error));
    }
    toast('Статус заявки обновлён');
  }

  function exportLeadsCsv() {
    const leads = loadLeads();
    const rows = [['createdAt', 'bookingDate', 'bookingTime', 'type', 'status', 'name', 'phone', 'email', 'details']].concat(leads.map((lead) => [
      lead.createdAt, lead.data?.preferredDate || lead.data?.dates || '', lead.data?.preferredTime || '', lead.type, lead.status, lead.data?.name || '', lead.data?.phone || '', lead.data?.email || '', JSON.stringify(lead.data || {})
    ]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob('dianafarm-crm-leads.csv', csv, 'text/csv;charset=utf-8');
  }

  function renderBackup() {
    $('#adminContent').innerHTML = `
      <div class="admin-card admin-card-v228">
        <div class="admin-panel-title admin-panel-title-v228"><div><p class="eyebrow">Безопасность</p><h2>Резервная копия</h2><small class="form-note">Перед крупными правками скачайте backup. Потом его можно загрузить обратно.</small></div></div>
        <div class="admin-actions admin-editor-actions-v228">
          <button class="btn btn--primary" data-export-data>Скачать backup JSON</button>
          <label class="btn btn--ghost">Загрузить JSON<input id="importDataFile" type="file" accept="application/json" style="display:none"></label>
          <button class="btn btn-danger-v228" data-reset-data>Сбросить сайт</button>
        </div>
      </div>
      <div class="admin-note-v228"><strong>Важно:</strong> это статическая админ-панель. Для единой работы нескольких менеджеров используйте Supabase во вкладке “Интеграции”.</div>
    `;
  }

  async function handleFileInput(input) {
    const fieldName = input.dataset.fileField;
    const fieldType = input.dataset.fileType;
    const files = Array.from(input.files || []);
    if (!fieldName || !files.length) return;
    if (!fileState[fieldName]) fileState[fieldName] = [];
    const multiple = fieldType !== 'image';
    const accepted = fieldType === 'pdfFiles' ? ['application/pdf'] : ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 8 * 1024 * 1024;
    const nextValues = [];
    for (const file of files) {
      if (!accepted.includes(file.type)) {
        toast(fieldType === 'pdfFiles' ? 'Разрешены только PDF-файлы' : 'Разрешены только JPG, PNG и WebP');
        continue;
      }
      if (file.size > maxBytes) {
        toast('Файл слишком большой. Максимум 8 MB.');
        continue;
      }
      try {
        const uploaded = await uploadAdminMedia(file);
        nextValues.push(uploaded.path || uploaded.url || uploaded);
      } catch (error) {
        console.warn('Media upload failed', error);
        toast('Файл не опубликован: серверная загрузка не удалась. Local/base64 fallback запрещён.');
        continue;
      }
    }
    fileState[fieldName] = multiple ? fileState[fieldName].concat(nextValues) : nextValues.slice(0, 1);
    renderFilePreview(fieldName, fieldType);
    input.value = '';
  }

  async function uploadAdminMedia(file) {
    if (!window.DFG_BACKEND?.uploadMedia || !window.DFG_BACKEND?.isConfigured || !window.DFG_BACKEND.isConfigured()) {
      throw new Error('Production media upload is required. Base64 fallback is disabled in v289.');
    }
    const uploaded = await window.DFG_BACKEND.uploadMedia(file);
    if (uploaded && uploaded.path) return uploaded;
    throw new Error('Production server did not return uploaded file path.');
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });
  }

  function renderFilePreview(fieldName, fieldType) {
    const box = document.querySelector(`[data-file-preview="${cssEscape(fieldName)}"]`);
    if (!box) return;
    const values = fileState[fieldName] || [];
    if (!values.length) {
      box.innerHTML = '<small class="form-note">Файлы не загружены.</small>';
      return;
    }
    box.innerHTML = values.map((value, index) => {
      const isPdf = fieldType === 'pdfFiles' || String(value).toLowerCase().includes('.pdf');
      const preview = isPdf
        ? `<a class="admin-file-link-v284" href="${esc(value)}" target="_blank" rel="noopener">PDF-файл ${index + 1}</a>`
        : `<img src="${esc(value)}" alt="Превью ${index + 1}" loading="lazy" decoding="async">`;
      return `<div class="file-preview-item-v284">${preview}<button type="button" class="btn btn--ghost" data-remove-file="${esc(fieldName)}" data-file-type="${esc(fieldType)}" data-index="${index}">Удалить</button></div>`;
    }).join('');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result);
        data = mergeDefaults(clone(DEFAULT_DATA), imported);
        await saveData();
        renderActiveTab();
        toast('Данные импортированы');
      } catch (error) {
        toast('Ошибка импорта JSON');
      }
    };
    reader.readAsText(file);
  }

  function saveContactsObject() {}

  function splitLines(value) {
    return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
  }

  function slug(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\-\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || `item-${Date.now()}`;
  }

  function text(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return value.ru || value.bg || value.en || Object.values(value)[0] || '';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function cssEscape(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function toast(message) {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
})();


/* v219AdminPremiumController: visual clarity and button accountability */
(function v219AdminPremiumController(){
  function actionName(el){
    if(el.matches('[data-save-all]')) return 'Публикация сайта';
    if(el.matches('[data-preview-site], [data-preview-item], [data-preview-draft]')) return 'Предпросмотр';
    if(el.matches('[data-add]')) return 'Добавление записи';
    if(el.matches('[data-edit]')) return 'Редактирование';
    if(el.matches('[data-duplicate]')) return 'Создание копии';
    if(el.matches('[data-toggle-visible]')) return 'Скрытие / показ';
    if(el.matches('[data-delete], [data-delete-lead]')) return 'Удаление';
    if(el.matches('[data-export-data], [data-export-leads]')) return 'Экспорт файла';
    if(el.matches('[data-refresh-leads], [data-refresh-remote]')) return 'Обновление данных';
    if(el.matches('[data-reset-data], [data-reset-draft], [data-clear-leads]')) return 'Сброс / очистка';
    if(el.matches('[data-publish-draft]')) return 'Публикация черновика';
    if(el.matches('[data-save-draft], [data-contacts-save-draft]')) return 'Сохранение черновика';
    if(el.matches('[data-admin-tab]')) return 'Переход в раздел';
    return el.textContent.trim() || 'Действие';
  }
  function status(text, note){
    const box = document.getElementById('adminLiveStatus');
    if(!box) return;
    const b = box.querySelector('b');
    const small = box.querySelector('small');
    if(b) b.textContent = text;
    if(small) small.textContent = note || 'Кнопка обработана. Действие доступно в текущем разделе.';
  }
  function enhance(){
    if(!document.body.classList.contains('admin-body')) return;
    document.querySelectorAll('button, .btn').forEach((btn)=>{
      const name = actionName(btn);
      btn.setAttribute('title', name);
      btn.setAttribute('aria-label', name);
      if(!btn.dataset.v219AdminBound){
        btn.dataset.v219AdminBound = '1';
        btn.addEventListener('click', ()=>{
          status(name, 'Выполняю действие: ' + name);
        }, {capture:true});
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance); else enhance();
  document.addEventListener('click', ()=>setTimeout(enhance, 80), true);
})();
