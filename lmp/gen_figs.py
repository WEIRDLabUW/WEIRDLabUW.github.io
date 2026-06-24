# -*- coding: utf-8 -*-
# Generates faithful, animated reproductions of paper Figures 2 & 3 (training / model)
# matching the PDF style: serif type, real camera thumbnails, z^i_j tiles with a
# periwinkle layered shadow, eos/bos, rose Encoder/Decoder bars, pale block-arrows,
# hatched mask tiles, dashed grouping boxes, typeset equation.
import html

OUT = "/Users/chuningzhu/Desktop/Projects/WEIRDLabUW.github.io/lmp/figures_animated.html"

# ---- palette ----
TILE_FILL="#F2F2F2"; TILE_STROKE="#E8E8E8"; BLUE_SH="#CCD8E7"; ZTEXT="#9F9F9F"
EOS_FILL="#DCDCDC"; BAR="#F7E1E7"; BARTX="#494345"; LAV="#DAD2EA"; ARROW="#6D588B"
GRP_GRAY="#BCBCBC"; GRP_BLUE="#6E97C8"; GRP_PURP="#B7A6D6"; DASH="#B6A2D4"
LBL_GRAY="#9A9A9A"; LBL_BLUE="#5C84BE"; LBL_PURP="#8C77B4"; CONN="#9D9D9D"
SERIF="Georgia,'Times New Roman','Times',serif"

clips=set()
def clip(s):
    clips.add(s); return f"cc{s}"

def g(x,y,inner,cls="anim",d=0.0,sty=""):
    return (f'<g transform="translate({x},{y})">'
            f'<g class="{cls}" style="--d:{d:.2f}s;{sty}">{inner}</g></g>')

def tok(x,y,s,sup=None,sub=None,text=None,d=0.0,eos=False,col=None,flat=False,cls="pop",sty=""):
    # col=None -> gray (posterior); col='blue' -> prior tint
    if col=='blue':
        fill="#E9F0F9"; txt=LBL_BLUE; stroke="#C4D4EC"; sh="#C9D9EE"
        if eos: fill="#D7E2F1"
    else:
        fill = EOS_FILL if eos else TILE_FILL; txt=ZTEXT; stroke=TILE_STROKE; sh=BLUE_SH
    cx=s/2
    shadow="" if flat else f'<rect x="4" y="6" width="{s}" height="{s}" rx="11" fill="{sh}" opacity="0.9" filter="url(#blur)"/>'
    inner=(f'{shadow}'
           f'<rect x="0" y="0" width="{s}" height="{s}" rx="11" fill="{fill}" stroke="{stroke}" filter="url(#tsh)"/>')
    if text is not None:
        fs=15 if len(text)<=3 else 13
        inner+=f'<text x="{cx}" y="{s/2+fs*0.35:.1f}" text-anchor="middle" font-family="{SERIF}" font-size="{fs}" fill="{txt}">{text}</text>'
    else:
        inner+=f'<text x="{cx-4}" y="{s/2+7:.1f}" text-anchor="middle" font-family="{SERIF}" font-style="italic" font-size="20" fill="{txt}">z</text>'
        if sup is not None:
            inner+=f'<text x="{cx+8}" y="{s/2-3:.1f}" text-anchor="middle" font-family="{SERIF}" font-size="11" fill="{txt}">{sup}</text>'
        if sub is not None:
            inner+=f'<text x="{cx+8}" y="{s/2+11:.1f}" text-anchor="middle" font-family="{SERIF}" font-size="11" fill="{txt}">{sub}</text>'
    return g(x,y,inner,cls=cls,d=d,sty=sty)

def cam(x,y,s,idx,d=0.0):
    c=clip(s)
    inner=(f'<image href="./static/figanim/cam{idx}.png" x="0" y="0" width="{s}" height="{s}" '
           f'preserveAspectRatio="xMidYMid slice" clip-path="url(#{c})"/>'
           f'<rect x="0" y="0" width="{s}" height="{s}" rx="8" fill="none" stroke="#D6D6D6"/>')
    return g(x,y,inner,cls="anim",d=d)

def atile(x,y,s,dy=0,d=0.0,mask=False,gray=False,flat=False,cls="pop"):
    if mask:
        inner=(f'<rect x="4" y="6" width="{s}" height="{s}" rx="11" fill="{LAV}" opacity="0.5" filter="url(#blur)"/>'
               f'<rect x="0" y="0" width="{s}" height="{s}" rx="11" fill="url(#hatch)" stroke="#CBBBE6" filter="url(#tsh)"/>')
    else:
        if gray:
            face="#ECECEC"; sh=BLUE_SH; brd="#DCDCDC"; arr="#9D9D9D"; mk="ag"
        else:
            face=LAV; sh=LAV; brd="#C7B8E4"; arr=ARROW; mk="ap"
        x0,x1=s*0.27,s*0.73; y0,y1=s*0.5+dy,s*0.5-dy
        shadow="" if flat else f'<rect x="4" y="6" width="{s}" height="{s}" rx="11" fill="{sh}" opacity="0.55" filter="url(#blur)"/>'
        inner=(f'{shadow}'
               f'<rect x="0" y="0" width="{s}" height="{s}" rx="11" fill="{face}" stroke="{brd}" filter="url(#tsh)"/>'
               f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{arr}" stroke-width="3" marker-end="url(#{mk})"/>')
    return g(x,y,inner,cls=cls,d=d)

def bar(x,y,w,h,text,d=0.0,vertical=False,fs=15):
    if vertical:
        t=f'<text transform="translate({w/2},{h/2}) rotate(-90)" text-anchor="middle" font-family="{SERIF}" font-size="{fs}" fill="{BARTX}">{text}</text>'
    else:
        t=f'<text x="{w/2}" y="{h/2+fs*0.35:.1f}" text-anchor="middle" font-family="{SERIF}" font-size="{fs}" fill="{BARTX}">{text}</text>'
    inner=f'<rect x="0" y="0" width="{w}" height="{h}" rx="{min(h,w)/2.6:.0f}" fill="{BAR}" filter="url(#tsh)"/>{t}'
    return g(x,y,inner,cls="anim",d=d)

def blockarrow(x,y,w,h,d=0.0):
    # pale right-pointing chevron
    bh=h*0.5; sw=w*0.55
    inner=(f'<path d="M0,{(h-bh)/2:.1f} h{sw:.1f} V0 L{w},{h/2:.1f} L{sw:.1f},{h} V{(h+bh)/2:.1f} h-{sw:.1f} Z" '
           f'fill="#ECECEC"/>')
    return g(x,y,inner,cls="anim",d=d)

def dbox(x,y,w,h,label,d=0.0,labx=14):
    inner=(f'<rect x="0" y="0" width="{w}" height="{h}" rx="14" fill="none" stroke="{DASH}" stroke-width="1.4" stroke-dasharray="7 5"/>'
           f'<text x="{labx}" y="22" font-family="{SERIF}" font-size="15" fill="{LBL_GRAY}">{label}</text>')
    return g(x,y,inner,cls="anim",d=d)

def roundpath(x,y,w,h,r):
    return (f"M{x+r},{y} H{x+w-r} A{r},{r} 0 0 1 {x+w},{y+r} V{y+h-r} "
            f"A{r},{r} 0 0 1 {x+w-r},{y+h} H{x+r} A{r},{r} 0 0 1 {x},{y+h-r} "
            f"V{y+r} A{r},{r} 0 0 1 {x+r},{y} Z")

MASKS=[]; _mc=[0]
def dbox_draw(x,y,w,h,label,d=0.0,labx=16,dur=0.7):
    # dashed border that *draws on*: a growing white stroke (in a mask) reveals the dashed rect
    _mc[0]+=1; mid=f"bm{_mc[0]}"; r=14
    L=2*(w-2*r)+2*(h-2*r)+2*3.14159*r
    MASKS.append(
        f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="{x-14}" y="{y-14}" width="{w+28}" height="{h+28}">'
        f'<path class="drawm" style="--d:{d:.2f}s;--len:{L:.0f};animation-duration:{dur}s" '
        f'd="{roundpath(x,y,w,h,r)}" fill="none" stroke="#fff" stroke-width="10" '
        f'stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="{L:.0f}" stroke-dashoffset="{L:.0f}"/></mask>')
    body=(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke="{DASH}" '
          f'stroke-width="1.4" stroke-dasharray="7 5" mask="url(#{mid})"/>'
          f'<text class="anim" style="--d:{d+dur*0.55:.2f}s" x="{x+labx}" y="{y+24}" '
          f'font-family="{SERIF}" font-size="15" fill="{LBL_GRAY}">{label}</text>')
    return body

def grpbox(x,y,w,h,label,color,labcol,d=0.0):
    inner=(f'<rect x="0" y="0" width="{w}" height="{h}" rx="12" fill="none" stroke="{color}" stroke-width="1.3"/>'
           f'<text x="{w/2}" y="{h-9}" text-anchor="middle" font-family="{SERIF}" font-size="13" fill="{labcol}">{label}</text>')
    return g(x,y,inner,cls="anim",d=d)

def conn(d_path,d=0.0,marker="ag",cls="conn"):
    return f'<path class="{cls} draw" style="--d:{d:.2f}s" d="{d_path}" fill="none" marker-end="url(#{marker})"/>'

def lbl(x,y,base,mathit,col,d=0.0,size=15):
    inner=(f'<text x="0" y="0" font-family="{SERIF}" font-size="{size}" fill="{col}">{base}'
           f'<tspan font-style="italic">{mathit}</tspan></text>')
    return g(x,y,inner,cls="anim",d=d)

# =====================================================================
# FIGURE 2 — TRAINING  (two-phase; prior/GT stashed BEHIND posterior/preds)
#  (1) posterior -> box -> encoder -> gray tokens -> decoder -> gray preds
#  (2) box -> prior -> blue tokens slide from BEHIND -> KL term
#         -> GT actions slide from BEHIND -> action term
# =====================================================================
W2,H2=884,414
b=[f'<rect width="{W2}" height="{H2}" fill="#ffffff"/>']

TS=42; CAM=40; P=54; PK=11               # uniform tile size, pitch, peek offset
GX,GY=298,52                             # token-grid origin
APX=712                                  # action-stack origin (2 cols)
ADY=[5,11]                               # consistent action-arrow angles per column
rows=[
  [("z",1,1),("z",1,2),("z",1,3),("z",1,4),("z",1,5),("eos",)],
  [("z",2,1),("z",2,2),("eos",)],
  [("z",3,1),("z",3,2),("z",3,3),("z",3,4),("eos",)],
]
gcx=lambda c:GX+c*P; grow=lambda r:GY+r*P
acx=lambda c:APX+c*P

# ---------- STEP 1 : posterior input box ----------
b.append(grpbox(8,18,184,150,"",GRP_GRAY,LBL_GRAY,d=0.00))
b.append(lbl(20,38,"Posterior ","q(z|o,a)",LBL_GRAY,d=0.05))
for i in range(4): b.append(cam(18+i*42,50,CAM,i,d=0.12+i*0.05))
b.append(atile(18,100,TS,dy=ADY[0],d=0.36)); b.append(atile(72,100,TS,dy=ADY[1],d=0.44))

# ---------- STEP 2 : draw (1) box ----------
b.append(dbox_draw(204,12,662,224,"(1) Latent Rollouts From Posterior",d=0.65))
b.append(conn("M192 70 H222",d=1.15))
# ---------- STEP 3 : encoder ----------
b.append(bar(224,GY,30,152,"Encoder",d=1.25,vertical=True,fs=14))
b.append(blockarrow(260,GY+58,30,36,d=1.32))
# ---------- STEPS 4 + 9 : token stacks (blue prior BEHIND, gray posterior front) ----------
for r,row in enumerate(rows):
    for c,t in enumerate(row):
        x=gcx(c); y=grow(r)
        df=1.55+r*0.38+c*0.07            # gray front  (phase 1)
        db=4.95+r*0.34+c*0.06            # blue back   (phase 2, slides out)
        if t[0]=="eos":
            b.append(tok(x+PK,y+PK,TS,text="eos",eos=True,col='blue',cls="stash",d=db))
            b.append(tok(x,y,TS,text="eos",eos=True,flat=True,d=df))
        else:
            b.append(tok(x+PK,y+PK,TS,sub=t[2],col='blue',cls="stash",d=db))
            b.append(tok(x,y,TS,sup=t[1],sub=t[2],flat=True,d=df))
# ---------- STEP 5 : decoder ----------
b.append(bar(656,GY,30,152,"Decoder",d=2.95,vertical=True,fs=14))
b.append(blockarrow(616,GY+58,30,36,d=3.02))
# ---------- STEPS 6 + 11 : action stacks (lavender GT BEHIND, gray pred front) ----------
for r in range(3):
    for c in range(2):
        x=acx(c); y=grow(r); dyy=ADY[c]
        df=3.2+r*0.12+c*0.07             # gray prediction front (phase 1)
        db=6.45+r*0.10+c*0.06            # lavender GT back (phase 2, slides out)
        b.append(atile(x+PK,y+PK,TS,dy=dyy,cls="stash",d=db))      # GT (lavender) behind
        b.append(atile(x,y,TS,dy=dyy,gray=True,flat=True,d=df))    # prediction (gray) front

# ---------- STEP 7 : draw (2) box ----------
b.append(dbox_draw(204,256,662,150,"(2) Model Update",d=3.85))
# ---------- STEP 8 : prior input box ----------
b.append(grpbox(8,256,184,120,"",GRP_BLUE,LBL_BLUE,d=4.35))
b.append(lbl(20,276,"Prior ","p(z|o)",LBL_BLUE,d=4.40))
for i in range(4): b.append(cam(18+i*42,290,CAM,i,d=4.46+i*0.05))
b.append(conn("M192 314 H230 V206",d=4.75))   # prior -> (shared) encoder
# legend for the stacks
b.append(f'<text class="anim" style="--d:5.0s" x="{GX}" y="232" font-family="{SERIF}" font-size="10.5" fill="{LBL_GRAY}" font-style="italic">posterior <tspan fill="{LBL_BLUE}">/ prior (behind)</tspan></text>')
GRIDC=(gcx(0)+gcx(5)+TS)/2               # grid horizontal centre
ACTC=(acx(0)+acx(1)+TS)/2                # action-stack centre
# ---------- STEP 10 : KL loss term (q gray front  ‖  p blue behind) ----------
b.append(conn(f"M{GRIDC:.0f} 216 V300",d=6.05))
kl=(f'<text class="anim" style="--d:6.2s" x="{GRIDC:.0f}" y="356" text-anchor="middle" font-family="{SERIF}" font-size="21" fill="#222">'
    f'max<tspan dx="20">&#8722;</tspan><tspan font-style="italic">D</tspan><tspan font-size="13" dy="4">KL</tspan><tspan dy="-4">(</tspan>'
    f'<tspan fill="{LBL_GRAY}" font-style="italic">q</tspan><tspan fill="{LBL_GRAY}">(</tspan><tspan fill="{LBL_GRAY}" font-style="italic">z</tspan><tspan fill="{LBL_GRAY}">|</tspan><tspan fill="{LBL_GRAY}" font-style="italic">o</tspan><tspan fill="{LBL_GRAY}">,</tspan><tspan fill="{LBL_GRAY}" font-style="italic">a</tspan><tspan fill="{LBL_GRAY}">)</tspan>'
    f'<tspan dx="3">&#8741;</tspan>'
    f'<tspan dx="3" fill="{LBL_BLUE}" font-style="italic">p</tspan><tspan fill="{LBL_BLUE}">(</tspan><tspan fill="{LBL_BLUE}" font-style="italic">z</tspan><tspan fill="{LBL_BLUE}">|</tspan><tspan fill="{LBL_BLUE}" font-style="italic">o</tspan><tspan fill="{LBL_BLUE}">)</tspan><tspan>)</tspan></text>')
b.append(kl)
# ---------- STEP 12 : action loss term (pred gray front  vs  GT lavender behind) ----------
b.append(conn(f"M{ACTC:.0f} 216 V300",d=6.85))
act=(f'<text class="anim" style="--d:7.0s" x="{ACTC:.0f}" y="356" text-anchor="middle" font-family="{SERIF}" font-size="21" fill="#222">'
    f'+<tspan dx="14" font-style="italic">&#120124;</tspan><tspan font-size="13" dy="4" font-style="italic">q</tspan><tspan dy="-4">[</tspan>'
    f'<tspan>log </tspan><tspan fill="{ARROW}" font-style="italic">p</tspan><tspan fill="{ARROW}">(</tspan><tspan fill="{ARROW}" font-style="italic">a</tspan><tspan fill="{ARROW}">|</tspan><tspan fill="{ARROW}" font-style="italic">o</tspan><tspan fill="{ARROW}">,</tspan><tspan fill="{ARROW}" font-style="italic">z</tspan><tspan fill="{ARROW}">)</tspan><tspan>]</tspan></text>')
b.append(act)
SVG2='\n'.join(b)
TRAIN_DEFS=''.join(MASKS)

# =====================================================================
# FIGURE 3 — MODEL ARCHITECTURE  (autoregressive latent rollout)
#  encoder -> obs box -> actions box (prior masks peek behind)
#   -> AR rollout (bos->z1, z1 fed back -> z2, ... until eos)
#   -> decoder obs context -> decoder mask tokens -> decoder -> action outputs
# =====================================================================
W3,H3=964,462
m=[f'<rect width="{W3}" height="{H3}" fill="#ffffff"/>']

# geometry (one uniform grid) -----------------------------------------
TS=42; CAM=38; P=54; PK=11
LX=472                            # latent AR columns (4)
MX=722                            # mask / action-output columns (4)
Y_OUT, Y_ENC, Y_IN = 226, 288, 356
ADY4=[2,7,12,16]                  # consistent action-arrow fan
def lx(k): return LX+k*P
def mx(i): return MX+i*P
def cen(x): return x+TS/2
def camrow(bx,by,d0):             # flat 1x4 cam row, pitch 44
    return [cam(bx+i*44,by,CAM,i,d=d0+i*0.05) for i in range(4)]

# ---------- STEP 1 : encoder (shared core appears first) ----------
m.append(bar(22,Y_ENC,654,30,"Cross-Attention Encoder",d=0.55,fs=14))
# ---------- STEP 2 : obs box (encoder context) — flat 1x4 ----------
m.append(grpbox(22,344,186,84,"observations",GRP_BLUE,LBL_BLUE,d=1.0))
m+=camrow(30,356,1.05)
m.append(conn("M115 344 V318",d=1.30))
# ---------- STEP 3 : actions box (posterior actions, prior MASKS peek behind) ----------
m.append(grpbox(224,344,228,84,"actions / masks",GRP_PURP,LBL_PURP,d=1.45))
for i in range(4):
    ax=234+i*P; ay=356
    m.append(atile(ax+PK,ay+PK,TS,mask=True,cls="stash",d=2.0+i*0.06))   # prior mask behind
    m.append(atile(ax,ay,TS,dy=ADY4[i],flat=True,d=1.55+i*0.06))         # posterior action front
m.append(conn("M336 344 V318",d=2.25))

# ---------- STEP 4 : autoregressive z rollout ----------
# input row (below encoder): bos z1 z2 z3   |   output row (above encoder): z1 z2 z3 eos
ARB=2.55
m.append(tok(lx(0),Y_IN,TS,text="bos",eos=True,d=ARB))                   # seed: bos
for k in range(4):
    do_out = ARB+0.30 + k*0.70
    m.append(conn(f"M{cen(lx(k)):.0f} {Y_IN} V{Y_ENC+30}",d=do_out-0.12))  # input -> encoder
    m.append(conn(f"M{cen(lx(k)):.0f} {Y_ENC} V{Y_OUT+TS}",d=do_out-0.02)) # encoder -> output
    if k<3: m.append(tok(lx(k),Y_OUT,TS,sub=k+1,d=do_out))
    else:   m.append(tok(lx(k),Y_OUT,TS,text="eos",eos=True,d=do_out))
    if k<3:  # feedback: Ok (=z_{k+1}) slides down-right to input column k+1
        m.append(tok(lx(k+1),Y_IN,TS,sub=k+1,cls="armove",
                     d=do_out+0.28,sty=f"--mx:{lx(k)-lx(k+1)}px;--my:{Y_OUT-Y_IN}px;"))
m.append(f'<text class="anim" style="--d:{ARB+0.2:.2f}s" x="{lx(0)}" y="{Y_IN+TS+18}" font-family="{SERIF}" font-size="10.5" fill="{LBL_GRAY}" font-style="italic">autoregressive: each z is fed back as input until <tspan font-style="normal">eos</tspan></text>')

# ---------- STEP 5 : decoder obs context — flat 1x4 ----------
DB=5.2
m.append(grpbox(22,156,186,68,"obs context",GRP_BLUE,LBL_BLUE,d=DB))
m+=camrow(30,164,DB+0.05)
m.append(conn("M115 156 V146",d=DB+0.30))
for k in range(4): m.append(conn(f"M{cen(lx(k)):.0f} {Y_OUT} V146",d=DB+0.35))   # latents -> decoder
# ---------- STEP 6 : decoder mask / query tokens ----------
for i in range(4): m.append(atile(mx(i),164,TS,mask=True,d=5.55+i*0.07))
m.append(f'<text class="anim" style="--d:5.6s" x="{mx(0)}" y="222" font-family="{SERIF}" font-size="10.5" fill="{LBL_PURP}" font-style="italic">learnable queries</text>')
for i in range(4): m.append(conn(f"M{cen(mx(i)):.0f} 164 V146",d=5.7+i*0.05))
# ---------- STEP 7 : decoder model ----------
m.append(bar(22,116,904,30,"Cross-Attention Decoder",d=5.95,fs=14))
# ---------- STEP 8 : action outputs ----------
for i in range(4):
    m.append(conn(f"M{cen(mx(i)):.0f} 116 V100",d=6.25+i*0.06))
    m.append(atile(mx(i),54,TS,dy=ADY4[i],d=6.35+i*0.08))
m.append(f'<text class="anim" style="--d:6.5s" x="{mx(0)}" y="46" font-family="{SERIF}" font-size="10.5" fill="{ARROW}" font-style="italic">action chunk</text>')

SVG3='\n'.join(m)

# ---- clipPaths ----
clipdefs="".join(f'<clipPath id="cc{s}"><rect x="0" y="0" width="{s}" height="{s}" rx="8"/></clipPath>' for s in sorted(clips))

# =====================================================================
# shared, reusable pieces (kept identical between the standalone preview
# page and the single-figure embed pages used inside index.html)
# =====================================================================
import os
FIG_CSS='''
  .fig{width:100%;height:auto;display:block;cursor:pointer;}
  .fig .anim{opacity:0;}
  .fig.play .anim{animation:riseIn .55s cubic-bezier(.2,.75,.25,1) both;animation-delay:var(--d,0s);}
  @keyframes riseIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  .fig .pop{opacity:0;transform-box:fill-box;transform-origin:50% 50%;}
  .fig.play .pop{animation:popIn .5s cubic-bezier(.18,.9,.28,1.35) both;animation-delay:var(--d,0s);}
  @keyframes popIn{0%{opacity:0;transform:translateY(16px) scale(.84);}60%{opacity:1;}100%{opacity:1;transform:translateY(0) scale(1);}}
  .fig .stash{opacity:0;}
  .fig.play .stash{animation:slideStash .5s cubic-bezier(.2,.7,.3,1) both;animation-delay:var(--d,0s);}
  @keyframes slideStash{from{opacity:0;transform:translate(-11px,-11px);}to{opacity:1;transform:translate(0,0);}}
  .fig .armove{opacity:0;transform-box:fill-box;transform-origin:50% 50%;}
  .fig.play .armove{animation:armoveK .6s cubic-bezier(.45,.05,.25,1) both;animation-delay:var(--d,0s);}
  @keyframes armoveK{0%{opacity:0;transform:translate(var(--mx,0),var(--my,0)) scale(1.05);}25%{opacity:1;}100%{opacity:1;transform:translate(0,0) scale(1);}}
  .fig .draw{opacity:0;}
  .fig.play .draw{animation:drawIn .5s ease-out both;animation-delay:var(--d,0s);}
  @keyframes drawIn{0%{opacity:0;stroke-dashoffset:var(--len,160);}25%{opacity:1;}100%{opacity:1;stroke-dashoffset:0;}}
  .fig.play .drawm{animation:drawM .7s ease both;animation-delay:var(--d,0s);}
  @keyframes drawM{from{stroke-dashoffset:var(--len);}to{stroke-dashoffset:0;}}
  @media (prefers-reduced-motion: reduce){
    .fig .anim,.fig .pop,.fig .draw,.fig .drawm,.fig .stash,.fig .armove{opacity:1!important;animation:none!important;stroke-dashoffset:0!important;transform:none!important;}
  }
  .fig .conn{stroke:#9D9D9D;stroke-width:1.5;}
'''
DEFS_SPRITE=f'''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="tsh" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.6" flood-color="#000" flood-opacity="0.14"/></filter>
    <filter id="blur" x="-30%" y="-30%" width="170%" height="170%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <marker id="ap" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="{ARROW}"/></marker>
    <marker id="ag" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0,0L10,5L0,10z" fill="{CONN}"/></marker>
    <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#EFEAF7"/><line x1="0" y1="0" x2="0" y2="7" stroke="{LAV}" stroke-width="3"/></pattern>
    {clipdefs}
  </defs></svg>'''
def figsvg(svgid,vbw,vbh,inner,extradefs=""):
    return (f'<svg class="fig" id="{svgid}" viewBox="0 0 {vbw} {vbh}" role="img" aria-label="{svgid}">'
            f'<defs>{extradefs}</defs>\n{inner}\n</svg>')

# embed pages: one figure each, transparent, isolated; play on load, on click,
# or when the parent posts {type:'lmp-play'} (scroll-into-view replay).
EMBED_JS='''<script>
(function(){
  function prep(f){f.querySelectorAll('.draw').forEach(function(p){var l=p.getTotalLength();p.style.strokeDasharray=l;p.style.strokeDashoffset=l;p.style.setProperty('--len',l);});}
  function play(f){f.classList.remove('play');void f.getBoundingClientRect();f.classList.add('play');}
  var figs=[].slice.call(document.querySelectorAll('.fig'));
  figs.forEach(function(f){try{prep(f);}catch(e){}f.addEventListener('click',function(){play(f);});});
  figs.forEach(play);
  window.addEventListener('message',function(e){if(e.data&&e.data.type==='lmp-play')figs.forEach(play);});
}());
</script>'''
def embed_page(svgid,vbw,vbh,inner,extradefs=""):
    return (f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1"><title>{svgid}</title>'
            f'<style>html,body{{margin:0;padding:0;background:transparent;}}{FIG_CSS}</style></head><body>'
            f'{DEFS_SPRITE}\n{figsvg(svgid,vbw,vbh,inner,extradefs)}\n{EMBED_JS}</body></html>')

DIR=os.path.dirname(OUT)
with open(f"{DIR}/fig_training_embed.html","w") as f: f.write(embed_page("figTrain",W2,H2,SVG2,TRAIN_DEFS))
with open(f"{DIR}/fig_model_embed.html","w")   as f: f.write(embed_page("figModel",W3,H3,SVG3))

# standalone preview (both figures + captions + replay buttons)
HTML=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>LMP — Animated Figures (preview)</title>
<style>
  body{{font-family:Georgia,"Times New Roman",serif;color:#2b2b2b;background:#fafafa;margin:0;padding:32px 20px 80px;}}
  .page{{max-width:1120px;margin:0 auto;}}
  h1{{font-size:20px;font-weight:normal;color:#333;}}
  h2{{font-size:15px;color:#444;margin:34px 0 6px;}}
  p.cap{{font-size:13px;color:#666;max-width:1000px;line-height:1.5;}}
  .hint{{font-size:12px;color:#9a8ab5;font-style:italic;}}
  .fig-wrap{{background:#fff;border:1px solid #ececec;border-radius:10px;padding:10px 14px;margin:10px 0 8px;box-shadow:0 1px 3px rgba(0,0,0,.04);}}
  button.replay{{font:13px Georgia,serif;color:#6D588B;background:#f3effa;border:1px solid #d9cdef;border-radius:6px;padding:5px 12px;cursor:pointer;}}
  button.replay:hover{{background:#ebe3f6;}}
{FIG_CSS}
</style></head>
<body>
<div class="page">
  <h1>Latent Memory Palace — animated figures (preview)</h1>
  <p class="cap">Native SVG + CSS/JS. <span class="hint">Replays on scroll-into-view, on click, or via the button.</span></p>
  {DEFS_SPRITE}
  <h2>Figure 2 — Training LMP-&pi;</h2>
  <div class="fig-wrap">{figsvg("figTrain",W2,H2,SVG2,TRAIN_DEFS)}</div>
  <button class="replay" data-target="figTrain">&#9654; replay</button>
  <h2>Figure 3 — LMP-&pi; architecture</h2>
  <div class="fig-wrap">{figsvg("figModel",W3,H3,SVG3)}</div>
  <button class="replay" data-target="figModel">&#9654; replay</button>
</div>
<script>
(function(){{
  function prep(f){{f.querySelectorAll('.draw').forEach(function(p){{var l=p.getTotalLength();p.style.strokeDasharray=l;p.style.strokeDashoffset=l;p.style.setProperty('--len',l);}});}}
  function play(f){{f.classList.remove('play');void f.getBoundingClientRect();f.classList.add('play');}}
  var figs=[].slice.call(document.querySelectorAll('.fig'));
  figs.forEach(function(f){{try{{prep(f);}}catch(e){{}}f.addEventListener('click',function(){{play(f);}});}});
  document.querySelectorAll('button.replay').forEach(function(b){{b.addEventListener('click',function(){{var t=document.getElementById(b.getAttribute('data-target'));if(t)play(t);}});}});
  figs.forEach(play);
  if('IntersectionObserver' in window){{var first=true;var io=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting&&!first)play(e.target);}});first=false;}},{{threshold:0.3}});figs.forEach(function(f){{io.observe(f);}});}}
}})();
</script>
</body></html>'''
with open(OUT,"w") as f: f.write(HTML)
print("wrote",OUT,"+ fig_training_embed.html, fig_model_embed.html | clips",sorted(clips))
