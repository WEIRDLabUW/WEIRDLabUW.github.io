/* Page behaviour for the project page: lazy-playing videos, section nav, BibTeX copy. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- Videos: load and play only while visible; never restart one the reader paused ---- */
  function initVideos() {
    var videos = document.querySelectorAll('video[data-src]');
    if (!videos.length) return;

    function load(v) {
      if (!v.getAttribute('src')) {
        v.src = v.getAttribute('data-src');
        v.preload = 'metadata';
      }
    }

    // No IntersectionObserver: load on demand when the reader presses play.
    if (!('IntersectionObserver' in window)) {
      videos.forEach(function (v) {
        v.addEventListener('play', function () { load(v); }, { once: true });
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          load(v);
          if (!reduceMotion.matches && !v.dataset.userPaused) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else if (!v.paused) {
          v._autoPaused = true;
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.25 });

    videos.forEach(function (v) {
      v.addEventListener('pause', function () {
        if (v._autoPaused) { v._autoPaused = false; return; }
        if (!v.ended) v.dataset.userPaused = '1';
      });
      v.addEventListener('play', function () {
        load(v);
        delete v.dataset.userPaused;
      });
      io.observe(v);
    });
  }

  /* ---- Section nav: mark the section in view with aria-current ---- */
  function initNav() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('.site-nav-links a'));
    var byId = {};
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var s = document.getElementById(id);
      if (s) { byId[id] = a; sections.push(s); }
    });

    function setCurrent(id) {
      links.forEach(function (a) {
        if (byId[id] === a) {
          a.setAttribute('aria-current', 'true');
          // keep the current link visible when the list scrolls horizontally (mobile)
          var list = a.closest('.site-nav-links');
          if (list && list.scrollWidth > list.clientWidth) {
            var target = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
            list.scrollTo({ left: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
          }
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }

    // the current section is the last one whose top has passed a line near the top of the viewport
    function update() {
      var line = nav.offsetHeight + 24;
      var current = null;
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
      });
      // at the very bottom the last section can't reach the top line, so it wins
      if (sections.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1].id;
      // sections not in the nav (e.g. confusion, bench) belong to the previous nav entry
      if (current === null) { setCurrent(''); return; }
      setCurrent(current);
    }

    // Hash targets that are not nav links still need a "current" so map them to the closest preceding link.
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---- BibTeX copy ---- */
  function initCopy() {
    var btn = document.getElementById('bibtex-copy');
    var src = document.getElementById('bibtex-text');
    if (!btn || !src) return;
    var label = btn.querySelector('.bibtex-copy-label');
    var timer;

    function done(ok) {
      label.textContent = ok ? 'Copied' : 'Press Ctrl/Cmd+C';
      btn.classList.toggle('is-copied', ok);
      clearTimeout(timer);
      timer = setTimeout(function () {
        label.textContent = 'Copy';
        btn.classList.remove('is-copied');
      }, 2000);
    }

    function fallback() {
      var range = document.createRange();
      range.selectNodeContents(src);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      done(ok);
    }

    btn.addEventListener('click', function () {
      var text = src.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ---- Experimental hero background video: opt-in toggle, remembered, off under reduced motion ---- */
  function initHeroVideo() {
    var hero = document.getElementById('top');
    var btn = document.getElementById('hero-video-toggle');
    var video = hero && hero.querySelector('.hero-video video');
    if (!btn || !video) return;
    var KEY = 'dna-hero-video';
    var on = false;
    try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { on = true; }
    if (reduceMotion.matches) on = false;

    function set(next) {
      on = next;
      hero.classList.toggle('has-bg-video', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.querySelector('.fas').className = 'fas ' + (on ? 'fa-pause' : 'fa-play');
      if (on) {
        if (!video.getAttribute('src')) video.src = video.getAttribute('data-bg-src');
        video.play().catch(function () {});
      } else {
        video.pause();
      }
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    }
    btn.addEventListener('click', function () { set(!on); });
    set(on);
  }

  function init() {
    initHeroVideo();
    initVideos();
    initNav();
    initCopy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
