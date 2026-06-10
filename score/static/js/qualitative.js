(function(){
    var COND_T = [0.01, 0.59, 0.60, 0.00, 0.04, 0.00, 0.26, 0.16, 0.09, 0.36];
    var N = COND_T.length;
    var FRAME_PATH = 'static/figures/shrimp_frames/frame_';
    var INTERVAL = 1400;

    var SVG_W = 560, SVG_H = 170;
    var PAD = { left: 28, right: 180, top: 14, bottom: 18 };
    var chartW = SVG_W - PAD.left - PAD.right;
    var chartH = SVG_H - PAD.top - PAD.bottom;

    function xPos(i){ return PAD.left + (i / (N-1)) * chartW; }
    function yPos(v){ return PAD.top + (1 - v) * chartH; }
    function pad2(n){ return String(n).padStart(2,'0'); }

    function buildChart(){
        var svg = document.getElementById('tm-chart');
        if(!svg) return;
        var defs = '<defs><linearGradient id="tm-area-grad" x1="0" x2="0" y1="0" y2="1">'
            + '<stop offset="0%" stop-color="#5dcfa8" stop-opacity="0.32"/>'
            + '<stop offset="100%" stop-color="#5dcfa8" stop-opacity="0.02"/>'
            + '</linearGradient></defs>';
        svg.insertAdjacentHTML('beforeend', defs);

        var PHASES = [
            {label:'reach', start:0,   end:2.5, color:'rgba(240,160,96,0.10)'},
            {label:'pick',  start:2.5, end:5.5, color:'rgba(93,207,168,0.14)'},
            {label:'place', start:5.5, end:N-1, color:'rgba(240,160,96,0.10)'}
        ];
        PHASES.forEach(function(ph){
            var x1 = PAD.left + (ph.start/(N-1)) * chartW;
            var x2 = PAD.left + (ph.end/(N-1)) * chartW;
            svg.insertAdjacentHTML('beforeend',
                '<rect x="'+x1+'" y="'+PAD.top+'" width="'+(x2-x1)+'" height="'+chartH+'" fill="'+ph.color+'"/>');
            var cx = (x1+x2)/2;
            svg.insertAdjacentHTML('beforeend',
                '<text x="'+cx+'" y="'+(PAD.top+10)+'" fill="rgba(234,243,236,0.5)" font-size="9" font-family="JetBrains Mono,monospace" letter-spacing="0.08em" text-anchor="middle">'+ph.label+'</text>');
        });

        [0, 0.5, 1].forEach(function(v){
            var y = yPos(v);
            svg.insertAdjacentHTML('beforeend',
                '<line x1="'+PAD.left+'" y1="'+y+'" x2="'+(SVG_W-PAD.right)+'" y2="'+y+'" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>');
        });

        svg.insertAdjacentHTML('beforeend',
            '<line x1="'+PAD.left+'" y1="'+PAD.top+'" x2="'+PAD.left+'" y2="'+(SVG_H-PAD.bottom)+'" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>');

        var xAxisLabelX = SVG_W - PAD.right;
        var xAxisLabelY = SVG_H - PAD.bottom + 12;
        svg.insertAdjacentHTML('beforeend',
            '<text x="'+xAxisLabelX+'" y="'+xAxisLabelY+'" fill="rgba(234,243,236,0.6)" font-size="9.5" font-family="JetBrains Mono,monospace" letter-spacing="0.08em" text-anchor="end">Time →</text>');

        var rightX = SVG_W - PAD.right + 14;
        var yTop = yPos(1);
        svg.insertAdjacentHTML('beforeend',
            '<text x="'+rightX+'" y="'+(yTop-2)+'" fill="#f0a060" font-size="11" font-family="JetBrains Mono,monospace" font-weight="600">σ = 1  ·  marginal</text>');
        svg.insertAdjacentHTML('beforeend',
            '<text x="'+rightX+'" y="'+(yTop+11)+'" fill="rgba(240,160,96,0.7)" font-size="9.5" font-family="JetBrains Mono,monospace" font-style="italic">broad coverage</text>');

        var yBot = yPos(0);
        svg.insertAdjacentHTML('beforeend',
            '<text x="'+rightX+'" y="'+(yBot-3)+'" fill="#5dcfa8" font-size="11" font-family="JetBrains Mono,monospace" font-weight="600">σ = 0  ·  conditional</text>');
        svg.insertAdjacentHTML('beforeend',
            '<text x="'+rightX+'" y="'+(yBot+10)+'" fill="rgba(93,207,168,0.8)" font-size="9.5" font-family="JetBrains Mono,monospace" font-style="italic">precise imitation</text>');

        svg.insertAdjacentHTML('beforeend',
            '<line x1="'+(PAD.left-4)+'" y1="'+yTop+'" x2="'+(PAD.left)+'" y2="'+yTop+'" stroke="#f0a060" stroke-width="1.5"/>');
        svg.insertAdjacentHTML('beforeend',
            '<line x1="'+(PAD.left-4)+'" y1="'+yBot+'" x2="'+(PAD.left)+'" y2="'+yBot+'" stroke="#5dcfa8" stroke-width="1.5"/>');

        var areaD = 'M '+xPos(0)+' '+yPos(0);
        for(var j=0; j<N; j++){ areaD += ' L '+xPos(j)+' '+yPos(COND_T[j]); }
        areaD += ' L '+xPos(N-1)+' '+yPos(0)+' Z';
        svg.insertAdjacentHTML('beforeend',
            '<path d="'+areaD+'" fill="url(#tm-area-grad)"/>');

        var lineD = '';
        for(var k=0; k<N; k++){
            lineD += (k===0 ? 'M ' : 'L ') + xPos(k) + ' ' + yPos(COND_T[k]) + ' ';
        }
        svg.insertAdjacentHTML('beforeend',
            '<path d="'+lineD+'" fill="none" stroke="#5dcfa8" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>');

        for(var p=0; p<N; p++){
            svg.insertAdjacentHTML('beforeend',
                '<circle cx="'+xPos(p)+'" cy="'+yPos(COND_T[p])+'" r="3.5" fill="#0f3a26" stroke="#5dcfa8" stroke-width="1.6"/>');
        }

        svg.insertAdjacentHTML('beforeend',
            '<line id="tm-vline" x1="'+xPos(0)+'" y1="'+PAD.top+'" x2="'+xPos(0)+'" y2="'+(SVG_H-PAD.bottom)+'" stroke="rgba(255,255,255,0.28)" stroke-width="1" stroke-dasharray="3,3"/>');

        svg.insertAdjacentHTML('beforeend',
            '<circle id="tm-cursor" cx="'+xPos(0)+'" cy="'+yPos(COND_T[0])+'" r="6.5" fill="#fff" stroke="#5dcfa8" stroke-width="2.5" style="filter:drop-shadow(0 0 6px rgba(93,207,168,0.6));"/>');
    }

    var currentIdx = 0;
    var animHandle = null;
    var isPlaying = true;

    function update(idx){
        var t = COND_T[idx];
        var img = document.getElementById('tm-current-frame');
        if(img){
            img.style.opacity = '0';
            setTimeout(function(){
                img.src = FRAME_PATH + pad2(idx) + '.jpg';
                img.style.opacity = '1';
            }, 130);
        }
        var tval = document.getElementById('tm-tval');
        if(tval) tval.textContent = 'σ = ' + t.toFixed(2);

        var cursor = document.getElementById('tm-cursor');
        var vline = document.getElementById('tm-vline');
        if(cursor){
            cursor.setAttribute('cx', xPos(idx));
            cursor.setAttribute('cy', yPos(t));
        }
        if(vline){
            vline.setAttribute('x1', xPos(idx));
            vline.setAttribute('x2', xPos(idx));
        }

        var thumbs = document.querySelectorAll('.tm-thumb');
        thumbs.forEach(function(el, i){ el.classList.toggle('active', i === idx); });

        var counter = document.getElementById('tm-chunk-counter');
        if(counter) counter.textContent = 'Action Chunk ' + (idx+1) + ' / ' + N;
    }

    function step(){
        update(currentIdx);
        currentIdx = (currentIdx + 1) % N;
        if(isPlaying) animHandle = setTimeout(step, INTERVAL);
    }

    function buildFilmstrip(){
        var strip = document.getElementById('tm-filmstrip');
        if(!strip) return;
        for(var i=0; i<N; i++){
            (function(idx){
                var thumb = document.createElement('div');
                thumb.className = 'tm-thumb' + (idx===0 ? ' active' : '');
                var img = document.createElement('img');
                img.src = FRAME_PATH + pad2(idx) + '.jpg';
                img.alt = 'Chunk ' + idx;
                img.loading = 'lazy';
                thumb.appendChild(img);
                thumb.addEventListener('click', function(){
                    clearTimeout(animHandle);
                    currentIdx = idx;
                    update(idx);
                    if(isPlaying){
                        currentIdx = (idx + 1) % N;
                        animHandle = setTimeout(step, INTERVAL);
                    }
                });
                strip.appendChild(thumb);
            }(i));
        }
    }

    function setupPlayBtn(){
        var btn = document.getElementById('tm-play-btn');
        var icon = document.getElementById('tm-play-icon');
        var txt = document.getElementById('tm-play-text');
        if(!btn) return;
        btn.addEventListener('click', function(){
            isPlaying = !isPlaying;
            if(isPlaying){
                icon.textContent = '❚❚';
                txt.textContent = 'Pause';
                clearTimeout(animHandle);
                animHandle = setTimeout(step, 50);
            } else {
                icon.textContent = '▶';
                txt.textContent = 'Play';
                clearTimeout(animHandle);
            }
        });
    }

    function preloadFrames(){
        for(var i=0; i<N; i++){
            var img = new Image();
            img.src = FRAME_PATH + pad2(i) + '.jpg';
        }
    }

    function init(){
        preloadFrames();
        buildChart();
        buildFilmstrip();
        setupPlayBtn();
        var sec = document.getElementById('sec-qualitative');
        if(!sec) return;
        var started = false;
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
                if(e.isIntersecting && !started){
                    started = true;
                    setTimeout(step, 350);
                }
            });
        }, {threshold: 0.15});
        io.observe(sec);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
