#!/usr/bin/env python3
"""Animated GIF version of the 1x5 tactile-trajectory figure (make_traj_grid.py)
for the website: each panel's trajectory draws in progressively at a shared
per-step rate, the outcome marker pops in when a rollout ends, then the frame
holds. Output: static/figs/tactile_traj_1x5.gif
"""
import os

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Line3DCollection
from matplotlib.animation import FuncAnimation, PillowWriter

from make_traj_grid import (from_cmp, from_pkl, style_axis, GHOST, OUT, TICK)

STRIDE = 2      # env steps per gif frame
FPS = 6
HOLD = 9        # frames to hold the finished figure


def main():
    panels = [
        ("Expert", from_pkl("expert"), "#6e6a78"),
        ("BC", from_cmp("bc"), "#1f77b4"),
        ("DAgger", from_pkl("dagger"), "#1f77b4"),
        ("DPT", from_cmp("dpt"), "#2ca02c"),
        ("ASTEROID", from_cmp("asteroid", idx=1), "#003366"),
    ]

    def cube(trajs):
        lo = np.min([t.min(axis=0) for t in trajs], axis=0)
        hi = np.max([t.max(axis=0) for t in trajs], axis=0)
        ctr = (lo + hi) / 2
        half = 1.06 * (hi - lo).max() / 2
        return [(c - half, c + half) for c in ctr]

    shared = cube([p[1][0] for p in panels if p[0] != "DAgger"])
    panel_lims = [cube([p[1][0]]) if p[0] == "DAgger" else shared for p in panels]

    fig = plt.figure(figsize=(15.0, 3.2))
    gs = fig.add_gridspec(1, 5, left=0.005, right=0.995, top=0.88, bottom=0.06,
                          wspace=0.02)
    anims = []
    for i, (name, (traj, success), tcolor) in enumerate(panels):
        ax = fig.add_subplot(gs[0, i], projection="3d")
        ax.set_title(name, fontsize=13, color=tcolor, pad=2,
                     fontweight="bold" if name == "ASTEROID" else "medium")
        style_axis(ax, panel_lims[i], (1, 1, 1))
        ax.computed_zorder = False
        pts = traj[:, None, :]
        segs = np.concatenate([pts[:-1], pts[1:]], axis=1)
        ax.add_collection3d(Line3DCollection(segs, colors=[GHOST], linewidths=1.6,
                                             zorder=1))
        gray = name == "Expert"
        lc = Line3DCollection([], cmap="Greys" if gray else "viridis",
                              linewidths=2.0, zorder=3, capstyle="round",
                              joinstyle="round")
        lc.set_clim(0, 1)
        ax.add_collection3d(lc)
        ax.scatter(*traj[0], s=9, c="#55525e", depthshade=False, zorder=5)
        # big outcome-colored cursor that rides the current position (site viz
        # convention) and lands as the end marker
        mk = ax.scatter(*traj[0], s=55, c="#2f9e44" if success else "#cc2222",
                        edgecolors="#1c6b2d" if success else "#7c1414",
                        linewidths=1.1, depthshade=False, zorder=6)
        cell = gs[0, i].get_position(fig)
        fig.add_artist(matplotlib.patches.FancyBboxPatch(
            (cell.x0 + 0.004, 0.025), cell.width - 0.008, 0.945,
            boxstyle="round,pad=0,rounding_size=0.012",
            transform=fig.transFigure, fill=False, linewidth=1.0,
            edgecolor="#2f9e44" if success else "#cc2222", alpha=0.85))
        ramp = (np.linspace(0.35, 0.8, len(segs)) if gray
                else np.linspace(0, 1, len(segs)))
        anims.append((traj, segs, ramp, lc, mk))

    n_frames = max(len(a[1]) for a in anims) // STRIDE + 1 + HOLD

    def update(f):
        k = f * STRIDE
        for traj, segs, ramp, lc, mk in anims:
            j = min(k, len(segs))
            lc.set_segments(segs[:j])
            lc.set_array(ramp[:j])
            p = traj[min(k, len(traj) - 1)]
            mk._offsets3d = ([p[0]], [p[1]], [p[2]])
        return []

    anim = FuncAnimation(fig, update, frames=n_frames, interval=1000 / FPS)
    out = os.path.join(OUT, "..", "tactile_traj_1x5.gif")
    anim.save(out, writer=PillowWriter(fps=FPS), dpi=88)
    print("wrote", os.path.abspath(out), os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
