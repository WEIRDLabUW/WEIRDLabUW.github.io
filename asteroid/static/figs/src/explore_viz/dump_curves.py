"""Standalone wandb curve dump (no plot_main import; URLs copied from it)."""
import pickle, sys
import wandb

TASKS = {
  "Tactile-Cube-Pick": {
    "metric": "Metrics/task_0_success_rate", "steps_per_update": 65536, "n_seeds": 3,
    "BC+PPO": ["sriyash-uw-team/incontext_exploration/runs/icfunyk1",
               "sriyash-uw-team/incontext_exploration/runs/1vlig9r7",
               "sriyash-uw-team/incontext_exploration/runs/bs7rj9zq"],
    "ADVISOR": ["sriyash-uw-team/isaaclab/runs/0ldrg5g0",
                "sriyash-uw-team/isaaclab/runs/6sw6wxzy",
                "sriyash-uw-team/isaaclab/runs/is9zfbox"],
  },
  "Wrist-Peg-Insertion": {
    "metric": "Metrics/task_0_success_rate", "steps_per_update": 2048, "n_seeds": 3,
    # BC+PPO is NOT fetched from wandb: run d7fxavgl was deleted upstream.
    # plot_main.py on tars (2026-07-28) now ships ~/icml2026_plots/bcppo_wrist_avg.npy
    # — (env_steps, mean, stderr), the average of the digitized d7fxavgl curve and a
    # zeros run — which was injected directly into curves_data.js as a "curve" series.
  },
}

api = wandb.Api()
def fetch(path, metric):
    cands = [path]
    if path.startswith("sriyash-uw/"): cands.append("sriyash-uw-team/" + path.split("/",1)[1])
    elif path.startswith("sriyash-uw-team/"): cands.append("sriyash-uw/" + path.split("/",1)[1])
    for cand in cands:
        try:
            print("fetching", cand, flush=True)
            rows = list(api.run(cand).scan_history(keys=[metric]))
            vals = [float(r[metric]) for r in rows if r.get(metric) is not None]
            print("  ok:", len(vals), "points", flush=True)
            if vals: return vals
        except Exception as e:
            print("  fail:", type(e).__name__, flush=True)
    return []

dump = {}
for task, cfg in TASKS.items():
    dump[task] = {"params": {k: cfg[k] for k in ("metric", "steps_per_update", "n_seeds")}}
    for m, urls in cfg.items():
        if m in ("metric", "steps_per_update", "n_seeds"): continue
        curves = []
        for u in urls:
            if isinstance(u, str): c = fetch(u, cfg["metric"])
            else:
                c = []
                for sub in u: c += fetch(sub, cfg["metric"])
            if c: curves.append(c)
        dump[task][m] = curves
with open(sys.argv[1], "wb") as f: pickle.dump(dump, f)
print("wrote", sys.argv[1])
