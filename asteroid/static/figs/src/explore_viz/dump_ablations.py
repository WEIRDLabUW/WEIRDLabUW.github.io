"""Aggregate tactile ablation curves from wandb (mirrors tactile_ablation.py /
tactile_pomdp_ablation.py): eval-group runs, grouped by config.iteration."""
import json, math, sys
import wandb

PROJECT = "sriyash-uw-team/incontext_exploration"
METRIC = "eval/success_rate"
N = 3
EXPS = {
    "Schedule-3": "rebuttal_tactile_sched_fixed3",
    "Schedule-2": "rebuttal_tactile_sched_fixed2",
    "Schedule-1": "rebuttal_tactile_sched_fixed",
    "Noisy Expert": "rebuttal_tactile_noise",
    "No Proprioception": "pomdp_tactile_pick_final",
}
api = wandb.Api()

def metric_of(run):
    v = dict(run.summary or {}).get(METRIC)
    if v is not None:
        try: return float(v)
        except (TypeError, ValueError): pass
    latest = None
    try:
        for row in run.scan_history(keys=[METRIC], page_size=100):
            if row.get(METRIC) is not None: latest = float(row[METRIC])
    except Exception: pass
    return latest

out = {}
for label, exp in EXPS.items():
    runs = list(api.runs(PROJECT, filters={"$and":[{"config.exp_name": exp}, {"config.Group": "eval"}]}))
    if not runs:
        runs = list(api.runs(PROJECT, filters={"$and":[{"config.exp_name": exp}, {"group": "eval"}]}))
    by_iter = {i: [] for i in range(N)}
    for r in runs:
        cfg = dict(r.config or {})
        grp = str(cfg.get("Group","")).strip().lower() or str(getattr(r,"group","") or "").strip().lower()
        if grp != "eval": continue
        try: it = int(str(cfg.get("iteration","")).strip())
        except ValueError: continue
        if it not in by_iter: continue
        v = metric_of(r)
        if v is not None: by_iter[it].append(v)
    means, ses, ns = [], [], []
    for i in range(N):
        vals = by_iter[i]
        if not vals: means.append(None); ses.append(None); ns.append(0); continue
        m = sum(vals)/len(vals)
        sd = (sum((v-m)**2 for v in vals)/len(vals))**0.5
        means.append(round(m,4)); ses.append(round(sd/math.sqrt(len(vals)),4)); ns.append(len(vals))
    out[label] = {"mean": means, "stderr": ses, "n": ns}
    print(label, out[label], flush=True)
json.dump(out, open(sys.argv[1],"w"))
print("wrote", sys.argv[1])
