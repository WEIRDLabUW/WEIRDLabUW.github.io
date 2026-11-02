/* Method widget (#method-widget), experimental: the Describe & Assess pipeline stepped through on a real rollout.
   Data: D&A-Bench episodes coffee_task_ep0030 (success) and coffee_task_ep0033 (failure: stops at 14.8 g instead of 16 g).
   The entity lists are read off the descriptions: the bench data does not store the grounding step's output. */
(function () {
  'use strict';

  var root = document.getElementById('method-widget');
  if (!root) return;

  var DATA = {"ok":{"id":"coffee_task_ep0030","video":"./widget/data/videos/coffee_task_ep0030.mp4","duration":31.4,"task":"measure exactly 16g of coffee","entities":["left robot arm","right robot arm","blue bowl","red bowl","coffee beans","digital scale","wooden table","cables"],"descriptions":["Two black robot arms are positioned above a wooden table. A blue bowl is placed on a digital scale showing '0.0'. To the right, a red bowl contains coffee beans. The right robot arm is roughly 25cm from the red bowl.","The right robot arm remains stationary above the table. The blue bowl, red bowl with coffee beans, and digital scale are in their starting positions. The distance to the red bowl is still 25cm.","The right robot arm starts to descend, reducing the distance to the red bowl to about 20cm. The blue bowl sits empty on the digital scale, which reads '0.0'.","The right robot arm continues moving down, now approximately 12cm from the red bowl. The coffee beans and blue bowl are static on the wooden table.","The right robot arm lowers its gripper to within 5cm of the red bowl. The left robot arm is inactive. The digital scale still displays '0.0'.","The right robot arm's gripper reaches and touches the rim of the red bowl. The distance is 0cm. The blue bowl remains on the scale.","The right robot arm grasps and lifts the red bowl about 5cm above the wooden table. The coffee beans are still inside the red bowl.","The right robot arm moves the red bowl over the blue bowl on the scale. The distance between the bowls is about 10cm. The scale reads '0.0'.","The right robot arm tilts the red bowl. The coffee beans are at the edge of the bowl, about 5cm above the blue bowl.","The right robot arm tilts further, and coffee beans begin to fall into the blue bowl. The digital scale is starting to register the weight.","A stream of coffee beans falls into the blue bowl. The digital scale reads '8.8'. The right robot arm holds the red bowl at a steep angle.","The red bowl is now empty, and the coffee beans are in the blue bowl. The digital scale displays '16.0'. The right robot arm is 5cm above the blue bowl.","The right robot arm moves the empty red bowl away from the blue bowl, heading back to the right side of the wooden table. The distance is 15cm.","The right robot arm places the empty red bowl on the wooden table. The blue bowl full of beans remains on the scale at '16.0'.","The right robot arm releases the red bowl and retracts slightly, about 5cm away. The final state shows the empty red bowl on the table and the coffee beans in the blue bowl on the scale reading '16.0'."],"progress":[0.0,0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.0,1.0,1.0],"criterion":"The task is successfully completed when the digital scale reads exactly '16.0' with the coffee beans poured into the blue bowl.","failure":null,"feedback":null},"fail":{"id":"coffee_task_ep0033","video":"./widget/data/videos/coffee_task_ep0033.mp4","duration":20.467,"task":"measure exactly 16g of coffee","entities":["left robot arm","right robot arm","blue bowl","red bowl","coffee beans","digital scale","wooden table","cables"],"descriptions":["On a wooden table, two robotic arms are positioned above a digital scale holding a blue bowl and a red bowl filled with coffee beans. The scale displays '0.0', and a person's legs and cables are visible in the background. The robotic arms are stationary.","The right robotic arm starts moving downwards and to the right towards the red bowl, reducing the distance between its gripper and the bowl. The left robotic arm remains in its initial position.","The right robotic arm descends further, positioning its open gripper directly over the red bowl containing coffee beans. The distance between the gripper and the bowl is now just a few centimeters.","The right robotic arm's gripper makes contact with and secures the rim of the red bowl. The distance between the gripper and the red bowl is zero as the arm prepares to lift it.","The right robotic arm lifts the red bowl off the wooden table and moves it laterally toward the blue bowl on the digital scale. The red bowl is held steady above the scale.","The right robotic arm begins to tilt the red bowl over the blue bowl, with the gripper rotating to initiate the pouring process. The distance between the red bowl's edge and the blue bowl is minimal.","Coffee beans are poured from the red bowl into the blue bowl as the right robotic arm continues tilting. The digital scale now reads '11.7', while the left arm remains idle.","The pouring concludes, and the right robotic arm begins to tilt the red bowl back to an upright position. The scale display has reached '14.8', and most coffee beans are now in the blue bowl.","The right robotic arm lowers the red bowl back onto the wooden table surface to the right of the scale. The distance between the red bowl and the table surface is zero.","The right robotic arm releases the red bowl and moves slightly upwards and away. The final scene shows the blue bowl with beans on the scale reading '14.8', the nearly empty red bowl on the table, and the stationary arms."],"progress":[0.0,0.05,0.1,0.15,0.2,0.25,0.73,0.93,0.93,0.93],"criterion":"The digital scale on the table displays exactly '16.0' with the blue bowl containing 16g of coffee beans poured from the red bowl.","failure":"The robot failed to measure exactly 16g of coffee, stopping the process once the scale reached 14.8g.","feedback":"The robot should have continued to tilt the red bowl to pour more beans into the blue bowl until the digital scale reading reached exactly 16.0."}};
  var STEPS = [
    { key: 'input', n: 1, title: 'Input', math: 'o<sub>1:T</sub>, l', sub: 'video + task',
      blurb: 'A video and a task. The entities that matter (robot parts, objects) are picked out of the task and the video.' },
    { key: 'describe', n: 2, title: 'Describe', math: 'D(o<sub>1:T</sub>, e)', sub: 'what happened?',
      blurb: 'The Describer narrates every key frame and <strong>never sees the task</strong>, so it cannot talk itself into success.' },
    { key: 'assess', n: 3, title: 'Assess', math: 'A(d<sub>1:T</sub>, c)', sub: 'how far along?',
      blurb: 'The Assessor writes explicit <strong>success criteria</strong> from the task, then scores the descriptions against them.' },
    { key: 'output', n: 4, title: 'Output', math: 'r<sub>1:T</sub>, f', sub: 'score + feedback',
      blurb: 'A dense score per frame, plus rich feedback on failures.' }
  ];
  var TOUR_MS = [2600, 3200, 3400, 4200];

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var el = {
    outcome: root.querySelectorAll('.mw-outcome button'),
    steps: root.querySelector('.mw-steps'),
    video: root.querySelector('.mw-video'),
    kf: root.querySelector('.mw-kf'),
    slider: root.querySelector('.mw-slider'),
    task: root.querySelector('.mw-task'),
    panel: root.querySelector('.mw-panel')
  };
  var state = { ep: 'ok', step: 0, kf: 0, touring: false, over: false, inView: false };
  var tourTimer = 0, sweepTimer = 0, tourIdx = 0, pendingSrc = false;
  var wrap = root.closest('details');
  function isOpen() { return !wrap || wrap.open; }

  function mk(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
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
    setKf(Math.min(state.kf, nKf() - 1));
    render();
  }

  function setKf(i) {
    state.kf = Math.max(0, Math.min(nKf() - 1, i));
    el.slider.value = String(state.kf);
    el.kf.textContent = 'key frame ' + (state.kf + 1) + ' / ' + nKf();
    var seek = function () {
      var d = el.video.duration && isFinite(el.video.duration) ? el.video.duration : ep().duration;
      // stay just inside the clip: seeking to the very end can show a blank frame
      try { el.video.currentTime = Math.min((nKf() > 1 ? state.kf / (nKf() - 1) : 0) * d, Math.max(0, d - 0.15)); } catch (e) { /* not ready yet */ }
    };
    if (el.video.readyState >= 1) seek(); else el.video.addEventListener('loadedmetadata', seek, { once: true });
    if (state.step > 0) render();
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
    var h = '<p class="mw-blurb">' + s.blurb + '</p>';
    if (s.key === 'input') {
      h += '<div class="mw-card is-input"><div class="mw-label">Entities <i>e</i></div><div class="mw-chips">' +
        e.entities.map(function (t) { return '<span class="mw-chip">' + t + '</span>'; }).join('') + '</div></div>';
    } else if (s.key === 'describe') {
      h += '<div class="mw-card is-describe"><div class="mw-label">Video description <i>d<sub>' + (state.kf + 1) + '</sub></i>' +
        '<span class="mw-blind" title="The Describer is never given the task">task hidden</span></div>' +
        '<p class="mw-text">' + e.descriptions[state.kf] + '</p></div>';
    } else if (s.key === 'assess') {
      h += '<div class="mw-card is-assess"><div class="mw-label">Success criteria <i>c</i></div><p class="mw-text">' + e.criterion + '</p></div>' +
        '<div class="mw-score"><span class="mw-label">Score <i>r<sub>' + (state.kf + 1) + '</sub></i></span>' +
        '<span class="mw-bar"><span class="mw-bar-fill" style="width:' + pct(e.progress[state.kf]) + '%"></span></span>' +
        '<span class="mw-score-num">' + pct(e.progress[state.kf]) + '%</span></div>';
    } else {
      h += '<div class="mw-out"><div class="mw-card is-score"><div class="mw-label">Score <i>r<sub>1:T</sub></i></div>' + chart(e) + '</div>' +
        '<div class="mw-card is-feedback ' + (e.failure ? 'is-fail' : 'is-ok') + '"><div class="mw-label">Rich language feedback <i>f</i></div>' +
        (e.failure
          ? '<p class="mw-text"><strong>What went wrong.</strong> ' + e.failure + '</p><p class="mw-text"><strong>What to do.</strong> ' + e.feedback + '</p>'
          : '<p class="mw-text">The criteria are met, so the task is complete and no feedback is needed.</p>') + '</div></div>';
    }
    p.innerHTML = h;
    p.classList.remove('mw-in'); void p.offsetWidth; p.classList.add('mw-in');
  }

  // ---- tour: step through the pipeline until the reader touches anything ----
  function sweep(done) {
    clearInterval(sweepTimer);
    var n = nKf(), k = 0;
    setKf(0);
    sweepTimer = setInterval(function () {
      k += 1;
      if (k >= n) { clearInterval(sweepTimer); if (done) done(); return; }
      setKf(k);
    }, Math.max(160, Math.round(2600 / n)));
  }

  function tourStep() {
    if (!state.touring) return;
    var i = tourIdx % STEPS.length;
    clearInterval(sweepTimer);
    setStep(i);
    if (i === 1) setKf(Math.round(nKf() * 0.4));
    if (i === 2) setKf(Math.round(nKf() * 0.7));
    if (i === 3) sweep();
    tourIdx += 1;
    tourTimer = setTimeout(tourStep, TOUR_MS[i]);
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

  buildSteps();
  setEpisode('ok');
})();
