// D&A-Bench results explorer (#bench-widget). Needs EPISODES and MODEL_META from widget/data/episodes.js,
// which is fetched when the widget gets close to the viewport (it is ~0.9 MB).
(function () {
  const root = document.getElementById('bench-widget');
  if (!root) return;

  function lazyData(src, target, onReady, onFail) {
    let started = false;
    function load() {
      if (started) return;
      started = true;
      const s = document.createElement('script');
      s.src = src;
      s.onload = onReady;
      s.onerror = onFail;
      document.body.appendChild(s);
    }
    if (!('IntersectionObserver' in window)) { load(); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      load();
    }, { rootMargin: '1000px 0px' });
    io.observe(target);
  }

  // Phrases to bold in the featured rollout, keyed by episode id. Everything else renders plain.
  const HIGHLIGHTS = {
    cable_task_ep0045: {
      desc: {
        2: ["right arm's gripper is moving toward the white and black cables"],
        5: ['the right gripper closes around the white and black cables'],
        6: ['causing them to begin disconnecting'],
        7: ['The white and black cables are completely unplugged'],
      },
      failure: ['unplugged both the white and black cables', "violating the 'only' constraint"],
      feedback: ['specifically targeted the white cable', 'black cable remained connected'],
      completion: ['black cable remains plugged into the black box'],
      // critical states for the one-time auto tour: start, reach, grasp, unplug, end
      tour: [0, 2, 5, 7, 10],
    },
  };
  const DEFAULT_EPISODE = 'cable_task_ep0045';
  const TOUR_MS = 500;

  function initBench() {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const PAD_L = 40, PAD_R = 12, PAD_T = 12, PAD_B = 36;
    const DNA_COLOR = '#D81B60';
    let chartW = 520, chartH = 240; // 1 SVG unit = 1 CSS px, so chart text renders at its CSS size

    const state = {
      epIndex: 0,
      stepIndex: -1, // sentinel so the first render always fires
      rawPosition: 0,
      playing: false,
      speed: 1,
      hiddenModels: new Set(),
      touring: false,   // auto-stepping through key points (loops until the reader interacts)
      tourOver: false,  // the reader took over; never auto-step again
      inView: false,
    };

    const el = {
      select: document.getElementById('episode-select'),
      btnRandom: document.getElementById('btn-random'),
      instructionLabel: document.getElementById('instruction-label'),
      groundTruthBadge: document.getElementById('ground-truth-badge'),
      videoWrap: document.getElementById('video-wrap'),
      video: document.getElementById('frame-video'),
      stepBadge: document.getElementById('step-badge'),
      descriptionText: document.getElementById('description-text'),
      outcomeFailure: document.getElementById('outcome-failure'),
      outcomeFailureRow: document.getElementById('outcome-failure-row'),
      outcomeFeedback: document.getElementById('outcome-feedback'),
      outcomeFeedbackRow: document.getElementById('outcome-feedback-row'),
      outcomeCompletion: document.getElementById('outcome-completion'),
      chart: document.getElementById('chart'),
      slider: document.getElementById('step-slider'),
      legend: document.getElementById('legend'),
      btnPlay: document.getElementById('btn-play'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      speedBtns: Array.from(document.querySelectorAll('#bench-widget .speed-btn')),
    };

    // label color for a data-color swatch, picked by luminance
    function onColor(hex) {
      const c = [1, 3, 5].map((i) => {
        const v = parseInt(hex.substr(i, 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) > 0.179 ? '#000' : '#fff';
    }

    function currentEpisode() {
      return EPISODES[state.epIndex];
    }

    function buildSelect() {
      const byTask = new Map();
      EPISODES.forEach((ep, i) => {
        if (!byTask.has(ep.task)) byTask.set(ep.task, []);
        byTask.get(ep.task).push(i);
      });
      el.select.innerHTML = '';
      byTask.forEach((indices) => {
        const group = document.createElement('optgroup');
        group.label = EPISODES[indices[0]].task_label;
        indices.forEach((i) => {
          const ep = EPISODES[i];
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = `${ep.task_label} · ${ep.episode} — ${ep.ground_truth}`;
          group.appendChild(opt);
        });
        el.select.appendChild(group);
      });
    }

    // Solid-color "model badge" chips, same style as the Scaling section's
    // legend: toggle buttons, except the always-on D&A entry (a label).
    function buildLegend() {
      const ep = currentEpisode();
      el.legend.innerHTML = '';

      const dnaChip = document.createElement('span');
      dnaChip.className = 'legend-chip is-model is-dna is-static';
      dnaChip.style.setProperty('--c', DNA_COLOR);
      dnaChip.style.setProperty('--on-c', onColor(DNA_COLOR));
      dnaChip.title = 'D&A is always shown';
      dnaChip.textContent = 'D&A';
      el.legend.appendChild(dnaChip);

      Object.keys(MODEL_META).forEach((key) => {
        if (!ep.models[key]) return;
        const meta = MODEL_META[key];
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'legend-chip is-model';
        chip.style.setProperty('--c', meta.color);
        chip.style.setProperty('--on-c', onColor(meta.color));
        chip.textContent = meta.label;
        const off = state.hiddenModels.has(key);
        chip.classList.toggle('is-off', off);
        chip.setAttribute('aria-pressed', String(!off));
        chip.addEventListener('click', () => {
          if (state.hiddenModels.has(key)) state.hiddenModels.delete(key);
          else state.hiddenModels.add(key);
          const hidden = state.hiddenModels.has(key);
          chip.classList.toggle('is-off', hidden);
          chip.setAttribute('aria-pressed', String(!hidden));
          const line = document.getElementById(`model-line-${key}`);
          if (line) line.style.display = hidden ? 'none' : '';
        });
        el.legend.appendChild(chip);
      });
    }

    // text with the given phrases wrapped in <strong>
    function setRich(node, text, phrases) {
      node.textContent = '';
      if (!phrases || !phrases.length) { node.textContent = text; return; }
      const re = new RegExp('(' + phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')');
      text.split(re).forEach((part, i) => {
        if (i % 2) {
          const b = document.createElement('strong');
          b.textContent = part;
          node.appendChild(b);
        } else if (part) {
          node.appendChild(document.createTextNode(part));
        }
      });
    }

    function highlights() {
      return HIGHLIGHTS[currentEpisode().id] || {};
    }

    function setOutcomeRow(row, textEl, value, phrases) {
      const empty = !value || value === '-';
      row.hidden = empty;
      setRich(textEl, empty ? '' : value, phrases);
    }

    function selectEpisode(i) {
      stopPlayback();
      state.epIndex = i;
      state.stepIndex = -1;
      el.select.value = i;

      const ep = currentEpisode();
      el.instructionLabel.textContent = ep.instruction;
      el.groundTruthBadge.textContent = `${ep.ground_truth.charAt(0).toUpperCase()}${ep.ground_truth.slice(1)} Trajectory`;
      el.groundTruthBadge.className = 'tag ' + (ep.ground_truth === 'success' ? 'is-success is-light' : ep.ground_truth === 'failure' ? 'is-danger is-light' : 'is-light');

      const hl = highlights();
      setOutcomeRow(el.outcomeFailureRow, el.outcomeFailure, ep.failure, hl.failure);
      setOutcomeRow(el.outcomeFeedbackRow, el.outcomeFeedback, ep.feedback, hl.feedback);
      setRich(el.outcomeCompletion, ep.completion_state || '-', hl.completion);

      // cache-bust: forces a fresh fetch instead of a browser-cached copy
      // of a video that may have been re-encoded since it was last visited
      el.videoWrap.classList.add('is-loading');
      el.video.src = './widget/' + ep.video + '?v=3';
      el.video.load();
      applySpeed(); // load() resets the playback rate

      el.slider.max = ep.dna_progress.length - 1;

      buildLegend();
      drawChartStatic();
      handleRawPosition(0);
    }

    function applySpeed() {
      el.video.defaultPlaybackRate = state.speed;
      el.video.playbackRate = state.speed;
    }

    // rawPosition lives in "D&A key-point" units [0, numSteps-1], the
    // only resolution D&A's captions/failure-analysis exist at. The
    // video and the progress readout are continuous, so both are derived
    // from rawPosition's fractional position within the full episode
    // (frac = rawPosition / (numSteps-1)) rather than snapped to it.
    function syncToRawPosition(rawPosition, seekVideo) {
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      const clamped = Math.max(0, Math.min(numSteps - 1, rawPosition));
      const frac = numSteps > 1 ? clamped / (numSteps - 1) : 0;

      state.rawPosition = clamped;
      el.slider.value = clamped;

      updatePlayhead(frac); // 0-1, interpolated from dna_continuous

      if (seekVideo) el.video.currentTime = frac * ep.duration;

      applyKeyPointIfChanged(Math.round(clamped));
    }

    function handleRawPosition(rawPosition) {
      syncToRawPosition(rawPosition, true);
    }

    // Descriptions only exist at D&A's sparse caption indices, so that
    // part of the UI still snaps; it never becomes continuous.
    function applyKeyPointIfChanged(snapped) {
      if (snapped === state.stepIndex) return;
      const ep = currentEpisode();
      state.stepIndex = snapped;
      const label = `key frame ${snapped + 1} / ${ep.dna_progress.length}`;
      el.stepBadge.textContent = label;
      el.slider.setAttribute('aria-valuetext', `Key frame ${snapped + 1} of ${ep.dna_progress.length}`);
      setRich(el.descriptionText, ep.descriptions[snapped], (highlights().desc || {})[snapped]);
    }

    function xForFrac(frac) {
      return PAD_L + frac * (chartW - PAD_L - PAD_R);
    }

    function yForValue01(v) {
      const clamped = Math.max(0, Math.min(1, v));
      return chartH - PAD_B - clamped * (chartH - PAD_T - PAD_B);
    }

    function svgEl(name, attrs) {
      const node = document.createElementNS(SVG_NS, name);
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
      return node;
    }

    function sizeChart() {
      chartW = Math.max(240, Math.round(el.chart.clientWidth || 520));
      chartH = Math.max(180, Math.min(300, Math.round(chartW * 0.5)));
      el.chart.setAttribute('viewBox', `0 0 ${chartW} ${chartH}`);
      el.chart.style.aspectRatio = `${chartW} / ${chartH}`;
    }

    function drawChartStatic() {
      sizeChart();
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      const svg = el.chart;
      svg.innerHTML = '';

      // gridlines + y labels
      [0, 25, 50, 75, 100].forEach((v) => {
        const y = yForValue01(v / 100);
        svg.appendChild(svgEl('line', { x1: PAD_L, x2: chartW - PAD_R, y1: y, y2: y, class: 'grid-line' }));
        const text = svgEl('text', { x: PAD_L - 6, y: y + 4, 'text-anchor': 'end', class: 'axis-text' });
        text.textContent = v;
        svg.appendChild(text);
      });

      // x axis labels (percent of episode duration)
      [0, 0.25, 0.5, 0.75, 1].forEach((frac) => {
        const text = svgEl('text', {
          x: xForFrac(frac),
          y: chartH - PAD_B + 16,
          'text-anchor': frac === 0 ? 'start' : frac === 1 ? 'end' : 'middle',
          class: 'axis-text',
        });
        text.textContent = `${Math.round(frac * 100)}%`;
        svg.appendChild(text);
      });

      // axis titles
      const xTitle = svgEl('text', { x: (PAD_L + chartW - PAD_R) / 2, y: chartH - 2, 'text-anchor': 'middle', class: 'axis-title' });
      xTitle.textContent = 'episode time';
      svg.appendChild(xTitle);
      const midY = (PAD_T + chartH - PAD_B) / 2;
      const yTitle = svgEl('text', { x: 11, y: midY, 'text-anchor': 'middle', class: 'axis-title', transform: `rotate(-90 11 ${midY})` });
      yTitle.textContent = 'progress (%)';
      svg.appendChild(yTitle);

      // baseline model curves (drawn first, underneath D&A)
      Object.keys(MODEL_META).forEach((key) => {
        const vals = ep.models[key];
        if (!vals) return;
        const meta = MODEL_META[key];
        const m = vals.length;
        const points = vals.map((v, k) => `${xForFrac(k / (m - 1))},${yForValue01(v)}`).join(' ');
        const polyline = svgEl('polyline', { points: points, class: 'model-line', id: `model-line-${key}`, stroke: meta.color });
        if (meta.dash) polyline.setAttribute('stroke-dasharray', meta.dash);
        if (state.hiddenModels.has(key)) polyline.style.display = 'none';
        svg.appendChild(polyline);
      });

      // D&A continuous progress polyline: a smooth interpolation of
      // D&A's own (sparse) dna_feedback progress array, so it always
      // agrees with the description/failure/feedback text it's paired
      // with (deliberately not a separate plain progress-estimation
      // curve, which comes from an independent call and can disagree).
      const dnaVals = ep.dna_continuous;
      const dnaM = dnaVals.length;
      const dnaPoints = dnaVals.map((v, k) => `${xForFrac(k / (dnaM - 1))},${yForValue01(v)}`).join(' ');
      svg.appendChild(svgEl('polyline', { points: dnaPoints, class: 'dna-line' }));

      // sparse markers at D&A's own caption/key-point positions; they sit
      // exactly on the line above, since that's just this same array
      // interpolated to a smooth curve.
      ep.dna_progress.forEach((v, i) => {
        svg.appendChild(svgEl('circle', { cx: xForFrac(i / (numSteps - 1)), cy: yForValue01(v), r: 3.5, class: 'dna-dot' }));
      });

      // playhead (created once per draw, position updated separately)
      svg.appendChild(svgEl('line', { id: 'playhead-line', y1: PAD_T, y2: chartH - PAD_B, class: 'playhead-line' }));
      svg.appendChild(svgEl('circle', { id: 'playhead-dot', r: 5, class: 'playhead-dot' }));
    }

    // Linearly interpolates a value from a downsampled curve at any
    // fractional position in [0, 1].
    function valueAtFrac(arr, frac) {
      const m = arr.length;
      const pos = Math.max(0, Math.min(1, frac)) * (m - 1);
      const i0 = Math.floor(pos);
      const i1 = Math.min(m - 1, Math.ceil(pos));
      const t = pos - i0;
      return arr[i0] + (arr[i1] - arr[i0]) * t;
    }

    // Moves the playhead to a continuous fractional position along the
    // D&A continuous-progress line (glides smoothly instead of hopping
    // between key points) and returns the interpolated value (0-1).
    function updatePlayhead(frac) {
      const ep = currentEpisode();
      const x = xForFrac(frac);
      const v = valueAtFrac(ep.dna_continuous, frac);
      const y = yForValue01(v);

      const line = document.getElementById('playhead-line');
      const dot = document.getElementById('playhead-dot');
      if (line) { line.setAttribute('x1', x); line.setAttribute('x2', x); }
      if (dot) { dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
      return v;
    }

    // Discrete step navigation (buttons, keyboard): always snaps to a
    // whole key point.
    function setStep(i) {
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      handleRawPosition(Math.max(0, Math.min(numSteps - 1, Math.round(i))));
    }

    function rawPositionFromClientX(clientX) {
      const rect = el.chart.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * chartW;
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      const frac = (relX - PAD_L) / (chartW - PAD_L - PAD_R);
      return frac * (numSteps - 1);
    }

    function setPlayButton(playing) {
      const icon = playing ? 'fa-pause' : 'fa-play';
      el.btnPlay.innerHTML = `<span class="icon is-small"><i class="fas ${icon}"></i></span>`;
      const label = playing ? 'Pause' : 'Play';
      el.btnPlay.setAttribute('aria-label', label);
      el.btnPlay.title = label;
      el.videoWrap.classList.toggle('is-playing', playing);
    }

    function stopPlayback() {
      state.playing = false;
      el.video.pause();
      setPlayButton(false);
    }

    // While the video plays natively (full fps, real time), its own clock
    // drives the scrub position every animation frame, so the playhead
    // glides instead of jumping at timeupdate's ~4 Hz. Descriptions still
    // only update when we cross a key point.
    let rafId = 0;
    function tick() {
      if (!state.playing) return;
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      const frac = ep.duration > 0 ? Math.max(0, Math.min(1, el.video.currentTime / ep.duration)) : 0;
      syncToRawPosition(frac * (numSteps - 1), false);
      rafId = requestAnimationFrame(tick);
    }

    function startPlayback() {
      const ep = currentEpisode();
      if (Math.round(state.rawPosition) >= ep.dna_progress.length - 1) {
        setStep(0); // also seeks the video back to the start
      }
      state.playing = true;
      setPlayButton(true);
      const p = el.video.play();
      if (p && p.catch) p.catch(() => { if (state.playing) stopPlayback(); });
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function togglePlayback() {
      if (state.playing) stopPlayback(); else startPlayback();
    }

    el.video.addEventListener('ended', () => stopPlayback());
    el.video.addEventListener('loadeddata', () => el.videoWrap.classList.remove('is-loading'));
    el.video.addEventListener('error', () => el.videoWrap.classList.remove('is-loading'));
    el.video.addEventListener('click', togglePlayback);

    // --- events ---
    // Dragging the slider itself is continuous (step="any"); arrow/paging
    // keys jump straight from key point to key point.
    el.select.addEventListener('change', (e) => selectEpisode(parseInt(e.target.value, 10)));

    // same dice animation as the grid: the die spins and the swapped content pops in
    function rollFx(btn, panels) {
      btn.classList.remove('is-rolling');
      void btn.offsetWidth;
      btn.classList.add('is-rolling');
      setTimeout(() => btn.classList.remove('is-rolling'), 700);
      panels.forEach((p) => {
        if (!p) return;
        p.classList.remove('dice-pop');
        void p.offsetWidth;
        p.classList.add('dice-pop');
        setTimeout(() => p.classList.remove('dice-pop'), 400);
      });
    }

    el.btnRandom.addEventListener('click', () => {
      // avoid repeating the same episode twice in a row when there's more than one
      let i = Math.floor(Math.random() * EPISODES.length);
      if (EPISODES.length > 1 && i === state.epIndex) i = (i + 1) % EPISODES.length;
      selectEpisode(i);
      rollFx(el.btnRandom, [el.videoWrap.closest('.bench-stage'), document.getElementById('widget-root-bottom')]);
    });

    el.slider.addEventListener('input', (e) => {
      stopPlayback();
      handleRawPosition(parseFloat(e.target.value));
    });

    el.slider.addEventListener('keydown', (e) => {
      const stepKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
      if (!stepKeys.includes(e.key)) return;
      e.preventDefault();
      stopPlayback();
      const ep = currentEpisode();
      const numSteps = ep.dna_progress.length;
      const current = Math.round(state.rawPosition);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') setStep(current - 1);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') setStep(current + 1);
      else if (e.key === 'Home') setStep(0);
      else if (e.key === 'End') setStep(numSteps - 1);
    });

    el.btnPrev.addEventListener('click', () => { stopPlayback(); setStep(Math.round(state.rawPosition) - 1); });
    el.btnNext.addEventListener('click', () => { stopPlayback(); setStep(Math.round(state.rawPosition) + 1); });
    el.btnPlay.addEventListener('click', togglePlayback);

    el.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.speed = parseFloat(btn.dataset.speed);
        el.speedBtns.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        applySpeed();
      });
    });

    // Dragging on the chart itself is continuous too: the playhead glides
    // along the line, snapping the video/description only at key points.
    let dragging = false;
    el.chart.addEventListener('pointerdown', (e) => {
      dragging = true;
      stopPlayback();
      handleRawPosition(rawPositionFromClientX(e.clientX));
      el.chart.setPointerCapture(e.pointerId);
    });
    el.chart.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      handleRawPosition(rawPositionFromClientX(e.clientX));
    });
    el.chart.addEventListener('pointerup', () => { dragging = false; });
    el.chart.addEventListener('pointercancel', () => { dragging = false; });

    // keep chart text at its CSS size when the container changes width
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        const w = Math.round(el.chart.clientWidth);
        if (!w || Math.abs(w - chartW) < 2) return;
        drawChartStatic();
        updatePlayhead(state.rawPosition / Math.max(1, currentEpisode().dna_progress.length - 1));
      }).observe(el.chart);
    }

    // --- auto tour: steps through the key points until the reader touches anything ---
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let tourTimer = 0;

    function setTouring(on) {
      state.touring = on;
      root.classList.toggle('is-touring', on);
    }

    let tourIdx = 0;

    function tourSteps() {
      const ep = currentEpisode();
      return (HIGHLIGHTS[ep.id] || {}).tour || ep.dna_progress.map((_, i) => i);
    }

    // loops through the critical states (resting a little on the last one) until the reader interacts
    function tourStep() {
      if (!state.touring) return;
      const steps = tourSteps();
      tourIdx = (tourIdx + 1) % steps.length;
      setStep(steps[tourIdx]);
      tourTimer = setTimeout(tourStep, tourIdx === steps.length - 1 ? TOUR_MS * 4 : TOUR_MS);
    }

    function startTour() {
      if (state.tourOver || state.touring || !state.inView || reduceMotion.matches) return;
      setTouring(true);
      setStep(tourSteps()[tourIdx]);
      tourTimer = setTimeout(tourStep, TOUR_MS);
    }

    function pauseTour() {
      clearTimeout(tourTimer);
      setTouring(false);
    }

    function endTour() {
      state.tourOver = true;
      pauseTour();
    }

    ['pointerdown', 'keydown', 'input', 'change'].forEach((type) => root.addEventListener(type, endTour, true));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        state.inView = entries.some((e) => e.isIntersecting);
        if (state.inView) startTour(); else pauseTour();
      }, { threshold: 0.5 }).observe(root);
    }

    // --- init ---
    buildSelect();
    selectEpisode(Math.max(0, EPISODES.findIndex((e) => e.id === DEFAULT_EPISODE)));
    [el.select, el.btnRandom, el.slider, el.btnPrev, el.btnNext, el.btnPlay].forEach((c) => { c.disabled = false; });
    root.removeAttribute('aria-busy');
  }

  root.setAttribute('aria-busy', 'true');
  lazyData('./widget/data/episodes.js?v=2', root, initBench, () => {
    const sel = document.getElementById('episode-select');
    if (sel) sel.innerHTML = '<option>Could not load rollouts</option>';
    root.removeAttribute('aria-busy');
  });
})();
