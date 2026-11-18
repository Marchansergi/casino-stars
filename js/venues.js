/* Casino Stars — locales (dificultades), fondos ambientados y mesas */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const V = (CS.Venues = {});

  V.LIST = {
    easy: {
      id: 'easy', diff: 'Fácil', name: 'El Tugurio', tagline: 'Bar de mala muerte',
      desc: 'Mesa de madera rayada, fichas de plástico y una baraja que ha visto demasiadas noches. Apuestas bajas y rivales despistados.',
      deck: 'worn', chip: 'plastic', table: 'wood',
      denoms: [1, 5, 10, 25, 50], minBet: 2, maxBet: 250,
      bj: { decks: 1, h17: false, doubleRule: 'any', hints: true, label: '1 baraja · Se planta en 17 · Consejos activados' },
      bac: { decks: 6, commission: false, sides: false, squeeze: false, label: 'Sin comisión · La banca gana con 6 → paga 1:2' },
      poker: { sb: 5, bb: 10, buyin: 500, seats: [1, 2], ai: 'fish', label: '2 rivales · Juego flojo y predecible' },
    },
    normal: {
      id: 'normal', diff: 'Normal', name: 'Velvet Lounge', tagline: 'Bar de copas',
      desc: 'Tapete de fieltro, barra iluminada y un crupier con chaleco. Cuidado, aquí la gente ya sabe lo que hace.',
      deck: 'classic', chip: 'clay', table: 'felt',
      denoms: [5, 25, 100, 500], minBet: 10, maxBet: 1000,
      bj: { decks: 4, h17: false, doubleRule: 'any', hints: false, label: '4 barajas · Se planta en 17' },
      bac: { decks: 8, commission: true, sides: true, squeeze: false, label: 'Comisión 5% en banca · Apuestas a pareja' },
      poker: { sb: 10, bb: 20, buyin: 1000, seats: [0, 1, 2], ai: 'regular', label: '3 rivales · Jugadores sólidos' },
    },
    hard: {
      id: 'hard', diff: 'Difícil', name: 'Royal Stars Vegas', tagline: 'Casino de Las Vegas',
      desc: 'Luces, moqueta, mesas profesionales y un crupier de traje con su maletín de fichas. Las apuestas mínimas duelen y los rivales no perdonan.',
      deck: 'casino', chip: 'pro', table: 'pro',
      denoms: [25, 100, 500, 1000, 5000], minBet: 50, maxBet: 10000,
      bj: { decks: 6, h17: true, doubleRule: '9-11', hints: false, label: '6 barajas · Pide con 17 suave · Doblar solo 9-11' },
      bac: { decks: 8, commission: true, sides: true, squeeze: true, label: 'Comisión 5% · Parejas · Squeeze de cartas' },
      poker: { sb: 25, bb: 50, buyin: 2000, seats: [0, 1, 2, 3], ai: 'shark', label: '4 rivales · Profesionales que farolean' },
    },
  };

  // --------------------------------------------------------------------
  //  FONDOS
  // --------------------------------------------------------------------
  function bottles(x0, y0, n, palette, h = 70, seed = 1) {
    let s = '';
    let x = x0;
    for (let i = 0; i < n; i++) {
      const w = U.randi(16, 24), hh = h * U.rand(0.75, 1.05), col = U.pick(palette);
      const neck = w * 0.36;
      const top = y0 - hh;
      s += `<g opacity=".95">
        <path d="M${x} ${y0} L${x} ${top + hh * 0.42} Q${x} ${top + hh * 0.3} ${x + w / 2 - neck / 2} ${top + hh * 0.22} L${x + w / 2 - neck / 2} ${top + 4} L${x + w / 2 + neck / 2} ${top + 4} L${x + w / 2 + neck / 2} ${top + hh * 0.22} Q${x + w} ${top + hh * 0.3} ${x + w} ${top + hh * 0.42} L${x + w} ${y0} Z" fill="${col}"/>
        <rect x="${x + w / 2 - neck / 2 - 1}" y="${top}" width="${neck + 2}" height="6" fill="#222" opacity=".8"/>
        <rect x="${x + 2}" y="${top + hh * 0.5}" width="${w - 4}" height="${hh * 0.25}" fill="#f2e6c8" opacity=".55"/>
        <rect x="${x + 3}" y="${top + hh * 0.35}" width="3" height="${hh * 0.55}" fill="#fff" opacity=".25"/>
      </g>`;
      x += w + U.randi(4, 10);
    }
    return s;
  }

  function bgEasy() {
    let dark = '';
    for (let i = 0; i < 90; i++) {
      const row = U.randi(0, 18), col = U.randi(0, 14);
      const x = col * 120 + (row % 2 ? 60 : 0), y = row * 50;
      dark += `<rect x="${x + 2}" y="${y + 2}" width="116" height="46" rx="2" fill="${Math.random() < 0.3 ? '#a0583a' : '#000'}" opacity="${U.rand(0.06, 0.28).toFixed(2)}"/>`;
    }
    let smoke = '';
    for (let i = 0; i < 7; i++) smoke += `<ellipse class="smoke" style="animation-delay:${-i * 3.1}s;--sx:${U.randi(-120, 120)}px" cx="${U.randi(150, 1450)}" cy="${U.randi(300, 700)}" rx="${U.randi(120, 260)}" ry="${U.randi(40, 90)}" fill="#cfc6b8" opacity=".05" filter="url(#blurBig)"/>`;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" class="bgsvg">
      <defs>
        <pattern id="brick" width="120" height="100" patternUnits="userSpaceOnUse">
          <rect width="120" height="100" fill="#2b140d"/>
          <rect x="2" y="2" width="116" height="46" rx="2" fill="#7b3b28"/>
          <rect x="-58" y="52" width="116" height="46" rx="2" fill="#6d3322"/>
          <rect x="62" y="52" width="116" height="46" rx="2" fill="#743723"/>
        </pattern>
        <radialGradient id="bulbLight" cx="560" cy="60" r="980" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset=".3" stop-color="#ff9e48" stop-opacity=".16"/><stop offset=".75" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
        <filter id="neon" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="blurBig"><feGaussianBlur stdDeviation="30"/></filter>
        <linearGradient id="plank" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#3a2414"/></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#brick)"/>
      ${dark}
      <rect width="1600" height="900" fill="#150a05" opacity=".42"/>
      <!-- tuberías -->
      <rect x="0" y="22" width="1600" height="10" fill="#3b3b3b"/><rect x="0" y="22" width="1600" height="3" fill="#6d6d6d"/>
      <rect x="1540" y="0" width="12" height="900" fill="#353535"/>
      <!-- cartel de neón CERVEZA -->
      <g class="neon-flicker" filter="url(#neon)">
        <text x="250" y="145" font-family="Monoton, 'Arial Black', sans-serif" font-size="46" fill="none" stroke="#ff3d5a" stroke-width="3" text-anchor="middle" letter-spacing="3">CERVEZA</text>
        <path d="M180 170 L360 170" stroke="#ff3d5a" stroke-width="3"/>
      </g>
      <g class="neon-flicker2" filter="url(#neon)">
        <text x="1330" y="125" font-family="Monoton, 'Arial Black', sans-serif" font-size="50" fill="none" stroke="#41c9ff" stroke-width="3" text-anchor="middle">BAR</text>
        <text x="1330" y="160" font-family="'Arial Black', sans-serif" font-size="16" fill="#ffe34d" text-anchor="middle" letter-spacing="6">ABIERTO 24H</text>
      </g>
      <!-- placa de madera -->
      <g transform="translate(-60 -20) rotate(-3 520 120)">
        <rect x="430" y="80" width="190" height="80" rx="6" fill="#6b4425" stroke="#2c1a0c" stroke-width="4"/>
        <rect x="438" y="88" width="174" height="64" rx="3" fill="none" stroke="#8a5b33" stroke-width="2"/>
        <text x="525" y="114" font-family="'Permanent Marker', cursive" font-size="19" fill="#f1e3c3" text-anchor="middle">HOY NO SE FÍA</text>
        <text x="525" y="140" font-family="'Permanent Marker', cursive" font-size="17" fill="#f1e3c3" text-anchor="middle">MAÑANA SÍ</text>
        <circle cx="525" cy="72" r="3" fill="#999"/><path d="M445 82 L525 72 L605 82" stroke="#222" fill="none"/>
      </g>
      <!-- diana -->
      <g transform="translate(1488 178) scale(.72)">
        <circle r="64" fill="#1a1a1a"/><circle r="56" fill="#efe2c2"/>
        ${Array.from({ length: 20 }, (_, i) => `<path d="M0 0 L${56 * Math.cos((i * 18 - 9) * Math.PI / 180)} ${56 * Math.sin((i * 18 - 9) * Math.PI / 180)} A56 56 0 0 1 ${56 * Math.cos((i * 18 + 9) * Math.PI / 180)} ${56 * Math.sin((i * 18 + 9) * Math.PI / 180)} Z" fill="${i % 2 ? '#1b1b1b' : '#e8dcc0'}"/>`).join('')}
        <circle r="56" fill="none" stroke="#b2232b" stroke-width="7"/><circle r="34" fill="none" stroke="#1f7a3a" stroke-width="5"/>
        <circle r="7" fill="#1f7a3a"/><circle r="3" fill="#b2232b"/>
        <path d="M14 -18 L40 -48" stroke="#999" stroke-width="2"/><path d="M38 -46 L48 -56" stroke="#d33" stroke-width="5"/>
      </g>
      <!-- estantería con botellas -->
      <rect x="1030" y="235" width="470" height="12" fill="url(#plank)"/><rect x="1030" y="247" width="470" height="5" fill="#1d1008" opacity=".7"/>
      ${bottles(1045, 235, 14, ['#2f4a1f', '#4a2c10', '#1f3a2a', '#5e3b12', '#2a2a2a'], 72)}
      <rect x="1030" y="150" width="190" height="10" fill="url(#plank)"/>
      ${bottles(1040, 150, 5, ['#3d2a12', '#24401f', '#6b4a14'], 60)}
      <!-- luz de la bombilla -->
      <rect width="1600" height="900" fill="url(#bulbLight)"/>
      <g class="lamp-swing" style="transform-origin:560px 0px">
        <line x1="560" y1="0" x2="560" y2="150" stroke="#111" stroke-width="3"/>
        <path d="M530 150 L590 150 L612 176 L508 176 Z" fill="#2d4a35"/><path d="M530 150 L590 150 L594 156 L526 156Z" fill="#4c7a5a"/>
        <ellipse cx="560" cy="180" rx="15" ry="9" fill="#fff4c9"/><ellipse cx="560" cy="186" rx="130" ry="50" fill="#ffdd99" opacity=".22" filter="url(#blurBig)"/>
      </g>
      ${smoke}
      <rect width="1600" height="900" fill="url(#vig)"/>
    </svg>`;
  }

  function bgNormal() {
    let bokeh = '';
    const cols = ['#ffb35c', '#ff7a59', '#ffd27a', '#c97bff', '#ff9ec2'];
    for (let i = 0; i < 26; i++) bokeh += `<circle class="bokeh" style="animation-delay:${(-Math.random() * 6).toFixed(2)}s" cx="${U.randi(0, 1600)}" cy="${U.randi(20, 420)}" r="${U.randi(10, 34)}" fill="${U.pick(cols)}" opacity=".16" filter="url(#soft)"/>`;
    const shelf = (y) => `<rect x="470" y="${y}" width="660" height="6" fill="#d8c7a0" opacity=".55"/><rect x="470" y="${y + 6}" width="660" height="3" fill="#000" opacity=".4"/>`;
    const glass = ['#c47a1e', '#e0a43a', '#7fae4a', '#3c8fa8', '#d9d4c5', '#9c2f2f', '#d3b04a', '#5b3a8a'];
    let panels = '';
    for (let x = 0; x < 1600; x += 80) panels += `<rect x="${x}" y="0" width="78" height="900" fill="${x % 160 ? '#2a170e' : '#2f1a10'}"/><rect x="${x + 78}" y="0" width="2" height="900" fill="#140a05"/>`;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" class="bgsvg">
      <defs>
        <linearGradient id="backlight" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".6" stop-color="#c8641e"/><stop offset="1" stop-color="#4a1f0a"/></linearGradient>
        <radialGradient id="bkGlow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
        <linearGradient id="curtain" x1="0" x2="1"><stop offset="0" stop-color="#3a0712"/><stop offset=".25" stop-color="#6b1022"/><stop offset=".5" stop-color="#3a0712"/><stop offset=".75" stop-color="#5e0d1d"/><stop offset="1" stop-color="#2a050d"/></linearGradient>
        <linearGradient id="cone" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd58a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="neon2" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="vig2" cx="50%" cy="40%" r="75%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
      </defs>
      ${panels}
      <rect width="1600" height="900" fill="#0d0604" opacity=".35"/>
      <!-- barra retroiluminada -->
      <rect x="440" y="30" width="720" height="250" rx="6" fill="#1a0d07"/>
      <rect x="460" y="45" width="680" height="225" fill="url(#backlight)" opacity=".9"/>
      <rect x="460" y="45" width="680" height="225" fill="url(#bkGlow)"/>
      ${shelf(110)}${bottles(480, 110, 22, glass, 58)}
      ${shelf(190)}${bottles(478, 190, 22, glass, 64)}
      ${shelf(262)}${bottles(482, 262, 21, glass, 60)}
      <rect x="440" y="30" width="720" height="250" rx="6" fill="none" stroke="#7a5326" stroke-width="6"/>
      <!-- lámparas colgantes -->
      ${[250, 1350].map((x) => `<g class="pendant" style="transform-origin:${x}px 0"><line x1="${x}" y1="0" x2="${x}" y2="70" stroke="#0a0a0a" stroke-width="2"/>
        <path d="M${x - 30} 100 Q${x} 60 ${x + 30} 100 Z" fill="#b8862c"/><ellipse cx="${x}" cy="100" rx="30" ry="6" fill="#ffe2a0"/>
        <path d="M${x - 30} 100 L${x - 170} 520 L${x + 170} 520 L${x + 30} 100 Z" fill="url(#cone)"/></g>`).join('')}
      <!-- neón cursiva -->
      <g class="neon-soft" filter="url(#neon2)">
        <text x="230" y="230" font-family="'Great Vibes', 'Brush Script MT', cursive" font-size="74" fill="none" stroke="#ff7fd1" stroke-width="2.4" text-anchor="middle">Velvet</text>
      </g>
      <g class="neon-soft" filter="url(#neon2)" style="animation-delay:-1.4s">
        <text x="1365" y="230" font-family="'Great Vibes', 'Brush Script MT', cursive" font-size="56" fill="none" stroke="#7fe3ff" stroke-width="2.2" text-anchor="middle">cocktails</text>
      </g>
      ${bokeh}
      <!-- cortinas -->
      <path d="M0 0 L120 0 Q90 300 140 900 L0 900 Z" fill="url(#curtain)"/>
      <path d="M1600 0 L1480 0 Q1510 300 1460 900 L1600 900 Z" fill="url(#curtain)"/>
      <rect width="1600" height="900" fill="url(#vig2)"/>
    </svg>`;
  }

  function bgHard() {
    let slots = '';
    const scr = ['#3cf', '#f3c', '#fc3', '#6f6', '#f63', '#9cf'];
    const row = (x0, x1, y, h, scale) => {
      let s = '';
      for (let x = x0; x < x1; x += 92 * scale) {
        const c = U.pick(scr);
        s += `<g>
          <rect x="${x}" y="${y}" width="${84 * scale}" height="${h}" rx="${8 * scale}" fill="#1c0f24" stroke="#5a3a6e" stroke-width="2"/>
          <rect x="${x + 10 * scale}" y="${y + 12 * scale}" width="${64 * scale}" height="${40 * scale}" rx="4" fill="${c}" opacity=".85" class="slot-screen" style="animation-delay:${(-Math.random() * 3).toFixed(2)}s"/>
          <rect x="${x + 10 * scale}" y="${y + 60 * scale}" width="${64 * scale}" height="${26 * scale}" rx="3" fill="#0a0510"/>
          ${[0, 1, 2].map((k) => `<rect x="${x + (14 + k * 20) * scale}" y="${y + 63 * scale}" width="${16 * scale}" height="${20 * scale}" fill="#f4f0e6"/>`).join('')}
          <circle cx="${x + 42 * scale}" cy="${y - 8 * scale}" r="${7 * scale}" fill="${c}" class="slot-top" style="animation-delay:${(-Math.random() * 2).toFixed(2)}s"/>
        </g>`;
      }
      return s;
    };
    slots += row(-20, 520, 210, 150, 1);
    slots += row(1080, 1620, 210, 150, 1);
    let bokeh = '';
    const bc = ['#ff3df2', '#3dd6ff', '#ffd23d', '#ff5a3d', '#7a5cff', '#fff3b0'];
    for (let i = 0; i < 40; i++) bokeh += `<circle class="bokeh" style="animation-delay:${(-Math.random() * 6).toFixed(2)}s" cx="${U.randi(0, 1600)}" cy="${U.randi(0, 520)}" r="${U.randi(8, 30)}" fill="${U.pick(bc)}" opacity=".2" filter="url(#soft3)"/>`;
    // bombillas de marquesina
    let bulbs = '';
    const rx = 150, ry = 40, rw = 380, rh = 140;
    let k = 0;
    for (let x = rx; x <= rx + rw; x += 19) { bulbs += `<circle cx="${x}" cy="${ry}" r="5" class="bulb b${k++ % 3}"/><circle cx="${x}" cy="${ry + rh}" r="5" class="bulb b${k++ % 3}"/>`; }
    for (let y = ry + 19; y < ry + rh; y += 19) { bulbs += `<circle cx="${rx}" cy="${y}" r="5" class="bulb b${k++ % 3}"/><circle cx="${rx + rw}" cy="${y}" r="5" class="bulb b${k++ % 3}"/>`; }
    let chand = '';
    for (const cx of [380, 800, 1220]) {
      for (let i = 0; i < 18; i++) chand += `<circle cx="${cx + U.randi(-60, 60)}" cy="${U.randi(-10, 30)}" r="${U.rand(1.5, 3.5).toFixed(1)}" fill="#fff6d0" class="twinkle" style="animation-delay:${(-Math.random() * 3).toFixed(2)}s"/>`;
      chand += `<ellipse cx="${cx}" cy="10" rx="200" ry="70" fill="#ffe7a8" opacity=".14" filter="url(#soft3)"/>`;
    }
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" class="bgsvg">
      <defs>
        <linearGradient id="vbg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#14051f"/><stop offset=".55" stop-color="#2b0a24"/><stop offset="1" stop-color="#12030c"/></linearGradient>
        <linearGradient id="gold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff0b3"/><stop offset=".45" stop-color="#e0b54e"/><stop offset=".55" stop-color="#b8862c"/><stop offset="1" stop-color="#ffe9a0"/></linearGradient>
        <linearGradient id="pillar" x1="0" x2="1"><stop offset="0" stop-color="#3b0c1c"/><stop offset=".5" stop-color="#7a1c33"/><stop offset="1" stop-color="#3b0c1c"/></linearGradient>
        <pattern id="carpet" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#3a0a1a"/><circle cx="40" cy="40" r="18" fill="none" stroke="#c29a3a" stroke-width="3" opacity=".5"/><path d="M0 0 L80 80 M80 0 L0 80" stroke="#1f6a6a" stroke-width="3" opacity=".4"/></pattern>
        <filter id="soft3"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id="glow3" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="vig3" cx="50%" cy="40%" r="80%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
        <radialGradient id="spot" cx="800" cy="0" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff1c8" stop-opacity=".25"/><stop offset="1" stop-color="#fff1c8" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#vbg)"/>
      <rect y="560" width="1600" height="340" fill="url(#carpet)" opacity=".8"/>
      ${chand}
      <!-- columnas -->
      <rect x="600" y="0" width="70" height="900" fill="url(#pillar)"/><rect x="600" y="0" width="70" height="8" fill="url(#gold)"/><rect x="594" y="200" width="82" height="10" fill="url(#gold)"/>
      <rect x="930" y="0" width="70" height="900" fill="url(#pillar)"/><rect x="924" y="200" width="82" height="10" fill="url(#gold)"/>
      <rect x="670" y="40" width="260" height="190" fill="#1a0614"/>
      <path d="M670 40 L930 40 L930 230 L670 230Z" fill="none" stroke="url(#gold)" stroke-width="4"/>
      <text x="800" y="215" font-family="'Playfair Display', Georgia, serif" font-size="13" fill="#e8c46a" text-anchor="middle" letter-spacing="5" opacity=".8">HIGH LIMIT</text>
      ${slots}
      <!-- marquesina -->
      <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="10" fill="#22071a" stroke="url(#gold)" stroke-width="5"/>
      ${bulbs}
      <g filter="url(#glow3)">
        <text x="${rx + rw / 2}" y="${ry + 72}" font-family="'Playfair Display', Georgia, serif" font-weight="900" font-size="52" fill="url(#gold)" text-anchor="middle" letter-spacing="3">ROYAL ★</text>
        <text x="${rx + rw / 2}" y="${ry + 118}" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="36" fill="#ff4fa3" text-anchor="middle" letter-spacing="10">STARS</text>
      </g>
      <g filter="url(#glow3)" class="neon-soft">
        <path d="M1280 60 l14 32 l35 3 l-27 22 l9 34 l-31 -19 l-31 19 l9 -34 l-27 -22 l35 -3z" fill="none" stroke="#ffd23d" stroke-width="3"/>
        <text x="1290" y="190" font-family="'Arial Black', sans-serif" font-size="22" fill="#3dd6ff" text-anchor="middle" letter-spacing="4">LAS VEGAS</text>
      </g>
      ${bokeh}
      <rect width="1600" height="900" fill="url(#spot)"/>
      <rect width="1600" height="900" fill="url(#vig3)"/>
    </svg>`;
  }

  V.bgHTML = (id) => (id === 'easy' ? bgEasy() : id === 'normal' ? bgNormal() : bgHard());
  V.buildBackground = (container, id) => {
    container.innerHTML = '';
    container.className = 'bg bg-' + id;
    container.innerHTML = id === 'easy' ? bgEasy() : id === 'normal' ? bgNormal() : bgHard();
  };

  // --------------------------------------------------------------------
  //  MESAS
  // --------------------------------------------------------------------
  // Geometría común (coordenadas de escenario 1600x900)
  V.GEO = {
    semi: { top: 250, cx: 800, cy: 250, rx: 710, ry: 650 },
    oval: { top: 236, cx: 800, cy: 560, rx: 610, ry: 326 },
  };

  function printColor(v) { return v.id === 'hard' ? '#e2bf66' : v.id === 'normal' ? 'rgba(245,235,210,.82)' : 'rgba(250,246,235,.75)'; }
  function printFont(v) { return v.id === 'easy' ? "'Permanent Marker', cursive" : v.id === 'hard' ? "'Playfair Display', Georgia, serif" : "'Cinzel', Georgia, serif"; }

  function blackjackPrint(v) {
    const c = printColor(v), f = printFont(v);
    const rule = v.bj.h17 ? 'EL CRUPIER PIDE CON 17 SUAVE' : 'EL CRUPIER SE PLANTA EN TODOS LOS 17';
    const chalk = v.id === 'easy' ? ' class="chalk"' : '';
    return `
      <path id="arc1" d="M470 300 A330 170 0 0 0 1130 300" fill="none"/>
      <path id="arc2" d="M448 300 A352 192 0 0 0 1152 300" fill="none"/>
      <g${chalk}>
      <text font-family="${f}" font-size="${v.id === 'easy' ? 30 : 30}" fill="${c}" letter-spacing="${v.id === 'easy' ? 2 : 4}" text-anchor="middle"><textPath href="#arc1" startOffset="50%">BLACKJACK PAGA 3 A 2</textPath></text>
      <text font-family="${f}" font-size="14" fill="${c}" letter-spacing="3" text-anchor="middle" opacity=".9"><textPath href="#arc2" startOffset="50%">${rule}</textPath></text>
      ${v.id !== 'easy' ? `<path d="M420 300 A380 222 0 0 0 1180 300" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>
      <path d="M396 300 A404 248 0 0 0 1204 300" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>
      <path id="arc4" d="M408 300 A392 240 0 0 0 1192 300" fill="none"/>
      <text font-family="${f}" font-size="12" fill="${c}" letter-spacing="6" text-anchor="middle"><textPath href="#arc4" startOffset="50%">SEGURO PAGA 2 A 1</textPath></text>` : ''}
      ${[[800, 748], [470, 662], [1130, 662]].map(([x, y]) => v.id === 'easy'
        ? `<circle cx="${x}" cy="${y}" r="50" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="40 6 22 5" opacity=".75"/>`
        : `<circle cx="${x}" cy="${y}" r="52" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="45" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/>`).join('')}
      </g>`;
  }

  function baccaratPrint(v) {
    const c = printColor(v), f = printFont(v);
    const chalk = v.id === 'easy' ? ' class="chalk"' : '';
    return `<g${chalk}>
      <text x="800" y="470" font-family="${f}" font-size="${v.id === 'easy' ? 46 : 50}" fill="${c}" text-anchor="middle" letter-spacing="12" opacity=".55">BACCARAT</text>
      <text x="800" y="498" font-family="${f}" font-size="13" fill="${c}" text-anchor="middle" letter-spacing="4" opacity=".7">${v.bac.commission ? 'LA BANCA PAGA 0,95 A 1 · EMPATE PAGA 8 A 1' : 'SIN COMISIÓN · BANCA GANA CON 6 PAGA 1 A 2 · EMPATE 8 A 1'}</text>
      <rect x="430" y="282" width="320" height="160" rx="14" fill="none" stroke="#5aa7ff" stroke-width="2.5" opacity=".75"/>
      <rect x="850" y="282" width="320" height="160" rx="14" fill="none" stroke="#ff6767" stroke-width="2.5" opacity=".75"/>
      <text x="590" y="436" font-family="${f}" font-size="16" fill="#9cc9ff" text-anchor="middle" letter-spacing="6">JUGADOR</text>
      <text x="1010" y="436" font-family="${f}" font-size="16" fill="#ffa0a0" text-anchor="middle" letter-spacing="6">BANCA</text>
    </g>`;
  }

  function pokerPrint(v) {
    const c = printColor(v), f = printFont(v);
    const g = V.GEO.oval;
    const chalk = v.id === 'easy' ? ' class="chalk"' : '';
    return `<g${chalk}>
      ${v.id !== 'easy' ? `<ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx - 130}" ry="${g.ry - 95}" fill="none" stroke="${c}" stroke-width="2" opacity=".45"/>` : ''}
      <text x="800" y="${g.cy + 115}" font-family="${f}" font-size="${v.id === 'easy' ? 30 : 30}" fill="${c}" text-anchor="middle" letter-spacing="10" opacity=".4">TEXAS HOLD'EM</text>
      ${v.id === 'hard' ? `<text x="800" y="${g.cy + 140}" font-family="${f}" font-size="12" fill="${c}" text-anchor="middle" letter-spacing="8" opacity=".55">★ ROYAL STARS · LAS VEGAS ★</text>` : ''}
    </g>`;
  }

  function props(v, game) {
    if (v.id === 'easy') {
      // botellín de cerveza, cenicero con colilla humeante, mancha de vaso
      const bx = game === 'poker' ? 1300 : 1395, by = game === 'poker' ? 330 : 345;
      return `
        <ellipse cx="300" cy="830" rx="44" ry="40" fill="none" stroke="#2a1608" stroke-width="5" opacity=".35"/>
        <ellipse cx="1180" cy="800" rx="38" ry="34" fill="none" stroke="#2a1608" stroke-width="4" opacity=".3"/>
        <g transform="translate(${bx} ${by})">
          <ellipse cx="0" cy="40" rx="26" ry="9" fill="#000" opacity=".35"/>
          <path d="M-14 40 L-14 -10 Q-14 -24 -6 -32 L-6 -58 L6 -58 L6 -32 Q14 -24 14 -10 L14 40 Z" fill="#4a2c0b"/>
          <rect x="-12" y="0" width="24" height="22" fill="#e9d9a8"/><text x="0" y="16" font-size="9" text-anchor="middle" fill="#7a1010" font-family="Arial Black">ESTRELLA</text>
          <rect x="-9" y="-40" width="3" height="70" fill="#fff" opacity=".22"/>
        </g>
        <g transform="translate(${game === 'poker' ? 300 : 205} ${game === 'poker' ? 330 : 345})">
          <ellipse cx="0" cy="8" rx="38" ry="15" fill="#000" opacity=".35"/>
          <ellipse cx="0" cy="0" rx="36" ry="14" fill="#8c9297"/><ellipse cx="0" cy="-2" rx="27" ry="9" fill="#3c3f42"/>
          <rect x="8" y="-6" width="36" height="5" rx="2" fill="#efe9dc" transform="rotate(-12 8 -6)"/><circle cx="43" cy="-14" r="3" fill="#ff7a2a" class="ember"/>
          <path class="cig-smoke" d="M43 -18 q-8 -18 4 -34 q10 -16 -2 -34" stroke="#ddd" stroke-width="5" fill="none" opacity=".25"/>
        </g>`;
    }
    if (v.id === 'normal') {
      return `<g transform="translate(${game === 'poker' ? 1290 : 1395} ${game === 'poker' ? 330 : 350})">
          <ellipse cx="0" cy="38" rx="22" ry="7" fill="#000" opacity=".35"/>
          <path d="M-26 -30 L26 -30 L3 0 L3 34 L14 38 L-14 38 L-3 34 L-3 0 Z" fill="#cfe9f5" opacity=".45" stroke="#fff" stroke-opacity=".6"/>
          <path d="M-20 -24 L20 -24 L2 -4 L-2 -4 Z" fill="#d4364a" opacity=".85"/><circle cx="12" cy="-28" r="5" fill="#c40d2f"/><path d="M12 -32 q4 -8 10 -10" stroke="#3a6b2a" stroke-width="2" fill="none"/>
        </g>`;
    }
    return '';
  }

  function tray(v, x, y, w) {
    const el = U.el('div', 'chip-tray tray-' + v.id);
    el.style.left = x - w / 2 + 'px';
    el.style.top = y + 'px';
    el.style.width = w + 'px';
    const denoms = v.denoms.slice().reverse();
    const n = v.id === 'easy' ? 7 : 10;
    for (let i = 0; i < n; i++) {
      const d = denoms[Math.min(denoms.length - 1, Math.floor(i / (n / denoms.length)))];
      const col = CS.Chips.COLORS[d];
      const c = U.el('div', 'tray-col', el);
      c.style.setProperty('--c', col.c);
      c.style.setProperty('--d', CS.Chips.shade(col.c, 0.6));
      c.style.setProperty('--e', col.e);
      c.style.height = (v.id === 'easy' ? U.randi(55, 85) : U.randi(80, 96)) + '%';
    }
    return el;
  }

  // Construye la mesa y devuelve puntos de referencia (zapato, descartes...)
  V.buildTable = (container, game, v) => {
    container.innerHTML = '';
    container.className = 'table-layer';
    const shape = game === 'poker' ? 'oval' : v.id === 'easy' ? 'rect' : 'semi';
    const t = U.el('div', `table shape-${shape} t-${v.id}`, container);
    U.el('div', 'rail', t);
    const felt = U.el('div', 'felt', t);
    U.el('div', 'felt-sheen', felt);
    if (v.id === 'hard') U.el('div', 'felt-logo', felt);
    if (v.id === 'easy') { U.el('div', 'wood-scratches', felt); }
    const print = game === 'blackjack' ? blackjackPrint(v) : game === 'baccarat' ? baccaratPrint(v) : pokerPrint(v);
    container.insertAdjacentHTML('beforeend', `<svg class="table-print" viewBox="0 0 1600 900">${print}${props(v, game)}</svg>`);

    const geo = { shape };
    if (game === 'poker') {
      geo.dealerTop = V.GEO.oval.top;
      geo.shoe = null;
      container.appendChild(tray(v, 800, 250, 230));
      geo.deckPos = { x: 960, y: 330 };
      geo.muck = { x: 640, y: 335 };
    } else {
      geo.dealerTop = 250;
      container.appendChild(tray(v, 800, 256, v.id === 'easy' ? 240 : 330));
      if (v.id === 'easy') {
        geo.deckPos = { x: 1075, y: 318 };
        geo.shoe = null;
      } else {
        const shoe = U.el('div', 'shoe shoe-' + v.id, container);
        shoe.style.left = '1110px'; shoe.style.top = '262px';
        U.el('div', 'shoe-mouth', shoe);
        geo.shoe = { x: 1150, y: 318 };
        geo.deckPos = { x: 1150, y: 318 };
        geo.shoeEl = shoe;
      }
      const discard = U.el('div', 'discard discard-' + v.id, container);
      const dx = game === 'baccarat' ? 250 : 388;
      discard.style.left = dx + 'px'; discard.style.top = '268px';
      geo.discard = { x: dx + 56, y: 316 };
      geo.discardEl = discard;
    }
    if (v.id === 'hard') {
      // maletín de fichas del crupier
      const bc = U.el('div', 'briefcase', container);
      const bx = game === 'poker' ? 1145 : 1290, by = game === 'poker' ? 290 : 268;
      bc.style.left = bx + 'px'; bc.style.top = by + 'px';
      bc.innerHTML = `<div class="bc-lid"><div class="bc-lid-inner"></div></div><div class="bc-base">${
        [5000, 1000, 500, 100, 25].map((d) => `<div class="bc-row" style="--c:${CS.Chips.COLORS[d].c};--e:${CS.Chips.COLORS[d].e};--d:${CS.Chips.shade(CS.Chips.COLORS[d].c, .55)}"></div>`).join('')
      }</div><div class="bc-handle"></div>`;
      geo.briefcase = { x: bx + 70, y: by + 40 };
    }
    return geo;
  };
})();
