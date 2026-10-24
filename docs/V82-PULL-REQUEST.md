Rifinitura V8.2 **Super Nipotini** dal mockup approvato, con veri pulsanti/tessere HTML e giochi interattivi. Branch separato da main pubblicato (22d426f, V8.1). Nessun merge o pubblicazione definitiva effettuati.

### Home unica e responsive

- Solo il banner illustrato superiore con Ricky, Bea, Biscotto e l'insegna: i vecchi dodici giochi e il footer disegnati nella parte inferiore non vengono mostrati.
- Taglio esclusivamente CSS: **home.png resta identica**, blob Git `8d2f2a2e58f65fff47f4eee65ba16fc5763d3563`.
- Una sola griglia con dodici veri pulsanti illustrati: 2 colonne sotto 375 px, 3 da 375 px, 4 da 700 px, 6 da 1100 px. Nessuno scorrimento orizzontale o duplicato.
- Record, Preferiti, Impostazioni e Biscottini conservati; anche ingranaggio e trofeo del banner sono veri pulsanti accessibili.

### Nuove risorse Super Nipotini

Quattro illustrazioni originali generate dal riferimento: icona con i tre volti, splash tropicale, miniatura arcade di Tetris e Biscotto con cuffie alla festa musicale. Le due miniature non sono emoji o pochi quadratini: sono immagini decorative all'interno di pulsanti reali. Le altre dieci riutilizzano l'illustrazione originale.

Icone PNG reali a 192/512, varianti Android maskable 192/512 con margine per i volti, Apple 180 e favicon 48. Manifest e riferimenti aggiornati. Nell'icona il testo è omesso per leggibilità in piccolo; il nome è nel manifest e nell'insegna dello splash. id, scope e start_url sono invariati, così come l'origine dei dati locali.

### Splash e pannelli dei giochi

Lo splash HTML usa un'immagine locale, testo e caricatore CSS. **Nessuna durata minima:** si chiude appena interfaccia e immagini essenziali sono pronte, senza attendere la cache offline. Timeout JavaScript e fallback CSS a 8 s, nessun blocco permanente dei tocchi, movimento ridotto rispettato. Gli screenshot dello splash sospendono l'avvio soltanto nel test.

Questo splash **non sostituisce necessariamente l'avvio nativo Android/iOS**, che dipende da sistema, browser e cache dell'installazione. Anche l'aggiornamento dell'icona può dipendere dal sistema.

Cornici, colori e comandi di Tetris/Orchestra sono uniformati al tema tropicale. In Tetris cambia solo il disegno luminoso dei blocchi: nessuna modifica a motore, regole o controlli. Rimangono Tetris classico con dieci livelli e righe indipendenti dal colore, cinque brani Orchestra, sessanta Biscottini, vecchi record e motore originale di Andrea.

### Screenshot

**Home smartphone, 390 px**

![Home mobile](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/home-390.png)

**Home desktop, 1280 px**

![Home desktop](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/home-1280.png)

Altre larghezze: [360 px](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/home-360.png), [430 px](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/home-430.png), [768 px](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/home-768.png).

<details>
<summary>Splash HTML</summary>

**Smartphone**

![Smartphone](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/splash-mobile.png)

**Tablet**

![Tablet](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/splash-tablet.png)

**Desktop**

![Desktop](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/splash-desktop.png)

</details>

<details>
<summary>Pannelli reali dei giochi</summary>

**Tetris smartphone**

![Tetris smartphone](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/tetris-mobile.png)

**Orchestra smartphone**

![Orchestra smartphone](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/orchestra-mobile.png)

**Tetris desktop**

![Tetris desktop](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/tetris-desktop.png)

**Orchestra desktop**

![Orchestra desktop](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/docs/screenshots-v82/orchestra-desktop.png)

</details>

[Icona 512](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/icons/icon-512.png) · [Maskable 512](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/icons/maskable-512.png) · [Miniatura Tetris](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/assets/tetris.webp) · [Miniatura Orchestra](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-2-super-nipotini/assets/orchestra.webp)

### Verifiche superate

- `npm test`: **22 test** di logica/integrità, incluse righe Tetris 1/2/3/4 con colori misti, livelli, brani, archivio e 60 Biscottini.
- `npm run test:v82`: **7 gruppi** su splash, timeout, movimento ridotto, vere dimensioni icone, manifest e riferimenti, cinque larghezze 360/390/430/768/1280, pulsanti reali, install prompt simulato e riapertura offline di tutti i dodici giochi.
- `npm run test:browser`: **22 gruppi di regressione**, incluse missioni, cinque brani, touch/tastiera, record e medaglie persistenti, aggiornamenti su richiesta e riavvio del processo browser offline.
- Precache rigenerato: **40 risorse locali**, compresi WebP, icone, CSS e controller. Nessuna nuova dipendenza runtime, font remoto o servizio online.
- Nessun errore JavaScript runtime e nessuna richiesta a risorse esterne nelle prove.
- Invariati home.png, motori Tetris/Orchestra, sorgenti originali di Andrea, modulo progressi, schema dati e logica record.

Dettagli: docs/V82-TEST.md, docs/V82-graphics-results.json, docs/V82-regression-results.json. Il pulsante Installa è verificato con un evento offerto simulato; non si dichiara un'installazione fisica effettuata. Il touch è emulato da Chromium, non collaudato su hardware Android/iOS.

### Collaudo reale ancora necessario

Su Safari iPhone/iPad e Chrome Android verificare nuova icona, maschera, installazione standalone, splash a freddo/caldo, safe area, orientamento e riduzione del movimento. Distinguere lo splash HTML dalla schermata del sistema. Provare i cinque comandi Tetris e i brani musicali con audio sbloccato da un gesto. Conquistare una medaglia e riprovare con risultato peggiore: il progresso non deve diminuire.

Attendere “Pronta per giocare offline”, attivare modalità aereo, chiudere e riaprire dall'icona; verificare splash, dodici giochi, record e Biscottini. Dopo un aggiornamento su richiesta ripetere la prova. Questi controlli su dispositivi reali non sono ancora eseguiti; non sono emersi blocchi funzionali dai test automatici.

**Attendere l'approvazione del proprietario: non effettuare il merge automaticamente.**
