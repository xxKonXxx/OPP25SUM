/* =========================================================
   ONE PIECE — GRAND LINE ADVENTURE
   config.js — global tuning, content tables, palettes
   ========================================================= */

export const TILE = 16;
export const VIEW_W = 480;
export const VIEW_H = 270;
export const LEVEL_H = 26;          // tiles
export const GROUND_ROW = 20;       // default walkable ground row

export const PHYS = {
  gravity: 980,
  maxFall: 520,
  accel: 1500,
  airAccel: 950,
  friction: 1750,
  maxSpeed: 132,
  sprintMul: 1.34,
  jumpVel: 342,
  doubleJumpVel: 318,
  coyote: 0.10,
  jumpBuffer: 0.12,
  jumpCut: 0.52,
  stompBounce: 305,
  swimGravity: 240,
  swimMaxFall: 95,
  swimStroke: 190,
  swimSpeed: 88,
};

export const ABILITIES = {
  basic:   { key: 'J', cooldown: 0.32, label: 'PISTOL' },
  dash:    { key: 'K', cooldown: 3.2,  label: 'ROCKET' },
  buff:    { key: 'Q', cooldown: 14,   label: 'GEAR 2' },
  special: { key: 'E', cooldown: 16,   label: 'GEAR 3' },
};

export const WORLDS = [
  {
    id: 0, name: 'EAST BLUE', island: 'Shells Town', theme: 'eastblue',
    blurb: 'Where every great pirate sets sail.',
    boss: 'Captain Morgan',
    levels: [
      { id: '1-1', name: 'Dawn Beach' },
      { id: '1-2', name: 'Shells Town' },
    ],
  },
  {
    id: 1, name: 'ORANGE TOWN', island: 'Orange Town', theme: 'orange',
    blurb: 'Rooftops, alley cats and a clown with a grudge.',
    boss: 'Buggy the Clown',
    levels: [
      { id: '2-1', name: 'Rooftop Run' },
      { id: '2-2', name: 'Main Street' },
    ],
  },
  {
    id: 2, name: 'ARLONG PARK', island: 'Cocoyasi Village', theme: 'arlong',
    blurb: 'Pools of salt water and a shark with a saw.',
    boss: 'Arlong the Saw',
    levels: [
      { id: '3-1', name: 'Salt Bridges' },
      { id: '3-2', name: 'Arlong Park' },
    ],
  },
  {
    id: 3, name: 'ALABASTA', island: 'Sandy Kingdom', theme: 'alabasta',
    blurb: 'Sandstorms, ruins and a Warlord of the sea.',
    boss: 'Sir Crocodile',
    levels: [
      { id: '4-1', name: 'Desert Ruins' },
      { id: '4-2', name: 'Crocodile\'s Tomb' },
    ],
  },
  {
    id: 4, name: 'ENIES LOBBY', island: 'Judicial Island', theme: 'enies',
    blurb: 'The World Government does not forgive.',
    boss: 'Rob Lucci',
    levels: [
      { id: '5-1', name: 'Fortress Gate' },
      { id: '5-2', name: 'Tower of Justice' },
    ],
  },
  {
    id: 5, name: 'MARINEFORD', island: 'Paramount War', theme: 'marineford',
    blurb: 'The final battle. The whole sea is watching.',
    boss: 'Admiral Akainu',
    levels: [
      { id: '6-1', name: 'War Zone' },
      { id: '6-2', name: 'Throne of Justice' },
    ],
  },
];

export const CHARACTERS = [
  {
    id: 'luffy', name: 'LUFFY', fullName: 'Monkey D. Luffy', title: 'Straw Hat',
    stats: { speed: 1.0, jump: 1.0, power: 1.0, berry: 1.0 },
    colors: {
      skin: '#f0bd83', skinShade: '#d79a63', hair: '#211a1a', shirt: '#e03a3a',
      shirtShade: '#a82323', pants: '#2e6fd0', pantsShade: '#1c4a92',
      hat: '#efc45c', hatShade: '#c99a35', sash: '#f4d35e', shoe: '#8b5a2b',
      accent: '#ffd166', eye: '#151515',
    },
    abilities: {
      basic: { name: 'GUM-GUM PISTOL', type: 'fist', damage: 1, range: 104, speed: 900 },
      dash: { name: 'GUM-GUM ROCKET', damage: 2, speed: 480, duration: 0.34 },
      buff: { name: 'GEAR SECOND', duration: 6.5, speed: 1.45, damage: 1.5, tint: '#ff5a5a' },
      special: { name: 'GEAR THIRD', damage: 4, radius: 92, knock: 400 },
    },
    unlock: null,
    hint: 'The future Pirate King.',
  },
  {
    id: 'zoro', name: 'ZORO', fullName: 'Roronoa Zoro', title: 'Pirate Hunter',
    stats: { speed: 0.94, jump: 0.95, power: 1.4, berry: 1.0 },
    colors: {
      skin: '#e8b47c', skinShade: '#c9915c', hair: '#4f8a44', shirt: '#1d3b32',
      shirtShade: '#122620', pants: '#2b2b33', pantsShade: '#1b1b22',
      hat: '#2f5d45', hatShade: '#1e3e2e', sash: '#2e7d32', shoe: '#3a2a1e',
      accent: '#8fd694', eye: '#141414',
    },
    abilities: {
      basic: { name: 'ONI GIRI', type: 'slash', damage: 2, range: 88, speed: 760 },
      dash: { name: 'TATSUMAKI', damage: 3, speed: 430, duration: 0.38 },
      buff: { name: 'ASHURA', duration: 6.5, speed: 1.35, damage: 1.6, tint: '#7dff8a' },
      special: { name: '1080 POUND HO', damage: 5, radius: 104, knock: 460 },
    },
    unlock: { type: 'world', world: 0 },
    hint: 'Clear East Blue.',
  },
  {
    id: 'sanji', name: 'SANJI', fullName: 'Vinsmoke Sanji', title: 'Black Leg',
    stats: { speed: 1.12, jump: 1.12, power: 1.08, berry: 0.9 },
    colors: {
      skin: '#f2c48d', skinShade: '#d39d68', hair: '#e8c766', shirt: '#20232b',
      shirtShade: '#14161c', pants: '#20232b', pantsShade: '#14161c',
      hat: '#e8c766', hatShade: '#c2a03f', sash: '#f2f2f2', shoe: '#111111',
      accent: '#ff9f1c', eye: '#151515',
    },
    abilities: {
      basic: { name: 'PARTY TABLE', type: 'kick', damage: 1, range: 78, speed: 860 },
      dash: { name: 'SKY WALK', damage: 2, speed: 460, duration: 0.34 },
      buff: { name: 'DIABLE JAMBE', duration: 6.5, speed: 1.5, damage: 1.55, tint: '#ffb347' },
      special: { name: 'IFRIT JAMBE', damage: 4, radius: 96, knock: 420 },
    },
    unlock: { type: 'world', world: 2 },
    hint: 'Clear Arlong Park.',
  },
  {
    id: 'nami', name: 'NAMI', fullName: 'Nami the Cat Burglar', title: 'Navigator',
    stats: { speed: 1.0, jump: 1.04, power: 0.82, berry: 1.6 },
    colors: {
      skin: '#f6c894', skinShade: '#d9a26d', hair: '#f08a2c', shirt: '#e8f4ff',
      shirtShade: '#b9d4ea', pants: '#3a6ea5', pantsShade: '#274d78',
      hat: '#f08a2c', hatShade: '#c46a18', sash: '#ffd166', shoe: '#9c5b2a',
      accent: '#7ce7ff', eye: '#2a1a12',
    },
    abilities: {
      basic: { name: 'THUNDER BALL', type: 'thunder', damage: 1, range: 132, speed: 560 },
      dash: { name: 'MIRAGE TEMPO', damage: 1, speed: 500, duration: 0.32 },
      buff: { name: 'THUNDERCHARGE', duration: 7, speed: 1.4, damage: 1.4, tint: '#7ce7ff' },
      special: { name: 'ZEUS BOLT', damage: 4, radius: 110, knock: 380 },
    },
    unlock: { type: 'berries', n: 200 },
    hint: 'Collect 200 berries.',
  },
];

export const THEMES = {
  eastblue: {
    skyTop: '#46bde8', skyBot: '#c9f3ff', sun: '#fff3b0', sunGlow: 'rgba(255,238,150,0.35)',
    cloud: '#ffffff', cloudShade: '#d9f3ff',
    seaTop: '#33b3da', seaDeep: '#0a4f78', foam: '#f0fdff',
    far: '#7ccbb6', far2: '#4aa693', mid: '#2c7f70',
    ground: { base: '#a86f3f', dark: '#7a4a24', light: '#cd9257', top: '#54c94f', topLight: '#8fe86d', topDark: '#2f8f3e' },
    stone: { base: '#9aa5b1', dark: '#66707d', light: '#cbd4dd' },
    wood: { base: '#ad6f38', dark: '#6f441f', light: '#dda164' },
    water: { base: '#2a8fc4', light: '#8fe8ff', deep: '#14567f' },
    accent: '#ffd166', topStyle: 'grass', weather: 'leaf', bg: 'island',
    minimap: '#4bc8e8',
  },
  orange: {
    skyTop: '#2d2a5e', skyBot: '#ff9a6c', sun: '#ffd08a', sunGlow: 'rgba(255,150,90,0.35)',
    cloud: '#ffd0b8', cloudShade: '#c9877e',
    seaTop: '#2b4f8a', seaDeep: '#101f45', foam: '#d9ecff',
    far: '#6a4b7a', far2: '#4a3458', mid: '#3a2947',
    ground: { base: '#8a6a55', dark: '#5e4638', light: '#b08a6d', top: '#b3a18a', topLight: '#d9c7ad', topDark: '#7d6d5a' },
    stone: { base: '#8f8b98', dark: '#5f5b6c', light: '#c1bccb' },
    wood: { base: '#9c5b34', dark: '#62351c', light: '#cf8757' },
    water: { base: '#24477f', light: '#79b7ff', deep: '#12264d' },
    accent: '#ff9f43', topStyle: 'cobble', weather: 'leaf', bg: 'town',
    minimap: '#ff9f43',
  },
  arlong: {
    skyTop: '#1c6866', skyBot: '#9fe0c8', sun: '#f5f2b0', sunGlow: 'rgba(220,255,210,0.22)',
    cloud: '#d4f5e8', cloudShade: '#a4d2c4',
    seaTop: '#1f9e8f', seaDeep: '#064a4b', foam: '#d9fff4',
    far: '#3f8a72', far2: '#2a6553', mid: '#1b4a3e',
    ground: { base: '#7d8a7d', dark: '#4f5c52', light: '#a9b5a5', top: '#5fa06b', topLight: '#89c98e', topDark: '#3d6f49' },
    stone: { base: '#7f8f8f', dark: '#526161', light: '#adbfbf' },
    wood: { base: '#8f6438', dark: '#5b3c1e', light: '#c29260' },
    water: { base: '#1f7f8c', light: '#7ff0e2', deep: '#0a3f4a' },
    accent: '#4fe3c1', topStyle: 'grass', weather: 'bubble', bg: 'park',
    minimap: '#2ec4b6',
  },
  alabasta: {
    skyTop: '#f4a259', skyBot: '#ffe3a3', sun: '#fff0b0', sunGlow: 'rgba(255,220,120,0.4)',
    cloud: '#ffe9c9', cloudShade: '#e0bc92',
    seaTop: '#d9a866', seaDeep: '#8a5a2c', foam: '#fff3d6',
    far: '#d9a866', far2: '#b98550', mid: '#8e6136',
    ground: { base: '#d6a45e', dark: '#a8783c', light: '#f0c987', top: '#edc17a', topLight: '#ffe0a8', topDark: '#b8863f' },
    stone: { base: '#c2a679', dark: '#8d744f', light: '#e6cfa3' },
    wood: { base: '#a9743f', dark: '#6f4723', light: '#d3a26d' },
    water: { base: '#b78a4a', light: '#ffe9b0', deep: '#7a542a' },
    accent: '#ffc857', topStyle: 'sand', weather: 'sand', bg: 'desert',
    minimap: '#e9b44c',
  },
  enies: {
    skyTop: '#2b3f5c', skyBot: '#8fa9bd', sun: '#dfe9f0', sunGlow: 'rgba(200,220,235,0.2)',
    cloud: '#c7d6e2', cloudShade: '#8fa3b4',
    seaTop: '#2f5878', seaDeep: '#101f33', foam: '#dfefff',
    far: '#4a6680', far2: '#33495f', mid: '#223444',
    ground: { base: '#7b8796', dark: '#4f5967', light: '#a8b4c2', top: '#6b7787', topLight: '#95a2b2', topDark: '#48515e' },
    stone: { base: '#6f7d8c', dark: '#46525f', light: '#9fadba' },
    wood: { base: '#7c5838', dark: '#4d3520', light: '#a87c55' },
    water: { base: '#274c68', light: '#8fc4e8', deep: '#0d2233' },
    accent: '#9ecfff', topStyle: 'stone', weather: 'rain', bg: 'fortress',
    minimap: '#9ecfff',
  },
  marineford: {
    skyTop: '#1a0f1e', skyBot: '#a33a2c', sun: '#ffb28a', sunGlow: 'rgba(255,110,70,0.28)',
    cloud: '#5d3238', cloudShade: '#3d2128',
    seaTop: '#3d1e24', seaDeep: '#120a12', foam: '#ffd2b0',
    far: '#4b2530', far2: '#331722', mid: '#241019',
    ground: { base: '#6e5a5a', dark: '#453636', light: '#98817c', top: '#7a6461', topLight: '#a8908a', topDark: '#4f3f3e' },
    stone: { base: '#5d5055', dark: '#382f34', light: '#887a80' },
    wood: { base: '#6b4a35', dark: '#412a1d', light: '#946b4c' },
    water: { base: '#8a2c1c', light: '#ff9a5c', deep: '#3c0f0c' },
    accent: '#ff6b35', topStyle: 'stone', weather: 'ember', bg: 'war',
    minimap: '#ff6b35',
  },
};

export const BOSSES = {
  buggy: {
    name: 'BUGGY THE CLOWN', title: 'Captain', hp: 14, scale: 1.55, width: 26, height: 42,
    colors: { skin: '#f2c48d', shirt: '#e03a3a', pants: '#3b3b8f', hair: '#3fa9f5', accent: '#ff4d6d' },
    reward: 80,
  },
  morgan: {
    name: 'CAPTAIN MORGAN', title: 'Marine Captain', hp: 18, scale: 1.7, width: 28, height: 46,
    colors: { skin: '#e8b47c', shirt: '#f0f0f0', pants: '#22406e', hair: '#2d2d2d', accent: '#c0c6cf' },
    reward: 100,
  },
  arlong: {
    name: 'ARLONG THE SAW', title: 'Fishman Captain', hp: 26, scale: 1.8, width: 30, height: 52,
    colors: { skin: '#5b9bd5', shirt: '#f0e6d2', pants: '#2f4f6f', hair: '#1d3557', accent: '#8fd6f0' },
    reward: 140,
  },
  crocodile: {
    name: 'SIR CROCODILE', title: 'Warlord of the Sea', hp: 32, scale: 1.8, width: 30, height: 52,
    colors: { skin: '#d9b38c', shirt: '#2f4f3f', pants: '#1f2f28', hair: '#151d1a', accent: '#c9a227' },
    reward: 180,
  },
  lucci: {
    name: 'ROB LUCCI', title: 'CP9 Assassin', hp: 38, scale: 1.8, width: 30, height: 52,
    colors: { skin: '#d9a878', shirt: '#1b1b22', pants: '#1b1b22', hair: '#1a1a1a', accent: '#f0f0f0' },
    reward: 220,
  },
  akainu: {
    name: 'ADMIRAL AKAIKU', title: 'Absolute Justice', hp: 46, scale: 1.9, width: 32, height: 56,
    colors: { skin: '#e8b47c', shirt: '#f0f0f0', pants: '#2d3e5a', hair: '#2a2a2a', accent: '#ff5a1f' },
    reward: 300,
  },
};

export const SAVE_KEY = 'op-grandline-save-v1';
export const SETTINGS_KEY = 'op-grandline-settings-v1';

export const DEFAULT_SAVE = () => ({
  version: 1,
  berries: 0,
  characters: ['luffy'],
  levels: {},          // "1-1": { complete, bestTime, bestBerries, bestSecrets, plays }
  unlockedWorlds: [0],
  stats: { kills: 0, deaths: 0, chests: 0, playTime: 0, jumps: 0, bestCombo: 0 },
  victory: false,
});

export const DEFAULT_SETTINGS = () => ({
  master: 0.8,
  music: 0.55,
  sfx: 0.8,
  shake: true,
  hints: true,
});

export const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'KeyW', 'ArrowUp'],
  attack: ['KeyJ', 'KeyX', 'Mouse0'],
  dash: ['KeyK', 'KeyC', 'Mouse2'],
  buff: ['KeyQ', 'KeyU'],
  special: ['KeyE', 'KeyI'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  pause: ['Escape', 'KeyP'],
  confirm: ['Enter'],
};
