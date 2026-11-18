/* Casino Stars — personajes SVG con rig animado (jugadores y crupier)
   Animaciones idle: tamborilear los dedos, crujirse los nudillos, barajar fichas,
   mirar alrededor, respirar. El crupier reparte y baraja con sus manos. */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const Rig = (CS.Rig = {});

  // ---------------- Personajes por local ----------------
  Rig.NPCS = {
    easy: [
      { name: 'Paco', skin: '#d39a6a', hair: '#2a1c12', hairStyle: 'cap', hat: '#355c2b', shirt: '#8a2f24', pattern: 'flannel', beard: 'mustache', acc: 'toothpick' },
      { name: 'Loli', skin: '#efc19c', hair: '#a8401e', hairStyle: 'bun', shirt: '#2e4a7a', acc: 'earrings', lips: '#b23a48' },
      { name: 'Manolo', skin: '#c58a5c', hair: '#3a3a3a', hairStyle: 'bald', shirt: '#cfc9b8', pattern: 'tank', beard: 'full', acc: 'cigar' },
      { name: 'El Rata', skin: '#e2b48c', hair: '#151515', hairStyle: 'slick', shirt: '#3b3b3b', pattern: 'leather', beard: 'stubble', acc: 'none' },
    ],
    normal: [
      { name: 'Sofía', skin: '#f1c9a5', hair: '#2b1a12', hairStyle: 'long', shirt: '#5a2340', acc: 'earrings', lips: '#a0293e' },
      { name: 'Marcos', skin: '#d8a27a', hair: '#3b2416', hairStyle: 'short', shirt: '#2c3e57', pattern: 'blazer', acc: 'glasses', beard: 'stubble' },
      { name: 'Irene', skin: '#9c6b48', hair: '#120c08', hairStyle: 'ponytail', shirt: '#1f5e5b', acc: 'earrings', lips: '#7a2230' },
      { name: 'Andrés', skin: '#e8bb94', hair: '#7a5a3a', hairStyle: 'short', shirt: '#6b4a2e', pattern: 'blazer', beard: 'full', acc: 'none' },
    ],
    hard: [
      { name: 'Mr. Black', skin: '#c99a74', hair: '#0e0e0e', hairStyle: 'slick', shirt: '#121214', pattern: 'suit', tie: '#8c1022', acc: 'sunglasses' },
      { name: 'Tex', skin: '#e0a882', hair: '#c9c2b5', hairStyle: 'cowboy', hat: '#6b4a2b', shirt: '#e9e2d0', pattern: 'western', beard: 'mustache', acc: 'cigar' },
      { name: 'Victoria', skin: '#f3cfae', hair: '#e2c06a', hairStyle: 'long', shirt: '#9e0f2a', pattern: 'dress', acc: 'necklace', lips: '#b0102c' },
      { name: 'Kenji', skin: '#e9c49c', hair: '#111', hairStyle: 'short', shirt: '#3a3f47', pattern: 'suit', tie: '#1d3f8f', acc: 'glasses' },
    ],
  };
  Rig.DEALERS = {
    easy: { name: 'Rufo', skin: '#cf9466', hair: '#2a1b12', hairStyle: 'short', beard: 'full', outfit: 'bartender', shirt: '#26292c' },
    normal: { name: 'Elena', skin: '#efc6a1', hair: '#3b2014', hairStyle: 'ponytail', outfit: 'vest', shirt: '#f4f1ea', vest: '#2b2b33', lips: '#a3303e' },
    hard: { name: 'M. Duval', skin: '#d8a982', hair: '#151515', hairStyle: 'slick', outfit: 'tux', shirt: '#f7f7f2', jacket: '#0f0f12' },
  };

  const shade = (c, f) => CS.Chips.shade(c, f);

  // ---------------- Piezas de dibujo ----------------
  function handSVG(skin, thumb = 1) {
    const sh = shade(skin, 0.72);
    return `
      <g class="fingers">
        ${[0, 1, 2, 3].map((i) => `<rect class="finger f${i}" x="9" y="${-11 + i * 5.6}" width="${i === 3 ? 14 : 18}" height="6" rx="3" fill="${skin}" stroke="${sh}" stroke-width=".7"/>`).join('')}
      </g>
      <ellipse class="palm" cx="2" cy="0" rx="14" ry="12.5" fill="${skin}" stroke="${sh}" stroke-width=".8"/>
      <ellipse class="thumb" cx="2" cy="${-13 * thumb}" rx="9" ry="4.6" fill="${skin}" stroke="${sh}" stroke-width=".7" transform="rotate(${-28 * thumb} 2 ${-13 * thumb})"/>
      <path d="M8 -7 L10 -7 M8 -1 L10 -1 M8 5 L10 5" stroke="${sh}" stroke-width="1" opacity=".6"/>`;
  }

  function hairBack(o) {
    if (o.hairStyle === 'long') return `<path d="M-46 -110 Q-60 -40 -52 10 L40 10 Q52 -40 44 -100 Z" fill="${o.hair}"/>`;
    if (o.hairStyle === 'ponytail') return `<path d="M-40 -100 Q-78 -70 -66 -10 Q-60 6 -50 -6 Q-58 -50 -30 -90Z" fill="${o.hair}"/>`;
    if (o.hairStyle === 'bun') return `<circle cx="-30" cy="-128" r="18" fill="${o.hair}"/>`;
    return '';
  }
  function hairFront(o) {
    const h = o.hair;
    switch (o.hairStyle) {
      case 'short': return `<path d="M-44 -86 Q-50 -140 2 -142 Q48 -140 50 -98 Q36 -122 4 -120 Q-24 -118 -32 -96 L-36 -70 Q-46 -74 -44 -86Z" fill="${h}"/>`;
      case 'slick': return `<path d="M-44 -82 Q-48 -138 6 -140 Q46 -136 50 -100 Q30 -126 -4 -122 Q-30 -116 -36 -90 L-38 -66 Q-46 -70 -44 -82Z" fill="${h}"/><path d="M-20 -128 Q10 -136 40 -118" stroke="#fff" stroke-opacity=".18" stroke-width="3" fill="none"/>`;
      case 'long': return `<path d="M-46 -80 Q-52 -142 4 -144 Q52 -140 50 -92 Q40 -126 10 -124 Q-10 -110 -30 -112 Q-36 -96 -38 -60 Q-48 -64 -46 -80Z" fill="${h}"/>`;
      case 'ponytail': return `<path d="M-44 -84 Q-50 -140 4 -142 Q50 -138 50 -98 Q36 -122 4 -122 Q-24 -120 -34 -96 L-38 -70 Q-46 -74 -44 -84Z" fill="${h}"/><circle cx="-38" cy="-98" r="5" fill="#c33"/>`;
      case 'bun': return `<path d="M-44 -84 Q-50 -140 4 -142 Q50 -138 50 -98 Q36 -122 4 -122 Q-24 -120 -34 -96 L-38 -70 Q-46 -74 -44 -84Z" fill="${h}"/>`;
      case 'bald': return `<path d="M-44 -70 Q-48 -84 -40 -96 L-36 -70Z" fill="${h}" opacity=".7"/><ellipse cx="10" cy="-126" rx="16" ry="7" fill="#fff" opacity=".18"/>`;
      case 'cap': return `<path d="M-46 -92 Q-46 -146 4 -146 Q48 -146 50 -100 Z" fill="${o.hat}"/><path d="M30 -104 Q66 -104 84 -96 Q60 -88 34 -94Z" fill="${shade(o.hat, 0.7)}"/><path d="M-46 -92 L50 -100" stroke="${shade(o.hat, 0.6)}" stroke-width="3"/><circle cx="2" cy="-145" r="4" fill="${shade(o.hat, 0.6)}"/><text x="-2" y="-112" font-size="16" font-family="Arial Black" fill="#f2e6c8" text-anchor="middle">G</text>`;
      case 'cowboy': return `<ellipse cx="4" cy="-104" rx="92" ry="16" fill="${shade(o.hat, 0.8)}"/><path d="M-40 -104 Q-44 -164 0 -164 Q8 -150 16 -164 Q52 -164 48 -104 Z" fill="${o.hat}"/><rect x="-42" y="-116" width="90" height="10" fill="#2a1a0f"/><path d="M-30 -96 Q-40 -88 -44 -78" stroke="${o.hair}" stroke-width="8" fill="none"/>`;
    }
    return '';
  }
  function beardSVG(o, front) {
    const b = shade(o.hair === '#c9c2b5' ? '#d8d2c6' : o.hair, 1);
    if (o.beard === 'mustache') return front ? `<path d="M-22 -48 Q-12 -56 0 -50 Q12 -56 22 -48 Q12 -44 0 -46 Q-12 -44 -22 -48Z" fill="${b}"/>` : `<path d="M20 -52 Q34 -58 48 -52 Q38 -46 22 -48Z" fill="${b}"/>`;
    if (o.beard === 'full') return front ? `<path d="M-40 -70 Q-40 -18 0 -14 Q40 -18 40 -70 Q34 -42 18 -40 Q0 -50 -18 -40 Q-34 -42 -40 -70Z" fill="${b}"/>` : `<path d="M-34 -74 Q-30 -20 20 -24 Q44 -28 50 -60 Q40 -42 22 -46 Q4 -42 -12 -50 Q-26 -58 -34 -74Z" fill="${b}"/>`;
    if (o.beard === 'stubble') return front ? `<path d="M-38 -66 Q-36 -18 0 -16 Q36 -18 38 -66 Q30 -40 0 -38 Q-30 -40 -38 -66Z" fill="${b}" opacity=".25"/>` : `<path d="M-30 -74 Q-26 -24 20 -26 Q44 -30 50 -58 Q36 -40 0 -42 Q-20 -50 -30 -74Z" fill="${b}" opacity=".25"/>`;
    return '';
  }

  // ---------------- Clase Person ----------------
  class Person {
    constructor(o) {
      this.o = o;
      this.state = 'idle';
      this.busy = false;
      this.alive = true;
      this.t0 = Math.random() * 10;
      this.head = { rot: 0, dx: 0 };
      this.breath = 0;
    }
    armPath(sx, sy, hx, hy, bend) {
      const mx = (sx + hx) / 2, my = (sy + hy) / 2;
      const dx = hx - sx, dy = hy - sy, len = Math.hypot(dx, dy) || 1;
      // codo: desplazamiento perpendicular, más pronunciado cuanto más cerca está la mano
      const k = Math.max(0, 160 - len) * 0.35 + 18;
      const nx = -dy / len * bend * k, ny = dx / len * bend * k;
      return `M${sx} ${sy} Q${mx + nx} ${my + ny} ${hx} ${hy}`;
    }
    setHandTransform(g, h) {
      g.setAttribute('transform', `translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)}) scale(${(h.s || 1).toFixed(3)})`);
    }
    moveHand(which, to, dur = 300, ease = 'inOut') { return U.tween(this.hands[which], to, dur, ease); }
    restHands(dur = 400) {
      return Promise.all(['L', 'R'].map((k) => U.tween(this.hands[k], Object.assign({ s: 1 }, this.rest[k]), dur, 'inOut')));
    }
    destroy() {
      this.alive = false;
      U.Ticker.fns.delete(this._tick);
      if (this.timer) clearTimeout(this.timer);
      this.groups.forEach((g) => g.remove());
    }
  }

  // ======================= JUGADOR (vista lateral 3/4) =======================
  class NPC extends Person {
    constructor(over, o, place) {
      super(o);
      this.place = place; // {x,y,scale,flip}
      const tr = `translate(${place.x} ${place.y}) scale(${place.flip ? -place.scale : place.scale} ${place.scale})`;
      this.root = U.svg('g', { class: 'npc', transform: tr }, over);
      this.groups = [this.root];
      this.build();
      this.rest = { L: { x: 170, y: 120, rot: 8 }, R: { x: 186, y: 52, rot: -6 } };
      this.hands = { L: Object.assign({ s: 1 }, this.rest.L), R: Object.assign({ s: 1 }, this.rest.R) };
      this.chipState = [0, 1, 2, 3, 4, 5].map((i) => ({ x: i < 3 ? 222 : 252, y: 150 - (i % 3) * 6 }));
      this._tick = (t) => this.update(t);
      U.Ticker.fns.add(this._tick);
      this.scheduleIdle(U.rand(800, 3000));
    }
    build() {
      const o = this.o, g = this.root;
      const skin = o.skin, sk2 = shade(skin, 0.8);
      const shirt = o.shirt, sh2 = shade(shirt, 0.7);
      const defsId = 'p' + Math.random().toString(36).slice(2, 8);
      let pattern = '';
      if (o.pattern === 'flannel') pattern = `<defs><pattern id="${defsId}" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="${shirt}"/><rect width="26" height="8" y="9" fill="#1a1a1a" opacity=".35"/><rect width="8" height="26" x="9" fill="#1a1a1a" opacity=".35"/><rect width="26" height="2" y="12" fill="#e8d6a0" opacity=".4"/><rect width="2" height="26" x="12" fill="#e8d6a0" opacity=".4"/></pattern></defs>`;
      const fill = o.pattern === 'flannel' ? `url(#${defsId})` : shirt;
      this.sleeve = o.pattern === 'tank' || o.pattern === 'dress' ? skin : o.pattern === 'suit' || o.pattern === 'blazer' ? shirt : shirt;

      // brazo lejano (detrás del torso)
      this.armR = U.svg('path', { fill: 'none', stroke: shade(this.sleeve, 0.82), 'stroke-width': 26, 'stroke-linecap': 'round' }, g);
      this.handR = U.svg('g', { class: 'hand' }, g);
      this.handR.innerHTML = handSVG(sk2, -1);

      const body = U.svg('g', { class: 'body breathe' }, g);
      body.innerHTML = `${pattern}
        ${hairBack(o)}
        <path d="M-15 -42 L15 -42 L19 -6 L-19 -6Z" fill="${sk2}"/>
        <path class="torso" d="M-82 22 C-92 -4 -62 -14 -28 -17 L42 -17 C76 -14 96 0 102 26 L118 430 L122 1000 L-114 1000 L-110 430 Z" fill="${fill}"/>
        <path d="M-82 22 C-92 -4 -62 -14 -28 -17 L-10 -17 L-30 430 L-34 1000 L-114 1000 L-110 430Z" fill="#000" opacity=".22"/>
        ${this.outfitSide(o, skin)}
      `;
      const head = U.svg('g', { class: 'head' }, g);
      this.headG = head;
      head.innerHTML = `
        <ellipse cx="-30" cy="-80" rx="9" ry="14" fill="${sk2}"/>
        <ellipse cx="4" cy="-84" rx="44" ry="54" fill="${skin}"/>
        <path d="M-40 -84 Q-40 -30 4 -30 Q-26 -40 -40 -84Z" fill="#000" opacity=".08"/>
        <path d="M44 -92 Q56 -76 52 -66 Q48 -62 42 -64" fill="${skin}" stroke="${sk2}" stroke-width="1.4"/>
        <g class="eyes">
          <ellipse cx="18" cy="-90" rx="5" ry="${o.lips ? 5 : 4.4}" fill="#fff"/><circle class="pupil" cx="20" cy="-90" r="2.8" fill="#1a120c"/>
          <ellipse cx="40" cy="-89" rx="3.4" ry="4" fill="#fff"/><circle class="pupil" cx="41" cy="-89" r="2.3" fill="#1a120c"/>
          ${o.lips ? '<path d="M12 -97 L26 -96 M35 -95 L44 -94" stroke="#1a120c" stroke-width="1.6"/>' : ''}
        </g>
        <path d="M10 -101 Q19 -106 27 -101 M34 -100 Q40 -103 45 -99" stroke="${shade(o.hair, 0.9)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="mouth" d="M20 -56 Q30 -52 40 -57" stroke="${o.lips || shade(skin, 0.55)}" stroke-width="${o.lips ? 3.4 : 2.4}" fill="none" stroke-linecap="round"/>
        ${beardSVG(o, false)}
        ${hairFront(o)}
        ${this.accSide(o)}
      `;
      // brazo cercano y manos
      this.armL = U.svg('path', { fill: 'none', stroke: this.sleeve, 'stroke-width': 28, 'stroke-linecap': 'round' }, g);
      this.cuffL = U.svg('path', { fill: 'none', stroke: o.pattern === 'suit' ? '#f2f2f2' : 'none', 'stroke-width': 28, 'stroke-linecap': 'butt', pathLength: 100, 'stroke-dasharray': '6 100', 'stroke-dashoffset': -88 }, g);
      // fichas propias para barajar
      this.chipsG = U.svg('g', { class: 'npc-chips' }, g);
      const chipCols = ['#c8232c', '#1d8b45', '#1a1a1d', '#c8232c', '#1d8b45', '#1a1a1d'];
      this.chipEls = chipCols.map((c) => {
        const cg = U.svg('g', {}, this.chipsG);
        cg.innerHTML = `<rect x="-14" y="0" width="28" height="6" fill="${shade(c, 0.6)}"/><rect x="-14" y="0" width="28" height="6" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="3 5" opacity=".6"/><ellipse cx="0" cy="0" rx="14" ry="5.5" fill="${c}"/><ellipse cx="0" cy="0" rx="8" ry="3" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`;
        return cg;
      });
      this.handL = U.svg('g', { class: 'hand' }, g);
      this.handL.innerHTML = handSVG(skin, 1);
      // reordenar: fichas por debajo de la mano cercana
    }
    outfitSide(o, skin) {
      switch (o.pattern) {
        case 'suit': return `<path d="M-6 -16 L12 30 L30 -16 Z" fill="#f4f4f0"/><path d="M8 -6 L16 -6 L20 60 L12 70 L4 60Z" fill="${o.tie}"/><path d="M-28 -17 L6 60 L-6 -17Z M30 -17 L14 60 L44 -14Z" fill="${shade(o.shirt, 1.6)}" opacity=".5"/><rect x="60" y="40" width="22" height="5" fill="#fff" opacity=".7"/>`;
        case 'blazer': return `<path d="M-4 -16 L12 26 L28 -16 Z" fill="#e9e4da"/><path d="M-28 -17 L8 70 L-4 -17Z M32 -17 L14 70 L48 -14Z" fill="#000" opacity=".25"/>`;
        case 'dress': return `<path d="M-50 -17 L60 -17 Q40 30 6 34 Q-30 30 -50 -17Z" fill="${skin}"/><path d="M-60 26 Q6 50 74 26" stroke="${shade(o.shirt, 0.7)}" stroke-width="4" fill="none"/>`;
        case 'tank': return `<path d="M-62 -16 L-30 -16 L-36 40 L-70 40Z M30 -16 L66 -16 L80 40 L44 40Z" fill="${skin}"/><path d="M-30 -16 Q6 20 30 -16" fill="${skin}"/>`;
        case 'leather': return `<path d="M-6 -16 L10 40 L26 -16Z" fill="#7a2a2a"/><path d="M-30 -17 L6 90 L-8 -17Z M30 -17 L12 90 L46 -12Z" fill="#000" opacity=".35"/><circle cx="20" cy="120" r="3" fill="#bbb"/>`;
        case 'western': return `<path d="M-60 6 Q6 40 76 6 L80 30 Q6 64 -66 30Z" fill="#7a4a2a" opacity=".6"/><path d="M2 -14 L10 20 L18 -14" fill="none" stroke="#222" stroke-width="5"/><circle cx="10" cy="22" r="6" fill="#c9a24a"/>`;
        default: return `<path d="M-14 -17 Q6 6 26 -17" fill="${shade(skin, 0.85)}"/>`;
      }
    }
    accSide(o) {
      switch (o.acc) {
        case 'sunglasses': return `<path d="M6 -96 L50 -95 L48 -82 Q40 -76 32 -84 L28 -92 L24 -84 Q16 -76 8 -82 Z" fill="#0b0b0d"/><path d="M-30 -92 L8 -94" stroke="#0b0b0d" stroke-width="3"/><path d="M14 -92 L20 -90" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
        case 'glasses': return `<circle cx="19" cy="-90" r="9" fill="none" stroke="#222" stroke-width="2.2"/><circle cx="41" cy="-89" r="7" fill="none" stroke="#222" stroke-width="2.2"/><path d="M28 -90 L34 -90 M10 -92 L-30 -90" stroke="#222" stroke-width="2"/>`;
        case 'earrings': return `<circle cx="-30" cy="-64" r="4" fill="#e7c25a"/>`;
        case 'necklace': return `<circle cx="-30" cy="-64" r="4" fill="#f4f4f4"/><path d="M-30 -14 Q6 26 36 -14" stroke="#f4f0e0" stroke-width="3" fill="none" stroke-dasharray="2 3"/><circle cx="6" cy="10" r="5" fill="#9ad4ff"/>`;
        case 'cigar': return `<rect x="38" y="-56" width="34" height="7" rx="3" fill="#6b3f1f" transform="rotate(10 38 -56)"/><circle cx="72" cy="-46" r="3.5" fill="#ff7a2a" class="ember"/><path class="cig-smoke" d="M72 -50 q-8 -18 4 -34 q10 -16 -2 -34" stroke="#ddd" stroke-width="5" fill="none" opacity=".25"/>`;
        case 'toothpick': return `<path d="M36 -54 L62 -60" stroke="#e6cf9a" stroke-width="2.4" stroke-linecap="round"/>`;
      }
      return '';
    }
    update(t) {
      if (!this.alive) return;
      const sL = { x: -58, y: 10 }, sR = { x: 66, y: 2 };
      const L = this.hands.L, R = this.hands.R;
      this.armR.setAttribute('d', this.armPath(sR.x, sR.y, R.x - 4, R.y, 1));
      const dl = this.armPath(sL.x, sL.y, L.x - 4, L.y, 1);
      this.armL.setAttribute('d', dl);
      this.cuffL.setAttribute('d', dl);
      this.setHandTransform(this.handR, R);
      this.setHandTransform(this.handL, L);
      this.headG.setAttribute('transform', `translate(${this.head.dx.toFixed(2)} 0) rotate(${this.head.rot.toFixed(2)} 4 -40)`);
      this.chipEls.forEach((c, i) => {
        const p = this.chipState[i];
        c.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
    }
    chipOrder() {
      // ordenar fichas por y descendente para pintar de abajo a arriba
      const idx = this.chipEls.map((_, i) => i).sort((a, b) => this.chipState[b].y - this.chipState[a].y);
      idx.forEach((i) => this.chipsG.appendChild(this.chipEls[i]));
    }
    scheduleIdle(ms) {
      if (!this.alive) return;
      this.timer = setTimeout(() => this.idle(), ms);
    }
    async idle() {
      if (!this.alive) return;
      if (!this.busy) {
        const r = Math.random();
        try {
          if (r < 0.3) await this.tapFingers();
          else if (r < 0.52) await this.chipShuffle();
          else if (r < 0.68) await this.crackKnuckles();
          else if (r < 0.86) await this.lookAround();
          else await this.drum();
        } catch (e) { if (e !== U.ABORT) console.error(e); }
      }
      this.scheduleIdle(U.rand(2500, 6500));
    }
    async tapFingers() {
      this.handR.classList.add('tapping');
      for (let i = 0; i < 6; i++) { await U.sleep(170); if (i % 2 === 0) CS.Audio.play('tap'); }
      this.handR.classList.remove('tapping');
    }
    async drum() {
      // golpecitos con los nudillos en la mesa
      for (let i = 0; i < 2; i++) {
        await this.moveHand('L', { y: this.rest.L.y - 6, s: 1.06 }, 120, 'out');
        await this.moveHand('L', { y: this.rest.L.y, s: 1 }, 90, 'in');
        CS.Audio.play('knock');
        await U.sleep(220);
      }
    }
    async crackKnuckles() {
      this.busy = true;
      await Promise.all([
        this.moveHand('L', { x: 150, y: 92, rot: -70 }, 420),
        this.moveHand('R', { x: 160, y: 72, rot: 70 }, 420),
      ]);
      this.handL.classList.add('interlock'); this.handR.classList.add('interlock');
      for (let i = 0; i < 2; i++) {
        await Promise.all([this.moveHand('L', { x: 176, rot: -88 }, 160, 'out'), this.moveHand('R', { x: 184, rot: 88 }, 160, 'out')]);
        CS.Audio.play('crack');
        await U.sleep(140);
        await Promise.all([this.moveHand('L', { x: 152, rot: -70 }, 200), this.moveHand('R', { x: 162, rot: 70 }, 200)]);
      }
      this.handL.classList.remove('interlock'); this.handR.classList.remove('interlock');
      await this.restHands(380);
      this.busy = false;
    }
    async chipShuffle() {
      this.busy = true;
      const A = 222, B = 252, base = 150;
      await this.moveHand('L', { x: 228, y: 136, rot: -4 }, 380);
      for (let rep = 0; rep < 2; rep++) {
        // juntar y entrelazar
        const order = [0, 3, 1, 4, 2, 5];
        await Promise.all(this.chipState.map((p, i) => U.tween(p, { x: 237, y: base - order.indexOf(i) * 6 }, 260, 'inOut')));
        this.chipOrder();
        CS.Audio.play('chip', 4);
        await U.tween(this.hands.L, { x: 232, y: 128 }, 120);
        // separar: pares a un lado, impares a otro
        await Promise.all(this.chipState.map((p, i) => {
          const pos = order.indexOf(i);
          return U.tween(p, { x: pos % 2 ? B : A, y: base - Math.floor(pos / 2) * 6 }, 240, 'inOut');
        }));
        // reasignar índices al nuevo orden
        const ns = [];
        order.forEach((ci, pos) => { ns[pos % 2 ? 3 + Math.floor(pos / 2) : Math.floor(pos / 2)] = this.chipState[ci]; });
        const nEl = [];
        order.forEach((ci, pos) => { nEl[pos % 2 ? 3 + Math.floor(pos / 2) : Math.floor(pos / 2)] = this.chipEls[ci]; });
        this.chipState = ns; this.chipEls = nEl;
        this.chipOrder();
        await U.tween(this.hands.L, { x: 228, y: 136 }, 120);
        await U.sleep(80);
      }
      await this.restHands(400);
      this.busy = false;
    }
    async lookAround() {
      const d = U.pick([-1, 1]);
      await U.tween(this.head, { rot: d * 6, dx: d * 3 }, 500, 'sine');
      await U.sleep(U.rand(400, 1200));
      await U.tween(this.head, { rot: 0, dx: 0 }, 500, 'sine');
    }
    // gesto rápido para acciones de juego (apostar, pedir carta...)
    async gesture(kind) {
      this.busy = true;
      try {
        if (kind === 'tap') { // pedir carta: golpe en la mesa
          await this.moveHand('L', { x: 210, y: 112, s: 1.05 }, 160, 'out');
          CS.Audio.play('knock');
          await this.moveHand('L', { x: 210, y: 120, s: 1 }, 100, 'in');
          await this.moveHand('L', { x: 212, y: 112 }, 100);
          await this.moveHand('L', { x: 212, y: 120 }, 100);
        } else if (kind === 'wave') { // plantarse: mano horizontal
          await this.moveHand('L', { x: 220, y: 110, rot: -20 }, 180);
          await this.moveHand('L', { x: 200, y: 110, rot: 10 }, 180);
          await this.moveHand('L', { x: 220, y: 110, rot: -20 }, 180);
        } else if (kind === 'push') { // empujar fichas
          await this.moveHand('L', { x: 250, y: 120, rot: 0 }, 300);
        } else if (kind === 'fold') {
          await this.moveHand('R', { x: 236, y: 40, rot: -20 }, 260);
        }
        await this.restHands(320);
      } finally { this.busy = false; }
    }
  }
  Rig.NPC = NPC;

  // ======================= CRUPIER (vista frontal) =======================
  class Dealer extends Person {
    constructor(under, over, o, cx, tableTop) {
      super(o);
      this.cx = cx; this.top = tableTop;
      this.sy = tableTop - 68;
      this.bodyG = U.svg('g', { class: 'dealer-body' }, under);
      this.armsG = U.svg('g', { class: 'dealer-arms' }, over);
      this.groups = [this.bodyG, this.armsG];
      this.build();
      const hy = tableTop + 44;
      this.rest = { L: { x: cx - 175, y: hy, rot: 100 }, R: { x: cx + 175, y: hy, rot: 80 } };
      this.hands = { L: Object.assign({ s: 1 }, this.rest.L), R: Object.assign({ s: 1 }, this.rest.R) };
      this._tick = (t) => this.update(t);
      U.Ticker.fns.add(this._tick);
      this.scheduleIdle(3000);
    }
    build() {
      const o = this.o, cx = this.cx, sy = this.sy;
      const skin = o.skin, sk2 = shade(skin, 0.8);
      let torsoFill = o.shirt, details = '';
      if (o.outfit === 'tux') {
        torsoFill = o.jacket;
        details = `<path d="M${cx - 34} ${sy - 26} L${cx} ${sy + 70} L${cx + 34} ${sy - 26} Z" fill="${o.shirt}"/>
          <path d="M${cx - 34} ${sy - 26} L${cx - 4} ${sy + 66} L${cx - 52} ${sy - 18} Z M${cx + 34} ${sy - 26} L${cx + 4} ${sy + 66} L${cx + 52} ${sy - 18} Z" fill="#26262c"/>
          <path d="M${cx - 18} ${sy - 18} L${cx} ${sy - 10} L${cx + 18} ${sy - 18} L${cx + 18} ${sy - 2} L${cx} ${sy - 10} L${cx - 18} ${sy - 2} Z" fill="#0a0a0a"/>
          <circle cx="${cx}" cy="${sy + 22}" r="2.4" fill="#222"/><circle cx="${cx}" cy="${sy + 42}" r="2.4" fill="#222"/>
          <rect x="${cx + 52}" y="${sy + 12}" width="40" height="13" rx="2" fill="#d9b45a"/><text x="${cx + 72}" y="${sy + 22}" font-size="8" text-anchor="middle" font-family="Arial" font-weight="700" fill="#2a1a00">${o.name.toUpperCase()}</text>
          <path d="M${cx - 92} ${sy + 4} L${cx - 70} ${sy - 4}" stroke="#d9b45a" stroke-width="2"/>`;
      } else if (o.outfit === 'vest') {
        details = `<path d="M${cx - 80} ${sy - 10} L${cx - 26} ${sy - 26} L${cx} ${sy + 56} L${cx + 26} ${sy - 26} L${cx + 80} ${sy - 10} L${cx + 86} ${sy + 120} L${cx - 86} ${sy + 120} Z" fill="${o.vest}"/>
          <path d="M${cx - 16} ${sy - 26} L${cx} ${sy - 4} L${cx + 16} ${sy - 26}" fill="none" stroke="#ddd" stroke-width="3"/>
          <path d="M${cx - 6} ${sy - 12} L${cx + 6} ${sy - 12} L${cx + 8} ${sy + 50} L${cx} ${sy + 58} L${cx - 8} ${sy + 50}Z" fill="#7a1022"/>
          ${[20, 40, 60].map((d) => `<circle cx="${cx + 12}" cy="${sy + d}" r="2.2" fill="#b8a27a"/>`).join('')}
          <rect x="${cx - 76}" y="${sy + 14}" width="34" height="11" rx="2" fill="#eee"/><text x="${cx - 59}" y="${sy + 22.5}" font-size="7" text-anchor="middle" font-family="Arial" font-weight="700" fill="#333">${o.name.toUpperCase()}</text>`;
      } else {
        details = `<path d="M${cx - 30} ${sy - 26} Q${cx} ${sy + 4} ${cx + 30} ${sy - 26}" fill="${sk2}"/>
          <path d="M${cx + 30} ${sy - 30} Q${cx + 80} ${sy - 30} ${cx + 96} ${sy + 4} L${cx + 84} ${sy + 50} Q${cx + 70} ${sy + 4} ${cx + 30} ${sy - 10}Z" fill="#e8e2d2"/>
          <path d="M${cx + 40} ${sy - 22} L${cx + 88} ${sy + 4} M${cx + 36} ${sy - 14} L${cx + 84} ${sy + 18}" stroke="#b64" stroke-width="2" opacity=".6"/>
          <text x="${cx - 40}" y="${sy + 50}" font-size="14" font-family="'Permanent Marker', cursive" fill="#888" opacity=".6">BAR</text>`;
      }
      const ear = (x) => `<ellipse cx="${x}" cy="${sy - 92}" rx="8" ry="13" fill="${sk2}"/>`;
      const eyes = `<ellipse cx="${cx - 15}" cy="${sy - 96}" rx="4.6" ry="3" fill="#fff"/><ellipse cx="${cx + 15}" cy="${sy - 96}" rx="4.6" ry="3" fill="#fff"/>
        <circle cx="${cx - 15}" cy="${sy - 95}" r="2.4" fill="#1a120c"/><circle cx="${cx + 15}" cy="${sy - 95}" r="2.4" fill="#1a120c"/>
        <path d="M${cx - 21} ${sy - 98} Q${cx - 15} ${sy - 100} ${cx - 9} ${sy - 98} M${cx + 9} ${sy - 98} Q${cx + 15} ${sy - 100} ${cx + 21} ${sy - 98}" stroke="${shade(skin, 0.6)}" stroke-width="1.4" fill="none"/>`;
      const head = `<g transform="translate(${cx} ${sy - 10})">${hairBack(o).replace(/translate/g, 'translate')}</g>
        ${ear(cx - 42)}${ear(cx + 42)}
        <ellipse cx="${cx}" cy="${sy - 92}" rx="42" ry="52" fill="${skin}"/>
        <path d="M${cx - 42} ${sy - 92} Q${cx - 40} ${sy - 40} ${cx} ${sy - 40} Q${cx - 28} ${sy - 50} ${cx - 42} ${sy - 92}Z" fill="#000" opacity=".07"/>
        <g class="dealer-eyes">${eyes}</g>
        <path d="M${cx - 22} ${sy - 108} Q${cx - 14} ${sy - 113} ${cx - 6} ${sy - 108} M${cx + 6} ${sy - 108} Q${cx + 14} ${sy - 113} ${cx + 22} ${sy - 108}" stroke="${shade(o.hair, 0.9)}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M${cx} ${sy - 92} L${cx - 5} ${sy - 76} Q${cx} ${sy - 72} ${cx + 5} ${sy - 76}" stroke="${shade(skin, 0.6)}" stroke-width="1.6" fill="none"/>
        <path d="M${cx - 10} ${sy - 62} Q${cx} ${sy - 57} ${cx + 10} ${sy - 62}" stroke="${o.lips || shade(skin, 0.5)}" stroke-width="${o.lips ? 3.4 : 2.4}" fill="none" stroke-linecap="round"/>
        <g transform="translate(${cx} ${sy - 10})">${beardSVG(o, true)}${hairFront(o)}</g>`;
      this.bodyG.innerHTML = `
        <rect x="${cx - 16}" y="${sy - 50}" width="32" height="34" fill="${sk2}"/>
        <path d="M${cx - 108} ${sy + 14} Q${cx - 112} ${sy - 18} ${cx - 64} ${sy - 28} L${cx + 64} ${sy - 28} Q${cx + 112} ${sy - 18} ${cx + 108} ${sy + 14} L${cx + 120} ${sy + 200} L${cx - 120} ${sy + 200} Z" fill="${torsoFill}"/>
        <path d="M${cx - 108} ${sy + 14} Q${cx - 112} ${sy - 18} ${cx - 64} ${sy - 28} L${cx - 40} ${sy - 28} L${cx - 70} ${sy + 200} L${cx - 120} ${sy + 200}Z" fill="#000" opacity=".18"/>
        ${details}
        <g class="dealer-head">${head}</g>`;
      // brazos (capa superior)
      const sleeve = o.outfit === 'tux' ? o.jacket : o.outfit === 'vest' ? o.shirt : o.shirt;
      this.arms = {};
      ['L', 'R'].forEach((k) => {
        const arm = U.svg('path', { fill: 'none', stroke: o.outfit === 'vest' ? skin : sleeve, 'stroke-width': 30, 'stroke-linecap': 'round' }, this.armsG);
        // manga parcial (camisa remangada) o puño blanco
        let over = null;
        if (o.outfit === 'vest') over = U.svg('path', { fill: 'none', stroke: o.shirt, 'stroke-width': 32, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '55 100' }, this.armsG);
        if (o.outfit === 'tux') over = U.svg('path', { fill: 'none', stroke: '#f4f4f0', 'stroke-width': 26, 'stroke-linecap': 'butt', pathLength: 100, 'stroke-dasharray': '7 100', 'stroke-dashoffset': -86 }, this.armsG);
        if (o.outfit === 'bartender') over = U.svg('path', { fill: 'none', stroke: skin, 'stroke-width': 26, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '62 100', 'stroke-dashoffset': -38 }, this.armsG);
        const hand = U.svg('g', { class: 'hand dealer-hand' }, this.armsG);
        hand.innerHTML = handSVG(skin, k === 'L' ? -1 : 1);
        this.arms[k] = { arm, over, hand };
      });
      if (o.outfit === 'tux') {
        // gemelos dorados
        this.cuffs = ['L', 'R'].map(() => U.svg('circle', { r: 3, fill: '#e2bf66' }, this.armsG));
      }
    }
    update() {
      if (!this.alive) return;
      const cx = this.cx, sy = this.sy;
      ['L', 'R'].forEach((k, i) => {
        const h = this.hands[k];
        const sx = k === 'L' ? cx - 92 : cx + 92;
        const d = this.armPath(sx, sy + 4, h.x, h.y, k === 'L' ? 1 : -1);
        const a = this.arms[k];
        a.arm.setAttribute('d', d);
        if (a.over) a.over.setAttribute('d', d);
        this.setHandTransform(a.hand, h);
      });
    }
    scheduleIdle(ms) {
      if (!this.alive) return;
      this.timer = setTimeout(async () => {
        if (!this.busy && this.alive) {
          const r = Math.random();
          if (r < 0.4) {
            this.arms.R.hand.classList.add('tapping');
            await U.sleep(1100);
            this.arms.R.hand.classList.remove('tapping');
          } else if (r < 0.7) {
            await Promise.all([this.moveHand('L', { x: this.cx - 40, y: this.top + 40, rot: 60 }, 500), this.moveHand('R', { x: this.cx + 40, y: this.top + 40, rot: 120 }, 500)]);
            await U.sleep(1200);
            if (!this.busy) await this.restHands(500);
          }
        }
        this.scheduleIdle(U.rand(4000, 8000));
      }, ms);
    }
    // gesto de repartir sincronizado con el vuelo de la carta
    async dealGesture(from, to) {
      this.busy = true;
      const h = to.x < this.cx - 60 ? 'L' : 'R';
      const src = from || { x: this.cx + 220, y: this.top + 70 };
      await this.moveHand(h, { x: src.x - (h === 'L' ? -20 : 30), y: src.y, rot: h === 'L' ? 100 : 80 }, 120);
      const mx = U.lerp(src.x, to.x, 0.35), my = U.lerp(src.y, to.y, 0.35);
      await this.moveHand(h, { x: mx, y: Math.min(my, this.top + 240), rot: h === 'L' ? 110 : 70 }, 170, 'out');
      this.moveHand(h, this.rest[h], 300).then(() => { this.busy = false; });
    }
    async reach(to, which, dur = 260) {
      this.busy = true;
      const k = which || (to.x < this.cx ? 'L' : 'R');
      await this.moveHand(k, { x: to.x, y: Math.min(to.y, this.top + 320), rot: k === 'L' ? 100 : 80 }, dur);
      return k;
    }
    async home(dur = 320) { await this.restHands(dur); this.busy = false; }
  }
  Rig.Dealer = Dealer;
})();
