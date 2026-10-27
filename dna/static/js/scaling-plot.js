// Scaling-with-the-underlying-VLM scatter plot (#scaling).
(function () {
  // Data + colors verbatim from the paper's scaling-plot generation script (COLORS dict).
  var families = [
    {
      key: 'gemini', label: 'D&A (Gemini)', shortLabel: 'Gemini', symbol: 'circle', color: '#D81B60',
      models: {
        'gemini-2.5-flash-lite': { kendall: 0.321, cost: 0.40, display: 'Gemini 2.5 Flash-Lite' },
        'gemini-2.5-flash': { kendall: 0.386, cost: 2.50, display: 'Gemini 2.5 Flash' },
        'gemini-3.1-flash-lite': { kendall: 0.522, cost: 1.50, display: 'Gemini 3.1 Flash-Lite' },
        'gemini-3-flash': { kendall: 0.576, cost: 3.00, display: 'Gemini 3 Flash' },
        'gemini-3.5-flash': { kendall: 0.535, cost: 9.00, display: 'Gemini 3.5 Flash' },
        'gemini-3.1-pro': { kendall: 0.531, cost: 12.00, display: 'Gemini 3.1 Pro' },
        'gemini-robotics-er-1.6': { kendall: 0.629, cost: 12.00, display: 'Gemini Robotics-ER 1.6' },
        'gemini-4-argon': { kendall: 0.734, cost: 20.00, display: 'Gemini 4 Argon' }
      }
    },
    {
      key: 'gpt', label: 'D&A (GPT)', shortLabel: 'GPT', symbol: 'triangle-up', color: '#007D68',
      models: {
        'gpt-4.1-mini': { kendall: 0.439, cost: 1.60, display: 'GPT-4.1 Mini' },
        'gpt-5-mini': { kendall: 0.307, cost: 2.00, display: 'GPT-5 Mini' },
        'gpt-5.4-nano': { kendall: 0.275, cost: 1.25, display: 'GPT-5.4 Nano' },
        'gpt-5.4-mini': { kendall: 0.453, cost: 4.50, display: 'GPT-5.4 Mini' },
        'gpt-5.4': { kendall: 0.617, cost: 15.00, display: 'GPT-5.4' },
        'gpt-5.5': { kendall: 0.577, cost: 30.00, display: 'GPT-5.5' },
        'gpt-5.6-sol': { kendall: 0.639, cost: 30, display: 'GPT-5.6 Sol' },
        'gpt-5.6-terra': { kendall: 0.520, cost: 15, display: 'GPT-5.6 Terra' },
        'gpt-5.6-luna': { kendall: 0.494, cost: 6, display: 'GPT-5.6 Luna' },
        'gpt-6-astra': { kendall: 0.714, cost: 50, display: 'GPT-6 Astra' }
      }
    },
    {
      key: 'claude', label: 'D&A (Claude)', shortLabel: 'Claude', symbol: 'diamond', color: '#d97757',
      models: {
        'Fable 5': { kendall: 0.519, cost: 50 },
        'Opus 5': { kendall: 0.465, cost: 25 },
        'Sonnet 5': { kendall: 0.285, cost: 10 }
      }
    },
    {
      key: 'muse', label: 'D&A (Muse Spark)', shortLabel: 'Muse Spark', symbol: 'square', color: '#0082FB',
      models: { 'Muse Spark 1.1': { kendall: 0.588, cost: 4.25 } }
    },
    {
      key: 'kimi', label: 'D&A (Kimi)', shortLabel: 'Kimi', symbol: 'star', color: '#000000',
      models: { 'Kimi K3': { kendall: 0.554, cost: 15 } }
    },
    {
      key: 'qwen', label: 'D&A (Qwen)', shortLabel: 'Qwen', symbol: 'x', color: '#615CED',
      models: {
        'Qwen3-VL 8B Instruct': { kendall: 0.175, cost: 0.45 },
        'Qwen3.6 27B': { kendall: 0.404, cost: 2.00 },
        'Qwen3.6 Plus': { kendall: 0.583, cost: 1.95 },
        'Qwen3.7 Plus': { kendall: 0.560, cost: 1.28 }
      }
    }
  ];

  var baselines = [
    { name: 'GVL (Gemini 3 Flash)', kendall: 0.273, cost: 0.3, color: '#7F8C8D' },
    { name: 'GVL (GPT-6 Astra)', kendall: 0.413, cost: 0.3, color: '#7F8C8D' },
    { name: 'TOPReward (Qwen3-VL 8B Instruct)', kendall: 0.202, cost: 0.3, color: '#9467BD' },
    { name: 'TOPReward (Qwen3.6 27B)', kendall: -0.041, cost: 0.3, color: '#9467BD' },
    { name: 'SOLE-R1', kendall: 0.359, cost: 0.3, color: '#17BECF' },
    { name: 'Robometer-4B', kendall: 0.648, cost: 0.3, color: '#FF7F0E' },
    { name: 'RoboReward-4B', kendall: 0.536, cost: 0.3, color: '#FCBF07' },
    { name: 'RoboReward-8B', kendall: 0.463, cost: 0.3, color: '#FCBF07' },
    { name: 'RynnValue-4B', kendall: 0.670, cost: 0.3, color: '#8C564B' },
    { name: 'RynnValue-8B', kendall: 0.675, cost: 0.3, color: '#8C564B' }
  ];

  // Per-family log-linear regression (least squares on log10(cost)) — needs >= 2 points.
  families.forEach(function (f) {
    var names = Object.keys(f.models);
    var xs = names.map(function (n) { return Math.log10(f.models[n].cost); });
    var ys = names.map(function (n) { return f.models[n].kendall; });
    var n = xs.length;
    if (n < 2) { f.trend = null; return; }
    var sumX = xs.reduce(function (a, b) { return a + b; }, 0);
    var sumY = ys.reduce(function (a, b) { return a + b; }, 0);
    var sumXY = xs.reduce(function (a, x, i) { return a + x * ys[i]; }, 0);
    var sumXX = xs.reduce(function (a, x) { return a + x * x; }, 0);
    var denom = n * sumXX - sumX * sumX;
    if (denom === 0) { f.trend = null; return; }
    var slope = (n * sumXY - sumX * sumY) / denom;
    var intercept = (sumY - slope * sumX) / n;
    var costs = xs.map(function (v) { return Math.pow(10, v); });
    f.trend = {
      slope: slope, intercept: intercept,
      xMin: Math.min.apply(null, costs), xMax: Math.max.apply(null, costs)
    };
  });

  var FULL_X = [0.25, 60];
  var FULL_Y = [-0.1, 0.76];

  // ---- SVG geometry: 1 SVG unit = 1 CSS px, recomputed from the container width ----
  var W = 920, H = 560;
  var PAD = { l: 62, r: 26, t: 28, b: 56 };
  var plotL, plotR, plotT, plotB;
  var compact = false;       // narrow container: no name labels, tap to inspect
  var MARKER_R = 9;

  var wrap = document.querySelector('.chart-plot-wrap');
  var svg = document.getElementById('scaling-svg');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function layout() {
    W = Math.max(200, Math.min(920, Math.round(wrap.clientWidth) || 920));
    compact = W < 600;
    H = Math.round(compact ? Math.max(W * 0.95, 300) : W * 0.61);
    PAD = compact ? { l: 46, r: 12, t: 28, b: 52 } : { l: 62, r: 26, t: 28, b: 56 };
    MARKER_R = compact ? 8 : 9;
    plotL = PAD.l; plotR = W - PAD.r; plotT = PAD.t; plotB = H - PAD.b;
  }
  layout();

  var domain = { x: FULL_X.slice(), y: FULL_Y.slice() };
  function isZoomed() {
    return domain.x[0] !== FULL_X[0] || domain.x[1] !== FULL_X[1] || domain.y[0] !== FULL_Y[0] || domain.y[1] !== FULL_Y[1];
  }

  function xPix(cost, dom) {
    dom = dom || domain;
    var lo = Math.log10(dom.x[0]), hi = Math.log10(dom.x[1]);
    return plotL + (Math.log10(cost) - lo) / (hi - lo) * (plotR - plotL);
  }
  function yPix(k, dom) {
    dom = dom || domain;
    return plotB - (k - dom.y[0]) / (dom.y[1] - dom.y[0]) * (plotB - plotT);
  }
  function xInv(px) {
    var lo = Math.log10(domain.x[0]), hi = Math.log10(domain.x[1]);
    return Math.pow(10, lo + (px - plotL) / (plotR - plotL) * (hi - lo));
  }
  function yInv(py) {
    return domain.y[0] + (plotB - py) / (plotB - plotT) * (domain.y[1] - domain.y[0]);
  }
  function inDomain(cost, k) {
    return cost >= domain.x[0] && cost <= domain.x[1] && k >= domain.y[0] && k <= domain.y[1];
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function niceYTicks(min, max, count) {
    var rough = (max - min) / count;
    var mag = Math.pow(10, Math.floor(Math.log10(rough)));
    var norm = rough / mag, step;
    if (norm < 1.5) step = 1; else if (norm < 3) step = 2; else if (norm < 7) step = 5; else step = 10;
    step *= mag;
    var start = Math.ceil(min / step) * step;
    var ticks = [];
    for (var v = start; v <= max + step * 1e-6; v += step) ticks.push(Math.round(v * 1000) / 1000);
    return ticks;
  }

  var X_TICK_CANDIDATES = [0.25, 0.5, 1, 2, 3, 5, 10, 20, 30, 50, 60];
  var X_TICK_CANDIDATES_COMPACT = [0.5, 2, 10, 50];

  function xTickLabel(t) {
    if (t < 1) return t.toFixed(2);
    return '$' + (Math.abs(t - Math.round(t)) < 0.05 ? Math.round(t) : t.toFixed(t < 10 ? 1 : 0));
  }

  function xTickValues() {
    var cands = compact ? X_TICK_CANDIDATES_COMPACT : X_TICK_CANDIDATES;
    var ticks = cands.filter(function (v) { return v >= domain.x[0] && v <= domain.x[1]; });
    if (ticks.length < 2) {
      // zoomed into a narrow cost band: evenly spaced log ticks so the axis never loses its scale
      var lo = Math.log10(domain.x[0]), hi = Math.log10(domain.x[1]);
      ticks = [];
      for (var i = 0; i < 4; i++) ticks.push(Math.pow(10, lo + (i + 0.5) * (hi - lo) / 4));
      ticks = ticks.map(function (v) { return Math.round(v * 100) / 100; });
    }
    return ticks;
  }

  // Label color for text on a data-colored fill: black or white by luminance.
  function onColor(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) > 0.179 ? '#000' : '#fff';
  }

  // ---- marker shapes --------------------------------------------------
  function starPath(outerR, innerR) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? outerR : innerR;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2));
    }
    return 'M ' + pts.join(' L ') + ' Z';
  }

  // Legend swatch glyphs (halo color comes from the .mk-halo class, i.e. a token)
  function makeMarker(symbol, color, size) {
    var g = svgEl('g', {});
    var s = size || 6;
    if (symbol === 'circle') {
      g.appendChild(svgEl('circle', { class: 'mk-halo', r: s, fill: color, 'stroke-width': 1.5 }));
    } else if (symbol === 'triangle-up') {
      g.appendChild(svgEl('path', {
        class: 'mk-halo',
        d: 'M 0,' + (-s * 1.15) + ' L ' + (s * 1.0) + ',' + (s * 0.75) + ' L ' + (-s * 1.0) + ',' + (s * 0.75) + ' Z',
        fill: color, 'stroke-width': 1.5, 'stroke-linejoin': 'round'
      }));
    } else if (symbol === 'diamond') {
      g.appendChild(svgEl('path', {
        class: 'mk-halo',
        d: 'M 0,' + (-s * 1.15) + ' L ' + (s * 1.15) + ',0 L 0,' + (s * 1.15) + ' L ' + (-s * 1.15) + ',0 Z',
        fill: color, 'stroke-width': 1.5, 'stroke-linejoin': 'round'
      }));
    } else if (symbol === 'square') {
      g.appendChild(svgEl('rect', {
        class: 'mk-halo',
        x: -s * 0.85, y: -s * 0.85, width: s * 1.7, height: s * 1.7,
        fill: color, 'stroke-width': 1.5
      }));
    } else if (symbol === 'star') {
      g.appendChild(svgEl('path', {
        class: 'mk-halo',
        d: starPath(s * 1.15, s * 0.5),
        fill: color, 'stroke-width': 1.2, 'stroke-linejoin': 'round'
      }));
    } else if (symbol === 'cross') {
      g.appendChild(svgEl('path', {
        d: 'M ' + (-s * 0.8) + ',' + (-s * 0.8) + ' L ' + (s * 0.8) + ',' + (s * 0.8) +
           ' M ' + (-s * 0.8) + ',' + (s * 0.8) + ' L ' + (s * 0.8) + ',' + (-s * 0.8),
        stroke: color, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none'
      }));
    }
    return g;
  }

  // Real provider logos (downloaded from capgym.github.io/assets/logos/,
  // which are the actual official brand PNGs) where we have one; a
  // colored monogram circle as a fallback for providers we don't have a
  // verified logo for (currently just Muse Spark).
  var PROVIDER_LOGOS = {
    gemini: './static/images/logo_google.png',
    gpt: './static/images/logo_openai.png',
    claude: './static/images/logo_anthropic.png',
    kimi: './static/images/logo_kimi.png',
    qwen: './static/images/logo_qwen.png',
    // drop the official Muse mark at this path to replace the "MU" monogram
    muse: './static/images/logo_meta.png'
  };

  // a missing logo file falls back to the monogram instead of drawing an empty disc
  var logoMissing = {};
  Object.keys(PROVIDER_LOGOS).forEach(function (key) {
    var probe = new Image();
    probe.onerror = function () { logoMissing[key] = true; if (typeof render === 'function') render(); };
    probe.src = PROVIDER_LOGOS[key];
  });

  // A "model badge" marker for the plot itself, after capgym's own style:
  // white circle, a stroke ring in the family's color, the provider's
  // real logo clipped inside (falling back to a colored monogram circle
  // when we don't have a verified logo), used in place of a plain shape.
  // The white disc is the logo's plate, so it stays white in every theme.
  function makeModelMarker(familyKey, monogramText, color, r) {
    var g = svgEl('g', {});
    var logoSrc = logoMissing[familyKey] ? null : PROVIDER_LOGOS[familyKey];
    if (logoSrc) {
      g.appendChild(svgEl('circle', { r: r, fill: '#fff', stroke: color, 'stroke-width': 1.75 }));
      var img = svgEl('image', {
        href: logoSrc, x: -r * 0.8, y: -r * 0.8, width: r * 1.6, height: r * 1.6,
        'clip-path': 'url(#model-icon-clip)', preserveAspectRatio: 'xMidYMid slice'
      });
      g.appendChild(img);
    } else {
      g.appendChild(svgEl('circle', { class: 'mk-halo', r: r, fill: color, 'stroke-width': 1.5 }));
      var t = svgEl('text', {
        class: 'mk-monogram', x: 0, y: r * 0.32, 'text-anchor': 'middle', 'font-size': r * 0.95, 'font-weight': 800
      });
      t.textContent = monogramText;
      g.appendChild(t);
    }
    return g;
  }

  // ---- state: which series are toggled on ---------------------------
  var active = {};
  families.forEach(function (f) { active['family:' + f.key] = true; });
  baselines.forEach(function (b) { active['baseline:' + b.name] = true; });
  function anyActive() { return Object.keys(active).some(function (k) { return active[k]; }); }

  // ---- tooltip (hover with a mouse, tap on touch) ---------------------
  var tooltip = document.getElementById('scaling-tooltip');
  function showTooltip(clientX, clientY, rows, color) {
    var wrapRect = wrap.getBoundingClientRect();
    tooltip.style.borderLeft = '3px solid ' + (color || 'var(--border-strong)');
    tooltip.textContent = '';
    rows.forEach(function (row, i) {
      if (i > 0) tooltip.appendChild(document.createElement('br'));
      var el = document.createElement(i === 0 ? 'strong' : 'span');
      el.textContent = row;
      tooltip.appendChild(el);
    });
    tooltip.hidden = false;
    // keep the (centered) tooltip inside the plot wrap
    var half = tooltip.offsetWidth / 2;
    var left = Math.max(half, Math.min(wrapRect.width - half, clientX - wrapRect.left));
    var top = clientY - wrapRect.top - 10;
    if (top < tooltip.offsetHeight) top = clientY - wrapRect.top + tooltip.offsetHeight + 24;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  function hideTooltip() { tooltip.hidden = true; }

  function pointRows(m, displayName) {
    return [displayName, '$' + m.cost.toFixed(2) + ' / 1M output tok', 'Kendall τ_α = ' + m.kendall.toFixed(3)];
  }

  // ---- render -----------------------------------------------------------
  var inspectables = [];   // visible points/baselines, for tap-to-inspect
  var selectionRect = svgEl('rect', { class: 'sc-selection', visibility: 'hidden' });

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function render() {
    svg.textContent = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    inspectables = [];

    var clipId = 'scaling-clip';
    var defs = svgEl('defs', {});
    var clipPath = svgEl('clipPath', { id: clipId });
    clipPath.appendChild(svgEl('rect', { x: plotL, y: plotT - 12, width: plotR - plotL, height: plotB - plotT + 12 }));
    defs.appendChild(clipPath);
    var iconClip = svgEl('clipPath', { id: 'model-icon-clip' });
    iconClip.appendChild(svgEl('circle', { r: MARKER_R * 0.8 }));
    defs.appendChild(iconClip);
    svg.appendChild(defs);

    function text(cls, attrs, str) {
      attrs['class'] = cls;
      var t = svgEl('text', attrs);
      t.textContent = str;
      return t;
    }

    // y gridlines + labels
    niceYTicks(domain.y[0], domain.y[1], compact ? 5 : 6).forEach(function (t) {
      var py = yPix(t);
      svg.appendChild(svgEl('line', { class: 'sc-grid', x1: plotL, x2: plotR, y1: py, y2: py }));
      svg.appendChild(text('sc-tick', { x: plotL - 8, y: py, 'text-anchor': 'end', 'dominant-baseline': 'central' }, t.toFixed(2)));
    });

    // x ticks + labels
    xTickValues().forEach(function (t) {
      var px = xPix(t);
      svg.appendChild(svgEl('line', { class: 'sc-axis', x1: px, x2: px, y1: plotB, y2: plotB + 5 }));
      svg.appendChild(text('sc-tick', { x: px, y: plotB + 20, 'text-anchor': 'middle' }, xTickLabel(t)));
    });
    svg.appendChild(svgEl('line', { class: 'sc-axis', x1: plotL, x2: plotR, y1: plotB, y2: plotB }));

    // axis titles: the y title sits horizontally above the plot (no rotated text)
    svg.appendChild(text('sc-axis-title', { x: 2, y: 14 }, 'Kendall τ_α (RBM-EVAL-OOD, final step)'));
    svg.appendChild(text('sc-axis-title', { x: (plotL + plotR) / 2, y: H - 8, 'text-anchor': 'middle' },
      'Cost per 1M output tokens (USD, log scale)'));

    if (!anyActive()) {
      svg.appendChild(text('sc-empty', { x: (plotL + plotR) / 2, y: (plotT + plotB) / 2, 'text-anchor': 'middle' },
        'No series selected'));
      svg.appendChild(text('sc-tick', { x: (plotL + plotR) / 2, y: (plotT + plotB) / 2 + 22, 'text-anchor': 'middle' },
        'Use the chips below the plot to show one.'));
      svg.appendChild(selectionRect);
      return;
    }

    // clipped data group
    var dataG = svgEl('g', { 'clip-path': 'url(#' + clipId + ')' });
    svg.appendChild(dataG);

    // baselines: secondary marks (thin dashed lines)
    baselines.forEach(function (b) {
      if (!active['baseline:' + b.name]) return;
      var py = yPix(b.kendall);
      dataG.appendChild(svgEl('line', {
        class: 'sc-baseline', x1: plotL, x2: plotR, y1: py, y2: py, stroke: b.color
      }));
      var hit = svgEl('line', { class: 'sc-hit', x1: plotL, x2: plotR, y1: py, y2: py });
      hit.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || dragState) return;
        showTooltip(e.clientX, e.clientY, [b.name, 'Kendall τ_α = ' + b.kendall.toFixed(3)], b.color);
      });
      hit.addEventListener('pointerleave', hideTooltip);
      dataG.appendChild(hit);
      if (py >= plotT && py <= plotB) inspectables.push({ kind: 'line', py: py, rows: [b.name, 'Kendall τ_α = ' + b.kendall.toFixed(3)], color: b.color });
    });

    // per-family D&A trend lines: primary marks, drawn under the points
    families.forEach(function (f) {
      if (!active['family:' + f.key] || !f.trend) return;
      var tx1 = Math.max(f.trend.xMin, domain.x[0]), tx2 = Math.min(f.trend.xMax, domain.x[1]);
      if (tx2 <= tx1) return;
      var ty1 = f.trend.slope * Math.log10(tx1) + f.trend.intercept;
      var ty2 = f.trend.slope * Math.log10(tx2) + f.trend.intercept;
      dataG.appendChild(svgEl('line', {
        class: 'sc-trend', x1: xPix(tx1), x2: xPix(tx2), y1: yPix(ty1), y2: yPix(ty2), stroke: f.color
      }));
    });

    // D&A family points
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var visible = [];     // { f, m, name, displayName, cx, cy }
    families.forEach(function (f) {
      if (!active['family:' + f.key]) return;
      Object.keys(f.models).forEach(function (name) {
        var m = f.models[name];
        if (!inDomain(m.cost, m.kendall)) return;
        var displayName = m.display || name;
        var cx = xPix(m.cost), cy = yPix(m.kendall);
        visible.push({ f: f, m: m, name: name, displayName: displayName, cx: cx, cy: cy });
        var g = svgEl('g', { transform: 'translate(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ')' });
        g.appendChild(makeModelMarker(f.key, monogram(f.shortLabel), f.color, MARKER_R));
        var hit = svgEl('circle', { class: 'sc-hit', r: coarse ? 22 : 13 });
        hit.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse' || dragState) return;
          showTooltip(e.clientX, e.clientY, pointRows(m, displayName), f.color);
        });
        hit.addEventListener('pointerleave', hideTooltip);
        g.appendChild(hit);
        dataG.appendChild(g);
        inspectables.push({ kind: 'point', cx: cx, cy: cy, rows: pointRows(m, displayName), color: f.color });
      });
    });

    // ---- labels (wide plots only; narrow plots rely on tap + legend + the data table) ----
    if (!compact) {
      var labelsLayer = svgEl('g', {});
      svg.appendChild(labelsLayer);
      var placed = [];

      // baseline names at the left edge, stacked top-to-bottom so near-equal values don't overprint
      var baseLabels = [];
      baselines.forEach(function (b) {
        if (!active['baseline:' + b.name]) return;
        if (b.kendall < domain.y[0] || b.kendall > domain.y[1]) return;
        baseLabels.push({ b: b, py: yPix(b.kendall) });
      });
      baseLabels.sort(function (a, c) { return a.py - c.py; });
      var lastLabelY = -Infinity;
      baseLabels.forEach(function (item) {
        var y = Math.max(item.py - 9, lastLabelY + 16);
        lastLabelY = y;
        var lbl = text('sc-label is-baseline', { x: plotL + 6, y: y, 'text-anchor': 'start', 'dominant-baseline': 'central' }, item.b.name);
        labelsLayer.appendChild(lbl);
        var bb = lbl.getBBox();
        placed.push({ x: bb.x - 2, y: bb.y - 1, width: bb.width + 4, height: bb.height + 2 });
      });

      // markers are obstacles too
      visible.forEach(function (v) {
        placed.push({ x: v.cx - MARKER_R - 1, y: v.cy - MARKER_R - 1, width: 2 * MARKER_R + 2, height: 2 * MARKER_R + 2 });
      });

      // permanent labels: the best model of each family (every visible point once zoomed in)
      var toLabel = [];
      if (isZoomed()) {
        toLabel = visible.slice().sort(function (a, c) { return c.m.kendall - a.m.kendall; });
      } else {
        families.forEach(function (f) {
          var best = null;
          visible.forEach(function (v) { if (v.f === f && (!best || v.m.kendall > best.m.kendall)) best = v; });
          if (best) toLabel.push(best);
        });
        toLabel.sort(function (a, c) { return c.m.kendall - a.m.kendall; });
      }
      var R = MARKER_R;
      toLabel.forEach(function (v, idx) {
        var forced = !isZoomed();   // at full view the family-best labels always appear
        var positions = [
          { x: v.cx, y: v.cy + R + 12, anchor: 'middle' },
          { x: v.cx, y: v.cy - R - 6, anchor: 'middle' },
          { x: v.cx + R + 6, y: v.cy + 4, anchor: 'start' },
          { x: v.cx - R - 6, y: v.cy + 4, anchor: 'end' },
          { x: v.cx + R, y: v.cy + R + 12, anchor: 'start' },
          { x: v.cx - R, y: v.cy + R + 12, anchor: 'end' },
          { x: v.cx + R, y: v.cy - R - 6, anchor: 'start' },
          { x: v.cx - R, y: v.cy - R - 6, anchor: 'end' },
          { x: v.cx, y: v.cy + R + 28, anchor: 'middle' },
          { x: v.cx, y: v.cy - R - 22, anchor: 'middle' }
        ];
        var lbl = text('sc-label', { x: 0, y: 0 }, v.displayName);
        labelsLayer.appendChild(lbl);
        var chosen = null, fallback = null, fallbackArea = Infinity;
        for (var i = 0; i < positions.length; i++) {
          var p = positions[i];
          lbl.setAttribute('x', p.x); lbl.setAttribute('y', p.y); lbl.setAttribute('text-anchor', p.anchor);
          var bb = lbl.getBBox();
          var box = { x: bb.x - 2, y: bb.y - 1, width: bb.width + 4, height: bb.height + 2 };
          var inside = box.x >= plotL - 4 && box.x + box.width <= plotR + 2 && box.y >= plotT - 12 && box.y + box.height <= plotB + 2;
          if (!inside) continue;
          var area = 0;
          placed.forEach(function (o) {
            var w = Math.min(o.x + o.width, box.x + box.width) - Math.max(o.x, box.x);
            var h = Math.min(o.y + o.height, box.y + box.height) - Math.max(o.y, box.y);
            if (w > 0 && h > 0) area += w * h;
          });
          if (area === 0) { chosen = { p: p, box: box }; break; }
          if (area < fallbackArea) { fallbackArea = area; fallback = { p: p, box: box }; }
        }
        if (!chosen && forced && fallback) chosen = fallback;
        if (!chosen) { labelsLayer.removeChild(lbl); return; }
        lbl.setAttribute('x', chosen.p.x); lbl.setAttribute('y', chosen.p.y); lbl.setAttribute('text-anchor', chosen.p.anchor);
        placed.push(chosen.box);
      });
    }

    // selection-drag overlay rect (kept on top, populated by drag handlers)
    svg.appendChild(selectionRect);
  }

  // ---- drag-to-zoom (mouse/pen only) ----------------------------------
  var resetBtn = document.getElementById('scaling-reset-zoom');
  var dragState = null;

  function clientToViewBox(evt) {
    var rect = svg.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (W / rect.width),
      y: (evt.clientY - rect.top) * (H / rect.height)
    };
  }

  // Touch: a tap inspects the nearest point (within ~24px) or baseline line; the page keeps scrolling.
  function inspectNearest(evt) {
    var p = clientToViewBox(evt);
    var best = null, bestD = 24;
    inspectables.forEach(function (it) {
      if (it.kind !== 'point') return;
      var d = Math.hypot(it.cx - p.x, it.cy - p.y);
      if (d < bestD) { bestD = d; best = it; }
    });
    if (!best && p.x >= plotL && p.x <= plotR) {
      var bestL = 14;
      inspectables.forEach(function (it) {
        if (it.kind !== 'line') return;
        var d = Math.abs(it.py - p.y);
        if (d < bestL) { bestL = d; best = it; }
      });
    }
    if (best) showTooltip(evt.clientX, evt.clientY, best.rows, best.color); else hideTooltip();
  }

  function cancelDrag() {
    dragState = null;
    selectionRect.setAttribute('visibility', 'hidden');
  }

  svg.addEventListener('pointerdown', function (evt) {
    if (evt.pointerType !== 'mouse') { inspectNearest(evt); return; }
    if (evt.button !== 0) return;
    var p = clientToViewBox(evt);
    if (p.x < plotL || p.x > plotR || p.y < plotT || p.y > plotB) return;
    dragState = { x0: p.x, y0: p.y };
    svg.setPointerCapture(evt.pointerId);
  });

  svg.addEventListener('pointermove', function (evt) {
    if (!dragState) return;
    hideTooltip();
    var p = clientToViewBox(evt);
    var x0 = Math.max(plotL, Math.min(dragState.x0, p.x));
    var x1 = Math.min(plotR, Math.max(dragState.x0, p.x));
    var y0 = Math.max(plotT, Math.min(dragState.y0, p.y));
    var y1 = Math.min(plotB, Math.max(dragState.y0, p.y));
    selectionRect.setAttribute('x', x0);
    selectionRect.setAttribute('y', y0);
    selectionRect.setAttribute('width', Math.max(0, x1 - x0));
    selectionRect.setAttribute('height', Math.max(0, y1 - y0));
    selectionRect.setAttribute('visibility', 'visible');
  });

  svg.addEventListener('pointerup', function (evt) {
    if (!dragState) return;
    var p = clientToViewBox(evt);
    var dx = Math.abs(p.x - dragState.x0), dy = Math.abs(p.y - dragState.y0);
    var d0 = dragState;
    cancelDrag();
    if (dx > 10 && dy > 10) {
      var xA = xInv(Math.min(d0.x0, p.x)), xB = xInv(Math.max(d0.x0, p.x));
      var yA = yInv(Math.max(d0.y0, p.y)), yB = yInv(Math.min(d0.y0, p.y));
      setDomain({ x: [xA, xB], y: [yA, yB] });
    }
  });

  svg.addEventListener('pointercancel', cancelDrag);
  svg.addEventListener('lostpointercapture', cancelDrag);
  svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTooltip(); });

  // zoom / reset: tween the domain (200ms ease-out), instant under reduced motion
  var tween = null;
  function setDomain(target) {
    hideTooltip();
    if (tween) cancelAnimationFrame(tween);
    resetBtn.hidden = false;
    if (reduceMotion && reduceMotion.matches) {
      domain = target; syncControls(); render(); return;
    }
    var from = { x: domain.x.slice(), y: domain.y.slice() };
    var t0 = null, DUR = 200;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / DUR);
      var e = 1 - Math.pow(1 - t, 3);
      if (t >= 1) {
        domain = target; tween = null; syncControls(); render(); return;
      }
      domain = {
        x: [Math.pow(10, lerp(Math.log10(from.x[0]), Math.log10(target.x[0]), e)),
            Math.pow(10, lerp(Math.log10(from.x[1]), Math.log10(target.x[1]), e))],
        y: [lerp(from.y[0], target.y[0], e), lerp(from.y[1], target.y[1], e)]
      };
      render();
      tween = requestAnimationFrame(step);
    }
    tween = requestAnimationFrame(step);
  }

  resetBtn.addEventListener('click', function () {
    setDomain({ x: FULL_X.slice(), y: FULL_Y.slice() });
  });

  // keep the geometry in step with the container width
  var renderedW = 0;
  function onResize() {
    var w = Math.round(wrap.clientWidth);
    if (!w || w === renderedW) return;
    renderedW = w;
    layout();
    hideTooltip();
    render();
  }
  if (window.ResizeObserver) {
    new ResizeObserver(function () { requestAnimationFrame(onResize); }).observe(wrap);
  } else {
    window.addEventListener('resize', onResize);
  }

  // ---- legend: grouped chip rows below the plot --------------------------
  var legendEl = document.getElementById('scaling-legend');

  function addLegendGroup(title) {
    var group = document.createElement('div');
    group.className = 'legend-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', title);
    var heading = document.createElement('div');
    heading.className = 'legend-group-title';
    heading.textContent = title;
    var chips = document.createElement('div');
    chips.className = 'legend-chips';
    group.appendChild(heading);
    group.appendChild(chips);
    legendEl.appendChild(group);
    return chips;
  }

  function monogram(str) {
    var firstWord = str.split(' ')[0];
    return (firstWord.slice(0, 2)).toUpperCase();
  }

  var chipEls = {};

  function setChipState(key, on) {
    active[key] = on;
    chipEls[key].classList.toggle('is-off', !on);
    chipEls[key].setAttribute('aria-pressed', String(on));
  }

  function addLegendChip(container, key, label, symbol, color, dashed, isModel) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = isModel ? 'legend-chip is-model' : 'legend-chip';
    chip.setAttribute('aria-pressed', 'true');
    chipEls[key] = chip;
    if (isModel) {
      chip.style.setProperty('--c', color);
      chip.style.setProperty('--on-c', onColor(color));
    } else {
      var swatch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      swatch.setAttribute('viewBox', '-8 -8 16 16');
      swatch.setAttribute('aria-hidden', 'true');
      swatch.classList.add('legend-swatch');
      if (dashed) {
        swatch.appendChild(svgEl('line', { x1: -7, x2: 7, y1: 0, y2: 0, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '3 2', 'stroke-linecap': 'round' }));
      } else {
        swatch.appendChild(makeMarker(symbol, color, 6));
      }
      chip.appendChild(swatch);
    }
    var text = document.createElement('span');
    text.textContent = label;
    chip.appendChild(text);
    chip.addEventListener('click', function () {
      setChipState(key, !active[key]);
      syncControls();
      hideTooltip();
      render();
    });
    container.appendChild(chip);
  }

  var dnaChips = addLegendGroup('D&A — by base VLM');
  families.forEach(function (f) {
    addLegendChip(dnaChips, 'family:' + f.key, f.shortLabel, f.symbol, f.color, false, true);
  });

  // the ten fixed baselines sit behind a disclosure so the default view stays short
  var baselineDetails = document.createElement('details');
  baselineDetails.className = 'legend-baselines';
  var baselineSummary = document.createElement('summary');
  var baselineChips = document.createElement('div');
  baselineChips.className = 'legend-chips';
  baselineChips.setAttribute('role', 'group');
  baselineChips.setAttribute('aria-label', 'Fixed baselines');
  baselineDetails.appendChild(baselineSummary);
  baselineDetails.appendChild(baselineChips);
  legendEl.appendChild(baselineDetails);
  baselines.forEach(function (b) {
    addLegendChip(baselineChips, 'baseline:' + b.name, b.name, 'circle', b.color, true);
  });

  var showAllBtn = document.getElementById('scaling-show-all');
  var showNoneBtn = document.getElementById('scaling-show-none');

  function syncControls() {
    var keys = Object.keys(chipEls);
    var on = keys.filter(function (k) { return active[k]; }).length;
    showAllBtn.disabled = on === keys.length;
    showNoneBtn.disabled = on === 0;
    var bOn = baselines.filter(function (b) { return active['baseline:' + b.name]; }).length;
    baselineSummary.textContent = bOn === baselines.length
      ? 'Baselines (' + baselines.length + ')'
      : 'Baselines (' + bOn + ' of ' + baselines.length + ' shown)';
    resetBtn.hidden = !isZoomed() && !tween;
  }

  function setAllActive(value) {
    Object.keys(chipEls).forEach(function (key) { setChipState(key, value); });
    syncControls();
    hideTooltip();
    render();
  }
  showAllBtn.addEventListener('click', function () { setAllActive(true); });
  showNoneBtn.addEventListener('click', function () { setAllActive(false); });

  syncControls();
  renderedW = Math.round(wrap.clientWidth);
  render();
  // Table-view twin (accessibility fallback for the chart above).
  var tbody = document.getElementById('scaling-data-table-body');
  families.forEach(function (f) {
    Object.keys(f.models).forEach(function (name) {
      var m = f.models[name];
      var tr = document.createElement('tr');
      [m.display || name, f.label, m.cost.toFixed(2), m.kendall.toFixed(3)].forEach(function (val, i) {
        var td = document.createElement('td');
        td.textContent = val;
        if (i >= 2) td.classList.add('has-text-right');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  });
  baselines.forEach(function (b) {
    var tr = document.createElement('tr');
    [b.name, 'Baseline', '—', b.kendall.toFixed(3)].forEach(function (val, i) {
      var td = document.createElement('td');
      td.textContent = val;
      if (i >= 2) td.classList.add('has-text-right');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
})();
