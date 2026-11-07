/* =========================================================
   ui.js — HTML overlay screens, navigation, previews, toasts
   ========================================================= */

import { CHARACTERS, WORLDS, BOSSES, THEMES, SAVE_KEY, SETTINGS_KEY } from './config.js';
import {
  getLevel, worldComplete, totalCompletion, completedCount,
  nextObjective, worldLevels, LEVELS,
} from './levels.js';
import { drawCharacterPreview } from './sprites.js';
import { formatTime, formatNumber, clamp } from './utils.js';

const SCREENS = [
  'menu', 'worlds', 'characters', 'settings', 'records',
  'pause', 'results', 'gameover', 'victory',
];

const TIPS = [
  'Tip: Gear Third has a long cooldown — save it for crowds.',
  'Tip: A second jump can save you from a long fall.',
  'Tip: Break crates and question blocks for hidden berries.',
  'Tip: Checkpoints refill one heart when first touched.',
  'Tip: Chests hide the biggest berry stashes on every island.',
  'Tip: Dash through enemies with K or right-click to deal damage.',
  'Tip: Hold SHIFT to sprint across long gaps.',
  'Tip: Collect 200 berries to recruit Nami.',
];

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.stage = document.getElementById('stage');
    this.screens = {};
    for (const name of SCREENS) this.screens[name] = document.getElementById(`screen-${name}`);
    this.current = null;
    this.previewCanvases = new Map();
    this.metaTimer = 0;
    this.bind();
    this.setScale();
    window.addEventListener('resize', () => this.setScale());

    this.renderWorlds();
    this.renderCharacters();
    this.renderRecords();
    this.syncSettings();
    this.showMenu();
  }

  /* ---------------- layout ---------------- */
  setScale() {
    const rect = this.stage.getBoundingClientRect();
    if (rect.width > 0) this.stage.style.setProperty('--s', (rect.width / 480).toFixed(3));
  }

  bind() {
    this.root.addEventListener('click', (e) => {
      this.game.audio.init();
      const action = e.target.closest('[data-action]');
      if (action) {
        this.handleAction(action.dataset.action, action);
        return;
      }
      const levelBtn = e.target.closest('[data-level]');
      if (levelBtn) {
        if (levelBtn.disabled) return;
        this.game.startLevel(levelBtn.dataset.level);
        return;
      }
      const charCard = e.target.closest('[data-char]');
      if (charCard) {
        const id = charCard.dataset.char;
        if (!this.game.save.characters.includes(id)) {
          const c = CHARACTERS.find((x) => x.id === id);
          this.toast(`LOCKED — ${c?.hint || 'Keep playing to unlock'}`, 'warn', 2.4);
          return;
        }
        if (this.game.setCharacter(id)) this.renderCharacters();
      }
    });

    this.root.addEventListener('input', (e) => {
      const slider = e.target.closest('[data-setting]');
      if (slider) {
        const key = slider.dataset.setting;
        this.game.settings[key] = Number(slider.value) / 100;
        this.game.audio.init();
        this.game.applySettings();
        this.syncSettingValues();
      }
    });

    this.root.addEventListener('change', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        this.game.settings[toggle.dataset.toggle] = toggle.checked;
        this.game.applySettings();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      if (this.current === 'pause') {
        e.preventDefault();
        this.game.resume();
      } else if (['worlds', 'characters', 'settings', 'records'].includes(this.current)) {
        e.preventDefault();
        if (this.current === 'settings' && this.game.state === 'paused') this.showPause();
        else this.showMenu();
      }
    });
  }

  handleAction(action) {
    const game = this.game;
    switch (action) {
      case 'continue':
        game.startLevel(game.menuObjective());
        break;
      case 'worlds':
        this.showWorlds();
        break;
      case 'characters':
        this.showCharacters();
        break;
      case 'settings':
      case 'pause-settings':
        this.showSettings();
        break;
      case 'settings-back':
        if (game.state === 'paused') this.showPause();
        else this.showMenu();
        break;
      case 'records':
        this.showRecords();
        break;
      case 'back-menu':
        this.showMenu();
        break;
      case 'resume':
        game.resume();
        break;
      case 'restart':
        game.restartLevel();
        break;
      case 'quit':
        game.quitToMenu();
        break;
      case 'retry':
        game.retry();
        break;
      case 'replay':
        game.retry();
        break;
      case 'next':
        game.playNext();
        break;
      case 'map':
        game.openWorldMap();
        break;
      case 'reset-save':
        this.eraseSave();
        break;
      default:
        break;
    }
  }

  /* ---------------- screen management ---------------- */
  show(name) {
    for (const key of SCREENS) this.screens[key]?.classList.remove('active');
    const el = this.screens[name];
    if (el) el.classList.add('active');
    this.current = name;
  }

  hideAll() {
    for (const key of SCREENS) this.screens[key]?.classList.remove('active');
    this.current = null;
  }

  showMenu() {
    this.updateMenuMeta();
    this.show('menu');
  }

  showWorlds() {
    this.renderWorlds();
    this.show('worlds');
  }

  showCharacters() {
    this.renderCharacters();
    this.show('characters');
  }

  showSettings() {
    this.syncSettings();
    this.show('settings');
  }

  showRecords() {
    this.renderRecords();
    this.show('records');
  }

  showPause() {
    const game = this.game;
    const p = game.player;
    const level = game.level;
    const name = level ? `${level.id}  ·  ${level.name}` : '';
    this.setText('pause-level', name);
    this.setText('pause-hearts', p ? p.hearts : 0);
    this.setText('pause-lives', game.lives);
    this.setText('pause-berries', formatNumber(game.runBerries));
    this.setText('pause-tip', TIPS[Math.floor(Math.random() * TIPS.length)]);
    this.show('pause');
  }

  showResults(data) {
    const lvl = data.level;
    this.setText('result-level', `${lvl.id}  ·  ${lvl.name.toUpperCase()}`);
    this.setText('result-time', formatTime(data.time));
    this.setText('result-berries', formatNumber(data.berries));
    this.setText('result-secrets', `${data.chests}/${lvl.totalSecrets || 0}`);
    this.setText('result-kills', String(data.kills));
    this.bestTag('result-time-best', data.newTime ? 'NEW BEST' : 'BEST TIME');
    this.bestTag('result-berries-best', data.newBerries ? 'NEW BEST' : 'BERRIES');
    this.bestTag('result-secrets-best', data.newSecrets ? 'NEW BEST' : 'SECRETS');
    const nextId = data.next;
    const next = nextId ? getLevel(nextId) : null;
    const nextBtn = document.getElementById('result-next-btn');
    if (nextBtn) nextBtn.hidden = !next;
    this.setText('result-next-label', next
      ? `NEXT ISLAND  ${next.id} · ${next.name}`
      : 'THE NEXT WORLD AWAITS ON THE MAP');
    this.show('results');
  }

  showGameOver(data) {
    this.setText('gameover-level', data.level ? `${data.level.id}  ·  ${data.level.name.toUpperCase()}` : 'THE GRAND LINE');
    this.setText('gameover-berries', formatNumber(data.berries || 0));
    this.show('gameover');
  }

  showVictory(save, data) {
    const stats = [
      ['ISLANDS CLEARED', `${completedCount(save)}/${LEVELS.length}`],
      ['COMPLETION', `${totalCompletion(save)}%`],
      ['BERRIES', formatNumber(save.berries)],
      ['CREW', `${save.characters.length}/4`],
      ['ENEMIES', formatNumber(save.stats.kills || 0)],
      ['DEATHS', formatNumber(save.stats.deaths || 0)],
      ['BEST COMBO', formatNumber(save.stats.bestCombo || 0)],
      ['TIME AT SEA', formatTime(save.stats.playTime || 0)],
    ];
    const grid = document.getElementById('victory-stats');
    if (grid) {
      grid.innerHTML = stats.map(([k, v]) => `
        <div class="victory-stat"><span>${k}</span><b>${v}</b></div>
      `).join('');
    }
    void data;
    this.show('victory');
  }

  /* ---------------- menu values ---------------- */
  updateMenuMeta() {
    const game = this.game;
    const save = game.save;
    const id = nextObjective(save);
    const level = getLevel(id);
    this.setText('continue-sub', level ? `${level.id} · ${level.name.toUpperCase()}` : 'SET SAIL');
    this.setText('menu-berries', formatNumber(save.berries));
    this.setText('menu-completion', `${totalCompletion(save)}%`);
    this.setText('menu-crew', String(save.characters.length));
    const char = CHARACTERS.find((c) => c.id === save.character) || CHARACTERS[0];
    this.setText('menu-wanted', char.fullName.toUpperCase());
  }

  /* ---------------- worlds ---------------- */
  renderWorlds() {
    const grid = document.getElementById('worlds-grid');
    if (!grid) return;
    const save = this.game.save;
    grid.innerHTML = WORLDS.map((world) => {
      const state = this.game.worldState(world.id);
      const theme = THEMES[world.theme] || THEMES.eastblue;
      const prev = world.id > 0 ? WORLDS[world.id - 1] : null;
      const status = !state.unlocked
        ? 'LOCKED'
        : state.complete ? 'CONQUERED' : 'IN PROGRESS';
      const levels = state.levels.map((lv) => {
        const rec = lv.record;
        const done = rec?.complete;
        const meta = done ? formatTime(rec.bestTime) : lv.unlocked ? 'SET SAIL' : 'LOCKED';
        return `
          <button class="level-chip ${done ? 'done' : ''}" ${lv.unlocked ? `data-level="${lv.id}"` : 'disabled'}>
            <span class="chip-id">${lv.id}</span>
            <span class="chip-name">${lv.name}</span>
            <span class="chip-meta">${meta}</span>
          </button>`;
      }).join('');
      return `
        <article class="world-card ${state.unlocked ? '' : 'is-locked'} ${state.complete ? 'is-clear' : ''}"
          style="--wc-accent:${theme.accent};--wc-sky:${theme.skyTop};--wc-deep:${theme.seaDeep};">
          <div class="wc-band">
            <span class="wc-index">0${world.id + 1}</span>
            <span class="wc-status">${status}</span>
          </div>
          <h3 class="wc-name">${world.name}</h3>
          <div class="wc-island">${world.island}</div>
          <p class="wc-blurb">${world.blurb}</p>
          <div class="wc-boss"><span>BOSS</span> ${world.boss}</div>
          <div class="wc-levels">${levels}</div>
          ${state.unlocked ? '' : `
            <div class="world-lock">
              <div class="lock-icon">&#128274;</div>
              <div class="lock-title">SEA LOCKED</div>
              <div class="lock-sub">Clear ${prev ? prev.name : 'the previous world'} first</div>
            </div>`}
        </article>`;
    }).join('');
    this.setText('worlds-completion', `${totalCompletion(save)}%`);
  }

  /* ---------------- crew ---------------- */
  renderCharacters() {
    const grid = document.getElementById('crew-grid');
    if (!grid) return;
    const save = this.game.save;
    const stats = ['speed', 'jump', 'power', 'berry'];
    const ranges = {};
    for (const s of stats) {
      const vals = CHARACTERS.map((c) => c.stats[s]);
      ranges[s] = { min: Math.min(...vals), max: Math.max(...vals) };
    }
    grid.innerHTML = CHARACTERS.map((c) => {
      const unlocked = save.characters.includes(c.id);
      const selected = save.character === c.id;
      const bars = stats.map((s) => {
        const r = ranges[s];
        const pct = clamp(24 + ((c.stats[s] - r.min) / Math.max(0.0001, r.max - r.min)) * 76, 18, 100);
        return `<div class="stat-row"><span>${s.toUpperCase()}</span><div class="stat-bar"><i style="width:${pct}%"></i></div></div>`;
      }).join('');
      return `
        <article class="crew-card ${unlocked ? '' : 'is-locked'} ${selected ? 'is-selected' : ''}" data-char="${c.id}">
          <div class="crew-art">
            <canvas width="170" height="150" data-preview="${c.id}"></canvas>
            <div class="crew-lock">&#128274; LOCKED</div>
            ${selected ? '<div class="crew-selected">SELECTED</div>' : ''}
          </div>
          <div class="crew-body">
            <div class="crew-name">${c.name}<span>${c.title}</span></div>
            <div class="crew-full">${c.fullName}</div>
            <div class="crew-stats">${bars}</div>
            <div class="crew-hint">${unlocked ? c.abilities.basic.name : `UNLOCK: ${c.hint.toUpperCase()}`}</div>
          </div>
        </article>`;
    }).join('');
    this.previewCanvases.clear();
    for (const canvas of grid.querySelectorAll('canvas[data-preview]')) {
      this.previewCanvases.set(canvas.dataset.preview, canvas);
    }
    this.setText('crew-count', `${save.characters.length}/${CHARACTERS.length}`);
    this.tick(this.game.time, 0);
  }

  /* ---------------- records ---------------- */
  renderRecords() {
    const save = this.game.save;
    const statsWrap = document.getElementById('records-stats');
    if (statsWrap) {
      const items = [
        ['BERRIES', formatNumber(save.berries)],
        ['COMPLETION', `${totalCompletion(save)}%`],
        ['ISLANDS', `${completedCount(save)}/${LEVELS.length}`],
        ['CHESTS', formatNumber(save.stats.chests || 0)],
        ['ENEMIES', formatNumber(save.stats.kills || 0)],
        ['BOSSES', formatNumber(save.stats.bossKills || 0)],
        ['DEATHS', formatNumber(save.stats.deaths || 0)],
        ['BEST COMBO', formatNumber(save.stats.bestCombo || 0)],
        ['JUMPS', formatNumber(save.stats.jumps || 0)],
        ['TIME AT SEA', formatTime(save.stats.playTime || 0)],
      ];
      statsWrap.innerHTML = items.map(([k, v]) => `
        <div class="record-stat"><span>${k}</span><b>${v}</b></div>
      `).join('');
    }
    const table = document.getElementById('records-table');
    if (table) {
      table.innerHTML = WORLDS.map((world) => {
        const state = this.game.worldState(world.id);
        const rows = state.levels.map((lv) => {
          const rec = lv.record;
          return `
            <div class="rec-row">
              <span class="rec-id">${lv.id}</span>
              <span class="rec-name">${lv.name}</span>
              <span class="rec-time">${rec?.complete ? formatTime(rec.bestTime) : '—'}</span>
              <span class="rec-berry">${rec?.bestBerries != null ? formatNumber(rec.bestBerries) : '—'}</span>
              <span class="rec-check">${rec?.complete ? '&#10003;' : lv.unlocked ? '&#9675;' : '&#128274;'}</span>
            </div>`;
        }).join('');
        return `
          <div class="rec-world ${state.unlocked ? '' : 'is-locked'}">
            <div class="rec-head"><b>${world.name}</b><span>${state.complete ? 'CONQUERED' : state.unlocked ? 'CHARTS OPEN' : 'UNEXPLORED'}</span></div>
            <div class="rec-row rec-labels"><span>ID</span><span>ISLAND</span><span>TIME</span><span>BERRIES</span><span></span></div>
            ${rows}
          </div>`;
      }).join('');
    }
    this.setText('records-completion', `${totalCompletion(save)}%`);
  }

  /* ---------------- settings ---------------- */
  syncSettings() {
    const s = this.game.settings;
    for (const key of ['master', 'music', 'sfx']) {
      const el = this.root.querySelector(`[data-setting="${key}"]`);
      if (el) el.value = String(Math.round((s[key] ?? 0.8) * 100));
    }
    for (const key of ['shake', 'hints']) {
      const el = this.root.querySelector(`[data-toggle="${key}"]`);
      if (el) el.checked = Boolean(s[key]);
    }
    this.syncSettingValues();
  }

  syncSettingValues() {
    const s = this.game.settings;
    for (const key of ['master', 'music', 'sfx']) {
      const out = this.root.querySelector(`[data-output="${key}"]`);
      if (out) out.textContent = `${Math.round((s[key] ?? 0) * 100)}%`;
    }
  }

  eraseSave() {
    if (!window.confirm('Erase all progress, berries and unlocked crew? This cannot be undone.')) return;
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch (err) { void err; }
    this.game.save = this.game.loadSave();
    this.game.settings = { ...this.game.settings };
    this.game.refreshUnlocks(true);
    this.game.writeSave();
    this.game.applySettings();
    this.syncSettings();
    this.game.quitToMenu();
    this.toast('A FRESH LOG. A FRESH ADVENTURE.', 'info', 2.6);
  }

  /* ---------------- toasts ---------------- */
  toast(text, kind = 'info', seconds = 2.2) {
    const wrap = document.getElementById('toasts');
    if (!wrap) return;
    const icons = {
      unlock: '&#9733;', world: '&#9760;', level: '&#9873;', warn: '!', boss: '&#9760;', info: '&#8226;',
    };
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.innerHTML = `<span class="toast-icon">${icons[kind] || icons.info}</span><span class="toast-text">${text}</span>`;
    wrap.appendChild(el);
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 450);
    }, seconds * 1000);
  }

  /* ---------------- per-frame ---------------- */
  tick(time, dt) {
    this.metaTimer += dt;
    if (this.current === 'menu' && this.metaTimer > 0.6) {
      this.metaTimer = 0;
      this.updateMenuMeta();
    }
    if (this.current !== 'characters') return;
    for (const [id, canvas] of this.previewCanvases) {
      const ctx = canvas.getContext('2d');
      const unlocked = this.game.save.characters.includes(id);
      const selected = this.game.save.character === id;
      drawCharacterPreview(ctx, id, canvas.width, canvas.height, time, unlocked && selected);
      if (!unlocked) {
        ctx.fillStyle = 'rgba(5,9,15,0.42)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  /* ---------------- tiny helpers ---------------- */
  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  bestTag(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-new', text === 'NEW BEST');
  }
}
