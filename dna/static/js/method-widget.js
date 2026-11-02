/* Method widget (#method-widget): the Describe & Assess pipeline stepped through on a real rollout.
   Data (static/js/method-data.js): three successes (Generalist, Dyna) and one failure (Physical Intelligence ziptie),
   32 key frames each. The entity lists are short hand-picked names for the objects in the descriptions. */
(function () {
  'use strict';

  var root = document.getElementById('method-widget');
  if (!root || !window.METHOD_DATA) return;

  var DATA = {}, ORDER = [];
  window.METHOD_DATA.forEach(function (d) { DATA[d.key] = d; ORDER.push(d.key); });
  var STEPS = [
    { key: 'input', n: 1, title: 'Input', math: 'o<sub>1:T</sub>, l', sub: 'video + task',
      blurb: 'A video and a task. The entities that matter (robot parts, objects) are picked out of the task and the video.' },
    { key: 'describe', n: 2, title: 'Describe', math: 'D(o<sub>1:T</sub>, e)', sub: 'what happened?',
      blurb: 'The Describer narrates every key frame and <strong>never sees the task</strong>, so it cannot talk itself into success.' },
    { key: 'assess', n: 3, title: 'Assess', math: 'A(d<sub>1:T</sub>, c)', sub: 'how far along?',
      blurb: 'The Assessor writes explicit <strong>success criteria</strong> from the task, then scores the descriptions against them. It <strong>never sees the video</strong>, only the text.' },
    { key: 'output', n: 4, title: 'Output', math: 'r<sub>1:T</sub>, f', sub: 'score + feedback',
      blurb: 'A dense score per frame, plus rich feedback on failures.' }
  ];
  
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var el = {
    outcome: root.querySelectorAll('.mw-outcome button'),
    steps: root.querySelector('.mw-steps'),
    video: root.querySelector('.mw-video'),
    kf: root.querySelector('.mw-kf'),
    slider: root.querySelector('.mw-slider'),
    task: root.querySelector('.mw-task'),
    src: root.querySelector('.mw-src'),
    demo: root.querySelector('.mw-demo'),
    blurb: root.querySelector('.mw-blurb'),
    focus: root.querySelector('.mw-focus'),
    panel: root.querySelector('.mw-panel')
  };
  var state = { ep: ORDER[0], step: 0, kf: 0, touring: false, over: false, inView: false };
  var tourTimer = 0, sweepTimer = 0, tourPos = 0, tourSeq = [], pendingSrc = false;
  var wrap = root.closest('details');
  function isOpen() { return !wrap || wrap.open; }

  function mk(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  // the data marks the critical parts with **double asterisks**
  function fmt(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function ep() { return DATA[state.ep]; }
  function nKf() { return ep().progress.length; }

  // ---- static parts ----
  function buildSteps() {
    STEPS.forEach(function (s, i) {
      var li = mk('li');
      var b = mk('button', 'mw-step is-' + s.key);
      b.type = 'button';
      b.innerHTML = '<span class="mw-step-n">' + s.n + '</span><span class="mw-step-body"><span class="mw-step-title">' + s.title +
        '</span><span class="mw-step-math">' + s.math + '</span><span class="mw-step-sub">' + s.sub + '</span></span>';
      b.addEventListener('click', function () { setStep(i); });
      li.appendChild(b);
      el.steps.appendChild(li);
    });
  }

  // ---- state -> view ----
  function setEpisode(key) {
    state.ep = key;
    el.outcome.forEach(function (b) {
      var on = b.getAttribute('data-ep') === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (isOpen()) el.video.src = ep().video; else pendingSrc = true;   // a collapsed widget loads nothing
    el.slider.max = String(nKf() - 1);
    el.task.innerHTML = '<span class="mw-task-label">Task <i>l</i></span> “' + ep().task + '”';
    var d = ep();
    el.demo.href = './demo/index.html?clip=' + encodeURIComponent(d.id);
    el.src.href = d.srcUrl; el.src.title = 'Source video: ' + d.srcName; el.src.setAttribute('aria-label', 'Source video: ' + d.srcName);
    el.focus.hidden = !d.focus;
    el.focus.innerHTML = d.focus ? '<span class="mw-focus-tag">Look for</span> ' + fmt(d.focus) : '';
    setKf(Math.min(state.kf, nKf() - 1));
    render();
  }

  function setKf(i, quiet) {
    state.kf = Math.max(0, Math.min(nKf() - 1, i));
    el.slider.value = String(state.kf);
    el.kf.textContent = 'key frame ' + (state.kf + 1) + ' / ' + nKf();
    var seek = function () {
      var d = el.video.duration && isFinite(el.video.duration) ? el.video.duration : ep().duration;
      // stay just inside the clip: seeking to the very end can show a blank frame
      try { el.video.currentTime = Math.min((nKf() > 1 ? state.kf / (nKf() - 1) : 0) * d, Math.max(0, d - 0.15)); } catch (e) { /* not ready yet */ }
    };
    if (el.video.readyState >= 1) seek(); else el.video.addEventListener('loadedmetadata', seek, { once: true });
    if (state.step > 0 && !quiet) render();
  }

  function setStep(i) {
    state.step = i;
    render();
  }

  function pct(v) { return Math.round(v * 100); }

  function chart(e) {
    var W = 440, H = 62, L = 26, R = 8, T = 6, B = 16, n = e.progress.length;   // 1:1 in a ~440px card, so it stays flat
    var x = function (k) { return L + (n > 1 ? k / (n - 1) : 0) * (W - L - R); };
    var y = function (v) { return H - B - v * (H - T - B); };
    var pts = e.progress.map(function (v, k) { return x(k).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var upto = e.progress.slice(0, state.kf + 1).map(function (v, k) { return x(k).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    return '<svg class="mw-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Progress score over the key frames">' +
      '<line x1="' + L + '" y1="' + y(0) + '" x2="' + (W - R) + '" y2="' + y(0) + '" class="mw-axis"/>' +
      '<line x1="' + L + '" y1="' + y(1) + '" x2="' + (W - R) + '" y2="' + y(1) + '" class="mw-axis is-dash"/>' +
      '<text x="' + (L - 5) + '" y="' + (y(0) + 4) + '" text-anchor="end" class="mw-tick">0</text>' +
      '<text x="' + (L - 5) + '" y="' + (y(1) + 4) + '" text-anchor="end" class="mw-tick">1</text>' +
      '<text x="' + (W - R) + '" y="' + (H - 3) + '" text-anchor="end" class="mw-tick">T</text>' +
      '<polyline points="' + pts + '" class="mw-line is-faint"/>' +
      '<polyline points="' + upto + '" class="mw-line"/>' +
      '<line x1="' + x(state.kf).toFixed(1) + '" y1="' + T + '" x2="' + x(state.kf).toFixed(1) + '" y2="' + y(0) + '" class="mw-play"/>' +
      '<circle cx="' + x(state.kf).toFixed(1) + '" cy="' + y(e.progress[state.kf]).toFixed(1) + '" r="4" class="mw-dot"/></svg>';
  }

  function render() {
    var e = ep(), s = STEPS[state.step], p = el.panel;
    root.setAttribute('data-step', s.key);
    Array.prototype.forEach.call(el.steps.querySelectorAll('.mw-step'), function (b, i) {
      b.classList.toggle('is-active', i === state.step);
      b.classList.toggle('is-done', i < state.step);
      b.setAttribute('aria-current', i === state.step ? 'step' : 'false');
    });
    el.blurb.innerHTML = s.blurb;
    var h = '';
    if (s.key === 'input') {
      h += '<div class="mw-card is-input"><div class="mw-label">Entities <i>e</i></div><div class="mw-chips">' +
        e.entities.map(function (t) { return '<span class="mw-chip">' + t + '</span>'; }).join('') + '</div></div>';
    } else if (s.key === 'describe') {
      h += '<div class="mw-card is-describe"><div class="mw-label">Video description <i>d<sub>' + (state.kf + 1) + '</sub></i>' +
        '<span class="mw-blind" title="The Describer is never given the task">task hidden</span></div>' +
        '<p class="mw-text">' + fmt(e.descriptions[state.kf]) + '</p></div>';
    } else if (s.key === 'assess') {
      h += '<div class="mw-card is-assess"><div class="mw-label">Success criteria <i>c</i>' +
        '<span class="mw-blind" title="The Assessor never sees the video, only the descriptions">video hidden</span></div><p class="mw-text">' + fmt(e.criterion) + '</p></div>' +
        '<div class="mw-score"><span class="mw-label">Score <i>r<sub>' + (state.kf + 1) + '</sub></i></span>' +
        '<span class="mw-bar"><span class="mw-bar-fill" style="width:' + pct(e.progress[state.kf]) + '%"></span></span>' +
        '<span class="mw-score-num">' + pct(e.progress[state.kf]) + '%</span></div>';
    } else {
      h += '<div class="mw-out"><div class="mw-card is-score"><div class="mw-label">Score <i>r<sub>1:T</sub></i></div>' + chart(e) + '</div>' +
        '<div class="mw-card is-feedback ' + (e.ok ? 'is-ok' : 'is-fail') + '"><div class="mw-label">Rich language feedback <i>f</i></div>' +
        (e.ok
          ? '<p class="mw-text">The criteria are met, so the task is complete and no feedback is needed.</p>'
          : (e.failure || e.feedback)
            ? '<p class="mw-text"><strong>What went wrong.</strong> ' + fmt(e.failure || '') + '</p><p class="mw-text"><strong>What to do.</strong> ' + fmt(e.feedback || '') + '</p>'
            : '<p class="mw-text">The criteria are not met: the score never climbs, so the task is not complete.</p>') + '</div></div>';
    }
    p.innerHTML = h;
    p.classList.remove('mw-in'); void p.offsetWidth; p.classList.add('mw-in');
  }

  // ---- tour: step through the pipeline until the reader touches anything ----
  // per example: input, the description at each critical key frame, the assessment at the same frames,
  // then the whole score curve; the next example follows, and so on in a loop
  function sweep() {
    clearInterval(sweepTimer);
    var n = nKf(), k = 0;
    setKf(0, true);
    sweepTimer = setInterval(function () {
      k += 1;
      if (k >= n) { clearInterval(sweepTimer); return; }
      setKf(k);
    }, Math.max(100, Math.round(4000 / n)));
  }

  function buildSeq(e) {
    var q = [{ step: 0, kf: 0, ms: 2800 }];
    e.crit.forEach(function (k) { q.push({ step: 1, kf: k, ms: 4200 }); });
    e.crit.forEach(function (k) { q.push({ step: 2, kf: k, ms: 2600 }); });
    q.push({ step: 3, sweep: true, ms: 5000 });
    return q;
  }

  function tourStep() {
    if (!state.touring) return;
    clearInterval(sweepTimer);
    if (tourPos === 0) tourSeq = buildSeq(ep());
    var a = tourSeq[tourPos];
    if (a.sweep) { setStep(a.step); sweep(); } else { setKf(a.kf, true); setStep(a.step); }
    tourPos = (tourPos + 1) % tourSeq.length;
    tourTimer = setTimeout(function () {
      if (tourPos === 0) setEpisode(ORDER[(ORDER.indexOf(state.ep) + 1) % ORDER.length]);
      tourStep();
    }, a.ms);
  }

  function startTour() {
    if (state.over || state.touring || !state.inView || reduceMotion.matches) return;
    state.touring = true;
    root.classList.add('is-touring');
    tourStep();
  }
  function pauseTour() {
    clearTimeout(tourTimer); clearInterval(sweepTimer);
    state.touring = false; root.classList.remove('is-touring');
  }
  function endTour() { state.over = true; pauseTour(); }

  ['pointerdown', 'keydown', 'input', 'change'].forEach(function (t) { root.addEventListener(t, endTour, true); });

  // ---- events ----
  el.slider.addEventListener('input', function (e) { setKf(parseInt(e.target.value, 10)); });
  el.outcome.forEach(function (b) { b.addEventListener('click', function () { setEpisode(b.getAttribute('data-ep')); }); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      state.inView = entries.some(function (x) { return x.isIntersecting; });
      if (state.inView) startTour(); else pauseTour();
    }, { threshold: 0.5 }).observe(root);
  }

  if (wrap) {
    wrap.addEventListener('toggle', function () {
      if (!wrap.open) { pauseTour(); return; }
      if (pendingSrc) { pendingSrc = false; el.video.src = ep().video; setKf(state.kf); }
    });
  }

  // the description card is as tall as the video
  function syncHeight() { root.style.setProperty('--mw-vh', el.video.parentNode.offsetHeight + 'px'); }
  if ('ResizeObserver' in window) new ResizeObserver(syncHeight).observe(el.video.parentNode); else window.addEventListener('resize', syncHeight);
  syncHeight();

  buildSteps();
  setEpisode(ORDER[0]);
})();
