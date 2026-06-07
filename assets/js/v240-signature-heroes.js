(function(){
  const page = document.body?.dataset?.page || '';
  const enabledPages = new Set([
    'services',
    'service-residence-bg',
    'service-company-registration-eu',
    'service-banks-accounts',
    'service-supplements-registration',
    'service-cosmetics-registration',
    'service-pharma-consulting',
    'service-nostrification',
    'service-international-trade',
    'service-turnkey-consulting'
  ]);
  if(!enabledPages.has(page)) return;

  const hero = document.querySelector('.v9-page-hero');
  if(!hero) return;

  hero.classList.add('hero-signature', 'is-ready');

  if(!hero.querySelector('.hero-signature__grain')){
    const grain = document.createElement('div');
    grain.className = 'hero-signature__grain';
    grain.setAttribute('aria-hidden', 'true');
    hero.insertBefore(grain, hero.firstChild);
  }

  const oldScene = hero.querySelector('.hero-signature__scene');
  if(oldScene) oldScene.remove();
})();
