/*! DIANAFARM GROUP v197 — Premium interactive canvas scenes with deferred reveal and smart positioning. */
(function(){
  'use strict';
  var VERSION = 'v197-premium-interactive-service-scenes';
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
  var state = window.DG_PRO_SCENES_V197 = {version:VERSION, mounted:false, frames:0, scene:null, kind:null, errors:[], canvas:false, rootExists:false, visible:false};

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function onLoad(fn){ if(document.readyState === 'complete') fn(); else window.addEventListener('load', fn, {once:true}); }
  function forceStyle(el, styles){ for(var k in styles){ el.style.setProperty(k, styles[k], 'important'); } }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function rad(d){ return d*Math.PI/180; }
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
  function sceneName(kind){ return ({mobius:'nostrification', lattice:'pharma', metaball:'cosmetics', particles:'supplements', wave:'banks', cubes:'company', topo:'residence'})[kind] || kind; }
  function q(sel, root){ return (root || document).querySelector(sel); }

  function getLayoutRects(){
    var hero = q('.v9-page-hero.v103-service-hero') || q('.v9-page-hero');
    if(!hero) return null;
    return {
      hero: hero.getBoundingClientRect(),
      copy: q('.v9-page-hero__copy', hero) ? q('.v9-page-hero__copy', hero).getBoundingClientRect() : null,
      proof: q('.v103-hero-proof', hero) ? q('.v103-hero-proof', hero).getBoundingClientRect() : null
    };
  }

  function computeStageBox(){
    var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    var size = w >= 1680 ? 460 : (w <= 980 ? 320 : 400);
    var left = Math.round(w * (w <= 980 ? 0.52 : 0.57));
    var top = Math.round(h * 0.25);
    var layout = getLayoutRects();
    if(layout && layout.hero){
      var hero = layout.hero, copy = layout.copy, proof = layout.proof;
      top = clamp(Math.round(hero.top + hero.height * 0.17), 120, Math.round(h * 0.36));
      if(copy && proof){
        var gapLeft = copy.right + 26;
        var gapRight = proof.left - 26;
        var gapWidth = gapRight - gapLeft;
        if(gapWidth > 210){
          size = Math.min(size, Math.max(270, gapWidth));
          left = Math.round(gapLeft + gapWidth / 2 - size / 2);
        } else {
          left = Math.round(Math.min(w * 0.60, copy.right + 36));
        }
      } else if(copy) {
        left = Math.round(Math.min(w - size - 32, copy.right + 42));
      }
      if(copy){
        if(left < copy.right + 12) left = Math.round(copy.right + 12);
      }
      if(proof){
        if(left + size > proof.left - 12) left = Math.round(proof.left - size - 12);
      }
    }
    left = clamp(left, 18, w - size - 18);
    top = clamp(top, 96, h - size - 24);
    return {left:left, top:top, size:size};
  }

  function applyResponsivePosition(root){
    var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if(w <= 640){ forceStyle(root,{display:'none', visibility:'hidden', opacity:'0'}); return; }
    var box = computeStageBox();
    forceStyle(root, {
      position:'fixed', left:box.left+'px', top:box.top+'px', width:box.size+'px', height:box.size+'px',
      display:'block', visibility:'visible', 'z-index':'2147483000', overflow:'visible', isolation:'isolate', contain:'none',
      'pointer-events':'none', 'transform-origin':'50% 50%'
    });
  }

  function ensureRoot(kind){
    var root = document.getElementById('dgProSceneV196Root');
    if(!root){
      root = document.createElement('div');
      root.id = 'dgProSceneV196Root';
      root.className = 'dg-pro-scene-v196 dg-pro-scene-v196--' + kind;
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = '<div class="dg-pro-v196-halo"></div><div class="dg-pro-v196-fallback"></div><canvas id="dgProSceneV196Canvas" data-dg-v196-canvas></canvas><div class="dg-pro-v196-label">'+(LABEL_BY_KIND[kind]||'DIANAFARM')+'</div>';
      document.body.appendChild(root);
    }
    root.setAttribute('data-dg-v196', sceneName(kind));
    root.setAttribute('data-dg-kind', kind);
    root.classList.remove('is-visible', 'is-interacting');
    applyResponsivePosition(root);
    return root;
  }

  function setupCanvas(root){
    var canvas = document.getElementById('dgProSceneV196Canvas');
    if(!canvas){ canvas = document.createElement('canvas'); canvas.id = 'dgProSceneV196Canvas'; root.appendChild(canvas); }
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
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    window.addEventListener('scroll', resize, {passive:true});
    return {canvas:canvas, ctx:ctx, resize:resize};
  }

  function initInteraction(root){
    var target = 0, hover = 0, sceneHover = 0;
    var mouse = {x:-9999, y:-9999, nx:0, ny:0, inside:false, glowX:0, glowY:0};
    var cards = document.querySelectorAll('.v124-service-mini-card, .v103-hero-proof article, .v103-hero-proof');
    cards.forEach(function(card){
      card.addEventListener('mouseenter', function(){ target = 1; }, {passive:true});
      card.addEventListener('mouseleave', function(){ target = 0; }, {passive:true});
    });
    window.addEventListener('mousemove', function(e){ mouse.x = e.clientX; mouse.y = e.clientY; }, {passive:true});
    window.addEventListener('mouseleave', function(){ mouse.x = -9999; mouse.y = -9999; }, {passive:true});

    return {
      mouse: mouse,
      update: function(){
        hover += (target - hover) * 0.08;
        var rect = root.getBoundingClientRect();
        var inside = mouse.x >= rect.left && mouse.x <= rect.right && mouse.y >= rect.top && mouse.y <= rect.bottom;
        sceneHover += ((inside ? 1 : 0) - sceneHover) * 0.12;
        mouse.inside = inside;
        mouse.nx = inside ? clamp(((mouse.x - rect.left) / rect.width - 0.5) * 2, -1, 1) : lerp(mouse.nx, 0, 0.06);
        mouse.ny = inside ? clamp(((mouse.y - rect.top) / rect.height - 0.5) * 2, -1, 1) : lerp(mouse.ny, 0, 0.06);
        mouse.glowX = inside ? (mouse.x - rect.left) : rect.width * (0.58 + Math.sin(performance.now()*0.0007) * 0.12);
        mouse.glowY = inside ? (mouse.y - rect.top) : rect.height * (0.42 + Math.cos(performance.now()*0.0008) * 0.10);
        root.classList.toggle('is-interacting', sceneHover > 0.14 || hover > 0.18);
        return clamp(hover * 0.65 + sceneHover, 0, 1.4);
      }
    };
  }

  function revealRoot(root){
    onLoad(function(){
      setTimeout(function(){
        root.classList.add('is-visible');
        state.visible = true;
      }, 380);
    });
  }

  function rotate(p, ax, ay, az){
    var x = p.x, y = p.y, z = p.z, c, s, nx, ny, nz;
    c=Math.cos(ax); s=Math.sin(ax); ny=y*c-z*s; nz=y*s+z*c; y=ny; z=nz;
    c=Math.cos(ay); s=Math.sin(ay); nx=x*c+z*s; nz=-x*s+z*c; x=nx; z=nz;
    c=Math.cos(az); s=Math.sin(az); nx=x*c-y*s; ny=x*s+y*c; x=nx; y=ny;
    return {x:x, y:y, z:z};
  }
  function project(p,cx,cy,r,ax,ay,az,zoom){
    var q = rotate(p, ax || 0, ay || 0, az || 0);
    var z = (zoom || 2.75) - q.z;
    var sc = 1 / Math.max(0.7, z);
    return {x:cx + q.x*r*sc, y:cy + q.y*r*sc, z:q.z, sc:sc};
  }
  function line(ctx, pts, color, width, alpha){
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.globalAlpha=alpha == null ? 1 : alpha; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); for(var i=0;i<pts.length;i++){ var p=pts[i]; if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); } ctx.stroke(); ctx.restore();
  }
  function poly(ctx, pts, fill, stroke, alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for(var i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke();} ctx.restore();
  }
  function glowBg(ctx,w,h,ts,interaction){
    var cx=w*0.5, cy=h*0.5, r=Math.min(w,h)*0.48, hover=interaction.mouse.inside ? 1 : 0;
    ctx.clearRect(0,0,w,h);
    var bg = ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.8);
    bg.addColorStop(0,'rgba(255,227,152,.18)'); bg.addColorStop(0.38,'rgba(64,128,255,.10)'); bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(cx,cy,r*1.8,0,Math.PI*2); ctx.fill();
    var glow = ctx.createRadialGradient(interaction.mouse.glowX, interaction.mouse.glowY, 0, interaction.mouse.glowX, interaction.mouse.glowY, r*0.55);
    glow.addColorStop(0,'rgba(255,245,214,'+(0.30+hover*0.18)+')');
    glow.addColorStop(0.28,'rgba(255,207,114,'+(0.20+hover*0.14)+')');
    glow.addColorStop(0.7,'rgba(78,132,255,'+(0.10+hover*0.10)+')');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(interaction.mouse.glowX, interaction.mouse.glowY, r*0.55, 0, Math.PI*2); ctx.fill();
  }
  function drawCursorHalo(ctx, interaction){
    if(!interaction.mouse.inside) return;
    var x=interaction.mouse.glowX, y=interaction.mouse.glowY;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    var g=ctx.createRadialGradient(x,y,0,x,y,56);
    g.addColorStop(0,'rgba(255,245,220,.36)'); g.addColorStop(0.28,'rgba(255,215,120,.24)'); g.addColorStop(1,'rgba(255,215,120,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,56,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,232,173,.42)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,28+Math.sin(performance.now()*0.008)*2,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  var particleCache = null;
  function makeParticles(){
    if(particleCache) return particleCache;
    var pts=[];
    for(var i=0;i<460;i++){
      var t = (i / 460) * Math.PI * 2;
      var rr = Math.sqrt(((i*97)%460)/460);
      var x = 0.82 * 16*Math.pow(Math.sin(t),3) / 18;
      var y = -(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)) / 18;
      x *= rr; y *= rr;
      pts.push({x:x+(Math.random()-0.5)*0.045, y:y+(Math.random()-0.5)*0.045, z:(Math.random()-0.5)*0.44, seed:Math.random()*99});
    }
    particleCache = pts; return pts;
  }

  function drawMobius(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.5, r=Math.min(w,h)*0.72, time=ts*0.00034;
    var tiltX = -interaction.mouse.ny * 0.22, tiltY = interaction.mouse.nx * 0.28;
    var ax=rad(60)+Math.sin(time*0.7)*0.08+tiltX, ay=time+tiltY, az=rad(-18)+tiltY*0.45;
    for(var band=-5; band<=5; band++){
      var v = band / 34, pts=[];
      for(var i=0;i<=240;i++){
        var u = i/240 * Math.PI*2;
        var x=(1+v*Math.cos(u/2))*Math.cos(u);
        var y=(1+v*Math.cos(u/2))*Math.sin(u);
        var z=v*Math.sin(u/2)*2.05;
        pts.push(project({x:x,y:y,z:z},cx,cy,r,ax,ay,az,3.2));
      }
      var a = 0.12 + (6-Math.abs(band))*0.036;
      line(ctx, pts, band===-5||band===5 ? 'rgba(255,236,180,.96)' : 'rgba(162,214,255,.22)', band===-5||band===5 ? 2.2+active*1.0 : 1.1, a+active*0.12);
    }
    for(var edge=0; edge<2; edge++){
      var v2=edge ? 0.17 : -0.17, pts2=[];
      for(var j=0;j<=270;j++){
        var u2=j/270*Math.PI*2;
        pts2.push(project({x:(1+v2*Math.cos(u2/2))*Math.cos(u2), y:(1+v2*Math.cos(u2/2))*Math.sin(u2), z:v2*Math.sin(u2/2)*2.05}, cx, cy, r, ax, ay, az, 3.2));
      }
      line(ctx, pts2, 'rgba(255,220,127,.98)', 2.2+active*1.7, 0.88);
      line(ctx, pts2, 'rgba(255,185,76,.22)', 8+active*5, 0.34);
    }
    drawCursorHalo(ctx, interaction);
  }

  function drawLattice(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.5, r=Math.min(w,h)*0.82, t=ts*0.001;
    var tiltX = -interaction.mouse.ny * 0.17, tiltY = interaction.mouse.nx * 0.24;
    var nodes=[];
    for(var i=0;i<18;i++){
      var a=i*0.72+t*0.18, y=(i-8.5)/8.5;
      nodes.push({x:Math.cos(a)*0.55, y:y, z:Math.sin(a)*0.55});
      nodes.push({x:Math.cos(a+Math.PI)*0.55, y:y, z:Math.sin(a+Math.PI)*0.55});
    }
    for(var c=0;c<12;c++) nodes.push({x:Math.sin(c*2.17+t*0.18)*0.9, y:Math.cos(c*1.47)*0.72, z:Math.cos(c*2.03+t*0.15)*0.78});
    var pp=nodes.map(function(n,i){
      var n2={x:n.x+Math.sin(t*1.6+i)*0.025, y:n.y+Math.cos(t*1.25+i*1.8)*0.025, z:n.z+Math.sin(t*0.9+i*2.2)*0.025};
      return project(n2,cx,cy,r,rad(-8)+tiltX,t*0.22+tiltY,rad(6)-tiltY*0.35,3.1);
    });
    for(var j=0;j<18;j++){
      line(ctx,[pp[j*2],pp[j*2+1]],'rgba(255,226,146,.52)',1.2+active*0.8,0.85);
      if(j<17){ line(ctx,[pp[j*2],pp[(j+1)*2]],'rgba(255,226,146,.42)',0.95,0.72); line(ctx,[pp[j*2+1],pp[(j+1)*2+1]],'rgba(255,226,146,.42)',0.95,0.72); }
    }
    for(var k=36;k<pp.length;k++) for(var q=k+1;q<pp.length;q++) if(Math.abs(k-q)<4){ line(ctx,[pp[k],pp[q]],'rgba(166,211,255,.22)',0.8,0.45); }
    pp.forEach(function(p,i){
      var pulse=0.7+0.3*Math.sin(t*2+i);
      var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16+active*10);
      g.addColorStop(0,'rgba(255,255,234,.96)'); g.addColorStop(0.35,'rgba(255,222,136,.75)'); g.addColorStop(1,'rgba(255,190,76,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,(11+active*5)*pulse,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(220,242,255,.95)'; ctx.beginPath(); ctx.arc(p.x,p.y,2.2+active*0.8,0,Math.PI*2); ctx.fill();
    });
    drawCursorHalo(ctx, interaction);
  }

  function drawMetaball(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.5, base=Math.min(w,h)*0.185, t=ts*0.001;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(var i=0;i<10;i++){
      var follow = i===0 && interaction.mouse.inside;
      var a=i*Math.PI*2/10 + t*(0.20+i*0.018);
      var rr=Math.min(w,h)*(0.06+0.035*Math.sin(t*0.7+i));
      var x=follow ? lerp(cx + interaction.mouse.nx*48, interaction.mouse.glowX, 0.35) : cx+Math.cos(a)*Math.min(w,h)*(0.13+0.035*Math.sin(t*0.6+i));
      var y=follow ? lerp(cy + interaction.mouse.ny*36, interaction.mouse.glowY, 0.35) : cy+Math.sin(a*1.25)*Math.min(w,h)*(0.105+0.025*Math.cos(t*0.8+i));
      var radn=base*(0.78+0.26*Math.sin(t*1.1+i*1.7)+active*0.14) + rr;
      var g=ctx.createRadialGradient(x-radn*0.28,y-radn*0.32,0,x,y,radn);
      g.addColorStop(0,'rgba(255,248,211,.94)'); g.addColorStop(0.21,'rgba(255,222,133,.76)'); g.addColorStop(0.58,'rgba(255,172,68,.38)'); g.addColorStop(1,'rgba(255,147,38,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,radn,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    for(var c=0;c<8;c++){
      var pts=[]; for(var j=0;j<=130;j++){ var u=j/130*Math.PI*2; var radc=Math.min(w,h)*(0.24+0.023*Math.sin(u*3+t*1.5+c)); pts.push({x:cx+Math.cos(u)*radc+interaction.mouse.nx*6, y:cy+Math.sin(u)*radc*0.86+interaction.mouse.ny*4}); }
      line(ctx, pts, c%2 ? 'rgba(255,244,197,.40)' : 'rgba(255,194,83,.28)', c===0 ? 1.9 : 1.0, 0.42);
    }
    drawCursorHalo(ctx, interaction);
  }

  function drawParticles(ctx,w,h,ts,active,interaction,root){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.51, scale=Math.min(w,h)*0.29, t=ts*0.001;
    var rect=root.getBoundingClientRect();
    var mx=interaction.mouse.x-rect.left, my=interaction.mouse.y-rect.top;
    var pts=makeParticles();
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      var x=cx+(p.x*Math.cos(t*0.16)-p.z*Math.sin(t*0.16))*scale;
      var y=cy+p.y*scale+Math.sin(t*1.2+p.seed)*3.5;
      var dx=x-mx, dy=y-my, dist=Math.sqrt(dx*dx+dy*dy);
      if(interaction.mouse.inside && dist<126){ var push=(126-dist)/126; x += dx/(dist||1)*push*42; y += dy/(dist||1)*push*42; }
      var tw=0.55+0.45*Math.sin(t*2.4+p.seed);
      ctx.fillStyle='rgba(255,224,137,'+(0.32+tw*0.48)+')'; ctx.beginPath(); ctx.arc(x,y,1.0+tw*1.35+active*0.8,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    var leaf=[]; for(var j=0;j<=100;j++){ var u=j/100*Math.PI*2; leaf.push({x:cx+(16*Math.pow(Math.sin(u),3)/18)*scale, y:cy-(13*Math.cos(u)-5*Math.cos(2*u)-2*Math.cos(3*u)-Math.cos(4*u))/18*scale}); }
    line(ctx, leaf, 'rgba(255,236,174,.42)', 1.2, 0.65);
    drawCursorHalo(ctx, interaction);
  }

  function drawWave(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.53, R=Math.min(w,h)*0.34, t=ts*0.00032;
    for(var k=0;k<30;k++){
      var pts=[], phase=t+k*0.115;
      for(var i=0;i<=360;i++){
        var u=i/360*Math.PI*2;
        var influence = interaction.mouse.inside ? Math.exp(-Math.pow((i/360 - (interaction.mouse.nx+1)/2)*2.2,2))*20*interaction.mouse.ny : 0;
        var x=cx+Math.sin(u*3+phase)*R*(1+0.05*Math.sin(k)) + Math.sin(u*7-phase)*R*0.18;
        var y=cy+Math.cos(u*2-phase)*R*0.46 + Math.sin(u*5+k*0.2)*R*0.15 + influence;
        var tilt=(y-cy)*0.32; pts.push({x:x,y:y+tilt});
      }
      line(ctx, pts, k%3===0?'rgba(255,235,172,.66)':'rgba(255,199,91,.35)', 0.75+(k%5===0?0.6:0)+active*0.38, 0.34+k/78);
    }
    drawCursorHalo(ctx, interaction);
  }

  function iso(x,y,z,cx,cy,s){ return {x:cx+(x-y)*s, y:cy+(x+y)*s*0.47-z*s}; }
  function drawCube(ctx,cx,cy,s,x,y,z,h,alpha){
    var A=iso(x,y,z,cx,cy,s), B=iso(x+1,y,z,cx,cy,s), C=iso(x+1,y+1,z,cx,cy,s), D=iso(x,y+1,z,cx,cy,s);
    var A2=iso(x,y,z+h,cx,cy,s), B2=iso(x+1,y,z+h,cx,cy,s), C2=iso(x+1,y+1,z+h,cx,cy,s), D2=iso(x,y+1,z+h,cx,cy,s);
    poly(ctx,[A2,B2,C2,D2],'rgba(255,236,170,.30)','rgba(255,239,188,.76)',alpha);
    poly(ctx,[B,B2,C2,C],'rgba(255,184,74,.24)','rgba(255,220,140,.62)',alpha);
    poly(ctx,[C,C2,D2,D],'rgba(61,116,216,.18)','rgba(255,220,140,.42)',alpha);
  }
  function drawCubes(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5+interaction.mouse.nx*14, cy=h*0.62+interaction.mouse.ny*12, s=Math.min(w,h)*0.08, t=ts*0.001;
    var cubes=[[-1.5,-0.5,0,1.8],[-0.5,-0.5,0,2.4],[0.5,-0.5,0,1.55],[-1.0,0.5,0,1.15],[0,0.5,0,2.05],[1,0.5,0,1.3],[-0.1,-1.4,0,1.0]];
    cubes.forEach(function(c,i){ var p=clamp((Math.sin(t*0.55+i*0.47)+1)/2 + active*0.28,0.15,1); drawCube(ctx,cx,cy,s,c[0],c[1],-0.15+(1-p)*2.2,c[3]*p,0.84); });
    for(var i=0;i<8;i++){ var x1=cx+(i-4)*s*0.85; line(ctx,[{x:x1,y:cy+s*2.8},{x:x1+s*2.2,y:cy+s*3.8}], 'rgba(255,225,143,.22)', 0.9, 0.55); }
    drawCursorHalo(ctx, interaction);
  }

  function drawTopo(ctx,w,h,ts,active,interaction){
    glowBg(ctx,w,h,ts,interaction);
    var cx=w*0.5, cy=h*0.57, R=Math.min(w,h)*0.43, t=ts*0.00055;
    for(var l=0;l<22;l++){
      var pts=[], yy=-R*0.68+l*(R*1.36/21);
      for(var i=0;i<=150;i++){
        var x=-R+i*(R*2/150);
        var pointerLift = interaction.mouse.inside ? Math.exp(-Math.pow((x/R - interaction.mouse.nx*0.8),2)*2.5)*interaction.mouse.ny*16 : 0;
        var height=Math.sin(x*0.025+t*3+l*0.45)*18 + Math.cos((x+yy)*0.021-t*2)*10 + pointerLift;
        var persp=0.55+0.45*(l/22);
        pts.push({x:cx+x*persp, y:cy+yy*0.46+height*persp+(l-11)*2});
      }
      line(ctx, pts, l%4===0?'rgba(255,235,170,.70)':'rgba(255,206,101,.38)', l%4===0?1.4:1, 0.42+l/35);
    }
    drawCursorHalo(ctx, interaction);
  }

  function renderer(api, kind, interaction, root){
    var ctx = api.ctx;
    function frame(ts){
      state.frames++;
      var rect = api.canvas.getBoundingClientRect();
      var w=rect.width, h=rect.height;
      if(w < 10 || h < 10){ requestAnimationFrame(frame); return; }
      var active = interaction.update();
      if(kind === 'mobius') drawMobius(ctx,w,h,ts,active,interaction);
      else if(kind === 'lattice') drawLattice(ctx,w,h,ts,active,interaction);
      else if(kind === 'metaball') drawMetaball(ctx,w,h,ts,active,interaction);
      else if(kind === 'particles') drawParticles(ctx,w,h,ts,active,interaction,root);
      else if(kind === 'wave') drawWave(ctx,w,h,ts,active,interaction);
      else if(kind === 'cubes') drawCubes(ctx,w,h,ts,active,interaction);
      else if(kind === 'topo') drawTopo(ctx,w,h,ts,active,interaction);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  ready(function(){
    try {
      var kind = getKind();
      if(!kind) return;
      state.kind = kind; state.scene = sceneName(kind);
      var root = ensureRoot(kind);
      var api = setupCanvas(root);
      var interaction = initInteraction(root);
      revealRoot(root);
      if(api) renderer(api, kind, interaction, root);
      state.mounted = true; state.rootExists = !!document.getElementById('dgProSceneV196Root'); state.script = 'loaded';
    } catch(e) {
      state.errors.push(e && (e.stack || e.message) || String(e));
      console.error('[DIANAFARM v197 premium scenes]', e);
    }
  });
})();
