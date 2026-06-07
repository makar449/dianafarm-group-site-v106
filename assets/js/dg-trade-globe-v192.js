
/* DIANAFARM GROUP v192 — INTERNATIONAL TRADE PRO CANVAS GLOBE
   External JS. It does not depend on CSS file cache: it mounts/styles/draws the scene itself. */
(() => {
  'use strict';
  const VERSION = 'v192-trade-pro-canvas-external-js-visible';
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const GOLD = [224, 181, 106];
  const CREAM = [255, 244, 205];
  const BLUE = [86, 140, 255];
  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

  function setImportant(el, styles){
    for (const [k,v] of Object.entries(styles)) el.style.setProperty(k, v, 'important');
  }

  function ensureScene(){
    const hero = document.querySelector('body[data-page="service-international-trade"] .v9-page-hero.v103-service-hero') ||
                 document.querySelector('body[data-page="service-international-trade"] .v103-service-hero') ||
                 document.querySelector('.v9-page-hero');
    if (!hero) return null;
    let root = document.querySelector('[data-dg-v192="trade"]');
    if (!root) {
      root = document.createElement('div');
      root.id = 'dgTradeV192Root';
      root.setAttribute('data-dg-v192', 'trade');
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = `
        <div class="dg-trade-v192-proof"></div>
        <div class="dg-trade-v192-fallback"></div>
        <canvas id="dgTradeGlobeCanvasV192" data-dg-trade-canvas-v192></canvas>
        <div class="dg-trade-v192-label dg-trade-v192-label--bg">BG</div>
        <div class="dg-trade-v192-label dg-trade-v192-label--uae">UAE</div>
        <div class="dg-trade-v192-label dg-trade-v192-label--asia">ASIA</div>`;
      const grid = hero.querySelector('.v9-page-hero__grid');
      hero.insertBefore(root, grid || hero.firstChild);
    }
    setImportant(hero, { position:'relative', overflow:'hidden', isolation:'isolate', 'min-height':'clamp(600px,64vh,780px)' });
    const grid = hero.querySelector('.v9-page-hero__grid');
    if (grid) setImportant(grid, { position:'relative', 'z-index':'40' });
    setImportant(root, {
      position:'absolute', left:'59%', top:'51%', width:'clamp(470px,38vw,690px)', height:'clamp(470px,38vw,690px)',
      transform:'translate3d(-50%,-50%,0)', display:'block', visibility:'visible', opacity:'1', 'z-index':'21',
      'pointer-events':'none', overflow:'visible', contain:'none',
      filter:'drop-shadow(0 0 34px rgba(255,224,160,.82)) drop-shadow(0 36px 96px rgba(0,0,0,.44))'
    });
    let canvas = root.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'dgTradeGlobeCanvasV192';
      canvas.setAttribute('data-dg-trade-canvas-v192','');
      root.appendChild(canvas);
    }
    setImportant(canvas, { position:'absolute', inset:'0', width:'100%', height:'100%', display:'block', visibility:'visible', opacity:'1', 'z-index':'3' });
    return {hero, root, canvas};
  }

  function seeded(n){ const x = Math.sin(n * 127.113 + 91.7) * 43758.5453; return x - Math.floor(x); }
  const stars = Array.from({length:150}, (_,i)=>({x:seeded(i+1), y:seeded(i+101), r:.45+seeded(i+201)*1.8, p:seeded(i+301)*TAU}));
  const nodes = [
    {name:'BG', lat:42.70, lon:25.48, power:1.32},
    {name:'UAE', lat:24.45, lon:54.37, power:1.18},
    {name:'UZ', lat:41.31, lon:69.24, power:.90},
    {name:'CN', lat:31.23, lon:121.47, power:1.02},
    {name:'IN', lat:19.07, lon:72.88, power:.88},
    {name:'DE', lat:52.52, lon:13.40, power:.78},
    {name:'TR', lat:41.01, lon:28.97, power:.78},
    {name:'SG', lat:1.35, lon:103.82, power:.82},
    {name:'EG', lat:30.04, lon:31.23, power:.70},
  ];
  const idx = Object.fromEntries(nodes.map((n,i)=>[n.name,i]));
  const routes = [
    ['BG','UAE',0,.95], ['BG','UZ',.15,.88], ['BG','CN',.29,.72], ['UAE','IN',.43,.98],
    ['UAE','SG',.58,.76], ['BG','DE',.72,.66], ['TR','EG',.84,.72], ['BG','TR',.92,.86]
  ].map(([a,b,phase,speed],i)=>({a:idx[a],b:idx[b],phase,speed, group:i%3}));

  function rotate(p, ry, rx, rz){
    let {x,y,z}=p; let c=Math.cos(ry), s=Math.sin(ry);
    [x,z]=[x*c+z*s, -x*s+z*c]; c=Math.cos(rx); s=Math.sin(rx); [y,z]=[y*c-z*s, y*s+z*c]; c=Math.cos(rz); s=Math.sin(rz); [x,y]=[x*c-y*s, x*s+y*c];
    return {x,y,z};
  }
  function vLatLon(lat,lon){ const phi=lat*DEG, lam=lon*DEG; return {x:Math.cos(phi)*Math.sin(lam), y:-Math.sin(phi), z:Math.cos(phi)*Math.cos(lam)}; }
  function norm(v){ const m=Math.hypot(v.x,v.y,v.z)||1; return {x:v.x/m,y:v.y/m,z:v.z/m}; }
  function slerp(a,b,t){
    const dot=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)); const om=Math.acos(dot); if(om<.0001) return a;
    const so=Math.sin(om), s1=Math.sin((1-t)*om)/so, s2=Math.sin(t*om)/so;
    return norm({x:a.x*s1+b.x*s2, y:a.y*s1+b.y*s2, z:a.z*s1+b.z*s2});
  }
  function latLon(v){ return {lat:-Math.asin(v.y)/DEG, lon:Math.atan2(v.x,v.z)/DEG}; }

  function start(){
    const scene = ensureScene(); if (!scene) return;
    const {hero, root, canvas} = scene;
    const ctx = canvas.getContext('2d', {alpha:true, desynchronized:true});
    if (!ctx) { root.dataset.dgV192Error = 'no-canvas-context'; return; }

    let w=0,h=0,dpr=1,cx=0,cy=0,r=1, t=0, last=performance.now(), raf=0;
    let mx=0,my=0, sx=0,sy=0, hover=-1, boost=0;

    function phone(){ return matchMedia('(max-width: 640px)').matches; }
    function resize(){
      if (phone()) { setImportant(root, {display:'none', visibility:'hidden', opacity:'0'}); return; }
      setImportant(root, {display:'block', visibility:'visible', opacity:'1'});
      const rect = root.getBoundingClientRect();
      const nw=Math.max(320, Math.round(rect.width||560)), nh=Math.max(320, Math.round(rect.height||560)), nd=Math.min(2, Math.max(1, devicePixelRatio||1));
      if(nw===w && nh===h && nd===dpr) return;
      w=nw; h=nh; dpr=nd; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); cx=w*.5; cy=h*.5; r=Math.min(w,h)*.31;
    }
    function project(lat,lon,ry,rx,rz,rm=1){
      const p=rotate(vLatLon(lat,lon),ry,rx,rz); const pp=1/(1.48-p.z*.36);
      return {x:cx+p.x*r*rm*pp, y:cy+p.y*r*rm*pp, z:p.z, scale:pp, front:p.z>-0.10};
    }
    function line(points, color, width, alpha, glow=0){
      if(points.length<2) return; ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; if(glow){ctx.shadowBlur=glow;ctx.shadowColor=color;} ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y); for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y); ctx.stroke(); ctx.restore();
    }
    function polySphere(latOrLon, isLat, ry,rx,rz){
      const front=[], back=[]; const a0=isLat?-180:-78, a1=isLat?180:78, step=3;
      for(let a=a0;a<=a1;a+=step){ const p=isLat?project(latOrLon,a,ry,rx,rz):project(a,latOrLon,ry,rx,rz); const arr=p.front?front:back; arr.push(p); if(p.front && back.length){line(back,rgba(BLUE,.18),.9,.38,0);back.length=0;} if(!p.front && front.length){line(front,rgba(CREAM,.26),1.2,.72,5);front.length=0;} }
      line(back,rgba(BLUE,.14),.9,.38,0); line(front,rgba(CREAM,.27),1.15,.70,5);
    }
    function ambient(){
      ctx.clearRect(0,0,w,h);
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.2); g.addColorStop(0,'rgba(255,235,175,.16)'); g.addColorStop(.34,'rgba(76,131,255,.10)'); g.addColorStop(.72,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(const st of stars){ const tw=.35+.65*(Math.sin(t*.0014+st.p)*.5+.5); ctx.globalAlpha=.10+tw*.45; ctx.fillStyle=st.r>1.2?rgba(GOLD,.56):rgba(CREAM,.42); ctx.beginPath(); ctx.arc(st.x*w,st.y*h,st.r*tw,0,TAU); ctx.fill(); }
      ctx.restore();
    }
    function grid(ry,rx,rz){
      [-60,-42,-24,-8,8,24,42,60].forEach(lat=>polySphere(lat,true,ry,rx,rz));
      for(let lon=0;lon<360;lon+=20) polySphere(lon,false,ry,rx,rz);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const rim=ctx.createRadialGradient(cx,cy,r*.25,cx,cy,r*1.18); rim.addColorStop(0,'rgba(255,255,255,0)'); rim.addColorStop(.76,'rgba(255,242,190,.04)'); rim.addColorStop(.98,'rgba(255,235,176,.40)'); rim.addColorStop(1,'rgba(255,235,176,0)'); ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(cx,cy,r*1.12,0,TAU); ctx.fill();
      ctx.strokeStyle=rgba(CREAM,.46); ctx.lineWidth=1.55; ctx.shadowBlur=18; ctx.shadowColor=rgba(GOLD,.70); ctx.stroke(); ctx.restore();
    }
    function drawRoutes(ry,rx,rz){
      routes.forEach((route,ri)=>{
        const a=nodes[route.a], b=nodes[route.b], av=vLatLon(a.lat,a.lon), bv=vLatLon(b.lat,b.lon); const front=[],back=[];
        for(let i=0;i<=92;i++){ const tt=i/92; const v=slerp(av,bv,tt); const ll=latLon(v); const p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.30); (p.front?front:back).push(p); }
        const active=hover<0 || hover===route.group; line(back,rgba(BLUE,.24),1.2,active?.45:.20,4); line(front,rgba(GOLD,.82),active?2.3:1.4,active?.82:.26,active?16:5);
        const travel=((t*.00013*route.speed+route.phase+boost)%1+1)%1;
        for(let k=0;k<(active?2:1);k++){ const tt=(travel+k*.5)%1; const v=slerp(av,bv,tt); const ll=latLon(v); const p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.30); if(p.z<-0.22) continue; const pr=(5+9*p.scale)*(1+Math.sin(t*.006+ri)*.14); const gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,pr*4.5); gr.addColorStop(0,'rgba(255,255,240,.98)'); gr.addColorStop(.20,'rgba(255,222,142,.86)'); gr.addColorStop(.58,'rgba(224,181,106,.25)'); gr.addColorStop(1,'rgba(224,181,106,0)'); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(p.x,p.y,pr*4.5,0,TAU); ctx.fill(); ctx.fillStyle='#fff4c7'; ctx.shadowBlur=26; ctx.shadowColor='#ffdd96'; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(2.3,pr*.42),0,TAU); ctx.fill(); ctx.restore(); }
      });
    }
    function nodeDots(ry,rx,rz){
      nodes.forEach(n=>{ const p=project(n.lat,n.lon,ry,rx,rz,1.012); if(p.z<-0.24) return; const a=Math.max(.25,Math.min(1,(p.z+.24)/1.24)); const rr=(3.6+5.1*n.power)*p.scale; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a; ctx.fillStyle='rgba(255,246,210,.96)'; ctx.shadowBlur=24*n.power; ctx.shadowColor='rgba(255,222,142,.86)'; ctx.beginPath(); ctx.arc(p.x,p.y,rr,0,TAU); ctx.fill(); ctx.strokeStyle=rgba(GOLD,.74); ctx.lineWidth=1.1; ctx.beginPath(); ctx.arc(p.x,p.y,rr*2.4,0,TAU); ctx.stroke(); ctx.restore(); });
    }
    function frame(now){
      resize(); if(phone()){ raf=requestAnimationFrame(frame); return; }
      const dt=Math.min(48, now-last); last=now; t+=dt; sx+=(mx-sx)*.045; sy+=(my-sy)*.045; boost*=.985;
      const ry=t*.00022+sx*.24, rx=-12*DEG+Math.sin(t*.00025)*4*DEG+sy*.16, rz=Math.sin(t*.00012)*5*DEG;
      ambient(); grid(ry,rx,rz); drawRoutes(ry,rx,rz); nodeDots(ry,rx,rz);
      window.DG_TRADE_GLOBE_V192.frames++;
      raf=requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', e=>{ const b=hero.getBoundingClientRect(); mx=((e.clientX-b.left)/Math.max(1,b.width)-.5)*2; my=((e.clientY-b.top)/Math.max(1,b.height)-.5)*2; }, {passive:true});
    hero.addEventListener('pointerleave', ()=>{mx=0;my=0;}, {passive:true});
    hero.querySelectorAll('.v103-hero-proof article').forEach((card,i)=>{ card.addEventListener('pointerenter',()=>{hover=i;boost=.12+i*.07;},{passive:true}); card.addEventListener('pointerleave',()=>{hover=-1;},{passive:true}); });
    window.addEventListener('resize', resize, {passive:true});
    window.addEventListener('pagehide', ()=>cancelAnimationFrame(raf), {once:true});
    root.dataset.dgV192Mounted='true';
    window.DG_TRADE_GLOBE_V192={version:VERSION, mounted:true, frames:0, root, canvas};
    resize(); raf=requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
