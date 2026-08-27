/* slime.env.js — a stub DOM just real enough to boot slime.html in Node.
   Shared by slime.test.js and slime.balance.js. */

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "slime.html");

/* ---------------------------------------------------------------- stubs -- */
function stubCtx() {
  const noop = () => {};
  return {
    canvas: null,
    setTransform: noop, save: noop, restore: noop, clip: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    quadraticCurveTo: noop, arc: noop, ellipse: noop, rect: noop,
    fill: noop, stroke: noop, fillRect: noop, strokeRect: noop, clearRect: noop,
    fillText: noop, strokeText: noop, translate: noop, scale: noop, rotate: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 10 }),
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "",
    textAlign: "", textBaseline: "", globalAlpha: 1
  };
}

function stubEl(id) {
  const el = {
    id,
    value: "",
    textContent: "",
    _html: "",
    // real innerHTML = "" wipes the children; a plain field silently keeps them
    // and every rebuilt list looks like it doubled
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (!v) this.children.length = 0; },
    width: 150, height: 150,
    style: {},
    dataset: {},
    children: [],
    className: "",
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
    },
    handlers: {},
    addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
    removeEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
    getContext: () => stubCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 800 }),
    focus() {}, blur() {}, click() { (this.handlers.click || []).forEach(f => f({})); }
  };
  return el;
}

function makeEnv() {
  const els = {};
  const get = id => (els[id] = els[id] || stubEl(id));

  const document = {
    getElementById: get,
    createElement: tag => stubEl("<" + tag + ">"),
    addEventListener() {},
    body: stubEl("body"),
    documentElement: stubEl("html")
  };

  const rafQueue = [];
  const window = {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    AudioContext: null,
    webkitAudioContext: null,
    document
  };
  const requestAnimationFrame = fn => { rafQueue.push(fn); return rafQueue.length; };
  const cancelAnimationFrame = () => {};

  const html = fs.readFileSync(FILE, "utf8");
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no <script> block found in slime.html");

  // Browser globals the multiplayer client reaches for. setInterval is a no-op
  // on purpose: the real one keeps the menu's server poll alive and would stop
  // the node process from ever exiting. fetch is offline so tests stay hermetic.
  const location = { protocol: "file:", origin: "null", host: "", href: "file:///slime.html" };
  const timers = [];
  const setIntervalStub = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
  const clearIntervalStub = () => {};
  const fetchStub = () => Promise.reject(new Error("offline in tests"));
  const sockets = [];
  function WebSocketStub(url) {
    this.url = url; this.readyState = 0; this.sent = [];
    this.addEventListener = () => {};
    this.send = d => this.sent.push(d);
    this.close = () => { this.readyState = 3; };
    sockets.push(this);
  }

  const fn = new Function(
    "window", "document", "requestAnimationFrame", "cancelAnimationFrame",
    "navigator", "self", "globalThis_",
    "location", "setInterval", "clearInterval", "fetch", "WebSocket",
    m[1]
  );
  fn(window, document, requestAnimationFrame, cancelAnimationFrame,
     { userAgent: "node" }, window, window,
     location, setIntervalStub, clearIntervalStub, fetchStub, WebSocketStub);

  if (!window.__SLIME) throw new Error("__SLIME was never exported");
  return { API: window.__SLIME, els, window, document, rafQueue, timers, sockets, location };
}

module.exports = { makeEnv, FILE };
