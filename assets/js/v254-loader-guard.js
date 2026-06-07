(function(){
  'use strict';
  var started = Date.now();
  function hideNow(){
    var loader = document.getElementById('pageLoader');
    if(!loader) return;
    loader.classList.add('is-hidden');
    loader.setAttribute('aria-hidden','true');
    loader.style.opacity='0';
    loader.style.visibility='hidden';
    loader.style.pointerEvents='none';
    setTimeout(function(){ loader.style.display='none'; }, 420);
    document.documentElement.classList.add('dfg-loader-removed');
    if(document.body) document.body.classList.add('dfg-loader-removed');
  }
  function hideSafe(){
    var minVisible = 1200;
    var wait = Math.max(0, minVisible - (Date.now() - started));
    setTimeout(hideNow, wait);
  }
  window.DFG_KILL_LOADER = hideSafe;
  if(document.readyState === 'complete') hideSafe();
  else window.addEventListener('load', hideSafe, {once:true});
  setTimeout(hideSafe, 4200);
})();