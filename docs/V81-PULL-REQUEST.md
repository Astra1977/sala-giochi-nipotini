La home V8 imponeva una scena minima di 900 px anche sugli smartphone, richiedendo scorrimento laterale e nascondendo parte di Ricky e Bea. V8.1 mostra l’immagine originale intera e proporzionata in alto, seguita dalle dodici miniature illustrate: **2 colonne a 360/390 px, 3 a 430 px**. Supporta anche il telefono orizzontale, senza dipendere dal tipo di puntatore del browser. Tablet e desktop conservano il panorama precedente.

Le miniature riutilizzano le illustrazioni già presenti tramite sfondi CSS; non vengono generati file ritagliati, nuove emoji o card gialle. Record, Preferiti, Impostazioni, Installazione e collezione rimangono nel flusso della pagina, fuori dalle immagini e senza coprire le tessere. I pulsanti mobili hanno dimensioni touch e padding per le safe area.

**home.png è identica byte per byte**, blob Git `8d2f2a2e58f65fff47f4eee65ba16fc5763d3563`. Nessuna modifica ai dodici motori di gioco, ai record, allo schema dei dati o alla logica dei Biscottini. Nessuna dipendenza aggiunta. Il precache conserva 32 risorse e viene rigenerato per aggiornare la home offline.

### Audit Tetris: nessun bug riscontrato nelle regole richieste

Il motore attuale elimina già le righe orizzontali complete di dieci celle **indipendentemente dal colore**. Non è stato modificato: non sono state introdotte nuove regole di punteggio, rotazione o progresso.

Otto nuovi test specifici verificano:

- Eliminazione contemporanea di **1, 2, 3 e 4 righe con colori misti**, confrontando l’intera griglia risultante e la posizione di ogni blocco rimasto.
- Righe complete non adiacenti e caduta corretta dei blocchi intermedi.
- Nessuna eliminazione per nove celle o per una colonna verticale completa.
- Punteggio e conteggio righe, tutti i dieci livelli, Biscottino ogni due livelli completati, continuazione per il record e conservazione delle medaglie dopo riavvio.
- Collisioni, rotazioni, top-out e riavvio del campo.

Il test browser dedicato usa tap e pressione mantenuta con input touch nativo emulato e user agent Android: cinque comandi, discesa mantenuta, pausa/ripresa, perdita di focus, game over e riavvio. **Non equivale a una prova su telefono Android fisico**, ancora da eseguire.

### Screenshot prima/dopo

Tutti i confronti sono prodotti dalla V8 pubblicata (`b3c3985`) e da questo branch. A 768 e 1280 px posizione e dimensioni dell’immagine sono identiche; a 768 px rimane il panorama interno da 900 px già approvato, senza overflow del documento. Sui telefoni non rimane neppure lo scorrimento orizzontale interno.

<details>
<summary>Confronto a 360 px — prima / dopo</summary>

**Prima**

![Prima 360](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/before/home-360.png)

**Dopo**

![Dopo 360](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/after/home-360.png)

</details>

<details>
<summary>Confronto a 390 px — prima / dopo</summary>

**Prima**

![Prima 390](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/before/home-390.png)

**Dopo**

![Dopo 390](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/after/home-390.png)

</details>

<details>
<summary>Confronto a 430 px — prima / dopo</summary>

**Prima**

![Prima 430](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/before/home-430.png)

**Dopo**

![Dopo 430](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/after/home-430.png)

</details>

<details>
<summary>Confronto a 768 px — prima / dopo</summary>

**Prima**

![Prima 768](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/before/home-768.png)

**Dopo**

![Dopo 768](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/after/home-768.png)

</details>

<details>
<summary>Confronto a 1280 px — prima / dopo</summary>

**Prima**

![Prima 1280](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/before/home-1280.png)

**Dopo**

![Dopo 1280](https://raw.githubusercontent.com/Astra1977/sala-giochi-nipotini/codex/v8-1-responsive-tetris/docs/screenshots-v81/after/home-1280.png)

</details>

### Validazione

- `python3 scripts/build-offline.py`: 32 risorse runtime locali, inventario completo.
- `npm test`: **22 test superati**, inclusi gli otto nuovi scenari Tetris.
- `npm run test:v81`: **5 gruppi superati**, cinque larghezze richieste, orientamento, touch Android emulato, apertura offline dei dodici giochi, nessun errore JavaScript.
- `npm run test:browser`: **22 gruppi di regressione superati**, inclusi missioni, brani, record e Biscottini, cache aggiornata su richiesta e riapertura offline dopo la chiusura del processo browser.
- `git diff origin/main -- js/games js/progress.js js/storage.js js/catalog.js home.png`: vuoto.

Dettagli, misure e risultati: `docs/V81-TEST.md`, `docs/V81-browser-results.json`, `docs/V81-regression-results.json`. Non sono emersi blocchi funzionali dai test automatici.

### Collaudo reale ancora richiesto

Su Chrome Android verificare i cinque comandi Tetris e la pressione mantenuta, rotazioni vicino alle pareti, game over e riavvio. Su iPhone/iPad e Android provare griglia, scena intera, safe area, orientamento e installazione standalone. Attendere “Pronta per giocare offline”, attivare modalità aereo, chiudere e riaprire dall’icona, verificare i dodici giochi e la permanenza di record/Biscottini. Accettare un aggiornamento dall’avviso e ripetere la prova offline.

**PR dedicata verso main: nessun merge automatico e nessuna pubblicazione definitiva effettuati.**
