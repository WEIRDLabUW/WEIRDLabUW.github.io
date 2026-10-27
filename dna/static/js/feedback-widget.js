// CaP rich-feedback explorer (#feedback-widget). Needs CASES from widget-feedback/data/cases.js, which is
// fetched when the widget gets close to the viewport (it is ~2 MB).
(function () {
  const root = document.getElementById('feedback-widget');
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

  function initFeedback() {
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the two clips loop; they play together unless the reader paused them (or prefers reduced motion)
    const state = { caseIndex: 0, attempt: 0, playing: !reduceMotion, visible: true };

    const el = {
      select: document.getElementById('fb-case-select'),
      btnRandom: document.getElementById('fb-btn-random'),
      caption: document.getElementById('fb-case-caption'),
      slider: document.getElementById('fb-attempt-slider'),
      readout: document.getElementById('fb-attempt-readout'),
      btnPrev: document.getElementById('fb-btn-prev'),
      btnNext: document.getElementById('fb-btn-next'),
      btnPlay: document.getElementById('fb-btn-play'),
      compare: document.getElementById('fb-compare-root'),
      baseVideo: document.getElementById('fb-base-video'),
      dnaVideo: document.getElementById('fb-dna-video'),
      baseOutcome: document.getElementById('fb-base-outcome-tag'),
      dnaOutcome: document.getElementById('fb-dna-outcome-tag'),
      baseStrip: document.getElementById('fb-base-strip'),
      dnaStrip: document.getElementById('fb-dna-strip'),
      dnaAnalysis: document.getElementById('fb-dna-analysis'),
      dnaFailure: document.getElementById('fb-dna-failure'),
      dnaFeedback: document.getElementById('fb-dna-feedback'),
      dnaCritiqueRows: document.getElementById('fb-dna-critique-rows'),
      dnaCarriedRow: document.getElementById('fb-dna-carried-row'),
      dnaCarriedFeedback: document.getElementById('fb-dna-carried-feedback'),
    };
    const videos = [el.baseVideo, el.dnaVideo];

    function currentCase() { return CASES[state.caseIndex]; }

    function firstSuccessText(v) {
      return v === null || v === undefined ? 'never solved' : `attempt ${v}`;
    }

    // only positive (A4 > A1s) categories are showcased here
    const CATEGORY_ORDER = ['solved_only_by_dna', 'dna_faster'];
    const CATEGORY_LABELS = {
      solved_only_by_dna: 'Solved only with D&A feedback',
      dna_faster: 'Solved much faster with D&A feedback',
    };

    function buildSelect() {
      const groups = {};
      CASES.forEach((c, i) => { (groups[c.category] = groups[c.category] || []).push(i); });
      el.select.innerHTML = '';

      CATEGORY_ORDER.forEach((cat) => {
        if (!groups[cat] || !groups[cat].length) return;
        const group = document.createElement('optgroup');
        group.label = `${CATEGORY_LABELS[cat]} (${groups[cat].length})`;
        groups[cat].forEach((i) => {
          const c = CASES[i];
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = `${c.task_label} · Ep. ${c.ep}`;
          group.appendChild(opt);
        });
        el.select.appendChild(group);
      });
    }

    function updateCaption() {
      const c = currentCase();
      let msg;
      if (c.category === 'solved_only_by_dna') {
        msg = `Baseline never solved &ldquo;${c.goal}&rdquo; in its available attempts. With D&amp;A feedback, it succeeded on <b>${firstSuccessText(c.dna_first_success)}</b>.`;
      } else {
        msg = `On &ldquo;${c.goal}&rdquo;, baseline needed <b>${firstSuccessText(c.baseline_first_success)}</b> to first succeed. D&amp;A feedback cut this to <b>${firstSuccessText(c.dna_first_success)}</b>.`;
      }
      el.caption.innerHTML = msg;
    }

    // one cell per attempt, filled = success; clicking a cell jumps to that attempt
    function buildStrip(strip, arm) {
      strip.innerHTML = '';
      arm.attempts.forEach((a, i) => {
        const cell = document.createElement('span');
        cell.className = 'cell' + (a.success ? ' is-success' : '');
        cell.title = `Attempt ${i + 1}: ${a.steer_error ? 'api error (skipped)' : (a.success ? 'success' : 'failure')}`;
        cell.addEventListener('click', () => setAttempt(i));
        strip.appendChild(cell);
      });
    }

    function markStrip(strip) {
      Array.from(strip.children).forEach((cell, i) => cell.classList.toggle('is-current', i === state.attempt));
    }

    function selectCase(i) {
      state.caseIndex = i;
      el.select.value = i;
      const c = currentCase();
      el.slider.max = Math.max(c.baseline.attempts.length, c.dna.attempts.length) - 1;
      buildStrip(el.baseStrip, c.baseline);
      buildStrip(el.dnaStrip, c.dna);
      updateCaption();
      // start on the attempt where D&A first solved it, not attempt 1:
      // jump to whichever arm actually solved it (prefer D&A's solve point;
      // fall back to baseline's for the "DNA broke it" category)
      const startAttempt = (c.dna_first_success || c.baseline_first_success || 1) - 1;
      setAttempt(startAttempt);
    }

    function applyOutcomeTag(el_, success, steerError) {
      el_.textContent = steerError ? 'api error (skipped)' : (success ? 'success' : 'failure');
      el_.className = 'tag ' + (steerError ? 'is-light' : (success ? 'is-success is-light' : 'is-danger is-light'));
    }

    // Both clips start together: wait until each has a frame, then rewind and play.
    let loadToken = 0;
    function loadVideo(video, arm) {
      if (arm && arm.video) {
        video.src = './widget-feedback/' + arm.video;
        video.load();
        return true;
      }
      video.removeAttribute('src');
      return false;
    }

    function syncPlayback() {
      const wantPlay = state.playing && state.visible;
      videos.forEach((v) => {
        if (!v.getAttribute('src')) return;
        if (wantPlay) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
      });
    }

    function startTogether(token, pending) {
      let waiting = pending.length;
      if (!waiting) return;
      pending.forEach((v) => {
        const onReady = () => {
          v.removeEventListener('canplay', onReady);
          if (token !== loadToken) return;
          waiting -= 1;
          if (waiting > 0) return;
          pending.forEach((x) => { x.currentTime = 0; });
          syncPlayback();
        };
        if (v.readyState >= 3) onReady(); else v.addEventListener('canplay', onReady);
      });
    }

    function setPlayButton() {
      const playing = state.playing;
      el.btnPlay.innerHTML = `<span class="icon is-small"><i class="fas ${playing ? 'fa-pause' : 'fa-play'}"></i></span><span>${playing ? 'Pause' : 'Play'}</span>`;
      el.btnPlay.setAttribute('aria-label', playing ? 'Pause both videos' : 'Play both videos');
    }

    function setAttempt(n) {
      const c = currentCase();
      const nMax = Math.max(c.baseline.attempts.length, c.dna.attempts.length) - 1;
      state.attempt = Math.max(0, Math.min(nMax, n));
      el.slider.value = state.attempt;
      el.slider.setAttribute('aria-valuetext', `Attempt ${state.attempt + 1} of ${nMax + 1}`);
      el.readout.textContent = `attempt ${state.attempt + 1} / ${nMax + 1}`;
      markStrip(el.baseStrip);
      markStrip(el.dnaStrip);

      const b = c.baseline.attempts[state.attempt];
      const d = c.dna.attempts[state.attempt];
      const pending = [];
      loadToken += 1;

      if (b) {
        if (loadVideo(el.baseVideo, b)) pending.push(el.baseVideo);
        applyOutcomeTag(el.baseOutcome, b.success, b.steer_error);
      }
      if (d) {
        if (loadVideo(el.dnaVideo, d)) pending.push(el.dnaVideo);
        applyOutcomeTag(el.dnaOutcome, d.success, d.steer_error);

        // The environment's success/failure is ground truth; the critic's own
        // text can disagree (e.g. it still lists a "failure" on a run the env
        // scored as solved). On an env success, overwrite the critic's text
        // rather than show a contradictory critique next to a "success" tag.
        const hasCritique = !d.success && !!(d.failure || d.feedback);
        el.dnaAnalysis.textContent = d.success ? 'Task completed successfully.' : (d.analysis || '—');
        el.dnaCritiqueRows.hidden = !hasCritique;
        if (hasCritique) {
          el.dnaFailure.textContent = d.failure || '—';
          el.dnaFeedback.textContent = d.feedback || '—';
        }

        // Nothing to correct this attempt (env success, or a clean-success
        // critique): show what fed into THIS attempt instead of leaving it blank.
        const prev = c.dna.attempts[state.attempt - 1];
        const carried = !hasCritique && prev && prev.feedback;
        el.dnaCarriedRow.hidden = !carried;
        if (carried) el.dnaCarriedFeedback.textContent = prev.feedback;
      }
      startTogether(loadToken, pending);
    }

    el.select.addEventListener('change', (e) => selectCase(parseInt(e.target.value, 10)));
    el.slider.addEventListener('input', (e) => setAttempt(parseInt(e.target.value, 10)));
    el.btnPrev.addEventListener('click', () => setAttempt(state.attempt - 1));
    el.btnNext.addEventListener('click', () => setAttempt(state.attempt + 1));
    el.btnPlay.addEventListener('click', () => {
      state.playing = !state.playing;
      setPlayButton();
      syncPlayback();
    });

    el.btnRandom.addEventListener('click', () => {
      // avoid repeating the same case twice in a row when there's more than one
      let i = Math.floor(Math.random() * CASES.length);
      if (CASES.length > 1 && i === state.caseIndex) i = (i + 1) % CASES.length;
      selectCase(i);
    });

    // pause the loops while the comparison is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        state.visible = entries[entries.length - 1].isIntersecting;
        syncPlayback();
      }).observe(el.compare);
    }

    setPlayButton();
    buildSelect();
    selectCase(0);
    [el.select, el.btnRandom, el.slider, el.btnPrev, el.btnNext, el.btnPlay].forEach((c) => { c.disabled = false; });
    root.removeAttribute('aria-busy');
  }

  root.setAttribute('aria-busy', 'true');
  lazyData('./widget-feedback/data/cases.js?v=2', root, initFeedback, () => {
    const sel = document.getElementById('fb-case-select');
    if (sel) sel.innerHTML = '<option>Could not load cases</option>';
    root.removeAttribute('aria-busy');
  });
})();
