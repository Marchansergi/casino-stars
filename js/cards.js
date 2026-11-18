/* Casino Stars — barajas, zapato (shoe) y cartas en DOM */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const Cards = (CS.Cards = { W: 96, H: 134 });

  Cards.RANK_LABEL = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  Cards.SUIT = ['♠', '♥', '♦', '♣'];
  Cards.isRed = (s) => s === 1 || s === 2;
  Cards.name = (c) => Cards.RANK_LABEL[c.r] + Cards.SUIT[c.s];

  let uid = 0;
  class Shoe {
    constructor(decks = 1, penetration = 0.75) {
      this.decks = decks;
      this.penetration = penetration;
      this.build();
    }
    build() {
      this.cards = [];
      for (let d = 0; d < this.decks; d++)
        for (let s = 0; s < 4; s++)
          for (let r = 2; r <= 14; r++) this.cards.push({ r, s, id: ++uid });
      U.shuffle(this.cards);
      this.total = this.cards.length;
      this.cutAt = Math.floor(this.total * (1 - this.penetration));
      this.needsShuffle = false;
    }
    draw() {
      if (!this.cards.length) this.build();
      const c = this.cards.pop();
      if (this.cards.length <= this.cutAt) this.needsShuffle = true;
      return c;
    }
    get remaining() { return this.cards.length; }
  }
  Cards.Shoe = Shoe;

  // ---------- Posiciones de pips (x%, y%) ----------
  const L = 27, C = 50, R = 73;
  const PIPS = {
    2: [[C, 18], [C, 82]],
    3: [[C, 18], [C, 50], [C, 82]],
    4: [[L, 18], [R, 18], [L, 82], [R, 82]],
    5: [[L, 18], [R, 18], [C, 50], [L, 82], [R, 82]],
    6: [[L, 18], [R, 18], [L, 50], [R, 50], [L, 82], [R, 82]],
    7: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [L, 82], [R, 82]],
    8: [[L, 18], [R, 18], [C, 34], [L, 50], [R, 50], [C, 66], [L, 82], [R, 82]],
    9: [[L, 18], [R, 18], [L, 39], [R, 39], [C, 50], [L, 61], [R, 61], [L, 82], [R, 82]],
    10: [[L, 18], [R, 18], [C, 29], [L, 39], [R, 39], [L, 61], [R, 61], [C, 71], [L, 82], [R, 82]],
  };

  // Figura (J/Q/K) de doble cabeza en SVG, estilo clásico simplificado
  function courtSVG(r, s) {
    const red = Cards.isRed(s);
    const ink = red ? '#b3141b' : '#151a2c';
    const robeA = red ? '#c8202a' : '#1d3f8f';
    const robeB = '#e3b23c';
    const skin = '#f2d2b0';
    const hair = r === 12 ? '#e0a526' : '#5b3a1e';
    let hat;
    if (r === 13) hat = `<path d="M17 17 L19 7 L24 12 L30 5 L36 12 L41 7 L43 17 Z" fill="${robeB}" stroke="${ink}" stroke-width=".8"/><circle cx="30" cy="9" r="1.5" fill="${robeA}"/>`;
    else if (r === 12) hat = `<path d="M20 16 Q30 4 40 16 Z" fill="${robeB}" stroke="${ink}" stroke-width=".8"/><circle cx="25" cy="12" r="1.2" fill="${robeA}"/><circle cx="30" cy="9" r="1.4" fill="${robeA}"/><circle cx="35" cy="12" r="1.2" fill="${robeA}"/>`;
    else hat = `<path d="M18 17 Q22 7 34 8 Q44 9 44 15 L18 17 Z" fill="${robeA}" stroke="${ink}" stroke-width=".8"/><path d="M38 8 Q46 2 48 9" stroke="${robeB}" stroke-width="2" fill="none"/>`;
    const beard = r === 13 ? `<path d="M24 26 Q30 36 36 26 Q33 30 30 30 Q27 30 24 26Z" fill="${hair}"/>` : '';
    const half = `
      <g>
        <path d="M8 45 L8 36 Q10 28 22 26 L38 26 Q50 28 52 36 L52 45 Z" fill="${robeA}" stroke="${ink}" stroke-width=".8"/>
        <path d="M22 26 L30 45 L38 26" fill="${robeB}" stroke="${ink}" stroke-width=".6"/>
        <path d="M8 40 Q16 36 22 42 M52 40 Q44 36 38 42" stroke="${robeB}" stroke-width="1.6" fill="none"/>
        <path d="M18 18 Q18 12 30 12 Q42 12 42 18 L42 22 Q40 30 30 30 Q20 30 18 22 Z" fill="${hair}"/>
        <ellipse cx="30" cy="21" rx="8.5" ry="9" fill="${skin}" stroke="${ink}" stroke-width=".6"/>
        <circle cx="27" cy="20" r=".9" fill="${ink}"/><circle cx="33" cy="20" r=".9" fill="${ink}"/>
        <path d="M28 25 Q30 26.5 32 25" stroke="${ink}" stroke-width=".7" fill="none"/>
        ${beard}${hat}
        <text x="13" y="43" font-size="9" fill="${red ? '#fff' : '#fff'}" font-family="serif">${Cards.SUIT[s]}</text>
      </g>`;
    return `<svg viewBox="0 0 60 90" class="court-svg" preserveAspectRatio="none">
      <rect x="1" y="1" width="58" height="88" rx="2" fill="#fbf6e9" stroke="${ink}" stroke-width="1"/>
      <g>${half}</g>
      <g transform="rotate(180 30 45)">${half}</g>
      <line x1="4" y1="45" x2="56" y2="45" stroke="${ink}" stroke-width=".6" opacity=".5"/>
      <text x="30" y="49" text-anchor="middle" font-size="9" font-weight="bold" fill="${ink}" font-family="Georgia,serif" opacity=".0">${Cards.RANK_LABEL[r]}</text>
    </svg>`;
  }

  Cards.faceHTML = (c) => {
    const lab = Cards.RANK_LABEL[c.r], su = Cards.SUIT[c.s];
    const col = Cards.isRed(c.s) ? 'red' : 'black';
    let center = '';
    if (c.r <= 10) {
      center = '<div class="pips">' + PIPS[c.r].map(([x, y]) => `<span class="pip${y > 52 ? ' inv' : ''}" style="left:${x}%;top:${y}%">${su}</span>`).join('') + '</div>';
    } else if (c.r === 14) {
      center = `<div class="ace-pip${c.s === 0 ? ' ace-spade' : ''}">${su}</div>`;
    } else {
      center = `<div class="court">${courtSVG(c.r, c.s)}</div>`;
    }
    return `<div class="face front ${col}">
        <div class="idx tl"><b>${lab}</b><i>${su}</i></div>
        ${center}
        <div class="idx br"><b>${lab}</b><i>${su}</i></div>
      </div>`;
  };

  Cards.create = (card, deckStyle, parent) => {
    const el = U.el('div', 'card deck-' + deckStyle, parent);
    el.innerHTML = `<div class="card-inner">${card ? Cards.faceHTML(card) : ''}<div class="face back"><div class="back-art"></div></div></div>`;
    el.card = card;
    el._pos = { x: 0, y: 0, rot: 0 };
    return el;
  };

  Cards.setFace = (el, card) => {
    el.card = card;
    const inner = el.querySelector('.card-inner');
    const old = inner.querySelector('.front');
    if (old) old.remove();
    inner.insertAdjacentHTML('afterbegin', Cards.faceHTML(card));
  };

  const tf = (p, s = 1) => `translate(${p.x - Cards.W / 2}px, ${p.y - Cards.H / 2}px) rotate(${p.rot || 0}deg) scale(${s})`;
  Cards.tf = tf;

  Cards.setPos = (el, x, y, rot = 0) => {
    el._pos = { x, y, rot };
    el.style.transform = tf(el._pos);
  };

  Cards.flyTo = async (el, x, y, rot = 0, opts = {}) => {
    const from = Object.assign({}, el._pos);
    const to = { x, y, rot };
    const dur = opts.dur || 420;
    const lift = opts.lift == null ? 1.06 : opts.lift;
    const mid = { x: U.lerp(from.x, to.x, 0.55), y: U.lerp(from.y, to.y, 0.55) - (opts.arc || 0), rot: U.lerp(from.rot, to.rot, 0.7) };
    el.classList.add('flying');
    el._pos = to;
    if (opts.sound !== false) CS.Audio.play('card');
    await U.anim(el, [{ transform: tf(from) }, { transform: tf(mid, lift), offset: 0.55 }, { transform: tf(to) }], { duration: dur, easing: opts.easing || 'cubic-bezier(.25,.75,.25,1)' });
    el.style.transform = tf(to);
    el.classList.remove('flying');
  };

  Cards.flip = async (el, up = true, dur = 380) => {
    const inner = el.querySelector('.card-inner');
    inner.style.transitionDuration = dur * U.speed + 'ms';
    el.classList.toggle('faceup', up);
    if (up) CS.Audio.play('flip');
    await U.sleep(dur);
  };

  // Revelado lento estilo "squeeze" (baccarat Vegas)
  Cards.squeeze = async (el) => {
    el.classList.add('squeezing');
    CS.Audio.play('flip');
    const inner = el.querySelector('.card-inner');
    inner.style.transitionDuration = '0ms';
    await U.anim(inner, [
      { transform: 'rotateX(0deg)' },
      { transform: 'rotateX(-28deg) rotateY(8deg)', offset: 0.35 },
      { transform: 'rotateX(-18deg) rotateY(4deg)', offset: 0.6 },
      { transform: 'rotateX(-40deg) rotateY(12deg)', offset: 0.85 },
      { transform: 'rotateX(0deg)' },
    ], { duration: 1500, easing: 'ease-in-out', fill: 'none' });
    el.classList.remove('squeezing');
    await Cards.flip(el, true, 300);
  };
})();
