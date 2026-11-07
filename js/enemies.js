/* =========================================================
   enemies.js — patrol AI, ranged troops, bosses
   ========================================================= */

import { BOSSES, PHYS, TILE } from './config.js';
import { drawMarine, drawPirate, drawGull, drawFishman, drawBandit, drawCP9, drawMagmaMarine } from './sprites.js';
import { drawBoss, drawBossAura } from './enemyart.js';
import { moveBody, tileAt } from './physics.js';
import { drawText } from './pixelfont.js';
import { clamp, sign, rand, dist } from './utils.js';

let UID = 1;

const TYPE_DEFS = {
  pirate: { hp: 2, speed: 32, contact: 1, w: 13, h: 21, art: drawPirate, drop: 0.55 },
  marine: { hp: 2, speed: 27, contact: 1, w: 13, h: 21, art: drawMarine, drop: 0.5, ranged: true },
  gull: { hp: 1, speed: 48, contact: 1, w: 14, h: 13, art: drawGull, fly: true, drop: 0.35 },
  fishman: { hp: 3, speed: 38, contact: 1, w: 15, h: 25, art: drawFishman, drop: 0.7, leap: true },
  bandit: { hp: 2, speed: 42, contact: 1, w: 13, h: 22, art: drawBandit, drop: 0.6, ranged: true, proj: 'knife' },
  cp9: { hp: 4, speed: 54, contact: 2, w: 13, h: 23, art: drawCP9, drop: 0.8, dasher: true },
  magma: { hp: 4, speed: 28, contact: 2, w: 14, h: 23, art: drawMagmaMarine, drop: 0.8, ranged: true, proj: 'magma' },
};

function solidOrLedge(id) {
  return id === 1 || id === 2 || id === 3 || id === 4;
}

export class Enemy {
  constructor(game, type, tx, row, opts = {}) {
    const def = TYPE_DEFS[type] || TYPE_DEFS.pirate;
    this.uid = UID++;
    this.game = game;
    this.type = type;
    this.def = def;
    this.w = def.w;
    this.h = def.h;
    this.x = tx * TILE + 8;
    this.y = row * TILE;
    this.spawnX = this.x;
    this.spawnY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = opts.dir || -1;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.grounded = false;
    this.dead = false;
    this.deadT = 0;
    this.flash = 0;
    this.hurtT = 0;
    this.animT = Math.random() * 4;
    this.seed = Math.random() * 10;
    this.cool = rand(0.5, 1.6);
    this.aimT = 0;
    this.muzzle = 0;
    this.dashT = 0;
    this.dashCool = rand(1.4, 3);
    this.state = 'idle';
  }

  get rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  turn() {
    this.facing *= -1;
    this.vx = 0;
  }

  update(dt) {
    if (this.dead) {
      this.deadT += dt;
      if (this.deadT > 0.6) this.remove = true;
      return;
    }
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.muzzle = Math.max(0, this.muzzle - dt * 4);
    this.cool -= dt;
    this.dashCool -= dt;

    if (this.def.fly) {
      this.updateFlyer(dt);
      return;
    }

    const game = this.game;
    const player = game.player;

    if (this.hurtT <= 0) {
      this.think(dt, player);
    }

    // gravity + tile collision
    this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt);
    const body = {
      x: this.x - this.w / 2, y: this.y - this.h,
      w: this.w, h: this.h, vx: this.vx, vy: this.vy,
    };
    moveBody(game.level, body, dt, { solids: game.solids, oneWay: true });
    this.x = body.x + this.w / 2;
    this.y = body.y + this.h;
    this.vx = body.vx;
    this.vy = body.vy;
    this.grounded = body.grounded;

    if (body.hitWall) this.turn();
    if (this.y > game.level.h * TILE + 80) this.dead = true;

    // contact damage
    if (player && !player.dead && this.rect && game.rectHit(this.rect, player.rect)) {
      game.hurtPlayer(this.def.contact, this.x);
    }
  }

  think(dt, player) {
    const speed = this.def.speed;
    let sees = false;
    let dx = 0;
    if (player && !player.dead) {
      dx = player.x + player.w / 2 - this.x;
      const dy = player.y + player.h / 2 - (this.y - this.h / 2);
      sees = Math.abs(dx) < 170 && Math.abs(dy) < 54;
      if (sees) this.facing = sign(dx) || this.facing;
    }

    // ranged troops stop and aim
    if (this.def.ranged && sees) {
      this.state = this.aimT > 0 ? 'shoot' : 'aim';
      this.vx = 0;
      if (this.aimT > 0) {
        this.aimT -= dt;
        if (this.aimT <= 0) this.fire(player);
      } else if (this.cool <= 0) {
        this.aimT = 0.45;
        this.cool = 2.1 + rand(0, 0.8);
      }
      return;
    }

    // CP9 lunges
    if (this.def.dasher) {
      if (sees && this.dashCool <= 0 && Math.abs(dx) > 26 && Math.abs(dx) < 130) {
        this.dashT = 0.32;
        this.dashCool = rand(2.2, 3.4);
        this.vx = sign(dx) * 235;
        this.state = 'attack';
        this.game.audio.sfx('dash');
        return;
      }
      if (this.dashT > 0) {
        this.dashT -= dt;
        this.vx = this.facing * 235;
        this.state = 'attack';
        return;
      }
    }

    // fishmen hop at the player
    if (this.def.leap && sees && this.grounded && Math.abs(dx) < 90 && this.cool <= 0) {
      this.vy = -300;
      this.vx = sign(dx) * 90;
      this.cool = rand(2.4, 3.6);
      this.state = 'jump';
      return;
    }

    this.state = 'walk';
    this.vx = this.facing * speed;

    if (this.grounded) {
      const aheadX = this.x + this.facing * (this.w / 2 + 3);
      const foot = tileAt(this.game.level, aheadX, this.y + 4);
      const mid = tileAt(this.game.level, aheadX, this.y - this.h * 0.55);
      const badFoot = !solidOrLedge(foot) || foot === 5;
      const wall = mid === 1 || mid === 2 || mid === 3;
      if (badFoot || wall) this.turn();
    }
  }

  fire(player) {
    const dir = sign(player.x + player.w / 2 - this.x) || this.facing;
    this.facing = dir;
    const sx = this.x + dir * (this.w / 2 + 4);
    const sy = this.y - this.h * 0.62;
    const targetY = player.y + player.h * 0.45;
    const type = this.def.proj || 'bullet';
    if (type === 'magma') {
      const a = Math.atan2(targetY - sy, player.x + player.w / 2 - sx);
      this.game.projectiles.spawn({
        type: 'magma', x: sx, y: sy,
        vx: Math.cos(a) * 165, vy: Math.sin(a) * 165,
        w: 9, h: 9, damage: 1, friendly: false, life: 2.4,
        trail: '#ff8a3c',
      });
      this.game.audio.sfx('shoot');
    } else if (type === 'knife') {
      this.game.projectiles.spawn({
        type: 'knife', x: sx, y: sy,
        vx: dir * 190, vy: (targetY - sy) * 0.55,
        w: 9, h: 5, damage: 1, friendly: false, life: 2,
        spin: 14 * dir,
      });
      this.game.audio.sfx('shoot');
    } else {
      this.game.projectiles.spawn({
        type: 'bullet', x: sx, y: sy,
        vx: dir * 205, vy: 0,
        w: 7, h: 4, damage: 1, friendly: false, life: 2.2,
        trail: '#ffe6a3',
      });
      this.game.audio.sfx('shoot');
    }
    this.muzzle = 1;
  }

  updateFlyer(dt) {
    const player = this.game.player;
    const speed = this.def.speed;
    this.y = this.spawnY + Math.sin(this.animT * 2 + this.seed) * 14;
    let targetX = null;
    if (player && !player.dead) {
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2 - 14;
      if (dist(this.x, this.y, px, py) < 150) {
        targetX = px;
        this.y += clamp(py - this.y, -24, 24) * dt * 1.4;
      }
    }
    if (targetX === null) {
      if (Math.abs(this.x - this.spawnX) > 78) this.facing = sign(this.spawnX - this.x) || 1;
      this.x += this.facing * speed * dt;
    } else {
      this.facing = sign(targetX - this.x) || this.facing;
      this.x += this.facing * speed * 1.15 * dt;
    }
    this.x = clamp(this.x, 8, this.game.level.w * TILE - 8);
    const wall = tileAt(this.game.level, this.x + this.facing * 8, this.y - 4);
    if (wall === 1 || wall === 2 || wall === 3) this.facing *= -1;
    this.state = 'fly';

    if (player && !player.dead && this.game.rectHit(this.rect, player.rect)) {
      this.game.hurtPlayer(this.def.contact, this.x);
    }
  }

  hit(dmg, dir, knock = 140) {
    if (this.dead) return;
    this.hp -= dmg;
    this.flash = 0.22;
    this.hurtT = 0.26;
    this.vx = dir * knock;
    if (this.grounded && !this.def.fly) this.vy = -80;
    this.aimT = 0;
    this.game.audio.sfx('hit');
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 0;
    this.game.onEnemyKilled(this);
  }

  draw(ctx) {
    if (this.dead && this.deadT > 0.6) return;
    const alpha = this.dead ? Math.max(0, 1 - this.deadT / 0.6) : 1;
    const opts = {
      state: this.state,
      muzzle: this.muzzle,
      scale: this.type === 'fishman' ? 1.1 : this.type === 'magma' ? 1.04 : 1,
    };
    ctx.save();
    if (this.flash > 0) {
      ctx.globalAlpha = Math.sin(this.flash * 70) > 0 ? 0.55 : 1;
    } else if (alpha < 1) {
      ctx.globalAlpha = alpha;
    }
    if (this.dead) {
      ctx.translate(0, 3);
      ctx.rotate(0.25 * this.facing);
    }
    this.def.art(ctx, this.x, this.y, this.facing, this.animT, opts);
    ctx.restore();

    // small health bar for tough foes
    const r = this.rect;
    if (!this.dead && this.hp < this.maxHp) {
      const w = 16;
      ctx.fillStyle = 'rgba(10,14,20,0.65)';
      ctx.fillRect(r.x + r.w / 2 - w / 2, r.y - 6, w, 3);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(r.x + r.w / 2 - w / 2 + 0.5, r.y - 5.5, (w - 1) * (this.hp / this.maxHp), 2);
    }
  }
}

/* =========================================================
   BOSSES
   ========================================================= */
export class Boss {
  constructor(game, type) {
    const def = BOSSES[type];
    this.game = game;
    this.type = type;
    this.def = def;
    this.w = def.width;
    this.h = def.height;
    this.x = game.level.boss.spawnX;
    this.y = game.level.groundRow * TILE;
    this.groundY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.phase = 1;
    this.state = 'idle';
    this.animT = 0;
    this.flash = 0;
    this.hurtT = 0;
    this.hurtCd = 0;
    this.attackCd = 1.4;
    this.intro = 2.2;
    this.pattern = 0;
    this.dead = false;
    this.deathT = 0;
    this.grounded = true;
  }

  get arena() {
    return this.game.level.boss;
  }

  get rect() {
    return {
      x: this.x - this.w * 0.42,
      y: this.y - this.h,
      w: this.w * 0.84,
      h: this.h,
    };
  }

  hitTest(p) {
    return this.game.rectHit(p, this.rect);
  }

  update(dt) {
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    this.intro = Math.max(0, this.intro - dt);

    if (this.dead) {
      this.deathT += dt;
      this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt);
      this.y = Math.min(this.groundY, this.y + this.vy * dt);
      return;
    }
    if (this.intro > 0) {
      this.state = 'idle';
      return;
    }

    const game = this.game;
    const player = game.player;
    if (!player || player.dead) return;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - this.x;
    this.facing = sign(dx) || this.facing;

    // face + shuffle toward the player
    if (this.hurtT <= 0) {
      const range = 62;
      if (Math.abs(dx) > range) {
        this.vx = sign(dx) * (26 + this.phase * 9);
        this.state = 'walk';
      } else {
        this.vx *= 0.7;
        if (this.state !== 'attack' && this.state !== 'special') this.state = 'idle';
      }

      // occasional hop
      if (this.grounded && Math.random() < dt * (0.22 + this.phase * 0.12) && this.state !== 'attack') {
        this.vy = -300;
        this.grounded = false;
        this.state = 'jump';
      }

      this.attackCd -= dt;
      if (this.attackCd <= 0) {
        this.performAttack(player, px, py);
        this.attackCd = this.phase === 1 ? rand(1.55, 2.3) : rand(1.0, 1.65);
      }
    }

    // physics
    this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      if (!this.grounded) game.dust(this.x, this.y, 8);
      this.grounded = true;
    }
    const a = this.arena;
    this.x = clamp(this.x, a.arenaX1 + 34, a.arenaX2 - 30);

    // contact
    if (game.rectHit(this.rect, player.rect)) game.hurtPlayer(this.phase === 2 ? 2 : 1, this.x);
  }

  performAttack(player, px, py) {
    const game = this.game;
    const handY = this.y - this.h * 0.62;
    const handX = this.x + this.facing * this.w * 0.5;
    const aim = Math.atan2(py - handY, px - handX);
    this.pattern++;
    this.state = 'attack';

    switch (this.type) {
      case 'buggy': {
        if (this.pattern % 3 === 0) {
          this.charge(player);
        } else {
          for (let i = -1; i <= 1; i++) {
            const a = aim + i * 0.19;
            game.projectiles.spawn({
              type: 'knife', x: handX, y: handY,
              vx: Math.cos(a) * 195, vy: Math.sin(a) * 195,
              w: 10, h: 5, damage: 1, friendly: false, life: 2.4,
              spin: 16 * this.facing,
            });
          }
          game.audio.sfx('shoot');
        }
        break;
      }
      case 'morgan': {
        if (this.pattern % 2 === 0) {
          game.projectiles.spawn({
            type: 'axe', x: handX, y: handY,
            vx: this.facing * 185, vy: -235,
            w: 12, h: 12, damage: 1, friendly: false, life: 2.6,
            gravity: 430, spin: 11 * this.facing,
          });
          game.audio.sfx('cannon');
        } else {
          this.charge(player);
        }
        break;
      }
      case 'arlong': {
        if (this.pattern % 3 === 0) {
          this.vy = -360;
          this.grounded = false;
          this.state = 'jump';
        } else {
          for (let i = -1; i <= 1; i++) {
            const a = aim + i * 0.15;
            game.projectiles.spawn({
              type: 'water', x: handX, y: handY,
              vx: Math.cos(a) * 180, vy: Math.sin(a) * 180,
              w: 9, h: 9, damage: 1, friendly: false, life: 2.2,
              gravity: 150, trail: '#7ff0e2',
            });
          }
          game.audio.sfx('shoot');
        }
        break;
      }
      case 'crocodile': {
        if (this.pattern % 2 === 0) {
          for (let i = -1; i <= 1; i++) {
            game.projectiles.spawn({
              type: 'sand', x: px + i * 30, y: this.groundY - 2,
              vx: 0, vy: -300,
              w: 10, h: 14, damage: 1, friendly: false, life: 1.1,
              gravity: 240,
            });
          }
          game.audio.sfx('special');
        } else {
          game.projectiles.spawn({
            type: 'wave', x: this.x - this.facing * 20, y: this.groundY - 10,
            vx: this.facing * 145, vy: 0,
            w: 18, h: 18, damage: 1, friendly: false, life: 2.4,
            trail: '#e6c078',
          });
        }
        break;
      }
      case 'lucci': {
        if (this.pattern % 2 === 0) {
          for (let i = -1; i <= 1; i++) {
            game.projectiles.spawn({
              type: 'shigan', x: handX, y: handY + i * 10,
              vx: Math.cos(aim) * 285, vy: Math.sin(aim) * 285 + i * 14,
              w: 8, h: 4, damage: 1, friendly: false, life: 1.5,
            });
          }
          game.audio.sfx('shoot');
        } else {
          this.charge(player);
        }
        break;
      }
      case 'akainu': {
        if (this.pattern % 3 === 0) {
          game.projectiles.spawn({
            type: 'wave', x: this.x - this.facing * 30, y: this.groundY - 12,
            vx: this.facing * 160, vy: 0,
            w: 22, h: 22, damage: 2, friendly: false, life: 2.5,
            trail: '#ff8a3c',
          });
          game.audio.sfx('explosion');
        } else {
          for (let i = -1; i <= 1; i++) {
            game.projectiles.spawn({
              type: 'meteor', x: px + i * 38, y: game.camera.y - 30,
              vx: rand(-12, 12), vy: 80,
              w: 12, h: 12, damage: 1, friendly: false, life: 4,
              gravity: 330, explodeRadius: 30, trail: '#ff6b1a',
            });
          }
          game.audio.sfx('bossRoar');
        }
        break;
      }
      default: break;
    }
  }

  charge(player) {
    const dir = sign(player.x + player.w / 2 - this.x) || this.facing;
    this.vx = dir * 230;
    this.facing = dir;
    this.state = 'charge';
    this.game.audio.sfx('dash');
  }

  hit(dmg, dir) {
    if (this.dead || this.intro > 0) return;
    if (this.hurtCd > 0) return;
    this.hurtCd = 0.16;
    this.hp -= dmg;
    this.flash = 0.24;
    this.hurtT = 0.16;
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.game.camera.addShake(7);
      this.game.audio.sfx('bossRoar');
      this.game.burst(this.x, this.y - 20, '#ff6b35', 22, 130);
      this.game.floatingText('PHASE 2', this.x, this.y - 60, '#ff8a3c');
    }
    if (this.hp <= 0) {
      this.dead = true;
      this.deathT = 0;
      this.state = 'dead';
      this.game.onBossDefeated(this);
    } else {
      this.game.audio.sfx('hit');
    }
  }

  draw(ctx, time) {
    if (this.dead && this.deathT > 1.2) return;
    const alpha = this.dead ? Math.max(0.15, 1 - this.deathT / 1.2) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawBossAura(ctx, this, time);
    drawBoss(ctx, this, time);
    ctx.restore();
  }
}
