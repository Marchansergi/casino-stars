/* Casino Stars — arranque, escalado del escenario y menús */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U, UI = CS.UI;
  const $ = (id) => document.getElementById(id);
  const App = (CS.App = { game: null });

  const GAMES = {
    poker: { title: "Texas Hold'em", kicker: 'Póker', desc: 'Dos cartas tuyas, cinco en la mesa. Lee a tus rivales, apuesta y farolea.', cls: CS.Poker },
    blackjack: { title: 'Blackjack', kicker: '21', desc: 'Acércate a 21 sin pasarte y gánale al crupier. Pedir, plantarse, doblar o dividir.', cls: CS.Blackjack },
    baccarat: { title: 'Baccarat', kicker: 'Punto Banco', desc: 'El juego de los grandes apostadores: Jugador, Banca o Empate. Elegancia y nervios.', cls: CS.Baccarat },
  };

  // ---------------- escalado ----------------
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / U.STAGE_W, vh / U.STAGE_H);
    const st = $('stage');
    st.style.transform = `translate(${(vw - U.STAGE_W * s) / 2}px, ${(vh - U.STAGE_H * s) / 2}px) scale(${s})`;
    App.scale = s;
    $('rotate-hint').classList.toggle('show', vw < vh && vw < 700);
  }
  window.addEventListener('resize', fit);

  // ---------------- menús ----------------
  function menuArt(game) {
    const C = (r, s, cls = '') => `<div class="card faceup deck-casino menu-card ${cls}"><div class="card-inner">${CS.Cards.faceHTML({ r, s })}<div class="face back"><div class="back-art"></div></div></div></div>`;
    if (game === 'poker') return `<div class="fan">${C(10, 0, 'f1')}${C(11, 0, 'f2')}${C(12, 0, 'f3')}${C(13, 0, 'f4')}${C(14, 0, 'f5')}</div>`;
    if (game === 'blackjack') return `<div class="fan two">${C(14, 3, 'f2')}${C(13, 1, 'f4')}</div>`;
    return `<div class="fan two">${C(9, 2, 'f2')}${C(12, 0, 'f4')}</div>`;
  }

  function chipsDecor(n) {
    let s = '';
    const vals = [5, 25, 100, 500, 1000];
    for (let i = 0; i < n; i++) {
      const v = U.pick(vals), c = CS.Chips.COLORS[v];
      s += `<div class="deco-chip" style="--c:${c.c};--e:${c.e};--d:${CS.Chips.shade(c.c, .55)};left:${U.randi(0, 100)}%;animation-delay:${(-Math.random() * 14).toFixed(1)}s;animation-duration:${U.randi(12, 22)}s;transform:scale(${U.rand(.5, 1.1).toFixed(2)})"></div>`;
    }
    return s;
  }

  function showMenu(html, cls) {
    const m = $('menus');
    m.className = 'menus show ' + (cls || '');
    m.innerHTML = `<div class="menu-bg">${chipsDecor(18)}</div><div class="menu-inner">${html}</div>`;
    $('stage').className = 'in-menu';
    return m.querySelector('.menu-inner');
  }

  function bankHTML() { return `<div class="menu-bank"><span>Saldo</span><b>${U.fmt(CS.Store.bank())}</b></div>`; }

  App.title = () => {
    CS.Audio.stopAmbient();
    const inner = showMenu(`
      <div class="title-screen">
        <div class="logo"><div class="logo-star">★</div><h1><span>CASINO</span><em>STARS</em></h1><div class="logo-sub">Póker · Blackjack · Baccarat</div></div>
        ${bankHTML()}
        <div class="title-btns"></div>
        <div class="disclaimer">Juego de entretenimiento con dinero ficticio. No se apuesta dinero real.</div>
      </div>`, 'm-title');
    const b = inner.querySelector('.title-btns');
    UI.button(b, 'Entrar al casino', 'btn-gold btn-xl', () => { CS.Audio.init(); CS.Audio.play('whoosh'); App.games(); });
    UI.button(b, 'Reiniciar progreso', 'btn-ghost btn-sm', async () => {
      const r = await UI.modal('Reiniciar progreso', '<p>Se restablecerá el saldo a $2000 y volverán a mostrarse los tutoriales.</p>', [{ label: 'Reiniciar', value: 1, cls: 'btn-gold' }, { label: 'Cancelar', value: 0, cls: 'btn-ghost' }]);
      if (r) { CS.Store.reset(); App.title(); }
    });
  };

  App.games = () => {
    CS.Audio.stopAmbient();
    const inner = showMenu(`
      <div class="menu-head"><div class="mh-left"></div><h2>Elige tu juego</h2>${bankHTML()}</div>
      <div class="game-grid">
        ${Object.entries(GAMES).map(([k, g]) => `
          <div class="game-card gc-${k}" data-g="${k}">
            <div class="gc-art">${menuArt(k)}</div>
            <div class="gc-kicker">${g.kicker}</div>
            <h3>${g.title}</h3>
            <p>${g.desc}</p>
            <div class="gc-cta">Jugar</div>
          </div>`).join('')}
      </div>`, 'm-games');
    UI.button(inner.querySelector('.mh-left'), '‹ Inicio', 'btn-ghost', App.title);
    inner.querySelectorAll('.game-card').forEach((c) => {
      c.onmouseenter = () => CS.Audio.play('hover');
      c.onclick = () => { CS.Audio.play('click'); App.venues(c.dataset.g); };
    });
  };

  App.venues = (game) => {
    const g = GAMES[game];
    const L = CS.Venues.LIST;
    const inner = showMenu(`
      <div class="menu-head"><div class="mh-left"></div><h2>${g.title} <small>· elige local</small></h2>${bankHTML()}</div>
      <div class="venue-grid">
        ${['easy', 'normal', 'hard'].map((id) => {
          const v = L[id];
          const rules = game === 'blackjack' ? v.bj.label : game === 'baccarat' ? v.bac.label : v.poker.label;
          const stake = game === 'poker' ? `Ciegas ${U.fmt(v.poker.sb)}/${U.fmt(v.poker.bb)} · Entrada ${U.fmt(v.poker.buyin)}` : `Apuesta ${U.fmt(v.minBet)} – ${U.fmt(v.maxBet)}`;
          const need = game === 'poker' ? v.poker.buyin : v.minBet;
          const lock = CS.Store.bank() < need;
          return `<div class="venue-card vc-${id}${lock ? ' locked' : ''}" data-v="${id}">
            <div class="vc-thumb thumb-${id}"><div class="vc-diff d-${id}">${v.diff}</div></div>
            <div class="vc-body">
              <div class="vc-tag">${v.tagline}</div>
              <h3>${v.name}</h3>
              <p>${v.desc}</p>
              <ul><li>${stake}</li><li>${rules}</li></ul>
              <div class="gc-cta">${lock ? `Necesitas ${U.fmt(need)}` : 'Sentarse'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`, 'm-venues');
    UI.button(inner.querySelector('.mh-left'), '‹ Juegos', 'btn-ghost', App.games);
    inner.querySelectorAll('.vc-thumb').forEach((t, i) => t.insertAdjacentHTML('afterbegin', CS.Venues.bgHTML(['easy', 'normal', 'hard'][i])));
    inner.querySelectorAll('.venue-card').forEach((c) => {
      c.onmouseenter = () => CS.Audio.play('hover');
      c.onclick = async () => {
        CS.Audio.play('click');
        if (c.classList.contains('locked')) {
          const r = await UI.modal('Saldo insuficiente', `<p>No tienes saldo suficiente para este local.</p><p class="muted">Es dinero de juego: el cajero puede darte ${U.fmt(2000)} de crédito.</p>`, [{ label: 'Pedir crédito', value: 1, cls: 'btn-gold' }, { label: 'Cancelar', value: 0, cls: 'btn-ghost' }]);
          if (r) { CS.Store.addBank(2000); App.venues(game); }
          return;
        }
        App.start(game, c.dataset.v);
      };
    });
  };

  // ---------------- partida ----------------
  App.start = async (game, venueId) => {
    // evita arrancar dos partidas a la vez (doble clic durante el fundido del menú)
    if (App.starting || App.game) return;
    App.starting = true;
    U.abortAll();
    const ep = U.epoch;
    CS.Audio.init();
    const m = $('menus');
    m.classList.add('hide');
    await new Promise((r) => setTimeout(r, 350));
    App.starting = false;
    if (ep !== U.epoch) return;
    m.className = 'menus';
    m.innerHTML = '';
    $('overlay').innerHTML = '';
    const scene = CS.Scene.create(game, venueId, {
      onExit: () => App.exit(),
      onHelp: () => CS.Tutorial.show(game),
    });
    // cortinilla de presentación
    const v = scene.venue;
    const intro = U.el('div', 'venue-intro intro-' + venueId, $('overlay'), `<div class="vi-diff">${v.diff}</div><div class="vi-name">${v.name}</div><div class="vi-tag">${v.tagline} · ${GAMES[game].title}</div>`);
    await new Promise((r) => setTimeout(r, 1900));
    intro.classList.add('out');
    setTimeout(() => intro.remove(), 600);
    if (ep !== U.epoch) return;
    if (!CS.Store.seen(game)) await CS.Tutorial.show(game);
    if (ep !== U.epoch) return;
    if (App.game) return;
    App.game = new GAMES[game].cls(scene);
    App.game.run().catch((e) => { if (e !== U.ABORT) console.error(e); });
  };

  App.exit = async () => {
    const g = App.game;
    if (g && g.inRound) {
      const r = await UI.modal('¿Salir de la mesa?', '<p>Hay una mano en juego: si te levantas ahora, <b>perderás lo apostado en esta mano</b>.</p>', [{ label: 'Salir igualmente', value: 1, cls: 'btn-gold' }, { label: 'Seguir jugando', value: 0, cls: 'btn-ghost' }]);
      if (!r) return;
    }
    App.toLobby();
  };

  App.toLobby = () => {
    const g = App.game;
    App.game = null;
    U.abortAll();
    if (g) g.destroy();
    CS.Scene.destroy();
    U.speed = CS.Store.data.fast ? 0.55 : 1;
    $('overlay').innerHTML = '';
    $('actions').innerHTML = '';
    App.games();
  };

  // ---------------- arranque ----------------
  function boot() {
    CS.Audio.enabled = CS.Store.data.sound !== false;
    U.speed = CS.Store.data.fast ? 0.55 : 1;
    U.Ticker.start();
    fit();
    App.title();
    const unlock = () => { CS.Audio.init(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    $('loader').classList.add('gone');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
