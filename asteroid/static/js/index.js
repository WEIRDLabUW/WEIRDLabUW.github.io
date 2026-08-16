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
  initFigTimelineAutoHeight();
  initVizAutoHeight();
  initMethodPanelVariants();
  initAsteroidHop();
  initVideoVisibilityGate();
  initDropdownLazyLoad();
  initNearViewIframe('fig-timeline-frame', 1200);
});

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
  if (!('IntersectionObserver' in window)) return;
  var vids = [].slice.call(document.querySelectorAll('video[autoplay]'));
  if (!vids.length) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (v.paused) v.play().catch(function () {}); }
      else if (!v.paused) { v.pause(); }
    });
  }, { threshold: 0.1 });
  vids.forEach(function (v) { io.observe(v); });
  document.addEventListener('visibilitychange', function () {
    vids.forEach(function (v) {
      if (document.hidden) { if (!v.paused) v.pause(); }
      else { v.play().catch(function () {}); }
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
