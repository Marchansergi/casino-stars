/* Casino Stars — fichas, pilas de fichas y vuelos de fichas */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const Chips = (CS.Chips = { SIZE: 54, STEP: 5, PER_COL: 10 });

  Chips.COLORS = {
    1: { c: '#eeeeea', e: '#2c5fd6', t: '#1b2a55' },
    2: { c: '#f1d64a', e: '#ffffff', t: '#5a4500' },
    5: { c: '#c8232c', e: '#ffffff', t: '#ffffff' },
    10: { c: '#1f5fcf', e: '#ffffff', t: '#ffffff' },
    25: { c: '#1d8b45', e: '#ffffff', t: '#ffffff' },
    50: { c: '#e2801c', e: '#ffffff', t: '#ffffff' },
    100: { c: '#1a1a1d', e: '#f3f3f3', t: '#ffffff' },
    500: { c: '#6d2aa3', e: '#f6e7ff', t: '#ffffff' },
    1000: { c: '#f2c230', e: '#6b3b00', t: '#4a2a00' },
    5000: { c: '#e5577d', e: '#2b0f19', t: '#2b0f19' },
  };

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
    return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
  }
  Chips.shade = shade;

  Chips.create = (value, style, parent) => {
    const col = Chips.COLORS[value] || Chips.COLORS[1];
    const el = U.el('div', 'chip chip-' + style, parent);
    el.style.setProperty('--c', col.c);
    el.style.setProperty('--e', col.e);
    el.style.setProperty('--t', col.t);
    el.style.setProperty('--d', shade(col.c, 0.55));
    el.innerHTML = `<span class="chip-face"><span class="chip-val">${U.short(value)}</span></span>`;
    el.dataset.v = value;
    return el;
  };

  // Desglose voraz de una cantidad en fichas (mayor abajo)
  Chips.breakdown = (amount, denoms) => {
    const ds = denoms.slice().sort((a, b) => b - a);
    const out = [];
    let rest = Math.round(amount * 100) / 100;
    for (const d of ds) {
      while (rest + 1e-9 >= d && out.length < 60) { out.push(d); rest = Math.round((rest - d) * 100) / 100; }
    }
    if (!out.length && amount > 0) out.push(ds[ds.length - 1]);
    return out;
  };

  class Stack {
    constructor(parent, x, y, style, denoms, opts = {}) {
      this.style = style;
      this.denoms = denoms;
      this.x = x; this.y = y;
      this.amount = 0;
      this.opts = opts;
      this.el = U.el('div', 'chip-stack' + (opts.cls ? ' ' + opts.cls : ''), parent);
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.label = opts.label !== false ? U.el('div', 'stack-label', this.el) : null;
      this.render();
    }
    // posición (centro) de la ficha i-ésima en coordenadas de escenario
    slot(i) {
      const col = Math.floor(i / Chips.PER_COL), row = i % Chips.PER_COL;
      const cols = Math.max(1, Math.ceil(this.count() / Chips.PER_COL));
      return { x: this.x + (col - (cols - 1) / 2) * (Chips.SIZE + 4), y: this.y - row * Chips.STEP };
    }
    count() { return this.values ? this.values.length : 0; }
    topPos() { return this.slot(Math.max(0, this.count() - 1)); }
    render() {
      this.values = Chips.breakdown(this.amount, this.denoms);
      if (this.amount <= 0) this.values = [];
      this.el.querySelectorAll('.chip').forEach((c) => c.remove());
      const cols = Math.max(1, Math.ceil(this.values.length / Chips.PER_COL));
      this.values.forEach((v, i) => {
        const c = Chips.create(v, this.style, this.el);
        const col = Math.floor(i / Chips.PER_COL), row = i % Chips.PER_COL;
        c.style.left = (col - (cols - 1) / 2) * (Chips.SIZE + 4) - Chips.SIZE / 2 + 'px';
        c.style.top = -row * Chips.STEP - Chips.SIZE / 2 + 'px';
        c.style.zIndex = i + 1;
      });
      if (this.label) {
        this.label.textContent = this.amount > 0 ? U.fmt(this.amount) : '';
        this.label.style.display = this.amount > 0 && this.opts.label !== false ? '' : 'none';
        this.label.style.top = 30 + 'px';
      }
    }
    set(amount) { this.amount = Math.max(0, Math.round(amount * 100) / 100); this.render(); }
    add(d) { this.set(this.amount + d); }
    move(x, y) { this.x = x; this.y = y; this.el.style.left = x + 'px'; this.el.style.top = y + 'px'; }
    destroy() { this.el.remove(); }
  }
  Chips.Stack = Stack;

  // Hace volar fichas de un punto a otro (posiciones de escenario)
  Chips.fly = async (parent, from, to, amount, style, denoms, opts = {}) => {
    if (amount <= 0) return;
    let vals = Chips.breakdown(amount, denoms);
    if (vals.length > 12) vals = vals.slice(0, 12);
    const dur = opts.dur || 520;
    const stagger = opts.stagger == null ? 55 : opts.stagger;
    const ps = vals.map((v, i) => {
      const c = Chips.create(v, style, parent);
      c.classList.add('flying-chip');
      const sx = from.x + U.rand(-6, 6), sy = from.y - i * 2;
      const ex = to.x + U.rand(-4, 4), ey = to.y - i * Chips.STEP;
      const h = Chips.SIZE / 2;
      c.style.left = '0px'; c.style.top = '0px';
      c.style.transform = `translate(${sx - h}px,${sy - h}px)`;
      const midY = Math.min(sy, ey) - (opts.arc == null ? 60 : opts.arc);
      return U.anim(c, [
        { transform: `translate(${sx - h}px,${sy - h}px) scale(1)` },
        { transform: `translate(${U.lerp(sx, ex, 0.5) - h}px,${midY - h}px) scale(1.12)`, offset: 0.5 },
        { transform: `translate(${ex - h}px,${ey - h}px) scale(1)` },
      ], { duration: dur, delay: i * stagger, easing: 'cubic-bezier(.3,.6,.3,1)' }).then(() => {
        CS.Audio.play('chip', 1);
        if (opts.keep) return c;
        c.remove();
      });
    });
    await Promise.all(ps);
  };
})();
