# Twenty-Six Games

Twenty-six single-file HTML games. No build step, no dependencies to install — each
`.html` file is the whole game. Open it in a browser and play.

**Play them in your browser: https://sandwormgochomp.github.io/games/**

| Game | File | What it is |
|---|---|---|
| **AEGIS** | `aegis.html` | Wave defense, 100 levels, data-driven bestiary and refits |
| **BEETLEBOUND** | `beetlebound.html` | Endless racer — tap to jump, hold to fly, outrun the rain |
| **BULWARK** | `bulwark.html` | Tower defence — 100 generated approaches, 6 towers × 4 tiers, research tree |
| **CHAINBREAKER** | `chainbreaker.html` | Deckbuilding roguelike where the Chain persists across turns |
| **CHORUS** | `chorus.html` | Puzzle platformer — each 20s breath leaves a self behind as a platform |
| **CINDER** | `cinder.html` | Falling-sand sandbox, 86 materials, one rule: density |
| **DEEPER** | `deeper.html` | Well descent — the bag you carry is the whole design |
| **DUSTLINE** | `dustline.html` | Positional deckbuilding roguelike on a stretch of dead rail |
| **GEARWORKS** | `gearworks.html` | Logic puzzle — 100 solver-verified bays, belts, dynamo, 100-wire electrics |
| **GLIDE** | `glide.html` | Momentum/sliding puzzle, 100 solver-proved levels, 2–7 player modes |
| **HIVEBOUND** | `hivebound.html` | 3D bee-queen colony defense (three.js), waves, weather, silk, jelly shop |
| **LAND / FLY** | `land.html` | Arcade flight — taking off is easy, landing is the game |
| **LANTERN HOLLOW** | `lanternhollow.html` | Cozy tea garden — six herbs pair into 21 teas, guests order by mood |
| **THE LIGHTHOUSE KEEPER** | `lighthouse.html` | One beam pulled three ways: ships, followers, and the drowned keeper |
| **MARKET DAY** | `burger.html` | Five stalls, five minigames, one burger you have to earn |
| **MMMM** | `mmmm.html` | Precision platformer about the letter M, 100 levels |
| **NECTAR** | `nectar.html` | Forage by day, defend the hive by night; table-driven raiders and weather |
| **NINE LIVES** | `ninelives.html` | Fire sim — nine deaths, each permanently scarring the room you died in |
| **PROTOTYPE** | `prototype.html` | Pick four modules, paint the level, play the game you built, get reviewed |
| **RING** | `ring.html` | Arcade — escape a collapsing reactor through 9 concentric rings, 100 levels |
| **RUSTBUCKET** | `rustbucket.html` | Scrapyard metroidvania — five sockets of swappable parts are the progression |
| **SIXTY** | `heist.html` | Stealth in one perfect minute; deterministic guards, so the clock is the level |
| **SPELLBOUND** | `spellbound.html` | Spelling bee — 807 words in 10 bands, 1000 seeded levels |
| **THE TRADE** | `thetrade.html` | Market game — only you see true worth, and suspicion is the other scoreboard |
| **THE UNDERSTUDY** | `understudy.html` | Puppet-show stage sim — you can only work a puppet you stand beside |
| **UNDERGROWTH** | `undergrowth.html` | 2D tile sandbox — ore tiers, real torch lighting, night-only boss |

`index.html` is a landing page linking to all twenty-six.

HIVEBOUND loads three.js from unpkg via an import map, so it needs a network
connection the first time. The other twenty-five are entirely offline — no network,
no assets, no CDN.
