/* =========================================================
   enemyart.js — boss sprites (Buggy, Morgan, Arlong,
   Crocodile, Lucci, Akainu)
   ========================================================= */

import { BOSSES } from './config.js';
import { shade, clamp } from './utils.js';
import { ell, circ, rect, rrect, poly, limb, makePose } from './sprites.js';

const OUT = '#1b1b28';

function shadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(8,12,20,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, w, w * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function bossFrame(ctx, boss, fn) {
  const def = BOSSES[boss.type];
  const scale = def.scale;
  shadow(ctx, boss.x, boss.y, 14 * scale);
  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));
  ctx.scale(boss.facing * scale, scale);
  if (boss.flash > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(boss.flash * 60) * 0.2;
  }
  fn(ctx);
  if (boss.flash > 0) ctx.restore();
  ctx.restore();
}

function basePose(boss, t) {
  let state = 'idle';
  if (boss.state === 'attack') state = 'attack';
  else if (boss.state === 'walk' || boss.state === 'charge') state = 'run';
  else if (boss.state === 'jump') state = 'jump';
  else if (boss.state === 'hurt') state = 'hurt';
  else if (boss.state === 'special') state = 'attack';
  else if (boss.state === 'dead') state = 'hurt';
  const p = makePose(state, boss.animT || 0, {});
  if (state === 'idle') p.bob = Math.sin(t * 1.8) * 0.6;
  if (boss.state === 'special') {
    p.armF = { a: 2.6, b: 0.2 };
    p.armB = { a: -2.4, b: -0.2 };
    p.bob = -1;
  }
  return p;
}

function bossTorso(ctx, pose, width, color, outW = 1.3) {
  const ls = pose.lean * 7;
  poly(ctx, [
    [-width * 0.8, -10.2], [width * 0.8, -10.2], [width, -20.6], [width * 0.8, -22.4],
    [-width * 0.8, -22.4], [-width, -20.6],
  ].map(([x, y]) => [x + ls, y]), color, outW);
  return ls;
}

function bossLimbs(ctx, pose, skin, upperColor, lowerColor, shoe, opts = {}) {
  const ls = pose.lean * 7;
  const hip = -10.4;
  const legs = [
    { hipX: -2.6, p: pose.legB, back: true },
    { hipX: 2.6, p: pose.legF, back: false },
  ];
  for (const L of legs) {
    const L1 = 5.4, L2 = 5.6;
    const kx = L.hipX + Math.sin(L.p.a) * L1;
    const ky = hip + Math.cos(L.p.a) * L1;
    const fx = kx + Math.sin(L.p.a + L.p.b) * L2;
    const fy = ky + Math.cos(L.p.a + L.p.b) * L2;
    const u = L.back ? shade(upperColor || skin, -20) : (upperColor || skin);
    const lo = L.back ? shade(lowerColor || skin, -20) : (lowerColor || skin);
    limb(ctx, L.hipX, hip, kx, ky, 4.0, u);
    limb(ctx, kx, ky, fx, fy, 3.4, lo);
    rrect(ctx, fx - 2, fy - 2.2, 5.8, 3.4, 1.2, shade(shoe || '#2a2a33', L.back ? -15 : 0), 1);
  }
  // arms
  const shoulders = [
    { x: -3.6, p: pose.armB, back: true },
    { x: 3.6, p: pose.armF, back: false },
  ];
  const pts = [];
  for (const A of shoulders) {
    const L1 = 5.4, L2 = 5.0;
    const sx = A.x + ls;
    const sy = -19.8;
    const ex = sx + Math.sin(A.p.a) * L1;
    const ey = sy + Math.cos(A.p.a) * L1;
    const hx = ex + Math.sin(A.p.a + A.p.b) * L2;
    const hy = ey + Math.cos(A.p.a + A.p.b) * L2;
    limb(ctx, sx, sy, ex, ey, 3.6, A.back ? shade(skin, -20) : skin);
    limb(ctx, ex, ey, hx, hy, 3.1, A.back ? shade(skin, -20) : skin);
    pts.push({ hx, hy, back: A.back });
  }
  return pts;
}

function drawBuggy(ctx, boss, t) {
  const pose = basePose(boss, t);
  const juice = boss.state === 'split';
  const splitOff = juice ? Math.sin(t * 18) * 3 : 0;
  const c = {
    skin: '#f2c48d', hair: '#3fa9f5', coat: '#d4552a', coatD: '#a83c1c',
    shirt: '#f0e6d2', pants: '#7a2f5f', trim: '#f2c14e', nose: '#e63946',
  };
  // legs striped
  bossLimbs(ctx, pose, c.skin, c.pants, c.pants, '#5a3b24');
  for (const side of [-1, 1]) {
    const xx = side * 2.6;
    const yy = -9;
    rect(ctx, xx - 1.8, yy, 3.6, 2, '#e8dcc8', 0);
    rect(ctx, xx - 1.6, yy + 3.4, 3.2, 1.4, '#e8dcc8', 0);
  }
  const ls = bossTorso(ctx, pose, 4.6, c.coat);
  // shirt
  poly(ctx, [[-1.8 + ls, -21.6], [1.8 + ls, -21.6], [1.4 + ls, -12], [-1.4 + ls, -12]], c.shirt, 0.8);
  for (let i = 0; i < 2; i++) rect(ctx, -1.4 + ls, -19 + i * 2.4, 2.8, 0.8, c.coatD, 0);
  // gold trim
  rect(ctx, -4.4 + ls, -20.8, 1.4, 1.4, c.trim, 0.5);
  rect(ctx, 3.0 + ls, -20.8, 1.4, 1.4, c.trim, 0.5);
  rect(ctx, -4.0 + ls, -11.2, 8, 1.4, '#3b2a20', 0.8);
  // head
  const hx = ls * 0.6, hy = -26.6;
  circ(ctx, hx, hy, 6.0, c.skin, 1.2);
  // hair pigtails
  for (const side of [-1, 1]) {
    circ(ctx, hx + side * 6.2, hy - 1.4 + (juice ? side * splitOff * 0.3 : 0), 3.0, c.hair, 1);
    circ(ctx, hx + side * 6.8, hy + 2.2, 1.8, c.hair, 0.9);
    rect(ctx, hx + side * 5.6, hy + 3.6, 2.4, 1.2, '#2b2b3a', 0);
  }
  // top hair
  poly(ctx, [[-5.6, hy - 4], [-3, hy - 7.4], [3, hy - 7.2], [5.6, hy - 4], [3.4, hy - 4.6], [0.6, hy - 5.4], [-2.4, hy - 4.6]], c.hair, 0.9);
  // red nose
  circ(ctx, hx + 6.2, hy - 0.6, 2.5, c.nose, 1.1);
  rect(ctx, hx + 5.4, hy - 1.6, 1.0, 0.9, '#ff9aa6', 0);
  // eyes
  rect(ctx, hx + 1.4, hy - 1.8, 1.5, 1.8, '#fff', 0.4);
  rect(ctx, hx + 3.6, hy - 1.8, 1.3, 1.7, '#fff', 0.4);
  rect(ctx, hx + 1.8, hy - 1.4, 0.9, 1.2, '#1b1b28', 0);
  rect(ctx, hx + 3.9, hy - 1.4, 0.8, 1.1, '#1b1b28', 0);
  // grin
  rect(ctx, hx + 1.0, hy + 2.6, 4.6, 1.0, '#5a2e22', 0);
  rect(ctx, hx + 1.4, hy + 2.5, 3.8, 0.5, '#fff', 0);
  // captain hat
  poly(ctx, [[-6, hy - 7.2], [-4.4, hy - 11], [4.4, hy - 11], [6, hy - 7.2], [3, hy - 8.4], [-3, hy - 8.4]], '#2b2b3a', 0.9);
  rect(ctx, -4.2, hy - 9.2, 8.4, 1.2, c.trim, 0);
  circ(ctx, 0, hy - 10.2, 1.4, '#f0e6d2', 0.4);
  // detached parts when splitting
  if (juice) {
    ctx.save();
    ctx.translate(0, splitOff);
    // floating hands
    circ(ctx, -10, -14, 3, '#f0f0f0', 1);
    circ(ctx, 10, -12, 3, '#f0f0f0', 1);
    ctx.restore();
  }
  // knives in hand when attacking
  if (boss.state === 'attack' || boss.state === 'special') {
    const ls2 = pose.lean * 7;
    const hx2 = 3.6 + ls2 + Math.sin(pose.armF.a) * 10.4;
    const hy2 = -19.8 + Math.cos(pose.armF.a) * 10.4;
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(hx2, hy2);
      ctx.rotate(-1 + i * 0.32);
      rect(ctx, -0.3, -1, 0.9, 7, '#d9e2ea', 0.5);
      poly(ctx, [[-0.3, -1], [0.6, -3], [1.5, -1]], '#e8eef4', 0.4);
      rect(ctx, -0.8, 5.4, 2.2, 1.2, '#8a5a33', 0.4);
      ctx.restore();
    }
  }
  // nose highlight / makeup
  rect(ctx, hx + 3.0, hy + 1.4, 2.4, 0.8, '#c0392b', 0);
}

function drawMorgan(ctx, boss, t) {
  const pose = basePose(boss, t);
  const c = { skin: '#e8b47c', coat: '#f2f2f2', coatD: '#d3d9e2', trim: '#d9a441', pants: '#22406e' };
  bossLimbs(ctx, pose, c.skin, c.pants, c.pants, '#1b1b28');
  const ls = bossTorso(ctx, pose, 4.8, c.coat);
  // coat tails
  poly(ctx, [[-4.6 + ls, -12], [-5.8 + ls, -4], [-3.4 + ls, -8]], c.coatD, 0.8);
  poly(ctx, [[4.6 + ls, -12], [5.8 + ls, -4], [3.4 + ls, -8]], c.coatD, 0.8);
  // marine markings
  rect(ctx, -1.8 + ls, -15.6, 3.6, 4.4, '#c0392b', 0.4);
  rect(ctx, -1.2 + ls, -14.8, 2.4, 2.8, '#f2c14e', 0.3);
  // epaulettes
  rect(ctx, -5.8 + ls, -21.4, 3.4, 1.8, c.trim, 0.7);
  rect(ctx, 2.4 + ls, -21.4, 3.4, 1.8, c.trim, 0.7);
  // head
  const hx = ls * 0.6, hy = -26.4;
  circ(ctx, hx, hy, 5.8, c.skin, 1.2);
  // big jaw
  poly(ctx, [[-4.4 + hx, hy + 1.4], [4.4 + hx, hy + 1.4], [3.0 + hx, hy + 5.4], [-2.8 + hx, hy + 5.2]], c.skin, 1);
  // cap
  rrect(ctx, hx - 6.2, hy - 5.6, 12.4, 3.8, 2.6, '#f2f2f2', 1);
  rect(ctx, hx - 6.2, hy - 3.8, 12.4, 1.2, '#22406e', 0);
  rect(ctx, hx + 4.6, hy - 3.2, 4, 1.4, '#f2f2f2', 0.8);
  rect(ctx, hx - 0.8, hy - 5.0, 3, 0.9, '#f2c14e', 0);
  // face
  rect(ctx, hx + 1.6, hy - 1.4, 1.4, 1.6, '#fff', 0.4);
  rect(ctx, hx + 3.9, hy - 1.4, 1.2, 1.5, '#fff', 0.4);
  rect(ctx, hx + 2.0, hy - 1.0, 0.9, 1.1, '#1b1b28', 0);
  rect(ctx, hx + 4.1, hy - 1.0, 0.8, 1.0, '#1b1b28', 0);
  rect(ctx, hx + 0.6, hy + 3.6, 4.2, 0.8, '#5a2e22', 0);
  rect(ctx, hx - 1.2, hy + 1.4, 2.6, 0.7, '#c99a63', 0);
  // axe arm
  const ang = pose.armF.a;
  const lsx = 3.6 + ls;
  const ex = lsx + Math.sin(ang) * 5.4;
  const ey = -19.8 + Math.cos(ang) * 5.4;
  const hxx = ex + Math.sin(ang + 0.2) * 5;
  const hyy = ey + Math.cos(ang + 0.2) * 5;
  limb(ctx, lsx, -19.8, ex, ey, 4.2, c.skin);
  limb(ctx, ex, ey, hxx, hyy, 3.6, c.skin);
  // axe handle + blade
  ctx.save();
  ctx.translate(hxx, hyy);
  ctx.rotate(-0.5);
  rect(ctx, -1, -12, 2.4, 22, '#6b4a2e', 0.9);
  poly(ctx, [[-1.4, -12], [-8, -16], [-10, -9], [-7, -3], [-1.4, -6]], '#c7cfd9', 1);
  poly(ctx, [[-1.4, -12], [-7, -15], [-8.6, -10], [-6, -6], [-1.4, -8]], '#e8eef6', 0);
  ctx.restore();
  // other fist
  circ(ctx, -6.2 + ls, -13.4, 2.0, c.skin, 0.9);
  // scar
  rect(ctx, hx + 4.4, hy - 3.2, 0.8, 3.4, '#b07a5a', 0);
  rect(ctx, hx - 4.6, hy + 2.4, 3.0, 0.7, '#9c6a4a', 0);
}

function drawArlong(ctx, boss, t) {
  const pose = basePose(boss, t);
  const c = { skin: '#5b9bd5', skinD: '#3f7fb8', shirt: '#f0e6d2', pants: '#2f4f6f', fin: '#8fd6f0' };
  bossLimbs(ctx, pose, c.skin, c.pants, c.pants, '#1d3557');
  const ls = bossTorso(ctx, pose, 5.2, c.skin);
  // open shirt sides
  poly(ctx, [[-5.6 + ls, -22], [-2.4 + ls, -22.6], [-1.4 + ls, -11], [-4.8 + ls, -10.4]], c.shirt, 1);
  poly(ctx, [[5.6 + ls, -22], [2.4 + ls, -22.6], [1.4 + ls, -11], [4.8 + ls, -10.4]], c.shirt, 1);
  // shirt pattern
  for (let i = 0; i < 4; i++) {
    rect(ctx, -4.6 + ls, -19.4 + i * 2.2, 1.6, 0.8, '#c0392b', 0);
    rect(ctx, 3.4 + ls, -18.8 + i * 2.2, 1.4, 0.7, '#c0392b', 0);
  }
  // gold chain
  for (let i = 0; i < 5; i++) circ(ctx, -2.6 + i * 1.3, -18 + Math.sin(i * 0.9) * 1.1, 0.7, '#f2c14e', 0.3);
  // head
  const hx = ls * 0.6, hy = -26.4;
  circ(ctx, hx, hy, 6.4, c.skin, 1.2);
  // head fin
  poly(ctx, [[hx - 3, hy - 6], [hx - 0.6, hy - 12.6], [hx + 2.6, hy - 6.4]], c.fin, 0.9);
  rect(ctx, hx - 2, hy - 9.4, 1, 3.4, '#d9f6ff', 0);
  // saw snout
  poly(ctx, [[hx + 3, hy - 3], [hx + 12.4, hy - 2.6], [hx + 10, hy + 3.4], [hx + 3, hy + 3.8]], c.skin, 1.1);
  for (let i = 0; i < 5; i++) {
    const sx = hx + 4.4 + i * 1.7;
    poly(ctx, [[sx, hy - 2.6], [sx + 1.0, hy - 5.2], [sx + 2.0, hy - 2.4]], '#e8eef4', 0.35);
    poly(ctx, [[sx, hy + 2.8], [sx + 1.0, hy + 5.2], [sx + 2.0, hy + 2.6]], '#e8eef4', 0.35);
  }
  // eyes (yellow)
  ell(ctx, hx + 2.4, hy - 1.4, 1.6, 1.5, '#ffe066', 0.6);
  rect(ctx, hx + 2.9, hy - 2.2, 0.9, 2.3, '#1b1b28', 0);
  ell(ctx, hx + 5.2, hy - 0.8, 1.1, 1.1, '#ffe066', 0.5);
  rect(ctx, hx + 5.4, hy - 1.4, 0.7, 1.4, '#1b1b28', 0);
  // gill marks
  rect(ctx, hx - 4.8, hy + 1.4, 0.9, 3.4, c.skinD, 0);
  rect(ctx, hx - 3.4, hy + 1.0, 0.8, 3.8, c.skinD, 0);
  // nose fin
  rect(ctx, hx + 9.6, hy - 0.8, 1.0, 3.4, '#1d3557', 0);
  // webbed hands
  const armPts = [];
  for (const side of [-1, 1]) {
    const ang = side > 0 ? pose.armF.a : pose.armB.a;
    const sx = side * 3.6 + ls;
    const hxx = sx + Math.sin(ang) * 9.4;
    const hyy = -19.8 + Math.cos(ang) * 9.4;
    limb(ctx, sx, -19.8, hxx, hyy, 4.2, side < 0 ? c.skinD : c.skin);
    armPts.push([hxx, hyy]);
  }
  // teeth on hands
  for (const [hxx, hyy] of armPts) {
    circ(ctx, hxx, hyy, 2.0, c.skin, 0.9);
    for (let i = 0; i < 3; i++) {
      poly(ctx, [[hxx - 1 + i, hyy], [hxx - 0.5 + i, hyy + 2.6], [hxx + 0.2 + i, hyy]], '#f2f6fa', 0.3);
    }
  }
  // necklace
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(hx, hy + 5.6, 5.6, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawCrocodile(ctx, boss, t) {
  const pose = basePose(boss, t);
  const c = { skin: '#d9b38c', coat: '#2f4f3f', coatD: '#1f3629', fur: '#d9cbb4', hair: '#151d1a', gold: '#c9a227' };
  bossLimbs(ctx, pose, c.skin, '#1f2f28', '#1f2f28', '#1b1b22');
  const ls = bossTorso(ctx, pose, 4.8, c.skin);
  // coat panels
  poly(ctx, [[-5.4 + ls, -22], [-1.8 + ls, -22.6], [-1.2 + ls, -8.8], [-5.8 + ls, -6.4], [-5.2 + ls, -14]], c.coat, 1.1);
  poly(ctx, [[5.4 + ls, -22], [1.8 + ls, -22.6], [1.2 + ls, -8.8], [5.8 + ls, -6.4], [5.2 + ls, -14]], c.coat, 1.1);
  // fur collar
  for (let i = 0; i < 7; i++) {
    circ(ctx, -5 + i * 1.7 + ls, -21.4 + Math.sin(i) * 0.8, 1.4, c.fur, 0.4);
  }
  // chest scar
  rect(ctx, -1.4 + ls, -18, 1.2, 4, shade(c.skin, -35), 0);
  // belt + gold buckle
  rect(ctx, -3.6 + ls, -11.4, 7.2, 1.8, '#2a2018', 0.8);
  rect(ctx, -1.2 + ls, -11.5, 2.4, 1.8, c.gold, 0.4);
  // head
  const hx = ls * 0.6, hy = -26.6;
  circ(ctx, hx, hy, 5.9, c.skin, 1.2);
  // slicked hair
  poly(ctx, [[-6, hy - 2.4], [-5.2, hy - 6.4], [-1, hy - 7.4], [4.8, hy - 5.8], [6, hy - 2], [4.4, hy - 3.6], [0.4, hy - 4.4], [-3.2, hy - 3.4]], c.hair, 0.9);
  for (let i = 0; i < 3; i++) rect(ctx, -3.6 + i * 2.4, hy - 6.2 + i * 0.4, 2, 0.7, '#3a4640', 0);
  // scar
  rect(ctx, hx - 0.6, hy - 4.2, 0.8, 8.4, '#b07a5a', 0.3);
  // eyes
  rect(ctx, hx + 1.8, hy - 1.8, 1.4, 1.5, '#fff', 0.4);
  rect(ctx, hx + 3.9, hy - 1.8, 1.2, 1.4, '#fff', 0.4);
  rect(ctx, hx + 2.1, hy - 1.4, 0.9, 1.1, '#1b1b28', 0);
  rect(ctx, hx + 4.1, hy - 1.4, 0.8, 1.0, '#1b1b28', 0);
  rect(ctx, hx + 1.0, hy + 3.0, 3.4, 0.7, '#5a2e22', 0);
  // cigar + smoke
  rect(ctx, hx + 4.8, hy + 2.2, 5.2, 1.2, '#8a5a33', 0.5);
  rect(ctx, hx + 9.6, hy + 2.1, 1.2, 1.2, '#ff7a3c', 0);
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3; i++) {
    circ(ctx, hx + 11 + i * 1.4, hy - 1 - i * 3 - (t * 4 % 3), 1.6 + i * 0.6, '#e8e8e8', 0);
  }
  ctx.restore();
  // hook hand
  const ang = pose.armF.a;
  const hxx = 3.6 + ls + Math.sin(ang) * 9.6;
  const hyy = -19.8 + Math.cos(ang) * 9.6;
  ctx.save();
  ctx.translate(hxx, hyy);
  ctx.strokeStyle = c.gold;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 3.4, 3.4, Math.PI * 0.9, Math.PI * 2.25);
  ctx.stroke();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
  // sand swirls
  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#e6c078';
    ctx.fillRect(-10 + i * 7, Math.sin(t * 3 + i) * 2, 6, 1);
  }
  ctx.restore();
}

function drawLucci(ctx, boss, t) {
  const pose = basePose(boss, t);
  const c = { skin: '#d9a878', suit: '#1b1b22', shirt: '#f2f2f2', tie: '#9c1c2e', hair: '#1a1a1a' };
  bossLimbs(ctx, pose, c.skin, c.suit, c.suit, '#101014');
  const ls = bossTorso(ctx, pose, 4.4, c.suit);
  // shirt + tie
  poly(ctx, [[-1.8 + ls, -22], [1.8 + ls, -22], [2.2 + ls, -18], [0 + ls, -15], [-2.2 + ls, -18]], c.shirt, 0.7);
  poly(ctx, [[-0.8 + ls, -21.4], [0.8 + ls, -21.4], [0.4 + ls, -15.4], [0 + ls, -14.6], [-0.4 + ls, -15.4]], c.tie, 0.4);
  // lapels
  poly(ctx, [[-4.4 + ls, -22], [-2 + ls, -22], [-1.6 + ls, -15], [-3.4 + ls, -16.4]], '#2a2a34', 0.5);
  poly(ctx, [[4.4 + ls, -22], [2 + ls, -22], [1.6 + ls, -15], [3.4 + ls, -16.4]], '#2a2a34', 0.5);
  // head
  const hx = ls * 0.6, hy = -26.4;
  circ(ctx, hx, hy, 5.7, c.skin, 1.2);
  // hair
  poly(ctx, [[-5.6, hy - 2.6], [-5, hy - 6.4], [-1.4, hy - 7.2], [3.6, hy - 6.2], [5.8, hy - 3.4], [4.4, hy - 2.2], [1, hy - 3.4], [-2, hy - 3], [-4.4, hy - 2]], c.hair, 0.9);
  // goatee
  poly(ctx, [[hx - 1, hy + 3.4], [hx + 1.4, hy + 3.4], [hx + 0.8, hy + 5.6], [hx - 0.8, hy + 5.6]], '#2a2a2a', 0.4);
  // eyes
  rect(ctx, hx + 1.6, hy - 1.6, 1.6, 1.4, '#fff', 0.4);
  rect(ctx, hx + 3.9, hy - 1.6, 1.3, 1.3, '#fff', 0.4);
  rect(ctx, hx + 2.0, hy - 1.2, 1.0, 1.0, '#1b1b28', 0);
  rect(ctx, hx + 4.1, hy - 1.2, 0.8, 0.9, '#1b1b28', 0);
  // brows
  rect(ctx, hx + 0.8, hy - 3.4, 2.2, 0.8, '#1b1b28', 0);
  rect(ctx, hx + 3.4, hy - 3.4, 2.0, 0.8, '#1b1b28', 0);
  rect(ctx, hx + 0.6, hy + 2.4, 3.6, 0.6, '#5a2e22', 0);
  // leopard spots in phase 2
  if (boss.phase >= 2) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 6; i++) {
      circ(ctx, -4 + (i % 3) * 4 + ls, -19 + Math.floor(i / 3) * 5, 0.9, '#3a2a1a', 0);
    }
    circ(ctx, hx - 3.4, hy - 1.6, 0.8, '#3a2a1a', 0);
    circ(ctx, hx + 2.4, hy - 3.4, 0.7, '#3a2a1a', 0);
    ctx.restore();
  }
  // claws
  const ang = pose.armF.a;
  const hxx = 3.6 + ls + Math.sin(ang) * 9.4;
  const hyy = -19.8 + Math.cos(ang) * 9.4;
  circ(ctx, hxx, hyy, 1.9, c.skin, 0.9);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = '#f2f6fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hxx + i * 0.8 - 0.5, hyy + 0.6);
    ctx.lineTo(hxx + i * 1.2 - 0.2, hyy + 3.2);
    ctx.stroke();
  }
  // pigeon (Hattori) on shoulder
  circ(ctx, -4.4 + ls, -22.6, 1.8, '#f2f2f2', 0.6);
  circ(ctx, -3.2 + ls, -23.6, 1.1, '#f2f2f2', 0.5);
  rect(ctx, -2.6 + ls, -23.6, 1.2, 0.6, '#e8a33c', 0);
  rect(ctx, -3.6 + ls, -24, 0.7, 0.7, '#1b1b28', 0);
}

function drawAkainu(ctx, boss, t) {
  const pose = basePose(boss, t);
  const c = { skin: '#e8b47c', coat: '#f0f0f0', coatD: '#d0d6de', cap: '#f2f2f2', trim: '#d9a441', magma: '#ff5a1f' };
  bossLimbs(ctx, pose, c.skin, '#2d3e5a', '#2d3e5a', '#1b1b28');
  const ls = bossTorso(ctx, pose, 5.0, c.coat);
  // coat details
  poly(ctx, [[-5.4 + ls, -22], [-2 + ls, -22.8], [-1.4 + ls, -7], [-6 + ls, -9]], c.coat, 1);
  poly(ctx, [[5.4 + ls, -22], [1.4 + ls, -22.8], [0.8 + ls, -8], [6 + ls, -10]], c.coat, 1);
  // dark shirt under
  poly(ctx, [[-1.8 + ls, -21.6], [1.8 + ls, -21.6], [1.4 + ls, -12], [-1.4 + ls, -12]], '#2d3e5a', 0.6);
  // JUSTICE text (tiny)
  ctx.save();
  ctx.fillStyle = '#2d3e5a';
  for (let i = 0; i < 7; i++) rect(ctx, -4.4 + i * 1.15 + ls, -16.4, 0.6, 0.6, '#2d3e5a', 0);
  ctx.restore();
  // epaulettes
  for (const sx of [-5.4, 2.6]) {
    rect(ctx, sx + ls, -22.2, 3.4, 1.8, c.trim, 0.6);
    for (let i = 0; i < 3; i++) pxFringe(ctx, sx + 0.6 + i * 1.0 + ls, -22.2);
  }
  // head
  const hx = ls * 0.6, hy = -26.8;
  circ(ctx, hx, hy, 5.8, c.skin, 1.2);
  // cap
  rrect(ctx, hx - 6.2, hy - 5.6, 12.4, 3.8, 2.6, c.cap, 1);
  rect(ctx, hx - 6.2, hy - 3.8, 12.4, 1.2, '#22406e', 0);
  rect(ctx, hx + 4.4, hy - 3.2, 4.2, 1.4, c.cap, 0.8);
  rect(ctx, hx - 0.8, hy - 5.0, 3, 0.9, c.trim, 0);
  // stern face
  rect(ctx, hx + 1.6, hy - 1.2, 1.5, 1.4, '#fff', 0.4);
  rect(ctx, hx + 3.9, hy - 1.2, 1.2, 1.3, '#fff', 0.4);
  rect(ctx, hx + 2.0, hy - 0.9, 0.9, 1.0, '#1b1b28', 0);
  rect(ctx, hx + 4.1, hy - 0.9, 0.8, 0.9, '#1b1b28', 0);
  rect(ctx, hx + 0.8, hy - 3.2, 2.4, 0.9, '#f0f0f0', 0);
  rect(ctx, hx + 3.4, hy - 3.2, 2.0, 0.9, '#f0f0f0', 0);
  rect(ctx, hx + 1.0, hy + 3.0, 3.4, 0.8, '#4a2a1e', 0);
  // burn scar on face
  rect(ctx, hx + 4.6, hy + 0.6, 1.2, 2.4, '#b0705a', 0);
  // magma arm (front)
  const ang = pose.armF.a;
  const sx2 = 3.6 + ls;
  const ex = sx2 + Math.sin(ang) * 5.4;
  const ey = -19.8 + Math.cos(ang) * 5.4;
  const hxx = ex + Math.sin(ang + 0.1) * 5.4;
  const hyy = ey + Math.cos(ang + 0.1) * 5.4;
  limb(ctx, sx2, -19.8, ex, ey, 4.2, '#5a4340');
  limb(ctx, ex, ey, hxx, hyy, 3.8, '#6a4a42');
  // glowing cracks
  ctx.strokeStyle = '#ff7a2c';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(sx2 + 1, -18); ctx.lineTo(ex, ey + 1);
  ctx.moveTo(ex - 1, ey - 2); ctx.lineTo(hxx - 1, hyy + 1);
  ctx.stroke();
  // magma fist
  circ(ctx, hxx, hyy, 3.0, '#ff6b1a', 1.1);
  circ(ctx, hxx, hyy, 1.7, '#ffd166', 0);
  // drips
  for (let i = 0; i < 3; i++) {
    const dy = (t * 20 + i * 13) % 16;
    pxMagma(ctx, hxx - 2 + i * 2, hyy + 2 + dy);
  }
  // other arm
  const ang2 = pose.armB.a;
  const hx2 = -3.6 + ls + Math.sin(ang2) * 9.6;
  const hy2 = -19.8 + Math.cos(ang2) * 9.6;
  circ(ctx, hx2, hy2, 2.0, c.skin, 0.9);
}

function pxFringe(ctx, x, y) {
  rect(ctx, x, y - 1.4, 0.7, 1.4, '#f2c14e', 0);
}
function pxMagma(ctx, x, y) {
  rect(ctx, x, y, 1.2, 2.2, '#ff8a3c', 0);
}

export const BOSS_DRAWERS = {
  buggy: drawBuggy,
  morgan: drawMorgan,
  arlong: drawArlong,
  crocodile: drawCrocodile,
  lucci: drawLucci,
  akainu: drawAkainu,
};

export function drawBoss(ctx, boss, time) {
  const fn = BOSS_DRAWERS[boss.type] || drawBuggy;
  bossFrame(ctx, boss, () => fn(ctx, boss, time));
}

/* phase aura for bosses */
export function drawBossAura(ctx, boss, time) {
  if (!boss || boss.phase < 2) return;
  const def = BOSSES[boss.type];
  const r = 22 * def.scale;
  const pulse = 0.5 + Math.sin(time * 5) * 0.2;
  const g = ctx.createRadialGradient(boss.x, boss.y - 20, 4, boss.x, boss.y - 20, r);
  g.addColorStop(0, `rgba(255,90,40,${0.12 * pulse})`);
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(boss.x - r, boss.y - 20 - r, r * 2, r * 2);
  void clamp;
}
