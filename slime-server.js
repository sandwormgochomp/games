/* slime-server.js — the multiplayer server for SLIME.IO.
 *
 *   node slime-server.js            listens on 8080
 *   node slime-server.js 9000       ...or wherever
 *
 * Then open http://localhost:8080 and pick a server. Anyone on the same network
 * opens the address printed at startup and joins the same rooms.
 *
 * Three rooms, each running the REAL simulation out of slime.html (booted
 * headlessly through slime.env.js), so the server and the browser can never
 * disagree about the rules. A room only ticks while somebody is in it, so an
 * idle server costs no CPU.
 *
 * No npm dependencies: the WebSocket handshake and framing are implemented
 * below against RFC 6455.
 */
'use strict';

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { makeEnv, FILE } = require('./slime.env.js');

const PORT = Number(process.argv[2]) || 8080;
const TICK = 1000 / 30;        // simulation step
const SNAP_EVERY = 2;          // ...so snapshots go out at 15/sec
const CAP = 12;                // players per room
const MAX_VIEW = 4200;         // clamp on a client's claimed viewport

const ROOMS = [
  { id: 'puddle', name: 'The Puddle', diff: 'easy' },
  { id: 'marsh',  name: 'Mudmarsh',   diff: 'medium' },
  { id: 'deep',   name: 'The Deep',   diff: 'hard' }
];

/* ------------------------------------------------------------------ rooms -- */
const rooms = new Map();

function makeRoom(def) {
  const env = makeEnv();
  const S = env.API;
  S.setDifficulty(def.diff);
  S.buildWorld();
  S.W.mode = 'solo';           // the server owns a plain local sim
  const palIndex = new Map();
  // PALETTE lives inside the page; recover it from a freshly made pellet colour
  return {
    def, env, S, W: S.W,
    clients: new Set(),
    dirV: 1,
    tickN: 0,
    built: true,
    palIndex
  };
}

function room(id) {
  let r = rooms.get(id);
  if (!r) {
    const def = ROOMS.find(d => d.id === id);
    if (!def) return null;
    r = makeRoom(def);
    rooms.set(id, r);
    log(`room "${def.name}" (${def.diff}) built`);
  }
  return r;
}

/* colour hex -> palette index, so goo costs one small int instead of a string */
function paletteIndex(r, hex) {
  if (r.palIndex.has(hex)) return r.palIndex.get(hex);
  const pal = r.S.PALETTE || [];
  let i = pal.indexOf(hex);
  if (i < 0) i = 0;
  r.palIndex.set(hex, i);
  return i;
}

/* ------------------------------------------------------------- simulation -- */
function stepRoom(r, dt) {
  const S = r.S, W = r.W;

  // feed each connected player's intent into their slime
  for (const c of r.clients) {
    const p = c.player;
    if (!p || !p.cells.length) continue;
    p.tx = c.in.x; p.ty = c.in.y;
    // regroup clears the fuse cooldown; the client cannot do this itself
    // because the server owns the simulation
    if (c.in.r) for (const cell of p.cells) cell.merge = 0;
    if (c.in.s) { S.doSplit(p); c.in.s = 0; }
    if (c.in.w) { S.doSpit(p); c.in.w = 0; }
  }

  S.step(dt);

  // tell anyone who just died, once
  for (const c of r.clients) {
    const p = c.player;
    if (!p) continue;
    if (!p.cells.length && !c.told) {
      c.told = true;
      const board = S.leaderboard();
      send(c, {
        t: 'dead',
        by: W.killer && c.killedBy ? c.killedBy : (c.killedBy || null),
        peak: Math.round(p.peak || 0),
        rank: p.bestRank === 99 ? null : p.bestRank,
        alive: Math.max(0, W.time - p.born)
      });
    } else if (p.cells.length) {
      c.told = false;
    }
  }
}

/* who ate whom: the sim only records this for its local player, so watch the
   leaderboard-independent way — a player's cells vanishing next to a bigger
   slime. Cheap approximation: remember the last thing that overlapped them. */
function noteKillers(r) {
  const S = r.S, W = r.W;
  for (const c of r.clients) {
    const p = c.player;
    if (!p || !p.cells.length) continue;
    let best = null, bestD = 1e9;
    for (const cell of p.cells) {
      const cr = S.radiusOf(cell.m);
      for (const q of W.players) {
        if (q === p || !q.cells.length) continue;
        for (const o of q.cells) {
          if (o.m <= cell.m * 1.16) continue;
          const d = Math.hypot(o.x - cell.x, o.y - cell.y) - S.radiusOf(o.m) - cr;
          if (d < bestD) { bestD = d; best = q.name; }
        }
      }
    }
    if (best && bestD < 60) c.killedBy = best;
  }
}

/* ------------------------------------------------------------- snapshots -- */
function snapshotFor(r, c) {
  const S = r.S, W = r.W;
  const p = c.player;
  let cx = S.CFG.world / 2, cy = S.CFG.world / 2;
  if (p && p.cells.length) { const m = S.centroid(p); cx = m.x; cy = m.y; }
  else if (c.lastX !== undefined) { cx = c.lastX; cy = c.lastY; }
  c.lastX = cx; c.lastY = cy;

  const hw = Math.min(c.in.vw || 1200, MAX_VIEW) + 120;
  const hh = Math.min(c.in.vh || 800, MAX_VIEW) + 120;
  const x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
  const inView = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;

  const cells = [];
  for (const q of W.players) {
    for (const cell of q.cells) {
      const rad = S.radiusOf(cell.m);
      if (cell.x + rad < x0 || cell.x - rad > x1 ||
          cell.y + rad < y0 || cell.y - rad > y1) continue;
      cells.push(cell.id, Math.round(cell.x), Math.round(cell.y),
                 Math.round(cell.m * 10) / 10, q.id);
    }
  }

  const goo = [];
  for (const g of W.goo) {
    if (!inView(g.x, g.y)) continue;
    goo.push(Math.round(g.x), Math.round(g.y), paletteIndex(r, g.c));
  }

  const pods = [];
  for (const v of W.pods) {
    if (!inView(v.x, v.y)) continue;
    pods.push(Math.round(v.x), Math.round(v.y), Math.round(v.m));
  }

  const spit = [];
  for (const s of W.spit) {
    if (!inView(s.x, s.y)) continue;
    spit.push(Math.round(s.x), Math.round(s.y), Math.round(s.m), paletteIndex(r, s.c));
  }

  // Power-ups on the ground, as kind INDEX so a pickup costs three small ints.
  // Deliberately NOT view-culled, unlike goo and pods: there are only ~18 of
  // them in the whole arena, and the minimap dot is the entire reason a player
  // ever crosses the map for one. Culled to the viewport it could only ever
  // show orbs already on screen, which is no help at all.
  const KEYS = S.POWER_KEYS;
  const ups = [];
  for (const u of W.powers) {
    ups.push(Math.round(u.x), Math.round(u.y), Math.max(0, KEYS.indexOf(u.kind)));
  }

  // who is currently lit up, as a bit mask per player. Only the flags travel:
  // rivals need an aura, not a countdown, and that keeps this to two ints.
  const buffs = [];
  for (const q of W.players) {
    if (!q.cells.length || !q.buffs) continue;
    let mask = 0;
    for (let i = 0; i < KEYS.length; i++) if (q.buffs[KEYS[i]] > 0) mask |= 1 << i;
    if (mask) buffs.push(q.id, mask);
  }

  // our own buffs need the real clock for the HUD chips
  const mine = [];
  if (p && p.buffs) {
    for (let i = 0; i < KEYS.length; i++) {
      const left = p.buffs[KEYS[i]];
      if (left > 0) mine.push(i, Math.round(left * 10) / 10);
    }
  }

  const board = [];
  const lb = S.leaderboard();
  for (let i = 0; i < Math.min(10, lb.length); i++) {
    board.push(lb[i].id, Math.round(S.totalMass(lb[i])));
  }

  const msg = {
    t: 's', c: cells, g: goo, v: pods, p: spit, b: board,
    u: ups, bf: buffs, bt: mine,
    dv: r.dirV,
    n: lb.length,
    r: p ? (lb.indexOf(p) + 1 || null) : null,
    al: p ? Math.max(0, W.time - p.born) : 0
  };
  if (c.dirV !== r.dirV) { msg.dir = directory(r); c.dirV = r.dirV; }
  return msg;
}

function directory(r) {
  const out = [];
  for (const q of r.W.players) out.push([q.id, q.name, q.color]);
  return out;
}

/* ------------------------------------------------------------- the clock -- */
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  let dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 0.25) dt = 0.25;

  for (const r of rooms.values()) {
    if (!r.clients.size) continue;     // idle rooms cost nothing
    r.tickN++;
    noteKillers(r);
    stepRoom(r, dt);
    if (r.tickN % SNAP_EVERY === 0) {
      for (const c of r.clients) {
        if (c.sock.writableLength > 1 << 20) continue;   // backpressure: skip a frame
        send(c, snapshotFor(r, c));
      }
    }
  }
}, TICK);

/* ------------------------------------------------------- WebSocket plumbing -- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function accept(key) {
  return crypto.createHash('sha1').update(key + GUID).digest('base64');
}

function frame(payload) {
  const data = Buffer.from(payload, 'utf8');
  const len = data.length;
  let head;
  if (len < 126) {
    head = Buffer.alloc(2);
    head[1] = len;
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[1] = 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(len), 2);
  }
  head[0] = 0x81;                       // FIN + text
  return Buffer.concat([head, data]);
}

function send(c, obj) {
  if (c.sock.destroyed) return;
  try { c.sock.write(frame(JSON.stringify(obj))); } catch (e) { /* dropped */ }
}

/* Decode whatever whole frames are sitting in the buffer. Frames can arrive
   split across TCP chunks or several to a chunk, so this always works off an
   accumulating buffer and stops the moment a frame is incomplete. */
function drain(c, onText) {
  for (;;) {
    const b = c.buf;
    if (b.length < 2) return;
    const fin = (b[0] & 0x80) !== 0;
    const op = b[0] & 0x0f;
    const masked = (b[1] & 0x80) !== 0;
    let len = b[1] & 0x7f;
    let off = 2;
    if (len === 126) {
      if (b.length < 4) return;
      len = b.readUInt16BE(2); off = 4;
    } else if (len === 127) {
      if (b.length < 10) return;
      const big = b.readBigUInt64BE(2);
      if (big > 8n * 1024n * 1024n) { c.sock.destroy(); return; }
      len = Number(big); off = 10;
    }
    let mask = null;
    if (masked) {
      if (b.length < off + 4) return;
      mask = b.subarray(off, off + 4); off += 4;
    }
    if (b.length < off + len) return;
    let data = b.subarray(off, off + len);
    if (mask) {
      const out = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) out[i] = data[i] ^ mask[i & 3];
      data = out;
    }
    c.buf = b.subarray(off + len);

    if (op === 0x8) { c.sock.end(); return; }          // close
    if (op === 0x9) {                                   // ping -> pong
      const p = Buffer.alloc(2); p[0] = 0x8a; p[1] = 0;
      try { c.sock.write(p); } catch (e) {}
      continue;
    }
    if (op === 0xa) continue;                           // pong
    if (op === 0x1 || op === 0x0) {
      c.frag = op === 0x1 ? data : Buffer.concat([c.frag || Buffer.alloc(0), data]);
      if (fin) { const s = c.frag.toString('utf8'); c.frag = null; onText(s); }
    }
  }
}

/* --------------------------------------------------------------- HTTP -- */
function lanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === 'IPv4' && !n.internal) return n.address;
    }
  }
  return 'localhost';
}
const HOST = lanAddress();

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  };
  const url = (req.url || '/').split('?')[0];

  if (url === '/servers') {
    const out = { __host: `http://${HOST}:${PORT}` };
    for (const d of ROOMS) {
      const r = rooms.get(d.id);
      out[d.id] = { players: r ? r.clients.size : 0, cap: CAP, diff: d.diff, name: d.name };
    }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
    res.end(JSON.stringify(out));
    return;
  }

  if (url === '/' || url === '/slime.html' || url === '/index.html') {
    fs.readFile(FILE, (err, buf) => {
      if (err) { res.writeHead(500); res.end('slime.html missing'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, cors));
      res.end(buf);
    });
    return;
  }

  res.writeHead(404, cors);
  res.end('not found');
});

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.url || '').split('?')[0] !== '/play') { sock.destroy(); return; }
  sock.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept(key) + '\r\n\r\n'
  );
  sock.setNoDelay(true);

  const c = {
    sock, buf: Buffer.alloc(0), frag: null,
    room: null, player: null, dirV: -1, told: false, killedBy: null,
    in: { x: 3200, y: 3200, s: 0, w: 0, r: 0, vw: 1200, vh: 800 }
  };

  sock.on('data', chunk => {
    c.buf = c.buf.length ? Buffer.concat([c.buf, chunk]) : chunk;
    try { drain(c, txt => handle(c, txt)); }
    catch (e) { sock.destroy(); }
  });
  const bye = () => {
    if (c.room && c.player) {
      const W = c.room.W;
      const i = W.players.indexOf(c.player);
      if (i >= 0) W.players.splice(i, 1);
      c.room.dirV++;
      c.room.clients.delete(c);
      log(`${c.player.name} left ${c.room.def.name} (${c.room.clients.size} left)`);
      if (!c.room.clients.size) log(`room "${c.room.def.name}" idle`);
    }
  };
  sock.on('close', bye);
  sock.on('error', bye);
});

function handle(c, txt) {
  let m;
  try { m = JSON.parse(txt); } catch (e) { return; }

  if (m.t === 'join') {
    const r = room(String(m.room || ''));
    if (!r) { send(c, { t: 'full' }); return; }
    if (r.clients.size >= CAP) { send(c, { t: 'full' }); return; }
    const S = r.S;
    const name = String(m.name || 'slime').slice(0, 14);
    const color = /^#[0-9a-f]{6}$/i.test(String(m.color)) ? m.color : '#6ee7a8';
    const p = S.makePlayer(name, color, false);
    r.W.players.push(p);
    S.spawnPlayer(p);
    c.room = r; c.player = p; c.dirV = -1; c.told = false;
    r.clients.add(c);
    r.dirV++;
    const cm = S.centroid(p);
    c.in.x = cm.x; c.in.y = cm.y;
    send(c, { t: 'joined', id: p.id, world: S.CFG.world, room: r.def.id,
              diff: r.def.diff, x: cm.x, y: cm.y });
    log(`${name} joined ${r.def.name} (${r.clients.size}/${CAP})`);
    return;
  }

  if (!c.room) return;

  if (m.t === 'in') {
    if (typeof m.x === 'number' && isFinite(m.x)) c.in.x = m.x;
    if (typeof m.y === 'number' && isFinite(m.y)) c.in.y = m.y;
    if (m.s) c.in.s = 1;
    if (m.w) c.in.w = 1;
    c.in.r = m.r ? 1 : 0;
    if (m.vw) c.in.vw = Math.min(Math.abs(m.vw), MAX_VIEW);
    if (m.vh) c.in.vh = Math.min(Math.abs(m.vh), MAX_VIEW);
    return;
  }

  if (m.t === 'respawn') {
    const p = c.player;
    if (p && !p.cells.length) {
      c.room.S.spawnPlayer(p);
      c.killedBy = null;
      c.told = false;
      const cm = c.room.S.centroid(p);
      c.in.x = cm.x; c.in.y = cm.y;
    }
    return;
  }

  if (m.t === 'ping') { send(c, { t: 'pong' }); return; }
  if (m.t === 'dir') { c.dirV = -1; return; }
}

/* ---------------------------------------------------------------- boot -- */
function log(msg) {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  console.log(`[${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}] ${msg}`);
}

server.listen(PORT, () => {
  console.log('');
  console.log('  SLIME.IO server');
  console.log('  ---------------');
  console.log(`  you:     http://localhost:${PORT}`);
  console.log(`  friends: http://${HOST}:${PORT}      (same wifi / network)`);
  console.log('');
  console.log('  servers: ' + ROOMS.map(r => `${r.name} (${r.diff})`).join(', '));
  console.log(`  up to ${CAP} players each. Rooms sleep until someone joins.`);
  console.log('  ctrl-c to stop.');
  console.log('');
});

process.on('SIGINT', () => { console.log('\nstopped.'); process.exit(0); });
