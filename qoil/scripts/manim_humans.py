"""Website problem panel: why benchmarking and algorithm design need a model of real people.

Same visual language as the Q-OIL explainer (QOIL.mp4): background #0b0d11, serif text,
people/interventions in purple, Q-OIL in green, HG-DAgger orange, HIL blue.
Rankings and correlations are the paper's (Fig. 4 and the Appendix F ranking figure).

Render (from the project root):
    manim -qh --fps 30 -o humans.mp4 scripts/manim_humans.py Humans
"""

from manim import *

BG = "#0b0d11"
INK = "#e8e8e8"
MUTED = "#8a8f99"
FAINT = "#3a3f49"
HUMAN = "#c070f0"
MARKOV = "#d08050"
QOIL = "#8bb46b"
FONT = "Times New Roman"


def txt(s, size=30, color=INK, **kw):
    return Text(s, font=FONT, font_size=size, color=color, **kw)


class Humans(Scene):
    def construct(self):
        self.camera.background_color = BG

        # ---------------------------------------------------------------- 1. when people step in
        title = txt("how do people intervene?", 34, MUTED).to_edge(UP, buff=0.55)
        self.play(FadeIn(title), run_time=0.8)

        axes = Axes(
            x_range=[0, 10, 1], y_range=[0, 1, 0.5], x_length=10.5, y_length=4.2,
            axis_config={"color": FAINT, "include_ticks": False, "stroke_width": 2},
        ).shift(DOWN * 0.35)
        xl = txt("time", 22, MUTED).next_to(axes.x_axis, DOWN, buff=0.2)
        yl = txt("task progress", 22, MUTED).rotate(PI / 2).next_to(axes.y_axis, LEFT, buff=0.2)
        self.play(Create(axes), FadeIn(xl), FadeIn(yl), run_time=0.8)

        # Robot progress: rises, one single bad step, rises, then stalls and slips. The person
        # takes over during the stall and lifts it to the goal.
        pts = [(0, 0.08), (0.8, 0.2), (1.3, 0.3), (1.45, 0.24), (1.6, 0.31), (2.4, 0.45), (3.0, 0.5),
               (3.6, 0.51), (4.2, 0.5), (4.8, 0.47), (5.3, 0.45)]
        human_pts = [(5.3, 0.45), (5.9, 0.53), (6.6, 0.66), (7.3, 0.78), (8.0, 0.86)]
        after_pts = [(8.0, 0.86), (8.8, 0.9), (9.6, 0.93)]
        robot = VMobject(color=INK, stroke_width=4).set_points_smoothly([axes.c2p(x, y) for x, y in pts])
        human = VMobject(color=HUMAN, stroke_width=6).set_points_smoothly([axes.c2p(x, y) for x, y in human_pts])
        after = VMobject(color=INK, stroke_width=4).set_points_smoothly([axes.c2p(x, y) for x, y in after_pts])
        self.play(Create(robot), run_time=2.2, rate_func=linear)

        stall = BraceBetweenPoints(axes.c2p(3.0, 0.62), axes.c2p(5.3, 0.62), direction=UP, color=MUTED)
        stall_lbl = txt("progress stalls", 22, MUTED).next_to(stall, UP, buff=0.12)
        self.play(FadeIn(stall), FadeIn(stall_lbl), run_time=0.6)
        self.play(Create(human), run_time=1.2)
        self.play(Create(after), run_time=0.5)
        took = txt("a person takes over", 24, HUMAN).next_to(axes.c2p(6.6, 0.66), RIGHT, buff=0.35).shift(DOWN * 0.45)
        self.play(FadeIn(took), run_time=0.5)
        self.wait(0.6)

        # A Markovian simulated human reacts to single bad steps instead.
        ticks = VGroup(*[
            Triangle(color=MARKOV, fill_color=MARKOV, fill_opacity=1).scale(0.11).rotate(PI).move_to(axes.c2p(x, y + 0.11))
            for x, y in [(1.45, 0.24), (3.6, 0.51)]
        ])
        markov_lbl = txt("a typical simulated human reacts to single bad steps", 24, MARKOV).next_to(axes, DOWN, buff=0.75)
        self.play(FadeIn(ticks, shift=DOWN * 0.1), FadeIn(markov_lbl), run_time=0.8)
        self.wait(1.6)

        self.play(*[FadeOut(m) for m in [axes, xl, yl, robot, human, after, stall, stall_lbl, took, ticks, markov_lbl]],
                  title.animate.become(txt("so it ranks methods differently than real people do", 30, MUTED).to_edge(UP, buff=0.55)),
                  run_time=0.9)

        # ---------------------------------------------------------------- 2. rankings
        real = ["Q-OIL", "Q-OIL w/o BC", "HG-DAgger", "BC+RL", "HIL", "RLIF"]
        markov = ["HG-DAgger", "Q-OIL", "Q-OIL w/o BC", "BC+RL", "RLIF", "HIL"]
        pam = list(real)

        def column(names, head, head_color, x):
            items = VGroup()
            for i, n in enumerate(names):
                c = QOIL if n == "Q-OIL" else INK
                items.add(txt(n, 23, c).move_to([x, 1.75 - i * 0.62, 0]))
            h = txt(head, 25, head_color).move_to([x, 2.55, 0])
            return h, items

        rh, ri = column(real, "real people", HUMAN, 0)
        mh, mi = column(markov, "simulated human", MARKOV, -4.4)
        ph, pi_ = column(pam, "PAM (ours)", QOIL, 4.4)
        self.play(FadeIn(rh), LaggedStart(*[FadeIn(t) for t in ri], lag_ratio=0.12), run_time=1.2)

        def links(src, dst, names_src, names_dst, color, left):
            g = VGroup()
            for i, n in enumerate(names_src):
                j = names_dst.index(n)
                a = src[i].get_left() + LEFT * 0.15 if left else src[i].get_right() + RIGHT * 0.15
                b = dst[j].get_right() + RIGHT * 0.15 if left else dst[j].get_left() + LEFT * 0.15
                g.add(Line(a, b, color=color, stroke_width=2.5, stroke_opacity=0.75))
            return g

        self.play(FadeIn(mh), LaggedStart(*[FadeIn(t) for t in mi], lag_ratio=0.1), run_time=1.0)
        ml = links(ri, mi, real, markov, MARKOV, left=True)
        self.play(LaggedStart(*[Create(l) for l in ml], lag_ratio=0.08), run_time=1.0)
        mrho = txt("rank correlation 0.77", 24, MARKOV).move_to([-4.4, -2.15, 0])
        self.play(FadeIn(mrho), run_time=0.5)

        self.play(FadeIn(ph), LaggedStart(*[FadeIn(t) for t in pi_], lag_ratio=0.1), run_time=1.0)
        pl = links(ri, pi_, real, pam, QOIL, left=False)
        self.play(LaggedStart(*[Create(l) for l in pl], lag_ratio=0.08), run_time=1.0)
        prho = txt("rank correlation 1.00", 24, QOIL).move_to([4.4, -2.15, 0])
        self.play(FadeIn(prho), run_time=0.5)

        moral = txt("a better model of people → benchmarks that agree with real users → better algorithms",
                    23, MUTED, slant=ITALIC).to_edge(DOWN, buff=0.45)
        self.play(FadeIn(moral), run_time=0.8)
        self.wait(2.2)
