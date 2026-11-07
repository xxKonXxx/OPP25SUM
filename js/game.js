/* =========================================================
   game.js — boot, world simulation, HUD, progression
   ========================================================= */

import {
  VIEW_W, VIEW_H, TILE, WORLDS, CHARACTERS, BOSSES, ABILITIES, THEMES,
  DEFAULT_SAVE, DEFAULT_SETTINGS, SAVE_KEY, SETTINGS_KEY,
} from './config.js';
import { clamp, rand, dist, formatTime, loadJSON, saveJSON, deepMerge, withAlpha } from './utils.js';
import { drawText } from './pixelfont.js';
import { AudioEngine, musicForWorld } from './audio.js';
import { drawBackground, drawMenuScene, buildTerrain, drawWater, drawDecor } from './worldart.js';
import { drawCharacter } from './sprites.js';
import {
  drawObject, drawHeart, drawBerryIcon, drawAbilityIcon, drawLifeIcon, drawKeycap,
} from './propsart.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Enemy, Boss } from './enemies.js';
import { ProjectileSystem } from './projectiles.js';
import { getLevel, nextLevelId, worldComplete, isLevelUnlocked, nextObjective, LEVELS, totalCompletion, worldLevels } from './levels.js';
import { input } from './input.js';

export const LIVES = 3;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.input = input;
    this.save = this.loadSave();
    this.settings = this.loadSettings();
    this.audio = new AudioEngine(this.settings);

    this.ui = null;
    this.state = 'menu';
    this.time = 0;
    this.lastTs = 0;
    this.level = null;
    this.levelId = null;
    this.player = null;
    this.camera = null;
    this.enemies = [];
    this.boss = null;
    this.bossSpawned = false;
    this.projectiles = new ProjectileSystem(this);
    this.objects = [];
    this.breakables = [];
    this.movers = [];
    this.particles = [];
    this.texts = [];
    this.weather = [];
    this.terrainCache = new Map();
    this.terrain = null;
    this.lives = LIVES;
    this.levelTime = 0;
    this.runBerries = 0;
    this.runChests = 0;
    this.runKills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.flash = 0;
    this.hurtFlash = 0;
    this.deathTimer = 0;
    this.levelIntro = 0;
    this.bossIntro = 0;
    this.goalHintCd = 0;
    this.activeSign = null;
    this.saveTimer = 0;
    this._hurtFrame = false;
    this.pendingNext = null;
    this.refreshUnlocks(true);
    this.bindMouse(canvas);

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ---------------- mouse controls ---------------- */
  bindMouse(canvas) {
    const actionButton = (e) => e.button === 0 || e.button === 2;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'playing' || !actionButton(e)) return;
      e.preventDefault();
      this.input.pressMouse(e.button);
    });
    const release = (e) => {
      if (actionButton(e)) this.input.releaseMouse(e.button);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', (e) => {
      if (this.state === 'playing') e.preventDefault();
    });
  }

  /* ---------------- persistence ---------------- */
  loadSave() {
    const stored = loadJSON(SAVE_KEY, null);
    const base = DEFAULT_SAVE();
    const save = stored ? deepMerge(base, stored) : base;
    save.stats = { ...base.stats, ...(save.stats || {}) };
    save.levels = save.levels || {};
    save.characters = Array.isArray(save.characters) ? save.characters : ['luffy'];
    if (!save.characters.includes('luffy')) save.characters.unshift('luffy');
    save.unlockedWorlds = Array.isArray(save.unlockedWorlds) ? save.unlockedWorlds : [0];
    if (!save.character || !CHARACTERS.some((c) => c.id === save.character)) save.character = 'luffy';
    return save;
  }

  loadSettings() {
    return { ...DEFAULT_SETTINGS(), ...(loadJSON(SETTINGS_KEY, {}) || {}) };
  }

  writeSave() {
    saveJSON(SAVE_KEY, this.save);
  }

  writeSettings() {
    saveJSON(SETTINGS_KEY, this.settings);
  }

  applySettings() {
    this.writeSettings();
    this.audio.setSettings(this.settings);
    this.audio.setMuted(this.settings.master <= 0.001);
  }

  refreshUnlocks(silent = false) {
    const unlockChar = (id, cond) => {
      if (!cond || this.save.characters.includes(id)) return;
      this.save.characters.push(id);
      if (!silent) {
        const c = CHARACTERS.find((x) => x.id === id);
        this.ui?.toast(`${c?.name || id} UNLOCKED`, 'unlock');
        this.audio.sfx('power');
        this.floatingText(`${c?.name} JOINS!`, this.player?.cx || VIEW_W / 2, (this.player?.y || 120) - 18, '#ffd166');
      }
    };
    unlockChar('zoro', worldComplete(this.save, 0));
    unlockChar('sanji', worldComplete(this.save, 2));
    unlockChar('nami', this.save.berries >= 200);
    for (let w = 1; w < WORLDS.length; w++) {
      if (worldComplete(this.save, w - 1) && !this.save.unlockedWorlds.includes(w)) {
        this.save.unlockedWorlds.push(w);
        if (!silent) this.ui?.toast(`${WORLDS[w].name} UNLOCKED`, 'world');
      }
    }
    // repairs old or interrupted saves: a world with cleared islands is never locked
    for (let w = 0; w < WORLDS.length; w++) {
      const cleared = worldLevels(this.save, w).some((l) => this.save.levels[l.id]?.complete);
      if (cleared && !this.save.unlockedWorlds.includes(w)) this.save.unlockedWorlds.push(w);
    }
    this.save.characters = [...new Set(this.save.characters)];
    this.save.unlockedWorlds = [...new Set(this.save.unlockedWorlds)].sort((a, b) => a - b);
  }

  /* ---------------- loop ---------------- */
  loop(ts) {
    requestAnimationFrame(this.loop);
    if (!this.lastTs) this.lastTs = ts;
    let dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05);
    this.time += dt;

    if (this.state === 'playing') this.update(dt);

    this.render();
    this.ui?.tick(this.time, dt);
    this.input.endFrame();
  }

  /* ---------------- level setup ---------------- */
  startLevel(id, opts = {}) {
    const src = getLevel(id);
    if (!src) return;
    if (!opts.force && !isLevelUnlocked(this.save, id)) {
      this.ui?.toast('THAT LEVEL IS STILL LOCKED', 'warn');
      return;
    }
    this.input.clear();
    this.pendingNext = null;
    this.levelId = id;
    this.level = this.cloneLevel(src);
    this.terrain = this.terrainCache.get(id);
    if (!this.terrain) {
      this.terrain = buildTerrain(src);
      this.terrainCache.set(id, this.terrain);
    }

    this.objects = this.level.objects;
    this.breakables = this.objects.filter((o) => o.solid);
    this.movers = this.objects.filter((o) => o.kind === 'mover');
    this.projectiles = new ProjectileSystem(this);
    this.particles = [];
    this.texts = [];
    this.weather = [];
    this.enemies = [];
    for (const e of this.level.enemyDefs) {
      const tx = Math.floor((e.x - 8) / TILE);
      const row = Math.round(e.y / TILE);
      this.enemies.push(new Enemy(this, e.type, tx, row, e.opts));
    }

    this.boss = null;
    this.bossSpawned = false;
    this.player = new Player(this, this.save.character);
    this.player.reset({ x: this.level.spawn.x, y: this.level.spawn.y }, true);
    this.camera = new Camera(this.level);
    this.camera.snapTo(this.player.cx, this.player.y);
    this.respawn = { x: this.level.spawn.x, y: this.level.spawn.y };

    this.lives = LIVES;
    this.levelTime = 0;
    this.runBerries = 0;
    this.runChests = 0;
    this.runKills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.flash = 0;
    this.hurtFlash = 0;
    this.deathTimer = 0;
    this.levelIntro = 2.8;
    this.bossIntro = 0;
    this.goalHintCd = 0;
    this.activeSign = null;
    this.saveTimer = 0;
    this.state = 'playing';

    this.audio.init();
    this.audio.playMusic(musicForWorld(this.level.world));
    this.audio.sfx('checkpoint');
    this.ui?.hideAll();
    this.ui?.toast(`WORLD ${this.level.id} — ${this.level.name}`, 'level', 1.8);
    this.writeSave();
  }

  cloneLevel(src) {
    return {
      ...src,
      spawn: { ...src.spawn },
      checkpoint: src.checkpoint ? { ...src.checkpoint } : null,
      boss: src.boss ? { ...src.boss } : null,
      decor: src.decor.map((d) => ({ ...d })),
      enemyDefs: src.enemyDefs.map((e) => ({ ...e, opts: { ...(e.opts || {}) } })),
      objects: src.objects.map((o) => {
        const n = { ...o };
        if (n.loot) n.loot = { ...n.loot };
        if (n.kind === 'berry' || n.kind === 'bigberry' || n.kind === 'fruit') n.taken = false;
        if (n.kind === 'chest') n.opened = false;
        if (n.kind === 'checkpoint') n.active = false;
        if (n.kind === 'brick' || n.kind === 'crate' || n.kind === 'question') {
          n.broken = false;
          n.bump = 0;
          n.used = false;
        }
        if (n.kind === 'goal') {
          n.locked = Boolean(src.boss);
          n.reachFlash = 0;
        }
        if (n.kind === 'mover') {
          n.x = n.baseX;
          n.y = n.baseY;
          n.prevX = n.baseX;
          n.prevY = n.baseY;
        }
        return n;
      }),
    };
  }

  /* ---------------- update ---------------- */
  update(dt) {
    const level = this.level;
    if (!level) return;

    this.levelTime += dt;
    this.save.stats.playTime += dt;
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.4);
    this.levelIntro = Math.max(0, this.levelIntro - dt);
    this.bossIntro = Math.max(0, this.bossIntro - dt);
    this.goalHintCd = Math.max(0, this.goalHintCd - dt);
    this._hurtFrame = false;

    if (this.deathTimer > 0) this.deathTimer -= dt;

    const sign = this.findNearbySign();

    if (this.player && !this.player.dead) {
      this.updateMovers(dt);
      this.player.update(dt);
      this.checkPickups();
      this.checkObjects();
      this.checkBossTrigger();
    }

    for (const e of this.enemies) e.update(dt);
    this.enemies = this.enemies.filter((e) => !e.remove);
    if (this.boss) this.boss.update(dt);
    this.projectiles.update(dt);
    this.updateParticles(dt);
    this.updateTexts(dt);
    this.updateWeather(dt);

    this.activeSign = sign;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0 && this.combo > 1) this.combo = 0;

    if (this.player && !this.player.dead) this.camera.update(dt, this.player);
    if (this.deathTimer <= 0 && this.player && this.player.dead) this.handleDeath();

    this.saveTimer += dt;
    if (this.saveTimer > 8) {
      this.saveTimer = 0;
      this.writeSave();
    }

    if (this.input.justPressed('pause') && this.state === 'playing') this.pause();
  }

  updateMovers(dt) {
    for (const m of this.movers) {
      m.prevX = m.x;
      m.prevY = m.y;
      const s = Math.sin(this.time * (m.speed || 1) + (m.phase || 0));
      m.x = m.baseX + s * (m.mx || 0) * TILE;
      m.y = m.baseY + Math.cos(this.time * (m.speed || 1) + (m.phase || 0)) * (m.my || 0) * TILE;
    }
    const rider = this.player?.ridingMover;
    if (rider) {
      this.player.x += rider.x - rider.prevX;
      this.player.y += rider.y - rider.prevY;
    }
  }

  findNearbySign() {
    if (!this.settings.hints || !this.player) return null;
    for (const o of this.objects) {
      if (o.kind !== 'sign') continue;
      if (dist(this.player.cx, this.player.y + this.player.h / 2, o.x + o.w / 2, o.y + 8) < 74) return o;
    }
    return null;
  }

  checkPickups() {
    const p = this.player;
    const rect = { x: p.x - 3, y: p.y - 3, w: p.w + 6, h: p.h + 6 };
    for (const o of this.objects) {
      if (o.taken) continue;
      if (o.kind === 'berry' || o.kind === 'bigberry' || o.kind === 'fruit') {
        if (!this.rectHit(rect, o)) continue;
        o.taken = true;
        if (o.kind === 'fruit') {
          p.addHearts(1);
          this.audio.sfx('power');
          this.floatingText('+1 HEART', o.x + 6, o.y, '#ff9fd0');
          this.burst(o.x + 6, o.y + 6, '#d9b3ff', 10, 70);
        } else {
          const base = o.kind === 'bigberry' ? 10 : 1;
          const value = Math.max(1, Math.round(base * (p.stats.berry || 1)));
          this.addBerries(value);
          this.audio.sfx(o.kind === 'bigberry' ? 'bigberry' : 'berry');
          this.floatingText(`+${value}`, o.x + 6, o.y, '#e9d8ff');
          this.burst(o.x + 6, o.y + 6, '#b48cff', o.kind === 'bigberry' ? 9 : 3, 40);
        }
      }
    }
  }

  checkObjects() {
    const p = this.player;
    const prect = p.rect;
    for (const o of this.objects) {
      if (o.kind === 'chest' && !o.opened && this.rectHit(prect, o)) {
        o.opened = true;
        this.runChests++;
        this.save.stats.chests++;
        this.audio.sfx('chest');
        const loot = o.loot || {};
        if (loot.berries) {
          this.addBerries(loot.berries);
          this.floatingText(`+${loot.berries} BERRIES`, o.x + 11, o.y - 6, '#ffe08a');
        }
        if (loot.fruit) {
          p.addHearts(1);
          this.floatingText('FRUIT! +1 HEART', o.x + 11, o.y - 16, '#ffb3ec');
        }
        if (loot.life) {
          p.addHearts(1);
          this.floatingText('+1 HEART', o.x + 11, o.y - 26, '#ff8fa3');
        }
        this.burst(o.x + 11, o.y + 4, '#ffd166', 14, 80);
        this.camera.addShake(1.5);
        continue;
      }

      if (o.kind === 'checkpoint' && !o.active && this.rectHit(prect, o)) {
        o.active = true;
        this.respawn = { x: o.x + 3, y: (o.row ?? 20) * TILE - 24 };
        this.audio.sfx('checkpoint');
        this.floatingText('CHECKPOINT', o.x + 8, o.y - 6, '#ffd166');
        this.burst(o.x + 8, o.y + 14, '#ffd166', 12, 60);
        p.addHearts(1);
        continue;
      }

      if (o.kind === 'goal' && this.rectHit(prect, o)) {
        if (o.locked) {
          if (this.goalHintCd <= 0 && this.settings.hints) {
            this.goalHintCd = 1.6;
            this.ui?.toast('DEFEAT THE BOSS TO UNLOCK THE FLAG', 'warn', 1.4);
          }
        } else if (!o.cleared) {
          o.cleared = true;
          o.reachFlash = 0.6;
          this.completeLevel();
          return;
        }
      }
    }
  }

  checkBossTrigger() {
    const bd = this.level.boss;
    if (!bd || this.bossSpawned) return;
    if (this.player.cx >= bd.triggerX) {
      this.bossSpawned = true;
      this.boss = new Boss(this, bd.type);
      this.bossIntro = 2.2;
      this.camera.lock = { x1: bd.arenaX1, x2: bd.arenaX2 };
      this.camera.addShake(6);
      this.audio.playMusic('boss');
      this.audio.sfx('bossRoar');
      this.ui?.toast(`${BOSSES[bd.type].name} — ${BOSSES[bd.type].title}`, 'boss', 2.4);
      this.save.stats.boss = (this.save.stats.boss || 0);
    }
  }

  bumpObject(obj, fromBelow = false) {
    if (!obj || obj.broken || !obj.solid) return;
    obj.broken = true;
    obj.bump = 0.2;
    this.audio.sfx('break');
    this.camera.addShake(1.6);
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const col = obj.kind === 'question' ? '#ffd166' : obj.kind === 'crate' ? '#c98d55' : '#b07a48';
    this.burst(cx, cy, col, 12, 110);
    const content = obj.content;
    if (content === 'berry') {
      for (let i = 0; i < 3; i++) {
        this.spawnPickup('berry', cx - 6 + i * 6, cy - 10 - i * 2);
      }
    } else if (content === 'big') {
      this.spawnPickup('bigberry', cx - 6, cy - 16);
    } else if (content === 'life') {
      this.player.addHearts(1);
      this.floatingText('+1 HEART', cx, cy - 12, '#ff8fa3');
      this.audio.sfx('power');
    } else if (content === 'fruit') {
      this.spawnPickup('fruit', cx - 6, cy - 16);
    }
    if (fromBelow) this.player.vy = 40;
  }

  spawnPickup(kind, x, y) {
    this.objects.push({
      kind, x, y, w: 12, h: 12, taken: false, seed: Math.random(),
    });
  }

  addBerries(n) {
    this.runBerries += n;
    this.save.berries += n;
    this.refreshUnlocks(false);
  }

  /* ---------------- damage / death ---------------- */
  hurtPlayer(dmg, sourceX) {
    if (!this.player || this.player.dead) return false;
    const hit = this.player.takeDamage(dmg, sourceX);
    if (!hit) return false;
    this._hurtFrame = true;
    this.hurtFlash = 0.45;
    this.combo = 0;
    this.comboTimer = 0;
    if (this.player.hearts <= 0) this.killPlayer('damage');
    return true;
  }

  killPlayer(reason = 'fall') {
    if (!this.player || this.deathTimer > 0) return;
    this.player.dead = true;
    this.player.hurtT = 0.55;
    this.player.vx = 0;
    this.player.vy = 0;
    this.deathTimer = 1.5;
    this.deathReason = reason;
    this.lives--;
    this.save.stats.deaths++;
    this.audio.sfx('death');
    this.camera.addShake(7);
    this.burst(this.player.cx, this.player.y + this.player.h / 2, '#ffffff', 18, 110);
    this.writeSave();
  }

  handleDeath() {
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.player.dead = true;
      this.audio.stopMusic();
      this.audio.sfx('death');
      this.writeSave();
      this.ui?.showGameOver({ level: this.level, berries: this.runBerries });
      return;
    }
    let spawn = this.respawn;
    if (this.boss && !this.boss.dead) {
      const bd = this.level.boss;
      spawn = { x: bd.arenaX1 + 34, y: this.level.groundRow * TILE - 24 };
    }
    this.player.reset(spawn, true);
    this.projectiles.list = this.projectiles.list.filter((p) => p.friendly);
    this.camera.snapTo(this.player.cx, this.player.y);
    this.deathTimer = 0;
    this.combo = 0;
    this.audio.playMusic(this.boss && !this.boss.dead ? 'boss' : musicForWorld(this.level.world));
    this.ui?.toast(`LIVES LEFT: ${this.lives}`, 'warn', 1.4);
  }

  onEnemyKilled(enemy) {
    this.runKills++;
    this.save.stats.kills = (this.save.stats.kills || 0) + 1;
    this.burst(enemy.x, enemy.y - enemy.h / 2, '#ffd166', 12, 100);
    this.audio.sfx('stomp');
    if (Math.random() < (enemy.def.drop || 0.4)) {
      this.spawnPickup(Math.random() < 0.12 ? 'bigberry' : 'berry', enemy.x - 6, enemy.y - 18);
    } else if (Math.random() < 0.05) {
      this.spawnPickup('fruit', enemy.x - 6, enemy.y - 20);
    }
  }

  onBossDefeated(boss) {
    const reward = BOSSES[boss.type]?.reward || 50;
    this.addBerries(reward);
    this.goal = this.objects.find((o) => o.kind === 'goal');
    if (this.goal) this.goal.locked = false;
    this.camera.addShake(12);
    this.flash = 0.7;
    this.burst(boss.x, boss.y - 30, '#ffd166', 40, 170);
    this.audio.sfx('explosion');
    this.audio.sfx('goal');
    this.floatingText('ARENA CLEAR!', boss.x, boss.y - 70, '#ffd166');
    this.floatingText(`+${reward} BERRIES`, boss.x, boss.y - 54, '#ffe08a');
    this.ui?.toast('THE FLAG IS UNLOCKED. HEAD EAST!', 'unlock', 2.4);
    this.save.stats.bossKills = (this.save.stats.bossKills || 0) + 1;
    this.writeSave();
  }

  /* ---------------- abilities / effects ---------------- */
  specialAttack(player) {
    const ab = player.char.abilities.special;
    const cx = player.cx;
    const cy = player.y + player.h * 0.5;
    const dmg = ab.damage * player.stats.power * (player.buffT > 0 ? player.char.abilities.buff.damage : 1);
    this.audio.sfx('special');
    this.camera.addShake(9);
    this.flash = 0.45;
    this.ring(cx, cy, ab.radius, player.char.colors.accent);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x;
      const ey = e.y - e.h / 2;
      if (dist(cx, cy, ex, ey) > ab.radius + 18) continue;
      e.hit(dmg, Math.sign(ex - cx) || player.facing, ab.knock || 320);
      this.hitFeedback(cx, cy, ex, ey);
    }
    const boss = this.boss;
    if (boss && !boss.dead && dist(cx, cy, boss.x, boss.y - boss.h / 2) < ab.radius + 34) {
      boss.hit(dmg, Math.sign(boss.x - cx) || player.facing);
      this.hitFeedback(cx, cy, boss.x, boss.y - boss.h / 2);
    }
    for (const o of this.breakables) {
      if (o.broken) continue;
      if (dist(cx, cy, o.x + o.w / 2, o.y + o.h / 2) < ab.radius + 10) this.bumpObject(o);
    }
    this.floatingText(ab.name, cx, player.y - 18, player.char.colors.accent);
  }

  explode(x, y, radius, damage) {
    this.audio.sfx('explosion');
    this.camera.addShake(8);
    this.burst(x, y, '#ff8a3c', 26, 160);
    this.ring(x, y, radius, '#ff8a3c');
    if (this.player && !this.player.dead && this.player.invuln <= 0) {
      if (dist(x, y, this.player.cx, this.player.y + this.player.h / 2) < radius + 8) {
        this.hurtPlayer(damage, x);
      }
    }
  }

  particle(opts = {}) {
    const life = opts.life ?? 0.5;
    this.particles.push({
      x: 0, y: 0, vx: 0, vy: 0, gravity: 0, size: 1.5, color: '#ffffff',
      kind: 'spark', ...opts, life, maxLife: life,
    });
    if (this.particles.length > 420) this.particles.shift();
  }

  burst(x, y, color, n = 8, speed = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.25, speed);
      this.particle({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12,
        gravity: 170, life: rand(0.28, 0.7), size: rand(1, 2.6),
        color, kind: 'spark',
      });
    }
  }

  dust(x, y, n = 5) {
    for (let i = 0; i < n; i++) {
      this.particle({
        x: x + rand(-3, 3), y: y - rand(0, 2),
        vx: rand(-26, 26), vy: rand(-28, -4),
        gravity: 70, life: rand(0.2, 0.45), size: rand(1.4, 3),
        color: 'rgba(238,228,208,0.75)', kind: 'dust',
      });
    }
  }

  ring(x, y, maxR, color) {
    this.particle({
      x, y, kind: 'ring', color, size: 4, r: 4, maxR,
      life: 0.42, maxLife: 0.42, gravity: 0,
    });
  }

  floatingText(text, x, y, color = '#ffffff') {
    this.texts.push({ text, x, y, color, life: 1.1, maxLife: 1.1, vy: -30 });
    if (this.texts.length > 20) this.texts.shift();
  }

  hitFeedback(x, y, tx, ty) {
    this.burst(x, y, '#ffe9a3', 5, 60);
    if (this._hurtFrame) {
      this._hurtFrame = false;
      return;
    }
    this.combo++;
    this.comboTimer = 3;
    this.save.stats.bestCombo = Math.max(this.save.stats.bestCombo || 0, this.combo);
    if (this.combo > 1) this.audio.sfx('coin');
  }

  updateParticles(dt) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.kind === 'ring') p.r += ((p.maxR - 4) / p.maxLife) * dt;
    }
  }

  updateTexts(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  updateWeather(dt) {
    const theme = THEMES[this.level.theme] || THEMES.eastblue;
    const kind = this.level.weather || theme.weather;
    if (!kind) return;
    let rate = 0;
    if (kind === 'rain') rate = 60;
    else if (kind === 'ember') rate = 18;
    else if (kind === 'sand') rate = 22;
    else if (kind === 'leaf') rate = 3.5;
    else if (kind === 'bubble') rate = 8;
    if (Math.random() < rate * dt) {
      const common = { life: rand(2.5, 5.5), maxLife: 5, phase: rand(0, 6.28), kind: `w-${kind}` };
      if (kind === 'rain') {
        this.weather.push({ ...common, x: rand(-20, VIEW_W + 20), y: rand(-40, -4), vx: -34, vy: rand(230, 320), size: rand(1, 2) });
      } else if (kind === 'ember') {
        this.weather.push({ ...common, x: rand(0, VIEW_W), y: VIEW_H + rand(0, 20), vx: rand(-12, 12), vy: rand(-42, -20), size: rand(0.8, 2) });
      } else if (kind === 'sand') {
        this.weather.push({ ...common, x: rand(-20, VIEW_W), y: rand(20, VIEW_H), vx: rand(26, 52), vy: rand(-8, 8), size: rand(1, 2.4) });
      } else if (kind === 'leaf') {
        this.weather.push({ ...common, x: rand(-10, VIEW_W), y: rand(-10, VIEW_H * 0.8), vx: rand(8, 26), vy: rand(8, 22), size: rand(1.4, 2.6), rot: rand(0, 6.28) });
      } else {
        this.weather.push({ ...common, x: rand(0, VIEW_W), y: VIEW_H + rand(0, 16), vx: rand(-8, 8), vy: rand(-28, -12), size: rand(1.5, 3.5) });
      }
    }
    for (let i = this.weather.length - 1; i >= 0; i--) {
      const w = this.weather[i];
      w.life -= dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      if (w.rot != null) w.rot += dt * 2;
      if (w.life <= 0 || w.y > VIEW_H + 40 || w.y < -50 || w.x < -50 || w.x > VIEW_W + 50) {
        this.weather.splice(i, 1);
      }
    }
  }

  /* ---------------- completion ---------------- */
  completeLevel() {
    const id = this.level.id;
    const t = this.levelTime;
    const prev = this.save.levels[id] || {};
    const isNewTime = !prev.complete || t < (prev.bestTime ?? Infinity);
    const isNewBerries = this.runBerries > (prev.bestBerries || 0);
    const isNewSecrets = this.runChests > (prev.bestSecrets || 0);
    this.save.levels[id] = {
      complete: true,
      bestTime: prev.complete ? Math.min(prev.bestTime ?? Infinity, t) : t,
      bestBerries: Math.max(prev.bestBerries || 0, this.runBerries),
      bestSecrets: Math.max(prev.bestSecrets || 0, this.runChests),
      plays: (prev.plays || 0) + 1,
    };
    this.refreshUnlocks(false);

    const allDone = LEVELS.every((l) => this.save.levels[l.id]?.complete);
    if (allDone) this.save.victory = true;
    this.writeSave();
    this.audio.stopMusic();
    this.audio.sfx('goal');
    this.audio.playMusic('victory');

    const data = {
      level: this.level,
      time: t,
      parTime: this.level.parTime,
      berries: this.runBerries,
      chests: this.runChests,
      totalChests: this.level.totalSecrets,
      kills: this.runKills,
      newTime: isNewTime,
      newBerries: isNewBerries,
      newSecrets: isNewSecrets,
      next: nextLevelId(id),
      allDone,
    };
    this.pendingNext = data.next;
    this.state = 'results';
    if (allDone) {
      this.state = 'victory';
      this.ui?.showVictory(this.save, data);
    } else {
      this.ui?.showResults(data);
    }
  }

  /* ---------------- state controls ---------------- */
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui?.showPause(this);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.input.clear();
    this.ui?.hideAll();
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  restartLevel() {
    if (!this.levelId) return;
    this.startLevel(this.levelId, { force: true });
  }

  retry() {
    if (!this.levelId) { this.quitToMenu(); return; }
    this.startLevel(this.levelId, { force: true });
  }

  playNext() {
    const id = this.pendingNext || (this.level ? nextLevelId(this.level.id) : null);
    if (!id) {
      this.quitToMenu();
      return;
    }
    if (isLevelUnlocked(this.save, id)) {
      this.startLevel(id);
    } else {
      this.ui?.toast('CLEAR THE PREVIOUS ISLAND TO SAIL ON', 'warn', 2);
      this.openWorldMap();
    }
  }

  quitToMenu() {
    this.saveGame();
    this.state = 'menu';
    this.level = null;
    this.levelId = null;
    this.player = null;
    this.camera = null;
    this.boss = null;
    this.enemies = [];
    this.projectiles = new ProjectileSystem(this);
    this.particles = [];
    this.texts = [];
    this.weather = [];
    this.audio.stopMusic();
    this.audio.playMusic('menu');
    this.ui?.showMenu();
  }

  openWorldMap() {
    this.saveGame();
    this.state = 'menu';
    this.level = null;
    this.levelId = null;
    this.player = null;
    this.camera = null;
    this.boss = null;
    this.enemies = [];
    this.particles = [];
    this.weather = [];
    this.audio.stopMusic();
    this.audio.playMusic('menu');
    this.ui?.showWorlds();
  }

  saveGame() {
    this.refreshUnlocks(true);
    this.writeSave();
  }

  setCharacter(id) {
    if (!this.save.characters.includes(id)) return false;
    const c = CHARACTERS.find((x) => x.id === id);
    if (!c) return false;
    this.save.character = id;
    this.saveGame();
    this.audio.sfx('select');
    this.ui?.toast(`${c.name} SELECTED`, 'info', 1.4);
    return true;
  }

  menuObjective() {
    return nextObjective(this.save);
  }

  completion() {
    return totalCompletion(this.save);
  }

  worldState(worldId) {
    return {
      unlocked: this.save.unlockedWorlds.includes(worldId),
      complete: worldComplete(this.save, worldId),
      levels: worldLevels(worldId).map((l) => ({
        ...l,
        unlocked: isLevelUnlocked(this.save, l.id),
        record: this.save.levels[l.id] || null,
      })),
    };
  }

  rectHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* =========================================================
     RENDER
     ========================================================= */
  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    if (this.state === 'menu' || !this.level) {
      this.renderMenu();
      this.drawScreenVignette();
      return;
    }
    this.renderWorld();
    this.drawScreenVignette();
    if (this.flash > 0) {
      ctx.fillStyle = withAlpha('#ffe9b0', Math.min(0.8, this.flash));
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.hurtFlash > 0) {
      ctx.fillStyle = withAlpha('#ff2a3c', this.hurtFlash * 0.4);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    this.drawHud();
  }

  renderMenu() {
    const ctx = this.ctx;
    drawMenuScene(ctx, this.time);
    drawCharacter(ctx, 'luffy', 60, 237, 1, 'idle', this.time, { scale: 1.55, shadow: true });
    // sparkle accents around the hero
    for (let i = 0; i < 6; i++) {
      const a = this.time * 0.8 + i * 1.05;
      const sx = 60 + Math.cos(a) * (18 + i * 2);
      const sy = 208 + Math.sin(a * 1.3) * 12;
      const alpha = 0.25 + Math.sin(this.time * 3 + i) * 0.2;
      ctx.fillStyle = withAlpha('#ffe9a3', Math.max(0, alpha));
      ctx.fillRect(sx, sy, 1, 1);
    }
    drawText(ctx, 'GRAND LINE', VIEW_W - 9, VIEW_H - 13, {
      align: 'right', scale: 1, color: 'rgba(255,240,205,0.55)', shadow: 'rgba(0,0,0,0.4)',
    });
  }

  renderWorld() {
    const ctx = this.ctx;
    const level = this.level;
    const cam = this.camera;
    drawBackground(ctx, level.theme, cam.x, cam.y, this.time, {});

    ctx.save();
    cam.apply(ctx);

    if (this.terrain) ctx.drawImage(this.terrain, 0, 0);
    drawDecor(ctx, level, this.time);
    drawWater(ctx, level, cam.x, cam.y, this.time);

    for (const o of this.objects) {
      if (o.taken || o.broken) continue;
      if (!cam.isVisible(o.x, o.y, o.w, o.h, 60)) continue;
      drawObject(ctx, o, this.time);
      if (o.kind === 'goal' && o.locked) this.drawGoalLock(ctx, o);
    }

    this.projectiles.draw(ctx);
    for (const e of this.enemies) {
      if (!cam.isVisible(e.x - 20, e.y - 40, 40, 44, 60)) continue;
      e.draw(ctx);
    }
    if (this.boss) this.boss.draw(ctx, this.time);
    if (this.player) this.player.draw(ctx);

    this.drawParticles(ctx);
    this.drawTexts(ctx);
    ctx.restore();

    this.drawWeather(ctx);
  }

  drawGoalLock(ctx, o) {
    const x = o.x + o.w / 2;
    const y = o.y + 12;
    ctx.fillStyle = 'rgba(10,14,22,0.78)';
    ctx.fillRect(x - 8, y - 6, 16, 14);
    ctx.strokeStyle = '#8f98a8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y - 5, 4, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - 4, y - 2, 8, 7);
    ctx.fillStyle = '#3a2a08';
    ctx.fillRect(x - 1, y, 2, 3);
  }

  drawParticles(ctx) {    const ps = this.particles;
    for (const p of ps) {
      if (!this.camera.isVisible(p.x, p.y, p.size, p.size, 40)) continue;
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.r), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'steam') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx) {
    for (const t of this.texts) {
      const a = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = Math.min(1, a * 1.6);
      drawText(ctx, t.text, t.x, t.y, {
        align: 'center', color: t.color, scale: 1, shadow: 'rgba(10,14,22,0.75)',
      });
    }
    ctx.globalAlpha = 1;
  }

  drawWeather(ctx) {
    for (const w of this.weather) {
      const kind = w.kind.slice(2);
      ctx.globalAlpha = Math.min(0.7, w.life) * (kind === 'rain' ? 0.55 : 0.75);
      if (kind === 'rain') {
        ctx.strokeStyle = '#bfe4ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + w.vx * 0.045, w.y + w.vy * 0.045);
        ctx.stroke();
      } else if (kind === 'ember') {
        ctx.fillStyle = '#ff8a3c';
        ctx.fillRect(w.x, w.y, w.size, w.size);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(w.x, w.y, 1, 1);
      } else if (kind === 'sand') {
        ctx.fillStyle = '#f0d49a';
        ctx.fillRect(w.x, w.y, w.size * 2.4, 1);
      } else if (kind === 'leaf') {
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.rot || 0);
        ctx.fillStyle = '#8fd694';
        ctx.fillRect(-w.size, -0.7, w.size * 2, 1.4);
        ctx.restore();
      } else {
        ctx.strokeStyle = '#d9fff4';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawScreenVignette() {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(4,8,16,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  /* ---------------- HUD ---------------- */
  drawHud() {
    const ctx = this.ctx;
    const p = this.player;
    if (!p) return;

    // soft backdrops keep the HUD readable over bright skies and water
    ctx.fillStyle = 'rgba(7,12,20,0.42)';
    ctx.fillRect(4, 4, 92, 26);
    ctx.fillRect(VIEW_W - 120, 4, 116, 30);
    ctx.fillStyle = 'rgba(242,193,78,0.2)';
    ctx.fillRect(4, 4, 92, 1);
    ctx.fillRect(VIEW_W - 120, 4, 116, 1);

    // hearts
    for (let i = 0; i < p.maxHearts; i++) {
      drawHeart(ctx, 8 + i * 9, 7, 1, i < p.hearts, '#e63946');
    }
    drawBerryIcon(ctx, 8, 19, 0.9);
    drawText(ctx, String(this.runBerries), 23, 20, { color: '#ffe6a3', shadow: '#1a1206' });
    drawLifeIcon(ctx, 58, 18, 0.9);
    drawText(ctx, `X${this.lives}`, 72, 20, { color: '#f2f2f2', shadow: '#1a1206' });

    // level + timer
    const timeColor = this.levelTime > (this.level.parTime || 99) ? '#ff8a8a' : '#ffffff';
    drawText(ctx, formatTime(this.levelTime), VIEW_W - 8, 7, {
      align: 'right', color: timeColor, shadow: '#101826', scale: 1,
    });
    drawText(ctx, `PAR ${formatTime(this.level.parTime || 0)}`, VIEW_W - 8, 17, {
      align: 'right', color: 'rgba(230,240,255,0.6)', shadow: '#101826', scale: 1,
    });
    drawText(ctx, `${this.level.id}  ${this.level.name}`, VIEW_W - 8, 27, {
      align: 'right', color: '#ffd166', shadow: '#101826', scale: 1,
    });

    // combo
    if (this.combo > 1 && this.comboTimer > 0) {
      const pulse = 1 + Math.sin(this.time * 16) * 0.08;
      drawText(ctx, `COMBO X${this.combo}`, VIEW_W / 2, 17, {
        align: 'center', color: '#ffd166', shadow: '#5a2a00', scale: 1,
      });
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(VIEW_W / 2 - 20, 26, 40 * (this.comboTimer / 3), 1.5);
      ctx.globalAlpha = 1;
      void pulse;
    }

    // boss bar
    const boss = this.boss;
    if (boss && !boss.dead && this.bossSpawned) {
      const bw = 224;
      const bx = (VIEW_W - bw) / 2;
      const by = 24;
      drawText(ctx, boss.def.name, VIEW_W / 2, 9, {
        align: 'center', color: '#fff3d6', shadow: '#3a0d0d', scale: 1,
      });
      ctx.fillStyle = 'rgba(8,10,18,0.75)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 10);
      ctx.fillStyle = '#33131b';
      ctx.fillRect(bx, by, bw, 6);
      const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, '#b3122b');
      g.addColorStop(0.6, '#ff3b4e');
      g.addColorStop(1, '#ffd166');
      ctx.fillStyle = g;
      ctx.fillRect(bx, by, bw * ratio, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(bx, by, bw * ratio, 1);
      if (boss.phase === 2) {
        drawText(ctx, 'PHASE 2', bx + bw, by + 9, { align: 'right', color: '#ff8a3c', scale: 1 });
      }
      drawText(ctx, `${Math.ceil(boss.hp)} / ${boss.maxHp}`, bx, by + 9, { color: '#d9c8c8', scale: 1 });
    }

    this.drawAbilityBar(ctx, p);

    if (this.activeSign) {
      const lines = this.activeSign.lines || [];
      const w = Math.max(100, Math.max(...lines.map((l) => l.length)) * 6 + 20);
      const h = lines.length * 9 + 9;
      const x = (VIEW_W - w) / 2;
      const y = VIEW_H - h - 46;
      ctx.fillStyle = 'rgba(12,18,28,0.82)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(242,193,78,0.8)';
      ctx.fillRect(x, y, w, 1);
      lines.forEach((line, i) => {
        drawText(ctx, line, VIEW_W / 2, y + 5 + i * 9, {
          align: 'center', color: '#f5ead0', scale: 1,
        });
      });
    }

    // gear second border
    if (p.buffT > 0) {
      const a = 0.28 + Math.sin(this.time * 10) * 0.12;
      ctx.strokeStyle = withAlpha(p.char.abilities.buff.tint, a);
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - 4);
      const bw = 80;
      ctx.fillStyle = 'rgba(12,18,28,0.6)';
      ctx.fillRect(8, 35, bw, 5);
      ctx.fillStyle = p.char.abilities.buff.tint;
      ctx.fillRect(9, 36, (bw - 2) * (p.buffT / p.buffMax), 3);
      drawText(ctx, p.char.abilities.buff.name, 8, 42, { color: p.char.abilities.buff.tint, scale: 1 });
    }

    if (this.levelIntro > 0) this.drawLevelIntro(ctx);
    if (this.bossIntro > 0) this.drawBossIntro(ctx);

    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(5,8,15,0.35)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  drawAbilityBar(ctx, p) {
    const defs = [
      { kind: 'pistol', key: ABILITIES.basic.key, cd: p.basicCd / ABILITIES.basic.cooldown, label: 'PUNCH' },
      { kind: 'rocket', key: ABILITIES.dash.key, cd: p.dashCd / ABILITIES.dash.cooldown, label: 'DASH' },
      { kind: 'gear2', key: ABILITIES.buff.key, cd: p.buffCd / ABILITIES.buff.cooldown, label: 'GEAR 2' },
      { kind: 'gear3', key: ABILITIES.special.key, cd: p.specialCd / ABILITIES.special.cooldown, label: 'GEAR 3' },
    ];
    const y = VIEW_H - 31;
    defs.forEach((d, i) => {
      const x = 8 + i * 42;
      const bw = 38;
      const bh = 25;
      ctx.fillStyle = 'rgba(9,14,23,0.68)';
      ctx.fillRect(x, y, bw, bh);
      const ready = d.cd <= 0.001;
      drawAbilityIcon(ctx, d.kind, x + 5, y + 1, 0.9);
      drawKeycap(ctx, x + 24, y + 2, d.key, 0.8, ready);
      drawText(ctx, d.label, x + bw / 2, y + 16, {
        align: 'center', color: ready ? '#ffe6a3' : '#6f7a8a', scale: 1,
      });
      if (!ready) {
        ctx.fillStyle = 'rgba(4,8,14,0.55)';
        ctx.fillRect(x, y, bw, bh * d.cd);
      }
    });
  }

  drawLevelIntro(ctx) {
    const elapsed = 2.8 - this.levelIntro;
    const alpha = Math.min(1, elapsed * 3, this.levelIntro * 2);
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(7,12,20,0.65)';
    ctx.fillRect(0, VIEW_H / 2 - 30, VIEW_W, 60);
    ctx.fillStyle = 'rgba(242,193,78,0.85)';
    ctx.fillRect(0, VIEW_H / 2 - 30, VIEW_W, 1);
    ctx.fillRect(0, VIEW_H / 2 + 29, VIEW_W, 1);
    drawText(ctx, `WORLD ${this.level.id}`, VIEW_W / 2, VIEW_H / 2 - 20, {
      align: 'center', color: '#ffd166', scale: 1, shadow: '#1a1206',
    });
    drawText(ctx, this.level.name.toUpperCase(), VIEW_W / 2, VIEW_H / 2 - 8, {
      align: 'center', color: '#fff6e3', scale: 2, shadow: '#1a1206',
    });
    drawText(ctx, this.level.worldName, VIEW_W / 2, VIEW_H / 2 + 14, {
      align: 'center', color: 'rgba(230,240,255,0.65)', scale: 1,
    });
    ctx.globalAlpha = 1;
  }

  drawBossIntro(ctx) {
    const elapsed = 2.2 - this.bossIntro;
    const alpha = Math.min(1, elapsed * 3, this.bossIntro * 2);
    if (alpha <= 0 || !this.boss) return;
    const b = this.boss;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30,4,8,0.78)';
    ctx.fillRect(0, 42, VIEW_W, 44);
    ctx.fillStyle = 'rgba(255,90,60,0.9)';
    ctx.fillRect(0, 42, VIEW_W, 1);
    ctx.fillRect(0, 85, VIEW_W, 1);
    const slide = (1 - Math.min(1, elapsed * 3)) * 40 - (1 - Math.min(1, this.bossIntro * 2)) * 30;
    drawText(ctx, b.def.name, VIEW_W / 2 + slide, 49, {
      align: 'center', color: '#fff0dd', scale: 2, shadow: '#3a0008',
    });
    drawText(ctx, b.def.title.toUpperCase(), VIEW_W / 2 - slide, 68, {
      align: 'center', color: '#ff8a6a', scale: 1,
    });
    drawText(ctx, 'BOSS BATTLE', VIEW_W / 2, 78, {
      align: 'center', color: 'rgba(255,220,180,0.6)', scale: 1,
    });
    ctx.globalAlpha = 1;
  }
}
