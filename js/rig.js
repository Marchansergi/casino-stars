/* Casino Stars — personajes SVG con rig animado (jugadores y crupier)
   - Brazos de dos segmentos con codo calculado por cinemática inversa
   - Manos con dedos articulados, nudillos y uñas
   - Caras con iris, párpados, parpadeo y expresiones (alegría / fastidio)
   - Sombreado con degradados y contraluz del color del local
   Animaciones idle: tamborilear los dedos, crujirse los nudillos, barajar fichas,
   mirar alrededor, respirar. El crupier reparte y baraja con sus manos. */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const Rig = (CS.Rig = {});

  // ---------------- Personajes por local ----------------
  Rig.NPCS = {
    easy: [
      { name: 'Paco', skin: '#d39a6a', hair: '#2a1c12', eyes: '#4a3020', hairStyle: 'cap', hat: '#355c2b', shirt: '#8a2f24', pattern: 'flannel', beard: 'mustache', acc: 'toothpick' },
      { name: 'Loli', skin: '#efc19c', hair: '#a8401e', eyes: '#3d6b3a', hairStyle: 'bun', shirt: '#2e4a7a', acc: 'earrings', lips: '#b23a48' },
      { name: 'Manolo', skin: '#c58a5c', hair: '#3a3a3a', eyes: '#3a2414', hairStyle: 'bald', shirt: '#cfc9b8', pattern: 'tank', beard: 'full', acc: 'cigar' },
      { name: 'El Rata', skin: '#e2b48c', hair: '#151515', eyes: '#2a2a2a', hairStyle: 'slick', shirt: '#3b3b3b', pattern: 'leather', beard: 'stubble', acc: 'none' },
    ],
    normal: [
      { name: 'Sofía', skin: '#f1c9a5', hair: '#2b1a12', eyes: '#5a3a1e', hairStyle: 'long', shirt: '#5a2340', acc: 'earrings', lips: '#a0293e' },
      { name: 'Marcos', skin: '#d8a27a', hair: '#3b2416', eyes: '#2f5a7a', hairStyle: 'short', shirt: '#2c3e57', pattern: 'blazer', acc: 'glasses', beard: 'stubble' },
      { name: 'Irene', skin: '#9c6b48', hair: '#120c08', eyes: '#2a1608', hairStyle: 'ponytail', shirt: '#1f5e5b', acc: 'earrings', lips: '#7a2230' },
      { name: 'Andrés', skin: '#e8bb94', hair: '#7a5a3a', eyes: '#3e6a4a', hairStyle: 'short', shirt: '#6b4a2e', pattern: 'blazer', beard: 'full', acc: 'none' },
    ],
    hard: [
      { name: 'Mr. Black', skin: '#c99a74', hair: '#0e0e0e', eyes: '#2a1a10', hairStyle: 'slick', shirt: '#121214', pattern: 'suit', tie: '#8c1022', acc: 'sunglasses' },
      { name: 'Tex', skin: '#e0a882', hair: '#c9c2b5', eyes: '#3a6a8a', hairStyle: 'cowboy', hat: '#6b4a2b', shirt: '#e9e2d0', pattern: 'western', beard: 'mustache', acc: 'cigar' },
      { name: 'Victoria', skin: '#f3cfae', hair: '#e2c06a', eyes: '#2f6a8a', hairStyle: 'long', shirt: '#9e0f2a', pattern: 'dress', acc: 'necklace', lips: '#b0102c' },
      { name: 'Kenji', skin: '#e9c49c', hair: '#111', eyes: '#241408', hairStyle: 'short', shirt: '#3a3f47', pattern: 'suit', tie: '#1d3f8f', acc: 'glasses' },
    ],
  };
  Rig.DEALERS = {
    easy: { name: 'Rufo', skin: '#cf9466', hair: '#2a1b12', eyes: '#3a2414', hairStyle: 'short', beard: 'full', outfit: 'bartender', shirt: '#26292c' },
    normal: { name: 'Elena', skin: '#efc6a1', hair: '#3b2014', eyes: '#4a6a3a', hairStyle: 'ponytail', outfit: 'vest', shirt: '#f4f1ea', vest: '#2b2b33', lips: '#a3303e' },
    hard: { name: 'M. Duval', skin: '#d8a982', hair: '#151515', eyes: '#2a1a10', hairStyle: 'slick', outfit: 'tux', shirt: '#f7f7f2', jacket: '#0f0f12' },
  };
  // color del contraluz según el local (lo fija la escena)
  Rig.RIM = { easy: '#ffb15c', normal: '#ffd08a', hard: '#ff6fd0' };
  Rig.rim = '#ffd08a';

  const shade = (c, f) => CS.Chips.shade(c, f);
  let UID = 0;

  // ---------------- definiciones de degradados por personaje ----------------
  function defs(id, o, clothBase, front) {
    const sk = o.skin;
    return `<defs>
      <radialGradient id="${id}-skin" cx="${front ? '50%' : '68%'}" cy="35%" r="75%">
        <stop offset="0" stop-color="${shade(sk, 1.1)}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${shade(sk, 0.72)}"/>
      </radialGradient>
      <linearGradient id="${id}-limb" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${shade(sk, 1.06)}"/><stop offset="1" stop-color="${shade(sk, 0.82)}"/>
      </linearGradient>
      <linearGradient id="${id}-cloth" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="${shade(clothBase, 0.55)}"/><stop offset="${front ? '.5' : '.62'}" stop-color="${clothBase}"/><stop offset="1" stop-color="${shade(clothBase, front ? 0.6 : 1.12)}"/>
      </linearGradient>
      <linearGradient id="${id}-hair" x1="0" x2="0.4" y1="0" y2="1">
        <stop offset="0" stop-color="${shade(o.hair, 1.35)}"/><stop offset=".45" stop-color="${o.hair}"/><stop offset="1" stop-color="${shade(o.hair, 0.6)}"/>
      </linearGradient>
      ${o.pattern === 'flannel' ? `<pattern id="${id}-flannel" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="${o.shirt}"/><rect width="26" height="8" y="9" fill="#1a1a1a" opacity=".35"/><rect width="8" height="26" x="9" fill="#1a1a1a" opacity=".35"/><rect width="26" height="2" y="12" fill="#e8d6a0" opacity=".4"/><rect width="2" height="26" x="12" fill="#e8d6a0" opacity=".4"/></pattern>` : ''}
    </defs>`;
  }

  // ---------------- mano (vista superior, dedos hacia +x, muñeca en el origen) ----------------
  function handSVG(id, skin, thumb = 1) {
    const out = shade(skin, 0.6), crease = shade(skin, 0.7), nail = shade(skin, 1.22);
    // orden de los dedos desde el lado del pulgar: índice, corazón, anular, meñique
    const F = [[-8.4, 17, 5.6], [-2.8, 19, 5.9], [2.9, 17.6, 5.5], [8.3, 13.5, 4.7]];
    const fingers = F.map(([cy, len, w], i) => {
      const y = cy * thumb;
      return `<g class="finger f${i}">
        <rect x="16" y="${(y - w / 2).toFixed(2)}" width="${len}" height="${w}" rx="${w / 2}" fill="url(#${id}-limb)" stroke="${out}" stroke-width=".7"/>
        <path d="M${(16 + len * 0.42).toFixed(1)} ${(y - w / 2 + 1).toFixed(1)} v${(w - 2).toFixed(1)} M${(16 + len * 0.72).toFixed(1)} ${(y - w / 2 + 1.2).toFixed(1)} v${(w - 2.4).toFixed(1)}" stroke="${crease}" stroke-width=".6" opacity=".7"/>
        <ellipse cx="${(16 + len - 3).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.5" ry="${(w * 0.3).toFixed(2)}" fill="${nail}" opacity=".9"/>
      </g>`;
    }).join('');
    const ty = -9 * thumb;
    return `
      <g class="fingers">${fingers}</g>
      <path class="palm" d="M-3 -9 C3 -12.6 12 -13.2 19 -11.6 C22.5 -6 22.5 6 19 11.6 C12 13.2 3 12.6 -3 9 Z" fill="url(#${id}-skin)" stroke="${out}" stroke-width=".8"/>
      <path d="M4 ${-4 * thumb} C9 ${-5 * thumb} 14 ${-6 * thumb} 18 ${-8 * thumb} M4 ${1 * thumb} C10 ${0} 14 ${0} 18 ${-2.6 * thumb} M5 ${5 * thumb} C10 ${4.5 * thumb} 14 ${4 * thumb} 18 ${3 * thumb}" stroke="${crease}" stroke-width=".55" fill="none" opacity=".45"/>
      ${F.map(([cy]) => `<ellipse cx="18.6" cy="${(cy * thumb).toFixed(1)}" rx="1.8" ry="1.4" fill="#fff" opacity=".16"/>`).join('')}
      <g class="thumb" transform="rotate(${-36 * thumb} 3 ${ty})">
        <rect x="1" y="${ty - 3.6}" width="16" height="7.2" rx="3.6" fill="url(#${id}-limb)" stroke="${out}" stroke-width=".7"/>
        <ellipse cx="14" cy="${ty}" rx="2.4" ry="2.1" fill="${nail}" opacity=".9"/>
        <path d="M8.5 ${ty - 3} v6" stroke="${crease}" stroke-width=".6" opacity=".6"/>
      </g>`;
  }

  // ---------------- brazo con codo (cinemática inversa de dos huesos) ----------------
  function ik(sx, sy, hx, hy, a, b, sign) {
    let dx = hx - sx, dy = hy - sy;
    let d = Math.hypot(dx, dy) || 0.001;
    // si la mano está más lejos que el brazo extendido, el brazo se estira un poco (casi recto)
    if (d > (a + b) * 0.97) { const k = d / ((a + b) * 0.97); a *= k; b *= k; }
    const maxD = a + b - 0.5, minD = Math.abs(a - b) + 1;
    const dc = U.clamp(d, minD, maxD);
    const cosA = U.clamp((a * a + dc * dc - b * b) / (2 * a * dc), -1, 1);
    const ang = Math.atan2(dy, dx) + sign * Math.acos(cosA);
    return { x: sx + a * Math.cos(ang), y: sy + a * Math.sin(ang) };
  }
  const lerpP = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  const seg = (p, q) => `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;

  class Arm {
    // cfg: {upper, fore, w1, w2, a, b, sign, cuff, roll, shortSleeve, outline}
    constructor(parent, cfg) {
      this.c = cfg;
      const mk = (attrs) => U.svg('path', Object.assign({ fill: 'none', 'stroke-linecap': 'round' }, attrs), parent);
      const ol = cfg.outline;
      this.oU = mk({ stroke: ol, 'stroke-width': cfg.w1 + 3 });
      this.oF = mk({ stroke: ol, 'stroke-width': cfg.w2 + 3 });
      this.pU = mk({ stroke: cfg.upper, 'stroke-width': cfg.w1 });
      this.pF = mk({ stroke: cfg.fore, 'stroke-width': cfg.w2 });
      if (cfg.shortSleeve) { this.oS = mk({ stroke: ol, 'stroke-width': cfg.w1 + 7 }); this.pS = mk({ stroke: cfg.shortSleeve, 'stroke-width': cfg.w1 + 4 }); }
      if (cfg.roll) this.pR = mk({ stroke: cfg.roll, 'stroke-width': cfg.w2 + 6, 'stroke-linecap': 'butt' });
      if (cfg.cuff) this.pC = mk({ stroke: cfg.cuff, 'stroke-width': cfg.w2 + 1, 'stroke-linecap': 'butt' });
      this.hl = mk({ stroke: '#fff', 'stroke-width': 3, opacity: 0.13 });
      this.fold = mk({ stroke: '#000', 'stroke-width': 1.4, opacity: 0.18 });
    }
    set(S, H) {
      const c = this.c;
      const E = ik(S.x, S.y, H.x, H.y, c.a, c.b, c.sign);
      const W = lerpP(E, H, 0.97);
      this.oU.setAttribute('d', seg(S, E)); this.pU.setAttribute('d', seg(S, E));
      this.oF.setAttribute('d', seg(E, W)); this.pF.setAttribute('d', seg(E, W));
      if (this.pS) { const m = lerpP(S, E, 0.58); this.oS.setAttribute('d', seg(S, m)); this.pS.setAttribute('d', seg(S, m)); }
      if (this.pR) this.pR.setAttribute('d', seg(lerpP(E, H, 0.04), lerpP(E, H, 0.16)));
      if (this.pC) this.pC.setAttribute('d', seg(lerpP(E, H, 0.8), lerpP(E, H, 0.93)));
      // brillo en el borde superior y pliegue en el codo
      const off = (p) => ({ x: p.x + c.hlx, y: p.y + c.hly });
      this.hl.setAttribute('d', `M${off(lerpP(S, E, 0.15)).x.toFixed(1)} ${off(lerpP(S, E, 0.15)).y.toFixed(1)} L${off(E).x.toFixed(1)} ${off(E).y.toFixed(1)} L${off(lerpP(E, H, 0.75)).x.toFixed(1)} ${off(lerpP(E, H, 0.75)).y.toFixed(1)}`);
      const e1 = lerpP(E, S, 0.12), e2 = lerpP(E, H, 0.12);
      this.fold.setAttribute('d', `M${e1.x.toFixed(1)} ${e1.y.toFixed(1)} Q${E.x.toFixed(1)} ${(E.y + 3).toFixed(1)} ${e2.x.toFixed(1)} ${e2.y.toFixed(1)}`);
      this.E = E;
    }
  }

  // ---------------- cabeza 3/4 (mirando a +x) ----------------
  const HEAD34 = 'M-40 -96 C-42 -138 -8 -152 14 -148 C40 -144 54 -124 51 -100 C50 -92 52 -86 50 -79 C48 -68 48 -60 44 -51 C40 -41 32 -33 20 -30 C10 -28 -2 -31 -12 -37 C-26 -45 -38 -62 -40 -80 Z';

  function eye(id, k, x, y, w, h, iris, look = 1.2) {
    return `<g class="eye">
      <clipPath id="${id}-e${k}"><path d="M${x - w} ${y} C${x - w / 2} ${y - h} ${x + w / 2} ${y - h} ${x + w} ${y} C${x + w / 2} ${y + h * 0.8} ${x - w / 2} ${y + h * 0.8} ${x - w} ${y} Z"/></clipPath>
      <path d="M${x - w} ${y} C${x - w / 2} ${y - h} ${x + w / 2} ${y - h} ${x + w} ${y} C${x + w / 2} ${y + h * 0.8} ${x - w / 2} ${y + h * 0.8} ${x - w} ${y} Z" fill="#f6efe6"/>
      <g clip-path="url(#${id}-e${k})">
        <circle class="iris" cx="${x + look}" cy="${y + 0.4}" r="${h * 0.86}" fill="${iris}"/>
        <circle cx="${x + look}" cy="${y + 0.4}" r="${h * 0.42}" fill="#0d0805"/>
        <circle cx="${x + look + 1.3}" cy="${y - 1.2}" r="${Math.max(0.9, h * 0.24)}" fill="#fff" opacity=".9"/>
        <rect x="${x - w}" y="${y - h - 2}" width="${w * 2}" height="${h * 0.7}" fill="#000" opacity=".14"/>
      </g>
      <path d="M${x - w - 1} ${y + 0.3} C${x - w / 2} ${y - h - 1.4} ${x + w / 2} ${y - h - 1.4} ${x + w + 1} ${y - 0.6}" stroke="#1b120c" stroke-width="2.1" fill="none" stroke-linecap="round"/>
      <path d="M${x - w + 1} ${y + h * 0.55} C${x - w / 3} ${y + h * 0.95} ${x + w / 3} ${y + h * 0.95} ${x + w - 1} ${y + h * 0.45}" stroke="#000" stroke-width=".8" fill="none" opacity=".25"/>
    </g>`;
  }

  function hairBack34(o, id) {
    const f = `url(#${id}-hair)`;
    if (o.hairStyle === 'long') return `<path d="M-46 -112 C-66 -60 -62 0 -52 26 C-30 34 10 30 36 22 C30 -10 40 -60 44 -100 Z" fill="${f}"/>`;
    if (o.hairStyle === 'ponytail') return `<path d="M-38 -104 C-80 -86 -82 -30 -66 4 C-60 12 -50 8 -50 -2 C-60 -34 -52 -70 -28 -94 Z" fill="${f}"/><path d="M-60 -60 C-66 -40 -64 -20 -58 -4" stroke="#fff" stroke-opacity=".15" stroke-width="2" fill="none"/>`;
    if (o.hairStyle === 'bun') return `<circle cx="-30" cy="-134" r="19" fill="${f}"/><path d="M-44 -138 C-36 -150 -20 -150 -14 -140" stroke="#fff" stroke-opacity=".2" stroke-width="2" fill="none"/>`;
    return '';
  }
  function hairFront34(o, id) {
    const f = `url(#${id}-hair)`;
    const shine = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".22" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    switch (o.hairStyle) {
      case 'short': return `<path d="M-44 -82 C-52 -126 -26 -158 10 -155 C42 -152 58 -130 53 -100 C46 -116 32 -126 14 -126 C-4 -126 -20 -118 -28 -102 L-32 -72 C-42 -74 -46 -78 -44 -82 Z" fill="${f}"/>${shine('M-22 -140 C-2 -150 22 -148 38 -134')}`;
      case 'slick': return `<path d="M-44 -80 C-50 -130 -22 -156 12 -153 C44 -150 58 -128 53 -102 C40 -124 20 -130 -2 -126 C-22 -120 -32 -106 -36 -88 L-38 -66 C-46 -70 -46 -76 -44 -80 Z" fill="${f}"/>${shine('M-26 -138 C-6 -150 24 -148 44 -128')}${shine('M-34 -118 C-20 -134 6 -140 30 -136')}`;
      case 'long': return `<path d="M-46 -78 C-54 -132 -24 -158 12 -155 C46 -152 60 -128 52 -96 C46 -116 34 -128 18 -130 C4 -116 -14 -112 -30 -114 C-34 -100 -36 -80 -38 -58 C-48 -62 -48 -70 -46 -78 Z" fill="${f}"/>${shine('M-20 -144 C0 -152 26 -148 42 -130')}`;
      case 'ponytail': case 'bun': return `<path d="M-44 -82 C-52 -128 -24 -158 10 -155 C44 -152 58 -130 53 -100 C46 -118 30 -128 12 -128 C-6 -128 -22 -120 -30 -102 L-34 -72 C-42 -74 -46 -78 -44 -82 Z" fill="${f}"/>${shine('M-22 -142 C-2 -152 22 -150 40 -134')}<rect x="-44" y="-110" width="8" height="8" rx="3" fill="#c33"/>`;
      case 'bald': return `<path d="M-42 -70 C-46 -82 -44 -94 -38 -102 L-32 -72Z" fill="${f}" opacity=".85"/><ellipse cx="14" cy="-136" rx="20" ry="8" fill="#fff" opacity=".2"/>`;
      case 'cap': return `<path d="M-46 -96 C-48 -150 0 -160 16 -158 C46 -154 56 -130 52 -104 Z" fill="${o.hat}"/><path d="M-46 -96 C-48 -150 0 -160 16 -158 C-10 -146 -30 -126 -36 -98Z" fill="#000" opacity=".2"/><path d="M34 -108 C64 -110 84 -104 90 -96 C66 -90 46 -92 34 -98Z" fill="${shade(o.hat, 0.7)}"/><path d="M-46 -96 L52 -104" stroke="${shade(o.hat, 0.55)}" stroke-width="3"/><circle cx="6" cy="-157" r="4" fill="${shade(o.hat, 0.6)}"/><text x="4" y="-118" font-size="16" font-family="Arial Black" fill="#f2e6c8" text-anchor="middle">G</text>`;
      case 'cowboy': return `<ellipse cx="6" cy="-108" rx="96" ry="17" fill="${shade(o.hat, 0.78)}"/><ellipse cx="6" cy="-111" rx="92" ry="12" fill="${o.hat}"/><path d="M-40 -110 C-46 -172 2 -172 2 -172 C10 -158 18 -172 18 -172 C54 -170 54 -130 50 -110 Z" fill="${o.hat}"/><path d="M-40 -110 C-46 -172 2 -172 2 -172 C-14 -150 -24 -130 -26 -110Z" fill="#000" opacity=".22"/><rect x="-42" y="-122" width="92" height="10" fill="#2a1a0f"/><path d="M-32 -100 C-42 -92 -46 -82 -46 -74" stroke="url(#${id}-hair)" stroke-width="9" fill="none"/>`;
    }
    return '';
  }
  function beard34(o) {
    const b = o.hair === '#c9c2b5' ? '#d8d2c6' : o.hair;
    const must = `<path d="M30 -61 C36 -67 46 -67 54 -60 C46 -56 38 -57 30 -58Z" fill="${b}"/>`;
    if (o.beard === 'mustache') return must;
    if (o.beard === 'full') return `<path d="M-32 -70 C-30 -44 -12 -30 14 -27 C34 -27 48 -40 52 -58 C46 -52 38 -51 32 -54 C22 -48 8 -50 -4 -58 C-14 -64 -24 -68 -32 -70Z" fill="${b}"/><path d="M-20 -50 C-10 -40 4 -34 16 -33" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/>${must}`;
    if (o.beard === 'stubble') return `<path d="M-32 -72 C-30 -44 -12 -30 14 -27 C34 -27 48 -40 52 -58 C40 -46 10 -46 -32 -72Z" fill="${b}" opacity=".22"/>`;
    return '';
  }
  function acc34(o) {
    switch (o.acc) {
      case 'sunglasses': return `<path d="M10 -97 L54 -96 L52 -83 C46 -77 38 -78 34 -86 L31 -92 L28 -86 C22 -77 13 -78 10 -84 Z" fill="#0b0b0d"/><path d="M-26 -92 L10 -95" stroke="#0b0b0d" stroke-width="3"/><path d="M15 -93 L22 -91 M38 -92 L44 -90" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
      case 'glasses': return `<rect x="12" y="-99" width="20" height="16" rx="6" fill="#fff" fill-opacity=".08" stroke="#1f1f22" stroke-width="2.2"/><rect x="37" y="-98" width="13" height="15" rx="5" fill="#fff" fill-opacity=".08" stroke="#1f1f22" stroke-width="2.2"/><path d="M32 -92 L37 -92 M12 -94 L-24 -90" stroke="#1f1f22" stroke-width="2"/>`;
      case 'earrings': return `<circle cx="-22" cy="-64" r="3.6" fill="#f0cf62"/><circle cx="-23" cy="-65" r="1.2" fill="#fff" opacity=".8"/>`;
      case 'necklace': return `<circle cx="-22" cy="-64" r="3.6" fill="#f4f4f4"/><path d="M-32 -14 Q6 26 38 -14" stroke="#f4f0e0" stroke-width="3" fill="none" stroke-dasharray="2 3"/><circle cx="6" cy="10" r="5" fill="#9ad4ff"/><circle cx="5" cy="8.5" r="1.6" fill="#fff"/>`;
      case 'cigar': return `<rect x="40" y="-58" width="36" height="7" rx="3" fill="#6b3f1f" transform="rotate(10 40 -58)"/><rect x="48" y="-56" width="5" height="7" fill="#c9a24a" transform="rotate(10 40 -58)"/><circle cx="75" cy="-47" r="3.6" fill="#ff7a2a" class="ember"/><path class="cig-smoke" d="M75 -52 q-8 -18 4 -34 q10 -16 -2 -34" stroke="#ddd" stroke-width="5" fill="none" opacity=".25"/>`;
      case 'toothpick': return `<path d="M38 -55 L64 -61" stroke="#e6cf9a" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    return '';
  }

  // ---------------- base común ----------------
  class Person {
    constructor(o) {
      this.o = o;
      this.uid = 'p' + ++UID;
      this.busy = false;
      this.alive = true;
      this.head = { rot: 0, dx: 0 };
    }
    setHandTransform(g, h) {
      g.setAttribute('transform', `translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)}) scale(${((h.s || 1) * (this.handScale || 1)).toFixed(3)})`);
    }
    moveHand(which, to, dur = 300, ease = 'inOut') { return U.tween(this.hands[which], to, dur, ease); }
    restHands(dur = 400) {
      return Promise.all(['L', 'R'].map((k) => U.tween(this.hands[k], Object.assign({ s: 1 }, this.rest[k]), dur, 'inOut')));
    }
    scheduleBlink() {
      if (!this.alive) return;
      this.blinkT = setTimeout(() => {
        if (!this.eyesG) return;
        this.eyesG.classList.add('blink');
        setTimeout(() => this.eyesG && this.eyesG.classList.remove('blink'), 130);
        if (Math.random() < 0.18) setTimeout(() => { if (!this.eyesG) return; this.eyesG.classList.add('blink'); setTimeout(() => this.eyesG && this.eyesG.classList.remove('blink'), 120); }, 260);
        this.scheduleBlink();
      }, U.rand(1800, 5200));
    }
    // expresión breve: 'happy' | 'sad' | 'think'
    react(kind) {
      if (!this.mouth || !this.alive) return;
      const m = this.mouthShapes[kind];
      if (!m) return;
      this.mouth.setAttribute('d', m);
      if (this.browsG) this.browsG.setAttribute('transform', kind === 'sad' ? 'translate(0 2)' : kind === 'happy' ? 'translate(0 -2.5)' : 'translate(0 0)');
      clearTimeout(this.reactT);
      this.reactT = setTimeout(() => { if (!this.alive) return; this.mouth.setAttribute('d', this.mouthShapes.neutral); if (this.browsG) this.browsG.removeAttribute('transform'); }, 1800);
    }
    destroy() {
      this.alive = false;
      U.Ticker.fns.delete(this._tick);
      clearTimeout(this.timer); clearTimeout(this.blinkT); clearTimeout(this.reactT);
      this.eyesG = null;
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
      this.handScale = 1.05;
      this.build();
      this.rest = { L: { x: 170, y: 120, rot: 8 }, R: { x: 186, y: 52, rot: -6 } };
      this.hands = { L: Object.assign({ s: 1 }, this.rest.L), R: Object.assign({ s: 1 }, this.rest.R) };
      this.chipState = [0, 1, 2, 3, 4, 5].map((i) => ({ x: i < 3 ? 222 : 252, y: 150 - (i % 3) * 6 }));
      this._tick = (t) => this.update(t);
      U.Ticker.fns.add(this._tick);
      this.scheduleIdle(U.rand(800, 3000));
      this.scheduleBlink();
    }
    build() {
      const o = this.o, g = this.root, id = this.uid;
      const skin = o.skin, out = shade(skin, 0.55);
      const isBare = o.pattern === 'tank' || o.pattern === 'dress';
      const cloth = o.pattern === 'flannel' ? `url(#${id}-flannel)` : `url(#${id}-cloth)`;
      const sleeve = o.pattern === 'flannel' ? `url(#${id}-flannel)` : o.shirt;
      const limb = skin; // trazo sólido: los degradados no pintan sobre líneas rectas
      g.innerHTML = defs(id, o, o.shirt, false);

      // brazo lejano y su mano (detrás del torso)
      const farG = U.svg('g', { class: 'far-arm' }, g);
      this.armR = new Arm(farG, { upper: isBare ? limb : shade(o.shirt, 0.78), fore: isBare ? limb : shade(o.shirt, 0.78), w1: 30, w2: 24, a: 78, b: 80, sign: 1, outline: shade(isBare ? skin : o.shirt, 0.45), hlx: 0, hly: -6, cuff: o.pattern === 'suit' ? '#d8d8d2' : null });
      this.handR = U.svg('g', { class: 'hand' }, farG);
      this.handR.innerHTML = `<g style="filter:brightness(.85)">${handSVG(id, skin, -1)}</g>`;

      const body = U.svg('g', { class: 'body breathe' }, g);
      body.innerHTML = `
        ${hairBack34(o, id)}
        <path d="M-16 -46 C-14 -30 -14 -18 -19 -8 L21 -10 C17 -22 17 -34 19 -44 Z" fill="url(#${id}-skin)"/>
        <path d="M-16 -46 C-6 -34 8 -32 19 -38 L18 -30 C8 -24 -6 -26 -15 -34Z" fill="#000" opacity=".22"/>
        <path class="torso" d="M-84 30 C-92 4 -70 -12 -32 -18 L44 -18 C78 -14 100 2 106 32 C112 120 116 300 120 1000 L-114 1000 C-112 300 -100 120 -84 30Z" fill="${cloth}"/>
        <path d="M-84 30 C-92 4 -70 -12 -32 -18 L-14 -18 C-40 60 -44 300 -40 1000 L-114 1000 C-112 300 -100 120 -84 30Z" fill="#000" opacity=".2"/>
        <path d="M-70 120 C-50 140 -30 150 -6 150 M-60 230 C-40 246 -16 252 10 250 M40 40 C56 80 64 120 66 170" stroke="#000" stroke-width="2" opacity=".14" fill="none"/>
        <path d="M-84 30 C-92 4 -70 -12 -32 -18" stroke="${Rig.rim}" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M-86 40 C-98 140 -104 300 -110 520" stroke="${Rig.rim}" stroke-width="3" fill="none" opacity=".35"/>
        ${this.outfitSide(o, skin)}`;

      const head = U.svg('g', { class: 'head' }, g);
      this.headG = head;
      const iris = o.eyes || '#4a3020';
      head.innerHTML = `
        <path d="M-18 -97 C-32 -102 -36 -84 -31 -72 C-28 -65 -20 -63 -16 -70" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1"/>
        <path d="M-21 -91 C-27 -90 -28 -80 -24 -75" stroke="${out}" stroke-width="1.4" fill="none" opacity=".7"/>
        <path d="${HEAD34}" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1.1"/>
        <path d="M-40 -96 C-42 -120 -30 -138 -14 -146" stroke="${Rig.rim}" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>
        <path d="M48 -88 C54 -80 59 -72 57 -66 C55 -62 50 -62 46 -65" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1.2"/>
        <path d="M49 -66 C51 -65 53 -65 54 -67" stroke="${out}" stroke-width="1.2" fill="none"/>
        <ellipse cx="30" cy="-68" rx="10" ry="5.5" fill="#e4746a" opacity=".16"/>
        <g class="eyes-g">${eye(id, 0, 23, -89, 6.4, 4.6, iris)}${eye(id, 1, 43.5, -88.5, 3.6, 4.2, iris, 0.8)}</g>
        <g class="brows-g"><path d="M12 -100 C17 -106 25 -107 32 -103" stroke="${shade(o.hair === '#c9c2b5' ? '#9a948a' : o.hair, 0.9)}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="M38 -102 C42 -104 46 -104 49 -100" stroke="${shade(o.hair === '#c9c2b5' ? '#9a948a' : o.hair, 0.9)}" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
        ${o.lips ? `<path d="M27 -57 C31 -60 34 -59 36 -58 C38 -59 41 -60 44 -57 C40 -55 32 -55 27 -57Z" fill="${o.lips}"/>` : ''}
        <path class="mouth" d="M27 -57 C32 -54 38 -54 44 -57" stroke="${o.lips ? shade(o.lips, 0.7) : shade(skin, 0.5)}" stroke-width="${o.lips ? 2.6 : 2.2}" fill="none" stroke-linecap="round"/>
        <path d="M31 -49 C35 -48 39 -48 42 -50" stroke="#000" stroke-width="1.2" fill="none" opacity=".12"/>
        ${beard34(o)}
        ${hairFront34(o, id)}
        ${acc34(o)}`;
      this.eyesG = head.querySelector('.eyes-g');
      this.browsG = head.querySelector('.brows-g');
      this.mouth = head.querySelector('.mouth');
      this.mouthShapes = {
        neutral: 'M27 -57 C32 -54 38 -54 44 -57',
        happy: 'M26 -59 C31 -51 39 -51 45 -60',
        sad: 'M27 -54 C32 -58 38 -58 44 -54',
        think: 'M29 -56 C33 -56 38 -57 42 -56',
      };

      // fichas propias para barajar (detrás de la mano cercana)
      this.chipsG = U.svg('g', { class: 'npc-chips' }, g);
      const chipCols = ['#c8232c', '#1d8b45', '#1a1a1d', '#c8232c', '#1d8b45', '#1a1a1d'];
      this.chipEls = chipCols.map((c) => {
        const cg = U.svg('g', {}, this.chipsG);
        cg.innerHTML = `<ellipse cx="0" cy="6" rx="14" ry="5.5" fill="${shade(c, 0.45)}"/><rect x="-14" y="0" width="28" height="6" fill="${shade(c, 0.62)}"/><rect x="-14" y="0" width="28" height="6" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="3 5" opacity=".55"/><ellipse cx="0" cy="0" rx="14" ry="5.5" fill="${c}"/><ellipse cx="0" cy="0" rx="8.5" ry="3.2" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/><ellipse cx="-4" cy="-1.5" rx="5" ry="1.6" fill="#fff" opacity=".2"/>`;
        return cg;
      });
      // brazo cercano
      const nearG = U.svg('g', { class: 'near-arm' }, g);
      this.armL = new Arm(nearG, { upper: isBare ? limb : sleeve, fore: isBare ? limb : sleeve, w1: 37, w2: 29, a: 134, b: 136, sign: 1, outline: shade(isBare ? skin : o.shirt, 0.42), hlx: 0, hly: -8, cuff: o.pattern === 'suit' ? '#f2f2ee' : o.pattern === 'blazer' ? '#e9e4da' : null });
      this.handL = U.svg('g', { class: 'hand' }, nearG);
      this.handL.innerHTML = handSVG(id, skin, 1);
      if (o.pattern === 'suit' || o.acc === 'necklace') {
        // reloj / pulsera en la muñeca cercana
        this.watch = U.svg('g', {}, nearG);
        this.watch.innerHTML = o.pattern === 'suit' ? '<rect x="-4" y="-13" width="7" height="26" rx="2" fill="#c9a24a"/><circle cx="-0.5" cy="0" r="5" fill="#f4f0e0" stroke="#8a6420" stroke-width="1.4"/>' : '<rect x="-3" y="-12" width="5" height="24" rx="2" fill="#f0f0f0" stroke="#b8b8b8"/>';
      }
    }
    outfitSide(o, skin) {
      const id = this.uid;
      switch (o.pattern) {
        case 'suit': return `<path d="M-8 -17 L12 34 L32 -17 Z" fill="#f4f4f0"/><path d="M-8 -17 L12 34 L2 -17Z" fill="#000" opacity=".08"/>
          <path d="M8 -8 L17 -8 L21 62 L12 74 L3 62Z" fill="${o.tie}"/><path d="M8 -8 L17 -8 L15 2 L10 2Z" fill="${shade(o.tie, 0.7)}"/><path d="M12 6 L16 60" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
          <path d="M-30 -18 L6 70 L-8 -18Z" fill="${shade(o.shirt, 1.8)}" opacity=".5"/><path d="M32 -18 L14 70 L46 -14Z" fill="${shade(o.shirt, 2)}" opacity=".55"/>
          <path d="M60 44 L84 40 L84 48 L60 52Z" fill="#f4f4f0" opacity=".85"/><path d="M70 40 L74 34 L78 40" fill="#c8232c"/>
          <circle cx="16" cy="120" r="3" fill="#222"/><circle cx="18" cy="170" r="3" fill="#222"/>`;
        case 'blazer': return `<path d="M-4 -17 L12 28 L28 -17 Z" fill="#ece6dc"/><path d="M-30 -18 L8 76 L-4 -18Z M32 -18 L14 76 L50 -14Z" fill="#000" opacity=".25"/><path d="M32 -18 L14 76" stroke="#fff" stroke-opacity=".15" stroke-width="2"/><circle cx="14" cy="110" r="3.4" fill="${shade(o.shirt, 0.6)}"/>`;
        case 'dress': return `<path d="M-52 -18 L62 -18 C46 28 20 36 6 36 C-14 36 -38 26 -52 -18Z" fill="url(#${id}-skin)"/><path d="M-40 -6 C-20 14 20 14 46 -6" stroke="#000" stroke-opacity=".08" stroke-width="6" fill="none"/>
          <path d="M-62 26 C-20 52 30 52 76 26 L80 40 C30 66 -20 66 -66 40Z" fill="${shade(o.shirt, 0.75)}"/><path d="M-60 30 C-20 54 30 54 74 30" stroke="#ffd6e0" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
        case 'tank': return `<path d="M-64 -17 L-30 -17 C-36 10 -38 30 -40 44 L-72 44 C-76 20 -72 0 -64 -17Z M30 -17 L68 -17 C78 0 84 20 82 44 L46 44 C42 20 36 0 30 -17Z" fill="url(#${id}-skin)"/><path d="M-30 -17 C-10 22 14 22 30 -17" fill="url(#${id}-skin)"/><path d="M-28 -12 C-10 18 12 18 28 -12" stroke="${shade(o.shirt, 0.7)}" stroke-width="3" fill="none"/><path d="M-8 40 C0 44 8 44 16 40" stroke="#4a3a2a" stroke-opacity=".3" stroke-width="2" fill="none"/>`;
        case 'leather': return `<path d="M-6 -17 L10 44 L26 -17Z" fill="#7a2a2a"/><path d="M-32 -18 L6 96 L-10 -18Z M32 -18 L12 96 L48 -12Z" fill="#000" opacity=".35"/><path d="M12 96 L10 400" stroke="#9a9a9a" stroke-width="2" opacity=".6"/><path d="M20 -10 L46 -12 C30 30 20 60 12 96" stroke="#fff" stroke-opacity=".14" stroke-width="3" fill="none"/><circle cx="22" cy="126" r="3" fill="#bbb"/>`;
        case 'western': return `<path d="M-62 6 C-20 32 30 34 78 6 L82 32 C30 66 -24 64 -68 32Z" fill="#7a4a2a" opacity=".55"/><path d="M2 -16 L10 22 L18 -16" fill="none" stroke="#222" stroke-width="5"/><circle cx="10" cy="24" r="6" fill="#c9a24a"/><circle cx="9" cy="22.5" r="2" fill="#fff6c8"/>${[50, 90, 130].map((y) => `<circle cx="14" cy="${y}" r="2.6" fill="#8a6a4a"/>`).join('')}`;
        case 'flannel': return `<path d="M-12 -17 L8 24 L28 -17Z" fill="#2a2a2a"/><path d="M-14 -18 L8 24 L-26 -10Z M28 -18 L8 24 L40 -10Z" fill="${shade(o.shirt, 0.7)}"/>${[60, 110, 160].map((y) => `<circle cx="10" cy="${y}" r="2.6" fill="#e8d6a0"/>`).join('')}`;
        default: return `<path d="M-16 -18 C-2 8 18 8 30 -18" fill="url(#${id}-skin)"/><path d="M-16 -18 C-2 8 18 8 30 -18" stroke="${shade(o.shirt, 0.7)}" stroke-width="3" fill="none"/>`;
      }
    }
    update() {
      if (!this.alive) return;
      const L = this.hands.L, R = this.hands.R;
      this.armR.set({ x: 66, y: 4 }, R);
      this.armL.set({ x: -60, y: 12 }, L);
      this.setHandTransform(this.handR, R);
      this.setHandTransform(this.handL, L);
      if (this.watch) this.watch.setAttribute('transform', `translate(${L.x.toFixed(1)} ${L.y.toFixed(1)}) rotate(${L.rot.toFixed(1)})`);
      this.headG.setAttribute('transform', `translate(${this.head.dx.toFixed(2)} 0) rotate(${this.head.rot.toFixed(2)} 4 -40)`);
      this.chipEls.forEach((c, i) => {
        const p = this.chipState[i];
        c.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
    }
    chipOrder() {
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
      this.react('think');
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
        const order = [0, 3, 1, 4, 2, 5];
        await Promise.all(this.chipState.map((p, i) => U.tween(p, { x: 237, y: base - order.indexOf(i) * 6 }, 260, 'inOut')));
        this.chipOrder();
        CS.Audio.play('chip', 4);
        await U.tween(this.hands.L, { x: 232, y: 128 }, 120);
        await Promise.all(this.chipState.map((p, i) => {
          const pos = order.indexOf(i);
          return U.tween(p, { x: pos % 2 ? B : A, y: base - Math.floor(pos / 2) * 6 }, 240, 'inOut');
        }));
        const ns = [], nEl = [];
        order.forEach((ci, pos) => { const k = pos % 2 ? 3 + Math.floor(pos / 2) : Math.floor(pos / 2); ns[k] = this.chipState[ci]; nEl[k] = this.chipEls[ci]; });
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
    async gesture(kind) {
      this.busy = true;
      try {
        if (kind === 'tap') {
          await this.moveHand('L', { x: 210, y: 112, s: 1.05 }, 160, 'out');
          CS.Audio.play('knock');
          await this.moveHand('L', { x: 210, y: 120, s: 1 }, 100, 'in');
          await this.moveHand('L', { x: 212, y: 112 }, 100);
          await this.moveHand('L', { x: 212, y: 120 }, 100);
        } else if (kind === 'wave') {
          await this.moveHand('L', { x: 220, y: 110, rot: -20 }, 180);
          await this.moveHand('L', { x: 200, y: 110, rot: 10 }, 180);
          await this.moveHand('L', { x: 220, y: 110, rot: -20 }, 180);
        } else if (kind === 'push') {
          await this.moveHand('L', { x: 250, y: 120, rot: 0 }, 300);
        } else if (kind === 'fold') {
          this.react('sad');
          await this.moveHand('R', { x: 236, y: 40, rot: -20 }, 260);
        }
        await this.restHands(320);
      } finally { this.busy = false; }
    }
  }
  Rig.NPC = NPC;

  // ======================= CRUPIER (vista frontal) =======================
  function hairFrontDealer(o, cx, hy, id) {
    const f = `url(#${id}-hair)`;
    const shine = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".22" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    if (o.hairStyle === 'slick') return `<path d="M${cx - 44} ${hy - 4} C${cx - 50} ${hy - 58} ${cx - 18} ${hy - 72} ${cx + 6} ${hy - 70} C${cx + 36} ${hy - 68} ${cx + 52} ${hy - 50} ${cx + 44} ${hy - 4} C${cx + 40} ${hy - 30} ${cx + 30} ${hy - 44} ${cx + 4} ${hy - 46} C${cx - 14} ${hy - 50} ${cx - 30} ${hy - 44} ${cx - 40} ${hy - 26} Z" fill="${f}"/>
      <path d="M${cx - 14} ${hy - 68} C${cx - 18} ${hy - 58} ${cx - 20} ${hy - 50} ${cx - 18} ${hy - 46}" stroke="#000" stroke-opacity=".35" stroke-width="1.6" fill="none"/>${shine(`M${cx - 10} ${hy - 64} C${cx + 10} ${hy - 68} ${cx + 30} ${hy - 62} ${cx + 40} ${hy - 46}`)}${shine(`M${cx - 36} ${hy - 44} C${cx - 32} ${hy - 58} ${cx - 24} ${hy - 64} ${cx - 18} ${hy - 66}`)}`;
    if (o.hairStyle === 'ponytail') return `<path d="M${cx - 46} ${hy + 10} C${cx - 52} ${hy - 58} ${cx - 20} ${hy - 72} ${cx} ${hy - 70} C${cx + 22} ${hy - 72} ${cx + 52} ${hy - 58} ${cx + 46} ${hy + 10} C${cx + 42} ${hy - 22} ${cx + 30} ${hy - 44} ${cx + 2} ${hy - 50} C${cx - 28} ${hy - 44} ${cx - 42} ${hy - 22} ${cx - 46} ${hy + 10} Z" fill="${f}"/>
      <path d="M${cx + 1} ${hy - 70} L${cx + 2} ${hy - 50}" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>${shine(`M${cx - 30} ${hy - 50} C${cx - 22} ${hy - 62} ${cx - 10} ${hy - 66} ${cx - 2} ${hy - 66}`)}${shine(`M${cx + 30} ${hy - 50} C${cx + 22} ${hy - 62} ${cx + 10} ${hy - 66} ${cx + 4} ${hy - 66}`)}`;
    return `<path d="M${cx - 44} ${hy - 4} C${cx - 50} ${hy - 58} ${cx - 20} ${hy - 74} ${cx + 2} ${hy - 72} C${cx + 30} ${hy - 72} ${cx + 52} ${hy - 54} ${cx + 44} ${hy - 4} C${cx + 40} ${hy - 30} ${cx + 30} ${hy - 42} ${cx + 12} ${hy - 44} C${cx} ${hy - 38} ${cx - 16} ${hy - 40} ${cx - 26} ${hy - 44} C${cx - 36} ${hy - 36} ${cx - 40} ${hy - 22} ${cx - 44} ${hy - 4} Z" fill="${f}"/>${shine(`M${cx - 24} ${hy - 62} C${cx - 6} ${hy - 70} ${cx + 18} ${hy - 68} ${cx + 32} ${hy - 56}`)}`;
  }
  function hairBackDealer(o, cx, hy, id) {
    if (o.hairStyle === 'ponytail') return `<path d="M${cx + 30} ${hy - 50} C${cx + 76} ${hy - 40} ${cx + 74} ${hy + 30} ${cx + 60} ${hy + 72} C${cx + 54} ${hy + 80} ${cx + 46} ${hy + 74} ${cx + 48} ${hy + 64} C${cx + 58} ${hy + 30} ${cx + 56} ${hy - 10} ${cx + 30} ${hy - 30} Z" fill="url(#${id}-hair)"/><rect x="${cx + 40}" y="${hy - 40}" width="12" height="9" rx="3" fill="#a3303e" transform="rotate(30 ${cx + 46} ${hy - 36})"/>`;
    return '';
  }

  class Dealer extends Person {
    constructor(under, over, o, cx, tableTop) {
      super(o);
      this.cx = cx; this.top = tableTop;
      this.sy = tableTop - 68;
      this.bodyG = U.svg('g', { class: 'dealer-body' }, under);
      this.armsG = U.svg('g', { class: 'dealer-arms' }, over);
      this.groups = [this.bodyG, this.armsG];
      this.handScale = 1.12;
      this.build();
      const hy = tableTop + 46;
      this.rest = { L: { x: cx - 128, y: hy, rot: 96 }, R: { x: cx + 128, y: hy, rot: 84 } };
      this.hands = { L: Object.assign({ s: 1 }, this.rest.L), R: Object.assign({ s: 1 }, this.rest.R) };
      this._tick = (t) => this.update(t);
      U.Ticker.fns.add(this._tick);
      this.scheduleIdle(3000);
      this.scheduleBlink();
    }
    build() {
      const o = this.o, cx = this.cx, sy = this.sy, id = this.uid;
      const skin = o.skin, out = shade(skin, 0.55);
      const hy = sy - 92; // centro de la cabeza
      const base = o.outfit === 'tux' ? o.jacket : o.shirt;
      const iris = o.eyes || '#3a2414';
      let details = '';
      if (o.outfit === 'tux') {
        details = `<path d="M${cx - 34} ${sy - 26} L${cx} ${sy + 74} L${cx + 34} ${sy - 26} Z" fill="${o.shirt}"/>
          <path d="M${cx - 34} ${sy - 26} L${cx} ${sy + 74} L${cx - 10} ${sy - 26}Z" fill="#000" opacity=".06"/>
          ${[18, 36, 54].map((d) => `<circle cx="${cx}" cy="${sy + d}" r="2.2" fill="#1a1a1a"/>`).join('')}
          <path d="M${cx - 34} ${sy - 26} L${cx - 4} ${sy + 70} L${cx - 22} ${sy + 20} L${cx - 58} ${sy - 18} Z" fill="#202026"/>
          <path d="M${cx + 34} ${sy - 26} L${cx + 4} ${sy + 70} L${cx + 22} ${sy + 20} L${cx + 58} ${sy - 18} Z" fill="#202026"/>
          <path d="M${cx - 40} ${sy - 22} L${cx - 10} ${sy + 56}" stroke="#fff" stroke-opacity=".22" stroke-width="2.4"/><path d="M${cx + 40} ${sy - 22} L${cx + 10} ${sy + 56}" stroke="#fff" stroke-opacity=".22" stroke-width="2.4"/>
          <path d="M${cx - 22} ${sy - 22} C${cx - 20} ${sy - 12} ${cx - 20} ${sy - 4} ${cx - 22} ${sy + 2} L${cx - 4} ${sy - 8} L${cx + 4} ${sy - 8} L${cx + 22} ${sy + 2} C${cx + 20} ${sy - 4} ${cx + 20} ${sy - 12} ${cx + 22} ${sy - 22} L${cx + 4} ${sy - 14} L${cx - 4} ${sy - 14} Z" fill="#0a0a0c"/>
          <rect x="${cx - 5}" y="${sy - 15}" width="10" height="9" rx="2" fill="#141416"/><path d="M${cx - 18} ${sy - 18} L${cx - 8} ${sy - 12}" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>
          <path d="M${cx - 92} ${sy + 32} L${cx - 66} ${sy + 28} L${cx - 66} ${sy + 34} L${cx - 92} ${sy + 38}Z" fill="#f4f4f0" opacity=".9"/><path d="M${cx - 84} ${sy + 28} L${cx - 80} ${sy + 20} L${cx - 76} ${sy + 28}" fill="#b0102c"/>
          <rect x="${cx + 52}" y="${sy + 12}" width="42" height="14" rx="2" fill="url(#${id}-gold)"/><text x="${cx + 73}" y="${sy + 22.5}" font-size="8" text-anchor="middle" font-family="Arial" font-weight="700" fill="#2a1a00">${o.name.toUpperCase()}</text>`;
      } else if (o.outfit === 'vest') {
        details = `<path d="M${cx - 18} ${sy - 28} L${cx} ${sy - 6} L${cx + 18} ${sy - 28} L${cx + 26} ${sy - 18} L${cx} ${sy + 4} L${cx - 26} ${sy - 18}Z" fill="#fff"/>
          <path d="M${cx - 6} ${sy - 12} L${cx + 6} ${sy - 12} L${cx + 9} ${sy + 52} L${cx} ${sy + 62} L${cx - 9} ${sy + 52}Z" fill="#7a1022"/><path d="M${cx - 6} ${sy - 12} L${cx + 6} ${sy - 12} L${cx + 4} ${sy - 2} L${cx - 4} ${sy - 2}Z" fill="#5a0a18"/><path d="M${cx + 2} ${sy} L${cx + 5} ${sy + 48}" stroke="#fff" stroke-opacity=".2" stroke-width="1.6"/>
          <path d="M${cx - 82} ${sy - 10} L${cx - 28} ${sy - 26} L${cx} ${sy + 60} L${cx + 28} ${sy - 26} L${cx + 82} ${sy - 10} L${cx + 88} ${sy + 200} L${cx - 88} ${sy + 200} Z" fill="url(#${id}-vest)"/>
          <path d="M${cx - 28} ${sy - 26} L${cx} ${sy + 60} L${cx + 28} ${sy - 26}" stroke="#4a4a56" stroke-width="2" fill="none"/>
          ${[78, 100, 122].map((d) => `<circle cx="${cx + 8}" cy="${sy + d}" r="2.4" fill="#c9b27a"/>`).join('')}
          <path d="M${cx - 60} ${sy + 84} L${cx - 30} ${sy + 82}" stroke="#555" stroke-width="2"/><path d="M${cx - 46} ${sy + 82} C${cx - 40} ${sy + 92} ${cx - 30} ${sy + 94} ${cx - 20} ${sy + 92}" stroke="#d8c48a" stroke-width="1.4" fill="none"/>
          <rect x="${cx - 76}" y="${sy + 14}" width="36" height="12" rx="2" fill="#eee"/><text x="${cx - 58}" y="${sy + 23}" font-size="7" text-anchor="middle" font-family="Arial" font-weight="700" fill="#333">${o.name.toUpperCase()}</text>`;
      } else {
        details = `<path d="M${cx - 30} ${sy - 28} C${cx - 16} ${sy - 4} ${cx + 16} ${sy - 4} ${cx + 30} ${sy - 28}" fill="url(#${id}-skin)"/><path d="M${cx - 30} ${sy - 28} C${cx - 16} ${sy - 4} ${cx + 16} ${sy - 4} ${cx + 30} ${sy - 28}" stroke="#18191b" stroke-width="4" fill="none"/>
          <path d="M${cx + 28} ${sy - 32} C${cx + 70} ${sy - 36} ${cx + 92} ${sy - 18} ${cx + 98} ${sy + 6} L${cx + 86} ${sy + 56} C${cx + 78} ${sy + 18} ${cx + 60} ${sy - 4} ${cx + 30} ${sy - 12}Z" fill="#ece6d6"/>
          <path d="M${cx + 40} ${sy - 24} L${cx + 90} ${sy + 4} M${cx + 36} ${sy - 16} L${cx + 86} ${sy + 18} M${cx + 34} ${sy - 30} L${cx + 92} ${sy - 10}" stroke="#b64" stroke-width="2" opacity=".55"/>
          <path d="M${cx + 30} ${sy - 12} C${cx + 60} ${sy - 4} ${cx + 78} ${sy + 18} ${cx + 86} ${sy + 56}" stroke="#000" stroke-opacity=".15" stroke-width="3" fill="none"/>
          <text x="${cx - 46}" y="${sy + 56}" font-size="15" font-family="'Permanent Marker', cursive" fill="#9a9a9a" opacity=".55">BAR</text>`;
      }
      const earD = (s) => `M${cx + s * 40} ${hy - 12} C${cx + s * 54} ${hy - 20} ${cx + s * 56} ${hy + 6} ${cx + s * 46} ${hy + 14} C${cx + s * 42} ${hy + 16} ${cx + s * 40} ${hy + 12} ${cx + s * 40} ${hy + 8}`;
      const beardF = o.beard === 'full' ? `<path d="M${cx - 42} ${hy + 0} C${cx - 42} ${hy + 40} ${cx - 20} ${hy + 64} ${cx} ${hy + 66} C${cx + 20} ${hy + 64} ${cx + 42} ${hy + 40} ${cx + 42} ${hy + 0} C${cx + 36} ${hy + 22} ${cx + 24} ${hy + 28} ${cx + 14} ${hy + 25} C${cx + 6} ${hy + 22} ${cx - 6} ${hy + 22} ${cx - 14} ${hy + 25} C${cx - 24} ${hy + 28} ${cx - 36} ${hy + 22} ${cx - 42} ${hy + 0} Z" fill="url(#${id}-hair)"/>
        <path d="M${cx - 16} ${hy + 24} C${cx - 8} ${hy + 19} ${cx + 8} ${hy + 19} ${cx + 16} ${hy + 24} C${cx + 8} ${hy + 27} ${cx - 8} ${hy + 27} ${cx - 16} ${hy + 24}Z" fill="${o.hair}"/>
        <path d="M${cx - 24} ${hy + 44} C${cx - 12} ${hy + 54} ${cx + 12} ${hy + 54} ${cx + 24} ${hy + 44}" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/>` : '';
      const headD = `M${cx - 42} ${hy - 10} C${cx - 44} ${hy - 50} ${cx - 24} ${hy - 62} ${cx} ${hy - 62} C${cx + 24} ${hy - 62} ${cx + 44} ${hy - 50} ${cx + 42} ${hy - 10} C${cx + 42} ${hy + 14} ${cx + 32} ${hy + 40} ${cx} ${hy + 50} C${cx - 32} ${hy + 40} ${cx - 42} ${hy + 14} ${cx - 42} ${hy - 10} Z`;
      this.bodyG.innerHTML = `
        ${defs(id, o, base, true)}
        <defs><linearGradient id="${id}-vest" x1="0" x2="1"><stop offset="0" stop-color="${shade(o.vest || '#333', 0.6)}"/><stop offset=".5" stop-color="${o.vest || '#333'}"/><stop offset="1" stop-color="${shade(o.vest || '#333', 0.6)}"/></linearGradient>
        <linearGradient id="${id}-gold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff0b3"/><stop offset=".5" stop-color="#d9b45a"/><stop offset="1" stop-color="#a8761f"/></linearGradient></defs>
        ${hairBackDealer(o, cx, hy, id)}
        <path d="M${cx - 17} ${sy - 54} L${cx + 17} ${sy - 54} L${cx + 19} ${sy - 20} L${cx - 19} ${sy - 20} Z" fill="url(#${id}-skin)"/>
        <path d="M${cx - 17} ${sy - 46} C${cx - 6} ${sy - 36} ${cx + 6} ${sy - 36} ${cx + 17} ${sy - 46} L${cx + 17} ${sy - 36} C${cx + 6} ${sy - 28} ${cx - 6} ${sy - 28} ${cx - 17} ${sy - 36}Z" fill="#000" opacity=".22"/>
        <path d="M${cx - 110} ${sy + 16} C${cx - 114} ${sy - 16} ${cx - 76} ${sy - 30} ${cx - 50} ${sy - 30} L${cx + 50} ${sy - 30} C${cx + 76} ${sy - 30} ${cx + 114} ${sy - 16} ${cx + 110} ${sy + 16} L${cx + 120} ${sy + 200} L${cx - 120} ${sy + 200} Z" fill="url(#${id}-cloth)"/>
        <path d="M${cx - 110} ${sy + 16} C${cx - 114} ${sy - 16} ${cx - 76} ${sy - 30} ${cx - 50} ${sy - 30}" stroke="${Rig.rim}" stroke-width="3.5" fill="none" opacity=".5"/>
        <path d="M${cx + 110} ${sy + 16} C${cx + 114} ${sy - 16} ${cx + 76} ${sy - 30} ${cx + 50} ${sy - 30}" stroke="${Rig.rim}" stroke-width="3.5" fill="none" opacity=".5"/>
        <path d="M${cx - 70} ${sy + 60} C${cx - 60} ${sy + 90} ${cx - 56} ${sy + 130} ${cx - 58} ${sy + 200} M${cx + 70} ${sy + 60} C${cx + 60} ${sy + 90} ${cx + 56} ${sy + 130} ${cx + 58} ${sy + 200}" stroke="#000" stroke-opacity=".14" stroke-width="2.4" fill="none"/>
        ${details}
        <g class="dealer-head">
          <path d="${earD(-1)}" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1"/><path d="${earD(1)}" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1"/>
          <path d="${headD}" fill="url(#${id}-skin)" stroke="${out}" stroke-width="1.1"/>
          <path d="M${cx - 42} ${hy - 10} C${cx - 44} ${hy - 40} ${cx - 34} ${hy - 54} ${cx - 20} ${hy - 60}" stroke="${Rig.rim}" stroke-width="3.5" fill="none" opacity=".45" stroke-linecap="round"/>
          <path d="M${cx + 42} ${hy - 10} C${cx + 44} ${hy - 40} ${cx + 34} ${hy - 54} ${cx + 20} ${hy - 60}" stroke="${Rig.rim}" stroke-width="3.5" fill="none" opacity=".45" stroke-linecap="round"/>
          <ellipse cx="${cx - 22}" cy="${hy + 16}" rx="9" ry="5" fill="#e4746a" opacity=".14"/><ellipse cx="${cx + 22}" cy="${hy + 16}" rx="9" ry="5" fill="#e4746a" opacity=".14"/>
          <g class="eyes-g">${eye(id, 0, cx - 16, hy - 2, 7, 4.2, iris, 0)}${eye(id, 1, cx + 16, hy - 2, 7, 4.2, iris, 0)}</g>
          <g class="brows-g"><path d="M${cx - 26} ${hy - 13} C${cx - 20} ${hy - 18} ${cx - 12} ${hy - 18} ${cx - 6} ${hy - 14}" stroke="${shade(o.hair, 0.9)}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
          <path d="M${cx + 26} ${hy - 13} C${cx + 20} ${hy - 18} ${cx + 12} ${hy - 18} ${cx + 6} ${hy - 14}" stroke="${shade(o.hair, 0.9)}" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>
          <path d="M${cx - 2} ${hy - 4} C${cx - 3} ${hy + 6} ${cx - 8} ${hy + 12} ${cx - 7} ${hy + 16} C${cx - 3} ${hy + 20} ${cx + 3} ${hy + 20} ${cx + 7} ${hy + 16}" stroke="${out}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M${cx + 2} ${hy - 2} C${cx + 6} ${hy + 6} ${cx + 8} ${hy + 10} ${cx + 7} ${hy + 15}" stroke="#000" stroke-opacity=".08" stroke-width="5" fill="none"/>
          ${o.lips ? `<path d="M${cx - 11} ${hy + 30} C${cx - 5} ${hy + 26} ${cx - 2} ${hy + 27} ${cx} ${hy + 28} C${cx + 2} ${hy + 27} ${cx + 5} ${hy + 26} ${cx + 11} ${hy + 30} C${cx + 5} ${hy + 35} ${cx - 5} ${hy + 35} ${cx - 11} ${hy + 30}Z" fill="${o.lips}"/>` : ''}
          ${beardF}
          <path class="mouth" d="M${cx - 11} ${hy + 30} C${cx - 4} ${hy + 33} ${cx + 4} ${hy + 33} ${cx + 11} ${hy + 30}" stroke="${o.lips ? shade(o.lips, 0.7) : shade(skin, 0.5)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          ${hairFrontDealer(o, cx, hy, id)}
        </g>`;
      this.eyesG = this.bodyG.querySelector('.eyes-g');
      this.browsG = this.bodyG.querySelector('.brows-g');
      this.mouth = this.bodyG.querySelector('.mouth');
      this.mouthShapes = {
        neutral: `M${cx - 11} ${hy + 30} C${cx - 4} ${hy + 33} ${cx + 4} ${hy + 33} ${cx + 11} ${hy + 30}`,
        happy: `M${cx - 12} ${hy + 28} C${cx - 5} ${hy + 37} ${cx + 5} ${hy + 37} ${cx + 12} ${hy + 28}`,
        sad: `M${cx - 10} ${hy + 33} C${cx - 4} ${hy + 29} ${cx + 4} ${hy + 29} ${cx + 10} ${hy + 33}`,
        think: `M${cx - 8} ${hy + 31} C${cx - 3} ${hy + 31} ${cx + 3} ${hy + 31} ${cx + 8} ${hy + 31}`,
      };
      // brazos (capa superior, por encima de la mesa)
      const limb = skin;
      const sleeve = o.outfit === 'tux' ? o.jacket : o.shirt;
      this.arms = {};
      ['L', 'R'].forEach((k) => {
        const g = U.svg('g', {}, this.armsG);
        const cfg = { w1: 36, w2: 28, a: 74, b: 80, sign: k === 'L' ? 1 : -1, hlx: k === 'L' ? -6 : 6, hly: -3, outline: shade(sleeve, o.outfit === 'tux' ? 1 : 0.6) };
        if (o.outfit === 'tux') Object.assign(cfg, { upper: o.jacket, fore: o.jacket, cuff: '#f4f4f0', outline: '#000' });
        else if (o.outfit === 'vest') Object.assign(cfg, { upper: o.shirt, fore: limb, roll: '#f1ede4', outline: shade(o.shirt, 0.65) });
        else Object.assign(cfg, { upper: limb, fore: limb, shortSleeve: o.shirt, outline: shade(skin, 0.5) });
        const arm = new Arm(g, cfg);
        const hand = U.svg('g', { class: 'hand dealer-hand' }, g);
        hand.innerHTML = handSVG(id, skin, k === 'L' ? -1 : 1);
        let link = null;
        if (o.outfit === 'tux') link = U.svg('circle', { r: 3.2, fill: '#e2bf66', stroke: '#8a6420', 'stroke-width': 1 }, g);
        this.arms[k] = { arm, hand, link };
      });
    }
    update() {
      if (!this.alive) return;
      const cx = this.cx, sy = this.sy;
      ['L', 'R'].forEach((k) => {
        const h = this.hands[k];
        const S = { x: k === 'L' ? cx - 90 : cx + 90, y: sy + 2 };
        const a = this.arms[k];
        a.arm.set(S, h);
        this.setHandTransform(a.hand, h);
        if (a.link) { const p = lerpP(a.arm.E, h, 0.88); a.link.setAttribute('cx', p.x.toFixed(1)); a.link.setAttribute('cy', p.y.toFixed(1)); }
      });
    }
    scheduleIdle(ms) {
      if (!this.alive) return;
      this.timer = setTimeout(async () => {
        try {
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
        } catch (e) { if (e !== U.ABORT) console.error(e); }
        this.scheduleIdle(U.rand(4000, 8000));
      }, ms);
    }
    async dealGesture(from, to) {
      this.busy = true;
      const h = to.x < this.cx - 60 ? 'L' : 'R';
      const src = from || { x: this.cx + 220, y: this.top + 70 };
      await this.moveHand(h, { x: src.x - (h === 'L' ? -20 : 30), y: src.y, rot: h === 'L' ? 100 : 80 }, 120);
      const mx = U.lerp(src.x, to.x, 0.35), my = U.lerp(src.y, to.y, 0.35);
      await this.moveHand(h, { x: mx, y: Math.min(my, this.top + 240), rot: h === 'L' ? 110 : 70 }, 170, 'out');
      this.moveHand(h, this.rest[h], 300).then(() => { this.busy = false; }, () => {});
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
