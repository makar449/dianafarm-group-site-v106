
/*! DIANAFARM GROUP v195 — International Trade final forced visible Canvas + external JS globe. */
(function(){
  'use strict';
  var VERSION = 'v195-final-force-visible-canvas-external-js';
  var state = window.DG_TRADE_GLOBE_V195 = {
    version: VERSION,
    mounted: false,
    frames: 0,
    canvas: false,
    errors: [],
    rootRect: null
  };

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  function isTradePage(){
    return /service-international-trade\.html/i.test(location.pathname) ||
      document.body && document.body.getAttribute('data-page') === 'service-international-trade' ||
      /Международная торговля/i.test(document.title || '');
  }
  function forceStyle(el, styles){
    for(var k in styles){ el.style.setProperty(k, styles[k], 'important'); }
  }
  function getHeroBand(){
    var hero = document.querySelector('.v9-page-hero.v103-service-hero') || document.querySelector('.v9-page-hero');
    if(!hero) return null;
    return hero.getBoundingClientRect();
  }
  function applyResponsivePosition(root){
    var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    if(w <= 640){
      forceStyle(root,{display:'none',visibility:'hidden',opacity:'0'});
      return;
    }
    var size = 360;
    if(w >= 1600) size = 430;
    else if(w <= 980) size = 330;
    var left = Math.round(w * (w <= 980 ? 0.46 : 0.50));
    var top = Math.round(h * 0.24);
    var hero = getHeroBand();
    if(hero){
      // Keep it inside the first hero screen, in the empty area between text and right cards.
      top = Math.max(150, Math.min(Math.round(hero.top + hero.height * 0.22), Math.round(h * 0.30)));
    }
    forceStyle(root, {
      position:'fixed', left:left+'px', top:top+'px', width:size+'px', height:size+'px',
      display:'block', visibility:'visible', opacity:'1', 'z-index':'2147483647',
      'pointer-events':'none', overflow:'visible', isolation:'isolate', contain:'none',
      transform:'translate3d(0,0,0)',
      filter:'drop-shadow(0 0 54px rgba(255,218,126,.80)) drop-shadow(0 30px 92px rgba(0,0,0,.58))'
    });
    state.rootRect = root.getBoundingClientRect().toJSON ? root.getBoundingClientRect().toJSON() : String(root.getBoundingClientRect());
  }
  function ensureRoot(){
    // Remove previous broken versions if they are present.
    ['dgTradeV192Root','dgTradeGlobeV193Root','dgTradeGlobeV194Root'].forEach(function(id){
      var old = document.getElementById(id); if(old && old.parentNode) old.parentNode.removeChild(old);
    });
    var root = document.getElementById('dgTradeGlobeV195Root');
    if(!root){
      root = document.createElement('div');
      root.id = 'dgTradeGlobeV195Root';
      root.setAttribute('data-dg-v195','trade-final-force-visible-created-by-js');
      root.setAttribute('aria-hidden','true');
      root.innerHTML = '<div class="dg-v195-globe-fallback"></div><canvas id="dgTradeGlobeV195Canvas" data-dg-v195-canvas></canvas><div class="dg-v195-route-label dg-v195-route-label--bg">BG</div><div class="dg-v195-route-label dg-v195-route-label--uae">UAE</div><div class="dg-v195-route-label dg-v195-route-label--asia">ASIA</div>';
      document.body.appendChild(root);
    } else if(root.parentNode !== document.body){
      document.body.appendChild(root);
    }
    applyResponsivePosition(root);
    return root;
  }
  function setupCanvas(root){
    var canvas = document.getElementById('dgTradeGlobeV195Canvas');
    if(!canvas){
      canvas = document.createElement('canvas'); canvas.id = 'dgTradeGlobeV195Canvas'; canvas.setAttribute('data-dg-v195-canvas',''); root.appendChild(canvas);
    }
    forceStyle(canvas, {position:'absolute', inset:'0', width:'100%', height:'100%', display:'block', visibility:'visible', opacity:'1', 'z-index':'5'});
    var ctx = canvas.getContext('2d', {alpha:true, desynchronized:true});
    state.canvas = !!ctx;
    if(!ctx){ state.errors.push('2d context unavailable'); return null; }
    function resize(){
      applyResponsivePosition(root);
      var rect = root.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var W = Math.max(260, Math.round(rect.width));
      var H = Math.max(260, Math.round(rect.height));
      canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    return {canvas:canvas, ctx:ctx, resize:resize};
  }
  function initInteractions(){
    var intensity = 0;
    var cards = document.querySelectorAll('.v103-hero-proof article, .v103-hero-proof');
    cards.forEach(function(card){
      card.addEventListener('mouseenter', function(){ intensity = 1; }, {passive:true});
      card.addEventListener('mouseleave', function(){ intensity = 0; }, {passive:true});
    });
    return function(){ intensity *= 0.94; return intensity; };
  }
  function globeRenderer(api, getIntensity){
    var ctx = api.ctx;
    var nodes = [
      {name:'BG', lon:23.3, lat:42.7},
      {name:'UAE', lon:54.4, lat:24.4},
      {name:'ASIA', lon:69.2, lat:41.3}
    ];
    function rad(d){return d*Math.PI/180;}
    function rotY(p,a){var c=Math.cos(a),s=Math.sin(a);return {x:p.x*c+p.z*s,y:p.y,z:-p.x*s+p.z*c};}
    function rotX(p,a){var c=Math.cos(a),s=Math.sin(a);return {x:p.x,y:p.y*c-p.z*s,z:p.y*s+p.z*c};}
    function sphere(lon,lat){
      var lo=rad(lon), la=rad(lat);
      return {x:Math.cos(la)*Math.sin(lo), y:-Math.sin(la), z:Math.cos(la)*Math.cos(lo)};
    }
    function project(p,cx,cy,r,spin){
      var q=rotY(p,spin); q=rotX(q,rad(-12));
      var sc=1/(1.85-q.z*0.45);
      return {x:cx+q.x*r*sc, y:cy+q.y*r*sc, z:q.z, sc:sc};
    }
    function drawLine(points, color, width, alpha){
      ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath(); var started=false;
      for(var i=0;i<points.length;i++){
        var p=points[i];
        if(p.z < -0.75){started=false; continue;}
        if(!started){ctx.moveTo(p.x,p.y); started=true;} else ctx.lineTo(p.x,p.y);
      }
      ctx.stroke(); ctx.restore();
    }
    function normalize(p){var l=Math.hypot(p.x,p.y,p.z)||1;return {x:p.x/l,y:p.y/l,z:p.z/l};}
    function mix(a,b,t){return normalize({x:a.x*(1-t)+b.x*t,y:a.y*(1-t)+b.y*t,z:a.z*(1-t)+b.z*t});}
    function drawArc(a,b,cx,cy,r,spin,tick,active){
      var A=sphere(a.lon,a.lat), B=sphere(b.lon,b.lat), pts=[];
      for(var i=0;i<=90;i++){
        var t=i/90, p=mix(A,B,t), lift=Math.sin(Math.PI*t)*0.35;
        var pr=project({x:p.x*(1+lift),y:p.y*(1+lift),z:p.z*(1+lift)},cx,cy,r,spin);
        pts.push(pr);
      }
      drawLine(pts,'rgba(255,226,146,.76)',1.35+active*0.9,.70+active*.25);
      drawLine(pts,'rgba(255,185,72,.32)',5+active*3,.34+active*.18);
      var phase=(tick*0.00042 + active*.18) % 1;
      for(var k=0;k<2;k++){
        var idx=Math.floor(((phase+k*.46)%1)*(pts.length-1)); var pnt=pts[idx];
        if(pnt && pnt.z>-0.55){
          var grd=ctx.createRadialGradient(pnt.x,pnt.y,0,pnt.x,pnt.y,16+active*12);
          grd.addColorStop(0,'rgba(255,255,230,1)'); grd.addColorStop(.28,'rgba(255,217,118,.85)'); grd.addColorStop(1,'rgba(255,190,76,0)');
          ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(pnt.x,pnt.y,16+active*12,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
      }
    }
    function frame(ts){
      state.frames++;
      var rect = api.canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      if(w < 10 || h < 10){ requestAnimationFrame(frame); return; }
      var active = getIntensity ? getIntensity() : 0;
      var cx=w*0.5, cy=h*0.5, r=Math.min(w,h)*0.39;
      var spin=ts*0.00017;
      ctx.clearRect(0,0,w,h);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      var outer=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.7);
      outer.addColorStop(0,'rgba(255,228,158,.22)'); outer.addColorStop(.42,'rgba(86,136,255,.10)'); outer.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=outer; ctx.beginPath(); ctx.arc(cx,cy,r*1.7,0,Math.PI*2); ctx.fill(); ctx.restore();
      // sphere body
      var body=ctx.createRadialGradient(cx-r*.34,cy-r*.36,0,cx,cy,r*1.05);
      body.addColorStop(0,'rgba(255,248,212,.30)'); body.addColorStop(.22,'rgba(255,218,135,.14)'); body.addColorStop(.58,'rgba(57,104,220,.075)'); body.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=body; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
      // latitude rings
      for(var lat=-60; lat<=60; lat+=15){
        var pts=[]; for(var lon=-180; lon<=180; lon+=4) pts.push(project(sphere(lon,lat),cx,cy,r,spin));
        drawLine(pts,'rgba(255,225,154,.54)', lat===0?1.25:0.85, lat===0?.86:.54);
      }
      // meridians
      for(var lon=-180; lon<180; lon+=18){
        var pts=[]; for(var lat=-82; lat<=82; lat+=4) pts.push(project(sphere(lon,lat),cx,cy,r,spin));
        drawLine(pts,'rgba(255,225,154,.42)',0.78,.55);
      }
      // tiny stars/nodes on sphere
      for(var i=0;i<80;i++){
        var lo=(i*137.508+ts*.012)%360-180, la=Math.sin(i*9.1)*58;
        var pp=project(sphere(lo,la),cx,cy,r,spin);
        if(pp.z>-0.25){ctx.fillStyle='rgba(255,228,154,'+(0.18+0.42*Math.max(0,pp.z))+')'; ctx.beginPath(); ctx.arc(pp.x,pp.y,0.8+pp.sc*.7,0,Math.PI*2); ctx.fill();}
      }
      drawArc(nodes[0],nodes[1],cx,cy,r,spin,ts,active);
      drawArc(nodes[1],nodes[2],cx,cy,r,spin,ts+900,active);
      drawArc(nodes[0],nodes[2],cx,cy,r,spin,ts+1700,active);
      // node points and names in canvas too, so they move on the globe.
      nodes.forEach(function(n){
        var p=project(sphere(n.lon,n.lat),cx,cy,r,spin); if(p.z>-0.65){
          ctx.save(); ctx.globalCompositeOperation='lighter';
          var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,18);
          g.addColorStop(0,'rgba(255,255,228,1)'); g.addColorStop(.28,'rgba(255,218,126,.88)'); g.addColorStop(1,'rgba(255,178,60,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,18,0,Math.PI*2); ctx.fill();
          ctx.fillStyle='#fff2bf'; ctx.beginPath(); ctx.arc(p.x,p.y,3.2,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }});
      ctx.restore();
      // edge highlight
      ctx.strokeStyle='rgba(255,232,171,.80)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  ready(function(){
    try{
      if(!isTradePage()) return;
      var root = ensureRoot();
      var canvasApi = setupCanvas(root);
      var getIntensity = initInteractions();
      if(canvasApi) globeRenderer(canvasApi, getIntensity);
      state.mounted = true;
      state.rootExists = !!document.getElementById('dgTradeGlobeV195Root');
      state.script = 'loaded';
    }catch(e){
      state.errors.push(e && (e.stack || e.message) || String(e));
      console.error('[DIANAFARM v195 trade globe]', e);
    }
  });
})();
