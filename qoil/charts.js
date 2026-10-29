// Bimanual VLA success-rate chart (paper Fig. 9), plain SVG with value labels and hover.
// Colors come from the --chart-* variables in style.css (Q-OIL navy vs. gray baselines).
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    const C = {
        ours: css("--chart-ours", "#1f3f7a"), base2: css("--chart-base-2", "#a9acb4"), base3: css("--chart-base-3", "#dfe1e6"),
        focus: css("--chart-focus", "#4a4c55"), grid: css("--chart-grid", "#eceef2"),
    };
    const el = (tag, attrs = {}, parent) => {
        const n = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
        if (parent) parent.appendChild(n);
        return n;
    };

    // ------------------------------------------------------------------ bimanual VLA bars
    function yam(root) {
        const groups = ["Bag: pickup", "Bag: pickup + insert", "Towel folding", "Coffee pouring"];
        const methods = [
            { name: "Base VLA", color: C.base3, vals: [16.7, 0, 10, 0] },
            { name: "BC+RL", color: C.base2, vals: [86.7, 0, 80, 40] },
            { name: "Q-OIL", color: C.ours, vals: [86.7, 50, 90, 50] },
        ];
        const svgWrap = root.querySelector(".chart-plot");
        const tip = root.querySelector(".chart-tip");

        function draw() {
            const W = svgWrap.clientWidth, H = 300;
            const pad = { l: 48, r: 8, t: 22, b: 44 };
            const gw = (W - pad.l - pad.r) / groups.length;
            const bw = Math.min(46, (gw * 0.78) / methods.length);
            const y = v => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
            svgWrap.innerHTML = "";
            const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
                "aria-label": "Success rates of the base VLA, BC+RL and Q-OIL on four bimanual measurements" }, svgWrap);
            [0, 25, 50, 75, 100].forEach(t => {
                el("line", { x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t), stroke: C.grid }, svg);
                el("text", { x: pad.l - 8, y: y(t), "text-anchor": "end", "dominant-baseline": "middle", class: "tick" }, svg).textContent = `${t}%`;
            });
            groups.forEach((g, gi) => {
                const cx = pad.l + gw * (gi + 0.5);
                const x0 = cx - (methods.length * bw + (methods.length - 1) * 2) / 2;
                methods.forEach((m, mi) => {
                    const v = m.vals[gi], bx = x0 + mi * (bw + 2), top = y(v), base = y(0);
                    const h = Math.max(0, base - top);
                    // 4px rounded data end, square at the baseline
                    const r = Math.min(4, h, bw / 2);
                    const d = h > 0
                        ? `M${bx},${base} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + bw - r} Q${bx + bw},${top} ${bx + bw},${top + r} V${base} Z`
                        : `M${bx},${base - 1} H${bx + bw} V${base} H${bx} Z`;
                    const bar = el("path", { d, fill: m.color }, svg);
                    el("text", { x: bx + bw / 2, y: top - 6, "text-anchor": "middle", class: "bar-label" + (m.name === "Q-OIL" ? " is-ours" : "") }, svg).textContent = Number.isInteger(v) ? `${v}` : v.toFixed(1);
                    const hitbox = el("rect", { x: bx - 1, y: pad.t, width: bw + 2, height: base - pad.t, fill: "transparent" }, svg);
                    hitbox.addEventListener("pointerenter", () => {
                        bar.setAttribute("stroke", C.focus); bar.setAttribute("stroke-width", 1.5);
                        tip.innerHTML = `<b>${g}</b><span><i style="background:${m.color}"></i>${m.name}<em>${v}%</em></span>`;
                        tip.hidden = false;
                        const tx = Math.min(W - tip.offsetWidth, bx + bw + 8);
                        tip.style.left = `${tx}px`; tip.style.top = `${Math.max(0, top - 10)}px`;
                    });
                    hitbox.addEventListener("pointerleave", () => { bar.removeAttribute("stroke"); tip.hidden = true; });
                });
                const label = el("text", { x: cx, y: H - pad.b + 18, "text-anchor": "middle", class: "tick" }, svg);
                label.textContent = g;
            });
        }
        draw();
        new ResizeObserver(() => draw()).observe(svgWrap);
    }

    document.querySelectorAll('[data-chart="yam"]').forEach(yam);
})();
