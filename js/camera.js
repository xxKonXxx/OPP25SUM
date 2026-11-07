/* =========================================================
   camera.js — smooth follow, look-ahead, shake, boss lock
   ========================================================= */

import { VIEW_W, VIEW_H, TILE } from './config.js';
import { clamp, lerp } from './utils.js';

export class Camera {
  constructor(level) {
    this.level = level;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.lock = null;
    this.lookAhead = 0;
    this.freeze = false;
    this.fade = 0;
  }

  setLevel(level) {
    this.level = level;
    this.lock = null;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  snapTo(x, y) {
    const maxX = Math.max(0, this.level.w * TILE - VIEW_W);
    const maxY = Math.max(0, this.level.h * TILE - VIEW_H);
    this.x = clamp(x - VIEW_W / 2, 0, maxX);
    this.y = clamp(y - VIEW_H * 0.62, 0, maxY);
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(dt, target, opts = {}) {
    if (!this.level) return;
    const dir = target.facing || 1;
    const speed = Math.abs(target.vx || 0);
    const look = opts.lookAhead ?? (speed > 30 ? dir * Math.min(48, speed * 0.35) : 0);
    this.lookAhead = lerp(this.lookAhead, look, 1 - Math.pow(0.001, dt));

    let desiredX = target.x + target.w / 2 + this.lookAhead - VIEW_W / 2;
    let desiredY = target.y + target.h / 2 - VIEW_H * 0.60;

    if (this.lock) {
      const { x1, x2, y1, y2 } = this.lock;
      const minX = x1;
      const maxX = Math.max(minX, x2 - VIEW_W);
      desiredX = clamp(desiredX, minX, maxX);
      if (y1 !== undefined) {
        const minY = y1;
        const maxY = Math.max(minY, y2 - VIEW_H);
        desiredY = clamp(desiredY, minY, maxY);
      }
    }

    const maxX = Math.max(0, this.level.w * TILE - VIEW_W);
    const maxY = Math.max(0, this.level.h * TILE - VIEW_H);
    desiredX = clamp(desiredX, 0, maxX);
    desiredY = clamp(desiredY, 0, maxY);

    const sx = 1 - Math.pow(0.0001, dt);
    const sy = 1 - Math.pow(0.004, dt);
    this.x = lerp(this.x, desiredX, this.lock ? Math.min(1, sx * 2) : sx);
    this.y = lerp(this.y, desiredY, sy);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 26);
      const m = this.shake;
      this.shakeX = (Math.random() * 2 - 1) * m;
      this.shakeY = (Math.random() * 2 - 1) * m;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  addShake(mag) {
    this.shake = Math.min(14, this.shake + mag);
  }

  apply(ctx) {
    ctx.translate(-Math.round(this.x + this.shakeX), -Math.round(this.y + this.shakeY));
  }

  get offsetX() { return Math.round(this.x + this.shakeX); }
  get offsetY() { return Math.round(this.y + this.shakeY); }

  worldToScreen(x, y) {
    return { x: x - this.x - this.shakeX, y: y - this.y - this.shakeY };
  }

  isVisible(x, y, w = 0, h = 0, pad = 40) {
    return x + w > this.x - pad && x < this.x + VIEW_W + pad &&
           y + h > this.y - pad && y < this.y + VIEW_H + pad;
  }
}
