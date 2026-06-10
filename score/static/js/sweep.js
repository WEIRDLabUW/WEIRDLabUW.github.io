(function(){
    var NL = ['0','T-4','T-2','3T-4','T'];
    var DISP = ['0','T/4','T/2','3T/4','T'];
    var DL = ['(conditional)','','','','(marginal)'];
    var SPECS = [], INSTR = {}, _task = '', _idx = 0;
    var RIDS = [0,1,2,3,4];
    var _pool = {};
    var _poolRoot = (function(){
        var el = document.createElement('div');
        el.setAttribute('aria-hidden','true');
        el.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;';
        document.body.appendChild(el); return el;
    }());
    function p3(n){ return String(n).padStart(3,'0'); }
    function cfg(id){
        var base = 'static/videos/context_noise_sweep/' + id;
        return {mode:'composite', base:base};
    }
    function srcs(c, nl){
        return c.mode === 'composite'
            ? [c.base+'/sigma_'+nl+'/composite.mp4']
            : RIDS.map(function(r){ return c.base+'/sigma_'+nl+'/ep_'+p3(r)+'.mp4'; });
    }
    function mkVid(src){ var v = document.createElement('video'); v.src=src; v.muted=true; v.loop=true; v.preload='auto'; v.setAttribute('playsinline',''); _poolRoot.appendChild(v); return v; }
    function preload(id){
        if(_pool[id]) return;
        var c = cfg(id); _pool[id]={};
        NL.forEach(function(nl){ _pool[id][nl] = srcs(c,nl).map(mkVid); });
    }
    function setUI(){
        var nl=NL[_idx]; var pct=(_idx/4)*100;
        document.getElementById('sweep-thumb').style.left=pct+'%';
        document.getElementById('sweep-sigma-val').textContent=DISP[_idx];
        var lbl=document.getElementById('sweep-sigma-lbl'); if(lbl) lbl.textContent=DL[_idx]?DL[_idx]:'';
    }
    var _tok=0;
    function render(){
        var nl=NL[_idx], c=cfg(_task), tok=++_tok;
        setUI();
        var grid=document.getElementById('sweep-grid');
        grid.style.opacity='0';
        setTimeout(function(){
            if(tok!==_tok) return;
            grid.innerHTML=''; grid.classList.remove('shimmer');
            var pv=_pool[_task]&&_pool[_task][nl];
            if(c.mode==='composite'){
                grid.className='grid-composite';
                grid.style.maxWidth='520px'; grid.style.margin='0 auto';
                var cell=document.createElement('div'); cell.className='sweep-cell';
                var v=document.createElement('video'); v.src=pv?pv[0].src:c.base+'/sigma_'+nl+'/composite.mp4';
                v.autoplay=true; v.loop=true; v.muted=true; v.setAttribute('playsinline','');
                v.style.cssText='width:100%;display:block;';
                cell.appendChild(v); grid.appendChild(cell);
                fadeIn(grid,[v],tok); v.play().catch(function(){});
            } else {
                grid.className='grid-multi';
                grid.style.maxWidth=''; grid.style.margin='';
                var vs=[];
                RIDS.forEach(function(r,i){
                    var src=pv?pv[i].src:c.base+'/sigma_'+nl+'/ep_'+p3(r)+'.mp4';
                    var cell=document.createElement('div'); cell.className='sweep-cell';
                    var v=document.createElement('video'); v.src=src; v.autoplay=true; v.loop=true; v.muted=true; v.setAttribute('playsinline','');
                    v.style.cssText='width:100%;display:block;';
                    cell.appendChild(v); grid.appendChild(cell); vs.push(v);
                });
                fadeIn(grid,vs,tok);
                vs.forEach(function(v){ v.play().then(function(){ v.playbackRate=1.5; }).catch(function(){}); });
            }
        },170);
    }
    function fadeIn(grid,vids,tok){
        var done=false;
        var fb=setTimeout(function(){ if(tok===_tok&&!done){done=true;grid.style.opacity='1';} },600);
        vids[0].addEventListener('canplay',function fn(){ vids[0].removeEventListener('canplay',fn); clearTimeout(fb); if(tok===_tok&&!done){done=true;grid.style.opacity='1';} });
    }
    function setIdx(i){ _idx=Math.max(0,Math.min(4,i)); document.getElementById('sweep-slider-hidden').value=_idx; render(); }

    (function(){
        var track=document.getElementById('sweep-track'); if(!track)return;
        var drag=false;
        function pct(e){ var r=track.getBoundingClientRect(); var x=e.touches?e.touches[0].clientX:e.clientX; return Math.max(0,Math.min(1,(x-r.left)/r.width)); }
        function apply(e){ setIdx(Math.round(pct(e)*4)); }
        track.addEventListener('mousedown',function(e){drag=true;apply(e);e.preventDefault();});
        document.addEventListener('mousemove',function(e){if(drag)apply(e);});
        document.addEventListener('mouseup',function(){drag=false;});
        track.addEventListener('touchstart',function(e){drag=true;apply(e);e.preventDefault();},{passive:false});
        document.addEventListener('touchmove',function(e){if(drag)apply(e);},{passive:false});
        document.addEventListener('touchend',function(){drag=false;});
    }());

    _task='';
    var _sweepTabs = document.getElementById('sweep-tabs');
    if(_sweepTabs) _sweepTabs.style.display='none';
    if(!document.getElementById('sweep-grid')) return;
    preload(_task); render();
}());
