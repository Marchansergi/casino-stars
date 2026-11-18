/* Casino Stars — sonido 100% sintetizado con Web Audio (sin archivos externos) */
(function () {
  'use strict';
  const CS = window.CS;
  const A = (CS.Audio = { ctx: null, master: null, sfx: null, amb: null, enabled: true, ambient: null });

  A.init = () => {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.enabled ? 1 : 0;
    A.master.connect(A.ctx.destination);
    A.sfx = A.ctx.createGain();
    A.sfx.gain.value = 0.9;
    A.sfx.connect(A.master);
    A.amb = A.ctx.createGain();
    A.amb.gain.value = 0.55;
    A.amb.connect(A.master);
    const len = A.ctx.sampleRate * 2;
    A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // ruido marrón para ambiente
    A.brownBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const b = A.brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    if (A.pendingAmbient) A.setAmbient(A.pendingAmbient);
  };

  A.setEnabled = (on) => {
    A.enabled = on;
    if (A.master) A.master.gain.setTargetAtTime(on ? 1 : 0, A.ctx.currentTime, 0.05);
  };

  function noise({ dur = 0.08, freq = 2500, q = 1, gain = 0.4, type = 'bandpass', when = 0, attack = 0.002, out } = {}) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + when;
    const src = A.ctx.createBufferSource();
    src.buffer = A.noiseBuf;
    const f = A.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out || A.sfx);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  }
  function tone({ freq = 440, dur = 0.2, type = 'sine', gain = 0.2, when = 0, slide = 0, attack = 0.005, out } = {}) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + when;
    const o = A.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || A.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }
  A.noise = noise; A.tone = tone;

  const S = {
    card: () => { noise({ dur: 0.09, freq: 2200 + Math.random() * 800, q: 0.7, gain: 0.35 }); noise({ dur: 0.03, freq: 5000, q: 2, gain: 0.12, when: 0.06 }); },
    flip: () => noise({ dur: 0.05, freq: 3800, q: 1.2, gain: 0.28 }),
    chip: (n = 1) => {
      for (let i = 0; i < n; i++) {
        const w = i * 0.045 + Math.random() * 0.015;
        const f = 2900 + Math.random() * 900;
        tone({ freq: f, dur: 0.045, type: 'triangle', gain: 0.09, when: w });
        tone({ freq: f * 1.52, dur: 0.035, type: 'sine', gain: 0.05, when: w });
        noise({ dur: 0.02, freq: 6500, q: 3, gain: 0.12, when: w });
      }
    },
    riffle: (dur = 0.8) => {
      const n = 34;
      for (let i = 0; i < n; i++) {
        const p = i / n;
        noise({ dur: 0.018, freq: 3000 + Math.random() * 2500, q: 2, gain: 0.16 + Math.random() * 0.08, when: dur * (p * p * 0.4 + p * 0.6) });
      }
      noise({ dur: 0.12, freq: 1500, q: 0.6, gain: 0.25, when: dur + 0.02 });
    },
    packet: () => noise({ dur: 0.06, freq: 1400, q: 0.8, gain: 0.3 }),
    crack: () => { for (let i = 0; i < 3; i++) noise({ dur: 0.035, freq: 900 + i * 300, q: 4, gain: 0.5, type: 'bandpass', when: i * 0.09 + Math.random() * 0.02 }); },
    tap: () => noise({ dur: 0.03, freq: 700, q: 2, gain: 0.2, type: 'lowpass' }),
    knock: () => { noise({ dur: 0.06, freq: 300, q: 3, gain: 0.55, type: 'lowpass' }); noise({ dur: 0.06, freq: 300, q: 3, gain: 0.5, type: 'lowpass', when: 0.12 }); },
    click: () => tone({ freq: 1400, dur: 0.04, type: 'triangle', gain: 0.06 }),
    hover: () => tone({ freq: 2200, dur: 0.025, type: 'sine', gain: 0.025 }),
    whoosh: () => noise({ dur: 0.35, freq: 900, q: 0.5, gain: 0.18, attack: 0.15 }),
    win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone({ freq: f, dur: 0.5, gain: 0.11, when: i * 0.09 }); tone({ freq: f * 2, dur: 0.3, gain: 0.03, when: i * 0.09 }); }),
    bigwin: () => {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => { tone({ freq: f, dur: 0.7, gain: 0.11, when: i * 0.08 }); tone({ freq: f * 1.5, dur: 0.4, type: 'triangle', gain: 0.03, when: i * 0.08 }); });
      for (let i = 0; i < 12; i++) tone({ freq: 2000 + Math.random() * 2000, dur: 0.15, gain: 0.03, when: 0.5 + i * 0.05 });
    },
    lose: () => { tone({ freq: 330, dur: 0.35, type: 'triangle', gain: 0.1, slide: 250 }); tone({ freq: 247, dur: 0.5, type: 'triangle', gain: 0.1, when: 0.18, slide: 180 }); },
    push: () => tone({ freq: 587, dur: 0.3, type: 'sine', gain: 0.08 }),
    bell: () => { tone({ freq: 1760, dur: 1.2, gain: 0.08 }); tone({ freq: 2637, dur: 0.9, gain: 0.04 }); },
  };
  A.play = (name, arg) => { if (!A.ctx || !A.enabled) return; const f = S[name]; if (f) f(arg); };

  // ---------------- Ambiente por local ----------------
  A.setAmbient = (id) => {
    A.pendingAmbient = id;
    if (!A.ctx) return;
    A.stopAmbient();
    const ctx = A.ctx;
    const amb = { nodes: [], timers: [] };
    A.ambient = amb;
    // murmullo de gente: ruido marrón filtrado con modulación lenta
    const src = ctx.createBufferSource(); src.buffer = A.brownBuf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass';
    lp.frequency.value = id === 'easy' ? 420 : id === 'normal' ? 520 : 650; lp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = id === 'easy' ? 0.5 : id === 'normal' ? 0.32 : 0.55;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.15;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(A.amb);
    src.start(); lfo.start();
    amb.nodes.push(src, lfo);

    if (id === 'easy') {
      // zumbido del neón
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 100;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
      const og = ctx.createGain(); og.gain.value = 0.018;
      o.connect(f); f.connect(og); og.connect(A.amb); o.start(); amb.nodes.push(o);
      amb.timers.push(setInterval(() => { // vasos que chocan de fondo
        if (Math.random() < 0.5) { tone({ freq: 3100 + Math.random() * 800, dur: 0.25, gain: 0.02, out: A.amb }); tone({ freq: 4300, dur: 0.18, gain: 0.012, when: 0.02, out: A.amb }); }
      }, 4200));
    } else if (id === 'normal') {
      // pad de lounge-jazz generativo muy suave
      const chords = [[146.8, 174.6, 220, 261.6], [196, 246.9, 293.7, 349.2], [130.8, 164.8, 196, 246.9], [110, 130.8, 164.8, 196]];
      let ci = 0;
      const playChord = () => {
        const ch = chords[ci++ % chords.length];
        ch.forEach((fq, i) => {
          tone({ freq: fq, dur: 3.6, type: 'sine', gain: 0.022, attack: 0.6, out: A.amb, when: i * 0.04 });
          tone({ freq: fq * 2, dur: 2.2, type: 'triangle', gain: 0.005, attack: 0.4, out: A.amb, when: i * 0.04 });
        });
        if (Math.random() < 0.7) tone({ freq: ch[0] / 2, dur: 1.6, type: 'sine', gain: 0.04, attack: 0.02, out: A.amb, when: 0.1 });
        for (let k = 0; k < 3; k++) if (Math.random() < 0.5) tone({ freq: ch[U_pick4()] * 4, dur: 0.6, gain: 0.008, out: A.amb, when: 0.8 + k * 0.6 });
      };
      playChord();
      amb.timers.push(setInterval(playChord, 3400));
    } else {
      // tragaperras y fichas de fondo
      amb.timers.push(setInterval(() => {
        if (Math.random() < 0.65) {
          const base = [880, 1046.5, 1318.5, 1568][Math.floor(Math.random() * 4)];
          for (let i = 0; i < 4; i++) tone({ freq: base * (1 + i * 0.25), dur: 0.15, gain: 0.012, when: i * 0.07, out: A.amb });
        }
        if (Math.random() < 0.4) for (let i = 0; i < 3; i++) tone({ freq: 3000 + Math.random() * 900, dur: 0.04, type: 'triangle', gain: 0.012, when: i * 0.05, out: A.amb });
      }, 1900));
    }
  };
  function U_pick4() { return Math.floor(Math.random() * 4); }
  A.stopAmbient = () => {
    const a = A.ambient;
    if (!a) return;
    a.nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    a.timers.forEach(clearInterval);
    A.ambient = null;
  };
})();
