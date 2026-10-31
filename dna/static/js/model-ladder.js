/* "Better VLM, Better Reward Model" (#ladder): one bar per model, from cheaper to pricier, for the chosen family.
   Scores are Kendall tau-alpha on RBM-EVAL-OOD (same values as the paper). The dashed line is the best model
   trained on robot data (Robometer); bars that reach it are marked. */
(function () {
  'use strict';

  var root = document.getElementById('ladder');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var DOMAIN = 0.8;         // right end of the bars
  var REF = 0.648;          // Robometer-4B, the model trained on robot data that the dashed line stands for

  var FAMILIES = [
    { label: 'GPT', color: '#007D68', models: [
      ['GPT-5.4 Nano', 0.275, 1.25], ['GPT-4.1 Mini', 0.439, 1.60], ['GPT-5 Mini', 0.307, 2.00], ['GPT-5.4 Mini', 0.453, 4.50],
      ['GPT-5.6 Luna', 0.494, 6], ['GPT-5.4', 0.617, 15.00], ['GPT-5.6 Terra', 0.520, 15], ['GPT-5.5', 0.577, 30.00],
      ['GPT-5.6 Sol', 0.639, 30], ['GPT-6 Astra', 0.714, 50]] },
    { label: 'Gemini', color: '#D81B60', models: [
      ['Gemini 2.5 Flash-Lite', 0.321, 0.40], ['Gemini 2.5 Flash', 0.386, 2.50], ['Gemini 3.1 Flash-Lite', 0.522, 1.50],
      ['Gemini 3 Flash', 0.576, 3.00], ['Gemini 3.5 Flash', 0.535, 9.00], ['Gemini 3.1 Pro', 0.531, 12.00],
      ['Gemini Robotics-ER 1.6', 0.629, 12.00], ['Gemini 4 Argon', 0.734, 20.00]] },
    { label: 'Qwen', color: '#615CED', models: [
      ['Qwen3-VL 8B', 0.175, 0.45], ['Qwen3.7 Plus', 0.560, 1.28], ['Qwen3.6 Plus', 0.583, 1.95], ['Qwen3.6 27B', 0.404, 2.00]] },
    { label: 'Claude', color: '#d97757', models: [
      ['Sonnet 5', 0.285, 10], ['Opus 5', 0.465, 25], ['Fable 5', 0.519, 50]] }
  ];
  FAMILIES.forEach(function (f) { f.models.sort(function (a, b) { return a[2] - b[2] || a[1] - b[1]; }); });

  root.style.setProperty('--ref', REF);
  var elFams = document.getElementById('ladder-fams');
  var elRows = document.getElementById('ladder-rows');
  var current = 0;
  var revealed = false;     // bars stay empty until the chart is on screen the first time

  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildTabs() {
    FAMILIES.forEach(function (f, i) {
      var b = mk('button', 'ladder-fam', f.label);
      b.type = 'button';
      b.style.setProperty('--c', f.color);
      b.addEventListener('click', function () { show(i); });
      elFams.appendChild(b);
    });
  }

  function show(i) {
    current = i;
    var f = FAMILIES[i];
    root.style.setProperty('--c', f.color);
    Array.prototype.forEach.call(elFams.children, function (b, k) {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-pressed', String(k === i));
    });
    elRows.innerHTML = '';
    var bars = [];
    f.models.forEach(function (m) {
      var li = mk('li', 'ladder-row' + (m[1] >= REF ? ' is-above' : ''));
      li.appendChild(mk('span', 'ladder-name', m[0]));
      var track = mk('span', 'ladder-bar');
      var fill = mk('span', 'ladder-fill');
      track.appendChild(fill);
      li.appendChild(track);
      li.appendChild(mk('span', 'ladder-val', m[1].toFixed(2)));
      elRows.appendChild(li);
      bars.push([fill, m[1]]);
    });
    // grow the bars in, one after another
    var grow = function () {
      bars.forEach(function (b, k) {
        b[0].style.transitionDelay = reduceMotion.matches ? '0ms' : (k * 55) + 'ms';
        b[0].style.width = (b[1] / DOMAIN * 100) + '%';
      });
    };
    if (revealed) requestAnimationFrame(function () { requestAnimationFrame(grow); });
    else show.pending = grow;
  }

  buildTabs();
  show(0);

  function reveal() {
    if (revealed) return;
    revealed = true;
    if (show.pending) { var g = show.pending; show.pending = null; requestAnimationFrame(function () { requestAnimationFrame(g); }); }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); reveal(); }
    }, { threshold: 0.35 });
    io.observe(root);
  } else {
    reveal();
  }
})();
