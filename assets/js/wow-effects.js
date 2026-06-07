/* v178 lightweight premium wow effects: no external libraries, transform-only animations */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  function initSphere(sphere){
    if(!sphere || sphere.dataset.ready==='true') return;
    sphere.dataset.ready='true';
    var words = Array.prototype.slice.call(sphere.querySelectorAll('span'));
    if(!words.length) return;
    var rx=0, ry=0, mx=.006, my=.004, radius=42;
    function layout(){
      var w=sphere.clientWidth||280, h=sphere.clientHeight||280;
      radius=Math.min(w,h)*0.38;
      words.forEach(function(el){ el.style.left=(w/2)+'px'; el.style.top=(h/2)+'px'; });
    }
    function frame(){
      if(!reduce && !coarse){ rx += my; ry += mx; }
      words.forEach(function(el,i){
        var a = (i / words.length) * Math.PI * 2;
        var b = Math.acos(-1 + (2*i+1)/words.length);
        var x = Math.cos(a) * Math.sin(b);
        var y = Math.sin(a) * Math.sin(b);
        var z = Math.cos(b);
        var x1 = x*Math.cos(ry) + z*Math.sin(ry);
        var z1 = -x*Math.sin(ry) + z*Math.cos(ry);
        var y1 = y*Math.cos(rx) - z1*Math.sin(rx);
        var z2 = y*Math.sin(rx) + z1*Math.cos(rx);
        var scale = .72 + (z2+1)*.23;
        el.style.transform = 'translate3d('+(x1*radius)+'px,'+(y1*radius)+'px,0) scale('+scale+')';
        el.style.opacity = String(.42 + (z2+1)*.28);
        el.style.zIndex = String(100 + Math.round(z2*100));
      });
      if(!reduce && !coarse) requestAnimationFrame(frame);
    }
    layout(); window.addEventListener('resize', layout, {passive:true});
    if(!coarse){
      sphere.addEventListener('mousemove', function(e){
        var r=sphere.getBoundingClientRect();
        mx=((e.clientX-r.left)/Math.max(1,r.width)-.5)*.018;
        my=((e.clientY-r.top)/Math.max(1,r.height)-.5)*-.018;
      }, {passive:true});
      sphere.addEventListener('mouseleave', function(){ mx=.006; my=.004; }, {passive:true});
    }
    frame();
  }
  function initTilt(card){
    if(!card || coarse || reduce || card.dataset.tiltReady==='true') return;
    card.dataset.tiltReady='true';
    card.addEventListener('pointermove', function(e){
      var r=card.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--tx', (x*8).toFixed(2)+'deg');
      card.style.setProperty('--ty', (y*-8).toFixed(2)+'deg');
    }, {passive:true});
    card.addEventListener('pointerleave', function(){card.style.setProperty('--tx','0deg');card.style.setProperty('--ty','0deg');}, {passive:true});
  }
  function init(){
    document.querySelectorAll('[data-wow-sphere]').forEach(initSphere);
    document.querySelectorAll('[data-tilt-lite]').forEach(initTilt);
  }
  document.addEventListener('DOMContentLoaded', init, {passive:true});
  window.addEventListener('load', init, {passive:true});
})();
