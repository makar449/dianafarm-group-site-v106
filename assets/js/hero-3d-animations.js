/**
 * DIANAFARM GROUP — Hero 3D Animations v1
 * Unique WebGL-style canvas animations for each service page hero.
 * No external dependencies. Pure Canvas 2D with 3D projection math.
 */
(function () {
  'use strict';

  const GOLD = 'rgba(216,173,111,';
  const GOLD_SOLID = '#D8AD6F';
  const CREAM = 'rgba(255,249,239,';
  const BG_CLEAR = 'rgba(0,0,0,0)';

  /* ── Utilities ───────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Simple 3D → 2D projection
  function project(x, y, z, fov, cx, cy) {
    const scale = fov / (fov + z);
    return { x: cx + x * scale, y: cy + y * scale, s: scale };
  }

  // Rotate a point around X and Y axes
  function rotateY(p, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x * cos - p.z * sin, y: p.y, z: p.x * sin + p.z * cos };
  }
  function rotateX(p, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
  }

  /* ── Canvas setup ────────────────────────────────────────── */
  function makeCanvas(container, anim) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-3d-canvas';
    canvas.dataset.anim = anim;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    return canvas;
  }

  function resize(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { w: rect.width, h: rect.height, ctx };
  }

  /* ══════════════════════════════════════════════════════════
     1. GLOBE — International Trade
  ══════════════════════════════════════════════════════════ */
  function animGlobe(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    const R = Math.min(w, h) * 0.26;
    let ry = 0, rx = 0.3;
    let pulseT = 0;
    let pulseFrom = null, pulseTo = null;

    // Generate lat/lng grid points
    const points = [];
    for (let lat = -80; lat <= 80; lat += 18) {
      for (let lng = 0; lng < 360; lng += 18) {
        const phi = (lat * Math.PI) / 180;
        const theta = (lng * Math.PI) / 180;
        points.push({
          x: R * Math.cos(phi) * Math.cos(theta),
          y: R * Math.sin(phi),
          z: R * Math.cos(phi) * Math.sin(theta),
          lat, lng
        });
      }
    }

    // Pick a few "trade route" pairs
    function randomPair() {
      const a = points[Math.floor(Math.random() * points.length)];
      let b;
      do { b = points[Math.floor(Math.random() * points.length)]; } while (b === a);
      return [a, b];
    }

    let activePulse = null;
    function startPulse() {
      const [a, b] = randomPair();
      activePulse = { from: a, to: b, t: 0 };
    }
    startPulse();

    function draw(ts) {
      window.requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5, cy = h * 0.5 + 10;
      const fov = 520;
      const mxInfluence = ((mouse.x - cx) / cx) * 0.18;
      const myInfluence = ((mouse.y - cy) / cy) * 0.10;

      ry += 0.003 + mxInfluence * 0.01;
      rx += myInfluence * 0.005;
      rx *= 0.97;

      // Draw grid points
      for (const p of points) {
        let pt = rotateX(p, rx);
        pt = rotateY(pt, ry);
        const pr = project(pt.x, pt.y, pt.z, fov, cx, cy);
        if (pt.z > 0) {
          const alpha = clamp(0.08 + pr.s * 0.38, 0, 0.55);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, pr.s * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = GOLD + alpha + ')';
          ctx.fill();
        }
      }

      // Draw latitude circles (wireframe)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng = 0; lng <= 360; lng += 4) {
          const phi = (lat * Math.PI) / 180;
          const theta = (lng * Math.PI) / 180;
          let pt = { x: R * Math.cos(phi) * Math.cos(theta), y: R * Math.sin(phi), z: R * Math.cos(phi) * Math.sin(theta) };
          pt = rotateX(pt, rx); pt = rotateY(pt, ry);
          if (pt.z > -R * 0.5) {
            const pr = project(pt.x, pt.y, pt.z, fov, cx, cy);
            const alpha = clamp(0.04 + pr.s * 0.14, 0, 0.22);
            if (first) { ctx.moveTo(pr.x, pr.y); first = false; }
            else ctx.lineTo(pr.x, pr.y);
          }
        }
        ctx.strokeStyle = GOLD + '0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Longitude meridians
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 4) {
          const phi = (lat * Math.PI) / 180;
          const theta = (lng * Math.PI) / 180;
          let pt = { x: R * Math.cos(phi) * Math.cos(theta), y: R * Math.sin(phi), z: R * Math.cos(phi) * Math.sin(theta) };
          pt = rotateX(pt, rx); pt = rotateY(pt, ry);
          if (pt.z > -R * 0.5) {
            const pr = project(pt.x, pt.y, pt.z, fov, cx, cy);
            if (first) { ctx.moveTo(pr.x, pr.y); first = false; }
            else ctx.lineTo(pr.x, pr.y);
          }
        }
        ctx.strokeStyle = GOLD + '0.10)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Active pulse (trade route arc)
      if (activePulse) {
        activePulse.t += 0.008;
        if (activePulse.t > 1.3) startPulse();
        const t = clamp(activePulse.t, 0, 1);
        const { from, to } = activePulse;
        const steps = 60;
        ctx.beginPath();
        for (let i = 0; i <= Math.floor(t * steps); i++) {
          const u = i / steps;
          // Slerp between two globe points
          const lerpX = lerp(from.x, to.x, u);
          const lerpY = lerp(from.y, to.y, u);
          const lerpZ = lerp(from.z, to.z, u);
          const mag = Math.sqrt(lerpX * lerpX + lerpY * lerpY + lerpZ * lerpZ);
          // Arc: push outward
          const arc = 1 + Math.sin(u * Math.PI) * 0.22;
          let pt = { x: (lerpX / mag) * R * arc, y: (lerpY / mag) * R * arc, z: (lerpZ / mag) * R * arc };
          pt = rotateX(pt, rx); pt = rotateY(pt, ry);
          const pr = project(pt.x, pt.y, pt.z, fov, cx, cy);
          if (i === 0) ctx.moveTo(pr.x, pr.y);
          else ctx.lineTo(pr.x, pr.y);
        }
        ctx.strokeStyle = GOLD + '0.72)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = GOLD_SOLID;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pulse head
        const u = t;
        const lerpX = lerp(from.x, to.x, u);
        const lerpY = lerp(from.y, to.y, u);
        const lerpZ = lerp(from.z, to.z, u);
        const mag2 = Math.sqrt(lerpX * lerpX + lerpY * lerpY + lerpZ * lerpZ);
        const arc2 = 1 + Math.sin(u * Math.PI) * 0.22;
        let headPt = { x: (lerpX / mag2) * R * arc2, y: (lerpY / mag2) * R * arc2, z: (lerpZ / mag2) * R * arc2 };
        headPt = rotateX(headPt, rx); headPt = rotateY(headPt, ry);
        const headPr = project(headPt.x, headPt.y, headPt.z, fov, cx, cy);
        ctx.beginPath();
        ctx.arc(headPr.x, headPr.y, 4 * headPr.s, 0, Math.PI * 2);
        ctx.fillStyle = '#F0C97A';
        ctx.shadowColor = '#D8AD6F';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    requestAnimationFrame(draw);

    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     2. MOBIUS — Nostrification
  ══════════════════════════════════════════════════════════ */
  function animMobius(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let angle = 0;

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.5;
      const scale = Math.min(w, h) * 0.22;

      const mx = (mouse.x - cx) / (w * 0.5);
      const my = (mouse.y - cy) / (h * 0.5);
      angle += 0.006;

      const tiltX = my * 0.35;
      const tiltY = angle + mx * 0.18;

      const segments = 200;
      const tubes = 18;

      for (let tube = 0; tube < tubes; tube++) {
        const tv = (tube / tubes) * Math.PI * 2;
        const pts = [];

        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2;
          const half = t / 2;
          // Möbius parametric
          const cos_half = Math.cos(half);
          const sin_half = Math.sin(half);
          const cos_t = Math.cos(t);
          const sin_t = Math.sin(t);
          const v = (tube / tubes - 0.5) * 0.55;
          const r = 1 + v * cos_half;
          let x = r * cos_t * scale;
          let y = r * sin_t * scale;
          let z = v * sin_half * scale;

          // Apply tilt
          let rx = x, ry = y * Math.cos(tiltX) - z * Math.sin(tiltX), rz = y * Math.sin(tiltX) + z * Math.cos(tiltX);
          let fx = rx * Math.cos(tiltY) + rz * Math.sin(tiltY), fy = ry, fz = -rx * Math.sin(tiltY) + rz * Math.cos(tiltY);

          const fov = 500;
          const pr = project(fx, fy, fz, fov, cx, cy);
          pts.push({ pr, z: fz });
        }

        ctx.beginPath();
        pts.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.pr.x, pt.pr.y);
          else ctx.lineTo(pt.pr.x, pt.pr.y);
        });

        const depthAlpha = clamp(0.06 + (tube / tubes) * 0.28, 0, 0.38);
        const shimmer = 0.5 + 0.5 * Math.sin(angle * 3 + tube * 0.7);
        ctx.strokeStyle = GOLD + (depthAlpha + shimmer * 0.12) + ')';
        ctx.lineWidth = tube === 0 || tube === tubes - 1 ? 1.5 : 0.6;
        ctx.stroke();
      }

      // Gold edge highlight
      const edgePts = [];
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const half = t / 2;
        const r = 1 + 0.275 * Math.cos(half);
        let x = r * Math.cos(t) * scale, y = r * Math.sin(t) * scale, z = 0.275 * Math.sin(half) * scale;
        let ry2 = y * Math.cos(tiltX) - z * Math.sin(tiltX), rz2 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
        let fx = x * Math.cos(tiltY) + rz2 * Math.sin(tiltY), fy = ry2, fz = -x * Math.sin(tiltY) + rz2 * Math.cos(tiltY);
        edgePts.push(project(fx, fy, fz, 500, cx, cy));
      }
      ctx.beginPath();
      edgePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = GOLD + '0.65)';
      ctx.lineWidth = 2;
      ctx.shadowColor = GOLD_SOLID;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     3. CRYSTAL LATTICE — Pharma Consulting
  ══════════════════════════════════════════════════════════ */
  function animLattice(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let angle = 0;

    // Build DNA-style double helix lattice
    const nodes = [];
    const strands = 2;
    const count = 24;
    const R_helix = 55, pitch = 28;

    for (let s = 0; s < strands; s++) {
      for (let i = 0; i < count; i++) {
        const t = (i / (count - 1)) * Math.PI * 6;
        const offset = s * Math.PI;
        nodes.push({
          x: R_helix * Math.cos(t + offset),
          y: (i - count / 2) * (pitch / 3),
          z: R_helix * Math.sin(t + offset),
          strand: s, idx: i,
          glow: 0, targetGlow: 0
        });
      }
    }

    // Cross-links between strands
    const links = [];
    for (let i = 0; i < count; i += 3) {
      links.push([i, i + count]);
    }

    // Node pairs on same strand
    const edges = [];
    for (let s = 0; s < strands; s++) {
      const base = s * count;
      for (let i = 0; i < count - 1; i++) {
        edges.push([base + i, base + i + 1]);
      }
    }

    let highlightCluster = -1;
    setInterval(() => { highlightCluster = Math.floor(Math.random() * count); }, 2200);

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.5;
      const scale = Math.min(w, h) / 340;
      const fov = 480;

      const mx = (mouse.x - cx) / (w * 0.5);
      const my = (mouse.y - cy) / (h * 0.5);
      angle += 0.005;
      const ry = angle + mx * 0.2;
      const rx = my * 0.28;

      function transform(n) {
        let p = { x: n.x * scale, y: n.y * scale, z: n.z * scale };
        p = rotateX(p, rx);
        p = rotateY(p, ry);
        return project(p.x, p.y, p.z, fov, cx, cy);
      }

      // Draw edges
      for (const [a, b] of edges) {
        const pa = transform(nodes[a]), pb = transform(nodes[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = GOLD + '0.20)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Cross links
      for (const [a, b] of links) {
        const pa = transform(nodes[a]), pb = transform(nodes[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = GOLD + '0.32)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHighlight = n.idx === highlightCluster || n.idx === highlightCluster + 1 || n.idx === highlightCluster - 1;
        n.targetGlow = isHighlight ? 1 : 0;
        n.glow = lerp(n.glow, n.targetGlow, 0.04);

        const pr = transform(n);
        const r = (2.8 + n.glow * 3.5) * pr.s;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
        if (n.glow > 0.05) {
          const grad = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, r * 2.5);
          grad.addColorStop(0, GOLD + (0.9 + n.glow * 0.1) + ')');
          grad.addColorStop(1, GOLD + '0)');
          ctx.fillStyle = grad;
          ctx.shadowColor = GOLD_SOLID;
          ctx.shadowBlur = 12 * n.glow;
        } else {
          ctx.fillStyle = GOLD + (0.25 + pr.s * 0.35) + ')';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     4. METABALL SPHERE — Cosmetics Registration
  ══════════════════════════════════════════════════════════ */
  function animMetaball(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let t = 0;

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      t += 0.012;
      const cx = w * 0.5, cy = h * 0.5;
      const R = Math.min(w, h) * 0.21;

      // Animate blob shape using harmonics
      const pts = 120;
      const mx = (mouse.x - cx) / (w * 0.5) * 0.08;
      const my = (mouse.y - cy) / (h * 0.5) * 0.06;

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        // Multiple frequency noise for organic feel
        const ripple =
          Math.sin(a * 2 + t * 0.9) * 0.045 +
          Math.sin(a * 3 - t * 1.3) * 0.03 +
          Math.sin(a * 5 + t * 0.7) * 0.018 +
          Math.sin(a * 7 - t * 0.5) * 0.012 +
          mx * Math.cos(a) + my * Math.sin(a);
        const r = R * (1 + ripple);
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gold gradient fill
      const grad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, 0, cx, cy, R * 1.1);
      grad.addColorStop(0, 'rgba(255,230,160,0.18)');
      grad.addColorStop(0.4, 'rgba(216,173,111,0.12)');
      grad.addColorStop(0.75, 'rgba(180,130,70,0.07)');
      grad.addColorStop(1, 'rgba(180,130,70,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Gold shimmer stroke
      const shimmer = 0.45 + 0.25 * Math.sin(t * 2.1);
      ctx.strokeStyle = GOLD + shimmer + ')';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = GOLD_SOLID;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner highlight arc
      ctx.beginPath();
      ctx.arc(cx - R * 0.18, cy - R * 0.22, R * 0.55, -Math.PI * 0.65, Math.PI * 0.1);
      const hiGrad = ctx.createLinearGradient(cx - R, cy - R, cx + R * 0.3, cy + R * 0.3);
      hiGrad.addColorStop(0, 'rgba(255,249,220,0.22)');
      hiGrad.addColorStop(1, 'rgba(255,249,220,0)');
      ctx.strokeStyle = hiGrad;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Floating specular dots
      for (let d = 0; d < 5; d++) {
        const da = d * 1.26 + t * 0.4;
        const dr = R * (0.35 + d * 0.09) + Math.sin(t + d) * R * 0.06;
        const dx = cx + dr * Math.cos(da);
        const dy = cy + dr * Math.sin(da);
        const alpha = 0.12 + 0.12 * Math.sin(t * 2 + d);
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = GOLD + alpha + ')';
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     5. PARTICLE SYSTEM — Supplements Registration
  ══════════════════════════════════════════════════════════ */
  function animParticles(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    const N = 320;
    const particles = [];
    let targetShape = [];

    // Generate target shape: leaf silhouette
    function makeLeaf(cx, cy, R) {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        // Cardioid-like leaf
        const r = R * (Math.sin(t) * (Math.abs(Math.sin(t / 2)) * 0.7 + 0.3));
        pts.push({ x: cx + r * Math.cos(t - Math.PI / 2), y: cy + r * Math.sin(t - Math.PI / 2) * 0.9 });
      }
      return pts;
    }

    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rand(0, Math.min(w, h) * 0.28);
      particles.push({
        x: w / 2 + r * Math.cos(a), y: h / 2 + r * Math.sin(a),
        vx: 0, vy: 0,
        size: rand(1.2, 3.5),
        alpha: rand(0.3, 0.85),
        phase: rand(0, Math.PI * 2)
      });
    }

    targetShape = makeLeaf(w / 2, h / 2, Math.min(w, h) * 0.22);

    let t = 0;
    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      t += 0.012;

      for (let i = 0; i < N; i++) {
        const p = particles[i];
        const target = targetShape[i];
        const mx = mouse.x - p.x, my = mouse.y - p.y;
        const dist = Math.sqrt(mx * mx + my * my);
        const repel = dist < 80 ? (1 - dist / 80) * 3.5 : 0;
        const tx = target.x - p.x, ty = target.y - p.y;

        // Spring toward target, repel from mouse
        p.vx += tx * 0.025 - (mx / (dist + 1)) * repel;
        p.vy += ty * 0.025 - (my / (dist + 1)) * repel;
        p.vx *= 0.86; p.vy *= 0.86;
        p.x += p.vx; p.y += p.vy;

        const flicker = 0.6 + 0.4 * Math.sin(t * 2.8 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * flicker, 0, Math.PI * 2);
        ctx.fillStyle = GOLD + (p.alpha * flicker) + ')';
        ctx.fill();
      }

      // Subtle connecting lines for near particles
      for (let i = 0; i < N; i += 4) {
        for (let j = i + 4; j < N; j += 4) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 38) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = GOLD + (0.12 * (1 - d / 38)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(draw);
    window.addEventListener('resize', () => {
      ({ w, h, ctx } = resize(canvas));
      targetShape = makeLeaf(w / 2, h / 2, Math.min(w, h) * 0.22);
    });
  }

  /* ══════════════════════════════════════════════════════════
     6. WAVE GUILLOCHE — Banks & Accounts
  ══════════════════════════════════════════════════════════ */
  function animWave(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let t = 0;

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      t += 0.008;
      const cx = w * 0.5, cy = h * 0.5;
      const mx = (mouse.x - cx) / (w * 0.5);
      const my = (mouse.y - cy) / (h * 0.5);
      const amp = Math.min(w, h) * 0.16;

      // Layered spirograph waves (guilloche)
      for (let layer = 0; layer < 6; layer++) {
        const freq = 4 + layer * 2.5;
        const phase = layer * 0.44 + t * (1 - layer * 0.08);
        const r = amp * (0.55 + layer * 0.09);
        const depth = 0.035 + layer * 0.02;
        const alpha = 0.08 + layer * 0.04 + my * 0.015;

        ctx.beginPath();
        const steps = 300;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          // Rose curve variant
          const rr = r + amp * depth * Math.sin(freq * a + phase) + mx * amp * 0.04 * Math.cos(a);
          const x = cx + rr * Math.cos(a);
          const y = cy + rr * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = GOLD + (alpha) + ')';
        ctx.lineWidth = layer === 0 ? 1.4 : 0.7;
        ctx.stroke();
      }

      // Pulsing center
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, amp * 0.28);
      centerGrad.addColorStop(0, GOLD + (0.22 * pulse) + ')');
      centerGrad.addColorStop(1, GOLD + '0)');
      ctx.beginPath();
      ctx.arc(cx, cy, amp * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Outer accent ring
      ctx.beginPath();
      ctx.arc(cx, cy, amp * 1.05 + Math.sin(t) * amp * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = GOLD + '0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     7. FLOATING CUBES — Company Registration
  ══════════════════════════════════════════════════════════ */
  function animCubes(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let t = 0;
    let assembled = 0;

    // Define 4 cubes that "assemble" into a structure
    const cubeSize = Math.min(w, h) * 0.10;
    const cubes = [
      { tx: 0, ty: -0.65, tz: 0,   startY: -3.5, ry: 0.22, rx: 0.18 },
      { tx: -0.72, ty: 0, tz: 0,   startY:  3.5, ry: -0.14, rx: 0.22 },
      { tx: 0.72, ty: 0, tz: 0,    startY:  3.5, ry: 0.28, rx: -0.12 },
      { tx: 0, ty: 0.65, tz: 0.3,  startY:  3.5, ry: 0.08, rx: 0.08 },
    ];

    function drawCube(ctx, cx, cy, s, ry_angle, rx_angle, alpha) {
      // 8 vertices of a cube
      const half = s / 2;
      const verts = [
        [-half,-half,-half],[ half,-half,-half],[ half, half,-half],[-half, half,-half],
        [-half,-half, half],[ half,-half, half],[ half, half, half],[-half, half, half],
      ];

      function tr(v) {
        let [x, y, z] = v;
        // Rotate Y
        const c1 = Math.cos(ry_angle), s1 = Math.sin(ry_angle);
        [x, z] = [x * c1 - z * s1, x * s1 + z * c1];
        // Rotate X
        const c2 = Math.cos(rx_angle), s2 = Math.sin(rx_angle);
        [y, z] = [y * c2 - z * s2, y * s2 + z * c2];
        const fov = 420, scale2 = fov / (fov + z);
        return { x: cx + x * scale2, y: cy + y * scale2, z };
      }

      const faces = [
        [0,1,2,3],[4,5,6,7],[0,1,5,4],
        [2,3,7,6],[0,3,7,4],[1,2,6,5]
      ];
      const faceAlphas = [0.03, 0.07, 0.05, 0.09, 0.04, 0.11];

      // Sort faces back-to-front
      const faceDepths = faces.map((f, fi) => ({
        fi, depth: f.reduce((sum, vi) => sum + tr(verts[vi]).z, 0) / 4
      })).sort((a, b) => a.depth - b.depth);

      for (const { fi } of faceDepths) {
        const face = faces[fi];
        const tverts = face.map(vi => tr(verts[vi]));
        ctx.beginPath();
        tverts.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
        ctx.closePath();
        ctx.fillStyle = GOLD + (faceAlphas[fi] * alpha) + ')';
        ctx.fill();
        ctx.strokeStyle = GOLD + (0.45 * alpha) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      t += 0.012;
      assembled = Math.min(1, assembled + 0.008);
      const cx = w * 0.5, cy = h * 0.5;
      const mx = (mouse.x - cx) / (w * 0.5) * 0.15;
      const my = (mouse.y - cy) / (h * 0.5) * 0.10;
      const s = Math.min(w, h) * 0.10;

      cubes.forEach((cube, i) => {
        const progress = clamp(assembled * 1.4 - i * 0.15, 0, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentY = lerp(cube.startY * s, cube.ty * s, ease);
        const currentX = cube.tx * s;
        const rot_y = cube.ry + t * 0.004 + mx * 0.3;
        const rot_x = cube.rx + t * 0.003 + my * 0.2;
        const alpha = ease;
        drawCube(ctx, cx + currentX, cy + currentY, s * 0.98, rot_y, rot_x, alpha);
      });

      // Glow connection lines when assembled
      if (assembled > 0.7) {
        const alpha = (assembled - 0.7) / 0.3;
        const centers = cubes.map(c => ({ x: cx + c.tx * s, y: cy + c.ty * s }));
        for (let i = 0; i < centers.length; i++) {
          for (let j = i + 1; j < centers.length; j++) {
            ctx.beginPath();
            ctx.moveTo(centers[i].x, centers[i].y);
            ctx.lineTo(centers[j].x, centers[j].y);
            ctx.strokeStyle = GOLD + (0.14 * alpha) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    // Re-trigger assembly on visibility
    document.addEventListener('visibilitychange', () => { if (!document.hidden) assembled = 0; });
    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ══════════════════════════════════════════════════════════
     8. TOPOGRAPHIC LANDSCAPE — Residence Bulgaria
  ══════════════════════════════════════════════════════════ */
  function animTopo(canvas, mouse) {
    let { w, h, ctx } = resize(canvas);
    let t = 0;

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      t += 0.007;
      const cx = w * 0.5, cy = h * 0.5;
      const mx = (mouse.x - cx) / (w * 0.5);
      const my = (mouse.y - cy) / (h * 0.5);

      // 3D grid landscape
      const cols = 28, rows = 18;
      const gs = Math.min(w, h) * 0.031;
      const totalW = cols * gs, totalH = rows * gs;

      // Project 3D to isometric-ish
      const tiltX = 0.52 + my * 0.08;
      const panY = t * 0.5;

      function getHeight(col, row) {
        const nx = col / cols * 4;
        const ny = (row / rows * 4) + panY * 0.12;
        return (
          Math.sin(nx * 1.4 + t * 0.6) * 22 +
          Math.sin(ny * 1.1 - t * 0.4) * 18 +
          Math.sin(nx * 2.3 + ny * 1.6 + t * 0.3) * 12 +
          Math.sin(nx * 0.7 - ny * 2.1 + t * 0.2) * 8 +
          mx * 14 * Math.sin(col / cols * Math.PI)
        );
      }

      function toScreen(col, row, ht) {
        const gx = (col - cols / 2) * gs;
        const gz = (row - rows / 2) * gs;
        // Rotate around X for tilt
        const gy = ht;
        const y2 = gy * Math.cos(tiltX) - gz * Math.sin(tiltX);
        const z2 = gy * Math.sin(tiltX) + gz * Math.cos(tiltX);
        return { x: cx + gx, y: cy + y2 - 20, z: z2 };
      }

      // Draw rows as contour lines (back to front)
      for (let row = rows; row >= 0; row--) {
        // Fill polygon between this row and the next
        const pts0 = [], pts1 = [];
        for (let col = 0; col <= cols; col++) {
          const h0 = getHeight(col, row), h1 = getHeight(col, row + 1);
          pts0.push(toScreen(col, row, h0));
          pts1.push(toScreen(col, row + 1, h1));
        }

        // Draw the strip
        ctx.beginPath();
        pts0.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        const pts1r = [...pts1].reverse();
        pts1r.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        const depthFade = row / rows;
        ctx.fillStyle = `rgba(5,14,26,${0.55 + depthFade * 0.1})`;
        ctx.fill();

        // Stroke the top edge as contour line
        ctx.beginPath();
        pts0.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        const alpha = 0.10 + depthFade * 0.30;
        ctx.strokeStyle = GOLD + alpha + ')';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Highlight peaks
      for (let col = 1; col < cols; col += 4) {
        for (let row = 1; row < rows; row += 4) {
          const ht = getHeight(col, row);
          if (ht > 28) {
            const p = toScreen(col, row, ht);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            const g = 0.3 + (ht - 28) / 30 * 0.5;
            ctx.fillStyle = GOLD + clamp(g, 0, 0.7) + ')';
            ctx.shadowColor = GOLD_SOLID;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    requestAnimationFrame(draw);
    window.addEventListener('resize', () => { ({ w, h, ctx } = resize(canvas)); });
  }

  /* ── Router ──────────────────────────────────────────────── */
  const ANIMATORS = {
    globe:     animGlobe,
    mobius:    animMobius,
    lattice:   animLattice,
    metaball:  animMetaball,
    particles: animParticles,
    wave:      animWave,
    cubes:     animCubes,
    topo:      animTopo,
  };

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    const canvas = document.querySelector('.hero-3d-canvas[data-anim]');
    if (!canvas) return;
    const type = canvas.dataset.anim;
    const fn = ANIMATORS[type];
    if (!fn) return;

    // Mouse tracking
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', e => {
      if (e.touches.length) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    }, { passive: true });

    fn(canvas, mouse);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
