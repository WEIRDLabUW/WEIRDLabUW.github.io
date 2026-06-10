(function(){
    var C = {
        score: '#344f78',
        base:  '#5f646e',
        ochre: '#b08b45',
        ink:   '#1c1c19',
        muted: '#7a7872',
        grid:  '#d4cfc4'
    };
    var MONO = "'JetBrains Mono',monospace";

    function el(tag, attrs){
        var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        if(attrs) Object.keys(attrs).forEach(function(k){ e.setAttribute(k, attrs[k]); });
        return e;
    }
    function txt(s, attrs){ var e = el('text', attrs); e.textContent = s; return e; }
    function seg(x1,y1,x2,y2,a){ return el('line', Object.assign({x1:x1,y1:y1,x2:x2,y2:y2},a||{})); }
    function scale(d0,d1,r0,r1){ return function(v){ return r0 + (v-d0)/(d1-d0)*(r1-r0); }; }
    function pct(v){ return Math.round(v*100)+'%'; }

    // ── (A) DATA COVERAGE LINE CHART ─────────────────────────────────────────
    function buildCoverage(container){
        var W=560, H=256;
        var p = {t:22, r:16, b:38, l:50};
        var cW = W-p.l-p.r, cH = H-p.t-p.b;

        var nDemos    = [1, 10, 50, 100, 150];
        var baseData  = [0.333, 0.222, 0.222, 0.30, 0.444];
        var scoreData = [0.222, 0.444, 0.556, 1.00, 1.00];

        var xPos = function(i){ return p.l + (i/(nDemos.length-1))*cW; };
        var yS = scale(-0.02, 1.08, p.t+cH, p.t);

        var svg = el('svg', {viewBox:'0 0 '+W+' '+H, width:'100%', style:'display:block'});
        var g = el('g'); svg.appendChild(g);

        [0,0.25,0.5,0.75,1.0].forEach(function(v){
            var y = yS(v);
            g.appendChild(seg(p.l, y, p.l+cW, y, {stroke:C.grid,'stroke-width':'0.7','stroke-dasharray':'4,3'}));
            g.appendChild(txt(Math.round(v*100)+'%', {x:p.l-6,y:y+4,'text-anchor':'end',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        g.appendChild(seg(p.l, p.t, p.l, p.t+cH, {stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(seg(p.l, p.t+cH, p.l+cW, p.t+cH, {stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));

        nDemos.forEach(function(n,i){
            g.appendChild(txt(n, {x:xPos(i),y:p.t+cH+14,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        g.appendChild(txt('Number of demos', {x:p.l+cW/2,y:H-3,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        g.appendChild(txt('Success rate', {x:11,y:p.t+cH/2,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5',transform:'rotate(-90,11,'+(p.t+cH/2)+')'}));

        function drawLine(data, color){
            var d = data.map(function(v,i){ return (i===0?'M':'L')+xPos(i)+' '+yS(v); }).join(' ');
            g.appendChild(el('path', {d:d,fill:'none',stroke:color,'stroke-width':'2.2','stroke-linejoin':'round','stroke-linecap':'round'}));
        }
        function drawMarkers(data, color, shape){
            data.forEach(function(v,i){
                var cx=xPos(i), cy=yS(v);
                if(shape==='s'){
                    var s=7; g.appendChild(el('rect',{x:cx-s/2,y:cy-s/2,width:s,height:s,fill:color,stroke:'white','stroke-width':'1.2',rx:'1'}));
                } else {
                    g.appendChild(el('circle',{cx:cx,cy:cy,r:'4.5',fill:color,stroke:'white','stroke-width':'1.2'}));
                }
            });
        }

        drawLine(baseData, C.base);   drawMarkers(baseData,  C.base,  's');
        drawLine(scoreData, C.score); drawMarkers(scoreData, C.score, 'o');

        var lx=p.l+6, ly=p.t+8;
        g.appendChild(el('rect',{x:lx,y:ly-4,width:8,height:8,fill:C.base,stroke:'white','stroke-width':'1',rx:'1'}));
        g.appendChild(txt('Base', {x:lx+13,y:ly+4,fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        g.appendChild(el('circle',{cx:lx+4,cy:ly+19,r:'4',fill:C.score,stroke:'white','stroke-width':'1'}));
        g.appendChild(txt('SCORE (ours)', {x:lx+13,y:ly+23,fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'600'}));

        container.innerHTML=''; container.appendChild(svg);
    }

    // ── (B) WORKSPACE COVERAGE GROUPED BARS ──────────────────────────────────
    function buildWorkspace(container){
        var W=460, H=260;
        var p = {t:28, r:16, b:54, l:50};
        var cW = W-p.l-p.r, cH = H-p.t-p.b;

        var groups  = ['Right only', 'Right + play'];
        var baseV   = [0.10, 0.10];
        var scoreV  = [0.30, 0.636];
        var yS = scale(0, 1.2, p.t+cH, p.t);

        var gw = cW/groups.length;
        var bw = 30, gap = 8;

        var svg = el('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',style:'display:block'});
        var g = el('g'); svg.appendChild(g);

        [0,0.25,0.5,0.75,1.0].forEach(function(v){
            var y=yS(v);
            g.appendChild(seg(p.l,y,p.l+cW,y,{stroke:C.grid,'stroke-width':'0.7','stroke-dasharray':'4,3'}));
            g.appendChild(txt(Math.round(v*100)+'%',{x:p.l-6,y:y+4,'text-anchor':'end',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        g.appendChild(seg(p.l,p.t,p.l,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(seg(p.l,p.t+cH,p.l+cW,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(txt('Success rate',{x:11,y:p.t+cH/2,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5',transform:'rotate(-90,11,'+(p.t+cH/2)+')'}));

        groups.forEach(function(lbl,i){
            var cx = p.l + (i+0.5)*gw;
            var bx = cx - bw - gap/2;
            var sx = cx + gap/2;

            var bh = (p.t+cH) - yS(baseV[i]);
            g.appendChild(el('rect',{x:bx,y:yS(baseV[i]),width:bw,height:bh,fill:C.base,rx:'3'}));
            g.appendChild(txt(pct(baseV[i]),{x:bx+bw/2,y:yS(baseV[i])-6,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5','font-weight':'700'}));

            var sh = (p.t+cH) - yS(scoreV[i]);
            g.appendChild(el('rect',{x:sx,y:yS(scoreV[i]),width:bw,height:sh,fill:C.score,rx:'3'}));
            g.appendChild(txt(pct(scoreV[i]),{x:sx+bw/2,y:yS(scoreV[i])-6,'text-anchor':'middle',fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'700'}));

                g.appendChild(txt(lbl,{x:cx,y:p.t+cH+16,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        g.appendChild(txt('eval: left side of workspace (OOD for both)',{x:p.l+cW/2,y:H-3,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'9.5'}));

        var lx=p.l+6, ly=p.t;
        g.appendChild(el('rect',{x:lx,y:ly-4,width:8,height:8,fill:C.base,stroke:'white','stroke-width':'1',rx:'1'}));
        g.appendChild(txt('Base',{x:lx+13,y:ly+4,fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        g.appendChild(el('rect',{x:lx+55,y:ly-4,width:8,height:8,fill:C.score,rx:'1'}));
        g.appendChild(txt('SCORE (ours)',{x:lx+68,y:ly+4,fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'600'}));

        container.innerHTML=''; container.appendChild(svg);
    }

    // ── (C) RETRY BEHAVIOR GROUPED BARS ──────────────────────────────────────
    function buildRetry(container){
        var W=460, H=260;
        var p = {t:28, r:16, b:54, l:50};
        var cW = W-p.l-p.r, cH = H-p.t-p.b;

        var groups  = ['Standard demos', 'With retry demos'];
        var baseV   = [0.30, 0.30];
        var scoreV  = [0.40, 1.00];
        var yS = scale(0, 1.2, p.t+cH, p.t);

        var gw = cW/groups.length;
        var bw = 30, gap = 8;

        var svg = el('svg', {viewBox:'0 0 '+W+' '+H, width:'100%', style:'display:block'});
        var g = el('g'); svg.appendChild(g);

        [0,0.25,0.5,0.75,1.0].forEach(function(v){
            var y=yS(v);
            g.appendChild(seg(p.l,y,p.l+cW,y,{stroke:C.grid,'stroke-width':'0.7','stroke-dasharray':'4,3'}));
            g.appendChild(txt(Math.round(v*100)+'%',{x:p.l-6,y:y+4,'text-anchor':'end',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        g.appendChild(seg(p.l,p.t,p.l,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(seg(p.l,p.t+cH,p.l+cW,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(txt('Success rate',{x:11,y:p.t+cH/2,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5',transform:'rotate(-90,11,'+(p.t+cH/2)+')'}));

        groups.forEach(function(lbl,i){
            var cx = p.l + (i+0.5)*gw;
            var bx = cx - bw - gap/2;
            var sx = cx + gap/2;

            var bh = (p.t+cH) - yS(baseV[i]);
            g.appendChild(el('rect',{x:bx,y:yS(baseV[i]),width:bw,height:bh,fill:C.base,rx:'3'}));
            g.appendChild(txt(pct(baseV[i]),{x:bx+bw/2,y:yS(baseV[i])-6,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5','font-weight':'700'}));

            var sh = (p.t+cH) - yS(scoreV[i]);
            g.appendChild(el('rect',{x:sx,y:yS(scoreV[i]),width:bw,height:sh,fill:C.score,rx:'3'}));
            g.appendChild(txt(pct(scoreV[i]),{x:sx+bw/2,y:yS(scoreV[i])-6,'text-anchor':'middle',fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'700'}));

            g.appendChild(txt(lbl,{x:cx,y:p.t+cH+16,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });

        var lx=p.l+6, ly=p.t;
        g.appendChild(el('rect',{x:lx,y:ly-4,width:8,height:8,fill:C.base,stroke:'white','stroke-width':'1',rx:'1'}));
        g.appendChild(txt('Base',{x:lx+13,y:ly+4,fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        g.appendChild(el('rect',{x:lx+55,y:ly-4,width:8,height:8,fill:C.score,rx:'1'}));
        g.appendChild(txt('SCORE (ours)',{x:lx+68,y:ly+4,fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'600'}));

        container.innerHTML=''; container.appendChild(svg);
    }

    // ── (D/E) STEERING CHARTS ────────────────────────────────────────────────
    function buildSteeringChart(container, vals, xlbls, colors, title){
        var W=340, H=230;
        var p = {t:36, r:14, b:68, l:50};
        var cW = W-p.l-p.r, cH = H-p.t-p.b;
        var yS = scale(0, 1.2, p.t+cH, p.t);
        var slot = cW / vals.length;
        var bw = Math.min(36, slot * 0.52);

        var svg = el('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',style:'display:block'});
        var g = el('g'); svg.appendChild(g);

        [0,0.25,0.5,0.75,1.0].forEach(function(v){
            var y=yS(v);
            g.appendChild(seg(p.l,y,p.l+cW,y,{stroke:C.grid,'stroke-width':'0.7','stroke-dasharray':'4,3'}));
            g.appendChild(txt(Math.round(v*100)+'%',{x:p.l-6,y:y+4,'text-anchor':'end',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        });
        g.appendChild(seg(p.l,p.t,p.l,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(seg(p.l,p.t+cH,p.l+cW,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
        g.appendChild(txt('Success rate',{x:11,y:p.t+cH/2,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5',transform:'rotate(-90,11,'+(p.t+cH/2)+')'}));

        vals.forEach(function(v,i){
            var cx = p.l + (i+0.5)*slot;
            var bx = cx - bw/2;
            var bh = (p.t+cH) - yS(v);
            if(bh > 0.5){
                g.appendChild(el('rect',{x:bx,y:yS(v),width:bw,height:bh,fill:colors[i],rx:'3'}));
            }
            var labelY = v > 0.04 ? yS(v)-6 : p.t+cH-9;
            g.appendChild(txt(pct(v),{x:cx,y:labelY,'text-anchor':'middle',fill:colors[i]==='white'?C.muted:colors[i],'font-family':MONO,'font-size':'10.5','font-weight':'700'}));

            var rows = xlbls[i];
            var yL = p.t+cH+15;
            var fc = colors[i]===C.score ? C.score : (colors[i]===C.ochre ? C.ochre : C.muted);
            var te = el('text',{x:cx,y:yL,'text-anchor':'middle',fill:fc,'font-family':MONO,'font-size':'9.5'});
            rows.forEach(function(row,j){
                var ts = el('tspan',{x:cx,dy:(j===0?'0':'12')});
                ts.textContent = row;
                te.appendChild(ts);
            });
            g.appendChild(te);
        });

        if(title){
            g.appendChild(txt(title,{x:p.l+cW/2,y:16,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'9.5',
                'font-style':'italic'}));
        }
        container.innerHTML=''; container.appendChild(svg);
    }

    function buildDistractor(container){
        buildSteeringChart(container,
            [0.0, 0.111, 0.556],
            [['Bottle Grasp', 'Base'], ['Bottle Grasp', 'SCORE'], ['Distractor', 'Steered SCORE']],
            [C.base, C.score, C.ochre],
            'base: bottle grasp only - distractors are OOD'
        );
    }
    function buildCarrot(container){
        buildSteeringChart(container,
            [0.0, 0.222, 0.667],
            [['Cup Base +', 'Carrot SCORE'], ['Bottle Base +', 'Bottle SCORE'], ['Bottle Base +', 'Carrot SCORE']],
            [C.base, C.score, C.ochre],
            'base: bottle grasp - steered in sim to pinch carrot'
        );
    }

    // ── (F) RL CURVES — PRIVILEGED VS SYMMETRIC ──────────────────────────────
    function buildRL(container){
        var data = {
            'Cube Pinch': {
                asym: [[0,.022],[41,.152],[81.9,.522],[122.9,.713],[163.8,.781],[204.8,.828],[245.8,.891],[286.7,.914],[327.7,.946]],
                sym:  [[0,.021],[41,.095],[81.9,.168],[122.9,.232],[163.8,.312],[204.8,.375],[245.8,.476],[286.7,.495],[327.7,.571]]
            },
            'Bottle Grasp': {
                asym: [[0,.003],[41,.317],[81.9,.798],[122.9,.922],[163.8,.933],[204.8,.948],[245.8,.966],[286.7,.967],[327.7,.955]],
                sym:  [[0,.002],[41,.252],[81.9,.608],[122.9,.781],[163.8,.859],[204.8,.934],[245.8,.918],[286.7,.928],[327.7,.954]]
            },
            'Cup Grasp': {
                asym: [[0,.038],[41,.283],[81.9,.632],[122.9,.902],[163.8,.933],[204.8,.946],[245.8,.965],[286.7,.981],[327.7,.978]],
                sym:  [[0,.039],[41,.145],[81.9,.201],[122.9,.209],[163.8,.237],[204.8,.326],[245.8,.538],[286.7,.67],[327.7,.721]]
            }
        };
        var tasks = ['Cube Pinch','Bottle Grasp','Cup Grasp'];

        var SW=240, SH=190, GAP=24;
        var p = {t:20, r:10, b:38, l:42};
        var cW=SW-p.l-p.r, cH=SH-p.t-p.b;
        var totalW = SW*3 + GAP*2;

        var xS = scale(0, 350, p.l, p.l+cW);
        var yS = scale(-0.02, 1.05, p.t+cH, p.t);

        var svg = el('svg',{viewBox:'0 0 '+totalW+' '+(SH+36),width:'100%',style:'display:block'});
        var g = el('g'); svg.appendChild(g);

        tasks.forEach(function(task,ti){
            var ox = ti*(SW+GAP);
            var sg = el('g',{transform:'translate('+ox+',0)'}); g.appendChild(sg);

            [0,.25,.5,.75,1.0].forEach(function(v){
                var y=yS(v);
                sg.appendChild(seg(p.l,y,p.l+cW,y,{stroke:C.grid,'stroke-width':'0.7','stroke-dasharray':'3,3'}));
                if(ti===0) sg.appendChild(txt(Math.round(v*100)+'%',{x:p.l-5,y:y+4,'text-anchor':'end',fill:C.muted,'font-family':MONO,'font-size':'9.5'}));
            });

            sg.appendChild(seg(p.l,p.t,p.l,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));
            sg.appendChild(seg(p.l,p.t+cH,p.l+cW,p.t+cH,{stroke:'rgba(0,0,0,0.1)','stroke-width':'0.75'}));

            [0,100,200,300].forEach(function(v){
                var x=xS(v);
                sg.appendChild(seg(x,p.t+cH,x,p.t+cH+3,{stroke:C.muted,'stroke-width':'0.6'}));
                sg.appendChild(txt(v,{x:x,y:p.t+cH+13,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'9.5'}));
            });

            function drawSeries(pts, color, shape){
                var f = pts.filter(function(pt){ return pt[0]<=350; });
                if(!f.length) return;
                var d = f.map(function(pt,i){ return (i===0?'M':'L')+xS(pt[0])+' '+yS(pt[1]); }).join(' ');
                sg.appendChild(el('path',{d:d,fill:'none',stroke:color,'stroke-width':'2','stroke-linejoin':'round','stroke-linecap':'round'}));
                f.forEach(function(pt){
                    var cx=xS(pt[0]), cy=yS(pt[1]);
                    if(shape==='s'){ var s=5.5; sg.appendChild(el('rect',{x:cx-s/2,y:cy-s/2,width:s,height:s,fill:color,stroke:'white','stroke-width':'1',rx:'0.5'})); }
                    else { sg.appendChild(el('circle',{cx:cx,cy:cy,r:'3.5',fill:color,stroke:'white','stroke-width':'1'})); }
                });
            }
            drawSeries(data[task].sym,  C.base,  's');
            drawSeries(data[task].asym, C.score, 'o');

            sg.appendChild(txt(task,{x:p.l+cW/2,y:11,'text-anchor':'middle',fill:C.ink,'font-family':MONO,'font-size':'11','font-weight':'700'}));
        });

        g.appendChild(txt('Environment Steps (×10⁶)',{x:totalW/2,y:SH+12,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5'}));

        var ly=SH+26, lx=totalW/2-100;
        g.appendChild(el('rect',{x:lx,y:ly-6,width:8,height:8,fill:C.base,stroke:'white','stroke-width':'1',rx:'1'}));
        g.appendChild(txt('Symmetric',{x:lx+13,y:ly+2,fill:C.muted,'font-family':MONO,'font-size':'10.5'}));
        var lx2=lx+115;
        g.appendChild(el('circle',{cx:lx2+4,cy:ly-2,r:'4',fill:C.score,stroke:'white','stroke-width':'1'}));
        g.appendChild(txt('Asymmetric (ours)',{x:lx2+13,y:ly+2,fill:C.score,'font-family':MONO,'font-size':'10.5','font-weight':'600'}));

        g.appendChild(txt('Success Rate',{x:10,y:SH/2,'text-anchor':'middle',fill:C.muted,'font-family':MONO,'font-size':'10.5',transform:'rotate(-90,10,'+(SH/2)+')'}));

        container.innerHTML=''; container.appendChild(svg);
    }

    function makeExpandable(innerEl){
        var card = innerEl.closest ? innerEl.closest('.abl-chart-card') : innerEl.parentElement;
        if(!card) return;
        card.classList.add('expandable');
        var hint = document.createElement('span');
        hint.className = 'abl-expand-hint';
        hint.textContent = '⤢';
        card.appendChild(hint);
        card.addEventListener('click', function(){
            var lb = document.getElementById('chart-lb');
            var content = document.getElementById('chart-lb-content');
            if(!lb || !content) return;
            content.innerHTML = innerEl.innerHTML;
            lb.classList.add('open');
        });
    }

    function init(){
        var pairs = [
            ['chart-coverage',  buildCoverage],
            ['chart-workspace', buildWorkspace],
            ['chart-retry',     buildRetry],
            ['chart-distractor',buildDistractor],
            ['chart-carrot',    buildCarrot],
            ['chart-rl',        buildRL]
        ];
        pairs.forEach(function(pair){
            var el = document.getElementById(pair[0]);
            if(!el) return;
            pair[1](el);
            makeExpandable(el);
        });
    }

    window.closeChartLb = function(){
        var lb = document.getElementById('chart-lb');
        if(lb) lb.classList.remove('open');
    };

    document.addEventListener('keydown', function(e){
        if(e.key === 'Escape') window.closeChartLb();
    });

    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
    else { init(); }
}());
