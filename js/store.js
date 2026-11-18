/* Casino Stars — persistencia local (saldo, tutoriales vistos, ajustes) */
(function () {
  'use strict';
  const CS = window.CS;
  const KEY = 'casinoStars.v1';
  const DEFAULTS = { bank: 2000, seen: {}, sound: true, fast: false, stats: { hands: 0, best: 2000 } };
  const S = (CS.Store = { data: JSON.parse(JSON.stringify(DEFAULTS)) });

  S.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S.data = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(raw));
    } catch (e) { /* almacenamiento no disponible: se juega sin guardar */ }
    if (!isFinite(S.data.bank) || S.data.bank < 0) S.data.bank = DEFAULTS.bank;
    // fichas que se quedaron en una mesa de póker (recarga/cierre de pestaña): se devuelven
    if (S.data.pokerTable > 0) { S.data.bank += S.data.pokerTable; S.data.pokerTable = 0; S.save(); }
  };
  S.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e) {}
  };
  S.bank = () => S.data.bank;
  S.setBank = (v) => {
    S.data.bank = Math.max(0, Math.round(v * 100) / 100);
    if (S.data.bank > S.data.stats.best) S.data.stats.best = S.data.bank;
    S.save();
    document.dispatchEvent(new CustomEvent('cs:bank', { detail: S.data.bank }));
  };
  S.addBank = (d) => S.setBank(S.data.bank + d);
  S.seen = (k) => !!S.data.seen[k];
  S.markSeen = (k) => { S.data.seen[k] = true; S.save(); };
  S.reset = () => { S.data = JSON.parse(JSON.stringify(DEFAULTS)); S.save(); };
  S.load();
})();
