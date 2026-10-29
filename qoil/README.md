# Q-OIL project page

Static site for *Q-OIL: Optimistic Exploration in Learning from Human Interventions*.

## Preview locally

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Layout

- `index.html`, `style.css`: the page (fonts and title styling follow the LMP page; cards and the pseudocode diff follow ASTEROID)
- `site.js`: click-through panels, play-when-visible video, BibTeX copy
- `charts.js`: the bimanual VLA bar chart
- `demo/`: the in-browser pushing demo (`qoil-core.js` environment and agent, `qoil-demo.js` UI)
- `assets/videos/`: training-run comparisons and explainer clips (H.264, web-compressed)
- `assets/figures/`: paper figures and plots
- `scripts/manim_humans.py`: the manim scene behind the "how do people intervene?" explainer clip (render instructions in its docstring)
