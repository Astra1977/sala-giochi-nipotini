La V8 ripristina la home tropicale originale, sostituisce definitivamente Bolle Colorate e Consegna il Bebè con **Orchestra di Biscotto** e **Tetris — La Torre dei Colori**, e introduce una collezione locale di 60 Biscottini con traguardi verificati dai dodici giochi. È una PR separata dalla #1, già unita dal proprietario: base main, branch codex/v8-biscottini. **Nessun merge o pubblicazione definitiva effettuati.**

### Home e identità

home.png è identica byte per byte: blob Git 8d2f2a2e58f65fff47f4eee65ba16fc5763d3563. Immagine intera protagonista; panorama scorrevole su smartphone per mantenere grandi e leggibili le aree touch, etichette HTML e due nuove tessere coerenti con la grafica. Record, Preferiti, Impostazioni e Installazione sono esterni all'immagine. Gli screenshot smartphone/tablet mostrano il panorama centrato, esplorabile lateralmente.

![Home smartphone](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-biscottini/docs/screenshots/home-mobile.png)

![Home tablet](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-biscottini/docs/screenshots/home-tablet.png)

![Home desktop](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-biscottini/docs/screenshots/home-desktop.png)

### Giochi e progresso

Tetris ha griglia 10×20, sette tetramini standard, 7-bag, collisioni/rotazioni, righe, anteprima, cinque comandi touch, tastiera, pausa e perdita di focus. Ogni 5 righe completa un livello; 50 righe completano il decimo e permettono di proseguire per il record. Orchestra ha quattro corsie, cinque sequenze originali, giudizi Perfetto/Bene/Riprova, combo, suoni Web Audio locali, volume e modalità silenziosa.

Gli altri dieci giochi conservano le loro meccaniche e ricevono percorsi misurabili. Corsa su Strada conserva integralmente il motore originale di Andrea, verificato tramite hash; l'adattatore collega i checkpoint ai premi senza semplificarlo. Nel runner è stata corretta una collisione troppo ampia dei grandi ostacoli emersa nei test di sopravvivenza.

| Gioco | Traguardo 1 | Traguardo 2 | Traguardo 3 | Traguardo 4 | Traguardo 5 |
|---|---|---|---|---|---|
| Mini Town | Ritira la merenda | Consegna a scuola | Prendi il pallone | Portalo al parco | Ritira in ospedale e consegna alla spiaggia |
| La Macchina | Supera il checkpoint 1 | Supera il checkpoint 2 | Supera il checkpoint 3 | Supera il checkpoint 4 | Supera il checkpoint 5 |
| Acchiappa la Cucaracha | 8 catture, massimo 4 errori | 12 catture, massimo 3 errori | 16 catture, massimo 2 errori | 20 catture, massimo 1 errore | 24 catture, nessun errore e un boss sconfitto |
| Salta la Cacca | Sopravvivi 12 secondi | Sopravvivi 18 secondi | Sopravvivi 24 secondi | Sopravvivi 30 secondi | Sopravvivi 36 secondi |
| Avventura Foresta | Esplora la zona 1: 3 oggetti | Zona 2: 4 oggetti | Zona 3: 5 oggetti | Zona 4: 6 oggetti | Zona 5: 6 oggetti e ritorno alla partenza |
| Tetris — La Torre dei Colori | Completa 2 livelli: 10 righe | 4 livelli: 20 righe | 6 livelli: 30 righe | 8 livelli: 40 righe | 10 livelli: 50 righe |
| Taglia la Frutta | Taglia 8 frutti, massimo 3 bombe | 12 frutti, massimo 2 bombe, combo 2 | 16 frutti, massimo 1 bomba, combo 3 | 20 frutti, nessuna bomba, combo 4 | 24 frutti, nessuna bomba, combo 5 |
| Memory | Trova 4 coppie | Trova 6 coppie | Trova 8 coppie | Trova 10 coppie | Trova 12 coppie |
| Palla nel Cesto | 2 canestri in 5 tiri | 3 canestri in 6 tiri | 4 canestri in 7 tiri | 5 canestri in 8 tiri | 6 canestri in 9 tiri |
| Orchestra di Biscotto | Completa Alba di Biscotto | Completa Palme in festa | Completa Passi sulla sabbia | Completa Il coro del mare | Completa La grande orchestra |
| Labirinto | Risolvi la mappa 9×9 | Risolvi la mappa 11×11 | Risolvi la mappa 13×13 | Risolvi la mappa 15×15 | Risolvi la mappa 17×17 |
| Chameleon | Riconosci 5 colori, 14 s per risposta | 7 colori, 12 s | 9 colori, 10 s | 11 colori, 8 s | 13 colori, 6 s |

Ogni colonna completata assegna un Biscottino; in Tetris corrisponde a due livelli completati. La logica è in un unico modulo progress.js, con icona SVG del gatto grigio, notifica breve rispettosa della riduzione del movimento, massimo 5 per gioco e 60 complessivi. Le medaglie sono permanenti e non spendibili. La quinta richiede il percorso intero: il punteggio numerico da solo non la assegna. Condizioni complete in docs/V8-TRAGUARDI.md.

Schema locale versione 8 con migrazione dei vecchi punteggi, massimi monotoni e archivio dei due giochi ritirati, esclusi dai record attivi. Nessun account, tracciamento, richiesta remota o dato personale.

### Validazione

- Build offline: 32 risorse locali, inclusi nuovi motori, CSS e icona Biscottino.
- npm test: 14 test di logica/integrità, inclusi 500 labirinti, Tetris fino al decimo livello, cinque brani e calcolo 5/60 ricompense su tutti i dodici percorsi.
- npm run test:browser: suite Chromium mobile/desktop con screenshot, dodici aperture/riavvii/chiusure a cinque viewport, missioni e brani, controlli Tetris, input touch/tastiera, migrazione e persistenza, aggiornamenti su richiesta e riapertura di tutti i giochi senza rete. Chiusura e riavvio del processo browser verificati.
- Hash invariati per home.png e motore originale road.js; nessuna modifica al repository di Andrea.

Le prove di righe/livelli Tetris usano scenari del motore, non una partita manuale completa. Le prove di sopravvivenza usano la tastiera e tempo deterministico; il touch è emulato da Chromium. Dettagli e limiti in docs/V8-TEST.md.

### Collaudo reale e limiti aperti

Non sono ancora state eseguite prove su hardware iOS/Android: vanno verificati installazione standalone, safe area, audio dopo cambio app, multitouch e prestazioni sui dispositivi effettivi. Non risultano blocchi funzionali dai test automatici; questi non sostituiscono il collaudo reale.

Servire il branch V8 da HTTPS in un ambiente di prova, attendere “Pronta per giocare offline”, installare, conquistare una medaglia e riprovare con un esito peggiore; attivare modalità aereo, chiudere e riaprire dall'icona, provare i dodici giochi e ricontrollare dati e audio. Su Safari: Condividi → Aggiungi alla schermata Home. Su Android usare Installa dal browser o dal pulsante. Dopo un aggiornamento su richiesta, ricontrollare offline e collezione.

**Attendere l'approvazione del proprietario prima del merge.**
