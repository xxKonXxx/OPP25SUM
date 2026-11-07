/* =========================================================
   leveldata2.js — Worlds 4–6 (Alabasta → Marineford)
   ========================================================= */

import { LevelBuilder } from './levelbuilder.js';

/* ---------------------------------------------------------
   4-1  DESERT RUINS
   --------------------------------------------------------- */
function desertRuins() {
  const b = new LevelBuilder({
    id: '4-1', world: 3, name: 'Desert Ruins', theme: 'alabasta',
    width: 176, parTime: 120,
    hint: 'Quicksand drags you down. Jump before it swallows you!',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['DO NOT STOP IN QUICKSAND', 'SHIFT  SPRINT']);
  b.ground(0, 40);
  b.decor('cactus', 4, 20);
  b.decor('rock', 14, 20);
  b.enemy('bandit', 12);
  b.checkpoint(16);
  b.berries(8, 18, 4);

  b.quicksand(30, 36, 20, 22);
  b.berries(32, 18, 3);
  b.enemy('bandit', 24);

  b.ground(40, 66);
  b.spikes(46, 19, 3);
  b.enemy('bandit', 52);
  b.building(56, 6, 15, 20);
  b.platform(54, 17, 3);
  b.chest(58, 14, { berries: 20, fruit: true });
  b.checkpoint(62);
  b.berries(48, 17, 4);

  b.ground(66, 110);
  b.quicksand(68, 74, 20, 22);
  b.enemy('bandit', 78);
  b.enemy('marine', 86);
  b.checkpoint(80);
  b.berries(76, 18, 4);
  b.decor('pillar', 92, 20, { h: 48 });
  b.platform(94, 16, 5);
  b.berries(94, 14, 5);
  b.spikes(100, 19, 2);
  b.chest(106, 19, { berries: 18, life: true });

  b.rect(110, 20, 5, 4, 0);
  b.spikes(110, 24, 5);
  b.platform(110, 17, 5);

  b.ground(115, 144);
  b.checkpoint(120);
  b.quicksand(124, 130, 20, 22);
  b.enemy('bandit', 134);
  b.enemy('marine', 139);
  b.decor('pillar', 136, 20, { h: 44 });

  b.rect(144, 20, 5, 4, 0);
  b.spikes(144, 24, 5);
  b.platform(144, 16, 5);

  b.ground(149, 176);
  b.checkpoint(156);
  b.enemy('bandit', 162);
  b.berries(152, 18, 4);
  b.decor('cactus', 158, 20);
  b.decor('rock', 168, 20);
  b.goal(170, 20);

  return b.build();
}

/* ---------------------------------------------------------
   4-2  CROCODILE'S TOMB  (CROCODILE)
   --------------------------------------------------------- */
function crocodileTomb() {
  const b = new LevelBuilder({
    id: '4-2', world: 3, name: "Crocodile's Tomb", theme: 'alabasta',
    width: 184, parTime: 150,
    hint: 'The Warlord of the Sea has sprung his trap.',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['ROYAL TOMB', 'TURN BACK']);
  b.ground(0, 28);
  b.decor('torch', 8, 20);
  b.decor('pillar', 14, 20, { h: 50 });
  b.enemy('bandit', 12);
  b.checkpoint(18);
  b.berries(6, 18, 4);

  b.ground(28, 62);
  b.decor('pillar', 32, 20, { h: 46 });
  b.quicksand(36, 42, 20, 22);
  b.enemy('bandit', 46);
  b.spikes(50, 19, 3);
  b.chest(56, 19, { berries: 18, fruit: true });
  b.checkpoint(52);
  b.berries(44, 18, 3);

  b.pit(62, 68);
  b.water(62, 68, 22, 26);
  b.platform(62, 17, 4);
  b.platform(66, 15, 2);

  b.ground(68, 104);
  b.checkpoint(72);
  b.enemy('bandit', 78);
  b.enemy('marine', 84);
  b.decor('torch', 88, 20);
  b.building(84, 6, 15, 20);
  b.platform(82, 17, 3);
  b.chest(88, 14, { berries: 20, life: true });
  b.platform(96, 16, 4);
  b.berries(96, 14, 4);

  b.ground(104, 130);
  b.quicksand(108, 114, 20, 22);
  b.enemy('bandit', 120);
  b.spikes(122, 19, 2);
  b.checkpoint(116);
  b.berries(124, 18, 3);
  b.decor('pillar', 127, 20, { h: 44 });

  b.pit(130, 136);
  b.water(130, 136, 22, 26);
  b.platform(130, 17, 4);
  b.platform(133, 15, 3);

  b.ground(136, 184);
  b.checkpoint(140);
  b.enemy('marine', 145);
  b.enemy('bandit', 150);
  b.decor('torch', 148, 20);
  b.decor('torch', 158, 20);
  b.decor('pillar', 164, 20, { h: 52 });
  b.boss('crocodile', 154);
  b.goal(178, 20);

  return b.build();
}

/* ---------------------------------------------------------
   5-1  FORTRESS GATE
   --------------------------------------------------------- */
function fortressGate() {
  const b = new LevelBuilder({
    id: '5-1', world: 4, name: 'Fortress Gate', theme: 'enies',
    width: 178, parTime: 130,
    hint: 'The gates of Enies Lobby. CP9 agents are everywhere.',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['JUSTICE NEVER SLEEPS', 'CP9 AHEAD']);
  b.ground(0, 26);
  b.decor('torch', 8, 20);
  b.decor('banner', 15, 20);
  b.enemy('marine', 13);
  b.enemy('cp9', 20);
  b.checkpoint(10);
  b.berries(5, 18, 4);

  b.terrace(26, 34, 19);
  b.terrace(34, 42, 18);
  b.spikes(36, 17, 2);
  b.decor('torch', 30, 19);
  b.enemy('marine', 31, 19);

  b.pit(42, 48, 18);
  b.water(42, 48, 22, 26);
  b.platform(42, 15, 3);
  b.platform(45, 13, 3);

  b.ground(48, 78);
  b.checkpoint(52);
  b.enemy('cp9', 56);
  b.enemy('marine', 62);
  b.chest(66, 19, { berries: 20, fruit: true });
  b.platform(70, 16, 4);
  b.berries(70, 14, 4);
  b.decor('pillar', 74, 20, { h: 48 });

  b.pit(78, 84);
  b.water(78, 84, 22, 26);
  b.platform(78, 17, 3);
  b.platform(81, 16, 3);

  b.ground(84, 112);
  b.checkpoint(88);
  b.enemy('cp9', 94);
  b.enemy('marine', 100);
  b.spikes(104, 19, 2);
  b.berries(90, 18, 4);
  b.decor('cannon', 108, 20);

  b.pit(112, 118);
  b.water(112, 118, 22, 26);
  b.platform(112, 16, 6);

  b.ground(118, 150);
  b.checkpoint(122);
  b.enemy('cp9', 128);
  b.enemy('marine', 134);
  b.chest(140, 19, { berries: 22, life: true });
  b.decor('banner', 144, 20);

  b.pit(150, 156);
  b.water(150, 156, 22, 26);
  b.platform(150, 17, 3);
  b.platform(153, 15, 3);

  b.ground(156, 178);
  b.checkpoint(160);
  b.enemy('cp9', 165);
  b.berries(158, 18, 4);
  b.decor('torch', 170, 20);
  b.goal(172, 20);

  return b.build();
}

/* ---------------------------------------------------------
   5-2  TOWER OF JUSTICE  (LUCCI)
   --------------------------------------------------------- */
function towerOfJustice() {
  const b = new LevelBuilder({
    id: '5-2', world: 4, name: 'Tower of Justice', theme: 'enies',
    width: 188, parTime: 160,
    hint: 'Rob Lucci guards the tower summit. Nothing is forgiven.',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['TOWER OF JUSTICE', 'NO WAY OUT']);
  b.ground(0, 58);
  b.decor('torch', 8, 20);
  b.decor('banner', 18, 20);
  b.enemy('cp9', 14);
  b.enemy('marine', 24);
  b.checkpoint(30);
  b.berries(10, 18, 4);
  b.platform(34, 17, 4);
  b.berries(34, 15, 4);
  b.enemy('cp9', 42);
  b.enemy('marine', 50);
  b.chest(54, 19, { berries: 20, fruit: true });
  b.decor('pillar', 48, 20, { h: 50 });

  b.pit(58, 64);
  b.water(58, 64, 22, 26);
  b.platform(58, 17, 3);
  b.platform(61, 15, 3);

  b.ground(64, 96);
  b.checkpoint(68);
  b.enemy('cp9', 74);
  b.enemy('marine', 82);
  b.spikes(88, 19, 2);
  b.berries(70, 18, 4);
  b.platform(90, 16, 4);
  b.berries(90, 14, 4);
  b.decor('banner', 94, 20);

  b.pit(96, 102);
  b.water(96, 102, 22, 26);
  b.platform(96, 16, 6);

  b.ground(102, 132);
  b.checkpoint(106);
  b.enemy('cp9', 112);
  b.enemy('marine', 120);
  b.chest(126, 19, { berries: 24, life: true });
  b.decor('torch', 116, 20);
  b.decor('cannon', 128, 20);

  b.pit(132, 138);
  b.water(132, 138, 22, 26);
  b.platform(132, 15, 4);
  b.platform(136, 17, 2);

  b.ground(138, 188);
  b.checkpoint(142);
  b.enemy('cp9', 148);
  b.enemy('marine', 152);
  b.decor('torch', 150, 20);
  b.decor('banner', 158, 20);
  b.decor('pillar', 172, 20, { h: 52 });
  b.boss('lucci', 158);
  b.goal(182, 20);

  return b.build();
}

/* ---------------------------------------------------------
   6-1  WAR ZONE
   --------------------------------------------------------- */
function warZone() {
  const b = new LevelBuilder({
    id: '6-1', world: 5, name: 'War Zone', theme: 'marineford',
    width: 188, parTime: 145,
    hint: 'Marineford is burning. Do not fall into the lava!',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['PARAMOUNT WAR', 'LAVA BELOW']);
  b.ground(0, 30);
  b.decor('cannon', 8, 20);
  b.decor('banner', 16, 20);
  b.enemy('magma', 14);
  b.enemy('marine', 22);
  b.checkpoint(12);
  b.berries(6, 18, 4);

  b.lava(30, 36, 22, 26);
  b.platform(31, 17, 3);
  b.platform(34, 15, 2);

  b.ground(36, 66);
  b.checkpoint(40);
  b.enemy('magma', 46);
  b.enemy('marine', 54);
  b.chest(58, 19, { berries: 24, fruit: true });
  b.platform(60, 16, 4);
  b.berries(60, 14, 4);
  b.decor('torch', 64, 20);

  b.lava(66, 72, 22, 26);
  b.platform(67, 16, 4);

  b.ground(72, 104);
  b.checkpoint(76);
  b.enemy('magma', 82);
  b.enemy('marine', 90);
  b.spikes(96, 19, 2);
  b.berries(78, 18, 4);
  b.decor('cannon', 100, 20);

  b.lava(104, 112, 22, 26);
  b.platform(104, 16, 4);
  b.platform(108, 15, 4);

  b.ground(112, 146);
  b.checkpoint(118);
  b.enemy('magma', 124);
  b.enemy('marine', 130);
  b.checkpoint(138);
  b.chest(142, 19, { berries: 26, life: true });
  b.decor('banner', 144, 20);

  b.lava(146, 152, 22, 26);
  b.platform(146, 17, 3);
  b.platform(149, 15, 3);

  b.ground(152, 188);
  b.checkpoint(156);
  b.enemy('magma', 160);
  b.enemy('marine', 166);
  b.berries(154, 18, 4);
  b.decor('torch', 172, 20);
  b.goal(182, 20);

  return b.build();
}

/* ---------------------------------------------------------
   6-2  THRONE OF JUSTICE  (AKAINU)
   --------------------------------------------------------- */
function throneOfJustice() {
  const b = new LevelBuilder({
    id: '6-2', world: 5, name: 'Throne of Justice', theme: 'marineford',
    width: 196, parTime: 180,
    hint: 'Admiral Akainu. Absolute Justice. The final battle.',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['THE FINAL BATTLE', 'FOR THE FRIENDS WE LOST']);
  b.ground(0, 26);
  b.decor('torch', 8, 20);
  b.decor('banner', 16, 20);
  b.enemy('magma', 16);
  b.enemy('cp9', 22);
  b.checkpoint(12);
  b.berries(6, 18, 4);

  b.lava(26, 32, 22, 26);
  b.platform(26, 17, 3);
  b.platform(29, 15, 3);

  b.ground(32, 66);
  b.checkpoint(36);
  b.enemy('marine', 42);
  b.enemy('magma', 50);
  b.chest(56, 19, { berries: 26, fruit: true });
  b.platform(60, 16, 4);
  b.berries(60, 14, 4);
  b.decor('cannon', 64, 20);

  b.lava(66, 72, 22, 26);
  b.platform(66, 16, 4);

  b.ground(72, 104);
  b.checkpoint(76);
  b.enemy('magma', 82);
  b.enemy('cp9', 90);
  b.spikes(96, 19, 2);
  b.berries(78, 18, 4);
  b.decor('torch', 100, 20);

  b.lava(104, 110, 22, 26);
  b.platform(104, 17, 3);
  b.platform(107, 15, 3);

  b.ground(110, 146);
  b.checkpoint(114);
  b.enemy('marine', 120);
  b.enemy('magma', 128);
  b.chest(134, 19, { berries: 28, life: true });
  b.checkpoint(138);

  b.lava(146, 152, 22, 26);
  b.platform(146, 16, 6);

  b.ground(152, 196);
  b.checkpoint(156);
  b.enemy('magma', 160);
  b.decor('banner', 162, 20);
  b.decor('banner', 172, 20);
  b.decor('torch', 168, 20);
  b.decor('torch', 180, 20);
  b.boss('akainu', 166);
  b.goal(190, 20);

  return b.build();
}

export const WORLD_4_6_LEVELS = [
  desertRuins(), crocodileTomb(),
  fortressGate(), towerOfJustice(),
  warZone(), throneOfJustice(),
];
