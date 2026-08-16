# ASTEROID website — media & method-explanation guide

This is your production checklist for replacing every placeholder on the page. It has three parts:

1. **How to explain the method clearly** — the narrative flow + a storyboard for the main figure/GIF.
2. **What each placeholder should contain** — a shot list keyed to the page sections.
3. **How to make high-quality GIFs/videos** — concrete `ffmpeg` / `gifski` recipes.

The site now uses the LMP (Nerfies/Bulma) template. Every placeholder in `index.html` is a quiet gray
box (`.media-ph`) labeled with what belongs there — swap each for a `<video autoplay muted loop playsinline>`
or `<img>` with the same `aspect-ratio`.

---

## 1. How to explain the method clearly (the narrative flow)

Keep **one running example the whole way through: the three-door task.** It matches the paper,
the comparison tiles, and the draft animation, so the reader never has to re-learn a setup. Don't
introduce the A/B/C household example on the site — reuse doors 1/2/3 everywhere.

The clearest flow is a 4-beat story. Each beat = one animation panel.

**Beat 0 — The problem (why exploration is needed).**
Show the three doors. The goal door `z` is hidden and fixed across a few episodes. The agent sees
only its own position. Caption: *"Which door is the goal? You can't tell from one look — you have to try."*
This motivates *why* a clairvoyant expert alone isn't enough: the expert already knows `z`, so it just
walks to the right door and never demonstrates searching.

**Beat 1 — On-policy rollout (student generates the history).**
The *student* (π̂θ) acts under partial observability and tries a door. Reward reveals hit/miss.
Emphasize visually that the **history accumulates** (a growing filmstrip / breadcrumb of past attempts).
Caption: *"The student's own failed tries become the training context."*

**Beat 2 — In-context distillation (expert labels the reached state).**
Freeze the history. Bring in the clairvoyant expert (π*) who *sees* the goal. It stamps the correct
next door onto that exact history. Show the key idea with **two copies of the same history but different
hidden `z`** → the expert label differs (door 2 vs door 3). That's what teaches randomize-then-commit.
Caption: *"Same history, different hidden goal → a distribution of correct next moves."*

**Beat 3 — Iterate → posterior sampling.**
Play the loop speeding up: iteration 0 guesses i.i.d.; iteration 1 uses one past episode; iteration 2
reasons over two attempts and pins the true door. End on the equation
`π(a|h) = ∫ π*(a|s) p(s|h) ds` with the label **"Bayesian posterior sampling."**

**Then the POMDP generalization (Step 3)** is a short coda: same recipe, but the hidden state changes
*within* an episode (a maze where position is hidden). Sample a timestep, roll out to get `h_t`, label
the reached state. Show local 3×3 views pruning the set of plausible positions.

> Rule of thumb: **student = one color, expert = a second color, history = a persistent filmstrip.**
> Keep those three visual anchors identical across every method GIF so comparisons are instant.

---

## 2. Shot list (what goes in each placeholder)

### §2 Task carousel — 6 clips, 16:9, ~900px, silent loops (4–8 s)
| Slide | Show | The "aha" to capture |
|---|---|---|
| Gridworld | KeyDoor / DarkRoom agent over repeated episodes | remembers goal/key across episodes |
| Procgen maze | agent with 3×3 local view | steers toward *unexplored* cells |
| Habitat | first-person object search | revisits nothing; goes to likely rooms |
| Ant / 2D nav | 8-DoF ant heading to hidden goal | targeted, not random, wandering |
| Sim robot | wrist-cam peg / tactile pick | scans to localize before acting |
| Real robot | proprioception-only cube pick | recovers after a miss |

### §4 Four-tile comparison — 4 GIFs, **square (1:1)**, identical length & framing
The single most valuable asset. Same three-door task, four policies, **playing in lock-step**:
- **BC** — walks confidently to a wrong door, ignores the miss, repeats.
- **DAgger** — on-policy but dithers; no context-level exploration signal.
- **DPT** — jitters / spreads probability over all doors ("dithering").
- **ASTEROID** — tries door → miss → switches → commits. Clean success.

Record all four with the **same camera, same doors, same duration** so a viewer's eye can diff them.
Export at the same fps and frame count so the loops stay synced. (The current ASTEROID tile shows the
rough draft `combined_draft.gif` only as a motion placeholder — replace it.)

### §5 Overview — 1 video, YouTube embed (uncomment the iframe in `index.html`).

### §6 Method — the 4-beat story above
- **Figure 1 (hero)** = the whole loop in one clean diagram/GIF (Beats 1–2).
- **Step 1 GIF** = Beat 1 (student rollout + growing history), 4:3.
- **Step 2 GIF** = Beat 2 (expert relabeling; two-histories-one-differs trick), 4:3.
- **Curriculum figure** = Beat 3 (iteration 0→1→2), 16:9, can be a static figure.
- **Step 3 GIF** = POMDP maze pruning, 4:3.

### §7 Experiments — result plots (16:9 hero + 3:2 cards)
Export matplotlib at 2× DPI, transparent or white bg, consistent per-method colors that match the
tiles in §4 (BC / DAgger / DPT / ASTEROID always the same color). Figures 5, 6, 7, 9, 10, 11a.

### §8 Real-world — Scaffolder-style side-by-side
Two 16:9 loops of the **same** real-robot task: ASTEROID (recovers, succeeds) vs BC (drifts, fails).
Same camera angle and length so the contrast is obvious.

### §9 Analysis A–G — 7 loops, 16:9
One qualitative clip per behavior (peg recovery, tactile-only, tactile+no-proprio, Procgen, Habitat,
Ant, KeyDoor memory). For trajectory-based ones, overlaying the gripper/agent path (as Scaffolder does
with its spiral) reads much better than raw video.

---

## 3. How to make high-quality GIFs (concrete commands)

**Prefer MP4/WebM over GIF for anything > 3 s or photographic** — 5–20× smaller and sharper. The page's
placeholder `<img>` can be swapped for a self-looping muted `<video>`:

```html
<video src="assets/videos/asteroid_real.mp4" autoplay loop muted playsinline
       style="width:100%;border-radius:12px;display:block"></video>
```

### Screen/sim capture → clean MP4
```bash
# trim + crop + scale to a tidy width, good quality, web-friendly
ffmpeg -i raw.mov -ss 00:00:02 -t 6 \
  -vf "crop=in_h*16/9:in_h,scale=900:-2,fps=30" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -an asteroid_real.mp4
```

### High-quality GIF with a per-clip palette (much better than default ffmpeg GIF)
```bash
# 1) build an optimized palette   2) apply it
ffmpeg -i clip.mp4 -vf "fps=20,scale=600:-1:flags=lanczos,palettegen=stats_mode=diff" -y pal.png
ffmpeg -i clip.mp4 -i pal.png \
  -lavfi "fps=20,scale=600:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" \
  -y clip.gif
```

### Best-looking GIFs: `gifski` (Rust, per-frame palettes)
```bash
brew install gifski ffmpeg
ffmpeg -i clip.mp4 -vf "fps=20,scale=600:-1:flags=lanczos" frame_%04d.png
gifski --fps 20 --quality 90 -o clip.gif frame_*.png && rm frame_*.png
```

### The four §4 tiles, guaranteed in-sync
Render each policy to the **same fps and frame count**, then export identically:
```bash
for m in bc dagger dpt asteroid; do
  ffmpeg -i $m.mp4 -vf "fps=20,scale=480:480:force_original_aspect_ratio=increase,crop=480:480" \
    ${m}_%04d.png
  gifski --fps 20 --quality 90 -o ${m}.gif ${m}_*.png && rm ${m}_*.png
done
```

### Keep GIFs small
- Cap width at **480–600px** for tiles, **~900px** for hero clips.
- 15–20 fps is plenty for these animations.
- Keep loops **short (4–8 s)**; trim dead frames at the ends.
- Target **< 2–3 MB** per GIF; if larger, switch that asset to MP4/WebM.

### Overlaying agent trajectories (recommended for §9)
For the Procgen/Ant/robot behaviors, plotting the agent/gripper path over the frame (like Scaffolder's
spiral-search visualization) communicates *strategy* far better than the raw rollout. A simple matplotlib
overlay of `(x, y)` over time, saved per frame then stitched with `gifski`, works well.

---

## Quick spec table

| Section | Asset | Ratio | Width | Format | Length |
|---|---|---|---|---|---|
| §2 carousel | task clips ×6 | 16:9 | 900px | MP4/GIF | 4–8 s loop |
| §4 tiles | method clips ×4 | 1:1 | 480–600px | GIF (synced) | short loop |
| §5 overview | narrated video | 16:9 | — | YouTube | 2–3 min |
| §6 method | figure + 3 GIFs | 16:9 / 4:3 | 900px | fig + GIF | 4–8 s |
| §7 experiments | plots | 16:9 / 3:2 | 900px | PNG/SVG | — |
| §8 real-world | 2 clips | 16:9 | 900px | MP4/GIF | matched |
| §9 analysis | clips ×7 | 16:9 | 900px | MP4/GIF | 4–8 s |
