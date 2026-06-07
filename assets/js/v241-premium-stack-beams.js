(function(){
  const servicePages = new Set([
    'services',
    'service-residence-bg',
    'service-company-registration-eu',
    'service-banks-accounts',
    'service-supplements-registration',
    'service-cosmetics-registration',
    'service-pharma-consulting',
    'service-nostrification',
    'service-international-trade',
    'service-turnkey-consulting'
  ]);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pointToSegmentDistance(px, py, x1, y1, x2, y2){
    const dx = x2 - x1;
    const dy = y2 - y1;
    if(dx === 0 && dy === 0) return Math.hypot(px-x1, py-y1);
    const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / (dx*dx + dy*dy)));
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    return Math.hypot(px-x, py-y);
  }

  function buildPremiumStack(hero){
    const panel = hero.querySelector('.v103-hero-proof, .hero__trust-panel');
    if(!panel || panel.dataset.stackReady === 'true') return;
    const cards = Array.from(panel.children).filter(el => el.matches('article, .hero-feature'));
    if(cards.length < 3) return;

    panel.dataset.stackReady = 'true';
    panel.classList.add('premium-stack');

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'premium-stack__route');
    svg.setAttribute('aria-hidden', 'true');

    const glow = document.createElementNS(ns, 'path');
    glow.setAttribute('class', 'glow');
    const main = document.createElementNS(ns, 'path');
    main.setAttribute('class', 'main');
    svg.appendChild(glow);
    svg.appendChild(main);
    panel.insertBefore(svg, panel.firstChild);

    const dots = [];
    for(let i = 0; i < 3; i++){
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('r', i === 1 ? '4.2' : '3.8');
      if(i === 1) c.setAttribute('class', 'secondary');
      dots.push(c);
      svg.appendChild(c);
    }

    function getAnchor(card, index){
      const rect = card.getBoundingClientRect();
      const prect = panel.getBoundingClientRect();
      const left = rect.left - prect.left;
      const top = rect.top - prect.top;
      const w = rect.width;
      const h = rect.height;
      if(index === 0) return { x: left + w * 0.18, y: top + h * 0.52 };
      if(index === 1) return { x: left + w * 0.18, y: top + h * 0.50 };
      return { x: left + w * 0.18, y: top + h * 0.46 };
    }

    function redraw(){
      const prect = panel.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${prect.width} ${prect.height}`);
      svg.setAttribute('width', prect.width);
      svg.setAttribute('height', prect.height);
      const p1 = getAnchor(cards[0], 0);
      const p2 = getAnchor(cards[1], 1);
      const p3 = getAnchor(cards[2], 2);
      const d = [
        `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
        `C ${(p1.x - 26).toFixed(1)} ${(p1.y + 26).toFixed(1)}, ${(p2.x - 26).toFixed(1)} ${(p2.y - 26).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
        `C ${(p2.x - 26).toFixed(1)} ${(p2.y + 26).toFixed(1)}, ${(p3.x - 26).toFixed(1)} ${(p3.y - 26).toFixed(1)}, ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`
      ].join(' ');
      main.setAttribute('d', d);
      glow.setAttribute('d', d);
      [p1,p2,p3].forEach((p, i) => {
        dots[i].setAttribute('cx', p.x.toFixed(1));
        dots[i].setAttribute('cy', p.y.toFixed(1));
      });
    }

    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(panel);
    cards.forEach(card => ro.observe(card));
    window.addEventListener('load', redraw, { once:true });
  }

  function meteorPalette(active){
    if(active){
      return {
        tailA: 'rgba(255, 223, 153, 0.00)',
        tailB: 'rgba(255, 218, 139, 0.16)',
        core: 'rgba(245, 190, 82, 0.64)',
        head: 'rgba(255, 215, 135, 0.58)'
      };
    }
    return {
      tailA: 'rgba(144, 197, 255, 0.00)',
      tailB: 'rgba(144, 197, 255, 0.05)',
      core: 'rgba(210, 230, 255, 0.14)',
      head: 'rgba(210, 230, 255, 0.18)'
    };
  }

  function createPageMeteorLayer(main){
    if(main.dataset.meteorReady === 'true' || reduceMotion) return;
    main.dataset.meteorReady = 'true';
    main.classList.add('service-meteor-page');

    const layer = document.createElement('div');
    layer.className = 'service-meteor-layer';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'service-meteor-layer__canvas';
    layer.appendChild(canvas);
    main.insertBefore(layer, main.firstChild);

    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let beams = [];

    function randomBetween(min, max){ return min + Math.random() * (max - min); }

    function makeBeam(i){
      const dir = i % 4;
      return {
        dir,
        phase: Math.random() * 1400 + i * 47,
        speed: randomBetween(0.032, 0.068),
        length: randomBetween(150, 280),
        width: randomBetween(0.8, 1.45),
        lane: randomBetween(-0.15, 1.15),
        drift: randomBetween(80, 220),
        offset: randomBetween(-0.25, 1.25),
        alpha: randomBetween(0.8, 1.0)
      };
    }

    function rebuildBeams(){
      const count = Math.max(30, Math.min(35, Math.round(h / 100)));
      beams = Array.from({length: count}, (_, i) => makeBeam(i));
    }

    function resize(){
      w = Math.max(1, Math.floor(main.scrollWidth));
      h = Math.max(1, Math.floor(main.scrollHeight));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      rebuildBeams();
    }

    function lineForBeam(b, t){
      const travel = Math.max(w, h) + b.length * 2 + Math.max(w, h) * 0.65;
      const progress = ((t * 120 * b.speed + b.phase) % travel) - b.length;
      const baseX = w * (0.12 + b.lane * 0.76);
      const baseY = h * b.offset;
      let x2, y2, x1, y1;

      if(b.dir === 0){
        // left -> right-down
        x2 = progress - w * 0.12;
        y2 = baseY + progress * 0.34;
        x1 = x2 - b.length;
        y1 = y2 - b.length * 0.34;
      } else if(b.dir === 1){
        // left -> right-up
        x2 = progress - w * 0.10;
        y2 = baseY - progress * 0.28;
        x1 = x2 - b.length;
        y1 = y2 + b.length * 0.28;
      } else if(b.dir === 2){
        // right -> left-down
        x2 = w - progress + w * 0.12;
        y2 = baseY + progress * 0.30;
        x1 = x2 + b.length;
        y1 = y2 - b.length * 0.30;
      } else {
        // right -> left-up
        x2 = w - progress + w * 0.10;
        y2 = baseY - progress * 0.32;
        x1 = x2 + b.length;
        y1 = y2 + b.length * 0.32;
      }
      return { x1, y1, x2, y2 };
    }

    function drawBeam(line, width, active, alpha){
      const {x1,y1,x2,y2} = line;
      const p = meteorPalette(active);
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, p.tailA);
      grad.addColorStop(0.60, p.tailB);
      grad.addColorStop(0.90, p.core);
      grad.addColorStop(1, p.head);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = grad;
      ctx.lineWidth = active ? width * 2.1 : width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const headGradient = ctx.createRadialGradient(x2, y2, 0, x2, y2, active ? 20 : 12);
      headGradient.addColorStop(0, active ? 'rgba(255, 214, 126, .30)' : 'rgba(190, 218, 255, .10)');
      headGradient.addColorStop(1, 'rgba(255, 214, 126, 0)');
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(x2, y2, active ? 20 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function render(ts){
      const t = ts * 0.001;
      ctx.clearRect(0,0,w,h);
      for(const beam of beams){
        const line = lineForBeam(beam, t);
        const distance = pointToSegmentDistance(mouse.x, mouse.y, line.x1, line.y1, line.x2, line.y2);
        const active = mouse.active && distance < 14;
        drawBeam(line, beam.width, active, beam.alpha);
      }
      raf = requestAnimationFrame(render);
    }

    main.addEventListener('mousemove', (e) => {
      const rect = main.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top + main.scrollTop;
      mouse.active = true;
    }, { passive:true });

    main.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }, { passive:true });

    resize();
    raf = requestAnimationFrame(render);
    const ro = new ResizeObserver(resize);
    ro.observe(main);
    window.addEventListener('resize', resize, { passive:true });
    window.addEventListener('beforeunload', () => cancelAnimationFrame(raf), { once:true });
  }

  function init(){
    const page = document.body?.dataset?.page || '';
    if(!servicePages.has(page)) return;
    const hero = document.querySelector('.hero-signature, .v9-page-hero');
    if(hero) buildPremiumStack(hero);
    const main = document.querySelector('main');
    if(main) createPageMeteorLayer(main);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
