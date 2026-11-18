/* Casino Stars — Baccarat (Punto Banco) */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U, Cards = CS.Cards, Chips = CS.Chips, UI = CS.UI;

  const bv = (c) => (c.r === 14 ? 1 : c.r >= 10 ? 0 : c.r);
  const tot = (cs) => cs.reduce((a, c) => a + bv(c), 0) % 10;

  class Baccarat {
    constructor(scene) {
      this.s = scene; this.v = scene.venue; this.rules = this.v.bac;
      this.shoe = new Cards.Shoe(this.rules.decks, 0.8);
      this.from = scene.geo.deckPos;
      this.tray = { x: 800, y: 272 };
      this.z = 10; this.alive = true;
      this.history = [];
      this.last = null;
      this.discardCount = 0;
      const zones = [
        { id: 'P', label: 'JUGADOR', pay: '1:1', x: 600, y: 700, w: 270, h: 112, cls: 'z-player' },
        { id: 'T', label: 'EMPATE', pay: '8:1', x: 800, y: 640, w: 150, h: 92, cls: 'z-tie' },
        { id: 'B', label: 'BANCA', pay: this.rules.commission ? '0,95:1' : '1:1*', x: 1000, y: 700, w: 270, h: 112, cls: 'z-banker' },
      ];
      if (this.rules.sides) {
        zones.push({ id: 'PP', label: 'PAREJA J', pay: '11:1', x: 548, y: 585, w: 150, h: 64, cls: 'z-pair z-player' });
        zones.push({ id: 'BP', label: 'PAREJA B', pay: '11:1', x: 1052, y: 585, w: 150, h: 64, cls: 'z-pair z-banker' });
      }
      this.zones = zones;
      this.cardSlots = {
        P: [{ x: 545, y: 352 }, { x: 630, y: 352 }, { x: 705, y: 365 }],
        B: [{ x: 1055, y: 352 }, { x: 970, y: 352 }, { x: 895, y: 365 }],
      };
    }
    destroy() {
      this.alive = false;
      if (this.phase === 'bet') this.zones.forEach((z) => { if (z.stack) { CS.Store.addBank(z.stack.amount); z.stack.set(0); } });
      if (this.board) this.board.remove();
    }
    get inRound() { return this.phase === 'play'; }

    buildZones() {
      const o = this.s.objects;
      this.zoneEls = this.zones.map((z) => {
        const e = U.el('div', `bac-zone ${z.cls} zv-${this.v.id}`, o, `<span class="zl">${z.label}</span><span class="zp">${z.pay}</span>`);
        e.style.left = z.x - z.w / 2 + 'px'; e.style.top = z.y - z.h / 2 + 'px';
        e.style.width = z.w + 'px'; e.style.height = z.h + 'px';
        z.el = e;
        z.stack = new Chips.Stack(o, z.x, z.y + 4, this.v.chip, this.v.denoms);
        z.npcStacks = [
          new Chips.Stack(o, z.x - z.w / 2 + 34, z.y + 10, this.v.chip, this.v.denoms, { label: false, cls: 'small' }),
          new Chips.Stack(o, z.x + z.w / 2 - 34, z.y + 10, this.v.chip, this.v.denoms, { label: false, cls: 'small' }),
        ];
        return e;
      });
      // marcador de resultados
      this.board = U.el('div', 'bac-board board-' + this.v.id, this.s.labels);
      this.renderBoard();
    }
    renderBoard() {
      const h = this.history.slice(-48);
      const cells = [];
      for (let i = 0; i < 48; i++) { const r = h[i]; cells.push(`<i class="${r ? 'r' + r : ''}">${r ? (r === 'P' ? 'J' : r === 'B' ? 'B' : 'E') : ''}</i>`); }
      const cnt = (k) => this.history.filter((x) => x === k).length;
      this.board.innerHTML = `<div class="bb-title">${this.v.id === 'easy' ? 'Pizarra' : 'Historial'}</div><div class="bb-grid">${cells.join('')}</div>
        <div class="bb-stats"><span class="sP">J ${cnt('P')}</span><span class="sB">B ${cnt('B')}</span><span class="sT">E ${cnt('T')}</span></div>`;
    }

    async run() {
      this.buildZones();
      await CS.Scene.shuffle(this.s, 'first');
      // quema de cartas tradicional
      while (this.alive) {
        await this.round();
        if (!this.alive) return;
        if (this.shoe.needsShuffle) {
          await UI.toast('Fin del zapato: barajando', 'info', 1200);
          this.shoe.build();
          const de = this.s.geo.discardEl; if (de) { de.style.setProperty('--n', 0); de.classList.remove('has'); }
          this.discardCount = 0;
          await CS.Scene.shuffle(this.s, 'full');
        }
      }
    }

    humanTotal() { return this.zones.reduce((a, z) => a + z.stack.amount, 0); }

    async betting() {
      const v = this.v, s = this.s;
      this.phase = 'bet';
      const bar = UI.actions();
      U.el('div', 'bet-hint', bar, `Elige ficha y apuesta en Jugador, Banca o Empate · Mín ${U.fmt(v.minBet)}`);
      const picker = UI.chipPicker(bar, v);
      const btns = U.el('div', 'btn-row', bar);
      const bClear = UI.button(btns, 'Limpiar', 'btn-ghost', () => { this.zones.forEach((z) => { CS.Store.addBank(z.stack.amount); z.stack.set(0); }); upd(); }, 'C');
      const bRe = UI.button(btns, 'Repetir', 'btn-ghost', () => {
        if (!this.last) return;
        const need = Object.values(this.last).reduce((a, b) => a + b, 0) - this.humanTotal();
        if (need > CS.Store.bank()) return;
        this.zones.forEach((z) => { const want = this.last[z.id] || 0; const d = want - z.stack.amount; if (d > 0) { CS.Store.addBank(-d); z.stack.set(want); } });
        CS.Audio.play('chip', 4); upd();
      }, 'R');
      const bDeal = UI.button(btns, 'Repartir', 'btn-gold', null, ' ');
      const upd = () => {
        const t = this.humanTotal();
        bDeal.disabled = t < v.minBet;
        bClear.disabled = t <= 0;
        bRe.disabled = !this.last || t > 0;
        picker.refresh(CS.Store.bank());
      };
      this.zones.forEach((z) => {
        z.el.classList.add('open');
        z.el.onclick = () => {
          const d = picker.value;
          if (d > CS.Store.bank() || this.humanTotal() + d > v.maxBet) { CS.Audio.play('lose'); return; }
          CS.Store.addBank(-d); z.stack.add(d); CS.Audio.play('chip', 2); upd();
        };
        z.el.oncontextmenu = (e) => { e.preventDefault(); CS.Store.addBank(z.stack.amount); z.stack.set(0); upd(); };
      });
      upd();
      // NPCs apuestan
      this.npcBets = [];
      this.s.npcs.forEach((npc, i) => {
        const r = Math.random();
        const id = r < 0.52 ? 'B' : r < 0.94 ? 'P' : 'T';
        const amt = Chips.breakdown(v.minBet * U.pick([1, 2, 3, 5]), v.denoms).reduce((a, b) => a + b, 0);
        const z = this.zones.find((q) => q.id === id);
        const st = z.npcStacks[npc.place.flip ? 1 : 0];
        this.npcBets.push({ npc, z, st, amt });
        setTimeout(async () => {
          npc.gesture('push');
          await Chips.fly(s.objects, { x: npc.place.flip ? 1360 : 240, y: 720 }, { x: st.x, y: st.y }, amt, v.chip, v.denoms, { stagger: 40 });
          st.set(amt);
        }, 400 + i * 600);
      });
      if (CS.Store.bank() + this.humanTotal() < v.minBet) {
        const r = await UI.modal('Sin fichas', `<p>No te queda saldo para la apuesta mínima.</p><p class="muted">Dinero de juego: el cajero te da otro crédito de ${U.fmt(2000)}.</p>`,
          [{ label: 'Pedir crédito', value: 'c', cls: 'btn-gold' }, { label: 'Volver al lobby', value: 'l', cls: 'btn-ghost' }]);
        if (r === 'c') CS.Store.addBank(2000); else CS.App.toLobby();
        upd();
      }
      await new Promise((res) => { bDeal.onclick = () => { if (!bDeal.disabled) { CS.Audio.play('click'); res(); } }; });
      this.zones.forEach((z) => { z.el.classList.remove('open'); z.el.onclick = null; });
      this.phase = 'play';
      this.last = {}; this.zones.forEach((z) => { if (z.stack.amount) this.last[z.id] = z.stack.amount; });
      bar.innerHTML = '';
      await U.sleep(500);
    }

    async deal(side, i, faceUp = false) {
      const pos = this.cardSlots[side][i];
      const card = this.shoe.draw();
      const el = Cards.create(card, this.v.deck, this.s.objects);
      Cards.setPos(el, this.from.x, this.from.y, this.s.geo.shoe ? -10 : 0);
      el.style.zIndex = this.z++;
      this.s.dealer.dealGesture(this.from, pos);
      await Cards.flyTo(el, pos.x, pos.y, i === 2 ? 90 : 0, { dur: 450 });
      if (faceUp) await Cards.flip(el, true, 320);
      this.hands[side].cards.push(card); this.hands[side].els.push(el);
      return el;
    }

    async reveal(side, idx) {
      const el = this.hands[side].els[idx];
      const humanOn = (side === 'P' ? this.zones.find((z) => z.id === 'P') : this.zones.find((z) => z.id === 'B')).stack.amount > 0;
      await this.s.dealer.reach({ x: el._pos.x, y: el._pos.y + 30 }, side === 'P' ? 'L' : 'R', 220);
      if (this.rules.squeeze && humanOn && idx >= 1) await Cards.squeeze(el);
      else await Cards.flip(el, true, 360);
      this.s.dealer.home(220);
      this.updScores();
    }

    updScores() {
      const show = (side, lab) => {
        const h = this.hands[side];
        const up = h.cards.filter((c, i) => h.els[i].classList.contains('faceup'));
        lab.innerHTML = `<small>${side === 'P' ? 'JUGADOR' : 'BANCA'}</small>${up.length ? tot(up) : '–'}`;
      };
      show('P', this.lblP); show('B', this.lblB);
    }

    async round() {
      const s = this.s, v = this.v;
      await this.betting();
      if (!this.alive) return;
      this.hands = { P: { cards: [], els: [] }, B: { cards: [], els: [] } };
      this.lblP = UI.label(372, 405, '', 'bac-score sP');
      this.lblB = UI.label(1228, 405, '', 'bac-score sB');
      this.updScores();
      await this.deal('P', 0); await this.deal('B', 0); await this.deal('P', 1); await this.deal('B', 1);
      await U.sleep(250);
      await this.reveal('P', 0); await this.reveal('P', 1);
      await this.reveal('B', 0); await this.reveal('B', 1);
      let p = tot(this.hands.P.cards), b = tot(this.hands.B.cards);
      let natural = p >= 8 || b >= 8;
      if (natural) {
        await UI.toast('Natural ' + Math.max(p, b), 'info', 900);
      } else {
        let p3 = null;
        if (p <= 5) {
          s.caption('El Jugador pide tercera carta');
          await this.deal('P', 2); await this.reveal('P', 2);
          p3 = bv(this.hands.P.cards[2]);
          p = tot(this.hands.P.cards);
        }
        let draw;
        if (p3 === null) draw = b <= 5;
        else draw = b <= 2 || (b === 3 && p3 !== 8) || (b === 4 && p3 >= 2 && p3 <= 7) || (b === 5 && p3 >= 4 && p3 <= 7) || (b === 6 && (p3 === 6 || p3 === 7));
        if (draw) {
          s.caption('La Banca pide tercera carta');
          await this.deal('B', 2); await this.reveal('B', 2);
          b = tot(this.hands.B.cards);
        }
        s.caption('');
      }
      const res = p > b ? 'P' : b > p ? 'B' : 'T';
      this.history.push(res);
      this.renderBoard();
      const lab = res === 'P' ? this.lblP : res === 'B' ? this.lblB : null;
      if (lab) lab.classList.add('winner'); else { this.lblP.classList.add('winner'); this.lblB.classList.add('winner'); }
      const zone = this.zones.find((z) => z.id === res);
      zone.el.classList.add('won');
      await U.sleep(500);
      await UI.toast(res === 'T' ? `Empate a ${p}` : `${res === 'P' ? 'Gana el Jugador' : 'Gana la Banca'} ${Math.max(p, b)} a ${Math.min(p, b)}`, 'info', 1200);
      await this.settle(res, b);
      zone.el.classList.remove('won');
      await this.collect();
      this.phase = 'idle';
    }

    payout(id, res, bTotal) {
      // ganancia neta por unidad (o -1 si pierde; 0 empate/devolución)
      const pair = (side) => this.hands[side].cards[0].r === this.hands[side].cards[1].r;
      if (id === 'PP') return pair('P') ? 11 : -1;
      if (id === 'BP') return pair('B') ? 11 : -1;
      if (id === 'T') return res === 'T' ? 8 : -1;
      if (res === 'T') return 0;
      if (id === 'P') return res === 'P' ? 1 : -1;
      if (id === 'B') {
        if (res !== 'B') return -1;
        if (this.rules.commission) return 0.95;
        return bTotal === 6 ? 0.5 : 1;
      }
      return -1;
    }

    async settle(res, bTotal) {
      const v = this.v, o = this.s.objects;
      let net = 0, staked = 0;
      const jobs = [];
      for (const z of this.zones) {
        // NPCs
        z.npcStacks.forEach((st, k) => {
          if (st.amount <= 0) return;
          const m = this.payout(z.id, res, bTotal);
          const amt = st.amount;
          const dest = { x: k ? 1360 : 240, y: 760 };
          jobs.push((async () => {
            if (m < 0) { st.set(0); await Chips.fly(o, st, this.tray, amt, v.chip, v.denoms, { stagger: 25 }); return; }
            if (m > 0) await Chips.fly(o, this.tray, { x: st.x, y: st.y - 30 }, amt * m, v.chip, v.denoms, { stagger: 25 });
            st.set(0);
            await Chips.fly(o, st, dest, amt * (1 + m), v.chip, v.denoms, { stagger: 20, arc: 20 });
          })());
        });
        const amt = z.stack.amount;
        if (amt <= 0) continue;
        staked += amt;
        const m = this.payout(z.id, res, bTotal);
        net += amt * m;
        const st = z.stack;
        jobs.push((async () => {
          if (m < 0) { st.set(0); await Chips.fly(o, { x: st.x, y: st.y }, this.tray, amt, v.chip, v.denoms, { stagger: 25 }); return; }
          if (m > 0) {
            await Chips.fly(o, this.tray, { x: st.x + 60, y: st.y }, amt * m, v.chip, v.denoms, { stagger: 30 });
            const ws = new Chips.Stack(o, st.x + 60, st.y, v.chip, v.denoms, { label: false });
            ws.set(amt * m);
            await U.sleep(600);
            ws.destroy();
            Chips.fly(o, { x: st.x + 60, y: st.y }, { x: 800, y: 920 }, amt * m, v.chip, v.denoms, { stagger: 20, arc: 20 });
          } else await U.sleep(500);
          st.set(0);
          await Chips.fly(o, { x: st.x, y: st.y }, { x: 800, y: 920 }, amt, v.chip, v.denoms, { stagger: 20, arc: 20 });
          CS.Store.addBank(amt * (1 + m));
        })());
      }
      await Promise.all(jobs);
      if (staked) {
        if (net > 0) { CS.Audio.play(net >= staked * 3 ? 'bigwin' : 'win'); UI.toast(`Ganas ${U.fmt(net)}`, 'win', 1200); }
        else if (net < 0) UI.toast(`Pierdes ${U.fmt(-net)}`, 'lose', 1000);
        else UI.toast('Apuesta devuelta', 'info', 900);
        await U.sleep(900);
      }
    }

    async collect() {
      const disc = this.s.geo.discard;
      const all = [...this.hands.P.els, ...this.hands.B.els];
      this.s.dealer.reach({ x: 800, y: 380 }, 'L', 300);
      for (let i = 0; i < all.length; i++) {
        all[i].style.zIndex = 900 + i;
        Cards.flyTo(all[i], disc.x, disc.y - this.discardCount * 0.25, U.rand(-3, 3), { dur: 380, sound: i % 2 === 0 });
        this.discardCount++;
        await U.sleep(60);
      }
      await U.sleep(400);
      all.forEach((c) => c.remove());
      this.lblP.remove(); this.lblB.remove();
      const de = this.s.geo.discardEl; if (de) { de.style.setProperty('--n', Math.min(40, Math.round(this.discardCount / 3))); de.classList.toggle('has', this.discardCount > 0); }
      this.s.dealer.home(300);
    }
  }
  CS.Baccarat = Baccarat;
  CS.Baccarat.total = tot;
})();
