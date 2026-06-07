(function(){
  'use strict';

  const LABELS = {
    realestate: ['PROPERTY GATEWAY', 'BULGARIA · SEA REAL ESTATE'],
    uae: ['UAE GATEWAY', 'COMPANY · LICENSES · BANKS'],
    asia: ['ASIA GATEWAY', 'UZBEKISTAN · LOGISTICS · TRADE'],
    blog: ['BUSINESS JOURNAL', 'ANALYTICS · CHECKLISTS · ROUTES'],
    global: ['GLOBAL GATEWAY', 'BULGARIA · UAE · ASIA']
  };

  function make(stage){
    if(stage.dataset.v263Ready === 'true') return;
    stage.dataset.v263Ready = 'true';
    stage.innerHTML = '';

    const theme = String(stage.dataset.v238Scene || 'global').toLowerCase();
    const copy = LABELS[theme] || LABELS.global;

    const wrap = document.createElement('div');
    wrap.className = 'v263-gateway';
    wrap.innerHTML = `
      <div class="v263-bg"></div>
      <div class="v263-grid"></div>

      <div class="v263-orbit v263-orbit--one"></div>
      <div class="v263-orbit v263-orbit--two"></div>
      <div class="v263-orbit v263-orbit--three"></div>

      <div class="v263-route v263-route--a"></div>
      <div class="v263-route v263-route--b"></div>
      <div class="v263-route v263-route--c"></div>
      <div class="v263-route v263-route--d"></div>

      <div class="v263-globe" aria-hidden="true">
        <div class="v263-globe__halo"></div>
        <div class="v263-globe__surface"></div>
        <div class="v263-globe__grid"></div>
        <div class="v263-globe__shine"></div>
        <span class="v263-region v263-region--uae">UAE</span>
        <span class="v263-region v263-region--asia">ASIA</span>
      </div>

      <div class="v263-object v263-passport"><i></i><span>PASSPORT</span></div>
      <div class="v263-object v263-key"><i></i></div>
      <div class="v263-object v263-card"><i></i><strong>DIANAFARM</strong><span>4821 · 9076</span></div>
      <div class="v263-object v263-doc"><i></i><b>OK</b></div>
      <div class="v263-object v263-container"><i></i><i></i><i></i></div>

      <div class="v263-panel">
        <small>GLOBAL GATEWAY</small>
        <strong>${copy[0]}</strong>
        <span>${copy[1]}</span>
      </div>

      <div class="v263-brand"><i>D</i><div><strong>DIANAFARM GROUP</strong><span>BULGARIA · UAE · ASIA</span></div></div>
    `;
    stage.appendChild(wrap);
  }

  function init(){
    document.querySelectorAll('[data-v238-scene]').forEach(make);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();