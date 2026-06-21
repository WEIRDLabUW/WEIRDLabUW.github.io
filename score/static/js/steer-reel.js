/* ════════════════════════════════════════════════════════════════════
   THE METHOD, IN ONE INTERACTIVE ANIMATION.   (video-driven)

   Pick a task. Watch one policy travel through three acts on a single
   timeline that is driven by the ACTUAL clips (so they play fully and the
   scrubber/▶ stay in sync):

     ACT 1 · REAL demos   → the real prior fixes the support.
     ACT 2 · SIM training → step through the timelapse while the mechanism
                            converges.
     ACT 3 · REAL deploy  → runs on the real robot.

   The mechanism (right) shows the real architecture:
       π_steer(z|o)  →  π_base 🔒 (frozen lens)  →  action distribution
                                  ▲ privileged critic (sim only)
   π_steer reshapes the NOISE z; the frozen base turns z into actions; the
   action distribution converges as a consequence; the critic guides π_steer
   in sim and detaches at deployment.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
    var root = document.getElementById('method-reel');
    if (!root) return;

    var RWB = 'static/videos/real_world_rollouts/';
    var STB = 'static/videos/sim_timelapse/';
    var PSB = 'static/videos/posters/';
    var RATE_REAL = 1.4, RATE_SIM = 1.9;      // brisk but readable: faster than original, not a blur
    // iOS Safari caps how many videos it will decode at once and paints the
    // rest (and any never-played video) black. On touch we lean on poster
    // frames and drop the decorative backdrop so the main clip always plays.
    var COARSE = !!(window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);

    // ── per-task config ──
    //  n=#sim steps; depEp=which deploy episode; nBase/nScore=#real episodes;
    //  srBase/srScore=success %, diff=difficulty; baseNote/scoreNote=one-liners;
    //  ab/as = action-dist mode weights [off-target, GOOD, slow]
    var TASKS = [
        { label:'Pour Ball', real:'ball_pour', sim:'cup_pour', n:5, failEp:1,
          nBase:4, nScore:4, srBase:11, srScore:89, diff:'Hard',
          baseNote:'Misaligns the thumb and knocks the cup over before grasping.',
          scoreNote:'Aligns the cups and pours cleanly.',
          ab:[0.95,0.60,0.85], as:[0.20,1.00,0.18] },
        { label:'Screw Lightbulb', real:'lightbulb_screw', sim:'lightbulb_screw', n:4, baseEp:2, depEp:2,
          nBase:4, nScore:4, srBase:50, srScore:100, diff:'Medium',
          baseNote:'Lifts away prematurely; slow, imprecise screwing.',
          scoreNote:'Keeps twisting until the bulb is fully seated.',
          ab:[0.70,0.65,1.00], as:[0.15,1.00,0.25] },
        { label:'Pick Credit Card', real:'credit_card_pick', sim:'credit_card', n:7, failEp:2,
          nBase:4, nScore:4, srBase:10, srScore:80, diff:'Medium',
          baseNote:'Grasps inaccurately, slides too fast, poor finger coordination.',
          scoreNote:'Precise, coordinated grasp of the thin card.',
          ab:[1.00,0.60,0.80], as:[0.22,1.00,0.16] },
        { label:'Place in Dishrack', real:'dishrack_place', sim:'dishrack_place', n:9, failEp:1, baseEp:1, depEp:3,
          nBase:4, nScore:4, srBase:50, srScore:90, diff:'Medium',
          baseNote:'Fails to grasp, misaligns with the first slot.',
          scoreNote:'Aligns precisely and places the plate in one clean motion.',
          ab:[1.00,0.70,0.60], as:[0.20,1.00,0.15] },
        { label:'Grasp Bottle', real:'bottle_grasp', sim:'bottle_grasp', n:6,
          nBase:1, nScore:1, srBase:92, srScore:100, diff:'Easy',
          baseNote:'Suboptimal attempts and retries; fails under perturbation.',
          scoreNote:'Robust to perturbations, reaches 100%.',
          ab:[0.80,0.70,1.00], as:[0.18,1.00,0.20] },
        { label:'Pinch Cube', real:'cube_pinch', sim:'cube_grasp', n:4,
          nBase:1, nScore:1, srBase:30, srScore:100, diff:'Easy',
          baseNote:'Suboptimal attempts followed by retries.',
          scoreNote:'Clean pinch grasp, reaches 100%.',
          ab:[0.85,0.60,0.95], as:[0.22,1.00,0.20] },
        { label:'Grasp Cup', real:'cup_grasp', sim:'cup_grasp', n:8,
          nBase:4, nScore:4, srBase:47, srScore:100, diff:'Easy',
          baseNote:'Misaligns the thumb and knocks the cup over.',
          scoreNote:'High-precision grasp, reaches 100%.',
          ab:[0.90,0.65,0.80], as:[0.18,1.00,0.16] },
        { label:'Push Soccer Ball', real:'soccer_push', sim:'soccer_push', n:9, failEp:3,
          nBase:4, nScore:4, srBase:13, srScore:60, diff:'Hard',
          baseNote:'Misses the ball or strikes it inaccurately.',
          scoreNote:'Strikes accurately, recovers with retries.',
          ab:[1.00,0.55,0.70], as:[0.25,1.00,0.12] },
    ];
    var DIFF_CLS = { Easy:'easy', Medium:'med', Hard:'hard' };

    // per-clip outcomes shown as ✓/✗ tiles, each [episode, win(1)/fail(0)].
    // these are the THREE extra clips per side (the hero journey shows a 4th).
    var CLIPS = {
        credit_card_pick: { base:[[1,0],[2,0],[3,0]], score:[[1,1],[2,0],[3,1]] },
        lightbulb_screw:  { base:[[0,1],[1,1],[3,0]], score:[[0,1],[1,1],[3,1]] },  // hero base/score = ep2
        ball_pour:        { base:[[1,0],[2,0],[3,0]], score:[[1,0],[2,1],[3,1]] },
        soccer_push:      { base:[[1,0],[2,1],[3,1]], score:[[1,1],[2,1],[3,0]] },
        dishrack_place:   { base:[[0,1],[2,0],[3,0]], score:[[0,1],[1,0],[2,1]] },
        cup_grasp:        { base:[[1,0],[2,0],[3,0]], score:[[1,1],[2,1],[3,1]] }
    };

    // per-task success rate vs baselines (from the paper's per-task table)
    var BL = {
        credit_card_pick: { score:80,   dsrl:80,   resrl:80,   base:10,   rialto:10,   fpo:0    },
        lightbulb_screw:  { score:100,  dsrl:100,  resrl:50,   base:50,   rialto:0,    fpo:37.5 },
        ball_pour:        { score:88.9, dsrl:66.7, resrl:0,    base:11.1, rialto:33.3, fpo:0    },
        soccer_push:      { score:60,   dsrl:60,   resrl:40,   base:13.3, rialto:0,    fpo:20   },
        dishrack_place:   { score:90,   dsrl:65,   resrl:45,   base:50,   rialto:0,    fpo:0    },
        bottle_grasp:     { score:100,  dsrl:100,  resrl:87.5, base:91.7, rialto:58.3, fpo:50   },
        cup_grasp:        { score:100,  dsrl:86.7, resrl:93.3, base:46.7, rialto:53.3, fpo:0    },
        cube_pinch:       { score:100,  dsrl:75,   resrl:80,   base:30,   rialto:60,   fpo:35   }
    };
    var BL_ROWS = [['score','SCORE'],['dsrl','SCORE-DSRL'],['resrl','Res-RL'],['base','Base'],['rialto','RialTo'],['fpo','FPO']];

    // per-task qualitative captions (matches the per-task rollouts analysis)
    var NOTES = {
        ball_pour:        { base:"The base policy frequently misaligns the thumb with the pink cup and knocks it over before grasping. Even when it lifts the cup, poor alignment between the pink and larger cup often makes the ball miss when pouring.",
                            score:"SCORE's main failure is aligning the pink cup with the blue cup; in the marked clip, pouring too quickly drops a ball before it settles." },
        soccer_push:      { base:"The base policy frequently misses the ball or strikes it inaccurately.",
                            score:"SCORE strikes accurately and recovers with retries. Its failures stem from the ball's dynamics: a push can impart spin that sends it out of the workspace (marked clip)." },
        lightbulb_screw:  { base:"Operating on point clouds, the base policy has no clear completion signal. It imitates the upward motion that ends the demos and lifts away prematurely; grasping is imprecise and slow, often failing within the time limit.",
                            score:"Simulation rewards continued twisting, so the premature upward actions are driven to zero and SCORE keeps screwing until the bulb is fully seated: 100%." },
        credit_card_pick: { base:"The base policy grasps inaccurately, moving and sliding too fast with poor thumb–finger coordination, and usually fails.",
                            score:"SCORE fails mainly from small accumulated errors (marked clip); the task demands high precision while handling the dynamics of a thin card." },
        dishrack_place:   { base:"The base policy fails mostly at grasping, and when it does grasp the plate it struggles to align with the first slot of the rack.",
                            score:"SCORE aligns more precisely and places faster, with retry behavior. Remaining failures (marked clip) come from the underactuated plate and the hard-to-perceive thin rack." },
        cube_pinch:       { base:"The base policy shows suboptimal and failed attempts followed by retries; it weights its actions poorly for success.",
                            score:"SCORE reaches 100%; shown here with perturbations to illustrate the robustness of steering in simulation." },
        bottle_grasp:     { base:"The base policy shows suboptimal attempts and retries. It succeeds most of the time but cannot handle perturbations.",
                            score:"SCORE is robust to perturbations and reaches 100% success." },
        cup_grasp:        { base:"As in Pour Ball, the main failure is misaligning the thumb with the cup, which knocks it over.",
                            score:"SCORE reaches 100%, enabling high-precision grasping of the cup." }
    };
    function noteFor(realName, side){ return (NOTES[realName] || {})[side] || ''; }
    function fmtSR(v){ return (v % 1 === 0 ? v : v.toFixed(1)) + '%'; }
    function buildBars(host, realName){
        var d = BL[realName]; if (!d) return;
        host.innerHTML = '';
        var fills = [];
        BL_ROWS.forEach(function(row){
            var k = row[0], val = d[k];
            var r = document.createElement('div'); r.className = 'scb-row scb-' + k;
            r.innerHTML = '<span class="scb-lbl">' + row[1] + '</span>'
                + '<span class="scb-track"><span class="scb-fill"></span></span>'
                + '<span class="scb-val">' + fmtSR(val) + '</span>';
            host.appendChild(r);
            fills.push([r.querySelector('.scb-fill'), val]);
        });
        // animate the fills from 0 → value after layout commits
        requestAnimationFrame(function(){ requestAnimationFrame(function(){
            fills.forEach(function(f){ f[0].style.width = f[1] + '%'; });
        }); });
    }

    function stepLabel(i){ return i === 0 ? '0' : (i*40) + 'M'; }

    function ep(n){ return 'ep_' + ('00' + n).slice(-3) + '.mp4'; }

    // build the ordered clip sequence for a task.
    // baseEp/depEp pick which real rollout episode to show (default 0).
    function buildSeq(task){
        var seq = [{ kind:'demo', src: RWB + task.real + '/base/' + ep(task.baseEp||0), label:'real demo' }];
        for (var i=0;i<task.n;i++) seq.push({ kind:'sim', step:i, src: STB + task.sim + '/' + i + '.mp4', label: stepLabel(i) });
        seq.push({ kind:'deploy', src: RWB + task.real + '/score/' + ep(task.depEp||0), label:'real deploy' });
        return seq;
    }

    // ── distribution math (shared by z-bell and action curve) ─────────
    var MU = [0.225, 0.50, 0.775];
    var COL = ['var(--baseline-terracotta)', 'var(--em)', 'var(--baseline-ochre)'];
    var BND = [0.02, 0.3625, 0.6375, 0.98];
    var SIG_BASE = [0.072, 0.086, 0.072], SIG_STEER = [0.058, 0.052, 0.052];
    var PH = [0.0, 2.1, 4.2], SP = [1.7, 2.4, 1.3];

    function lerp(a,b,t){ return a+(b-a)*t; }
    function ease(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

    function actionAmps(task, conv, c, jit){
        var a=[], s=[], tgt=[], sumT=0, sumA=0, i;
        for (i=0;i<3;i++){ tgt.push(lerp(task.ab[i], task.as[i], conv)); sumT+=tgt[i]; s.push(lerp(SIG_BASE[i], SIG_STEER[i], conv)); }
        for (i=0;i<3;i++){
            var w = jit * (0.62*Math.sin(c*SP[i]+PH[i]) + 0.38*Math.sin(c*SP[i]*0.5 + PH[i]*1.7));
            a.push(Math.max(0.05, tgt[i]+w)); sumA+=a[i];
        }
        var k = sumT/sumA;
        for (i=0;i<3;i++) a[i] = Math.min(a[i]*k, 1.0);
        return { a:a, s:s };
    }

    var NS='http://www.w3.org/2000/svg';
    function E(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }

    // ── action curve SVG ──────────────────────────────────────────────
    var AW=300, AH=160, aPadL=12, aPadR=12, aTop=18, aBase=132; var aPlot=aBase-aTop, AN=180;
    var aSvg = E('svg',{ viewBox:'0 0 '+AW+' '+AH, class:'mech-svg', preserveAspectRatio:'none' });
    function aX(x){ return aPadL + x*(AW-aPadL-aPadR); }
    function aY(v){ return aBase - clamp(v,0,1)*aPlot; }
    var aSup = E('rect',{ x:aX(BND[0]), y:aTop-4, width:aX(BND[3])-aX(BND[0]), height:(aBase-aTop)+4, rx:8, class:'mech-supband' });
    aSvg.appendChild(aSup);
    var aFills=[]; for(var r=0;r<3;r++){ var p=E('path',{class:'mech-mode'}); p.style.fill=COL[r]; aFills.push(p); aSvg.appendChild(p); }
    var aOutline = E('path',{class:'mech-outline'}); aSvg.appendChild(aOutline);
    aSvg.appendChild(E('line',{ x1:aX(0), y1:aBase, x2:aX(1), y2:aBase, class:'mech-axis' }));
    document.getElementById('mech-a').replaceWith(aSvg); aSvg.id='mech-a';
    function aCurve(x,st){ var v=0; for(var i=0;i<3;i++){ var d=x-MU[i]; v+=st.a[i]*Math.exp(-(d*d)/(2*st.s[i]*st.s[i])); } return v/1.45; }
    function aTopPath(st){ var d=''; for(var i=0;i<=AN;i++){ var x=i/AN; d+=(i?' L ':'M ')+aX(x).toFixed(1)+' '+aY(aCurve(x,st)).toFixed(1);} return d; }
    function aRegion(st,xa,xb){ var Xa=aX(xa),Xb=aX(xb),d='M '+Xa.toFixed(1)+' '+aBase; for(var i=0;i<=AN;i++){ var x=i/AN,X=aX(x); if(X>=Xa-0.1&&X<=Xb+0.1) d+=' L '+X.toFixed(1)+' '+aY(aCurve(x,st)).toFixed(1);} return d+' L '+Xb.toFixed(1)+' '+aBase+' Z'; }

    // ── noise-z SVG (π_steer) ─────────────────────────────────────────
    var ZW=300, ZH=92, zPadL=12, zPadR=12, zTop=12, zBase=78; var zPlot=zBase-zTop, ZN=140;
    var zSvg = E('svg',{ viewBox:'0 0 '+ZW+' '+ZH, class:'mech-svg-z', preserveAspectRatio:'none' });
    function zX(x){ return zPadL + x*(ZW-zPadL-zPadR); }
    function zY(v){ return zBase - clamp(v,0,1)*zPlot; }
    var zFill = E('path',{ class:'mech-zfill' }); zSvg.appendChild(zFill);
    var zLine = E('path',{ class:'mech-zline' }); zSvg.appendChild(zLine);
    zSvg.appendChild(E('line',{ x1:zX(0), y1:zBase, x2:zX(1), y2:zBase, class:'mech-axis' }));
    document.getElementById('mech-z').replaceWith(zSvg); zSvg.id='mech-z';
    function zBell(mu,sg){ var pts=[]; for(var i=0;i<=ZN;i++){ var x=i/ZN; pts.push([zX(x), zY(Math.exp(-((x-mu)*(x-mu))/(2*sg*sg)))]); } return pts; }
    function zPathLine(pts){ var d=''; for(var i=0;i<pts.length;i++) d+=(i?' L ':'M ')+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1); return d; }
    function zPathFill(pts){ return 'M '+pts[0][0].toFixed(1)+' '+zBase+' '+zPathLine(pts).slice(2)+' L '+pts[pts.length-1][0].toFixed(1)+' '+zBase+' Z'; }

    // ── element handles ───────────────────────────────────────────────
    var video   = document.getElementById('reel-video');
    var videoBg = document.getElementById('reel-video-bg');
    var stage   = document.getElementById('reel-stage');
    var domTxt  = document.getElementById('reel-domain-txt');
    var domChip = document.getElementById('reel-domain');
    var domPhase= document.getElementById('reel-domain-phase');
    var rewFill = document.getElementById('reel-reward-fill');
    var actLbl  = document.getElementById('reel-actlabel');
    var statusEl= document.getElementById('reel-status');
    var actTag  = document.getElementById('mech-act-tag');
    var tabsEl  = document.getElementById('reel-tabs');
    var ticksEl = document.getElementById('reel-ticks');
    var phaseEl = document.getElementById('reel-phaselabels');
    var fillBar = document.getElementById('reel-fill');
    var thumb   = document.getElementById('reel-thumb');
    var track   = document.getElementById('reel-track');
    var playBtn = document.getElementById('reel-play');
    // showcase handles
    var scTask = document.getElementById('sc-task');
    var scDiff = document.getElementById('sc-diff');
    var scBars = document.getElementById('sc-bars');
    var scChorus = document.getElementById('sc-chorus');
    var scNote = document.getElementById('sc-note');
    var scRowBase  = document.getElementById('sc-row-base');
    var scRowScore = document.getElementById('sc-row-score');
    var scTilesBase  = document.getElementById('sc-tiles-base');
    var scTilesScore = document.getElementById('sc-tiles-score');
    var msBars = document.getElementById('ms-bars');
    var msTilesBase  = document.getElementById('ms-tiles-base');
    var msTilesScore = document.getElementById('ms-tiles-score');

    // ── freeze-frame bridge ───────────────────────────────────────────
    // Swapping video.src blanks the element to the stage's black backdrop
    // until the next clip decodes a frame — a flash that's most jarring on
    // the seamless sim→sim training steps. We hold the outgoing frame on a
    // canvas and crossfade it out only once the new clip actually has a frame.
    var freeze = document.createElement('canvas');
    freeze.id = 'reel-freeze';
    freeze.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
        'object-fit:contain;z-index:2;pointer-events:none;opacity:0;';
    stage.insertBefore(freeze, domChip);
    var freezeCtx = freeze.getContext('2d');
    function showFreeze(){
        var vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) return false;
        freeze.width = vw; freeze.height = vh;
        try { freezeCtx.drawImage(video, 0, 0, vw, vh); } catch(_){ return false; }
        freeze.style.transition = 'none';
        freeze.style.opacity = '1';
        void freeze.offsetWidth;            // commit the held frame before fading
        return true;
    }
    function hideFreeze(){
        freeze.style.transition = 'opacity 0.32s ease';
        freeze.style.opacity = '0';
    }

    // ── state ─────────────────────────────────────────────────────────
    var taskIdx = 0;            // start on credit card
    var seq = [], idx = 0, playing = false, raf = null, clock = 0, lastTs = 0;
    var wasConverged = false;   // tracks credit-card convergence for the bar reveal

    function task(){ return TASKS[taskIdx]; }
    function len(){ return seq.length; }
    function N(){ return task().n; }

    // global position 0..1 across the whole sequence (idx + within-clip frac)
    function frac(){ var d = video.duration; return (d && isFinite(d)) ? clamp(video.currentTime/d,0,1) : 0; }
    function gpos(){ return (idx + frac()) / len(); }

    function actOf(i){ return i===0 ? 1 : (i<=N() ? 2 : 3); }
    function convAt(i, f){
        if (i===0) return 0;                       // real demo
        if (i<=N()) return clamp((i-1+f)/N(), 0, 1); // sim steps
        return 1;                                   // deploy
    }

    // ── task picker: a wall of SCORE thumbnails (overview + selector) ──
    // thumbnails sit on their first frame and only play on hover, so the page
    // stays calm — the hero below is the single moving focal point.
    TASKS.forEach(function(t, i){
        var cell = document.createElement('button');
        cell.className = 'reel-pick' + (i===taskIdx?' active':'');
        cell.dataset.i = i;
        // the always-visible thumbnail is a plain <img> — zero video decoders,
        // so iOS never runs out and paints the picker (or the main stage) black.
        var img = document.createElement('img');
        img.className = 'reel-pick-img'; img.src = PSB + t.real + '.jpg';
        img.alt = t.label; img.loading = 'lazy'; img.decoding = 'async';
        cell.appendChild(img);
        // only hover-capable devices get a clip layered on top (plays on hover)
        if (!COARSE){
            var v = document.createElement('video');
            v.className = 'reel-pick-vid';
            v.src = RWB + t.real + '/score/' + ep(t.depEp||0);
            v.muted=true; v.loop=true; v.playsInline=true;
            v.setAttribute('preload','none'); v.setAttribute('data-no-defer','');
            v.addEventListener('loadeddata', function(){ this.playbackRate = 1.4; });
            cell.appendChild(v);
            cell.addEventListener('mouseenter', function(){ if(!cell.classList.contains('active')) v.play && v.play().catch(function(){}); });
            cell.addEventListener('mouseleave', function(){ try{ v.pause(); v.currentTime = 0; }catch(_){} });
        }
        var lbl = document.createElement('span'); lbl.className='reel-pick-lbl'; lbl.textContent = t.label;
        cell.appendChild(lbl);
        cell.addEventListener('click', function(){ selectTask(i); });
        tabsEl.appendChild(cell);
    });
    function syncPicks(i){
        Array.prototype.forEach.call(tabsEl.children, function(b,bi){
            var on = (bi===i); b.classList.toggle('active', on);
            var vv = b.querySelector('video'); if (vv){ try{ vv.pause(); vv.currentTime = 0; }catch(_){} }
        });
    }
    syncPicks(taskIdx);

    // ── timeline ticks/labels for the current task ────────────────────
    function buildTicks(){
        ticksEl.innerHTML=''; phaseEl.innerHTML='';
        var L = len();
        for (var i=1;i<L;i++){
            var pos = (i/L)*100;
            var tk = document.createElement('div'); tk.className='reel-tick'; tk.style.left=pos+'%'; ticksEl.appendChild(tk);
        }
        // bold end-cap labels: base policy (real) → SCORE (real)
        addCap('Base', (0.5/L)*100, 'base');
        addCap('SCORE', ((L-0.5)/L)*100, 'score');
        // sim training-step numbers
        for (var s=0;s<N();s++){
            var p = ((1+s+0.5)/L)*100;
            var lb = document.createElement('span'); lb.className='reel-steplab'; lb.style.left=p+'%'; lb.textContent=stepLabel(s);
            phaseEl.appendChild(lb);
        }
        // single axis label so the numbers read clearly as training steps
        var ax = document.createElement('span'); ax.className='reel-axislabel';
        ax.style.left = ((1 + N()/2)/L)*100 + '%'; ax.textContent='training steps in simulation';
        phaseEl.appendChild(ax);
    }
    function addCap(txt, posPct, cls){
        var d=document.createElement('span'); d.className='reel-cap '+cls; d.style.left=posPct+'%'; d.textContent=txt; phaseEl.appendChild(d);
    }

    // ── showcase (per-task chorus of episodes with ✓/✗ outcomes) ──────
    var TILE_RATE = 1.6;
    // render an outcome row from CLIPS[real][side]; tiles autoplay (phase-gated by render)
    function buildTiles(host, real, side){
        host.innerHTML = '';
        var list = (CLIPS[real] || {})[side] || [];
        list.forEach(function(pair){
            var e = pair[0], win = pair[1];
            var src = RWB + real + '/' + side + '/' + ep(e);
            var cell = document.createElement('div'); cell.className = 'sc-tile ' + (win ? 'win' : 'fail');
            var v = document.createElement('video');
            v.src = src; v.muted=true; v.loop=true; v.playsInline=true; v.setAttribute('preload','auto'); v.setAttribute('data-no-defer','');
            v.addEventListener('loadeddata', function(){ this.playbackRate = TILE_RATE; });
            cell.appendChild(v);
            var badge = document.createElement('span'); badge.className = 'sc-out ' + (win ? 'win' : 'fail');
            badge.textContent = win ? '✓' : '✗'; cell.appendChild(badge);
            cell.addEventListener('click', (function(s){ return function(){ openLightboxVideo(s); }; })(src));
            host.appendChild(cell);
        });
    }
    // play one row, pause the other (base plays on base phase, score on score phase)
    function setRowPlaying(host, on){
        Array.prototype.forEach.call(host.querySelectorAll('video'), function(v){
            if (on) v.play && v.play().catch(function(){}); else { try{ v.pause(); }catch(_){} }
        });
    }
    function buildShowcase(){
        var t = task();
        scTask.textContent = t.label;
        scDiff.textContent = t.diff;
        scDiff.className = 'sc-diff ' + (DIFF_CLS[t.diff] || 'easy');
        buildBars(scBars, t.real);
        var hasChorus = !!CLIPS[t.real];
        scChorus.style.display = hasChorus ? '' : 'none';
        if (hasChorus){
            buildTiles(scTilesBase,  t.real, 'base');
            buildTiles(scTilesScore, t.real, 'score');
        }
        scNote.textContent = noteFor(t.real, 'base');
    }
    // credit-card end reveal: build its base/score outcome tiles once
    var ccBuilt = false;
    function buildCcReveal(){
        if (ccBuilt) return; ccBuilt = true;
        buildTiles(msTilesBase,  'credit_card_pick', 'base');
        buildTiles(msTilesScore, 'credit_card_pick', 'score');
    }
    function openLightboxVideo(src){
        var lb = document.getElementById('lb'), img = document.getElementById('lb-img'), vid = document.getElementById('lb-vid');
        if (!lb || !vid) return;
        if (img){ img.style.display='none'; img.src=''; }
        vid.style.display='block'; vid.src = src;
        vid.controls = true; vid.loop = true;   // scrubber so you can jump around
        vid.play && vid.play().catch(function(){});
        lb.classList.add('open');
    }

    // ── clip loading / advance ────────────────────────────────────────
    // seekFrac (optional): jump to this fraction of the clip once metadata loads
    function loadClip(i, autoplay, seekFrac, smooth){
        // capture the outgoing frame first, so the src swap never shows black
        var bridged = smooth && video.readyState >= 2 && showFreeze();
        idx = i;
        var c = seq[i];
        video.src = c.src;
        video.load();
        // mirror into the blurred backdrop (skip on touch to free a decoder)
        if (!COARSE && videoBg.getAttribute('src') !== c.src){ videoBg.src = c.src; videoBg.load(); }
        if (bridged){
            var safety = setTimeout(hideFreeze, 1200);   // never strand the freeze
            video.addEventListener('loadeddata', function onready(){
                clearTimeout(safety);
                requestAnimationFrame(hideFreeze);        // one paint, then crossfade
            }, { once:true });
        }
        video.onloadedmetadata = function(){
            video.playbackRate = c.kind==='sim' ? RATE_SIM : RATE_REAL;
            if (typeof seekFrac === 'number' && video.duration && isFinite(video.duration)){
                video.currentTime = clamp(seekFrac,0,0.999) * video.duration;
            }
            if (playing && !scrubbing) startVideo();
            render();
        };
        videoBg.onloadedmetadata = function(){
            videoBg.playbackRate = c.kind==='sim' ? RATE_SIM : RATE_REAL;
            if (playing && !COARSE) videoBg.play().catch(function(){});
        };
    }
    video.addEventListener('ended', function(){
        var next = idx+1; if (next>=len()) next=0;
        loadClip(next, true, undefined, true);   // smooth = freeze-frame bridge
    });

    function selectTask(i){
        taskIdx = i;
        syncPicks(i);
        // the mechanism panel is the explainer — only show it on the first task
        root.classList.toggle('mech-off', i !== 0);
        root.classList.remove('mech-done');
        seq = buildSeq(task());
        buildTicks();
        if (i !== 0) buildShowcase();             // chorus + bars for the other tasks
        else buildBars(msBars, task().real);      // credit-card reveal bars
        loadClip(0, true);
        play();          // clicking a task always starts it playing
        render();
    }

    // ── render one frame from the CURRENT video position ──────────────
    function render(){
        var i = idx, f = frac(), a = actOf(i), conv = convAt(i,f);
        var jit = (a===2) ? Math.pow(1-conv,1.15)*0.55 : 0;

        // action distribution
        var st = actionAmps(task(), conv, clock, jit);
        for (var r=0;r<3;r++) aFills[r].setAttribute('d', aRegion(st, BND[r], BND[r+1]));
        aOutline.setAttribute('d', aTopPath(st));
        aSvg.classList.toggle('converged', a===3);

        // latent z (π_steer): broad+wobbling early → narrow+shifted onto good zone
        var muZ = lerp(0.46, 0.56, conv) + jit*0.06*Math.sin(clock*1.25);
        var sgZ = lerp(0.26, 0.055, conv);
        var pts = zBell(clamp(muZ,0.05,0.95), sgZ);
        zLine.setAttribute('d', zPathLine(pts));
        zFill.setAttribute('d', zPathFill(pts));
        zSvg.classList.toggle('locked', a!==2);

        // domain tint
        var real = (a!==2);
        stage.classList.toggle('is-sim', !real); stage.classList.toggle('is-real', real);
        domTxt.textContent = real ? 'REAL WORLD' : 'SIMULATION';
        domChip.classList.toggle('sim', !real); domChip.classList.toggle('real', real);

        // top-left inset: WHICH policy you're watching, and WHERE.
        //  act 1 → base policy, real demos   act 2 → base improving in sim
        //  act 3 → SCORE deployed in the real world
        // the first sim clip is the "0" step (still the base policy); 40M onward
        // (step >= 1) is where the policy is actually being improved.
        var improving = (a===2 && seq[i].step >= 1);
        var phaseTxt;
        if (a===3)         phaseTxt = 'SCORE';
        else if (improving) phaseTxt = 'Improving policy';
        else                phaseTxt = 'Base policy';
        if (domPhase) domPhase.textContent = phaseTxt;
        domChip.classList.toggle('is-score', a===3);
        domChip.classList.toggle('is-improving', improving);

        root.classList.toggle('sim-active', a===2);
        // mechanism diagram removed: the explainer task stays a full-width video
        // with its captions through base AND sim, so attention is on the narration;
        // the right panel only reveals the success result at deploy.
        root.classList.toggle('pre-steer', taskIdx===0 && a!==3);

        // readouts
        if (rewFill){ var rew = a===1 ? 0.10 : (a===3 ? 1.0 : 0.10 + conv*0.85); rewFill.style.width = (rew*100).toFixed(1)+'%'; }
        statusEl.textContent = a===1 ? 'real-world prior' : a===3 ? 'converged ✓' : (conv<0.55?'exploring latent':'converging');
        statusEl.classList.toggle('done', a===3);
        actTag.innerHTML = a===1 ? '&pi;<sub>base</sub> action' : '&pi;<sub>steer</sub> ∘ &pi;<sub>base</sub>';
        // narrated phase caption (replaces the old method paragraph)
        var cap;
        if (a===1)            cap = 'Frozen <b>base policy</b> from real demos';
        else if (a===3)       cap = '<b>Deployed</b> on the real robot';
        else if (conv < 0.38) cap = '<b>Massively parallel sim training</b> with domain randomization';
        else if (conv < 0.66) cap = '<b>Support-constrained RL</b> with sparse rewards';
        else                  cap = 'Steered toward <b>high-value actions</b>';
        // only swap on an actual phase change, with a soft fade, so the line reads
        // like a deliberate subtitle instead of flickering every frame.
        if (actLbl.dataset.cap !== cap){
            actLbl.dataset.cap = cap;
            actLbl.innerHTML = cap;
            actLbl.style.opacity = '0';
            requestAnimationFrame(function(){ requestAnimationFrame(function(){ actLbl.style.opacity = '1'; }); });
        }

        // showcase (other tasks): base note in the base intro, SCORE note at deploy;
        // during the sim/training middle the text clears and the tiles grow to fill
        if (taskIdx !== 0){
            var onScore = (a===3);
            scNote.textContent = noteFor(task().real, onScore ? 'score' : 'base');
            root.classList.toggle('sc-expanded', a === 2);   // text hidden during sim
            scRowBase.classList.toggle('dim', onScore);
            scRowScore.classList.toggle('dim', !onScore);
            // base row plays during base phase, score row during deploy
            setRowPlaying(scTilesBase,  !onScore);
            setRowPlaying(scTilesScore,  onScore);
        } else {
            // credit card: mechanism resolves into the baseline comparison + clips at deploy
            var conv3 = (a===3);
            root.classList.toggle('mech-done', conv3);
            if (conv3 && !wasConverged){ buildBars(msBars, task().real); buildCcReveal(); }
            setRowPlaying(msTilesBase,  conv3);
            setRowPlaying(msTilesScore, conv3);
            wasConverged = conv3;
        }

        var p = (gpos()*100);
        fillBar.style.width = p+'%'; thumb.style.left = p+'%';
        track.setAttribute('aria-valuenow', Math.round(p));
    }

    // ── animation loop (drives the mechanism wander + thumb) ──────────
    function loop(ts){
        if (!playing) return;
        var dt = lastTs ? (ts-lastTs) : 16; lastTs = ts;
        clock += dt/1000;
        render();
        raf = requestAnimationFrame(loop);
    }
    // Real iOS hardware drops a play() issued before the clip has data, and
    // never retries — so always retry once the element is actually ready.
    function startVideo(){
        if (!playing) return;
        var p = video.play();
        if (p && p.catch) p.catch(function(){
            video.addEventListener('canplay', function once(){
                video.removeEventListener('canplay', once);
                if (playing && !scrubbing) video.play().catch(function(){});
            }, { once:true });
        });
    }
    function play(){ if(playing) return; playing=true; lastTs=0; setIcon(); startVideo(); if(!COARSE) videoBg.play().catch(function(){}); raf=requestAnimationFrame(loop); }
    function pause(){ playing=false; if(raf) cancelAnimationFrame(raf); raf=null; video.pause(); videoBg.pause(); setIcon(); }
    function setIcon(){ playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'; }
    playBtn.addEventListener('click', function(){ playing?pause():play(); });
    // a real tap is a user gesture, which iOS always honors — if autoplay was
    // refused (offscreen/decoder race) the first touch on the stage recovers it.
    stage.addEventListener('pointerdown', function(){ if(playing) startVideo(); });

    // ── scrub: smooth seek across the whole sequence (clip + within-clip) ──
    var scrubbing = false;
    function seekToGlobal(g){
        g = clamp(g, 0, 0.99999);
        var raw = g * len();
        var target = Math.min(len()-1, Math.floor(raw));
        var withinFrac = raw - target;
        if (target !== idx){
            loadClip(target, false, withinFrac);   // seek applied on metadata
        } else {
            var d = video.duration;
            if (d && isFinite(d)) video.currentTime = withinFrac * d;
        }
        render();
    }
    function gFromX(clientX){
        var rb = track.getBoundingClientRect();
        return clamp((clientX - rb.left) / rb.width, 0, 1);
    }
    track.addEventListener('pointerdown', function(e){
        e.preventDefault(); scrubbing = true; track.setPointerCapture(e.pointerId);
        video.pause();
        seekToGlobal(gFromX(e.clientX));
    });
    track.addEventListener('pointermove', function(e){
        if (scrubbing) seekToGlobal(gFromX(e.clientX));
    });
    function endScrub(){
        if (!scrubbing) return; scrubbing = false;
        if (playing) video.play().catch(function(){});
    }
    track.addEventListener('pointerup', endScrub);
    track.addEventListener('pointercancel', endScrub);
    track.addEventListener('keydown', function(e){
        var d = e.key==='ArrowRight'?1 : e.key==='ArrowLeft'?-1 : 0; if(!d) return;
        e.preventDefault(); loadClip(clamp(idx+d,0,len()-1), playing); render();
    });

    // ── boot: start when scrolled into view ───────────────────────────
    // the task wall starts as a calm, dimmed strip (hover to reopen) so the hero
    // clip and its caption are the single focal point from the first paint.
    root.classList.add('engaged');
    seq = buildSeq(task()); buildTicks(); buildBars(msBars, task().real); loadClip(0, false); render();
    if ('IntersectionObserver' in window){
        // observe the STAGE, not the whole (very tall) reel: iOS hardware
        // refuses to start an offscreen video, so play() must fire when the
        // video itself is on screen, and pause when it scrolls away.
        // High threshold + reset-on-first-view: the reel doesn't run while it's
        // still scrolling past, so the viewer arrives at ACT 1, not mid-timeline.
        var firstView = true;
        var io=new IntersectionObserver(function(en){ en.forEach(function(x){
            if (x.isIntersecting){
                if (firstView){ firstView=false; loadClip(0, false); render(); }
                play();
            } else { pause(); }
        }); }, { threshold:0.55 });
        io.observe(stage);
    } else { play(); }
})();
