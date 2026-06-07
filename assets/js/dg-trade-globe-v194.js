/* DIANAFARM GROUP v194 — INTERNATIONAL TRADE PRO GLOBE
   Inline root + external Canvas JS. The root exists in HTML with a visible fallback. This script only enhances it. */
(() => {
  'use strict';
  const VERSION = 'v194-trade-inline-root-canvas-external-js-visible';
  const ROOT_ID = 'dgTradeGlobeV194Root';
  const CANVAS_ID = 'dgTradeGlobeCanvasV194';
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const GOLD = [232,188,116], GOLD2=[255,224,156], CREAM=[255,246,210], BLUE=[79,142,255];
  const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const set=(el,obj)=>{ if(!el) return; for(const [k,v] of Object.entries(obj)) el.style.setProperty(k,String(v),'important'); };
  function addStyle(){
    if(document.getElementById('dg-trade-v194-js-css')) return;
    const s=document.createElement('style');
    s.id='dg-trade-v194-js-css';
    s.textContent=`
      #${ROOT_ID}{position:fixed!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:none!important;z-index:999999!important;overflow:visible!important;isolation:isolate!important;contain:none!important;mix-blend-mode:screen!important;}
      #${CANVAS_ID}{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;visibility:visible!important;opacity:1!important;z-index:6!important;}
      #${ROOT_ID} .dg-trade-v194-label{animation:dgTradeV194Label 5s ease-in-out infinite!important;}
      #${ROOT_ID} .dg-trade-v194-label:nth-of-type(3){animation-delay:-1.2s!important;}#${ROOT_ID} .dg-trade-v194-label:nth-of-type(4){animation-delay:-2.4s!important;}
      @keyframes dgTradeV194Label{0%,100%{transform:translate3d(0,-5px,0)}50%{transform:translate3d(0,7px,0)}}
      @media(max-width:640px){#${ROOT_ID}{display:none!important;visibility:hidden!important;opacity:0!important}}
    `;
    document.head.appendChild(s);
  }
  function ensureRoot(){
    addStyle();
    let root=document.getElementById(ROOT_ID);
    if(!root){
      root=document.createElement('div');
      root.id=ROOT_ID;
      root.setAttribute('data-dg-v194','trade-js-created-root');
      root.setAttribute('aria-hidden','true');
      root.innerHTML='<canvas id="'+CANVAS_ID+'" data-dg-trade-canvas-v194></canvas>';
      document.body.appendChild(root);
    }
    let canvas=document.getElementById(CANVAS_ID);
    if(!canvas){
      canvas=document.createElement('canvas'); canvas.id=CANVAS_ID; canvas.setAttribute('data-dg-trade-canvas-v194',''); root.appendChild(canvas);
    }
    set(root,{display:'block',visibility:'visible',opacity:'1',position:'fixed','z-index':'999999','pointer-events':'none',overflow:'visible'});
    set(canvas,{display:'block',visibility:'visible',opacity:'1',position:'absolute',inset:'0',width:'100%',height:'100%','z-index':'6'});
    return {root,canvas};
  }
  function seed(n){const x=Math.sin(n*127.13+19.71)*43758.5453;return x-Math.floor(x)}
  const stars=Array.from({length:220},(_,i)=>({x:seed(i+1),y:seed(i+111),r:.35+seed(i+221)*1.9,p:seed(i+331)*TAU}));
  const nodes=[
    {name:'BG',lat:42.70,lon:25.48,power:1.55},{name:'UAE',lat:24.45,lon:54.37,power:1.45},{name:'UZ',lat:41.31,lon:69.24,power:.95},
    {name:'CN',lat:31.23,lon:121.47,power:1.0},{name:'IN',lat:19.07,lon:72.88,power:.9},{name:'DE',lat:52.52,lon:13.40,power:.78},
    {name:'TR',lat:41.01,lon:28.97,power:.88},{name:'SG',lat:1.35,lon:103.82,power:.86},{name:'EG',lat:30.04,lon:31.23,power:.72}
  ];
  const idx=Object.fromEntries(nodes.map((n,i)=>[n.name,i]));
  const routes=[['BG','UAE',0,.96],['BG','UZ',.14,.86],['BG','CN',.27,.76],['UAE','IN',.42,1.03],['UAE','SG',.55,.82],['BG','DE',.68,.64],['BG','TR',.82,.92],['TR','EG',.91,.74]].map(([a,b,ph,sp],i)=>({a:idx[a],b:idx[b],ph,sp,group:i%3}));
  const vLatLon=(lat,lon)=>{const p=lat*DEG,l=lon*DEG;return{x:Math.cos(p)*Math.sin(l),y:-Math.sin(p),z:Math.cos(p)*Math.cos(l)}};
  const norm=v=>{const m=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/m,y:v.y/m,z:v.z/m}};
  function rot(p,ry,rx,rz){let{x,y,z}=p;let c=Math.cos(ry),s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(rx);s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];return{x,y,z}}
  function slerp(a,b,t){const d=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)),om=Math.acos(d);if(om<.0001)return a;const so=Math.sin(om);return norm({x:a.x*Math.sin((1-t)*om)/so+b.x*Math.sin(t*om)/so,y:a.y*Math.sin((1-t)*om)/so+b.y*Math.sin(t*om)/so,z:a.z*Math.sin((1-t)*om)/so+b.z*Math.sin(t*om)/so})}
  const latLon=v=>({lat:-Math.asin(v.y)/DEG,lon:Math.atan2(v.x,v.z)/DEG});
  function start(){
    const {root,canvas}=ensureRoot();
    const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
    const hero=document.querySelector('.v9-page-hero.v103-service-hero') || document.querySelector('.v9-page-hero') || document.querySelector('main');
    const proofCards=[...document.querySelectorAll('.v103-hero-proof article')];
    window.DG_TRADE_GLOBE_V194={version:VERSION,mounted:true,frames:0,root,canvas,hero,mode:ctx?'canvas':'fallback-only'};
    if(!ctx){root.dataset.error='canvas-context-failed'; return;}
    let W=0,H=0,DPR=1,cx=0,cy=0,R=1,t=0,last=performance.now(),frames=0,mx=0,my=0,sx=0,sy=0,hover=-1,boost=0;
    const isPhone=()=>matchMedia('(max-width:640px)').matches;
    function layout(){
      if(isPhone()){set(root,{display:'none',visibility:'hidden',opacity:'0'});return false;}
      const vw=innerWidth||document.documentElement.clientWidth, vh=innerHeight||document.documentElement.clientHeight;
      let size=Math.round(Math.max(440,Math.min(650,vw*.44,vh*.70)));
      let x=vw*.545, y=vh*.465;
      if(hero){
        const r=hero.getBoundingClientRect();
        if(r.bottom<40 || r.top>vh-40){set(root,{opacity:'0',visibility:'hidden'});return false;}
        size=Math.round(Math.max(440,Math.min(650,vw*.44,r.height*.86)));
        x=r.left + r.width*.57; y=r.top + r.height*.52;
      }
      x=Math.max(size*.42,Math.min(vw-size*.58,x));
      y=Math.max(116,Math.min(vh-size*.55,y-size*.50));
      set(root,{left:`${Math.round(x-size*.50)}px`,top:`${Math.round(y)}px`,width:`${size}px`,height:`${size}px`,display:'block',visibility:'visible',opacity:'1'});
      const d=Math.min(2,Math.max(1,devicePixelRatio||1));
      if(W!==size||H!==size||DPR!==d){W=H=size;DPR=d;canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);cx=W*.5;cy=H*.5;R=W*.315;}
      return true;
    }
    function project(lat,lon,ry,rx,rz,rm=1){const p=rot(vLatLon(lat,lon),ry,rx,rz);const pp=1/(1.52-p.z*.37);return{x:cx+p.x*R*rm*pp,y:cy+p.y*R*rm*pp,z:p.z,scale:pp,front:p.z>-0.10}}
    function stroke(points,color,width,alpha,glow=0){if(points.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';if(glow){ctx.shadowBlur=glow;ctx.shadowColor=color;}ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.restore()}
    function ambient(){ctx.clearRect(0,0,W,H);const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*2.45);g.addColorStop(0,'rgba(255,236,178,.22)');g.addColorStop(.34,'rgba(83,145,255,.16)');g.addColorStop(.76,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='lighter';for(const st of stars){const tw=.35+.65*(Math.sin(t*.00135+st.p)*.5+.5);ctx.globalAlpha=.12+tw*.46;ctx.fillStyle=st.r>1.2?rgba(GOLD,.62):rgba(CREAM,.48);ctx.beginPath();ctx.arc(st.x*W,st.y*H,st.r*tw,0,TAU);ctx.fill()}ctx.restore()}
    function sphereLine(v,isLat,ry,rx,rz){const front=[],back=[];const a0=isLat?-180:-78,a1=isLat?180:78;for(let a=a0;a<=a1;a+=3){const p=isLat?project(v,a,ry,rx,rz):project(a,v,ry,rx,rz);(p.front?front:back).push(p);if(p.front&&back.length){stroke(back,rgba(BLUE,.17),.85,.36);back.length=0}if(!p.front&&front.length){stroke(front,rgba(CREAM,.32),1.15,.78,5);front.length=0}}stroke(back,rgba(BLUE,.16),.85,.36);stroke(front,rgba(CREAM,.32),1.15,.80,5)}
    function grid(ry,rx,rz){[-60,-42,-24,-8,8,24,42,60].forEach(lat=>sphereLine(lat,true,ry,rx,rz));for(let lon=0;lon<360;lon+=20)sphereLine(lon,false,ry,rx,rz);ctx.save();ctx.globalCompositeOperation='lighter';const rim=ctx.createRadialGradient(cx,cy,R*.22,cx,cy,R*1.18);rim.addColorStop(0,'rgba(255,255,255,0)');rim.addColorStop(.72,'rgba(255,242,190,.05)');rim.addColorStop(.985,'rgba(255,232,170,.55)');rim.addColorStop(1,'rgba(255,232,170,0)');ctx.fillStyle=rim;ctx.beginPath();ctx.arc(cx,cy,R*1.13,0,TAU);ctx.fill();ctx.strokeStyle=rgba(CREAM,.64);ctx.lineWidth=1.8;ctx.shadowBlur=26;ctx.shadowColor=rgba(GOLD2,.90);ctx.stroke();ctx.restore()}
    function drawRoutes(ry,rx,rz){routes.forEach((route,ri)=>{const a=nodes[route.a],b=nodes[route.b],av=vLatLon(a.lat,a.lon),bv=vLatLon(b.lat,b.lon),front=[],back=[];for(let i=0;i<=96;i++){const tt=i/96,v=slerp(av,bv,tt),ll=latLon(v),p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.33);(p.front?front:back).push(p)}const active=hover<0||hover===route.group;stroke(back,rgba(BLUE,.24),1.2,active?.46:.22,3);stroke(front,rgba(GOLD2,.94),active?2.45:1.55,active?.90:.36,active?20:5);const travel=((t*.00014*route.sp+route.ph+boost)%1+1)%1;for(let k=0;k<(active?2:1);k++){const tt=(travel+k*.50)%1,v=slerp(av,bv,tt),ll=latLon(v),p=project(ll.lat,ll.lon,ry,rx,rz,1+Math.sin(tt*Math.PI)*.33);if(p.z<-.22)continue;const pr=(5+9*p.scale)*(1+Math.sin(t*.006+ri)*.12);const gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,pr*5);gr.addColorStop(0,'rgba(255,255,240,1)');gr.addColorStop(.20,'rgba(255,224,156,.95)');gr.addColorStop(.58,'rgba(232,188,116,.30)');gr.addColorStop(1,'rgba(232,188,116,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,pr*5,0,TAU);ctx.fill();ctx.fillStyle='#fff5c9';ctx.shadowBlur=34;ctx.shadowColor='#ffdf9d';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2.4,pr*.46),0,TAU);ctx.fill();ctx.restore()}})}
    function nodeDots(ry,rx,rz){for(const n of nodes){const p=project(n.lat,n.lon,ry,rx,rz,1.012);if(p.z<-.25)continue;const a=Math.max(.25,Math.min(1,(p.z+.25)/1.25));const rr=(3.8+5.5*n.power)*p.scale;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.fillStyle='rgba(255,247,214,.98)';ctx.shadowBlur=27*n.power;ctx.shadowColor='rgba(255,224,156,.95)';ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();ctx.strokeStyle=rgba(GOLD2,.80);ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(p.x,p.y,rr*2.45,0,TAU);ctx.stroke();ctx.restore()}}
    function frame(now){if(!layout()){requestAnimationFrame(frame);return}const dt=Math.min(48,now-last);last=now;t+=dt;sx+=(mx-sx)*.045;sy+=(my-sy)*.045;boost*=.985;const ry=t*.00024+sx*.24,rx=-12*DEG+Math.sin(t*.00025)*4*DEG+sy*.16,rz=Math.sin(t*.00012)*5*DEG;ambient();grid(ry,rx,rz);drawRoutes(ry,rx,rz);nodeDots(ry,rx,rz);frames++;window.DG_TRADE_GLOBE_V194.frames=frames;requestAnimationFrame(frame)}
    hero?.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();mx=((e.clientX-b.left)/Math.max(1,b.width)-.5)*2;my=((e.clientY-b.top)/Math.max(1,b.height)-.5)*2},{passive:true});
    hero?.addEventListener('pointerleave',()=>{mx=0;my=0},{passive:true});
    proofCards.forEach((card,i)=>{card.addEventListener('pointerenter',()=>{hover=i;boost=.14+i*.07},{passive:true});card.addEventListener('pointerleave',()=>{hover=-1},{passive:true})});
    window.addEventListener('resize',layout,{passive:true}); window.addEventListener('scroll',layout,{passive:true});
    layout(); requestAnimationFrame(frame);
    console.info('[DIANAFARM]', VERSION, 'mounted');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
