// Interactive Q-OIL maze demo (LMP blue palette): trains a tabular learner live, draws its
// value map over the maze, and lets the viewer take over by clicking or with the arrow keys.
(function () {
  "use strict";
  const M = window.QOILMaze;
  const root = document.getElementById("qoil-demo");
  if (!M || !root) return;

  const $ = (sel) => root.querySelector(sel);
  const arena = $(".demo-arena");
  const ctx = arena.getContext("2d");
  const chart = $(".demo-chart");
  const cctx = chart.getContext("2d");
  const details = root.closest("details");

  const STEP_HZ = 8;
  const TAKEOVER = "#d08a2f", GOAL_C = "#ac3f87";

  let rand, learner, stats;
  let algo = "qoil";          // "qoil" (decoupled critics) or "nodec" (one critic, the ablation)
  let heatMode = "opt";       // "opt" (value) or "bonus"
  let target = null;          // cell the viewer is steering toward (pointer held)
  const keys = new Set();     // arrow keys held while the maze has focus
  let prev = { ...M.START }, cur = { ...M.START }, lastStepAt = 0;
  let trail = [], lastActor = "robot", epTake = 0, epSteps = 0;

  function init() {
    let s = (Math.random() * 2 ** 31) | 0 || 1;
    rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    learner = new M.Learner(rand, { decoupled: algo === "qoil" });
    stats = { episodes: 0, successes: [], takeFrac: [] };
    prev = { ...M.START }; cur = { ...M.START };
    trail = [{ ...M.START, who: "robot" }];
    epTake = 0; epSteps = 0; lastActor = "robot";
    updateStats(); drawChart(); drawLegend();
  }

  // ------------------------------------------------------------ stepping
  const KEY_ACTION = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3 };

  function viewerAction() {
    for (const k of keys) return KEY_ACTION[k];
    if (target) {
      const { r, c } = learner.pos;
      if (r === target.r && c === target.c) return "hold";
      return M.stepToward(r, c, M.distancesTo(target));
    }
    return null;
  }

  function envStep() {
    const a = viewerAction();
    if (a === "hold") { lastActor = "you"; return; }       // parked on the clicked cell
    const who = a !== null ? "you" : "robot";
    const res = learner.step(who === "robot" ? null : a);
    lastActor = who;
    prev = res.prev; cur = res.next;
    trail.push({ ...res.next, who });
    epSteps += 1; if (res.takeover) epTake += 1;
    if (res.ended) {
      stats.episodes += 1;
      stats.successes.push(res.success ? 1 : 0);
      stats.takeFrac.push(epTake / epSteps);
      if (stats.successes.length > 400) { stats.successes.shift(); stats.takeFrac.shift(); }
      epTake = 0; epSteps = 0;
      cur = { ...M.START };
      trail = [{ ...M.START, who: "robot" }];
      drawChart();
    }
    updateStats();
    drawLegend();
  }

  // ------------------------------------------------------------ colors
  const SEQ = [[247, 249, 253], [208, 222, 251], [142, 180, 245], [66, 133, 244], [31, 63, 122]];
  const DIV = [[247, 246, 251], [221, 213, 240], [178, 159, 222], [129, 99, 196], [90, 62, 160]];
  function ramp(stops, t) {
    t = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    const a = stops[i], b = stops[i + 1];
    return `rgb(${[0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f)).join(",")})`;
  }

  function valueRange() {
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r < M.H; r++)
      for (let c = 0; c < M.W; c++)
        if (M.isFree(r, c)) { const v = learner.value(r, c, heatMode); if (v < lo) lo = v; if (v > hi) hi = v; }
    return [lo, hi - lo > 1e-6 ? hi : lo + 1];
  }

  // ------------------------------------------------------------ drawing
  let CW = 0, CH = 0, cell = 0, DPR = 1;
  function resize() {
    DPR = window.devicePixelRatio || 1;
    CW = arena.clientWidth; CH = arena.clientHeight;
    cell = Math.min(CW / M.W, CH / M.H);
    arena.width = Math.round(CW * DPR); arena.height = Math.round(CH * DPR);
    const cw = chart.clientWidth, ch = chart.clientHeight;
    chart.width = Math.round(cw * DPR); chart.height = Math.round(ch * DPR);
    drawChart();
  }
  const cx = (c) => (c + 0.5) * cell, cy = (r) => (r + 0.5) * cell;

  function draw(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, CW, CH);
    const [lo, hi] = valueRange(), stops = heatMode === "bonus" ? DIV : SEQ;
    for (let r = 0; r < M.H; r++)
      for (let c = 0; c < M.W; c++) {
        if (M.isFree(r, c)) {
          ctx.fillStyle = ramp(stops, (learner.value(r, c, heatMode) - lo) / (hi - lo));
          ctx.fillRect(c * cell, r * cell, cell + 0.5, cell + 0.5);
        } else {
          ctx.fillStyle = "#3a3d48";
          ctx.fillRect(c * cell, r * cell, cell + 0.5, cell + 0.5);
        }
      }

    // the robot's current best route from the start
    const path = learner.greedyPath();
    if (path.length > 1) {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const [w, col] of [[4.5, "rgba(28,29,34,0.35)"], [2, "#ffffff"]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(w > 3 ? [] : [5, 5]);
        ctx.beginPath(); ctx.moveTo(cx(path[0].c), cy(path[0].r));
        for (const p of path.slice(1)) ctx.lineTo(cx(p.c), cy(p.r));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // this episode so far: robot steps in ink, your takeover steps in orange
    ctx.lineWidth = Math.max(2.5, cell * 0.14); ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      ctx.strokeStyle = b.who === "you" ? TAKEOVER : "rgba(28,29,34,0.55)";
      ctx.beginPath(); ctx.moveTo(cx(a.c), cy(a.r)); ctx.lineTo(cx(b.c), cy(b.r)); ctx.stroke();
    }

    // start and goal
    ctx.fillStyle = "rgba(28,29,34,0.5)";
    ctx.beginPath(); ctx.arc(cx(M.START.c), cy(M.START.r), cell * 0.1, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx(M.GOAL.c), cy(M.GOAL.r), cell * 0.36, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = GOAL_C; ctx.stroke();

    // clicked cell
    if (target) {
      ctx.strokeStyle = TAKEOVER; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.strokeRect(target.c * cell + 2, target.r * cell + 2, cell - 4, cell - 4);
      ctx.setLineDash([]);
    }

    // robot, eased between cells; ring color shows who is in control
    const f = Math.min(1, (now - lastStepAt) * STEP_HZ / 1000);
    const ar = prev.r + (cur.r - prev.r) * f, ac = prev.c + (cur.c - prev.c) * f;
    ctx.fillStyle = "#1c1d22";
    ctx.strokeStyle = lastActor === "you" ? TAKEOVER : "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx(ac), cy(ar), cell * 0.27, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  }

  function drawLegend() {
    const stops = heatMode === "bonus" ? DIV : SEQ;
    $(".demo-legend-bar").style.background =
      `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1].map((t) => ramp(stops, t)).join(",")})`;
    const names = algo === "nodec"
      ? { opt: "Value with one critic (normalized)" }
      : { opt: "Value the robot sees (normalized)", bonus: "Bonus from takeovers (normalized)" };
    $(".demo-legend-name").textContent = names[heatMode];
    // The raw peak stays visible, so the blow-up without decoupling is easy to see.
    let peak = 0;
    for (let r = 0; r < M.H; r++)
      for (let c = 0; c < M.W; c++)
        if (M.isFree(r, c)) peak = Math.max(peak, learner.value(r, c, heatMode));
    $(".demo-legend-labels").innerHTML =
      `<span>0</span><span>1 = peak ${heatMode === "bonus" ? "bonus" : "value"} ${peak.toFixed(2)}</span>`;
  }

  function drawChart() {
    if (!chart.width) return;
    const w = chart.width / DPR, h = chart.height / DPR;
    cctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cctx.clearRect(0, 0, w, h);
    const pad = { l: 30, r: 8, t: 8, b: 18 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    cctx.strokeStyle = "#eceef2"; cctx.lineWidth = 1; cctx.fillStyle = "#8a8c95";
    cctx.font = "11px 'Noto Sans', sans-serif"; cctx.textAlign = "right"; cctx.textBaseline = "middle";
    for (const v of [0, 0.5, 1]) {
      const y = pad.t + ph * (1 - v);
      cctx.beginPath(); cctx.moveTo(pad.l, y); cctx.lineTo(w - pad.r, y); cctx.stroke();
      cctx.fillText(v.toFixed(1), pad.l - 5, y);
    }
    cctx.textAlign = "center"; cctx.textBaseline = "top";
    cctx.fillText("episodes", pad.l + pw / 2, h - 14);
    const n = stats.successes.length;
    if (n < 2) return;
    const roll = (arr, k) => arr.map((_, i) => {
      const s = Math.max(0, i - k + 1); let t = 0;
      for (let j = s; j <= i; j++) t += arr[j];
      return t / (i - s + 1);
    });
    const line = (vals, color) => {
      cctx.strokeStyle = color; cctx.lineWidth = 2; cctx.beginPath();
      vals.forEach((v, i) => {
        const x = pad.l + (pw * i) / (n - 1), y = pad.t + ph * (1 - v);
        i ? cctx.lineTo(x, y) : cctx.moveTo(x, y);
      });
      cctx.stroke();
    };
    line(roll(stats.takeFrac, 5), TAKEOVER);
    line(roll(stats.successes, 5), "#1f3f7a");
  }

  function updateStats() {
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const set = (k, v) => { const el = $(`[data-stat="${k}"]`); if (el) el.textContent = v; };
    set("episodes", stats.episodes.toLocaleString());
    set("success", `${Math.round(mean(stats.successes.slice(-20)) * 100)}%`);
    set("interventions", `${Math.round(mean(stats.takeFrac.slice(-20)) * 100)}%`);
    set("control", lastActor === "you" ? "You" : "Robot");
  }

  // ------------------------------------------------------------ loop
  function loop(now) {
    if (!details || details.open) {
      if (now - lastStepAt >= 1000 / STEP_HZ) { lastStepAt = now; envStep(); }
      draw(now);
    }
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ input
  function cellAt(e) {
    const b = arena.getBoundingClientRect();
    const c = Math.floor(((e.clientX - b.left) / b.width) * M.W), r = Math.floor(((e.clientY - b.top) / b.height) * M.H);
    return M.isFree(r, c) ? { r, c } : target;
  }
  arena.addEventListener("pointerdown", (e) => {
    arena.setPointerCapture(e.pointerId);
    arena.focus({ preventScroll: true });
    target = cellAt(e);
    e.preventDefault();
  });
  arena.addEventListener("pointermove", (e) => { if (target) target = cellAt(e); });
  const release = () => { target = null; };
  arena.addEventListener("pointerup", release);
  arena.addEventListener("pointercancel", release);
  arena.addEventListener("keydown", (e) => {
    if (!(e.key in KEY_ACTION)) return;
    e.preventDefault();
    keys.add(e.key);
  });
  arena.addEventListener("keyup", (e) => keys.delete(e.key));
  arena.addEventListener("blur", () => keys.clear());

  function seg(attr, onPick) {
    root.querySelectorAll(`[${attr}]`).forEach((btn) =>
      btn.addEventListener("click", () => {
        root.querySelectorAll(`[${attr}]`).forEach((b) => b.classList.toggle("active", b === btn));
        onPick(btn.getAttribute(attr));
      }));
  }
  seg("data-heat", (v) => { heatMode = v; drawLegend(); });
  // Switching the algorithm restarts training. Without decoupling there is only one
  // critic, so the page shows its value and hides the Value/Bonus choice.
  seg("data-algo", (v) => {
    algo = v;
    heatMode = "opt";
    root.querySelectorAll("[data-heat]").forEach((b) => b.classList.toggle("active", b.dataset.heat === "opt"));
    const showRow = root.querySelector("[data-show-row]");
    if (showRow) showRow.hidden = algo !== "qoil";
    init();
  });
  $('[data-action="reset"]').addEventListener("click", init);

  window.addEventListener("resize", resize);
  init();
  resize();
  requestAnimationFrame(loop);
})();
