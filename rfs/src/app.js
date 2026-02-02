import * as THREE from 'three';
import { Viewer } from './viewer.js';
import { Validator } from './validator.js';

window.THREE = THREE;
window.VIEWER = {};

class App {
  constructor(containerEl) {
    // 🔹 containerEl IS the .wrap element
    this.el = containerEl;

    // ✅ READ MODEL FROM THIS CONTAINER
    const model = this.el.dataset.model;

    this.options = {
      kiosk: true,
      model,
      preset: '',
      cameraPosition: null,
    };

    this.spinnerEl = this.el.querySelector('.spinner');
    this.containerEl = this.el;
    this.viewer = null;

    this.createViewer();

    if (model) {
      this.showSpinner();
      this.view(model, '', new Map());
    }
  }

  createViewer() {
    const viewerEl = document.createElement('div');
    viewerEl.classList.add('viewer');
    this.containerEl.appendChild(viewerEl);

    this.viewer = new Viewer(viewerEl, this.options);
  }

  view(rootFile, rootPath, fileMap) {
    const fileURL =
      typeof rootFile === 'string'
        ? rootFile
        : URL.createObjectURL(rootFile);

    this.viewer
      .load(fileURL, rootPath, fileMap)
      .then(() => this.hideSpinner())
      .catch((e) => this.onError(e));
  }

  showSpinner() {
    this.spinnerEl.style.display = '';
  }

  hideSpinner() {
    this.spinnerEl.style.display = 'none';
  }

  onError(error) {
    console.error(error);
    alert(error.message || error.toString());
  }
}

/* ================================
   One App PER embedded viewer
================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* ============================
     INIT ALL GLB VIEWERS
  ============================ */
  const viewerEls = document.querySelectorAll('.wrap.embedded-viewer');

  viewerEls.forEach((viewerEl) => {
    const app = new App(viewerEl);
    viewerEl.__app__ = app;

    const btn = viewerEl.querySelector('.glb-fullscreen-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          viewerEl.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }
  });

  document.addEventListener('fullscreenchange', () => {
    window.dispatchEvent(new Event('resize'));
  });

  /* ============================
     HELPERS
  ============================ */

  function resizeGLBViewer(viewerEl) {
    const app = viewerEl.__app__;
    if (!app || !app.viewer) return;
    app.viewer.resize();
  }

  function playMediaInPanel(panel) {
    /* ▶️ GLBs */
    panel.querySelectorAll('.wrap.embedded-viewer').forEach((viewerEl) => {
      const app = viewerEl.__app__;
      if (!app || !app.viewer) return;

      // 🔥 critical: wait for layout to apply
      setTimeout(() => {
        resizeGLBViewer(viewerEl);
        app.viewer.stopAllClips();
        app.viewer.playAllClips();
      }, 0);
    });

    /* ▶️ VIDEOS */
    panel.querySelectorAll('video').forEach((video) => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  }

  function pauseMediaInPanel(panel) {
    panel.querySelectorAll('video').forEach((video) => {
      video.pause();
    });
  }

  /* ============================
     OBSERVE TASK PANEL VISIBILITY
  ============================ */

  const taskPanels = document.querySelectorAll('.task-panel');

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName !== 'class') return;

      const panel = m.target;

      if (!panel.classList.contains('hidden')) {
        // ✅ panel opened
        playMediaInPanel(panel);
      } else {
        // ⏸ panel closed
        pauseMediaInPanel(panel);
      }
    });
  });

  taskPanels.forEach((panel) => {
    observer.observe(panel, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });
});
