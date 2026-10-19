document.addEventListener('DOMContentLoaded', function () {
  // Auto-advancing task carousel (Scaffolder-style)
  bulmaCarousel.attach('#task-carousel', {
    slidesToScroll: 1,
    slidesToShow: 4,
    infinite: true,
    loop: true,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    breakpoints: [
      { changePoint: 480, slidesToShow: 1, slidesToScroll: 1 },
      { changePoint: 768, slidesToShow: 2, slidesToScroll: 1 },
      { changePoint: 1024, slidesToShow: 2, slidesToScroll: 1 },
      { changePoint: 1408, slidesToShow: 3, slidesToScroll: 1 },
    ],
  });

  initRealWorldBarChart();
  initPerfBarChart();
  initTimelineZoom();
  initFigTimelineAutoHeight();
  initVizAutoHeight();
  initMethodPanelVariants();
  initAsteroidHop();
  initVideoVisibilityGate();
  initDropdownLazyLoad();
  initNearViewIframe('fig-timeline-frame', 1200);
  initPanelExpand();
});

// Summary panels expand on click: the card is translated+scaled to the viewport
// center (no reparenting, so embeds keep their state). Closes via the X button,
// a click on the backdrop, Esc, or following the panel's heading link.
function initPanelExpand() {
  var cards = [].slice.call(document.querySelectorAll('.asum-card'));
  if (!cards.length) return;
  var backdrop = document.createElement('div');
  backdrop.className = 'asum-backdrop';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'asum-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&#10005;';
  document.body.appendChild(backdrop);
  document.body.appendChild(closeBtn);
  var open = null;

  function place() {
    if (!open) return;
    // measure the untransformed box, then fit it into 92vw x 86vh
    var r = open.getBoundingClientRect(), t = open.style.transform;
    open.style.transition = 'none';
    open.style.transform = 'none';
    r = open.getBoundingClientRect();
    open.style.transform = t;
    void open.offsetWidth;
    open.style.transition = '';
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw * 0.92 / r.width, vh * 0.86 / r.height, 3);
    var dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
    open.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    var top = vh / 2 - r.height * s / 2, right = vw / 2 + r.width * s / 2;
    closeBtn.style.top = Math.max(8, top - 19) + 'px';
    closeBtn.style.left = Math.min(vw - 46, right - 19) + 'px';
  }

  function show(card) {
    if (open) return;
    open = card;
    card.classList.add('is-raised', 'is-open');
    backdrop.classList.add('is-on');
    closeBtn.classList.add('is-on');
    place();
  }

  function hide() {
    if (!open) return;
    var card = open;
    open = null;
    card.classList.remove('is-open');
    card.style.transform = '';
    backdrop.classList.remove('is-on');
    closeBtn.classList.remove('is-on');
    setTimeout(function () { if (open !== card) card.classList.remove('is-raised'); }, 400);
  }

  cards.forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', function (e) {
      if (e.target.closest('.asum-h a')) { hide(); return; }
      show(card);
    });
    card.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); show(card); }
    });
  });
  backdrop.addEventListener('click', hide);
  closeBtn.addEventListener('click', hide);
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') hide();
    else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) >= 0) e.preventDefault();
  });
  // lock page scroll while expanded (overflow:hidden would shift the layout
  // under the card by the scrollbar width)
  ['wheel', 'touchmove'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (open) e.preventDefault(); }, { passive: false });
  });
  window.addEventListener('resize', place);
}

// Dropdown (details) content loads only when opened: swap data-src -> src on
// the first toggle, so closed sections cost nothing.
function initDropdownLazyLoad() {
  [].forEach.call(document.querySelectorAll('details.dd'), function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      [].forEach.call(d.querySelectorAll('[data-src]'), function (el) {
        el.src = el.getAttribute('data-src');
        el.removeAttribute('data-src');
      });
    });
  });
}

// Only decode videos that are actually on screen: autoplaying videos pause when
// scrolled out of view and resume when they come back. Big win with a page full
// of rollout clips (smooth playback, no decoder pile-up on fast scroll).
function initVideoVisibilityGate() {
  // .lazy-play videos ship without the autoplay attribute so the browser never
  // downloads them eagerly; this observer is their only play trigger
  var vids = [].slice.call(document.querySelectorAll('video[autoplay], video.lazy-play'));
  if (!vids.length) return;
  if (!('IntersectionObserver' in window)) {
    vids.forEach(function (v) { v.play().catch(function () {}); });
    return;
  }
  var onScreen = new WeakSet();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { onScreen.add(v); if (v.paused) v.play().catch(function () {}); }
      else { onScreen.delete(v); if (!v.paused) v.pause(); }
    });
  }, { threshold: 0.01, rootMargin: '300px 0px' });
  vids.forEach(function (v) { io.observe(v); });
  document.addEventListener('visibilitychange', function () {
    vids.forEach(function (v) {
      if (document.hidden) { if (!v.paused) v.pause(); }
      else if (onScreen.has(v)) { v.play().catch(function () {}); }
    });
  });
}

// The exploration-visualization cards (peg / tactile) also report their height:
// their BC-baseline dropdown expands and collapses, so a fixed iframe height
// would clip or leave gaps.
function initVizAutoHeight() {
  ['fig-peg-frame', 'fig-tactile-frame', 'fig-compare-frame', 'fig-curves-frame', 'fig-procgen-frame', 'fig-habitat-frame', 'fig-ablations-frame', 'fig-nav-ablations-frame'].forEach(function (id) {
    var frame = document.getElementById(id);
    if (!frame) return;
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'lmp-figheight' && e.source === frame.contentWindow) {
        frame.style.height = e.data.height + 'px';
      }
    });
  });
}

// Hovering the ASTEROID panel in "One Task, Four Methods" offers a jump to the
// Method section's training-loop figure; clicking smooth-scrolls there and
// replays the loop from its first frame so the mechanism reads from the start.
function initAsteroidHop() {
  var hop = document.getElementById('asteroid-hop');
  var loop = document.getElementById('asteroid-loop');
  if (!hop || !loop) return;
  hop.addEventListener('click', function (ev) {
    ev.preventDefault();
    loop.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
      try { loop.contentWindow.postMessage({ type: 'lmp-replay' }, '*'); } catch (e) {}
    }, 650);
  });
}

// One Task, Four Methods: it is ONE task, so all three shuffled panels (BC, DAgger,
// ASTEROID) must agree on where the goal door is. The host picks one random order per
// page load and broadcasts it; each panel also self-randomizes when opened standalone.
function initMethodPanelVariants() {
  var frames = [].slice.call(document.querySelectorAll('iframe.lmp-figframe')).filter(function (f) {
    return /fig_(bc|dagger|dpt|asteroid)_embed/.test(f.getAttribute('src') || '');
  });
  if (!frames.length) return;
  var v = ['L', 'M', 'R'][Math.floor(Math.random() * 3)];
  frames.forEach(function (f) {
    var send = function () { try { f.contentWindow.postMessage({ type: 'lmp-variant', v: v }, '*'); } catch (e) {} };
    f.addEventListener('load', send);
    send();
  });

  // one master clock so all four panels replay at the same instant: longest animation (23s)
  // + 2s hold. Each panel drops its own interval once host pulses arrive; a panel that loads
  // late self-starts via its own observer, then locks onto the next shared pulse.
  var SYNC_MS = 25000;
  var syncAll = function () {
    frames.forEach(function (f) { try { f.contentWindow.postMessage({ type: 'lmp-sync' }, '*'); } catch (e) {} });
  };
  var started = false;
  var begin = function () { if (started) return; started = true; syncAll(); setInterval(syncAll, SYNC_MS); };
  var row = frames[0].closest('.columns') || frames[0];
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) begin(); });
    }, { threshold: 0.2 }).observe(row);
  } else { begin(); }
}

// The BC-vs-ASTEROID timeline figure reports its real rendered height via
// postMessage (its internal spacing changes over time, so a fixed
// aspect-ratio guess on the iframe kept breaking / clipping the controls).
function initFigTimelineAutoHeight() {
  var frame = document.getElementById('fig-timeline-frame');
  if (!frame) return;
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'lmp-figheight' && e.source === frame.contentWindow) {
      frame.style.height = e.data.height + 'px';
    }
  });
}

// Real-world success-rate bar chart (ASTEROID vs BC). Both rollout videos always
// play; hovering a bar (or a video itself) highlights that method and dims the other.
// Colors match METHOD_COLORS in all_videos/icml2026_plots/plot_main.py.
function initRealWorldBarChart() {
  var el = document.getElementById('rw-barchart');
  if (!el) return;
  var svgNS = 'http://www.w3.org/2000/svg';
  var W = 315, H = 270, PAD = { l: 45, r: 15, t: 14, b: 35 };
  var plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  var maxY = 0.72;
  var NAVY = '#003366', BLUE = '#1f77b4';
  var bars = [
    { label: 'ASTEROID', value: 0.60, color: NAVY },
    { label: 'BC', value: 0.20, color: BLUE }
  ];
  var n = bars.length, barW = plotW / n * 0.5, gap = plotW / n;

  var media = {
    ASTEROID: { video: document.getElementById('rw-video-asteroid'), label: document.getElementById('rw-label-asteroid') },
    BC: { video: document.getElementById('rw-video-bc'), label: document.getElementById('rw-label-bc') }
  };

  function setActive(name) {
    Object.keys(media).forEach(function (key) {
      var m = media[key], on = !name || key === name;
      m.video.style.opacity = on ? 1 : 0.2;
      m.video.style.boxShadow = (name && key === name) ? '0 0 0 3px ' + (key === 'ASTEROID' ? NAVY : BLUE) : 'none';
      m.label.style.opacity = on ? 1 : 0.2;
      if (m.bar) m.bar.style.opacity = on ? 1 : 0.2;
    });
    // mirror the highlight onto the BC/ASTEROID rows of the timeline figure (it keeps playing;
    // the figure only dims the non-matching row)
    var tf = document.getElementById('fig-timeline-frame');
    if (tf && tf.contentWindow) { try { tf.contentWindow.postMessage({ type: 'lmp-hl', method: name }, '*'); } catch (e) {} }
  }
  Object.keys(media).forEach(function (key) {
    var m = media[key];
    [m.video, m.label].forEach(function (node) {
      node.addEventListener('mouseenter', function () { setActive(key); });
      node.addEventListener('mouseleave', function () { setActive(null); });
    });
  });

  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.width = '100%'; svg.style.maxWidth = '315px'; svg.style.display = 'block';

  function yOf(v) { return PAD.t + plotH - (v / maxY) * plotH; }

  [0, 0.25, 0.5].forEach(function (f) {
    var y = yOf(f);
    var line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', PAD.l); line.setAttribute('x2', W - PAD.r);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e5e5e5'); line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  });

  var axisB = document.createElementNS(svgNS, 'line');
  axisB.setAttribute('x1', PAD.l); axisB.setAttribute('x2', W - PAD.r);
  axisB.setAttribute('y1', PAD.t + plotH); axisB.setAttribute('y2', PAD.t + plotH);
  axisB.setAttribute('stroke', '#999'); axisB.setAttribute('stroke-width', '1');
  svg.appendChild(axisB);

  bars.forEach(function (bar, i) {
    var x = PAD.l + gap * i + (gap - barW) / 2;
    var y = yOf(bar.value);
    var h = PAD.t + plotH - y;

    var rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', h);
    rect.setAttribute('rx', 3);
    rect.setAttribute('fill', bar.color);
    rect.style.cursor = 'pointer';
    rect.style.transition = 'opacity .15s';
    rect.addEventListener('mouseenter', function () { setActive(bar.label); });
    rect.addEventListener('mouseleave', function () { setActive(null); });
    svg.appendChild(rect);
    if (media[bar.label]) media[bar.label].bar = rect;

    var valueLabel = document.createElementNS(svgNS, 'text');
    valueLabel.setAttribute('x', x + barW / 2);
    valueLabel.setAttribute('y', y - 6);
    valueLabel.setAttribute('text-anchor', 'middle');
    valueLabel.setAttribute('font-family', "'Google Sans',sans-serif");
    valueLabel.setAttribute('font-size', '23');
    valueLabel.setAttribute('font-weight', '600');
    valueLabel.setAttribute('fill', bar.color);
    valueLabel.textContent = Math.round(bar.value * 100) + '%';
    svg.appendChild(valueLabel);

    var label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', x + barW / 2);
    label.setAttribute('y', PAD.t + plotH + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', "'Google Sans',sans-serif");
    label.setAttribute('font-size', '20');
    label.setAttribute('fill', '#444');
    label.textContent = bar.label;
    svg.appendChild(label);
  });

  el.appendChild(svg);
}

// Summary scoreboard: same content as the paper's Figure-1 bar panel -- all 11
// experiments (ASTEROID vs best baseline per task), grouped by suite, with real
// stderr whiskers where a per-task source exists (procgen embed / curves_data.js).
// Summary panels 3 and 4 render their embeds at a fixed natural layout width
// and zoom to whatever width the card actually has, so the internal layout
// (legend rows, chapter cards) is identical at every viewport and never
// overflows. mobileAt: below this card width the embed reverts to fluid 100%.
function initTimelineZoom() {
  [{ sel: '.asum-eff', natural: 430, mobileAt: 0 },
   { sel: '.asum-p2fit', natural: 430, mobileAt: 0 }].forEach(function (cfg) {
    var f = document.querySelector(cfg.sel);
    if (!f) return;
    var card = f.closest('.asum-card') || f.parentElement;
    function fit() {
      var cs = getComputedStyle(card);
      var w = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!w || w < 40) return;
      if (cfg.mobileAt && w < cfg.mobileAt) {
        f.style.width = '100%';
        f.style.zoom = 1;
      } else {
        f.style.width = cfg.natural + 'px';
        f.style.zoom = (w / cfg.natural).toFixed(4);
      }
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(card);
    window.addEventListener('resize', fit);
    fit();
  });
}

function initPerfBarChart() {
  var el = document.getElementById('perf-barchart');
  if (!el) return;
  var svgNS = 'http://www.w3.org/2000/svg';
  var NAVY = '#003366', GRAY = '#b8b8b8';
  // order: DR-Easy, DR-Hard, KD-M, KD-NM, 2DNav | Maze, Ant, Habitat | Tact, Peg, Real
  var OURS = [0.97, 0.81, 0.97, 0.99, 0.97, 0.99, 0.73, 0.70, 0.94, 0.78, 0.60];
  var BEST = [0.50, 0.13, 0.72, 0.95, 0.41, 0.76, 0.02, 0.25, 0.56, 0.47, 0.20];
  var OURS_SE = [0, 0, 0, 0, 0, 0.0035, 0, 0, 0.0191, 0.0441, 0];
  var BEST_SE = [0, 0, 0, 0, 0, 0, 0, 0, 0.0549, 0.0167, 0];
  var GROUPS = [['Meta-Learning', 0, 5], ['Navigation', 5, 8], ['Robot Manipulation', 8, 11]];

  var W = 430, H = 223, PAD = { l: 42, r: 4, t: 12, b: 30 };
  var plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  // group gap = one extra slot between suites (mirrors the teaser figure)
  var nSlots = OURS.length + GROUPS.length - 1;
  var slot = plotW / nSlots, barW = slot * 0.40;
  function slotX(i) {
    var extra = 0;
    GROUPS.forEach(function (g, gi) { if (gi > 0 && i >= g[1]) extra += 1; });
    return PAD.l + slot * (i + extra) + slot / 2;
  }

  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.width = '100%'; svg.style.display = 'block';

  function yOf(v) { return PAD.t + plotH - v * plotH; }
  [0, 0.5, 1.0].forEach(function (f) {
    var y = yOf(f);
    var gl = document.createElementNS(svgNS, 'line');
    gl.setAttribute('x1', PAD.l); gl.setAttribute('x2', W - PAD.r);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.setAttribute('stroke', '#e5e5e5'); gl.setAttribute('stroke-width', 1);
    svg.appendChild(gl);
    var tk = document.createElementNS(svgNS, 'text');
    tk.setAttribute('x', PAD.l - 7); tk.setAttribute('y', y + 4);
    tk.setAttribute('text-anchor', 'end');
    tk.setAttribute('font-family', "'Google Sans',sans-serif");
    tk.setAttribute('font-size', 12); tk.setAttribute('fill', '#737373');
    tk.textContent = f === 0 ? '0' : f.toFixed(1);
    svg.appendChild(tk);
  });
  var axisB = document.createElementNS(svgNS, 'line');
  axisB.setAttribute('x1', PAD.l); axisB.setAttribute('x2', W - PAD.r);
  axisB.setAttribute('y1', PAD.t + plotH); axisB.setAttribute('y2', PAD.t + plotH);
  axisB.setAttribute('stroke', '#999'); axisB.setAttribute('stroke-width', 1);
  svg.appendChild(axisB);

  function bar(x, val, se, color) {
    var y = yOf(val), h = PAD.t + plotH - y;
    var rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', h);
    rect.setAttribute('rx', 1.5); rect.setAttribute('fill', color);
    svg.appendChild(rect);
    if (se > 0) {
      var e = document.createElementNS(svgNS, 'line');
      e.setAttribute('x1', x + barW / 2); e.setAttribute('x2', x + barW / 2);
      e.setAttribute('y1', yOf(Math.min(val + se, 1))); e.setAttribute('y2', yOf(val - se));
      e.setAttribute('stroke', '#555'); e.setAttribute('stroke-width', 1.4); e.setAttribute('opacity', 0.45);
      svg.appendChild(e);
    }
  }

  OURS.forEach(function (v, i) {
    var cx = slotX(i);
    bar(cx - barW - 0.8, v, OURS_SE[i], NAVY);
    bar(cx + 0.8, BEST[i], BEST_SE[i], GRAY);
  });

  GROUPS.forEach(function (g) {
    var gx = (slotX(g[1]) + slotX(g[2] - 1)) / 2;
    gx = Math.min(gx, W - 62);   // keep the last (widest) label inside the svg
    var lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', gx); lbl.setAttribute('y', PAD.t + plotH + 22);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', "'Google Sans',sans-serif");
    lbl.setAttribute('font-size', 13); lbl.setAttribute('fill', '#444');
    lbl.textContent = g[0];
    svg.appendChild(lbl);
  });

  var yl = document.createElementNS(svgNS, 'text');
  yl.setAttribute('transform', 'translate(13,' + (PAD.t + plotH / 2) + ') rotate(-90)');
  yl.setAttribute('text-anchor', 'middle');
  yl.setAttribute('font-family', "'Google Sans',sans-serif");
  yl.setAttribute('font-size', 13.5); yl.setAttribute('fill', '#55525e');
  yl.textContent = 'normalized return';
  svg.appendChild(yl);

  el.appendChild(svg);
}


// Load a heavy iframe when it approaches the viewport (margin px early), so its
// boot cost is paid before the user arrives instead of mid-scroll.
function initNearViewIframe(id, margin) {
  var f = document.getElementById(id);
  if (!f || !f.getAttribute('data-src')) return;
  function load() {
    if (!f.getAttribute('data-src')) return;
    f.src = f.getAttribute('data-src');
    f.removeAttribute('data-src');
  }
  if (!('IntersectionObserver' in window)) { load(); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { load(); io.disconnect(); } });
  }, { rootMargin: margin + 'px 0px' });
  io.observe(f);
}
