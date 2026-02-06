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
  const viewerEls = document.querySelectorAll('.wrap.embedded-viewer');

  viewerEls.forEach((viewerEl) => {
    // init viewer
    const app = new App(viewerEl);

    // find button
    const btn = viewerEl.querySelector('.glb-fullscreen-btn');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (!document.fullscreenElement) {
        viewerEl.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  });

  // Resize Three.js renderer when fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    window.dispatchEvent(new Event('resize'));
  });
});
