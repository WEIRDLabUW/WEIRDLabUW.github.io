#!/usr/bin/env python3
"""Fetch the Procgen 3-iteration eval points for fig_procgen_embed.html.

Mirrors icml2026_plots/asteroid_procgen_ablation2.py: two seed runs, first 3
eval points per metric, stderr = std/sqrt(n_seeds); BC = iteration-0 policy.
Uses run.history() because these runs lack a _step column (scan_history fails).
Prints JSON; paste the numbers into the PANELS block of fig_procgen_embed.html.
"""
import json, math
import wandb

RUNS = ["sriyash-uw-team/asteroid-procgen/runs/aid90cu2",
        "sriyash-uw-team/asteroid-procgen/runs/glglchks"]
METRICS = ["eval/temp_1.0_success_rate", "eval/temp_1.0_mean_length"]
N = 3

api = wandb.Api()
hist = {p: api.run(p).history(pandas=False, samples=2000) for p in RUNS}
out = {}
for metric in METRICS:
    curves = [[float(r[metric]) for r in hist[p] if r.get(metric) is not None][:N] for p in RUNS]
    n = len(curves)
    means = [sum(c[i] for c in curves) / n for i in range(N)]
    stderr = [(sum((c[i] - means[i]) ** 2 for c in curves) / n) ** 0.5 / math.sqrt(n) for i in range(N)]
    out[metric] = {"mean": [round(v, 4) for v in means], "stderr": [round(v, 4) for v in stderr],
                   "bc": {"mean": round(means[0], 4), "stderr": round(stderr[0], 4)}}
print(json.dumps(out, indent=1))
