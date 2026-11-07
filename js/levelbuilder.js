/* =========================================================
   levelbuilder.js — authoring helpers + validation
   ========================================================= */

import { TILE, LEVEL_H, GROUND_ROW, WORLDS } from './config.js';

const SOLID = new Set([1, 2, 3]);

export class LevelBuilder {
  constructor(cfg) {
    this.id = cfg.id;
    this.world = cfg.world;
    this.name = cfg.name;
    this.theme = cfg.theme;
    this.w = cfg.width;
    this.h = cfg.height || LEVEL_H;
    this.groundRow = cfg.groundRow ?? GROUND_ROW;
    this.tiles = new Uint8Array(this.w * this.h);
    this.objects = [];
    this.enemyDefs = [];
    this.decorations = [];
    this.spawnPoint = null;
    this.bossData = null;
    this.defaultCheckpoint = null;
    this.hint = cfg.hint || '';
    this.weather = cfg.weather || null;
    this.parTime = cfg.parTime || 90;
    this.seedCounter = 1;
    this._groundAll = false;
  }

  idx(tx, ty) { return ty * this.w + tx; }

  set(tx, ty, id) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return this;
    this.tiles[this.idx(tx, ty)] = id;
    return this;
  }

  get(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return 0;
    return this.tiles[this.idx(tx, ty)];
  }

  rect(tx, ty, tw, th, id) {
    for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) this.set(x, y, id);
    return this;
  }

  ground(x1, x2, top = this.groundRow) {
    for (let x = x1; x < x2; x++) {
      this.set(x, top, 2);
      for (let y = top + 1; y < this.h; y++) this.set(x, y, 1);
    }
    return this;
  }

  pit(x1, x2, top = this.groundRow) {
    for (let x = x1; x < x2; x++) for (let y = top; y < this.h; y++) this.set(x, y, 0);
    return this;
  }

  terrace(x1, x2, top) {
    for (let x = x1; x < x2; x++) {
      this.set(x, top, 2);
      for (let y = top + 1; y < this.h; y++) this.set(x, y, 1);
      for (let y = 0; y < top; y++) this.set(x, y, 0);
    }
    return this;
  }

  building(tx, tw, topRow, baseRow = this.groundRow, id = 1) {
    for (let x = tx; x < tx + tw; x++) {
      this.set(x, topRow, 2);
      for (let y = topRow + 1; y < baseRow; y++) this.set(x, y, id);
    }
    return this;
  }

  platform(tx, ty, tw) {
    for (let x = tx; x < tx + tw; x++) this.set(x, ty, 4);
    return this;
  }

  block(tx, ty, tw, th, id = 3) {
    this.rect(tx, ty, tw, th, id);
    return this;
  }

  spikes(tx, ty, tw) {
    for (let x = tx; x < tx + tw; x++) this.set(x, ty, 5);
    return this;
  }

  water(x1, x2, y1, y2) {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) this.set(x, y, 6);
    return this;
  }

  lava(x1, x2, y1, y2) {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) this.set(x, y, 7);
    return this;
  }

  quicksand(x1, x2, y1, y2) {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) this.set(x, y, 8);
    return this;
  }

  /* ---------------- objects ---------------- */
  add(obj) {
    obj.id = this.seedCounter++;
    obj.seed = (obj.seed ?? this.seedCounter * 0.137) % 1;
    this.objects.push(obj);
    return obj;
  }

  berry(tx, ty) {
    return this.add({ kind: 'berry', x: tx * TILE + 2, y: ty * TILE + 2, w: 12, h: 12, taken: false });
  }

  berries(tx, ty, n = 3, step = 1) {
    for (let i = 0; i < n; i++) this.berry(tx + i * step, ty);
    return this;
  }

  berryArc(tx, ty, n = 5, step = 1) {
    for (let i = 0; i < n; i++) {
      const lift = Math.round(Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 2);
      this.berry(tx + i * step, ty - lift);
    }
    return this;
  }

  berryColumn(tx, ty, n = 3, step = 1) {
    for (let i = 0; i < n; i++) this.berry(tx, ty + i * step);
    return this;
  }

  bigBerry(tx, ty) {
    return this.add({ kind: 'bigberry', x: tx * TILE + 2, y: ty * TILE + 2, w: 12, h: 12, taken: false });
  }

  fruit(tx, ty) {
    return this.add({ kind: 'fruit', x: tx * TILE + 2, y: ty * TILE + 2, w: 12, h: 12, taken: false });
  }

  brick(tx, ty, content = 'berry') {
    return this.add({ kind: 'brick', x: tx * TILE, y: ty * TILE, w: 16, h: 16, solid: true, content, broken: false, bump: 0 });
  }

  crate(tx, ty, content = 'berry') {
    return this.add({ kind: 'crate', x: tx * TILE, y: ty * TILE, w: 16, h: 16, solid: true, content, broken: false, bump: 0 });
  }

  question(tx, ty, content = 'berry') {
    return this.add({ kind: 'question', x: tx * TILE, y: ty * TILE, w: 16, h: 16, solid: true, content, broken: false, bump: 0, used: false });
  }

  brickRow(tx, ty, n, contents = []) {
    for (let i = 0; i < n; i++) {
      const c = contents[i] ?? null;
      if (c === 'q') this.question(tx + i, ty, contents[i + 1] || 'berry');
      else this.brick(tx + i, ty, c || null);
    }
    return this;
  }

  chest(tx, ty, loot = {}) {
    return this.add({
      kind: 'chest', x: tx * TILE - 3, y: ty * TILE, w: 22, h: 16,
      opened: false, loot: { berries: loot.berries ?? 10, fruit: loot.fruit ?? false, life: loot.life ?? false },
    });
  }

  checkpoint(tx, row = this.groundRow) {
    const obj = this.add({
      kind: 'checkpoint', x: tx * TILE, y: (row - 2) * TILE, w: 16, h: 32,
      active: false, row,
    });
    if (!this.defaultCheckpoint) this.defaultCheckpoint = { x: tx * TILE, y: (row - 2) * TILE, row };
    return obj;
  }

  goal(tx, row = this.groundRow) {
    return this.add({
      kind: 'goal', x: tx * TILE - 8, y: (row - 3) * TILE, w: 32, h: 48,
      row, reachFlash: 0,
    });
  }

  sign(tx, row, lines) {
    return this.add({ kind: 'sign', x: tx * TILE - 8, y: (row - 1) * TILE, w: 32, h: 16, lines });
  }

  mover(tx, ty, tw, opts = {}) {
    return this.add({
      kind: 'mover', x: tx * TILE, y: ty * TILE, w: tw * TILE, h: 8,
      baseX: tx * TILE, baseY: ty * TILE, mx: opts.mx || 0, my: opts.my || 0,
      speed: opts.speed || 1.1, phase: opts.phase || 0, prevX: tx * TILE, prevY: ty * TILE,
    });
  }

  enemy(type, tx, row = this.groundRow, opts = {}) {
    this.enemyDefs.push({ type, x: tx * TILE + 8, y: row * TILE, opts });
    return this;
  }

  decor(type, tx, row = this.groundRow, extra = {}) {
    this.decorations.push({ type, x: tx * TILE + 8, y: row * TILE, ...extra });
    return this;
  }

  scenic(types, tx, row, extra = {}) {
    for (const t of types) this.decor(t, tx, row, extra);
    return this;
  }

  spawn(tx, row = this.groundRow) {
    this.spawnPoint = { x: tx * TILE + 2, y: row * TILE - 24, row, tileX: tx };
    return this;
  }

  boss(type, triggerTx) {
    this.bossData = {
      type,
      triggerX: triggerTx * TILE,
      arenaX1: triggerTx * TILE,
      arenaX2: this.w * TILE,
      spawnX: Math.min(this.w * TILE - 60, triggerTx * TILE + (this.w - triggerTx) * TILE * 0.6),
    };
    for (const o of this.objects) if (o.kind === 'goal') o.locked = true;
    return this;
  }

  build() {
    if (!this.spawnPoint) this.spawn(2);
    if (!this.defaultCheckpoint) this.defaultCheckpoint = { ...this.spawnPoint };
    const goal = this.objects.find((o) => o.kind === 'goal');
    if (goal && this.bossData) goal.locked = true;

    // computed totals
    let totalBerries = 0;
    let totalSecrets = 0;
    for (const o of this.objects) {
      if (o.kind === 'berry') totalBerries += 1;
      else if (o.kind === 'bigberry') totalBerries += 10;
      else if (o.kind === 'chest') {
        totalSecrets++;
        totalBerries += o.loot.berries;
      } else if (o.kind === 'brick' || o.kind === 'crate' || o.kind === 'question') {
        if (o.content === 'berry') totalBerries += 3;
        else if (o.content === 'big') totalBerries += 10;
      }
    }

    const world = WORLDS[this.world];
    const level = {
      id: this.id,
      world: this.world,
      worldName: world?.name || 'GRAND LINE',
      name: this.name,
      theme: this.theme,
      w: this.w,
      h: this.h,
      groundRow: this.groundRow,
      tiles: this.tiles,
      objects: this.objects,
      enemyDefs: this.enemyDefs,
      decor: this.decorations,
      spawn: this.spawnPoint,
      checkpoint: this.defaultCheckpoint,
      boss: this.bossData,
      hint: this.hint,
      weather: this.weather,
      parTime: this.parTime,
      totalBerries,
      totalSecrets,
      goalX: goal ? goal.x : (this.w - 6) * TILE,
    };

    if (typeof console !== 'undefined') {
      this.validate(level);
    }
    return level;
  }

  validate(level) {
    const warn = (msg) => console.warn(`[level ${level.id}] ${msg}`);
    // spawn must have ground
    const s = level.spawn;
    const spawnRow = Number.isFinite(s.row) ? s.row : Math.ceil((s.y + 24) / TILE);
    if (!SOLID.has(this.get(Math.floor(s.x / TILE), spawnRow)) &&
        this.get(Math.floor(s.x / TILE), spawnRow) !== 4) {
      warn('spawn has no ground beneath it');
    }
    // goal exists
    if (!level.objects.some((o) => o.kind === 'goal')) warn('no goal object');
    // pickups not embedded in solid tiles (except underground treasure chests in water)
    for (const o of level.objects) {
      if (!['berry', 'bigberry', 'fruit'].includes(o.kind)) continue;
      const id = this.get(Math.floor((o.x + o.w / 2) / TILE), Math.floor((o.y + o.h / 2) / TILE));
      if (SOLID.has(id)) warn(`pickup #${o.id} inside solid tile at ${Math.floor(o.x / TILE)},${Math.floor(o.y / TILE)}`);
    }
    // boss arena floor should be continuous
    if (level.boss) {
      const start = Math.floor(level.boss.triggerX / TILE);
      let holes = 0;
      for (let x = start; x < level.w; x++) {
        if (!SOLID.has(this.get(x, this.groundRow)) && this.get(x, this.groundRow) !== 4) holes++;
      }
      if (holes > 4) warn(`boss arena has ${holes} holes in floor`);
    }
    // enemy feet support
    for (const e of level.enemyDefs) {
      const tx = Math.floor(e.x / TILE);
      const row = Math.floor(e.y / TILE);
      if (!SOLID.has(this.get(tx, row)) && this.get(tx, row) !== 4) {
        // flying enemies can be airborne
        if (!['gull'].includes(e.type)) warn(`enemy ${e.type} at ${tx},${row} is not standing on ground`);
      }
    }
  }
}

/* decorative helper used across level files */
export function scatter(b, types, from, to, row, step = 11, offset = 0) {
  let i = 0;
  for (let x = from; x < to; x += step) {
    b.decor(types[i % types.length], x + offset, row, { s: 0.85 + (i % 3) * 0.12 });
    i++;
  }
}
