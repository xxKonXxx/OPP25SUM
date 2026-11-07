/* =========================================================
   worldart.js — parallax backgrounds, terrain rendering, decor
   All art is generated procedurally. No external assets.
   ========================================================= */

import { THEMES, TILE, VIEW_W, VIEW_H } from './config.js';
import { hash2, seeded, withAlpha, shade, clamp } from './utils.js';
import { drawText, textWidth } from './pixelfont.js';

const OUT = '#1b1b28';

/* ---------------- pixel helpers ---------------- */
function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function cloudShape(ctx, x, y, s, color, shade, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const blobs = [
    [0, 0, 16], [14, -6, 12], [28, 2, 14], [10, 5, 10], [24, 7, 9],
  ];
  ctx.fillStyle = shade;
  for (const [ox, oy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + ox * s, y + oy * s + 3 * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  for (const [ox, oy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + ox * s, y + oy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // flat pixel bottom
  pxRect(ctx, x - 14 * s, y + 10 * s, 58 * s, 4 * s, color);
  pxRect(ctx, x - 10 * s, y + 14 * s, 48 * s, 2 * s, shade);
  ctx.restore();
}

function drawSun(ctx, x, y, r, color, glow) {
  const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
}

function drawSea(ctx, theme, time, horizon, camX, calm = false) {
  const g = ctx.createLinearGradient(0, horizon, 0, VIEW_H);
  g.addColorStop(0, theme.seaTop);
  g.addColorStop(0.55, shade(theme.seaTop, -18));
  g.addColorStop(1, theme.seaDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, VIEW_W, VIEW_H - horizon);

  // horizon line + haze
  ctx.fillStyle = withAlpha(theme.foam, 0.35);
  ctx.fillRect(0, horizon, VIEW_W, 1);
  ctx.fillStyle = withAlpha(theme.foam, 0.07);
  ctx.fillRect(0, horizon + 1, VIEW_W, 8);

  const bands = calm ? 5 : 8;
  for (let i = 0; i < bands; i++) {
    const yy = horizon + 6 + i * (i > 4 ? 16 : 10);
    const speed = 5 + i * 2.2;
    const amp = 0.8 + i * 0.22;
    const count = 7 + i * 2;
    for (let k = 0; k < count; k++) {
      let bx = (k * (VIEW_W / count) + i * 41 + time * speed * (i % 2 ? 1 : -1) - camX * 0.01);
      bx = ((bx % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60) - 30;
      const wave = Math.sin(time * 1.2 + k * 1.1 + i * 0.7) * amp;
      const len = 5 + (k % 3) * 5 + i;
      ctx.fillStyle = i < 3 ? withAlpha(theme.foam, 0.45) : withAlpha(theme.seaDeep, 0.4);
      ctx.fillRect(Math.round(bx), Math.round(yy + wave), len, i < 2 ? 1 : 2);
    }
  }
  // sparkles on water
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 71 + time * 12 * ((i % 3) + 1)) % (VIEW_W + 20)) - 10;
    const sy = horizon + 8 + ((i * 37) % Math.max(20, VIEW_H - horizon - 20));
    if (Math.sin(time * 2.4 + i * 1.7) > 0.72) {
      ctx.fillStyle = withAlpha(theme.foam, 0.55);
      ctx.fillRect(sx | 0, sy | 0, 2, 1);
    }
  }
}

function drawFarIslands(ctx, theme, camX, time, baseY) {
  const off = (camX * 0.16) % 760;
  ctx.save();
  // distant hill masses
  ctx.fillStyle = withAlpha(theme.far, 0.55);
  for (let k = -1; k < 3; k++) {
    const bx = k * 380 - off + 60;
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.quadraticCurveTo(bx + 50, baseY - 44, bx + 110, baseY - 14);
    ctx.quadraticCurveTo(bx + 150, baseY - 30, bx + 200, baseY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = withAlpha(theme.far2, 0.75);
  for (let k = -1; k < 3; k++) {
    const bx = k * 300 - ((camX * 0.24) % 600) + 120;
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.quadraticCurveTo(bx + 34, baseY - 30, bx + 70, baseY - 8);
    ctx.quadraticCurveTo(bx + 100, baseY - 18, bx + 130, baseY);
    ctx.closePath();
    ctx.fill();
  }
  // tiny palm silhouettes on far islands
  ctx.fillStyle = withAlpha(theme.mid, 0.8);
  for (let k = 0; k < 7; k++) {
    const bx = ((k * 137 - camX * 0.22) % 620 + 620) % 620 - 70;
    const by = baseY - 14 - (k % 3) * 4;
    pxRect(ctx, bx, by - 16, 2, 16, withAlpha(theme.mid, 0.8));
    for (let f = 0; f < 4; f++) {
      const ang = -Math.PI * 0.9 + f * 0.5 + Math.sin(time + k) * 0.04;
      pxRect(ctx, bx + Math.cos(ang) * 7 - 1, by - 16 + Math.sin(ang) * 5, 7, 1, withAlpha(theme.mid, 0.8));
    }
  }
  ctx.restore();
}

function drawTownSilhouette(ctx, theme, camX, time, baseY) {
  const off = (camX * 0.18) % 420;
  for (let layer = 0; layer < 2; layer++) {
    const col = layer === 0 ? withAlpha(theme.far2, 0.5) : withAlpha(theme.mid, 0.85);
    const par = layer === 0 ? 0.18 : 0.3;
    const o = (camX * par) % 420;
    ctx.fillStyle = col;
    for (let k = -1; k < 3; k++) {
      const bx = k * 210 - o + 10;
      let x = bx;
      let i = (k + 20);
      while (x < bx + 210) {
        const w = 22 + ((i * 13) % 34);
        const h = 24 + ((i * 29) % 46) + layer * 6;
        pxRect(ctx, x, baseY - h, w, h, col);
        // roof
        ctx.beginPath();
        ctx.moveTo(x - 4, baseY - h);
        ctx.lineTo(x + w / 2, baseY - h - 12);
        ctx.lineTo(x + w + 4, baseY - h);
        ctx.closePath(); ctx.fill();
        // lit window
        if (layer === 1 && (i % 2 === 0)) {
          ctx.fillStyle = withAlpha('#ffcf7a', 0.8);
          pxRect(ctx, x + w * 0.3, baseY - h + 10, 4, 5, withAlpha('#ffcf7a', 0.8));
          ctx.fillStyle = col;
        }
        x += w + 8 + ((i * 7) % 12);
        i++;
      }
    }
  }
  // mast silhouettes
  ctx.fillStyle = withAlpha(theme.mid, 0.7);
  for (let k = 0; k < 4; k++) {
    const bx = ((k * 143 - camX * 0.12) % 520 + 520) % 520 - 40;
    pxRect(ctx, bx, baseY - 52, 2, 52, withAlpha(theme.mid, 0.7));
    ctx.beginPath();
    ctx.moveTo(bx + 2, baseY - 50);
    ctx.lineTo(bx + 20, baseY - 38);
    ctx.lineTo(bx + 2, baseY - 26);
    ctx.closePath(); ctx.fill();
  }
  void off;
}

function drawDunes(ctx, theme, camX, time, baseY) {
  for (let layer = 0; layer < 3; layer++) {
    const col = [withAlpha(theme.far, 0.6), withAlpha(theme.far2, 0.75), withAlpha(theme.mid, 0.9)][layer];
    const par = 0.1 + layer * 0.09;
    const o = (camX * par) % 500;
    ctx.fillStyle = col;
    for (let k = -1; k < 3; k++) {
      const bx = k * 250 - o;
      ctx.beginPath();
      ctx.moveTo(bx - 20, baseY);
      ctx.quadraticCurveTo(bx + 40, baseY - 28 - layer * 14, bx + 110, baseY - 6);
      ctx.quadraticCurveTo(bx + 180, baseY - 34 - layer * 8, bx + 280, baseY);
      ctx.closePath(); ctx.fill();
    }
  }
  // pyramids
  ctx.fillStyle = withAlpha(theme.mid, 0.9);
  for (let k = 0; k < 2; k++) {
    const bx = ((k * 330 - camX * 0.12) % 560 + 560) % 560 - 60;
    const h = k === 0 ? 58 : 40;
    ctx.beginPath();
    ctx.moveTo(bx, baseY - 4);
    ctx.lineTo(bx + 46, baseY - h);
    ctx.lineTo(bx + 96, baseY - 4);
    ctx.closePath(); ctx.fill();
    pxRect(ctx, bx + 40, baseY - h * 0.45, 12, 3, withAlpha(theme.ground.dark, 0.5));
  }
  // ruined arches
  ctx.fillStyle = withAlpha(theme.far2, 0.8);
  for (let k = 0; k < 3; k++) {
    const bx = ((k * 210 - camX * 0.2) % 480 + 480) % 480 - 40;
    pxRect(ctx, bx, baseY - 34, 8, 34, withAlpha(theme.far2, 0.8));
    pxRect(ctx, bx + 32, baseY - 34, 8, 34, withAlpha(theme.far2, 0.8));
    pxRect(ctx, bx, baseY - 38, 40, 6, withAlpha(theme.far2, 0.8));
  }
}

function drawFortress(ctx, theme, camX, time, baseY) {
  const o = (camX * 0.14) % 500;
  // giant towers
  for (let k = -1; k < 3; k++) {
    const bx = k * 250 - o + 30;
    const h = 150;
    ctx.fillStyle = withAlpha(theme.mid, 0.72);
    pxRect(ctx, bx, baseY - h, 46, h, withAlpha(theme.mid, 0.72));
    pxRect(ctx, bx + 8, baseY - h - 18, 30, 18, withAlpha(theme.mid, 0.72));
    // roof
    ctx.beginPath();
    ctx.moveTo(bx + 2, baseY - h - 18);
    ctx.lineTo(bx + 23, baseY - h - 40);
    ctx.lineTo(bx + 44, baseY - h - 18);
    ctx.closePath(); ctx.fill();
    // windows
    for (let wy = 0; wy < 5; wy++) {
      pxRect(ctx, bx + 14, baseY - h + 16 + wy * 20, 6, 8, withAlpha('#cfe6ff', 0.28));
      pxRect(ctx, bx + 30, baseY - h + 16 + wy * 20, 6, 8, withAlpha('#cfe6ff', 0.18));
    }
    // bridge
    if (k >= 0) pxRect(ctx, bx - 30, baseY - 70, 40, 8, withAlpha(theme.far2, 0.7));
  }
  // waterfall
  const wx = ((90 - camX * 0.2) % 460 + 460) % 460;
  ctx.fillStyle = withAlpha('#bfe6ff', 0.25);
  pxRect(ctx, wx, baseY - 120, 18, 120, withAlpha('#bfe6ff', 0.22));
  for (let i = 0; i < 10; i++) {
    const yy = baseY - 120 + ((time * 40 + i * 13) % 120);
    pxRect(ctx, wx + 2 + (i % 3) * 5, yy, 2, 7, withAlpha('#eaf8ff', 0.4));
  }
  // flags
  ctx.fillStyle = withAlpha('#b33a3a', 0.65);
  for (let i = 0; i < 5; i++) {
    const fx = ((i * 97 - camX * 0.2) % 480 + 480) % 480;
    pxRect(ctx, fx, baseY - 38, 1, 22, withAlpha(theme.far2, 0.8));
    pxRect(ctx, fx + 1, baseY - 38, 9, 6, withAlpha('#b33a3a', 0.6));
  }
}

function drawWarScene(ctx, theme, camX, time, baseY) {
  const o = (camX * 0.12) % 520;
  // fortress HQ
  ctx.fillStyle = withAlpha(theme.far2, 0.9);
  for (let k = -1; k < 3; k++) {
    const bx = k * 260 - o;
    const h = 96;
    pxRect(ctx, bx + 20, baseY - h, 150, h, withAlpha(theme.far2, 0.9));
    pxRect(ctx, bx + 56, baseY - h - 40, 78, 42, withAlpha(theme.far2, 0.9));
    pxRect(ctx, bx + 76, baseY - h - 62, 38, 24, withAlpha(theme.far2, 0.9));
    // windows glow
    for (let i = 0; i < 4; i++) {
      pxRect(ctx, bx + 32 + i * 32, baseY - h + 20, 8, 12, withAlpha('#ff9a5c', 0.4));
      pxRect(ctx, bx + 32 + i * 32, baseY - h + 48, 8, 8, withAlpha('#ff7a3c', 0.25));
    }
    // marine flags
    pxRect(ctx, bx + 50, baseY - h - 40, 2, 22, withAlpha('#d9d9d9', 0.5));
    pxRect(ctx, bx + 52, baseY - h - 40, 12, 7, withAlpha('#e8e8e8', 0.45));
  }
  // burning ships
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 149 - camX * 0.2) % 560 + 560) % 560 - 20;
    const sy = baseY + 20 + (i % 2) * 16;
    ctx.fillStyle = withAlpha('#1c1018', 0.9);
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx + 26, sy - 8); ctx.lineTo(sx + 62, sy - 4); ctx.lineTo(sx + 74, sy); ctx.closePath(); ctx.fill();
    pxRect(ctx, sx + 30, sy - 34, 2, 28, withAlpha('#241018', 0.9));
    // flame
    for (let f = 0; f < 3; f++) {
      const fh = 5 + Math.sin(time * 7 + i + f) * 3;
      ctx.fillStyle = f === 0 ? '#ff6b35' : '#ffd166';
      pxRect(ctx, sx + 24 + f * 10, sy - 16 - fh, 4, fh, ctx.fillStyle);
    }
    // smoke
    ctx.fillStyle = withAlpha('#2c2028', 0.5);
    for (let s = 0; s < 4; s++) {
      const sxx = sx + 20 + s * 9 + Math.sin(time + s + i) * 4;
      const syy = sy - 26 - s * 10 - ((time * 8) % 10);
      ctx.beginPath(); ctx.arc(sxx, syy, 6 + s * 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // ash glow at horizon
  const g = ctx.createLinearGradient(0, baseY - 20, 0, VIEW_H);
  g.addColorStop(0, 'rgba(255,90,40,0)');
  g.addColorStop(1, 'rgba(255,90,40,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(0, baseY - 20, VIEW_W, VIEW_H);
}

function drawParkScene(ctx, theme, camX, time, baseY) {
  const o = (camX * 0.18) % 460;
  for (let k = -1; k < 3; k++) {
    const bx = k * 230 - o + 40;
    ctx.fillStyle = withAlpha(theme.mid, 0.9);
    ctx.beginPath();
    ctx.moveTo(bx - 20, baseY);
    ctx.lineTo(bx + 10, baseY - 58);
    ctx.lineTo(bx + 54, baseY - 26);
    ctx.lineTo(bx + 92, baseY);
    ctx.closePath(); ctx.fill();
  }
  // palm silhouettes
  ctx.fillStyle = withAlpha(theme.mid, 0.95);
  for (let k = 0; k < 6; k++) {
    const bx = ((k * 121 - camX * 0.28) % 520 + 520) % 520 - 30;
    const by = baseY + 2;
    ctx.fillRect(bx, by - 34, 2, 34);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI + f * 0.45 + Math.sin(time * 0.8 + k) * 0.03;
      pxRect(ctx, bx + Math.cos(a) * 9, by - 34 + Math.sin(a) * 6, 9, 2, withAlpha(theme.mid, 0.95));
    }
  }
}

const FAR_CLOUDS = (() => {
  const rnd = seeded(7);
  return Array.from({ length: 9 }, () => ({
    x: rnd() * 760, y: 22 + rnd() * 90, s: 0.5 + rnd() * 0.75, sp: 2 + rnd() * 5,
  }));
})();

export function drawBackground(ctx, themeName, camX, camY, time, opts = {}) {
  const theme = THEMES[themeName] || THEMES.eastblue;
  const horizon = opts.horizon ?? 170;

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.68, theme.skyBot);
  sky.addColorStop(1, theme.seaTop);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // stars (dark worlds)
  if (themeName === 'marineford' || themeName === 'enies' || themeName === 'orange') {
    for (let i = 0; i < 26; i++) {
      const sx = (i * 97 + 13) % VIEW_W;
      const sy = (i * 41 + 7) % 100;
      const tw = Math.sin(time * 1.5 + i * 2.3) > 0.4;
      if (!tw) continue;
      ctx.fillStyle = withAlpha('#fff7e0', 0.25 + (i % 3) * 0.15);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // sun / moon
  if (themeName === 'marineford') drawSun(ctx, 100, 74, 20, '#ff9a5c', 'rgba(255,90,30,0.22)');
  else if (themeName === 'enies') drawSun(ctx, 360, 48, 14, '#dfe9f0', 'rgba(200,225,240,0.16)');
  else if (themeName === 'orange') drawSun(ctx, 120, 118, 22, '#ffd08a', 'rgba(255,150,90,0.3)');
  else if (themeName === 'alabasta') drawSun(ctx, 96, 52, 24, '#fff0b0', 'rgba(255,220,120,0.35)');
  else if (themeName === 'arlong') drawSun(ctx, 370, 52, 16, '#f5f2b0', 'rgba(220,255,210,0.18)');
  else drawSun(ctx, 388, 54, 18, theme.sun, theme.sunGlow);

  const camPar = -camX * 0.03;
  // clouds
  ctx.save();
  ctx.translate(0, Math.min(0, camPar));
  for (let i = 0; i < FAR_CLOUDS.length; i++) {
    const c = FAR_CLOUDS[i];
    const span = VIEW_W + 220;
    let cx = ((c.x - camX * 0.07 + time * c.sp) % span + span) % span - 110;
    const alpha = themeName === 'marineford' ? 0.28 : 0.82;
    cloudShape(ctx, cx, c.y, c.s * (themeName === 'alabasta' ? 0.8 : 1), theme.cloud, theme.cloudShade, alpha);
  }
  ctx.restore();

  // distant layer per world
  if (theme.bg === 'island') drawFarIslands(ctx, theme, camX, time, horizon);
  else if (theme.bg === 'town') drawTownSilhouette(ctx, theme, camX, time, horizon);
  else if (theme.bg === 'desert') drawDunes(ctx, theme, camX, time, horizon);
  else if (theme.bg === 'fortress') drawFortress(ctx, theme, camX, time, horizon);
  else if (theme.bg === 'war') drawWarScene(ctx, theme, camX, time, horizon);
  else if (theme.bg === 'park') drawParkScene(ctx, theme, camX, time, horizon);

  // sea or sand haze
  if (themeName === 'alabasta') {
    const g = ctx.createLinearGradient(0, horizon, 0, VIEW_H);
    g.addColorStop(0, withAlpha(theme.ground.light, 0.6));
    g.addColorStop(1, theme.ground.base);
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, VIEW_W, VIEW_H - horizon);
    // heat shimmer
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 5; i++) {
      const yy = horizon + 8 + i * 10 + Math.sin(time * 1.5 + i) * 2;
      ctx.fillStyle = theme.ground.light;
      ctx.fillRect(0, yy, VIEW_W, 1);
    }
    ctx.globalAlpha = 1;
  } else if (themeName === 'enies') {
    drawSea(ctx, theme, time, horizon, camX, true);
    // mist
    ctx.fillStyle = 'rgba(210,230,245,0.06)';
    for (let i = 0; i < 4; i++) {
      const yy = horizon - 20 + i * 16 + Math.sin(time * 0.5 + i) * 3;
      ctx.fillRect(0, yy, VIEW_W, 6);
    }
  } else {
    drawSea(ctx, theme, time, horizon, camX);
  }

  // marine ships on horizon
  if (themeName === 'eastblue' || themeName === 'orange' || themeName === 'marineford') {
    for (let i = 0; i < 3; i++) {
      const span = 680;
      let sx = ((i * 231 - camX * 0.09 + time * 1.5) % span + span) % span - 60;
      const sy = horizon + 8 + (i % 2) * 5;
      ctx.fillStyle = withAlpha(theme.mid, 0.75);
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + 10, sy - 6); ctx.lineTo(sx + 34, sy - 4); ctx.lineTo(sx + 40, sy);
      ctx.closePath(); ctx.fill();
      pxRect(ctx, sx + 20, sy - 24, 2, 20, withAlpha(theme.mid, 0.75));
      ctx.beginPath();
      ctx.moveTo(sx + 22, sy - 24); ctx.lineTo(sx + 34, sy - 16); ctx.lineTo(sx + 22, sy - 12);
      ctx.closePath(); ctx.fill();
    }
  }

  // birds
  if (themeName !== 'enies' && themeName !== 'marineford') {
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 127 + time * (12 + i * 3) - camX * 0.05) % 560 + 560) % 560 - 40;
      const by = 40 + (i % 3) * 22 + Math.sin(time * 1.3 + i) * 4;
      ctx.strokeStyle = withAlpha('#2b2b3a', 0.55);
      ctx.lineWidth = 1;
      const flap = Math.sin(time * 8 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(bx - 3, by + flap); ctx.lineTo(bx, by); ctx.lineTo(bx + 3, by + flap);
      ctx.stroke();
    }
  }

  // vending: subtle vignette
  const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(6,10,20,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/* ---------------- menu hero scene ---------------- */
export function drawMenuScene(ctx, time) {
  const theme = THEMES.eastblue;
  // sunset-ish sky
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#1c4f7a');
  sky.addColorStop(0.45, '#56a9c9');
  sky.addColorStop(0.72, '#ffd38a');
  sky.addColorStop(1, '#ff9e6b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // stars up top
  for (let i = 0; i < 30; i++) {
    const sx = (i * 89 + 11) % VIEW_W;
    const sy = (i * 31 + 5) % 70;
    if (Math.sin(time * 1.2 + i * 2.1) > 0.2) {
      ctx.fillStyle = withAlpha('#fff4d0', 0.4);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }
  drawSun(ctx, 392, 170, 30, '#ffe6a0', 'rgba(255,190,120,0.4)');

  // clouds
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 121 + time * (3 + i)) % 620 + 620) % 620 - 70;
    cloudShape(ctx, cx, 34 + (i % 3) * 24, 0.55 + (i % 3) * 0.22, '#fff3e0', '#dcc3b4', 0.5);
  }

  // distant island
  ctx.fillStyle = 'rgba(38,70,78,0.85)';
  ctx.beginPath();
  ctx.moveTo(-20, 188);
  ctx.quadraticCurveTo(60, 120, 150, 184);
  ctx.quadraticCurveTo(190, 150, 240, 188);
  ctx.lineTo(240, 200); ctx.lineTo(-20, 200);
  ctx.closePath(); ctx.fill();
  // little palm silhouette
  ctx.fillStyle = '#1e3f3a';
  for (let k = 0; k < 3; k++) {
    const bx = 40 + k * 36;
    ctx.fillRect(bx, 156, 2, 34);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI + f * 0.42;
      pxRect(ctx, bx + Math.cos(a) * 9, 156 + Math.sin(a) * 6, 9, 2, '#1e3f3a');
    }
  }

  // sea
  const sea = ctx.createLinearGradient(0, 186, 0, VIEW_H);
  sea.addColorStop(0, '#2c7fa8');
  sea.addColorStop(1, '#0b3552');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 186, VIEW_W, VIEW_H - 186);
  ctx.fillStyle = 'rgba(255,225,170,0.35)';
  ctx.fillRect(0, 186, VIEW_W, 1);
  // sun reflection
  for (let i = 0; i < 20; i++) {
    const w = 18 + Math.sin(time + i) * 10;
    ctx.fillStyle = withAlpha('#ffd9a0', 0.25 - i * 0.008);
    ctx.fillRect(392 - w / 2 + Math.sin(time * 2 + i) * 4, 194 + i * 4, w, 1);
  }
  // waves
  for (let i = 0; i < 7; i++) {
    const yy = 200 + i * 10;
    for (let k = 0; k < 8; k++) {
      const bx = ((k * 70 + time * (4 + i)) % 560) - 40;
      ctx.fillStyle = withAlpha('#bfeaff', 0.25);
      ctx.fillRect(bx, yy + Math.sin(time + k + i) * 1.5, 8 + (k % 3) * 4, 1);
    }
  }

  // ship silhouette
  drawPirateShip(ctx, 300, 196, time);
  // menu dock + luffy
  drawDock(ctx, 34, 236, time);
}

function drawPirateShip(ctx, x, y, time) {
  const bob = Math.sin(time * 1.4) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  // hull
  ctx.fillStyle = '#5a3320';
  ctx.beginPath();
  ctx.moveTo(-46, 6); ctx.quadraticCurveTo(-30, 24, 12, 24);
  ctx.quadraticCurveTo(48, 20, 58, 4);
  ctx.lineTo(40, -4); ctx.lineTo(-38, -4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2014';
  ctx.beginPath();
  ctx.moveTo(-40, 4); ctx.quadraticCurveTo(-20, 18, 20, 16);
  ctx.lineTo(50, 2); ctx.lineTo(-40, 2); ctx.closePath(); ctx.fill();
  // lion figurehead
  ctx.fillStyle = '#e5b34a';
  ctx.beginPath(); ctx.arc(58, -4, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4b1a';
  ctx.beginPath(); ctx.arc(60, -5, 4, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, 56, -14, 10, 4, '#e5b34a');
  // mast
  pxRect(ctx, 2, -66, 3, 68, '#6b4526');
  // sail
  ctx.fillStyle = '#f5ead0';
  ctx.beginPath();
  ctx.moveTo(6, -64); ctx.quadraticCurveTo(44, -46, 38, -12);
  ctx.lineTo(6, -14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d8c8a4';
  ctx.beginPath();
  ctx.moveTo(6, -64); ctx.quadraticCurveTo(-20, -44, -18, -14);
  ctx.lineTo(4, -14); ctx.closePath(); ctx.fill();
  // straw hat jolly roger
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(20, -38, 7, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, 17, -34, 6, 4, '#2b2b2b');
  ctx.fillStyle = '#e5b34a';
  ctx.beginPath(); ctx.ellipse(20, -43, 12, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -45, 6, Math.PI, 0); ctx.fill();
  // flags
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(3, -66); ctx.lineTo(-14, -61); ctx.lineTo(3, -56); ctx.closePath(); ctx.fill();
  // railing
  ctx.fillStyle = '#8a5a2b';
  for (let i = -4; i < 5; i++) pxRect(ctx, i * 10, -8, 2, 6, '#8a5a2b');
  ctx.restore();
}

function drawDock(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  // water lap
  ctx.fillStyle = 'rgba(10,35,55,0.5)';
  ctx.beginPath(); ctx.ellipse(34, 6, 46, 6, 0, 0, Math.PI * 2); ctx.fill();
  // posts
  ctx.fillStyle = '#4e3523';
  for (let i = 0; i < 4; i++) pxRect(ctx, i * 20 - 8, -4, 5, 18, '#4e3523');
  pxRect(ctx, -12, -2, 82, 6, '#6b4a2e');
  pxRect(ctx, -12, 4, 82, 3, '#4a3120');
  // luffy standing
  ctx.save();
  ctx.translate(26, 1);
  ctx.scale(1.55, 1.55);
  drawText(ctx, '', 0, 0);
  ctx.restore();
  // barrels
  ctx.fillStyle = '#7a4b2a';
  ctx.beginPath(); ctx.ellipse(-4, -10, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, -9, -12, 10, 3, '#51301a');
  // lantern glow
  const lg = ctx.createRadialGradient(66, -28, 2, 66, -28, 24);
  lg.addColorStop(0, 'rgba(255,210,130,0.5)');
  lg.addColorStop(1, 'rgba(255,210,130,0)');
  ctx.fillStyle = lg; ctx.fillRect(40, -54, 52, 52);
  pxRect(ctx, 64, -22, 3, 22, '#3a2618');
  pxRect(ctx, 61, -30, 9, 9, '#ffd166');
  ctx.restore();
}

/* ---------------- terrain ---------------- */
const solidIds = new Set([1, 2, 3]);

function neighbor(tiles, w, h, x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return 0;
  return tiles[y * w + x];
}
const isSolid = (v) => v === 1 || v === 2 || v === 3;

export function buildTerrain(level) {
  const theme = THEMES[level.theme] || THEMES.eastblue;
  const w = level.w, h = level.h;
  const canvas = document.createElement('canvas');
  canvas.width = w * TILE;
  canvas.height = h * TILE;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;

  const { ground, stone, wood } = theme;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = level.tiles[y * w + x];
      if (id === 0 || id === 6 || id === 7 || id === 8) continue;
      const X = x * TILE, Y = y * TILE;
      const above = neighbor(level.tiles, w, h, x, y - 1);
      const left = neighbor(level.tiles, w, h, x - 1, y);
      const right = neighbor(level.tiles, w, h, x + 1, y);
      const below = neighbor(level.tiles, w, h, x, y + 1);
      const r = hash2(x, y);

      if (id === 4) {
        // one-way plank / ledge
        if (theme.topStyle === 'stone' || theme.topStyle === 'cobble') {
          pxRect(g, X, Y, TILE, 7, stone.base);
          pxRect(g, X, Y, TILE, 2, stone.light);
          pxRect(g, X, Y + 5, TILE, 2, stone.dark);
          pxRect(g, X + 2, Y + 2, 2, 1, stone.light);
          pxRect(g, X + 11, Y + 2, 2, 1, stone.light);
          if (r > 0.5) pxRect(g, X + 6, Y + 3, 4, 1, stone.dark);
        } else {
          pxRect(g, X - 1, Y, TILE + 2, 7, wood.dark);
          pxRect(g, X, Y, TILE, 5, wood.base);
          pxRect(g, X, Y, TILE, 2, wood.light);
          pxRect(g, X + 3, Y + 3, 1, 2, wood.dark);
          pxRect(g, X + 12, Y + 3, 1, 2, wood.dark);
          if (level.theme === 'arlong') pxRect(g, X + 2, Y + 7, 1, 4, wood.dark);
        }
        continue;
      }

      if (id === 5) {
        // spikes
        pxRect(g, X, Y + 12, TILE, 4, '#3a3f4a');
        pxRect(g, X, Y + 12, TILE, 1, '#6a7280');
        for (let i = 0; i < 3; i++) {
          const sx = X + i * 5 + 1;
          g.fillStyle = '#9aa6b4';
          g.beginPath();
          g.moveTo(sx, Y + 12);
          g.lineTo(sx + 2, Y + 2);
          g.lineTo(sx + 4, Y + 12);
          g.closePath(); g.fill();
          g.fillStyle = '#dfe8f2';
          g.beginPath();
          g.moveTo(sx + 1, Y + 12);
          g.lineTo(sx + 2.2, Y + 4);
          g.lineTo(sx + 2.6, Y + 12);
          g.closePath(); g.fill();
        }
        continue;
      }

      if (id === 3) {
        // solid ornate block
        pxRect(g, X, Y, TILE, TILE, stone.base);
        pxRect(g, X, Y, TILE, 2, stone.light);
        pxRect(g, X, Y, 2, TILE, stone.light);
        pxRect(g, X, Y + TILE - 2, TILE, 2, stone.dark);
        pxRect(g, X + TILE - 2, Y, 2, TILE, stone.dark);
        pxRect(g, X + 4, Y + 4, 8, 8, withAlpha(stone.dark, 0.35));
        pxRect(g, X + 5, Y + 5, 6, 6, stone.base);
        if (level.theme === 'marineford') {
          pxRect(g, X + 6, Y + 6, 4, 1, withAlpha('#ff6b35', 0.6));
        }
        continue;
      }

      // id 1 or 2: ground body / ground top
      pxRect(g, X, Y, TILE, TILE, ground.base);
      // texture
      if (r > 0.45) pxRect(g, X + 2 + Math.floor(r * 9), Y + 4 + Math.floor(r * 8), 2, 1, ground.dark);
      if (r > 0.8) pxRect(g, X + 4, Y + 9, 4, 1, ground.light);
      if (r < 0.12) {
        pxRect(g, X + 6, Y + 5, 1, 6, withAlpha(ground.dark, 0.7));
        pxRect(g, X + 7, Y + 9, 3, 1, withAlpha(ground.dark, 0.7));
      }
      if (level.theme === 'enies') {
        pxRect(g, X + 2, Y + 3, 1, 1, withAlpha('#c7d6e2', 0.3));
        pxRect(g, X + 12, Y + 10, 1, 1, withAlpha('#c7d6e2', 0.22));
      }

      if (!isSolid(above)) {
        // top cap
        if (theme.topStyle === 'grass') {
          pxRect(g, X, Y, TILE, 5, ground.top);
          pxRect(g, X, Y, TILE, 2, ground.topLight);
          pxRect(g, X, Y + 4, TILE, 2, ground.topDark);
          if (r > 0.35) pxRect(g, X + 3 + Math.floor(r * 8), Y - 2, 1, 2, ground.topLight);
          if (r > 0.7) pxRect(g, X + 6 + Math.floor(r * 5), Y - 3, 1, 3, ground.top);
          if (r < 0.2) pxRect(g, X + 1, Y - 1, 1, 1, ground.topDark);
        } else if (theme.topStyle === 'sand') {
          pxRect(g, X, Y, TILE, 6, ground.top);
          pxRect(g, X, Y, TILE, 2, ground.topLight);
          pxRect(g, X, Y + 5, TILE, 2, ground.topDark);
          if (r > 0.5) {
            pxRect(g, X + 2, Y + 3, 6, 1, ground.topLight);
            pxRect(g, X + 9, Y + 4, 4, 1, ground.topLight);
          }
        } else if (theme.topStyle === 'cobble' || theme.topStyle === 'stone') {
          pxRect(g, X, Y, TILE, 4, stone.base);
          pxRect(g, X, Y, TILE, 1, stone.light);
          pxRect(g, X, Y + 4, TILE, 1, stone.dark);
          const off = (x % 2) * 5;
          pxRect(g, X + off + 2, Y + 4, 1, 4, stone.dark);
          pxRect(g, X + 8, Y + 4, 6, 1, withAlpha(stone.dark, 0.6));
        }
      }

      // edges
      if (!isSolid(left)) {
        pxRect(g, X, Y, 2, TILE, withAlpha(ground.dark, 0.85));
        if (!isSolid(above) && theme.topStyle === 'grass') pxRect(g, X, Y, 3, 2, ground.topDark);
      }
      if (!isSolid(right)) pxRect(g, X + TILE - 2, Y, 2, TILE, withAlpha(ground.dark, 0.7));
      if (!isSolid(below)) pxRect(g, X, Y + TILE - 2, TILE, 2, withAlpha(theme.topStyle === 'stone' ? stone.dark : ground.dark, 0.85));
    }
  }
  return canvas;
}

export function drawWater(ctx, level, camX, camY, time) {
  const theme = THEMES[level.theme] || THEMES.eastblue;
  const startX = Math.max(0, Math.floor(camX / TILE) - 1);
  const endX = Math.min(level.w - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
  const startY = Math.max(0, Math.floor(camY / TILE) - 1);
  const endY = Math.min(level.h - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const id = level.tiles[y * level.w + x];
      if (id !== 6 && id !== 7 && id !== 8) continue;
      const X = x * TILE, Y = y * TILE;
      const above = neighbor(level.tiles, level.w, level.h, x, y - 1);
      const isSurface = above !== id;

      if (id === 6) {
        const deep = ctx.createLinearGradient(0, Y, 0, Y + VIEW_H);
        deep.addColorStop(0, theme.water.deep);
        deep.addColorStop(1, shade(theme.water.deep, -20));
        ctx.fillStyle = withAlpha(theme.water.base, 0.82);
        ctx.fillRect(X, Y, TILE, TILE);
        if (isSurface) {
          const wave = Math.sin(time * 2 + x * 0.7) * 1.5;
          ctx.fillStyle = withAlpha(theme.water.light, 0.65);
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(X + i * 6, Y + 1 + wave + Math.sin(time + i + x) * 1, 5, 1);
          }
          ctx.fillStyle = withAlpha(theme.foam, 0.35);
          ctx.fillRect(X, Y + 4 + wave, TILE, 1);
        } else {
          ctx.fillStyle = withAlpha(theme.water.light, 0.13);
          ctx.fillRect(X + (Math.floor(time * 8 + x * 7) % 12), Y + 6, 3, 1);
          ctx.fillRect(X + (Math.floor(time * 5 + x * 3) % 14), Y + 11, 2, 1);
        }
        // caustics
        ctx.fillStyle = withAlpha(theme.water.light, 0.1);
        ctx.fillRect(X + ((x * 7 + Math.floor(time * 10)) % 12), Y + 2, 2, 7);
      } else if (id === 7) {
        // lava
        const glow = 0.5 + Math.sin(time * 2.4 + x) * 0.12;
        ctx.fillStyle = `rgba(190,45,16,${glow})`;
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = '#ff8a3c';
        if (isSurface) {
          const wave = Math.sin(time * 1.6 + x * 1.1) * 1.5;
          for (let i = 0; i < 3; i++) ctx.fillRect(X + i * 5, Y + 1 + wave, 4, 2);
        }
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(X + ((x * 5 + Math.floor(time * 6)) % 12), Y + 6, 3, 1);
      } else if (id === 8) {
        // quicksand
        ctx.fillStyle = withAlpha('#b8863f', 0.7);
        ctx.fillRect(X, Y, TILE, TILE);
        if (isSurface) {
          ctx.fillStyle = withAlpha('#e6c078', 0.7);
          const wave = Math.sin(time * 1.2 + x) * 1;
          ctx.fillRect(X, Y + 1 + wave, TILE, 2);
          ctx.fillStyle = withAlpha('#8a5a2c', 0.5);
          ctx.fillRect(X + 3, Y + 506 % 8, 4, 1);
        }
        ctx.fillStyle = withAlpha('#e6c078', 0.18);
        ctx.fillRect(X + ((x * 3 + Math.floor(time * 4)) % 12), Y + 9, 2, 1);
      }
    }
  }
}

/* ---------------- decor ---------------- */
function drawPalm(ctx, x, y, t, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const sway = Math.sin(t * 1.1 + x * 0.01) * 1.5;
  // trunk
  for (let i = 0; i < 7; i++) {
    const yy = -i * 7;
    const xx = Math.sin(sway * 0.02 + i * 0.2) * 2 + Math.floor(i / 3);
    pxRect(ctx, xx, yy - 7, 4, 7, i % 2 ? '#8a5a33' : '#7a4a26');
  }
  for (let i = 0; i < 4; i++) pxRect(ctx, 1, -i * 13 - 3, 1, 3, '#5f3a1c');
  const topX = Math.floor(7 / 3) + sway * 0.8;
  const topY = -50;
  // fronds
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.95 + i * 0.38 + Math.sin(t * 1.2 + i) * 0.03;
    const len = 17;
    for (let k = 1; k < len; k += 3) {
      const fx = topX + Math.cos(a) * k;
      const fy = topY + Math.sin(a) * k + Math.sin(k * 0.4) * 1.5;
      pxRect(ctx, fx, fy, 3, 2, k % 6 < 3 ? '#3f9c52' : '#2f7d40');
    }
  }
  // coconuts
  pxRect(ctx, topX - 2, topY + 2, 2, 2, '#6b4526');
  pxRect(ctx, topX + 2, topY + 3, 2, 2, '#6b4526');
  ctx.restore();
}

function drawHouse(ctx, x, y, w, h, theme, t) {
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(w / 2, 0, w * 0.6, 4, 0, 0, Math.PI * 2); ctx.fill();
  // walls
  pxRect(ctx, 0, -h, w, h, '#efe3c8');
  pxRect(ctx, 0, -h, w, 3, '#d9c9a6');
  pxRect(ctx, 0, -h, 3, h, '#d9c9a6');
  pxRect(ctx, w - 3, -h, 3, h, '#c4b18c');
  pxRect(ctx, 0, -4, w, 4, '#9c8a68');
  // door
  pxRect(ctx, w * 0.4, -22, 12, 18, '#6b4526');
  pxRect(ctx, w * 0.4, -22, 12, 2, '#4a2e18');
  pxRect(ctx, w * 0.4 + 9, -13, 2, 2, '#e5b34a');
  // window
  pxRect(ctx, w * 0.12, -h + 10, 10, 9, '#6d94a8');
  pxRect(ctx, w * 0.12, -h + 10, 10, 1, '#3f5f70');
  pxRect(ctx, w * 0.12 + 4, -h + 10, 1, 9, '#3f5f70');
  // roof
  ctx.fillStyle = theme === 'orange' ? '#a8422e' : theme === 'arlong' ? '#3f6f5a' : '#c25b3f';
  ctx.beginPath();
  ctx.moveTo(-6, -h);
  ctx.lineTo(w / 2, -h - 16);
  ctx.lineTo(w + 6, -h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(w / 2, -h - 16); ctx.lineTo(w + 6, -h); ctx.lineTo(w / 2, -h); ctx.closePath(); ctx.fill();
  // roof tiles
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(6 + i * 10, -h - 4 - i * 2, w - 20 - i * 8, 1);
  }
  // chimney smoke
  pxRect(ctx, w - 16, -h - 16, 6, 10, '#8a5a3a');
  const smoke = (t * 8) % 12;
  ctx.fillStyle = 'rgba(230,230,230,0.22)';
  ctx.beginPath(); ctx.arc(w - 13, -h - 26 - smoke, 3 + smoke * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBush(ctx, x, y, t) {
  ctx.fillStyle = '#2f8f3e';
  ctx.beginPath(); ctx.arc(x, y - 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y - 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 7, y - 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath(); ctx.arc(x - 2, y - 7, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8be36b';
  pxRect(ctx, x - 3, y - 11, 2, 2, '#8be36b');
}

function drawRock(ctx, x, y, s = 1, theme = 'eastblue') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#7a8494';
  ctx.beginPath();
  ctx.moveTo(-12, 0); ctx.lineTo(-9, -8); ctx.lineTo(-2, -12); ctx.lineTo(8, -9);
  ctx.lineTo(12, -2); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9aa6b4';
  ctx.beginPath();
  ctx.moveTo(-8, -7); ctx.lineTo(-2, -11); ctx.lineTo(4, -8); ctx.lineTo(-1, -5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-6, -2, 14, 2);
  if (theme === 'alabasta') { ctx.fillStyle = 'rgba(255,240,190,0.25)'; ctx.fillRect(-8, -9, 8, 2); }
  ctx.restore();
}

function drawBarrel(ctx, x, y, t) {
  ctx.fillStyle = '#6b4526';
  ctx.beginPath(); ctx.ellipse(x, y - 9, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath(); ctx.ellipse(x - 1, y - 10, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a2e18';
  pxRect(ctx, x - 7, y - 14, 14, 2, '#4a2e18');
  pxRect(ctx, x - 7, y - 5, 14, 2, '#4a2e18');
  pxRect(ctx, x - 1, y - 16, 2, 2, '#d9c9a6');
}

function drawBanner(ctx, x, y, t, theme = 'eastblue') {
  pxRect(ctx, x, y - 58, 3, 58, '#6b4a2e');
  // flag
  const wave = Math.sin(t * 2 + x) * 2;
  ctx.fillStyle = theme === 'marineford' ? '#8a1f1f' : '#c0392b';
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 58);
  ctx.lineTo(x + 30, y - 55 + wave);
  ctx.lineTo(x + 26, y - 47 + wave);
  ctx.lineTo(x + 30, y - 40 + wave * 0.5);
  ctx.lineTo(x + 3, y - 38);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f5ead0';
  ctx.beginPath(); ctx.arc(x + 14, y - 48, 4, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, x + 10, y - 42, 2, 4, '#f5ead0');
  pxRect(ctx, x + 16, y - 42, 2, 4, '#f5ead0');
  pxRect(ctx, x + 9, y - 50, 10, 1, '#f5ead0');
}

function drawPillar(ctx, x, y, h, theme) {
  ctx.fillStyle = '#b9a77f';
  pxRect(ctx, x - 7, y - h, 14, h, '#c2b083');
  pxRect(ctx, x - 8, y - h - 4, 16, 5, '#d3c197');
  pxRect(ctx, x - 8, y - 4, 16, 4, '#a08e68');
  pxRect(ctx, x - 7, y - h, 2, h, '#d3c197');
  pxRect(ctx, x + 5, y - h, 2, h, '#a08e68');
  // cracks
  pxRect(ctx, x - 2, y - h * 0.7, 1, 8, '#8a7a55');
  pxRect(ctx, x - 4, y - h * 0.4, 5, 1, '#8a7a55');
  // sand at base
  ctx.fillStyle = 'rgba(210,170,100,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
}

function drawCactus(ctx, x, y, t) {
  pxRect(ctx, x - 2, y - 20, 4, 20, '#5f8f4a');
  pxRect(ctx, x - 9, y - 16, 4, 7, '#5f8f4a');
  pxRect(ctx, x - 9, y - 16, 7, 3, '#5f8f4a');
  pxRect(ctx, x + 5, y - 13, 4, 7, '#5f8f4a');
  pxRect(ctx, x + 3, y - 13, 6, 2, '#5f8f4a');
  pxRect(ctx, x - 1, y - 24, 2, 4, '#d95f43');
}

function drawCoral(ctx, x, y, t) {
  const col = '#d97a5a';
  pxRect(ctx, x, y - 14, 3, 14, col);
  pxRect(ctx, x - 8, y - 20, 3, 14, col);
  pxRect(ctx, x - 8, y - 20, 9, 3, col);
  pxRect(ctx, x + 7, y - 16, 3, 10, col);
  pxRect(ctx, x + 3, y - 10, 7, 3, col);
  pxRect(ctx, x - 1, y - 22, 3, 8, col);
  ctx.fillStyle = '#f0a080';
  pxRect(ctx, x - 7, y - 21, 2, 2, '#f0a080');
  pxRect(ctx, x + 1, y - 23, 1, 2, '#f0a080');
}

function drawCannon(ctx, x, y, t) {
  ctx.fillStyle = '#2b2f38';
  pxRect(ctx, x - 2, y - 12, 22, 7, '#2b2f38');
  pxRect(ctx, x + 16, y - 13, 5, 9, '#1b1e24');
  pxRect(ctx, x - 2, y - 12, 22, 1, '#5a626e');
  ctx.fillStyle = '#6b4526';
  ctx.beginPath(); ctx.arc(x + 4, y - 3, 5, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, x + 2, y - 6, 2, 6, '#8a5a33');
  void t;
}

function drawTorch(ctx, x, y, t) {
  pxRect(ctx, x - 1, y - 26, 3, 26, '#5a3a20');
  pxRect(ctx, x - 4, y - 30, 9, 4, '#3a2618');
  const f = Math.sin(t * 9 + x) * 1.5;
  pxRect(ctx, x - 2, y - 37 + f, 5, 8, '#ff8a3c');
  pxRect(ctx, x - 1, y - 40 + f * 0.5, 3, 9, '#ffd166');
  pxRect(ctx, x, y - 41 + f * 0.5, 1, 4, '#fff3b0');
  // glow
  const g = ctx.createRadialGradient(x, y - 36, 2, x, y - 36, 22);
  g.addColorStop(0, 'rgba(255,170,70,0.2)');
  g.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 22, y - 58, 44, 44);
}

function drawTree(ctx, x, y, t) {
  pxRect(ctx, x - 2, y - 26, 5, 26, '#6b4526');
  ctx.fillStyle = '#2f7d40';
  ctx.beginPath(); ctx.arc(x, y - 34, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 10, y - 28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 10, y - 28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath(); ctx.arc(x - 4, y - 38, 7, 0, Math.PI * 2); ctx.fill();
}

function drawSkullRock(ctx, x, y) {
  ctx.fillStyle = '#9a8f80';
  ctx.beginPath(); ctx.arc(x, y - 14, 13, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, x - 8, y - 4, 16, 6, '#9a8f80');
  ctx.fillStyle = '#2b2620';
  ctx.beginPath(); ctx.arc(x - 5, y - 16, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y - 16, 3, 0, Math.PI * 2); ctx.fill();
  pxRect(ctx, x - 2, y - 10, 4, 3, '#2b2620');
}

export function drawDecor(ctx, level, time) {
  const theme = THEMES[level.theme] || THEMES.eastblue;
  for (const d of level.decor) {
    const x = d.x, y = d.y;
    switch (d.type) {
      case 'palm': drawPalm(ctx, x, y, time, d.s || 1); break;
      case 'house': drawHouse(ctx, x, y, d.w || 46, d.h || 34, level.theme, time); break;
      case 'bush': drawBush(ctx, x, y, time); break;
      case 'rock': drawRock(ctx, x, y, d.s || 1, level.theme); break;
      case 'barrel': drawBarrel(ctx, x, y, time); break;
      case 'banner': drawBanner(ctx, x, y, time, level.theme); break;
      case 'pillar': drawPillar(ctx, x, y, d.h || 42, level.theme); break;
      case 'cactus': drawCactus(ctx, x, y, time); break;
      case 'coral': drawCoral(ctx, x, y, time); break;
      case 'cannon': drawCannon(ctx, x, y, time); break;
      case 'torch': drawTorch(ctx, x, y, time); break;
      case 'tree': drawTree(ctx, x, y, time); break;
      case 'skullrock': drawSkullRock(ctx, x, y); break;
      case 'fence': {
        for (let i = 0; i < (d.w || 3); i++) {
          pxRect(ctx, x + i * 12, y - 16, 3, 16, '#8a5a33');
          pxRect(ctx, x + i * 12 - 2, y - 12, 8, 2, '#6b4526');
        }
        break;
      }
      case 'crateStack': {
        pxRect(ctx, x, y - 14, 14, 14, '#8a5a33');
        pxRect(ctx, x + 1, y - 13, 12, 1, '#b07a48');
        pxRect(ctx, x, y - 28, 12, 14, '#7a4a2a');
        pxRect(ctx, x - 14, y - 12, 12, 12, '#96633a');
        break;
      }
      case 'house2': drawHouse(ctx, x, y, d.w || 58, d.h || 40, level.theme, time); break;
      default: break;
    }
    void theme;
  }
  // near foreground grass tufts
  for (let i = 0; i < 20; i++) {
    const gx = ((i * 137 + 13 - (level.camPar || 0)) % 520);
    void gx;
  }
}
