/* =========================================================
   sprites.js — procedural pixel-art character rigs
   Luffy, Zoro, Sanji, Nami + shared drawing primitives
   ========================================================= */

import { CHARACTERS } from './config.js';
import { shade } from './utils.js';

const OUT = '#1b1b28';

/* ---------------- primitives ---------------- */
export function ell(ctx, x, y, rx, ry, fill, outW = 1.1, outColor = OUT) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outW > 0) { ctx.strokeStyle = outColor; ctx.lineWidth = outW; ctx.stroke(); }
}

export function circ(ctx, x, y, r, fill, outW = 1) {
  ell(ctx, x, y, r, r, fill, outW);
}

export function rect(ctx, x, y, w, h, fill, outW = 0) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (outW > 0) {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = outW;
    ctx.strokeRect(x, y, w, h);
  }
}

export function rrect(ctx, x, y, w, h, r, fill, outW = 1) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outW > 0) { ctx.strokeStyle = OUT; ctx.lineWidth = outW; ctx.stroke(); }
}

export function poly(ctx, pts, fill, outW = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outW > 0) {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = outW;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function limb(ctx, x1, y1, x2, y2, w, color, outW = 1.1) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (outW > 0) {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = w + outW * 2;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function shadow(ctx, x, y, w = 9, alpha = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(8,12,20,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------- pose generation ---------------- */
export function makePose(state, t, opts = {}) {
  const p = {
    bob: 0, lean: 0,
    legF: { a: 0.06, b: 0.03 },
    legB: { a: -0.06, b: -0.02 },
    armF: { a: 0.30, b: 0.12 },
    armB: { a: -0.26, b: 0.12 },
    headTilt: 0,
    squash: 1,
  };
  if (state === 'idle') {
    p.bob = Math.sin(t * 2.2) * 0.35;
    p.armF.a = 0.28 + Math.sin(t * 2.2) * 0.03;
    p.armB.a = -0.24 - Math.sin(t * 2.2) * 0.03;
    p.headTilt = Math.sin(t * 1.3) * 0.02;
    p.legF.a = 0.08; p.legB.a = -0.08;
  } else if (state === 'run') {
    const c = t * 13;
    const s = Math.sin(c);
    p.legF.a = s * 0.9;
    p.legF.b = -Math.max(0, s) * 0.9 - 0.04;
    p.legB.a = -s * 0.9;
    p.legB.b = -Math.max(0, -s) * 0.9 - 0.04;
    p.armF.a = -s * 0.72 + 0.18;
    p.armF.b = 0.5 + Math.max(0, s) * 0.3;
    p.armB.a = s * 0.72 - 0.16;
    p.armB.b = 0.5 + Math.max(0, -s) * 0.3;
    p.lean = 0.16;
    p.bob = -Math.abs(Math.cos(c)) * 0.9;
    p.headTilt = 0.02;
  } else if (state === 'jump') {
    p.legF = { a: 0.8, b: -1.05 };
    p.legB = { a: -0.4, b: -0.55 };
    p.armF = { a: 2.2, b: 0.5 };
    p.armB = { a: -2.0, b: -0.4 };
    p.lean = 0.12;
    p.bob = -0.5;
  } else if (state === 'fall') {
    p.legF = { a: 0.5, b: -0.5 };
    p.legB = { a: -0.45, b: -0.3 };
    p.armF = { a: 1.5, b: 0.4 };
    p.armB = { a: -1.4, b: -0.4 };
    p.lean = -0.06;
  } else if (state === 'dash') {
    p.legF = { a: -0.8, b: -0.2 };
    p.legB = { a: -1.15, b: -0.4 };
    p.armF = { a: -1.7, b: -0.2 };
    p.armB = { a: -2.1, b: -0.25 };
    p.lean = 0.62;
    p.bob = -1;
  } else if (state === 'attack') {
    p.armF = { a: 1.28, b: 0.12 };
    p.armB = { a: -0.9, b: 0.4 };
    p.lean = 0.3;
    p.legF = { a: 0.42, b: -0.15 };
    p.legB = { a: -0.38, b: -0.02 };
    p.bob = -0.4;
  } else if (state === 'hurt') {
    p.lean = -0.42;
    p.armF = { a: 2.5, b: 0.4 };
    p.armB = { a: -2.3, b: -0.4 };
    p.legF = { a: 0.3, b: -0.3 };
    p.legB = { a: -0.5, b: 0.2 };
    p.bob = -1;
  } else if (state === 'swim') {
    const c = t * 8;
    p.legF = { a: 0.45 + Math.sin(c) * 0.35, b: -0.3 };
    p.legB = { a: -0.1 + Math.sin(c + Math.PI) * 0.35, b: -0.3 };
    p.armF = { a: 1.5 + Math.sin(c) * 0.5, b: 0.3 };
    p.armB = { a: -1.4 + Math.sin(c + 1) * 0.4, b: -0.3 };
    p.lean = 0.1;
  } else if (state === 'victory') {
    p.armF = { a: 2.7, b: 0.1 };
    p.armB = { a: 0.9, b: 0.4 };
    p.bob = Math.sin(t * 5) * 0.6;
  }
  if (opts.squash) p.squash = opts.squash;
  return p;
}

function legPoints(hipX, hipY, a, b) {
  const L1 = 5.2, L2 = 5.4;
  const kx = hipX + Math.sin(a) * L1;
  const ky = hipY + Math.cos(a) * L1;
  const fx = kx + Math.sin(a + b) * L2;
  const fy = ky + Math.cos(a + b) * L2;
  return { kx, ky, fx, fy };
}

function drawLeg(ctx, hipX, hipY, pose, colors, charId, back) {
  const { kx, ky, fx, fy } = legPoints(hipX, hipY, pose.a, pose.b);
  const dark = (c) => (back ? shade(c, -22) : c);
  const upper = colors.legUpper || colors.skin;
  const lower = colors.legLower || colors.skin;
  limb(ctx, hipX, hipY, kx, ky, 3.6, dark(upper));
  limb(ctx, kx, ky, fx, fy, 3.0, dark(lower));
  // shoe / sandal
  const shoe = colors.shoe;
  if (charId === 'luffy' || charId === 'nami') {
    rrect(ctx, fx - 1.6, fy - 1.6, 4.8, 2.6, 1.1, dark(shoe), 1);
    rect(ctx, fx + 1.6, fy - 0.5, 1.6, 1.2, dark(shade(shoe, -35)));
  } else {
    rrect(ctx, fx - 1.8, fy - 2.0, 5.2, 3.2, 1.2, dark(shoe), 1);
    rect(ctx, fx - 1.8, fy + 0.4, 5.2, 0.9, dark(shade(shoe, -40)));
  }
}

function drawArm(ctx, shoulderX, shoulderY, pose, colors, charId, back) {
  const L1 = 5.0, L2 = 4.6;
  const ex = shoulderX + Math.sin(pose.a) * L1;
  const ey = shoulderY + Math.cos(pose.a) * L1;
  const hx = ex + Math.sin(pose.a + pose.b) * L2;
  const hy = ey + Math.cos(pose.a + pose.b) * L2;
  const dark = (c) => (back ? shade(c, -22) : c);
  let upper = colors.skin, lower = colors.skin;
  if (charId === 'zoro') { upper = colors.shirt; lower = colors.skin; }
  else if (charId === 'sanji') { upper = colors.shirt; lower = colors.shirt; }
  else if (charId === 'nami') { upper = colors.skin; lower = colors.skin; }
  limb(ctx, shoulderX, shoulderY, ex, ey, 3.4, dark(upper));
  limb(ctx, ex, ey, hx, hy, 2.9, dark(lower));
  circ(ctx, hx, hy, 1.8, dark(colors.skin), 0.9);
  if (charId === 'nami') {
    rect(ctx, ex - 1.4, ey - 0.8, 3, 1.2, dark('#f2c14e'));
  }
}

/* ---------------- torso & outfits ---------------- */
function torsoShape(ctx, ls, c, color, outW = 1.2) {
  poly(ctx, [
    [-3.5, -10.2], [3.5, -10.2], [4.5, -20.2], [3.6, -21.6],
    [-3.6, -21.6], [-4.5, -20.2],
  ].map(([x, y]) => [x + ls, y]), color, outW);
  void c;
}

function drawTorso(ctx, char, pose) {
  const c = char.colors;
  const ls = pose.lean * 6.5;
  const id = char.id;

  if (id === 'luffy') {
    torsoShape(ctx, ls, c, c.skin);
    // open red vest panels
    poly(ctx, [[-4.5, -20.4], [-1.2, -20.9], [-1.0, -10.5], [-3.8, -10.2]].map(([x, y]) => [x + ls, y]), c.shirt);
    poly(ctx, [[4.5, -20.4], [1.4, -20.9], [1.1, -10.5], [3.8, -10.2]].map(([x, y]) => [x + ls, y]), c.shirt);
    poly(ctx, [[-1.2, -20.9], [0.2, -20.6], [-0.2, -17.4], [-1.1, -17.8]].map(([x, y]) => [x + ls, y]), c.shirtShade, 0);
    poly(ctx, [[1.4, -20.9], [-0.2, -20.6], [0.2, -17.4], [1.1, -17.8]].map(([x, y]) => [x + ls, y]), c.shirtShade, 0);
    // buttons
    for (let i = 0; i < 3; i++) rect(ctx, 1.2 + ls, -18.6 + i * 2.2, 1.2, 1.2, c.sash);
    // scar
    rect(ctx, -1.4 + ls, -17.2, 1.4, 0.9, shade(c.skin, -30));
    rect(ctx, -1.4 + ls, -15.7, 2.2, 0.9, shade(c.skin, -30));
    // sash + shorts
    rect(ctx, -3.9 + ls, -11.2, 7.8, 1.7, c.sash, 0.9);
    rrect(ctx, -3.8 + ls, -10.4, 7.6, 4.4, 1.2, c.pants, 1.1);
    rect(ctx, -3.8 + ls, -10.0, 7.6, 0.9, c.pantsShade);
  } else if (id === 'zoro') {
    torsoShape(ctx, ls, c, c.skin);
    // open dark coat
    poly(ctx, [[-4.7, -20.6], [-1.6, -21], [-1.2, -11], [-4.6, -10.4]].map(([x, y]) => [x + ls, y]), c.shirt);
    poly(ctx, [[4.7, -20.6], [1.8, -21], [1.3, -11], [4.6, -10.4]].map(([x, y]) => [x + ls, y]), c.shirt);
    poly(ctx, [[-1.6, -21], [-0.3, -20.4], [0, -13.2], [-1.2, -13.4]].map(([x, y]) => [x + ls, y]), c.shirtShade, 0);
    poly(ctx, [[1.8, -21], [0.4, -20.4], [0, -13.2], [1.2, -13.4]].map(([x, y]) => [x + ls, y]), c.shirtShade, 0);
    // chest scar
    rect(ctx, -1.6 + ls, -17.8, 1.2, 3.4, shade(c.skin, -32));
    // haramaki
    rect(ctx, -3.2 + ls, -13.4, 6.4, 3.2, c.sash, 0.9);
    rect(ctx, -3.2 + ls, -12.6, 6.4, 0.8, shade(c.sash, -22));
    // swords on hip (behind body)
    for (let i = 0; i < 3; i++) {
      const sx = -5.4 + ls + i * 0.9;
      const sy = -11 + i * 0.6;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.5 + i * 0.16);
      rect(ctx, -1, -2.2, 1.7, 9, i === 1 ? '#e8e8e8' : '#2a2a33', 0.7);
      rect(ctx, -1.3, -3.2, 2.3, 1.4, '#d9a441', 0.6);
      rect(ctx, -0.7, -6.4, 1.2, 3.2, '#8a5a33', 0.6);
      ctx.restore();
    }
    rrect(ctx, -3.6 + ls, -10.3, 7.2, 4.0, 1.2, c.pants, 1);
    rect(ctx, -3.6 + ls, -9.7, 7.2, 0.8, c.pantsShade);
  } else if (id === 'sanji') {
    poly(ctx, [
      [-3.5, -10.2], [3.5, -10.2], [4.4, -20.4], [3.5, -21.6],
      [-3.6, -21.6], [-4.4, -20.4],
    ].map(([x, y]) => [x + ls, y]), c.shirt);
    // white shirt V
    poly(ctx, [[-1.6, -21], [1.6, -21], [2.1, -18.6], [0, -15.4], [-2.1, -18.6]].map(([x, y]) => [x + ls, y]), c.sash, 1);
    // tie
    poly(ctx, [[-0.8, -20.2], [0.8, -20.2], [0.4, -15.6], [0, -14.8], [-0.4, -15.6]].map(([x, y]) => [x + ls, y]), '#9c1c2e', 0.5);
    rect(ctx, -3.4 + ls, -12.2, 6.8, 1.2, '#101014', 0);
    rect(ctx, -0.9 + ls, -11.5, 1.8, 1.3, '#d9a441', 0.5);
    rrect(ctx, -3.5 + ls, -10.3, 7.0, 4.0, 1.2, c.pants, 1);
  } else if (id === 'nami') {
    torsoShape(ctx, ls, c, c.skin);
    // striped crop top
    poly(ctx, [[-4.3, -20.4], [4.3, -20.4], [3.7, -14.6], [0, -13.6], [-3.7, -14.6]].map(([x, y]) => [x + ls, y]), c.shirt, 1);
    for (let i = 0; i < 3; i++) {
      rect(ctx, -3.8 + ls, -19.4 + i * 1.7, 7.6 - i * 0.4, 0.7, '#4a8fc4', 0);
    }
    rect(ctx, -3.7 + ls, -15.2, 7.4, 0.8, shade(c.shirt, -30), 0);
    // navel
    rect(ctx, 0.4 + ls, -12.6, 0.9, 0.9, shade(c.skin, -38));
    // shorts + belt
    rect(ctx, -3.7 + ls, -11.4, 7.4, 1.4, c.sash, 0.8);
    rrect(ctx, -3.7 + ls, -10.5, 7.4, 4.2, 1.2, c.pants, 1);
    rect(ctx, -3.7 + ls, -9.9, 7.4, 0.8, c.pantsShade);
  }
}

/* ---------------- head ---------------- */
function drawEyes(ctx, char, hx, hy, opts = {}) {
  const c = char.colors;
  const closed = opts.closed;
  if (closed) {
    rect(ctx, hx + 1.2, hy - 0.6, 2.4, 0.8, '#2a1a12');
    return;
  }
  const eyeXs = char.id === 'sanji' ? [3.9] : [1.5, 3.9];
  for (const ex of eyeXs) {
    ell(ctx, hx + ex, hy - 0.9, 1.1, 1.4, '#ffffff', 0.55);
    rect(ctx, hx + ex + 0.1, hy - 1.2, 0.9, 1.6, c.eye);
  }
  if (char.id === 'sanji') {
    // curly brow above visible eye
    rect(ctx, hx + 2.8, hy - 3.1, 2.2, 0.7, c.eye);
    rect(ctx, hx + 4.7, hy - 2.7, 0.7, 0.8, c.eye);
  } else {
    rect(ctx, hx + 0.6, hy - 3.0, 1.9, 0.7, c.eye);
    rect(ctx, hx + 3.2, hy - 3.0, 1.9, 0.7, c.eye);
  }
}

function drawHead(ctx, char, pose, t) {
  const c = char.colors;
  const hx = pose.lean * 4.2;
  const hy = -26.0 + pose.bob * 0.35;
  const id = char.id;

  // back hair
  if (id === 'nami') {
    poly(ctx, [[-5.6, -29], [-6.8, -22], [-4.4, -13.8], [-3.4, -19], [-2.8, -27]].map(([x, y]) => [x + hx, y]), c.hatShade, 1);
    poly(ctx, [[-5.4, -27], [-6.2, -20], [-4.2, -15.4], [-3.8, -21]].map(([x, y]) => [x + hx, y]), c.hat, 0);
  }

  // ear
  ell(ctx, hx - 4.5, hy + 0.9, 1.6, 1.9, c.skin, 0.9);

  // head
  ell(ctx, hx, hy, 5.9, 5.7, c.skin, 1.15);
  // jaw shade
  ctx.save();
  ctx.globalAlpha = 0.18;
  ell(ctx, hx - 1.8, hy + 2.4, 3.2, 2.4, shade(c.skin, -30), 0);
  ctx.restore();

  if (id === 'luffy') {
    // spiky hair under the hat
    poly(ctx, [
      [-5.7, -28.6], [-6.4, -26.4], [-5.4, -25.2], [-6.2, -22.8], [-4.4, -23.4],
      [-4.9, -21.4], [-3.2, -23.0], [-2.4, -22.4], [-2.8, -26], [-1.4, -25],
    ].map(([x, y]) => [x + hx, y]), c.hair, 0.8);
    rect(ctx, hx - 5.6, hy - 4.2, 2.0, 2.0, c.hair);
    rect(ctx, hx - 4.0, hy - 4.6, 8.0, 1.5, c.hair);
    // sideburn
    rect(ctx, hx - 5.2, hy - 2.4, 1.2, 3.2, c.hair);
    drawEyes(ctx, char, hx, hy);
    // scar under eye
    rect(ctx, hx + 3.4, hy + 1.1, 1.5, 0.7, shade(c.skin, -40));
    rect(ctx, hx + 3.8, hy + 2.0, 1.0, 0.7, shade(c.skin, -40));
    // grin
    rect(ctx, hx + 1.4, hy + 3.1, 3.4, 0.8, '#5a2e22');
    rect(ctx, hx + 1.8, hy + 3.0, 2.6, 0.5, '#fff7e0');
    // hat
    const hatY = hy - 4.9;
    ell(ctx, hx, hatY, 9.2, 3.0, c.hat, 1.2);
    ctx.beginPath();
    ctx.ellipse(hx, hatY - 0.3, 5.2, 4.3, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = c.hat; ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.stroke();
    rect(ctx, hx - 5.2, hatY - 2.1, 10.4, 1.5, c.shirt, 0);
    rect(ctx, hx - 5.0, hatY - 2.1, 2.0, 0.5, shade(c.shirt, 35), 0);
    rect(ctx, hx - 6.2, hatY - 3.2, 3.0, 0.8, shade(c.hat, 22), 0);
    // brim shadow on face
    ctx.save();
    ctx.globalAlpha = 0.16;
    rect(ctx, hx - 5.0, hy - 3.9, 9.6, 2.2, '#3a2414', 0);
    ctx.restore();
  } else if (id === 'zoro') {
    // green hair cap
    poly(ctx, [
      [-5.9, -27.8], [-5.0, -31.4], [-1.8, -32.6], [2.8, -32.0],
      [5.6, -29.6], [6.0, -27.2], [3.4, -28.4], [1.0, -27.5],
      [-1.6, -28.8], [-4.4, -27.4],
    ].map(([x, y]) => [x + hx, y]), c.hair, 1);
    rect(ctx, hx + 4.2, hy - 5.2, 1.8, 3.2, c.hair);
    rect(ctx, hx - 5.8, hy - 1.2, 1.2, 2.6, c.hair);
    // three earrings
    for (let i = 0; i < 3; i++) {
      circ(ctx, hx - 5.0, hy + 2.2 + i * 1.5, 0.65, '#f2c14e', 0.5);
    }
    // scarred eye (back eye closed)
    drawEyes(ctx, char, hx, hy, { closed: true });
    ell(ctx, hx + 3.9, hy - 0.9, 1.1, 1.35, '#ffffff', 0.55);
    rect(ctx, hx + 4.0, hy - 1.2, 0.9, 1.5, c.eye);
    rect(ctx, hx + 3.6, hy - 3.0, 2.0, 0.7, c.eye);
    rect(ctx, hx + 0.6, hy - 0.2, 0.8, 4.2, shade(c.skin, -40));
    // mouth
    rect(ctx, hx + 1.8, hy + 3.2, 2.8, 0.7, '#5a2e22');
  } else if (id === 'sanji') {
    // blonde hair, sweeping fringe
    poly(ctx, [
      [-5.9, -28], [-5.2, -31.6], [-1.2, -32.4], [3.0, -31.6],
      [5.8, -29.2], [5.2, -26.4], [3.0, -27.2], [1.2, -26.4],
      [0.2, -23.4], [-1.8, -24.2], [-3.2, -26.2], [-5.4, -25.2],
    ].map(([x, y]) => [x + hx, y]), c.hair, 1);
    rect(ctx, hx + 4.6, hy - 4.4, 1.6, 4.0, c.hair);
    rect(ctx, hx - 5.8, hy - 1.2, 1.3, 3.2, c.hair);
    // covered eye hint
    rect(ctx, hx + 1.0, hy - 2.6, 3.4, 2.9, shade(c.hair, -12), 0);
    drawEyes(ctx, char, hx, hy);
    // cigarette + smoke
    rect(ctx, hx + 5.4, hy + 2.8, 3.2, 0.9, '#f2ead8', 0.4);
    rect(ctx, hx + 8.4, hy + 2.7, 1.0, 0.9, '#ff7a3c', 0);
    ctx.save();
    ctx.globalAlpha = 0.3;
    const sm = (t * 6) % 8;
    circ(ctx, hx + 9.6, hy + 1.6 - sm, 1.4 + sm * 0.2, '#e8e8e8', 0);
    ctx.restore();
  } else if (id === 'nami') {
    // orange fringe
    poly(ctx, [
      [-5.9, -27.6], [-5.2, -31.4], [-1.0, -32.4], [3.2, -31.4],
      [5.9, -28.6], [5.2, -26.2], [3.4, -27.8], [1.2, -26.2],
      [-0.6, -27.4], [-2.6, -26.0], [-4.2, -27.6],
    ].map(([x, y]) => [x + hx, y]), c.hat, 0.9);
    // long side strands
    poly(ctx, [[-5.6, -27], [-6.6, -19], [-5.0, -16.4], [-4.4, -22]].map(([x, y]) => [x + hx, y]), c.hatShade, 0.8);
    poly(ctx, [[5.4, -27.4], [6.4, -23], [5.6, -20.6], [4.6, -24]].map(([x, y]) => [x + hx, y]), c.hat, 0.8);
    drawEyes(ctx, char, hx, hy);
    // lashes
    rect(ctx, hx + 0.8, hy + 0.3, 1.8, 0.6, c.eye);
    rect(ctx, hx + 3.2, hy + 0.3, 1.8, 0.6, c.eye);
    rect(ctx, hx + 2.0, hy + 3.3, 2.0, 0.7, '#a0463f');
    // hair clip
    rect(ctx, hx - 4.8, hy - 4.6, 1.8, 1.2, '#ffd166', 0.5);
  }

  void t;
}

/* ---------------- main character draw ---------------- */
export function drawCharacter(ctx, charId, x, y, facing, state, t, opts = {}) {
  const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  const scale = opts.scale ?? 0.92;
  const pose = opts.pose || makePose(state, t, opts);
  if (opts.shadow !== false) shadow(ctx, x, y + 1, 10 * scale, opts.shadowAlpha ?? 0.22);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.scale((facing || 1) * scale, scale);
  ctx.translate(0, pose.bob);
  if (opts.swim) ctx.rotate(-0.06);

  const c = char.colors;
  const charIdLocal = char.id;

  // back leg + arm
  drawLeg(ctx, -2.2, -10.4, pose.legB, c, charIdLocal, true);
  drawArm(ctx, -3.1, -19.4, pose.armB, c, charIdLocal, true);

  // long hair behind body (Nami)
  if (charIdLocal === 'nami') {
    poly(ctx, [
      [-4.8, -24.4], [-6.6, -16.0], [-5.0, -10.4], [-3.2, -14.2], [-2.4, -21.4],
    ], c.hatShade, 0.9);
  }

  drawTorso(ctx, char, pose);
  drawLeg(ctx, 2.2, -10.4, pose.legF, c, charIdLocal, false);
  drawHead(ctx, char, pose, t);

  if (!opts.hideFrontArm) {
    drawArm(ctx, 3.2, -19.4, pose.armF, c, charIdLocal, false);
  }
  if (charIdLocal === 'sanji' && state === 'run') {
    // little dust kick
    ctx.save();
    ctx.globalAlpha = 0.25;
    circ(ctx, -5, 0.4, 1.6, '#e8dcc8', 0);
    ctx.restore();
  }
  ctx.restore();
}

/* stretchy gum-gum arm from shoulder to fist (world coordinates) */
export function drawStretchArm(ctx, sx, sy, hx, hy, colors, opts = {}) {
  const n = 5;
  const pts = [];
  const wobble = opts.wobble || 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = sx + (hx - sx) * t;
    const y = sy + (hy - sy) * t + Math.sin(t * Math.PI * 2 + performance.now() * 0.02) * wobble * Math.sin(t * Math.PI);
    pts.push([x, y]);
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 5.4;
  ctx.stroke();
  ctx.strokeStyle = colors.skin;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.strokeStyle = shade(colors.skin, 18);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // fist
  circ(ctx, hx, hy, opts.fistSize || 3.6, colors.skin, 1.2);
  rect(ctx, hx - 2.6, hy - 1.4, 4.2, 0.8, shade(colors.skin, -25), 0);
  rect(ctx, hx - 2.4, hy + 0.2, 3.8, 0.8, shade(colors.skin, -25), 0);
  ctx.restore();
}

/* ---------------- enemy character art ---------------- */
function goonBase(ctx, x, y, facing, scale, t, opts) {
  const walk = (opts.walkTime ?? t) * 9;
  const bob = Math.abs(Math.sin(walk)) * 0.5;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale((facing || 1) * scale, scale);
  ctx.translate(0, bob);
  return walk;
}

function soldierLegs(ctx, walk, pants, shoe, hipY = -9.4) {
  const poses = [
    { x: -1.9, a: Math.sin(walk) * 0.62, b: -0.1 },
    { x: 1.9, a: -Math.sin(walk) * 0.62, b: -0.1 },
  ];
  poses.forEach((p, i) => {
    const { kx, ky, fx, fy } = legPoints(p.x, hipY, p.a, p.b);
    limb(ctx, p.x, hipY, kx, ky, 3.4, shade(pants, i ? 0 : -18));
    limb(ctx, kx, ky, fx, fy, 2.9, shade(pants, i ? 0 : -18));
    rrect(ctx, fx - 1.7, fy - 1.9, 4.8, 3.0, 1.1, shade(shoe, i ? 0 : -15), 0.9);
  });
}

function marineFace(ctx, skin, cap, trim, t) {
  const hx = 0, hy = -21;
  circ(ctx, hx, hy, 5.2, skin, 1.1);
  rect(ctx, hx + 1.8, hy - 0.7, 1.2, 1.5, '#1b1b28', 0);
  rect(ctx, hx + 4.0, hy - 0.7, 1.0, 1.3, '#1b1b28', 0);
  rect(ctx, hx + 1.2, hy + 2.6, 2.6, 0.6, '#5a2e22', 0);
  // cap
  rrect(ctx, hx - 5.6, hy - 5.4, 11.2, 3.6, 2.6, cap, 1);
  rect(ctx, hx - 5.6, hy - 3.8, 11.2, 1.0, trim, 0);
  rect(ctx, hx + 4.6, hy - 3.4, 3.4, 1.2, cap, 0.7);
  rect(ctx, hx - 0.6, hy - 4.8, 2.6, 0.8, '#f2c14e', 0);
  void t;
}

export function drawMarine(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 0.95;
  shadow(ctx, x, y + 1, 8.5 * scale, 0.2);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  const aiming = opts.state === 'shoot' || opts.state === 'aim';
  const skin = '#e8b47c';
  const cap = '#f2f2f2';
  const trim = '#22406e';
  const pants = '#dbe4ee';
  // back arm
  limb(ctx, -3, -18.2, -4.4, -12.4, 3.2, shade('#f2f2f2', -18));
  // legs
  soldierLegs(ctx, aiming ? 0 : walk, pants, '#1e2a3a');
  // torso
  poly(ctx, [[-3.4, -9.6], [3.4, -9.6], [4.3, -19.2], [3.2, -20.8], [-3.2, -20.8], [-4.3, -19.2]], '#f2f2f2', 1.2);
  rect(ctx, -3.5, -13.2, 7, 1.0, '#dbe4ee', 0);
  // neckerchief
  poly(ctx, [[-2.4, -20.2], [2.4, -20.2], [0, -17.6]], trim, 0.6);
  rect(ctx, -3.2, -10.0, 6.4, 1.0, '#2a3a50', 0);
  marineFace(ctx, skin, cap, trim, t);
  // arms + rifle
  if (aiming) {
    limb(ctx, 3, -18.2, 6.2, -15.4, 3.2, '#f2f2f2');
    limb(ctx, 6.2, -15.4, 9.2, -15.2, 2.8, '#f2f2f2');
    circ(ctx, 9.4, -15.2, 1.5, skin, 0.8);
    // rifle
    rect(ctx, 4.0, -16.4, 13, 1.7, '#4a3420', 0.6);
    rect(ctx, 12.5, -16.8, 4, 2.4, '#2a2f38', 0.6);
    rect(ctx, 5.2, -15.0, 2.2, 2.2, '#2a2f38', 0.5);
    if (opts.muzzle > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(17, -15.4); ctx.lineTo(22 + opts.muzzle * 4, -16.8); ctx.lineTo(20, -15.4);
      ctx.lineTo(22 + opts.muzzle * 4, -14); ctx.closePath(); ctx.fill();
    }
  } else {
    limb(ctx, 3, -18.2, 5.6, -12.6, 3.2, '#f2f2f2');
    circ(ctx, 5.8, -12.4, 1.5, skin, 0.8);
    // sword sheathed at hip
    rect(ctx, -6.4, -10.4, 2, 10, '#4a3a2a', 0.8);
    rect(ctx, -6.9, -11.2, 3, 1.5, '#9aa6b4', 0.5);
    // shoulder pads
    rect(ctx, -4.8, -20.4, 3.4, 1.5, trim, 0);
    rect(ctx, 1.4, -20.4, 3.4, 1.5, trim, 0);
  }
  ctx.restore();
}

export function drawPirate(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 0.98;
  shadow(ctx, x, y + 1, 9 * scale, 0.2);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  const skin = '#d9a878';
  const shirt = '#e8dcc8';
  const stripe = '#c0392b';
  // back arm
  limb(ctx, -3, -18, -4.6, -12.4, 3.2, shade(shirt, -20));
  soldierLegs(ctx, walk, '#3a3228', '#241c14', -9.4);
  // striped shirt torso
  poly(ctx, [[-3.5, -9.4], [3.5, -9.4], [4.4, -19.4], [3.2, -20.6], [-3.2, -20.6], [-4.4, -19.4]], shirt, 1.2);
  for (let i = 0; i < 3; i++) rect(ctx, -3.9, -17.6 + i * 2.4, 7.8, 1.1, stripe, 0);
  // belt
  rect(ctx, -3.7, -10.2, 7.4, 1.5, '#6b4526', 0.8);
  // head
  const hy = -21.6;
  circ(ctx, 0, hy, 5.2, skin, 1.1);
  rect(ctx, 1.7, hy - 0.7, 1.2, 1.5, '#1b1b28', 0);
  rect(ctx, 3.9, hy - 0.7, 1.0, 1.3, '#1b1b28', 0);
  rect(ctx, 1.0, hy + 2.6, 3.0, 0.6, '#5a2e22', 0);
  // bandana
  poly(ctx, [[-5.6, hy - 3.2], [-4.4, hy - 6], [0, hy - 6.8], [5.4, hy - 4.2], [5.4, hy - 2.4], [1.2, hy - 4.0], [-1.8, hy - 3.2]], stripe, 0.9);
  rect(ctx, -5.4, hy - 3.6, 10.6, 1.2, '#8a1f1f', 0);
  rect(ctx, -5.8, hy - 3.8, 2.4, 1.6, stripe, 0);
  // front arm + cutlass
  limb(ctx, 3, -18, 5.8, -13.6, 3.2, shirt);
  circ(ctx, 6.0, -13.4, 1.5, skin, 0.8);
  ctx.save();
  ctx.translate(6.2, -13.2);
  ctx.rotate(opts.state === 'attack' ? -0.9 : -0.3);
  rect(ctx, -0.5, -11, 1.8, 11, '#c9d2dc', 0.7);
  ctx.beginPath();
  ctx.arc(0.4, -11.6, 2.6, 0, Math.PI, true);
  ctx.fillStyle = '#c9d2dc'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.6; ctx.stroke();
  rect(ctx, -1.2, -1.4, 3.2, 1.6, '#8a5a33', 0.6);
  ctx.restore();
  ctx.restore();
}

export function drawGull(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 1;
  const flap = Math.sin(t * 10 + (opts.phase || 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((facing || 1) * scale, scale);
  // wings
  ctx.fillStyle = '#f2f6fa';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(-13, -10 - flap * 7, -16, -3 - flap * 4);
  ctx.quadraticCurveTo(-8, -4, -2, -4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -8);
  ctx.quadraticCurveTo(13, -11 - flap * 7, 17, -4 - flap * 4);
  ctx.quadraticCurveTo(8, -5, 3, -4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // body
  ell(ctx, 0, -4, 6, 4.6, '#f2f6fa', 1);
  ell(ctx, 3.6, -6.4, 3.2, 3, '#f2f6fa', 0.9);
  // beak
  poly(ctx, [[6.4, -7.2], [11, -6.2], [6.4, -4.8]], '#f2a23c', 0.6);
  // eye
  rect(ctx, 4.6, -7.6, 1.2, 1.2, '#1b1b28', 0);
  // tail
  poly(ctx, [[-5.8, -5.2], [-11, -8], [-10, -3.4]], '#dbe4ee', 0.7);
  ctx.restore();
}

export function drawFishman(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 1.0;
  shadow(ctx, x, y + 1, 10 * scale, 0.22);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  const skin = '#5b9bd5';
  const skinD = shade(skin, -25);
  // legs
  soldierLegs(ctx, walk, '#24476b', '#102436', -9.6);
  // torso
  poly(ctx, [[-4.2, -9.6], [4.2, -9.6], [5.4, -20.6], [3.4, -22.4], [-3.4, -22.4], [-5.4, -20.6]], skin, 1.2);
  rect(ctx, -4.4, -14.2, 8.8, 1.2, skinD, 0);
  // white shirt open
  poly(ctx, [[-5.2, -20.8], [-2.2, -21.6], [-1.4, -10.4], [-4.6, -9.8]], '#f0e6d2', 1);
  poly(ctx, [[5.2, -20.8], [2.2, -21.6], [1.4, -10.4], [4.6, -9.8]], '#f0e6d2', 1);
  // gold chain
  for (let i = 0; i < 4; i++) rect(ctx, -2.4 + i * 1.6, -18.6 + Math.sin(i) * 0.7, 1.2, 1.2, '#f2c14e', 0);
  // head
  const hy = -25.4;
  circ(ctx, 0, hy, 5.8, skin, 1.1);
  // fin
  poly(ctx, [[-2, hy - 6.4], [0, hy - 11.4], [2.4, hy - 6.2]], '#8fd6f0', 0.8);
  // snout
  poly(ctx, [[3, hy - 3.4], [10.4, hy - 2.2], [8.0, hy + 2.6], [3, hy + 3.4]], skin, 1);
  for (let i = 0; i < 4; i++) {
    poly(ctx, [[4.4 + i * 1.7, hy + 2.4], [5.2 + i * 1.7, hy - 0.6], [6.0 + i * 1.7, hy + 2.4]], '#f2f6fa', 0.4);
  }
  // eye
  ell(ctx, 2.4, hy - 1.4, 1.5, 1.4, '#ffe066', 0.6);
  rect(ctx, 2.9, hy - 2.1, 0.9, 2.2, '#1b1b28', 0);
  // gill
  rect(ctx, -3.6, hy + 0.8, 0.8, 3.4, skinD, 0);
  rect(ctx, -2.2, hy + 0.4, 0.8, 3.8, skinD, 0);
  // arms
  limb(ctx, 4, -19.4, 6.4, -13.2, 3.8, skin);
  circ(ctx, 6.6, -13, 2.0, skin, 0.8);
  limb(ctx, -4, -19.4, -6, -13.6, 3.6, skinD);
  // webbed fingers
  rect(ctx, 5.4, -12.4, 3.4, 1, skinD, 0);
  ctx.restore();
}

export function drawBandit(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 0.98;
  shadow(ctx, x, y + 1, 9 * scale, 0.2);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  const robe = '#d9c8a0';
  const robeD = shade(robe, -25);
  // legs
  soldierLegs(ctx, walk, '#5e5240', '#3a3020', -9.2);
  // robe
  poly(ctx, [[-4.2, -8], [4.2, -8], [4.8, -20], [3.2, -21.4], [-3.2, -21.4], [-4.8, -20]], robe, 1.2);
  rect(ctx, -4.4, -13.6, 8.8, 1.0, robeD, 0);
  rect(ctx, -0.6, -21, 1.4, 13, robeD, 0);
  // head + turban
  const hy = -21.8;
  circ(ctx, 0, hy, 5.0, '#c9965c', 1.1);
  rect(ctx, 1.5, hy - 0.7, 1.2, 1.5, '#1b1b28', 0);
  rect(ctx, 3.6, hy - 0.7, 1.0, 1.3, '#1b1b28', 0);
  rect(ctx, 0.6, hy + 2.5, 3.0, 0.6, '#4f2a1c', 0);
  rect(ctx, -5.3, hy - 5.0, 10.6, 3.2, '#c0a878', 0.9);
  rect(ctx, -5.3, hy - 3.4, 10.6, 1.0, '#8a744e', 0);
  rect(ctx, -5.5, hy - 4.2, 2.0, 3.2, '#a88f64', 0.8);
  // scimitar
  limb(ctx, 3, -18, 5.6, -13.4, 3.2, robe);
  ctx.save();
  ctx.translate(6, -13.2);
  ctx.rotate(opts.state === 'attack' ? -1.2 : -0.5);
  ctx.strokeStyle = '#d9e2ea';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -8, 6, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 0.5;
  rect(ctx, -1.2, -2.4, 2.2, 1.6, '#8a5a33', 0.5);
  ctx.restore();
  ctx.restore();
}

export function drawCP9(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 1.0;
  shadow(ctx, x, y + 1, 9 * scale, 0.22);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  // legs (dark suit)
  soldierLegs(ctx, walk, '#1b1b22', '#101014', -9.4);
  // torso
  poly(ctx, [[-3.6, -9.4], [3.6, -9.4], [4.5, -19.6], [3.3, -21], [-3.3, -21], [-4.5, -19.6]], '#1b1b22', 1.2);
  poly(ctx, [[-1.4, -21], [1.4, -21], [1.8, -17.4], [0, -14.8], [-1.8, -17.4]], '#f2f2f2', 0.7);
  poly(ctx, [[-0.7, -20.4], [0.7, -20.4], [0.4, -15.4], [0, -14.6], [-0.4, -15.4]], '#9c1c2e', 0.4);
  // head
  const hy = -22.2;
  circ(ctx, 0, hy, 5.1, '#d9a878', 1.1);
  rect(ctx, 1.7, hy - 0.6, 1.2, 1.4, '#1b1b28', 0);
  rect(ctx, 3.9, hy - 0.6, 1.0, 1.2, '#1b1b28', 0);
  rect(ctx, 1.0, hy + 2.4, 2.8, 0.6, '#5a2e22', 0);
  // hair + goatee
  poly(ctx, [[-5.2, hy - 3.6], [-3.8, hy - 6.2], [2.2, hy - 6.4], [5.2, hy - 3.2], [4.4, hy - 2.0], [1.2, hy - 3.4], [-2.2, hy - 3.0], [-4.4, hy - 2.2]], '#1a1a1a', 0.9);
  rect(ctx, -0.8, hy + 2.2, 1.8, 2.4, '#2a2a2a', 0);
  // tie flapping
  poly(ctx, [[0.6, -17.4], [1.8, -17], [3.4 + Math.sin(t * 5) * 1.5, -14.6], [1.4, -15.4]], '#9c1c2e', 0.5);
  // claws
  const ang = opts.state === 'attack' ? 1.1 : 0.5;
  limb(ctx, 3.2, -18.6, 3.2 + Math.sin(ang) * 8, -18.6 + Math.cos(ang) * 8, 3.2, '#1b1b22');
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(3.2 + Math.sin(ang) * 8 + i * 0.9, -18.6 + Math.cos(ang) * 8);
    ctx.lineTo(3.2 + Math.sin(ang) * 10.4 + i * 1.4, -18.6 + Math.cos(ang) * 10.4 + 1);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMagmaMarine(ctx, x, y, facing, t, opts = {}) {
  const scale = opts.scale || 1.08;
  shadow(ctx, x, y + 1, 10 * scale, 0.24);
  const walk = goonBase(ctx, x, y, facing, scale, t, opts);
  soldierLegs(ctx, walk, '#3c3436', '#1b1618', -9.8);
  // bulky armor
  poly(ctx, [[-4.6, -9.6], [4.6, -9.6], [5.6, -20.6], [3.8, -22.4], [-3.8, -22.4], [-5.6, -20.6]], '#4a3f42', 1.2);
  // glowing cracks
  ctx.strokeStyle = '#ff6b1a';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-3, -20); ctx.lineTo(-1.4, -16.8); ctx.lineTo(-2.4, -13.6);
  ctx.moveTo(2.4, -19.6); ctx.lineTo(1.2, -17.4); ctx.lineTo(2.8, -14.6);
  ctx.stroke();
  // shoulder plates
  rect(ctx, -6.2, -20.6, 4, 2.4, '#2b2326', 0.9);
  rect(ctx, 2.2, -20.6, 4, 2.4, '#2b2326', 0.9);
  // helmet head
  const hy = -23.6;
  circ(ctx, 0, hy, 5.4, '#3c3436', 1.1);
  rect(ctx, 1.8, hy - 0.8, 1.6, 1.4, '#ff8a3c', 0);
  rect(ctx, 4.0, hy - 0.8, 1.2, 1.2, '#ff8a3c', 0);
  rect(ctx, -4.6, hy - 5.2, 9.2, 2.6, '#2b2326', 0.9);
  rect(ctx, -4.6, hy - 3.6, 9.2, 0.9, '#ff6b1a', 0);
  // magma fist
  limb(ctx, 3.4, -18.4, 7.6, -14.2, 3.8, '#4a3f42');
  circ(ctx, 8, -14, 2.6, '#ff8a3c', 1);
  circ(ctx, 8, -14, 1.2, '#ffe066', 0);
  ctx.restore();
}

/* ---------------- preview helper ---------------- */
export function drawCharacterPreview(ctx, charId, w, h, time, selected = true) {
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, selected ? '#1d3a52' : '#161f2b');
  bg.addColorStop(1, selected ? '#0f2233' : '#0d141d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // halo
  const g = ctx.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, w * 0.5);
  g.addColorStop(0, selected ? 'rgba(242,193,78,0.22)' : 'rgba(120,140,160,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawCharacter(ctx, charId, w / 2, h - 14, 1, 'idle', time, { scale: 1.85, shadow: true });
  if (!selected) {
    ctx.fillStyle = 'rgba(6,10,16,0.55)';
    ctx.fillRect(0, 0, w, h);
  }
}
