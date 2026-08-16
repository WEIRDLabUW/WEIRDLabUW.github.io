#!/usr/bin/env python3
"""Build fig_train_infer_embed.html from template.html + LaTeX math snippets.

Same engine as ../asteroid_loop/build.py: each snippet is compiled with
latex+dvisvgm (--no-fonts) into path outlines, normalized so its CENTER sits at
(0,0), id-prefixed, and inlined into the master SVG's <defs>. The template
places snippets with {{T:name:x,y,scale,anchor}} placeholders and
{{BRACE:x1,x2,y,amp}} for curly braces.

Run:  python3 build.py     (writes ../../fig_train_infer_embed.html)
"""
import os, re, subprocess, sys, tempfile, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "fig_train_infer_embed.html"))

PREAMBLE = r"""
\documentclass[10pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage[dvipsnames]{xcolor}
\definecolor{teach}{HTML}{004646}
\definecolor{ctxc}{HTML}{A3492F}
\definecolor{goldc}{HTML}{B9821F}
\begin{document}
"""

SNIPPETS = {
    # section titles + headers
    "httrain": r"training",
    "htinf":  r"inference",
    "it0":    r"iteration 0",
    "it1":    r"iteration 1",
    "it2":    r"iteration 2",
    "it3":    r"iteration 3",
    "hds":    r"in-context dataset $\mathcal{D}$",
    "hempty": r"$h=\varnothing$",
    # chip glyphs
    "lA": r"$\mathrm{A}$", "lB": r"$\mathrm{B}$", "lC": r"$\mathrm{C}$",
    "qm": r"$?$", "rp1": r"$+1$",
    "astar2": r"$a^{*}$",
    "rp0": r"$+0$", "goalw": r"goal",
    "pith": r"$\pi_\theta$",
    # column phrases, two stacked lines so they can be large
    "p0a": r"\textcolor{ctxc}{null context}", "p0b": r"any goal possible",
    "p1a": r"\textcolor{ctxc}{A eliminated}", "p1b": r"goal is B or C",
    "p2a": r"\textcolor{ctxc}{A, B eliminated}", "p2b": r"goal is C",
    "p3a": r"\textcolor{goldc}{success}", "p3b": r"stay at C",
    "ph3": r"\textcolor{goldc}{success}: stay at C",
    # dataset entries, one per iteration: (context | expert actions),
    # context rust, expert-consistent goal set teal
    "e0": r"$(\varnothing\;|\;\textcolor{teach}{\{\mathrm{A},\mathrm{B},\mathrm{C}\}})$",
    "e1": r"$(\textcolor{ctxc}{\mathrm{A},0}\;|\;\textcolor{teach}{\{\mathrm{B},\mathrm{C}\}})$",
    "e2": r"$(\textcolor{ctxc}{\mathrm{A},0,\mathrm{B},0}\;|\;\textcolor{teach}{\mathrm{C}})$",
    "e3": r"$(\textcolor{ctxc}{\mathrm{A},0,\mathrm{B},0,\mathrm{C},1}\;|\;\textcolor{teach}{\mathrm{C}})$",
    # inference takeaway
    "cap1": r"every step retrieves the \textcolor{teach}{expert answer}",
    "cap2": r"for its \textcolor{ctxc}{context} from $\mathcal{D}$",
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
    subprocess.run(["dvisvgm", "--no-fonts", "--exact-bbox",
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
    if not body:
        body = re.search(r"<g id='page1'>(.*)</g>\s*</svg>", svg, re.S)
    body = body.group(1)
    defs = re.sub(r"id='", f"id='{name}-", defs)
    body = re.sub(r"xlink:href='#", f"xlink:href='#{name}-", body)
    defs = re.sub(r"xlink:href='#", f"xlink:href='#{name}-", defs)
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
