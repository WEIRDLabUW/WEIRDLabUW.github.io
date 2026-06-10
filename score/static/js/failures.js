(function(){
    var _task = 'soccer_push';
    // Number of available FPO clips per task.
    var COUNTS = {
        soccer_push:  { fpo: 1 },
        bottle_grasp: { fpo: 1 }
    };
    // Per-task FPO caption shown under the clip.
    var DESCRIPTIONS = {
        soccer_push:  { fpo: 'Although this behavior works very well in simulation, it doesn’t transfer to the real world. Here, the ball just barely catches the thumb, causing the thumb to snap into the table and a complete failure of the policy.' },
        bottle_grasp: { fpo: '' }
    };
    function p3(n){ return String(n).padStart(3,'0'); }
    function mkCell(src){
        var cell = document.createElement('div'); cell.className = 'rollout-cell';
        var v = document.createElement('video'); v.src = src; v.autoplay = true; v.loop = true; v.muted = true; v.setAttribute('playsinline','');
        cell.appendChild(v); return cell;
    }
    function fill(grid, method){
        grid.innerHTML = '';
        var n = (COUNTS[_task] && COUNTS[_task][method]) || 0;
        grid.classList.toggle('large', n === 1); // single clip -> enlarged 16:9, like bottle/cube
        for(var i=0;i<n;i++){
            grid.appendChild(mkCell('static/videos/real_world_rollouts/'+_task+'/'+method+'/ep_'+p3(i)+'.mp4'));
        }
    }
    function render(){
        var cols   = document.getElementById('fail-cols');
        var extras = document.getElementById('fail-extras');
        // Extras tab: show the static gallery panel, hide the FPO column.
        if(_task === 'extras'){
            if(cols)   cols.style.display = 'none';
            if(extras) extras.style.display = '';
            return;
        }
        if(cols)   cols.style.display = '';
        if(extras) extras.style.display = 'none';
        var notes = DESCRIPTIONS[_task] || {};
        var el = document.getElementById('fail-fpo-desc');
        if(el){
            var d = notes.fpo || '';
            el.innerHTML = d ? '<span class="note-tag">✗ Failure mode</span>' + d : '';
            el.style.display = d ? '' : 'none';
        }
        var fpo = document.getElementById('fail-fpo-grid');
        if(!fpo) return;
        fill(fpo, 'fpo');
    }
    window.failSetTask = function(btn){
        document.querySelectorAll('.fail-tab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        _task = btn.dataset.task; render();
    };
    render();
}());
