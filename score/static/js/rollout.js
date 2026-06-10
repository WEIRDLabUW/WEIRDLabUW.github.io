(function(){
    var _task = 'ball_pour';

    // bump this whenever rollout video files are replaced, to bust browser cache
    var CACHE_BUST = '20260528v';

    // tasks with a single portrait (3:4) video per column
    var PORTRAIT_TASKS = {}; // [base_count, score_count]

    // tasks with a single enlarged 16:9 video per column
    var LARGE_TASKS = { cube_pinch: [1, 1], bottle_grasp: [1, 1] }; // [base_count, score_count]

    // display order of the SCORE clips per task, so the failure clip always lands
    // in the last panel (successes fill the first three). Default order is 0,1,2,3.
    var SCORE_ORDER = {
        ball_pour:        [0, 2, 3, 1],
        credit_card_pick: [0, 1, 3, 2],
        dishrack_place:   [0, 2, 3, 1]
    };

    // per-task qualitative analysis — EDIT these to match the real behavior in each clip
    var ANALYSIS = {
        ball_pour:        { base: "The base policy frequently misaligns the thumb with the pink cup and knocks it over before grasping. Even when it lifts the cup, poor alignment between the pink cup and the larger cup often causes the ball to miss when pouring.",
                            score: "SCORE's main failure is aligning the pink cup with the blue cup. As seen in the last clip, pouring too quickly can also cause a ball to fall out before it settles." },
        soccer_push:      { base: "The base policy frequently misses the ball or strikes it inaccurately.",
                            score: "SCORE's failures stem mainly from the ball's nontrivial dynamics: a push can impart spin that sends it out of the workspace (last clip on the right). SCORE often recovers with retry behavior (first clip), though limited control frequency can make it hard to correct once the ball rolls away." },
        lightbulb_screw:  { base: "Because the policy operates on point clouds, the base policy has no clear signal for task completion. It often imitates the upward motion that ends the teleoperated demos and lifts away prematurely. Grasping is also imprecise and the policy is slow, frequently failing within the one-minute time limit.",
                            score: "SCORE reaches 100% success. Because simulation rewards continued twisting of the bulb, the premature upward actions are driven toward zero, so SCORE keeps screwing until the task is complete." },
        credit_card_pick: { base: "The base policy grasps inaccurately, moving and sliding too fast with poor coordination between the thumb and fingers, and usually fails.",
                            score: "SCORE fails mainly from small accumulated errors (last clip). The task demands high precision and coordination while handling the nontrivial dynamics of a thin card." },
        dishrack_place:   { base: "The base policy fails mostly at grasping, and when it does grasp the plate it struggles to align with the first slot of the rack.",
                            score: "After steering, SCORE aligns more precisely and succeeds faster and more reliably. It also shows retry behavior: in the first clip it retries and recovers, while in the last it retries but still fails. Remaining failures come from the plate being underactuated and hard to fully control, together with perceiving the thin dishrack." },
        cube_pinch:       { base: "The base policy shows suboptimal and failed attempts followed by retries; it does not weight its actions well for task success.",
                            score: "SCORE reaches 100% success, so we show a single clip with perturbations to illustrate the robustness of steering in simulation." },
        bottle_grasp:     { base: "The base policy shows suboptimal and failed attempts followed by retries. It succeeds most of the time but cannot handle perturbations.",
                            score: "SCORE is robust to perturbations and reaches 100% success." },
        cup_grasp:        { base: "As in Pour Ball, the main failure is misaligning the thumb with the cup, which knocks it over.",
                            score: "SCORE reaches 100% success, enabling high-precision grasping of the cup." }
    };

    function p3(n){ return String(n).padStart(3,'0'); }

    function mkCell(src){
        var cell = document.createElement('div'); cell.className = 'rollout-cell';
        var v = document.createElement('video');
        v.src = src + '?v=' + CACHE_BUST; v.autoplay = true; v.loop = true; v.muted = true;
        v.setAttribute('playsinline','');
        cell.appendChild(v); return cell;
    }

    function renderNotes(){
        var bn = document.getElementById('rw-pi0-note');
        var sn = document.getElementById('rw-csp-note');
        var a = ANALYSIS[_task];
        if (a) {
            bn.innerHTML = '<span class="note-tag">✗ Failure mode</span>' + a.base;
            sn.innerHTML = '<span class="note-tag">✓ SCORE behavior</span>' + a.score;
            bn.style.display = sn.style.display = '';
        } else {
            bn.style.display = sn.style.display = 'none';
        }
    }

    function render(){
        var pi = document.getElementById('rw-pi0-grid');
        var cs = document.getElementById('rw-csp-grid');
        pi.innerHTML = ''; cs.innerHTML = '';
        renderNotes();

        pi.classList.remove('portrait', 'large');
        cs.classList.remove('portrait', 'large');

        var portrait = PORTRAIT_TASKS[_task];
        var large = LARGE_TASKS[_task];
        if (portrait || large) {
            var cls = portrait ? 'portrait' : 'large';
            var counts = portrait || large;
            pi.classList.add(cls); cs.classList.add(cls);
            var baseCnt = counts[0], scoreCnt = counts[1];
            for (var i = 0; i < baseCnt; i++)
                pi.appendChild(mkCell('static/videos/real_world_rollouts/'+_task+'/base/ep_'+p3(i)+'.mp4'));
            for (var j = 0; j < scoreCnt; j++)
                cs.appendChild(mkCell('static/videos/real_world_rollouts/'+_task+'/score/ep_'+p3(j)+'.mp4'));
        } else {
            var order = SCORE_ORDER[_task] || [0,1,2,3];
            [0,1,2,3].forEach(function(i){
                pi.appendChild(mkCell('static/videos/real_world_rollouts/'+_task+'/base/ep_'+p3(i)+'.mp4'));
            });
            order.forEach(function(i){
                cs.appendChild(mkCell('static/videos/real_world_rollouts/'+_task+'/score/ep_'+p3(i)+'.mp4'));
            });
        }
    }

    window.rwSetTask = function(btn){
        document.querySelectorAll('.rw-tab:not(.fail-tab)').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        _task = btn.dataset.task; render();
        if (window.trRenderTask) window.trRenderTask(_task);
    };

    render();
}());
