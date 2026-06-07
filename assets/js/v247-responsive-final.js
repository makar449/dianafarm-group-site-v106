(function(){
  'use strict';
  try{ if('scrollRestoration' in history) history.scrollRestoration = 'manual'; }catch(e){}

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }

  function stabilize(){
    document.documentElement.style.overflowX = 'hidden';
    if(document.body){ document.body.style.overflowX = 'hidden'; }
    var loader = document.getElementById('pageLoader');
    if(loader){
      window.setTimeout(function(){
        loader.classList.add('is-hidden');
        loader.style.pointerEvents='none'; loader.style.opacity='0'; loader.style.visibility='hidden'; loader.style.display='none';
      }, 120);
    }
    document.querySelectorAll('.cards-grid, .object-grid, .blog-grid, .blog-grid--v9, .location-grid, .v10-page-proof, .v9-why-cta, .v238-motion-section').forEach(function(node){
      node.style.contentVisibility = 'visible';
      node.style.containIntrinsicSize = 'auto';
    });
    document.querySelectorAll('img').forEach(function(img){
      img.decoding = 'async';
      if(!img.classList.contains('v238-hero-photo') && !img.hasAttribute('loading')) img.loading = 'lazy';
    });
  }

  function fixDuplicateLabels(){
    document.querySelectorAll('a[href="real-estate.html"]').forEach(function(a){
      if((a.textContent || '').trim() === 'Услуги') a.textContent = 'Недвижимость';
    });
  }

  function mobileNoJump(){
    var lastY = window.scrollY;
    var lockedUntil = Date.now() + 1200;
    window.addEventListener('scroll', function(){ lastY = window.scrollY; }, {passive:true});
    window.addEventListener('resize', function(){
      if(Date.now() < lockedUntil && Math.abs(window.scrollY - lastY) > 80){ window.scrollTo(0,lastY); }
    }, {passive:true});
  }

  function adminSafeTabs(){
    if(!document.body || document.body.dataset.page !== 'admin') return;
    document.querySelectorAll('.admin-nav button').forEach(function(btn){
      btn.addEventListener('click', function(){
        window.setTimeout(function(){ window.scrollTo({top:0,left:0,behavior:'auto'}); }, 0);
      }, {passive:true});
    });
  }

  ready(function(){
    stabilize();
    fixDuplicateLabels();
    mobileNoJump();
    adminSafeTabs();
    window.setTimeout(stabilize, 450);
    window.setTimeout(stabilize, 1400);
  });
  window.addEventListener('pageshow', stabilize, {passive:true});
})();
