/* Casino Stars — utilidades base, ticker de animación y tweens */
(function () {
  'use strict';
  const CS = (window.CS = window.CS || {});
  const U = (CS.U = {});

  U.STAGE_W = 1600;
  U.STAGE_H = 900;
  U.speed = 1; // multiplicador de duración (menor = más rápido)

  U.el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };

  const SVGNS = 'http://www.w3.org/2000/svg';
  U.svg = (tag, attrs, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  // "epoch": al salir de una mesa se incrementa y todas las esperas pendientes
  // de la partida anterior se rechazan con ABORT, deteniendo su flujo limpiamente.
  U.epoch = 0;
  const ABORT = (U.ABORT = { abort: true, toString: () => 'ABORT' });
  window.addEventListener('unhandledrejection', (e) => { if (e.reason === ABORT) e.preventDefault(); });
  U.abortAll = () => { U.epoch++; };
  U.sleep = (ms) => {
    const ep = U.epoch;
    return new Promise((res, rej) => setTimeout(() => (ep === U.epoch ? res() : rej(ABORT)), ms * U.speed));
  };
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (a) => a[Math.floor(Math.random() * a.length)];
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;

  // RNG criptográfico para barajar (justo de verdad)
  U.rng = () => {
    if (window.crypto && crypto.getRandomValues) {
      const b = new Uint32Array(1);
      crypto.getRandomValues(b);
      return b[0] / 4294967296;
    }
    return Math.random();
  };
  U.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(U.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  U.fmt = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 });
  U.short = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'K';
    return String(n);
  };

  // Web Animations con duración escalada; deja el estilo final aplicado
  U.anim = (el, frames, opts = {}) => {
    const o = Object.assign({ fill: 'forwards', easing: 'cubic-bezier(.22,.7,.2,1)' }, opts);
    o.duration = Math.max(1, (opts.duration || 400) * U.speed);
    if (opts.delay) o.delay = opts.delay * U.speed;
    let a;
    const ep = U.epoch;
    try {
      a = el.animate(frames, o);
    } catch (e) {
      return Promise.resolve();
    }
    return a.finished
      .then(() => {
        try {
          a.commitStyles();
        } catch (e) { /* elemento no renderizado */ }
        a.cancel();
      }, () => {})
      .then(() => { if (ep !== U.epoch) throw ABORT; });
  };

  // ---------- Ticker + tweens numéricos (para los personajes SVG) ----------
  const EASE = {
    linear: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  U.EASE = EASE;

  const Ticker = (U.Ticker = { tweens: [], fns: new Set(), running: false, now: 0 });
  Ticker.loop = (t) => {
    Ticker.now = t;
    const tw = Ticker.tweens;
    for (let i = tw.length - 1; i >= 0; i--) {
      const w = tw[i];
      if (w.cancelled) { tw.splice(i, 1); w.done(); continue; }
      if (w.t0 == null) w.t0 = t;
      let p = (t - w.t0) / w.dur;
      if (p >= 1) p = 1;
      const e = w.ease(p);
      for (const k in w.to) w.obj[k] = w.from[k] + (w.to[k] - w.from[k]) * e;
      if (p >= 1) { tw.splice(i, 1); w.done(); }
    }
    Ticker.fns.forEach((f) => { try { f(t); } catch (e) { console.error(e); } });
    requestAnimationFrame(Ticker.loop);
  };
  Ticker.start = () => {
    if (Ticker.running) return;
    Ticker.running = true;
    requestAnimationFrame(Ticker.loop);
  };

  U.tween = (obj, to, dur = 300, ease = 'inOut') =>
    new Promise((res, rej) => {
      const ep = U.epoch;
      const done = () => (ep === U.epoch ? res() : rej(ABORT));
      // si ya hay un tween sobre las mismas claves del mismo objeto, se cancela
      for (const w of Ticker.tweens) {
        if (w.obj === obj) for (const k in to) if (k in w.to) { delete w.to[k]; }
      }
      const from = {};
      for (const k in to) from[k] = obj[k];
      Ticker.tweens.push({ obj, from, to, t0: null, dur: Math.max(1, dur * U.speed), ease: EASE[ease] || EASE.inOut, done });
    });
  U.cancelTweens = (obj) => { for (const w of Ticker.tweens) if (w.obj === obj) w.cancelled = true; };

  // Cola simple para no solapar animaciones de un mismo actor
  U.mutex = () => {
    let p = Promise.resolve();
    return (fn) => {
      const r = p.then(fn, fn);
      p = r.catch(() => {});
      return r;
    };
  };

  U.once = (el, ev) => new Promise((r) => el.addEventListener(ev, r, { once: true }));
})();
