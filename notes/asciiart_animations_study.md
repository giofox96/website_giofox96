# Studio: le animazioni di asciiart.eu

Analisi del 27 ottobre 2026 di https://www.asciiart.eu/animations (14 animazioni: plasma, fire, fireworks, matrix rain, spinning donut, tunnel, starfield, galaxy, ecc.). Obiettivo: capire le tecniche, non copiare il codice.
Fonte: il motore comune `/script/animation.min.js` ("AsciiScreen v2.3", minificato) e lo script inline di ogni pagina, letti nel sorgente servito dal sito. **Il codice è proprietario** ("Unauthorized copying, modification, distribution … prohibited"): qui ci sono solo le idee, che sono tecniche note da decenni (demoscene, "doom fire", donut.c). Nessuna riga va copiata nel sito.

## Il motore: una griglia di caratteri e tre modi di disegnarla

- **Buffer**: un array di caratteri `cols × rows` più un array parallelo di colori (un indice di palette o un colore RGB). L'animazione scrive solo nei buffer e il motore li disegna.
- **Dimensione della cella**: il motore misura la larghezza e l'altezza di un carattere del font (uno `span` nascosto) e ricava `cols = larghezza del box / larghezza carattere`, fino a 400 colonne. Così la griglia è sempre fitta e nitida a qualunque larghezza. Si ricalcola con un `ResizeObserver` quando cambiano il font o il box.
- **Tre renderer** intercambiabili:
  - **DOM**: un `<pre>`. In bianco e nero imposta solo `textContent`. A colori unisce i caratteri vicini con lo stesso colore in un unico `<span>` e lascia gli spazi come testo puro, così gli `span` sono pochi.
  - **Canvas 2D**: al primo disegno raggruppa le celle per colore (un solo `fillStyle` per colore). Ai frame successivi confronta ogni cella con il frame prima e ridisegna **solo le celle cambiate**.
  - **WebGL**: un atlante di ~190 glifi (ASCII, blocchi `░▒▓█`, linee `│┤╗`, simboli `●★♥`) in una texture, e un quadrato per ogni cella non vuota. Serve per griglie grandi a 60 fps.

## Il trucco di ogni animazione: intensità → carattere + colore

Quasi tutte seguono lo stesso schema:
1. una funzione `f(x, y, t)` dà un'**intensità 0–1** per cella;
2. l'intensità sceglie un carattere da una **rampa di densità** (dal vuoto fino a `@`/`█`) **e** un colore da una **palette di ~10 passi** (per esempio dal nero al viola al giallo). Due canali sullo stesso numero danno profondità;
3. il loop `requestAnimationFrame` usa il tempo reale (dt limitato a 0,1 s), un moltiplicatore di velocità e un tetto di fps (di solito 30).

Ottimizzazioni ricorrenti: **tabella dei seni** precalcolata (4096 valori) invece di `Math.sin` per cella, un generatore casuale **xorshift** veloce, particelle in `Float32Array` a dimensione fissa (niente oggetti per frame).

### Le singole tecniche

- **Plasma**: somma di 3–6 onde sinusoidali con frequenze e fasi diverse, anche in coordinate polari (angolo `atan2` e raggio). Le varianti cambiano solo la formula: vortex (angolo + raggio), ripple (raggio), metaballs (somma di `1/distanza` da centri che si muovono), moiré, tunnel (logaritmo del raggio).
- **Fuoco** ("doom fire"): un buffer di calore. La riga in basso viene riaccesa ogni frame con valori casuali, e ogni cella prende la media pesata delle celle sotto di lei (3-2-2-1-1), meno un decadimento e un po' di rumore. Il vento sposta la cella sorgente. Scintille e braci sono particelle a parte.
- **Ciambella che ruota** (donut.c): per ogni angolo del toro ruota il punto in 3D, lo proietta con `1/z`, tiene uno **z-buffer** per cella e calcola la luce con il prodotto scalare tra la normale e la direzione della luce (luce di Lambert). La luminosità sceglie il carattere: `.,-~:;=!*#$@`.
- **Tunnel**: per ogni cella, la profondità è `1/raggio` e l'angolo è `atan2`, che insieme danno coordinate di texture. Il trucco che lo rende "figo": **i caratteri seguono la geometria, non solo la luce**. Sugli anelli `-`, sulle linee radiali `|`, sugli incroci `+`, altrove la rampa di densità. Più particelle che vengono verso di te.

## Perché sembrano così belle

1. **Caratteri scelti dalla geometria** (bordi, direzione, incroci), non solo dalla luminosità: il disegno si legge come linee, non come rumore.
2. **Doppia mappatura**: la stessa intensità guida carattere *e* colore, con palette a 10 passi e sfondo scuro, quindi c'è molto contrasto e un effetto "bagliore".
3. **Onde sovrapposte** con frequenze non multiple tra loro: il movimento non si ripete mai uguale.
4. **Griglia fitta** (celle grandi quanto il font, centinaia di colonne) e **movimento legato al tempo reale**, che resta fluido anche quando calano gli fps.
5. Tanti **parametri esposti** (velocità, scala, complessità, palette, set di caratteri): il fascino è anche giocarci.

## Cosa può funzionare per il nostro hero ASCII

L'hero (`src/scripts/terrain.ts`) disegna già il terreno a caratteri: curve di livello maggiori con `glyph(gx, gy)`, minori con `·`, il resto con la rampa `"  ..,,::"` e due sole trasparenze. Poi una curva di livello animata sale e scende. In ordine di effetto/costo:

1. **Palette a passi invece di due trasparenze.** Mappare la quota (o la luce, punto 2) su 6–8 passi dal colore `muted` al colore `accent`, insieme a una rampa di caratteri più lunga. Costa poche righe in `drawAscii()` e dà subito profondità.
2. **Un sole che gira sul terreno (ombreggiatura alla donut.c).** Le normali del terreno si calcolano una sola volta dalla DTM. A ogni frame basta un prodotto scalare per cella con una direzione del sole che ruota lentamente, e la luce sceglie carattere e colore. Il rilievo si accende e si spegne come una giornata. È anche coerente con la tesi (ombra, UTCI). Per non ridisegnare tutto, conviene aggiornare solo le celle cambiate, come fa il renderer Canvas del motore.
3. **Caratteri dalla pendenza.** Sulle celle ripide scegliere `/ \ | -` in base alla direzione del gradiente, come gli anelli e le linee radiali del tunnel. Il terreno si legge come un disegno a tratteggio.
4. **Pioggia che scorre (lo "sponge").** Gocce `.` e `'` cadono, toccano il terreno e scivolano verso valle lungo il gradiente (la stessa logica D8 della tesi), accumulandosi nei punti bassi come `~`. Basta un pool di particelle in `Float32Array`. È il tema "Shade & Sponge" reso visibile in home.
5. **Dettagli tecnici da prendere comunque**: dt limitato, tetto a 30 fps su telefono, tabella dei seni se si aggiungono onde, `prefers-reduced-motion` che mantiene il frame statico (c'è già), pausa fuori schermo (c'è già con l'`IntersectionObserver`).

Consiglio: **1 + 2** come primo passo (palette e sole che ruota), poi **4** (la pioggia) se piace.
