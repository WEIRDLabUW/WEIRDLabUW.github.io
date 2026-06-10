// Image lightbox
var lbEl=document.getElementById('lb');
var lbImg=document.getElementById('lb-img');
var lbVid=document.getElementById('lb-vid');
function lbClose(){
    lbEl.classList.remove('open');
    lbVid.pause(); lbVid.src=''; lbVid.style.display='none';
    lbImg.src=''; lbImg.style.display='';
}
document.querySelectorAll('[data-lb]').forEach(function(el){
    el.addEventListener('click',function(e){
        e.preventDefault();
        lbVid.style.display='none'; lbImg.style.display='';
        lbImg.src=this.dataset.lb;
        lbEl.classList.add('open');
    });
});
document.addEventListener('click',function(e){
    var cell=e.target.closest('.rollout-cell');
    if(!cell) return;
    var src=cell.querySelector('video')&&cell.querySelector('video').src;
    if(!src) return;
    lbImg.style.display='none';
    lbVid.style.display='block';
    lbVid.src=src; lbVid.play().catch(function(){});
    lbEl.classList.add('open');
});
lbEl.addEventListener('click',function(e){
    if(e.target===this||e.target.id==='lb-x') lbClose();
});
document.addEventListener('keydown',function(e){ if(e.key==='Escape') lbClose(); });

// Full video lightbox
function openVideoLb() {
    var lb = document.getElementById('video-lb');
    var v  = document.getElementById('hero-full-video');
    lb.style.display = 'flex';
    v.currentTime = 0; v.play().catch(function(){});
}
function closeVideoLb() {
    var lb = document.getElementById('video-lb');
    var v  = document.getElementById('hero-full-video');
    lb.style.display = 'none';
    v.pause(); v.currentTime = 0;
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeVideoLb();
});

// Page fade-in
document.addEventListener('DOMContentLoaded',function(){
    requestAnimationFrame(function(){ document.body.classList.add('loaded'); });
});

// BibTeX copy
(function(){
    var btn = document.getElementById('bibtex-copy');
    var pre = document.getElementById('bibtex-text');
    if(!btn || !pre) return;
    btn.addEventListener('click', function(){
        var txt = pre.textContent || pre.innerText;
        var done = function(){
            btn.classList.add('copied');
            btn.textContent = 'Copied ✓';
            setTimeout(function(){
                btn.classList.remove('copied');
                btn.textContent = 'Copy';
            }, 1600);
        };
        if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(txt).then(done).catch(function(){ fallback(); });
        } else { fallback(); }
        function fallback(){
            var ta = document.createElement('textarea');
            ta.value = txt; ta.style.position='fixed'; ta.style.left='-9999px';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch(e){}
            document.body.removeChild(ta);
        }
    });
}());

// Lazy-load offscreen videos so they don't fight the hero for bandwidth
(function(){
    var hero = document.getElementById('hero-teaser-video');
    var vids = Array.prototype.slice.call(document.querySelectorAll('video'))
        .filter(function(v){ return v !== hero; });
    vids.forEach(function(v){
        if(!v.hasAttribute('data-no-defer')){
            v.preload = 'none';
            if(v.hasAttribute('autoplay')){ v.dataset.autoplay = '1'; v.removeAttribute('autoplay'); }
        }
    });
    if(!('IntersectionObserver' in window)){
        vids.forEach(function(v){ v.preload='auto'; v.load(); if(v.dataset.autoplay) v.play().catch(function(){}); });
        return;
    }
    var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
            if(!e.isIntersecting) return;
            var v = e.target;
            v.preload = 'auto';
            try { v.load(); } catch(_){}
            if(v.dataset.autoplay) v.play().catch(function(){});
            io.unobserve(v);
        });
    }, { rootMargin: '600px 0px' });
    vids.forEach(function(v){ io.observe(v); });
})();

// Lazy-load offscreen images
document.querySelectorAll('img').forEach(function(img){
    if(!img.hasAttribute('loading')) img.loading = 'lazy';
    if(!img.hasAttribute('decoding')) img.decoding = 'async';
});

// Static video fade-in
document.querySelectorAll('.static-vid').forEach(function(v){
    function show(){ v.classList.add('ready'); }
    if(v.readyState>=2) show();
    else { v.addEventListener('canplay',show,{once:true}); setTimeout(show,3000); }
});

// Scroll fade-in for sections
(function(){
    var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
            if(e.isIntersecting){
                e.target.classList.add('visible');
                io.unobserve(e.target);
            }
        });
    }, {threshold: 0.08, rootMargin: '0px 0px -8% 0px'});
    document.querySelectorAll('.fade-in').forEach(function(el){ io.observe(el); });
}());

// ════════════════ σ-SPINE BEHAVIOR ════════════════
(function(){
    var spine = document.getElementById('sigma-spine');
    var cursor = document.getElementById('spine-cursor');
    var stops = document.querySelectorAll('.spine-stop');
    var sectionIds = ['sec-problem','sec-method','sec-real','sec-failures','sec-ablations'];
    var sections = sectionIds.map(function(id){ return document.getElementById(id); }).filter(Boolean);

    // map stop href→section index
    var stopByHref = {};
    stops.forEach(function(s){
        stopByHref[s.getAttribute('href').slice(1)] = s;
    });

    // smooth scroll on click
    stops.forEach(function(s){
        s.addEventListener('click', function(e){
            e.preventDefault();
            var t = document.querySelector(this.getAttribute('href'));
            if(t){
                var top = t.getBoundingClientRect().top + window.scrollY - spine.offsetHeight - 12;
                window.scrollTo({top:top,behavior:'smooth'});
            }
        });
    });

    function getSpineP(){
        // returns the % the cursor should occupy along the bar.
        // map: scrollY → range from 0 to maxScroll, then to a position
        // that aligns with the section's --p when its top reaches the spine.
        // simpler heuristic: linearly between sections by scroll progress within each section.
        var spineH = spine.offsetHeight;
        var anchor = spineH + 8;
        var winY = window.scrollY;
        // first, find current section idx
        var idx = -1;
        for(var i=0;i<sections.length;i++){
            var r = sections[i].getBoundingClientRect();
            if(r.top - anchor <= 0) idx = i;
            else break;
        }
        if(idx === -1){
            // before first section: ramp from 0 to first stop's --p based on scroll fraction toward first sec
            var first = sections[0];
            var ftop = first.getBoundingClientRect().top + winY - anchor;
            var frac = ftop > 0 ? Math.max(0, Math.min(1, winY / ftop)) : 1;
            var firstP = parsePct(stops[0].style.getPropertyValue('--p'));
            return frac * firstP;
        }
        if(idx >= sections.length - 1){
            // last section: between its stop --p and 100%
            var lastP = parsePct(stops[idx].style.getPropertyValue('--p'));
            var sec = sections[idx];
            var sTop = sec.getBoundingClientRect().top + winY - anchor;
            var sBot = sec.getBoundingClientRect().bottom + winY - anchor;
            var span = Math.max(1, sBot - sTop);
            var f = Math.max(0, Math.min(1, (winY - sTop) / span));
            return lastP + (100 - lastP) * f;
        }
        // between idx and idx+1
        var p0 = parsePct(stops[idx].style.getPropertyValue('--p'));
        var p1 = parsePct(stops[idx+1].style.getPropertyValue('--p'));
        var s0 = sections[idx].getBoundingClientRect().top + winY - anchor;
        var s1 = sections[idx+1].getBoundingClientRect().top + winY - anchor;
        var span2 = Math.max(1, s1 - s0);
        var f2 = Math.max(0, Math.min(1, (winY - s0) / span2));
        return p0 + (p1 - p0) * f2;
    }
    function parsePct(s){ return parseFloat(s) || 0; }

    function setActive(){
        var spineH = spine.offsetHeight;
        var anchor = spineH + 8;
        var activeIdx = -1;
        for(var i=0;i<sections.length;i++){
            var r = sections[i].getBoundingClientRect();
            if(r.top - anchor <= 0) activeIdx = i;
        }
        stops.forEach(function(s, i){
            s.classList.toggle('active', i === activeIdx);
            s.classList.toggle('passed', i < activeIdx);
        });
    }

    function tick(){
        var p = getSpineP();
        cursor.style.left = p + '%';
        setActive();
    }

    var raf = null;
    function onScroll(){
        if(raf) return;
        raf = requestAnimationFrame(function(){
            tick();
            raf = null;
        });
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', tick);
    tick();
}());
