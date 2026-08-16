#!/usr/bin/env python3
"""Regenerate the exploration-visualization data behind the tactile card and the
baseline tab (fig_tactile_explore_embed.html / fig_baseline_explore_embed.html).

Source data lives on tars at ~/Projects/OctiLab/data/tactile_viz/, one directory
per method (method, bc, dpt, aawr, spoc), each holding traj_XX_{success,fail}/
with traj.pkl ({"obs_policy": [per-step dict], ...}) and scene.mp4. This script
picks the LONGEST trajectory per method, extracts the end-effector xyz path and
the 6 finger contact-force channels, and writes tactile_data.js plus re-encoded
scene_<method>.mp4 files into static/figs/explore_viz/.

Usage (with the tactile_viz tree copied or mounted locally):
    python3 make_data.py /path/to/tactile_viz ../../explore_viz
"""
import glob, json, os, pickle, subprocess, sys

import numpy as np

def longest(mdir):
    best, best_n = None, -1
    for td in sorted(glob.glob(os.path.join(mdir, "traj_*"))):
        with open(os.path.join(td, "traj.pkl"), "rb") as f:
            d = pickle.load(f)
        if d["n_steps"] > best_n:
            best, best_n = (td, d), d["n_steps"]
    return best

def main():
    src, out = sys.argv[1], sys.argv[2]
    data = {}
    fmax = 0.0
    for m in ["method", "bc", "dpt", "aawr", "spoc"]:
        td, d = longest(os.path.join(src, m))
        obs = d["obs_policy"]
        ee = np.array([np.asarray(o["end_effector_pose"]).reshape(-1)[:3] for o in obs])
        tf = np.array([np.concatenate([
            np.asarray(o["left_inner_finger_contact_force"]).reshape(-1),
            np.asarray(o["right_inner_finger_contact_force"]).reshape(-1)]) for o in obs])
        fmax = max(fmax, float(np.linalg.norm(tf[:, :3], axis=1).max()),
                   float(np.linalg.norm(tf[:, 3:], axis=1).max()))
        data[m] = {"traj": np.round(ee, 4).tolist(),
                   "force": np.round(tf, 2).tolist(),
                   "success": bool(d["success"]), "n": int(d["n_steps"])}
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(td, "scene.mp4"),
                        "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", "-an", os.path.join(out, f"scene_{m}.mp4")],
                       check=True)
        print(m, os.path.basename(td), d["n_steps"], "success" if d["success"] else "fail")
    data["_fmax"] = round(fmax, 2)
    with open(os.path.join(out, "tactile_data.js"), "w") as f:
        f.write("// longest rollout per method from tactile_viz (see make_data.py)\n"
                "// force = signed per-step [Lx,Ly,Lz,Rx,Ry,Rz]; _fmax = shared arrow scale\n"
                "window.TACTILE_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")

if __name__ == "__main__":
    main()
