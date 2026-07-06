document.addEventListener('DOMContentLoaded', function() {
  initializeBulmaComponents();
  initReasoningCarousels();
  initAdaptiveViz();
  setupLazyLoading();
});

// Adaptive reasoning via compression — combined 3-pane interactive.
//   top-left:    latent trellis (root + 4 layers, each 2 tokens + eos)
//   bottom-left: decaying σ schedule, x-aligned with the trellis layers
//   right:       ring-shaped data covered by 2^(k-1) Gaussians at reasoning length k
// A continuous position p ∈ [1,4] drives all three panes. It autoplays (ping-pong sweep
// with dwells at each integer step); dragging on the σ pane scrubs p directly, and
// autoplay resumes a moment after release.
function initAdaptiveViz() {
  const svg = document.getElementById('adaptive-viz');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const SERIF = 'Georgia, "Times New Roman", serif';
  const SANS = "'Google Sans', sans-serif";
  const C1 = [106, 79, 180], C2 = [227, 152, 174];                  // purple -> pink, per step
  const col = t => { t = Math.max(0, Math.min(1, t)); return 'rgb(' + C1.map((v, i) => Math.round(v + (C2[i] - v) * t)).join(',') + ')'; };
  const colF = p => col((p - 1) / 3);
  const rgbOf = t => { t = Math.max(0, Math.min(1, t)); return C1.map((v, i) => v + (C2[i] - v) * t); };
  const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  const WHITE = [255, 255, 255], EDGE_GRAY = [225, 225, 225];
  const dark = (p, f) => { const t = Math.max(0, Math.min(1, (p - 1) / 3)); return 'rgb(' + C1.map((v, i) => Math.round((v + (C2[i] - v) * t) * f)).join(',') + ')'; };
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const make = (tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  };

  // --- shared x positions: trellis layers and σ steps are the same columns ---
  const XS = k => 125 + (k - 1) * 85;                               // steps 1..4 (fractional ok); root at 40 = one step before layer 1
  const ROWS = [60, 108, 156];                                      // token, token, eos
  const NODE_R = 11;
  // σ pane
  const SY1 = 252, SY0 = 358;                                       // y at σ=1 / σ=0
  const yS = v => SY0 - v * (SY0 - SY1);
  // true geometric decay σ_k = σ_max·(σ_min/σ_max)^((k-1)/(K-1)) with σ_max=1, σ_min=0.01
  const sigAt = p => Math.pow(0.01, (p - 1) / 3);
  const SIG = [1, 2, 3, 4].map(sigAt);
  // ring data + Gaussian levels (level s has 2^(s-1) blobs on nested half-arcs)
  const CX = 655, CY = 205, RING = 110, BETA = -Math.PI / 2;
  const RADII = [122, 104, 74, 45];                                 // blob radius per level (overlapping like the storyboard)
  const DIST = [0, 70, 99, 107];                                    // blob centroid distance (arc centroid)
  const LVL = [1, 2, 4, 8].map((m, li) => Array.from({ length: m }, (_, i) => {
    const th = BETA + (i + 0.5) * 2 * Math.PI / m;
    return { x: CX + DIST[li] * Math.cos(th), y: CY + DIST[li] * Math.sin(th), r: RADII[li] };
  }));

  // --- static scenery ---
  const defs = make('defs', {});
  const grad = make('linearGradient', { id: 'av-grad', gradientUnits: 'userSpaceOnUse', x1: XS(1), y1: 0, x2: XS(4), y2: 0 });
  grad.appendChild(make('stop', { offset: '0%', 'stop-color': col(0) }));
  grad.appendChild(make('stop', { offset: '100%', 'stop-color': col(1) }));
  defs.appendChild(grad); svg.appendChild(defs);

  const label = (x, y, s) => make('text', { x: x, y: y, 'font-size': 11, 'font-weight': 600, 'letter-spacing': 1.5, fill: '#999', 'font-family': SANS }, s);
  svg.appendChild(label(24, 26, 'LATENT SPACE'));
  svg.appendChild(label(24, 226, 'VARIANCE SCHEDULE'));
  svg.appendChild(label(430, 26, 'DATA'));

  // playhead line spanning both left panes (behind everything else)
  const vline = make('line', { y1: 38, y2: SY0, stroke: '#c9c9c9', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' });
  svg.appendChild(vline);

  // trellis edges (behind the nodes): root -> layer 1, tokens of layer j -> tokens/eos of layer j+1
  const edges = [];   // {el, src (0 = root), tgt, isEos}
  const addEdge = (x1, y1, x2, y2, src, tgt, isEos) => {
    const l = make('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: mix(EDGE_GRAY, EDGE_GRAY, 0), 'stroke-width': 1.3 });
    svg.appendChild(l); edges.push({ el: l, src: src, tgt: tgt, isEos: isEos });
  };
  [ROWS[0], ROWS[1]].forEach(y => addEdge(40, ROWS[1], XS(1), y, 0, 1, false));
  addEdge(40, ROWS[1], XS(1), ROWS[2], 0, 1, true);
  for (let j = 1; j <= 3; j++) {
    [ROWS[0], ROWS[1]].forEach(ys => {
      [ROWS[0], ROWS[1]].forEach(yt => addEdge(XS(j), ys, XS(j + 1), yt, j, j + 1, false));
      addEdge(XS(j), ys, XS(j + 1), ROWS[2], j, j + 1, true);
    });
  }

  // trellis: root + 4 layers x (2 tokens + eos); nodes are solid-filled so edges pass behind them
  svg.appendChild(make('circle', { cx: 40, cy: ROWS[1], r: NODE_R, fill: col(0) }));
  svg.appendChild(make('text', { x: 40, y: ROWS[1] + 28, 'text-anchor': 'middle', 'font-size': 11, fill: '#999', 'font-family': SERIF, 'font-style': 'italic' }, 'root'));
  svg.appendChild(make('text', { x: 101, y: ROWS[2] + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#999', 'font-family': SERIF, 'font-style': 'italic' }, 'eos'));
  const nodes = [];   // {el, layer, isEos}
  for (let j = 1; j <= 4; j++) {
    ROWS.forEach((y, ri) => {
      const c = make('circle', { cx: XS(j), cy: y, r: NODE_R, fill: '#fff', stroke: '#c4c4c4', 'stroke-width': 2 });
      svg.appendChild(c);
      nodes.push({ el: c, layer: j, isEos: ri === 2 });
    });
  }

  // σ pane: axes, curve, step markers, playhead
  svg.appendChild(make('line', { x1: 109, y1: SY1 - 8, x2: 109, y2: SY0, stroke: '#cfcfcf', 'stroke-width': 1.4 }));
  svg.appendChild(make('line', { x1: 109, y1: SY0, x2: 392, y2: SY0, stroke: '#cfcfcf', 'stroke-width': 1.4 }));
  for (let k = 1; k <= 4; k++) {
    svg.appendChild(make('text', { x: XS(k), y: SY0 + 18, 'text-anchor': 'middle', 'font-size': 12, fill: '#999', 'font-family': SERIF }, String(k)));
  }
  svg.appendChild(make('text', { x: (XS(1) + XS(4)) / 2, y: SY0 + 36, 'text-anchor': 'middle', 'font-size': 13, fill: '#777', 'font-family': SERIF }, 'Latent step k'));
  svg.appendChild(make('text', { x: 91, y: (SY1 + SY0) / 2, 'text-anchor': 'middle', 'font-size': 15, fill: '#777', 'font-family': SERIF, 'font-style': 'italic', transform: 'rotate(-90 91 ' + (SY1 + SY0) / 2 + ')' }, 'σ'));
  let pts = '';
  for (let p = 1; p <= 4.001; p += 0.025) pts += XS(Math.min(p, 4)) + ',' + yS(sigAt(Math.min(p, 4))) + ' ';   // fine sampling: the decay is steep near step 1
  svg.appendChild(make('polyline', { points: pts.trim(), fill: 'none', stroke: 'url(#av-grad)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  const sigMarkers = [];
  for (let k = 1; k <= 4; k++) {
    const c = make('circle', { cx: XS(k), cy: yS(SIG[k - 1]), r: 4.5, fill: col((k - 1) / 3), stroke: '#fff', 'stroke-width': 1.5 });
    svg.appendChild(c); sigMarkers.push(c);
  }
  const playhead = make('circle', { r: 8, fill: '#fff', 'stroke-width': 3.5 });
  svg.appendChild(playhead);

  // ring data (seeded so the scatter is stable across loads)
  let seed = 7;
  const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < 150; i++) {
    const a = rnd() * 2 * Math.PI;
    const g = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const r = RING + g * 10;
    svg.appendChild(make('circle', { cx: CX + r * Math.cos(a), cy: CY + r * Math.sin(a), r: 2.2, fill: '#555', opacity: 0.6 }));
  }
  // Gaussian pool (max 8)
  const blobs = Array.from({ length: 8 }, () => {
    const c = make('circle', { 'fill-opacity': 0.13, 'stroke-width': 2.5, 'stroke-opacity': 0.9, display: 'none' });
    svg.appendChild(c); return c;
  });

  // --- render everything for a continuous position p ∈ [1,4] ---
  function render(p) {
    p = Math.max(1, Math.min(4, p));
    vline.setAttribute('x1', XS(p)); vline.setAttribute('x2', XS(p));
    nodes.forEach(n => {
      const a = n.isEos ? clamp01(1 - Math.abs(p - n.layer)) : clamp01(p - n.layer);
      n.el.setAttribute('fill', mix(WHITE, rgbOf((n.layer - 1) / 3), a * (n.isEos ? 1 : 0.85)));
      n.el.setAttribute('stroke', a > 0.02 ? dark(n.layer, 0.72) : '#c4c4c4');
      n.el.setAttribute('stroke-opacity', (0.5 + 0.5 * a).toFixed(3));
    });
    edges.forEach(g => {
      const srcA = g.src === 0 ? 1 : clamp01(p - g.src);
      const a = g.isEos ? Math.min(srcA, clamp01(1 - Math.abs(p - g.tgt))) : clamp01(p - g.tgt);
      g.el.setAttribute('stroke', mix(EDGE_GRAY, rgbOf((g.tgt - 1) / 3), a * 0.9));
      g.el.setAttribute('stroke-width', (1.3 + 0.7 * a).toFixed(2));
    });
    sigMarkers.forEach((m, i) => m.setAttribute('r', (4.5 + 4 * clamp01(1 - Math.abs(p - (i + 1)))).toFixed(2)));
    playhead.setAttribute('cx', XS(p)); playhead.setAttribute('cy', yS(sigAt(p)));
    playhead.setAttribute('stroke', colF(p));
    // Gaussians: at integer p show level p; between p and p+1 each parent splits into two,
    // children interpolating from the parent's position/size out to their own.
    const s = Math.min(4, Math.floor(p + 1e-9)), f = p - s;
    let draw;
    if (f < 1e-4 || s >= 4) {
      draw = LVL[s - 1].map(b => ({ x: b.x, y: b.y, r: b.r }));
    } else {
      const e = easeIO(f);
      draw = LVL[s].map((c, j) => {
        const par = LVL[s - 1][j >> 1];
        return { x: par.x + (c.x - par.x) * e, y: par.y + (c.y - par.y) * e, r: par.r + (c.r - par.r) * e };
      });
    }
    const cc = colF(p);
    blobs.forEach((b, i) => {
      if (i < draw.length) {
        b.setAttribute('display', '');
        b.setAttribute('cx', draw[i].x.toFixed(1)); b.setAttribute('cy', draw[i].y.toFixed(1));
        b.setAttribute('r', draw[i].r.toFixed(1));
        b.setAttribute('fill', cc); b.setAttribute('stroke', cc);
      } else b.setAttribute('display', 'none');
    });
  }

  // --- timeline: autoplay ping-pong with dwells; drag scrubs; resume after release ---
  const st = { mode: 'dwell', p: 1, t0: null, from: 1, to: 1, dur: 850, resumeAt: 0 };
  function advance(now) {
    if (st.t0 === null) st.t0 = now;
    if (st.mode === 'dwell') {
      const dwell = (st.p <= 1 || st.p >= 4) ? 1600 : 1100;
      if (now - st.t0 >= dwell) {
        st.from = st.p;
        st.to = st.p >= 4 ? 1 : Math.round(st.p) + 1;   // 1→2→3→4, then wrap back to 1
        st.dur = st.to < st.from ? 1300 : 850;          // the wrap rewinds through all levels
        st.mode = 'move'; st.t0 = now;
      }
    } else if (st.mode === 'move') {
      const f = (now - st.t0) / st.dur;
      if (f >= 1) { st.p = st.to; st.mode = 'dwell'; st.t0 = now; }
      else st.p = st.from + (st.to - st.from) * f;    // linear sweep; the split itself is eased
    } else if (st.mode === 'resume') {
      if (now >= st.resumeAt) {
        st.from = st.p; st.to = Math.round(st.p);
        if (Math.abs(st.to - st.from) < 1e-3) { st.p = st.to; st.mode = 'dwell'; st.t0 = now; }
        else { st.dur = Math.max(250, 850 * Math.abs(st.to - st.from)); st.mode = 'move'; st.t0 = now; }
      }
    }                                                  // 'drag': p is driven by the pointer
    render(st.p);
  }

  // Play by default; the IntersectionObserver only PAUSES the loop while off-screen.
  // (Never gate the start on an observer callback: Chrome batches entries — reading a stale
  // one — and skips nonzero thresholds for elements it measured as zero-area, so a
  // start-only-on-intersect loop can simply never begin. Worst case here is the inverse:
  // a few frames render off-screen before the first observer callback pauses them.)
  let rafId = null, visible = true;
  const loop = ts => { rafId = null; advance(ts); if (visible) rafId = requestAnimationFrame(loop); };
  const start = () => { if (rafId === null) { st.t0 = null; rafId = requestAnimationFrame(loop); } };
  start();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      visible = es[es.length - 1].isIntersecting;   // last entry = most recent state
      if (visible) start();
    }, { threshold: 0 }).observe(svg);
  }

  // drag anywhere on the σ pane
  const overlay = make('rect', { x: 100, y: 234, width: 302, height: 162, fill: '#000', 'fill-opacity': 0, 'pointer-events': 'all' });
  overlay.style.cursor = 'ew-resize';
  svg.appendChild(overlay);
  const xToP = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const x = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    return Math.max(1, Math.min(4, 1 + (x - XS(1)) / (XS(2) - XS(1))));
  };
  const mv = e => { if (st.mode === 'drag') { e.preventDefault(); st.p = xToP(e); render(st.p); } };
  const up = () => {
    if (st.mode !== 'drag') return;
    st.mode = 'resume'; st.resumeAt = performance.now() + 2200;
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
  overlay.addEventListener('pointerdown', e => {
    e.preventDefault();
    st.mode = 'drag'; st.p = xToP(e); render(st.p);
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });

  render(st.p);
  svg._viz = { setP: v => { st.mode = 'drag'; st.p = v; render(v); }, getP: () => st.p, getMode: () => st.mode, advance: advance, st: st };
}

function showDroid(task, btn) {
  document.querySelectorAll('.droid-eval-container').forEach(function(el) { el.style.display = 'none'; });
  document.getElementById('droid-' + task).style.display = 'block';
  if (btn) {
    const toggle = btn.closest('.seg-toggle');
    const btns = Array.prototype.slice.call(toggle.querySelectorAll('.seg-btn'));
    const idx = btns.indexOf(btn);
    btns.forEach(function(b, i) { b.classList.toggle('is-active', i === idx); });
    const thumb = toggle.querySelector('.seg-thumb');
    if (thumb) thumb.style.transform = 'translateX(' + (idx * 100) + '%)';   // slide pill to the active segment
  }
}

// Carousel for reasoning-trace videos: a wrap-around carousel that advances one video at a
// time (two visible). The track slides via a CSS transform transition (compositor-driven, no
// per-frame JS), with the clips playing throughout. Cloned head/tail slides make the loop
// seamless; at the seam the real slide's playback time is matched to the clone's so the swap is
// invisible. (A ~1px reflow of the live <video> textures at slide-end is a Chrome-only
// compositor quirk, absent in Safari, that we accept rather than freezing the clips.)
function initReasoningCarousels() {
  const GAP = 16;        // px gap between slides
  const VISIBLE = 2;     // videos shown at once
  const DUR = 400;       // slide duration (ms)
  const TRANS = 'transform ' + (DUR / 1000) + 's cubic-bezier(0.4, 0, 0.2, 1)';

  document.querySelectorAll('.rt-carousel').forEach(function(car) {
    // Build the skeleton so the markup is just <div class="rt-carousel" data-...>.
    car.innerHTML =
      '<div class="rt-row">' +
        '<button class="rt-prev" aria-label="Previous">←</button>' +
        '<div class="rt-viewport"><div class="rt-track"></div></div>' +
        '<button class="rt-next" aria-label="Next">→</button>' +
      '</div><div class="rt-indicator"></div>';

    const base = car.dataset.base;
    const eps = parseInt(car.dataset.eps, 10);
    const task = car.dataset.task;          // one task per carousel; a sibling toggle switches them
    const videos = [];
    for (let i = 0; i < eps; i++) videos.push({ src: base + '/' + task + '/ep' + i + '.mp4' });

    const viewport = car.querySelector('.rt-viewport');
    const track = car.querySelector('.rt-track');
    const indicator = car.querySelector('.rt-indicator');
    const prev = car.querySelector('.rt-prev');
    const next = car.querySelector('.rt-next');

    const N = videos.length;
    const perVisible = Math.min(VISIBLE, N);
    const wrap = N > perVisible;
    const K = perVisible;   // clones on each side

    // Extended slide list: [last K clones] + [N real] + [first K clones].
    const ext = [];
    if (wrap) for (let i = N - K; i < N; i++) ext.push(videos[i]);
    for (let i = 0; i < N; i++) ext.push(videos[i]);
    if (wrap) for (let i = 0; i < K; i++) ext.push(videos[i]);
    const M = ext.length;
    let pos = wrap ? K : 0;          // left-edge slide index (real video 0 starts here)
    let animating = false, settleT = null, activated = false;

    track.style.gap = GAP + 'px';
    track.style.transition = TRANS;
    track.style.willChange = 'transform';

    const slides = ext.map(function(item) {
      const slide = document.createElement('div');
      slide.style.cssText = 'flex:0 0 auto;';   // width set in px by computeMetrics()
      const vid = document.createElement('video');
      vid.muted = true; vid.loop = true; vid.setAttribute('playsinline', '');
      // A fixed aspect-ratio reserves the slot's height so a clip loading mid-slide can't shift layout.
      vid.style.cssText = 'width:100%; border-radius:6px; display:block; background:#f4f4f4; aspect-ratio:1120/480;';
      slide.appendChild(vid);
      track.appendChild(slide);
      return { el: slide, vid: vid, src: item.src, loaded: false };
    });

    // Lock the slots to the clips' true aspect-ratio once the first one reports it.
    let arSet = false;
    function lockAR(v) {
      if (arSet || !v.videoWidth || !v.videoHeight) return;
      arSet = true;
      const ar = v.videoWidth + ' / ' + v.videoHeight;
      slides.forEach(function(s) { s.vid.style.aspectRatio = ar; });
    }

    // Integer slide widths -> integer transform offsets (one slide step = w + gap).
    let step = 0;
    function computeMetrics() {
      const w = Math.max(1, Math.floor((viewport.clientWidth - (perVisible - 1) * GAP) / perVisible));
      step = w + GAP;
      slides.forEach(function(s) { s.el.style.flexBasis = w + 'px'; });
    }
    function place(animate) {
      track.style.transition = animate ? TRANS : 'none';
      track.style.transform = 'translateX(' + (-pos * step) + 'px)';
      if (!animate) { void track.offsetHeight; track.style.transition = TRANS; }   // commit, then re-arm
    }

    function loadNear() {
      for (let i = pos - 1; i <= pos + perVisible; i++) {
        if (i < 0 || i >= M || slides[i].loaded) continue;
        const s = slides[i];
        s.vid.src = s.src; s.vid.load(); s.loaded = true;
        s.vid.addEventListener('loadedmetadata', function() { lockAR(this); }, { once: true });
      }
    }
    function playVisible() {
      slides.forEach(function(s, i) {
        const vis = (i >= pos && i < pos + perVisible);
        if (vis && s.loaded) s.vid.play().catch(function() {});
        else s.vid.pause();
      });
    }
    function setIndicator() {
      const cur = wrap ? (((pos - K) % N) + N) % N : pos;
      indicator.textContent = (cur + 1) + ' / ' + N;
    }

    function onSettle() {
      if (!animating) return;
      animating = false;
      if (settleT) { clearTimeout(settleT); settleT = null; }
      if (wrap && (pos > K + N - 1 || pos < K)) {       // landed on a clone -> jump to its real twin
        const old = pos;
        pos += (pos < K) ? N : -N;
        for (let i = 0; i < perVisible; i++) {          // keep frames continuous across the seam
          const a = slides[old + i], b = slides[pos + i];
          if (a && b && a.loaded && b.loaded) { try { b.vid.currentTime = a.vid.currentTime; } catch (e) {} }
        }
        place(false);
        loadNear();
      }
      playVisible();
    }

    function go(dir) {
      if (animating || !wrap) return;
      animating = true;
      pos += dir;
      place(true);
      loadNear(); playVisible(); setIndicator();
      settleT = setTimeout(onSettle, DUR + 140);   // fallback if transitionend is missed
    }

    track.addEventListener('transitionend', function(e) {
      if (e.target === track && e.propertyName === 'transform') onSettle();
    });
    prev.addEventListener('click', function() { go(-1); });
    next.addEventListener('click', function() { go(1); });
    window.addEventListener('resize', function() { if (activated) { computeMetrics(); place(false); } });

    function activate() {
      computeMetrics(); place(false); loadNear(); playVisible(); setIndicator();
      activated = true;
    }
    car._activate = activate;   // a sibling toggle calls this when it reveals a hidden task

    if (!wrap) { prev.style.display = 'none'; next.style.display = 'none'; indicator.style.display = 'none'; }
    if (car.offsetParent !== null) activate();   // visible now; hidden tasks wait for their toggle
    // Re-measure once layout/fonts settle, in case the viewport width wasn't final at init.
    requestAnimationFrame(function() { if (activated) { computeMetrics(); place(false); } });
    window.addEventListener('load', function() { if (car.offsetParent !== null) activate(); });
  });
}

// Switch the active task in a reasoning-trace group: slide the toggle thumb, reveal that task's carousel.
function rtTask(groupId, idx, btn) {
  const toggle = btn.closest('.seg-toggle');
  const btns = Array.prototype.slice.call(toggle.querySelectorAll('.seg-btn'));
  btns.forEach(function(b, i) { b.classList.toggle('is-active', i === idx); });
  const thumb = toggle.querySelector('.seg-thumb');
  if (thumb) thumb.style.transform = 'translateX(' + (idx * 100) + '%)';
  const cars = document.getElementById(groupId).querySelectorAll('.rt-carousel');
  cars.forEach(function(c, i) {
    c.style.display = (i === idx) ? '' : 'none';
    if (i !== idx) c.querySelectorAll('video').forEach(function(v) { v.pause(); });
  });
  if (cars[idx] && cars[idx]._activate) cars[idx]._activate();
}

function initializeBulmaComponents() {
  const navbarBurgers = document.querySelectorAll('.navbar-burger');
  navbarBurgers.forEach(burger => {
    burger.addEventListener('click', () => {
      const target = document.getElementById(burger.dataset.target);
      burger.classList.toggle('is-active');
      target.classList.toggle('is-active');
    });
  });
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function isInVisibleContainer(el) {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    if (style.display === 'none') return false;
    parent = parent.parentElement;
  }
  return true;
}

function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && isInVisibleContainer(video)) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('video').forEach(video => {
      videoObserver.observe(video);
    });
  }
}
