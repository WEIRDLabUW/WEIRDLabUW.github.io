// Shared builders for the exploration-visualization embeds: a fingertip
// force-pad panel (two squares with length-scaled force arrows + a grip-force
// sparkline) and an interactive 3D end-effector trajectory. Plots advance in
// sync with the rollout's scene video, and clicking any point on the 3D
// trajectory seeks the video (and therefore every panel) to that step.
(function(){
  var PLASMA = [[0,'#0d0887'],[0.2,'#6a00a8'],[0.4,'#b12a90'],[0.6,'#e16462'],[0.8,'#fca636'],[1,'#f0f921']];

  // ---- visibility gate: work (video decode, plot stepping) only runs while the
  // embed is scrolled into view and the tab is visible ----
  var inView = true, tabShown = !document.hidden, visCbs = [];
  function visNow(){ return inView && tabShown; }
  function fireVis(){ var v = visNow(); visCbs.forEach(function(cb){ try{ cb(v); }catch(e){} }); }
  if ('IntersectionObserver' in window) {
    inView = false;
    new IntersectionObserver(function(es){
      var v = es[0].isIntersecting;
      if (v !== inView) { inView = v; fireVis(); }
    }, {threshold: 0.05}).observe(document.body);
  }
  document.addEventListener('visibilitychange', function(){
    tabShown = !document.hidden; fireVis();
  });
  function onVisible(cb){ visCbs.push(cb); cb(visNow()); }
  var FONT = "'Google Sans','Noto Sans',sans-serif";
  var CFG = {displayModeBar:false, responsive:true};
  // 3/4 view chosen against the real data: probing loops spread out with
  // minimal overlap between the descent, the loops, and the final lift
  var EYE = {x:0.9, y:-2.2, z:0.9};
  var NAVY = '#35507d', GOLD = '#b9821f';

  function labAxis(name, small){
    return { title:{text:name, font:{size:small?11:13, family:FONT, color:'#55525e'}},
             showticklabels:true, tickfont:{size:small?9:10.5, family:FONT, color:'#8b8698'},
             nticks:5, showbackground:true, backgroundcolor:'#fafafa',
             gridcolor:'#e8e5ee', zerolinecolor:'#e8e5ee' };
  }
  function cols(tr, k, upto){
    var out = [];
    for (var i = 0; i <= upto; i++) out.push(tr[i][k]);
    return out;
  }
  function mag(f, off){
    return Math.sqrt(f[off]*f[off] + f[off+1]*f[off+1] + f[off+2]*f[off+2]);
  }

  // ---- fingertip force pads: canvas with two squares + arrows + sparkline ----
  function makePads(hostId, D){
    var host = document.getElementById(hostId);
    var cv = document.createElement('canvas');
    cv.style.width = '100%'; cv.style.height = '100%'; cv.style.display = 'block';
    host.appendChild(cv);
    var FMAX = window.TACTILE_DATA && window.TACTILE_DATA._fmax || 140;

    function norm(v){ return Math.sqrt(Math.min(1, v / FMAX)); }

    function draw(step){
      var dpr = window.devicePixelRatio || 1;
      var W = host.clientWidth, H = host.clientHeight;
      if (!W || !H) return;
      if (cv.width !== W*dpr) { cv.width = W*dpr; cv.height = H*dpr; }
      var g = cv.getContext('2d');
      g.setTransform(dpr,0,0,dpr,0,0);
      g.clearRect(0,0,W,H);

      var titleH = 20;
      var sparkH = Math.max(34, Math.round(H*0.24));
      var padArea = H - titleH - sparkH - 8;
      var side = Math.min(padArea - 8, (W - 44) / 2);
      var cyP = titleH + padArea/2;
      var cxL = W/2 - side/2 - 8, cxR = W/2 + side/2 + 8;

      // shared title over both pads
      g.font = '600 13px ' + FONT;
      g.fillStyle = '#55525e';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('fingertip contact force', W/2, titleH/2 + 3);

      [cxL, cxR].forEach(function(cx){
        g.beginPath();
        if (g.roundRect) g.roundRect(cx - side/2, cyP - side/2, side, side, 10);
        else g.rect(cx - side/2, cyP - side/2, side, side);
        g.fillStyle = '#f2f1f5'; g.fill();
        g.lineWidth = 1.5; g.strokeStyle = '#d8d5df'; g.stroke();
      });

      var f = D.force[step];
      [[cxL, 0, NAVY], [cxR, 3, GOLD]].forEach(function(spec){
        var cx = spec[0], off = spec[1], color = spec[2];
        var m = mag(f, off);
        var r = norm(m) * (side/2 - 6);
        if (r < 2) { // idle pad: small dot
          g.beginPath(); g.arc(cx, cyP, 2.5, 0, 7); g.fillStyle = '#c9c4d2'; g.fill();
          return;
        }
        // screen direction: x = squeeze axis (world y), y = up (world z);
        // only the LENGTH encodes magnitude — stroke width stays fixed
        var dx = f[off+1], dy = -f[off+2];
        var L2 = Math.sqrt(dx*dx + dy*dy) || 1;
        dx /= L2; dy /= L2;
        var hl = 7;
        var x1 = cx + dx*(r - hl*0.5), y1 = cyP + dy*(r - hl*0.5);
        g.lineWidth = 2.6;
        g.lineCap = 'round';
        g.strokeStyle = color;
        g.beginPath(); g.moveTo(cx, cyP); g.lineTo(x1, y1); g.stroke();
        var ang = Math.atan2(dy, dx);
        var tx = cx + dx*r, ty = cyP + dy*r;
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(tx + Math.cos(ang)*hl*0.5, ty + Math.sin(ang)*hl*0.5);
        g.lineTo(tx + Math.cos(ang+2.4)*hl, ty + Math.sin(ang+2.4)*hl);
        g.lineTo(tx + Math.cos(ang-2.4)*hl, ty + Math.sin(ang-2.4)*hl);
        g.closePath(); g.fill();
      });

      // sparkline: per-finger |F| over the episode + playhead; the y axis
      // carries an axis label (not tick numbers)
      var axW = 26;
      var sx = axW + 4, sw = W - sx - 8, sy = H - sparkH, sh = sparkH - 8;
      g.fillStyle = '#fafafa';
      g.beginPath();
      if (g.roundRect) g.roundRect(sx-3, sy-3, sw+6, sh+6, 6); else g.rect(sx-3, sy-3, sw+6, sh+6);
      g.fill();

      var ax = axW - 4;
      g.strokeStyle = '#8b8698'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(ax, sy + sh + 1); g.lineTo(ax, sy - 4); g.stroke();
      g.fillStyle = '#8b8698';
      g.beginPath();
      g.moveTo(ax, sy - 9); g.lineTo(ax - 3.4, sy - 2.5); g.lineTo(ax + 3.4, sy - 2.5);
      g.closePath(); g.fill();
      g.save();
      g.translate(ax - 7, sy + sh/2);
      g.rotate(-Math.PI/2);
      g.font = '10px ' + FONT;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('force (N)', 0, 0);
      g.restore();

      var n = D.force.length;
      [[0, NAVY], [3, GOLD]].forEach(function(spec){
        g.beginPath();
        for (var i = 0; i < n; i++) {
          var x = sx + (n === 1 ? 0 : i/(n-1)) * sw;
          var y = sy + sh - norm(mag(D.force[i], spec[0])) * sh;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.lineWidth = 1.6; g.strokeStyle = spec[1]; g.globalAlpha = 0.9; g.stroke();
        g.globalAlpha = 1;
      });
      var px = sx + (n === 1 ? 0 : step/(n-1)) * sw;
      g.strokeStyle = '#8b8698'; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(px, sy - 1); g.lineTo(px, sy + sh + 1); g.stroke();
    }
    draw(0);
    return { draw: draw };
  }

  // trajId traces: [0] gray full-path ghost, [1] progressive plasma line,
  //                [2] start dot, [3] current-position marker
  // padId may be null (tasks without force sensing get video + 3D only)
  function buildPair(padId, trajId, D, small){
    var pads = padId ? makePads(padId, D) : null;

    var tr = D.traj, n = tr.length;
    var mk = D.success ? {size:small?6:8, color:'#f0f921', line:{color:'#b9821f', width:2}}
                       : {size:small?6:8, color:'#cc2222', line:{color:'#7c1414', width:2}};
    Plotly.newPlot(trajId, [
      { type:'scatter3d', mode:'lines', x:cols(tr,0,n-1), y:cols(tr,1,n-1), z:cols(tr,2,n-1),
        line:{width:small?3:4, color:'#dcd9e3'}, hoverinfo:'none' },
      { type:'scatter3d', mode:'lines', x:[tr[0][0]], y:[tr[0][1]], z:[tr[0][2]],
        line:{width:small?7:9, color:[0], colorscale:PLASMA, cmin:0, cmax:1}, hoverinfo:'none' },
      { type:'scatter3d', mode:'markers', x:[tr[0][0]], y:[tr[0][1]], z:[tr[0][2]],
        marker:{size:small?4:5, color:'#55525e'}, hoverinfo:'skip' },
      { type:'scatter3d', mode:'markers', x:[tr[0][0]], y:[tr[0][1]], z:[tr[0][2]],
        marker:mk, hoverinfo:'skip' }
    ], {
      font:{family:FONT}, paper_bgcolor:'rgba(0,0,0,0)', showlegend:false,
      margin:{l:6,r:6,t:4,b:8},
      scene:{ xaxis:labAxis('x',small), yaxis:labAxis('y',small), zaxis:labAxis('z',small),
              camera:{eye:EYE, up:{x:0,y:0,z:1}}, aspectmode:'data' }
    }, CFG);
    return pads;
  }

  // advance the pads + trajectory to one step
  function step(pads, trajId, D, k){
    var n = D.traj.length;
    var t = [];
    for (var i = 0; i <= k; i++) t.push(i/(n-1));
    if (pads) pads.draw(k);
    Plotly.restyle(trajId, {
      x: [cols(D.traj,0,k)], y: [cols(D.traj,1,k)], z: [cols(D.traj,2,k)],
      'line.color': [t]
    }, [1]);
    Plotly.restyle(trajId, {
      x: [[D.traj[k][0]]], y: [[D.traj[k][1]]], z: [[D.traj[k][2]]]
    }, [3]);
  }

  // clicking a trajectory point seeks the video to that step
  function bindSeek(trajId, getVideo, getN){
    var gd = document.getElementById(trajId);
    if (!gd || !gd.on) return;
    gd.on('plotly_click', function(ev){
      if (!ev.points || !ev.points.length) return;
      var pt = ev.points[0];
      if (pt.curveNumber > 1) return;         // only the two line traces
      var video = getVideo(), n = getN();
      var d = video.duration;
      if (!d || !isFinite(d)) return;
      var k = Math.max(0, Math.min(n-1, pt.pointNumber));
      video.currentTime = (k + 0.5) / n * d;
      video.play().catch(function(){});
    });
  }

  // continuously follow the video's playback position; everything pauses
  // off-screen and resumes (after a beat) when scrolled back in
  function sync(video, pads, trajId, D){
    video.playbackRate = 0.7;   // slightly slower than realtime
    var n = D.traj.length;
    var last = -1;
    bindSeek(trajId, function(){ return video; }, function(){ return n; });
    onVisible(function(v){
      if (!v) { video.pause(); }
      else if (video.paused && !video.ended) { video.play().catch(function(){}); }
    });
    function frame(){
      if (visNow()) {
        var d = video.duration;
        if (d && isFinite(d) && d > 0) {
          var k = Math.min(n-1, Math.floor(video.currentTime / d * n));
          if (k !== last) { last = k; step(pads, trajId, D, k); }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.VIZ = { buildPair: buildPair, sync: sync, step: step, bindSeek: bindSeek,
                 onVisible: onVisible, isVisible: visNow };
}());
