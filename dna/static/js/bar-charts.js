// Offline benchmark bar charts (D&A-Bench, RBM-EVAL-OOD, RoboRewardBenchmark).
// Horizontal bars: model names in a left label column, the value printed at each bar end.
// Geometry follows the rendered width (1 SVG unit = 1 CSS px), so chart text is never scaled down.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // Data encodings (match the paper's figures).
  var COLORS = {
    'Naive VLM': '#007D68', 'GVL': '#7F8C8D', 'TOPReward': '#9467BD', 'SOLE-R1': '#17BECF',
    'RoboReward-4B': '#FCBF07', 'RoboReward-8B': '#FCBF07', 'Robometer': '#FF7F0E',
    'D&A': '#D81B60', 'D&A*': '#F4A9C8'
  };

  var CHARTS = [
    {
      id: 'bench-svg-dna', higherBetter: true, yMax: 0.85, yStep: 0.2, decimals: 3,
      data: [
        ['Naive VLM', 0.438], ['GVL', 0.162], ['TOPReward', 0.246], ['SOLE-R1', 0.294],
        ['RoboReward-4B', 0.437], ['RoboReward-8B', 0.452], ['Robometer', 0.567],
        ['D&A', 0.672], ['D&A*', 0.790]
      ]
    },
    {
      id: 'bench-svg-rbm', higherBetter: true, yMax: 0.8, yStep: 0.2, decimals: 3,
      data: [
        ['Naive VLM', 0.360], ['GVL', 0.273], ['TOPReward', 0.202], ['SOLE-R1', 0.359],
        ['RoboReward-4B', 0.536], ['RoboReward-8B', 0.463], ['Robometer', 0.648],
        ['D&A', 0.576], ['D&A*', 0.714]
      ]
    },
    {
      id: 'bench-svg-rrb', higherBetter: false, yMax: 2.0, yStep: 0.5, decimals: 2,
      data: [
        ['Naive VLM', 0.92], ['GVL', 1.34], ['TOPReward', 1.81], ['SOLE-R1', 1.08],
        ['RoboReward-4B', 0.85], ['RoboReward-8B', 0.67], ['Robometer', 0.75],
        ['D&A', 0.70], ['D&A*', 0.63]
      ]
    }
  ];

  var ROW_H = 30;      // row pitch
  var BAR_H = 18;      // bar thickness
  var LABEL_W = 104;   // name column ("RoboReward-8B" at 13px is about 95px)
  var VALUE_W = 46;    // room for the value printed after the longest bar
  var GAP = 8;         // between name column and bars, and between bar end and value

  function legendKeyFor(name) {
    return name.indexOf('RoboReward') === 0 ? 'RoboReward' : name;
  }

  var active = {};
  Array.prototype.forEach.call(document.querySelectorAll('#bench-legend .legend-chip'), function (chip) {
    active[chip.getAttribute('data-key')] = true;
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-key');
      active[key] = !active[key];
      chip.classList.toggle('is-off', !active[key]);
      chip.setAttribute('aria-pressed', String(active[key]));
      CHARTS.forEach(renderBarChart);
    });
  });

  function renderBarChart(cfg) {
    var svg = document.getElementById(cfg.id);
    if (!svg) return;
    var W = Math.max(220, Math.round(svg.parentNode.clientWidth));
    var n = cfg.data.length;
    var H = n * ROW_H;
    var barL = LABEL_W + GAP;
    var barMax = Math.max(40, W - barL - VALUE_W - GAP);

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    // the markup's aria-label is the base; the visible values are appended (kept in sync with the chips)
    if (!svg.hasAttribute('data-base-label')) svg.setAttribute('data-base-label', svg.getAttribute('aria-label'));
    var baseLabel = svg.getAttribute('data-base-label');
    svg.setAttribute('aria-label', baseLabel + ': ' + cfg.data.filter(function (d) {
      return active[legendKeyFor(d[0])] !== false;
    }).map(function (d) { return d[0] + ' ' + d[1].toFixed(cfg.decimals); }).join(', '));
    svg.textContent = '';

    // baseline the bars grow from
    svg.appendChild(el('line', { class: 'bar-axis', x1: barL, x2: barL, y1: 0, y2: H }));

    cfg.data.forEach(function (d, i) {
      var name = d[0], value = d[1];
      var isActive = active[legendKeyFor(name)] !== false;
      var cy = i * ROW_H + ROW_H / 2;

      var nameLbl = el('text', { class: 'bar-name' + (isActive ? '' : ' is-off'), x: 0, y: cy, 'dominant-baseline': 'central' });
      nameLbl.textContent = name;
      svg.appendChild(nameLbl);

      if (!isActive) return;

      var w = Math.max(0, (value / cfg.yMax) * barMax);
      var isStar = name.indexOf('*') !== -1;
      svg.appendChild(el('rect', {
        class: 'bench-bar' + (isStar ? ' is-star' : ''), x: barL, y: cy - BAR_H / 2, width: w, height: BAR_H,
        rx: 3, fill: COLORS[name] || '#c9c8c0'
      }));

      var valLbl = el('text', { class: 'bar-value', x: barL + w + GAP, y: cy, 'dominant-baseline': 'central' });
      valLbl.textContent = value.toFixed(cfg.decimals === 2 ? 2 : 3);
      svg.appendChild(valLbl);
    });
  }

  function renderAll() { CHARTS.forEach(renderBarChart); }
  renderAll();

  // Re-render when the container width changes (rotation, resize, 200% zoom).
  var lastW = {};
  function maybeRender() {
    var changed = CHARTS.some(function (cfg) {
      var svg = document.getElementById(cfg.id);
      var w = svg ? Math.round(svg.parentNode.clientWidth) : 0;
      if (lastW[cfg.id] !== w) { lastW[cfg.id] = w; return true; }
      return false;
    });
    if (changed) renderAll();
  }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { requestAnimationFrame(maybeRender); });
    CHARTS.forEach(function (cfg) {
      var svg = document.getElementById(cfg.id);
      if (svg) ro.observe(svg.parentNode);
    });
  } else {
    window.addEventListener('resize', maybeRender);
  }
})();
