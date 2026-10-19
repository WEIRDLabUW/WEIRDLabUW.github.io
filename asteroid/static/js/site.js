// Page-level interactions. index.js still runs for the shared figures;
// this file adds the pseudocode diffs, door animations, the auto-playing
// why-it-works explainer, the DAgger/DPT dropdown and iframe auto-heights.
document.addEventListener('DOMContentLoaded', function () {
  initCodeDiffs();
  initDoorAnims();
  initWhyPlayer();
  initBaselineDropdown();
  initDemoFrameHeights();
});

// ---------------------------------------------------------------- pseudocode
var S = '<span class="t-student">student</span>';
var E = '<span class="t-expert">expert</span>';
var C = '<span class="t-ctx">context</span>';
var KW = function (w) { return '<span class="kw">' + w + '</span>'; };

// ASTEROID lines; mark[b] = how the line differs from baseline b
var OURS = [
  { t: KW('for') + ' iteration k = 0, 1, 2, &hellip;:', i: 0, mark: { bc: 'add', dpt: 'add' } },
  { t: KW('for') + ' each task:', i: 1, mark: {} },
  { t: S + ' <small>(can&rsquo;t see goal)</small> plays k episodes &rarr; ' + C, i: 2, mark: { bc: 'add', dagger: 'chg', dpt: 'chg' } },
  { t: E + ' <small>(sees goal)</small> plays an episode &rarr; labels', i: 2, mark: {} },
  { t: 'train ' + S + ': (' + C + ', observation) &rarr; ' + E + ' action', i: 1, mark: { bc: 'chg', dagger: 'chg' } }
];

var BASE = {
  bc: {
    name: 'Expert distillation <small>(behavior cloning)</small>',
    verdict: 'No context: the student can&rsquo;t tell worlds apart, so it guesses a door at random every episode.',
    lines: [
      { t: KW('for') + ' each task:', i: 0 },
      { t: E + ' <small>(sees goal)</small> plays an episode &rarr; labels', i: 1 },
      { t: 'train ' + S + ': observation &rarr; ' + E + ' action', i: 0, old: 1 }
    ]
  },
  dagger: {
    name: 'DAgger',
    lines: [
      { t: KW('for') + ' iteration k = 0, 1, 2, &hellip;:', i: 0 },
      { t: KW('for') + ' each task:', i: 1 },
      { t: S + ' <small>(can&rsquo;t see goal)</small> plays an episode', i: 2, old: 1 },
      { t: E + ' labels each state the student visited', i: 2 },
      { t: 'train ' + S + ': observation &rarr; ' + E + ' action', i: 1, old: 1 }
    ]
  },
  dpt: {
    name: 'DPT',
    lines: [
      { t: 'collect offline ' + C + ' with a random policy', i: 0, old: 1 },
      { t: KW('for') + ' each task:', i: 0 },
      { t: E + ' <small>(sees goal)</small> labels random query states', i: 1 },
      { t: 'train ' + S + ': (' + C + ', observation) &rarr; ' + E + ' action', i: 0 }
    ]
  }
};

function renderCode(ol, lines, b) {
  ol.innerHTML = lines.map(function (l) {
    var m = b ? (l.mark && l.mark[b]) : (l.old ? 'old' : '');
    return '<li class="i' + l.i + (m ? ' m-' + m : '') + '">' + l.t + '</li>';
  }).join('');
}

// scope = the element holding the grid (and, for the dropdown, the door figures)
function renderCmp(scope, grid, b) {
  grid.setAttribute('data-cmp', b);
  renderCode(grid.querySelector('[data-code="ours"]'), OURS, b);
  renderCode(grid.querySelector('[data-code="base"]'), BASE[b].lines, null);
  var v = grid.querySelector('[data-verdict]');
  if (v) v.innerHTML = BASE[b].verdict;
  [].forEach.call(scope.querySelectorAll('[data-name]'), function (n) { n.innerHTML = BASE[b].name; });
  [].forEach.call(scope.querySelectorAll('iframe[data-b]'), function (f) {
    f.hidden = f.getAttribute('data-b') !== b;
  });
}

function initCodeDiffs() {
  [].forEach.call(document.querySelectorAll('.cmp-grid[data-cmp]'), function (g) {
    renderCmp(g.parentNode, g, g.getAttribute('data-cmp'));
  });
}

// ------------------------------------------------------- DAgger / DPT dropdown
// The door figures sit in a closed <details>: index.js swaps data-src -> src on
// first open; here we drive their shared variant + replay clock (index.js only
// does that for figures present at page load).
function initBaselineDropdown() {
  var dd = document.getElementById('baselines');
  if (!dd) return;
  var grid = document.getElementById('cmp-later');
  var frames = [].slice.call(dd.querySelectorAll('iframe.cmp-fig'));
  var variant = ['L', 'M', 'R'][Math.floor(Math.random() * 3)];
  var clock = null;

  function post(f, msg) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} }
  function sync() {
    frames.forEach(function (f) { if (!f.hidden) post(f, { type: 'lmp-sync' }); });
  }
  frames.forEach(function (f) {
    f.addEventListener('load', function () { post(f, { type: 'lmp-variant', v: variant }); });
  });

  [].forEach.call(dd.querySelectorAll('.cmp-tab'), function (tab) {
    tab.addEventListener('click', function () {
      [].forEach.call(dd.querySelectorAll('.cmp-tab'), function (t) { t.classList.toggle('is-on', t === tab); });
      renderCmp(dd, grid, tab.getAttribute('data-b'));
      sync();   // restart both visible figures together
    });
  });

  dd.addEventListener('toggle', function () {
    if (dd.open && !clock) {
      setTimeout(sync, 700);                     // let the freshly loaded figures boot
      clock = setInterval(sync, 25000);          // longest figure animation + hold
    } else if (!dd.open && clock) {
      clearInterval(clock); clock = null;
    }
  });
}

// iframes that report their own height but aren't in index.js's list
function initDemoFrameHeights() {
  ['fig-opus-frame'].forEach(function (id) {
    var frame = document.getElementById(id);
    if (!frame) return;
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'lmp-figheight' && e.source === frame.contentWindow) {
        frame.style.height = e.data.height + 'px';
      }
    });
  });
}

// ------------------------------------------------------------ door animations
// Three synced panels on one clock: expert (sees the goal), BC student (random
// door each episode) and ASTEROID student (rules out, then commits).
var GOAL = 2;
var SEQ = { expert: [2, 2, 2, 2, 2, 2], bc: [0, 2, 1, 0, 0, 2], asteroid: [0, 1, 2, 2, 2, 2] };
var DOOR_X = [70, 150, 230];
var SVGNS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs, parent) {
  var e = document.createElementNS(SVGNS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function buildDoorPanel(svg) {
  var kind = svg.getAttribute('data-kind');
  svg.innerHTML = '';
  var trails = svgEl('g', {}, svg);
  var doors = DOOR_X.map(function (x, i) {
    var g = svgEl('g', { 'class': 'door' + (kind === 'expert' && i === GOAL ? ' is-goal' : '') }, svg);
    svgEl('rect', { x: x - 22, y: 16, width: 44, height: 62, rx: 4 }, g);
    svgEl('circle', { cx: x + 12, cy: 50, r: 2.6, 'class': 'knob' }, g);
    var t = svgEl('text', { x: x, y: 11, 'text-anchor': 'middle', 'class': 'door-n' }, g);
    t.textContent = i + 1;
    var x1 = svgEl('text', { x: x, y: 58, 'text-anchor': 'middle', 'class': 'door-x' }, g);
    x1.textContent = '✕';
    return g;
  });
  var agent = svgEl('g', { 'class': 'agent' }, svg);
  svgEl('circle', { cx: 0, cy: 0, r: 10, 'class': kind === 'expert' ? 'agent-expert' : 'agent-student' }, agent);
  agent.style.transform = 'translate(150px,172px)';
  return { kind: kind, svg: svg, trails: trails, doors: doors, agent: agent,
           strip: svg.parentNode.querySelector('.ep-strip') };
}

function initDoorAnims() {
  var row = document.getElementById('doors-row');
  if (!row) return;
  var panels = [].map.call(row.querySelectorAll('svg.doors'), buildDoorPanel);
  var ep = 0, timer = null;

  function reset() {
    panels.forEach(function (p) {
      p.trails.innerHTML = '';
      p.strip.innerHTML = '';
      p.doors.forEach(function (d, i) {
        d.classList.remove('is-miss', 'is-hit');
        if (!(p.kind === 'expert' && i === GOAL)) d.classList.remove('is-goal');
      });
    });
  }

  function step() {
    if (ep === 0) reset();
    panels.forEach(function (p) {
      var d = SEQ[p.kind][ep], x = DOOR_X[d], hit = d === GOAL;
      svgEl('line', { x1: 150, y1: 172, x2: x, y2: 96, 'class': 'trail' }, p.trails);
      p.agent.style.transition = 'transform .7s cubic-bezier(.45,0,.3,1)';
      p.agent.style.transform = 'translate(' + x + 'px,96px)';
      setTimeout(function () {
        p.doors[d].classList.add(hit ? 'is-hit' : 'is-miss');
        if (hit) p.doors[d].classList.add('is-goal');
        var chip = document.createElement('span');
        chip.className = 'ep ' + (hit ? 'ok' : 'no');
        chip.textContent = hit ? '✓' : '✕';
        p.strip.appendChild(chip);
      }, 720);
      setTimeout(function () {
        p.agent.style.transition = 'none';
        p.agent.style.transform = 'translate(150px,172px)';
        p.doors[d].classList.remove('is-hit');
      }, 1350);
    });
    ep = (ep + 1) % 6;
    timer = setTimeout(step, ep === 0 ? 3200 : 1500);
  }

  function start() { if (!timer) step(); }
  function stop() { clearTimeout(timer); timer = null; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.3 }).observe(row);
  } else start();
}

// ------------------------------------------------- why-it-works, video-style
// Plays itself like a looping clip (chapters + progress, pause/resume); the
// student's tries animate in the mini door scene, label rows and bars stagger in.
var WHY_MS = 3800;
var WHY = [
  { say: 'The student tries <b>door 1</b>. Wrong &mdash; that becomes its <span class="t-ctx">context</span>.',
    ctx: [0], labels: null, bars: null },
  { say: 'Given that context, the <span class="t-expert">expert</span> says <b>door 2</b> or <b>door 3</b>, depending on where the goal is.',
    ctx: [0], labels: [null, 1, 2], bars: null },
  { say: 'The student learns a <b>distribution</b>: half door 2, half door 3, never door 1.',
    ctx: [0], labels: [null, 1, 2], bars: [0, 0.5, 0.5] },
  { say: 'Door 2 fails too. Now the only answer is <b>door 3</b>.',
    ctx: [0, 1], labels: [null, null, 2], bars: [0, 0, 1] }
];

function doorChip(i, cls) {
  return '<span class="mini-door ' + (cls || '') + '">' + (i + 1) + '</span>';
}

function initWhyPlayer() {
  var root = document.getElementById('why-box');
  if (!root) return;
  var say = document.getElementById('why-say'), ctx = document.getElementById('why-ctx'),
      labels = document.getElementById('why-labels'), bars = document.getElementById('why-bars'),
      playBtn = document.getElementById('why-play'), svg = document.getElementById('why-doors');
  var chapters = [].slice.call(document.querySelectorAll('#why-chapters button'));
  var cur = -1, timer = null, playing = false, inView = false, t0 = 0, left = WHY_MS;

  // mini door scene for the student's tries
  var MX = [50, 110, 170];
  var doors = MX.map(function (x, i) {
    var g = svgEl('g', { 'class': 'door' }, svg);
    svgEl('rect', { x: x - 16, y: 10, width: 32, height: 46, rx: 3 }, g);
    var t = svgEl('text', { x: x, y: 40, 'text-anchor': 'middle', 'class': 'door-n' }, g);
    t.textContent = i + 1;
    return g;
  });
  var agent = svgEl('circle', { cx: 0, cy: 0, r: 8, 'class': 'agent-student' }, svg);
  function park() { agent.style.transition = 'none'; agent.style.transform = 'translate(110px,104px)'; }
  park();

  bars.innerHTML = [0, 1, 2].map(function (i) {
    return '<div class="bar-col"><div class="bar-track"><div class="bar-ghost"></div><div class="bar-fill"></div>' +
           '<span class="bar-v"></span></div>' + doorChip(i) + '</div>';
  }).join('');
  var fills = bars.querySelectorAll('.bar-fill'), vals = bars.querySelectorAll('.bar-v');

  function render(s) {
    var st = WHY[s], prev = WHY[cur] || null;
    cur = s;
    chapters.forEach(function (b, i) { b.classList.toggle('is-on', i === s); b.classList.toggle('is-done', i < s); });
    say.innerHTML = st.say;

    // student walks to its newest try (steps that add a try), doors show misses
    var fresh = !prev || prev.ctx.length !== st.ctx.length || s === 0;
    doors.forEach(function (d, i) {
      d.classList.toggle('is-miss', st.ctx.indexOf(i) >= 0 && !(fresh && i === st.ctx[st.ctx.length - 1]));
    });
    if (fresh) {
      var last = st.ctx[st.ctx.length - 1];
      park();
      requestAnimationFrame(function () {
        agent.style.transition = 'transform .6s cubic-bezier(.45,0,.3,1)';
        agent.style.transform = 'translate(' + MX[last] + 'px,68px)';
      });
      setTimeout(function () { if (cur === s) doors[last].classList.add('is-miss'); }, 650);
    }
    if (fresh) ctx.innerHTML = st.ctx.map(function (d, k) {
      return '<span class="ctx-item" style="animation-delay:' + (k === st.ctx.length - 1 ? 0.85 : 0) + 's">' +
             doorChip(d, 'miss') + '<span class="no">&#10005;</span></span>';
    }).join('');

    if (prev && JSON.stringify(prev.labels) === JSON.stringify(st.labels)) {
      // same answers as the previous step: keep the rows as they are
    } else if (!st.labels) {
      labels.innerHTML = '<div class="why-empty">&hellip;</div>';
    } else {
      labels.innerHTML = [0, 1, 2].filter(function (z) { return st.labels[z] !== null; }).map(function (z, k) {
        return '<div class="lab" style="animation-delay:' + (0.15 + k * 0.3) + 's">goal behind ' + doorChip(z, 'goal') +
               '<span class="lab-a">&rarr; ' + doorChip(st.labels[z], 'pick') + '</span></div>';
      }).join('');
    }
    root.classList.toggle('has-bars', !!st.bars);
    [0, 1, 2].forEach(function (i) {
      var v = st.bars ? st.bars[i] : 0;
      fills[i].style.transitionDelay = st.bars ? (0.15 + i * 0.1) + 's' : '0s';
      fills[i].style.height = (v * 100) + '%';
      vals[i].textContent = st.bars ? Math.round(v * 100) + '%' : '';
      vals[i].style.bottom = 'calc(' + (v * 100) + '% + 4px)';
    });
  }

  // chapter progress: the active chapter's <i> fills over WHY_MS
  function runProgress(ms) {
    chapters.forEach(function (b, i) {
      var bar = b.querySelector('i');
      bar.style.transition = 'none';
      bar.style.width = i < cur ? '100%' : '0%';
    });
    var a = chapters[cur].querySelector('i');
    a.style.width = (100 * (1 - ms / WHY_MS)) + '%';
    void a.offsetWidth;
    a.style.transition = 'width ' + ms + 'ms linear';
    a.style.width = '100%';
  }
  function freezeProgress() {
    var a = chapters[cur] && chapters[cur].querySelector('i');
    if (!a) return;
    var w = getComputedStyle(a).width;
    a.style.transition = 'none';
    a.style.width = w;
  }

  function schedule(ms) {
    clearTimeout(timer);
    t0 = Date.now(); left = ms;
    runProgress(ms);
    timer = setTimeout(function () { go((cur + 1) % WHY.length); }, ms);
  }
  function go(s) { render(s); if (playing) schedule(WHY_MS); else { left = WHY_MS; runProgress(WHY_MS); freezeProgress(); } }
  function play() {
    if (playing) return;
    playing = true; playBtn.innerHTML = '&#10074;&#10074;'; playBtn.setAttribute('aria-label', 'Pause');
    if (cur < 0) go(0); else schedule(left);
  }
  function pause() {
    if (!playing) return;
    playing = false; playBtn.innerHTML = '&#9654;'; playBtn.setAttribute('aria-label', 'Play');
    clearTimeout(timer); left = Math.max(300, left - (Date.now() - t0)); freezeProgress();
  }

  playBtn.addEventListener('click', function () { if (playing) pause(); else play(); });
  chapters.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
  render(0);

  var started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        inView = e.isIntersecting;
        if (!inView) { pause(); return; }
        if (!started) { started = true; playing = true; go(0); return; }   // first view: play from the top
        if (!playing && playBtn.getAttribute('data-user-paused') !== '1') play();
      });
    }, { threshold: 0.35 }).observe(root);
    playBtn.addEventListener('click', function () { playBtn.setAttribute('data-user-paused', playing ? '0' : '1'); });
  } else play();
}
