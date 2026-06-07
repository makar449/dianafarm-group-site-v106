
/* v279 polish for the real admin engine.
   Does not render demo data. It only improves mobile menu, file-preview safety and status clarity. */
(function(){
  'use strict';

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function closeMobileOnNav(event){
    if(event.target.closest('[data-admin-tab]')){
      document.body.classList.remove('admin-mobile-open-v279');
    }
  }

  function bind(){
    document.addEventListener('click', function(event){
      if(event.target.closest('[data-admin-mobile-toggle]')){
        document.body.classList.toggle('admin-mobile-open-v279');
        return;
      }
      closeMobileOnNav(event);
    }, true);

    document.addEventListener('keydown', function(event){
      if(event.key === 'Escape') document.body.classList.remove('admin-mobile-open-v279');
    });
  }

  function improveGeneratedContent(){
    // Ensure generated admin buttons do not accidentally submit outer forms unless explicitly intended.
    qsa('#adminContent button:not([type])').forEach(btn => {
      if(!btn.closest('form')) btn.type = 'button';
    });

    // Mark empty/broken image previews cleanly, but don't touch real uploaded images.
    qsa('.file-preview img').forEach(img => {
      img.addEventListener('error', function(){
        const box = img.closest('.file-preview > div') || img.parentElement;
        if(box && !box.dataset.brokenHandled){
          box.dataset.brokenHandled = '1';
          box.innerHTML = '<div style="min-height:84px;display:grid;place-items:center;border-radius:7px;background:rgba(255,255,255,.03);color:rgba(248,234,214,.58);font-size:12px;text-align:center;padding:10px">Файл не найден. Загрузите фото заново.</div>';
        }
      }, {once:true});
    });

    // Add semantic label to stats for accessibility.
    qsa('.stat-card strong').forEach(strong => {
      const card = strong.closest('.stat-card');
      if(card && !card.getAttribute('aria-label')){
        card.setAttribute('aria-label', card.textContent.trim().replace(/\s+/g,' '));
      }
    });
  }

  function observe(){
    const content = qs('#adminContent');
    if(!content) return;
    improveGeneratedContent();
    new MutationObserver(function(){
      requestAnimationFrame(improveGeneratedContent);
    }).observe(content, {childList:true, subtree:true});
  }

  document.addEventListener('DOMContentLoaded', function(){
    bind();
    observe();
  });
})();
