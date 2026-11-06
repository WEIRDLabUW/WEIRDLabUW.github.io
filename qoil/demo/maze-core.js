// Maze demo core: the PointMaze grid and tabular Q-OIL learners.
// No rendering here, so the same file runs in the browser and in Node for testing.
(function (root) {
  "use strict";

  // 1 = wall, 0 = free. Row 0 is the top (the 9x12 PointMaze layout from our experiments).
  const MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const H = MAZE.length, W = MAZE[0].length;
  const START = { r: 1, c: 1 }, GOAL = { r: 7, c: 10 };
  const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];  // up, down, left, right
  const NA = ACTIONS.length;

  const isFree = (r, c) => r >= 0 && r < H && c >= 0 && c < W && MAZE[r][c] === 0;
  const isGoal = (r, c) => r === GOAL.r && c === GOAL.c;

  function move(r, c, a) {
    const nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
    return isFree(nr, nc) ? { r: nr, c: nc } : { r, c };
  }

  // Shortest-path distance from every free cell to `target` (BFS).
  function distancesTo(target) {
    const d = Array.from({ length: H }, () => new Array(W).fill(Infinity));
    d[target.r][target.c] = 0;
    const q = [target];
    while (q.length) {
      const { r, c } = q.shift();
      for (const [dr, dc] of ACTIONS) {
        const nr = r + dr, nc = c + dc;
        if (isFree(nr, nc) && d[nr][nc] === Infinity) { d[nr][nc] = d[r][c] + 1; q.push({ r: nr, c: nc }); }
      }
    }
    return d;
  }
  const GOAL_DIST = distancesTo(GOAL);

  // The action that moves one step closer to `target` along a shortest path.
  function stepToward(r, c, dist) {
    let best = null;
    for (let a = 0; a < NA; a++) {
      const n = move(r, c, a);
      if (dist[n.r][n.c] < dist[r][c] && (best === null || dist[n.r][n.c] < best.d)) best = { a, d: dist[n.r][n.c] };
    }
    return best ? best.a : null;
  }

  const table = () => Array.from({ length: H }, () => Array.from({ length: W }, () => new Float64Array(NA)));
  const maxA = (q) => Math.max(q[0], q[1], q[2], q[3]);
  function argmaxA(q) { let b = 0; for (let a = 1; a < NA; a++) if (q[a] > q[b]) b = a; return b; }

  // Tabular learner. decoupled = Q-OIL: the optimistic critic gets +b on takeover steps but
  // bootstraps from the task critic. Without decoupling one critic bootstraps from itself,
  // so the bonus spreads backward and the values blow up.
  class Learner {
    constructor(rand, opts = {}) {
      this.rand = rand;
      this.decoupled = opts.decoupled ?? true;
      this.alpha = 0.55; this.gamma = 0.97;
      this.eps = 0.22; this.epsMin = 0.04; this.epsDecay = 0.9997;
      this.bonus = opts.bonus ?? 0.1;
      this.replayK = 8; this.maxEpSteps = 120;
      this.qtask = table(); this.qopt = table();
      this.buffer = []; this.bufferMax = 4000;
      this.pos = { ...START }; this.epSteps = 0;
    }

    // Without decoupling there is a single critic, kept in qopt.
    act(r, c) {
      if (this.rand() < this.eps) return (this.rand() * NA) | 0;
      return argmaxA(this.qopt[r][c]);
    }

    learn(t) {
      const b = t.takeover ? this.bonus : 0;
      const td = (q, boot, extra) => {
        const target = t.rew + extra + (t.done ? 0 : this.gamma * maxA(boot[t.nr][t.nc]));
        q[t.r][t.c][t.a] += this.alpha * (target - q[t.r][t.c][t.a]);
      };
      if (this.decoupled) { td(this.qtask, this.qtask, 0); td(this.qopt, this.qtask, b); }
      else td(this.qopt, this.qopt, b);
    }

    // One step. `forced` is the viewer's action on a takeover step, else null.
    step(forced) {
      const { r, c } = this.pos;
      const takeover = forced !== null && forced !== undefined;
      const a = takeover ? forced : this.act(r, c);
      const n = move(r, c, a);
      const success = isGoal(n.r, n.c);
      const t = { r, c, a, rew: success ? 1 : 0, nr: n.r, nc: n.c, done: success, takeover };
      this.learn(t);
      if (takeover) { this.buffer.push(t); if (this.buffer.length > this.bufferMax) this.buffer.shift(); }
      for (let k = 0; k < this.replayK && this.buffer.length; k++)
        this.learn(this.buffer[(this.rand() * this.buffer.length) | 0]);
      this.eps = Math.max(this.epsMin, this.eps * this.epsDecay);
      this.epSteps += 1;
      this.pos = n;
      const ended = success || this.epSteps >= this.maxEpSteps;
      if (ended) { this.pos = { ...START }; this.epSteps = 0; }
      return { prev: { r, c }, next: n, takeover, success, ended };
    }

    // Value of a cell under the shown map: "opt" (what the robot acts on), "task", or
    // "bonus" (how much the takeover bonus lifts the robot's chosen action).
    value(r, c, which) {
      if (which === "task") return maxA(this.qtask[r][c]);
      if (which === "bonus") { const a = argmaxA(this.qopt[r][c]); return this.qopt[r][c][a] - this.qtask[r][c][a]; }
      return maxA(this.qopt[r][c]);
    }

    // Greedy route from the start under the robot's critic (stops at loops or dead ends).
    greedyPath(maxLen = 80) {
      let cur = { ...START };
      const path = [cur], seen = new Set([cur.r * W + cur.c]);
      for (let i = 0; i < maxLen && !isGoal(cur.r, cur.c); i++) {
        const q = this.qopt[cur.r][cur.c];
        if (maxA(q) <= 0) break;
        const n = move(cur.r, cur.c, argmaxA(q));
        if (seen.has(n.r * W + n.c)) break;
        seen.add(n.r * W + n.c); path.push(n); cur = n;
      }
      return path;
    }
  }

  const api = { MAZE, H, W, START, GOAL, ACTIONS, NA, isFree, isGoal, move, distancesTo, stepToward, Learner };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.QOILMaze = api;
})(typeof window !== "undefined" ? window : globalThis);
