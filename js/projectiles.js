/* =========================================================
   projectiles.js — spawn, travel, collide, draw
   ========================================================= */

import { TILE } from './config.js';
import { tileAt, isSolidAt } from './physics.js';
import { drawProjectile } from './propsart.js';
import { rectsOverlap, sign, rand } from './utils.js';

const ANIM_TYPES = new Set(['slash', 'kick', 'thunder', 'fist']);

export class ProjectileSystem {
  constructor(game) {
    this.game = game;
    this.list = [];
  }

  clear() {
    this.list.length = 0;
  }

  spawn(opts = {}) {
    const type = opts.type || 'fist';
    const p = {
      type,
      x: opts.x || 0,
      y: opts.y || 0,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      w: opts.w ?? 8,
      h: opts.h ?? 8,
      damage: opts.damage ?? 1,
      friendly: opts.friendly !== false,
      life: opts.life ?? 1.2,
      maxLife: opts.life ?? 1.2,
      gravity: opts.gravity || 0,
      pierce: Boolean(opts.pierce),
      rot: opts.rot || 0,
      spin: opts.spin || 0,
      facing: opts.facing || (opts.vx < 0 ? -1 : 1),
      t: 0,
      hit: new Set(),
      explodeRadius: opts.explodeRadius || 0,
      knock: opts.knock ?? 90,
      trail: opts.trail || null,
    };
    if (ANIM_TYPES.has(type) && !opts.life) {
      const speed = Math.max(1, Math.hypot(p.vx, p.vy));
      const range = opts.range || 100;
      p.life = Math.max(0.09, range / speed);
      p.maxLife = p.life;
    }
    this.list.push(p);
    return p;
  }

  update(dt) {
    const game = this.game;
    const level = game.level;
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt;
      p.life -= dt;
      p.rot += p.spin * dt;
      if (p.gravity) p.vy += p.gravity * dt;

      const speed = Math.hypot(p.vx, p.vy);
      const steps = Math.max(1, Math.min(10, Math.ceil((speed * dt) / 6)));
      let dead = false;

      for (let s = 0; s < steps && !dead; s++) {
        p.x += (p.vx * dt) / steps;
        p.y += (p.vy * dt) / steps;

        if (p.trail && Math.random() < 0.55) {
          game.particle({
            x: p.x + rand(-2, 2), y: p.y + rand(-2, 2),
            vx: rand(-12, 12), vy: rand(-16, 4),
            life: rand(0.18, 0.38), size: rand(1, 2.2),
            color: p.trail, gravity: -20, kind: 'spark',
          });
        }

        // --- terrain ---
        const tx = Math.floor(p.x / TILE);
        const ty = Math.floor(p.y / TILE);
        if (isSolidAt(level, tx, ty)) {
          if (p.type === 'meteor') {
            game.explode(p.x, p.y, p.explodeRadius || 30, p.damage, true);
          } else if (p.type === 'wave' || p.type === 'sand') {
            game.burst(p.x, p.y, p.type === 'sand' ? '#e6c078' : '#ff8a3c', 6, 60);
          }
          dead = true;
          break;
        }
        if (p.x < -60 || p.x > level.w * TILE + 60 ||
            p.y < -100 || p.y > level.h * TILE + 120) {
          dead = true;
          break;
        }

        // --- breakables (friendly attacks shatter crates) ---
        if (p.friendly) {
          for (const obj of game.breakables) {
            if (obj.broken || !rectsOverlap(p, obj)) continue;
            game.bumpObject(obj, true);
            if (!p.pierce) { dead = true; break; }
          }
          if (dead) break;
        }

        // --- targets ---
        if (p.friendly) {
          for (const e of game.enemies) {
            if (e.dead || p.hit.has(e.uid)) continue;
            if (!rectsOverlap(p, e.rect)) continue;
            p.hit.add(e.uid);
            e.hit(p.damage, sign(p.vx) || p.facing, 130);
            game.hitFeedback(p.x, p.y, e.x, e.y);
            if (!p.pierce) { dead = true; break; }
          }
          if (dead) break;
          const boss = game.boss;
          if (boss && !boss.dead && !p.hit.has('boss') && boss.hitTest(p)) {
            p.hit.add('boss');
            boss.hit(p.damage, sign(p.vx) || p.facing);
            game.hitFeedback(p.x, p.y, boss.x, boss.y - 20);
            if (!p.pierce) dead = true;
          }
        } else {
          const player = game.player;
          if (player && !player.dead && player.invuln <= 0 && rectsOverlap(p, player.rect)) {
            game.hurtPlayer(p.damage, p.x);
            game.hitFeedback(p.x, p.y, player.x + player.w / 2, player.y + player.h / 2);
            dead = true;
          }
        }
      }

      if (dead || p.life <= 0) list.splice(i, 1);
    }
  }

  draw(ctx) {
    const cam = this.game.camera;
    for (const p of this.list) {
      if (!cam.isVisible(p.x, p.y, 8, 8, 40)) continue;
      drawProjectile(ctx, p, this.game.time);
    }
  }
}
