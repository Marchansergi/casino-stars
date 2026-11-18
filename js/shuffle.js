/* Casino Stars — barajados del crupier: riffle, strip, box, overhand, lavado (wash) y corte */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U, Cards = CS.Cards;
  const Sh = (CS.Shuffle = {});
  const N = 30;

  function tfp(x, y, rot) { return Cards.tf({ x, y, rot }); }
  function moveTo(c, x, y, rot, dur, easing) {
    const from = c._pos;
    c._pos = { x, y, rot };
    return U.anim(c, [{ transform: Cards.tf(from) }, { transform: tfp(x, y, rot) }], { duration: dur, easing: easing || 'cubic-bezier(.3,.7,.3,1)' });
  }
  function movePile(pile, x, y, rot, dur, spread = 0.55) {
    return Promise.all(pile.map((c, i) => { c.style.zIndex = 100 + i; return moveTo(c, x + i * 0.12, y - i * spread, rot, dur); }));
  }

  // ---------- técnicas ----------
  async function riffle(ctx, sloppy) {
    const { dealer: d, cx, cy } = ctx;
    let pile = ctx.pile;
    const half = Math.floor(pile.length / 2) + (sloppy ? U.randi(-3, 3) : U.randi(-1, 1));
    const bottom = pile.slice(0, half), top = pile.slice(half);
    // cortar en dos mitades
    await Promise.all([
      d.moveHand('L', { x: cx - 30, y: cy + 6, rot: 10 }, 220), d.moveHand('R', { x: cx + 30, y: cy + 6, rot: 170 }, 220),
    ]);
    await Promise.all([
      movePile(top, cx - 115, cy, -6, 280), movePile(bottom, cx + 115, cy, 6, 280),
      d.moveHand('L', { x: cx - 165, y: cy + 12, rot: 15 }, 280), d.moveHand('R', { x: cx + 165, y: cy + 12, rot: 165 }, 280),
    ]);
    // inclinar y acercar las esquinas
    await Promise.all([
      movePile(top, cx - 64, cy - 2, -20, 200), movePile(bottom, cx + 64, cy - 2, 20, 200),
      d.moveHand('L', { x: cx - 112, y: cy + 8, rot: 30 }, 200), d.moveHand('R', { x: cx + 112, y: cy + 8, rot: 150 }, 200),
    ]);
    // soltar las cartas intercaladas desde abajo
    CS.Audio.play('riffle', 0.75 * U.speed);
    const merged = [];
    let li = 0, ri = 0;
    const jobs = [];
    while (li < top.length || ri < bottom.length) {
      const fromLeft = ri >= bottom.length || (li < top.length && (merged.length % 2 === 0 ? Math.random() < 0.75 : Math.random() < 0.3));
      const c = fromLeft ? top[li++] : bottom[ri++];
      const k = merged.length;
      merged.push(c);
      c.style.zIndex = 300 + k;
      const jitter = sloppy ? 7 : 2.5;
      jobs.push(moveTo(c, cx + U.rand(-jitter, jitter), cy - k * 0.55, U.rand(-jitter, jitter), 90, 'ease-out'));
      await U.sleep(sloppy ? 26 : 20);
    }
    await Promise.all(jobs);
    // cuadrar la baraja con las palmas
    await Promise.all([
      d.moveHand('L', { x: cx - 62, y: cy + 4, rot: 0 }, 160), d.moveHand('R', { x: cx + 62, y: cy + 4, rot: 180 }, 160),
      movePile(merged, cx, cy, 0, 160),
    ]);
    if (!sloppy) {
      // puente (bridge): la baraja se arquea y cae
      await Promise.all(merged.map((c, i) => U.anim(c, [{ transform: Cards.tf(c._pos) }, { transform: Cards.tf(c._pos, 1.0) + ' translateY(-6px)' }, { transform: Cards.tf(c._pos) }], { duration: 260, delay: i * 4 })));
      CS.Audio.play('riffle', 0.3 * U.speed);
    }
    ctx.pile = merged;
  }

  async function strip(ctx, packets = 4, side = 1, label) {
    const { dealer: d, cx, cy } = ctx;
    let pile = ctx.pile;
    const out = [];
    const hk = side > 0 ? 'R' : 'L';
    const tx = cx + side * 140;
    for (let p = 0; p < packets; p++) {
      const take = p === packets - 1 ? pile.length : Math.max(3, Math.round(pile.length / (packets - p)) + U.randi(-2, 2));
      const pk = pile.splice(pile.length - take, take);
      await d.moveHand(hk, { x: cx + side * 20, y: cy - 6, rot: side > 0 ? 160 : 20 }, 140);
      const base = out.length;
      await Promise.all([
        ...pk.map((c, i) => { c.style.zIndex = 500 + base + i + p * 2; return moveTo(c, tx + U.rand(-2, 2), cy - (base + i) * 0.55, U.rand(-2, 2), 190); }),
        d.moveHand(hk, { x: tx + side * 10, y: cy - 4 }, 190),
      ]);
      CS.Audio.play('packet');
      out.push(...pk);
    }
    // nuevo orden: los paquetes quedan invertidos
    ctx.pile = out;
    await Promise.all([movePile(out, cx, cy, 0, 260), d.moveHand(hk, { x: cx + side * 62, y: cy + 4, rot: side > 0 ? 180 : 0 }, 260)]);
  }

  async function overhand(ctx) {
    const { dealer: d, cx, cy } = ctx;
    const pile = ctx.pile;
    const out = [];
    await Promise.all([movePile(pile, cx - 70, cy, -8, 220), d.moveHand('L', { x: cx - 120, y: cy + 10, rot: 20 }, 220)]);
    while (pile.length) {
      const take = Math.min(pile.length, U.randi(3, 6));
      const pk = pile.splice(pile.length - take, take);
      await d.moveHand('R', { x: cx - 50, y: cy - 10, rot: 150 }, 110);
      const base = out.length;
      await Promise.all([
        ...pk.map((c, i) => { c.style.zIndex = 600 + base + i; return moveTo(c, cx + 70 + U.rand(-5, 5), cy - (base + i) * 0.55, U.rand(-6, 6), 150); }),
        d.moveHand('R', { x: cx + 110, y: cy, rot: 160 }, 150),
      ]);
      CS.Audio.play('packet');
    }
    ctx.pile = out; // los paquetes caen encima: el orden queda invertido por bloques
    await Promise.all([movePile(ctx.pile, cx, cy, 0, 220), d.restHands(260)]);
  }

  async function wash(ctx) {
    const { dealer: d, cx, cy } = ctx;
    const pile = ctx.pile;
    await Promise.all(pile.map((c, i) => moveTo(c, cx + U.rand(-170, 170), cy + U.rand(-40, 70), U.rand(-90, 90), 360 + i * 6)));
    CS.Audio.play('whoosh');
    for (let loop = 0; loop < 2; loop++) {
      const steps = 8;
      const jobs = [];
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        jobs.push(Promise.all([
          d.moveHand('L', { x: cx - 70 + Math.cos(a) * 70, y: cy + 20 + Math.sin(a) * 40, rot: 40 }, 80, 'linear'),
          d.moveHand('R', { x: cx + 70 - Math.cos(a) * 70, y: cy + 20 - Math.sin(a) * 40, rot: 140 }, 80, 'linear'),
        ]));
        await jobs[jobs.length - 1];
        // empujar algunas cartas
        for (let k = 0; k < 4; k++) {
          const c = U.pick(pile);
          moveTo(c, U.clamp(c._pos.x + U.rand(-40, 40), cx - 190, cx + 190), U.clamp(c._pos.y + U.rand(-25, 25), cy - 50, cy + 80), c._pos.rot + U.rand(-50, 50), 160);
        }
        if (s % 2 === 0) CS.Audio.play('packet');
      }
    }
    U.shuffle(pile);
    await Promise.all([movePile(pile, cx, cy, 0, 420), d.moveHand('L', { x: cx - 62, y: cy + 4, rot: 0 }, 420), d.moveHand('R', { x: cx + 62, y: cy + 4, rot: 180 }, 420)]);
  }

  async function cut(ctx, useCutCard) {
    const { dealer: d, cx, cy, layer } = ctx;
    const pile = ctx.pile;
    const at = Math.floor(pile.length * U.rand(0.35, 0.65));
    let cc = null;
    if (useCutCard) {
      cc = U.el('div', 'cut-card', layer);
      cc.style.zIndex = 100 + at;
      cc._pos = { x: cx, y: cy + 160, rot: 0 };
      cc.style.transform = Cards.tf(cc._pos);
      await moveTo(cc, cx, cy - at * 0.55 + 18, 0, 380);
      CS.Audio.play('packet');
      await U.sleep(160);
    }
    const top = pile.slice(at), bottom = pile.slice(0, at);
    await Promise.all([d.moveHand('R', { x: cx + 40, y: cy, rot: 170 }, 160)]);
    await Promise.all([movePile(top, cx + 130, cy + 10, 0, 240), d.moveHand('R', { x: cx + 160, y: cy + 10 }, 240)]);
    await Promise.all([movePile(bottom, cx, cy, 0, 120)]);
    ctx.pile = top.concat([]);
    // la parte de abajo va encima
    const np = top.concat(bottom);
    np.forEach((c, i) => { c.style.zIndex = 100 + i; });
    await Promise.all([
      ...bottom.map((c, i) => moveTo(c, cx + 130, cy + 10 - (top.length + i) * 0.55, 0, 260)),
      d.moveHand('L', { x: cx + 70, y: cy + 4, rot: 10 }, 260),
    ]);
    CS.Audio.play('packet');
    ctx.pile = np;
    await Promise.all([movePile(np, cx, cy, 0, 240), d.moveHand('L', { x: cx - 62, y: cy + 4, rot: 0 }, 240), d.moveHand('R', { x: cx + 62, y: cy + 4, rot: 180 }, 240)]);
    if (cc) {
      cc.style.zIndex = 99;
      await moveTo(cc, cx, cy + 30, 0, 200);
      ctx.cutCard = cc;
    }
  }

  const NAMES = { riffle: 'Riffle shuffle', strip: 'Strip (cortes en paquetes)', box: 'Box shuffle', overhand: 'Barajado overhand', wash: 'Lavado (wash / chemmy)', cut: 'Corte', cutcard: 'Corte con carta de corte', sloppy: 'Riffle a la brava' };

  // Secuencias según local
  Sh.sequence = (venueId, kind) => {
    if (kind === 'quick') {
      if (venueId === 'easy') return ['overhand', 'sloppy', 'cut'];
      if (venueId === 'normal') return ['riffle', 'strip', 'riffle', 'cut'];
      return ['riffle', 'riffle', 'box', 'riffle', 'cut'];
    }
    if (venueId === 'easy') return ['overhand', 'sloppy', 'overhand', 'cut'];
    if (venueId === 'normal') return ['riffle', 'riffle', 'strip', 'riffle', 'cutcard'];
    return (kind === 'first' ? ['wash'] : []).concat(['riffle', 'riffle', 'strip', 'riffle', 'box', 'riffle', 'cutcard']);
  };

  // Ejecuta el barajado completo. Devuelve cuando la baraja ha llegado al zapato/posición.
  Sh.run = async (scene, kind = 'full') => {
    const { dealer, venue, objects, geo } = scene;
    dealer.busy = true;
    const cx = 800, cy = scene.game === 'poker' ? 400 : 395;
    const layer = U.el('div', 'shuffle-layer', objects);
    // recoger baraja de su sitio
    const src = geo.deckPos;
    const pile = [];
    for (let i = 0; i < N; i++) {
      const c = Cards.create(null, venue.deck, layer);
      c.classList.add('shuf');
      Cards.setPos(c, src.x, src.y - i * 0.55, geo.shoe ? -10 : 0);
      c.style.zIndex = 100 + i;
      pile.push(c);
    }
    if (scene.deckStackEl) scene.deckStackEl.style.visibility = 'hidden';
    const ctx = { dealer, cx, cy, pile, layer };
    await Promise.all([movePile(pile, cx, cy, 0, 520), dealer.moveHand('L', { x: cx - 62, y: cy + 4, rot: 0 }, 500), dealer.moveHand('R', { x: cx + 62, y: cy + 4, rot: 180 }, 500)]);
    const seq = Sh.sequence(venue.id, kind);
    for (const step of seq) {
      scene.caption && scene.caption(NAMES[step]);
      if (step === 'riffle') await riffle(ctx, false);
      else if (step === 'sloppy') await riffle(ctx, true);
      else if (step === 'strip') await strip(ctx, 4, 1);
      else if (step === 'box') await strip(ctx, 3, -1);
      else if (step === 'overhand') await overhand(ctx);
      else if (step === 'wash') await wash(ctx);
      else if (step === 'cut') await cut(ctx, false);
      else if (step === 'cutcard') await cut(ctx, true);
      await U.sleep(90);
    }
    scene.caption && scene.caption('');
    // llevar al zapato o dejar a la derecha del crupier
    const dst = geo.deckPos;
    const pr = [movePile(ctx.pile, dst.x, dst.y, geo.shoe ? -10 : 0, 480), dealer.moveHand('R', { x: dst.x - 40, y: dst.y + 10, rot: 160 }, 480)];
    if (ctx.cutCard) pr.push(moveTo(ctx.cutCard, dst.x, dst.y, -10, 480));
    await Promise.all(pr);
    if (geo.shoe) {
      await Promise.all(ctx.pile.map((c) => U.anim(c, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 })));
    }
    layer.remove();
    if (scene.deckStackEl) scene.deckStackEl.style.visibility = '';
    await dealer.restHands(380);
    dealer.busy = false;
  };
})();
