(function(){
    var METHODS = [
        { key: 'score',  label: 'SCORE',  fill: 'tr-fill-score',  lbl: 'tr-lbl-score'  },
        { key: 'dsrl',   label: 'SCORE-DSRL', fill: 'tr-fill-dsrl', lbl: 'tr-lbl-dsrl' },
        { key: 'resrl',  label: 'Res-RL', fill: 'tr-fill-resrl',  lbl: 'tr-lbl-resrl'  },
        { key: 'base',   label: 'Base',   fill: 'tr-fill-base',   lbl: 'tr-lbl-base'   },
        { key: 'rialto', label: 'RialTo', fill: 'tr-fill-rialto', lbl: 'tr-lbl-rialto' },
        { key: 'fpo',    label: 'FPO',    fill: 'tr-fill-fpo',    lbl: 'tr-lbl-fpo'    }
    ];

    // success rate (%) per task, computed from successes/trials.
    var TASKS = [
        { key: 'ball_pour',        name: 'Ball Pour',        cat: 'Hard',   sr: { score:88.9, dsrl:66.7, resrl:0.0,  base:11.1, rialto:33.3, fpo:0.0  } },
        { key: 'soccer_push',      name: 'Soccer Push',      cat: 'Hard',   sr: { score:60.0, dsrl:60.0, resrl:40.0, base:13.3, rialto:0.0,  fpo:20.0 } },
        { key: 'lightbulb_screw',  name: 'Lightbulb Screw',  cat: 'Medium', sr: { score:100.0,dsrl:100.0,resrl:50.0, base:50.0, rialto:0.0,  fpo:37.5 } },
        { key: 'credit_card_pick', name: 'Credit Card Pick', cat: 'Medium', sr: { score:80.0, dsrl:80.0, resrl:80.0, base:10.0, rialto:10.0, fpo:0.0  } },
        { key: 'dishrack_place',   name: 'Dishrack Place',   cat: 'Medium', sr: { score:90.0, dsrl:65.0, resrl:45.0, base:50.0, rialto:0.0,  fpo:0.0  } },
        { key: 'cube_pinch',       name: 'Cube Pinch',       cat: 'Easy',   sr: { score:100.0,dsrl:75.0, resrl:80.0, base:30.0, rialto:60.0, fpo:35.0 } },
        { key: 'bottle_grasp',     name: 'Bottle Grasp',     cat: 'Easy',   sr: { score:100.0,dsrl:100.0,resrl:87.5, base:91.7, rialto:58.3, fpo:50.0 } },
        { key: 'cup_grasp',        name: 'Cup Grasp',        cat: 'Easy',   sr: { score:100.0,dsrl:86.7, resrl:93.3, base:46.7, rialto:53.3, fpo:0.0  } }
    ];

    var CAT_COLOR = { Easy: 'var(--em-mid)', Medium: 'var(--baseline-ochre)', Hard: 'var(--baseline-terracotta)' };

    function fmtSR(v){ return v.toFixed(1) + '%'; }

    function buildCard(task){
        var card = document.createElement('div');
        card.className = 'tr-card';

        var hdr = document.createElement('div');
        hdr.className = 'tr-header';
        hdr.innerHTML = '<span class="tr-name">' + task.name + '</span>'
            + '<span class="tr-cat" style="color:' + CAT_COLOR[task.cat] + '">' + task.cat + '</span>';
        card.appendChild(hdr);

        var bars = document.createElement('div');
        bars.className = 'tr-bars';

        METHODS.forEach(function(m){
            var srVal = task.sr[m.key];
            var row = document.createElement('div');
            row.className = 'tr-bar-row';
            row.innerHTML = '<span class="tr-bar-lbl ' + m.lbl + '">' + m.label + '</span>'
                + '<div class="tr-bar-track">'
                +   '<div class="tr-bar-fill ' + m.fill + '" data-sr="' + srVal + '"></div>'
                + '</div>'
                + '<span class="tr-bar-val' + (m.key === 'score' ? ' tr-val-score' : '') + '">' + fmtSR(srVal) + '</span>';
            bars.appendChild(row);
        });
        card.appendChild(bars);
        return card;
    }

    function applyBars(){
        document.querySelectorAll('.tr-bar-fill[data-sr]').forEach(function(el){
            el.style.width = el.dataset.sr + '%';
        });
    }

    function findTask(key){
        for(var i=0;i<TASKS.length;i++){ if(TASKS[i].key === key) return TASKS[i]; }
        return null;
    }

    var _current = 'ball_pour';

    // render the single-task results card; called by rollout.js on tab change
    window.trRenderTask = function(key){
        var host = document.getElementById('task-results-single');
        if(!host) return;
        if(key) _current = key;
        var task = findTask(_current);
        host.innerHTML = '';
        if(!task) return;
        host.appendChild(buildCard(task));
        // widths start at 0 (CSS), apply on next frame so the bars animate in
        requestAnimationFrame(applyBars);
    };

    function render(){
        if(document.getElementById('task-results-single')){
            window.trRenderTask(_current);
        }
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
}());
