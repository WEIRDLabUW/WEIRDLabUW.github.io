#!/usr/bin/env python3
"""Build fig_asteroid_loop_embed.html from template.html + LaTeX math snippets.

Each snippet is compiled with latex+dvisvgm (--no-fonts) into path outlines,
normalized so its CENTER sits at (0,0), id-prefixed, and inlined into the
master SVG's <defs> as <g id="tex-NAME">. The template places snippets with
{{T:name:x,y,scale,anchor}} placeholders (replaced by a transform value) and
{{BRACE:x1,x2,y,amp}} placeholders (replaced by a curly-brace path).

Run:  python3 build.py     (writes ../../fig_asteroid_loop_embed.html)
"""
import os, re, subprocess, sys, tempfile, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "fig_asteroid_loop_embed.html"))

PREAMBLE = r"""
\documentclass[10pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage[dvipsnames]{xcolor}
\definecolor{teach}{HTML}{004646}
\definecolor{ctxc}{HTML}{A3492F}
\definecolor{stud}{HTML}{35507D}
\begin{document}
"""

SNIPPETS = {
    # world sampling
    "zpz":    r"$z\sim p(z)$",
    # actors + interaction-loop labels
    "pith":   r"$\pi_{\theta_k}$",
    "pistar": r"$\pi^{*}$",
    "zlab":   r"$z$",
    "at":     r"$a_t$",
    "ort":    r"$o_t,r_t$",
    "astart": r"$a^{*}_{t}$",
    "ot":     r"$o_t$",
    # context trajectory tokens
    "o0": r"$o_0$", "a0": r"$a_0$", "r0": r"$r_0$",
    "o1": r"$o_1$", "o2": r"$o_2$", "a1": r"$a_1$", "r1": r"$r_1$",
    "as0": r"$a^{*}_{0}$", "as1": r"$a^{*}_{1}$", "as2": r"$a^{*}_{2}$",
    "tau0": r"$\tau^{0}$", "tau1": r"$\tau^{1}$", "tau2": r"$\tau^{2}$",
    "cdots":  r"$\cdots$",
    # brace labels
    "ctxh":   r"context $h_t=(\tau^{0},\tau^{1},\cdots)$",
    "pairlab": r"$(o_t,\,a^{*}_{t})$",
    # loss + loop labels
    "lossL":  r"$\mathcal{L}=-\log \pi_{\theta_k}($",
    "lbar":   r"$\mid$",
    "lcomma": r"$,$",
    "lrp":    r"$)$",
    "grad":   r"$\theta_{k+1}\leftarrow\theta_{k}-\eta\,\nabla_{\theta}\mathcal{L}$",
    "kpp":    r"$k\leftarrow k+1$",
    # numbers + headers
    "n1":     r"\textbf{1}",
    "n2":     r"\textbf{2}",
    "n3":     r"\textbf{3}",
    "hdrA":   r"the \textcolor{stud}{unprivileged student} collects on-policy rollouts",
    "hdrB":   r"the \textcolor{teach}{privileged expert} generates target labels",
    "hdrC":   r"distill: \textcolor{ctxc}{rollouts become context only} --- \textcolor{teach}{all supervision comes from the expert}", "tgt": r"expert supervision", "ctxw": r"context only",
    "taustar": r"$\tau^{*}$", "stud": r"student", "tch": r"teacher",
}


def compile_snippet(name, code, workdir):
    tex = PREAMBLE + code + "\n\\end{document}\n"
    texfile = os.path.join(workdir, name + ".tex")
    with open(texfile, "w") as f:
        f.write(tex)
    subprocess.run(["latex", "-interaction=nonstopmode", name + ".tex"],
                   cwd=workdir, capture_output=True, check=False)
    dvi = os.path.join(workdir, name + ".dvi")
    if not os.path.exists(dvi):
        log = open(os.path.join(workdir, name + ".log")).read()[-2000:]
        sys.exit(f"latex failed for {name}:\n{log}")
    r = subprocess.run(["dvisvgm", "--no-fonts", "--exact-bbox",
                        "-o", name + ".svg", name + ".dvi"],
                       cwd=workdir, capture_output=True, text=True)
    svg = open(os.path.join(workdir, name + ".svg")).read()
    return parse_svg(name, svg)


def parse_svg(name, svg):
    vb = re.search(r"viewBox='([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)'", svg)
    minx, miny, w, h = map(float, vb.groups())
    defs = re.search(r"<defs>(.*)</defs>", svg, re.S)
    defs = defs.group(1) if defs else ""
    body = re.search(r"</defs>\s*<g id='page1'>(.*)</g>\s*</svg>", svg, re.S)
    if not body:  # no defs (e.g. rules only)
        body = re.search(r"<g id='page1'>(.*)</g>\s*</svg>", svg, re.S)
    body = body.group(1)
    # prefix ids so snippets don't collide
    defs = re.sub(r"id='", f"id='{name}-", defs)
    body = re.sub(r"xlink:href='#", f"xlink:href='#{name}-", body)
    defs = re.sub(r"xlink:href='#", f"xlink:href='#{name}-", defs)
    # normalize: center at (0,0)
    tx, ty = -(minx + w / 2), -(miny + h / 2)
    g = (f"<g id='tex-{name}' transform='translate({tx:.4f},{ty:.4f})'>"
         f"{body}</g>")
    return {"defs": defs, "g": g, "w": w, "h": h}


def transform_for(s, x, y, scale, anchor):
    w, h = s["w"] * scale, s["h"] * scale
    dx = {"c": 0, "n": 0, "s": 0, "w": w / 2, "e": -w / 2,
          "nw": w / 2, "ne": -w / 2, "sw": w / 2, "se": -w / 2}[anchor]
    dy = {"c": 0, "w": 0, "e": 0, "n": h / 2, "s": -h / 2,
          "nw": h / 2, "ne": h / 2, "sw": -h / 2, "se": -h / 2}[anchor]
    return f"translate({x + dx:.2f},{y + dy:.2f}) scale({scale})"


def brace_path(x1, x2, y, a):
    """Horizontal curly brace under [x1,x2] at y, bulging down, tip at center."""
    m = (x1 + x2) / 2
    return (f"M{x1:.1f},{y:.1f} q0,{a} {a},{a} H{m - a:.1f} "
            f"q{a},0 {a},{a} q0,-{a} {a},-{a} H{x2 - a:.1f} q{a},0 {a},-{a}")


def main():
    with tempfile.TemporaryDirectory() as wd:
        parts = {n: compile_snippet(n, c, wd) for n, c in SNIPPETS.items()}

    sizes = {n: [round(p["w"], 2), round(p["h"], 2)] for n, p in parts.items()}
    print(json.dumps(sizes, indent=0))

    tpl = open(os.path.join(HERE, "template.html")).read()

    texdefs = ("<defs>" + "".join(p["defs"] for p in parts.values())
               + "".join(p["g"] for p in parts.values()) + "</defs>")
    tpl = tpl.replace("<!--TEXDEFS-->", texdefs)

    def sub_T(m):
        name, x, y, sc, anchor = m.group(1), *m.group(2).split(",")
        return transform_for(parts[name], float(x), float(y), float(sc), anchor)
    tpl = re.sub(r"\{\{T:([\w]+):([^}]+)\}\}", sub_T, tpl)

    def sub_B(m):
        x1, x2, y, a = map(float, m.group(1).split(","))
        return brace_path(x1, x2, y, a)
    tpl = re.sub(r"\{\{BRACE:([^}]+)\}\}", sub_B, tpl)

    leftovers = re.findall(r"\{\{[^}]*\}\}", tpl)
    if leftovers:
        sys.exit(f"unresolved placeholders: {leftovers[:5]}")
    with open(OUT, "w") as f:
        f.write(tpl)
    print(f"wrote {OUT} ({len(tpl)} bytes)")


if __name__ == "__main__":
    main()
