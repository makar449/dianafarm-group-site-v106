
(function(){
  'use strict';

  function initV237Scenes(){
    document.querySelectorAll('[data-v237-scene]').forEach(function(stage){
      if(stage.dataset.v237Ready) return;
      stage.dataset.v237Ready = 'true';
      var canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden','true');
      stage.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var theme = String(stage.dataset.v237Scene || 'realestate').toLowerCase();
      var mouse = {x:.5, y:.5, tx:.5, ty:.5};
      var time = 0;
      var particles = [];

      function resize(){
        var r = stage.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        canvas.style.width = r.width + 'px';
        canvas.style.height = r.height + 'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        particles = Array.from({length: theme === 'blog' ? 42 : 34}).map(function(_, i){
          return {
            a: Math.random()*Math.PI*2,
            r: (Math.random()*.42+.11)*Math.min(r.width,r.height),
            s: .0018 + Math.random()*.0032,
            z: Math.random(),
            i: i
          };
        });
      }
      function rounded(x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
      }
      function glow(x,y,r,color,alpha){
        var g = ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,'rgba('+color+','+alpha+')');
        g.addColorStop(1,'rgba('+color+',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fill();
      }
      function baseBackground(w,h){
        var bg = ctx.createLinearGradient(0,0,w,h);
        bg.addColorStop(0,'rgba(8,20,36,.98)');
        bg.addColorStop(.56,'rgba(12,30,52,.96)');
        bg.addColorStop(1,'rgba(4,12,24,.99)');
        ctx.fillStyle = bg;
        rounded(0,0,w,h,32);
        ctx.fill();
        ctx.strokeStyle = 'rgba(231,193,130,.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      function perspectiveGrid(w,h,tilt){
        ctx.save();
        ctx.translate(w*.5,h*.70);
        ctx.rotate(tilt || 0);
        ctx.strokeStyle='rgba(231,193,130,.12)';
        ctx.lineWidth=1;
        for(var i=-9;i<=9;i++){
          ctx.beginPath();
          ctx.moveTo(-w*.42,i*18);
          ctx.lineTo(w*.42,i*18);
          ctx.stroke();
        }
        ctx.strokeStyle='rgba(103,166,230,.10)';
        for(var j=-9;j<=9;j++){
          ctx.beginPath();
          ctx.moveTo(j*28,-h*.22);
          ctx.lineTo(j*10,h*.24);
          ctx.stroke();
        }
        ctx.restore();
      }
      function orbit(cx,cy,rx,ry,rot,color,alpha){
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(rot);
        ctx.strokeStyle='rgba('+color+','+alpha+')';
        ctx.lineWidth=1.3;
        ctx.beginPath();
        ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
      function drawParticles(cx,cy,w,h){
        particles.forEach(function(p){
          p.a += p.s;
          var x = cx + Math.cos(p.a + p.i*.38) * p.r;
          var y = cy + Math.sin(p.a*1.16 + p.i*.25) * p.r * .55;
          var isGold = p.i % 2;
          ctx.fillStyle = isGold ? 'rgba(231,193,130,.78)' : 'rgba(121,185,255,.72)';
          glow(x,y,12+p.z*14,isGold?'231,193,130':'121,185,255',.09);
          ctx.beginPath();
          ctx.arc(x,y,1.4+p.z*3.2,0,Math.PI*2);
          ctx.fill();
        });
      }
      function drawRealEstate(w,h,cx,cy){
        perspectiveGrid(w,h,-.02);
        glow(cx,cy,Math.min(w,h)*.34,'231,193,130',.15);
        // architectural towers
        ctx.save();
        ctx.translate(cx,cy+55);
        ctx.strokeStyle='rgba(255,247,232,.72)';
        ctx.fillStyle='rgba(231,193,130,.08)';
        ctx.lineWidth=1.5;
        [-52,-28,-5,18,42].forEach(function(x,i){
          var hh = 72 + (i%2)*35 + Math.sin(time+i)*8;
          rounded(x,-hh,15,hh,2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.strokeStyle='rgba(231,193,130,.66)';
        ctx.beginPath();
        ctx.moveTo(-74,38);
        ctx.lineTo(-22,2);
        ctx.lineTo(15,44);
        ctx.lineTo(66,10);
        ctx.stroke();
        ctx.restore();
        for(var k=0;k<4;k++){
          orbit(cx,cy+22,92+k*34,25+k*8,time*.18+k*.36,'231,193,130',.30-k*.04);
        }
        ctx.strokeStyle='rgba(121,185,255,.14)';
        for(var wave=0; wave<7; wave++){
          ctx.beginPath();
          for(var x=w*.08; x<w*.92; x+=18){
            var y = h*.80 + wave*11 + Math.sin(x*.025 + time + wave)*4;
            if(x===w*.08) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
      }
      function drawUae(w,h,cx,cy){
        perspectiveGrid(w,h,.02);
        glow(cx,cy,Math.min(w,h)*.35,'239,190,116',.16);
        ctx.save();
        ctx.translate(cx,cy+80);
        var bars=[36,92,58,150,76,112,48,128,66,96];
        bars.forEach(function(b,i){
          var x=(i-4.5)*27 + (mouse.x-.5)*18;
          var grad=ctx.createLinearGradient(x,-b,x,0);
          grad.addColorStop(0,'rgba(239,190,116,.70)');
          grad.addColorStop(1,'rgba(74,130,190,.12)');
          ctx.fillStyle=grad;
          ctx.strokeStyle='rgba(239,190,116,.28)';
          rounded(x-8,-b,16,b,2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
        for(var k=0;k<4;k++){
          orbit(cx,cy+10,140+k*38,32+k*8,time*.13+k*.38,'239,190,116',.28-k*.035);
        }
      }
      function drawAsia(w,h,cx,cy){
        perspectiveGrid(w,h,-.04);
        glow(cx,cy,Math.min(w,h)*.34,'86,208,208',.12);
        ctx.save();
        ctx.translate(cx,cy);
        ctx.strokeStyle='rgba(255,247,232,.44)';
        ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(0,0,78,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0,0,78,24,time*.18,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0,0,26,78,-time*.16,0,Math.PI*2); ctx.stroke();
        ctx.restore();
        var pts=[[.19,.64],[.35,.47],[.52,.56],[.69,.36],[.82,.60],[.47,.74]];
        for(var i=0;i<pts.length-1;i++){
          var p=pts[i], q=pts[i+1];
          ctx.strokeStyle='rgba(231,193,130,.38)';
          ctx.lineWidth=1.8;
          ctx.beginPath();
          ctx.moveTo(p[0]*w,p[1]*h);
          ctx.quadraticCurveTo((p[0]+q[0])*.5*w,(p[1]+q[1])*.5*h-54,q[0]*w,q[1]*h);
          ctx.stroke();
        }
        pts.forEach(function(p,i){
          var x=p[0]*w, y=p[1]*h;
          glow(x,y,24,i%2?'231,193,130':'86,208,208',.20);
          ctx.fillStyle=i%2?'rgba(231,193,130,.90)':'rgba(86,208,208,.88)';
          ctx.beginPath();
          ctx.arc(x,y,4+i%3,0,Math.PI*2);
          ctx.fill();
        });
      }
      function drawBlog(w,h,cx,cy){
        glow(cx,cy,Math.min(w,h)*.36,'231,193,130',.14);
        ctx.save();
        ctx.translate(cx,cy);
        for(var i=0;i<6;i++){
          ctx.save();
          ctx.translate((i-2.5)*12, (i-2.5)*-8);
          ctx.rotate(-.08+i*.025+(mouse.x-.5)*.05);
          ctx.fillStyle='rgba(18,35,58,'+(0.58+i*.05)+')';
          ctx.strokeStyle='rgba(231,193,130,'+(0.12+i*.03)+')';
          rounded(-116,-72,232,144,16);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle='rgba(255,247,232,.14)';
          for(var l=0;l<5;l++){
            ctx.beginPath();
            ctx.moveTo(-78,-36+l*22);
            ctx.lineTo(74,-36+l*22);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
        for(var k=0;k<3;k++){
          orbit(cx,cy,150+k*38,48+k*10,time*.10+k*.55,'121,185,255',.12);
        }
      }
      function frame(){
        var r = stage.getBoundingClientRect();
        var w = r.width, h = r.height;
        time += .016;
        mouse.x += (mouse.tx-mouse.x)*.08;
        mouse.y += (mouse.ty-mouse.y)*.08;
        var cx = w*(.5+(mouse.x-.5)*.08);
        var cy = h*(.48+(mouse.y-.5)*.08);
        ctx.clearRect(0,0,w,h);
        baseBackground(w,h);
        drawParticles(cx,cy,w,h);
        if(theme==='uae') drawUae(w,h,cx,cy);
        else if(theme==='asia') drawAsia(w,h,cx,cy);
        else if(theme==='blog') drawBlog(w,h,cx,cy);
        else drawRealEstate(w,h,cx,cy);
        requestAnimationFrame(frame);
      }
      stage.addEventListener('mousemove',function(e){
        var r=stage.getBoundingClientRect();
        mouse.tx=(e.clientX-r.left)/r.width;
        mouse.ty=(e.clientY-r.top)/r.height;
      });
      stage.addEventListener('mouseleave',function(){mouse.tx=.5;mouse.ty=.5;});
      resize();
      frame();
      window.addEventListener('resize',resize);
    });
  }

  document.addEventListener('DOMContentLoaded', initV237Scenes);
})();
