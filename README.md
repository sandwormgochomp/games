# Thirty-Eight Games

Thirty-eight single-file HTML games, plus four tools. No build step, no dependencies to
install — each `.html` file is the whole thing. Open it in a browser and play.

**Play them in your browser: https://sandwormgochomp.github.io/games/**

## Games

| Game | File | What it is |
|---|---|---|
| **AEGIS** | `aegis.html` | Wave defense, 100 levels, data-driven bestiary and refits |
| **BEETLEBOUND** | `beetlebound.html` | Endless racer — tap to jump, hold to fly, outrun the rain |
| **BLOBS** | `blob.html` | 3D sandbox — spawn a colony of blobs, pick them up and fling them |
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
| **MOSSFORD** | `mossford.html` | Cozy 3D town (three.js) — carry the post, no fail state |
| **NECTAR** | `nectar.html` | Forage by day, defend the hive by night; table-driven raiders and weather |
| **NINE LIVES** | `ninelives.html` | Fire sim — nine deaths, each permanently scarring the room you died in |
| **PROTOTYPE** | `prototype.html` | Pick four modules, paint the level, play the game you built, get reviewed |
| **RING** | `ring.html` | Arcade — escape a collapsing reactor through 9 concentric rings, 100 levels |
| **RUSTBUCKET** | `rustbucket.html` | Scrapyard metroidvania — five sockets of swappable parts are the progression |
| **SIXTY** | `heist.html` | Stealth in one perfect minute; deterministic guards, so the clock is the level |
| **SLIME.IO** | `slime.html` | Soft-body arena .io — split to lunge, four power-ups, optional online play |
| **SPELLBOUND** | `spellbound.html` | Spelling bee — 807 words in 10 bands, 1000 seeded levels |
| **THE TRADE** | `thetrade.html` | Market game — only you see true worth, and suspicion is the other scoreboard |
| **THE UNDERSTUDY** | `understudy.html` | Puppet-show stage sim — you can only work a puppet you stand beside |
| **UNDERGROWTH** | `undergrowth.html` | 2D tile sandbox — ore tiers, real torch lighting, night-only boss |

## Horror

These are the dark ones — dread, body horror and sound. Same deal, one file each.

| Game | File | What it is |
|---|---|---|
| **CANDLE FIRE** | `candlefire.html` | 3D yard defence (three.js) — boards, traps and fire buy time; blue light stops him |
| **HALDEN DEEP** | `halden.html` | First-person raycast horror — 7 sublevels, 27 datapads |
| **LAST CALL** | `lastcall.html` | 3D bar sim (three.js) — you inherited dad's bar; six nights, and it rots |
| **PORRIDGE** | `porridge.html` | Goldilocks shot the bear. You are the bear. Forage alive, haunt dead, 3 endings |
| **RIME** | `rime.html` | Sliding-puzzle horror — Halden's corridors, Glide's rule; solver-proved decks |
| **THE ROWAN LINE** | `rowanline.html` | 911-dispatcher horror — no graphics at all, and silence is a scored move |
| **TALLOW** | `tallow.html` | Top-down light/shadow horror — lantern oil, the Hollow, a pit that reaches back |
| **UNKNOWN** | `unknown.html` | Survey horror — sound the Kettle Deep, drop beacons, come back with the record |
| **VIGIL** | `vigil.html` | Narrative horror — 6-day grief loop, role-swap finale, anomalies unlock the truth |

## Tools & toys

Not games. Three things to make things with, and one thing to just watch.

| Tool | File | What it is |
|---|---|---|
| **INKFLOW** | `inkflow.html` | Smooth (non-pixel) paint & animation studio — layers, frames, onion skin |
| **MAKER** | `maker.html` | Game maker — paint a level, wire WHEN/THEN rule blocks, then play it |
| **PIXEL FORGE** | `pixelforge.html` | Pixel animation studio — layers, frames, onion skin, GIF export |
| **TIDEPOOL** | `tidepool.html` | Ecosystem toy — no score, no lose state; stock the tank and watch |

---

`index.html` is a landing page linking to all forty-two.

CANDLE FIRE, HIVEBOUND, LAST CALL and MOSSFORD load three.js from unpkg via an import
map, so those four need a network connection. The other thirty-eight are entirely
offline — no network, no assets, no CDN.

SLIME.IO plays solo straight from the page. Its optional multiplayer needs a server
you run yourself: `node slime-server.js` beside `slime.html` and `slime.env.js`, then
open the address it prints. Those two `.js` files are the only non-`.html` files here,
and nothing else depends on them.
