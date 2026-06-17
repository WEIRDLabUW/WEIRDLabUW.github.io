/* ════════════════════════════════════════════════════════════════════
   Live method figure. Each panel's two distributions are drawn as vector:
     · step 1 is pinned to the BASE state   (c = 0)
     · step 3 is pinned to the DEPLOY state  (c = 1)
     · step 2 sweeps continuously base → deploy and back (c: 0 → 1 → 0),
       so the middle panel literally animates between its two neighbours.

   π_steer (top bell): gray + broad + centered  →  navy + narrow + tilted right.
   action dist (bottom): mass spread over red/blue/gold  →  concentrated on blue.
   Colors sampled from the original figure.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
    var NS='http://www.w3.org/2000/svg';
    function E(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
    function $(id){ return document.getElementById(id); }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function ease(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
    function mix(a,b,t){ return 'rgb('+Math.round(lerp(a[0],b[0],t))+','+Math.round(lerp(a[1],b[1],t))+','+Math.round(lerp(a[2],b[2],t))+')'; }

    var RED=[255,37,13], BLUE=[52,79,120], GOLD=[255,196,0], STROKE0=[122,128,140], STROKE1=[52,79,120];

    // π_steer bell — returns a draw(c)
    function makeBell(svg){
        if(!svg) return function(){};
        var SW=200, SB=84;
        var fill=E('path',{}); fill.style.fill='rgb(150,156,169)'; fill.style.fillOpacity=0.85; svg.appendChild(fill);
        var line=E('path',{fill:'none','stroke-width':5,'stroke-linejoin':'round','stroke-linecap':'round'}); svg.appendChild(line);
        function g(x,mu,sl,sr){ var s=x<mu?sl:sr, d=x-mu; return Math.exp(-(d*d)/(2*s*s)); }
        return function(c){
            var mu=lerp(100,126,c), sl=lerp(34,23,c), sr=lerp(34,15,c), amp=lerp(56,74,c), d='', N=120;
            for(var i=0;i<=N;i++){ var x=i/N*SW, y=SB-amp*g(x,mu,sl,sr); d+=(i?' L ':'M ')+x.toFixed(1)+' '+y.toFixed(1); }
            line.setAttribute('d', d); line.setAttribute('stroke', mix(STROKE0,STROKE1,c));
            fill.setAttribute('d', 'M 0 '+SB+' '+d.slice(2)+' L '+SW+' '+SB+' Z');
        };
    }
    // action distribution — returns a draw(c)
    function makeAct(svg){
        if(!svg) return function(){};
        var AW=235, AB=88, AH=70, SG=22, MU=[59,117,176], BND=[4,88,147,231], COLS=[RED,BLUE,GOLD];
        var WS=[0.95,0.58,1.00], WC=[0.22,1.00,0.18];
        var fills=[]; for(var i=0;i<3;i++){ var p=E('path',{}); p.style.fill='rgb('+COLS[i].join(',')+')'; svg.appendChild(p); fills.push(p); }
        var line=E('path',{fill:'none',stroke:'rgb(122,128,140)','stroke-width':6,'stroke-linejoin':'round','stroke-linecap':'round'}); svg.appendChild(line);
        function y(x,w){ var v=0; for(var i=0;i<3;i++){ var d=x-MU[i]; v+=w[i]*AH*Math.exp(-(d*d)/(2*SG*SG)); } return AB-v; }
        function region(w,xa,xb){ var d='M '+xa+' '+AB, N=120; for(var i=0;i<=N;i++){ var x=i/N*AW; if(x>=xa-1&&x<=xb+1) d+=' L '+x.toFixed(1)+' '+y(x,w).toFixed(1); } return d+' L '+xb+' '+AB+' Z'; }
        function top(w){ var d='', N=150; for(var i=0;i<=N;i++){ var x=i/N*AW; d+=(i?' L ':'M ')+x.toFixed(1)+' '+y(x,w).toFixed(1); } return d; }
        return function(c){
            var w=[lerp(WS[0],WC[0],c), lerp(WS[1],WC[1],c), lerp(WS[2],WC[2],c)];
            for(var i=0;i<3;i++) fills[i].setAttribute('d', region(w, BND[i], BND[i+1]));
            line.setAttribute('d', top(w));
        };
    }

    var b1=makeBell($('bell1')), b2=makeBell($('bell2')), b3=makeBell($('bell3'));
    var a1=makeAct($('act1')),  a2=makeAct($('act2')),  a3=makeAct($('act3'));
    b1(0); a1(0); b3(1); a3(1);                    // fixed endpoints
    function draw2(c){ b2(c); a2(c); }
    draw2(0);

    var T_UP=2600, T_HI=900, T_DN=1900, T_LO=600, T=T_UP+T_HI+T_DN+T_LO;
    var t0=null, playing=false, raf=null;
    function frame(ts){
        if(!playing) return;
        if(t0==null) t0=ts;
        var e=(ts-t0)%T, c;
        if(e<T_UP)                c=ease(e/T_UP);
        else if(e<T_UP+T_HI)      c=1;
        else if(e<T_UP+T_HI+T_DN)  c=1-ease((e-T_UP-T_HI)/T_DN);
        else                      c=0;
        draw2(c);
        raf=requestAnimationFrame(frame);
    }
    function play(){ if(playing) return; playing=true; t0=null; raf=requestAnimationFrame(frame); }
    function pause(){ playing=false; if(raf) cancelAnimationFrame(raf); raf=null; }
    play();
    var mfx=$('mfx');
    if('IntersectionObserver' in window && mfx){
        new IntersectionObserver(function(en){ en.forEach(function(x){ x.isIntersecting?play():pause(); }); }, { threshold:0 }).observe(mfx);
    }
})();
