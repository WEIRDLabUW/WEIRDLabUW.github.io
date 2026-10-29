// Interactive Q-OIL demo (LMP blue palette): drives QOILCore in the browser, renders the
// arena with a value heatmap overlay, and lets the viewer take over the pusher.
(function () {
  "use strict";
  const C = window.QOILCore;
  const root = document.getElementById("qoil-demo");
  if (!C || !root) return;

  const $ = (sel) => root.querySelector(sel);
  const arena = $(".demo-arena");
  const ctx = arena.getContext("2d");
  const chart = $(".demo-chart");
  const cctx = chart.getContext("2d");

  const HEAT_N = 36;
  const ARROW_N = 11;
  const REALTIME_HZ = 20;

  let rng, env, agent, sup, obs;
  let stats;
  let useSup = true;
  let heatMode = "opt";
  const showArrows = true;
  let human = null;           // {x, y} target in arena coords while taking over
  let lastStepAt = 0;
  let heat = null, heatRange = [0, 1], arrows = null, heatDirty = true, frame = 0;
  let epInt = 0, epSteps = 0, lastActor = "agent";

  function init() {
    rng = C.makeRng((Math.random() * 2 ** 31) | 0);
    env = new C.PushEnv(rng);
    agent = new C.QOILAgent(rng);
    sup = new C.SimSupervisor(rng);
    obs = env.reset();
    stats = { steps: 0, episodes: 0, successes: [], intFrac: [], interventions: 0 };
    epInt = 0; epSteps = 0;
    heatDirty = true;
    updateStats();
    drawChart();
  }

  // ------------------------------------------------------------ stepping
  function humanAction() {
    if (human) {
      const dx = human.x - env.pusher[0], dy = human.y - env.pusher[1];
      if (Math.hypot(dx, dy) < 0.012) return null;
      return C.nearestAction(dx, dy);
    }
    return null;
  }

  function humanActive() { return !!human; }

  function envStep() {
    let a = humanAction(), who;
    if (a !== null) who = "human";
    else if (humanActive()) who = "idle";
    else if (useSup && (a = sup.act(env)) !== null) who = "supervisor";
    else who = "agent";
    if (who === "human" || who === "idle") { sup.hist = []; sup.active = 0; }
    if (who === "idle") { lastActor = "human"; return; } // holding still: no transition
    const intervened = who === "human" || who === "supervisor";
    if (!intervened) a = agent.act(obs);
    else agent.steps += 1;
    const r = env.step(a);
    agent.store(obs, a, r.r, r.obs, r.done, intervened);
    agent.update();
    obs = r.obs;
    lastActor = who;
    stats.steps += 1; epSteps += 1;
    if (intervened) { stats.interventions += 1; epInt += 1; }
    if (r.done || r.timeout) endEpisode(r.success);
    heatDirty = true;
  }

  function endEpisode(success) {
    stats.episodes += 1;
    stats.successes.push(success ? 1 : 0);
    stats.intFrac.push(epSteps ? epInt / epSteps : 0);
    if (stats.successes.length > 400) { stats.successes.shift(); stats.intFrac.shift(); }
    epInt = 0; epSteps = 0;
    obs = env.reset();
    sup.resetEpisode();
    drawChart();
  }

  // ------------------------------------------------------------ heatmap
  function computeHeat() {
    const n = HEAT_N, vals = new Float32Array(n * n);
    const [kx, ky] = env.puck;
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const px = (i + 0.5) / n, py = (j + 0.5) / n;
        const x = C.encode(px, py, kx, ky);
        let v;
        if (heatMode === "td") v = max(agent.qtd.forward(x));
        else if (heatMode === "opt") v = max(agent.qopt.forward(x));
        else {
          const qo = agent.qopt.forward(x), a = C.argmax(qo);
          v = qo[a] - agent.qtd.forward(x)[a];
        }
        vals[j * n + i] = v;
        if (v < lo) lo = v; if (v > hi) hi = v;
      }
    }
    if (heatMode === "bonus") {
      const m = Math.max(0.01, Math.abs(lo), Math.abs(hi));
      heatRange = [-m, m];
    } else {
      heatRange = [Math.min(0, lo), Math.max(0.25, hi)];
    }
    heat = vals;
    if (showArrows) {
      const m = ARROW_N;
      arrows = new Int8Array(m * m);
      for (let j = 0; j < m; j++)
        for (let i = 0; i < m; i++)
          arrows[j * m + i] = agent.greedy(C.encode((i + 0.5) / m, (j + 0.5) / m, kx, ky));
    }
    heatDirty = false;
    drawLegend();
  }

  function max(a) { let m = a[0]; for (let i = 1; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }

  // One-hue blue ramp for values; amber-gray-blue for the bonus map (gray midpoint)
  const SEQ = [[247, 249, 253], [208, 222, 251], [142, 180, 245], [66, 133, 244], [31, 63, 122]];
  const DIV = [[176, 108, 32], [226, 190, 140], [236, 238, 240], [142, 180, 245], [31, 63, 122]];
  function ramp(stops, t) {
    t = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    const a = stops[i], b = stops[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  const heatCanvas = document.createElement("canvas");
  heatCanvas.width = HEAT_N; heatCanvas.height = HEAT_N;
  const hctx = heatCanvas.getContext("2d");

  // ------------------------------------------------------------ drawing
  let W = 0, DPR = 1;
  function resize() {
    DPR = window.devicePixelRatio || 1;
    W = arena.clientWidth;
    arena.width = Math.round(W * DPR); arena.height = Math.round(W * DPR);
    const cw = chart.clientWidth, ch = chart.clientHeight;
    chart.width = Math.round(cw * DPR); chart.height = Math.round(ch * DPR);
    drawChart();
  }
  const X = (x) => x * W, Y = (y) => (1 - y) * W;

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, W);
    if (heatMode !== "off" && heat) {
      const img = hctx.createImageData(HEAT_N, HEAT_N);
      const [lo, hi] = heatRange, stops = heatMode === "bonus" ? DIV : SEQ;
      for (let j = 0; j < HEAT_N; j++)
        for (let i = 0; i < HEAT_N; i++) {
          const v = heat[j * HEAT_N + i];
          const c = ramp(stops, (v - lo) / (hi - lo || 1));
          const o = ((HEAT_N - 1 - j) * HEAT_N + i) * 4;
          img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
        }
      hctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(heatCanvas, 0, 0, W, W);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#f6f7fa"; ctx.fillRect(0, 0, W, W);
    }

    if (showArrows && arrows && heatMode !== "off") {
      ctx.strokeStyle = "rgba(28,29,34,0.42)"; ctx.fillStyle = "rgba(28,29,34,0.42)";
      ctx.lineWidth = 1.4;
      const m = ARROW_N, len = (W / m) * 0.32;
      for (let j = 0; j < m; j++)
        for (let i = 0; i < m; i++) {
          const cx = X((i + 0.5) / m), cy = Y((j + 0.5) / m);
          if (Math.hypot((i + 0.5) / m - env.puck[0], (j + 0.5) / m - env.puck[1]) < C.ENV.puckR + 0.03) continue;
          const [dx, dy] = C.DIRS[arrows[j * m + i]];
          const ex = cx + dx * len, ey = cy - dy * len;
          ctx.beginPath(); ctx.moveTo(cx - dx * len, cy + dy * len); ctx.lineTo(ex, ey); ctx.stroke();
          const ang = Math.atan2(-dy, dx);
          ctx.beginPath(); ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 5 * Math.cos(ang - 0.5), ey - 5 * Math.sin(ang - 0.5));
          ctx.lineTo(ex - 5 * Math.cos(ang + 0.5), ey - 5 * Math.sin(ang + 0.5));
          ctx.closePath(); ctx.fill();
        }
    }

    // goal
    const g = C.ENV.goal;
    ctx.setLineDash([6, 5]); ctx.lineWidth = 2.5; ctx.strokeStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(X(g[0]), Y(g[1]), C.ENV.goalR * W, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();

    // puck
    ctx.fillStyle = "#e8a33d"; ctx.strokeStyle = "#7a4f12"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(env.puck[0]), Y(env.puck[1]), C.ENV.puckR * W, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

    // human target line
    if (human) {
      ctx.strokeStyle = "rgba(220,50,47,0.9)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(env.pusher[0]), Y(env.pusher[1])); ctx.lineTo(X(human.x), Y(human.y)); ctx.stroke();
      ctx.setLineDash([]);
    }

    // pusher (ring color shows who is in control)
    const ring = lastActor === "human" ? "#c0392b" : lastActor === "supervisor" ? "#d08a2f" : "#ffffff";
    ctx.fillStyle = "#1c1d22"; ctx.strokeStyle = ring; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(X(env.pusher[0]), Y(env.pusher[1]), C.ENV.pusherR * W, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

    // border
    ctx.strokeStyle = "#e4e5ea"; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, W - 1, W - 1);
  }

  function drawLegend() {
    const lo = heatRange[0], hi = heatRange[1];
    const bar = $(".demo-legend-bar"), labels = $(".demo-legend-labels");
    const stops = heatMode === "bonus" ? DIV : SEQ;
    bar.style.background = `linear-gradient(to right, ${stops.map((c) => `rgb(${c.map(Math.round).join(",")})`).join(",")})`;
    const names = { opt: "Value the robot sees", td: "Task-only value", bonus: "Bonus from takeovers" };
    $(".demo-legend-name").innerHTML = names[heatMode] || "";
    const f = (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);
    labels.innerHTML = `<span>${f(lo)}</span><span>${f(hi)}</span>`;
    $(".demo-legend").style.visibility = heatMode === "off" ? "hidden" : "visible";
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
    line(roll(stats.intFrac, 10), "#d08a2f");
    line(roll(stats.successes, 10), "#1f3f7a");
  }

  function updateStats() {
    const last = stats.successes.slice(-20);
    const sr = last.length ? last.reduce((a, b) => a + b, 0) / last.length : 0;
    const lastI = stats.intFrac.slice(-20);
    const ir = lastI.length ? lastI.reduce((a, b) => a + b, 0) / lastI.length : 0;
    const set = (k, v) => { const el = $(`[data-stat="${k}"]`); if (el) el.textContent = v; };
    set("steps", stats.steps.toLocaleString());
    set("episodes", stats.episodes.toLocaleString());
    set("success", `${Math.round(sr * 100)}%`);
    set("interventions", `${Math.round(ir * 100)}%`);
    set("control", { human: "You", supervisor: "Simulated human", agent: "Robot", idle: "You" }[lastActor]);
  }

  // ------------------------------------------------------------ loop
  function loop(now) {
    frame += 1;
    if (now - lastStepAt >= 1000 / REALTIME_HZ) {
      lastStepAt = now;
      envStep();
    }
    if (heatDirty && heatMode !== "off" && frame % 6 === 0) computeHeat();
    draw();
    if (frame % 10 === 0) updateStats();
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ input
  function toArena(e) {
    const r = arena.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
  }
  arena.addEventListener("pointerdown", (e) => {
    arena.setPointerCapture(e.pointerId);
    human = toArena(e);
    e.preventDefault();
  });
  arena.addEventListener("pointermove", (e) => { if (human) human = toArena(e); });
  const release = () => { human = null; };
  arena.addEventListener("pointerup", release);
  arena.addEventListener("pointercancel", release);


  function seg(attr, onPick) {
    root.querySelectorAll(`[${attr}]`).forEach((btn) =>
      btn.addEventListener("click", () => {
        root.querySelectorAll(`[${attr}]`).forEach((b) => b.classList.toggle("active", b === btn));
        onPick(btn.getAttribute(attr));
      }));
  }
  seg("data-heat", (v) => { heatMode = v; heatDirty = true; if (v !== "off") computeHeat(); else drawLegend(); });
  $('[data-action="reset"]').addEventListener("click", () => { init(); computeHeat(); });
  $('[data-action="supervisor"]').addEventListener("change", (e) => { useSup = e.target.checked; });

  window.addEventListener("resize", resize);
  init();
  resize();
  computeHeat();
  requestAnimationFrame(loop);
})();
