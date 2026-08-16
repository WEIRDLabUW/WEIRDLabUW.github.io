#!/usr/bin/env python3
"""1x5 3D end-effector trajectory figure (Expert | BC | DAgger | DPT | ASTEROID)
for the tactile cube pick task, styled after the website's main 3D viz
(viz_common.js: plasma path over time, gray ghost, dark start dot,
yellow/red end marker, light panes, camera eye (0.9,-2.2,0.9)).

BC / DPT / ASTEROID come from ../../explore_viz/cmp_data.js (tact task,
longest roll). Expert (RMA) and DAgger are read from
tact_extra/{expert,dagger}/traj.pkl (OctiLab rollout pkls fetched from tars);
missing ones render as an empty "pending" pane so the layout can be checked
before the rollouts exist.

Output: static/figs/paper/tactile_traj_1x5.pdf (+ .png preview)
"""
import json, os, pickle, re, sys

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Line3DCollection

HERE = os.path.dirname(os.path.abspath(__file__))
CMP = os.path.join(HERE, "..", "..", "explore_viz", "cmp_data.js")
EXTRA = os.path.join(HERE, "tact_extra")
OUT = os.path.join(HERE, "..", "..", "paper")

INK = "#55525e"
TICK = "#8b8698"
PANE = "#fafafa"
GRID = "#e8e5ee"
GHOST = "#dcd9e3"
SEP = "#c9c5d2"

matplotlib.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
    "pdf.fonttype": 42,
})


def from_cmp(key, idx=None):
    s = open(CMP).read()
    d = json.loads(re.sub(r";\s*$", "", s[s.index("=", s.index("window.CMP_DATA")) + 1:].strip()))
    rolls = d["tasks"]["tact"]["methods"][key]["rolls"]
    r = rolls[idx] if idx is not None else max(rolls, key=lambda r: len(r["traj"]))
    return np.asarray(r["traj"], float), bool(r["success"])


def from_pkl(name):
    p = os.path.join(EXTRA, name, "traj.pkl")
    if not os.path.exists(p):
        return None
    with open(p, "rb") as f:
        d = pickle.load(f)
    ee = np.array([np.asarray(o["end_effector_pose"]).reshape(-1)[:3] for o in d["obs_policy"]])
    return ee, bool(d["success"])


def style_axis(ax, lims, aspect, names=("x", "y", "z")):
    for axis, (lo, hi) in zip((ax.xaxis, ax.yaxis, ax.zaxis), lims):
        axis.set_pane_color(matplotlib.colors.to_rgba(PANE))
        axis._axinfo["grid"].update(color=GRID, linewidth=0.5)
        axis.line.set_color(GRID)
    ax.set_xlim(*lims[0]); ax.set_ylim(*lims[1]); ax.set_zlim(*lims[2])
    ax.set_box_aspect(aspect)
    for name, axis in (("x", ax.xaxis), ("y", ax.yaxis), ("z", ax.zaxis)):
        axis.set_major_locator(matplotlib.ticker.MaxNLocator(4))
        axis.label.set_color(INK)
        axis.label.set_size(6.5)
    ax.set_xlabel(names[0], labelpad=-10)
    ax.set_ylabel(names[1], labelpad=-10)
    ax.set_zlabel(names[2], labelpad=-8)
    ax.tick_params(colors=TICK, labelsize=4.6, pad=-4)
    for t in ax.xaxis.get_ticklabels() + ax.yaxis.get_ticklabels() + ax.zaxis.get_ticklabels():
        t.set_color(TICK)
    # higher, rotated view: opens up the table-plane exploration (sweeps/tangles)
    # without flattening the descent (site EYE-equivalent was elev=20.7, azim=-67.7)
    ax.view_init(elev=40, azim=-125)


def draw(ax, traj, success, lims, aspect, names=("x", "y", "z"), gray=False):
    style_axis(ax, lims, aspect, names)
    ax.computed_zorder = False
    pts = traj[:, None, :]
    segs = np.concatenate([pts[:-1], pts[1:]], axis=1)
    ax.add_collection3d(Line3DCollection(segs, colors=[GHOST], linewidths=1.6, zorder=1))
    lc = Line3DCollection(segs, cmap="Greys" if gray else "viridis", linewidths=2.0,
                          zorder=3, capstyle="round", joinstyle="round")
    # gray expert: clip the Greys ramp to a readable light->dark band
    lc.set_array(np.linspace(0.35, 0.8, len(segs)) if gray else np.linspace(0, 1, len(segs)))
    lc.set_clim(0, 1)
    ax.add_collection3d(lc)
    ax.scatter(*traj[0], s=9, c=INK, depthshade=False, zorder=5)
    # green success / red fail (matches the panel border; yellow would blend
    # into viridis's bright end)
    if success:
        ax.scatter(*traj[-1], s=26, c="#2f9e44", edgecolors="#1c6b2d",
                   linewidths=0.9, depthshade=False, zorder=6)
    else:
        ax.scatter(*traj[-1], s=26, c="#cc2222", edgecolors="#7c1414",
                   linewidths=0.9, depthshade=False, zorder=6)


def render(panels, panel_lims, aspect, perm, names, out_stem):
    fig = plt.figure(figsize=(15.0, 3.2))
    gs = fig.add_gridspec(1, 5, left=0.005, right=0.995, top=0.88, bottom=0.06,
                          wspace=0.02)
    for i, (name, data, tcolor) in enumerate(panels):
        plims = [panel_lims[i][j] for j in perm]
        ax = fig.add_subplot(gs[0, i], projection="3d")
        ax.set_title(name, fontsize=13, color=tcolor, pad=2,
                     fontweight="bold" if name == "ASTEROID" else "medium")
        if data is None:
            style_axis(ax, plims, aspect, names)
            ax.text2D(0.5, 0.5, "pending", transform=ax.transAxes, ha="center",
                      va="center", fontsize=9, color=TICK, style="italic")
        else:
            traj, success = data
            draw(ax, traj[:, perm], success, plims, aspect, names,
                 gray=(name == "Expert"))
            # thin success/failure boundary around the panel (incl. title)
            cell = gs[0, i].get_position(fig)
            fig.add_artist(matplotlib.patches.FancyBboxPatch(
                (cell.x0 + 0.004, 0.025), cell.width - 0.008, 0.945,
                boxstyle="round,pad=0,rounding_size=0.012",
                transform=fig.transFigure, fill=False, linewidth=1.0,
                edgecolor="#2f9e44" if success else "#cc2222", alpha=0.85))

    # small gray separator between Expert and the learned policies
    x0 = (gs[0, 0].get_position(fig).x1 + gs[0, 1].get_position(fig).x0) / 2
    fig.add_artist(plt.Line2D([x0, x0], [0.14, 0.86], transform=fig.transFigure,
                              color=SEP, linewidth=0.9, solid_capstyle="round"))

    os.makedirs(OUT, exist_ok=True)
    fig.savefig(os.path.join(OUT, out_stem + ".pdf"))
    fig.savefig(os.path.join(OUT, out_stem + ".png"), dpi=180)
    plt.close(fig)
    print("wrote", os.path.join(OUT, out_stem + ".pdf"))


def main():
    # title colors follow the website legend (curves_data.js); Expert is gray
    panels = [
        ("Expert", from_pkl("expert"), "#6e6a78"),
        ("BC", from_cmp("bc"), "#1f77b4"),
        ("DAgger", from_pkl("dagger"), "#1f77b4"),
        ("DPT", from_cmp("dpt"), "#2ca02c"),
        ("ASTEROID", from_cmp("asteroid", idx=1), "#003366"),  # roll 1: cleanest exploration
    ]

    def cube(trajs):
        # cube limits: same span on every axis -> equal unit scaling, square panels
        lo = np.min([t.min(axis=0) for t in trajs], axis=0)
        hi = np.max([t.max(axis=0) for t in trajs], axis=0)
        ctr = (lo + hi) / 2
        half = 1.06 * (hi - lo).max() / 2
        return [(c - half, c + half) for c in ctr]

    # DAgger's collapsed policy leaves the workspace by ~1 m; giving it the shared
    # cube would shrink every other panel to a dot. It gets its own cube (ticks
    # make the larger range explicit); the rest share the tight workspace cube.
    shared = cube([p[1][0] for p in panels if p[1] is not None and p[0] != "DAgger"])
    panel_lims = [cube([p[1][0]]) if p[0] == "DAgger" and p[1] is not None else shared
                  for p in panels]
    aspect = (1, 1, 1)

    render(panels, panel_lims, aspect, (0, 1, 2), ("x", "y", "z"), "tactile_traj_1x5")


if __name__ == "__main__":
    main()
