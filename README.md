# Casino Stars

Juego de casino para navegador con **Póker Texas Hold'em**, **Blackjack** y **Baccarat**, cada uno en tres locales que hacen de niveles de dificultad.

Usa dinero ficticio. No se apuesta dinero real.

## Cómo jugar

No necesita compilación ni dependencias. Puedes:

- abrir `index.html` directamente en el navegador, o
- servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

Después abre `http://localhost:8000`. También funciona tal cual en GitHub Pages.

Las tipografías vienen de Google Fonts. Sin conexión se usan fuentes del sistema y el juego sigue funcionando.

## Locales y dificultad

| | El Tugurio (Fácil) | Velvet Lounge (Normal) | Royal Stars Vegas (Difícil) |
|---|---|---|---|
| Ambiente | Bar de mala muerte: ladrillo, neón parpadeante, bombilla que se balancea, humo | Bar de copas: barra retroiluminada, lámparas colgantes, cortinas | Casino: marquesina de bombillas, tragaperras, moqueta, columnas doradas |
| Mesa | Madera rayada con manchas de vaso, marcas de tiza | Fieltro verde con borde de madera | Fieltro profesional, acolchado de cuero, ribete dorado |
| Cartas / fichas | Baraja gastada · fichas de plástico | Baraja clásica · fichas de arcilla | Baraja de casino · fichas profesionales con incrustación |
| Crupier | Camarero con barba y trapo al hombro | Crupier con chaleco | Crupier con esmoquin, zapato y **maletín de fichas** |
| Blackjack | 1 baraja, se planta en 17, botón **Consejo** (estrategia básica) | 4 barajas | 6 barajas, pide con 17 suave, doblar solo con 9–11 |
| Baccarat | Sin comisión (banca gana con 6 → paga 1:2) | 5% de comisión + apuestas a pareja | Igual que Normal + *squeeze* de cartas |
| Póker | 2 rivales flojos | 3 rivales sólidos | 4 rivales que calculan probabilidades, se adaptan a ti y farolean |
| Apuestas | $2–$250 · entrada de póker $500 | $10–$1.000 · entrada $1.000 | $50–$10.000 · entrada $2.000 |

## Animaciones

- **Jugadores**: tamborilean los dedos, se crujen los nudillos, barajan sus fichas con una mano, golpean la mesa para pedir carta, miran alrededor y respiran.
- **Crupier**: reparte con la mano, mira su carta oculta, recoge y paga. Baraja de forma distinta en cada local:
  - Tugurio: *overhand* y un riffle descuidado.
  - Velvet: *riffle* con puente, *strip* y corte con carta de corte.
  - Vegas: *lavado* (wash) al abrir la mesa, *riffle*, *strip*, *box* y carta de corte antes de cargar el zapato.
- Haz clic durante el barajado para acelerarlo. El botón ⏩ acelera todas las animaciones.

## Tutoriales

Cada juego muestra un tutorial la primera vez que lo abres. Puedes saltarlo y volver a verlo con el botón **?** de la mesa.

## Controles de teclado

| Tecla | Acción |
|---|---|
| Espacio | Repartir |
| H / S / D / P | Pedir / Plantarse / Doblar / Dividir (blackjack) |
| F / C / R | Retirarse / Pasar o igualar / Subir (póker) |
| C / R | Limpiar apuesta / Repetir apuesta |

## Estructura

```
index.html
css/      base.css (interfaz), table.css (mesas, cartas, fichas, personajes), menus.css
js/       util, audio (sonido sintetizado con Web Audio), store (guardado local),
          cards, chips, venues (fondos y mesas), rig (personajes SVG animados),
          shuffle (barajados), scene, tutorial, main
js/games/ blackjack, baccarat, poker, pokereval (evaluador de manos + Monte Carlo)
```

El saldo y los tutoriales vistos se guardan en `localStorage`. Si cierras la pestaña con fichas en una mesa de póker, se te devuelven al volver a abrir el juego.
