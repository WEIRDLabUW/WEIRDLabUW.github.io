document.addEventListener('DOMContentLoaded', function() {
  initializeBulmaComponents();
  initReasoningCarousels();
  initSigmaViz();
  setupLazyLoading();
});

// Interactive geometric σ-schedule: σ_k = σ_max·(σ_min/σ_max)^((k-1)/(N-1)), k = 1..N.
// Drag the endpoint knobs (σ_max at step 1, σ_min at step N) to reshape the curve reactively.
function initSigmaViz() {
  const svg = document.getElementById('sigma-viz');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const N = 16;
  const X0 = 58, X1 = 540, Y0 = 22, Y1 = 312, PW = X1 - X0, PH = Y1 - Y0;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const C_MAX = [106, 79, 180], C_MIN = [227, 152, 174];   // purple -> pink
  let sMax = 1.0, sMin = 0.1;

  const xOf = k => X0 + ((k - 1) / (N - 1)) * PW;
  const yOf = s => Y1 - Math.max(0, Math.min(1, s)) * PH;
  const sOf = y => Math.max(0, Math.min(1, (Y1 - y) / PH));
  const lerp = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  const make = (tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  };

  // Gradient stroke for the curve (σ_max end purple, σ_min end pink).
  const defs = make('defs', {});
  // userSpaceOnUse (fixed to the plot x-range) so a flat σ_max==σ_min line — whose bbox has zero
  // height — still gets a stroke; an objectBoundingBox gradient would refuse to paint it.
  const grad = make('linearGradient', { id: 'sig-grad', gradientUnits: 'userSpaceOnUse', x1: X0, y1: 0, x2: X1, y2: 0 });
  grad.appendChild(make('stop', { offset: '0%', 'stop-color': lerp(C_MAX, C_MIN, 0) }));
  grad.appendChild(make('stop', { offset: '100%', 'stop-color': lerp(C_MAX, C_MIN, 1) }));
  defs.appendChild(grad); svg.appendChild(defs);

  // y gridlines + labels (0 .. 1)
  for (let i = 0; i <= 5; i++) {
    const s = i / 5, y = yOf(s);
    svg.appendChild(make('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: '#eee', 'stroke-width': 1 }));
    svg.appendChild(make('text', { x: X0 - 9, y: y + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#999', 'font-family': SERIF }, s.toFixed(1)));
  }
  // x ticks + labels
  [1, 4, 8, 12, 16].forEach(k => {
    const x = xOf(k);
    svg.appendChild(make('line', { x1: x, y1: Y1, x2: x, y2: Y1 + 5, stroke: '#cfcfcf', 'stroke-width': 1 }));
    svg.appendChild(make('text', { x: x, y: Y1 + 20, 'text-anchor': 'middle', 'font-size': 12, fill: '#999', 'font-family': SERIF }, String(k)));
  });
  // axes + titles
  svg.appendChild(make('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: '#cfcfcf', 'stroke-width': 1.4 }));
  svg.appendChild(make('line', { x1: X0, y1: Y1, x2: X1, y2: Y1, stroke: '#cfcfcf', 'stroke-width': 1.4 }));
  svg.appendChild(make('text', { x: (X0 + X1) / 2, y: 351, 'text-anchor': 'middle', 'font-size': 14, fill: '#555', 'font-family': SERIF }, 'Latent step k'));
  const ym = (Y0 + Y1) / 2;
  svg.appendChild(make('text', { x: 18, y: ym, 'text-anchor': 'middle', 'font-size': 16, fill: '#555', 'font-family': SERIF, 'font-style': 'italic', transform: 'rotate(-90 18 ' + ym + ')' }, 'σ'));

  // curve + per-step markers
  const curve = make('polyline', { fill: 'none', stroke: 'url(#sig-grad)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  svg.appendChild(curve);
  const markers = [];
  for (let k = 1; k <= N; k++) {
    const c = make('circle', { r: 3.4, fill: lerp(C_MAX, C_MIN, (k - 1) / (N - 1)) });
    svg.appendChild(c); markers.push(c);
  }
  // draggable endpoint knobs
  const knob = rgb => {
    const g = make('g', {}); g.style.cursor = 'ns-resize';
    g.appendChild(make('circle', { r: 18, fill: '#000', 'fill-opacity': 0, 'pointer-events': 'all' }));  // hit area
    g.appendChild(make('circle', { r: 11, fill: 'rgb(' + rgb.join(',') + ')', opacity: 0.18 }));
    g.appendChild(make('circle', { r: 7, fill: '#fff', stroke: 'rgb(' + rgb.join(',') + ')', 'stroke-width': 3 }));
    svg.appendChild(g); return g;
  };
  const knobMax = knob(C_MAX), knobMin = knob(C_MIN);
  const valMax = document.getElementById('sig-val-max'), valMin = document.getElementById('sig-val-min');

  // σ_min == σ_max -> ratio 1 -> flat line; σ_max == 0 -> all zeros (avoid 0/0).
  const sigma = k => (sMax <= 1e-9 ? 0 : sMax * Math.pow(sMin / sMax, (k - 1) / (N - 1)));
  function render() {
    let pts = '';
    for (let k = 1; k <= N; k++) {
      const x = xOf(k), y = yOf(sigma(k));
      pts += x + ',' + y + ' ';
      markers[k - 1].setAttribute('cx', x); markers[k - 1].setAttribute('cy', y);
    }
    curve.setAttribute('points', pts.trim());
    knobMax.setAttribute('transform', 'translate(' + xOf(1) + ',' + yOf(sMax) + ')');
    knobMin.setAttribute('transform', 'translate(' + xOf(N) + ',' + yOf(sMin) + ')');
    if (valMax) valMax.textContent = sMax.toFixed(2);
    if (valMin) valMin.textContent = sMin.toFixed(2);
  }

  // dragging (σ_min can't exceed σ_max; both clamped to [0,1])
  let dragging = null;
  const ptSigma = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return sOf(p.matrixTransform(svg.getScreenCTM().inverse()).y);
  };
  const move = e => {
    if (!dragging) return;
    e.preventDefault();
    const s = ptSigma(e);
    if (dragging === 'max') sMax = Math.max(sMin, s);
    else sMin = Math.min(sMax, s);
    render();
  };
  const up = () => {
    dragging = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
  const down = which => e => {
    dragging = which; e.preventDefault();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  knobMax.addEventListener('pointerdown', down('max'));
  knobMin.addEventListener('pointerdown', down('min'));

  render();
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
