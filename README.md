# La Nostra Sala Giochi

Sala giochi HTML5/PWA senza account, pubblicità, tracciamento, CDN o servizi remoti. Dodici giochi touch; risultati e preferiti solo sul dispositivo. Sito previsto: https://astra1977.github.io/sala-giochi-nipotini/.

## Avvio locale

Non aprire index.html con file://: moduli e service worker richiedono un server.

```sh
python3 -m http.server 8080
```

Aprire http://localhost:8080/. Non servono installazione npm o build per giocare. Per simulare GitHub Pages, servire la directory superiore e aprire /sala-giochi-nipotini/.

## Offline e installazione

Aprire il sito con connessione e aspettare “Pronta per giocare offline”: l'intero inventario viene scaricato prima di attivare il service worker. Su Android usare Installa dal browser o il pulsante, se disponibile. Su iPhone/iPad usare Safari → Condividi → Aggiungi alla schermata Home. La disponibilità dei comandi dipende dal browser.

La nuova versione viene scaricata separatamente. Un avviso permette di attivarla: “Aggiorna e torna alla home” interrompe l'eventuale partita e ricarica l'app. Nessun aggiornamento forzato durante il gioco. I record non vengono cancellati dagli aggiornamenti della cache.

I browser possono liberare i dati locali sotto pressione di spazio; in quel caso riaprire online. I record non sono sincronizzati o condivisi tra dispositivi.

## Manutenzione

- index.html: home e dialogo accessibile; home.png originale invariata, usata nel banner tramite CSS.
- js/app.js, core.js, storage.js: navigazione, ciclo di vita e archivio locale.
- js/games/: giochi modulari. legacy.js conserva frutta e gatto SVG del progetto iniziale.
- js/vendor/andrea/: solo il motore originale “Corsa su Strada” e Sound/U necessari. Vedere docs/ANDREA.md.
- css/: stili locali, compresi gli stili dedicati al gioco di Andrea.
- icons/: icone PWA originali; generatore in scripts/make-icons.py (richiede Pillow solo per rigenerarle).
- scripts/build-offline.py: inventario ricorsivo e versione deterministica della cache.

**Dopo qualsiasi modifica alle risorse di gioco**, rigenerare sw.js e commetterlo:

```sh
python3 scripts/build-offline.py
npm test
```

Il generatore rifiuta una home.png diversa dal blob approvato. Lo ZIP storico del repository non viene caricato nell'app e non è una dipendenza offline.

## Test browser

Node.js 22+ e Python 3. Per i test browser serve Playwright con Chromium; il gioco non dipende da questi strumenti.

```sh
npm install
npx playwright install chromium
npm run test:browser
```

Il test usa /usr/bin/chromium se presente, altrimenti il Chromium installato da Playwright. Facoltativamente impostare CHROMIUM_PATH. Parte un server locale temporaneo; il percorso testato è /sala-giochi-nipotini/. Non si collega al sito di produzione.

I test di logica controllano 300 labirinti, fisica del tiro, archivio locale anche bloccato, inventario offline e hash dei sorgenti originali. Il test browser interagisce con le schermate e con input touch nativo emulato da Chromium. Vedere docs/TEST.md per risultati e prove su dispositivi reali.

## Pubblicazione

Pubblicare tramite pull request nel solo repository Astra1977/sala-giochi-nipotini. Attendere revisione prima del merge. Non modificare klide1010/ChildGames. Vedere docs/TRANSFER.md se la connessione GitHub non permette di creare branch o pull request.
