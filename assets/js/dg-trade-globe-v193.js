/* DIANAFARM GROUP v193 — INTERNATIONAL TRADE: FIXED BODY OVERLAY CANVAS/JS PRO GLOBE
   This version does NOT rely on hero stacking/z-index. It appends the animated canvas to <body>
   and positions it over the hero blank zone with position:fixed. Page: service-international-trade only. */
(() => {
  'use strict';
  const VERSION = 'v193-trade-fixed-body-overlay-canvas-js-pro';
  if (!document.body || document.body.dataset.page !== 'service-international-trade') return;

  const GOLD = [232, 188, 116];
  const GOLD2 = [255, 224, 156];
  const CREAM = [255, 246, 210];
  const BLUE = [83, 145, 255];
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const rgba = (c,a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const imp = (el, obj) => { for (const [k,v] of Object.entries(obj)) el.style.setProperty(k, String(v), 'important'); };

  function css(){
    if (document.getElementById('dg-trade-v193-style')) return;
    const s = document.createElement('style');
    s.id = 'dg-trade-v193-style';
    s.textContent = `
      #dgTradeGlobeV193Root,#dgTradeGlobeV193Root *{box-sizing:border-box!important}
      #dgTradeGlobeV193Root{position:fixed!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:none!important;overflow:visible!important;contain:none!important;z-index:150!important;isolation:isolate!important;will-change:transform,opacity!important;filter:drop-shadow(0 0 44px rgba(255,224,156,.92)) drop-shadow(0 34px 88px rgba(0,0,0,.50))!important;}
      #dgTradeGlobeCanvasV193{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;visibility:visible!important;opacity:1!important;z-index:5!important;}
      .dg-trade-v193-css-orb{position:absolute!important;inset:7%!important;border-radius:50%!important;display:block!important;visibility:visible!important;opacity:.92!important;z-index:1!important;background:radial-gradient(circle at 43% 35%,rgba(255,250,218,.48) 0 2.8%,transparent 3.6%),radial-gradient(circle at 64% 52%,rgba(255,220,138,.36) 0 2.4%,transparent 3.2%),radial-gradient(circle at 50% 49%,rgba(255,224,156,.22) 0 7%,rgba(92,145,255,.16) 28%,rgba(7,21,48,.05) 58%,transparent 73%),repeating-radial-gradient(circle at center,transparent 0 25px,rgba(255,224,156,.22) 26px 28px,transparent 29px 54px),repeating-conic-gradient(from 0deg,rgba(255,224,156,.17) 0 1.2deg,transparent 1.4deg 13deg)!important;border:1px solid rgba(255,234,178,.50)!important;box-shadow:inset 0 0 58px rgba(255,232,170,.20),0 0 86px rgba(232,188,116,.24)!important;animation:dgTradeV193Orb 18s linear infinite,dgTradeV193Pulse 4.8s ease-in-out infinite!important;}
      .dg-trade-v193-css-orb:before,.dg-trade-v193-css-orb:after{content:""!important;position:absolute!important;inset:15%!important;border-radius:50%!important;border:1px solid rgba(255,238,184,.35)!important;transform:rotateX(72deg) rotateZ(22deg)!important;box-shadow:0 0 30px rgba(255,224,156,.28)!important;}
      .dg-trade-v193-css-orb:after{inset:27%!important;transform:rotateY(66deg) rotateZ(-18deg)!important;opacity:.78!important;}
      .dg-trade-v193-label{position:absolute!important;z-index:8!important;display:block!important;visibility:visible!important;opacity:.98!important;padding:8px 11px!important;border-radius:999px!important;border:1px solid rgba(255,238,184,.68)!important;background:linear-gradient(135deg,rgba(8,22,44,.74),rgba(232,188,116,.20))!important;color:#fff1bf!important;font:900 11px/1.05 Arial,sans-serif!important;letter-spacing:.17em!important;text-shadow:0 0 14px rgba(255,238,184,.78)!important;box-shadow:0 0 24px rgba(232,188,116,.36),inset 0 0 14px rgba(255,255,255,.08)!important;animation:dgTradeV193Label 5s ease-in-out infinite!important;}
      .dg-trade-v193-label--bg{left:42%!important;top:25%!important}.dg-trade-v193-label--uae{left:64%!important;top:48%!important;animation-delay:-1.2s!important}.dg-trade-v193-label--asia{left:73%!important;top:30%!important;animation-delay:-2.4s!important}
      .dg-trade-v193-shadow{position:absolute!important;left:18%!important;right:18%!important;bottom:6%!important;height:48px!important;border-radius:999px!important;background:radial-gradient(ellipse at center,rgba(255,224,156,.30),rgba(73,125,236,.14) 48%,transparent 75%)!important;filter:blur(14px)!important;z-index:0!important;}
      @keyframes dgTradeV193Orb{to{transform:rotate(360deg)}}
      @keyframes dgTradeV193Pulse{0%,100%{opacity:.70;filter:saturate(1)}50%{opacity:1;filter:saturate(1.45)}}
      @keyframes dgTradeV193Label{0%,100%{transform:translate3d(0,-5px,0)}50%{transform:translate3d(0,7px,0)}}
      @media(max-width:640px){#dgTradeGlobeV193Root{display:none!important;visibility:hidden!important;opacity:0!important}}
    `;
    document.head.appendChild(s);
  }

  function ensure(){
    css();
    let root = document.getElementById('dgTradeGlobeV193Root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'dgTradeGlobeV193Root';
      root.setAttribute('data-dg-v193','trade-fixed-overlay');
      root.setAttribute('aria-hidden','true');
      root.innerHTML = `
        <div class="dg-trade-v193-shadow"></div>
        <div class="dg-trade-v193-css-orb"></div>
        <canvas id="dgTradeGlobeCanvasV193" data-dg-trade-canvas-v193></canvas>
        <div class="dg-trade-v193-label dg-trade-v193-label--bg">BG</div>
        <div class="dg-trade-v193-label dg-trade-v193-label--uae">UAE</div>
        <div class="dg-trade-v193-label dg-trade-v193-label--asia">ASIA</div>`;
      document.body.appendChild(root);
    }
    imp(root, {display:'block', visibility:'visible', opacity:'1', position:'fixed', 'z-index':'150', 'pointer-events':'none', overflow:'visible'});
    const canvas = root.querySelector('canvas');
    imp(canvas, {display:'block', visibility:'visible', opacity:'1', position:'absolute', inset:'0', width:'100%', height:'100%'});
    return {root, canvas};
  }

  function seed(n){const x=Math.sin(n*113.71+41.33)*43758.5453;return x-Math.floor(x)}
  const stars=Array.from({length:180},(_,i)=>({x:seed(i+1),y:seed(i+91),r:.45+seed(i+181)*1.9,p:seed(i+271)*TAU}));
  const nodes=[
    {name:'BG',lat:42.70,lon:25.48,power:1.35},{name:'UAE',lat:24.45,lon:54.37,power:1.25},{name:'UZ',lat:41.31,lon:69.24,power:.9},
    {name:'CN',lat:31.23,lon:121.47,power:1.0},{name:'IN',lat:19.07,lon:72.88,power:.9},{name:'DE',lat:52.52,lon:13.40,power:.75},
    {name:'TR',lat:41.01,lon:28.97,power:.82},{name:'SG',lat:1.35,lon:103.82,power:.86},{name:'EG',lat:30.04,lon:31.23,power:.72}
  ];
  const idx=Object.fromEntries(nodes.map((n,i)=>[n.name,i]));
  const routes=[['BG','UAE',0,.96],['BG','UZ',.14,.86],['BG','CN',.27,.70],['UAE','IN',.42,1.02],['UAE','SG',.55,.78],['BG','DE',.68,.64],['BG','TR',.82,.86],['TR','EG',.91,.74]].map(([a,b,ph,sp],i)=>({a:idx[a],b:idx[b],ph,sp,group:i%3}));

  const vLatLon=(lat,lon)=>{const p=lat*DEG,l=lon*DEG;return {x:Math.cos(p)*Math.sin(l),y:-Math.sin(p),z:Math.cos(p)*Math.cos(l)}};
  const norm=v=>{const m=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/m,y:v.y/m,z:v.z/m}};
  function rot(p,ry,rx,rz){let{x,y,z}=p;let c=Math.cos(ry),s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(rx);s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];return{x,y,z}}
  function slerp(a,b,t){const d=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)),om=Math.acos(d);if(om<.0001)return a;const so=Math.sin(om),s1=Math.sin((1-t)*om)/so,s2=Math.sin(t*om)/so;return norm({x:a.x*s1+b.x*s2,y:a.y*s1+b.y*s2,z:a.z*s1+b.z*s2})}
  const latLon=v=>({lat:-Math.asin(v.y)/DEG,lon:Math.atan2(v.x,v.z)/DEG});

  function run(){
    const hero = document.querySelector('.v9-page-hero.v103-service-hero') || document.querySelector('.v9-page-hero');
    const {root, canvas} = ensure();
    const ctx = canvas.getContext('2d', {alpha:true, desynchronized:true});
    if (!ctx){ root.dataset.error='canvas-context-failed'; return; }

    let W=0,H=0,DPR=1,cx=0,cy=0,R=1,t=0,last=performance.now(),frames=0;
    let mx=0,my=0,sx=0,sy=0,hover=-1,boost=0;
    const isPhone=()=>matchMedia('(max-width:640px)').matches;

    function layout(){
      if (isPhone()){ imp(root,{display:'none',visibility:'hidden',opacity:'0'}); return false; }
      if (!hero){ imp(root,{display:'none'}); return false; }
      const r=hero.getBoundingClientRect();
      const vh=innerHeight||document.documentElement.clientHeight;
      if (r.bottom < 40 || r.top > vh-40){ imp(root,{opacity:'0',visibility:'hidden'}); return false; }
      const vw=innerWidth||document.documentElement.clientWidth;
      const size=Math.round(Math.max(420, Math.min(660, vw*0.40, r.height*0.82)));
      let x=r.left + r.width * (vw < 980 ? .62 : .60);
      let y=r.top + r.height * .53;
      // Keep it inside visible hero area while staying between text and proof cards.
      x=Math.max(size*.50+16, Math.min(vw-size*.50-16, x));
      y=Math.max(size*.50+88, Math.min(vh-size*.50-18, y));
      imp(root,{display:'block',visibility:'visible',opacity:'1',left:`${Math.round(x-size/2)}px`,top:`${Math.round(y-size/2)}px`,width:`${size}px`,height:`${size}px`});
      const d=Math.min(2,Math.max(1,devicePixelRatio||1));
      if(size!==W || size!==H || d!==DPR){W=size;H=size;DPR=d;canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);cx=W*.5;cy=H*.5;R=W*.31;}
      return true;
    }
    function project(lat,lon,ry,rx,rz,rm=1){const p=rot(vLatLon(lat,lon),ry,rx,rz);const pp=1/(1.48-p.z*.36);return{x:cx+p.x*R*rm*pp,y:cy+p.y*R*rm*pp,z:p.z,scale:pp,front:p.z>-0.11}}
    function stroke(points,color,width,alpha,glow=0){if(points.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';if(glow){ctx.shadowBlur=glow;ctx.shadowColor=color;}ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.restore()}
    function sphereLine(v,isLat,ry,rx,rz){const front=[],back=[];const a0=isLat?-180:-78,a1=isLat?180:78;for(let a=a0;a<=a1;a+=3){const p=isLat?project(v,a,ry,rx,rz):project(a,v,ry,rx,rz);(p.front?front:back).push(p);if(p.front&&back.length){stroke(back,rgba(BLUE,.18),.9,.38);back.length=0}if(!p.front&&front.length){stroke(front,rgba(CREAM,.30),1.2,.74,5);front.length=0}}stroke(back,rgba(BLUE,.15),.9,.34);stroke(front,rgba(CREAM,.31),1.18,.78,5)}
    function ambient(){ctx.clearRect(0,0,W,H);const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*2.35);g.addColorStop(0,'rgba(255,236,178,.20)');g.addColorStop(.32,'rgba(83,145,255,.13)');g.addColorStop(.74,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='lighter';for(const st of stars){const tw=.35+.65*(Math.sin(t*.0014+st.p)*.5+.5);ctx.globalAlpha=.12+tw*.46;ctx.fillStyle=st.r>1.2?rgba(GOLD,.60):rgba(CREAM,.45);ctx.beginPath();ctx.arc(st.x*W,st.y*H,st.r*tw,0,TAU);ctx.fill()}ctx.restore()}
    function grid(ry,rx,rz){[-60,-42,-24,-8,8,24,42,60].forEach(lat=>sphereLine(lat,true,ry,rx,rz));for(let lon=0;lon<360;lon+=20)sphereLine(lon,false,ry,rx,rz);ctx.save();ctx.globalCompositeOperation='lighter';const rim=ctx.createRadialGradient(cx,cy,R*.2,cx,cy,R*1.18);rim.addColorStop(0,'rgba(255,255,255,0)');rim.addColorStop(.74,'rgba(255,242,190,.05)');rim.addColorStop(.985,'rgba(255,232,170,.48)');rim.addColorStop(1,'rgba(255,232,170,0)');ctx.fillStyle=rim;ctx.beginPath();ctx.arc(cx,cy,R*1.13,0,TAU);ctx.fill();ctx.strokeStyle=rgba(CREAM,.56);ctx.lineWidth=1.6;ctx.shadowBlur=22;ctx.shadowColor=rgba(GOLD2,.82);ctx.stroke();ctx.restore()}
    function drawRoutes(ry,rx,rz){routes.forEach((route,ri)=>{const a=nodes[route.a],b=nodes[route.b],av=vLatLon(a.lat,a.lon),bv=vLatLon(b.lat,b.lon),front=[],back=[];for(let i=0;i<=96;i++){const tt=i/96,v=slerp(av,bv,tt),ll=latLon(v),p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.31);(p.front?front:back).push(p)}const active=hover<0||hover===route.group;stroke(back,rgba(BLUE,.25),1.2,active?.48:.22,3);stroke(front,rgba(GOLD2,.90),active?2.35:1.4,active?.88:.30,active?18:5);const travel=((t*.00013*route.sp+route.ph+boost)%1+1)%1;for(let k=0;k<(active?2:1);k++){const tt=(travel+k*.50)%1,v=slerp(av,bv,tt),ll=latLon(v),p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.31);if(p.z<-.23)continue;const pr=(5+9*p.scale)*(1+Math.sin(t*.006+ri)*.12);const gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,pr*4.8);gr.addColorStop(0,'rgba(255,255,240,1)');gr.addColorStop(.20,'rgba(255,224,156,.92)');gr.addColorStop(.58,'rgba(232,188,116,.28)');gr.addColorStop(1,'rgba(232,188,116,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,pr*4.8,0,TAU);ctx.fill();ctx.fillStyle='#fff5c9';ctx.shadowBlur=30;ctx.shadowColor='#ffdf9d';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2.4,pr*.44),0,TAU);ctx.fill();ctx.restore()}})}
    function nodeDots(ry,rx,rz){for(const n of nodes){const p=project(n.lat,n.lon,ry,rx,rz,1.012);if(p.z<-.25)continue;const a=Math.max(.25,Math.min(1,(p.z+.25)/1.25));const rr=(3.7+5.2*n.power)*p.scale;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.fillStyle='rgba(255,247,214,.98)';ctx.shadowBlur=25*n.power;ctx.shadowColor='rgba(255,224,156,.90)';ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();ctx.strokeStyle=rgba(GOLD2,.78);ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(p.x,p.y,rr*2.45,0,TAU);ctx.stroke();ctx.restore()}}
    function frame(now){if(!layout()){requestAnimationFrame(frame);return}const dt=Math.min(48,now-last);last=now;t+=dt;sx+=(mx-sx)*.045;sy+=(my-sy)*.045;boost*=.985;const ry=t*.00022+sx*.22,rx=-12*DEG+Math.sin(t*.00025)*4*DEG+sy*.15,rz=Math.sin(t*.00012)*5*DEG;ambient();grid(ry,rx,rz);drawRoutes(ry,rx,rz);nodeDots(ry,rx,rz);frames++;window.DG_TRADE_GLOBE_V193.frames=frames;requestAnimationFrame(frame)}
    hero?.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();mx=((e.clientX-b.left)/Math.max(1,b.width)-.5)*2;my=((e.clientY-b.top)/Math.max(1,b.height)-.5)*2},{passive:true});
    hero?.addEventListener('pointerleave',()=>{mx=0;my=0},{passive:true});
    hero?.querySelectorAll('.v103-hero-proof article').forEach((card,i)=>{card.addEventListener('pointerenter',()=>{hover=i;boost=.14+i*.07},{passive:true});card.addEventListener('pointerleave',()=>{hover=-1},{passive:true})});
    window.addEventListener('resize',layout,{passive:true});window.addEventListener('scroll',layout,{passive:true});
    root.dataset.mounted='true';
    window.DG_TRADE_GLOBE_V193={version:VERSION,mounted:true,frames:0,root,canvas,hero};
    layout(); requestAnimationFrame(frame);
    console.info('[DIANAFARM]', VERSION, 'mounted');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true}); else run();
})();
