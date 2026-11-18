/* Casino Stars — evaluador de manos de póker y equity por Monte Carlo */
(function () {
  'use strict';
  const CS = window.CS;
  const E = (CS.PokerEval = {});
  const B = 15;
  const B5 = Math.pow(B, 5);
  E.NAMES = ['Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full', 'Póker', 'Escalera de color'];

  function eval5(c) {
    const rs = [c[0].r, c[1].r, c[2].r, c[3].r, c[4].r].sort((a, b) => b - a);
    const s0 = c[0].s;
    const flush = c[1].s === s0 && c[2].s === s0 && c[3].s === s0 && c[4].s === s0;
    let straight = 0;
    if (rs[0] !== rs[1] && rs[1] !== rs[2] && rs[2] !== rs[3] && rs[3] !== rs[4]) {
      if (rs[0] - rs[4] === 4) straight = rs[0];
      else if (rs[0] === 14 && rs[1] === 5) straight = 5;
    }
    // grupos
    const g = [];
    for (let i = 0; i < 5;) {
      let j = i;
      while (j < 5 && rs[j] === rs[i]) j++;
      g.push([rs[i], j - i]);
      i = j;
    }
    g.sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    let cat, k;
    if (straight && flush) { cat = 8; k = [straight]; }
    else if (g[0][1] === 4) { cat = 7; k = [g[0][0], g[1][0]]; }
    else if (g[0][1] === 3 && g[1][1] === 2) { cat = 6; k = [g[0][0], g[1][0]]; }
    else if (flush) { cat = 5; k = rs; }
    else if (straight) { cat = 4; k = [straight]; }
    else if (g[0][1] === 3) { cat = 3; k = g.map((x) => x[0]); }
    else if (g[0][1] === 2 && g[1][1] === 2) { cat = 2; k = g.map((x) => x[0]); }
    else if (g[0][1] === 2) { cat = 1; k = g.map((x) => x[0]); }
    else { cat = 0; k = rs; }
    let score = cat;
    for (let i = 0; i < 5; i++) score = score * B + (k[i] || 0);
    return score;
  }
  E.eval5 = eval5;

  const COMB = {};
  function combos(n) {
    if (COMB[n]) return COMB[n];
    const out = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) out.push([a, b, c, d, e]);
    return (COMB[n] = out);
  }

  E.best = (cards) => {
    let best = -1, bc = null;
    const cs = combos(cards.length);
    for (const ix of cs) {
      const h = [cards[ix[0]], cards[ix[1]], cards[ix[2]], cards[ix[3]], cards[ix[4]]];
      const sc = eval5(h);
      if (sc > best) { best = sc; bc = h; }
    }
    const cat = Math.floor(best / B5);
    let name = E.NAMES[cat];
    if (cat === 8 && bc.some((c) => c.r === 14) && bc.some((c) => c.r === 13)) name = 'Escalera real';
    return { score: best, cards: bc, cat, name };
  };
  E.score = (cards) => {
    let best = -1;
    for (const ix of combos(cards.length)) {
      const sc = eval5([cards[ix[0]], cards[ix[1]], cards[ix[2]], cards[ix[3]], cards[ix[4]]]);
      if (sc > best) best = sc;
    }
    return best;
  };

  // Probabilidad de ganar contra n rivales con manos aleatorias
  E.equity = (hole, board, nOpp, sims = 200) => {
    const used = new Set([...hole, ...board].map((c) => c.r * 4 + c.s));
    const deck = [];
    for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) if (!used.has(r * 4 + s)) deck.push({ r, s });
    let win = 0;
    const need = 5 - board.length;
    for (let t = 0; t < sims; t++) {
      // barajado parcial
      const take = need + nOpp * 2;
      for (let i = 0; i < take; i++) {
        const j = i + Math.floor(Math.random() * (deck.length - i));
        const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
      }
      const b = board.concat(deck.slice(0, need));
      const me = E.score(hole.concat(b));
      let best = 0, ties = 0, lose = false;
      for (let o = 0; o < nOpp; o++) {
        const os = E.score([deck[need + o * 2], deck[need + o * 2 + 1]].concat(b));
        if (os > me) { lose = true; break; }
        if (os === me) ties++;
      }
      if (!lose) win += ties ? 1 / (ties + 1) : 1;
      best;
    }
    return win / sims;
  };
})();
