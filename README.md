# Six Games

Six single-file HTML games. No build step, no dependencies to install — each `.html`
file is the whole game. Open it in a browser and play.

| Game | File | What it is |
|---|---|---|
| **AEGIS** | `aegis.html` | Wave defense, 100 levels, data-driven bestiary and refits |
| **GEARWORKS** | `gearworks.html` | Logic puzzle — 100 solver-verified bays, belts, dynamo, 100-wire electrics |
| **GLIDE** | `glide.html` | Momentum/sliding puzzle, 100 solver-proved levels |
| **HALDEN DEEP** | `halden.html` | First-person raycast horror, 7 sublevels, 27 datapads |
| **HIVEBOUND** | `hivebound.html` | 3D bee-queen colony defense (three.js), waves, weather, silk, jelly shop |
| **RING** | `ring.html` | Arcade — escape a collapsing reactor through 9 concentric rings, 100 levels |

`index.html` is a landing page linking to all six.

HIVEBOUND loads three.js from unpkg via an import map, so it needs a network
connection the first time. The other five are entirely offline.
