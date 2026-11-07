/* =========================================================
   levels.js — combines all twelve levels and helpers
   ========================================================= */

import { WORLDS } from './config.js';
import { WORLD_1_3_LEVELS } from './leveldata1.js';
import { WORLD_4_6_LEVELS } from './leveldata2.js';

export const LEVELS = [...WORLD_1_3_LEVELS, ...WORLD_4_6_LEVELS];

const byId = new Map(LEVELS.map((l) => [l.id, l]));
const indexById = new Map(LEVELS.map((l, i) => [l.id, i]));

export function getLevel(id) {
  return byId.get(id) || null;
}

export function levelIndex(id) {
  return indexById.get(id) ?? -1;
}

export function nextLevelId(id) {
  const i = indexById.get(id);
  if (i === undefined || i < 0) return null;
  return LEVELS[i + 1]?.id ?? null;
}

export function worldLevels(worldId) {
  return LEVELS.filter((l) => l.world === worldId);
}

/* first playable level of a world (level 2 needs level 1 complete) */
export function firstOpenLevel(save, worldId) {
  const list = worldLevels(worldId);
  for (let i = 0; i < list.length; i++) {
    if (i === 0) return list[i].id;
    const prev = list[i - 1];
    if (save.levels?.[prev.id]?.complete) return list[i].id;
  }
  return list[list.length - 1]?.id ?? null;
}

export function isWorldUnlocked(save, worldId) {
  return (save.unlockedWorlds || [0]).includes(worldId);
}

export function isLevelUnlocked(save, levelId) {
  const level = getLevel(levelId);
  if (!level) return false;
  if (!isWorldUnlocked(save, level.world)) return false;
  const list = worldLevels(level.world);
  const i = list.findIndex((l) => l.id === levelId);
  if (i <= 0) return true;
  return Boolean(save.levels?.[list[i - 1].id]?.complete);
}

export function worldComplete(save, worldId) {
  const list = worldLevels(worldId);
  return list.length > 0 && list.every((l) => save.levels?.[l.id]?.complete);
}

export function completedCount(save) {
  return LEVELS.filter((l) => save.levels?.[l.id]?.complete).length;
}

export function totalCompletion(save) {
  return Math.round((completedCount(save) / LEVELS.length) * 100);
}

/* next unfinished level, used by the "continue" shortcut */
export function nextObjective(save) {
  for (const world of WORLDS) {
    if (!isWorldUnlocked(save, world.id)) continue;
    for (const l of world.levels) {
      if (!save.levels?.[l.id]?.complete) {
        if (isLevelUnlocked(save, l.id)) return l.id;
      }
    }
  }
  return LEVELS[0].id;
}

export { WORLDS };
