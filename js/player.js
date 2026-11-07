/* =========================================================
   player.js — movement, abilities, damage, rendering
   ========================================================= */

import { PHYS, ABILITIES, CHARACTERS, TILE } from './config.js';
import { moveBody, hazardAt, waterAt } from './physics.js';
import { drawCharacter } from './sprites.js';
import { clamp, sign, approach, rand } from './utils.js';

export const MAX_HEARTS = 5;

export class Player {
  constructor(game, charId) {
    this.game = game;
    this.charId = CHARACTERS.some((c) => c.id === charId) ? charId : 'luffy';
    this.char = CHARACTERS.find((c) => c.id === this.charId);
    this.stats = this.char.stats;
    this.w = 10;
    this.h = 22;
    this.maxHearts = MAX_HEARTS;
    this.hearts = MAX_HEARTS;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.jumpsLeft = 1;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.swimming = false;
    this.dead = false;
    this.frozen = false;
    this.state = 'idle';
    this.animT = 0;
    this.invuln = 0;
    this.hurtT = 0;
    this.attackT = 0;
    this.dashT = 0;
    this.dashCd = 0;
    this.basicCd = 0;
    this.buffCd = 0;
    this.specialCd = 0;
    this.buffT = 0;
    this.buffMax = 0;
    this.dashHits = new Set();
    this.ridingMover = null;
    this.quicksand = false;
    this.stepT = 0;
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  get cx() { return this.x + this.w / 2; }
  get feet() { return this.y + this.h; }

  reset(spawn, fullHeal = true) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.jumpsLeft = 1;
    this.dead = false;
    this.frozen = false;
    this.invuln = 1.4;
    this.hurtT = 0;
    this.attackT = 0;
    this.dashT = 0;
    this.dashCd = 0;
    this.basicCd = 0;
    this.buffCd = 0;
    this.specialCd = 0;
    this.buffT = 0;
    this.state = 'idle';
    this.ridingMover = null;
    if (fullHeal) this.hearts = this.maxHearts;
  }

  addHearts(n) {
    this.hearts = clamp(this.hearts + n, 0, this.maxHearts);
  }

  update(dt) {
    if (this.dead || this.frozen) return;
    const game = this.game;
    const input = game.input;
    const level = game.level;

    this.animT += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.attackT = Math.max(0, this.attackT - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.basicCd = Math.max(0, this.basicCd - dt);
    this.buffCd = Math.max(0, this.buffCd - dt);
    this.specialCd = Math.max(0, this.specialCd - dt);
    if (this.buffT > 0) {
      this.buffT = Math.max(0, this.buffT - dt);
      if (Math.random() < dt * 22) {
        game.particle({
          x: this.cx + rand(-6, 6), y: this.y + rand(2, this.h),
          vx: rand(-8, 8), vy: rand(-34, -14), life: rand(0.3, 0.6),
          size: rand(1, 2.4), color: this.char.abilities.buff.tint,
          gravity: -12, kind: 'steam',
        });
      }
    }

    const water = waterAt(level, this);
    this.swimming = water;
    const axis = input.axis();
    const sprint = input.isDown('sprint');
    const buffDef = this.char.abilities.buff;
    let maxSpeed = PHYS.maxSpeed * this.stats.speed;
    if (sprint) maxSpeed *= PHYS.sprintMul;
    if (this.buffT > 0) maxSpeed *= buffDef.speed;
    if (water) maxSpeed *= 0.66;
    if (this.quicksand) maxSpeed *= 0.55;

    if (this.dashT <= 0) {
      const accel = this.grounded ? PHYS.accel : PHYS.airAccel;
      const target = axis * maxSpeed;
      if (axis !== 0) {
        this.vx = approach(this.vx, target, accel * dt);
        this.facing = axis;
      } else {
        this.vx = approach(this.vx, 0, (this.grounded ? PHYS.friction : PHYS.friction * 0.55) * dt);
      }
    }

    // buff / special
    if (input.justPressed('buff') && this.buffCd <= 0 && this.dashT <= 0) {
      this.buffT = buffDef.duration;
      this.buffMax = buffDef.duration;
      this.buffCd = ABILITIES.buff.cooldown;
      game.audio.sfx('gear');
      game.camera.addShake(3);
      game.burst(this.cx, this.y + this.h * 0.5, buffDef.tint, 22, 90);
      game.floatingText(buffDef.name, this.cx, this.y - 12, buffDef.tint);
    }
    if (input.justPressed('special') && this.specialCd <= 0) {
      this.specialCd = ABILITIES.special.cooldown;
      this.attackT = 0.45;
      this.invuln = Math.max(this.invuln, 0.35);
      game.specialAttack(this);
    }

    // dash
    if (input.justPressed('dash') && this.dashCd <= 0 && this.dashT <= 0) {
      const dashDef = this.char.abilities.dash;
      this.dashT = dashDef.duration;
      this.dashCd = ABILITIES.dash.cooldown;
      this.vx = this.facing * dashDef.speed;
      this.vy = 0;
      this.dashHits.clear();
      this.invuln = Math.max(this.invuln, 0.22);
      game.audio.sfx('dash');
      game.camera.addShake(2);
      game.burst(this.cx - this.facing * 8, this.y + this.h * 0.5, '#ffffff', 8, 50);
    }

    // basic attack
    if ((input.justPressed('attack') || input.isDown('attack')) && this.basicCd <= 0 && this.dashT <= 0) {
      this.basicAttack();
    }

    // jumping
    if (input.justPressed('jump')) this.jumpBuf = PHYS.jumpBuffer;
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    if (this.grounded || water) this.coyote = PHYS.coyote;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (water) {
      this.vy = Math.min(PHYS.swimMaxFall, this.vy + PHYS.swimGravity * dt);
      if (input.justPressed('jump')) {
        this.vy = -PHYS.swimStroke;
        game.audio.sfx('splash');
        game.burst(this.cx, this.y + 6, '#bfeaff', 7, 45);
      }
      if (Math.random() < dt * 3) {
        game.particle({
          x: this.cx + rand(-6, 6), y: this.y + rand(0, this.h),
          vx: 0, vy: -12, life: 0.5, size: 1.4, color: '#cfefff', kind: 'bubble',
        });
      }
    } else if (this.dashT <= 0) {
      this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt);
    }

    if (!water && this.jumpBuf > 0 && this.dashT <= 0) {
      if (this.grounded || this.coyote > 0) {
        this.vy = -PHYS.jumpVel * this.stats.jump;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.jumpsLeft = 1;
        game.audio.sfx('jump');
        game.save.stats.jumps++;
        game.dust(this.cx, this.y + this.h, 5);
      } else if (this.jumpsLeft > 0) {
        this.vy = -PHYS.doubleJumpVel * this.stats.jump;
        this.jumpsLeft = 0;
        this.jumpBuf = 0;
        game.audio.sfx('doubleJump');
        game.save.stats.jumps++;
        game.burst(this.cx, this.y + this.h - 2, '#ffffff', 8, 55);
      }
    }
    if (input.justReleased('jump') && this.vy < 0) this.vy *= PHYS.jumpCut;

    // dash motion
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.facing * this.char.abilities.dash.speed;
      this.vy = 0;
      this.dashDamage();
    }

    const fallSpeed = this.vy;
    const body = {
      x: this.x, y: this.y, w: this.w, h: this.h,
      vx: this.vx, vy: this.vy,
    };
    moveBody(level, body, dt, {
      solids: game.solids,
      oneWay: true,
      onObjectCollide: (obj, side) => {
        if (side === 'bottom') game.bumpObject(obj, true);
      },
    });
    this.x = body.x;
    this.y = body.y;
    this.vx = body.vx;
    this.vy = body.vy;
    this.grounded = body.grounded;

    if (body.landed) {
      this.jumpsLeft = 1;
      if (fallSpeed > 160) game.dust(this.cx, this.y + this.h, 6);
    }

    // moving platforms
    this.ridingMover = null;
    if (this.vy >= 0) {
      for (const m of game.movers) {
        if (this.x + this.w > m.x + 2 && this.x < m.x + m.w - 2 &&
            Math.abs(this.y + this.h - m.y) <= 6) {
          this.y = m.y - this.h;
          this.vy = 0;
          this.grounded = true;
          this.jumpsLeft = 1;
          this.ridingMover = m;
          break;
        }
      }
    }

    // keep inside level / arena
    this.x = clamp(this.x, 0, level.w * TILE - this.w);
    if (game.boss && !game.boss.dead) {
      const minX = level.boss.arenaX1 + 6;
      if (this.x < minX) { this.x = minX; this.vx = Math.max(0, this.vx); }
    }

    // hazards
    this.quicksand = false;
    const hz = hazardAt(level, this);
    if (hz === 'spike') {
      this.vy = Math.min(this.vy, -240);
      game.hurtPlayer(1, this.cx + this.facing * 8);
    } else if (hz === 'lava') {
      game.killPlayer('lava');
      return;
    } else if (hz === 'quicksand') {
      this.quicksand = true;
      this.vx *= 0.9;
      this.vy = Math.min(this.vy + 90 * dt, 34);
      if (Math.random() < dt * 5) {
        game.particle({
          x: this.cx + rand(-6, 6), y: this.y + this.h - 2,
          vx: rand(-8, 8), vy: rand(-8, 2), life: 0.4, size: 1.6,
          color: '#e6c078', kind: 'sand',
        });
      }
    }

    if (this.y > level.h * TILE + 60) {
      game.killPlayer('fall');
      return;
    }

    // animation state
    if (this.hurtT > 0) this.state = 'hurt';
    else if (this.dashT > 0) this.state = 'dash';
    else if (water) this.state = 'swim';
    else if (!this.grounded) this.state = this.vy < -30 ? 'jump' : 'fall';
    else if (this.attackT > 0) this.state = 'attack';
    else if (Math.abs(this.vx) > 12) {
      this.state = 'run';
      this.stepT += dt;
      if (this.stepT > 0.22) {
        this.stepT = 0;
        if (Math.random() < 0.45) game.dust(this.cx - this.facing * 4, this.y + this.h, 1);
      }
    } else this.state = 'idle';
  }

  basicAttack() {
    const game = this.game;
    const def = this.char.abilities.basic;
    const buffMul = this.buffT > 0 ? this.char.abilities.buff.damage : 1;
    this.basicCd = ABILITIES.basic.cooldown;
    this.attackT = 0.16;
    const sx = this.cx + this.facing * 9;
    const sy = this.y + this.h * 0.42;
    game.projectiles.spawn({
      type: def.type,
      x: sx, y: sy,
      vx: this.facing * def.speed, vy: 0,
      w: 10, h: 8,
      damage: def.damage * this.stats.power * buffMul,
      friendly: true,
      life: Math.max(0.09, def.range / def.speed),
      range: def.range,
      facing: this.facing,
      spin: def.type === 'slash' ? 18 : 0,
      trail: def.type === 'thunder' ? '#7ce7ff' : null,
    });
    game.audio.sfx(def.type === 'thunder' ? 'thunder' : 'shoot');
    game.burst(sx, sy, def.type === 'fist' ? '#ffe6c8' : this.char.colors.accent, 5, 40);
    game.camera.addShake(0.7);
  }

  dashDamage() {
    const game = this.game;
    const dmg = this.char.abilities.dash.damage * this.stats.power *
      (this.buffT > 0 ? this.char.abilities.buff.damage : 1);
    for (const e of game.enemies) {
      if (e.dead || this.dashHits.has(e.uid)) continue;
      if (!game.rectHit(this.rect, e.rect)) continue;
      this.dashHits.add(e.uid);
      e.hit(dmg, this.facing, 190);
      game.hitFeedback(this.cx, this.y + this.h / 2, e.x, e.y);
    }
    const boss = game.boss;
    if (boss && !boss.dead && !this.dashHits.has('boss') && boss.hitTest(this.rect)) {
      this.dashHits.add('boss');
      boss.hit(dmg, this.facing);
      game.hitFeedback(this.cx, this.y + this.h / 2, boss.x, boss.y - 20);
    }
    for (const obj of game.breakables) {
      if (obj.broken || !game.rectHit(this.rect, obj)) continue;
      game.bumpObject(obj, true);
    }
  }

  takeDamage(dmg, sourceX) {
    if (this.dead || this.invuln > 0) return false;
    this.hearts -= dmg;
    this.invuln = 1.35;
    this.hurtT = 0.4;
    this.buffT = 0;
    const dir = sign(this.cx - sourceX) || -this.facing;
    this.vx = dir * 165;
    this.vy = -210;
    this.grounded = false;
    this.game.audio.sfx('hurt');
    this.game.camera.addShake(4);
    this.game.burst(this.cx, this.y + this.h * 0.4, '#e63946', 10, 90);
    return true;
  }

  draw(ctx) {
    if (this.dead && this.hurtT <= 0) return;
    const cx = this.cx;
    const feet = this.y + this.h;
    let alpha = 1;
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 18) % 2 === 0) alpha = 0.45;
    if (this.dead) alpha = Math.max(0, this.hurtT / 0.4);

    if (this.buffT > 0 && !this.dead) {
      const tint = this.char.abilities.buff.tint;
      const g = ctx.createRadialGradient(cx, this.y + this.h * 0.55, 2, cx, this.y + this.h * 0.55, 22);
      g.addColorStop(0, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(255,90,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 24, this.y - 8, 48, 44);
      ctx.strokeStyle = tint;
      ctx.globalAlpha = 0.35 + Math.sin(this.animT * 12) * 0.12;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, feet - 2, 13, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    drawCharacter(ctx, this.charId, cx, feet, this.facing, this.state, this.animT, {
      scale: 0.98,
      alpha,
      swim: this.swimming,
    });
  }
}
