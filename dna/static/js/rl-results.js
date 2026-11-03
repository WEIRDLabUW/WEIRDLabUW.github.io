// Real-world RL results (#rl-results): one card per experiment: thumbnail, language instruction and a success-rate bar chart.
// Bars grow in once when scrolled into view; hovering or focusing a bar highlights it. Plain HTML/CSS, so it follows the theme.
(function () {
  var root = document.getElementById('rl-results');
  if (!root) return;

  // same order as the videos below
  var CARDS = [
    { title: 'Advantage-filtered BC', sub: 'bimanual YAM', img: './static/videos/rl/web/posters/book_nudge_dna.jpg', task: 'nudge out the book \u2018Thinking, Fast and Slow\u2019, grasp it, and place it on the table',
      bars: [['\u03c0<sub>0.5</sub>', 80, 'gvl'], ['TOPReward', 25, 'topreward'], ['Robometer', 50, 'robometer'], ['D&A', 95, 'dna']] },
    { title: 'Offline RL', sub: 'bimanual YAM', img: './static/videos/rl/web/posters/eval_dna_book.jpg', task: 'move the red book from the top shelf to the gray box',
      bars: [['\u03c0<sub>0.5</sub>', 20, 'gvl'], ['TOPReward', 80, 'topreward'], ['Robometer', 85, 'robometer'], ['D&A', 100, 'dna']] },
    { title: 'Online RL', sub: 'DROID Franka', img: './static/videos/rl/web/posters/eval_dna.jpg', pos: 'bottom', task: 'put the fruit in the bowl',
      bars: [['\u03c0<sub>0</sub>', 10, 'gvl'], ['TOPReward', 5, 'topreward'], ['D&A', 100, 'dna']] }
  ];

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  root.innerHTML = CARDS.map(function (c) {
    var bars = c.bars.map(function (b) {
      return '<div class="rl-bar is-' + b[2] + '' + '" tabindex="0" style="--v:' + b[1] + '"' +
        ' aria-label="' + b[0].replace(/<[^>]+>/g, '').replace(/&/g, '&amp;') + ': ' + b[1] + '% success">' +
        '<span class="rl-val">' + b[1] + '</span><span class="rl-col"></span><span class="rl-name">' + b[0].replace(/&/g, '&amp;') + '</span></div>';
    }).join('');
    return '<article class="rl-card">' +
      '<div class="rl-head"><h3>' + esc(c.title) + '</h3><span>' + esc(c.sub) + '</span></div>' +
      '<div class="rl-photo"><img src="' + c.img + '" alt="" loading="lazy" decoding="async"' + (c.pos ? ' style="object-position:center ' + c.pos + '"' : '') + '></div>' +
      '<p class="rl-task">\u201c' + esc(c.task) + '\u201d</p>' +
      '<div class="rl-plot"><span class="rl-axis">Success rate (%)</span><div class="rl-bars" style="--n:' + c.bars.length + '">' + bars + '</div></div>' +
      '</article>';
  }).join('');

  function show() { root.classList.add('is-in'); }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { show(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(root);
  } else show();

  // hovering one bar dims the others in its chart
  root.addEventListener('mouseover', focus); root.addEventListener('focusin', focus);
  root.addEventListener('mouseout', blur); root.addEventListener('focusout', blur);
  function focus(e) {
    var b = e.target.closest && e.target.closest('.rl-bar'); if (!b) return;
    b.parentNode.classList.add('has-focus'); b.classList.add('is-focus');
  }
  function blur(e) {
    var b = e.target.closest && e.target.closest('.rl-bar'); if (!b) return;
    b.parentNode.classList.remove('has-focus'); b.classList.remove('is-focus');
  }
})();
