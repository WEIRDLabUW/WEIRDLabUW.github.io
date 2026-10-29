// Q-OIL demo core: a 2D pushing environment, a tiny MLP, and a discrete-action
// Q-OIL agent with decoupled critics. Runs in the browser (window.QOILCore)
// and in Node (module.exports) so it can be tested headlessly.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QOILCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------------------------------------------------------- RNG
  function makeRng(seed) {
    let s = seed >>> 0 || 1;
    const rng = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    rng.normal = () => {
      const u = Math.max(rng(), 1e-12), v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return rng;
  }

  // ---------------------------------------------------------------- Env
  const N_ACTIONS = 8;
  const DIRS = [];
  for (let i = 0; i < N_ACTIONS; i++) {
    const t = (i * 2 * Math.PI) / N_ACTIONS;
    DIRS.push([Math.cos(t), Math.sin(t)]);
  }

  const ENV = {
    pusherR: 0.035,
    puckR: 0.06,
    goal: [0.8, 0.5],
    goalR: 0.1,
    step: 0.03,
    maxSteps: 100,
    shaping: 0,
  };

  function nearestAction(dx, dy) {
    let best = 0, bestDot = -Infinity;
    for (let i = 0; i < N_ACTIONS; i++) {
      const d = DIRS[i][0] * dx + DIRS[i][1] * dy;
      if (d > bestDot) { bestDot = d; best = i; }
    }
    return best;
  }

  class PushEnv {
    constructor(rng) {
      this.rng = rng;
      this.reset();
    }

    reset() {
      const r = this.rng;
      this.puck = [0.38 + 0.14 * r(), 0.3 + 0.4 * r()];
      // Pusher anywhere in the left two thirds, not touching the puck.
      for (;;) {
        this.pusher = [0.06 + 0.6 * r(), 0.06 + 0.88 * r()];
        if (dist(this.pusher, this.puck) > ENV.pusherR + ENV.puckR + 0.06) break;
      }
      this.t = 0;
      return this.obs();
    }

    puckGoalDist() { return dist(this.puck, ENV.goal); }

    obs() {
      return encode(this.pusher[0], this.pusher[1], this.puck[0], this.puck[1]);
    }

    step(a) {
      const d0 = this.puckGoalDist();
      const [dx, dy] = DIRS[a];
      const sub = 3, h = ENV.step / sub;
      const lo = ENV.pusherR, hi = 1 - ENV.pusherR;
      const plo = ENV.puckR, phi = 1 - ENV.puckR;
      for (let k = 0; k < sub; k++) {
        const prev = [this.pusher[0], this.pusher[1]];
        this.pusher[0] = clamp(this.pusher[0] + dx * h, lo, hi);
        this.pusher[1] = clamp(this.pusher[1] + dy * h, lo, hi);
        const minD = ENV.pusherR + ENV.puckR;
        const ox = this.puck[0] - this.pusher[0], oy = this.puck[1] - this.pusher[1];
        const od = Math.hypot(ox, oy);
        if (od < minD && od > 1e-9) {
          const push = minD - od;
          const nx = ox / od, ny = oy / od;
          const before = [this.puck[0], this.puck[1]];
          this.puck[0] = clamp(this.puck[0] + nx * push, plo, phi);
          this.puck[1] = clamp(this.puck[1] + ny * push, plo, phi);
          // If the puck is pinned against a wall, the pusher cannot advance.
          if (dist(this.puck, before) < push * 0.5) this.pusher = prev;
        }
      }
      this.t += 1;
      const d1 = this.puckGoalDist();
      const success = d1 < ENV.goalR - 0.02;
      // Sparse success reward, plus optional potential-based shaping.
      const r = ENV.shaping * (d0 - d1) + (success ? 1.0 : 0.0);
      const timeout = this.t >= ENV.maxSteps;
      return { obs: this.obs(), r, done: success, timeout, success };
    }
  }

  function encode(px, py, kx, ky) {
    const gx = ENV.goal[0], gy = ENV.goal[1];
    return [
      2 * px - 1, 2 * py - 1, 2 * kx - 1, 2 * ky - 1,
      3 * (kx - px), 3 * (ky - py), 3 * (gx - kx), 3 * (gy - ky),
    ];
  }
  const OBS_DIM = 8;

  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  // ---------------------------------------------------------- Supervisor
  // Scripted expert: get behind the puck (relative to the goal), then push.
  function expertAction(env, rng, noise) {
    const [px, py] = env.pusher, [kx, ky] = env.puck, [gx, gy] = ENV.goal;
    let ux = gx - kx, uy = gy - ky;
    const un = Math.hypot(ux, uy) || 1;
    ux /= un; uy /= un;
    const back = ENV.pusherR + ENV.puckR + 0.015;
    const tx = kx - ux * back, ty = ky - uy * back;
    // Signed position of the pusher along the push axis, relative to the puck.
    const along = (px - kx) * ux + (py - ky) * uy;
    const lateral = (px - kx) * -uy + (py - ky) * ux;
    let dx, dy;
    if (Math.hypot(px - tx, py - ty) < 0.03) {
      dx = gx - px; dy = gy - py;                      // aligned: push
    } else if (along > -0.02 && Math.abs(lateral) < ENV.pusherR + ENV.puckR + 0.03) {
      const side = lateral >= 0 ? 1 : -1;              // in front: go around
      dx = -uy * side - ux * 0.6; dy = ux * side - uy * 0.6;
    } else {
      dx = tx - px; dy = ty - py;                      // approach
    }
    if (noise && rng() < noise) return Math.floor(rng() * N_ACTIONS);
    return nearestAction(dx, dy);
  }

  // Progress-aware supervisor (PAM-style): take over when progress toward the
  // goal stalls for a while, hand control back after a fixed correction.
  class SimSupervisor {
    constructor(rng, opts = {}) {
      this.rng = rng;
      this.window = opts.window || 12;
      this.duration = opts.duration || 12;
      this.noise = opts.noise == null ? 0.15 : opts.noise;
      this.resetEpisode();
    }
    resetEpisode() { this.hist = []; this.active = 0; }
    progress(env) {
      const reach = Math.max(0, dist(env.pusher, env.puck) - ENV.pusherR - ENV.puckR);
      return -env.puckGoalDist() - 0.3 * reach;
    }
    // Returns an action if the supervisor is in control this step, else null.
    act(env) {
      const p = this.progress(env);
      this.hist.push(p);
      if (this.hist.length > this.window + 1) this.hist.shift();
      if (this.active > 0) {
        this.active -= 1;
        if (this.active === 0) this.hist = [p];
        return expertAction(env, this.rng, this.noise);
      }
      if (this.hist.length > this.window && p - this.hist[0] < 0.01) {
        this.active = this.duration - 1;
        return expertAction(env, this.rng, this.noise);
      }
      return null;
    }
  }

  // ---------------------------------------------------------------- MLP
  class MLP {
    constructor(sizes, rng) {
      this.sizes = sizes;
      this.W = []; this.b = [];
      for (let l = 0; l < sizes.length - 1; l++) {
        const nin = sizes[l], nout = sizes[l + 1];
        const W = new Float32Array(nin * nout), b = new Float32Array(nout);
        const s = Math.sqrt(2 / nin) * (l === sizes.length - 2 ? 0.1 : 1);
        for (let i = 0; i < W.length; i++) W[i] = rng.normal() * s;
        this.W.push(W); this.b.push(b);
      }
      this.initAdam();
    }
    initAdam() {
      this.mW = this.W.map((w) => new Float32Array(w.length));
      this.vW = this.W.map((w) => new Float32Array(w.length));
      this.mb = this.b.map((b) => new Float32Array(b.length));
      this.vb = this.b.map((b) => new Float32Array(b.length));
      this.tAdam = 0;
    }
    copyFrom(o) {
      for (let l = 0; l < this.W.length; l++) { this.W[l].set(o.W[l]); this.b[l].set(o.b[l]); }
    }
    polyak(o, tau) {
      for (let l = 0; l < this.W.length; l++) {
        const W = this.W[l], oW = o.W[l], b = this.b[l], ob = o.b[l];
        for (let i = 0; i < W.length; i++) W[i] += tau * (oW[i] - W[i]);
        for (let i = 0; i < b.length; i++) b[i] += tau * (ob[i] - b[i]);
      }
    }
    // Forward one input; returns output array. Keeps activations if `cache`.
    forward(x, cache) {
      let a = x;
      const acts = cache ? [x] : null;
      for (let l = 0; l < this.W.length; l++) {
        const nin = this.sizes[l], nout = this.sizes[l + 1];
        const W = this.W[l], b = this.b[l];
        const z = new Float32Array(nout);
        for (let j = 0; j < nout; j++) {
          let s = b[j];
          const off = j * nin;
          for (let i = 0; i < nin; i++) s += W[off + i] * a[i];
          z[j] = l < this.W.length - 1 && s < 0 ? 0 : s;
        }
        a = z;
        if (cache) acts.push(z);
      }
      return cache ? acts : a;
    }
    // One Adam step on 0.5 * mean((Q(x)[a] - y)^2) over a batch.
    trainBatch(xs, as, ys, lr) {
      const L = this.W.length;
      const gW = this.W.map((w) => new Float32Array(w.length));
      const gb = this.b.map((b) => new Float32Array(b.length));
      let loss = 0;
      const n = xs.length;
      for (let k = 0; k < n; k++) {
        const acts = this.forward(xs[k], true);
        const out = acts[L];
        let delta = new Float32Array(out.length);
        const err = out[as[k]] - ys[k];
        loss += 0.5 * err * err;
        delta[as[k]] = Math.max(-1, Math.min(1, err)) / n; // Huber-clipped
        for (let l = L - 1; l >= 0; l--) {
          const nin = this.sizes[l], nout = this.sizes[l + 1];
          const ain = acts[l], W = this.W[l], GW = gW[l], Gb = gb[l];
          const prev = l > 0 ? new Float32Array(nin) : null;
          for (let j = 0; j < nout; j++) {
            const dj = delta[j];
            if (dj === 0) continue;
            Gb[j] += dj;
            const off = j * nin;
            for (let i = 0; i < nin; i++) {
              GW[off + i] += dj * ain[i];
              if (prev) prev[i] += dj * W[off + i];
            }
          }
          if (prev) for (let i = 0; i < nin; i++) if (ain[i] <= 0) prev[i] = 0;
          delta = prev;
        }
      }
      this.adam(gW, gb, lr);
      return loss / n;
    }
    adam(gW, gb, lr) {
      const b1 = 0.9, b2 = 0.999, eps = 1e-8;
      this.tAdam += 1;
      const c1 = 1 - Math.pow(b1, this.tAdam), c2 = 1 - Math.pow(b2, this.tAdam);
      const upd = (P, G, M, V) => {
        for (let i = 0; i < P.length; i++) {
          const g = G[i];
          M[i] = b1 * M[i] + (1 - b1) * g;
          V[i] = b2 * V[i] + (1 - b2) * g * g;
          P[i] -= (lr * (M[i] / c1)) / (Math.sqrt(V[i] / c2) + eps);
        }
      };
      for (let l = 0; l < this.W.length; l++) {
        upd(this.W[l], gW[l], this.mW[l], this.vW[l]);
        upd(this.b[l], gb[l], this.mb[l], this.vb[l]);
      }
    }
  }

  // --------------------------------------------------------------- Agent
  // Q_td: standard TD critic. Q_opt: r + bonus * is_intervention + γ Q_td(s', a'),
  // bootstrapping off the task critic so the optimism stays local to
  // intervention transitions. The policy acts greedily on Q_opt.
  class QOILAgent {
    constructor(rng, opts = {}) {
      this.rng = rng;
      this.gamma = opts.gamma || 0.97;
      this.lr = opts.lr || 1e-3;
      this.batch = opts.batch || 64;
      this.tau = opts.tau || 0.01;
      this.bonus = opts.bonus == null ? 0.05 : opts.bonus;
      this.useBonus = opts.useBonus == null ? true : opts.useBonus;
      this.capacity = opts.capacity || 50000;
      this.epsStart = 0.5; this.epsEnd = 0.05; this.epsDecay = opts.epsDecay || 6000;
      const sizes = [OBS_DIM, 64, 64, N_ACTIONS];
      this.qtd = new MLP(sizes, rng);
      this.qopt = new MLP(sizes, rng);
      this.qtdTarg = new MLP(sizes, rng); this.qtdTarg.copyFrom(this.qtd);
      this.buf = [];
      this.ptr = 0;
      this.steps = 0;
    }
    epsilon() {
      const f = Math.min(1, this.steps / this.epsDecay);
      return this.epsStart + f * (this.epsEnd - this.epsStart);
    }
    greedy(obs) { return argmax(this.qopt.forward(obs)); }
    act(obs) {
      this.steps += 1;
      if (this.rng() < this.epsilon()) return Math.floor(this.rng() * N_ACTIONS);
      return this.greedy(obs);
    }
    store(s, a, r, s2, done, intervened) {
      const tr = { s, a, r, s2, done: done ? 1 : 0, int: intervened ? 1 : 0 };
      if (this.buf.length < this.capacity) this.buf.push(tr);
      else { this.buf[this.ptr] = tr; this.ptr = (this.ptr + 1) % this.capacity; }
    }
    update() {
      if (this.buf.length < 256) return null;
      const n = this.batch, xs = [], as = [], ytd = [], yopt = [];
      const bonus = this.useBonus ? this.bonus : 0;
      for (let k = 0; k < n; k++) {
        const tr = this.buf[Math.floor(this.rng() * this.buf.length)];
        let boot = 0;
        if (!tr.done) {
          const a2 = argmax(this.qopt.forward(tr.s2));
          boot = this.gamma * this.qtdTarg.forward(tr.s2)[a2];
        }
        xs.push(tr.s); as.push(tr.a);
        ytd.push(tr.r + boot);
        yopt.push(tr.r + bonus * tr.int + boot);
      }
      const l1 = this.qtd.trainBatch(xs, as, ytd, this.lr);
      const l2 = this.qopt.trainBatch(xs, as, yopt, this.lr);
      this.qtdTarg.polyak(this.qtd, this.tau);
      return l1 + l2;
    }
  }

  function argmax(a) {
    let b = 0;
    for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i;
    return b;
  }

  return {
    makeRng, PushEnv, SimSupervisor, QOILAgent, MLP,
    ENV, DIRS, N_ACTIONS, encode, nearestAction, expertAction, argmax,
  };
});
