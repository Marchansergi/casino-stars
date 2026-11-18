/* Casino Stars — Blackjack */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U, Cards = CS.Cards, Chips = CS.Chips, UI = CS.UI;

  const cardVal = (c) => (c.r === 14 ? 11 : c.r >= 10 ? 10 : c.r);
  function handValue(cards) {
    let t = 0, aces = 0;
    for (const c of cards) { t += cardVal(c); if (c.r === 14) aces++; }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { total: t, soft: aces > 0 && t <= 21 };
  }
  const isBJ = (cards) => cards.length === 2 && handValue(cards).total === 21;

  // Estrategia básica (aprox. multibaraja)
  function basic(cards, up, canDouble, canSplit) {
    const u = cardVal(up);
    const { total, soft } = handValue(cards);
    if (canSplit && cards.length === 2 && cardVal(cards[0]) === cardVal(cards[1])) {
      const v = cardVal(cards[0]);
      if (v === 11 || v === 8) return 'P';
      if (v === 9 && ![7, 10, 11].includes(u)) return 'P';
      if (v === 7 && u <= 7) return 'P';
      if (v === 6 && u <= 6) return 'P';
      if (v === 4 && (u === 5 || u === 6)) return 'P';
      if ((v === 2 || v === 3) && u <= 7) return 'P';
    }
    const D = (alt) => (canDouble ? 'D' : alt);
    if (soft) {
      if (total >= 19) return 'S';
      if (total === 18) return u >= 3 && u <= 6 ? D('S') : u <= 8 ? 'S' : 'H';
      if (total === 17) return u >= 3 && u <= 6 ? D('H') : 'H';
      if (total >= 15) return u >= 4 && u <= 6 ? D('H') : 'H';
      return u >= 5 && u <= 6 ? D('H') : 'H';
    }
    if (total >= 17) return 'S';
    if (total >= 13) return u <= 6 ? 'S' : 'H';
    if (total === 12) return u >= 4 && u <= 6 ? 'S' : 'H';
    if (total === 11) return D('H');
    if (total === 10) return u <= 9 ? D('H') : 'H';
    if (total === 9) return u >= 3 && u <= 6 ? D('H') : 'H';
    return 'H';
  }

  class Blackjack {
    constructor(scene) {
      this.s = scene;
      this.v = scene.venue;
      this.rules = this.v.bj;
      this.shoe = new Cards.Shoe(this.rules.decks, this.rules.decks === 1 ? 0.62 : 0.75);
      this.z = 10;
      this.lastBet = 0;
      this.discardCount = 0;
      const npcs = scene.npcs;
      // orden de juego: a la izquierda del crupier (derecha de la pantalla) primero
      this.seats = [
        { kind: 'npc', npc: npcs[1], bet: { x: 1130, y: 662 }, cards: { x: 1110, y: 540 } },
        { kind: 'human', bet: { x: 800, y: 748 }, cards: { x: 790, y: 612 } },
        { kind: 'npc', npc: npcs[0], bet: { x: 470, y: 662 }, cards: { x: 480, y: 540 } },
      ];
      this.human = this.seats[1];
      this.dealerPos = { x: 760, y: 345 };
      this.tray = { x: 800, y: 272 };
      this.from = scene.geo.deckPos;
      this.alive = true;
    }

    destroy() {
      this.alive = false;
      // en fase de apuestas se devuelven las fichas; con la mano en juego se pierden
      if (this.phase === 'bet' && this.human.stack) { CS.Store.addBank(this.human.stack.amount); this.human.stack.set(0); }
    }
    get inRound() { return this.phase === 'play'; }

    // ----------------- utilidades de mesa -----------------
    cardPos(seat, hi, ci) {
      const nh = seat.hands.length;
      const ox = nh > 1 ? (hi === 0 ? -110 : 110) : 0;
      return { x: seat.cards.x + ox + ci * 26, y: seat.cards.y - ci * 16 };
    }
    async dealCard(pos, faceUp = true, rot = 0) {
      const card = this.shoe.draw();
      const el = Cards.create(card, this.v.deck, this.s.objects);
      Cards.setPos(el, this.from.x, this.from.y, this.s.geo.shoe ? -10 : 0);
      el.style.zIndex = this.z++;
      this.s.dealer.dealGesture(this.from, pos);
      const fly = Cards.flyTo(el, pos.x, pos.y, rot, { dur: 430, arc: 10 });
      if (faceUp) setTimeout(() => Cards.flip(el, true, 300), 170 * U.speed);
      await fly;
      if (faceUp) await U.sleep(140);
      return { card, el };
    }
    label(hand, text, cls) {
      if (!hand.label) hand.label = UI.label(0, 0, '', 'total');
      hand.label.innerHTML = text;
      hand.label.className = 'tlabel total ' + (cls || '');
    }
    placeLabel(hand, pos) {
      if (!hand.label) hand.label = UI.label(0, 0, '', 'total');
      hand.label.style.left = pos.x + 'px';
      hand.label.style.top = pos.y - 96 + 'px';
    }
    totalText(cards) {
      const { total, soft } = handValue(cards);
      if (isBJ(cards)) return 'BJ';
      return soft && total < 21 ? `${total - 10}/${total}` : String(total);
    }
    refreshLabel(seat, hi) {
      const h = seat.hands[hi];
      const last = this.cardPos(seat, hi, h.cards.length - 1);
      this.placeLabel(h, { x: last.x, y: last.y });
      const t = handValue(h.cards).total;
      this.label(h, this.totalText(h.cards), t > 21 ? 'bust' : isBJ(h.cards) ? 'bj' : '');
    }

    // ----------------- bucle principal -----------------
    async run(firstTime) {
      await CS.Scene.shuffle(this.s, 'first');
      while (this.alive) {
        await this.round();
        if (!this.alive) return;
        if (this.shoe.needsShuffle) {
          await UI.toast('Carta de corte: barajando el zapato', 'info', 1200);
          await this.clearDiscard();
          this.shoe.build();
          await CS.Scene.shuffle(this.s, 'full');
        }
      }
    }

    async clearDiscard() {
      const d = this.s.geo.discardEl;
      if (d) { d.classList.add('emptying'); await U.sleep(300); d.style.setProperty('--n', 0); d.classList.remove('emptying', 'has'); }
      this.discardCount = 0;
    }

    async betting() {
      const v = this.v, s = this.s;
      this.phase = 'bet';
      const bar = UI.actions();
      const human = this.human;
      human.stack = human.stack || new Chips.Stack(s.objects, human.bet.x, human.bet.y, v.chip, v.denoms);
      human.stack.el.style.zIndex = 5;
      const msg = U.el('div', 'bet-hint', bar, `Elige ficha y pulsa el círculo · Mín ${U.fmt(v.minBet)} · Máx ${U.fmt(v.maxBet)}`);
      const picker = UI.chipPicker(bar, v);
      const btns = U.el('div', 'btn-row', bar);
      const bClear = UI.button(btns, 'Limpiar', 'btn-ghost', () => { CS.Store.addBank(human.stack.amount); human.stack.set(0); upd(); }, 'C');
      const bRebet = UI.button(btns, 'Repetir', 'btn-ghost', async () => {
        const need = this.lastBet - human.stack.amount;
        if (need > 0 && need <= CS.Store.bank()) { CS.Store.addBank(-need); await Chips.fly(s.objects, { x: 800, y: 900 }, human.bet, need, v.chip, v.denoms, { stagger: 30 }); human.stack.set(this.lastBet); upd(); }
      }, 'R');
      const bX2 = UI.button(btns, 'x2', 'btn-ghost', async () => {
        const need = Math.min(human.stack.amount, v.maxBet - human.stack.amount);
        if (need > 0 && need <= CS.Store.bank()) { CS.Store.addBank(-need); await Chips.fly(s.objects, { x: 800, y: 900 }, human.bet, need, v.chip, v.denoms, { stagger: 30 }); human.stack.add(need); upd(); }
      });
      const bDeal = UI.button(btns, 'Repartir', 'btn-gold', null, ' ');
      const spot = U.el('div', 'bet-spot', s.objects);
      spot.style.left = human.bet.x - 60 + 'px'; spot.style.top = human.bet.y - 60 + 'px';
      const add = async () => {
        const d = picker.value;
        if (d > CS.Store.bank() || human.stack.amount + d > v.maxBet) { CS.Audio.play('lose'); return; }
        CS.Store.addBank(-d);
        human.stack.add(d);
        CS.Audio.play('chip', 2);
        upd();
      };
      spot.onclick = add;
      spot.oncontextmenu = (e) => { e.preventDefault(); bClear.click(); };
      const upd = () => {
        bDeal.disabled = human.stack.amount < v.minBet;
        bClear.disabled = human.stack.amount <= 0;
        bRebet.disabled = !this.lastBet || human.stack.amount >= this.lastBet || this.lastBet - human.stack.amount > CS.Store.bank();
        bX2.disabled = human.stack.amount <= 0 || human.stack.amount > CS.Store.bank();
        picker.refresh(CS.Store.bank());
      };
      upd();
      // apuestas de los NPC
      this.seats.filter((x) => x.kind === 'npc').forEach((seat, i) => {
        const amt = Math.min(v.maxBet, v.minBet * U.pick([1, 1, 2, 2, 3, 5]) * (v.id === 'hard' ? 2 : 1));
        const a = Math.max(v.minBet, Chips.breakdown(amt, v.denoms).reduce((x, y) => x + y, 0));
        seat.stack = seat.stack || new Chips.Stack(s.objects, seat.bet.x, seat.bet.y, v.chip, v.denoms);
        seat.stack.set(0);
        setTimeout(async () => {
          seat.npc.gesture('push');
          await Chips.fly(s.objects, { x: seat.bet.x + (seat.bet.x < 800 ? -110 : 110), y: seat.bet.y + 40 }, seat.bet, a, v.chip, v.denoms, { stagger: 40 });
          seat.stack.set(a);
        }, 300 + i * 500);
      });
      if (CS.Store.bank() + human.stack.amount < v.minBet) {
        await this.broke();
      }
      await new Promise((res) => { bDeal.onclick = () => { if (!bDeal.disabled) { CS.Audio.play('click'); res(); } }; });
      spot.remove();
      bar.innerHTML = '';
      this.phase = 'play';
      this.lastBet = human.stack.amount;
      await U.sleep(400);
    }

    async broke() {
      const r = await UI.modal('Sin fichas', `<p>No te queda saldo para la apuesta mínima de este local.</p><p class="muted">Esto es dinero de juego: el cajero te puede dar otro crédito de ${U.fmt(2000)}.</p>`,
        [{ label: 'Pedir crédito', value: 'credit', cls: 'btn-gold' }, { label: 'Volver al lobby', value: 'lobby', cls: 'btn-ghost' }]);
      if (r === 'credit') CS.Store.addBank(2000);
      else { CS.App.toLobby(); }
    }

    async round() {
      const s = this.s, v = this.v, d = s.dealer;
      this.seats.forEach((st) => { st.hands = []; });
      this.dealer = { cards: [], els: [] };
      await this.betting();
      if (!this.alive) return;
      // crear manos
      this.seats.forEach((st) => {
        st.hands = [{ cards: [], els: [], bet: st.stack.amount, stack: st.stack, done: false }];
      });
      // reparto: dos vueltas
      for (let r = 0; r < 2; r++) {
        for (const st of this.seats) {
          const h = st.hands[0];
          const pos = this.cardPos(st, 0, h.cards.length);
          const { card, el } = await this.dealCard(pos, true);
          h.cards.push(card); h.els.push(el);
          if (r === 1) this.refreshLabel(st, 0);
        }
        const dp = { x: this.dealerPos.x + this.dealer.cards.length * 80, y: this.dealerPos.y };
        const { card, el } = await this.dealCard(dp, r === 0);
        this.dealer.cards.push(card); this.dealer.els.push(el);
      }
      this.dealerLabel = UI.label(this.dealerPos.x - 70, this.dealerPos.y - 20, this.totalText([this.dealer.cards[0]]), 'total dealer-total');
      const up = this.dealer.cards[0];
      // seguro
      let insurance = 0;
      const hb = this.human.hands[0].bet;
      if (up.r === 14) {
        if (CS.Store.bank() >= hb / 2) {
          const take = await this.ask('El crupier muestra un As. ¿Quieres seguro?', [
            { label: `Seguro (${U.fmt(hb / 2)})`, value: true, cls: 'btn-gold', key: 'Y' }, { label: 'No, gracias', value: false, cls: 'btn-ghost', key: 'N' }]);
          if (take) {
            insurance = hb / 2;
            CS.Store.addBank(-insurance);
            this.insStack = new Chips.Stack(s.objects, 800, 480, v.chip, v.denoms);
            await Chips.fly(s.objects, { x: 800, y: 900 }, { x: 800, y: 480 }, insurance, v.chip, v.denoms);
            this.insStack.set(insurance);
          }
        }
      }
      // el crupier mira su carta oculta
      let dealerBJ = false;
      if (up.r === 14 || cardVal(up) === 10) {
        await this.peek();
        dealerBJ = isBJ(this.dealer.cards);
      }
      if (insurance) {
        if (dealerBJ) {
          await UI.toast('El seguro paga 2 a 1', 'win', 900);
          await Chips.fly(s.objects, this.tray, { x: 850, y: 480 }, insurance * 2, v.chip, v.denoms);
          CS.Store.addBank(insurance * 3);
        } else {
          await Chips.fly(s.objects, { x: 800, y: 480 }, this.tray, insurance, v.chip, v.denoms);
        }
        this.insStack.destroy(); this.insStack = null;
      }
      if (dealerBJ) {
        await this.revealHole();
        await UI.toast('Blackjack del crupier', 'lose', 1100);
      } else {
        // turnos
        for (const st of this.seats) {
          for (let hi = 0; hi < st.hands.length; hi++) {
            await this.playHand(st, hi);
            if (!this.alive) return;
          }
        }
        // turno del crupier
        await this.revealHole();
        const live = this.seats.some((st) => st.hands.some((h) => handValue(h.cards).total <= 21 && !(isBJ(h.cards) && st.hands.length === 1)));
        if (live) {
          while (true) {
            const hv = handValue(this.dealer.cards);
            if (hv.total > 21) break;
            if (hv.total > 17) break;
            if (hv.total === 17 && !(hv.soft && this.rules.h17)) break;
            const dp = { x: this.dealerPos.x + this.dealer.cards.length * 80, y: this.dealerPos.y };
            const { card, el } = await this.dealCard(dp, true);
            this.dealer.cards.push(card); this.dealer.els.push(el);
            this.updDealerLabel();
            await U.sleep(250);
          }
        }
      }
      await this.settle(dealerBJ);
      await this.collect();
      this.phase = 'idle';
      CS.Store.data.stats.hands++; CS.Store.save();
    }

    updDealerLabel() {
      const t = handValue(this.dealer.cards).total;
      this.dealerLabel.innerHTML = this.totalText(this.dealer.cards);
      this.dealerLabel.className = 'tlabel total dealer-total ' + (t > 21 ? 'bust' : isBJ(this.dealer.cards) ? 'bj' : '');
    }

    async peek() {
      const d = this.s.dealer, el = this.dealer.els[1];
      await d.reach({ x: el._pos.x + 10, y: el._pos.y + 40 }, 'R', 260);
      await U.anim(el, [{ transform: Cards.tf(el._pos) }, { transform: Cards.tf({ x: el._pos.x, y: el._pos.y - 10, rot: -6 }) }, { transform: Cards.tf(el._pos) }], { duration: 650 });
      await d.home(260);
    }

    async revealHole() {
      const el = this.dealer.els[1];
      if (el.classList.contains('faceup')) return;
      await this.s.dealer.reach({ x: el._pos.x, y: el._pos.y + 30 }, 'R', 220);
      await Cards.flip(el, true, 380);
      this.s.dealer.home(260);
      this.updDealerLabel();
      await U.sleep(300);
    }

    ask(text, options) {
      return new Promise((res) => {
        const bar = UI.actions();
        U.el('div', 'bet-hint', bar, text);
        const row = U.el('div', 'btn-row', bar);
        options.forEach((o) => UI.button(row, o.label, o.cls, () => { bar.innerHTML = ''; res(o.value); }, o.key));
      });
    }

    canDouble(st, h) {
      if (h.cards.length !== 2 || h.splitAces) return false;
      if (this.rules.doubleRule === '9-11') { const hv = handValue(h.cards); if (hv.soft || hv.total < 9 || hv.total > 11) return false; }
      return st.kind === 'npc' || CS.Store.bank() >= h.bet;
    }
    canSplit(st, h) {
      return st.hands.length === 1 && h.cards.length === 2 && cardVal(h.cards[0]) === cardVal(h.cards[1]) && (st.kind === 'npc' || CS.Store.bank() >= h.bet);
    }

    async playHand(st, hi) {
      const h = st.hands[hi];
      if (st.hands.length === 1 && isBJ(h.cards)) {
        this.label(h, 'BLACKJACK', 'bj');
        if (st.kind === 'human') { CS.Audio.play('bigwin'); await UI.toast('¡BLACKJACK!', 'win', 1000); }
        return;
      }
      if (st.kind === 'human') this.highlight(st, hi, true);
      while (true) {
        const hv = handValue(h.cards);
        if (hv.total >= 21) break;
        if (h.splitAces && h.cards.length >= 2) break;
        let act;
        if (st.kind === 'human') act = await this.humanChoice(st, h);
        else {
          await U.sleep(U.rand(500, 900));
          act = basic(h.cards, this.dealer.cards[0], this.canDouble(st, h), this.canSplit(st, h) && h.cards[0].r !== 10);
          if (act === 'P') act = handValue(h.cards).total >= 12 ? 'S' : 'H'; // los NPC no dividen
        }
        if (!this.alive) return;
        if (act === 'S') { if (st.npc) st.npc.gesture('wave'); break; }
        if (act === 'H') {
          if (st.npc) st.npc.gesture('tap');
          await this.hit(st, hi);
        } else if (act === 'D') {
          await this.double(st, hi);
          break;
        } else if (act === 'P') {
          await this.split(st);
          // jugar la primera mano de nuevo con su segunda carta
          return this.playSplit(st);
        }
      }
      if (handValue(h.cards).total > 21) {
        this.label(h, 'SE PASA', 'bust');
        CS.Audio.play('lose');
        await this.loseChips(h);
      }
      if (st.kind === 'human') this.highlight(st, hi, false);
    }

    async playSplit(st) {
      for (let hi = 0; hi < st.hands.length; hi++) {
        const h = st.hands[hi];
        if (h.cards.length < 2) {
          await this.hit(st, hi);
        }
        if (h.splitAces) { this.refreshLabel(st, hi); continue; }
        this.highlight(st, hi, true);
        while (handValue(h.cards).total < 21) {
          const act = await this.humanChoice(st, h);
          if (!this.alive) return;
          if (act === 'S') break;
          if (act === 'H') await this.hit(st, hi);
          if (act === 'D') { await this.double(st, hi); break; }
        }
        if (handValue(h.cards).total > 21) { this.label(h, 'SE PASA', 'bust'); CS.Audio.play('lose'); await this.loseChips(h); }
        this.highlight(st, hi, false);
      }
    }

    highlight(st, hi, on) {
      const h = st.hands[hi];
      h.els.forEach((e) => e.classList.toggle('active-hand', on));
    }

    async hit(st, hi) {
      const h = st.hands[hi];
      const pos = this.cardPos(st, hi, h.cards.length);
      const { card, el } = await this.dealCard(pos, true);
      h.cards.push(card); h.els.push(el);
      if (st.kind === 'human') this.highlight(st, hi, true);
      this.refreshLabel(st, hi);
    }

    async double(st, hi) {
      const h = st.hands[hi];
      if (st.kind === 'human') CS.Store.addBank(-h.bet);
      const p = h.stack;
      await Chips.fly(this.s.objects, st.kind === 'human' ? { x: 800, y: 900 } : { x: p.x + (p.x < 800 ? -100 : 100), y: p.y + 40 }, { x: p.x + 40, y: p.y }, h.bet, this.v.chip, this.v.denoms, { stagger: 30 });
      h.bet *= 2;
      p.set(h.bet);
      h.doubled = true;
      const pos = this.cardPos(st, hi, h.cards.length);
      const { card, el } = await this.dealCard(pos, true, 90);
      h.cards.push(card); h.els.push(el);
      if (st.kind === 'human') this.highlight(st, hi, true);
      this.refreshLabel(st, hi);
    }

    async split(st) {
      const h = st.hands[0];
      CS.Store.addBank(-h.bet);
      const h2 = { cards: [h.cards.pop()], els: [h.els.pop()], bet: h.bet, done: false };
      st.hands.push(h2);
      if (h.cards[0].r === 14) { h.splitAces = true; h2.splitAces = true; }
      // mover cartas
      await Promise.all([
        Cards.flyTo(h.els[0], this.cardPos(st, 0, 0).x, this.cardPos(st, 0, 0).y, 0, { dur: 300, sound: false }),
        Cards.flyTo(h2.els[0], this.cardPos(st, 1, 0).x, this.cardPos(st, 1, 0).y, 0, { dur: 300 }),
      ]);
      // apuesta: mover la pila original y crear otra
      h.stack.move(st.bet.x - 110, st.bet.y);
      h2.stack = new Chips.Stack(this.s.objects, st.bet.x + 110, st.bet.y, this.v.chip, this.v.denoms);
      await Chips.fly(this.s.objects, { x: 800, y: 900 }, { x: st.bet.x + 110, y: st.bet.y }, h.bet, this.v.chip, this.v.denoms, { stagger: 30 });
      h2.stack.set(h.bet);
      if (h.label) { h.label.remove(); h.label = null; }
      await this.hit(st, 0);
    }

    humanChoice(st, h) {
      return new Promise((res) => {
        const bar = UI.actions();
        const row = U.el('div', 'btn-row big', bar);
        const go = (a) => { bar.innerHTML = ''; res(a); };
        const bH = UI.button(row, 'Pedir', 'btn-act act-hit', () => go('H'), 'H');
        const bS = UI.button(row, 'Plantarse', 'btn-act act-stand', () => go('S'), 'S');
        const bD = UI.button(row, 'Doblar', 'btn-act act-double', () => go('D'), 'D');
        const bP = UI.button(row, 'Dividir', 'btn-act act-split', () => go('P'), 'P');
        bD.disabled = !this.canDouble(st, h);
        bP.disabled = !this.canSplit(st, h);
        if (this.rules.hints) {
          const hint = UI.button(row, '💡 Consejo', 'btn-ghost', () => {
            const a = basic(h.cards, this.dealer.cards[0], !bD.disabled, !bP.disabled);
            const map = { H: bH, S: bS, D: bD, P: bP };
            Object.values(map).forEach((b) => b.classList.remove('suggest'));
            map[a].classList.add('suggest');
            const names = { H: 'pedir', S: 'plantarte', D: 'doblar', P: 'dividir' };
            hint.innerHTML = `💡 Estrategia básica: <b>${names[a]}</b>`;
          });
        }
      });
    }

    async loseChips(h) {
      if (!h.stack || h.stack.amount <= 0) return;
      const p = h.stack;
      const amt = p.amount;
      p.set(0);
      await Chips.fly(this.s.objects, { x: p.x, y: p.y }, this.tray, amt, this.v.chip, this.v.denoms, { stagger: 25 });
      h.lost = true;
    }

    async settle(dealerBJ) {
      const dv = handValue(this.dealer.cards).total;
      const dBust = dv > 21;
      let humanNet = 0, humanBet = 0;
      const jobs = [];
      for (const st of this.seats) {
        for (const h of st.hands) {
          humanBet += st.kind === 'human' ? h.bet : 0;
          if (h.lost) { if (st.kind === 'human') humanNet -= h.bet; continue; }
          const hv = handValue(h.cards).total;
          const bj = isBJ(h.cards) && st.hands.length === 1;
          let mult; // ganancia neta sobre la apuesta
          if (dealerBJ) mult = bj ? 0 : -1;
          else if (bj) mult = 1.5;
          else if (dBust || hv > dv) mult = 1;
          else if (hv === dv) mult = 0;
          else mult = -1;
          if (st.kind === 'human') humanNet += h.bet * mult;
          jobs.push(this.payHand(st, h, mult));
        }
      }
      await Promise.all(jobs);
      // mensaje para el jugador
      if (humanNet > 0) { CS.Audio.play(humanNet >= humanBet * 1.5 ? 'bigwin' : 'win'); UI.toast(`Ganas ${U.fmt(humanNet)}`, 'win', 1300); }
      else if (humanNet < 0) { UI.toast(`Pierdes ${U.fmt(-humanNet)}`, 'lose', 1100); }
      else UI.toast('Empate', 'info', 900);
      await U.sleep(1000);
    }

    async payHand(st, h, mult) {
      const v = this.v, p = h.stack;
      const res = mult > 0 ? (mult === 1.5 ? 'GANA 3:2' : 'GANA') : mult === 0 ? 'EMPATE' : 'PIERDE';
      this.label(h, res, mult > 0 ? 'win' : mult === 0 ? 'push' : 'lose');
      if (mult < 0) return this.loseChips(h);
      const dest = st.kind === 'human' ? { x: 800, y: 920 } : { x: p.x + (p.x < 800 ? -130 : 130), y: p.y + 60 };
      if (mult > 0) {
        const win = h.bet * mult;
        await Chips.fly(this.s.objects, this.tray, { x: p.x + 58, y: p.y }, win, v.chip, v.denoms, { stagger: 30 });
        const ws = new Chips.Stack(this.s.objects, p.x + 58, p.y, v.chip, v.denoms, { label: false });
        ws.set(win);
        await U.sleep(500);
        ws.destroy();
        Chips.fly(this.s.objects, { x: p.x + 58, y: p.y }, dest, win, v.chip, v.denoms, { stagger: 20, arc: 20 });
      } else await U.sleep(500);
      const amt = p.amount;
      p.set(0);
      await Chips.fly(this.s.objects, { x: p.x, y: p.y }, dest, amt, v.chip, v.denoms, { stagger: 20, arc: 20 });
      if (st.kind === 'human') CS.Store.addBank(h.bet * (1 + mult));
    }

    async collect() {
      const d = this.s.dealer, disc = this.s.geo.discard;
      const all = [];
      this.seats.forEach((st) => st.hands.forEach((h) => { all.push(...h.els); if (h.label) h.label.remove(); if (h.stack && h.stack !== st.stack) h.stack.destroy(); }));
      // restaurar la pila de la primera mano a su sitio
      this.seats.forEach((st) => { if (st.stack) { st.stack.move(st.bet.x, st.bet.y); st.stack.set(0); } });
      all.push(...this.dealer.els);
      if (this.dealerLabel) this.dealerLabel.remove();
      d.reach({ x: 700, y: 420 }, 'L', 300);
      // primero se juntan, luego a la bandeja de descartes
      for (let i = 0; i < all.length; i++) {
        const c = all[i];
        c.style.zIndex = 900 + i;
        Cards.flyTo(c, disc.x + U.rand(-2, 2), disc.y - this.discardCount * 0.25, U.rand(-3, 3), { dur: 360, sound: i % 3 === 0 });
        this.discardCount++;
        await U.sleep(45);
      }
      await U.sleep(380);
      all.forEach((c) => c.remove());
      const de = this.s.geo.discardEl;
      if (de) { de.style.setProperty('--n', Math.min(40, Math.round(this.discardCount / 3))); de.classList.toggle('has', this.discardCount > 0); }
      d.home(300);
    }
  }

  CS.Blackjack = Blackjack;
  CS.Blackjack.basic = basic;
  CS.Blackjack.handValue = handValue;
})();
