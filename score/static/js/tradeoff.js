/* ════════════════════════════════════════════════════════════════════
   The distributional-constraint tradeoff, as a live plot.

   Regularizing a sim policy toward the base with a BC loss is a delicate
   knob. Drag across the BC coefficient and watch the real-world success
   curve rise then fall — a hump that peaks at 60% and never reaches the
   SCORE ceiling at 100%. Sim success stays high the whole time, which is
   exactly the trap: looking good in sim says little about transfer.

   Values are read off the paper's tradeoff figure; adjust DATA if needed.
   ═════════════════════════════════════════════════════════════════════ */
(function(){
    var root = document.getElementById('bc-knob');
    if (!root) return;

    var DATA = [
        { c:'10',   sim:0,   real:0,  tag:'collapses',
          state:'Too loose to learn anything: the policy collapses in simulation.' },
        { c:'100',  sim:100, real:12, tag:'reward-hacks',
          state:'Reward-hacks: a fast, suboptimal smashing strategy far from the base policy. Dangerous on hardware.' },
        { c:'1k',   sim:95,  real:40, tag:'drifting',
          state:'Improving in the real world, but still drifting from what actually transfers.' },
        { c:'10k',  sim:90,  real:60, tag:'best tradeoff',
          state:'The best tradeoff: 60% real, above the base policy&rsquo;s 30% but far below SCORE&rsquo;s 100%.' },
        { c:'100k', sim:50,  real:30, tag:'inherits base',
          state:'Over-constrained: it just inherits the base policy&rsquo;s suboptimal, failure-prone behavior.' }
    ];
    var N = DATA.length, idx = 0;
    var BASE = 30, SCORE = 100;

    // ── geometry (balanced padding so the plot sits centered) ──
    var W = 640, H = 300, padL = 18, padR = 18, padT = 30, padB = 40;
    var plotL = padL, plotR = W - padR, plotW = plotR - plotL;
    var plotT = padT, plotB = H - padB, plotH = plotB - plotT;
    function X(i){ return plotL + (i/(N-1))*plotW; }
    function Y(v){ return plotT + (1 - v/100)*plotH; }

    var NS = 'http://www.w3.org/2000/svg';
    function E(t, a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
    function line(pts, cls){ var d=''; pts.forEach(function(p,i){ d+=(i?' L ':'M ')+p[0].toFixed(1)+' '+p[1].toFixed(1); }); return E('path',{d:d, class:cls}); }

    var svg = E('svg', { viewBox:'0 0 '+W+' '+H, class:'bctk-svg', preserveAspectRatio:'xMidYMid meet' });

    // soft vertical gradient for the real-world area fill (terracotta → transparent)
    var defs = E('defs', {});
    var grad = E('linearGradient', { id:'bctk-grad', x1:'0', y1:'0', x2:'0', y2:'1' });
    grad.appendChild(E('stop', { offset:'0',   'stop-color':'#b56b5c', 'stop-opacity':'0.30' }));
    grad.appendChild(E('stop', { offset:'1',   'stop-color':'#b56b5c', 'stop-opacity':'0.02' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // gridlines + y labels (0/50/100)
    [0,50,100].forEach(function(v){
        svg.appendChild(E('line',{ x1:plotL, y1:Y(v), x2:plotR, y2:Y(v), class:'bctk-grid' }));
    });

    // SCORE ceiling (dashed) + inline label, top-left
    svg.appendChild(E('line',{ x1:plotL, y1:Y(SCORE), x2:plotR, y2:Y(SCORE), class:'bctk-ceil' }));
    var slab = E('text',{ x:plotL+6, y:Y(SCORE)-6, class:'bctk-reflabel score' }); slab.textContent='SCORE  100%';
    svg.appendChild(slab);

    // base reference (dotted) + inline label
    svg.appendChild(E('line',{ x1:plotL, y1:Y(BASE), x2:plotR, y2:Y(BASE), class:'bctk-base' }));
    var blab = E('text',{ x:plotL+6, y:Y(BASE)-6, class:'bctk-reflabel base' }); blab.textContent='base policy  30%';
    svg.appendChild(blab);

    // sim curve (grey)
    var simPts = DATA.map(function(d,i){ return [X(i), Y(d.sim)]; });
    svg.appendChild(line(simPts, 'bctk-sim-line'));

    // real curve + soft area fill
    var realPts = DATA.map(function(d,i){ return [X(i), Y(d.real)]; });
    var areaD = 'M '+X(0)+' '+plotB + realPts.map(function(p){ return ' L '+p[0].toFixed(1)+' '+p[1].toFixed(1); }).join('') + ' L '+X(N-1)+' '+plotB+' Z';
    svg.appendChild(E('path',{ d:areaD, class:'bctk-real-area' }));
    svg.appendChild(line(realPts, 'bctk-real-line'));

    // dots
    var simDots=[], realDots=[];
    DATA.forEach(function(d,i){
        var sd=E('circle',{ cx:X(i), cy:Y(d.sim), r:3, class:'bctk-dot sim' }); svg.appendChild(sd); simDots.push(sd);
        var rd=E('circle',{ cx:X(i), cy:Y(d.real), r:3.5, class:'bctk-dot real' }); svg.appendChild(rd); realDots.push(rd);
    });

    // x labels
    DATA.forEach(function(d,i){
        var t=E('text',{ x:X(i), y:plotB+22, 'text-anchor':'middle', class:'bctk-xlab' }); t.textContent=d.c; svg.appendChild(t);
    });

    // cursor (vertical line + highlighted real dot + value bubble)
    var cursor = E('line',{ y1:plotT-4, y2:plotB, class:'bctk-cursor' }); svg.appendChild(cursor);
    var hl = E('circle',{ r:6, class:'bctk-hl' }); svg.appendChild(hl);
    var bubbleBg = E('rect',{ rx:5, width:46, height:20, class:'bctk-bubble' }); svg.appendChild(bubbleBg);
    var bubbleTx = E('text',{ class:'bctk-bubble-tx', 'text-anchor':'middle' }); svg.appendChild(bubbleTx);

    document.getElementById('bc-chart').appendChild(svg);

    var stateEl = document.getElementById('bc-state');
    var tagEl   = document.getElementById('bc-tag');

    function render(){
        var d = DATA[idx], x = X(idx), yr = Y(d.real);
        cursor.setAttribute('x1', x); cursor.setAttribute('x2', x);
        hl.setAttribute('cx', x); hl.setAttribute('cy', yr);
        var bx = Math.max(plotL, Math.min(plotR-46, x-23));
        var by = yr - 28; if (by < plotT-6) by = yr + 10;
        bubbleBg.setAttribute('x', bx); bubbleBg.setAttribute('y', by);
        bubbleTx.setAttribute('x', bx+23); bubbleTx.setAttribute('y', by+14);
        bubbleTx.textContent = d.real + '%';
        realDots.forEach(function(c,i){ c.classList.toggle('on', i===idx); });
        simDots.forEach(function(c,i){ c.classList.toggle('on', i===idx); });
        stateEl.innerHTML = d.state;
        tagEl.textContent = d.tag;
        tagEl.className = 'bctk-tag' + (idx===3 ? ' good' : '');
    }

    function setFromX(clientX){
        var r = svg.getBoundingClientRect();
        var px = (clientX - r.left) / r.width * W;       // back to viewBox units
        var p = (px - plotL) / plotW;
        var ni = Math.max(0, Math.min(N-1, Math.round(p*(N-1))));
        if (ni !== idx){ idx = ni; render(); }
    }
    var dragging = false;
    svg.addEventListener('pointerdown', function(e){ dragging=true; svg.setPointerCapture(e.pointerId); setFromX(e.clientX); });
    svg.addEventListener('pointermove', function(e){ if(dragging) setFromX(e.clientX); });
    svg.addEventListener('pointerup',   function(){ dragging=false; });
    svg.addEventListener('pointercancel', function(){ dragging=false; });
    svg.style.touchAction = 'none';
    svg.style.cursor = 'ew-resize';

    render();

    // one-time auto-demo on scroll into view: sweep loose → best → tight
    var played = false;
    function demo(){
        if (played) return; played = true;
        var seq = [1,2,3,4,3], k = 0;
        var iv = setInterval(function(){
            if (k >= seq.length){ clearInterval(iv); return; }
            idx = seq[k++]; render();
        }, 950);
    }
    if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(en){
            en.forEach(function(x){ if (x.isIntersecting){ io.disconnect(); setTimeout(demo, 500); } });
        }, { threshold: 0.5 });
        io.observe(root);
    }
})();
