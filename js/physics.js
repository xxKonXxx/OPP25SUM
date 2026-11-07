/* =========================================================
   physics.js — tile collision, solid objects, grounding
   ========================================================= */

import { TILE, VIEW_W, VIEW_H } from './config.js';
import { clamp } from './utils.js';

export const SOLID_IDS = new Set([1, 2, 3]);
export const ONEWAY_ID = 4;
export const SPIKE_ID = 5;
export const WATER_ID = 6;
export const LAVA_ID = 7;
export const QUICKSAND_ID = 8;

export function tileIdAt(level, tx, ty) {
  if (tx < 0 || tx >= level.w || ty < 0 || ty >= level.h) return 0;
  return level.tiles[ty * level.w + tx];
}

export function tileAt(level, px, py) {
  return tileIdAt(level, Math.floor(px / TILE), Math.floor(py / TILE));
}

export function isSolidAt(level, tx, ty) {
  const id = tileIdAt(level, tx, ty);
  return id === 1 || id === 2 || id === 3;
}

export function isSolidPx(level, px, py) {
  return isSolidAt(level, Math.floor(px / TILE), Math.floor(py / TILE));
}

/* gathers tiles overlapping a rect; callback(tx,ty,id) */
export function forEachTile(level, x, y, w, h, cb) {
  const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.001) / TILE);
  const y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.001) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const id = tileIdAt(level, tx, ty);
      if (id) cb(tx, ty, id);
    }
  }
}

/* tries to move a body {x,y,w,h,vx,vy} through the level */
export function moveBody(level, body, dt, opts = {}) {
  const solids = opts.solids || [];
  const prevBottom = body.y + body.h;
  body.hitWall = 0;
  body.hitCeiling = false;
  body.landed = false;
  body.onOneWay = false;

  // ---------------- X ----------------
  let dx = body.vx * dt;
  if (Math.abs(dx) > 0) {
    const steps = Math.max(1, Math.ceil(Math.abs(dx) / 6));
    const stepDx = dx / steps;
    for (let s = 0; s < steps; s++) {
      body.x += stepDx;
      // tiles
      let pushX = null;
      forEachTile(level, body.x, body.y + 2, body.w, body.h - 4, (tx, ty, id) => {
        if (!SOLID_IDS.has(id)) return;
        if (pushX === null) pushX = tx;
        else if (stepDx > 0) pushX = Math.min(pushX, tx);
        else pushX = Math.max(pushX, tx);
      });
      if (pushX !== null) {
        if (stepDx > 0) body.x = pushX * TILE - body.w;
        else body.x = (pushX + 1) * TILE;
        body.vx = 0;
        body.hitWall = Math.sign(stepDx) || 1;
        break;
      }
      // solid objects
      for (const obj of solids) {
        if (!obj.solid || obj.broken) continue;
        if (!rectsOverlap(body, obj)) continue;
        if (stepDx > 0) body.x = obj.x - body.w;
        else body.x = obj.x + obj.w;
        body.vx = 0;
        body.hitWall = Math.sign(stepDx) || 1;
        if (opts.onObjectCollide) opts.onObjectCollide(obj, 'side');
        break;
      }
    }
  }

  // ---------------- Y ----------------
  let dy = body.vy * dt;
  body.grounded = false;
  if (Math.abs(dy) > 0) {
    const steps = Math.max(1, Math.ceil(Math.abs(dy) / 6));
    const stepDy = dy / steps;
    for (let s = 0; s < steps; s++) {
      body.y += stepDy;
      let landY = null;
      let ceilY = null;

      forEachTile(level, body.x + 1, body.y, body.w - 2, body.h, (tx, ty, id) => {
        const top = ty * TILE;
        if (id === 3 || id === 2 || id === 1) {
          if (stepDy > 0) {
            if (landY === null || top < landY * TILE) landY = ty;
          } else if (stepDy < 0) {
            if (ceilY === null || top > ceilY * TILE) ceilY = ty;
          }
        } else if (id === ONEWAY_ID && stepDy > 0 && opts.oneWay !== false) {
          const prevB = body.y + body.h - stepDy;
          if (prevB <= top + 1.2) {
            if (landY === null || top < landY * TILE) landY = ty;
          }
        }
      });

      if (landY !== null) {
        body.y = landY * TILE - body.h;
        if (body.vy > 0) body.landed = true;
        body.vy = 0;
        body.grounded = true;
        break;
      }
      if (ceilY !== null) {
        body.y = (ceilY + 1) * TILE;
        body.vy = 0;
        body.hitCeiling = true;
        break;
      }

      // solid objects
      let hitObj = false;
      for (const obj of solids) {
        if (!obj.solid || obj.broken) continue;
        if (!rectsOverlap(body, obj)) continue;
        if (stepDy > 0) {
          body.y = obj.y - body.h;
          body.vy = 0;
          body.grounded = true;
          body.landed = true;
          if (opts.onObjectCollide) opts.onObjectCollide(obj, 'top');
        } else {
          body.y = obj.y + obj.h;
          body.vy = 0;
          body.hitCeiling = true;
          if (opts.onObjectCollide) opts.onObjectCollide(obj, 'bottom');
        }
        hitObj = true;
        break;
      }
      if (hitObj) break;
    }
  }

  // final grounded check (one pixel below)
  if (!body.grounded && body.vy >= 0) {
    const testY = body.y + body.h + 1;
    let found = false;
    forEachTile(level, body.x + 1, testY, body.w - 2, 1, (tx, ty, id) => {
      if (SOLID_IDS.has(id) || id === ONEWAY_ID) found = true;
    });
    // do not count one-way if feet substantially below the platform surface
    if (found) {
      forEachTile(level, body.x + 1, testY, body.w - 2, 1, (tx, ty, id) => {
        if (id === ONEWAY_ID) {
          const top = ty * TILE;
          if (body.y + body.h > top + 4) found = false;
        }
      });
    }
    body.grounded = found;
  }

  // object standing check
  if (!body.grounded) {
    for (const obj of solids) {
      if (!obj.solid || obj.broken) continue;
      if (body.x + body.w > obj.x + 1 && body.x < obj.x + obj.w - 1 &&
          Math.abs(body.y + body.h - obj.y) <= 2 && body.vy >= 0) {
        body.grounded = true;
        break;
      }
    }
  }

  body.prevBottom = prevBottom;
  return body;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* hazard tiles under the body */
export function hazardAt(level, body) {
  let result = null;
  forEachTile(level, body.x + 2, body.y + 2, body.w - 4, body.h - 4, (tx, ty, id) => {
    if (id === SPIKE_ID) result = 'spike';
    else if (id === LAVA_ID) result = 'lava';
    else if (id === QUICKSAND_ID && !result) result = 'quicksand';
  });
  return result;
}

export function waterAt(level, body) {
  let wet = false;
  forEachTile(level, body.x + 3, body.y + body.h * 0.4, body.w - 6, body.h * 0.6, (tx, ty, id) => {
    if (id === WATER_ID) wet = true;
  });
  return wet;
}

export function submergedAt(level, x, y) {
  return tileAt(level, x, y) === WATER_ID;
}

/* clamp helper for bodies */
export function clampBodyX(body, level) {
  body.x = clamp(body.x, 0, level.w * TILE - body.w);
}

export { TILE, VIEW_W, VIEW_H };
