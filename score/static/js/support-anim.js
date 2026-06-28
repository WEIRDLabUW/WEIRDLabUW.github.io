/* ════════════════════════════════════════════════════════════════════
   "What is a support constraint?"  —  the behavior-landscape figure.

   A 2D space of behaviors. The base policy π_base covers a soft region:
   its SUPPORT (the shaded blob). Reward grows toward the top-right.

   ONE cloud of behaviors walks slowly through the regimes so each is
   readable:
     1. base policy            — spread inside the support (grey)
     2. unconstrained RL       — no constraint, exploits the sim (dusty rose)
     3. distributional (BC) λ  — a hyperparameter sweep:
          strong λ  → pinned to base, keeps its flaws (purple)
          looser λ  → more reward, but drifting OUT of support
          weak λ    → collapses to unconstrained RL (dusty rose)
     4. SCORE                  — shift toward reward, stay IN support (blue)

   A single caption line and a λ slider update with the state. Palette
   matches the rest of the site.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
    var svg = document.getElementById('sconst-svg');
    if(!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    function E(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
    function clamp(t){ return t<0?0:t>1?1:t; }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function ease(t){ t=clamp(t); return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
    function easeOut(t){ t=clamp(t); return 1-Math.pow(1-t,3); }
    function mixA(a,b,t){ t=clamp(t); return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }
    function rgb(c){ return 'rgb('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+')'; }

    // palette
    var EM='#344f78', EMD='#26364f', EMM='#5f789f', EML='#dce4ee';
    var REDD='#8d4434', MUT='#7a7872', OCHD='#55426b', INKS='#4a4a44';
    var SLATE=[128,135,148], NAVY=[44,66,102], OCHRE=[85,66,107], REDV=[141,68,52];
    var ORANGE = mixA(OCHRE, REDV, 0.5);   // midpoint of distributional ↔ unconstrained, for the λ sweep
    var MONO = "'JetBrains Mono', ui-monospace, monospace";

    // geometry (viewBox 760 x 446) — behavior space on top, λ slider below
    var BLOB = 'M 152 214 C 150 150 214 110 300 108 C 412 105 506 140 508 220 '
             + 'C 510 300 430 346 320 346 C 212 346 156 290 152 214 Z';
    var GOAL = {x:432, y:152};        // high-reward region, still inside support
    var EXPL = {x:660, y:96};         // sim-exploit, outside support

    // one shared cloud of behaviors, spread across the support
    var BASE = [[214,200],[276,170],[342,162],[238,244],[306,224],[372,250],
                [206,272],[300,306],[416,228],[228,312],[342,300],[300,198]];
    var N = BASE.length;
    var SCT = BASE.map(function(_,i){ var a=i*2.39996, r=5+4.4*Math.sqrt(i);
        return [GOAL.x+r*Math.cos(a), GOAL.y+r*Math.sin(a)*0.82]; });     // SCORE: in-support cluster
    var EST = BASE.map(function(_,i){ var a=i*2.39996+1.1, r=6+5.0*Math.sqrt(i);
        return [EXPL.x+r*Math.cos(a), EXPL.y+r*Math.sin(a)*0.92]; });     // out of support (exploit)
    var MID = BASE.map(function(p,i){ return [lerp(p[0],EST[i][0],0.5), lerp(p[1],EST[i][1],0.5)]; });
    var POS = {base:BASE, score:SCT, mid:MID, out:EST};
    var PH  = BASE.map(function(_,i){ return i*1.27; });
    var RAD = BASE.map(function(_,i){ return 3.1 + (i%4===0?0.9:0); });

    // ── keyframes: each regime, held long enough to read ──
    // support = the set of actions the base policy can produce over its latent z;
    // SCORE steers z, so it can only ever land on actions inside that set.
    var KB = {pos:'base',  col:SLATE,  leg:0, cap:'Base policy support: every action it can generate', cc:INKS, star:0, sl:0, kv:0,   xm:0, trans:900, hold:2400};
    var KS = {pos:'score', col:NAVY,   leg:3, cap:'then steers toward higher reward while ensuring transferability',          cc:EM,   star:1, sl:0, kv:0,   xm:0, trans:1600, hold:3600};
    var KC1 = {pos:'base', col:OCHRE,  leg:2, cap:'Strong distributional constraint reduces to the base policy', cc:OCHD, star:0, sl:1, kv:0,   xm:0, trans:900,    hold:2000};
    var KC2 = {pos:'mid',  col:ORANGE, leg:2, cap:'Looser distributional constraint drifts out of support',          cc:'#714350', star:0, sl:1, kv:0.5, xm:0, trans:1400, hold:2000};
    var KC2b= {pos:'out',  col:REDV,   leg:2, cap:'Weak distributional constraint collapses to unconstrained RL',     cc:REDD, star:0, sl:1, kv:1,   xm:1, trans:1400, hold:2200};
    // unconstrained RL also starts from the base points (snap there, recolor / leg1),
    // then exploits — mirrors how the distributional branch starts at base.
    var KU  = {pos:'base', col:REDV,   leg:1, cap:'No constraint: optimize freely',           cc:REDD, star:0, sl:0, kv:0,   xm:0, trans:1,    hold:1400};
    var KC3 = {pos:'out',  col:REDV,   leg:1, cap:'Without constraints, the policy exploits the simulator',      cc:REDD, star:0, sl:0, kv:0,   xm:1, trans:1500, hold:2800};
    // SCORE re-grounds in the base support (snap, like the distributional branch) before steering,
    // so it moves FORWARD into reward instead of sliding back from the exploit cluster.
    var KSr = {pos:'base', col:NAVY,   leg:3, cap:'SCORE optimizes only over actions the real policy already produces',      cc:EM, star:0, sl:0, kv:0,   xm:0, trans:900,    hold:2600};
    var KF=[KB,KU,KC3,KC1,KC2,KC2b,KSr,KS];
    var SEG=[], total=0;
    for(var k=0;k<KF.length;k++){ SEG.push({start:total, prev:KF[(k-1+KF.length)%KF.length], cur:KF[k]}); total += KF[k].trans+KF[k].hold; }

    // legend click → which regime to show, and where to resume the auto-loop
    var PICK=[KB,KC3,KC2,KS], PICK_AUTO=[0,2,4,7];
    var manual=false, selIdx=-1, mTo=null, mT0=0, MDUR=1500;

    // ── defs ──
    var defs = E('defs',{});
    var rg = E('radialGradient',{id:'sc-reward', cx:'50%', cy:'50%', r:'50%'});
    rg.appendChild(E('stop',{offset:'0%',  'stop-color':'#b8842c', 'stop-opacity':'0.7'}));
    rg.appendChild(E('stop',{offset:'55%', 'stop-color':'#e0bd6a', 'stop-opacity':'0.3'}));
    rg.appendChild(E('stop',{offset:'100%','stop-color':'#e9c986', 'stop-opacity':'0'}));
    defs.appendChild(rg);
    var bgg = E('linearGradient',{id:'sc-blob', x1:'0', y1:'1', x2:'1', y2:'0'});
    bgg.appendChild(E('stop',{offset:'0%','stop-color':EML,'stop-opacity':'0.40'}));
    bgg.appendChild(E('stop',{offset:'100%','stop-color':'#cdd9ea','stop-opacity':'0.62'}));
    defs.appendChild(bgg);
    svg.appendChild(defs);

    // ── short explanation line (top-left), updates per phase ──
    var cap = E('text',{x:20, y:42, 'font-family':MONO, 'font-size':'12.5', 'font-weight':'600',
        'letter-spacing':'0.01em', opacity:'0'});
    svg.appendChild(cap);

    // ── legend buttons are an HTML overlay (#sconst-legend); wire them up ──
    var legBtns = [].slice.call(document.querySelectorAll('#sconst-legend button'));
    legBtns.forEach(function(b){ b.addEventListener('click', function(){ onPick(+b.getAttribute('data-i')); }); });

    // ── reward field ──
    svg.appendChild(E('circle',{cx:668, cy:100, r:410, fill:'url(#sc-reward)'}));
    var rlab = E('text',{x:738, y:34, 'text-anchor':'end', fill:'#9c7333',
        'font-family':MONO, 'font-size':'12', 'font-weight':'700', 'letter-spacing':'0.06em'});
    rlab.textContent='High sim reward  ↗'; svg.appendChild(rlab);

    // ── support blob ──
    var blobFill = E('path',{d:BLOB, fill:'url(#sc-blob)', stroke:'none'});
    var blobLine = E('path',{d:BLOB, fill:'none', stroke:EMM, 'stroke-width':'2',
        'stroke-dasharray':'1 8', 'stroke-linecap':'round', opacity:'0.7'});
    svg.appendChild(blobFill); svg.appendChild(blobLine);
    // label sits OUTSIDE the blob (just above it) so the region stays clean
    var blobTag = E('text',{x:330, y:101, 'text-anchor':'middle', fill:EMD, 'font-family':MONO, 'font-size':'13',
        'font-weight':'700'});
    var SERIF="Georgia, 'Times New Roman', serif";
    var supT=E('tspan',{}); supT.textContent='Support of ';
    var piT=E('tspan',{'font-family':SERIF, 'font-style':'italic', 'font-size':'16'}); piT.textContent='π';
    var piS=E('tspan',{'font-family':SERIF, 'font-style':'italic', 'font-size':'10', dy:'4'}); piS.textContent='base';
    var endT=E('tspan',{dy:'-4'}); endT.textContent=' ';
    blobTag.appendChild(supT); blobTag.appendChild(piT); blobTag.appendChild(piS); blobTag.appendChild(endT);
    svg.appendChild(blobTag);

    // ── the cloud (+ per-dot motion arrows) ──
    var dots = BASE.map(function(_,i){ var c=E('circle',{r:RAD[i], opacity:'0'}); svg.appendChild(c); return c; });
    var arrG = E('g',{fill:'none','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round'}); svg.appendChild(arrG);
    var arrows = BASE.map(function(){ var a=E('path',{opacity:'0'}); arrG.appendChild(a); return a; });
    var prevPos = BASE.map(function(p){ return [p[0],p[1]]; });

    // ── SCORE in-support reward mode (star) ──
    function starPath(R,r){ var d='',n=4; for(var i=0;i<n*2;i++){ var a=Math.PI/2+i*Math.PI/n, rad=(i%2?r:R);
        d+=(i?' L ':'M ')+(rad*Math.cos(a)).toFixed(1)+' '+(-rad*Math.sin(a)).toFixed(1); } return d+' Z'; }
    var goalGlow = E('circle',{cx:GOAL.x, cy:GOAL.y, r:0, fill:EM, opacity:'0'}); svg.appendChild(goalGlow);
    var goalG = E('g',{opacity:'0'}); svg.appendChild(goalG);
    goalG.appendChild(E('path',{d:starPath(12,4.6), fill:EM, stroke:'#fff', 'stroke-width':'1.5'}));

    // ── free-RL exploit marker (X) ──
    var xG = E('g',{opacity:'0'}); svg.appendChild(xG);
    xG.appendChild(E('circle',{cx:EXPL.x, cy:EXPL.y, r:12.5, fill:'#fff', stroke:rgb(REDV), 'stroke-width':'2.2'}));
    xG.appendChild(E('line',{x1:EXPL.x-5, y1:EXPL.y-5, x2:EXPL.x+5, y2:EXPL.y+5, stroke:rgb(REDV), 'stroke-width':'2.8', 'stroke-linecap':'round'}));
    xG.appendChild(E('line',{x1:EXPL.x+5, y1:EXPL.y-5, x2:EXPL.x-5, y2:EXPL.y+5, stroke:rgb(REDV), 'stroke-width':'2.8', 'stroke-linecap':'round'}));

    // ── λ slider (distributional-constraint hyperparameter) ──
    var AX0=438, AX1=712, AY=410;
    var slG = E('g',{opacity:'0'}); svg.appendChild(slG);
    var slTitle = E('text',{x:AX0, y:AY-16, fill:OCHD, 'font-family':MONO, 'font-size':'12', 'font-weight':'700', 'font-style':'italic'});
    slTitle.textContent='distributional loss coefficient'; slG.appendChild(slTitle);
    slG.appendChild(E('line',{x1:AX0, y1:AY, x2:AX1, y2:AY, stroke:'#cbc4b1', 'stroke-width':'4', 'stroke-linecap':'round'}));
    var slFill = E('line',{x1:AX0, y1:AY, x2:AX0, y2:AY, stroke:OCHD, 'stroke-width':'4', 'stroke-linecap':'round'}); slG.appendChild(slFill);
    var lEnd=E('text',{x:AX0, y:AY+18, fill:MUT,'font-family':MONO,'font-size':'10.5'}); lEnd.textContent='strong'; slG.appendChild(lEnd);
    var rEnd=E('text',{x:AX1, y:AY+18, 'text-anchor':'end', fill:MUT,'font-family':MONO,'font-size':'10.5'}); rEnd.textContent='weak'; slG.appendChild(rEnd);
    var knob = E('circle',{cx:AX0, cy:AY, r:7, fill:'#fff', stroke:OCHD, 'stroke-width':'2.5'}); slG.appendChild(knob);

    function fade(el,o){ el.setAttribute('opacity', o.toFixed(3)); }

    // resolve the animation state at loop-time lt (or a fixed keyframe object)
    function stateAt(lt){
        var s=SEG[0]; for(var i=0;i<SEG.length;i++){ if(lt>=SEG[i].start) s=SEG[i]; }
        var loc=lt-s.start, raw = loc<s.cur.trans ? clamp(loc/s.cur.trans) : 1, e=ease(raw);
        var a=s.prev, b=s.cur, pa=POS[a.pos], pb=POS[b.pos], pos=[];
        // a "reset" is any move from an advanced regime back into the base support.
        // sliding the cloud backward draws reversed arrows, and a hard snap looks like
        // a teleport — so fade it out, swap to base while invisible, then fade back in.
        var reset = (b.pos==='base' && a.pos!=='base'), rfade=1;
        if(reset){
            var src = raw<0.5 ? pa : pb;
            for(var j=0;j<N;j++) pos.push([src[j][0], src[j][1]]);
            rfade = Math.abs(2*raw-1);
        } else {
            for(var j=0;j<N;j++) pos.push([lerp(pa[j][0],pb[j][0],e), lerp(pa[j][1],pb[j][1],e)]);
        }
        // on a reset the slider is fading out — freeze the knob (don't slide it backward)
        return { pos:pos, col:mixA(a.col,b.col,e), star:lerp(a.star,b.star,e), sl:lerp(a.sl,b.sl,e),
                 kv: reset ? a.kv : lerp(a.kv,b.kv,e), xm:lerp(a.xm,b.xm,e), cap:b.cap, cc:b.cc, leg:b.leg, rfade:rfade,
                 capOp: loc<b.trans ? easeOut(clamp((loc-b.trans*0.25)/(b.trans*0.55))) : 1 };
    }
    function still(kf){ return { pos:POS[kf.pos], col:kf.col, star:kf.star, sl:kf.sl, kv:kf.kv, xm:kf.xm, cap:kf.cap, cc:kf.cc, leg:kf.leg, rfade:1, capOp:1 }; }
    function blendStates(a,b,e){
        var p=[]; for(var i=0;i<N;i++) p.push([lerp(a.pos[i][0],b.pos[i][0],e), lerp(a.pos[i][1],b.pos[i][1],e)]);
        return {pos:p, col:mixA(a.col,b.col,e), star:lerp(a.star,b.star,e), sl:lerp(a.sl,b.sl,e),
                kv:lerp(a.kv,b.kv,e), xm:lerp(a.xm,b.xm,e), leg:b.leg, cap:b.cap, cc:b.cc, capOp:easeOut(e)};
    }
    // distributional λ sweep: s in [0,1] (strong→weak), as a resolved state
    function bcState(s){
        var p=[]; for(var i=0;i<N;i++) p.push([lerp(BASE[i][0],EST[i][0],s), lerp(BASE[i][1],EST[i][1],s)]);
        var col = s<0.5 ? mixA(OCHRE,ORANGE,s/0.5) : mixA(ORANGE,REDV,(s-0.5)/0.5);
        var z = s<0.2  ? ['Strong distributional constraint: barely improves', OCHD]
              : s<0.62 ? ['Looser distributional constraint: drifts out of support', '#714350']
              :          ['Weak distributional constraint: collapses to unconstrained RL', REDD];
        return {pos:p, col:col, star:0, sl:1, kv:s, xm:clamp((s-0.82)/0.18), leg:2, cap:z[0], cc:z[1], capOp:1};
    }
    // sweep λ with a long hold at each setting (readable), then snap back to strong
    function bcWave(t){ var lt=t%8900;
        if(lt<1900) return 0;                              // hold strong
        lt-=1900; if(lt<1500) return 0.5*ease(lt/1500);    // strong → looser
        lt-=1500; if(lt<1900) return 0.5;                  // hold looser
        lt-=1900; if(lt<1500) return 0.5+0.5*ease(lt/1500);// looser → weak
        return 1;                                          // hold weak, then snap back
    }
    function onPick(i){
        if(manual && selIdx===i){            // click the active one again → resume auto-loop
            manual=false; selIdx=-1;
            var ai=PICK_AUTO[i];
            t0 = performance.now() - INTRO - (SEG[ai].start + KF[ai].trans);
            introDone=true; play(); return;
        }
        manual=true; selIdx=i;
        mTo = still(PICK[i]); mT0 = performance.now();
        play();
    }

    function draw(blobIn, cloudIn, st, twk){
        var bi=easeOut(blobIn);
        fade(blobLine, 0.7*bi); fade(blobFill, bi); fade(blobTag, bi);

        cap.textContent = st.cap; cap.setAttribute('fill', st.cc); fade(cap, st.capOp*bi);
        for(var li=0; li<legBtns.length; li++) legBtns[li].classList.toggle('is-active', li===st.leg);

        var col=rgb(st.col);
        for(var i=0;i<N;i++){
            var ai=easeOut(clamp((cloudIn - i*0.04)/0.18));
            var dx=(i%2?1:-1)*0.6*Math.sin(twk*1.5+PH[i]), dy=0.6*Math.cos(twk*1.3+PH[i]);
            var cx=st.pos[i][0]+dx, cy=st.pos[i][1]+dy;
            dots[i].setAttribute('cx',cx.toFixed(1));
            dots[i].setAttribute('cy',cy.toFixed(1));
            dots[i].setAttribute('r',(RAD[i]*ai).toFixed(2));
            dots[i].setAttribute('fill', col);
            var rf = (st.rfade==null?1:st.rfade);
            fade(dots[i], ai*0.94*rf);
            // motion arrow: comes in while the dot moves, fades when it settles
            var vx=st.pos[i][0]-prevPos[i][0], vy=st.pos[i][1]-prevPos[i][1];
            var sp=Math.sqrt(vx*vx+vy*vy), ar=arrows[i];
            if(sp>0.3 && sp<26 && ai>0.4){   // sp<26 skips snaps/teleports (no reset arrows)
                var ux=vx/sp, uy=vy/sp, L=Math.min(15, 7+sp*2);
                var bx=cx+ux*(RAD[i]+1.5), by=cy+uy*(RAD[i]+1.5), tx=bx+ux*L, ty=by+uy*L, px=-uy, py=ux;
                ar.setAttribute('d', 'M '+bx.toFixed(1)+' '+by.toFixed(1)+' L '+tx.toFixed(1)+' '+ty.toFixed(1)
                    +' M '+(tx-ux*4+px*3).toFixed(1)+' '+(ty-uy*4+py*3).toFixed(1)+' L '+tx.toFixed(1)+' '+ty.toFixed(1)
                    +' L '+(tx-ux*4-px*3).toFixed(1)+' '+(ty-uy*4-py*3).toFixed(1));
                ar.setAttribute('stroke', col); fade(ar, Math.min(0.8, sp*0.6)*ai);
            } else fade(ar, 0);
            prevPos[i][0]=st.pos[i][0]; prevPos[i][1]=st.pos[i][1];
        }

        var sp=st.star, pulse=1+0.10*Math.sin(twk*3.0)*clamp((sp-0.7)/0.3);
        fade(goalG, sp);
        goalG.setAttribute('transform','translate('+GOAL.x+','+GOAL.y+') scale('+(easeOut(sp)*pulse).toFixed(3)+')');
        goalGlow.setAttribute('r',(easeOut(sp)*22).toFixed(1)); fade(goalGlow, 0.14*sp);

        fade(xG, st.xm);
        var xpop = 1+0.07*Math.sin(twk*2.8)*clamp((st.xm-0.7)/0.3);
        xG.setAttribute('transform','translate('+EXPL.x+','+EXPL.y+') scale('+(easeOut(st.xm)*xpop).toFixed(3)+') translate('+(-EXPL.x)+','+(-EXPL.y)+')');

        fade(slG, st.sl);
        var kx=lerp(AX0,AX1,st.kv), kc = st.kv<0.5 ? rgb(mixA(OCHRE,ORANGE,st.kv/0.5)) : rgb(mixA(ORANGE,REDV,(st.kv-0.5)/0.5));
        knob.setAttribute('cx',kx.toFixed(1)); knob.setAttribute('stroke',kc);
        slFill.setAttribute('x2',kx.toFixed(1)); slFill.setAttribute('stroke',kc);
    }

    // reduced motion: paint the SCORE state (the hero)
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        draw(1,1, still(KS), 0); return;
    }

    // ── clock ──
    var INTRO=1300, t0=null, playing=false, raf=null, introDone=false;
    function frame(ts){
        if(!playing) return;
        if(t0==null) t0=ts;
        var t=ts-t0, twk=t/1000, blobIn, cloudIn, st;
        if(manual){
            blobIn=1; cloudIn=1;
            var md = ts-mT0;
            if(selIdx===2){                          // distributional: snap to base, then sweep λ
                st = bcState(bcWave(md));
            } else if(selIdx===0){                    // base policy: snap to base
                st = still(KB);
            } else {                                  // SCORE / unconstrained RL: snap to base, then play forward
                st = blendStates(still(KB), mTo, ease(clamp(md/MDUR)));
            }
        } else {
            if(t<INTRO){ blobIn=t/INTRO; cloudIn=clamp((t-300)/(INTRO-300)); }
            else { blobIn=1; cloudIn=1; introDone=true; }
            st = introDone ? stateAt((t-INTRO)%total)
                           : {pos:POS.base, col:SLATE, star:0, sl:0, kv:0, xm:0, cap:KB.cap, cc:INKS, leg:0, capOp:1};
        }
        draw(blobIn, cloudIn, st, twk);
        raf=requestAnimationFrame(frame);
    }
    function play(){ if(playing) return; playing=true; raf=requestAnimationFrame(frame); }
    function pause(){ playing=false; if(raf) cancelAnimationFrame(raf); raf=null; }

    draw(0,0, {pos:POS.base, col:SLATE, star:0, sl:0, kv:0, xm:0, cap:KB.cap, cc:INKS, leg:0, capOp:0}, 0);
    if('IntersectionObserver' in window){
        new IntersectionObserver(function(en){ en.forEach(function(x){ x.isIntersecting?play():pause(); }); }, {threshold:0.15}).observe(svg);
    } else { play(); }
})();
