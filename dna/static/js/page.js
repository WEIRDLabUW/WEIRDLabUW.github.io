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
        // clips inside a closed <details> are not visible: do not fetch or play them
        if (v.closest && v.closest('details:not([open])')) return;
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

    // opening a <details> makes its clips visible: look at them again
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d || !d.matches || !d.matches('details[open]')) return;
      d.querySelectorAll('video[data-src]').forEach(function (v) { io.unobserve(v); io.observe(v); });
    }, true);

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
    // the bar appears once the marquee (top of the page) has scrolled out of view
    var marquee = document.getElementById('marquee');
    function toggleBar() {
      var past = marquee ? marquee.getBoundingClientRect().bottom <= 0 : window.scrollY > 0;
      nav.classList.toggle('is-visible', past);
    }

    function update() {
      toggleBar();
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

  /* ---- Copy buttons (BibTeX, code snippet) ---- */
  function initCopy(btnId, srcId) {
    var btn = document.getElementById(btnId);
    var src = document.getElementById(srcId);
    if (!btn || !src) return;
    var label = btn.querySelector('.bibtex-copy-label');
    var icon = btn.querySelector('.fas');
    var timer;

    function done(ok) {
      // icon-only buttons swap their icon instead of a text label
      if (label) label.textContent = ok ? 'Copied' : 'Press Ctrl/Cmd+C';
      if (!label && icon) icon.className = 'fas ' + (ok ? 'fa-check' : 'fa-copy');
      btn.classList.toggle('is-copied', ok);
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (label) label.textContent = 'Copy';
        if (!label && icon) icon.className = 'fas fa-copy';
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

  /* ---- "More results": collapsed by default; links into it open it first ---- */
  function initMore() {
    var btn = document.getElementById('more-toggle');
    var body = document.getElementById('more-body');
    if (!btn || !body) return;
    var label = btn.querySelector('.more-toggle-label');
    var icon = btn.querySelector('.fas');

    function set(open) {
      body.classList.toggle('is-open', open);
      if (open) body.removeAttribute('inert'); else body.setAttribute('inert', '');
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Hide results' : 'Show all results';
      icon.className = 'fas ' + (open ? 'fa-chevron-up' : 'fa-chevron-down');
    }
    btn.addEventListener('click', function () { set(!body.classList.contains('is-open')); });

    function openFor(hash) {
      var t = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      if (!t || !body.contains(t) || body.classList.contains('is-open')) return;
      // open without the slide, so the section is at its final position when we scroll to it
      body.classList.add('is-instant');
      set(true);
      void body.offsetHeight;
      t.scrollIntoView();
      requestAnimationFrame(function () { body.classList.remove('is-instant'); });
    }
    window.addEventListener('hashchange', function () { openFor(location.hash); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && body.contains(document.getElementById(a.getAttribute('href').slice(1)) || document.body)) {
        var id = a.getAttribute('href').slice(1);
        if (id && body.contains(document.getElementById(id))) openFor('#' + id);
      }
    });
    openFor(location.hash);
  }

  function init() {
    initVideos();
    initNav();
    initMore();
    initCopy('bibtex-copy', 'bibtex-text');
    initCopy('code-copy', 'code-text');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
