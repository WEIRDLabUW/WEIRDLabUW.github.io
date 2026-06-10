(function(){
    // bump when the per-step clip files are replaced, to bust browser cache
    var CACHE_BUST = '20260610g';
    var V = 'static/videos/sim_timelapse/';

    // per-task step milestones, in order. each step is its own short clip at
    // static/videos/sim_timelapse/<task>/<index>.mp4 — so the dot, the label,
    // and the video are always in sync (no segment-boundary guessing).
    var TASKS = {
        credit_card:    ['Base Policy','40M','80M','120M','160M','200M','240M'],
        dishrack_place: ['Base Policy','40M','80M','120M','160M','200M','240M','280M','320M'],
        lightbulb_screw:['Base Policy','40M','80M','120M'],
        soccer_push:    ['Base Policy','40M','80M','120M','160M','200M','240M','280M','320M'],
        cup_pour:       ['Base Policy','40M','80M','120M','160M'],
        bottle_grasp:   ['Base Policy','40M','80M','120M','200M','240M'],
        cup_grasp:      ['Base Policy','40M','80M','120M','160M','200M','240M','280M'],
        cube_grasp:     ['Base Policy','40M','80M','120M']
    };

    var _ms = 'lightbulb_screw';
    var _idx = 0;
    var video, track, fill, thumb, ticksEl, labelsEl, stepEl, playBtn;
    var dragging = false, paused = false;

    // leave a short tail of track after the last dot so the final clip's
    // progress has somewhere to go (otherwise the thumb sits frozen on the
    // last dot while that clip plays).
    var TAIL_PCT = 6;

    function steps(){ return TASKS[_ms]; }
    function n(){ return steps().length; }

    function fmtStep(label){
        return label === 'Base Policy' ? 'Base Policy' : label + ' Steps';
    }

    // track position (%) of milestone i: Base at 0%, last step at (100 - tail)%
    function dotPct(i){
        return n() <= 1 ? 0 : (i / (n() - 1)) * (100 - TAIL_PCT);
    }

    function buildTimeline(){
        var cnt = n();
        ticksEl.innerHTML = '';
        labelsEl.innerHTML = '';
        for (var i = 0; i < cnt; i++){
            var pos = dotPct(i);

            var tick = document.createElement('div');
            tick.className = 'tl-tick';
            tick.style.left = pos + '%';
            ticksEl.appendChild(tick);

            var lab = document.createElement('button');
            lab.className = 'tl-lab';
            lab.style.left = pos + '%';
            if (i === 0) lab.style.transform = 'translateX(0)';
            else if (i === cnt - 1) lab.style.transform = 'translateX(-100%)';
            lab.textContent = steps()[i].replace('Base Policy', 'Base');
            lab.dataset.i = i;
            lab.addEventListener('click', function(){
                go(parseInt(this.dataset.i, 10));
            });
            labelsEl.appendChild(lab);
        }
    }

    // load + play step i
    function go(i){
        _idx = Math.max(0, Math.min(n() - 1, i));
        video.src = V + _ms + '/' + _idx + '.mp4?v=' + CACHE_BUST;
        video.currentTime = 0;
        if (!paused) video.play().catch(function(){});
        paint();
    }

    function paint(){
        var cnt = n();
        // thumb glides from dot _idx toward the next as the clip plays
        var prog = 0;
        if (video.duration && isFinite(video.duration))
            prog = Math.max(0, Math.min(1, video.currentTime / video.duration));
        var span = 100 - TAIL_PCT;
        var pct;
        if (cnt <= 1)               pct = prog * 100;
        else if (_idx < cnt - 1)    pct = ((_idx + prog) / (cnt - 1)) * span;
        else                        pct = span + prog * TAIL_PCT; // final clip fills the tail
        pct = Math.min(100, pct);
        fill.style.width = pct + '%';
        thumb.style.left = pct + '%';
        track.setAttribute('aria-valuenow', Math.round(pct));

        stepEl.textContent = fmtStep(steps()[_idx]);
        track.setAttribute('aria-valuetext', stepEl.textContent);

        var ticks = ticksEl.children, labs = labelsEl.children;
        for (var i = 0; i < ticks.length; i++){
            ticks[i].classList.toggle('passed', i <= _idx);
            ticks[i].classList.toggle('current', i === _idx);
            labs[i].classList.toggle('current', i === _idx);
        }
    }

    function nearestIndex(clientX){
        var r = track.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        return Math.round(ratio * (n() - 1));
    }

    function setPlayIcon(){
        playBtn.innerHTML = paused
            ? '<i class="fa-solid fa-play"></i>'
            : '<i class="fa-solid fa-pause"></i>';
    }

    function load(){
        _idx = 0;
        buildTimeline();
        go(0);
    }

    window.msSetTab = function(btn){
        document.querySelectorAll('.ms-tab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        _ms = btn.dataset.ms;
        load();
    };

    function init(){
        video   = document.getElementById('tl-video');
        track   = document.getElementById('tl-track');
        fill    = document.getElementById('tl-fill');
        thumb   = document.getElementById('tl-thumb');
        ticksEl = document.getElementById('tl-ticks');
        labelsEl= document.getElementById('tl-labels');
        stepEl  = document.getElementById('tl-step');
        playBtn = document.getElementById('tl-playpause');
        if (!video) return;

        video.loop = false;
        video.muted = true;
        video.setAttribute('playsinline','');

        // smooth thumb tracking
        function frame(){ if (!dragging) paint(); requestAnimationFrame(frame); }
        requestAnimationFrame(frame);

        // auto-advance to the next step, wrapping back to Base
        video.addEventListener('ended', function(){
            if (paused) return;
            go((_idx + 1) % n());
        });

        playBtn.addEventListener('click', function(){
            paused = !paused;
            if (paused) video.pause(); else video.play().catch(function(){});
            setPlayIcon();
        });

        // click / drag the track to jump to the nearest step
        track.addEventListener('pointerdown', function(e){
            dragging = true;
            try { track.setPointerCapture(e.pointerId); } catch(_){}
            go(nearestIndex(e.clientX));
        });
        track.addEventListener('pointermove', function(e){
            if (!dragging) return;
            var i = nearestIndex(e.clientX);
            if (i !== _idx) go(i);
        });
        track.addEventListener('pointerup', function(e){
            dragging = false;
            try { track.releasePointerCapture(e.pointerId); } catch(_){}
        });

        // keyboard: arrows step between milestones
        track.addEventListener('keydown', function(e){
            if (e.key === 'ArrowRight'){ go(Math.min(n() - 1, _idx + 1)); e.preventDefault(); }
            else if (e.key === 'ArrowLeft'){ go(Math.max(0, _idx - 1)); e.preventDefault(); }
        });

        setPlayIcon();
        load();
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else init();
}());
