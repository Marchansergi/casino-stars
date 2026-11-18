/* Casino Stars — escena de mesa (capas, personajes, HUD) y utilidades de interfaz */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const UI = (CS.UI = {});
  const $ = (id) => document.getElementById(id);

  // ---------------- Interfaz ----------------
  UI.toast = (text, kind = 'info', dur = 1600, sub) => {
    const t = U.el('div', 'toast toast-' + kind, $('overlay'));
    t.innerHTML = `<div class="toast-main">${text}</div>${sub ? `<div class="toast-sub">${sub}</div>` : ''}`;
    return U.sleep(dur).then(() => { t.classList.add('out'); return U.sleep(350); }).then(() => t.remove());
  };

  UI.modal = (title, html, buttons, opts = {}) => new Promise((res) => {
    const m = U.el('div', 'modal-back' + (opts.cls ? ' ' + opts.cls : ''), $('overlay'));
    const box = U.el('div', 'modal', m);
    box.innerHTML = `<h2>${title}</h2><div class="modal-body">${html}</div><div class="modal-btns"></div>`;
    const bb = box.querySelector('.modal-btns');
    buttons.forEach((b) => {
      const el = U.el('button', 'btn ' + (b.cls || ''), bb, b.label);
      el.onclick = () => { CS.Audio.play('click'); m.classList.add('out'); setTimeout(() => m.remove(), 250); res(b.value); };
    });
  });

  UI.button = (parent, label, cls, onclick, key) => {
    const b = U.el('button', 'btn ' + (cls || ''), parent, label);
    b.onclick = (e) => { e.stopPropagation(); if (b.disabled) return; CS.Audio.play('click'); onclick && onclick(e); };
    b.onmouseenter = () => CS.Audio.play('hover');
    if (key) { b.dataset.key = key; U.el('span', 'kbd', b, key === ' ' ? 'Espacio' : key); }
    return b;
  };

  // barra de acciones inferior
  UI.actions = () => {
    const bar = $('actions');
    bar.innerHTML = '';
    return bar;
  };

  // Atajos de teclado: dispara el botón visible con data-key
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toUpperCase();
    const btn = [...document.querySelectorAll('#actions .btn[data-key], #hud .btn[data-key]')].find((b) => b.dataset.key === k && !b.disabled && b.offsetParent);
    if (btn) { e.preventDefault(); btn.click(); }
  });

  // selector de fichas
  UI.chipPicker = (parent, venue, onPick) => {
    const box = U.el('div', 'chip-picker', parent);
    let sel = venue.denoms[0];
    const els = venue.denoms.map((d) => {
      const c = CS.Chips.create(d, venue.chip, box);
      c.classList.add('pick');
      c.onclick = (e) => { e.stopPropagation(); sel = d; els.forEach((x) => x.classList.toggle('sel', x === c)); CS.Audio.play('chip', 1); onPick && onPick(d, c); };
      return c;
    });
    els[0].classList.add('sel');
    return { el: box, get value() { return sel; }, chipEl: (d) => els[venue.denoms.indexOf(d)], refresh(max) { els.forEach((c, i) => c.classList.toggle('disabled', venue.denoms[i] > max)); } };
  };

  UI.label = (x, y, html, cls) => {
    const l = U.el('div', 'tlabel ' + (cls || ''), Scene.current ? Scene.current.labels : $('labels'), html);
    l.style.left = x + 'px'; l.style.top = y + 'px';
    return l;
  };

  // ---------------- Escena ----------------
  const Scene = (CS.Scene = { current: null });

  const NPC_PLACES = {
    side: [{ x: 150, y: 540, scale: 1, flip: false }, { x: 1450, y: 540, scale: 1, flip: true }],
    poker: [
      { x: 92, y: 646, scale: 1, flip: false },
      { x: 228, y: 318, scale: 0.74, flip: false },
      { x: 1372, y: 318, scale: 0.74, flip: true },
      { x: 1508, y: 646, scale: 1, flip: true },
    ],
  };
  Scene.NPC_PLACES = NPC_PLACES;

  Scene.create = (game, venueId, opts = {}) => {
    Scene.destroy();
    const venue = CS.Venues.LIST[venueId];
    const stage = $('stage');
    stage.className = 'in-game venue-' + venueId + ' game-' + game;
    ['rigUnder', 'rigOver'].forEach((id) => { $(id).innerHTML = ''; });
    $('objects').innerHTML = ''; $('labels').innerHTML = ''; $('hud').innerHTML = ''; $('actions').innerHTML = '';
    CS.Venues.buildBackground($('bg'), venueId);
    const geo = CS.Venues.buildTable($('table'), game, venue);
    const dealer = new CS.Rig.Dealer($('rigUnder'), $('rigOver'), CS.Rig.DEALERS[venueId], 800, geo.dealerTop);

    const scene = { game, venue, geo, dealer, npcs: [], objects: U.el('div', 'layer-inner', $('objects')), labels: U.el('div', 'layer-inner', $('labels')), hud: $('hud') };

    // NPCs
    const looks = U.shuffle(CS.Rig.NPCS[venueId].slice());
    const places = game === 'poker' ? venue.poker.seats.map((s) => NPC_PLACES.poker[s]) : NPC_PLACES.side;
    // los asientos lejanos (escala menor) se dibujan primero para que los cercanos queden delante
    const order = places.map((p, i) => i).sort((a, b) => places[a].scale - places[b].scale);
    const made = [];
    order.forEach((i) => {
      const p = places[i];
      const npc = new CS.Rig.NPC($('rigOver'), looks[i % looks.length], p);
      npc.seatIndex = game === 'poker' ? venue.poker.seats[i] : i;
      made[i] = npc;
    });
    scene.npcs.push(...made);

    // baraja visible en el bar (sin zapato)
    if (!geo.shoe) {
      const ds = U.el('div', 'deck-stack', scene.objects);
      for (let i = 0; i < 7; i++) {
        const c = CS.Cards.create(null, venue.deck, ds);
        CS.Cards.setPos(c, geo.deckPos.x + i * 0.4, geo.deckPos.y - i * 1.2, 0);
      }
      scene.deckStackEl = ds;
    }

    // HUD superior
    const hud = scene.hud;
    const left = U.el('div', 'hud-left', hud);
    UI.button(left, '<span class="ico">‹</span> Lobby', 'btn-ghost', () => opts.onExit && opts.onExit());
    U.el('div', 'hud-venue', left, `<b>${venue.name}</b><span>${{ blackjack: 'Blackjack', baccarat: 'Baccarat', poker: "Texas Hold'em" }[game]} · ${venue.diff}</span>`);
    const right = U.el('div', 'hud-right', hud);
    scene.bankEl = U.el('div', 'bank-pill', right, `<span class="lbl">${game === 'poker' ? 'Banca' : 'Saldo'}</span><b>${U.fmt(CS.Store.bank())}</b>`);
    const snd = UI.button(right, CS.Audio.enabled ? '🔊' : '🔇', 'btn-icon', () => {
      CS.Audio.setEnabled(!CS.Audio.enabled);
      CS.Store.data.sound = CS.Audio.enabled; CS.Store.save();
      snd.firstChild.textContent = CS.Audio.enabled ? '🔊' : '🔇';
    });
    snd.title = 'Sonido';
    const fast = UI.button(right, '⏩', 'btn-icon' + (CS.Store.data.fast ? ' on' : ''), () => {
      CS.Store.data.fast = !CS.Store.data.fast; CS.Store.save();
      fast.classList.toggle('on', CS.Store.data.fast);
      U.speed = CS.Store.data.fast ? 0.55 : 1;
    });
    fast.title = 'Animaciones rápidas';
    UI.button(right, '?', 'btn-icon', () => opts.onHelp && opts.onHelp()).title = 'Cómo se juega';
    scene.updateBank = (v) => { scene.bankEl.querySelector('b').textContent = U.fmt(v == null ? CS.Store.bank() : v); };
    scene._bankL = (e) => { if (game !== 'poker') scene.updateBank(e.detail); };
    document.addEventListener('cs:bank', scene._bankL);

    const cap = U.el('div', 'shuffle-caption', hud);
    scene.caption = (t) => { cap.textContent = t; cap.classList.toggle('show', !!t); };

    CS.Audio.setAmbient(venueId);
    Scene.current = scene;
    return scene;
  };

  Scene.destroy = () => {
    const s = Scene.current;
    if (!s) return;
    s.dead = true;
    s.dealer.destroy();
    s.npcs.forEach((n) => n.destroy());
    document.removeEventListener('cs:bank', s._bankL);
    Scene.current = null;
  };

  // Ejecuta un barajado permitiendo acelerarlo con un clic
  Scene.shuffle = async (scene, kind) => {
    const stage = $('stage');
    const prev = U.speed;
    const hint = U.el('div', 'skip-hint', $('overlay'), 'Clic para acelerar el barajado');
    const fast = () => { U.speed = 0.18; hint.remove(); };
    stage.addEventListener('pointerdown', fast, { once: true });
    try { await CS.Shuffle.run(scene, kind); } finally {
      stage.removeEventListener('pointerdown', fast);
      hint.remove();
      U.speed = prev;
    }
  };
})();
