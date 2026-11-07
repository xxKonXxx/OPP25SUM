/* =========================================================
   propsart.js — projectiles, pickups, breakables, props, HUD icons
   ========================================================= */

import { ell, circ, rect, rrect, poly, limb } from './sprites.js';
import { drawText } from './pixelfont.js';
import { withAlpha, shade } from './utils.js';

const OUT = '#1b1b28';

/* ---------------- projectiles ---------------- */
export function drawProjectile(ctx, p, time) {
  const x = p.x, y = p.y;
  const dir = p.facing || 1;
  switch (p.type) {
    case 'fist': {
      ctx.save();
      // motion lines
      ctx.strokeStyle = withAlpha('#ffffff', 0.5);
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - dir * (8 + i * 4), y - 3 + i * 3);
        ctx.lineTo(x - dir * (14 + i * 5), y - 3 + i * 3);
        ctx.stroke();
      }
      circ(ctx, x, y, 4.0, '#f0bd83', 1.2);
      rect(ctx, x - 2.6, y - 2.2, 4.6, 0.8, '#d79a63', 0);
      rect(ctx, x - 2.2, y + 0.2, 4.0, 0.8, '#d79a63', 0);
      ctx.restore();
      break;
    }
    case 'slash': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.rotate(p.rot || 0);
      ctx.strokeStyle = withAlpha('#eaffea', 0.95);
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(0, 0, 11, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = withAlpha('#7dff8a', 0.5);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 8, -1.0, 1.0);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'kick': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.fillStyle = withAlpha('#ff9f1c', 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 9, -0.9, 0.9);
      ctx.arc(0, 0, 4, 0.9, -0.9, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(0, 0, 5, -0.8, 0.8);
      ctx.arc(0, 0, 2, 0.8, -0.8, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'thunder': {
      const pulse = 0.8 + Math.sin(time * 20) * 0.2;
      const g = ctx.createRadialGradient(x, y, 1, x, y, 14 * pulse);
      g.addColorStop(0, 'rgba(190,245,255,0.9)');
      g.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 16, 32, 32);
      circ(ctx, x, y, 3.6, '#dff8ff', 1);
      circ(ctx, x, y, 1.8, '#7ce7ff', 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 6); ctx.lineTo(x - 3, y - 1); ctx.lineTo(x - 6, y + 1); ctx.lineTo(x - 1, y + 6);
      ctx.stroke();
      break;
    }
    case 'bullet': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      rect(ctx, -7, -1.2, 8, 2.2, '#ffe066', 0.4);
      rect(ctx, -2, -1.6, 3.6, 3, '#ff9f1c', 0.6);
      ctx.restore();
      break;
    }
    case 'knife': {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((p.rot || 0) + time * 14);
      rect(ctx, -0.5, -6, 1.8, 9, '#d9e2ea', 0.7);
      poly(ctx, [[-0.5, -6], [0.4, -9], [1.3, -6]], '#f2f6fa', 0.4);
      rect(ctx, -1.2, 2, 3.2, 1.6, '#8a5a33', 0.5);
      ctx.restore();
      break;
    }
    case 'axe': {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 10);
      rect(ctx, -1, -8, 2, 14, '#6b4a2e', 0.6);
      poly(ctx, [[-1, -8], [-8, -5], [-7, 3], [-1, 2]], '#c7cfd9', 0.9);
      ctx.restore();
      break;
    }
    case 'water': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.fillStyle = '#4fc3e8';
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(0, -3.4); ctx.lineTo(-8, 0); ctx.lineTo(0, 3.4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.fillStyle = '#bfefff';
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-2, -1.4); ctx.lineTo(-2, 1.4); ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'sand': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      poly(ctx, [[-8, 2], [0, -6], [8, 2]], '#d6a45e', 0.7);
      rect(ctx, -8, 2, 16, 2, '#b8863f', 0);
      ctx.restore();
      break;
    }
    case 'shigan': {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      rect(ctx, -9, -1, 14, 1.6, '#f2f6fa', 0.4);
      poly(ctx, [[5, -1.6], [10, 0], [5, 1.6]], '#ffffff', 0.3);
      ctx.restore();
      break;
    }
    case 'magma': {
      const g = ctx.createRadialGradient(x, y, 1, x, y, 12);
      g.addColorStop(0, 'rgba(255,210,90,0.95)');
      g.addColorStop(0.5, 'rgba(255,110,40,0.7)');
      g.addColorStop(1, 'rgba(180,40,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 13, y - 13, 26, 26);
      circ(ctx, x, y, 3.6, '#ff8a3c', 0.9);
      circ(ctx, x - 0.6, y - 0.6, 1.6, '#ffe066', 0);
      break;
    }
    case 'cannonball': {
      circ(ctx, x, y, 4.4, '#2b2f38', 1);
      circ(ctx, x - 1.4, y - 1.4, 1.2, '#5a626e', 0);
      rect(ctx, x + 2, y - 5, 1.2, 2.4, '#8a5a33', 0);
      circ(ctx, x + 3.2, y - 5.6, 1.0, '#ffd166', 0);
      break;
    }
    case 'meteor': {
      const g = ctx.createRadialGradient(x, y, 2, x, y, 22);
      g.addColorStop(0, 'rgba(255,230,150,0.9)');
      g.addColorStop(0.6, 'rgba(255,100,30,0.5)');
      g.addColorStop(1, 'rgba(140,30,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 24, y - 24, 48, 48);
      circ(ctx, x, y, 7, '#6b2a18', 1);
      circ(ctx, x - 2, y - 2, 4, '#ff8a3c', 0);
      rect(ctx, x - 3, y - 6, 3, 3, '#ffd166', 0);
      break;
    }
    case 'wave': {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,110,40,0.75)';
      ctx.beginPath();
      ctx.moveTo(-p.w / 2, p.h / 2);
      ctx.quadraticCurveTo(0, -p.h * 0.9, p.w / 2, p.h / 2);
      ctx.lineTo(p.w / 2, p.h);
      ctx.lineTo(-p.w / 2, p.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-p.w / 2, p.h / 2, p.w, 2);
      ctx.restore();
      break;
    }
    default: {
      circ(ctx, x, y, 3, '#ffd166', 1);
    }
  }
}

/* ---------------- objects & pickups ---------------- */
export function drawObject(ctx, obj, time) {
  const cx = obj.x + (obj.w || 16) / 2;
  const baseY = obj.y + (obj.h || 16);

  switch (obj.kind) {
    case 'berry': {
      const bob = Math.sin(time * 3 + (obj.seed || 0) * 6.28) * 1.6;
      const y = baseY - 4 + bob;
      // sparkle
      if (Math.sin(time * 2 + (obj.seed || 0) * 9) > 0.7) {
        ctx.fillStyle = withAlpha('#fff7c0', 0.9);
        ctx.fillRect(cx + 4, y - 5, 1, 3);
        ctx.fillRect(cx + 3, y - 4, 3, 1);
      }
      circ(ctx, cx - 2.4, y, 2.8, '#6a4c93', 0.8);
      circ(ctx, cx + 2.2, y + 0.6, 2.8, '#7b5ea7', 0.8);
      circ(ctx, cx, y - 2.4, 2.8, '#8e6cc0', 0.8);
      circ(ctx, cx - 0.6, y - 3.2, 0.9, '#cfb3f0', 0);
      // leaf
      poly(ctx, [[cx, y - 4.6], [cx - 3.0, y - 7.2], [cx + 0.3, y - 6.0]], '#4caf50', 0.4);
      rect(ctx, cx - 0.5, y - 6.2, 0.9, 2.2, '#3f7d3a', 0);
      break;
    }
    case 'bigberry': {
      const bob = Math.sin(time * 2.4 + (obj.seed || 0) * 5) * 2;
      const y = baseY - 7 + bob;
      const g = ctx.createRadialGradient(cx, y, 2, cx, y, 18);
      g.addColorStop(0, 'rgba(255,220,120,0.35)');
      g.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 20, y - 20, 40, 40);
      circ(ctx, cx - 4, y + 2, 4.4, '#c9a227', 0.9);
      circ(ctx, cx + 4, y + 3, 4.4, '#e5b34a', 0.9);
      circ(ctx, cx, y - 4, 4.6, '#ffd166', 0.9);
      circ(ctx, cx - 1, y - 5.4, 1.4, '#fff7d0', 0);
      poly(ctx, [[cx, y - 8], [cx - 4, y - 12], [cx + 1, y - 10.6]], '#4caf50', 0.5);
      break;
    }
    case 'fruit': {
      const bob = Math.sin(time * 2 + 1) * 2;
      const y = baseY - 6 + bob;
      const g = ctx.createRadialGradient(cx, y, 2, cx, y, 16);
      g.addColorStop(0, 'rgba(190,140,255,0.35)');
      g.addColorStop(1, 'rgba(190,140,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 18, y - 18, 36, 36);
      circ(ctx, cx, y, 6.0, '#7b4fbf', 1.1);
      // swirls
      ctx.strokeStyle = '#d9b3ff';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(cx - 1, y, 3.2, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 2, y + 2, 1.6, Math.PI, Math.PI * 2.4);
      ctx.stroke();
      rect(ctx, cx - 0.6, y - 8.4, 1.4, 3, '#4a7a2a', 0.3);
      rect(ctx, cx - 0.8, y - 1.2, 1.2, 2.6, '#4a7a2a', 0);
      break;
    }
    case 'chest': {
      const opened = obj.opened;
      const w = 22, h = 16;
      const x = cx - w / 2;
      const y = baseY - h;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(cx, baseY, 13, 3, 0, 0, Math.PI * 2); ctx.fill();
      // glow when closed (subtle) and when open
      if (opened) {
        const g = ctx.createRadialGradient(cx, y + 4, 2, cx, y + 4, 24);
        g.addColorStop(0, 'rgba(255,230,140,0.5)');
        g.addColorStop(1, 'rgba(255,230,140,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - 26, y - 22, 52, 52);
      }
      // body
      rrect(ctx, x, y + 5, w, h - 5, 1.4, '#8a5a33', 1.1);
      rect(ctx, x + 2, y + 7, w - 4, 3, '#b07a48', 0);
      rect(ctx, x, y + 11, w, 1.2, '#6b4526', 0);
      // bands
      rect(ctx, x + 3, y + 5, 2.4, h - 5, '#d9a441', 0.5);
      rect(ctx, x + w - 5.4, y + 5, 2.4, h - 5, '#d9a441', 0.5);
      rect(ctx, cx - 2.2, y + 8, 4.4, 4.4, '#f2c14e', 0.6);
      rect(ctx, cx - 0.8, y + 9.2, 1.6, 2.2, '#3a2618', 0);
      if (opened) {
        // lid open
        ctx.save();
        ctx.translate(x + 1, y + 6);
        ctx.rotate(-1.15);
        rrect(ctx, 0, -7, w - 2, 8, 1.6, '#9c6a3c', 1);
        rect(ctx, 2, -6, w - 6, 2, '#c98d55', 0);
        rect(ctx, 4, -6, 2, 7, '#d9a441', 0);
        rect(ctx, w - 8, -6, 2, 7, '#d9a441', 0);
        ctx.restore();
        // sparkles
        for (let i = 0; i < 3; i++) {
          const st = (time * 2 + i) % 1;
          ctx.fillStyle = withAlpha('#ffe9a3', 1 - st);
          const sx = cx - 6 + i * 6;
          const sy = y - 2 - st * 12;
          ctx.fillRect(sx, sy, 2, 2);
        }
      } else {
        // lid closed
        rrect(ctx, x - 1, y, w + 2, 8, 2.4, '#a9743f', 1.1);
        rect(ctx, x + 2, y + 2, w - 4, 2, '#c98d55', 0);
        rect(ctx, x + 3, y, 2.4, 8, '#d9a441', 0.4);
        rect(ctx, x + w - 5.4, y, 2.4, 8, '#d9a441', 0.4);
      }
      break;
    }
    case 'brick':
    case 'question':
    case 'crate': {
      const x = obj.x, y = obj.y;
      const w = obj.w || 16, h = obj.h || 16;
      const hit = obj.bump > 0 ? Math.sin(obj.bump * 30) * 2 : 0;
      if (obj.kind === 'crate') {
        rrect(ctx, x + 0.5, y + 0.5 + hit, w - 1, h - 1, 2, '#9c6a3c', 1.2);
        rect(ctx, x + 2, y + 2 + hit, w - 4, h - 4, '#b07a48', 0);
        ctx.strokeStyle = '#6b4526';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3 + hit); ctx.lineTo(x + w - 3, y + h - 3 + hit);
        ctx.moveTo(x + w - 3, y + 3 + hit); ctx.lineTo(x + 3, y + h - 3 + hit);
        ctx.stroke();
        rect(ctx, x + 3, y + 3 + hit, w - 6, 1.4, '#c98d55', 0);
        rect(ctx, x + 3, y + h - 4.4 + hit, w - 6, 1.4, '#7a4a2a', 0);
      } else if (obj.kind === 'question') {
        rrect(ctx, x + 0.5, y + 0.5 + hit, w - 1, h - 1, 2.4, '#d9a441', 1.2);
        rect(ctx, x + 2, y + 2 + hit, w - 4, h - 4, '#f2c14e', 0);
        rect(ctx, x + 2, y + 2 + hit, w - 4, 1.6, '#ffe6a3', 0);
        rect(ctx, x + 2, y + h - 3.6 + hit, w - 4, 1.6, '#b07a2a', 0);
        // rivets
        for (const [dx, dy] of [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]]) {
          rect(ctx, x + dx, y + dy + hit, 2, 2, '#8a5a33', 0);
        }
        drawText(ctx, '?', cx, y + 4 + hit, { color: '#5a3a12', scale: 1, align: 'center', shadow: '#ffe6a3' });
      } else {
        rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 1.6, '#9b6a3f', 1.2);
        // brick lines
        rect(ctx, x + 2, y + 2, w - 4, 1.2, '#c98d55', 0);
        rect(ctx, x + 2, y + h - 3.2, w - 4, 1.2, '#6b4526', 0);
        rect(ctx, x + 2, y + 8, w - 4, 1.2, '#7a4f28', 0);
        rect(ctx, x + 7, y + 2, 1.2, 6, '#7a4f28', 0);
        rect(ctx, x + 2, y + 9.2, 1.2, 4.4, '#7a4f28', 0);
        rect(ctx, x + 12, y + 9.2, 1.2, 4.4, '#7a4f28', 0);
      }
      break;
    }
    case 'checkpoint': {
      const active = obj.active;
      const poleH = 46;
      const x = cx;
      const y = baseY;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y, 8, 2.4, 0, 0, Math.PI * 2); ctx.fill();
      rect(ctx, x - 1.4, y - poleH, 2.8, poleH, '#8a6a4a', 0.7);
      rect(ctx, x - 2.4, y - 2, 4.8, 2.4, '#6b4a2e', 0.5);
      circ(ctx, x, y - poleH - 1, 2, '#f2c14e', 0.7);
      const wave = Math.sin(time * 4 + x * 0.1) * 1.5;
      if (active) {
        const g = ctx.createRadialGradient(x, y - poleH + 8, 2, x, y - poleH + 8, 20);
        g.addColorStop(0, 'rgba(255,210,100,0.28)');
        g.addColorStop(1, 'rgba(255,210,100,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 22, y - poleH - 12, 44, 44);
        poly(ctx, [[x + 1, y - poleH + 1], [x + 15, y - poleH + 5 + wave], [x + 13, y - poleH + 12 + wave], [x + 1, y - poleH + 15]], '#e63946', 1);
        rect(ctx, x + 4, y - poleH + 5, 4, 4, '#f2c14e', 0.4);
      } else {
        poly(ctx, [[x + 1, y - poleH + 1], [x + 14, y - poleH + 5 + wave], [x + 1, y - poleH + 13]], '#8a8f99', 0.8);
      }
      break;
    }
    case 'goal': {
      const x = cx;
      const y = baseY;
      const poleH = 78;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(x, y, 12, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      // base
      rrect(ctx, x - 8, y - 6, 16, 6, 2, '#8a6a4a', 0.9);
      rect(ctx, x - 1.6, y - poleH, 3.2, poleH - 4, '#b08a5a', 0.9);
      circ(ctx, x, y - poleH - 1.4, 2.6, '#f2c14e', 0.8);
      // flag
      const wave = Math.sin(time * 3) * 2;
      const flag = [[x + 1, y - poleH + 2], [x + 28, y - poleH + 8 + wave], [x + 26, y - poleH + 26 + wave], [x + 1, y - poleH + 30]];
      ctx.save();
      const g = ctx.createRadialGradient(x + 10, y - poleH + 14, 2, x + 10, y - poleH + 14, 30);
      g.addColorStop(0, 'rgba(255,220,120,0.22)');
      g.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 24, y - poleH - 10, 70, 70);
      poly(ctx, flag, '#f5ead0', 1.1);
      // straw hat jolly roger
      circ(ctx, x + 13, y - poleH + 14, 5, '#2b2b2b', 0.5);
      rect(ctx, x + 9, y - poleH + 18, 8, 3, '#2b2b2b', 0);
      ctx.fillStyle = '#e5b34a';
      ctx.beginPath(); ctx.ellipse(x + 13, y - poleH + 9.6, 9.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 13, y - poleH + 8, 4.6, Math.PI, 0); ctx.fill();
      rect(ctx, x + 11.2, y - poleH + 12.6, 1.8, 1.8, '#2b2b2b', 0);
      rect(ctx, x + 14.4, y - poleH + 12.6, 1.8, 1.8, '#2b2b2b', 0);
      ctx.restore();
      break;
    }
    case 'sign': {
      const x = cx, y = baseY;
      const lines = obj.lines || ['...'];
      const w = Math.max(36, Math.max(...lines.map((l) => l.length)) * 6 + 8);
      rect(ctx, x - 1.4, y - 14, 2.8, 14, '#6b4a2e', 0.6);
      rrect(ctx, x - w / 2, y - 32, w, 20, 2, '#c9975a', 1);
      rect(ctx, x - w / 2 + 2, y - 30, w - 4, 1.4, '#e0b87d', 0);
      rect(ctx, x - w / 2 + 2, y - 15, w - 4, 1.4, '#8a5a33', 0);
      lines.forEach((line, i) => {
        drawText(ctx, line, x, y - 29 + i * 8, { color: '#3a2618', scale: 1, align: 'center' });
      });
      break;
    }
    case 'mover': {
      const w = obj.w, h = obj.h || 8;
      const x = obj.x, y = obj.y;
      // chains
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#c7cfd9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y - 14);
      ctx.moveTo(x + w - 4, y); ctx.lineTo(x + w - 4, y - 14);
      ctx.stroke();
      ctx.restore();
      rrect(ctx, x, y, w, h, 2.2, '#9c6a3c', 1.1);
      rect(ctx, x + 1.5, y + 1.5, w - 3, 2, '#c98d55', 0);
      rect(ctx, x + 1.5, y + h - 3, w - 3, 1.6, '#6b4526', 0);
      // gold orbs
      circ(ctx, x + 4, y + h / 2, 1.8, '#f2c14e', 0.5);
      circ(ctx, x + w - 4, y + h / 2, 1.8, '#f2c14e', 0.5);
      const glow = 0.4 + Math.sin(time * 4) * 0.2;
      ctx.fillStyle = withAlpha('#f2c14e', glow * 0.5);
      ctx.fillRect(x + w / 2 - 2, y + h / 2 - 0.5, 4, 1);
      break;
    }
    default:
      break;
  }
}

/* ---------------- HUD icons ---------------- */
export function drawHeart(ctx, x, y, s = 1, filled = true, color = '#e63946') {
  const pat = [
    '0110110',
    '1111111',
    '1111111',
    '0111110',
    '0011100',
    '0001000',
  ];
  const col = filled ? color : '#3a3f4d';
  const hi = filled ? '#ff8fa3' : '#4a5060';
  for (let row = 0; row < pat.length; row++) {
    for (let col2 = 0; col2 < 7; col2++) {
      if (pat[row][col2] === '1') {
        ctx.fillStyle = filled && row < 2 && (col2 === 2 || col2 === 3 || col2 === 4) ? hi : col;
        // outline pass via border detection below
        ctx.fillRect(x + col2 * s, y + row * s, s, s);
      }
    }
  }
  // outline
  ctx.fillStyle = '#1b1b28';
  for (let row = 0; row < pat.length; row++) {
    for (let col2 = 0; col2 < 7; col2++) {
      if (pat[row][col2] === '1') continue;
      const near = (r, c) => r >= 0 && r < pat.length && c >= 0 && c < 7 && pat[r][c] === '1';
      if (near(row - 1, col2) || near(row + 1, col2) || near(row, col2 - 1) || near(row, col2 + 1)) {
        ctx.fillRect(x + col2 * s, y + row * s, s, s);
      }
    }
  }
  // redraw inner to cover outer outline pixels
  for (let row = 1; row < pat.length - 1; row++) {
    for (let col2 = 1; col2 < 6; col2++) {
      if (pat[row][col2] === '1') {
        ctx.fillStyle = filled ? color : col;
        ctx.fillRect(x + col2 * s, y + row * s, s, s);
      }
    }
  }
}

export function drawBerryIcon(ctx, x, y, s = 1) {
  circ(ctx, x + 3 * s, y + 7 * s, 3 * s, '#7b5ea7', 0.7 * s);
  circ(ctx, x + 8 * s, y + 7 * s, 3 * s, '#8e6cc0', 0.7 * s);
  circ(ctx, x + 5.5 * s, y + 4 * s, 3 * s, '#9f7fd0', 0.7 * s);
  circ(ctx, x + 4.6 * s, y + 2.8 * s, 0.9 * s, '#cfb3f0', 0);
  poly(ctx, [[x + 5.5 * s, y + 1.4 * s], [x + 2 * s, y - 1 * s], [x + 6 * s, y + 0.4 * s]], '#4caf50', 0.4 * s);
}

export function drawAbilityIcon(ctx, kind, x, y, s = 1) {
  if (kind === 'pistol') {
    circ(ctx, x + 8 * s, y + 8 * s, 4.6 * s, '#f0bd83', 1 * s);
    rect(ctx, x + 4 * s, y + 6 * s, 6 * s, 0.9 * s, '#d79a63', 0);
    rect(ctx, x + 4.5 * s, y + 8.4 * s, 5 * s, 0.9 * s, '#d79a63', 0);
    // stretch lines
    ctx.fillStyle = '#f0bd83';
    ctx.fillRect(x + 0.5 * s, y + 7.4 * s, 4 * s, 1.4 * s);
  } else if (kind === 'rocket') {
    poly(ctx, [[x + 2 * s, y + 8 * s], [x + 9 * s, y + 3 * s], [x + 9 * s, y + 6 * s], [x + 13 * s, y + 8 * s], [x + 9 * s, y + 10 * s], [x + 9 * s, y + 13 * s]], '#f0bd83', 1 * s);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 0.5 * s, y + 6.4 * s, 3 * s, 1.2 * s);
    ctx.fillRect(x + 0.5 * s, y + 9 * s, 3 * s, 1.2 * s);
  } else if (kind === 'gear2') {
    // steam / flame
    poly(ctx, [[x + 7 * s, y + 2 * s], [x + 9 * s, y + 6 * s], [x + 12 * s, y + 7 * s], [x + 9 * s, y + 8 * s], [x + 10 * s, y + 13 * s], [x + 6 * s, y + 10 * s], [x + 3 * s, y + 12 * s], [x + 4 * s, y + 7 * s], [x + 2 * s, y + 6 * s], [x + 5 * s, y + 5 * s]], '#ff6b35', 0.8 * s);
    poly(ctx, [[x + 7 * s, y + 6 * s], [x + 8 * s, y + 9 * s], [x + 6 * s, y + 11 * s], [x + 5 * s, y + 8 * s]], '#ffd166', 0);
  } else if (kind === 'gear3') {
    circ(ctx, x + 7 * s, y + 7 * s, 5.4 * s, '#f0bd83', 1.1 * s);
    rect(ctx, x + 3.4 * s, y + 5.4 * s, 7 * s, 1 * s, '#d79a63', 0);
    rect(ctx, x + 3.8 * s, y + 7.8 * s, 6.2 * s, 1 * s, '#d79a63', 0);
    // bone crack steam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 11 * s, y + 2 * s, 1 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 3 * s, 1 * s, 2 * s);
  }
}

export function drawSkullIcon(ctx, x, y, s = 1, color = '#f2f2f2') {
  circ(ctx, x + 6 * s, y + 5.4 * s, 4.6 * s, color, 0.8 * s);
  rect(ctx, x + 3.4 * s, y + 8 * s, 5.2 * s, 2.6 * s, color, 0);
  rect(ctx, x + 4.2 * s, y + 5 * s, 1.6 * s, 1.8 * s, '#1b1b28', 0);
  rect(ctx, x + 6.8 * s, y + 5 * s, 1.6 * s, 1.8 * s, '#1b1b28', 0);
  rect(ctx, x + 5.6 * s, y + 8 * s, 1.2 * s, 1.2 * s, '#1b1b28', 0);
  // crossbones
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1 * s;
  ctx.beginPath();
  ctx.moveTo(x + 1 * s, y + 9.4 * s); ctx.lineTo(x + 11 * s, y + 12.4 * s);
  ctx.moveTo(x + 11 * s, y + 9.4 * s); ctx.lineTo(x + 1 * s, y + 12.4 * s);
  ctx.stroke();
}

export function drawLifeIcon(ctx, x, y, s = 1) {
  // tiny straw hat + face
  circ(ctx, x + 6 * s, y + 8 * s, 3.4 * s, '#f0bd83', 0.8 * s);
  ctx.fillStyle = '#efc45c';
  ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 5.2 * s, 7.2 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6 * s, y + 4.4 * s, 3.4 * s, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#1b1b28'; ctx.lineWidth = 0.5 * s;
  ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 5.2 * s, 7.2 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#1b1b28';
  ctx.fillRect(x + 4.6 * s, y + 7.6 * s, 1 * s, 1 * s);
  ctx.fillRect(x + 6.8 * s, y + 7.6 * s, 1 * s, 1 * s);
}

export function drawKeycap(ctx, x, y, label, scale = 1, active = true) {
  const w = 9 * scale, h = 9 * scale;
  rrect(ctx, x, y, w, h, 1.5, active ? '#f2c14e' : '#3a4150', 1);
  rect(ctx, x, y + h - 2 * scale, w, 2 * scale, active ? '#b8872c' : '#252b36', 0);
  drawText(ctx, label, x + w / 2, y + 2 * scale, { color: active ? '#2a1e0a' : '#8892a0', scale, align: 'center' });
  void shade;
}
