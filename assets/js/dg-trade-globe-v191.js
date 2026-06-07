(() => {
  'use strict';

  const VERSION = 'v191-trade-canvas-js-globe';
  const stage = document.querySelector('[data-dg-trade-globe-stage]');
  if (!stage) return;

  const canvas = stage.querySelector('[data-dg-trade-globe-canvas]');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const DPR_MAX = 2;
  const GOLD = [222, 177, 112];
  const CREAM = [255, 242, 196];
  const BLUE = [92, 145, 255];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let radius = 1;
  let cx = 0;
  let cy = 0;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let activeRouteBoost = 0;
  let hoverIndex = -1;
  let mouseX = 0;
  let mouseY = 0;
  let parallaxX = 0;
  let parallaxY = 0;

  const nodes = [
    { name: 'Bulgaria', lat: 42.70, lon: 25.48, power: 1.24 },
    { name: 'UAE', lat: 24.45, lon: 54.37, power: 1.10 },
    { name: 'Uzbekistan', lat: 41.31, lon: 69.24, power: .92 },
    { name: 'China', lat: 31.23, lon: 121.47, power: .98 },
    { name: 'India', lat: 19.07, lon: 72.88, power: .86 },
    { name: 'Germany', lat: 52.52, lon: 13.40, power: .74 },
    { name: 'Egypt', lat: 30.04, lon: 31.23, power: .68 },
    { name: 'Singapore', lat: 1.35, lon: 103.82, power: .80 },
    { name: 'Turkey', lat: 41.01, lon: 28.97, power: .68 },
  ];

  const nodeIndex = Object.fromEntries(nodes.map((n, i) => [n.name, i]));
  const routes = [
    ['Bulgaria', 'UAE', .00, 1.00],
    ['Bulgaria', 'Uzbekistan', .18, .93],
    ['Bulgaria', 'China', .31, .78],
    ['UAE', 'India', .44, .96],
    ['UAE', 'Singapore', .62, .70],
    ['Bulgaria', 'Germany', .74, .64],
    ['Turkey', 'Egypt', .86, .74],
  ].map(([a, b, phase, speed], i) => ({
    a: nodeIndex[a], b: nodeIndex[b], phase, speed, group: i % 3
  }));

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  const stars = Array.from({ length: 86 }, (_, i) => ({
    x: seeded(i + 1), y: seeded(i + 111), r: .4 + seeded(i + 222) * 1.6, p: seeded(i + 333) * TAU
  }));

  function rgba(rgb, a) {
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const nextW = Math.max(1, Math.round(rect.width));
    const nextH = Math.max(1, Math.round(rect.height));
    const nextDpr = Math.min(DPR_MAX, Math.max(1, window.devicePixelRatio || 1));
    if (nextW === w && nextH === h && nextDpr === dpr) return;
    w = nextW;
    h = nextH;
    dpr = nextDpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * .5;
    cy = h * .5;
    radius = Math.min(w, h) * .305;
  }

  function rotate3D(p, rotY, rotX, rotZ) {
    let { x, y, z } = p;
    let cos = Math.cos(rotY), sin = Math.sin(rotY);
    let nx = x * cos + z * sin;
    let nz = -x * sin + z * cos;
    x = nx; z = nz;
    cos = Math.cos(rotX); sin = Math.sin(rotX);
    let ny = y * cos - z * sin;
    nz = y * sin + z * cos;
    y = ny; z = nz;
    cos = Math.cos(rotZ); sin = Math.sin(rotZ);
    nx = x * cos - y * sin;
    ny = x * sin + y * cos;
    return { x: nx, y: ny, z };
  }

  function spherePoint(lat, lon, rotY, rotX, rotZ, rMul = 1) {
    const phi = lat * DEG;
    const lam = lon * DEG;
    const p = {
      x: Math.cos(phi) * Math.sin(lam),
      y: -Math.sin(phi),
      z: Math.cos(phi) * Math.cos(lam)
    };
    const rp = rotate3D(p, rotY, rotX, rotZ);
    const persp = 1.0 / (1.42 - rp.z * .34);
    return {
      x: cx + rp.x * radius * rMul * persp,
      y: cy + rp.y * radius * rMul * persp,
      z: rp.z,
      scale: persp,
      front: rp.z > -0.08
    };
  }

  function vectorFromLatLon(lat, lon) {
    const phi = lat * DEG;
    const lam = lon * DEG;
    return {
      x: Math.cos(phi) * Math.sin(lam),
      y: -Math.sin(phi),
      z: Math.cos(phi) * Math.cos(lam)
    };
  }

  function normalize(v) {
    const m = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / m, y: v.y / m, z: v.z / m };
  }

  function slerp(a, b, t) {
    let dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
    const omega = Math.acos(dot);
    if (omega < 0.0001) return a;
    const so = Math.sin(omega);
    const s1 = Math.sin((1 - t) * omega) / so;
    const s2 = Math.sin(t * omega) / so;
    return normalize({ x: a.x * s1 + b.x * s2, y: a.y * s1 + b.y * s2, z: a.z * s1 + b.z * s2 });
  }

  function vectorToLatLon(v) {
    const lat = -Math.asin(v.y) / DEG;
    const lon = Math.atan2(v.x, v.z) / DEG;
    return { lat, lon };
  }

  function drawPolyline(points, stroke, width, alpha, glow = 0) {
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (glow) {
      ctx.shadowBlur = glow;
      ctx.shadowColor = stroke;
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawGrid(rotY, rotX, rotZ) {
    const latitudes = [-60, -40, -20, 0, 20, 40, 60];
    const longitudes = Array.from({ length: 12 }, (_, i) => i * 30);

    for (const lat of latitudes) {
      const front = [];
      const back = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = spherePoint(lat, lon, rotY, rotX, rotZ);
        (p.front ? front : back).push(p);
        if (p.front && back.length) { drawPolyline(back, rgba(BLUE, .18), 1.0, .45); back.length = 0; }
        if (!p.front && front.length) { drawPolyline(front, rgba(CREAM, .24), 1.15, .55, 3); front.length = 0; }
      }
      drawPolyline(back, rgba(BLUE, .14), 1, .45);
      drawPolyline(front, rgba(CREAM, .28), 1.2, .62, 3);
    }

    for (const lon of longitudes) {
      const front = [];
      const back = [];
      for (let lat = -78; lat <= 78; lat += 4) {
        const p = spherePoint(lat, lon, rotY, rotX, rotZ);
        (p.front ? front : back).push(p);
        if (p.front && back.length) { drawPolyline(back, rgba(BLUE, .15), .9, .42); back.length = 0; }
        if (!p.front && front.length) { drawPolyline(front, rgba(CREAM, .22), 1.05, .50, 3); front.length = 0; }
      }
      drawPolyline(back, rgba(BLUE, .12), .9, .40);
      drawPolyline(front, rgba(CREAM, .23), 1.05, .55, 3);
    }

    // Outer glass rim.
    const rim = ctx.createRadialGradient(cx, cy, radius * .45, cx, cy, radius * 1.25);
    rim.addColorStop(0, 'rgba(255,255,255,0)');
    rim.addColorStop(.72, 'rgba(255,242,195,0.05)');
    rim.addColorStop(.96, 'rgba(255,242,195,0.32)');
    rim.addColorStop(1, 'rgba(222,177,112,0.02)');
    ctx.save();
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.09, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CREAM, .38);
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 18;
    ctx.shadowColor = rgba(GOLD, .52);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoutes(rotY, rotX, rotZ) {
    routes.forEach((route, routeIndex) => {
      const a = nodes[route.a];
      const b = nodes[route.b];
      const av = vectorFromLatLon(a.lat, a.lon);
      const bv = vectorFromLatLon(b.lat, b.lon);
      const ptsFront = [];
      const ptsBack = [];
      const sample = 82;
      for (let i = 0; i <= sample; i++) {
        const t = i / sample;
        const v = slerp(av, bv, t);
        const ll = vectorToLatLon(v);
        const arcLift = 1 + Math.sin(t * Math.PI) * .24;
        const p = spherePoint(ll.lat, ll.lon, rotY, rotX, rotZ, arcLift);
        (p.front ? ptsFront : ptsBack).push(p);
      }
      const isActive = hoverIndex < 0 || hoverIndex === route.group;
      const baseAlpha = isActive ? .72 : .24;
      drawPolyline(ptsBack, rgba(BLUE, .26), 1.1, baseAlpha * .55, 5);
      drawPolyline(ptsFront, rgba(GOLD, .78), isActive ? 2.0 : 1.35, baseAlpha, isActive ? 14 : 5);

      // Animated impulse on route.
      const travel = ((time * .00012 * route.speed + route.phase + activeRouteBoost) % 1 + 1) % 1;
      for (let k = 0; k < (isActive ? 2 : 1); k++) {
        const t = (travel + k * .5) % 1;
        const v = slerp(av, bv, t);
        const ll = vectorToLatLon(v);
        const p = spherePoint(ll.lat, ll.lon, rotY, rotX, rotZ, 1 + Math.sin(t * Math.PI) * .24);
        if (p.z < -0.18) continue;
        const pulse = 1 + Math.sin(time * .006 + routeIndex) * .18;
        const pr = (5.5 + 7.5 * p.scale) * pulse;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr * 4.2);
        grad.addColorStop(0, 'rgba(255,255,238,.96)');
        grad.addColorStop(.22, 'rgba(255,220,142,.82)');
        grad.addColorStop(.56, 'rgba(222,177,112,.24)');
        grad.addColorStop(1, 'rgba(222,177,112,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr * 4.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff4c7';
        ctx.shadowBlur = 24;
        ctx.shadowColor = '#ffd98a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2.2, pr * .45), 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  function drawNodes(rotY, rotX, rotZ) {
    for (const n of nodes) {
      const p = spherePoint(n.lat, n.lon, rotY, rotX, rotZ, 1.012);
      if (p.z < -0.22) continue;
      const alpha = Math.max(.25, Math.min(1, (p.z + .24) / 1.24));
      const r = (3.6 + 4.8 * n.power) * p.scale;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,245,205,.95)';
      ctx.shadowBlur = 24 * n.power;
      ctx.shadowColor = 'rgba(255,220,142,.86)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, .72);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.3, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawAmbient() {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.05);
    bg.addColorStop(0, 'rgba(255,236,180,.12)');
    bg.addColorStop(.38, 'rgba(47,91,180,.10)');
    bg.addColorStop(.72, 'rgba(9,23,48,.02)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const star of stars) {
      const sx = star.x * w;
      const sy = star.y * h;
      const twinkle = .35 + .65 * (Math.sin(time * .0014 + star.p) * .5 + .5);
      ctx.globalAlpha = .14 + twinkle * .48;
      ctx.fillStyle = star.r > 1.2 ? rgba(GOLD, .55) : rgba(CREAM, .42);
      ctx.beginPath();
      ctx.arc(sx, sy, star.r * twinkle, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function frame(now) {
    if (isPhone()) {
      raf = requestAnimationFrame(frame);
      return;
    }
    resize();
    const dt = Math.min(48, now - last);
    last = now;
    if (!prefersReducedMotion) time += dt;
    else time += dt * .18;

    parallaxX += (mouseX - parallaxX) * .045;
    parallaxY += (mouseY - parallaxY) * .045;
    activeRouteBoost *= .986;

    const rotY = time * .00019 + parallaxX * .22;
    const rotX = -12 * DEG + Math.sin(time * .00027) * 4 * DEG + parallaxY * .16;
    const rotZ = Math.sin(time * .00013) * 5 * DEG;

    drawAmbient();
    drawGrid(rotY, rotX, rotZ);
    drawRoutes(rotY, rotX, rotZ);
    drawNodes(rotY, rotX, rotZ);

    if (window.DG_TRADE_GLOBE_V191) window.DG_TRADE_GLOBE_V191.frames++;
    raf = requestAnimationFrame(frame);
  }

  function bind() {
    const hero = stage.closest('.v103-service-hero') || document;
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
      mouseY = ((e.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouseX = 0; mouseY = 0; }, { passive: true });

    const cards = hero.querySelectorAll('.v103-hero-proof article');
    cards.forEach((card, index) => {
      card.addEventListener('pointerenter', () => {
        hoverIndex = index;
        activeRouteBoost = .11 + index * .07;
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        hoverIndex = -1;
      }, { passive: true });
    });
  }

  function init() {
    stage.dataset.dgTradeGlobeMounted = 'true';
    window.DG_TRADE_GLOBE_V191 = {
      version: VERSION,
      mounted: true,
      frames: 0,
      stage,
      canvas
    };
    bind();
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
})();
