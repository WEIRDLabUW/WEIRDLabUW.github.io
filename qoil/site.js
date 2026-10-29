// Page behavior: click-through panels, links into them, the simulator drop-down,
// play-when-visible video, reduced-motion handling, BibTeX copy.
(function () {
    "use strict";

    // Click-through panels: a list selects the visible panel. Panels share one grid cell
    // (see .stage), so switching never changes the size of the block.
    document.querySelectorAll('[data-stepper]').forEach(root => {
        const tabs = [...root.querySelectorAll('[role="tab"]')];
        const select = (tab, focus) => {
            tabs.forEach(t => {
                const on = t === tab;
                t.setAttribute('aria-selected', on);
                t.tabIndex = on ? 0 : -1;
                const panel = document.getElementById(t.getAttribute('aria-controls'));
                panel.classList.toggle('is-active', on);
                if (!on) panel.querySelectorAll('video').forEach(v => v.pause());
            });
            if (focus) tab.focus();
        };
        tabs.forEach((tab, i) => {
            tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
            tab.addEventListener('click', () => select(tab));
            tab.addEventListener('keydown', e => {
                const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
                if (!step) return;
                e.preventDefault();
                select(tabs[(i + step + tabs.length) % tabs.length], true);
            });
        });
    });

    // Links into a click-through panel ([data-goto-tab]): open that panel and scroll to it.
    document.querySelectorAll('[data-goto-tab]').forEach(link => link.addEventListener('click', e => {
        const tab = document.querySelector(`[role="tab"][aria-controls="${link.dataset.gotoTab}"]`);
        if (!tab) return;
        e.preventDefault();
        tab.click();
        tab.closest('[data-stepper]').scrollIntoView({ behavior: 'smooth', block: 'center' });
        tab.focus({ preventScroll: true });
    }));

    // The simulator canvas lives in a drop-down and needs a resize once it opens.
    document.querySelectorAll('details.try').forEach(d =>
        d.addEventListener('toggle', () => window.dispatchEvent(new Event('resize'))));

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // [data-play-in-view] videos play (muted, as browsers require) once mostly on screen and
    // pause when scrolled away.
    const inView = [...document.querySelectorAll('video[data-play-in-view]')];
    if (inView.length && !reduceMotion) {
        const shown = new Map();
        const check = () => inView.forEach(v => {
            const r = v.getBoundingClientRect();
            const seen = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
            const on = r.height > 0 && seen / r.height >= 0.6;
            if (on === shown.get(v)) return;
            shown.set(v, on);
            if (on) v.play().catch(() => {}); else v.pause();
        });
        let queued = false;
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        check();
    }

    // Looping clips stay still for people who prefer reduced motion.
    if (reduceMotion) {
        document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); v.controls = true; });
    }

    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById(btn.dataset.copy).textContent).then(() => {
                btn.textContent = 'Copied';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
            }).catch(() => {});
        });
    });
})();
