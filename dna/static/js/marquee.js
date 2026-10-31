/* Hero marquee: rollouts drift right to left; hovering one plays it with D&A's description and progress.
   Needs MARQUEE_POOL from marquee-data.js: the header and the bottom grid both sample from that one pool. */
(function () {
  'use strict';

  var root = document.getElementById('marquee');
  var pool = window.MARQUEE_POOL;
  if (!root || !pool || !pool.length) return;
  var GRID_N = 20;                     // 4 x 5 below the header
  // What the header must always contain: one clip from every source, plus these (AlphaNIST, SGS and the SCORE clips)
  var MUST_IDS = ['Misc_alphanist', 'Misc_nut_threading', 'Misc_05b_score_solo', 'Misc_ep_000'];   // AlphaNIST, SGS, SCORE
  var sourceOf = function (e) { return e.org || 'Misc'; };
  var isMultistep = function (e) { return e.id.indexOf('Multistep_') === 0; };   // 18 near-identical sim clips: kept under 10% of the header

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var rows = root.querySelectorAll('.marquee-row');
  var HEADER_N = rows.length * 9;      // 9 clips per row; the last row sits just below the first screen
  var active = null;
  var rafId = 0;
  var resumeTimer = 0;
  var lifted = null; // geometry of the hovered clip at full zoom, in page coordinates

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SW = 100, SH = 40; // sparkline viewBox

  function sparkline(ep) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'marquee-spark');
    svg.setAttribute('viewBox', '0 0 ' + SW + ' ' + SH);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var n = ep.progress.length;
    var pts = ep.progress.map(function (v, i) {
      return (i / (n - 1) * SW).toFixed(1) + ',' + (SH - v * SH).toFixed(1);
    }).join(' ');
    var line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('class', 'marquee-spark-line');
    var head = document.createElementNS(SVG_NS, 'line');
    head.setAttribute('class', 'marquee-spark-head');
    head.setAttribute('y1', 0);
    head.setAttribute('y2', SH);
    svg.appendChild(line);
    svg.appendChild(head);
    return { svg: svg, head: head };
  }

  function valueAt(arr, frac) {
    var pos = Math.max(0, Math.min(1, frac)) * (arr.length - 1);
    var i = Math.floor(pos);
    var j = Math.min(arr.length - 1, i + 1);
    return arr[i] + (arr[j] - arr[i]) * (pos - i);
  }

  // Clips (in both grids) can be scrubbed: press and slide along the clip to move through the rollout
  // (video, progress line, description and score follow); letting go resumes playback.
  function scrubbable(tile) {
    var scrub = null;
    function seek(e) {
      var v = tile._video;
      if (!v) return;
      var r = tile.getBoundingClientRect();
      var frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      var dur = v.duration && isFinite(v.duration) ? v.duration : tile._ep.duration;
      v.currentTime = frac * dur;
      render(tile);   // refresh caption, score and playhead right away
    }
    tile.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('.marquee-links')) return;
      activate(tile);
      if (!tile._video) return;
      scrub = e.pointerId;
      tile.classList.add('is-scrubbing');
      tile._video.pause();
      try { tile.setPointerCapture(e.pointerId); } catch (err) {}
      seek(e);
      e.preventDefault();
    });
    tile.addEventListener('pointermove', function (e) { if (scrub === e.pointerId) seek(e); });
    function end(e) {
      if (scrub !== e.pointerId) return;
      scrub = null;
      tile.classList.remove('is-scrubbing');
      if (tile._video && tile.classList.contains('is-active')) { var p = tile._video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    tile.addEventListener('pointerup', end);
    tile.addEventListener('pointercancel', end);
  }

  function makeTile(ep, interactive) {
    var tile = el('div', 'marquee-tile');
    if (interactive) {
      tile.tabIndex = 0;
      tile.setAttribute('role', 'group');
      tile.setAttribute('aria-label', ep.instruction);
    } else {
      tile.setAttribute('aria-hidden', 'true');
    }

    var img = el('img', 'marquee-poster');
    img.src = './static/images/marquee/' + ep.id + '.jpg';
    img.alt = '';
    img.width = 400;
    img.height = 225;
    img.loading = 'lazy';
    img.decoding = 'async';
    tile.appendChild(img);

    // every clip carries a badge; where the source had no label it is D&A's own call (final progress)
    var ok = ep.gt === 'success';
    var mark = el('span', 'marquee-mark ' + (ok ? 'is-success' : 'is-failure'), ok ? 'Success' : 'Failure');
    mark.setAttribute('aria-label', ep.gt + (ep.inferred ? ' (predicted by D&A)' : ''));
    if (ep.inferred) mark.title = 'No ground-truth label: predicted by D&A';
    tile.appendChild(mark);

    // top right: open this clip in the demo, and the original video's source
    if (interactive) {
      var links = el('span', 'marquee-links');
      var demo = el('a', 'marquee-demo', 'Open in demo');
      demo.href = './demo/index.html?clip=' + encodeURIComponent(ep.id);
      demo.title = 'Load this clip and its D&A annotations in the demo';
      links.appendChild(demo);
      if (ep.url) {
        var src = el('a', 'marquee-src');
        src.href = ep.url;
        src.target = '_blank';
        src.rel = 'noopener';
        src.title = 'Original video: ' + ep.org;
        src.setAttribute('aria-label', 'Original video from ' + ep.org);
        src.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        links.appendChild(src);
      }
      tile.appendChild(links);
    }

    var spark = sparkline(ep);
    tile.appendChild(spark.svg);

    var info = el('div', 'marquee-info');
    var head = el('div', 'marquee-info-head');
    var task = el('span', 'marquee-task');
    task.appendChild(el('span', 'marquee-label', 'Task: '));
    task.appendChild(document.createTextNode(ep.instruction));
    head.appendChild(task);
    var score = el('span', 'marquee-score', '0/100');
    head.appendChild(score);
    info.appendChild(head);
    var text = el('p', 'marquee-text');
    text.appendChild(el('span', 'marquee-label', 'Description: '));
    var body = document.createTextNode('');
    text.appendChild(body);
    info.appendChild(text);
    tile.appendChild(info);

    tile._ep = ep;
    tile._ui = { body: body, head: spark.head, score: score };
    tile.addEventListener('pointerenter', function () { activate(tile); });
    if (interactive) scrubbable(tile);
    tile.addEventListener('pointerleave', function () { deactivate(tile); });
    tile.addEventListener('focus', function () { activate(tile); });
    tile.addEventListener('blur', function () { deactivate(tile); });
    return tile;
  }

  function render(tile) {
    var ep = tile._ep;
    var v = tile._video;
    var frac = v && ep.duration ? Math.min(1, v.currentTime / ep.duration) : 0;
    var k = Math.round(frac * (ep.descriptions.length - 1));
    var last = k === ep.descriptions.length - 1;
    tile._ui.body.nodeValue = last && ep.failure ? ep.failure : ep.descriptions[k];
    tile._ui.score.textContent = Math.round(valueAt(ep.progress, frac) * 100) + '/100';
    var x = (frac * SW).toFixed(1);
    tile._ui.head.setAttribute('x1', x);
    tile._ui.head.setAttribute('x2', x);
  }

  function loop() {
    if (!active) return;
    render(active);
    rafId = requestAnimationFrame(loop);
  }

  // The hovered clip should read as above the title card. Rows are separate layers, so instead of
  // re-stacking, cut a rounded hole in the card exactly where the zoomed clip lands.
  var card0 = root.querySelector('.marquee-overlay');
  function cutHole() {
    if (!card0) return;
    if (!lifted) { card0.style.clipPath = ''; return; }
    var c = card0.getBoundingClientRect();
    var x = lifted.left - window.scrollX - c.left;
    var y = lifted.top - window.scrollY - c.top;
    var w = lifted.width, h = lifted.height, r = lifted.radius;
    var path = 'M-2000 -2000H4000V4000H-2000Z' +
      'M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r +
      'v' + (h - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r +
      'h' + (-(w - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + (-r) +
      'v' + (-(h - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (-r) + 'Z';
    card0.style.clipPath = 'path(evenodd, "' + path + '")';
  }

  function liftGeometry(tile) {
    var b = tile.getBoundingClientRect(); // measured before the zoom starts
    var cs = getComputedStyle(tile);
    var s = parseFloat(cs.getPropertyValue('--lift')) || 1.35;
    var o = cs.transformOrigin.split(' ');   // px from the tile's top left; edge tiles zoom inward
    var ox = parseFloat(o[0]) || b.width / 2, oy = parseFloat(o[1]) || b.height / 2;
    return {
      left: b.left + window.scrollX + ox * (1 - s),
      top: b.top + window.scrollY + oy * (1 - s),
      width: b.width * s, height: b.height * s,
      radius: 8 * s
    };
  }

  function activate(tile) {
    if (active === tile) return;
    if (active) deactivate(active);
    active = tile;
    lifted = liftGeometry(tile);
    cutHole();
    tile.classList.add('is-active');
    root.classList.add('has-active', 'has-used', 'is-paused');
    clearTimeout(resumeTimer);
    if (!tile._video) {
      var v = el('video', 'marquee-video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');
      v.src = tile._ep.video || './widget/data/robot_videos/' + tile._ep.id + '.mp4';
      tile.insertBefore(v, tile.querySelector('.marquee-poster').nextSibling);
      tile._video = v;
    }
    var p = tile._video.play();
    if (p && p.catch) p.catch(function () {});
    render(tile);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function deactivate(tile) {
    tile.classList.remove('is-active');
    if (active === tile) {
      lifted = null;
      cutHole();
      root.classList.remove('has-active');
      // resume shortly after, so moving between neighbouring clips doesn't make the grid twitch
      resumeTimer = setTimeout(function () { if (!active) root.classList.remove('is-paused'); }, 250);
    }
    if (tile._video) {
      tile._video.pause();
      tile._video.currentTime = 0;
    }
    if (active === tile) {
      active = null;
      cancelAnimationFrame(rafId);
    }
  }

  // the title card is sticky; flag it once it has come to rest at the bottom of the stage
  var card = root.querySelector('.marquee-overlay');
  function updateDock() {
    if (!card) return;
    var docked = card.getBoundingClientRect().bottom >= root.getBoundingClientRect().bottom - 1;
    card.classList.toggle('is-docked', docked);
  }
  window.addEventListener('scroll', function () { updateDock(); if (lifted) cutHole(); }, { passive: true });
  window.addEventListener('resize', updateDock);

  // header: a random draw from the pool (about one failure per 3-4 successes); row r takes entries i % rows == r
  var episodes = layoutRows(pickVaried(pool, HEADER_N, MUST_IDS), rows.length, 9);
  var inHeader = {};
  episodes.forEach(function (e) { inHeader[e.id] = true; });

  var headerRows = [];   // per row: the clips in column order and the tiles of each loop copy
  rows.forEach(function (row, r) {
    var mine = episodes.filter(function (_, i) { return i % rows.length === r; });
    // a second, inert copy makes the -50% loop seamless; reduced motion scrolls by hand instead
    var copies = reduceMotion.matches ? 1 : 2;
    var tiles = [];
    for (var c = 0; c < copies; c++) {
      var track = el('div', 'marquee-track');
      tiles[c] = mine.map(function (ep) { var t = makeTile(ep, c === 0); track.appendChild(t); return t; });
      row.appendChild(track);
    }
    headerRows.push({ eps: mine, tiles: tiles });
  });

  // The first screen should show AlphaNIST and SGS (nut threading). They are always in the header, but the rows
  // start at different offsets, so swap each into a slot that is on screen and not behind the title box.
  (function showHighlights() {
    var cardEl = root.querySelector('.marquee-overlay');
    if (!cardEl) return;
    var card = cardEl.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    function open(t) {
      var b = t.getBoundingClientRect();
      var inView = b.left >= 8 && b.right <= vw - 8 && b.top >= 0 && b.bottom <= vh;
      var behindCard = !(b.right < card.left || b.left > card.right || b.bottom < card.top || b.top > card.bottom);
      return inView && !behindCard;
    }
    function slotOpen(r, c) { return headerRows[r].tiles.some(function (copy) { return open(copy[c]); }); }
    function setSlot(r, c, ep) {
      headerRows[r].eps[c] = ep;
      headerRows[r].tiles.forEach(function (copy, k) {
        var t = makeTile(ep, k === 0);
        copy[c].parentNode.replaceChild(t, copy[c]);
        copy[c] = t;
      });
    }
    ['Misc_alphanist', 'Misc_nut_threading'].forEach(function (id) {
      var at = null;
      headerRows.forEach(function (row, r) { row.eps.forEach(function (e, c) { if (e.id === id) at = { r: r, c: c }; }); });
      if (!at || slotOpen(at.r, at.c)) return;
      var cands = [];
      headerRows.forEach(function (row, r) {
        row.eps.forEach(function (e, c) {
          if (e.gt !== 'failure' && MUST_IDS.indexOf(e.id) < 0 && slotOpen(r, c)) cands.push({ r: r, c: c });
        });
      });
      if (!cands.length) return;
      var to = cands[Math.floor(Math.random() * cands.length)];
      var mine = headerRows[at.r].eps[at.c], other = headerRows[to.r].eps[to.c];
      setSlot(to.r, to.c, mine);
      setSlot(at.r, at.c, other);
    });
  })();

  // ---- static grid: the same clips at rest, aligned with the page's boxes; the dice reshuffles it ----
  var gridEl = document.getElementById('hero-grid');
  var diceBtn = document.getElementById('hero-grid-dice');
  var staticTiles = [];

  function fillGrid(list, animate) {
    if (active) deactivate(active);
    gridEl.textContent = '';
    staticTiles = list.map(function (ep, i) {
      var t = makeTile(ep, true);
      if (animate) {
        t.classList.add('is-in');
        t.style.animationDelay = ((i % 5) * 22 + Math.floor(i / 5) * 22) + 'ms';
      }
      gridEl.appendChild(t);
      return t;
    });
  }

  // the bottom grid draws from the same pool; its successes avoid the header's (there are only 8 failures, so those may repeat)
  if (gridEl) fillGrid(sample(pool, GRID_N, inHeader), false);

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {   // Fisher-Yates
      var k = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[k]; a[k] = t;
    }
    return a;
  }

  // n clips: the must-haves, one from every source, then random fill, with about one failure per 3-4 successes
  function pickVaried(all, n, mustIds) {
    var chosen = {}, list = [];
    var maxMulti = Math.max(1, Math.ceil(n * 0.1) - 1), multi = 0;   // 45 tiles -> at most 4 (under 10%)
    function take(e) {
      if (!e || chosen[e.id]) return;
      if (isMultistep(e)) { if (multi >= maxMulti) return; multi++; }
      chosen[e.id] = true; list.push(e);
    }
    mustIds.forEach(function (id) { take(all.filter(function (e) { return e.id === id; })[0]); });
    var covered = {};
    list.forEach(function (e) { covered[sourceOf(e)] = true; });
    shuffled(all).forEach(function (e) {                   // one random clip per source not yet covered
      if (!covered[sourceOf(e)]) { covered[sourceOf(e)] = true; take(e); }
    });
    var restF = shuffled(all.filter(function (e) { return e.gt === 'failure' && !chosen[e.id] && !isMultistep(e); }));
    var restS = shuffled(all.filter(function (e) { return e.gt !== 'failure' && !chosen[e.id] && !(isMultistep(e) && multi >= maxMulti); }));
    var haveF = list.filter(function (e) { return e.gt === 'failure'; }).length;
    var wantF = Math.max(haveF, Math.min(haveF + restF.length, Math.round(n / 4.5)));
    while (haveF < wantF && restF.length) { take(restF.pop()); haveF++; }
    while (list.length < n && restS.length) take(restS.pop());
    while (list.length < n && restF.length) take(restF.pop());
    return list;
  }

  // R rows x C columns from a chosen set, failures spread evenly over the rows (never side by side);
  // returned in the order the page reads it: entry i belongs to row i % R
  function layoutRows(list, R, C) {
    var fails = shuffled(list.filter(function (e) { return e.gt === 'failure'; }));
    var succ = shuffled(list.filter(function (e) { return e.gt !== 'failure'; }));
    var nF = fails.length;
    var perRow = [];
    for (var r = 0; r < R; r++) perRow.push(Math.floor(nF / R));
    shuffled(Array.apply(null, Array(R)).map(function (_, i) { return i; })).slice(0, nF % R).forEach(function (r) { perRow[r]++; });
    var out = new Array(R * C);
    for (var row = 0; row < R; row++) {
      var k = perRow[row], used = {};
      for (var j = 0; j < k; j++) {
        var p = Math.min(C - 1, Math.floor((j + 0.15 + Math.random() * 0.7) * C / k));
        while (used[p] || used[p - 1] || used[p + 1]) p = (p + 1) % C;
        used[p] = true;
      }
      for (var c = 0; c < C; c++) out[c * R + row] = used[c] ? fails.pop() : succ.pop();
    }
    return out;
  }

  // n random clips with about one failure per 3-4 successes, failures spread out rather than clumped
  // `avoid` (ids to skip when possible): those clips are only used if the others run out
  function sample(all, n, avoid) {
    avoid = avoid || {};
    var fails = shuffled(all.filter(function (e) { return e.gt === 'failure'; }));
    var okS = shuffled(all.filter(function (e) { return e.gt !== 'failure' && !avoid[e.id]; }));
    var usedS = shuffled(all.filter(function (e) { return e.gt !== 'failure' && avoid[e.id]; }));
    var succ = usedS.concat(okS);                        // pop() takes the preferred ones first
    var nF = Math.min(fails.length, Math.round(n / 4.5));
    var slots = {};
    for (var i = 0; i < nF; i++) {
      var p = Math.round((i + 0.2 + Math.random() * 0.6) * n / nF);
      p = Math.min(n - 1, p);
      while (slots[p] || slots[p - 1] || slots[p + 1]) p = (p + 1) % n;   // never two failures side by side
      slots[p] = fails[i];
    }
    var spare = fails.slice(nF);
    // the 18 near-identical multistep sim clips stay under 10% of the grid (20 tiles -> at most 1)
    var maxMulti = Math.max(1, Math.ceil(n * 0.1) - 1), multi = 0;
    function nextSuccess() {
      var e;
      while ((e = succ.pop())) {
        if (!isMultistep(e)) return e;
        if (multi < maxMulti) { multi++; return e; }
      }
      return null;
    }
    var out = [];
    for (var k = 0; k < n; k++) out.push(slots[k] || nextSuccess() || spare.pop());
    return out.filter(Boolean);
  }

  var rolling = false;
  function roll() {
    if (rolling || !gridEl) return;
    rolling = true;
    diceBtn.classList.add('is-rolling');
    (function () {
      var picks = sample(pool, staticTiles.length || GRID_N);
      var quick = reduceMotion.matches;
      if (!quick) {
        staticTiles.forEach(function (t, i) {
          setTimeout(function () { t.classList.add('is-out'); }, (i % 5) * 22 + Math.floor(i / 5) * 22);
        });
      }
      setTimeout(function () {
        fillGrid(picks, !quick);
        setTimeout(function () {
          staticTiles.forEach(function (t) { t.classList.remove('is-in'); t.style.animationDelay = ''; });
          diceBtn.classList.remove('is-rolling');
          rolling = false;
        }, quick ? 0 : 750);
      }, quick ? 0 : 480);
    })();
  }
  if (diceBtn) diceBtn.addEventListener('click', roll);

  updateDock();
})();
