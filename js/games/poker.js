/* Casino Stars — Texas Hold'em No Limit contra IA */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U, Cards = CS.Cards, Chips = CS.Chips, UI = CS.UI, E = CS.PokerEval;

  // posiciones por hueco (índices de Scene.NPC_PLACES.poker) + humano
  const SLOTS = {
    H: { cards: [{ x: 752, y: 728, rot: -4 }, { x: 842, y: 728, rot: 4 }], bet: { x: 800, y: 622 }, plate: { x: 560, y: 790 }, btn: { x: 680, y: 650 } },
    0: { cards: [{ x: 372, y: 646, rot: -8 }, { x: 412, y: 652, rot: 6 }], bet: { x: 505, y: 610 }, plate: { x: 140, y: 425 }, btn: { x: 455, y: 735 } },
    1: { cards: [{ x: 420, y: 418, rot: -10 }, { x: 458, y: 414, rot: 4 }], bet: { x: 548, y: 470 }, plate: { x: 228, y: 118 }, btn: { x: 470, y: 505 } },
    2: { cards: [{ x: 1142, y: 414, rot: -4 }, { x: 1180, y: 418, rot: 10 }], bet: { x: 1052, y: 470 }, plate: { x: 1372, y: 118 }, btn: { x: 1130, y: 505 } },
    3: { cards: [{ x: 1188, y: 652, rot: -6 }, { x: 1228, y: 646, rot: 8 }], bet: { x: 1095, y: 610 }, plate: { x: 1460, y: 425 }, btn: { x: 1145, y: 735 } },
  };
  const BOARD = [590, 695, 800, 905, 1010].map((x) => ({ x, y: 470 }));
  const POT = { x: 800, y: 372 };

  const PROFILES = {
    fish: { noise: 0.16, raiseT: 0.8, callM: -0.12, bluff: 0.02, sims: 120, slow: 0.05, think: [700, 1400] },
    regular: { noise: 0.07, raiseT: 0.66, callM: 0.02, bluff: 0.06, sims: 200, slow: 0.08, think: [700, 1600] },
    shark: { noise: 0.03, raiseT: 0.6, callM: -0.01, bluff: 0.13, sims: 320, slow: 0.15, think: [900, 2000] },
  };

  class Poker {
    constructor(scene) {
      this.s = scene; this.v = scene.venue; this.cfg = this.v.poker;
      this.alive = true; this.z = 10;
      this.sb = this.cfg.sb; this.bb = this.cfg.bb;
      this.unit = this.v.denoms[0];
      this.humanAggro = { raises: 0, actions: 0 };
      this.players = [];
      this.button = 0;
    }
    destroy() {
      this.alive = false;
      this.cashOut();
      this.plates && this.plates.forEach((p) => p.remove());
    }
    get inRound() { return !!this.inHand && this.human && this.human.total > 0 && !this.human.folded; }
    cashOut() {
      const h = this.human;
      if (h && h.chips > 0) { CS.Store.addBank(h.chips); h.chips = 0; }
      CS.Store.data.pokerTable = 0; CS.Store.save();
    }
    saveSeat() { CS.Store.data.pokerTable = this.human.chips + (this.inHand ? this.human.total : 0); CS.Store.save(); }

    seat() {
      const s = this.s, v = this.v, buy = this.cfg.buyin;
      this.human = { name: 'Tú', isHuman: true, chips: buy, slot: 'H' };
      CS.Store.addBank(-buy);
      this.players = [this.human];
      // orden horario: humano → huecos 0,1,2,3
      const bySlot = {};
      s.npcs.forEach((n) => { bySlot[n.seatIndex] = n; });
      [0, 1, 2, 3].forEach((k) => {
        if (!bySlot[k]) return;
        const npc = bySlot[k];
        const chips = Math.round((buy * (this.v.id === 'hard' ? U.rand(0.8, 1.6) : U.rand(0.7, 1.3))) / this.unit) * this.unit;
        this.players.push({ name: npc.o.name, isHuman: false, chips, slot: k, npc, prof: PROFILES[this.cfg.ai] });
      });
      this.players.forEach((p) => {
        const sl = SLOTS[p.slot];
        p.betStack = new Chips.Stack(s.objects, sl.bet.x, sl.bet.y, v.chip, v.denoms, { cls: 'small' });
        p.plate = U.el('div', 'nameplate' + (p.isHuman ? ' me' : ''), s.labels);
        p.plate.style.left = sl.plate.x + 'px'; p.plate.style.top = sl.plate.y + 'px';
        this.renderPlate(p);
      });
      this.plates = this.players.map((p) => p.plate);
      this.potStack = new Chips.Stack(s.objects, POT.x, POT.y, v.chip, v.denoms);
      this.potLabel = UI.label(POT.x, POT.y - 56, '', 'pot-label');
      this.btnEl = U.el('div', 'dealer-button btn-' + v.id, s.objects, 'D');
      this.button = U.randi(0, this.players.length - 1);
      this.saveSeat();
    }

    renderPlate(p, action) {
      const st = p.out ? 'Eliminado' : U.fmt(p.chips);
      p.plate.innerHTML = `<div class="np-name">${p.name}${p.allIn && !p.out ? ' <em>ALL-IN</em>' : ''}</div><div class="np-chips">${st}</div>${action ? `<div class="np-act">${action}</div>` : ''}`;
      p.plate.classList.toggle('folded', !!p.folded || !!p.out);
      if (action) {
        clearTimeout(p._actT);
        p._actT = setTimeout(() => { const a = p.plate.querySelector('.np-act'); if (a) a.classList.add('fade'); }, 2200);
      }
    }
    setTurn(p) { this.players.forEach((q) => q.plate.classList.toggle('turn', q === p)); }

    live() { return this.players.filter((p) => !p.out && !p.folded); }
    nextIdx(i, pred) {
      const n = this.players.length;
      for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (pred(this.players[j])) return j; }
      return -1;
    }
    potTotal() { return this.pot + this.players.reduce((a, p) => a + (p.bet || 0), 0); }
    updPot() {
      this.potLabel.innerHTML = this.potTotal() > 0 ? `Bote <b>${U.fmt(this.potTotal())}</b>` : '';
      this.potStack.set(this.pot);
      if (this.potStack.label) this.potStack.label.style.display = 'none';
    }

    async run() {
      this.seat();
      await U.sleep(300);
      while (this.alive) {
        // comprobar estado de la mesa
        if (this.human.chips <= 0) {
          const can = CS.Store.bank() >= this.cfg.buyin;
          const r = await UI.modal('Te has quedado sin fichas', `<p>Has perdido tu compra en esta mesa.</p>${can ? `<p>¿Recompras por ${U.fmt(this.cfg.buyin)} de tu saldo?</p>` : `<p class="muted">No tienes saldo suficiente para recomprar (${U.fmt(this.cfg.buyin)}).</p>`}`,
            can ? [{ label: 'Recomprar', value: 'buy', cls: 'btn-gold' }, { label: 'Salir', value: 'out', cls: 'btn-ghost' }] : [{ label: 'Volver al lobby', value: 'out', cls: 'btn-gold' }]);
          if (!this.alive) return;
          if (r === 'buy') { CS.Store.addBank(-this.cfg.buyin); this.human.chips = this.cfg.buyin; this.renderPlate(this.human); this.saveSeat(); }
          else { CS.App.toLobby(); return; }
        }
        const opps = this.players.filter((p) => !p.isHuman && !p.out);
        if (!opps.length) {
          await UI.modal('¡Has limpiado la mesa!', `<p>Te has quedado con todas las fichas: <b>${U.fmt(this.human.chips)}</b>.</p><p>Llegan nuevos rivales a la mesa.</p>`, [{ label: 'Seguir jugando', value: 1, cls: 'btn-gold' }]);
          if (!this.alive) return;
          this.players.forEach((p) => {
            if (p.isHuman) return;
            p.out = false; p.chips = Math.round(this.cfg.buyin * U.rand(0.9, 1.4) / this.unit) * this.unit;
            p.npc.root.style.opacity = 1; this.renderPlate(p);
          });
        }
        await this.hand();
        if (!this.alive) return;
        await U.sleep(600);
      }
    }

    async deal(p, i, faceUp) {
      const pos = p.isHuman || p === null ? SLOTS.H.cards[i] : SLOTS[p.slot].cards[i];
      const card = this.deck.draw();
      const el = Cards.create(card, this.v.deck, this.s.objects);
      Cards.setPos(el, this.s.geo.deckPos.x, this.s.geo.deckPos.y, 0);
      el.style.zIndex = this.z++;
      if (!p.isHuman) el.classList.add('opp-card', 'slot-' + p.slot);
      this.s.dealer.dealGesture(this.s.geo.deckPos, pos);
      await Cards.flyTo(el, pos.x, pos.y, pos.rot, { dur: 360 });
      if (faceUp) Cards.flip(el, true, 300);
      return { card, el };
    }
    async dealBoard(n) {
      // quemar una carta
      const burn = Cards.create(this.deck.draw(), this.v.deck, this.s.objects);
      Cards.setPos(burn, this.s.geo.deckPos.x, this.s.geo.deckPos.y, 0);
      burn.style.zIndex = 5;
      this.muckEls.push(burn);
      await Cards.flyTo(burn, this.s.geo.muck.x + U.rand(-4, 4), this.s.geo.muck.y, U.rand(-20, 20), { dur: 300 });
      const pr = [];
      for (let i = 0; i < n; i++) {
        const k = this.board.length;
        const card = this.deck.draw();
        const el = Cards.create(card, this.v.deck, this.s.objects);
        Cards.setPos(el, this.s.geo.deckPos.x, this.s.geo.deckPos.y, 0);
        el.style.zIndex = this.z++;
        this.board.push(card); this.boardEls.push(el);
        this.s.dealer.dealGesture(this.s.geo.deckPos, BOARD[k]);
        if (n === 3) {
          // flop: se dejan juntas y se extienden
          await Cards.flyTo(el, BOARD[0].x, BOARD[0].y, 0, { dur: 320 });
        } else {
          await Cards.flyTo(el, BOARD[k].x, BOARD[k].y, 0, { dur: 380 });
          await Cards.flip(el, true, 340);
        }
      }
      if (n === 3) {
        const els = this.boardEls.slice(-3);
        await Promise.all(els.map((e) => Cards.flip(e, true, 340)));
        await Promise.all(els.map((e, i) => Cards.flyTo(e, BOARD[i].x, BOARD[i].y, 0, { dur: 380, sound: i === 0, lift: 1 })));
      }
      this.showMyHand();
    }

    showMyHand() {
      if (!this.human.hole || this.human.folded) { if (this.myHandLbl) this.myHandLbl.textContent = ''; return; }
      if (!this.myHandLbl) this.myHandLbl = UI.label(800, 822, '', 'my-hand');
      const cs = this.human.hole.concat(this.board);
      let txt;
      if (cs.length >= 5) txt = E.best(cs).name;
      else txt = this.human.hole[0].r === this.human.hole[1].r ? 'Pareja' : 'Carta alta';
      this.myHandLbl.textContent = txt;
    }

    async putChips(p, amount) {
      amount = Math.min(amount, p.chips);
      if (amount <= 0) return 0;
      p.chips -= amount; p.bet += amount; p.total += amount;
      if (p.chips === 0) p.allIn = true;
      const sl = SLOTS[p.slot];
      const from = p.isHuman ? { x: 800, y: 900 } : { x: sl.cards[0].x - (p.slot < 2 ? 110 : -110), y: sl.cards[0].y + 60 };
      await Chips.fly(this.s.objects, from, sl.bet, amount, this.v.chip, this.v.denoms, { stagger: 28, dur: 420 });
      p.betStack.set(p.bet);
      this.renderPlate(p);
      this.updPot();
      return amount;
    }

    async gatherBets() {
      const jobs = this.players.filter((p) => p.bet > 0).map(async (p) => {
        const amt = p.bet;
        p.betStack.set(0);
        await Chips.fly(this.s.objects, SLOTS[p.slot].bet, POT, amt, this.v.chip, this.v.denoms, { stagger: 18, dur: 380 });
      });
      const sum = this.players.reduce((a, p) => a + p.bet, 0);
      this.players.forEach((p) => { p.bet = 0; });
      this.pot += sum;
      await Promise.all(jobs);
      this.updPot();
    }

    async hand() {
      const s = this.s, v = this.v;
      this.inHand = true;
      const seated = this.players.filter((p) => !p.out);
      this.players.forEach((p) => {
        Object.assign(p, { hole: null, holeEls: [], folded: !!p.out, allIn: false, bet: 0, total: 0 });
        this.renderPlate(p);
      });
      this.board = []; this.boardEls = []; this.muckEls = []; this.pot = 0;
      if (this.myHandLbl) { this.myHandLbl.remove(); this.myHandLbl = null; }
      // botón
      this.button = this.nextIdx(this.button, (p) => !p.out);
      const bp = SLOTS[this.players[this.button].slot].btn;
      await U.anim(this.btnEl, [{ left: this.btnEl.style.left || bp.x + 'px', top: this.btnEl.style.top || bp.y + 'px' }, { left: bp.x - 20 + 'px', top: bp.y - 20 + 'px' }], { duration: 500 });
      this.btnEl.style.left = bp.x - 20 + 'px'; this.btnEl.style.top = bp.y - 20 + 'px';
      // barajar
      this.deck = new Cards.Shoe(1, 1);
      await CS.Scene.shuffle(s, this.firstDone ? 'quick' : 'first');
      this.firstDone = true;
      if (!this.alive) return;
      // ciegas
      const heads = seated.length === 2;
      const sbI = heads ? this.button : this.nextIdx(this.button, (p) => !p.out);
      const bbI = this.nextIdx(sbI, (p) => !p.out);
      const sbP = this.players[sbI], bbP = this.players[bbI];
      await this.putChips(sbP, this.sb); this.renderPlate(sbP, 'Ciega peq.');
      await this.putChips(bbP, this.bb); this.renderPlate(bbP, 'Ciega grande');
      // cartas privadas
      for (let r = 0; r < 2; r++) {
        let i = sbI;
        for (let k = 0; k < seated.length; k++) {
          const p = this.players[i];
          const { card, el } = await this.deal(p, r, p.isHuman);
          p.hole = p.hole || []; p.hole.push(card); p.holeEls.push(el);
          i = this.nextIdx(i, (q) => !q.out);
        }
      }
      this.showMyHand();
      // rondas
      const streets = [
        { name: 'Preflop', n: 0 },
        { name: 'Flop', n: 3 },
        { name: 'Turn', n: 1 },
        { name: 'River', n: 1 },
      ];
      let winnerByFold = null;
      for (let si = 0; si < streets.length; si++) {
        const st = streets[si];
        this.street = si;
        if (st.n) {
          s.caption(st.name);
          await this.dealBoard(st.n);
          setTimeout(() => s.caption(''), 900);
        }
        const first = si === 0 ? this.nextIdx(bbI, (p) => !p.out && !p.folded) : this.nextIdx(this.button, (p) => !p.out && !p.folded);
        this.currentBet = si === 0 ? this.bb : 0;
        this.minRaise = this.bb;
        const r = await this.bettingRound(first);
        if (!this.alive) return;
        await this.gatherBets();
        if (r === 'fold') { winnerByFold = this.live()[0]; break; }
      }
      this.setTurn(null);
      if (winnerByFold) await this.awardFold(winnerByFold);
      else await this.showdown();
      this.inHand = false;
      // eliminaciones
      this.players.forEach((p) => {
        if (!p.isHuman && p.chips <= 0 && !p.out) { p.out = true; p.npc.root.style.opacity = 0.35; this.renderPlate(p, 'Se levanta'); }
      });
      this.saveSeat();
      await this.cleanup();
    }

    async bettingRound(startI) {
      const canAct = (p) => !p.out && !p.folded && !p.allIn;
      const able = this.players.filter(canAct);
      if (this.live().length <= 1) return 'fold';
      if (able.length <= 1 && able.every((p) => p.bet >= this.currentBet)) return 'done';
      const toAct = new Set(able);
      let i = startI;
      let guard = 0;
      while (toAct.size && guard++ < 200) {
        const p = this.players[i];
        if (toAct.has(p)) {
          this.setTurn(p);
          const act = p.isHuman ? await this.humanAction(p) : await this.aiAction(p);
          if (!this.alive) return 'done';
          toAct.delete(p);
          if (act.a === 'fold') {
            p.folded = true;
            this.renderPlate(p, 'Se retira');
            await this.foldCards(p);
            if (this.live().length === 1) return 'fold';
          } else if (act.a === 'call') {
            const need = this.currentBet - p.bet;
            if (need <= 0) { this.renderPlate(p, 'Pasa'); if (p.npc) p.npc.gesture('tap'); CS.Audio.play('knock'); }
            else { await this.putChips(p, need); this.renderPlate(p, p.allIn ? 'All-in' : `Iguala ${U.fmt(p.bet)}`); }
          } else if (act.a === 'raise') {
            const to = Math.min(act.to, p.bet + p.chips);
            const inc = to - this.currentBet;
            const prevBet = this.currentBet;
            await this.putChips(p, to - p.bet);
            if (to > prevBet) {
              if (inc >= this.minRaise) this.minRaise = inc;
              this.currentBet = to;
              this.players.forEach((q) => { if (q !== p && canAct(q)) toAct.add(q); });
            }
            this.renderPlate(p, p.allIn ? `All-in ${U.fmt(p.bet)}` : prevBet === 0 ? `Apuesta ${U.fmt(to)}` : `Sube a ${U.fmt(to)}`);
            if (p.npc) p.npc.gesture('push');
          }
          if (p.isHuman) {
            this.humanAggro.actions++;
            if (act.a === 'raise') this.humanAggro.raises++;
          }
        }
        i = (i + 1) % this.players.length;
      }
      return 'done';
    }

    async foldCards(p) {
      if (p.npc) p.npc.gesture('fold');
      await Promise.all(p.holeEls.map((el, k) => {
        el.style.zIndex = 4;
        if (el.classList.contains('faceup')) Cards.flip(el, false, 200);
        return Cards.flyTo(el, this.s.geo.muck.x + U.rand(-8, 8), this.s.geo.muck.y + U.rand(-4, 4), U.rand(-30, 30), { dur: 380, sound: k === 0 });
      }));
      this.muckEls.push(...p.holeEls);
      p.holeEls = [];
      if (p.isHuman) this.showMyHand();
    }

    // --------------------- jugador humano ---------------------
    humanAction(p) {
      return new Promise((res) => {
        this.resolveHuman = res;
        const bar = UI.actions();
        const need = this.currentBet - p.bet;
        const potNow = this.potTotal();
        const minTo = Math.min(p.bet + p.chips, this.currentBet + Math.max(this.minRaise, this.bb));
        const maxTo = p.bet + p.chips;
        const info = U.el('div', 'bet-hint', bar, `Tu turno · Bote ${U.fmt(potNow)}${need > 0 ? ` · Para igualar: ${U.fmt(Math.min(need, p.chips))}` : ''}`);
        const row = U.el('div', 'btn-row big', bar);
        const go = (a) => { bar.innerHTML = ''; this.resolveHuman = null; res(a); };
        UI.button(row, 'Retirarse', 'btn-act act-fold', () => go({ a: 'fold' }), 'F');
        UI.button(row, need > 0 ? (need >= p.chips ? `All-in ${U.fmt(p.chips)}` : `Igualar ${U.fmt(need)}`) : 'Pasar', 'btn-act act-call', () => go({ a: 'call' }), 'C');
        if (maxTo > this.currentBet && (need < p.chips)) {
          const box = U.el('div', 'raise-box', bar);
          const val = U.el('div', 'raise-val', box);
          const sl = U.el('input', 'raise-slider', box);
          sl.type = 'range'; sl.min = minTo; sl.max = maxTo; sl.step = this.unit; sl.value = minTo;
          const presets = U.el('div', 'raise-presets', box);
          const snap = (x) => U.clamp(Math.round(x / this.unit) * this.unit, minTo, maxTo);
          const setv = (x) => { sl.value = snap(x); upd(); };
          const upd = () => { const x = +sl.value; val.innerHTML = `${this.currentBet === 0 ? 'Apostar' : 'Subir a'} <b>${U.fmt(x)}</b>`; bR.firstChild.textContent = x >= maxTo ? 'All-in' : this.currentBet === 0 ? 'Apostar' : 'Subir'; };
          sl.oninput = upd;
          [['Mín', minTo], ['½ bote', this.currentBet + need + (potNow + need) / 2], ['Bote', this.currentBet + need + potNow + need], ['All-in', maxTo]].forEach(([l, x]) => {
            const b = U.el('button', 'chipbtn', presets, l);
            b.onclick = (e) => { e.stopPropagation(); CS.Audio.play('click'); setv(x); };
          });
          const bR = UI.button(row, 'Subir', 'btn-act act-raise', () => go({ a: 'raise', to: +sl.value }), 'R');
          upd();
        }
      });
    }

    // --------------------- IA ---------------------
    async aiAction(p) {
      const pr = p.prof;
      const t0 = performance.now();
      const nOpp = this.live().length - 1;
      const need = this.currentBet - p.bet;
      const pot = this.potTotal();
      let eq = E.equity(p.hole, this.board, Math.max(1, nOpp), pr.sims);
      eq += U.rand(-pr.noise, pr.noise);
      // ajustes del tiburón: posición y adaptación al humano
      if (this.cfg.ai === 'shark') {
        const ha = this.humanAggro.actions > 4 ? this.humanAggro.raises / this.humanAggro.actions : 0.2;
        const humanIn = !this.human.folded;
        if (humanIn && ha > 0.35) eq += 0.04; // el humano farolea mucho: pagar más ligero
        if (this.players.indexOf(p) === this.button) eq += 0.03;
      }
      const odds = need > 0 ? need / (pot + need) : 0;
      const wait = U.rand(pr.think[0], pr.think[1]) - (performance.now() - t0);
      if (Math.random() < 0.35 && p.npc && !p.npc.busy) p.npc.idle && (Math.random() < 0.5 ? p.npc.chipShuffle() : p.npc.tapFingers());
      await U.sleep(Math.max(200, wait));
      const stackTo = p.bet + p.chips;
      const minTo = Math.min(stackTo, this.currentBet + Math.max(this.minRaise, this.bb));
      const size = (f) => {
        const base = need > 0 ? this.currentBet + need + (pot + need) * f : (pot || this.bb * 2) * f;
        return U.clamp(Math.round(Math.max(minTo, base) / this.unit) * this.unit, minTo, stackTo);
      };
      const strongPre = this.street === 0 && eq > (nOpp >= 3 ? 0.36 : 0.52);
      // decisión
      if (need <= 0) {
        if (eq > pr.raiseT || strongPre) {
          if (Math.random() < pr.slow && this.street < 3) return { a: 'call' }; // slow-play
          return { a: 'raise', to: size(U.rand(0.45, 0.8)) };
        }
        if (this.street > 0 && Math.random() < pr.bluff) return { a: 'raise', to: size(U.rand(0.4, 0.7)) };
        return { a: 'call' };
      }
      // hay que pagar
      if (eq > pr.raiseT + 0.12 && Math.random() < 0.7) {
        return { a: 'raise', to: size(U.rand(0.6, 1.0)) };
      }
      if (eq > odds + pr.callM) return { a: 'call' };
      if (this.cfg.ai === 'fish' && need <= this.bb * 2 && Math.random() < 0.55) return { a: 'call' };
      if (this.cfg.ai === 'shark' && this.street >= 1 && Math.random() < pr.bluff * 0.6 && nOpp === 1) return { a: 'raise', to: size(U.rand(0.7, 1.1)) };
      return { a: 'fold' };
    }

    // --------------------- final de mano ---------------------
    async awardFold(w) {
      const amt = this.pot;
      this.pot = 0;
      this.potStack.set(0); this.updPot();
      const dest = w.isHuman ? { x: 800, y: 900 } : SLOTS[w.slot].bet;
      await Chips.fly(this.s.objects, POT, dest, amt, this.v.chip, this.v.denoms, { stagger: 30 });
      w.chips += amt;
      if (w.npc) w.npc.react('happy');
      this.renderPlate(w, `Gana ${U.fmt(amt)}`);
      if (w.isHuman) { CS.Audio.play('win'); await UI.toast(`Ganas ${U.fmt(amt)}`, 'win', 1200, 'Todos se han retirado'); }
      else await UI.toast(`${w.name} gana ${U.fmt(amt)}`, 'info', 1100, 'Todos se han retirado');
    }

    async showdown() {
      // completar el tablero si hubo all-in
      while (this.board.length < 5) await this.dealBoard(this.board.length === 0 ? 3 : 1);
      const live = this.live();
      for (const p of live) {
        if (!p.isHuman) await Promise.all(p.holeEls.map((el) => Cards.flip(el, true, 320)));
        p.res = E.best(p.hole.concat(this.board));
        if (p.npc) p.npc.react('think');
        this.renderPlate(p, p.res.name);
        await U.sleep(250);
      }
      // botes laterales
      const levels = [...new Set(live.map((p) => p.total))].sort((a, b) => a - b);
      const pots = [];
      let prev = 0;
      for (const L of levels) {
        let amount = 0;
        this.players.forEach((p) => { amount += Math.max(0, Math.min(p.total, L) - prev); });
        pots.push({ amount, elig: live.filter((p) => p.total >= L) });
        prev = L;
      }
      const assigned = pots.reduce((a, x) => a + x.amount, 0);
      if (this.pot - assigned > 0 && pots.length) pots[pots.length - 1].amount += this.pot - assigned;
      let humanWon = 0;
      const msgs = [];
      for (let k = 0; k < pots.length; k++) {
        const pt = pots[k];
        if (pt.amount <= 0) continue;
        const best = Math.max(...pt.elig.map((p) => p.res.score));
        const ws = pt.elig.filter((p) => p.res.score === best);
        // resaltar cartas ganadoras
        if (k === 0 || pots.length === 1) this.highlightWin(ws);
        const share = Math.floor(pt.amount / ws.length / this.unit) * this.unit;
        let rem = pt.amount - share * ws.length;
        for (const w of ws) {
          let a = share;
          if (rem > 0) { a += rem; rem = 0; }
          this.pot -= a;
          this.updPot();
          const dest = w.isHuman ? { x: 800, y: 900 } : SLOTS[w.slot].bet;
          await Chips.fly(this.s.objects, POT, dest, a, this.v.chip, this.v.denoms, { stagger: 25 });
          w.chips += a;
          if (w.isHuman) humanWon += a;
          if (w.npc) w.npc.react('happy');
          this.renderPlate(w, `Gana ${U.fmt(a)}`);
        }
        msgs.push(ws.length > 1 ? `Bote repartido · ${ws[0].res.name}` : `${ws[0].isHuman ? 'Ganas' : ws[0].name + ' gana'} con ${ws[0].res.name}`);
      }
      this.pot = 0; this.updPot();
      if (humanWon > this.human.total) CS.Audio.play('bigwin');
      else if (humanWon > 0) CS.Audio.play('win');
      else if (!this.human.folded) CS.Audio.play('lose');
      await UI.toast(msgs[0] || '', humanWon > 0 ? 'win' : 'info', 2000, humanWon > 0 ? `+${U.fmt(humanWon)}` : '');
    }

    highlightWin(ws) {
      const winCards = new Set();
      ws.forEach((w) => w.res.cards.forEach((c) => winCards.add(c)));
      const all = this.boardEls.concat(...this.live().map((p) => p.holeEls));
      all.forEach((el) => {
        const hit = winCards.has(el.card);
        el.classList.toggle('win-card', hit);
        el.classList.toggle('dim-card', !hit);
      });
    }

    async cleanup() {
      await U.sleep(600);
      const els = [...this.boardEls, ...this.muckEls, ...this.players.flatMap((p) => p.holeEls || [])];
      this.s.dealer.reach({ x: 800, y: 460 }, 'R', 300);
      els.forEach((el, i) => {
        el.classList.remove('win-card', 'dim-card');
        el.style.zIndex = 800 + i;
        Cards.flyTo(el, this.s.geo.deckPos.x, this.s.geo.deckPos.y, 0, { dur: 420, sound: i % 4 === 0 });
      });
      await U.sleep(480);
      els.forEach((el) => el.remove());
      this.s.dealer.home(300);
      this.players.forEach((p) => this.renderPlate(p));
    }
  }
  CS.Poker = Poker;
})();
