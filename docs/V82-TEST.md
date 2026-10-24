# V8.2 — Super Nipotini

Base: main pubblicato, commit 22d426f (merge della PR #3 V8.1). Branch codex/v8-2-super-nipotini. Nessun merge o pubblicazione definitiva eseguiti.

## Grafica e interazione

Il mockup fornito è stato usato come riferimento visivo, non trasformato in una schermata cliccabile. Il banner mostra tramite CSS soltanto i primi 465 px logici dell'immagine 1536×1024: sono visibili Ricky, Bea, Biscotto e l'insegna; vecchie tessere e vecchio footer non vengono mostrati. home.png conserva il blob Git 8d2f2a2e58f65fff47f4eee65ba16fc5763d3563, senza alcuna modifica al file.

Segue una sola griglia di dodici veri pulsanti HTML: due colonne sotto 375 px, tre da 375 px, quattro da 700 px e sei da 1100 px. Non ci sono scroll orizzontali o duplicati. Le dieci miniature esistenti riutilizzano la grafica originale; Tetris e Orchestra usano nuove illustrazioni WebP dentro i pulsanti, non emoji o quadratini. Anche ingranaggio e trofeo nel banner hanno veri pulsanti accessibili; Record, Preferiti, Impostazioni e la collezione restano disponibili.

Sono state generate quattro illustrazioni originali coerenti con il riferimento: icona con i tre volti, splash tropicale, torre arcade e Biscotto con cuffie alla festa musicale. Le esportazioni sono ottimizzate e locali. L'icona non contiene testo, per mantenere leggibili i volti in piccolo; il nome Super Nipotini è nel manifest e nell'insegna dello splash.

Icone effettive: PNG 192×192, 512×512; maskable Android 192×192 e 512×512 con margine di sicurezza; Apple 180×180; favicon 48×48. Le varianti maskable usano lo stesso disegno rientrato in un fondo tropicale opaco per proteggere i volti dalle maschere. Il master è assets/icon-master.webp; scripts/make-icons.py esporta meccanicamente le dimensioni, con Pillow solo in fase di manutenzione.

Pannelli Tetris e Orchestra hanno cornici, colori e comandi coerenti con il legno e il tema tropicale. In Tetris cambia soltanto la funzione di disegno dei blocchi (luce e bordi arrotondati), con fallback grafico. Il motore 10×20, le righe indipendenti dal colore, i dieci livelli e i controlli restano invariati. Il motore musicale e i suoi cinque brani non sono modificati. Nessun cambiamento a logica dei Biscottini, schema dati, record o motore originale di Andrea.

## Splash HTML e avvio nativo

Lo splash è un elemento HTML con illustrazione locale, descrizione accessibile, testo e caricatore CSS. Non ha una durata minima. Quando app.js ha collegato interfaccia e comandi e banner/miniature essenziali hanno terminato il caricamento o segnalato errore, viene nascosto immediatamente. Non aspetta la precache o un servizio online.

Un timeout JavaScript di 8 secondi libera l'interfaccia se l'avvio resta sospeso; una protezione CSS nasconde comunque il pannello se il controller non può eseguire. Il pannello non intercetta i tocchi, non imposta inert sul resto dell'app e non può bloccare permanentemente la navigazione. Con JavaScript disattivato viene nascosto dal fallback noscript. La preferenza di riduzione del movimento rende statico l'indicatore; la sicurezza di visibilità rimane attiva.

**Lo splash HTML non è la schermata nativa del sistema operativo.** Android/iOS possono mostrare prima una schermata basata su manifest, icona, cache o snapshot del sistema. Aspetto e tempi dipendono anche dal browser e dall'installazione: non si promette che corrisponda alla nostra illustrazione HTML. Anche l'aggiornamento dell'icona può richiedere un aggiornamento dell'installazione o una riapertura. id, scope e start_url restano quelli precedenti, per preservare identità e dati dell'app.

## Test automatici: superati

Eseguiti con Node.js 24, Playwright 1.62.1 e Chromium headless nel sottopercorso /sala-giochi-nipotini/. Usate tutte le immagini originali e nuove, senza segnaposto.

- **22 test di logica/integrità**: motori, righe Tetris 1/2/3/4 di colori misti, livelli, cinque brani, archivio, 60 Biscottini, hash originali e inventario offline.
- **7 gruppi grafici/avvio**: splash durante un caricamento realmente sospeso nel test e chiusura al rilascio senza attesa minima; dimensioni effettive delle icone; manifest/favicon/Apple/maskable; banner e griglia unica a 360/390/430/768/1280; pulsanti reali del banner e collegamento del comando Installa; immagini e dodici giochi offline; assenza di errori runtime; timeout a 8 secondi e caricatore statico con movimento ridotto.
- **22 gruppi di regressione browser**: dodici aperture/riavvii/chiusure a cinque viewport, missioni, brani, controlli Tetris, checkpoint originale di Andrea, record, medaglie e preferiti, aggiornamento cache su richiesta, blocco dell'installazione con risorsa obbligatoria mancante, tutti i giochi e le risorse offline e riavvio del processo browser a rete disabilitata. Nessun errore JavaScript o richiesta esterna durante la suite.

Il test del pulsante Installa simula l'offerta dell'evento beforeinstallprompt e verifica il collegamento del vero pulsante. Non rappresenta l'installazione fisica sul sistema operativo. Le prove di gioco e input touch sono emulazioni Chromium; i traguardi del motore Tetris sono verificati con scenari ripetibili, non dichiarati come partita manuale vinta.

Comandi:

```sh
python3 scripts/build-offline.py
npm test
npm run test:v82
npm run test:browser
```

La cache include **40 risorse locali**, compresi nuovi WebP, icone, CSS e controller splash. Nessun servizio, font remoto o dipendenza runtime aggiunti. I nuovi dati di prova sono soltanto nei profili temporanei del browser di test. Risultati: V82-graphics-results.json e V82-regression-results.json.

Screenshot in docs/screenshots-v82: cinque larghezze home, splash mobile/tablet/desktop e pannelli Tetris/Orchestra mobile/desktop. Lo screenshot dello splash viene acquisito sospendendo l'avvio solo nel test, non introducendo ritardi nel prodotto.

## Collaudo su dispositivi reali ancora necessario

Su iPhone/iPad Safari e Android Chrome verificare:

1. Banner senza vecchie tessere, volti interi, dodici pulsanti reali, nessun overflow e controlli generali raggiungibili nei due orientamenti.
2. Installazione standalone, nuova icona e maschera Android; distinguere l'eventuale avvio nativo dallo splash HTML. Controllare se il sistema mantiene l'icona precedente in cache.
3. Avvio a freddo e a caldo: nessuna attesa fissa, caricamento non invasivo, movimento ridotto e comportamento dopo cambio app.
4. Tetris con touch, pressione mantenuta, righe di colori diversi, pausa/ripresa e riavvio; Orchestra con audio sbloccato da un gesto, volume, modalità silenziosa e cinque brani.
5. Conquistare un Biscottino, riprovare con un esito peggiore e verificare che il progresso non diminuisca.
6. Attendere “Pronta per giocare offline”, usare modalità aereo, chiudere e riaprire dall'icona: provare splash, dodici giochi, record e medaglie. Dopo un aggiornamento su richiesta ripetere la prova.

Questi controlli su hardware iOS/Android non sono stati eseguiti qui. Non effettuare il merge senza l'approvazione del proprietario.
