/*! DIANAFARM GROUP v196 — Pro visible canvas scenes for service tabs except trade. External JS, forced visible, no layout gap. */
(function(){
  'use strict';
  var VERSION = 'v196-all-other-tabs-pro-canvas-external-js';
  var SCENE_BY_PAGE = {
    'service-nostrification': 'mobius',
    'service-pharma-consulting': 'lattice',
    'service-cosmetics-registration': 'metaball',
    'service-supplements-registration': 'particles',
    'service-banks-accounts': 'wave',
    'service-company-registration-eu': 'cubes',
    'service-residence-bg': 'topo'
  };
  var LABEL_BY_KIND = {mobius:'ДИПЛОМ', lattice:'PHARMA', metaball:'BEAUTY', particles:'BIO', wave:'BANK', cubes:'COMPANY', topo:'BULGARIA'};
  var state = window.DG_PRO_SCENES_V196 = {version:VERSION, mounted:false, frames:0, scene:null, kind:null, errors:[], canvas:false, rootExists:false};

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function forceStyle(el, styles){ for(var k in styles){ el.style.setProperty(k, styles[k], 'important'); } }
  function getPage(){ return (document.body && document.body.getAttribute('data-page')) || ''; }
  function getKind(){
    var page = getPage();
    if(SCENE_BY_PAGE[page]) return SCENE_BY_PAGE[page];
    var path = location.pathname;
    if(/service-nostrification\.html/i.test(path)) return 'mobius';
    if(/service-pharma-consulting\.html/i.test(path)) return 'lattice';
    if(/service-cosmetics-registration\.html/i.test(path)) return 'metaball';
    if(/service-supplements-registration\.html/i.test(path)) return 'particles';
    if(/service-banks-accounts\.html/i.test(path)) return 'wave';
    if(/service-company-registration\.html/i.test(path)) return 'cubes';
    if(/service-residence-bulgaria\.html/i.test(path)) return 'topo';
    return null;
  }
  function sceneName(kind){
    return {mobius:'nostrification', lattice:'pharma', metaball:'cosmetics', particles:'supplements', wave:'banks', cubes:'company', topo:'residence'}[kind] || kind;
  }
  function getHeroBand(){
    var hero = document.querySelector('.v9-page-hero.v103-service-hero') || document.querySelector('.v9-page-hero');
    return hero ? hero.getBoundingClientRect() : null;
  }
  function applyResponsivePosition(root){
    var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    if(w <= 640){ forceStyle(root,{display:'none',visibility:'hidden',opacity:'0'}); return; }
    var size = 380;
    if(w >= 1600) size = 450; else if(w <= 980) size = 340;
    var left = Math.round(w * (w <= 980 ? 0.46 : 0.50));
    var top = Math.round(h * 0.24);
    var hero = getHeroBand();
    if(hero){ top = Math.max(142, Math.min(Math.round(hero.top + hero.height * 0.22), Math.round(h * 0.31))); }
    forceStyle(root, {
      position:'fixed', left:left+'px', top:top+'px', width:size+'px', height:size+'px',
      display:'block', visibility:'visible', opacity:'1', 'z-index':'2147483000',
      'pointer-events':'none', overflow:'visible', isolation:'isolate', contain:'none',
      transform:'translate3d(0,0,0)',
      filter:'drop-shadow(0 0 58px rgba(255,218,126,.78)) drop-shadow(0 30px 96px rgba(0,0,0,.58))'
    });
  }
  function ensureRoot(kind){
    var root = document.getElementById('dgProSceneV196Root');
    if(!root){
      root = document.createElement('div');
      root.id = 'dgProSceneV196Root';
      root.className = 'dg-pro-scene-v196 dg-pro-scene-v196--' + kind;
      root.setAttribute('data-dg-v196', sceneName(kind));
      root.setAttribute('data-dg-kind', kind);
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = '<div class="dg-pro-v196-halo"></div><div class="dg-pro-v196-fallback"></div><canvas id="dgProSceneV196Canvas" data-dg-v196-canvas></canvas><div class="dg-pro-v196-label">'+(LABEL_BY_KIND[kind]||'DIANAFARM')+'</div>';
      document.body.appendChild(root);
    } else if(root.parentNode !== document.body){ document.body.appendChild(root); }
    root.setAttribute('data-dg-kind', kind);
    root.setAttribute('data-dg-v196', sceneName(kind));
    applyResponsivePosition(root);
    return root;
  }
  function setupCanvas(root){
    var canvas = document.getElementById('dgProSceneV196Canvas');
    if(!canvas){ canvas = document.createElement('canvas'); canvas.id = 'dgProSceneV196Canvas'; canvas.setAttribute('data-dg-v196-canvas',''); root.appendChild(canvas); }
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
  function initInteraction(){
    var hover = 0, target = 0;
    var cards = document.querySelectorAll('.v124-service-mini-card, .v103-hero-proof article, .v103-hero-proof');
    cards.forEach(function(card){
      card.addEventListener('mouseenter', function(){ target = 1; }, {passive:true});
      card.addEventListener('mouseleave', function(){ target = 0; }, {passive:true});
    });
    var mouse = {x:-9999, y:-9999};
    window.addEventListener('mousemove', function(e){ mouse.x=e.clientX; mouse.y=e.clientY; }, {passive:true});
    return {mouse:mouse, intensity:function(){ hover += (target-hover)*0.08; return hover; }};
  }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function rad(d){ return d*Math.PI/180; }
  function rotate(p, ax, ay, az){
    var x=p.x, y=p.y, z=p.z, c, s, nx, ny, nz;
    c=Math.cos(ax); s=Math.sin(ax); ny=y*c-z*s; nz=y*s+z*c; y=ny; z=nz;
    c=Math.cos(ay); s=Math.sin(ay); nx=x*c+z*s; nz=-x*s+z*c; x=nx; z=nz;
    c=Math.cos(az); s=Math.sin(az); nx=x*c-y*s; ny=x*s+y*c; x=nx; y=ny;
    return {x:x,y:y,z:z};
  }
  function project(p,cx,cy,r, ax, ay, az, zoom){
    var q = rotate(p, ax||0, ay||0, az||0);
    var z = (zoom || 2.75) - q.z;
    var sc = 1 / Math.max(.7, z);
    return {x:cx + q.x*r*sc, y:cy + q.y*r*sc, z:q.z, sc:sc};
  }
  function glowBg(ctx,w,h,ts,kind){
    var cx=w*.5, cy=h*.5, r=Math.min(w,h)*.45;
    ctx.clearRect(0,0,w,h);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.85);
    g.addColorStop(0,'rgba(255,227,152,.25)'); g.addColorStop(.38,'rgba(64,128,255,.12)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r*1.85,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function line(ctx, pts, color, width, alpha){
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.globalAlpha=alpha == null ? 1 : alpha; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); for(var i=0;i<pts.length;i++){ var p=pts[i]; if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); } ctx.stroke(); ctx.restore();
  }
  function poly(ctx, pts, fill, stroke, alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(var i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();} ctx.restore();
  }

  var particleCache = null;
  function makeParticles(){
    if(particleCache) return particleCache;
    var pts=[];
    for(var i=0;i<420;i++){
      var t = (i / 420) * Math.PI * 2;
      var rr = Math.sqrt(((i*97)%420)/420);
      var x = 0.82 * 16*Math.pow(Math.sin(t),3) / 18;
      var y = -(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)) / 18;
      x *= rr; y *= rr;
      pts.push({x:x+(Math.random()-.5)*.045, y:y+(Math.random()-.5)*.045, z:(Math.random()-.5)*.44, seed:Math.random()*99});
    }
    particleCache=pts; return pts;
  }

  function drawMobius(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'mobius');
    var cx=w*.5, cy=h*.5, r=Math.min(w,h)*.72, time=ts*.00035;
    var ax=rad(62)+Math.sin(time*.7)*.08, ay=time, az=rad(-17);
    for(var band=-5; band<=5; band++){
      var v = band/34;
      var pts=[];
      for(var i=0;i<=220;i++){
        var u = i/220 * Math.PI*2;
        var x=(1+v*Math.cos(u/2))*Math.cos(u);
        var y=(1+v*Math.cos(u/2))*Math.sin(u);
        var z=v*Math.sin(u/2)*2.05;
        var p=project({x:x,y:y,z:z},cx,cy,r,ax,ay,az,3.2);
        pts.push(p);
      }
      var a = 0.14 + (6-Math.abs(band))*0.035;
      line(ctx,pts, band===-5||band===5 ? 'rgba(255,236,180,.95)' : 'rgba(178,216,255,.24)', band===-5||band===5 ? 2.0+active : 1.2, a+active*.12);
    }
    for(var edge=0; edge<2; edge++){
      var v2 = edge ? .17 : -.17, pts2=[];
      for(var j=0;j<=260;j++){
        var u2 = j/260*Math.PI*2;
        pts2.push(project({x:(1+v2*Math.cos(u2/2))*Math.cos(u2),y:(1+v2*Math.cos(u2/2))*Math.sin(u2),z:v2*Math.sin(u2/2)*2.05},cx,cy,r,ax,ay,az,3.2));
      }
      line(ctx,pts2,'rgba(255,220,127,.98)',2.1+active*1.4,.9);
      line(ctx,pts2,'rgba(255,185,76,.30)',7+active*4,.45);
    }
  }
  function drawLattice(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'lattice');
    var cx=w*.5, cy=h*.5, r=Math.min(w,h)*.82, t=ts*.001;
    var nodes=[];
    for(var i=0;i<18;i++){
      var a=i*.72+t*.18, y=(i-8.5)/8.5;
      nodes.push({x:Math.cos(a)*.55, y:y, z:Math.sin(a)*.55, cluster:i%3});
      nodes.push({x:Math.cos(a+Math.PI)*.55, y:y, z:Math.sin(a+Math.PI)*.55, cluster:i%3});
    }
    for(var c=0;c<12;c++) nodes.push({x:Math.sin(c*2.17+t*.18)*.9, y:Math.cos(c*1.47)*.72, z:Math.cos(c*2.03+t*.15)*.78, cluster:c%3});
    var pp=nodes.map(function(n,i){
      var n2={x:n.x+Math.sin(t*1.6+i)*.025, y:n.y+Math.cos(t*1.25+i*1.8)*.025, z:n.z+Math.sin(t*.9+i*2.2)*.025};
      return project(n2,cx,cy,r,rad(-9),t*.22,rad(6),3.1);
    });
    for(var j=0;j<18;j++){
      var a1=pp[j*2], b1=pp[j*2+1]; line(ctx,[a1,b1],'rgba(255,226,146,.52)',1.2+active*.8,.85);
      if(j<17){ line(ctx,[pp[j*2],pp[(j+1)*2]],'rgba(255,226,146,.42)',.95,.72); line(ctx,[pp[j*2+1],pp[(j+1)*2+1]],'rgba(255,226,146,.42)',.95,.72); }
    }
    for(var k=36;k<pp.length;k++) for(var q=k+1;q<pp.length;q++){
      if(Math.abs(k-q)<4){ line(ctx,[pp[k],pp[q]],'rgba(166,211,255,.28)',.8,.55); }
    }
    pp.forEach(function(p,i){
      var pulse=.7+.3*Math.sin(t*2+i);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,14+active*8);
      g.addColorStop(0,'rgba(255,255,234,.95)'); g.addColorStop(.35,'rgba(255,222,136,.70)'); g.addColorStop(1,'rgba(255,190,76,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,(11+active*5)*pulse,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(220,242,255,.92)'; ctx.beginPath(); ctx.arc(p.x,p.y,2.6+active*.8,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
  }
  function drawMetaball(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'metaball');
    var cx=w*.5, cy=h*.5, base=Math.min(w,h)*.185, t=ts*.001;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(var i=0;i<9;i++){
      var a=i*Math.PI*2/9 + t*(.22+i*.018);
      var rr=Math.min(w,h)*(.06+.035*Math.sin(t*.7+i));
      var x=cx+Math.cos(a)*Math.min(w,h)*(.13+.035*Math.sin(t*.6+i));
      var y=cy+Math.sin(a*1.25)*Math.min(w,h)*(.105+.025*Math.cos(t*.8+i));
      var radn=base*(.78+.26*Math.sin(t*1.1+i*1.7)+active*.12) + rr;
      var g=ctx.createRadialGradient(x-radn*.28,y-radn*.32,0,x,y,radn);
      g.addColorStop(0,'rgba(255,248,211,.92)');
      g.addColorStop(.21,'rgba(255,222,133,.72)');
      g.addColorStop(.58,'rgba(255,172,68,.34)');
      g.addColorStop(1,'rgba(255,147,38,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,radn,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    for(var c=0;c<7;c++){
      var pts=[]; for(var j=0;j<=120;j++){ var u=j/120*Math.PI*2; var radc=Math.min(w,h)*(.245+.024*Math.sin(u*3+t*1.5+c)); pts.push({x:cx+Math.cos(u)*radc,y:cy+Math.sin(u)*radc*.86}); }
      line(ctx,pts,c%2?'rgba(255,244,197,.42)':'rgba(255,194,83,.34)',c===0?1.8:1,.45);
    }
    var hi=ctx.createRadialGradient(cx-Math.min(w,h)*.12,cy-Math.min(w,h)*.15,0,cx-Math.min(w,h)*.12,cy-Math.min(w,h)*.15,Math.min(w,h)*.16);
    hi.addColorStop(0,'rgba(255,255,235,.62)'); hi.addColorStop(1,'rgba(255,255,235,0)'); ctx.fillStyle=hi; ctx.beginPath(); ctx.arc(cx-Math.min(w,h)*.12,cy-Math.min(w,h)*.15,Math.min(w,h)*.16,0,Math.PI*2); ctx.fill();
  }
  function drawParticles(ctx,w,h,ts,active,mouse,root){
    glowBg(ctx,w,h,ts,'particles');
    var cx=w*.5, cy=h*.51, scale=Math.min(w,h)*.29, t=ts*.001;
    var rect=root.getBoundingClientRect();
    var mx=mouse.x-rect.left, my=mouse.y-rect.top;
    var pts=makeParticles();
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      var x=cx+(p.x*Math.cos(t*.16)-p.z*Math.sin(t*.16))*scale;
      var y=cy+p.y*scale+Math.sin(t*1.2+p.seed)*3.5;
      var dx=x-mx, dy=y-my, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<110){ var push=(110-dist)/110; x += dx/(dist||1)*push*32; y += dy/(dist||1)*push*32; }
      var tw=.55+.45*Math.sin(t*2.4+p.seed);
      ctx.fillStyle='rgba(255,224,137,'+(0.35+tw*.42)+')'; ctx.beginPath(); ctx.arc(x,y,1.0+tw*1.35+active*.7,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    var leaf=[]; for(var j=0;j<=100;j++){ var u=j/100*Math.PI*2; leaf.push({x:cx+(16*Math.pow(Math.sin(u),3)/18)*scale, y:cy-(13*Math.cos(u)-5*Math.cos(2*u)-2*Math.cos(3*u)-Math.cos(4*u))/18*scale}); }
    line(ctx,leaf,'rgba(255,236,174,.42)',1.15,.65);
  }
  function drawWave(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'wave');
    var cx=w*.5, cy=h*.53, R=Math.min(w,h)*.34, t=ts*.00032;
    for(var k=0;k<26;k++){
      var pts=[]; var phase=t+k*.115;
      for(var i=0;i<=360;i++){
        var u=i/360*Math.PI*2;
        var x=cx+Math.sin(u*3+phase)*R*(1+.05*Math.sin(k)) + Math.sin(u*7-phase)*R*.18;
        var y=cy+Math.cos(u*2-phase)*R*.46 + Math.sin(u*5+k*.2)*R*.15;
        var tilt=(y-cy)*.32; pts.push({x:x,y:y+tilt});
      }
      line(ctx,pts,k%3===0?'rgba(255,235,172,.66)':'rgba(255,199,91,.35)',.75+(k%5===0?.6:0)+active*.28,.36+k/80);
    }
    for(var q=0;q<10;q++){
      var pts2=[]; for(var j=0;j<=130;j++){ var x=lerp(cx-R*1.25,cx+R*1.25,j/130); var y=cy+Math.sin(j*.13+q*.72+t*5)*R*.15+(q-5)*R*.085; pts2.push({x:x,y:y}); }
      line(ctx,pts2,'rgba(154,205,255,.18)',.8,.58);
    }
  }
  function iso(x,y,z,cx,cy,s){ return {x:cx+(x-y)*s, y:cy+(x+y)*s*.47-z*s}; }
  function drawCube(ctx,cx,cy,s,x,y,z,h,alpha){
    var A=iso(x,y,z,cx,cy,s), B=iso(x+1,y,z,cx,cy,s), C=iso(x+1,y+1,z,cx,cy,s), D=iso(x,y+1,z,cx,cy,s);
    var A2=iso(x,y,z+h,cx,cy,s), B2=iso(x+1,y,z+h,cx,cy,s), C2=iso(x+1,y+1,z+h,cx,cy,s), D2=iso(x,y+1,z+h,cx,cy,s);
    poly(ctx,[A2,B2,C2,D2],'rgba(255,236,170,.30)','rgba(255,239,188,.76)',alpha);
    poly(ctx,[B,B2,C2,C],'rgba(255,184,74,.24)','rgba(255,220,140,.62)',alpha);
    poly(ctx,[C,C2,D2,D],'rgba(61,116,216,.18)','rgba(255,220,140,.42)',alpha);
  }
  function drawCubes(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'cubes');
    var cx=w*.5, cy=h*.62, s=Math.min(w,h)*.08, t=ts*.001;
    var cubes=[[-1.5,-.5,0,1.8],[-.5,-.5,0,2.4],[.5,-.5,0,1.55],[-1.0,.5,0,1.15],[0,.5,0,2.05],[1,.5,0,1.3],[-.1,-1.4,0,1.0]];
    cubes.forEach(function(c,i){
      var p=clamp((Math.sin(t*.55+i*.47)+1)/2 + active*.25,.15,1);
      drawCube(ctx,cx,cy,s,c[0],c[1],-0.15+(1-p)*2.2,c[3]*p,.82);
    });
    for(var i=0;i<8;i++){ var x1=cx+(i-4)*s*.85; line(ctx,[{x:x1,y:cy+s*2.8},{x:x1+s*2.2,y:cy+s*3.8}], 'rgba(255,225,143,.22)', .9, .55); }
  }
  function drawTopo(ctx,w,h,ts,active){
    glowBg(ctx,w,h,ts,'topo');
    var cx=w*.5, cy=h*.57, R=Math.min(w,h)*.43, t=ts*.00055;
    for(var l=0;l<22;l++){
      var pts=[]; var yy=-R*.68+l*(R*1.36/21);
      for(var i=0;i<=150;i++){
        var x=-R+i*(R*2/150);
        var d=Math.sqrt((x/R)*(x/R)+(yy/R)*(yy/R));
        var height=Math.sin(x*.025+t*3+l*.45)*18 + Math.cos((x+yy)*.021-t*2)*10;
        var persp=.55+.45*(l/22);
        pts.push({x:cx+x*persp, y:cy+yy*.46+height*persp+(l-11)*2});
      }
      line(ctx,pts,l%4===0?'rgba(255,235,170,.70)':'rgba(255,206,101,.38)',l%4===0?1.4:1,.42+l/35);
    }
    for(var r=0;r<5;r++){
      var g=ctx.createRadialGradient(cx,cy+R*.12,0,cx,cy+R*.12,R*(.5+r*.18));
      g.addColorStop(0,'rgba(255,226,145,0)'); g.addColorStop(.94,'rgba(255,226,145,.04)'); g.addColorStop(1,'rgba(255,226,145,.22)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy+R*.18,R*(.48+r*.17),R*(.18+r*.08),0,0,Math.PI*2); ctx.fill();
    }
  }
  function renderer(api, kind, interaction, root){
    var ctx = api.ctx;
    function frame(ts){
      state.frames++;
      var rect = api.canvas.getBoundingClientRect();
      var w=rect.width, h=rect.height;
      if(w < 10 || h < 10){ requestAnimationFrame(frame); return; }
      var active = interaction.intensity();
      if(kind === 'mobius') drawMobius(ctx,w,h,ts,active);
      else if(kind === 'lattice') drawLattice(ctx,w,h,ts,active);
      else if(kind === 'metaball') drawMetaball(ctx,w,h,ts,active);
      else if(kind === 'particles') drawParticles(ctx,w,h,ts,active,interaction.mouse,root);
      else if(kind === 'wave') drawWave(ctx,w,h,ts,active);
      else if(kind === 'cubes') drawCubes(ctx,w,h,ts,active);
      else if(kind === 'topo') drawTopo(ctx,w,h,ts,active);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  ready(function(){
    try{
      var kind = getKind();
      if(!kind) return;
      state.kind = kind; state.scene = sceneName(kind);
      var root = ensureRoot(kind);
      var api = setupCanvas(root);
      var interaction = initInteraction();
      if(api) renderer(api, kind, interaction, root);
      state.mounted = true; state.rootExists = !!document.getElementById('dgProSceneV196Root'); state.script='loaded';
    }catch(e){ state.errors.push(e && (e.stack || e.message) || String(e)); console.error('[DIANAFARM v196 pro scenes]', e); }
  });
})();