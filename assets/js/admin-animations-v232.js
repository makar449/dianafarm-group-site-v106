(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(selector, root = document) { return root.querySelector(selector); }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  function setPointerGlow(event) {
    if (!document.body.classList.contains('admin-body--v232')) return;
    document.documentElement.style.setProperty('--admin-mx', `${event.clientX}px`);
    document.documentElement.style.setProperty('--admin-my', `${event.clientY}px`);
  }

  function stagger(nodes, base = 34) {
    nodes.forEach((node, index) => {
      if (node.dataset.v232MotionReady) return;
      node.dataset.v232MotionReady = '1';
      node.style.setProperty('--v232-delay', `${Math.min(index * base, 520)}ms`);
      node.classList.add('v232-motion-in');
    });
  }

  function enhanceContent(root = document) {
    if (prefersReducedMotion || !document.body.classList.contains('admin-body--v232')) return;
    stagger(qsa('.admin-welcome-v228, .admin-card, .stat-card, .admin-note-v228', root), 52);
    stagger(qsa('.admin-table tbody tr', root), 24);
    stagger(qsa('.admin-quick-v228 .btn, .admin-guide-v228 span, .row-actions .btn', root), 30);
    stagger(qsa('.admin-form-grid .field, .admin-lang-field-v228, .admin-file-field-v228', root), 18);
  }

  function pulseSaved(button) {
    if (!button || prefersReducedMotion) return;
    button.classList.remove('v232-save-pulse');
    void button.offsetWidth;
    button.classList.add('v232-save-pulse');
    const rect = button.getBoundingClientRect();
    for (let i = 0; i < 7; i += 1) {
      const spark = document.createElement('i');
      spark.className = 'v232-spark';
      spark.style.left = `${rect.left + rect.width * (0.18 + Math.random() * 0.64)}px`;
      spark.style.top = `${rect.top + rect.height * (0.20 + Math.random() * 0.58)}px`;
      spark.style.setProperty('--dx', `${(Math.random() - 0.5) * 72}px`);
      spark.style.setProperty('--dy', `${-28 - Math.random() * 44}px`);
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 850);
    }
  }

  function ripple(event) {
    const button = event.target.closest('.admin-body--v232 .btn, .admin-body--v232 .admin-nav button, .admin-body--v232 button');
    if (!button || prefersReducedMotion || button.closest('.file-drop-v228')) return;
    const rect = button.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'v232-ripple';
    const size = Math.max(rect.width, rect.height) * 1.35;
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${event.clientX - rect.left - size / 2}px`;
    wave.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(wave);
    setTimeout(() => wave.remove(), 620);
  }

  function bind() {
    document.body.classList.add('admin-body--v232', 'admin-motion-ready-v232');
    enhanceContent();

    const content = qs('#adminContent');
    if (content) {
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) enhanceContent(node);
        }));
        enhanceContent(content);
      }).observe(content, { childList: true, subtree: true });
    }

    const editor = qs('#adminEditorContent');
    if (editor) {
      new MutationObserver(() => enhanceContent(editor)).observe(editor, { childList: true, subtree: true });
    }

    document.addEventListener('pointermove', setPointerGlow, { passive: true });
    document.addEventListener('click', ripple, true);
    document.addEventListener('click', (event) => {
      const saveButton = event.target.closest('[data-save-all], [data-publish-draft], [data-save-draft], .admin-editor-actions-v228 .btn--primary');
      if (saveButton) pulseSaved(saveButton);
    }, true);

    document.addEventListener('focusin', (event) => {
      const field = event.target.closest('.admin-body--v232 .field, .admin-body--v232 .admin-lang-field-v228, .admin-body--v232 .admin-file-field-v228');
      if (field) field.classList.add('v232-field-active');
    });
    document.addEventListener('focusout', (event) => {
      const field = event.target.closest('.admin-body--v232 .field, .admin-body--v232 .admin-lang-field-v228, .admin-body--v232 .admin-file-field-v228');
      if (field) field.classList.remove('v232-field-active');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
