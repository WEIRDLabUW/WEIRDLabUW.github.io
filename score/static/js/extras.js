(function(){
    var _ex = 'continuous';

    // bump when extras video files are replaced, to bust browser cache
    var CACHE_BUST = '20260610i';

    var V = 'static/videos/';

    // each clip is { src, label? }; label renders as a chip in the tile's top-left.
    // an optional `bonus` clip renders as a featured highlight below the comparison.
    var EXTRAS = {
        continuous: {
            aspect: '4 / 3',
            blurb: 'A timelapse of continuous operation, repeatedly picking cubes and dropping them into the basket, highlights how robust SCORE is over long horizons. The base policy is slow and imprecise, often unsure of what it is doing, and leaves the basket mostly empty. SCORE stays robust grasp after grasp, reaching 100% success and filling the basket.',
            base:  [{ src: V + 'cube_basket/base.mp4' }],
            score: [{ src: V + 'cube_basket/score.mp4' }]
        },
        cleanex: {
            aspect: '4 / 3',
            blurb: 'The base policy is often imprecise and does not use its retry behaviors correctly, so it struggles to recover once a grasp slips. SCORE makes the policy more precise and robust, retrying at the right moments to reliably open the Clorox bottle.',
            base:  [{ src: V + 'extras/cleanex/base_0.mp4' },
                    { src: V + 'extras/cleanex/base_1.mp4' }],
            score: [{ src: V + 'extras/cleanex/score_0.mp4' },
                    { src: V + 'extras/cleanex/score_1.mp4' }]
        },
        bookshelf: {
            aspect: '4 / 3',
            blurb: 'The base policy struggles to take a book off the shelf, often slipping off the spine or failing to pull it clear. SCORE makes the grasp more precise and reliable, hooking the book and pulling it out cleanly.',
            base:  [{ src: V + 'extras/bookshelf/base_0.mp4' },
                    { src: V + 'extras/bookshelf/base_1.mp4' }],
            score: [{ src: V + 'extras/bookshelf/score_0.mp4' },
                    { src: V + 'extras/bookshelf/score_1.mp4' }]
        },
        multitask: {
            aspect: '4 / 3',
            blurb: 'A single multi-task policy trained on three tasks: credit card pick, cube grasp, and bottle grasp. The base policy often confuses the modes of each task. In the credit card clip it reaches in with the grasp meant for the bottle, while in the cube and bottle clips it pinches as if picking up the thin credit card, so it applies the wrong strategy for the object in front of it. SCORE learns to pick the right mode for each: a pinch for the credit card and a stable grasp for the cube and the bottle.',
            base:  [{ src: V + 'extras/multitask/base_credit.mp4', label: 'Pick Credit Card' },
                    { src: V + 'extras/multitask/base_cube.mp4',   label: 'Grasp Cube' },
                    { src: V + 'extras/multitask/base_bottle.mp4', label: 'Grasp Bottle' }],
            score: [{ src: V + 'extras/multitask/score_credit.mp4', label: 'Pick Credit Card' },
                    { src: V + 'extras/multitask/score_cube.mp4',   label: 'Grasp Cube' },
                    { src: V + 'extras/multitask/score_bottle.mp4', label: 'Grasp Bottle' }],
            bonus: {
                src: V + 'extras/multitask/score_cube_bottle.mp4',
                tag: 'Beyond training randomization',
                caption: 'SCORE can even reuse behaviors across tasks. The cube is normally not randomized this far out, yet SCORE still grasps it by borrowing the bottle grasping behavior. Notice that in the other cube clip above, SCORE instead borrows the credit card behavior to grasp it.'
            }
        }
    };

    function mkCell(clip, aspect){
        var fig = document.createElement('figure'); fig.className = 'ex-cell';
        var v = document.createElement('video');
        v.src = clip.src + '?v=' + CACHE_BUST; v.autoplay = true; v.loop = true; v.muted = true;
        v.setAttribute('playsinline','');
        v.style.aspectRatio = aspect;
        fig.appendChild(v);
        if (clip.label) {
            var cap = document.createElement('figcaption'); cap.className = 'ex-chip';
            cap.textContent = clip.label;
            fig.appendChild(cap);
        }
        return fig;
    }

    function renderBonus(d){
        var host = document.getElementById('ex-bonus');
        host.innerHTML = '';
        if (!d.bonus) { host.style.display = 'none'; return; }
        host.style.display = '';
        var fig = document.createElement('figure'); fig.className = 'ex-cell';
        var v = document.createElement('video');
        v.src = d.bonus.src + '?v=' + CACHE_BUST; v.autoplay = true; v.loop = true; v.muted = true;
        v.setAttribute('playsinline',''); v.style.aspectRatio = d.aspect;
        fig.appendChild(v);
        host.appendChild(fig);
        var txt = document.createElement('div'); txt.className = 'ex-bonus-text';
        if (d.bonus.tag) {
            var tag = document.createElement('span'); tag.className = 'ex-bonus-tag';
            tag.textContent = d.bonus.tag; txt.appendChild(tag);
        }
        var p = document.createElement('p'); p.textContent = d.bonus.caption;
        txt.appendChild(p);
        host.appendChild(txt);
    }

    // ── bespoke multi-task panel ──────────────────────────────────────
    function mkVid(src){
        var v = document.createElement('video');
        v.src = V + src + '?v=' + CACHE_BUST;
        v.autoplay = true; v.loop = true; v.muted = true;
        v.setAttribute('playsinline',''); v.setAttribute('data-no-defer','');
        v.style.aspectRatio = '4 / 3';
        return v;
    }
    // one object unit: SCORE clip (main) beside the base-confused clip (reference)
    function mkObj(name, scoreSrc, scoreTag, baseSrc, baseTag){
        var o = document.createElement('div'); o.className = 'mt-obj';
        o.innerHTML = '<div class="mt-obj-name">' + name + '</div>';
        var pair = document.createElement('div'); pair.className = 'mt-pair';
        var sc = document.createElement('figure'); sc.className = 'mt-card score';
        sc.appendChild(mkVid(scoreSrc));
        sc.insertAdjacentHTML('beforeend', '<figcaption><span class="mt-ok">✓ SCORE</span>' + scoreTag + '</figcaption>');
        var ba = document.createElement('figure'); ba.className = 'mt-card base';
        ba.appendChild(mkVid(baseSrc));
        ba.insertAdjacentHTML('beforeend', '<figcaption><span class="mt-bad">✗ base</span>' + baseTag + '</figcaption>');
        pair.appendChild(sc); pair.appendChild(ba);
        o.appendChild(pair);
        return o;
    }
    function renderMultitask(){
        var host = document.getElementById('ex-multitask');
        host.innerHTML =
            '<p class="mt-lede">A <strong>single steered policy</strong> trained on three tasks &mdash; credit card, cube, and bottle. ' +
            'It applies the right grasp to each object, and even <strong>reuses behaviors across tasks</strong>.</p>';

        // ── borrowing hero ──
        var hero = document.createElement('div'); hero.className = 'mt-hero';
        hero.innerHTML = '<div class="mt-hero-head">Same cube, two borrowed behaviors</div>';
        var clips = document.createElement('div'); clips.className = 'mt-hero-clips';
        [['extras/multitask/score_cube.mp4', 'borrows its <b>credit-card pinch</b>', ''],
         ['extras/multitask/score_cube_bottle.mp4', 'borrows its <b>bottle grasp</b>', 'cube placed beyond training randomization']
        ].forEach(function(c){
            var fig = document.createElement('figure'); fig.className = 'mt-card hero';
            fig.appendChild(mkVid(c[0]));
            fig.insertAdjacentHTML('beforeend',
                '<figcaption><span class="mt-borrow">&#8627; ' + c[1] + '</span>' +
                (c[2] ? '<span class="mt-sub">' + c[2] + '</span>' : '') + '</figcaption>');
            clips.appendChild(fig);
        });
        hero.appendChild(clips);
        hero.insertAdjacentHTML('beforeend',
            '<p class="mt-hero-cap">The same cube is grasped two different ways depending on where it sits &mdash; ' +
            'each behavior already lives inside the policy&rsquo;s support.</p>');
        host.appendChild(hero);

        // ── native tasks, with base reference ──
        var nat = document.createElement('div'); nat.className = 'mt-native';
        nat.innerHTML = '<div class="mt-native-head">One policy picks the right mode &mdash; the base policy confuses them</div>';
        var objs = document.createElement('div'); objs.className = 'mt-objs';
        objs.appendChild(mkObj('Credit Card',
            'extras/multitask/score_credit.mp4', 'precise pinch',
            'extras/multitask/base_credit.mp4', 'reaches with the bottle grasp'));
        objs.appendChild(mkObj('Bottle',
            'extras/multitask/score_bottle.mp4', 'stable grasp',
            'extras/multitask/base_bottle.mp4', 'pinches as if it were the card'));
        nat.appendChild(objs);
        host.appendChild(nat);
    }

    function render(){
        var std = document.getElementById('ex-standard');
        var mt  = document.getElementById('ex-multitask');
        if (_ex === 'multitask'){
            std.style.display = 'none'; mt.style.display = '';
            renderMultitask();
            return;
        }
        std.style.display = ''; mt.style.display = 'none'; mt.innerHTML = '';
        var bg = document.getElementById('ex-base-grid');
        var sg = document.getElementById('ex-score-grid');
        var blurb = document.getElementById('ex-blurb');
        var d = EXTRAS[_ex];
        bg.innerHTML = ''; sg.innerHTML = '';
        blurb.textContent = d.blurb;
        d.base.forEach(function(clip){ bg.appendChild(mkCell(clip, d.aspect)); });
        d.score.forEach(function(clip){ sg.appendChild(mkCell(clip, d.aspect)); });
        renderBonus(d);
    }

    window.exSetTab = function(btn){
        document.querySelectorAll('.ex-tab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        _ex = btn.dataset.ex; render();
    };

    render();
}());
