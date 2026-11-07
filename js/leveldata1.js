/* =========================================================
   leveldata1.js — Worlds 1–3 (East Blue → Arlong Park)
   ========================================================= */

import { LevelBuilder } from './levelbuilder.js';

/* ---------------------------------------------------------
   1-1  DAWN BEACH
   --------------------------------------------------------- */
function dawnBeach() {
  const b = new LevelBuilder({
    id: '1-1', world: 0, name: 'Dawn Beach', theme: 'eastblue',
    width: 144, parTime: 80,
    hint: 'A new pirate sets sail. Follow the beach east!',
  });

  b.spawn(3, 20);
  b.sign(7, 20, ['A / D  MOVE', 'SPACE  JUMP X2', 'J / LMB  PUNCH']);

  b.ground(0, 26);
  b.decor('palm', 2, 20);
  b.decor('palm', 12, 20);
  b.decor('bush', 6, 20);
  b.decor('rock', 16, 20);
  b.berries(9, 18, 4);
  b.enemy('pirate', 15);

  b.platform(17, 17, 4);
  b.berries(17, 15, 4);
  b.brick(21, 16, 'berry');
  b.question(22, 16, 'big');
  b.brick(23, 16, 'berry');

  b.pit(26, 30);
  b.water(26, 30, 23, 26);

  b.ground(30, 54);
  b.checkpoint(33);
  b.berries(35, 18, 3);
  b.enemy('marine', 38);
  b.enemy('gull', 42, 14);
  b.platform(39, 17, 3);
  b.building(43, 6, 16, 20);
  b.chest(46, 15, { berries: 12, fruit: true });
  b.decor('house2', 42, 20, { w: 54, h: 34 });
  b.berries(50, 18, 3);

  b.pit(54, 58);
  b.water(54, 58, 23, 26);

  b.ground(58, 88);
  b.checkpoint(62);
  b.enemy('pirate', 68);
  b.enemy('marine', 76);
  b.enemy('gull', 82, 13);
  b.brick(66, 16, 'berry');
  b.question(67, 16, 'big');
  b.brick(68, 16, 'berry');
  b.berries(72, 18, 4);
  b.platform(78, 16, 4);
  b.berryArc(78, 14, 4);

  b.terrace(88, 96, 19);
  b.decor('rock', 92, 19);
  b.terrace(96, 102, 18);
  b.decor('bush', 99, 18);
  b.berries(97, 16, 4);

  b.pit(102, 106);
  b.water(102, 106, 23, 26);

  b.ground(106, 144);
  b.checkpoint(110);
  b.enemy('pirate', 116);
  b.enemy('marine', 124);
  b.berries(112, 18, 4);
  b.chest(120, 19, { berries: 10 });
  b.platform(126, 16, 5);
  b.berries(126, 14, 5);
  b.question(133, 16, 'life');
  b.decor('palm', 136, 20);
  b.decor('bush', 130, 20);
  b.goal(139, 20);

  return b.build();
}

/* ---------------------------------------------------------
   1-2  FOOSA VILLAGE  (BUGGY)
   --------------------------------------------------------- */
function shellsTown() {
  const b = new LevelBuilder({
    id: '1-2', world: 0, name: 'Shells Town', theme: 'eastblue',
    width: 164, parTime: 120,
    hint: 'Axe-Hand Morgan has seized the marine base!',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['K / RMB  DASH', 'Q  GEAR SECOND', 'E  GEAR THIRD']);

  b.ground(0, 44);
  b.decor('house', 8, 20, { w: 44, h: 30 });
  b.decor('barrel', 16, 20);
  b.decor('fence', 26, 20, { w: 3 });

  b.building(10, 6, 15, 20);
  b.platform(8, 17, 3);
  b.chest(12, 14, { berries: 10 });
  b.berries(16, 18, 4);
  b.enemy('pirate', 18);
  b.enemy('marine', 27);

  b.crate(22, 19);
  b.crate(23, 19);
  b.crate(23, 18);
  b.brick(28, 17, 'berry');
  b.question(29, 17, 'big');
  b.brick(30, 17, 'berry');

  b.checkpoint(32);
  b.enemy('pirate', 36);
  b.berries(34, 18, 3);

  b.pit(44, 48);
  b.water(44, 48, 23, 26);

  b.ground(48, 92);
  b.decor('house2', 50, 20, { w: 56, h: 36 });
  b.sign(52, 20, ['CHECKPOINT AHEAD', 'WATCH THE ROOFTOPS']);
  b.platform(50, 17, 4);
  b.berries(50, 15, 4);
  b.enemy('gull', 56, 13);
  b.enemy('marine', 61);
  b.chest(66, 19, { berries: 14, fruit: true });
  b.checkpoint(70);
  b.enemy('pirate', 76);
  b.berries(72, 18, 4);

  b.building(80, 7, 16, 20);
  b.platform(78, 17, 3);
  b.enemy('pirate', 83, 16);
  b.berries(80, 14, 4);
  b.decor('banner', 88, 20);

  b.pit(92, 96);
  b.water(92, 96, 23, 26);

  b.ground(96, 164);
  b.checkpoint(100);
  b.enemy('marine', 106);
  b.enemy('pirate', 112);
  b.enemy('gull', 116, 12);
  b.berries(108, 18, 4);
  b.chest(120, 19, { berries: 16, life: true });
  b.berries(124, 18, 4);
  b.checkpoint(126);
  b.platform(128, 17, 3);
  b.berryArc(128, 15, 3);

  /* battle arena */
  b.decor('banner', 138, 20);
  b.decor('banner', 146, 20);
  b.decor('crateStack', 150, 20);
  b.boss('morgan', 134);
  b.goal(158, 20);

  return b.build();
}

/* ---------------------------------------------------------
   2-1  ROOFTOP RUN
   --------------------------------------------------------- */
function rooftopRun() {
  const b = new LevelBuilder({
    id: '2-1', world: 1, name: 'Rooftop Run', theme: 'orange',
    width: 164, parTime: 95,
    hint: 'Orange Town rooftops — mind the gaps!',
  });

  b.spawn(3, 20);
  b.sign(7, 20, ['JUMP BETWEEN ROOFS', 'HOLD SHIFT TO SPRINT']);
  b.ground(0, 20);
  b.decor('house', 2, 20, { w: 38, h: 32 });
  b.decor('bush', 12, 20);
  b.crate(9, 19);
  b.brick(12, 17, 'berry');
  b.question(13, 17, 'big');
  b.enemy('pirate', 15);

  b.pit(20, 25);
  b.water(20, 25, 23, 26);

  b.ground(25, 48);
  b.checkpoint(28);
  b.enemy('marine', 32);
  b.enemy('gull', 36, 13);
  b.building(36, 6, 15, 20);
  b.platform(34, 17, 3);
  b.chest(38, 14, { berries: 12 });
  b.berries(42, 18, 4);
  b.decor('barrel', 30, 20);

  b.pit(48, 54);
  b.water(48, 54, 23, 26);
  b.platform(48, 17, 3);
  b.platform(51, 15, 3);

  b.ground(54, 86);
  b.checkpoint(58);
  b.enemy('pirate', 62);
  b.enemy('marine', 68);
  b.platform(64, 16, 4);
  b.berries(64, 14, 4);
  b.building(71, 7, 16, 20);
  b.platform(69, 17, 3);
  b.enemy('pirate', 74, 16);
  b.chest(74, 15, { berries: 12, fruit: true });
  b.decor('banner', 80, 20);

  b.pit(86, 91);
  b.water(86, 91, 23, 26);

  b.ground(91, 120);
  b.checkpoint(95);
  b.enemy('marine', 100);
  b.enemy('pirate', 106);
  b.enemy('gull', 110, 12);
  b.terrace(102, 108, 19);
  b.berries(108, 18, 4);
  b.chest(114, 19, { berries: 15, life: true });
  b.decor('crateStack', 117, 20);

  b.pit(120, 124);
  b.water(120, 124, 23, 26);

  b.ground(124, 164);
  b.checkpoint(128);
  b.enemy('marine', 131);
  b.decor('banner', 138, 20);
  b.decor('barrel', 148, 20);

  b.goal(158, 20);

  return b.build();
}

/* ---------------------------------------------------------
   2-2  MAIN STREET
   --------------------------------------------------------- */
function mainStreet() {
  const b = new LevelBuilder({
    id: '2-2', world: 1, name: 'Main Street', theme: 'orange',
    width: 174, parTime: 130,
    hint: 'Buggy the Clown has turned Main Street into a circus.',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['MARINES AHEAD', 'BREAK CRATES FOR BERRIES']);
  b.ground(0, 34);
  b.decor('house2', 4, 20, { w: 58, h: 38 });
  b.decor('barrel', 12, 20);
  b.decor('banner', 20, 20);
  b.crate(14, 19);
  b.crate(15, 19);
  b.question(18, 17, 'big');
  b.brick(17, 17, 'berry');
  b.enemy('marine', 22);
  b.enemy('pirate', 29);
  b.checkpoint(17);
  b.berries(25, 18, 4);

  b.pit(34, 39);
  b.water(34, 39, 23, 26);

  b.ground(39, 72);
  b.checkpoint(44);
  b.enemy('marine', 49);
  b.enemy('marine', 56);
  b.enemy('gull', 60, 13);
  b.platform(46, 16, 4);
  b.berries(46, 14, 4);
  b.building(52, 7, 16, 20);
  b.platform(50, 18, 3);
  b.chest(55, 15, { berries: 16, fruit: true });
  b.decor('banner', 64, 20);
  b.brick(66, 17, 'berry');
  b.brick(67, 17, 'berry');
  b.berries(68, 18, 4);

  b.pit(72, 78);
  b.water(72, 78, 23, 26);
  b.platform(72, 17, 3);
  b.platform(75, 16, 3);

  b.ground(78, 108);
  b.checkpoint(82);
  b.enemy('marine', 88);
  b.enemy('pirate', 94);
  b.terrace(88, 94, 19);
  b.terrace(94, 99, 18);
  b.berries(90, 17, 4);
  b.platform(101, 16, 4);
  b.chest(104, 19, { berries: 18, life: true });
  b.decor('barrel', 100, 20);

  b.pit(108, 112);
  b.water(108, 112, 23, 26);

  b.ground(112, 174);
  b.checkpoint(118);
  b.enemy('marine', 124);
  b.enemy('pirate', 132);
  b.enemy('gull', 136, 12);
  b.berries(120, 18, 4);
  b.checkpoint(138);
  b.decor('banner', 146, 20);
  b.decor('crateStack', 150, 20);

  b.boss('buggy', 144);
  b.goal(168, 20);

  return b.build();
}

/* ---------------------------------------------------------
   3-1  SALT BRIDGES
   --------------------------------------------------------- */
function saltBridges() {
  const b = new LevelBuilder({
    id: '3-1', world: 2, name: 'Salt Bridges', theme: 'arlong',
    width: 166, parTime: 115,
    hint: 'Fishmen patrol the salt water. Use the bridges!',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['WATER IS DEEP', 'JUMP TO SWIM UP']);
  b.ground(0, 18);
  b.decor('palm', 2, 20);
  b.decor('coral', 12, 20);
  b.enemy('pirate', 12);
  b.berries(8, 18, 4);

  b.water(18, 38, 22, 26);
  b.platform(19, 18, 4);
  b.platform(24, 16, 4);
  b.platform(29, 18, 4);
  b.berries(24, 14, 3);
  b.enemy('gull', 21, 12);
  b.enemy('gull', 32, 11);

  b.ground(38, 60);
  b.checkpoint(42);
  b.enemy('fishman', 46);
  b.enemy('gull', 50, 12);
  b.chest(52, 19, { berries: 14, fruit: true });
  b.berries(44, 18, 4);
  b.decor('coral', 56, 20);
  b.decor('palm', 58, 20);

  b.water(60, 80, 22, 26);
  b.platform(61, 17, 4);
  b.platform(66, 15, 4);
  b.platform(71, 17, 4);
  b.berries(66, 13, 3);
  b.enemy('gull', 63, 11);
  b.enemy('gull', 74, 12);

  b.ground(80, 106);
  b.checkpoint(84);
  b.enemy('fishman', 88);
  b.enemy('marine', 94);
  b.berries(90, 18, 4);
  b.brick(92, 16, 'berry');
  b.question(93, 16, 'big');
  b.brick(94, 16, 'berry');
  b.decor('coral', 98, 20);
  b.decor('palm', 102, 20);

  b.water(106, 126, 22, 26);
  b.platform(108, 17, 4);
  b.platform(114, 15, 4);
  b.platform(120, 17, 4);
  b.berryArc(114, 13, 4);
  b.enemy('gull', 110, 11);
  b.enemy('gull', 121, 12);

  b.ground(126, 166);
  b.checkpoint(130);
  b.enemy('fishman', 136);
  b.enemy('marine', 143);
  b.chest(148, 19, { berries: 18, life: true });
  b.berries(132, 18, 4);
  b.decor('coral', 152, 20);
  b.decor('palm', 158, 20);
  b.goal(160, 20);

  return b.build();
}

/* ---------------------------------------------------------
   3-2  ARLONG PARK  (ARLONG)
   --------------------------------------------------------- */
function arlongPark() {
  const b = new LevelBuilder({
    id: '3-2', world: 2, name: 'Arlong Park', theme: 'arlong',
    width: 174, parTime: 140,
    hint: 'Arlong the Saw waits in the pool arena. Free the village!',
  });

  b.spawn(3, 20);
  b.sign(6, 20, ['ARLONG PARK', 'NO HUMANS ALLOWED']);
  b.ground(0, 34);
  b.decor('palm', 2, 20);
  b.decor('banner', 12, 20);
  b.decor('coral', 24, 20);
  b.enemy('pirate', 15);
  b.enemy('fishman', 27);
  b.checkpoint(20);
  b.berries(10, 18, 4);
  b.chest(30, 19, { berries: 12 });

  b.water(34, 52, 22, 26);
  b.platform(35, 18, 4);
  b.platform(40, 16, 4);
  b.platform(45, 18, 4);
  b.berries(40, 14, 3);
  b.enemy('gull', 37, 11);
  b.enemy('gull', 47, 12);

  b.ground(52, 82);
  b.checkpoint(56);
  b.enemy('fishman', 60);
  b.enemy('marine', 68);
  b.chest(72, 19, { berries: 16, fruit: true });
  b.berries(58, 18, 4);
  b.decor('palm', 76, 20);
  b.decor('coral', 79, 20);

  b.water(82, 98, 22, 26);
  b.platform(83, 17, 4);
  b.platform(88, 15, 4);
  b.platform(93, 17, 3);
  b.berries(88, 13, 3);
  b.enemy('gull', 85, 11);
  b.enemy('gull', 94, 12);

  b.ground(98, 174);
  b.checkpoint(102);
  b.enemy('fishman', 108);
  b.enemy('pirate', 114);
  b.enemy('gull', 118, 12);
  b.berries(104, 18, 4);
  b.checkpoint(128);
  b.enemy('marine', 134);
  b.platform(122, 16, 4);
  b.berries(122, 14, 4);

  b.decor('banner', 146, 20);
  b.decor('banner', 154, 20);
  b.decor('pillar', 162, 20, { h: 46 });
  b.boss('arlong', 144);
  b.goal(168, 20);

  return b.build();
}

export const WORLD_1_3_LEVELS = [
  dawnBeach(), shellsTown(),
  rooftopRun(), mainStreet(),
  saltBridges(), arlongPark(),
];
