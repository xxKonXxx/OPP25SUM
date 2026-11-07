/* =========================================================
   main.js — boot the game, wire the UI, unlock audio
   ========================================================= */

import { Game } from './game.js';
import { UI } from './ui.js';

function showBootError(err) {
  console.error('[Grand Line] failed to start:', err);
  const stage = document.getElementById('stage');
  if (!stage) return;
  let box = document.getElementById('boot-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'boot-error';
    box.style.cssText = [
      'position:absolute', 'inset:0', 'z-index:99', 'display:flex',
      'flex-direction:column', 'align-items:center', 'justify-content:center',
      'gap:10px', 'padding:24px', 'text-align:center',
      'background:radial-gradient(circle at 50% 35%,#16283d,#070c14 70%)',
      'color:#f6e7c8', 'font-family:Georgia,serif',
    ].join(';');
    stage.appendChild(box);
  }
  box.innerHTML = `
    <div style="font-size:11px;letter-spacing:4px;color:#e8b95c">THE LOG POSE SPUN OUT</div>
    <div style="font-size:22px;font-weight:700">The adventure could not start.</div>
    <div style="max-width:340px;font-size:12px;line-height:1.6;opacity:.7">
      Serve this folder over HTTP (for example <code>node server.js</code>) and
      make sure your browser supports ES modules and the Web Audio API.
    </div>
    <div style="font-size:11px;opacity:.45;word-break:break-word;max-width:360px">${String(err && err.message ? err.message : err)}</div>
  `;
}

function boot() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) throw new Error('Missing #game-canvas');

  const game = new Game(canvas);
  const ui = new UI(game);
  game.ui = ui;
  game.applySettings();

  /* Keep the letterboxed stage correctly sized before the first frame. */
  ui.setScale();

  /* Browsers only allow Web Audio after a user gesture. Unlock once, then
     start the menu theme if we're still on the main menu. */
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    game.audio.init();
    game.audio.setSettings(game.settings);
    if (game.state === 'menu') game.audio.playMusic('menu');
    window.removeEventListener('pointerdown', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
    window.removeEventListener('touchstart', unlockAudio, true);
  };
  window.addEventListener('pointerdown', unlockAudio, true);
  window.addEventListener('keydown', unlockAudio, true);
  window.addEventListener('touchstart', unlockAudio, true);

  /* Leaving the tab should never cost the player a life. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (game.state === 'playing') game.pause();
    } else {
      game.lastTs = 0;
      game.input.clear();
    }
  });

  /* Flush progress before the page goes away. */
  const flush = () => {
    try {
      game.saveGame();
      game.writeSettings();
    } catch (err) {
      console.warn('[Grand Line] save failed:', err);
    }
  };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);

  /* The canvas should never steal keyboard focus from the page. */
  canvas.addEventListener('pointerdown', (e) => e.preventDefault());

  window.game = game;
  window.ui = ui;

  /* Recover cleanly if the loop throws (e.g. a GPU context loss). */
  window.addEventListener('error', (e) => {
    if (e && e.message && /Script error/i.test(e.message)) return;
    console.error('[Grand Line] runtime error:', e.error || e.message);
  });

  return game;
}

try {
  boot();
} catch (err) {
  showBootError(err);
}
