/* =========================================================
   input.js — keyboard state with buffered presses
   ========================================================= */

import { KEYMAP } from './config.js';

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.anyPressed = false;
    this.enabled = true;

    window.addEventListener('keydown', (e) => this.onKeyDown(e), { passive: false });
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.clear());
  }

  onKeyDown(e) {
    // keep browser from scrolling the page
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    if (!this.enabled) return;
    this.down.add(e.code);
    this.pressed.add(e.code);
    this.anyPressed = true;
  }

  onKeyUp(e) {
    this.down.delete(e.code);
    this.released.add(e.code);
  }

  pressMouse(button) {
    if (!this.enabled) return;
    const code = `Mouse${button}`;
    if (!this.down.has(code)) this.pressed.add(code);
    this.down.add(code);
    this.anyPressed = true;
  }

  releaseMouse(button) {
    const code = `Mouse${button}`;
    if (this.down.delete(code)) this.released.add(code);
  }

  clear() {
    this.down.clear();
    this.pressed.clear();
    this.released.clear();
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.anyPressed = false;
  }

  isDown(action) {
    if (!this.enabled) return false;
    const keys = KEYMAP[action];
    if (!keys) return false;
    return keys.some((k) => this.down.has(k));
  }

  justPressed(action) {
    if (!this.enabled) return false;
    const keys = KEYMAP[action];
    if (!keys) return false;
    return keys.some((k) => this.pressed.has(k));
  }

  justReleased(action) {
    const keys = KEYMAP[action];
    if (!keys) return false;
    return keys.some((k) => this.released.has(k));
  }

  axis() {
    let x = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    return x;
  }
}

export const input = new Input();
