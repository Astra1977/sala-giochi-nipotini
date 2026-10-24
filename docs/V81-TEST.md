# V8.1 — home responsive e audit Tetris

Base: main pubblicato, commit b3c3985 (merge della PR #2 V8). Branch separato codex/v8-1-responsive-tetris. Nessun merge eseguito.

## Modifica alla home

Su schermi stretti la scena originale viene mostrata interamente, nelle sue proporzioni, senza larghezza minima di 900 px. Segue una griglia di dodici miniature illustrate: due colonne fino a 409 px, tre da 410 a 700 px. Lo stesso layout si applica alle finestre orizzontali fino a 950×500 px, senza dipendere dal tipo di puntatore dichiarato dal browser.

Le miniature riutilizzano le aree già presenti in home.png tramite coordinate di sfondo CSS. Non vengono creati ritagli su disco, rigenerate immagini o introdotte emoji/card gialle. Le tessere Orchestra/Tetris conservano la grafica V8 già approvata. Il file home.png è invariato byte per byte: blob Git 8d2f2a2e58f65fff47f4eee65ba16fc5763d3563.

Record, Preferiti, Impostazioni, Installazione (quando il browser la offre) e collezione mantengono funzioni e dati precedenti. I pulsanti mobili restano nel normale flusso, fuori dalle immagini, con altezza minima di 48 px e padding per la safe area. Nessun pannello copre le miniature.

Tablet e desktop conservano il panorama: a 768 px la scena resta larga 900 px nel contenitore panoramico; a 1280 px si adatta a 1216 px. Posizione e dimensioni dell'immagine sono state confrontate con V8 e risultano identiche. A 768 px resta lo scorrimento interno del panorama già approvato, senza overflow della pagina; su telefono non rimane scorrimento orizzontale neppure nel contenitore.

## Risultato dell'audit Tetris

**Nessun errore riscontrato nelle regole richieste. Il motore Tetris non è stato modificato.**

L'algoritmo conserva le righe che contengono almeno una cella vuota e rimuove quelle con tutte le dieci celle occupate. Il colore è solo il valore non nullo della cella: non deve coincidere con quello delle altre celle. Le righe rimanenti conservano l'ordine; le nuove righe vuote vengono inserite in alto. Punteggio e righe sono aggiornati usando il numero di righe eliminate insieme e il livello precedente all'eliminazione, coerentemente con le regole V8.

Otto nuovi test specifici, tutti superati:

1. Eliminazione di una riga orizzontale con colori misti.
2. Eliminazione simultanea di due righe con colori misti.
3. Eliminazione simultanea di tre righe con colori misti.
4. Eliminazione simultanea di quattro righe con colori misti.
5. Eliminazione di due righe non adiacenti e discesa corretta dei blocchi intermedi.
6. Nessuna eliminazione per nove celle occupate o per una colonna verticale completa.
7. Cinquanta eliminazioni effettive in scenari controllati del motore: avanzamento dei dieci livelli, Biscottino ogni due livelli completati, continuazione per il record, medaglie conservate dopo riavvio.
8. Rotazioni, collisioni, top-out, input bloccato dopo game over e nuovo motore con campo/punteggio azzerati.

I test confrontano l'intera griglia attesa dopo l'eliminazione e i punteggi 100/300/500/800 moltiplicati per il livello, oltre al conteggio delle righe. Non si tratta di una partita manuale fino a cinquanta righe: sono scenari ripetibili del motore reale.

## Browser e offline

Esito finale: **22 test di logica/integrità, 5 gruppi browser V8.1 e 22 gruppi di regressione V8 tutti superati**. La regressione completa include missioni e brani, record e Biscottini persistenti, aggiornamento su richiesta e chiusura/riavvio del processo browser a rete disabilitata. Risultati in V81-regression-results.json.

La suite dedicata V8.1 ha superato cinque gruppi di controlli con Chromium, viewport/touch e user agent Android emulati:

- Screenshot prima/dopo a 360, 390, 430, 768 e 1280 px; scena intera e proporzionata sui telefoni, due/tre colonne, tutti i bersagli almeno 48×48 px, nessun overflow orizzontale del documento.
- Telefono orizzontale 844×390 senza scorrimento laterale; panorama conservato su tablet/desktop.
- Tutti i cinque comandi Tetris con tap; pressione mantenuta sulla discesa rapida tramite eventi touch nativi emulati; pausa/ripresa, perdita di focus, game over e riavvio.
- Apertura di tutti i dodici giochi dalle miniature con rete disabilitata.
- Nessun errore JavaScript runtime.

Nessuna nuova dipendenza. Il precache mantiene le 32 risorse runtime; sw.js viene rigenerato con la versione della home aggiornata. Nessuna modifica ai motori degli altri giochi, al modulo Biscottini, allo schema dei dati o alla logica dei record.

Comandi:

```sh
python3 scripts/build-offline.py
npm test
npm run test:v81
npm run test:browser
```

Per riprodurre i confronti della versione precedente, esportare il commit base in una directory e usare:

```sh
node tests/home-v81.cjs --before --source=/percorso/della/versione/V8
```

Gli screenshot sono in docs/screenshots-v81/before e docs/screenshots-v81/after. Il JSON con misure e risultati mirati è docs/V81-browser-results.json.

## Collaudo reale ancora necessario

Non sono disponibili dispositivi Android/iOS fisici in questo ambiente: i tap e la pressione mantenuta sono stati verificati con input nativo emulato in Chromium. Su Chrome Android reale verificare la risposta alle cinque azioni Tetris, rotazioni vicino alle pareti, pressione mantenuta, game over/riavvio e orientamento. Su Safari iPhone/iPad e Chrome Android verificare home, safe area e installazione standalone. Dopo “Pronta per giocare offline”, usare modalità aereo, chiudere e riaprire dall'icona e verificare giochi, record e Biscottini. Accettare una successiva versione dall'avviso di aggiornamento e ripetere la prova. Non effettuare il merge senza approvazione.
