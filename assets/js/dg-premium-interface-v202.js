(function(){
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function forcePlayState(el, state){
    if(!el) return;
    el.style.animationPlayState = state;
  }

  function initGlobalGlow(){
    if(reduce || coarse) return;
    var root = document.documentElement;
    var x = window.innerWidth * 0.5;
    var y = window.innerHeight * 0.28;
    function apply(){
      root.style.setProperty('--premium-cursor-x', x + 'px');
      root.style.setProperty('--premium-cursor-y', y + 'px');
    }
    apply();
    window.addEventListener('mousemove', function(e){
      x = e.clientX;
      y = e.clientY;
      apply();
    }, {passive:true});
  }

  function initMarqueePause(){
    var marquee = document.querySelector('.wow-marquee--blog');
    if(!marquee) return;
    var lines = marquee.querySelectorAll('.wow-marquee__line');
    var words = marquee.querySelectorAll('.wow-marquee__word');
    function pause(){ lines.forEach(function(line){ forcePlayState(line, 'paused'); }); }
    function resume(){ lines.forEach(function(line){ forcePlayState(line, 'running'); }); }
    words.forEach(function(word){
      word.addEventListener('mouseenter', pause, {passive:true});
      word.addEventListener('mouseleave', resume, {passive:true});
      word.addEventListener('focus', pause, {passive:true});
      word.addEventListener('blur', resume, {passive:true});
    });
    marquee.addEventListener('mouseleave', resume, {passive:true});
  }

  function resizeCanvas(canvas, ctx){
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    if(ctx){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    return {w: rect.width, h: rect.height};
  }

  function line(ctx, pts, color, width, alpha, glow){
    if(!pts || pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if(glow){ ctx.shadowBlur = glow; ctx.shadowColor = color; }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }
  function poly(ctx, pts, fill, stroke, alpha){
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }

  function mountPremiumHeroCanvas(){
    var page = document.body && document.body.getAttribute('data-page');
    if(['real-estate', 'cars', 'parking'].indexOf(page) === -1) return;
    var stage = document.querySelector('.v202-hero-stage[data-hero-scene]');
    if(!stage) return;
    var canvas = stage.querySelector('canvas');
    if(!canvas){
      canvas = document.createElement('canvas');
      stage.insertBefore(canvas, stage.firstChild);
    }
    var ctx = canvas.getContext('2d', {alpha:true, desynchronized:true});
    if(!ctx) return;
    var pointer = {x:0.5, y:0.5, tx:0.5, ty:0.5, inside:false};
    var size = resizeCanvas(canvas, ctx);
    function updateGlowVars(clientX, clientY){
      var rect = stage.getBoundingClientRect();
      var gx = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
      var gy = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
      stage.style.setProperty('--stage-glow-x', clamp(gx, 0, 100).toFixed(2));
      stage.style.setProperty('--stage-glow-y', clamp(gy, 0, 100).toFixed(2));
    }
    if(!coarse){
      stage.addEventListener('pointermove', function(e){
        var rect = stage.getBoundingClientRect();
        pointer.inside = true;
        pointer.tx = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
        pointer.ty = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
        updateGlowVars(e.clientX, e.clientY);
      }, {passive:true});
      stage.addEventListener('pointerleave', function(){
        pointer.inside = false;
        pointer.tx = 0.5;
        pointer.ty = 0.5;
      }, {passive:true});
    }
    window.addEventListener('resize', function(){ size = resizeCanvas(canvas, ctx); }, {passive:true});

    function rotate(p, ax, ay){
      var x = p.x, y = p.y, z = p.z;
      var c = Math.cos(ax), s = Math.sin(ax);
      var ny = y * c - z * s;
      var nz = y * s + z * c;
      y = ny; z = nz;
      c = Math.cos(ay); s = Math.sin(ay);
      var nx = x * c + z * s;
      nz = -x * s + z * c;
      x = nx; z = nz;
      return {x:x, y:y, z:z};
    }
    function project(p, cx, cy, sc, ax, ay){
      var q = rotate(p, ax, ay);
      var depth = 3.2 - q.z;
      var k = 1 / Math.max(0.55, depth);
      return {x: cx + q.x * sc * k, y: cy + q.y * sc * k, z:q.z, k:k};
    }

    function drawBackground(w, h, t){
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w * 0.54, h * 0.48, 0, w * 0.54, h * 0.48, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(255,220,120,0.12)');
      g.addColorStop(0.34, 'rgba(48,108,255,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var halo = ctx.createRadialGradient(w * (0.50 + (pointer.x - 0.5) * 0.18), h * (0.48 + (pointer.y - 0.5) * 0.18), 0, w * (0.50 + (pointer.x - 0.5) * 0.18), h * (0.48 + (pointer.y - 0.5) * 0.18), Math.min(w, h) * 0.34);
      halo.addColorStop(0, 'rgba(255,245,210,0.20)');
      halo.addColorStop(0.45, 'rgba(255,204,96,0.10)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
    }

function drawRealEstate(w, h, t){
  drawBackground(w, h, t);
  var cx = w * 0.56;
  var cy = h * 0.57;
  var sc = Math.min(w, h) * 0.86;
  var ay = t * 0.00022 + (pointer.x - 0.5) * 0.44;
  var ax = -0.24 + (0.5 - pointer.y) * 0.20;
  function q(pt){ return project(pt, cx, cy, sc, ax, ay); }
  function cuboid(x, y, z, ww, hh, dd, fillAlpha){
    var x0=x, x1=x+ww, y0=y, y1=y-hh, z0=z, z1=z+dd;
    var verts = [
      q({x:x0,y:y0,z:z0}), q({x:x1,y:y0,z:z0}), q({x:x1,y:y1,z:z0}), q({x:x0,y:y1,z:z0}),
      q({x:x0,y:y0,z:z1}), q({x:x1,y:y0,z:z1}), q({x:x1,y:y1,z:z1}), q({x:x0,y:y1,z:z1})
    ];
    poly(ctx, [verts[3],verts[2],verts[6],verts[7]], 'rgba(74,140,255,' + (fillAlpha * 0.20) + ')', null, 0.9);
    poly(ctx, [verts[2],verts[1],verts[5],verts[6]], 'rgba(255,220,136,' + (fillAlpha * 0.10) + ')', null, 0.85);
    var edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    edges.forEach(function(pair, idx){
      line(ctx, [verts[pair[0]], verts[pair[1]]], idx < 8 ? 'rgba(255,236,188,0.84)' : 'rgba(96,164,255,0.46)', idx < 8 ? 1.55 : 1.1, 0.95, idx < 8 ? 10 : 0);
    });
    return verts;
  }

  ctx.save();
  var glow = ctx.createRadialGradient(cx, cy - sc * 0.02, 0, cx, cy - sc * 0.02, sc * 0.74);
  glow.addColorStop(0, 'rgba(255,240,195,0.22)');
  glow.addColorStop(0.30, 'rgba(255,214,124,0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy - sc * 0.02, sc * 0.60, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  for(var f = 0; f < 14; f++){
    var yy = h * 0.86 - f * 14.5;
    line(ctx, [{x:w * 0.14, y:yy}, {x:w * 0.92, y:yy - 28}], 'rgba(78,144,255,' + (0.12 + f * 0.011) + ')', 1, 0.52);
  }
  for(var fx = 0; fx < 13; fx++){
    var px = w * 0.16 + fx * w * 0.056;
    line(ctx, [{x:px, y:h * 0.86}, {x:cx + (px - cx) * 0.16, y:h * 0.61}], 'rgba(255,220,136,0.13)', 1, 0.45);
  }
  for(var sea = 0; sea < 4; sea++){
    var pts=[];
    for(var si=0; si<=120; si++){
      var u=si/120;
      pts.push({x:w*0.08 + u*w*0.84, y:h*0.72 + sea*10 + Math.sin(u*Math.PI*2 + t*0.0012 + sea) * 2.5});
    }
    line(ctx, pts, sea === 0 ? 'rgba(255,220,140,0.34)' : 'rgba(78,144,255,0.16)', sea === 0 ? 1.2 : 1, 0.8);
  }

  var deck = cuboid(-0.62, 0.36, -0.18, 1.16, 0.06, 0.34, 1.0);
  var lower = cuboid(-0.50, 0.29, -0.04, 0.64, 0.23, 0.24, 1.0);
  var tower = cuboid(0.04, 0.29, 0.02, 0.34, 0.52, 0.20, 1.0);
  var upper = cuboid(-0.22, 0.03, 0.08, 0.56, 0.20, 0.18, 1.0);
  var pent = cuboid(-0.02, -0.17, 0.13, 0.20, 0.12, 0.12, 1.0);

  // window strips and terrace light lines
  for(var s=0; s<5; s++){
    var sy = 0.25 - s * 0.045;
    line(ctx, [q({x:-0.44,y:sy,z:0.20}), q({x:0.08,y:sy,z:0.20})], 'rgba(255,236,188,0.48)', 1.0, 0.82);
  }
  for(var s2=0; s2<7; s2++){
    var sy2 = 0.23 - s2 * 0.07;
    line(ctx, [q({x:0.10,y:sy2,z:0.21}), q({x:0.34,y:sy2,z:0.21})], 'rgba(255,236,188,0.44)', 1.0, 0.8);
  }
  line(ctx, [q({x:-0.52,y:0.32,z:0.28}), q({x:0.48,y:0.32,z:0.28})], 'rgba(255,220,136,0.26)', 1.3, 0.9, 6);
  line(ctx, [q({x:-0.28,y:0.05,z:0.24}), q({x:0.30,y:0.05,z:0.24})], 'rgba(255,220,136,0.24)', 1.15, 0.88, 5);

  // premium light beacons
  [q({x:-0.12,y:-0.17,z:0.19}), q({x:0.17,y:-0.28,z:0.18}), q({x:0.20,y:-0.02,z:0.18}), q({x:-0.32,y:0.08,z:0.14})].forEach(function(pt, idx){
    var pulse = 0.62 + 0.38 * Math.sin(t * 0.002 + idx * 1.4);
    ctx.save();
    var grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 18 + pulse * 12);
    grd.addColorStop(0, 'rgba(255,248,222,' + (0.76 + pulse * 0.12) + ')');
    grd.addColorStop(0.35, 'rgba(255,214,124,' + (0.36 + pulse * 0.16) + ')');
    grd.addColorStop(1, 'rgba(255,214,124,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 18 + pulse * 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  for(var r=0; r<3; r++){
    var orbitR = sc * (0.24 + r * 0.07);
    ctx.save();
    ctx.strokeStyle = r === 1 ? 'rgba(255,228,170,0.28)' : 'rgba(83,136,255,0.18)';
    ctx.lineWidth = r === 1 ? 1.3 : 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy - sc * 0.03, orbitR, orbitR * 0.34, 0.28 + r * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for(var p=0; p<8; p++){
    var a = t * 0.00085 + p * (Math.PI * 2 / 8);
    var px2 = cx + Math.cos(a) * sc * 0.31;
    var py2 = cy - sc * 0.04 + Math.sin(a) * sc * 0.10;
    ctx.save();
    var pg = ctx.createRadialGradient(px2, py2, 0, px2, py2, 9);
    pg.addColorStop(0, 'rgba(255,238,196,0.92)');
    pg.addColorStop(0.40, 'rgba(255,214,124,0.45)');
    pg.addColorStop(1, 'rgba(255,214,124,0)');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px2, py2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}


function drawCars(w, h, t){
  drawBackground(w, h, t);
  var cx = w * 0.50;
  var horizonY = h * 0.42;
  var roadBottomY = h * 0.90;
  var roadHalfTop = w * 0.11;
  var roadHalfBottom = w * 0.44;
  var driftX = (pointer.x - 0.5) * w * 0.04;
  var driftY = (pointer.y - 0.5) * h * 0.03;
  var speed = 1.75;

  ctx.save();
  var sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, 'rgba(16,44,108,0.10)');
  sky.addColorStop(0.46, 'rgba(38,86,214,0.08)');
  sky.addColorStop(1, 'rgba(4,12,26,0.02)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Wind flow lines above the road
  for(var band = 0; band < 18; band++){
    var pts = [];
    var baseY = horizonY - 78 + band * 11.5;
    for(var i = 0; i <= 160; i++){
      var u = i / 160;
      var x = -w * 0.05 + u * w * 1.1;
      var bend = Math.sin(u * Math.PI * 2.1 + band * 0.34 + t * 0.0026 * speed) * (2.8 + band * 0.14);
      var gust = Math.sin(u * Math.PI * 4.3 - t * 0.0032 * speed + band * 0.22) * 1.25;
      var y = baseY + bend + gust + driftY * 0.30;
      pts.push({x:x, y:y});
    }
    var warm = band % 5 === 0;
    line(ctx, pts, warm ? 'rgba(255,228,160,0.34)' : 'rgba(92,164,255,0.22)', warm ? 1.3 : 0.95, 0.80, warm ? 8 : 0);
  }

  // Subtle horizon glow
  ctx.save();
  var horizonGlow = ctx.createRadialGradient(cx + driftX * 0.4, horizonY + 18, 0, cx + driftX * 0.4, horizonY + 18, w * 0.42);
  horizonGlow.addColorStop(0, 'rgba(255,236,190,0.20)');
  horizonGlow.addColorStop(0.32, 'rgba(255,214,124,0.09)');
  horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Road surface
  var road = [
    {x:cx - roadHalfTop + driftX * 0.14, y:horizonY + driftY * 0.18},
    {x:cx + roadHalfTop + driftX * 0.14, y:horizonY + driftY * 0.18},
    {x:cx + roadHalfBottom + driftX, y:roadBottomY},
    {x:cx - roadHalfBottom + driftX, y:roadBottomY}
  ];
  ctx.save();
  var roadFill = ctx.createLinearGradient(0, horizonY, 0, roadBottomY);
  roadFill.addColorStop(0, 'rgba(18,34,70,0.24)');
  roadFill.addColorStop(0.48, 'rgba(18,48,120,0.46)');
  roadFill.addColorStop(1, 'rgba(7,24,68,0.92)');
  poly(ctx, road, roadFill, 'rgba(255,233,180,0.24)', 1);
  ctx.restore();

  // Side rails / road edges
  line(ctx, [road[0], road[3]], 'rgba(255,240,205,0.94)', 2.4, 0.96, 15);
  line(ctx, [road[1], road[2]], 'rgba(255,240,205,0.94)', 2.4, 0.96, 15);
  line(ctx, [road[0], road[1]], 'rgba(255,230,170,0.30)', 1.2, 0.82, 6);

  // Moving lane markers heading toward viewer
  for(var m = 0; m < 13; m++){
    var f = ((t * 0.00092 * speed) + m / 13) % 1;
    var eased = f * f;
    var y1 = horizonY + (roadBottomY - horizonY) * eased;
    var y2 = horizonY + (roadBottomY - horizonY) * Math.min(1, eased + 0.055 + f * 0.03);
    var hw1 = roadHalfTop + (roadHalfBottom - roadHalfTop) * eased;
    var hw2 = roadHalfTop + (roadHalfBottom - roadHalfTop) * Math.min(1, eased + 0.055 + f * 0.03);
    var x1 = cx + driftX * 0.42;
    var x2 = cx + driftX * 0.62;
    var marker = [
      {x:x1 - hw1 * 0.030, y:y1},
      {x:x1 + hw1 * 0.030, y:y1},
      {x:x2 + hw2 * 0.043, y:y2},
      {x:x2 - hw2 * 0.043, y:y2}
    ];
    poly(ctx, marker, 'rgba(255,234,182,' + (0.22 + f * 0.60) + ')', null, 1);
  }

  // Fast side streaks on the road
  for(var s = 0; s < 26; s++){
    var p = ((t * 0.00155 * speed) + s * 0.071) % 1;
    var y = horizonY + (roadBottomY - horizonY) * p;
    var widthFactor = p * p;
    var half = roadHalfTop + (roadHalfBottom - roadHalfTop) * widthFactor;
    var leftX = cx - half + driftX * 0.76;
    var rightX = cx + half + driftX * 0.76;
    var streakLen = 14 + p * 54;
    line(ctx, [{x:leftX - streakLen, y:y}, {x:leftX - 6, y:y + 1.5}], 'rgba(84,150,255,' + (0.10 + p * 0.22) + ')', 1.0 + p * 1.2, 0.88);
    line(ctx, [{x:rightX + 6, y:y + 1.5}, {x:rightX + streakLen, y:y}], 'rgba(84,150,255,' + (0.10 + p * 0.22) + ')', 1.0 + p * 1.2, 0.88);
  }

  // Center speed glow / road pulse
  for(var pulse = 0; pulse < 4; pulse++){
    var pr = (t * 0.0011 * speed + pulse * 0.24) % 1;
    var py = horizonY + (roadBottomY - horizonY) * pr;
    var alpha = 0.18 * (1 - pr) + 0.06;
    line(ctx, [
      {x:cx - (roadHalfTop + (roadHalfBottom - roadHalfTop) * pr) * 0.86 + driftX * 0.65, y:py},
      {x:cx + (roadHalfTop + (roadHalfBottom - roadHalfTop) * pr) * 0.86 + driftX * 0.65, y:py}
    ], 'rgba(255,222,138,' + alpha + ')', 1.2 + pr * 1.8, 0.92, 8);
  }

  // Ambient particles moving with the wind
  for(var d = 0; d < 24; d++){
    var px = (t * (0.09 * speed + (d % 5) * 0.012) + d * 37) % (w + 180) - 90;
    var py = horizonY - 80 + (d % 12) * 17 + Math.sin(t * 0.0018 * speed + d * 0.9) * 8;
    ctx.save();
    ctx.fillStyle = d % 4 === 0 ? 'rgba(255,230,170,0.32)' : 'rgba(102,170,255,0.18)';
    ctx.fillRect(px, py, 12 + (d % 4) * 3, 1.2);
    ctx.restore();
  }
}

    function drawParking(w, h, t){
      drawBackground(w, h, t);
      var cx = w * 0.53, cy = h * 0.52;
      var R = Math.min(w, h) * 0.44;
      // radar base rings
      for(var i = 1; i <= 6; i++){
        ctx.save();
        ctx.strokeStyle = i % 2 ? 'rgba(255,220,140,0.22)' : 'rgba(79,152,255,0.18)';
        ctx.lineWidth = i === 6 ? 1.4 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * i / 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // grids
      for(var g = 0; g < 16; g++){
        var ang = (Math.PI * 2 / 16) * g + t * 0.00008;
        line(ctx, [{x:cx, y:cy}, {x:cx + Math.cos(ang) * R, y:cy + Math.sin(ang) * R}], g % 2 ? 'rgba(255,214,124,0.10)' : 'rgba(89,154,255,0.09)', 1, 0.6);
      }
      var sweep = (t * 0.00095) % (Math.PI * 2);
      // beam
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sweep - 0.28, sweep + 0.14);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,222,128,0.16)';
      ctx.fill();
      ctx.restore();
      // premium slots orbit
      var slots = [
        [-0.56,-0.34],[-0.32,-0.48],[-0.06,-0.56],[0.24,-0.48],[0.50,-0.28],[0.58,0.02],[0.46,0.30],[0.18,0.50],[-0.14,0.56],[-0.42,0.40],[-0.58,0.08]
      ];
      slots.forEach(function(slot, idx){
        var x = cx + slot[0] * R * 0.96 + Math.sin(t * 0.0008 + idx * 0.7) * 3.5;
        var y = cy + slot[1] * R * 0.96 + Math.cos(t * 0.0009 + idx) * 3.5;
        var phase = Math.abs(Math.atan2(y - cy, x - cx) - sweep);
        var active = phase < 0.34 ? 1 : 0.42;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(slot[0] * 0.26 + Math.sin(t * 0.001 + idx) * 0.02);
        var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        grd.addColorStop(0, 'rgba(255,250,228,' + (0.92 * active) + ')');
        grd.addColorStop(0.36, 'rgba(255,214,124,' + (0.54 * active) + ')');
        grd.addColorStop(1, 'rgba(255,214,124,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,236,182,' + (0.64 + active * 0.22) + ')';
        ctx.lineWidth = 1.25;
        ctx.strokeRect(-16, -22, 32, 44);
        line(ctx, [{x:-8,y:0},{x:8,y:0}], 'rgba(255,236,182,0.58)', 1.1, 0.88);
        ctx.restore();
      });
      // central premium hub
      for(var r=0;r<3;r++){
        var rr = 16 + r * 12;
        ctx.save();
        ctx.strokeStyle = r === 0 ? 'rgba(255,236,182,0.84)' : 'rgba(83,136,255,0.20)';
        ctx.lineWidth = r === 0 ? 1.8 : 1;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // sweeping highlight arc
      ctx.save();
      ctx.strokeStyle = 'rgba(255,236,180,0.90)';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.arc(cx, cy, R, sweep - 0.018, sweep + 0.018);
      ctx.stroke();
      ctx.restore();
      // orbital dots
      for(var d=0; d<10; d++){
        var a = t * 0.0012 + d * (Math.PI * 2 / 10);
        var px = cx + Math.cos(a) * R * 0.74;
        var py = cy + Math.sin(a) * R * 0.74;
        ctx.save();
        var pg = ctx.createRadialGradient(px, py, 0, px, py, 8);
        pg.addColorStop(0, 'rgba(255,240,200,0.82)');
        pg.addColorStop(0.38, 'rgba(255,214,124,0.42)');
        pg.addColorStop(1, 'rgba(255,214,124,0)');
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    function frame(ts){
      pointer.x = lerp(pointer.x, pointer.tx, 0.08);
      pointer.y = lerp(pointer.y, pointer.ty, 0.08);
      size = resizeCanvas(canvas, ctx);
      var w = size.w, h = size.h;
      if(w < 10 || h < 10){ requestAnimationFrame(frame); return; }
      if(page === 'real-estate') drawRealEstate(w, h, ts);
      else if(page === 'cars') drawCars(w, h, ts);
      else drawParking(w, h, ts);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  ready(function(){
    initGlobalGlow();
    initMarqueePause();
    mountPremiumHeroCanvas();
  });
})();
