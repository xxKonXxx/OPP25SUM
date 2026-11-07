# One Piece · Grand Line Adventure

A handcrafted, fan-made 2D pixel platformer starring Luffy and the Straw Hat crew.
Six worlds, twelve islands, six bosses, unlockable characters, and a full pirate-themed
front end — all drawn procedurally on a 480×270 canvas.

## Play

```bash
npm start
```

Then open **[http://127.0.0.1:8080*](https://xxkonxxx.github.io/OPP25SUM/)*.

No dependencies and no build step. `server.js` is a tiny static file server; the game
itself is plain HTML, CSS and ES modules. You can also serve the folder with any static
server (`npx serve`, `python -m http.server`, etc.). Opening `index.html` directly with
`file://` will not work because browsers block ES module imports from local files.

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or `←` / `→` | Move |
| `Shift` | Sprint |
| `Space` | Jump (press again in mid-air for a double jump) |
| `J` / `X` / Mouse 1 | Attack — Gum-Gum Pistol ranged punch |
| `K` / `C` / Mouse 2 | Dash — Gum-Gum Rocket |
| `Q` | Gear Second — temporary speed and attack buff |
| `E` | Gear Third — giant fist shockwave (long cooldown) |
| `Esc` / `P` | Pause |

## The Adventure

| World | Islands | Boss |
| --- | --- | --- |
| 1 · East Blue | Dawn Beach, Shells Town | Axe-Hand Morgan |
| 2 · Orange Town | Orange Town, Buggy's Big Top | Buggy the Clown |
| 3 · Arlong Park | Cocoyasi Village, Arlong Park | Arlong |
| 4 · Alabasta | Sandora, Rain Dinners | Crocodile |
| 5 · Enies Lobby | Sea Train, Tower of Law | Rob Lucci |
| 6 · Marineford | Ice Port, Plaza of Justice | Akainu |

Each island hides berries, chests, breakable crates, checkpoints and a goal flag.
Boss islands lock the flag until the boss is defeated.

### Crew unlocks

- **Zoro** — clear World 1 (both East Blue islands)
- **Sanji** — clear World 3 (both Arlong Park islands)
- **Nami** — collect 200 berries in total

Every world unlocks after the previous world is cleared. Progress, records, settings
and unlocks are saved automatically to `localStorage`.

## Project layout

```
index.html          DOM shell and all menu screens
css/style.css       pirate UI, responsive letterbox scaling
server.js           zero-dependency local static server
js/main.js          boot, audio unlock, visibility handling
js/game.js          loop, state machine, levels, HUD, progression
js/ui.js            HTML overlay navigation, previews, toasts
js/player.js        movement, combat, Gear abilities
js/enemies.js       enemy and boss AI
js/projectiles.js   pistol shots, shockwaves, boss projectiles
js/physics.js       AABB collision against tile terrain
js/camera.js        follow camera, shake, boss arena lock
js/levels.js        level lookup, unlock rules, records
js/levelbuilder.js  level-authoring DSL and validation
js/leveldata1.js    World 1–3 definitions
js/leveldata2.js    World 4–6 definitions
js/sprites.js       Luffy, crew and character art rigs
js/enemyart.js      enemy and boss pixel art
js/propsart.js      berries, chests, flags, HUD icons
js/worldart.js      skies, seas, islands, terrain, menu scene
js/pixelfont.js     bitmap font used on canvas
js/audio.js         Web Audio synth music and SFX
js/config.js        tuning, characters, worlds, save defaults
js/utils.js         math, storage and drawing helpers
```

## Notes

- Internal resolution is fixed at 480×270 and scaled up with nearest-neighbour pixels.
- HUD and in-game text are rendered on canvas; menus are HTML/CSS for crisp type.
- Audio is synthesised at runtime and starts after the first click or key press,
  as required by browser autoplay policies.
- This is a non-commercial fan project. One Piece and its characters belong to
  Eiichiro Oda, Shueisha and Toei Animation.
