# Studio: lo "spazio embedding" di duering.tech

Analisi del 27 ottobre 2026 di https://duering.tech/ (Serjoscha Duering). Obiettivo: capire le tecniche, non copiare il sito.
Fonte: il codice servito dal sito stesso (moduli ES non minificati, nessun bundler), letto file per file. Il sorgente non è in un repo pubblico su GitHub.

## Stack

- Una sola `index.html` con un **import map**: React 18, `htm` (JSX senza build) e Zustand da esm.sh. Nessun build step.
- Dati in JSON statici: `data/projects.json` (progetti raggruppati in cluster, ognuno con un colore) e `data/embeddings/umap-coords.json`.
- Lo spazio è un unico **`<canvas>` 2D** (800×700, scalato per `devicePixelRatio`), posizionato in assoluto a destra dell'hero, dietro il testo.

## Come funziona lo spazio

1. **Coordinate precalcolate offline.** `umap-coords.json` contiene `{id: {x, y}}` normalizzati 0–1 per 52 progetti. Il file dichiara `"model": "tfidf-pca"`: TF-IDF delle descrizioni + PCA a 2D (la didascalia dice "embedding + umap", ma il file generato dice PCA). Nel browser c'è solo un mapping lineare 0–1 → pixel con padding.
2. **Stato di riposo: croci, non immagini.** Ogni progetto è una piccola `+` nel colore del suo cluster. Le croci "respirano": ogni punto ha una fase casuale e si muove su una piccola curva di Lissajous (sin/cos con frequenze diverse, ampiezza ~6 px).
3. **Anelli "starfield".** Ogni 3–6 s due croci a caso emettono un anello che si espande (fino a ~40 px in 1,5 s) e sfuma. Costa poco, ma fa sembrare la mappa viva.
4. **Il "pop" (bloom) al passaggio del mouse.** I progetti entro ~150 px dal cursore (massimo 8) diventano cerchi con la miniatura:
   - **posizione**: vengono attirati verso il cursore (offset dal cursore × 0,3), quindi il gruppo si compatta attorno al mouse;
   - **dimensione**: effetto fish-eye. Caduta quadratica con la distanza più un "lens boost" a coseno; il più vicino diventa più grande (~110 px contro 56–88 px);
   - **repulsione** a coppie tra i cerchi attivi così non si sovrappongono;
   - clamp ai bordi del canvas.
5. **Molle, non tween.** Ogni cerchio ha tre molle (x, y, dimensione) con rigidità 170 e smorzamento 14, integrate con Eulero a ogni `requestAnimationFrame` (dt limitato a 50 ms). Il rimbalzo leggermente sotto-smorzato è quello che dà il "pop". Quando si esce, i target tornano alla posizione base e la dimensione va a 0.
6. **Cursore automatico (demo).** Dopo 2 s senza interazione, un "cometa" percorre la nuvola da solo: parte dal punto più denso, fa una camminata greedy verso vicini densi, il percorso viene lisciato con spline Catmull-Rom e percorso in 6 s con easing sinusoidale. Il bloom in questa modalità è al 60%. Si alternano due percorsi con 20 s di pausa. Qualsiasi movimento del mouse lo ferma. Così chi non tocca nulla capisce comunque l'interazione.
7. **Timeline sotto la mappa.** Passando il mouse sulla barra degli anni, i progetti attivi in quell'anno (con una finestra di ±8 mesi) si gonfiano sul posto.
8. **Click** sul cerchio (o vicino alla croce) apre la scheda del progetto come modale. Toggle "precision mode" riduce il raggio a 25 px.

## Confronto con il nostro `ProjectSpace.astro`

| | duering.tech | il nostro sito |
|---|---|---|
| Layout | TF-IDF + PCA offline, JSON | tag + MDS classico a build time |
| Render | canvas 2D, loop RAF | SVG statico, CSS |
| Riposo | croci colorate che respirano + anelli | miniature sempre visibili |
| Interazione | bloom fish-eye a molla attorno al cursore | tooltip, filtri per tema, vista timeline |
| Accessibilità | solo mouse (niente tastiera, niente link reali) | link `<a>` veri, focus, `aria` |

Il nostro è già migliore su accessibilità e SEO (link veri, nessun JS necessario per vedere i progetti). Il suo vince sulla sensazione "viva" e sul fatto che la mappa resta leggibile anche con molti progetti, perché a riposo mostra solo punti.

## Cosa vale la pena prendere (in ordine di rapporto effetto/costo)

1. **Croci a riposo, miniatura al passaggio.** Nel nostro SVG: a riposo disegnare solo una `+` colorata per tema, mostrare la miniatura sul nodo vicino al cursore. Si può fare restando in SVG.
2. **Fish-eye a molla.** Un piccolo script che, su `pointermove`, calcola la distanza da ogni nodo e aggiorna con una molla (k≈170, c≈14) scala e attrazione via `transform`. Con 16 nodi l'SVG basta, il canvas non serve.
3. **Respiro + anelli.** Lissajous di pochi px e un anello che si espande ogni qualche secondo. Va spento con `prefers-reduced-motion`.
4. **Cursore automatico** solo se resta tempo: è la parte più lunga e la più "firma" del suo sito.
5. **Embedding dal testo**, non solo dai tag: TF-IDF delle descrizioni nei nostri `index.md` + PCA/MDS a build time darebbe vicinanze più ricche. Ricordare che con 16 progetti la differenza può essere piccola.

Da mantenere nostro: link reali, focus da tastiera, tooltip accessibile e la vista timeline.

## REA

REA (https://github.com/morluto/rea, MCP server per reverse engineering, installazione con `npx rea-agents setup`) non è stato necessario: il sito serve codice sorgente leggibile, quindi è bastato scaricare i moduli seguendo gli `import`. REA ha senso per siti con bundle minificati o app desktop/Electron. Non è stato installato.
