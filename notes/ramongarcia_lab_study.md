# Studio: il "Lab" di ramongarciaa.com

Analisi del 27 ottobre 2026 di https://www.ramongarciaa.com/ (Ramón García Ayala, IAAC). Obiettivo: capire le tecniche, non copiare il sito.
Fonte: il sito aperto nel browser (DOM ispezionato) e i bundle JavaScript serviti dal sito. Questi sono **minificati** (Next.js con Turbopack, deploy su Vercel), quindi i nomi delle variabili non ci sono: le spiegazioni sotto sono ricostruite dalla logica e dalle costanti.

## Stack

- Next.js (App Router), React, Tailwind, `motion` (ex Framer Motion) per le animazioni dell'interfaccia, immagini via `next/image`.
- Due esperienze principali in home: un'**intro a campo ASCII** e un **canvas a nodi stile Grasshopper** ("Experimental Lab") con i 15 progetti come componenti.
- Una route server `POST /api/lab-v2/fusion` (con ogni probabilità un LLM) per "Run Pipeline" e "fuse". Non l'ho chiamata: consuma la sua API.

## 1. Intro: campo ASCII interattivo

Un `<canvas>` 2D a schermo intero (`alpha: false`), DPR limitato a 2 (1,5 su telefono).
- **Griglia di caratteri**: cella di 14 px (16 su tablet, 20 su telefono), font monospace di sistema. Ogni cella ha un valore casuale fisso (`Float32Array`) che serve da fase.
- **Valore per cella**: somma di quattro onde sin/cos che scorrono nel tempo sugli indici di riga e colonna, normalizzata a 0–1, più un gradiente verticale (più denso in basso). Il valore sceglie un carattere da una rampa di densità, dal vuoto fino a `@`, e fa anche da opacità.
- **Buco centrale**: un'ellisse attorno al titolo spegne i caratteri con uno smoothstep, così il nome resta leggibile.
- **Mouse**: entro 150 px dal cursore il valore sale e il colore sfuma verso il colore accento.
- **Click**: ogni click lancia un'onda circolare che si espande (~0,5 px/ms, vita 1,3 s) e colora i caratteri che attraversa.
- **"Enter" = dissolvenza**: ogni cella sparisce quando un contatore da 0 a 1 (1,2 s) supera la sua soglia casuale. Ne esce una dissolvenza "a pixel", poi si passa al Lab.
- **Rispetto per l'utente**: `prefers-reduced-motion` ferma l'animazione, su touch gira a 30 fps e senza hover, e il loop non disegna quando la pagina è scrollata via. I colori vengono letti dalle variabili CSS e riletti quando cambia il tema (`MutationObserver` su `class`).

## 2. Lab: i progetti come un canvas a nodi

È un'interfaccia ibrida: i nodi sono HTML, i fili sono canvas.
- **Nodi = `div` HTML** (miniatura, badge della categoria, porte colorate), dentro un contenitore con `transform: translate(panX, panY) scale(zoom)`. Si trascinano con i pointer events (`setPointerCapture`), e la posizione è un motion value di `motion`, con molle (stiffness 300–500, damping 25–30).
- **Zoom centrato sul cursore**: con la rotella lo zoom va da 0,4 a 1,8, e il pan viene ricalcolato in modo che il punto sotto il mouse resti fermo (`pan = mouse − (mouse − pan) / zoomVecchio × zoomNuovo`). Shift+drag o un pulsante per fare pan.
- **Due canvas sovrapposti** (`pointer-events: none`) per le linee:
  - **Legami di sfondo automatici**: a ogni frame, per ogni coppia di progetti **di categorie diverse** vicini sullo schermo, c'è un filo tratteggiato curvo (curva quadratica con un leggero arco), con intensità che cala con la distanza (con isteresi, così i legami non sfarfallano) e il colore della categoria. Il tratteggio scorre (`lineDashOffset` decrementato ogni frame). Il legame ricorda anche gli **strumenti in comune** tra i due progetti. In pratica, spostando un nodo vedi apparire e sparire le relazioni.
  - **Fili dell'utente**: dalla porta di uscita a una porta di ingresso, curva di Bézier orizzontale come in Grasshopper (punti di controllo a ±max(metà della distanza in x, 60 px)). Ogni filo ha un **peso** scritto in un cerchietto al centro, e un'evidenziazione con alone e tratteggio animato. Alt+drag taglia i fili.
- **Nodi speciali**: START (verde) → progetti → RESULT. "Run Pipeline" si attiva solo se START e RESULT esistono e c'è almeno un filo. Visita il grafo da START, raccoglie i progetti raggiungibili con i pesi in ingresso, li manda al server e mostra nel nodo RESULT un testo e un "concept prompt". Shift+click su 2–3 progetti e "fuse" fanno lo stesso senza grafo.
- **Contorno**: griglia di sfondo in CSS puro (due `linear-gradient`, celle da 22 e 88 px), legenda delle categorie con i conteggi, timeline in basso con due maniglie (maggio 2024 – dicembre 2026) per filtrare per data, aiuti per i comandi in un angolo.

## Confronto con il nostro sito

| | ramongarciaa.com | il nostro sito |
|---|---|---|
| Metafora | i progetti sono componenti Grasshopper da collegare | i progetti sono punti in uno spazio di temi (MDS) |
| Posizioni | trascinate dall'utente | calcolate dai tag a build time |
| Relazioni | fili automatici tra vicini + fili dell'utente | solo vicinanza |
| Intro | campo ASCII a schermo intero | hero con mappa a curve di livello, modalità ASCII |
| Costo | Next.js + server + LLM | Astro statico su GitHub Pages |

Per un computational designer la metafora a nodi è molto forte perché parla la lingua di Grasshopper. Però vuole un server (per la pipeline) e tanto JavaScript, e senza mouse si usa male.

## Cosa vale la pena prendere (in ordine di rapporto effetto/costo)

1. **Fili tratteggiati animati tra progetti correlati** nel nostro `ProjectSpace`: una curva SVG tra le coppie che condividono più tag, con `stroke-dasharray` + animazione CSS di `stroke-dashoffset`. Costa poco ed è statico (le coppie si calcolano a build time da `embedding.ts`).
2. **Dettagli del campo ASCII** per l'hero che abbiamo già: il buco ellittico attorno al titolo, l'onda al click e la dissolvenza a soglia casuale per l'uscita. Sono pochi numeri da aggiungere al disegno esistente.
3. **Look da componente Grasshopper** per i nodi (badge della categoria, porte in/out, griglia da 22/88 px), anche senza il drag. È un'identità visiva che dice subito "computational designer".
4. **Zoom centrato sul cursore** se un giorno lo spazio diventa esplorabile.
5. **Pipeline con LLM**: no su GitHub Pages (niente server, e non si mettono chiavi API nel client).
