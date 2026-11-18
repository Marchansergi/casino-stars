/* Casino Stars — tutoriales (se muestran la primera vez; se pueden saltar) */
(function () {
  'use strict';
  const CS = window.CS, U = CS.U;
  const T = (CS.Tutorial = {});

  const mini = (r, s) => {
    const lab = CS.Cards.RANK_LABEL[r], su = CS.Cards.SUIT[s];
    return `<span class="mini-card ${CS.Cards.isRed(s) ? 'red' : ''}"><b>${lab}</b><i>${su}</i></span>`;
  };

  T.CONTENT = {
    blackjack: {
      title: 'Blackjack',
      steps: [
        { h: 'El objetivo', p: 'Gánale al crupier sumando <b>más que él sin pasarte de 21</b>. No compites contra los otros jugadores de la mesa, solo contra la banca.', art: mini(14, 0) + mini(13, 1) },
        { h: 'Valor de las cartas', p: 'Del 2 al 10 valen su número. <b>J, Q y K valen 10</b>. El <b>As vale 1 u 11</b>, lo que más te convenga. Una mano con As que cuenta como 11 se llama "suave" (p. ej. A+6 = 17 suave).', art: mini(11, 3) + mini(12, 2) + mini(13, 0) + mini(14, 1) },
        { h: 'Apuesta y reparto', p: 'Elige una ficha, haz clic en tu círculo de apuesta y pulsa <b>Repartir</b>. Recibes dos cartas boca arriba; el crupier, una visible y otra oculta.', art: '<span class="tut-chip"></span>' },
        { h: 'Tus decisiones', p: '<b>Pedir</b>: otra carta. <b>Plantarse</b>: te quedas como estás. <b>Doblar</b>: doblas la apuesta y recibes solo una carta más. <b>Dividir</b>: si tienes dos cartas iguales, las separas en dos manos. <b>Seguro</b>: si el crupier enseña un As, puedes asegurarte contra su blackjack.', art: '' },
        { h: 'Pagos', p: 'Ganar paga <b>1 a 1</b>. Un <b>Blackjack</b> (As + carta de 10 en las dos primeras) paga <b>3 a 2</b>. Empate = te devuelven la apuesta. Si te pasas de 21, pierdes al instante.', art: mini(14, 3) + mini(10, 2) },
        { h: 'Dificultad', p: 'En <b>El Tugurio</b> se juega con 1 baraja y tienes el botón <b>Consejo</b> (estrategia básica). En el <b>Velvet</b> hay 4 barajas. En <b>Vegas</b>, 6 barajas, el crupier pide con 17 suave y solo puedes doblar con 9, 10 u 11.', art: '' },
      ],
    },
    baccarat: {
      title: 'Baccarat',
      steps: [
        { h: 'El objetivo', p: 'Apuesta a qué mano quedará <b>más cerca de 9</b>: la del <b>Jugador</b> o la de la <b>Banca</b>. También puedes apostar al <b>Empate</b>. Tú no tomas decisiones durante la mano: las reglas de tercera carta son fijas.', art: mini(9, 1) + mini(8, 0) },
        { h: 'Valor de las cartas', p: 'As = 1. Del 2 al 9, su número. <b>10, J, Q y K valen 0</b>. Solo cuenta la última cifra: 7 + 8 = 15 → <b>5</b>.', art: mini(7, 2) + mini(8, 3) + '<span class="tut-eq">= 5</span>' },
        { h: 'El reparto', p: 'Se dan dos cartas a cada mano. Si alguna suma <b>8 o 9</b> es "natural" y se acaba. Si no, el Jugador pide con 0–5 y la Banca decide según una tabla fija. El crupier lo hace todo automáticamente.', art: '' },
        { h: 'Pagos', p: '<b>Jugador</b> paga 1 a 1. <b>Banca</b> paga 0,95 a 1 (5% de comisión). <b>Empate</b> paga 8 a 1 (y las apuestas a Jugador/Banca se devuelven). <b>Pareja</b> (si existe en la mesa) paga 11 a 1 si las dos primeras cartas de esa mano son pareja.', art: '' },
        { h: 'Dificultad', p: 'El baccarat es puro azar: la dificultad cambia <b>el local, las apuestas mínimas y las reglas de pago</b>. En el Tugurio no hay comisión pero la Banca ganando con 6 paga la mitad. En Vegas, el crupier hace el <b>squeeze</b> (revelado lento) de las cartas.', art: '' },
      ],
    },
    poker: {
      title: "Texas Hold'em",
      steps: [
        { h: 'El objetivo', p: 'Gana las fichas de tus rivales: o tienes <b>la mejor mano de 5 cartas</b> al final, o consigues que <b>todos los demás se retiren</b>.', art: mini(14, 0) + mini(14, 1) },
        { h: 'Las cartas', p: 'Cada jugador recibe <b>2 cartas privadas</b>. Luego salen <b>5 cartas comunitarias</b> en tres fases: el <b>flop</b> (3), el <b>turn</b> (1) y el <b>river</b> (1). Combinas tus 2 con las 5 de la mesa.', art: mini(10, 2) + mini(11, 2) + mini(12, 2) },
        { h: 'Las apuestas', p: 'Hay ciegas obligatorias (pequeña y grande). En cada ronda puedes <b>Pasar</b> (si nadie ha apostado), <b>Igualar</b>, <b>Subir</b> o <b>Retirarte</b>. Usa el deslizador o los atajos (½ bote, bote, all-in) para elegir la cantidad.', art: '<span class="tut-chip"></span><span class="tut-chip c2"></span>' },
        { h: 'Ranking de manos', p: 'De mejor a peor: <b>Escalera de color</b>, <b>Póker</b>, <b>Full</b>, <b>Color</b>, <b>Escalera</b>, <b>Trío</b>, <b>Doble pareja</b>, <b>Pareja</b>, <b>Carta alta</b>.', art: mini(10, 0) + mini(11, 0) + mini(12, 0) + mini(13, 0) + mini(14, 0) },
        { h: 'Dificultad', p: 'Te sientas con una compra (buy-in) que sale de tu saldo. En el Tugurio juegas contra 2 aficionados que pagan demasiado. En el Velvet, 3 jugadores sólidos. En Vegas, 4 profesionales que calculan probabilidades, se adaptan a ti y <b>farolean</b>.', art: '' },
      ],
    },
  };

  T.show = (game) => new Promise((res) => {
    const data = T.CONTENT[game];
    let i = 0;
    const back = U.el('div', 'tut-back', document.getElementById('overlay'));
    const box = U.el('div', 'tut', back);
    const render = () => {
      const st = data.steps[i];
      box.innerHTML = `
        <div class="tut-head"><span class="tut-kicker">Cómo se juega</span><h2>${data.title}</h2></div>
        <div class="tut-art">${st.art || ''}</div>
        <h3>${st.h}</h3><p>${st.p}</p>
        <div class="tut-dots">${data.steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="tut-btns"></div>`;
      const bb = box.querySelector('.tut-btns');
      CS.UI.button(bb, 'Saltar tutorial', 'btn-ghost', close);
      if (i > 0) CS.UI.button(bb, 'Anterior', 'btn-ghost', () => { i--; render(); });
      CS.UI.button(bb, i === data.steps.length - 1 ? '¡A jugar!' : 'Siguiente', 'btn-gold', () => {
        if (i === data.steps.length - 1) close(); else { i++; render(); }
      });
      box.classList.remove('step-in'); void box.offsetWidth; box.classList.add('step-in');
    };
    function close() {
      CS.Store.markSeen(game);
      back.classList.add('out');
      setTimeout(() => { back.remove(); res(); }, 300);
    }
    render();
  });
})();
