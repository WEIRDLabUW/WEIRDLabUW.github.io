#!/usr/bin/env python3
"""Merge the wandb learning curves dumped on tars (by dump_curves.py) into the
website's curves_data.js. Runs locally, no wandb needed:

    scp tars_home:icml2026_plots/curves_dump.pkl /tmp/
    python3 curves_from_pkl.py /tmp/curves_dump.pkl ../../explore_viz/curves_data.js

Processing (align seeds, stderr, log-space resample to 500 pts, smooth window 5)
mirrors plot_main.py so the interactive figure matches the paper figure.
"""
import json, math, pickle, re, sys

import numpy as np

LOG_RESAMPLE_POINTS, SMOOTH_WINDOW = 500, 5
NAME_MAP = {"Tactile-Cube-Pick": "Tactile Cube Pick",
            "Wrist-Peg-Insertion": "Wrist Peg Insertion"}


def resample_log(steps, values, n=LOG_RESAMPLE_POINTS):
    m = steps > 0
    steps, values = steps[m], values[m]
    if len(steps) < 2:
        return steps, values
    new = 10 ** np.linspace(np.log10(steps[0]), np.log10(steps[-1]), n)
    return new, np.interp(new, steps, values)


def smooth(v, w=SMOOTH_WINDOW):
    if w <= 1:
        return v
    out = np.convolve(v, np.ones(w) / w, mode="same")
    h = w // 2
    out[:h], out[-h:] = v[:h], v[-h:]
    return out


def main():
    pkl_path, js_path = sys.argv[1], sys.argv[2]
    with open(pkl_path, "rb") as f:
        dump = pickle.load(f)
    src = open(js_path).read()
    data = json.loads(re.search(r"window\.CURVES_DATA = (.*);", src).group(1))
    for task in data["tasks"]:
        raw_name = next((k for k, v in NAME_MAP.items() if v == task["name"]), task["name"])
        if raw_name not in dump:
            continue
        params = dump[raw_name]["params"]
        for m, curves in dump[raw_name].items():
            if m == "params" or not curves:
                continue
            n_len = min(len(c) for c in curves)
            arr = np.array([c[:n_len] for c in curves])
            mean, std = arr.mean(0), arr.std(0)
            stderr = std / math.sqrt(params["n_seeds"])
            steps = np.arange(n_len) * params["steps_per_update"]
            x, mu = resample_log(steps, mean)
            _, se = resample_log(steps, stderr)
            mu, se = smooth(mu), smooth(se)
            task["methods"][m] = {"type": "curve", "x": np.round(x, 1).tolist(),
                                  "mean": np.round(mu, 4).tolist(),
                                  "stderr": np.round(se, 4).tolist()}
    with open(js_path, "w") as f:
        f.write("// sample-efficiency data from plot_main.py + wandb curves via dump_curves.py\n"
                "window.CURVES_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print("updated", js_path)


if __name__ == "__main__":
    main()
